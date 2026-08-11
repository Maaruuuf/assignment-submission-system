using Application.Common.Exceptions;
using Application.DTOs.Classes;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

/// <summary>Admin-only management of classes/courses, plus student-enrollment.</summary>
public class ClassService
{
    private readonly IApplicationDbContext _db;

    public ClassService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<ClassDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Classes
            .OrderBy(c => c.Name).ThenBy(c => c.Section)
            .Select(c => new ClassDto { Id = c.Id, Name = c.Name, Section = c.Section })
            .ToListAsync(cancellationToken);
    }

    public async Task<ClassDto> CreateAsync(CreateClassDto dto, CancellationToken cancellationToken = default)
    {
        var name = dto.Name.Trim();
        var section = dto.Section?.Trim() ?? string.Empty;
        await EnsureNameSectionIsUniqueAsync(name, section, excludingId: null, cancellationToken);

        var entity = new Class { Name = name, Section = section };
        _db.Classes.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return new ClassDto { Id = entity.Id, Name = entity.Name, Section = entity.Section };
    }

    public async Task<ClassDto> UpdateAsync(int id, CreateClassDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _db.Classes.FindAsync(new object[] { id }, cancellationToken)
                     ?? throw new NotFoundException(nameof(Class), id);

        var name = dto.Name.Trim();
        var section = dto.Section?.Trim() ?? string.Empty;
        await EnsureNameSectionIsUniqueAsync(name, section, excludingId: id, cancellationToken);

        entity.Name = name;
        entity.Section = section;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return new ClassDto { Id = entity.Id, Name = entity.Name, Section = entity.Section };
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _db.Classes.FindAsync(new object[] { id }, cancellationToken)
                     ?? throw new NotFoundException(nameof(Class), id);

        var hasDependents = await _db.Subjects.AnyAsync(s => s.ClassId == id, cancellationToken)
                             || await _db.StudentClassEnrollments.AnyAsync(e => e.ClassId == id, cancellationToken);
        if (hasDependents)
        {
            throw new BusinessRuleException("Cannot delete a class that still has subjects or enrolled students.");
        }

        _db.Classes.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Enrolls a student in a class. A student can only have one active enrollment at a time
    /// (enforced by a unique index on StudentId), so if they're already enrolled elsewhere this
    /// MOVES them to the new class rather than adding a second enrollment. Re-enrolling in the
    /// class they're already in is a no-op.
    /// </summary>
    public async Task EnrollStudentAsync(int classId, int studentId, CancellationToken cancellationToken = default)
    {
        var classExists = await _db.Classes.AnyAsync(c => c.Id == classId, cancellationToken);
        if (!classExists) throw new NotFoundException(nameof(Class), classId);

        var studentExists = await _db.Users.AnyAsync(u => u.Id == studentId && u.Role == UserRole.Student, cancellationToken);
        if (!studentExists) throw new NotFoundException("Student", studentId);

        var existingEnrollment = await _db.StudentClassEnrollments.SingleOrDefaultAsync(e => e.StudentId == studentId, cancellationToken);

        if (existingEnrollment is null)
        {
            _db.StudentClassEnrollments.Add(new StudentClassEnrollment { ClassId = classId, StudentId = studentId });
        }
        else if (existingEnrollment.ClassId != classId)
        {
            existingEnrollment.ClassId = classId;
            existingEnrollment.UpdatedAtUtc = DateTime.UtcNow;
        }
        // else: already enrolled in exactly this class - nothing to do.

        await _db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Admin roster: every student and the single class/section they're currently enrolled in.</summary>
    public async Task<List<StudentEnrollmentDto>> GetStudentRosterAsync(CancellationToken cancellationToken = default)
    {
        return await _db.StudentClassEnrollments
            .Include(e => e.Student)
            .Include(e => e.Class)
            .OrderBy(e => e.Class.Name).ThenBy(e => e.Class.Section).ThenBy(e => e.Student.FullName)
            .Select(e => new StudentEnrollmentDto
            {
                StudentId = e.StudentId,
                StudentName = e.Student.FullName,
                ClassId = e.ClassId,
                ClassName = e.Class.Name,
                Section = e.Class.Section
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>The current student's own class, or null if not yet enrolled anywhere.</summary>
    public async Task<ClassDto?> GetMyClassAsync(int studentId, CancellationToken cancellationToken = default)
    {
        var enrollment = await _db.StudentClassEnrollments
            .Include(e => e.Class)
            .SingleOrDefaultAsync(e => e.StudentId == studentId, cancellationToken);

        return enrollment is null
            ? null
            : new ClassDto { Id = enrollment.Class.Id, Name = enrollment.Class.Name, Section = enrollment.Class.Section };
    }

    private async Task EnsureNameSectionIsUniqueAsync(string name, string section, int? excludingId, CancellationToken cancellationToken)
    {
        var duplicateExists = await _db.Classes
            .AnyAsync(c => c.Name == name && c.Section == section && c.Id != (excludingId ?? 0), cancellationToken);

        if (duplicateExists)
        {
            var label = string.IsNullOrEmpty(section) ? name : $"{name} - Section {section}";
            throw new ConflictException($"{label} already exists.");
        }
    }
}
