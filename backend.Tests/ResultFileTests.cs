using DocTick.Api.Services;

namespace DocTick.Api.Tests;

// Tıbbi sonuç dosyaları statik servis edilmiyor; tek erişim yolu yetkili API ucu.
// O ucun güvendiği tek şey FileStore.Resolve — dizin dışına çıkan veya bize ait olmayan
// her girdide null dönmeli. Burası kırılırsa hasta dosyaları yol dolaşımıyla okunabilir.
public class ResultFileTests : IDisposable
{
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "doctick-test-" + Guid.NewGuid().ToString("N"));

    public ResultFileTests() => Directory.CreateDirectory(_dir);

    public void Dispose()
    {
        try { Directory.Delete(_dir, recursive: true); } catch { /* temizlik hatası testi düşürmesin */ }
        GC.SuppressFinalize(this);
    }

    private ResultFileStore Store() => new(_dir);

    [Fact]
    public void KayitliDosya_Cozulur()
    {
        var saved = Store().Save(7, "%PDF-1.4 sahte"u8.ToArray(), ".pdf", "");
        // Önek boş: kaydedilen değer bir URL değil, düz dosya adı.
        Assert.DoesNotContain("/", saved);
        Assert.NotNull(Store().Resolve(saved));
    }

    [Theory]
    [InlineData("../../../etc/passwd")]
    [InlineData("..\\..\\Windows\\win.ini")]
    [InlineData("alt/klasor.pdf")]
    [InlineData("alt\\klasor.pdf")]
    public void DizinDolasimi_Reddedilir(string kotu) => Assert.Null(Store().Resolve(kotu));

    [Fact]
    public void BosDeger_Reddedilir()
    {
        Assert.Null(Store().Resolve(""));
        Assert.Null(Store().Resolve("   "));
    }

    // Kayıtta dosya adı var ama disk boş — bugünkü normal durum (yükleme arayüzü yok).
    // Uç bunu 404'e çevirir; Resolve'un null dönmesi o davranışın dayanağı.
    [Fact]
    public void OlmayanDosya_Reddedilir() => Assert.Null(Store().Resolve("7-deadbeef.pdf"));

    // Doktor fotoğrafları önekli; sonuç deposunun düz adı oraya sızmamalı.
    [Fact]
    public void FotoDeposu_OneksizDegeri_Reddeder()
    {
        var photos = new PhotoStore(_dir);
        Assert.Null(photos.Resolve("7-deadbeef.png"));               // önek yok
        Assert.Null(photos.Resolve("/uploads/doctors/../gizli.png")); // önek var ama dolaşım deniyor
    }
}
