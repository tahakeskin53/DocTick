using System.Security.Claims;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Auth;
using DocTick.Api.Models;
using DocTick.Api.Services;

namespace DocTick.Api.Endpoints;

public static class ResultsEndpoints
{
    public static IEndpointRouteBuilder MapResultsEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/results").WithTags("Results")
            .RequireAuthorization().AddEndpointFilter(ActiveGuard.Patient);

        // Hastanın kendi sonuçları. Yetki kapsamı burada tek satır: PatientId == kendi uid.
        grp.MapGet("/", async (AppDb db, ClaimsPrincipal p, CancellationToken ct) =>
            Results.Ok(await LoadAsync(db, CurrentUser.Uid(p), ct)));

        // İndirme uçları üç rolün de kullandığı TEK çift. Hasta/doktor/admin için ayrı ayrı
        // uç açmak yerine kapsam kontrolü içeride dallanıyor — dosya URL'i her arayüzde aynı.
        // (ActiveGuard.Patient yalnız "hesap aktif mi" bakar, rolü daraltmaz.)
        grp.MapGet("/lab/{id}/file", async (int id, AppDb db, ClaimsPrincipal p, UserGate gate, ResultFileStore store, CancellationToken ct) =>
        {
            var row = await db.LabResults.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
            if (row is null || !await CanViewAsync(db, gate, p, row.PatientId, ct)) return Results.NotFound();
            return SendFile(store, row.FilePath);
        });

        grp.MapGet("/imaging/{id}/file", async (int id, AppDb db, ClaimsPrincipal p, UserGate gate, ResultFileStore store, CancellationToken ct) =>
        {
            var row = await db.ImagingStudies.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
            if (row is null || !await CanViewAsync(db, gate, p, row.PatientId, ct)) return Results.NotFound();
            return SendFile(store, row.FilePath);
        });

        return app;
    }

    /// <summary>
    /// Sonuç dosyasını kim görebilir: hasta kendisininkini, doktor kendi hastasınınkini
    /// (LoadAsync okuma kapsamıyla aynı kural), admin hepsini.
    /// Yetkisiz durumda 403 değil 404 dönülür — "bu Id'de kayıt var mı" bilgisi de sızmasın.
    /// </summary>
    internal static async Task<bool> CanViewAsync(AppDb db, UserGate gate, ClaimsPrincipal p, int patientId, CancellationToken ct)
    {
        var uid = CurrentUser.Uid(p);
        var me = await gate.GetAsync(uid, ct);
        if (me is null) return false;
        return me.Role switch
        {
            UserRole.Admin => true,
            UserRole.Doctor => me.DoctorId is int did && await DoctorEndpoints.CanTouchAsync(db, did, patientId, ct),
            _ => patientId == uid,
        };
    }

    private static readonly FileExtensionContentTypeProvider Mime = new();

    /// <summary>
    /// Sonuç dosyasını yollar. Yol doğrulaması FileStore.Resolve'da — dizin dolaşımı ve
    /// "bize ait olmayan yol" burada tekrar kontrol edilmez.
    /// Kayıtta dosya yoksa (bugün her zaman böyle: yükleme arayüzü henüz yok) 404.
    /// </summary>
    internal static IResult SendFile(ResultFileStore store, string filePath)
    {
        var full = store.Resolve(filePath);
        if (full is null) return Results.NotFound();
        var mime = Mime.TryGetContentType(full, out var ct) ? ct : "application/octet-stream";
        return Results.File(full, mime);
    }

    /// <summary>
    /// Bir hastanın tüm sonuçları, tek gövde şeklinde. Hasta, doktor ve admin uçlarının
    /// üçü de bunu çağırır — sonuç JSON'unun şekli tek yerde tanımlı.
    /// </summary>
    internal static async Task<object> LoadAsync(AppDb db, int patientId, CancellationToken ct)
    {
        var labs = await db.LabResults.AsNoTracking()
            .Include(r => r.Doctor).Include(r => r.Values)
            .Where(r => r.PatientId == patientId)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync(ct);

        var imaging = await db.ImagingStudies.AsNoTracking()
            .Include(s => s.Doctor)
            .Where(s => s.PatientId == patientId)
            .OrderByDescending(s => s.RequestedAt)
            .ToListAsync(ct);

        return new
        {
            labs = labs.Select(r => new
            {
                r.Id,
                r.PatientId,
                r.DoctorId,
                DoctorName = r.Doctor?.Name ?? "",
                r.AppointmentId,
                r.PanelName,
                Status = r.Status.ToString(),
                r.RequestedAt,
                r.ReportedAt,
                r.DoctorNote,
                r.FilePath,
                Values = r.Values.Select(v => new { v.Id, v.TestName, v.Value, v.Unit, v.RefLow, v.RefHigh }),
            }),
            imaging = imaging.Select(s => new
            {
                s.Id,
                s.PatientId,
                s.DoctorId,
                DoctorName = s.Doctor?.Name ?? "",
                s.AppointmentId,
                s.Modality,
                s.BodyPart,
                Status = s.Status.ToString(),
                s.RequestedAt,
                s.ReportedAt,
                s.ReportText,
                s.FilePath,
            }),
        };
    }
}
