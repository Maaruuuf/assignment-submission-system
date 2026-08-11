using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;

namespace Application.Tests.Common;

/// <summary>
/// Minimal, reusable set of related entities (one teacher, one class, one subject the teacher
/// is assigned to, one enrolled student) that most Assignment/Submission tests build on top of.
/// </summary>
public static class SeedHelper
{
    public static (User Teacher, User Student, Class Class, Subject Subject) SeedTeachingContext(ApplicationDbContext db)
    {
        var teacher = new User { FullName = "Tom Teacher", Email = "teacher@test.local", Role = UserRole.Teacher, PasswordHash = "x" };
        var student = new User { FullName = "Sam Student", Email = "student@test.local", Role = UserRole.Student, PasswordHash = "x" };
        db.Users.AddRange(teacher, student);
        db.SaveChanges();

        var @class = new Class { Name = "Grade 10", Section = "A" };
        db.Classes.Add(@class);
        db.SaveChanges();

        var subject = new Subject { Name = "Mathematics", ClassId = @class.Id };
        db.Subjects.Add(subject);
        db.SaveChanges();

        db.TeacherSubjectAssignments.Add(new TeacherSubjectAssignment { TeacherId = teacher.Id, SubjectId = subject.Id });
        db.StudentClassEnrollments.Add(new StudentClassEnrollment { StudentId = student.Id, ClassId = @class.Id });
        db.SaveChanges();

        return (teacher, student, @class, subject);
    }
}
