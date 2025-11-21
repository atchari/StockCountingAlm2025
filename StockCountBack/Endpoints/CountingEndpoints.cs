using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;
using StockCountBack.DTOs;
using StockCountBack.Models;
using System.Security.Claims;

namespace StockCountBack.Endpoints;

public static class CountingEndpoints
{
    public static void MapCountingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/counting").RequireAuthorization();

        // GET /api/counting?whsId={whsId}&binId={binId} - Get counting records with optional filters
        group.MapGet("/", async (int? whsId, int? binId, StockCountDbContext db) =>
        {
            var query = db.NtfCountings.AsQueryable();

            if (whsId.HasValue)
            {
                query = query.Where(c => c.WhsId == whsId.Value);
            }

            if (binId.HasValue)
            {
                query = query.Where(c => c.BinId == binId.Value);
            }

            var data = await query
                .OrderByDescending(c => c.CreatedAt)
                .Join(db.NtfUsers,
                    c => c.ScanPersonId,
                    u => u.Id,
                    (c, u) => new { Counting = c, ScanPerson = u })
                .GroupJoin(db.NtfUsers,
                    x => x.Counting.UpdatedBy,
                    u => u.Id,
                    (x, updaters) => new { x.Counting, x.ScanPerson, UpdatedBy = updaters.FirstOrDefault() })
                .Select(x => new CountingDto(
                    x.Counting.Id,
                    x.Counting.WhsId,
                    x.Counting.BinId,
                    x.Counting.Sku,
                    x.Counting.BatchNo,
                    x.Counting.Qty,
                    x.Counting.CountPersonId,
                    x.Counting.ScanPersonId,
                    x.ScanPerson.FullName,
                    x.Counting.CreatedAt,
                    x.Counting.UpdatedAt,
                    x.Counting.UpdatedBy,
                    x.UpdatedBy != null ? x.UpdatedBy.FullName : null))
                .ToListAsync();

            return Results.Ok(data);
        })
        .WithName("GetCountingRecords");

        // GET /api/counting/{id} - Get counting record by ID
        group.MapGet("/{id}", async (int id, StockCountDbContext db) =>
        {
            var result = await db.NtfCountings
                .Where(c => c.Id == id)
                .Join(db.NtfUsers,
                    c => c.ScanPersonId,
                    u => u.Id,
                    (c, u) => new { Counting = c, ScanPerson = u })
                .GroupJoin(db.NtfUsers,
                    x => x.Counting.UpdatedBy,
                    u => u.Id,
                    (x, updaters) => new { x.Counting, x.ScanPerson, UpdatedBy = updaters.FirstOrDefault() })
                .Select(x => new CountingDto(
                    x.Counting.Id,
                    x.Counting.WhsId,
                    x.Counting.BinId,
                    x.Counting.Sku,
                    x.Counting.BatchNo,
                    x.Counting.Qty,
                    x.Counting.CountPersonId,
                    x.Counting.ScanPersonId,
                    x.ScanPerson.FullName,
                    x.Counting.CreatedAt,
                    x.Counting.UpdatedAt,
                    x.Counting.UpdatedBy,
                    x.UpdatedBy != null ? x.UpdatedBy.FullName : null))
                .FirstOrDefaultAsync();

            if (result == null)
                return Results.NotFound(new { error = "Counting record not found" });

            return Results.Ok(result);
        })
        .WithName("GetCountingById");

        // POST /api/counting - Create new counting record
        group.MapPost("/", async (
            HttpContext context,
            CreateCountingRequest request,
            StockCountDbContext db) =>
        {
            // Get current user ID from JWT claims
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int scanPersonId))
            {
                return Results.Unauthorized();
            }

            // Validate warehouse exists
            var whsExists = await db.NtfWhsGroups.AnyAsync(w => w.Id == request.WhsId);
            if (!whsExists)
            {
                return Results.BadRequest(new { error = "Warehouse not found" });
            }

