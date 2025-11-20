using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using StockCountBack.Data;
using StockCountBack.DTOs;
using StockCountBack.Models;

namespace StockCountBack.Endpoints;

public static class CountPersonEndpoints
{
    public static void MapCountPersonEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/count-persons").RequireAuthorization();

        // GET /api/count-persons - Get all count persons
        group.MapGet("/", async (StockCountDbContext db) =>
        {
            var persons = await db.NtfCountPersons
                .OrderBy(p => p.FullName)
                .Select(p => new CountPersonDto(p.Id, p.FullName, p.CreatedAt))
                .ToListAsync();
            return Results.Ok(persons);
        })
        .WithName("GetAllCountPersons");

        // GET /api/count-persons/{id} - Get count person by ID
        group.MapGet("/{id}", async (int id, StockCountDbContext db) =>
        {
            var person = await db.NtfCountPersons.FindAsync(id);
            if (person == null)
                return Results.NotFound(new { error = "Count person not found" });

            return Results.Ok(new CountPersonDto(person.Id, person.FullName, person.CreatedAt));
        })
        .WithName("GetCountPersonById");

        // POST /api/count-persons - Create new count person (Admin only)
        group.MapPost("/", [Authorize(Roles = "admin")] async (
            CreateCountPersonRequest request,
            StockCountDbContext db) =>
        {
            var person = new NtfCountPerson
            {
                FullName = request.FullName,
                CreatedAt = DateTime.Now
            };

            db.NtfCountPersons.Add(person);
            await db.SaveChangesAsync();

            return Results.Created($"/api/count-persons/{person.Id}",
                new CountPersonDto(person.Id, person.FullName, person.CreatedAt));
        })
        .WithName("CreateCountPerson");

        // PUT /api/count-persons/{id} - Update count person (Admin only)
        group.MapPut("/{id}", [Authorize(Roles = "admin")] async (
            int id,
            CreateCountPersonRequest request,
            StockCountDbContext db) =>
        {
            var person = await db.NtfCountPersons.FindAsync(id);
            if (person == null)
                return Results.NotFound(new { error = "Count person not found" });

            person.FullName = request.FullName;
            await db.SaveChangesAsync();

            return Results.Ok(new CountPersonDto(person.Id, person.FullName, person.CreatedAt));
        })
        .WithName("UpdateCountPerson");

        // DELETE /api/count-persons/{id} - Delete count person (Admin only)
        group.MapDelete("/{id}", [Authorize(Roles = "admin")] async (
            int id,
            StockCountDbContext db) =>
        {
            var person = await db.NtfCountPersons.FindAsync(id);
            if (person == null)
                return Results.NotFound(new { error = "Count person not found" });

            db.NtfCountPersons.Remove(person);
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Count person deleted successfully" });
        })
        .WithName("DeleteCountPerson");
    }
}
