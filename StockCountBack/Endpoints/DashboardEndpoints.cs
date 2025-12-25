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
            // Count only FreezeData items that have been counted (ignore binId)
            var totalCountedItems = await db.NtfFreezeDatas
                .Where(f => db.NtfCountings.Any(c => 
                    c.WhsId == f.WhsId &&
                    c.Sku == f.Sku &&
                    (c.BatchNo == f.BatchNo || (c.BatchNo == null && f.BatchNo == null))))
                .CountAsync();

            var overallProgress = totalFreezeItems > 0 ? (decimal)totalCountedItems / totalFreezeItems * 100 : 0;

            // Warehouse-level statistics using LINQ
            var warehouses = await db.NtfWhsGroups.ToListAsync();
            var warehouseStats = new List<WarehouseStatResult>();

            foreach (var whs in warehouses)
            {
                var totalItems = await db.NtfFreezeDatas.Where(f => f.WhsId == whs.Id).CountAsync();
                
                // Count only FreezeData items that have been counted (ignore binId for matching)
                var countedItems = await db.NtfFreezeDatas
                    .Where(f => f.WhsId == whs.Id && db.NtfCountings.Any(c =>
                        c.WhsId == f.WhsId &&
                        c.Sku == f.Sku &&
                        (c.BatchNo == f.BatchNo || (c.BatchNo == null && f.BatchNo == null))))
                    .CountAsync();

                // Count variance items (ignore binId for matching)
                var varianceItems = await db.NtfFreezeDatas
                    .Where(f => f.WhsId == whs.Id && db.NtfCountings.Any(c =>
                        c.WhsId == f.WhsId &&
                        c.Sku == f.Sku &&
                        (c.BatchNo == f.BatchNo || (c.BatchNo == null && f.BatchNo == null)) &&
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
                        c.Sku == f.Sku &&
                        (c.BatchNo == f.BatchNo || (c.BatchNo == null && f.BatchNo == null)));
                    
                    if (hasCount)
                    {
                        countedItems++;
                        
                        var counting = await db.NtfCountings.FirstOrDefaultAsync(c =>
                            c.WhsId == f.WhsId &&
                            c.Sku == f.Sku &&
                            (c.BatchNo == f.BatchNo || (c.BatchNo == null && f.BatchNo == null)));
                        
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

            // All counted items and variance details
            // Load data separately to handle nullable fields properly
            var allFreeze = await db.NtfFreezeDatas
                .Where(f => f.WhsId == whsId)
                .ToListAsync();
            
            var allCountings = await db.NtfCountings
                .Where(c => c.WhsId == whsId)
                .ToListAsync();
            
            // Join in memory - all counted items
            var allCountedItems = (from f in allFreeze
                                  join c in allCountings
                                  on new { 
                                      f.Sku, 
                                      BatchNo = f.BatchNo ?? "" 
                                  } equals new { 
                                      c.Sku, 
                                      BatchNo = c.BatchNo ?? "" 
                                  }
                                  select new { Freeze = f, Count = c }).ToList();

            var allDetails = new List<VarianceDetailResult>();
            var varianceDetails = new List<VarianceDetailResult>();

            foreach (var item in allCountedItems)
            {
                var binLocation = item.Freeze.BinId == null ? "No Location" :
                    (await db.NtfLocations.FindAsync(item.Freeze.BinId))?.BinLocation ?? "Unknown";

                var variance = Math.Abs(item.Count.Qty - item.Freeze.Qty);
                var hasVariance = item.Count.Qty != item.Freeze.Qty;

                var detail = new VarianceDetailResult
                {
                    Sku = item.Freeze.Sku,
                    BatchNo = item.Freeze.BatchNo ?? string.Empty,
                    BinLocation = binLocation,
                    FreezeQty = item.Freeze.Qty,
                    CountQty = item.Count.Qty,
                    Variance = variance
                };

                allDetails.Add(detail);
                
                if (hasVariance)
                {
                    varianceDetails.Add(detail);
                }
            }

            allDetails = allDetails.OrderBy(v => v.Sku).ToList();
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
                allCountedItems = allDetails.Select(v => new
                {
                    sku = v.Sku,
                    batchNo = v.BatchNo,
                    binLocation = v.BinLocation,
                    freezeQty = v.FreezeQty,
                    countQty = v.CountQty,
                    variance = v.Variance,
                    variancePercentage = v.FreezeQty > 0 ? Math.Round(Math.Abs((v.CountQty - v.FreezeQty) / v.FreezeQty * 100), 2) : 0
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

        // GET /api/dashboard/hourly-locations?date=2025-12-25 - Get hourly location count for a specific date
        group.MapGet("/hourly-locations", async (string? date, StockCountDbContext db) =>
        {
            // Parse the date parameter or use today
            DateTime targetDate;
            if (string.IsNullOrEmpty(date) || !DateTime.TryParse(date, out targetDate))
            {
                targetDate = DateTime.Today;
            }
            else
            {
                targetDate = targetDate.Date;
            }

            var nextDate = targetDate.AddDays(1);

            // Query counting records for the specified date
            // Fetch to memory first, then process
            var countings = await db.NtfCountings
                .Where(c => c.CreatedAt >= targetDate && 
                           c.CreatedAt < nextDate && 
                           c.BinId != null)
                .Select(c => new { 
                    CreatedAt = c.CreatedAt, 
                    BinId = c.BinId!.Value 
                })
                .ToListAsync();

            // Group by hour and count distinct locations in memory
            var hourlyLocationCounts = countings
                .GroupBy(c => c.CreatedAt.Hour)
                .Select(g => new 
                { 
                    Hour = g.Key,
                    LocationCount = g.Select(x => x.BinId).Distinct().Count()
                })
                .OrderBy(x => x.Hour)
                .ToList();

            // Create a complete 24-hour result (0-23)
            var result = Enumerable.Range(0, 24)
                .Select(hour =>
                {
                    var data = hourlyLocationCounts.FirstOrDefault(h => h.Hour == hour);
                    return new
                    {
                        hour = $"{hour:D2}:00",
                        locationCount = data?.LocationCount ?? 0
                    };
                })
                .ToList();

            return Results.Ok(new
            {
                date = targetDate.ToString("yyyy-MM-dd"),
                data = result
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