            // Validate bin location exists (if provided)
            if (request.BinId.HasValue)
            {
                var binExists = await db.NtfLocations.AnyAsync(l => l.Id == request.BinId.Value);
                if (!binExists)
                {
                    return Results.BadRequest(new { error = "Bin location not found" });
                }
            }

            // Validate count person exists
            var countPersonExists = await db.NtfCountPersons.AnyAsync(cp => cp.Id == request.CountPersonId);
            if (!countPersonExists)
            {
                return Results.BadRequest(new { error = "Count person not found" });
            }

            // Check for duplicate SKU+Batch in this warehouse
            var duplicate = await db.NtfCountings.FirstOrDefaultAsync(c =>
                c.WhsId == request.WhsId &&
                c.Sku == request.Sku &&
                c.BatchNo == request.BatchNo);

            if (duplicate != null)
            {
                return Results.Conflict(new { error = $"SKU '{request.Sku}' Batch '{request.BatchNo ?? "(ไม่มี)"}' มีในระบบแล้ว (ID: {duplicate.Id})" });
            }

            var counting = new NtfCounting
            {
                WhsId = request.WhsId,
                BinId = request.BinId,
                Sku = request.Sku,
                BatchNo = request.BatchNo,
                Qty = request.Qty,
                CountPersonId = request.CountPersonId,
                ScanPersonId = scanPersonId,
                CreatedAt = DateTime.Now
            };

            db.NtfCountings.Add(counting);
            
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate") == true)
            {
                return Results.Conflict(new { error = "พบข้อมูลซ้ำ กรุณาตรวจสอบ" });
            }

            // Get scan person name
            var scanPerson = await db.NtfUsers.FindAsync(scanPersonId);

            return Results.Created(
                $"/api/counting/{counting.Id}",
                new CountingDto(
                    counting.Id,
                    counting.WhsId,
                    counting.BinId,
                    counting.Sku,
                    counting.BatchNo,
                    counting.Qty,
                    counting.CountPersonId,
                    counting.ScanPersonId,
                    scanPerson?.FullName,
                    counting.CreatedAt,
                    counting.UpdatedAt,
                    counting.UpdatedBy,
                    null));
        })
        .WithName("CreateCounting");

        // PUT /api/counting/{id} - Update counting quantity
        group.MapPut("/{id}", async (
            HttpContext context,
            int id,
            UpdateCountingRequest request,
            StockCountDbContext db) =>
        {
            // Get current user ID from JWT claims
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int updatedBy))
            {
                return Results.Unauthorized();
            }

            var counting = await db.NtfCountings.FindAsync(id);
            if (counting == null)
                return Results.NotFound(new { error = "Counting record not found" });

            counting.Qty = request.Qty;
            counting.UpdatedAt = DateTime.Now;
            counting.UpdatedBy = updatedBy;
            await db.SaveChangesAsync();

            // Get names
            var scanPerson = await db.NtfUsers.FindAsync(counting.ScanPersonId);
            var updater = await db.NtfUsers.FindAsync(updatedBy);

            return Results.Ok(new CountingDto(
                counting.Id,
                counting.WhsId,
                counting.BinId,
                counting.Sku,
                counting.BatchNo,
                counting.Qty,
                counting.CountPersonId,
                counting.ScanPersonId,
                scanPerson?.FullName,
                counting.CreatedAt,
                counting.UpdatedAt,
                counting.UpdatedBy,
                updater?.FullName));
        })
        .WithName("UpdateCounting");

        // DELETE /api/counting/{id} - Delete counting record
        group.MapDelete("/{id}", async (int id, StockCountDbContext db) =>
        {
            var counting = await db.NtfCountings.FindAsync(id);
            if (counting == null)
                return Results.NotFound(new { error = "Counting record not found" });

            db.NtfCountings.Remove(counting);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Counting record deleted successfully" });
        })
        .WithName("DeleteCounting");
    }
}
