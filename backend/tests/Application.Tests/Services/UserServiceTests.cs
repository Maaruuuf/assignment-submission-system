using Application.DTOs.Users;
using Application.Services;
using Application.Tests.Common;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Services;

file class FakePasswordHasher2 : Application.Interfaces.IPasswordHasher
{
    public string Hash(string plainTextPassword) => plainTextPassword;
    public bool Verify(string plainTextPassword, string hash) => hash == plainTextPassword;
}

public class UserServiceTests
{
    [Fact]
    public async Task DeactivateAsync_UserStillExistsButIsInactive()
    {
        using var db = TestDbContextFactory.Create();
        var service = new UserService(db, new FakePasswordHasher2());
        var created = await service.CreateAsync(new CreateUserDto { FullName = "Sam Student", Email = "sam@school.edu", Password = "x", Role = "Student" });

        await service.DeactivateAsync(created.Id);

        var reloaded = await service.GetByIdAsync(created.Id);
        reloaded.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_RemovesTheUserEntirely()
    {
        using var db = TestDbContextFactory.Create();
        var service = new UserService(db, new FakePasswordHasher2());
        var created = await service.CreateAsync(new CreateUserDto { FullName = "Sam Student", Email = "sam@school.edu", Password = "x", Role = "Student" });

        await service.DeleteAsync(created.Id);

        var act = () => service.GetByIdAsync(created.Id);
        await act.Should().ThrowAsync<Application.Common.Exceptions.NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_StudentWithSubmission_RemovesEnrollmentAndSubmissionToo()
    {
        using var db = TestDbContextFactory.Create();
        var (teacher, student, @class, subject) = SeedHelper.SeedTeachingContext(db);
        var assignment = new Assignment
        {
            Title = "Worksheet", Description = "d", Deadline = DateTime.UtcNow.AddDays(2), MaxMarks = 100,
            ClassId = @class.Id, SubjectId = subject.Id, TeacherId = teacher.Id, Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);
        db.SaveChanges();
        db.Submissions.Add(new Submission { AssignmentId = assignment.Id, StudentId = student.Id, AnswerText = "answer", SubmittedAtUtc = DateTime.UtcNow });
        db.SaveChanges();
        var service = new UserService(db, new FakePasswordHasher2());

        await service.DeleteAsync(student.Id);

        db.Submissions.Any(s => s.StudentId == student.Id).Should().BeFalse();
        db.StudentClassEnrollments.Any(e => e.StudentId == student.Id).Should().BeFalse();
    }
}
