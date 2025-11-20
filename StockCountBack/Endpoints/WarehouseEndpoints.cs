using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;
using StockCountBack.DTOs;
using StockCountBack.Models;

namespace StockCountBack.Endpoints;

public static class WarehouseEndpoints
{
    public static void MapWarehouseEndpoints(this WebApplication app)
    {
        var whs = app.MapGroup("/api/warehouses").RequireAuthorization();

        // Get all warehouses
        whs.MapGet("/", async (StockCountDbContext db) =>
        {
            var warehouses = await db.NtfWhsGroups
                .Select(w => new WhsGroupDto(w.Id, w.WhsName, w.CreatedAt))
                .ToListAsync();
            return Results.Ok(warehouses);
        });

        // Get warehouse by ID
        whs.MapGet("/{id}", async (int id, StockCountDbContext db) =>
        {
            var warehouse = await db.NtfWhsGroups.FindAsync(id);
            if (warehouse == null) return Results.NotFound();

            var dto = new WhsGroupDto(warehouse.Id, warehouse.WhsName, warehouse.CreatedAt);
            return Results.Ok(dto);
        });

        // Create warehouse
        whs.MapPost("/", async ([FromBody] CreateWhsGroupRequest request, StockCountDbContext db) =>
        {
            var warehouse = new NtfWhsGroup
            {
                WhsName = request.WhsName,
                CreatedAt = DateTime.Now
            };

            db.NtfWhsGroups.Add(warehouse);
            await db.SaveChangesAsync();

            var dto = new WhsGroupDto(warehouse.Id, warehouse.WhsName, warehouse.CreatedAt);
            return Results.Created($"/api/warehouses/{warehouse.Id}", dto);
        })
        .RequireAuthorization(policy => policy.RequireRole("admin"));

        // Update warehouse
        whs.MapPut("/{id}", async (int id, [FromBody] CreateWhsGroupRequest request, StockCountDbContext db) =>
        {
            var warehouse = await db.NtfWhsGroups.FindAsync(id);
            if (warehouse == null) return Results.NotFound();

            warehouse.WhsName = request.WhsName;
            await db.SaveChangesAsync();

            var dto = new WhsGroupDto(warehouse.Id, warehouse.WhsName, warehouse.CreatedAt);
            return Results.Ok(dto);
        })
        .RequireAuthorization(policy => policy.RequireRole("admin"));

        // Delete warehouse
        whs.MapDelete("/{id}", async (int id, StockCountDbContext db) =>
        {
            var warehouse = await db.NtfWhsGroups.FindAsync(id);
            if (warehouse == null) return Results.NotFound();

            db.NtfWhsGroups.Remove(warehouse);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization(policy => policy.RequireRole("admin"));
    }
}
