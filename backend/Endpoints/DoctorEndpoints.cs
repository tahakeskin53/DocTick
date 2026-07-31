using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Auth;
using DocTick.Api.Models;
using DocTick.Api.Services;

namespace DocTick.Api.Endpoints;

// Doktora özel randevu görünümü. AppointmentDto hasta alanı taşımaz (hasta kendi listesine
// bakarken gereksiz); doktor tarafında sonucun DOĞRU kişiye bağlanabilmesi için PatientId şart.
public record DoctorApptDto(
    int Id, string Code, int PatientId, string PatientName, string PatientEmail,
    string DepartmentName, string Date, string DateLabel, string Time, string Status);

public record LabValueInput(string? TestName, double Value, string? Unit, double? RefLow, double? RefHigh);
// FileDataUrl: "data:...;base64,..." — doktor fotoğrafı yüklemesiyle aynı taşıma biçimi.
// Tahlil için yalnız PDF, görüntüleme için yalnız görsel kabul edilir (bkz. LabExts/ImagingExts).
public record LabInput(int PatientId, int? AppointmentId, string? PanelName, string? Status, string? DoctorNote, List<LabValueInput>? Values, string? FileDataUrl);
public record ImagingInput(int PatientId, int? AppointmentId, string? Modality, string? BodyPart, string? Status, string? ReportText, string? FileDataUrl);

public static class DoctorEndpoints
{
    private static readonly string[] Modalities = ["Rontgen", "MR", "BT", "USG", "Diger"];

    // Tür kısıtı uzantı adına değil, dosyanın ilk baytlarına bakılarak uygulanır
    // (FileStore.SniffExt). Adı .pdf olan bir JPEG buradan geçemez.
    internal static readonly string[] LabExts = [".pdf"];
    internal static readonly string[] ImagingExts = [".png", ".jpg", ".webp", ".gif"];

    public static IEndpointRouteBuilder MapDoctorEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/doctor").WithTags("Doctor")
            .RequireAuthorization().AddEndpointFilter(ActiveGuard.Doctor);

        // Kendi randevuları. date verilmezse TÜMÜ döner; verilirse o güne filtrelenir.
        grp.MapGet("/appointments", async (string? date, AppDb db, UserGate gate, ClaimsPrincipal p, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            var q = db.Appointments.AsNoTracking()
                .Include(a => a.User)
                .Include(a => a.Doctor!).ThenInclude(d => d!.Department)
                .Where(a => a.DoctorId == docId);

            if (!string.IsNullOrWhiteSpace(date)) q = q.Where(a => a.Date == date);

            var list = await q.OrderByDescending(a => a.Date + " " + a.Time).ToListAsync(ct);
            return Results.Ok(list.Select(ToDto));
        });

        // Doktor kendi randevusunu iptal eder. Hastaya bilgi e-postası gider —
        // iptali hasta değil doktor yaptığı için haberdar edilmesi şart.
        grp.MapPost("/appointments/{id}/cancel", async (int id, AppDb db, UserGate gate, ClaimsPrincipal p, EmailService email, HttpContext ctx, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            var appt = await db.Appointments
                .Include(a => a.User)
                .Include(a => a.Doctor!).ThenInclude(d => d!.Department)
                .FirstOrDefaultAsync(a => a.Id == id && a.DoctorId == docId, ct);
            if (appt is null) return Results.NotFound();
            if (appt.Status != ApptStatus.Confirmed) return Results.BadRequest("Randevu zaten iptal edilmiş.");
            // Geçmiş randevu iptal edilmez — olan olmuş, kayıt tarihçe olarak kalmalı.
            if (!DateTime.TryParseExact($"{appt.Date} {appt.Time}", "yyyy-MM-dd HH:mm", null,
                    System.Globalization.DateTimeStyles.None, out var start) || start <= DateTime.Now)
                return Results.BadRequest("Geçmiş randevu iptal edilemez.");

            AuditLog.Event(ctx, "appt_cancel_doctor", $"{appt.Code} · {appt.Doctor!.Name} · {appt.Date} {appt.Time}");

            appt.Status = ApptStatus.Cancelled;
            await db.SaveChangesAsync(ct);

            if (appt.User is not null)
            {
                try
                {
                    await email.SendAsync(appt.User.Email, "DocTick — Randevu iptali",
                        EmailTemplates.Cancellation(appt.User.Name, appt.Time, appt.Doctor!.Name,
                            appt.Doctor!.Department!.Name, ReminderService.FormatDate(appt.Date)));
                }
                catch { /* e-posta başarısızlığı iptali geri almaz */ }
            }

            return Results.Ok(ToDto(appt));
        });

