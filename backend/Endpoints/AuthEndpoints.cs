using System.Security.Claims;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Auth;
using DocTick.Api.Models;

namespace DocTick.Api.Endpoints;

public record AuthResponse(
    int Id, string Email, string Name, string FirstName, string LastName, string PhoneNumber,
    string IdentityNumber, string DateOfBirth, string Gender, string BloodType,
    string EmergencyContactName, string EmergencyContactPhone,
    string Role, string Status,
    // Doktor rolündeki kullanıcının bağlandığı Doctor kaydının adı ("Uzm. Dr. Ayşe Demir").
    // Google hesabındaki ad ile aynı olmak zorunda değil — doktor panelinde bağlayıcı olan budur.
    string DoctorName);

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app, IConfiguration cfg)
    {
        var grp = app.MapGroup("/api/auth").WithTags("Auth");

        grp.MapPost("/google", async (GoogleLoginRequest req, AppDb db, HttpContext ctx, UserGate gate) =>
        {
            var clientId = cfg["Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
            {
                AuditLog.Event(ctx, "config_error", "Google:ClientId missing");
                return Results.Problem("Google Client ID yapılandırılmamış.", statusCode: 500);
            }

            // ID token'ı Google'da doğrula — imza + audience (bizim ClientId) kontrol edilir.
            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(req.Credential,
                    new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId } });
            }
            catch (Exception ex)
            {
                AuditLog.Event(ctx, "token_invalid", ex.Message);
                return Results.Unauthorized();
            }

            var adminEmail = (cfg["Admin:Email"] ?? "").Trim().ToLowerInvariant();
            // Admin onayı beklemeden Active gelecek e-postalar (config: Approved:Emails).
            var approvedEmails = cfg.GetSection("Approved:Emails").Get<string[]>() ?? Array.Empty<string>();
            var loginEmail = (payload.Email ?? "").Trim().ToLowerInvariant();
            var isPreApproved = approvedEmails.Any(e => e.Trim().ToLowerInvariant() == loginEmail) && loginEmail.Length > 0;

            // Varlığı bul veya oluştur.
            var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSub == payload.Subject);
            if (user is null)
            {
                var isAdmin = loginEmail == adminEmail && adminEmail.Length > 0;
                var fullName = string.IsNullOrWhiteSpace(payload.Name) ? (payload.Email ?? "Kullanıcı") : payload.Name;
                var nameParts = fullName.Trim().Split(' ', 2);
                user = new User
                {
                    GoogleSub = payload.Subject,
                    Email = payload.Email ?? "",
                    Name = fullName,
                    FirstName = nameParts[0],
                    LastName = nameParts.Length > 1 ? nameParts[1] : "",
                    PhoneNumber = "",
                    Role = isAdmin ? UserRole.Admin : UserRole.Patient,
                    Status = (isAdmin || isPreApproved) ? UserStatus.Active : UserStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            else if (user.Email.Equals(adminEmail, StringComparison.OrdinalIgnoreCase) && user.Role != UserRole.Admin)
            {
                // İlk kurulumdan sonra admin e-postası eşleşirse yükselt.
                user.Role = UserRole.Admin;
                user.Status = UserStatus.Active;
                await db.SaveChangesAsync();
            }
            else if (isPreApproved && user.Status != UserStatus.Active)
            {
                // Önceden Pending kaldıysa, onaylı listeye eklenince otomatik Active yap.
                user.Status = UserStatus.Active;
                await db.SaveChangesAsync();
            }

            // Yukarıdaki iki dal Status/Role değiştirebiliyor (admin yükseltme, ön-onaylı aktivasyon).
            // Tek noktada geçersiz kıl: dal başına ayrı çağrıdan kısa ve biri unutulamaz.
            // Yeni kullanıcıda önbellekte kayıt yok — Remove zararsız no-op.
            gate.Invalidate(user.Id);

            var claims = new List<Claim>
            {
                new(ClaimTypes2.Uid, user.Id.ToString()),
                new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes2.Role, user.Role.ToString()),
                new(ClaimTypes2.Status, user.Status.ToString()),
            };
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            await ctx.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7) });

            // Giriş anında ctx.User henüz dolmaz (SignInAsync yalnız cookie yazar) — e-postayı burada geç.
            AuditLog.Event(ctx, "login_success", user.Email);
            return Results.Ok(ToDto(user, await DoctorNameAsync(db, user, ctx.RequestAborted)));
        });

        grp.MapGet("/me", async (ClaimsPrincipal p, AppDb db, CancellationToken ct) =>
        {
            if (p.Identity?.IsAuthenticated != true) return Results.Unauthorized();
            // DB'den güncel durum/rol — admin onayı/reddi oturum süresince anında yansır.
            var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == CurrentUser.Uid(p), ct);
            return u is null ? Results.Unauthorized() : Results.Ok(ToDto(u, await DoctorNameAsync(db, u, ct)));
        });

        grp.MapPost("/logout", async (HttpContext ctx) =>
        {
            await ctx.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok();
        });

        grp.MapPut("/profile", async (UpdateProfileRequest req, ClaimsPrincipal p, AppDb db, HttpContext ctx, CancellationToken ct) =>
        {
            if (p.Identity?.IsAuthenticated != true) return Results.Unauthorized();

            var firstName = (req.FirstName ?? "").Trim();
            var lastName = (req.LastName ?? "").Trim();
            var phone = (req.PhoneNumber ?? "").Trim();
            var tcNo = (req.IdentityNumber ?? "").Trim();
            var dob = (req.DateOfBirth ?? "").Trim();
            var gender = (req.Gender ?? "").Trim();
            var bloodType = (req.BloodType ?? "").Trim();
            var emName = (req.EmergencyContactName ?? "").Trim();
            var emPhone = (req.EmergencyContactPhone ?? "").Trim();

            if (firstName.Length is 0 or > 50) return Results.BadRequest("Ad 1-50 karakter olmalı.");
            if (lastName.Length is 0 or > 50) return Results.BadRequest("Soyad 1-50 karakter olmalı.");
            if (phone.Length > 20) return Results.BadRequest("Telefon numarası en fazla 20 karakter olmalı.");
            if (tcNo.Length > 11) return Results.BadRequest("T.C. Kimlik Numarası en fazla 11 hane olmalı.");
            if (emPhone.Length > 20) return Results.BadRequest("Acil durum telefon numarası en fazla 20 karakter olmalı.");

            var uid = CurrentUser.Uid(p);
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == uid, ct);
            if (user is null) return Results.Unauthorized();

            user.FirstName = firstName;
            user.LastName = lastName;
            user.Name = $"{firstName} {lastName}".Trim();
            user.PhoneNumber = phone;
            user.IdentityNumber = tcNo;
            user.DateOfBirth = dob;
            user.Gender = gender;
            user.BloodType = bloodType;
            user.EmergencyContactName = emName;
            user.EmergencyContactPhone = emPhone;
            await db.SaveChangesAsync(ct);

            var claims = new List<Claim>
            {
                new(ClaimTypes2.Uid, user.Id.ToString()),
                new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes2.Role, user.Role.ToString()),
                new(ClaimTypes2.Status, user.Status.ToString()),
            };
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            await ctx.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7) });

            // Profil kaydından sonra da doktor adı taşınmalı — aksi hâlde başlık boşalırdı.
            return Results.Ok(ToDto(user, await DoctorNameAsync(db, user, ct)));
        });

        return app;
    }

    /// <summary>
    /// Kullanıcı bir Doctor kaydına bağlıysa o kaydın adını getirir, değilse boş string.
    /// ToDto senkron olduğu için isim çağrı yerinde çözülüp içeri verilir.
    /// </summary>
    private static async Task<string> DoctorNameAsync(AppDb db, User u, CancellationToken ct) =>
        u.DoctorId is int did
            ? await db.Doctors.AsNoTracking().Where(d => d.Id == did).Select(d => d.Name).FirstOrDefaultAsync(ct) ?? ""
            : "";

    private static AuthResponse ToDto(User u, string doctorName = "")
    {
        var fn = u.FirstName;
        var ln = u.LastName;
        if (string.IsNullOrWhiteSpace(fn) && string.IsNullOrWhiteSpace(ln) && !string.IsNullOrWhiteSpace(u.Name))
        {
            var parts = u.Name.Trim().Split(' ', 2);
            fn = parts[0];
            ln = parts.Length > 1 ? parts[1] : "";
        }
        return new(
            u.Id, u.Email, u.Name, fn, ln, u.PhoneNumber ?? "",
            u.IdentityNumber ?? "", u.DateOfBirth ?? "", u.Gender ?? "", u.BloodType ?? "",
            u.EmergencyContactName ?? "", u.EmergencyContactPhone ?? "",
            u.Role.ToString(), u.Status.ToString(), doctorName);
    }
}

public record GoogleLoginRequest(string Credential);
public record UpdateProfileRequest(
    string FirstName, string LastName, string? PhoneNumber,
    string? IdentityNumber, string? DateOfBirth, string? Gender, string? BloodType,
    string? EmergencyContactName, string? EmergencyContactPhone);



