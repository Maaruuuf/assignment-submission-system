using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// A student's submission against a single assignment. One submission per (assignment, student).
/// </summary>
public class Submission : BaseEntity
{
    public int AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public int StudentId { get; set; }
    public User Student { get; set; } = null!;

    public string AnswerText { get; set; } = string.Empty;
    public DateTime SubmittedAtUtc { get; set; } = DateTime.UtcNow;
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Pending;

    /// <summary>True if SubmittedAtUtc was after the assignment's deadline. Purely informational -
    /// it never blocks a submission, it just flags it for the teacher.</summary>
    public bool IsLate { get; set; }

    /// <summary>Optional attached file (PDF/DOCX/image) alongside or instead of the typed answer.</summary>
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }

    public int? Marks { get; set; }
    public string? Feedback { get; set; }
    public DateTime? GradedAtUtc { get; set; }
}
