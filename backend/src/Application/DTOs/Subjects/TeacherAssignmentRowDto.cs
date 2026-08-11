namespace Application.DTOs.Subjects;

/// <summary>One row of the admin "which teacher teaches which class+subject" roster - see SubjectService.GetTeacherRosterAsync.</summary>
public class TeacherAssignmentRowDto
{
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public int SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
}
