using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace StockCountBack.Middleware;

public class JwtRefreshMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;

    public JwtRefreshMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Check if user is authenticated
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = context.Request.Cookies["jwt"] ?? 
                        context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (!string.IsNullOrEmpty(token) && tokenHandler.CanReadToken(token))
            {
                var jwtToken = tokenHandler.ReadJwtToken(token);
                var expiryTime = jwtToken.ValidTo;
                var timeUntilExpiry = expiryTime - DateTime.UtcNow;

                // If token is already expired, don't refresh - let authentication middleware handle it
                if (timeUntilExpiry.TotalSeconds <= 0)
                {
                    await _next(context);
                    return;
                }

                // If token expires in less than 4 hours, refresh it
                if (timeUntilExpiry.TotalHours < 4 && timeUntilExpiry.TotalHours > 0)
                {
                    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var userName = context.User.FindFirst(ClaimTypes.Name)?.Value;
                    var role = context.User.FindFirst(ClaimTypes.Role)?.Value;

                    if (!string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(userName) && !string.IsNullOrEmpty(role))
                    {
                        // Get AuthService from DI
                        var authService = context.RequestServices.GetRequiredService<Services.IAuthService>();
                        var jwtSettings = _configuration.GetSection("Jwt");
                        
                        var newToken = authService.GenerateJwtToken(
                            int.Parse(userId),
                            userName,
                            role,
                            jwtSettings["SecretKey"]!,
                            jwtSettings["Issuer"]!,
                            jwtSettings["Audience"]!
                        );

                        // Set new token in cookie
                        context.Response.Cookies.Append("jwt", newToken, new CookieOptions
                        {
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.Strict,
                            Expires = DateTimeOffset.UtcNow.AddHours(14)
                        });

                        // Also send in response header for client to update
                        context.Response.Headers["X-New-Token"] = newToken;
                    }
                }
            }
        }

        await _next(context);
    }
}
