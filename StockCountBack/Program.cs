using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using StockCountBack.Data;
using StockCountBack.Services;
using StockCountBack.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddOpenApi();

// Database
builder.Services.AddDbContext<StockCountDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("AlmSqlServer"))
           .EnableSensitiveDataLogging()
           .LogTo(Console.WriteLine, LogLevel.Information));

// Services
builder.Services.AddSingleton<IAuthService, AuthService>();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true, // Strictly validate token expiration
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero // No tolerance for expired tokens
        };

        // Support JWT from cookie
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.ContainsKey("jwt"))
                {
                    context.Token = context.Request.Cookies["jwt"];
                }
                // Also check Authorization header
                var authHeader = context.Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    context.Token = authHeader.Substring("Bearer ".Length).Trim();
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                // If token is expired, return 401 immediately
                if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                {
                    context.Response.Headers["Token-Expired"] = "true";
                    context.Response.StatusCode = 401;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .WithExposedHeaders("X-New-Token", "Token-Expired"); // Expose token headers
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Seed database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<StockCountDbContext>();
    var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
    
    try
    {
        // Ensure database is created
        dbContext.Database.EnsureCreated();
        
        // Seed admin user
        await DatabaseSeeder.SeedAdminUser(dbContext, authService);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️  Error during database setup: {ex.Message}");
    }
}

app.UseCors("AllowFrontend");
app.UseAuthentication();

// JWT Auto-refresh middleware
app.UseMiddleware<StockCountBack.Middleware.JwtRefreshMiddleware>();

app.UseAuthorization();

// Map endpoints
app.MapAuthEndpoints();
app.MapWarehouseEndpoints();
app.MapLocationEndpoints();
app.MapBinMappingEndpoints();
app.MapUserEndpoints();
app.MapCountPersonEndpoints();
app.MapFreezeDataEndpoints();
app.MapCountingEndpoints();
app.MapDashboardEndpoints();

// Health check
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.Now }));

app.Run();
