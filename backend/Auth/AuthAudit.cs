using System.Text.Json;

namespace DocTick.Api.Auth;

// Auth olaylarını (login_success / token_invalid / config_error) kalıcı, grep'lenebilir
// bir JSONL dosyasına yazar: logs/auth-YYYY-MM-DD.log. Giriş hataları artık sessizce kaybolmaz.
public static class AuthAudit
{
    static readonly object _gate = new(); // ponytail: global lock, dev/düşük hacim için yeter; hacim artarsa kanal/kuyruk

    public static void Write(HttpContext ctx, string evt, string? email = null, string? reason = null)
    {
        var line = JsonSerializer.Serialize(new
        {
            ts = DateTime.UtcNow.ToString("o"),
            evt,
            email,
            reason,
            ip = ctx.Connection.RemoteIpAddress?.ToString(),
            ua = ctx.Request.Headers.UserAgent.ToString(),
        });
        var dir = Path.Combine(Directory.GetCurrentDirectory(), "logs"); // `dotnet run --project backend` → backend/logs
        lock (_gate)
        {
            Directory.CreateDirectory(dir);
            File.AppendAllText(Path.Combine(dir, $"auth-{DateTime.UtcNow:yyyy-MM-dd}.log"), line + "\n");
        }
    }
}
