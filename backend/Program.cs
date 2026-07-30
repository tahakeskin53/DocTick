using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using DocTick.Api.Auth;
using DocTick.Api.Endpoints;
using DocTick.Api.Models;
using DocTick.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Azure Key Vault entegrasyonu (isteğe bağlı) ---
// Eğer AZURE_KEYVAULT_URI ortam değişkeni ayarlıysa, uygulama başlarken
// Key Vault içeriğini konfigürasyona ekler. Böylece gizli anahtarlar
// appsettings.json içinde saklanmaz; production için tavsiye edilen yol bu.
builder.Host.ConfigureAppConfiguration((context, config) =>
{
    var kv = Environment.GetEnvironmentVariable("AZURE_KEYVAULT_URI");
    if (!string.IsNullOrEmpty(kv))
    {
        try
        {
            // Requires Azure.Extensions.AspNetCore.Configuration.Secrets + Azure.Identity paketleri
            config.AddAzureKeyVault(new Uri(kv), new Azure.Identity.DefaultAzureCredential());
        }
        catch (Exception ex)
        {
            // Konfigürasyon aşamasında hata olsa bile startup devam etsin; hata loglanır.
            var lf = LoggerFactory.Create(lb => lb.AddConsole());
            lf.CreateLogger("Program").LogError(ex, "Azure Key Vault eklenemedi: {Message}", ex.Message);
        }
    }
});

// --- Veritabanı ---
var conn = builder.Configuration.GetConnectionString("Default") ?? "Data Source=doctick.db";
builder.Services.AddDbContext<AppDb>(o => o.UseSqlite(conn));

// --- E-posta (Resend) ---
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Resend"));
builder.Services.AddHttpClient("resend");
builder.Services.AddSingleton<EmailService>();
builder.Services.AddHostedService<ReminderService>();

// --- Kimlik doğrulama (cookie) ---
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "DocTick.Auth";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Lax; // Vite proxy sayesinde aynı köken — Lax yeterli.
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Secure bayrağı her zaman — prod'da açık hat üzerinden çalınmayı engeller. Localhost secure sayılır, dev kırılmaz.
        o.ExpireTimeSpan = TimeSpan.FromDays(7);
        // API için yönlendirme yerine 401/403 döndür.
        o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
        o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; };
    });

builder.Services.AddAuthorization();

// Yetki denetimi önbelleği — ActiveGuard'ın istek başına DB turunu kaldırır (bkz. UserGate).
builder.Services.AddMemoryCache();
builder.Services.AddScoped<UserGate>();

// --- Yanıt sıkıştırma ---
// Linux App Service'te uygulama doğrudan Kestrel; gzip yapan bir ön uç YOK — burada açılmazsa
// 542 KB JS ham gider. text/javascript ve image/svg+xml varsayılan listede yok, elle ekleniyor.
// JSON bilerek dışarıda: yanıtlar zaten küçük, HTTPS+cookie ile sıkıştırma riski gereksiz.
builder.Services.AddResponseCompression(o =>
{
    o.EnableForHttps = true; // varsayılan false; site tamamen HTTPS
    o.MimeTypes = new[] { "text/javascript", "text/css", "text/html", "image/svg+xml", "application/manifest+json" };
});

// --- Statik dosya önbellek politikası ---
// DI'a kaydediliyor, UseStaticFiles'a inline verilmiyor: MapFallbackToFile (SPA derin linkleri)
// ayarı DI'dan okur. Inline verildiğinde /login, /randevularim ve kök yol fallback üzerinden
// gelip no-cache'siz kalıyordu — bayat index.html, immutable /assets ile birlikte kullanıcıyı
// eski hash'lere kilitler ve deploy'lar ulaşmaz.
builder.Services.Configure<StaticFileOptions>(o =>
{
    // ".br" MIME listesinde yok; provider olmadan StaticFileMiddleware önceden sıkıştırılmış
    // dosyayı "bilinmeyen tür" sayıp 404 döndürür.
    o.ContentTypeProvider = new BrotliContentTypeProvider();
    o.OnPrepareResponse = ctx =>
    {
        // SW, giriş HTML'i ve manifest asla önbelleklenmesin — PWA güncellemeleri gecikmesin.
        if (ctx.File.Name is "sw.js" or "index.html" or "manifest.webmanifest" or "registerSW.js")
            ctx.Context.Response.Headers.CacheControl = "no-cache";
        // /assets/* dosya adı içerik hash'i taşır (Vite) — içerik değişirse ad değişir.
        // Sonsuza dek önbelleklenebilir; aksi hâlde her ziyarette boşuna 304 turu atılıyordu.
        else if (ctx.Context.Request.Path.StartsWithSegments("/assets"))
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
    };
});

