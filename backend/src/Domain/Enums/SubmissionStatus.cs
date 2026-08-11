namespace Domain.Enums;

/// <summary>
/// Teacher-controlled review status for a submission, independent of grading. A submission
/// starts Pending on creation; the teacher can move it through the workflow (and back again)
/// via the status endpoint regardless of whether marks have been recorded yet.
/// Lateness is tracked separately via Submission.IsLate - it is not a status value, so a
/// late submission still goes through the same Pending -> Reviewed/Accepted/Rejected flow.
/// </summary>
public enum SubmissionStatus
{
    Pending = 0,
    Reviewed = 1,
    Accepted = 2,
    Rejected = 3
}
