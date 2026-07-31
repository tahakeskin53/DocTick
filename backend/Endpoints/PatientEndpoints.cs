using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Auth;
using DocTick.Api.Models;
using DocTick.Api.Services;

namespace DocTick.Api.Endpoints;

public record CreateAppointmentRequest(int DoctorId, string Date, string Time);
public record AppointmentDto(
    int Id, string Code, int DoctorId, string DoctorName, string DepartmentName,
    string Date, string DateLabel, string Time, string Status, int? Rating);

public static class PatientEndpoints
{
    public static IEndpointRouteBuilder MapPatientEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/appointments").WithTags("Patient")
            .RequireAuthorization().AddEndpointFilter(ActiveGuard.Patient);

        // Kendi randevuları.
        grp.MapGet("/", async (AppDb db, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var uid = CurrentUser.Uid(user);
            var list = await db.Appointments.AsNoTracking()
                .Include(a => a.Doctor!).ThenInclude(d => d!.Department)
                .Where(a => a.UserId == uid)
                .OrderByDescending(a => a.Date + " " + a.Time)
                .ToListAsync(ct);
            return Results.Ok(list.Select(ToDto));
        });

        grp.MapPost("/", async (CreateAppointmentRequest req, AppDb db, ClaimsPrincipal user, EmailService email, HttpContext ctx, CancellationToken ct) =>
        {
            if (!DateTime.TryParseExact(req.Date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var day))
                return Results.BadRequest("Tarih yyyy-MM-dd biçiminde olmalı.");
            if (!Slots.All.Contains(req.Time))
                return Results.BadRequest("Geçersiz saat.");

            var uid = CurrentUser.Uid(user);
            var start = DateTime.ParseExact(req.Date + " " + req.Time, "yyyy-MM-dd HH:mm", null);
            if (start <= DateTime.Now) return Results.BadRequest("Geçmiş tarih/saat için randevu alınamaz.");

            var dow = (int)day.DayOfWeek;
            var open = await db.ScheduleSlots.AnyAsync(s => s.DoctorId == req.DoctorId && s.DayOfWeek == dow && s.Time == req.Time && s.IsOpen, ct);
            if (!open) return Results.BadRequest("Bu saat randevuya açık değil.");

            var conflict = await db.Appointments.AnyAsync(a => a.DoctorId == req.DoctorId && a.Date == req.Date && a.Time == req.Time && a.Status == ApptStatus.Confirmed, ct);
            if (conflict) return Results.Conflict("Bu saat az önce doldu.");

            // Aynı kullanıcı aynı tarih+saatte ikinci bir randevu alamaz — farklı doktor/bölüm olsa bile.
            var userConflict = await db.Appointments.AnyAsync(a => a.UserId == uid && a.Date == req.Date && a.Time == req.Time && a.Status == ApptStatus.Confirmed, ct);
            if (userConflict) return Results.Conflict("Bu saatte zaten bir randevunuz var.");

            var doctor = await db.Doctors.Include(d => d.Department).FirstOrDefaultAsync(d => d.Id == req.DoctorId, ct);
            if (doctor is null || doctor.IsDeleted || !doctor.IsActive) return Results.BadRequest("Doktor bulunamadı.");

            var appt = new Appointment
            {
                UserId = uid,
                DoctorId = req.DoctorId,
                Date = req.Date,
                Time = req.Time,
                Status = ApptStatus.Confirmed,
                CreatedAt = DateTime.UtcNow
            };
            db.Appointments.Add(appt);

            // INSERT + Kod güncellemesi tek transaction'da: ikinci yazma başarısız olursa
            // boş Kodlu satır kalıcı olmaz, geri alınır.
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            try
            {
                await db.SaveChangesAsync(ct); // INSERT → appt.Id atanır
                appt.Code = $"RND-{start.Year}-{appt.Id:D4}"; // Id ile deterministik, benzersiz
                await db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
            }
            catch (DbUpdateException ex) when (ex.InnerException is SqliteException { SqliteErrorCode: 19 })
            {
                // Yalnızca unique-index ihlali (çift rezervasyon) 409'a dönüşür; diğer DB hataları 500 olarak yayılır.
                return Results.Conflict("Bu saat az önce doldu.");
            }

            // Randevu kodu yanıtta üretilir, yolda yok — kayda ayrıca geçir.
            AuditLog.Event(ctx, "appt_create", $"{appt.Code} · {doctor.Name} · {appt.Date} {appt.Time}");

            // Onay e-postası best-effort: gönderim başarısızsa randevu yine oluşturuldu sayılır.
            var me = await db.Users.FindAsync([uid], ct);
            if (me is not null)
            {
                try
                {
                    await email.SendAsync(me.Email, "DocTick — Randevu onayı",
                        EmailTemplates.Confirmation(me.Name, appt.Time, doctor.Name, doctor.Department!.Name,
                            ReminderService.FormatDate(appt.Date), appt.Code));
                }
                catch { /* e-posta başarısızlığı randevuyu iptal etmez */ }
            }

            return Results.Created($"/api/appointments/{appt.Id}", ToDto(appt, doctor));
        });

