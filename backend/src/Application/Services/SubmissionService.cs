using Application.Common.Exceptions;
using Application.DTOs.Submissions;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

/// <summary>
/// Submission workflow: students submit/update their own answers, teachers review, grade and
/// set a status. Business rules enforced here (also covered by unit tests):
///   - A student may only submit to a Published assignment for a class they are enrolled in.
///   - One submission per (assignment, student) - the first call creates it, later calls must use Update.
///   - A submission made after the deadline is accepted, never rejected - it's only flagged IsLate.
///   - A submission may only be *updated* while the deadline hasn't passed AND it hasn't been marked yet.
///   - Only the teacher assigned to the assignment's subject (or an Admin) may grade, review or list submissions.
///   - Status (Pending/Reviewed/Accepted/Rejected) is a separate, teacher-controlled workflow field -
///     grading sets marks/feedback but only nudges Pending -> Reviewed as a default, never overwrites
///     a status the teacher already chose deliberately.
/// </summary>
public class SubmissionService
{
    private readonly IApplicationDbContext _db;

    public SubmissionService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<SubmissionDto> SubmitAsync(int studentId, int assignmentId, CreateSubmissionDto dto, CancellationToken cancellationToken = default)
    {
        var assignment = await _db.Assignments.SingleOrDefaultAsync(a => a.Id == assignmentId, cancellationToken)
                          ?? throw new NotFoundException(nameof(Assignment), assignmentId);

        if (assignment.Status != AssignmentStatus.Published)
        {
            throw new BusinessRuleException("You can only submit to a published assignment.");
        }

        var isEnrolled = await _db.StudentClassEnrollments
            .AnyAsync(e => e.StudentId == studentId && e.ClassId == assignment.ClassId, cancellationToken);
        if (!isEnrolled)
        {
            throw new ForbiddenException("You are not enrolled in the class this assignment belongs to.");
        }

        var alreadySubmitted = await _db.Submissions
            .AnyAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId, cancellationToken);
        if (alreadySubmitted)
        {
            throw new ConflictException("You have already submitted this assignment. Use the update endpoint to change your answer.");
        }

        var now = DateTime.UtcNow;
        var submission = new Submission
        {
            AssignmentId = assignmentId,
            StudentId = studentId,
            AnswerText = dto.AnswerText.Trim(),
            FileUrl = dto.FileUrl,
            FileName = dto.FileName,
            SubmittedAtUtc = now,
            Status = SubmissionStatus.Pending,
            // Late submissions are accepted, not blocked - they are simply flagged for the teacher.
            IsLate = now > assignment.Deadline
        };

        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync(cancellationToken);

