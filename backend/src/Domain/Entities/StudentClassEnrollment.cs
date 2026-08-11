using Domain.Common;

namespace Domain.Entities;

/// <summary>
/// Join entity: which class a student belongs to.
/// This is the source of truth for "can this student see/submit to this assignment?".
/// </summary>
public class StudentClassEnrollment : BaseEntity
{
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;

    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;
}
