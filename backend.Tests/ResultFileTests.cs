using DocTick.Api.Endpoints;
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

    // ---- Yükleme tür kısıtı ----
    // Tahlile PDF, görüntülemeye görsel. Karar dosya ADINDAN değil ilk baytlarından
    // veriliyor; adı .pdf olan bir JPEG geçmemeli.

    private static string DataUrl(byte[] bytes, string mime) =>
        $"data:{mime};base64,{Convert.ToBase64String(bytes)}";

    private static readonly byte[] Pdf = "%PDF-1.4 sahte icerik"u8.ToArray();
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    [Fact]
    public void Tahlil_PdfKabulEder()
    {
        var (err, path) = DoctorEndpoints.SaveUpload(Store(), 7, DataUrl(Pdf, "application/pdf"), DoctorEndpoints.LabExts, "PDF");
        Assert.Null(err);
        Assert.EndsWith(".pdf", path);
    }

    // MIME başlığı "application/pdf" diyor ama içerik PNG — baytlar kazanmalı.
    [Fact]
    public void Tahlil_PdfKilikliGorseli_Reddeder()
    {
        var (err, path) = DoctorEndpoints.SaveUpload(Store(), 7, DataUrl(Png, "application/pdf"), DoctorEndpoints.LabExts, "PDF");
        Assert.NotNull(err);
        Assert.Null(path);
    }

    [Fact]
    public void Goruntuleme_GorselKabulEder()
    {
        var (err, path) = DoctorEndpoints.SaveUpload(Store(), 7, DataUrl(Png, "image/png"), DoctorEndpoints.ImagingExts, "gorsel");
        Assert.Null(err);
        Assert.EndsWith(".png", path);
    }

    [Fact]
    public void Goruntuleme_PdfiReddeder()
    {
        var (err, _) = DoctorEndpoints.SaveUpload(Store(), 7, DataUrl(Pdf, "image/png"), DoctorEndpoints.ImagingExts, "gorsel");
        Assert.NotNull(err);
    }

    // Dosya göndermemek hata değil — ek dosya isteğe bağlı.
    [Fact]
    public void DosyaYok_HataDegil()
    {
        var (err, path) = DoctorEndpoints.SaveUpload(Store(), 7, null, DoctorEndpoints.LabExts, "PDF");
        Assert.Null(err);
        Assert.Null(path);
    }

    // Tanınmayan içerik (ne PDF ne görsel) her iki kapıdan da geçmemeli.
    [Fact]
    public void TaninmayanIcerik_Reddedilir()
    {
        var junk = DataUrl("MZ\0\0 calistirilabilir"u8.ToArray(), "application/pdf");
        Assert.NotNull(DoctorEndpoints.SaveUpload(Store(), 7, junk, DoctorEndpoints.LabExts, "PDF").Error);
        Assert.NotNull(DoctorEndpoints.SaveUpload(Store(), 7, junk, DoctorEndpoints.ImagingExts, "gorsel").Error);
    }
}
