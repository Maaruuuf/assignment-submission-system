using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Subjects;

/// <summary>Used by Admin to link a teacher to a subject (and therefore its class).</summary>
public class AssignTeacherDto
{
    [Required]
    public int TeacherId { get; set; }

    [Required]
    public int SubjectId { get; set; }
}
