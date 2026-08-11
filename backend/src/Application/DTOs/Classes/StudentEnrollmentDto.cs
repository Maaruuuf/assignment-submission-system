namespace Application.DTOs.Classes;

/// <summary>One row of the admin "which student is in which class" roster - see ClassService.GetStudentRosterAsync.</summary>
public class StudentEnrollmentDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
}
