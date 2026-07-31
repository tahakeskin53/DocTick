using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Auth;
using DocTick.Api.Models;
using DocTick.Api.Services;

namespace DocTick.Api.Endpoints;

public record DeptUpsertRequest(string Name, bool IsActive);
public record DoctorUpsertRequest(string Name, int DepartmentId, bool IsActive, string? Bio = null, string? Education = null, string? Interests = null, bool? IsChief = null);
public record RoleChangeRequest(string Role, int? DoctorId);
public record DoctorPhotoRequest(string? DataUrl, string? Url);
public record ScheduleCell(int DayOfWeek, string Time, bool IsOpen);
public record ScheduleGrid(int DoctorId, List<ScheduleCell> Slots);
public record SettingsDto(bool ReminderEnabled, int ReminderHoursBefore);
public record AdminApptDto(int Id, string Code, string Date, string Time,
    int DoctorId, string DoctorName, string DepartmentName, string UserEmail, string Status);
public record OverviewDto(int WeekAppointments, int OpenDepartments, int ActiveDoctors, int PendingUsers, List<AdminApptDto> Today);
public record UserDto(int Id, string Email, string Name, string Role, string Status, DateTime CreatedAt, int? DoctorId);

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/admin").WithTags("Admin")
            .RequireAuthorization().AddEndpointFilter(ActiveGuard.Admin);

        // ---- Departmanlar ----
        grp.MapGet("/departments", async (AppDb db, CancellationToken ct) =>
            Results.Ok(await db.Departments.AsNoTracking().OrderBy(d => d.Name)
                .Select(d => new { d.Id, d.Name, d.IsActive, Doctors = d.Doctors.Count(x => !x.IsDeleted) }).ToListAsync(ct)));

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
            if (await db.Doctors.AnyAsync(d => d.DepartmentId == id && !d.IsDeleted, ct))
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
                              where !d.IsDeleted
                              orderby d.Name
                              select new { d.Id, d.Name, d.DepartmentId, DepartmentName = d.Department!.Name, d.IsActive, d.PhotoUrl, d.Bio, d.Education, d.Interests, d.IsChief }).ToListAsync(ct)));

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
            return Results.Created($"/api/admin/doctors/{doc.Id}", new { doc.Id, doc.Name, doc.DepartmentId, doc.IsActive, doc.PhotoUrl });
        });

        grp.MapPut("/doctors/{id}", async (int id, DoctorUpsertRequest req, AppDb db, CancellationToken ct) =>
        {
            var doc = await db.Doctors.FindAsync([id], ct);
            if (doc is null) return Results.NotFound();
            doc.Name = req.Name.Trim(); doc.DepartmentId = req.DepartmentId; doc.IsActive = req.IsActive;
            doc.Bio = req.Bio ?? doc.Bio;
            doc.Education = req.Education ?? doc.Education;
            doc.Interests = req.Interests ?? doc.Interests;
            doc.IsChief = req.IsChief ?? doc.IsChief;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { doc.Id, doc.Name, doc.DepartmentId, doc.IsActive, doc.PhotoUrl, doc.Bio, doc.Education, doc.Interests, doc.IsChief });
        });

        // Silme = yumuşak silme. Gerçek DELETE, Appointments FK'si ON DELETE CASCADE olduğu için
        // hastaların randevu geçmişini de silerdi. Bunun yerine: doktor listelerden kaybolur,
        // geçmiş randevular olduğu gibi kalır, henüz gerçekleşmemiş randevular iptal edilip
        // sahiplerine bilgilendirme e-postası gider.
        grp.MapDelete("/doctors/{id}", async (int id, AppDb db, EmailService email, ILogger<Program> log, UserGate gate, CancellationToken ct) =>
        {
            var doc = await db.Doctors.Include(d => d.Department).FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, ct);
            if (doc is null) return Results.NotFound();

            var now = DateTime.Now;
            var confirmed = await db.Appointments.Include(a => a.User)
                .Where(a => a.DoctorId == id && a.Status == ApptStatus.Confirmed).ToListAsync(ct);
            var toCancel = confirmed.Where(a => DoctorRemoval.ShouldCancel(a.Date, a.Time, a.Status, now)).ToList();

            foreach (var a in toCancel) a.Status = ApptStatus.Cancelled;
            doc.IsDeleted = true;
            doc.IsActive = false; // yeni randevu alınamasın
            
            var user = await db.Users.FirstOrDefaultAsync(u => u.DoctorId == id, ct);
            if (user != null)
            {
                user.Role = UserRole.Patient;
                user.DoctorId = null;
                gate.Invalidate(user.Id);
            }
            await db.SaveChangesAsync(ct);

            // Bilgilendirme best-effort: gönderim hatası iptali geri almaz (PatientEndpoints ile aynı kural).
            var sent = 0;
            foreach (var a in toCancel)
            {
                if (a.User is null) continue;
                try
                {
                    await email.SendAsync(a.User.Email, "DocTick — Randevunuz iptal edildi",
                        EmailTemplates.Disruption(a.User.Name, a.Time, doc.Name, doc.Department!.Name,
                            ReminderService.FormatDate(a.Date), a.Code));
                    sent++;
                }
                catch (Exception ex)
                {
                    log.LogWarning(ex, "İptal bildirimi gönderilemedi (randevu {Id}).", a.Id);
                }
            }

            return Results.Ok(new { cancelled = toCancel.Count, notified = sent });
        });

        grp.MapPut("/doctors/{id}/photo", async (int id, DoctorPhotoRequest req, AppDb db, PhotoFileStore pstore, CancellationToken ct) =>
        {
            var store = pstore.Store;
            var doc = await db.Doctors.FindAsync([id], ct);
            if (doc is null) return Results.NotFound();

            string newUrl;
            if (!string.IsNullOrWhiteSpace(req.DataUrl))
            {
                var bytes = FileStore.DecodeDataUrl(req.DataUrl);
                if (bytes is null) return Results.BadRequest("Geçersiz veya 5 MB'tan büyük görüntü.");
                var ext = FileStore.SniffExt(bytes);
                if (ext is null) return Results.BadRequest("Yalnız PNG, JPEG, WebP veya GIF kabul edilir.");
                newUrl = store.Save(id, bytes, ext, doc.PhotoUrl);
            }
            else if (!string.IsNullOrWhiteSpace(req.Url)
                     && req.Url.Length <= 500
                     && Uri.TryCreate(req.Url, UriKind.Absolute, out var u) && u.Scheme == "https")
            {
                store.Delete(doc.PhotoUrl);
                newUrl = req.Url;
            }
            else return Results.BadRequest("dataUrl veya https url gerekli.");

            doc.PhotoUrl = newUrl;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { doc.Id, doc.PhotoUrl });
        });

        grp.MapDelete("/doctors/{id}/photo", async (int id, AppDb db, PhotoFileStore pstore, CancellationToken ct) =>
        {
            var store = pstore.Store;
            var doc = await db.Doctors.FindAsync([id], ct);
            if (doc is null) return Results.NotFound();

            store.Delete(doc.PhotoUrl);
            doc.PhotoUrl = "";
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { doc.Id, doc.PhotoUrl });
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
                .Select(u => new UserDto(u.Id, u.Email, u.Name, u.Role.ToString(), u.Status.ToString(), u.CreatedAt, u.DoctorId)).ToListAsync(ct)));

        grp.MapPost("/users/{id}/role", async (int id, RoleChangeRequest req, AppDb db, UserGate gate, CancellationToken ct) =>
        {
            var u = await db.Users.FindAsync([id], ct);
            if (u is null) return Results.NotFound();
            
            if (req.Role == "Doctor")
            {
                if (req.DoctorId is null) return Results.BadRequest("DoctorId gerekli.");
                var doc = await db.Doctors.FindAsync([req.DoctorId], ct);
                if (doc is null || doc.IsDeleted || !doc.IsActive) return Results.BadRequest("Geçerli ve aktif bir doktor bulunamadı.");
                if (await db.Users.AnyAsync(x => x.DoctorId == req.DoctorId && x.Id != id, ct)) return Results.BadRequest("Bu doktora atanmış başka bir kullanıcı var.");
                
                u.Role = UserRole.Doctor;
                u.DoctorId = req.DoctorId;
                u.Status = UserStatus.Active;
            }
            else if (req.Role == "Patient")
            {
                u.Role = UserRole.Patient;
                u.DoctorId = null;
            }
            else return Results.BadRequest("Geçersiz rol.");
            
            await db.SaveChangesAsync(ct);
            gate.Invalidate(id);
            return Results.Ok(new UserDto(u.Id, u.Email, u.Name, u.Role.ToString(), u.Status.ToString(), u.CreatedAt, u.DoctorId));
        });

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
            return Results.Ok(new UserDto(u.Id, u.Email, u.Name, u.Role.ToString(), u.Status.ToString(), u.CreatedAt, u.DoctorId));
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
            return Results.Ok(new UserDto(u.Id, u.Email, u.Name, u.Role.ToString(), u.Status.ToString(), u.CreatedAt, u.DoctorId));
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

        grp.MapGet("/users/{id}/results", async (int id, AppDb db, CancellationToken ct) =>
        {
            var labs = await db.LabResults.AsNoTracking().Include(r => r.Doctor).Include(r => r.Values)
                .Where(r => r.PatientId == id).OrderByDescending(r => r.RequestedAt).ToListAsync(ct);
            var imaging = await db.ImagingStudies.AsNoTracking().Include(s => s.Doctor)
                .Where(s => s.PatientId == id).OrderByDescending(s => s.RequestedAt).ToListAsync(ct);
                
            return Results.Ok(new {
                labs = labs.Select(r => new { r.Id, r.PanelName, Status = r.Status.ToString(), r.RequestedAt, r.ReportedAt, r.DoctorNote, r.FilePath, DoctorName = r.Doctor!.Name, Values = r.Values.Select(v => new { v.TestName, v.Value, v.Unit, v.RefLow, v.RefHigh }) }),
                imaging = imaging.Select(s => new { s.Id, s.Modality, s.BodyPart, Status = s.Status.ToString(), s.RequestedAt, s.ReportedAt, s.ReportText, s.FilePath, DoctorName = s.Doctor!.Name })
            });
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
