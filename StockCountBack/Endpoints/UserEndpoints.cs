using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;
using StockCountBack.DTOs;
using StockCountBack.Models;
using StockCountBack.Services;

namespace StockCountBack.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        var users = app.MapGroup("/api/users")
            .RequireAuthorization(policy => policy.RequireRole("admin"));

        // Get all users
        users.MapGet("/", async (StockCountDbContext db) =>
        {
            var userList = await db.NtfUsers
                .Select(u => new UserDto(u.Id, u.UserName, u.FullName, u.Role, u.CreatedAt))
                .ToListAsync();
            return Results.Ok(userList);
        });

        // Get user by ID
        users.MapGet("/{id}", async (int id, StockCountDbContext db) =>
        {
            var user = await db.NtfUsers.FindAsync(id);
            if (user == null) return Results.NotFound();

            var dto = new UserDto(user.Id, user.UserName, user.FullName, user.Role, user.CreatedAt);
            return Results.Ok(dto);
        });

        // Create user
        users.MapPost("/", async ([FromBody] CreateUserRequest request, StockCountDbContext db, IAuthService authService) =>
        {
            if (await db.NtfUsers.AnyAsync(u => u.UserName == request.UserName))
            {
                return Results.BadRequest(new { error = "Username already exists" });
            }

            var user = new NtfUser
            {
                UserName = request.UserName,
                UserPassword = authService.HashPassword(request.Password),
                FullName = request.FullName,
                Role = request.Role,
                CreatedAt = DateTime.Now
            };

            db.NtfUsers.Add(user);
            await db.SaveChangesAsync();

            var dto = new UserDto(user.Id, user.UserName, user.FullName, user.Role, user.CreatedAt);
            return Results.Created($"/api/users/{user.Id}", dto);
        });

        // Update user
        users.MapPut("/{id}", async (int id, [FromBody] UpdateUserRequest request, StockCountDbContext db) =>
        {
            var user = await db.NtfUsers.FindAsync(id);
            if (user == null) return Results.NotFound();

            if (request.FullName != null) user.FullName = request.FullName;
            if (request.Role != null) user.Role = request.Role;

            await db.SaveChangesAsync();

            var dto = new UserDto(user.Id, user.UserName, user.FullName, user.Role, user.CreatedAt);
            return Results.Ok(dto);
        });

        // Delete user
        users.MapDelete("/{id}", async (int id, StockCountDbContext db) =>
        {
            var user = await db.NtfUsers.FindAsync(id);
            if (user == null) return Results.NotFound();

            // Prevent deleting admin user
            if (user.UserName == "admin")
            {
                return Results.BadRequest(new { error = "Cannot delete admin user" });
            }

            db.NtfUsers.Remove(user);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });

        // Reset user password
        users.MapPost("/{id}/reset-password", async (int id, [FromBody] string newPassword, StockCountDbContext db, IAuthService authService) =>
        {
            var user = await db.NtfUsers.FindAsync(id);
            if (user == null) return Results.NotFound();

            user.UserPassword = authService.HashPassword(newPassword);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Password reset successfully" });
        });
    }
}
