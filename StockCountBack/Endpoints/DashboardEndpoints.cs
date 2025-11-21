using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;

namespace StockCountBack.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard").RequireAuthorization();

        // GET /api/dashboard/statistics - Get overall statistics
        group.MapGet("/statistics", async (StockCountDbContext db) =>
        {
            // Overall company statistics
            var totalFreezeItems = await db.NtfFreezeDatas.CountAsync();
            
            // Count distinct freeze data items that have matching counting records
            // Match using: whsId, binId (nullable), sku, batchNo (nullable)
            var totalCountedItems = await db.NtfFreezeDatas
                .Where(f => db.NtfCountings.Any(c => 
                    c.WhsId == f.WhsId &&
                    (c.BinId == null && f.BinId == null || c.BinId == f.BinId) &&
                    c.Sku == f.Sku &&
                    (c.BatchNo == null && f.BatchNo == null || c.BatchNo == f.BatchNo)))
                .CountAsync();

            var overallProgress = totalFreezeItems > 0 ? (decimal)totalCountedItems / totalFreezeItems * 100 : 0;

            // Warehouse-level statistics using LINQ
            var warehouses = await db.NtfWhsGroups.ToListAsync();
            var warehouseStats = new List<WarehouseStatResult>();

            foreach (var whs in warehouses)
            {
                var totalItems = await db.NtfFreezeDatas.Where(f => f.WhsId == whs.Id).CountAsync();
                
                var countedItems = await db.NtfFreezeDatas
                    .Where(f => f.WhsId == whs.Id && db.NtfCountings.Any(c =>
                        c.WhsId == f.WhsId &&
                        (c.BinId == null && f.BinId == null || c.BinId == f.BinId) &&
                        c.Sku == f.Sku &&
                        (c.BatchNo == null && f.BatchNo == null || c.BatchNo == f.BatchNo)))
                    .CountAsync();

                var varianceItems = await db.NtfFreezeDatas
                    .Where(f => f.WhsId == whs.Id && db.NtfCountings.Any(c =>
                        c.WhsId == f.WhsId &&
                        (c.BinId == null && f.BinId == null || c.BinId == f.BinId) &&
                        c.Sku == f.Sku &&
                        (c.BatchNo == null && f.BatchNo == null || c.BatchNo == f.BatchNo) &&
                        c.Qty != f.Qty))
                    .CountAsync();

                // Count total locations from FreezeData
                var totalLocations = await db.NtfFreezeDatas
                    .Where(f => f.WhsId == whs.Id && f.BinId != null)
                    .Select(f => f.BinId)
                    .Distinct()
                    .CountAsync();

                // Count locations that have been counted
                var countedLocations = await db.NtfFreezeDatas
                    .Where(f => f.WhsId == whs.Id && f.BinId != null && 
                        db.NtfCountings.Any(c => c.WhsId == f.WhsId && c.BinId == f.BinId))
                    .Select(f => f.BinId)
                    .Distinct()
                    .CountAsync();

                warehouseStats.Add(new WarehouseStatResult
                {
                    WhsId = whs.Id,
                    WhsName = whs.WhsName,
                    TotalItems = totalItems,
                    CountedItems = countedItems,
                    VarianceItems = varianceItems,
                    TotalLocations = totalLocations,
                    CountedLocations = countedLocations
                });
            }

            return Results.Ok(new
            {
                overall = new
                {
                    totalFreezeItems,
                    totalCountedItems,
                    progressPercentage = Math.Round(overallProgress, 2),
                    status = overallProgress == 0 ? "ยังไม่เริ่ม" : overallProgress == 100 ? "เสร็จสมบูรณ์" : "กำลังดำเนินการ"
                },
                warehouses = warehouseStats.Select(w => new
                {
                    whsId = w.WhsId,
                    whsName = w.WhsName,
                    totalItems = w.TotalItems,
                    countedItems = w.CountedItems,
                    varianceItems = w.VarianceItems,
                    progressPercentage = w.TotalItems > 0 ? Math.Round((decimal)w.CountedItems / w.TotalItems * 100, 2) : 0,
                    totalLocations = w.TotalLocations,
                    countedLocations = w.CountedLocations,
                    status = w.TotalItems == 0 ? "ไม่มีข้อมูลตั้งต้น" :
                             w.CountedItems == 0 ? "ยังไม่เริ่ม" :
                             w.CountedItems == w.TotalItems ? "นับครบแล้ว" : "กำลังนับ"
                }).ToList()
            });
        });

        // GET /api/dashboard/warehouse/{whsId} - Get warehouse detail with location breakdown
        group.MapGet("/warehouse/{whsId}", async (int whsId, StockCountDbContext db) =>
        {
            var warehouse = await db.NtfWhsGroups.FindAsync(whsId);
            if (warehouse == null)
                return Results.NotFound(new { error = "Warehouse not found" });

            // Location-level statistics using LINQ
            // Get all freeze data for this warehouse first
            var freezeData = await db.NtfFreezeDatas
                .Where(f => f.WhsId == whsId)
                .ToListAsync();

            // Group in memory to avoid nullable GroupBy issues
            var locationGroups = freezeData.GroupBy(f => f.BinId ?? 0);

            var locationStats = new List<LocationStatResult>();

            foreach (var group in locationGroups)
            {
                var binId = group.Key;
                var binLocation = binId == 0 ? "No Location" :
                    (await db.NtfLocations.FindAsync(binId))?.BinLocation ?? "Unknown";

                var totalItems = group.Count();
                
                // Count items that have been counted
                var countedItems = 0;
                var varianceItems = 0;
                
                foreach (var f in group)
                {
                    var hasCount = await db.NtfCountings.AnyAsync(c =>
                        c.WhsId == f.WhsId &&
                        (c.BinId == null && f.BinId == null || c.BinId == f.BinId) &&
                        c.Sku == f.Sku &&
                        (c.BatchNo == null && f.BatchNo == null || c.BatchNo == f.BatchNo));
                    
                    if (hasCount)
                    {
                        countedItems++;
                        
                        var counting = await db.NtfCountings.FirstOrDefaultAsync(c =>
                            c.WhsId == f.WhsId &&
                            (c.BinId == null && f.BinId == null || c.BinId == f.BinId) &&
                            c.Sku == f.Sku &&
                            (c.BatchNo == null && f.BatchNo == null || c.BatchNo == f.BatchNo));
                        
                        if (counting != null && counting.Qty != f.Qty)
                        {
                            varianceItems++;
                        }
                    }
                }

                locationStats.Add(new LocationStatResult
                {
                    BinId = binId,
                    BinLocation = binLocation,
                    TotalItems = totalItems,
                    CountedItems = countedItems,
                    VarianceItems = varianceItems
                });
            }

            locationStats = locationStats.OrderBy(l => l.BinLocation).ToList();

            // Variance details (items with quantity mismatch) using LINQ
            var freezeDataWithCounting = await db.NtfFreezeDatas
                .Where(f => f.WhsId == whsId)
                .Join(db.NtfCountings,
                    f => new { f.WhsId, f.BinId, f.Sku, f.BatchNo },
                    c => new { c.WhsId, c.BinId, c.Sku, c.BatchNo },
                    (f, c) => new { Freeze = f, Count = c })
                .Where(x => x.Freeze.Qty != x.Count.Qty)
                .ToListAsync();

            var varianceDetails = new List<VarianceDetailResult>();

            foreach (var item in freezeDataWithCounting)
            {
                var binLocation = item.Freeze.BinId == null ? "No Location" :
                    (await db.NtfLocations.FindAsync(item.Freeze.BinId))?.BinLocation ?? "Unknown";

                var variance = Math.Abs(item.Count.Qty - item.Freeze.Qty);

                varianceDetails.Add(new VarianceDetailResult
                {
                    Sku = item.Freeze.Sku,
                    BatchNo = item.Freeze.BatchNo,
                    BinLocation = binLocation,
                    FreezeQty = item.Freeze.Qty,
                    CountQty = item.Count.Qty,
                    Variance = variance
                });
            }

            varianceDetails = varianceDetails.OrderByDescending(v => v.Variance).ToList();

            return Results.Ok(new
            {
                warehouse = new
                {
                    whsId = warehouse.Id,
                    whsName = warehouse.WhsName
                },
                locations = locationStats.Select(loc => new
                {
                    binId = loc.BinId,
                    binLocation = loc.BinLocation,
                    totalItems = loc.TotalItems,
                    countedItems = loc.CountedItems,
                    varianceItems = loc.VarianceItems,
                    progressPercentage = loc.TotalItems > 0 ? Math.Round((decimal)loc.CountedItems / loc.TotalItems * 100, 2) : 0,
                    status = loc.TotalItems == 0 ? "ไม่มีข้อมูล" :
                             loc.CountedItems == 0 ? "ยังไม่เริ่ม" :
                             loc.CountedItems == loc.TotalItems ? "นับครบแล้ว" : "กำลังนับ"
                }).ToList(),
                variances = varianceDetails.Select(v => new
                {
                    sku = v.Sku,
                    batchNo = v.BatchNo,
                    binLocation = v.BinLocation,
                    freezeQty = v.FreezeQty,
                    countQty = v.CountQty,
                    variance = v.Variance,
                    variancePercentage = v.FreezeQty > 0 ? Math.Round(Math.Abs((v.CountQty - v.FreezeQty) / v.FreezeQty * 100), 2) : 0
                }).ToList()
            });
        });
    }

    // Result classes for SQL queries
    public class WarehouseStatResult
    {
        public int WhsId { get; set; }
        public string WhsName { get; set; } = string.Empty;
        public int TotalItems { get; set; }
        public int CountedItems { get; set; }
        public int VarianceItems { get; set; }
        public int TotalLocations { get; set; }
        public int CountedLocations { get; set; }
    }

    public class LocationStatResult
    {
        public int BinId { get; set; }
        public string BinLocation { get; set; } = string.Empty;
        public int TotalItems { get; set; }
        public int CountedItems { get; set; }
        public int VarianceItems { get; set; }
    }

    public class VarianceDetailResult
    {
        public string Sku { get; set; } = string.Empty;
        public string? BatchNo { get; set; }
        public string BinLocation { get; set; } = string.Empty;
        public decimal FreezeQty { get; set; }
        public decimal CountQty { get; set; }
        public decimal Variance { get; set; }
    }
}
