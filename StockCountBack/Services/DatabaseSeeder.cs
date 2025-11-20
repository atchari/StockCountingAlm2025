using StockCountBack.Data;
using StockCountBack.Models;
using StockCountBack.Services;

namespace StockCountBack.Services;

public static class DatabaseSeeder
{
    public static async Task SeedAdminUser(StockCountDbContext dbContext, IAuthService authService)
    {
        if (!dbContext.NtfUsers.Any(u => u.UserName == "admin"))
        {
            var adminUser = new NtfUser
            {
                UserName = "admin",
                UserPassword = authService.HashPassword("Admin@2025"),
                FullName = "System Administrator",
                Role = "admin",
                CreatedAt = DateTime.Now
            };

            dbContext.NtfUsers.Add(adminUser);
            await dbContext.SaveChangesAsync();
            Console.WriteLine("✅ Admin user seeded successfully");
        }
        else
        {
            Console.WriteLine("ℹ️  Admin user already exists");
        }
    }
}
