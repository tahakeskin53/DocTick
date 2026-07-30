using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Models;
using DocTick.Api.Services;

namespace DocTick.Api.Endpoints;

public record DepartmentDto(int Id, string Name, bool IsActive);
public record DoctorDto(int Id, string Name, int DepartmentId, string DepartmentName, bool IsActive, string PhotoUrl);
public record ContactRequest(string Subject, string Message);

public static class PublicEndpoints
{
    public static IEndpointRouteBuilder MapPublicEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api").WithTags("Public").RequireAuthorization();

        grp.MapGet("/departments", async (AppDb db, bool? active, CancellationToken ct) =>
        {
            var q = db.Departments.AsNoTracking();
            if (active == true) q = q.Where(d => d.IsActive);
            var list = await q.OrderBy(d => d.Name).Select(d => new DepartmentDto(d.Id, d.Name, d.IsActive)).ToListAsync(ct);
            return Results.Ok(list);
        }).AllowAnonymous();

        grp.MapGet("/doctors", async (AppDb db, int? deptId, bool? active, CancellationToken ct) =>
        {
            var q = db.Doctors.AsNoTracking().Include(x => x.Department);
            var list = await (from d in q
                              where (deptId == null || d.DepartmentId == deptId)
                                         && (active == null || d.IsActive == active)
                                      orderby d.Name
                                      select new DoctorDto(d.Id, d.Name, d.DepartmentId, d.Department!.Name, d.IsActive, d.PhotoUrl)).ToListAsync(ct);
            return Results.Ok(list);
        }).AllowAnonymous();

        // Belirli doktor + tarih için uygun saatler.
        grp.MapGet("/availability", async (AppDb db, int doctorId, string date, CancellationToken ct) =>
        {
            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var day))
                return Results.BadRequest("Tarih yyyy-MM-dd biçiminde olmalı.");

            var dow = (int)day.DayOfWeek;
            var open = await db.ScheduleSlots.AsNoTracking()
                .Where(s => s.DoctorId == doctorId && s.DayOfWeek == dow && s.IsOpen)
                .Select(s => s.Time).ToListAsync(ct);
            var taken = await db.Appointments.AsNoTracking()
                .Where(a => a.DoctorId == doctorId && a.Date == date && a.Status == ApptStatus.Confirmed)
                .Select(a => a.Time).ToListAsync(ct);

            var now = DateTime.Now;
            var avail = open.Except(taken).Where(t =>
            {
                // Bugün için geçmiş saatleri eler.
                if (day.Date != now.Date) return true;
                return DateTime.TryParseExact(t, "HH:mm", null, System.Globalization.DateTimeStyles.None, out var tm)
                       && tm.TimeOfDay > now.TimeOfDay;
            }).OrderBy(t => t).ToList();

            return Results.Ok(avail);
        });

        // İletişim formu — mesajı hastane (admin) e-postasına iletir.
        grp.MapPost("/contact", async (ContactRequest req, AppDb db, ClaimsPrincipal user, EmailService email, IConfiguration cfg, CancellationToken ct) =>
        {
            var subject = (req.Subject ?? "").Trim();
            var message = (req.Message ?? "").Trim();
            if (subject.Length is 0 or > 150) return Results.BadRequest("Konu 1-150 karakter olmalı.");
            if (message.Length is 0 or > 2000) return Results.BadRequest("Mesaj 1-2000 karakter olmalı.");

            var uid = DocTick.Api.Auth.CurrentUser.Uid(user);
            var me = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == uid, ct);
            if (me is null) return Results.Unauthorized();

            var adminEmail = cfg["Admin:Email"] ?? "";
            if (string.IsNullOrWhiteSpace(adminEmail)) return Results.Problem("İletişim e-postası yapılandırılmamış.", statusCode: 500);

            // HTML injection'a karşı kullanıcı metnini kaçır.
            var safeSubject = System.Net.WebUtility.HtmlEncode(subject);
            var safeMessage = System.Net.WebUtility.HtmlEncode(message).Replace("\n", "<br>");
            try
            {
                await email.SendAsync(adminEmail, $"DocTick İletişim — {safeSubject}",
                    EmailTemplates.Contact(me.Name, me.Email, safeSubject, safeMessage));
            }
            catch
            {
                return Results.Problem("Mesaj gönderilemedi, lütfen tekrar deneyin.", statusCode: 502);
            }
            return Results.Ok();
        });

        return app;
    }
}
