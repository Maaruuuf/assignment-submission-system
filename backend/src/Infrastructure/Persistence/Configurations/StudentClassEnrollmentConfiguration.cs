using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class StudentClassEnrollmentConfiguration : IEntityTypeConfiguration<StudentClassEnrollment>
{
    public void Configure(EntityTypeBuilder<StudentClassEnrollment> builder)
    {
        builder.HasOne(e => e.Student)
            .WithMany(u => u.Enrollments)
            .HasForeignKey(e => e.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Class)
            .WithMany(c => c.Enrollments)
            .HasForeignKey(e => e.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        // A student can only have ONE active enrollment (StudentId alone is unique) - moving a
        // student to a different class updates this row rather than adding a second one, see
        // ClassService.EnrollStudentAsync.
        builder.HasIndex(e => e.StudentId).IsUnique();
    }
}
