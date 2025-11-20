using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;
using StockCountBack.DTOs;
using StockCountBack.Models;
using System.Security.Claims;

namespace StockCountBack.Endpoints;

public static class BinMappingEndpoints
{
    public static void MapBinMappingEndpoints(this WebApplication app)
    {
        var binMap = app.MapGroup("/api/bin-mappings").RequireAuthorization();

        // Get all bin mappings
        binMap.MapGet("/", async (StockCountDbContext db, int? binId) =>
        {
            var query = db.NtfBinMappings.AsQueryable();
            
            if (binId.HasValue)
            {
                query = query.Where(bm => bm.BinId == binId.Value);
            }

            var mappings = await query
                .Select(bm => new BinMappingDto(bm.Id, bm.BinId, bm.Sku, bm.BatchNo, bm.UserId, bm.CreatedAt))
                .ToListAsync();
            return Results.Ok(mappings);
        });

        // Get bin mapping by ID
        binMap.MapGet("/{id}", async (int id, StockCountDbContext db) =>
        {
            var mapping = await db.NtfBinMappings.FindAsync(id);
            if (mapping == null) return Results.NotFound();

            var dto = new BinMappingDto(mapping.Id, mapping.BinId, mapping.Sku, mapping.BatchNo, mapping.UserId, mapping.CreatedAt);
            return Results.Ok(dto);
        });

        // Scan label - parse |SKU|batchNumber| format
        binMap.MapPost("/scan", async ([FromBody] ScanLabelRequest request, ClaimsPrincipal user, StockCountDbContext db) =>
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Results.Unauthorized();
            
            var userId = int.Parse(userIdClaim.Value);

            // Parse scanned data: |SKU|batchNumber|
            var parts = request.ScannedData.Split('|', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2)
            {
                return Results.BadRequest(new { error = "Invalid label format. Expected: |SKU|batchNumber|" });
            }

            var sku = parts[0].Trim();
            var batchNo = parts[1].Trim();

            // Check if already exists (duplicate check)
            var exists = await db.NtfBinMappings.AnyAsync(bm => 
                bm.BinId == request.BinId && 
                bm.Sku == sku && 
                bm.BatchNo == batchNo);

            if (exists)
            {
                return Results.Conflict(new { error = "This SKU and batch number already mapped to this bin location" });
            }

            var mapping = new NtfBinMapping
            {
                BinId = request.BinId,
                Sku = sku,
                BatchNo = batchNo,
                UserId = userId,
                CreatedAt = DateTime.Now
            };

            db.NtfBinMappings.Add(mapping);
            await db.SaveChangesAsync();

            var dto = new BinMappingDto(mapping.Id, mapping.BinId, mapping.Sku, mapping.BatchNo, mapping.UserId, mapping.CreatedAt);
            return Results.Created($"/api/bin-mappings/{mapping.Id}", dto);
        });

        // Create bin mapping manually
        binMap.MapPost("/", async ([FromBody] CreateBinMappingRequest request, ClaimsPrincipal user, StockCountDbContext db) =>
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Results.Unauthorized();
            
            var userId = int.Parse(userIdClaim.Value);

            // Check duplicate
            var exists = await db.NtfBinMappings.AnyAsync(bm => 
                bm.BinId == request.BinId && 
                bm.Sku == request.Sku && 
                bm.BatchNo == request.BatchNo);

            if (exists)
            {
                return Results.Conflict(new { error = "This SKU and batch number already mapped to this bin location" });
            }

            var mapping = new NtfBinMapping
            {
                BinId = request.BinId,
                Sku = request.Sku,
                BatchNo = request.BatchNo,
                UserId = userId,
                CreatedAt = DateTime.Now
            };

            db.NtfBinMappings.Add(mapping);
            await db.SaveChangesAsync();

            var dto = new BinMappingDto(mapping.Id, mapping.BinId, mapping.Sku, mapping.BatchNo, mapping.UserId, mapping.CreatedAt);
            return Results.Created($"/api/bin-mappings/{mapping.Id}", dto);
        });

        // Delete bin mapping
        binMap.MapDelete("/{id}", async (int id, StockCountDbContext db) =>
        {
            var mapping = await db.NtfBinMappings.FindAsync(id);
            if (mapping == null) return Results.NotFound();

            db.NtfBinMappings.Remove(mapping);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization(policy => policy.RequireRole("admin"));
    }
}
