using Domain.Common;

namespace Domain.Entities;

/// <summary>
/// Join entity: which teacher is assigned to which subject in which class.
/// This is the source of truth for "can this teacher create/grade assignments for this subject?".
/// </summary>
public class TeacherSubjectAssignment : BaseEntity
{
    public int TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
}
