using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Submissions;

public class CreateSubmissionDto
{
    [Required]
    public string AnswerText { get; set; } = string.Empty;

    /// <summary>Set after uploading via POST /api/uploads - optional, attaches alongside the typed answer.</summary>
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
}