        // Kendi hastaları — bölüm 5'teki yetki predicate'inin liste hâli.
        grp.MapGet("/patients", async (AppDb db, UserGate gate, ClaimsPrincipal p, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            var list = await db.Appointments.AsNoTracking()
                .Where(a => a.DoctorId == docId)
                .Select(a => new { Id = a.UserId, a.User!.Name, a.User!.Email })
                .Distinct()
                .OrderBy(x => x.Name)
                .ToListAsync(ct);
            return Results.Ok(list);
        });

        grp.MapGet("/patients/{id}/results", async (int id, AppDb db, UserGate gate, ClaimsPrincipal p, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            if (!await CanTouchAsync(db, docId, id, ct)) return Results.Forbid();
            return Results.Ok(await ResultsEndpoints.LoadAsync(db, id, ct));
        });

        // ---- Tahlil ----

        grp.MapPost("/lab", async (LabInput req, AppDb db, UserGate gate, ClaimsPrincipal p, ResultFileStore store, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            if (!await CanTouchAsync(db, docId, req.PatientId, ct)) return Results.Forbid();

            var panel = (req.PanelName ?? "").Trim();
            if (panel.Length is 0 or > 100) return Results.BadRequest("Panel adı 1-100 karakter olmalı.");
            if (BadValues(req.Values) is string err) return Results.BadRequest(err);
            if (!await ApptBelongsAsync(db, req.AppointmentId, docId, req.PatientId, ct))
                return Results.BadRequest("Randevu bu hastaya veya size ait değil.");

            var (fileErr, filePath) = SaveUpload(store, req.PatientId, req.FileDataUrl, LabExts, "Tahlil için yalnız PDF");
            if (fileErr is not null) return Results.BadRequest(fileErr);

            var reported = !string.Equals(req.Status, "Requested", StringComparison.OrdinalIgnoreCase);
            var row = new LabResult
            {
                PatientId = req.PatientId,
                DoctorId = docId,
                AppointmentId = req.AppointmentId,
                PanelName = panel,
                Status = reported ? ResultStatus.Reported : ResultStatus.Requested,
                RequestedAt = DateTime.UtcNow,
                ReportedAt = reported ? DateTime.UtcNow : null,
                DoctorNote = (req.DoctorNote ?? "").Trim(),
                FilePath = filePath ?? "",
                Values = ToValues(req.Values),
            };
            db.LabResults.Add(row);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/doctor/lab/{row.Id}", new { row.Id });
        });

        grp.MapPut("/lab/{id}", async (int id, LabInput req, AppDb db, UserGate gate, ClaimsPrincipal p, ResultFileStore store, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            // Yazma kapsamı okumadan dar: ortak hasta olsa bile başkasının yüklediği kayda dokunulamaz.
            var row = await db.LabResults.Include(r => r.Values).FirstOrDefaultAsync(r => r.Id == id && r.DoctorId == docId, ct);
            if (row is null) return Results.NotFound();

            if (MergeLab(row, req) is string err) return Results.BadRequest(err);

            // Yeni dosya gönderilmediyse mevcut dosya korunur.
            var (fileErr, filePath) = SaveUpload(store, row.PatientId, req.FileDataUrl, LabExts, "Tahlil için yalnız PDF");
            if (fileErr is not null) return Results.BadRequest(fileErr);
            if (filePath is not null)
            {
                store.Delete(row.FilePath); // eskisi yetim kalmasın
                row.FilePath = filePath;
            }

            if (req.Values is not null)
            {
                // Değerler toptan değiştirilir — satır satır eşleştirme, kazandırdığından çok karmaşıklık getirirdi.
                db.LabValues.RemoveRange(row.Values);
                row.Values = ToValues(req.Values);
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { row.Id });
        });

