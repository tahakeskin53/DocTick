using System;
using System.IO;
using System.Security.Cryptography;

namespace DocTick.Api.Services;

public class PhotoStore(string dir) : FileStore(dir, "/uploads/doctors/")
{
    public new const string UrlPrefix = "/uploads/doctors/";
}

// Tıbbi sonuç dosyaları. Önek boş: kaydedilen değer bir URL değil, yalnızca dosya adı —
// bu dosyalar statik servis edilmediği için tarayıcının çözebileceği bir yolu yok.
public class ResultFileStore(string dir) : FileStore(dir, "");

public class FileStore(string dir, string urlPrefix)
{
    public const int MaxBytes = 5 * 1024 * 1024;
    public string UrlPrefix { get; } = urlPrefix;

    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF];

    public static string? SniffExt(ReadOnlySpan<byte> b) =>
        b.Length >= 4 && b[..4].SequenceEqual("%PDF"u8) ? ".pdf"
        : b.Length >= 4 && b[..4].SequenceEqual(Png) ? ".png"
        : b.Length >= 3 && b[..3].SequenceEqual(Jpeg) ? ".jpg"
        : b.Length >= 12 && b[..4].SequenceEqual("RIFF"u8) && b[8..12].SequenceEqual("WEBP"u8) ? ".webp"
        : b.Length >= 4 && b[..4].SequenceEqual("GIF8"u8) ? ".gif"
        : null;

    public static byte[]? DecodeDataUrl(string dataUrl)
    {
        if (string.IsNullOrWhiteSpace(dataUrl)) return null;
        
        int commaIndex = dataUrl.IndexOf(',');
        if (commaIndex == -1) return null;
        
        string header = dataUrl[..commaIndex];
        if (!header.StartsWith("data:", StringComparison.OrdinalIgnoreCase) || !header.Contains(";base64", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }
        
        string base64Payload = dataUrl[(commaIndex + 1)..];
        try
        {
            byte[] bytes = Convert.FromBase64String(base64Payload);
            if (bytes.Length > MaxBytes) return null;
            return bytes;
        }
        catch
        {
            return null;
        }
    }

    public string Save(int entityId, byte[] bytes, string ext, string oldUrl)
    {
        Directory.CreateDirectory(dir);

        // Delete old photo if it exists and is ours
        Delete(oldUrl);

        // Generate a random suffix: {entityId}-{8 hex}{ext}
        string randomHex = Convert.ToHexString(RandomNumberGenerator.GetBytes(4)).ToLowerInvariant();
        string filename = $"{entityId}-{randomHex}{ext}";
        string fullPath = Path.Combine(dir, filename);

        File.WriteAllBytes(fullPath, bytes);

        return $"{UrlPrefix}{filename}";
    }

    /// <summary>
    /// Kaydedilmiş değeri diskteki tam yola çevirir. Bize ait olmayan, dizin dışına çıkmaya
    /// çalışan veya dosyası bulunmayan girdilerde null döner.
    /// Hem silme hem indirme buradan geçer — yol doğrulaması tek yerde.
    /// </summary>
    public string? Resolve(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        if (UrlPrefix != "" && !url.StartsWith(UrlPrefix, StringComparison.OrdinalIgnoreCase)) return null;

        string filename = url[UrlPrefix.Length..];
        // Dizin dolaşımı koruması: dosya adı düz bir ad olmalı.
        if (filename.Contains('/') || filename.Contains('\\') || filename.Contains("..")) return null;

        string fullPath = Path.Combine(dir, filename);
        return File.Exists(fullPath) ? fullPath : null;
    }

    public void Delete(string url)
    {
        var fullPath = Resolve(url);
        if (fullPath is null) return;
        try
        {
            File.Delete(fullPath);
        }
        catch
        {
            // Ignore deletion errors
        }
    }
}
