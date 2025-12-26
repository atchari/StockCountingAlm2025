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

            // ✨ OPTIMIZED: Batch query all warehouse statistics in one go
            var warehouses = await db.NtfWhsGroups.ToListAsync();
            
            // Load all freeze data with counting info in one query
            var allFreezeData = await db.NtfFreezeDatas
                .Select(f => new
                {
                    f.WhsId,
                    f.BinId,
                    f.Sku,
                    BatchNo = f.BatchNo ?? "",
                    f.Qty,
                    HasCount = db.NtfCountings.Any(c =>
                        c.WhsId == f.WhsId &&
                        c.Sku == f.Sku &&
                        (c.BatchNo == f.BatchNo || (c.BatchNo == null && f.BatchNo == null))),
                    CountQty = db.NtfCountings
                        .Where(c => c.WhsId == f.WhsId && c.Sku == f.Sku &&
                            (c.BatchNo == f.BatchNo || (c.BatchNo == null && f.BatchNo == null)))
                        .Select(c => (decimal?)c.Qty)
                        .FirstOrDefault()
                })
                .ToListAsync();

            var allCountedLocations = await db.NtfCountings
                .Where(c => c.BinId != null)
                .Select(c => new { c.WhsId, c.BinId })
                .Distinct()
                .ToListAsync();

            var warehouseStats = warehouses.Select(whs =>
            {
                var whsFreeze = allFreezeData.Where(f => f.WhsId == whs.Id).ToList();
                var countedItems = whsFreeze.Count(f => f.HasCount);
                var varianceItems = whsFreeze.Count(f => f.HasCount && f.CountQty.HasValue && f.CountQty.Value != f.Qty);
                var totalLocations = whsFreeze.Where(f => f.BinId != null).Select(f => f.BinId).Distinct().Count();
                var countedLocations = allCountedLocations.Count(c => c.WhsId == whs.Id);

                return new WarehouseStatResult
                {
                    WhsId = whs.Id,
                    WhsName = whs.WhsName,
                    TotalItems = whsFreeze.Count,
                    CountedItems = countedItems,
                    VarianceItems = varianceItems,
                    TotalLocations = totalLocations,
                    CountedLocations = countedLocations
                };
            }).ToList();

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

            // ✨ OPTIMIZED: Load all data in batch queries
            var freezeData = await db.NtfFreezeDatas
                .Where(f => f.WhsId == whsId)
                .ToListAsync();

            var allCountings = await db.NtfCountings
                .Where(c => c.WhsId == whsId)
                .ToListAsync();

            // Pre-load all locations in one query
            var locationIds = freezeData.Where(f => f.BinId != null).Select(f => f.BinId!.Value).Distinct().ToList();
            var locationsDict = await db.NtfLocations
                .Where(l => locationIds.Contains(l.Id))
                .ToDictionaryAsync(l => l.Id, l => l.BinLocation);

            // Group and process in memory
            var locationGroups = freezeData.GroupBy(f => f.BinId ?? 0);

            var locationStats = new List<LocationStatResult>();

            foreach (var group in locationGroups)
            {
                var binId = group.Key;
                var binLocation = binId == 0 ? "No Location" : (locationsDict.GetValueOrDefault(binId) ?? "Unknown");

                var totalItems = group.Count();
                
                // 🔧 FIX: นับจำนวน Counting records ที่มี BinId ตรงกับ location นี้จริงๆ
                // ไม่ใช่นับเฉพาะที่ match กับ FreezeData
                var countedItems = binId == 0 
                    ? 0 // No location ไม่นับ
                    : allCountings.Count(c => c.BinId == binId);
                
                // นับรายการที่มียอดไม่ตรง (เฉพาะที่ match กับ FreezeData)
                var varianceItems = 0;
                foreach (var f in group)
                {
                    var counting = allCountings.FirstOrDefault(c =>
                        c.Sku == f.Sku &&
                        (c.BatchNo == f.BatchNo || (c.BatchNo == null && f.BatchNo == null)));

                    if (counting != null && counting.Qty != f.Qty)
                    {
                        varianceItems++;
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

            // Join in memory - all counted items
            var allCountedItems = (from f in freezeData
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
                    (locationsDict.GetValueOrDefault(item.Freeze.BinId.Value) ?? "Unknown");

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

            // Convert to Thailand timezone (UTC+7) and group by hour
            var thailandTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var hourlyLocationCounts = countings
                .Select(c => new
                {
                    Hour = TimeZoneInfo.ConvertTimeFromUtc(
                        DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc),
                        thailandTimeZone
                    ).Hour,
                    c.BinId
                })
                .GroupBy(c => c.Hour)
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

        // GET /api/dashboard/hourly-locations/{whsId}?date=2025-12-25 - Get hourly location count for a specific warehouse and date
        group.MapGet("/hourly-locations/{whsId}", async (int whsId, string? date, StockCountDbContext db) =>
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

            // Query counting records for the specified warehouse and date
            var countings = await db.NtfCountings
                .Where(c => c.WhsId == whsId &&
                           c.CreatedAt >= targetDate && 
                           c.CreatedAt < nextDate && 
                           c.BinId != null)
                .Select(c => new { 
                    CreatedAt = c.CreatedAt, 
                    BinId = c.BinId!.Value 
                })
                .ToListAsync();

            // Convert to Thailand timezone (UTC+7) and group by hour
            var thailandTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var hourlyLocationCounts = countings
                .Select(c => new
                {
                    Hour = TimeZoneInfo.ConvertTimeFromUtc(
                        DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc),
                        thailandTimeZone
                    ).Hour,
                    c.BinId
                })
                .GroupBy(c => c.Hour)
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

        // GET /api/dashboard/hourly-items?date=2025-12-25 - Get hourly item count for a specific date
        group.MapGet("/hourly-items", async (string? date, StockCountDbContext db) =>
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
            var countings = await db.NtfCountings
                .Where(c => c.CreatedAt >= targetDate && c.CreatedAt < nextDate)
                .Select(c => new { 
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            // Convert to Thailand timezone (UTC+7) and group by hour
            var thailandTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var hourlyItemCounts = countings
                .Select(c => new
                {
                    Hour = TimeZoneInfo.ConvertTimeFromUtc(
                        DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc),
                        thailandTimeZone
                    ).Hour
                })
                .GroupBy(c => c.Hour)
                .Select(g => new 
                { 
                    Hour = g.Key,
                    ItemCount = g.Count()
                })
                .OrderBy(x => x.Hour)
                .ToList();

            // Create a complete 24-hour result (0-23)
            var result = Enumerable.Range(0, 24)
                .Select(hour =>
                {
                    var data = hourlyItemCounts.FirstOrDefault(h => h.Hour == hour);
                    return new
                    {
                        hour = $"{hour:D2}:00",
                        itemCount = data?.ItemCount ?? 0
                    };
                })
                .ToList();

            return Results.Ok(new
            {
                date = targetDate.ToString("yyyy-MM-dd"),
                data = result
            });
        });

        // GET /api/dashboard/hourly-items/{whsId}?date=2025-12-25 - Get hourly item count for a specific warehouse and date
        group.MapGet("/hourly-items/{whsId}", async (int whsId, string? date, StockCountDbContext db) =>
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

            // Query counting records for the specified warehouse and date
            var countings = await db.NtfCountings
                .Where(c => c.WhsId == whsId && c.CreatedAt >= targetDate && c.CreatedAt < nextDate)
                .Select(c => new { 
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            // Convert to Thailand timezone (UTC+7) and group by hour
            var thailandTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var hourlyItemCounts = countings
                .Select(c => new
                {
                    Hour = TimeZoneInfo.ConvertTimeFromUtc(
                        DateTime.SpecifyKind(c.CreatedAt, DateTimeKind.Utc),
                        thailandTimeZone
                    ).Hour
                })
                .GroupBy(c => c.Hour)
                .Select(g => new 
                { 
                    Hour = g.Key,
                    ItemCount = g.Count()
                })
                .OrderBy(x => x.Hour)
                .ToList();

            // Create a complete 24-hour result (0-23)
            var result = Enumerable.Range(0, 24)
                .Select(hour =>
                {
                    var data = hourlyItemCounts.FirstOrDefault(h => h.Hour == hour);
                    return new
                    {
                        hour = $"{hour:D2}:00",
                        itemCount = data?.ItemCount ?? 0
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