// --- OpenAPI + Scalar ---
builder.Services.AddOpenApi();

var app = builder.Build();

// --- SPA statik servis (üretim: frontend/dist → wwwroot; dev'de Vite 5173 kullanılır) ---
// Statik dosyalar auth boru hattından önce — uygulama kabuğu herkese açık.
app.UseResponseCompression(); // UseStaticFiles'tan ÖNCE olmalı — sonra gelirse yanıt çoktan yazılmış olur

// Önceden sıkıştırılmış varlık: /assets/x.js istenir, x.js.br varsa onu gönder.
// .br/.gz dosyalarını `dotnet publish` kendisi üretir (.NET statik varlık sıkıştırması) —
// kalite 11, ~150 KB. Çalışma anındaki hız öncelikli sıkıştırma aynı dosya için ~224 KB.
// Not: dosyalar yalnızca publish çıktısında var; `dotnet run` ile geliştirmede .br yoktur,
// o zaman aşağıdaki koşul eşleşmez ve çalışma anı sıkıştırması devreye girer.
// Content-Encoding'i burada set etmek ResponseCompression'ı da devre dışı bırakır (zaten kodlanmış
// yanıtı ikinci kez sıkıştırmaz). .br yoksa hiçbir şey yapmayız, çalışma anı sıkıştırmasına düşer.
app.Use(async (ctx, next) =>
{
    var path = ctx.Request.Path.Value;
    if (path is not null
        && path.StartsWith("/assets/", StringComparison.Ordinal)
        && ctx.Request.Headers.AcceptEncoding.ToString().Contains("br", StringComparison.Ordinal)
        && app.Environment.WebRootFileProvider.GetFileInfo(path + ".br").Exists)
    {
        ctx.Request.Path = path + ".br";
        ctx.Response.Headers.ContentEncoding = "br";
        ctx.Response.Headers.Vary = "Accept-Encoding"; // ara önbellekler kodlanmışı kodsuza servis etmesin
    }
    await next();
});

app.UseDefaultFiles();
app.UseStaticFiles(); // seçenekler DI'dan (yukarıdaki Configure<StaticFileOptions>)

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                              // /openapi/v1.json
    app.MapScalarApiReference();                   // /scalar
}

// --- Uçlar ---
app.MapAuthEndpoints(builder.Configuration);
app.MapPublicEndpoints();
app.MapPatientEndpoints();
app.MapAdminEndpoints();

// Kök yol: prod'da SPA (wwwroot/index.html → UseDefaultFiles servis eder);
// dev'de wwwroot yoksa API sağlık mesajı. MapGet("/") UseDefaultFiles ile çakıştığı için
// yalnızca SPA yoksa kaydedilir — aksi halde kök yol index.html yerine bu mesajı döndürürdü.
var spaIndex = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "index.html");
if (File.Exists(spaIndex))
{
    // SPA derin linkleri (ör. /randevularim) ve kök yol index.html'e düşer.
    app.MapFallbackToFile("index.html");
}
else
{
    app.MapGet("/", () => "DocTick API çalışıyor. /scalar üzerinden belgelere bakın.");
}

// --- Başlangıçta şema + seed ---
var adminEmail = builder.Configuration["Admin:Email"] ?? "";
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    db.Database.EnsureCreated();
    await DbSeeder.EnsureSchemaAsync(db);
    await DbSeeder.SeedAsync(db, adminEmail);
}


app.Run();

// ".br" kabuğunu soyup gerçek MIME'i bulur: index-abc.js.br -> text/javascript.
// Olmazsa StaticFileMiddleware bilinmeyen uzantıyı servis etmeyi reddeder (404).
public sealed class BrotliContentTypeProvider : IContentTypeProvider
{
    static readonly FileExtensionContentTypeProvider Inner = new();

    public bool TryGetContentType(string subpath, out string contentType) =>
        Inner.TryGetContentType(
            subpath.EndsWith(".br", StringComparison.Ordinal) ? subpath[..^3] : subpath,
            out contentType!);
}
