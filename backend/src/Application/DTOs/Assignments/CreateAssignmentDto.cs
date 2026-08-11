using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Assignments;

public class CreateAssignmentDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime Deadline { get; set; }

    [Required, Range(1, 1000)]
    public int MaxMarks { get; set; }

    [Required]
    public int ClassId { get; set; }

    [Required]
    public int SubjectId { get; set; }

    /// <summary>If true the assignment is created as Published; otherwise it is saved as Draft.</summary>
    public bool PublishImmediately { get; set; } = false;
}
