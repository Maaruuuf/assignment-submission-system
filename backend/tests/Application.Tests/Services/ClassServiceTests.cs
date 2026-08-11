using Application.Common.Exceptions;
using Application.DTOs.Classes;
using Application.Services;
using Application.Tests.Common;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Services;

public class ClassServiceTests
{
    [Fact]
    public async Task CreateAsync_DuplicateNameAndSection_ThrowsConflict()
    {
        using var db = TestDbContextFactory.Create();
        var service = new ClassService(db);
        await service.CreateAsync(new CreateClassDto { Name = "Grade 9", Section = "A" });

        var act = () => service.CreateAsync(new CreateClassDto { Name = "Grade 9", Section = "A" });

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_SameNameDifferentSection_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var service = new ClassService(db);
        await service.CreateAsync(new CreateClassDto { Name = "Grade 9", Section = "A" });

        var act = () => service.CreateAsync(new CreateClassDto { Name = "Grade 9", Section = "B" });

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task EnrollStudentAsync_AlreadyEnrolledElsewhere_MovesStudentInsteadOfDuplicating()
    {
        using var db = TestDbContextFactory.Create();
        var student = new User { FullName = "Sam Student", Email = "s@test.local", Role = UserRole.Student, PasswordHash = "x" };
        db.Users.Add(student);
        db.SaveChanges();
        var service = new ClassService(db);
        var classA = await service.CreateAsync(new CreateClassDto { Name = "Grade 9", Section = "A" });
        var classB = await service.CreateAsync(new CreateClassDto { Name = "Grade 10", Section = "B" });
        await service.EnrollStudentAsync(classA.Id, student.Id);

        await service.EnrollStudentAsync(classB.Id, student.Id);

        var roster = await service.GetStudentRosterAsync();
        roster.Should().ContainSingle(r => r.StudentId == student.Id && r.ClassId == classB.Id);
    }

    [Fact]
    public async Task GetMyClassAsync_ReturnsTheStudentsSingleEnrollment()
    {
        using var db = TestDbContextFactory.Create();
        var student = new User { FullName = "Sam Student", Email = "s@test.local", Role = UserRole.Student, PasswordHash = "x" };
        db.Users.Add(student);
        db.SaveChanges();
        var service = new ClassService(db);
        var classA = await service.CreateAsync(new CreateClassDto { Name = "Grade 9", Section = "A" });
        await service.EnrollStudentAsync(classA.Id, student.Id);

        var myClass = await service.GetMyClassAsync(student.Id);

        myClass.Should().NotBeNull();
        myClass!.Id.Should().Be(classA.Id);
    }
}
