using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Submissions;

public class GradeSubmissionDto
{
    [Required, Range(0, 1000)]
    public int Marks { get; set; }

    public string? Feedback { get; set; }
}
