using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using DocTick.Api.Models;

namespace DocTick.Api.Auth;

// Yetki denetimi (ActiveGuard) her API çağrısında kullanıcıyı DB'den okuyordu; SQLite prod'da
// Azure Files (SMB) üzerinde olduğu için bu istek başına ekstra ağ turu demekti.
// Kısa TTL + onay/red/silmede anında invalidasyon: yetki değişikliği yine anında yansır,
// istek başına sorgu gider.
public sealed class UserGate(AppDb db, IMemoryCache cache)
{
    // ponytail: 15 sn üst sınır. Invalidate çağrılmayan bir yol kalırsa bayatlık en fazla bu kadar sürer.
    static readonly TimeSpan Ttl = TimeSpan.FromSeconds(15);

    static string Key(int uid) => $"user-gate:{uid}";

    public async Task<User?> GetAsync(int uid, CancellationToken ct = default)
    {
        if (cache.TryGetValue(Key(uid), out User? hit)) return hit;
        var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == uid, ct);
        cache.Set(Key(uid), u, Ttl); // null da önbelleklenir — silinmiş kullanıcı için tur atmayalım
        return u;
    }

    public void Invalidate(int uid) => cache.Remove(Key(uid));
}
