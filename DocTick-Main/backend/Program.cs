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

// --- OpenAPI + Scalar ---
builder.Services.AddOpenApi();

var app = builder.Build();

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

app.MapGet("/", () => "DocTick API çalışıyor. /scalar üzerinden belgelere bakın.");

// --- Başlangıçta şema + seed ---
var adminEmail = builder.Configuration["Admin:Email"] ?? "";
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    db.Database.EnsureCreated();
    await DbSeeder.SeedAsync(db, adminEmail);
}

app.Run();
