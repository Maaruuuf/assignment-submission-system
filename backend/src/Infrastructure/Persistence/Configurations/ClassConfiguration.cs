using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ClassConfiguration : IEntityTypeConfiguration<Class>
{
    public void Configure(EntityTypeBuilder<Class> builder)
    {
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Section).IsRequired().HasMaxLength(50);

        // Enforced at the DB level too, not just in ClassService - see requirement "Class + Section = Unique".
        builder.HasIndex(c => new { c.Name, c.Section }).IsUnique();
    }
}
