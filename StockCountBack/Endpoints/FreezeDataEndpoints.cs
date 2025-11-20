using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;
using StockCountBack.DTOs;
using StockCountBack.Models;
using System.Globalization;

namespace StockCountBack.Endpoints;

public static class FreezeDataEndpoints
{
    public static void MapFreezeDataEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/freeze-data").RequireAuthorization();

        // GET /api/freeze-data?whsId={whsId} - Get freeze data (optional filter by warehouse)
        group.MapGet("/", async (int? whsId, StockCountDbContext db) =>
        {
            var query = db.NtfFreezeDatas.AsQueryable();

            if (whsId.HasValue)
            {
                query = query.Where(f => f.WhsId == whsId.Value);
            }

            var data = await query
                .OrderBy(f => f.Sku)
                .ThenBy(f => f.BatchNo)
                .Select(f => new FreezeDataDto(
                    f.Id,
                    f.WhsId,
                    f.Sku,
                    f.BatchNo,
                    f.Qty,
                    f.Uom,
                    f.UnitPrice,
                    f.CreatedAt))
                .ToListAsync();

            return Results.Ok(data);
        })
        .WithName("GetFreezeData");

        // GET /api/freeze-data/{id} - Get freeze data by ID
        group.MapGet("/{id}", async (int id, StockCountDbContext db) =>
        {
            var data = await db.NtfFreezeDatas.FindAsync(id);
            if (data == null)
                return Results.NotFound(new { error = "Freeze data not found" });

            return Results.Ok(new FreezeDataDto(
                data.Id,
                data.WhsId,
                data.Sku,
                data.BatchNo,
                data.Qty,
                data.Uom,
                data.UnitPrice,
                data.CreatedAt));
        })
        .WithName("GetFreezeDataById");

        // POST /api/freeze-data/import - Import TSV file for specific warehouse (Admin only)
        group.MapPost("/import", [Authorize(Roles = "admin")] async (
            ImportFreezeDataRequest request,
            StockCountDbContext db) =>
        {
            try
            {
                // Delete existing data for this warehouse
                var existingData = await db.NtfFreezeDatas
                    .Where(f => f.WhsId == request.WhsId)
                    .ToListAsync();
                
                if (existingData.Any())
                {
                    db.NtfFreezeDatas.RemoveRange(existingData);
                }

                // Parse TSV content
                var lines = request.TsvContent.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                var importedCount = 0;
                var errors = new List<string>();

                // Skip header line (assuming first line is header)
                for (int i = 1; i < lines.Length; i++)
                {
                    var line = lines[i].Trim();
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var columns = line.Split('\t');
                    if (columns.Length < 4)
                    {
                        errors.Add($"Line {i + 1}: Invalid format - expected at least 4 columns");
                        continue;
                    }

                    try
                    {
                        var freezeData = new NtfFreezeData
                        {
                            WhsId = request.WhsId,
                            Sku = columns[0].Trim(),
                            BatchNo = columns[1].Trim(),
                            Qty = decimal.Parse(columns[2].Trim(), CultureInfo.InvariantCulture),
                            Uom = columns.Length > 3 ? columns[3].Trim() : "",
                            UnitPrice = columns.Length > 4 ? decimal.Parse(columns[4].Trim(), CultureInfo.InvariantCulture) : 0,
                            CreatedAt = DateTime.Now
                        };

                        db.NtfFreezeDatas.Add(freezeData);
                        importedCount++;
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Line {i + 1}: {ex.Message}");
                    }
                }

                await db.SaveChangesAsync();

                return Results.Ok(new
                {
                    message = "Import completed",
                    whsId = request.WhsId,
                    importedCount,
                    deletedCount = existingData.Count,
                    errors = errors.Any() ? errors : null
                });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = $"Import failed: {ex.Message}" });
            }
        })
        .WithName("ImportFreezeData");

        // DELETE /api/freeze-data/warehouse/{whsId} - Delete all freeze data for warehouse (Admin only)
        group.MapDelete("/warehouse/{whsId}", [Authorize(Roles = "admin")] async (
            int whsId,
            StockCountDbContext db) =>
        {
            var data = await db.NtfFreezeDatas.Where(f => f.WhsId == whsId).ToListAsync();
            
            if (!data.Any())
                return Results.NotFound(new { error = "No freeze data found for this warehouse" });

            db.NtfFreezeDatas.RemoveRange(data);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Freeze data deleted successfully", deletedCount = data.Count });
        })
        .WithName("DeleteFreezeDataByWarehouse");

        // DELETE /api/freeze-data/{id} - Delete specific freeze data (Admin only)
        group.MapDelete("/{id}", [Authorize(Roles = "admin")] async (
            int id,
            StockCountDbContext db) =>
        {
            var data = await db.NtfFreezeDatas.FindAsync(id);
            if (data == null)
                return Results.NotFound(new { error = "Freeze data not found" });

            db.NtfFreezeDatas.Remove(data);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Freeze data deleted successfully" });
        })
        .WithName("DeleteFreezeData");
    }
}