        return await MapToDtoAsync(submission, cancellationToken);
    }

    public async Task<SubmissionDto> UpdateAsync(int studentId, int submissionId, CreateSubmissionDto dto, CancellationToken cancellationToken = default)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .SingleOrDefaultAsync(s => s.Id == submissionId, cancellationToken)
            ?? throw new NotFoundException(nameof(Submission), submissionId);

        if (submission.StudentId != studentId)
        {
            throw new ForbiddenException("You can only update your own submissions.");
        }

        if (DateTime.UtcNow > submission.Assignment.Deadline)
        {
            throw new BusinessRuleException("This assignment's deadline has passed; the submission can no longer be updated.");
        }

        if (submission.Marks.HasValue)
        {
            throw new BusinessRuleException("This submission has already been marked and can no longer be updated.");
        }

        submission.AnswerText = dto.AnswerText.Trim();
        submission.FileUrl = dto.FileUrl ?? submission.FileUrl;
        submission.FileName = dto.FileName ?? submission.FileName;
        submission.SubmittedAtUtc = DateTime.UtcNow;
        submission.UpdatedAtUtc = DateTime.UtcNow;
        // Still before the deadline (checked above), so an update is never late.
        submission.IsLate = false;

        await _db.SaveChangesAsync(cancellationToken);
        return await MapToDtoAsync(submission, cancellationToken);
    }

    /// <summary>Grades a submission. Only the teacher assigned to the assignment's subject (or an Admin) may call this.</summary>
    public async Task<SubmissionDto> GradeAsync(int graderId, UserRole graderRole, int submissionId, GradeSubmissionDto dto, CancellationToken cancellationToken = default)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .SingleOrDefaultAsync(s => s.Id == submissionId, cancellationToken)
            ?? throw new NotFoundException(nameof(Submission), submissionId);

        await EnsureCanManageAssignmentAsync(graderId, graderRole, submission.Assignment, cancellationToken);

        if (dto.Marks > submission.Assignment.MaxMarks)
        {
            throw new BusinessRuleException($"Marks cannot exceed the assignment's maximum of {submission.Assignment.MaxMarks}.");
        }

        submission.Marks = dto.Marks;
        submission.Feedback = dto.Feedback?.Trim();
        submission.GradedAtUtc = DateTime.UtcNow;
        submission.UpdatedAtUtc = DateTime.UtcNow;
        // Grading nudges a still-Pending submission to Reviewed as a sensible default, but never
        // overwrites a status the teacher already set deliberately (e.g. Accepted/Rejected).
        if (submission.Status == SubmissionStatus.Pending)
        {
            submission.Status = SubmissionStatus.Reviewed;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return await MapToDtoAsync(submission, cancellationToken);
    }

    /// <summary>Lets a teacher/admin move a submission through Pending/Reviewed/Accepted/Rejected.</summary>
    public async Task<SubmissionDto> SetStatusAsync(int userId, UserRole role, int submissionId, SubmissionStatus status, CancellationToken cancellationToken = default)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .SingleOrDefaultAsync(s => s.Id == submissionId, cancellationToken)
            ?? throw new NotFoundException(nameof(Submission), submissionId);

        await EnsureCanManageAssignmentAsync(userId, role, submission.Assignment, cancellationToken);

        submission.Status = status;
        submission.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return await MapToDtoAsync(submission, cancellationToken);
    }

    /// <summary>All submissions for one assignment - teacher who owns it, or Admin.</summary>
    public async Task<List<SubmissionDto>> GetForAssignmentAsync(int userId, UserRole role, int assignmentId, CancellationToken cancellationToken = default)
    {
        var assignment = await _db.Assignments.SingleOrDefaultAsync(a => a.Id == assignmentId, cancellationToken)
                          ?? throw new NotFoundException(nameof(Assignment), assignmentId);

        await EnsureCanManageAssignmentAsync(userId, role, assignment, cancellationToken);

        var submissions = await _db.Submissions
            .Include(s => s.Assignment).Include(s => s.Student)
            .Where(s => s.AssignmentId == assignmentId)
            .OrderBy(s => s.SubmittedAtUtc)
            .ToListAsync(cancellationToken);

        return submissions.Select(MapToDto).ToList();
    }

    /// <summary>A student's own submissions across every assignment.</summary>
    public async Task<List<SubmissionDto>> GetForStudentAsync(int studentId, CancellationToken cancellationToken = default)
    {
        var submissions = await _db.Submissions
            .Include(s => s.Assignment).Include(s => s.Student)
            .Where(s => s.StudentId == studentId)
            .OrderByDescending(s => s.SubmittedAtUtc)
            .ToListAsync(cancellationToken);

        return submissions.Select(MapToDto).ToList();
    }

    /// <summary>
    /// Confirms the caller may manage (view/grade/status-change) submissions for this assignment:
    /// Admins always can; Teachers only if they are the assignment's own teacher.
    /// </summary>
    private static Task EnsureCanManageAssignmentAsync(int userId, UserRole role, Assignment assignment, CancellationToken cancellationToken)
    {
        if (role == UserRole.Admin) return Task.CompletedTask;

        if (role == UserRole.Teacher && assignment.TeacherId == userId) return Task.CompletedTask;

        throw new ForbiddenException("You are not authorized to manage submissions for this assignment.");
    }

    private async Task<SubmissionDto> MapToDtoAsync(Submission submission, CancellationToken cancellationToken)
    {
        await _db.Entry(submission).Reference(s => s.Assignment).LoadAsync(cancellationToken);
        await _db.Entry(submission).Reference(s => s.Student).LoadAsync(cancellationToken);
        return MapToDto(submission);
    }

    private static SubmissionDto MapToDto(Submission s) => new()
    {
        Id = s.Id,
        AssignmentId = s.AssignmentId,
        AssignmentTitle = s.Assignment.Title,
        StudentId = s.StudentId,
        StudentName = s.Student.FullName,
        AnswerText = s.AnswerText,
        FileUrl = s.FileUrl,
        FileName = s.FileName,
        SubmittedAtUtc = s.SubmittedAtUtc,
        Status = s.Status.ToString(),
        IsLate = s.IsLate,
        Marks = s.Marks,
        Feedback = s.Feedback,
        GradedAtUtc = s.GradedAtUtc
    };
}
