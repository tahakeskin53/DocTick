using Microsoft.EntityFrameworkCore;
using DocTick.Api.Models;

namespace DocTick.Api.Endpoints;

public record DepartmentDto(int Id, string Name, bool IsActive);
public record DoctorDto(int Id, string Name, int DepartmentId, string DepartmentName, bool IsActive);

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
        });

        grp.MapGet("/doctors", async (AppDb db, int? deptId, bool? active, CancellationToken ct) =>
        {
            var q = db.Doctors.AsNoTracking().Include(x => x.Department);
            var list = await (from d in q
                              where (deptId == null || d.DepartmentId == deptId)
                                         && (active == null || d.IsActive == active)
                                      orderby d.Name
                                      select new DoctorDto(d.Id, d.Name, d.DepartmentId, d.Department!.Name, d.IsActive)).ToListAsync(ct);
            return Results.Ok(list);
        });

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

        return app;
    }
}
