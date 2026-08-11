using Domain.Common;

namespace Domain.Entities;

/// <summary>
/// A class/course (e.g. "Grade 10 - Section A"). Subjects and student enrollments hang off this.
/// Name+Section together must be unique - see ClassConfiguration and ClassService.
/// </summary>
public class Class : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Never null - stored as "" when the class has no section, so the Name+Section
    /// uniqueness check (and its DB index) behaves consistently instead of tripping over NULLs.</summary>
    public string Section { get; set; } = string.Empty;

    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    public ICollection<StudentClassEnrollment> Enrollments { get; set; } = new List<StudentClassEnrollment>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