        grp.MapPost("/{id}/cancel", async (int id, AppDb db, ClaimsPrincipal user, EmailService email, HttpContext ctx, CancellationToken ct) =>
        {
            var uid = CurrentUser.Uid(user);
            var appt = await db.Appointments.Include(a => a.Doctor!).ThenInclude(d => d!.Department)
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == uid, ct);
            if (appt is null) return Results.NotFound();
            if (appt.Status != ApptStatus.Confirmed) return Results.BadRequest("Randevu zaten iptal edilmiş.");
            AuditLog.Event(ctx, "appt_cancel", $"{appt.Code} · {appt.Doctor!.Name} · {appt.Date} {appt.Time}");

            appt.Status = ApptStatus.Cancelled;
            await db.SaveChangesAsync(ct);

            var me = await db.Users.FindAsync([uid], ct);
            if (me is not null)
            {
                try
                {
                    await email.SendAsync(me.Email, "DocTick — Randevu iptali",
                        EmailTemplates.Cancellation(me.Name, appt.Time, appt.Doctor!.Name, appt.Doctor!.Department!.Name, ReminderService.FormatDate(appt.Date)));
                }
                catch { /* e-posta başarısızlığı iptali geri almaz */ }
            }

            return Results.Ok(ToDto(appt, appt.Doctor!));
        });

        grp.MapPost("/{id}/rating", async (int id, RatingRequest req, AppDb db, ClaimsPrincipal user, CancellationToken ct) =>
        {
            if (req.Stars is < 1 or > 5) return Results.BadRequest("1-5 yıldız.");
            var uid = CurrentUser.Uid(user);
            var appt = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == uid, ct);
            if (appt is null) return Results.NotFound();
            // Yalnızca geçmiş (tamamlanmış) randevular değerlendirilebilir.
            var start = DateTime.ParseExact(appt.Date + " " + appt.Time, "yyyy-MM-dd HH:mm", null);
            if (appt.Status != ApptStatus.Confirmed || start > DateTime.Now)
                return Results.BadRequest("Bu randevu henüz değerlendirilemez.");

            appt.Rating = req.Stars;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { appt.Id, Rating = appt.Rating });
        });

        return app;
    }

    private static string DisplayStatus(Appointment a)
    {
        if (a.Status == ApptStatus.Cancelled) return "cancelled";
        var start = DateTime.ParseExact(a.Date + " " + a.Time, "yyyy-MM-dd HH:mm", null);
        return start <= DateTime.Now ? "done" : "confirmed";
    }

    internal static AppointmentDto ToDto(Appointment a)
    {
        var doc = a.Doctor;
        return new AppointmentDto(a.Id, a.Code, a.DoctorId, doc?.Name ?? "", doc?.Department?.Name ?? "",
            a.Date, ReminderService.FormatDate(a.Date), a.Time, DisplayStatus(a), a.Rating);
    }

    internal static AppointmentDto ToDto(Appointment a, Doctor doc) =>
        new(a.Id, a.Code, a.DoctorId, doc.Name, doc.Department?.Name ?? "",
            a.Date, ReminderService.FormatDate(a.Date), a.Time, DisplayStatus(a), a.Rating);
}

public record RatingRequest(int Stars);
