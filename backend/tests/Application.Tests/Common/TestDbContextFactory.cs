using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Application.Tests.Common;

/// <summary>
/// Builds a fresh, isolated ApplicationDbContext backed by EF Core's InMemory provider for each
/// test. A unique database name per call guarantees tests never see each other's data, even
/// when run in parallel.
/// </summary>
public static class TestDbContextFactory
{
    public static ApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
