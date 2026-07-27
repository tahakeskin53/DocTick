using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Models;

namespace DocTick.Api.Auth;

// Claim anahtarları tek yerde.
public static class ClaimTypes2
{
    public const string Uid = "uid";
    public const string Role = "role";
    public const string Status = "status";
}

public static class CurrentUser
{
    public static int Uid(ClaimsPrincipal p) =>
        int.Parse(p.FindFirst(ClaimTypes2.Uid)?.Value ?? "0");
}

// Yetkiyi DB'den doğrular — claim stale olsa bile (ör. admin kullanıcıyı reddettikten sonra
// cookie'sindeki Status claim'i 7 gün Active kalır) güncel durumu esas alır.
// ponytail: policy/requirement/handler katmanı yerine tek filtre — claim tabanlı "Active"/"Admin"
// policy'leri Reddet→Aktif ve Onayla→Bekleyen geçişlerinde yanlış karar veriyordu; DB doğrulaması her ikisini de doğru çözer.
public static class ActiveGuard
{
    public static async ValueTask<object?> Patient(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDb>();
        var u = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == CurrentUser.Uid(ctx.HttpContext.User), ctx.HttpContext.RequestAborted);
        if (u is null || u.Status != UserStatus.Active) return Results.Forbid();
        return await next(ctx);
    }

    public static async ValueTask<object?> Admin(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDb>();
        var u = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == CurrentUser.Uid(ctx.HttpContext.User), ctx.HttpContext.RequestAborted);
        if (u is null || u.Role != UserRole.Admin) return Results.Forbid();
        return await next(ctx);
    }
}
