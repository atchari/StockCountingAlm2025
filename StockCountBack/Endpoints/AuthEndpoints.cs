using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;
using StockCountBack.DTOs;
using StockCountBack.Models;
using StockCountBack.Services;
using System.Security.Claims;

namespace StockCountBack.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth");

        // Login
        auth.MapPost("/login", async ([FromBody] LoginRequest request, StockCountDbContext db, IAuthService authService, IConfiguration config) =>
        {
            var user = await db.NtfUsers.FirstOrDefaultAsync(u => u.UserName == request.UserName);
            
            if (user == null || user.UserPassword == null)
            {
                return Results.Unauthorized();
            }

            if (!authService.VerifyPassword(request.Password, user.UserPassword))
            {
                return Results.Unauthorized();
            }

            var token = authService.GenerateJwtToken(
                user.Id,
                user.UserName!,
                user.Role ?? "staff",
                config["Jwt:SecretKey"]!,
                config["Jwt:Issuer"]!,
                config["Jwt:Audience"]!
            );

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            };

            var response = new LoginResponse(user.Id, user.UserName!, user.FullName ?? "", user.Role ?? "staff", token);
            
            return Results.Ok(response);
        })
        .AllowAnonymous()
        .WithName("Login");

        // Register
        auth.MapPost("/register", async ([FromBody] RegisterRequest request, StockCountDbContext db, IAuthService authService) =>
        {
            if (await db.NtfUsers.AnyAsync(u => u.UserName == request.UserName))
            {
                return Results.BadRequest(new { error = "Username already exists" });
            }

            var newUser = new NtfUser
            {
                UserName = request.UserName,
                UserPassword = authService.HashPassword(request.Password),
                FullName = request.FullName,
                Role = request.Role,
                CreatedAt = DateTime.Now
            };

            db.NtfUsers.Add(newUser);
            await db.SaveChangesAsync();

            var userDto = new UserDto(newUser.Id, newUser.UserName, newUser.FullName, newUser.Role, newUser.CreatedAt);
            return Results.Created($"/api/users/{newUser.Id}", userDto);
        })
        .RequireAuthorization(policy => policy.RequireRole("admin"))
        .WithName("Register");

        // Change Password
        auth.MapPost("/change-password", async ([FromBody] ChangePasswordRequest request, ClaimsPrincipal user, StockCountDbContext db, IAuthService authService) =>
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Results.Unauthorized();
            }

            var userId = int.Parse(userIdClaim.Value);
            var dbUser = await db.NtfUsers.FindAsync(userId);

            if (dbUser == null || dbUser.UserPassword == null)
            {
                return Results.NotFound();
            }

            if (!authService.VerifyPassword(request.OldPassword, dbUser.UserPassword))
            {
                return Results.BadRequest(new { error = "Incorrect old password" });
            }

            dbUser.UserPassword = authService.HashPassword(request.NewPassword);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Password changed successfully" });
        })
        .RequireAuthorization()
        .WithName("ChangePassword");

        // Get Current User
        auth.MapGet("/me", async (ClaimsPrincipal user, StockCountDbContext db) =>
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Results.Unauthorized();
            }

            var userId = int.Parse(userIdClaim.Value);
            var dbUser = await db.NtfUsers.FindAsync(userId);

            if (dbUser == null)
            {
                return Results.NotFound();
            }

            var userDto = new UserDto(dbUser.Id, dbUser.UserName, dbUser.FullName, dbUser.Role, dbUser.CreatedAt);
            return Results.Ok(userDto);
        })
        .RequireAuthorization()
        .WithName("GetCurrentUser");

        // Logout
        auth.MapPost("/logout", () =>
        {
            return Results.Ok(new { message = "Logged out successfully" });
        })
        .RequireAuthorization()
        .WithName("Logout");
    }
}
