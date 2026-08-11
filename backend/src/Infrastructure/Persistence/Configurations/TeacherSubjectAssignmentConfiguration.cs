using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class TeacherSubjectAssignmentConfiguration : IEntityTypeConfiguration<TeacherSubjectAssignment>
{
    public void Configure(EntityTypeBuilder<TeacherSubjectAssignment> builder)
    {
        builder.HasOne(a => a.Teacher)
            .WithMany(u => u.TeacherAssignments)
            .HasForeignKey(a => a.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Subject)
            .WithMany(s => s.TeacherAssignments)
            .HasForeignKey(a => a.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // One subject can have at most ONE teacher (SubjectId alone is unique) - but a teacher
        // may be linked to as many subjects/classes as needed, so TeacherId is not part of this
        // index. Reassigning a subject to a different teacher updates this row rather than adding
        // a second one - see SubjectService.AssignTeacherAsync.
        builder.HasIndex(a => a.SubjectId).IsUnique();
    }
}
