namespace DocTick.Api.Tests;

// Önceden sıkıştırılmış varlıkların MIME çözümü (Program.cs → BrotliContentTypeProvider).
// Bu bozulursa StaticFileMiddleware .br dosyasını "bilinmeyen tür" sayıp 404 döner ve site
// tüm JS'ini kaybeder. Sessiz bir yavaşlama değil, gürültülü bir kırılma — testi hak ediyor.
public class BrotliContentTypeProviderTests
{
    [Fact]
    public void Strips_Br_Suffix_And_Resolves_Real_Type()
    {
        var p = new BrotliContentTypeProvider();

        Assert.True(p.TryGetContentType("index-abc123.js.br", out var js));
        Assert.Equal("text/javascript", js);

        Assert.True(p.TryGetContentType("index-abc123.css.br", out var css));
        Assert.Equal("text/css", css);

        // .br olmayan yollar aynen davranmalı — provider tüm statik dosyalar için geçerli.
        Assert.True(p.TryGetContentType("index.html", out var html));
        Assert.Equal("text/html", html);

        // Gerçekten bilinmeyen uzantı hâlâ reddedilmeli; ".br soyma" her şeyi geçirmemeli.
        Assert.False(p.TryGetContentType("veri.qqq", out _));
    }
}
