using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;
using StockCountBack.DTOs;
using StockCountBack.Models;

namespace StockCountBack.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this WebApplication app)
    {
        var loc = app.MapGroup("/api/locations").RequireAuthorization();

        // Get all locations
        loc.MapGet("/", async (StockCountDbContext db, int? whsId) =>
        {
            var query = db.NtfLocations.AsQueryable();
            
            if (whsId.HasValue)
            {
                query = query.Where(l => l.WhsId == whsId.Value);
            }

            var locations = await query
                .Select(l => new LocationDto(l.Id, l.WhsId, l.BinLocation, l.CreatedAt))
                .ToListAsync();
            return Results.Ok(locations);
        });

        // Get location by ID
        loc.MapGet("/{id}", async (int id, StockCountDbContext db) =>
        {
            var location = await db.NtfLocations.FindAsync(id);
            if (location == null) return Results.NotFound();

            var dto = new LocationDto(location.Id, location.WhsId, location.BinLocation, location.CreatedAt);
            return Results.Ok(dto);
        });

        // Create location
        loc.MapPost("/", async ([FromBody] CreateLocationRequest request, StockCountDbContext db) =>
        {
            var location = new NtfLocation
            {
                WhsId = request.WhsId,
                BinLocation = request.BinLocation,
                CreatedAt = DateTime.Now
            };

            db.NtfLocations.Add(location);
            await db.SaveChangesAsync();

            var dto = new LocationDto(location.Id, location.WhsId, location.BinLocation, location.CreatedAt);
            return Results.Created($"/api/locations/{location.Id}", dto);
        })
        .RequireAuthorization(policy => policy.RequireRole("admin"));

        // Update location
        loc.MapPut("/{id}", async (int id, [FromBody] CreateLocationRequest request, StockCountDbContext db) =>
        {
            var location = await db.NtfLocations.FindAsync(id);
            if (location == null) return Results.NotFound();

            location.WhsId = request.WhsId;
            location.BinLocation = request.BinLocation;
            await db.SaveChangesAsync();

            var dto = new LocationDto(location.Id, location.WhsId, location.BinLocation, location.CreatedAt);
            return Results.Ok(dto);
        })
        .RequireAuthorization(policy => policy.RequireRole("admin"));

        // Delete location
        loc.MapDelete("/{id}", async (int id, StockCountDbContext db) =>
        {
            var location = await db.NtfLocations.FindAsync(id);
            if (location == null) return Results.NotFound();

            db.NtfLocations.Remove(location);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization(policy => policy.RequireRole("admin"));
    }
}
