using Domain.Common;

namespace Domain.Entities;

/// <summary>
/// A subject taught within a specific class (e.g. "Mathematics" for "Grade 10 - Section A").
/// </summary>
public class Subject : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public ICollection<TeacherSubjectAssignment> TeacherAssignments { get; set; } = new List<TeacherSubjectAssignment>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
