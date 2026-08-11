using Application.Common.Exceptions;
using Application.DTOs.Subjects;
using Application.Services;
using Application.Tests.Common;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Application.Tests.Services;

public class SubjectServiceTests
{
    [Fact]
    public async Task AssignTeacherAsync_ToUnassignedSubject_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var teacher = new User { FullName = "Tom Teacher", Email = "t@test.local", Role = UserRole.Teacher, PasswordHash = "x" };
        var @class = new Class { Name = "Grade 10", Section = "A" };
        db.Users.Add(teacher);
        db.Classes.Add(@class);
        db.SaveChanges();
        var subject = new Subject { Name = "Maths", ClassId = @class.Id };
        db.Subjects.Add(subject);
        db.SaveChanges();
        var service = new SubjectService(db);

        await service.AssignTeacherAsync(new AssignTeacherDto { TeacherId = teacher.Id, SubjectId = subject.Id });

        var subjects = await service.GetAllAsync();
        subjects.Single(s => s.Id == subject.Id).TeacherName.Should().Be(teacher.FullName);
    }

    [Fact]
    public async Task AssignTeacherAsync_OneTeacherCanTeachManySubjects()
    {
        using var db = TestDbContextFactory.Create();
        var teacher = new User { FullName = "Tom Teacher", Email = "t@test.local", Role = UserRole.Teacher, PasswordHash = "x" };
        var classA = new Class { Name = "Grade 9", Section = "A" };
        var classB = new Class { Name = "Grade 9", Section = "B" };
        db.Users.Add(teacher);
        db.Classes.AddRange(classA, classB);
        db.SaveChanges();
        var subjectA = new Subject { Name = "Maths", ClassId = classA.Id };
        var subjectB = new Subject { Name = "Maths", ClassId = classB.Id };
        db.Subjects.AddRange(subjectA, subjectB);
        db.SaveChanges();
        var service = new SubjectService(db);

        await service.AssignTeacherAsync(new AssignTeacherDto { TeacherId = teacher.Id, SubjectId = subjectA.Id });
        await service.AssignTeacherAsync(new AssignTeacherDto { TeacherId = teacher.Id, SubjectId = subjectB.Id });

        var mine = await service.GetMineAsync(teacher.Id);
        mine.Should().HaveCount(2);
    }

    [Fact]
    public async Task AssignTeacherAsync_ToSubjectAlreadyAssignedToAnotherTeacher_Reassigns()
    {
        using var db = TestDbContextFactory.Create();
        var teacherA = new User { FullName = "Teacher A", Email = "a@test.local", Role = UserRole.Teacher, PasswordHash = "x" };
        var teacherB = new User { FullName = "Teacher B", Email = "b@test.local", Role = UserRole.Teacher, PasswordHash = "x" };
        var @class = new Class { Name = "Grade 9", Section = "A" };
        db.Users.AddRange(teacherA, teacherB);
        db.Classes.Add(@class);
        db.SaveChanges();
        var subject = new Subject { Name = "Mathematics", ClassId = @class.Id };
        db.Subjects.Add(subject);
        db.SaveChanges();
        var service = new SubjectService(db);
        await service.AssignTeacherAsync(new AssignTeacherDto { TeacherId = teacherA.Id, SubjectId = subject.Id });

        await service.AssignTeacherAsync(new AssignTeacherDto { TeacherId = teacherB.Id, SubjectId = subject.Id });

        var subjects = await service.GetAllAsync();
        var updated = subjects.Single(s => s.Id == subject.Id);
        updated.TeacherId.Should().Be(teacherB.Id);
        (await db.TeacherSubjectAssignments.CountAsync(a => a.SubjectId == subject.Id)).Should().Be(1);
    }

    [Fact]
    public async Task AssignTeacherAsync_SameTeacherTwice_ThrowsConflict()
    {
        using var db = TestDbContextFactory.Create();
        var teacher = new User { FullName = "Tom Teacher", Email = "t@test.local", Role = UserRole.Teacher, PasswordHash = "x" };
        var @class = new Class { Name = "Grade 9", Section = "A" };
        db.Users.Add(teacher);
        db.Classes.Add(@class);
        db.SaveChanges();
        var subject = new Subject { Name = "Mathematics", ClassId = @class.Id };
        db.Subjects.Add(subject);
        db.SaveChanges();
        var service = new SubjectService(db);
        await service.AssignTeacherAsync(new AssignTeacherDto { TeacherId = teacher.Id, SubjectId = subject.Id });

        var act = () => service.AssignTeacherAsync(new AssignTeacherDto { TeacherId = teacher.Id, SubjectId = subject.Id });

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_DuplicateClassSubject_ThrowsConflict()
    {
        using var db = TestDbContextFactory.Create();
        var @class = new Class { Name = "Grade 9", Section = "A" };
        db.Classes.Add(@class);
        db.SaveChanges();
        var service = new SubjectService(db);
        await service.CreateAsync(new CreateSubjectDto { Name = "Mathematics", ClassId = @class.Id });

        var act = () => service.CreateAsync(new CreateSubjectDto { Name = "Mathematics", ClassId = @class.Id });

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_SameSubjectNameDifferentClass_Succeeds()
    {
        using var db = TestDbContextFactory.Create();
        var classA = new Class { Name = "Grade 9", Section = "A" };
        var classB = new Class { Name = "Grade 10", Section = "A" };
        db.Classes.AddRange(classA, classB);
        db.SaveChanges();
        var service = new SubjectService(db);
        await service.CreateAsync(new CreateSubjectDto { Name = "Mathematics", ClassId = classA.Id });

        var act = () => service.CreateAsync(new CreateSubjectDto { Name = "Mathematics", ClassId = classB.Id });

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task UpdateAsync_RenamesSubject()
    {
        using var db = TestDbContextFactory.Create();
        var @class = new Class { Name = "Grade 10", Section = "A" };
        db.Classes.Add(@class);
        db.SaveChanges();
        var subject = new Subject { Name = "Mathmatics", ClassId = @class.Id };
        db.Subjects.Add(subject);
        db.SaveChanges();
        var service = new SubjectService(db);

        var updated = await service.UpdateAsync(subject.Id, new CreateSubjectDto { Name = "Mathematics", ClassId = @class.Id });

        updated.Name.Should().Be("Mathematics");
    }
}
