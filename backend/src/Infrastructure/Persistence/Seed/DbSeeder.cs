using Domain.Entities;
using Domain.Enums;
using Infrastructure.Auth;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Seed;

/// <summary>
/// Seeds a small but complete demo dataset - one account per role (as required by the submission
/// checklist), a class/subject structure, a teacher assignment, a student enrollment and a couple
/// of sample assignments/submissions so every screen has something to show on first run.
///
/// Idempotent: safe to call on every startup, it only inserts data when the Users table is empty.
/// </summary>
public static class DbSeeder
{
    public const string DemoPassword = "Passw0rd!";

    public static async Task SeedAsync(ApplicationDbContext db)
    {
        await db.Database.MigrateAsync();

        if (await db.Users.AnyAsync()) return; // already seeded

        var hasher = new PasswordHasher();

        var admin = new User { FullName = "Alice Admin", Email = "admin@school.edu", Role = UserRole.Admin, PasswordHash = hasher.Hash(DemoPassword) };
        var teacher = new User { FullName = "Tom Teacher", Email = "teacher@school.edu", Role = UserRole.Teacher, PasswordHash = hasher.Hash(DemoPassword) };
        var student1 = new User { FullName = "Sam Student", Email = "student@school.edu", Role = UserRole.Student, PasswordHash = hasher.Hash(DemoPassword) };
        var student2 = new User { FullName = "Sara Scholar", Email = "student2@school.edu", Role = UserRole.Student, PasswordHash = hasher.Hash(DemoPassword) };

        db.Users.AddRange(admin, teacher, student1, student2);
        await db.SaveChangesAsync();

        var grade10 = new Class { Name = "Grade 10", Section = "A" };
        db.Classes.Add(grade10);
        await db.SaveChangesAsync();

        var mathematics = new Subject { Name = "Mathematics", ClassId = grade10.Id };
        db.Subjects.Add(mathematics);
        await db.SaveChangesAsync();

        db.TeacherSubjectAssignments.Add(new TeacherSubjectAssignment { TeacherId = teacher.Id, SubjectId = mathematics.Id });
        db.StudentClassEnrollments.Add(new StudentClassEnrollment { StudentId = student1.Id, ClassId = grade10.Id });
        db.StudentClassEnrollments.Add(new StudentClassEnrollment { StudentId = student2.Id, ClassId = grade10.Id });
        await db.SaveChangesAsync();

        var published = new Assignment
        {
            Title = "Algebra Basics - Worksheet 1",
            Description = "Solve the ten linear equations attached in class and show your working.",
            Deadline = DateTime.UtcNow.AddDays(7),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            ClassId = grade10.Id,
            SubjectId = mathematics.Id,
            TeacherId = teacher.Id
        };
        var draft = new Assignment
        {
            Title = "Quadratic Equations - Worksheet 2",
            Description = "Draft - not yet visible to students.",
            Deadline = DateTime.UtcNow.AddDays(14),
            MaxMarks = 100,
            Status = AssignmentStatus.Draft,
            ClassId = grade10.Id,
            SubjectId = mathematics.Id,
            TeacherId = teacher.Id
        };
        db.Assignments.AddRange(published, draft);
        await db.SaveChangesAsync();

        db.Submissions.Add(new Submission
        {
            AssignmentId = published.Id,
            StudentId = student1.Id,
            AnswerText = "1) x=2  2) x=5  3) x=-1 ... (sample answer)",
            SubmittedAtUtc = DateTime.UtcNow,
            Status = SubmissionStatus.Pending,
            IsLate = false
        });
        await db.SaveChangesAsync();

        db.Settings.Add(new Domain.Entities.AppSettings());
        await db.SaveChangesAsync();
    }
}
