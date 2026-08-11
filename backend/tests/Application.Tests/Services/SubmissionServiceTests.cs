using Application.Common.Exceptions;
using Application.DTOs.Submissions;
using Application.Services;
using Application.Tests.Common;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Services;

public class SubmissionServiceTests
{
    private static Assignment SeedAssignment(
        Infrastructure.Persistence.ApplicationDbContext db,
        Domain.Entities.Class @class,
        Subject subject,
        int teacherId,
        DateTime deadline,
        AssignmentStatus status = AssignmentStatus.Published)
    {
        var assignment = new Assignment
        {
            Title = "Worksheet",
            Description = "desc",
            Deadline = deadline,
            MaxMarks = 100,
            ClassId = @class.Id,
            SubjectId = subject.Id,
            TeacherId = teacherId,
            Status = status
        };
        db.Assignments.Add(assignment);
        db.SaveChanges();
        return assignment;
    }

    [Fact]
    public async Task SubmitAsync_BeforeDeadline_StatusIsPendingAndNotLate()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);

        var result = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "My answer" });

        result.Status.Should().Be(nameof(SubmissionStatus.Pending));
        result.IsLate.Should().BeFalse();
    }

    [Fact]
    public async Task SubmitAsync_AfterDeadline_IsAcceptedAndFlaggedLateButStillPending()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        // Deadline already passed - the assignment itself is still valid, only the submission is late.
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddMinutes(-10));
        var service = new SubmissionService(db);

        var result = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "Late answer" });

        result.IsLate.Should().BeTrue();
        result.Status.Should().Be(nameof(SubmissionStatus.Pending));
    }

    [Fact]
    public async Task SubmitAsync_Twice_ThrowsConflict()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "First" });

        var act = () => service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "Second" });

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task SubmitAsync_ToDraftAssignment_ThrowsBusinessRuleException()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2), AssignmentStatus.Draft);
        var service = new SubmissionService(db);

        var act = () => service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "answer" });

        await act.Should().ThrowAsync<BusinessRuleException>();
    }

    [Fact]
    public async Task SubmitAsync_StudentNotEnrolledInClass_ThrowsForbidden()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, _, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        const int outsiderStudentId = 7777;

        var act = () => service.SubmitAsync(outsiderStudentId, assignment.Id, new CreateSubmissionDto { AnswerText = "answer" });

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateAsync_BeforeDeadline_UpdatesAnswerAndClearsLateFlag()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "First draft" });

        var updated = await service.UpdateAsync(student.Id, submission.Id, new CreateSubmissionDto { AnswerText = "Revised answer" });

        updated.AnswerText.Should().Be("Revised answer");
        updated.IsLate.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAsync_AfterDeadline_ThrowsBusinessRuleException()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddSeconds(1));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "First draft" });

        assignment.Deadline = DateTime.UtcNow.AddMinutes(-1);
        db.SaveChanges();

        var act = () => service.UpdateAsync(student.Id, submission.Id, new CreateSubmissionDto { AnswerText = "Too late" });

        await act.Should().ThrowAsync<BusinessRuleException>();
    }

    [Fact]
    public async Task UpdateAsync_AfterMarksAssigned_ThrowsBusinessRuleException()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "answer" });
        await service.GradeAsync(teacher.Id, UserRole.Teacher, submission.Id, new GradeSubmissionDto { Marks = 90, Feedback = "Great" });

        var act = () => service.UpdateAsync(student.Id, submission.Id, new CreateSubmissionDto { AnswerText = "Trying to sneak an edit in" });

        await act.Should().ThrowAsync<BusinessRuleException>();
    }

    [Fact]
    public async Task UpdateAsync_ByDifferentStudent_ThrowsForbidden()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "Mine" });
        const int anotherStudentId = 6666;

        var act = () => service.UpdateAsync(anotherStudentId, submission.Id, new CreateSubmissionDto { AnswerText = "Not mine" });

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GradeAsync_MarksExceedingMaxMarks_ThrowsBusinessRuleException()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "answer" });

        var act = () => service.GradeAsync(teacher.Id, UserRole.Teacher, submission.Id,
            new GradeSubmissionDto { Marks = 999, Feedback = "too high" });

        await act.Should().ThrowAsync<BusinessRuleException>();
    }

    [Fact]
    public async Task GradeAsync_ByTeacherNotOwningAssignment_ThrowsForbidden()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "answer" });
        const int otherTeacherId = 5555;

        var act = () => service.GradeAsync(otherTeacherId, UserRole.Teacher, submission.Id,
            new GradeSubmissionDto { Marks = 80, Feedback = "good" });

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GradeAsync_ValidMarks_NudgesPendingToReviewedAndSetsGradedAtUtc()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "answer" });

        var graded = await service.GradeAsync(teacher.Id, UserRole.Teacher, submission.Id,
            new GradeSubmissionDto { Marks = 88, Feedback = "Well done" });

        graded.Status.Should().Be(nameof(SubmissionStatus.Reviewed));
        graded.Marks.Should().Be(88);
        graded.GradedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task GradeAsync_DoesNotOverwriteAnExplicitlySetStatus()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "answer" });
        await service.SetStatusAsync(teacher.Id, UserRole.Teacher, submission.Id, SubmissionStatus.Accepted);

        var graded = await service.GradeAsync(teacher.Id, UserRole.Teacher, submission.Id,
            new GradeSubmissionDto { Marks = 70, Feedback = "ok" });

        graded.Status.Should().Be(nameof(SubmissionStatus.Accepted));
    }

    [Fact]
    public async Task SetStatusAsync_ByAdmin_IsAllowedRegardlessOfSubjectAssignment()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = SeedAssignment(db, @class, subject, teacher.Id, DateTime.UtcNow.AddDays(2));
        var service = new SubmissionService(db);
        var submission = await service.SubmitAsync(student.Id, assignment.Id, new CreateSubmissionDto { AnswerText = "answer" });
        const int adminId = 1;

        var result = await service.SetStatusAsync(adminId, UserRole.Admin, submission.Id, SubmissionStatus.Rejected);

        result.Status.Should().Be(nameof(SubmissionStatus.Rejected));
    }
}
