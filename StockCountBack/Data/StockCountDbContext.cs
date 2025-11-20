using Microsoft.EntityFrameworkCore;
using StockCountBack.Models;

namespace StockCountBack.Data;

public class StockCountDbContext : DbContext
{
    public StockCountDbContext(DbContextOptions<StockCountDbContext> options) : base(options)
    {
    }

    public DbSet<NtfUser> NtfUsers { get; set; }
    public DbSet<NtfWhsGroup> NtfWhsGroups { get; set; }
    public DbSet<NtfLocation> NtfLocations { get; set; }
    public DbSet<NtfBinMapping> NtfBinMappings { get; set; }
    public DbSet<NtfCountPerson> NtfCountPersons { get; set; }
    public DbSet<NtfFreezeData> NtfFreezeDatas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure entity relationships and constraints if needed
        modelBuilder.Entity<NtfUser>(entity =>
        {
            entity.HasIndex(e => e.UserName).IsUnique();
        });

        modelBuilder.Entity<NtfBinMapping>(entity =>
        {
            entity.HasIndex(e => new { e.BinId, e.Sku, e.BatchNo }).IsUnique();
        });
    }
}