        grp.MapDelete("/lab/{id}", async (int id, AppDb db, UserGate gate, ClaimsPrincipal p, ResultFileStore store, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            var row = await db.LabResults.FirstOrDefaultAsync(r => r.Id == id && r.DoctorId == docId, ct);
            if (row is null) return Results.NotFound();
            store.Delete(row.FilePath); // yetim dosya kalmasın
            db.LabResults.Remove(row);  // LabValues cascade ile gider
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // ---- Görüntüleme ----

        grp.MapPost("/imaging", async (ImagingInput req, AppDb db, UserGate gate, ClaimsPrincipal p, ResultFileStore store, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            if (!await CanTouchAsync(db, docId, req.PatientId, ct)) return Results.Forbid();

            var body = (req.BodyPart ?? "").Trim();
            if (body.Length is 0 or > 100) return Results.BadRequest("Vücut bölgesi 1-100 karakter olmalı.");
            if (!Modalities.Contains(req.Modality)) return Results.BadRequest("Geçersiz görüntüleme türü.");
            if (!await ApptBelongsAsync(db, req.AppointmentId, docId, req.PatientId, ct))
                return Results.BadRequest("Randevu bu hastaya veya size ait değil.");

            var (fileErr, filePath) = SaveUpload(store, req.PatientId, req.FileDataUrl, ImagingExts, "Görüntüleme için yalnız görsel (PNG, JPG, WEBP, GIF)");
            if (fileErr is not null) return Results.BadRequest(fileErr);

            var reported = !string.Equals(req.Status, "Requested", StringComparison.OrdinalIgnoreCase);
            var row = new ImagingStudy
            {
                PatientId = req.PatientId,
                DoctorId = docId,
                AppointmentId = req.AppointmentId,
                Modality = req.Modality!,
                BodyPart = body,
                Status = reported ? ResultStatus.Reported : ResultStatus.Requested,
                RequestedAt = DateTime.UtcNow,
                ReportedAt = reported ? DateTime.UtcNow : null,
                ReportText = (req.ReportText ?? "").Trim(),
                FilePath = filePath ?? "",
            };
            db.ImagingStudies.Add(row);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/doctor/imaging/{row.Id}", new { row.Id });
        });

        grp.MapPut("/imaging/{id}", async (int id, ImagingInput req, AppDb db, UserGate gate, ClaimsPrincipal p, ResultFileStore store, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            var row = await db.ImagingStudies.FirstOrDefaultAsync(s => s.Id == id && s.DoctorId == docId, ct);
            if (row is null) return Results.NotFound();

            // Kısmi güncelleme — gönderilmeyen alan korunur (bkz. PUT /lab/{id}).
            if (req.BodyPart is not null)
            {
                var body = req.BodyPart.Trim();
                if (body.Length is 0 or > 100) return Results.BadRequest("Vücut bölgesi 1-100 karakter olmalı.");
                row.BodyPart = body;
            }
            if (req.Modality is not null)
            {
                if (!Modalities.Contains(req.Modality)) return Results.BadRequest("Geçersiz görüntüleme türü.");
                row.Modality = req.Modality;
            }

            var (fileErr, filePath) = SaveUpload(store, row.PatientId, req.FileDataUrl, ImagingExts, "Görüntüleme için yalnız görsel (PNG, JPG, WEBP, GIF)");
            if (fileErr is not null) return Results.BadRequest(fileErr);
            if (filePath is not null)
            {
                store.Delete(row.FilePath);
                row.FilePath = filePath;
            }

            if (req.ReportText is not null) row.ReportText = req.ReportText.Trim();
            if (req.Status is not null && !string.Equals(req.Status, "Requested", StringComparison.OrdinalIgnoreCase))
            {
                row.Status = ResultStatus.Reported;
                row.ReportedAt ??= DateTime.UtcNow;
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { row.Id });
        });

        grp.MapDelete("/imaging/{id}", async (int id, AppDb db, UserGate gate, ClaimsPrincipal p, ResultFileStore store, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            var row = await db.ImagingStudies.FirstOrDefaultAsync(s => s.Id == id && s.DoctorId == docId, ct);
            if (row is null) return Results.NotFound();
            store.Delete(row.FilePath);
            db.ImagingStudies.Remove(row);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        return app;
    }

    /// <summary>
    /// Sonuç erişiminin TEK kuralı: doktor yalnız kendisiyle randevusu olmuş hastaya dokunabilir.
    /// /patients listesi de bu predicate'in kendisi — iki ayrı kural yok.
    /// </summary>
    internal static Task<bool> CanTouchAsync(AppDb db, int doctorId, int patientId, CancellationToken ct) =>
        db.Appointments.AnyAsync(a => a.DoctorId == doctorId && a.UserId == patientId, ct);

    /// <summary>Randevu bağı verilmişse gerçekten bu doktora ve bu hastaya ait olmalı.</summary>
    private static async Task<bool> ApptBelongsAsync(AppDb db, int? apptId, int doctorId, int patientId, CancellationToken ct) =>
        apptId is not int id || await db.Appointments.AnyAsync(a => a.Id == id && a.DoctorId == doctorId && a.UserId == patientId, ct);

    // ActiveGuard.Doctor DoctorId'nin null olmadığını zaten garanti ediyor; gate önbellekli,
    // bu yüzden istek başına ekstra DB turu yok.
    private static async Task<int> MyDoctorIdAsync(UserGate gate, ClaimsPrincipal p, CancellationToken ct) =>
        (await gate.GetAsync(CurrentUser.Uid(p), ct))?.DoctorId ?? 0;

    /// <summary>
    /// Data URL'i çözer, türünü ilk baytlarından doğrular ve diske yazar.
    /// Dönüş: (hata mesajı, kaydedilen dosya adı). İkisi de null ise dosya gönderilmemiş.
    /// ponytail: dosya, satır yazılmadan önce diske iner — SaveChanges patlarsa ortada
    /// sahipsiz bir dosya kalır. Tavan: nadir ve zararsız (disk sızıntısı, veri değil).
    /// Yükseltme yolu: satırı önce yaz, dosyayı sonra ekle, FilePath'i ikinci turda güncelle.
    /// </summary>
    internal static (string? Error, string? Path) SaveUpload(
        ResultFileStore store, int patientId, string? dataUrl, string[] allowed, string kindLabel)
    {
        if (string.IsNullOrWhiteSpace(dataUrl)) return (null, null);

        var bytes = FileStore.DecodeDataUrl(dataUrl);
        if (bytes is null) return ($"Dosya okunamadı veya 5 MB sınırını aşıyor.", null);

        var ext = FileStore.SniffExt(bytes);
        if (ext is null || !allowed.Contains(ext)) return ($"{kindLabel} kabul edilir.", null);

        return (null, store.Save(patientId, bytes, ext, ""));
    }

    /// <summary>
    /// Tahlil güncellemesinin kısmi birleştirme kuralı: <b>null gelen alan korunur.</b>
    /// Yalnız dosya iliştirmek isteyen bir çağrı panel adını ve notu tekrar yollamak
    /// zorunda değil — yollamazsa silinmezler. Hata varsa mesaj, yoksa null döner.
    /// (Değer listesi DbContext gerektirdiği için uçta kalır; kararı burası verir.)
    /// </summary>
    internal static string? MergeLab(LabResult row, LabInput req)
    {
        if (req.PanelName is not null)
        {
            var panel = req.PanelName.Trim();
            if (panel.Length is 0 or > 100) return "Panel adı 1-100 karakter olmalı.";
            row.PanelName = panel;
        }
        if (BadValues(req.Values) is string err) return err;
        if (req.DoctorNote is not null) row.DoctorNote = req.DoctorNote.Trim();
        if (req.Status is not null && !string.Equals(req.Status, "Requested", StringComparison.OrdinalIgnoreCase))
        {
            row.Status = ResultStatus.Reported;
            row.ReportedAt ??= DateTime.UtcNow;
        }
        return null;
    }

    private static string? BadValues(List<LabValueInput>? values)
    {
        foreach (var v in values ?? [])
        {
            if (string.IsNullOrWhiteSpace(v.TestName)) return "Test adı boş olamaz.";
            if (v.RefLow is double lo && v.RefHigh is double hi && lo > hi)
                return $"{v.TestName}: referans alt sınırı üst sınırdan büyük olamaz.";
        }
        return null;
    }

    private static List<LabValue> ToValues(List<LabValueInput>? values) =>
        (values ?? []).Select(v => new LabValue
        {
            TestName = (v.TestName ?? "").Trim(),
            Value = v.Value,
            Unit = (v.Unit ?? "").Trim(),
            RefLow = v.RefLow,
            RefHigh = v.RefHigh,
        }).ToList();

    internal static DoctorApptDto ToDto(Appointment a) => new(
        a.Id, a.Code, a.UserId, a.User?.Name ?? "", a.User?.Email ?? "",
        a.Doctor?.Department?.Name ?? "",
        a.Date, ReminderService.FormatDate(a.Date), a.Time, PatientEndpoints.DisplayStatus(a));
}
