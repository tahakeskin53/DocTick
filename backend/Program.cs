using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using DocTick.Api.Endpoints;
using DocTick.Api.Models;
using DocTick.Api.Services;

var builder = WebApplication.CreateBuilder(args);

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

// --- Yanıt sıkıştırma ---
// Linux App Service'te uygulama doğrudan Kestrel; gzip yapan bir ön uç YOK — burada açılmazsa
// 542 KB JS ham gider. text/javascript ve image/svg+xml varsayılan listede yok, elle ekleniyor.
// JSON bilerek dışarıda: yanıtlar zaten küçük, HTTPS+cookie ile sıkıştırma riski gereksiz.
builder.Services.AddResponseCompression(o =>
{
    o.EnableForHttps = true; // varsayılan false; site tamamen HTTPS
    o.MimeTypes = new[] { "text/javascript", "text/css", "text/html", "image/svg+xml", "application/manifest+json" };
});

// --- OpenAPI + Scalar ---
builder.Services.AddOpenApi();

var app = builder.Build();

// --- SPA statik servis (üretim: frontend/dist → wwwroot; dev'de Vite 5173 kullanılır) ---
// Statik dosyalar auth boru hattından önce — uygulama kabuğu herkese açık.
app.UseResponseCompression(); // UseStaticFiles'tan ÖNCE olmalı — sonra gelirse yanıt çoktan yazılmış olur
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // SW, giriş HTML'i ve manifest asla önbelleklenmesin — PWA güncellemeleri gecikmesin.
        if (ctx.File.Name is "sw.js" or "index.html" or "manifest.webmanifest" or "registerSW.js")
            ctx.Context.Response.Headers.CacheControl = "no-cache";
        // /assets/* dosya adı içerik hash'i taşır (Vite) — içerik değişirse ad değişir.
        // Sonsuza dek önbelleklenebilir; aksi hâlde her ziyarette boşuna 304 turu atılıyordu.
        else if (ctx.Context.Request.Path.StartsWithSegments("/assets"))
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
    }
});

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
    await DbSeeder.SeedAsync(db, adminEmail);
}

app.Run();
