using Application.Common.Exceptions;
using Application.DTOs.Assignments;
using Application.Services;
using Application.Tests.Common;
using Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Services;

public class AssignmentServiceTests
{
    [Fact]
    public async Task CreateAsync_TeacherAssignedToSubject_CreatesDraftByDefault()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, _, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var service = new AssignmentService(db);

        var dto = new CreateAssignmentDto
        {
            Title = "Worksheet 1",
            Description = "Solve the attached problems.",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 100,
            ClassId = @class.Id,
            SubjectId = subject.Id,
            PublishImmediately = false
        };

        var result = await service.CreateAsync(teacher.Id, dto);

        result.Status.Should().Be(nameof(AssignmentStatus.Draft));
        result.TeacherId.Should().Be(teacher.Id);
    }

    [Fact]
    public async Task CreateAsync_PublishImmediatelyTrue_CreatesPublished()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, _, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var service = new AssignmentService(db);

        var dto = new CreateAssignmentDto
        {
            Title = "Worksheet 1",
            Description = "Solve the attached problems.",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 100,
            ClassId = @class.Id,
            SubjectId = subject.Id,
            PublishImmediately = true
        };

        var result = await service.CreateAsync(teacher.Id, dto);

        result.Status.Should().Be(nameof(AssignmentStatus.Published));
    }

    [Fact]
    public async Task CreateAsync_TeacherNotAssignedToSubject_ThrowsForbidden()
    {
        using var db = TestDbContextFactory.Create();
        var (_, _, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var service = new AssignmentService(db);
        const int unassignedTeacherId = 9999;

        var dto = new CreateAssignmentDto
        {
            Title = "Worksheet 1",
            Description = "desc",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 100,
            ClassId = @class.Id,
            SubjectId = subject.Id
        };

        var act = () => service.CreateAsync(unassignedTeacherId, dto);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task CreateAsync_DeadlineInPast_ThrowsBusinessRuleException()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, _, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var service = new AssignmentService(db);

        var dto = new CreateAssignmentDto
        {
            Title = "Worksheet 1",
            Description = "desc",
            Deadline = DateTime.UtcNow.AddDays(-1),
            MaxMarks = 100,
            ClassId = @class.Id,
            SubjectId = subject.Id
        };

        var act = () => service.CreateAsync(teacher.Id, dto);

        await act.Should().ThrowAsync<BusinessRuleException>();
    }

    [Fact]
    public async Task GetForStudentAsync_OnlyReturnsPublishedAssignmentsForEnrolledClass()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var service = new AssignmentService(db);

        await service.CreateAsync(teacher.Id, new CreateAssignmentDto
        {
            Title = "Published one", Description = "d", Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 100, ClassId = @class.Id, SubjectId = subject.Id, PublishImmediately = true
        });
        await service.CreateAsync(teacher.Id, new CreateAssignmentDto
        {
            Title = "Still a draft", Description = "d", Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 100, ClassId = @class.Id, SubjectId = subject.Id, PublishImmediately = false
        });

        var visibleToStudent = await service.GetForStudentAsync(student.Id);

        visibleToStudent.Should().HaveCount(1);
        visibleToStudent[0].Title.Should().Be("Published one");
    }

    [Fact]
    public async Task UpdateAsync_ByNonOwningTeacher_ThrowsForbidden()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, _, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var service = new AssignmentService(db);

        var created = await service.CreateAsync(teacher.Id, new CreateAssignmentDto
        {
            Title = "Worksheet 1", Description = "d", Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 100, ClassId = @class.Id, SubjectId = subject.Id
        });

        const int someOtherTeacherId = 8888;
        var act = () => service.UpdateAsync(someOtherTeacherId, created.Id, new UpdateAssignmentDto
        {
            Title = "Hacked title", Description = "d", Deadline = DateTime.UtcNow.AddDays(3), MaxMarks = 100
        });

        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
