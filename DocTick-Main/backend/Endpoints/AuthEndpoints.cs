using System.Security.Claims;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Auth;
using DocTick.Api.Models;

namespace DocTick.Api.Endpoints;

public record AuthResponse(int Id, string Email, string Name, string Role, string Status);

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app, IConfiguration cfg)
    {
        var grp = app.MapGroup("/api/auth").WithTags("Auth");

        grp.MapPost("/google", async (GoogleLoginRequest req, AppDb db, HttpContext ctx) =>
        {
            var clientId = cfg["Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
                return Results.Problem("Google Client ID yapılandırılmamış.", statusCode: 500);

            // ID token'ı Google'da doğrula — imza + audience (bizim ClientId) kontrol edilir.
            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(req.Credential,
                    new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId } });
            }
            catch
            {
                return Results.Unauthorized();
            }

            var adminEmail = (cfg["Admin:Email"] ?? "").Trim().ToLowerInvariant();

            // Varlığı bul veya oluştur.
            var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSub == payload.Subject);
            if (user is null)
            {
                var isAdmin = (payload.Email ?? "").Trim().ToLowerInvariant() == adminEmail && adminEmail.Length > 0;
                user = new User
                {
                    GoogleSub = payload.Subject,
                    Email = payload.Email ?? "",
                    Name = string.IsNullOrWhiteSpace(payload.Name) ? (payload.Email ?? "Kullanıcı") : payload.Name,
                    Role = isAdmin ? UserRole.Admin : UserRole.Patient,
                    Status = isAdmin ? UserStatus.Active : UserStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            else if (adminEmail.Length > 0 && user.Email.Equals(adminEmail, StringComparison.OrdinalIgnoreCase) && user.Role != UserRole.Admin)
            {
                // İlk kurulumdan sonra admin e-postası eşleşirse yükselt.
                user.Role = UserRole.Admin;
                user.Status = UserStatus.Active;
                await db.SaveChangesAsync();
            }

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

            return Results.Ok(ToDto(user));
        });

        grp.MapGet("/me", async (ClaimsPrincipal p, AppDb db, CancellationToken ct) =>
        {
            if (p.Identity?.IsAuthenticated != true) return Results.Unauthorized();
            // DB'den güncel durum/rol — admin onayı/reddi oturum süresince anında yansır.
            var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == CurrentUser.Uid(p), ct);
            return u is null ? Results.Unauthorized() : Results.Ok(ToDto(u));
        });

        grp.MapPost("/logout", async (HttpContext ctx) =>
        {
            await ctx.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok();
        });

        return app;
    }

    private static AuthResponse ToDto(User u) =>
        new(u.Id, u.Email, u.Name, u.Role.ToString(), u.Status.ToString());
}

public record GoogleLoginRequest(string Credential);
