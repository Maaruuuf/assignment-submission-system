using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Application.Interfaces;

/// <summary>
/// Persistence abstraction consumed by the Application layer. Keeps Application free of any
/// dependency on EF Core's DbContext implementation (or on Infrastructure) - only Infrastructure
/// implements this, via ApplicationDbContext.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Class> Classes { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<TeacherSubjectAssignment> TeacherSubjectAssignments { get; }
    DbSet<StudentClassEnrollment> StudentClassEnrollments { get; }
    DbSet<Assignment> Assignments { get; }
    DbSet<Submission> Submissions { get; }
    DbSet<AppSettings> Settings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    EntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class;
}
