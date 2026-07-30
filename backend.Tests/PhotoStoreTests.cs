using System;
using System.IO;
using System.Text;
using DocTick.Api.Services;
using Xunit;

namespace DocTick.Api.Tests;

public class PhotoStoreTests : IDisposable
{
    private readonly string _tempDir;

    public PhotoStoreTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "DocTickTests_" + Guid.NewGuid().ToString("N"));
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
        {
            try { Directory.Delete(_tempDir, true); } catch {}
        }
    }

    [Fact]
    public void SniffExt_Recognizes_Formats()
    {
        // PNG magic byte
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x00, 0x00];
        Assert.Equal(".png", PhotoStore.SniffExt(png));

        // JPEG magic byte
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00];
        Assert.Equal(".jpg", PhotoStore.SniffExt(jpeg));

        // WebP magic byte
        byte[] webp = Encoding.ASCII.GetBytes("RIFF\x00\x00\x00\x00WEBPvp8 ");
        Assert.Equal(".webp", PhotoStore.SniffExt(webp));

        // GIF magic byte
        byte[] gif = Encoding.ASCII.GetBytes("GIF89a\x00\x00");
        Assert.Equal(".gif", PhotoStore.SniffExt(gif));

        // Unknown
        byte[] unknown = Encoding.ASCII.GetBytes("ABCD");
        Assert.Null(PhotoStore.SniffExt(unknown));
    }

    [Fact]
    public void SniffExt_Prefers_MagicBytes_Over_MimeHeader()
    {
        // Girdi: data:image/png;base64, ama içinde JPEG byte'ları var
        byte[] fakePngBytes = [0xFF, 0xD8, 0xFF];
        string dataUrl = "data:image/png;base64," + Convert.ToBase64String(fakePngBytes);

        var decoded = PhotoStore.DecodeDataUrl(dataUrl);
        Assert.NotNull(decoded);

        var ext = PhotoStore.SniffExt(decoded);
        Assert.Equal(".jpg", ext); // image/png etiketine güvenilmez, magic byte ile .jpg olmalı
    }

    [Fact]
    public void DecodeDataUrl_Limits_Size_To_5MB()
    {
        // 5 MB + 1 byte
        byte[] largeBytes = new byte[PhotoStore.MaxBytes + 1];
        string dataUrl = "data:image/png;base64," + Convert.ToBase64String(largeBytes);

        var decoded = PhotoStore.DecodeDataUrl(dataUrl);
        Assert.Null(decoded);
    }

    [Fact]
    public void Save_Generates_UniqueNames_And_CleansUp_OldUrl()
    {
        var store = new PhotoStore(_tempDir);

        byte[] pngBytes = [0x89, 0x50, 0x4E, 0x47];
        
        // Save first photo
        string url1 = store.Save(1, pngBytes, ".png", "");
        Assert.StartsWith(PhotoStore.UrlPrefix + "1-", url1);
        Assert.EndsWith(".png", url1);

        string filename1 = url1[PhotoStore.UrlPrefix.Length..];
        string fullPath1 = Path.Combine(_tempDir, filename1);
        Assert.True(File.Exists(fullPath1));

        // Save second photo, passing the first url as oldUrl to be cleaned up
        string url2 = store.Save(1, pngBytes, ".png", url1);
        Assert.NotEqual(url1, url2);
        Assert.True(File.Exists(Path.Combine(_tempDir, url2[PhotoStore.UrlPrefix.Length..])));
        Assert.False(File.Exists(fullPath1)); // should be deleted
    }

    [Fact]
    public void Delete_DoesNot_Touch_External_Urls()
    {
        var store = new PhotoStore(_tempDir);
        // Should not throw or do anything
        store.Delete("https://images.unsplash.com/photo-12345");
    }
}
