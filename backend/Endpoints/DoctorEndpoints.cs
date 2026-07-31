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
public record LabInput(int PatientId, int? AppointmentId, string? PanelName, string? Status, string? DoctorNote, List<LabValueInput>? Values);
public record ImagingInput(int PatientId, int? AppointmentId, string? Modality, string? BodyPart, string? Status, string? ReportText);

public static class DoctorEndpoints
{
    private static readonly string[] Modalities = ["Rontgen", "MR", "BT", "USG", "Diger"];

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

        grp.MapPost("/lab", async (LabInput req, AppDb db, UserGate gate, ClaimsPrincipal p, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            if (!await CanTouchAsync(db, docId, req.PatientId, ct)) return Results.Forbid();

            var panel = (req.PanelName ?? "").Trim();
            if (panel.Length is 0 or > 100) return Results.BadRequest("Panel adı 1-100 karakter olmalı.");
            if (BadValues(req.Values) is string err) return Results.BadRequest(err);
            if (!await ApptBelongsAsync(db, req.AppointmentId, docId, req.PatientId, ct))
                return Results.BadRequest("Randevu bu hastaya veya size ait değil.");

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
                Values = ToValues(req.Values),
            };
            db.LabResults.Add(row);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/doctor/lab/{row.Id}", new { row.Id });
        });

        grp.MapPut("/lab/{id}", async (int id, LabInput req, AppDb db, UserGate gate, ClaimsPrincipal p, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            // Yazma kapsamı okumadan dar: ortak hasta olsa bile başkasının yüklediği kayda dokunulamaz.
            var row = await db.LabResults.Include(r => r.Values).FirstOrDefaultAsync(r => r.Id == id && r.DoctorId == docId, ct);
            if (row is null) return Results.NotFound();

            var panel = (req.PanelName ?? "").Trim();
            if (panel.Length is 0 or > 100) return Results.BadRequest("Panel adı 1-100 karakter olmalı.");
            if (BadValues(req.Values) is string err) return Results.BadRequest(err);

            row.PanelName = panel;
            row.DoctorNote = (req.DoctorNote ?? "").Trim();
            // Değerler toptan değiştirilir — satır satır eşleştirme, kazandırdığından çok karmaşıklık getirirdi.
            db.LabValues.RemoveRange(row.Values);
            row.Values = ToValues(req.Values);
            if (!string.Equals(req.Status, "Requested", StringComparison.OrdinalIgnoreCase))
            {
                row.Status = ResultStatus.Reported;
                row.ReportedAt ??= DateTime.UtcNow;
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

        grp.MapPost("/imaging", async (ImagingInput req, AppDb db, UserGate gate, ClaimsPrincipal p, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            if (!await CanTouchAsync(db, docId, req.PatientId, ct)) return Results.Forbid();

            var body = (req.BodyPart ?? "").Trim();
            if (body.Length is 0 or > 100) return Results.BadRequest("Vücut bölgesi 1-100 karakter olmalı.");
            if (!Modalities.Contains(req.Modality)) return Results.BadRequest("Geçersiz görüntüleme türü.");
            if (!await ApptBelongsAsync(db, req.AppointmentId, docId, req.PatientId, ct))
                return Results.BadRequest("Randevu bu hastaya veya size ait değil.");

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
            };
            db.ImagingStudies.Add(row);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/doctor/imaging/{row.Id}", new { row.Id });
        });

        grp.MapPut("/imaging/{id}", async (int id, ImagingInput req, AppDb db, UserGate gate, ClaimsPrincipal p, CancellationToken ct) =>
        {
            var docId = await MyDoctorIdAsync(gate, p, ct);
            var row = await db.ImagingStudies.FirstOrDefaultAsync(s => s.Id == id && s.DoctorId == docId, ct);
            if (row is null) return Results.NotFound();

            var body = (req.BodyPart ?? "").Trim();
            if (body.Length is 0 or > 100) return Results.BadRequest("Vücut bölgesi 1-100 karakter olmalı.");
            if (!Modalities.Contains(req.Modality)) return Results.BadRequest("Geçersiz görüntüleme türü.");

            row.Modality = req.Modality!;
            row.BodyPart = body;
            row.ReportText = (req.ReportText ?? "").Trim();
            if (!string.Equals(req.Status, "Requested", StringComparison.OrdinalIgnoreCase))
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
