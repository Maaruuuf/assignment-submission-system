namespace Application.DTOs.Submissions;

public class SubmissionDto
{
    public int Id { get; set; }
    public int AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AnswerText { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public DateTime SubmittedAtUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsLate { get; set; }
    public int? Marks { get; set; }
    public string? Feedback { get; set; }
    public DateTime? GradedAtUtc { get; set; }
}
