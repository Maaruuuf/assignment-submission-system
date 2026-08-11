namespace Application.DTOs.Subjects;

public class SubjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string ClassSection { get; set; } = string.Empty;

    /// <summary>At most one teacher per subject - see SubjectService.AssignTeacherAsync.</summary>
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }
}
