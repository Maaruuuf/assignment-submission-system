using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Assignments;

public class UpdateAssignmentDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime Deadline { get; set; }

    [Required, Range(1, 1000)]
    public int MaxMarks { get; set; }
}
