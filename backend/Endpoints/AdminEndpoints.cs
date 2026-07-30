using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Auth;
using DocTick.Api.Models;
using DocTick.Api.Services;

namespace DocTick.Api.Endpoints;

public record DeptUpsertRequest(string Name, bool IsActive);
public record DoctorUpsertRequest(string Name, int DepartmentId, bool IsActive);
public record ScheduleCell(int DayOfWeek, string Time, bool IsOpen);
public record ScheduleGrid(int DoctorId, List<ScheduleCell> Slots);
public record SettingsDto(bool ReminderEnabled, int ReminderHoursBefore);
public record AdminApptDto(int Id, string Code, string Date, string Time,
    int DoctorId, string DoctorName, string DepartmentName, string UserEmail, string Status);
public record OverviewDto(int WeekAppointments, int OpenDepartments, int ActiveDoctors, int PendingUsers, List<AdminApptDto> Today);
public record UserDto(int Id, string Email, string Name, string Role, string Status, DateTime CreatedAt);

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/admin").WithTags("Admin")
            .RequireAuthorization().AddEndpointFilter(ActiveGuard.Admin);

        // ---- Departmanlar ----
        grp.MapGet("/departments", async (AppDb db, CancellationToken ct) =>
            Results.Ok(await db.Departments.AsNoTracking().OrderBy(d => d.Name)
                .Select(d => new { d.Id, d.Name, d.IsActive, Doctors = d.Doctors.Count }).ToListAsync(ct)));

        grp.MapPost("/departments", async (DeptUpsertRequest req, AppDb db, CancellationToken ct) =>
        {
            var d = new Department { Name = req.Name.Trim(), IsActive = req.IsActive };
            db.Departments.Add(d);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/admin/departments/{d.Id}", new { d.Id, d.Name, d.IsActive });
        });

        grp.MapPut("/departments/{id}", async (int id, DeptUpsertRequest req, AppDb db, CancellationToken ct) =>
        {
            var d = await db.Departments.FindAsync([id], ct);
            if (d is null) return Results.NotFound();
            d.Name = req.Name.Trim(); d.IsActive = req.IsActive;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { d.Id, d.Name, d.IsActive });
        });

        grp.MapDelete("/departments/{id}", async (int id, AppDb db, CancellationToken ct) =>
        {
            if (await db.Doctors.AnyAsync(d => d.DepartmentId == id, ct))
                return Results.Conflict("Bu bölüme bağlı doktorlar var; önce onları taşıyın veya silin.");
            var d = await db.Departments.FindAsync([id], ct);
            if (d is null) return Results.NotFound();
            db.Departments.Remove(d);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // ---- Doktorlar ----
        grp.MapGet("/doctors", async (AppDb db, CancellationToken ct) =>
            Results.Ok(await (from d in db.Doctors.AsNoTracking().Include(x => x.Department)
                              orderby d.Name
                              select new { d.Id, d.Name, d.DepartmentId, DepartmentName = d.Department!.Name, d.IsActive }).ToListAsync(ct)));

        grp.MapPost("/doctors", async (DoctorUpsertRequest req, AppDb db, CancellationToken ct) =>
        {
            var doc = new Doctor { Name = req.Name.Trim(), DepartmentId = req.DepartmentId, IsActive = req.IsActive };
            db.Doctors.Add(doc);
            await db.SaveChangesAsync(ct);
            // Yeni doktor için varsayılan plan: tüm günler; hafta içi açık, hafta sonu kapalı.
            foreach (var dow in Slots.Days)
                foreach (var t in Slots.All)
                    db.ScheduleSlots.Add(new ScheduleSlot { DoctorId = doc.Id, DayOfWeek = dow, Time = t, IsOpen = Slots.DefaultOpenDays.Contains(dow) });
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/admin/doctors/{doc.Id}", new { doc.Id, doc.Name, doc.DepartmentId, doc.IsActive });
        });

        grp.MapPut("/doctors/{id}", async (int id, DoctorUpsertRequest req, AppDb db, CancellationToken ct) =>
        {
            var doc = await db.Doctors.FindAsync([id], ct);
            if (doc is null) return Results.NotFound();
            doc.Name = req.Name.Trim(); doc.DepartmentId = req.DepartmentId; doc.IsActive = req.IsActive;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { doc.Id, doc.Name, doc.DepartmentId, doc.IsActive });
        });

        grp.MapDelete("/doctors/{id}", async (int id, AppDb db, CancellationToken ct) =>
        {
            if (await db.Appointments.AnyAsync(a => a.DoctorId == id, ct))
                return Results.Conflict("Bu doktora ait randevu geçmişi var; silmek yerine pasifleştirin.");
            var doc = await db.Doctors.FindAsync([id], ct);
            if (doc is null) return Results.NotFound();
            db.Doctors.Remove(doc);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // ---- Haftalık saat ızgarası ----
        grp.MapGet("/schedule", async (AppDb db, int doctorId, CancellationToken ct) =>
        {
            var rows = await db.ScheduleSlots.AsNoTracking()
                .Where(s => s.DoctorId == doctorId).ToListAsync(ct);
            var map = rows.ToDictionary(s => (s.DayOfWeek, s.Time), s => s.IsOpen);
            var cells = from dow in Slots.Days
                        from t in Slots.All
                        select new ScheduleCell(dow, t, map.TryGetValue((dow, t), out var o) && o);
            return Results.Ok(new ScheduleGrid(doctorId, cells.ToList()));
        });

        grp.MapPut("/schedule", async (int doctorId, ScheduleGrid req, AppDb db, CancellationToken ct) =>
        {
            var existing = await db.ScheduleSlots.Where(s => s.DoctorId == doctorId).ToListAsync(ct);
            db.ScheduleSlots.RemoveRange(existing);
            foreach (var c in req.Slots.Where(c => Slots.Days.Contains(c.DayOfWeek) && Slots.All.Contains(c.Time)))
                db.ScheduleSlots.Add(new ScheduleSlot { DoctorId = doctorId, DayOfWeek = c.DayOfWeek, Time = c.Time, IsOpen = c.IsOpen });
            await db.SaveChangesAsync(ct);
            return Results.Ok();
        });

        // ---- Kullanıcı onayı ----
        grp.MapGet("/users", async (AppDb db, CancellationToken ct) =>
            Results.Ok(await db.Users.AsNoTracking().OrderByDescending(u => u.CreatedAt)
                .Select(u => new UserDto(u.Id, u.Email, u.Name, u.Role.ToString(), u.Status.ToString(), u.CreatedAt)).ToListAsync(ct)));

        grp.MapPost("/users/{id}/approve", async (int id, AppDb db, EmailService email, UserGate gate, CancellationToken ct) =>
        {
            var u = await db.Users.FindAsync([id], ct);
            if (u is null) return Results.NotFound();
            u.Status = UserStatus.Active;
            await db.SaveChangesAsync(ct);
            gate.Invalidate(id); // yetki önbelleği bayat kalmasın — onay anında geçerli olmalı
            // Best-effort: e-posta başarısız olsa da onay geri alınmaz (ör. Resend test modu 403).
            try { await email.SendAsync(u.Email, "DocTick — Hesabınız onaylandı", EmailTemplates.Approved(u.Name)); }
            catch { /* onay tamamlandı; bildirim gönderilemedi */ }
            return Results.Ok(new UserDto(u.Id, u.Email, u.Name, u.Role.ToString(), u.Status.ToString(), u.CreatedAt));
        });

        grp.MapPost("/users/{id}/reject", async (int id, AppDb db, EmailService email, UserGate gate, CancellationToken ct) =>
        {
            var u = await db.Users.FindAsync([id], ct);
            if (u is null) return Results.NotFound();
            u.Status = UserStatus.Rejected;
            await db.SaveChangesAsync(ct);
            gate.Invalidate(id); // reddedilen kullanıcı bir sonraki istekte 403 almalı
            // Best-effort: e-posta başarısız olsa da red geri alınmaz.
            try { await email.SendAsync(u.Email, "DocTick — Hesap başvurunuz", EmailTemplates.Rejected(u.Name)); }
            catch { /* red tamamlandı; bildirim gönderilemedi */ }
            return Results.Ok(new UserDto(u.Id, u.Email, u.Name, u.Role.ToString(), u.Status.ToString(), u.CreatedAt));
        });

        grp.MapDelete("/users/{id}", async (int id, AppDb db, ClaimsPrincipal me, UserGate gate, CancellationToken ct) =>
        {
            var u = await db.Users.FindAsync([id], ct);
            if (u is null) return Results.NotFound();
            // Admin kendini silemez — paneli kilitlemeyi önler.
            if (u.Id == CurrentUser.Uid(me)) return Results.BadRequest("Kendi hesabınızı silemezsiniz.");
            // Kullanıcının randevuları da silinir (FK ihlali olmasın). Doktor silmedeki gibi engellemek yerine
            // "tamamen sil" istendiği için randevu geçmişi de temizlenir.
            var appts = await db.Appointments.Where(a => a.UserId == id).ToListAsync(ct);
            db.Appointments.RemoveRange(appts);
            db.Users.Remove(u);
            await db.SaveChangesAsync(ct);
            gate.Invalidate(id); // silinen kullanıcının önbellekteki kaydı kalmasın
            return Results.NoContent();
        });

        // ---- Genel bakış ----
        grp.MapGet("/overview", async (AppDb db, CancellationToken ct) =>
        {
            var today = DateTime.Today;
            var isoToday = today.ToString("yyyy-MM-dd");
            // Haftanın Pazartesi başlangıcı.
            int diff = ((int)today.DayOfWeek + 6) % 7;
            var weekStart = today.AddDays(-diff);
            var weekDays = Enumerable.Range(0, 7).Select(i => weekStart.AddDays(i).ToString("yyyy-MM-dd")).ToList();

            var week = await db.Appointments.AsNoTracking().CountAsync(a => weekDays.Contains(a.Date), ct);
            var openDepts = await db.Departments.AsNoTracking().CountAsync(d => d.IsActive, ct);
            var activeDocs = await db.Doctors.AsNoTracking().CountAsync(d => d.IsActive, ct);
            var pending = await db.Users.AsNoTracking().CountAsync(u => u.Status == UserStatus.Pending, ct);

            // Kart "yaklaşan" randevuları gösterir: bugün ve sonrası, ilk 10.
            var todayList = await (from a in db.Appointments.AsNoTracking().Include(x => x.Doctor!).ThenInclude(d => d!.Department).Include(x => x.User)
                                   where a.Date.CompareTo(isoToday) >= 0
                                   orderby a.Date, a.Time
                                   select new AdminApptDto(a.Id, a.Code, a.Date, a.Time, a.DoctorId, a.Doctor!.Name, a.Doctor!.Department!.Name,
                                       a.User!.Email, a.Status == ApptStatus.Confirmed ? "confirmed" : "cancelled")).Take(10).ToListAsync(ct);

            return Results.Ok(new OverviewDto(week, openDepts, activeDocs, pending, todayList));
        });

        grp.MapGet("/appointments", async (AppDb db, string? date, CancellationToken ct) =>
        {
            var q = db.Appointments.AsNoTracking().Include(a => a.Doctor!).ThenInclude(d => d!.Department).Include(a => a.User);
            var list = date is null
                ? await q.OrderByDescending(a => a.Date + " " + a.Time).ToListAsync(ct)
                : await q.Where(a => a.Date == date).OrderBy(a => a.Time).ToListAsync(ct);
            return Results.Ok(list.Select(a => new AdminApptDto(a.Id, a.Code, a.Date, a.Time, a.DoctorId, a.Doctor!.Name, a.Doctor!.Department!.Name,
                a.User!.Email, a.Status == ApptStatus.Confirmed ? "confirmed" : "cancelled")).ToList());
        });

        // ---- Ayarlar (gönderen adresi config kaynaklıdır: Resend:FromEmail) ----
        grp.MapGet("/settings", async (AppDb db, CancellationToken ct) =>
        {
            var s = await db.Settings.AsNoTracking().FirstAsync(ct);
            return Results.Ok(new SettingsDto(s.ReminderEnabled, s.ReminderHoursBefore));
        });

        grp.MapPut("/settings", async (SettingsDto req, AppDb db, CancellationToken ct) =>
        {
            var s = await db.Settings.FirstAsync(ct);
            s.ReminderEnabled = req.ReminderEnabled;
            s.ReminderHoursBefore = req.ReminderHoursBefore is >= 1 and <= 168 ? req.ReminderHoursBefore : s.ReminderHoursBefore;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new SettingsDto(s.ReminderEnabled, s.ReminderHoursBefore));
        });

        return app;
    }
}
