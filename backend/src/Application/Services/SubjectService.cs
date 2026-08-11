using Application.Common.Exceptions;
using Application.DTOs.Subjects;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

/// <summary>
/// Admin-only management of subjects and of which teacher teaches which subject.
/// Business rule: one Class + Subject can have at most one Teacher, but a Teacher may be linked
/// to any number of subjects/classes - see AssignTeacherAsync.
/// </summary>
public class SubjectService
{
    private readonly IApplicationDbContext _db;

    public SubjectService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<SubjectDto>> GetAllAsync(int? classId = null, CancellationToken cancellationToken = default)
    {
        var query = _db.Subjects
            .Include(s => s.Class)
            .Include(s => s.TeacherAssignments).ThenInclude(a => a.Teacher)
            .AsQueryable();
        if (classId.HasValue) query = query.Where(s => s.ClassId == classId.Value);

        var subjects = await query.OrderBy(s => s.Name).ToListAsync(cancellationToken);
        return subjects.Select(MapToDto).ToList();
    }

    public async Task<SubjectDto> CreateAsync(CreateSubjectDto dto, CancellationToken cancellationToken = default)
    {
        var classEntity = await _db.Classes.FindAsync(new object[] { dto.ClassId }, cancellationToken)
                           ?? throw new NotFoundException(nameof(Class), dto.ClassId);

        var name = dto.Name.Trim();
        await EnsureClassSubjectIsUniqueAsync(dto.ClassId, name, excludingId: null, cancellationToken);

        var subject = new Subject { Name = name, ClassId = classEntity.Id };
        _db.Subjects.Add(subject);
        await _db.SaveChangesAsync(cancellationToken);

        return new SubjectDto { Id = subject.Id, Name = subject.Name, ClassId = classEntity.Id, ClassName = classEntity.Name, ClassSection = classEntity.Section };
    }

    public async Task<SubjectDto> UpdateAsync(int id, CreateSubjectDto dto, CancellationToken cancellationToken = default)
    {
        var subject = await _db.Subjects
            .Include(s => s.Class)
            .Include(s => s.TeacherAssignments).ThenInclude(a => a.Teacher)
            .SingleOrDefaultAsync(s => s.Id == id, cancellationToken)
            ?? throw new NotFoundException(nameof(Subject), id);

        var classEntity = await _db.Classes.FindAsync(new object[] { dto.ClassId }, cancellationToken)
                           ?? throw new NotFoundException(nameof(Class), dto.ClassId);

        var name = dto.Name.Trim();
        await EnsureClassSubjectIsUniqueAsync(dto.ClassId, name, excludingId: id, cancellationToken);

        subject.Name = name;
        subject.ClassId = classEntity.Id;
        subject.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        subject.Class = classEntity;
        return MapToDto(subject);
    }

    /// <summary>
    /// Links a teacher to a subject. A subject can have at most one teacher (enforced by a unique
    /// index on SubjectId), so if it's already assigned to a DIFFERENT teacher this REASSIGNS it
    /// rather than adding a second link - satisfying "one class+subject = one teacher" while still
    /// giving admins a one-step way to hand a subject over to someone else. A teacher is never
    /// capped on how many subjects they can be assigned to.
    /// </summary>
    public async Task AssignTeacherAsync(AssignTeacherDto dto, CancellationToken cancellationToken = default)
    {
        var teacher = await _db.Users.FindAsync(new object[] { dto.TeacherId }, cancellationToken)
                      ?? throw new NotFoundException("Teacher", dto.TeacherId);
        if (teacher.Role != UserRole.Teacher)
        {
            throw new BusinessRuleException($"User '{teacher.FullName}' is not a Teacher.");
        }

        var subjectExists = await _db.Subjects.AnyAsync(s => s.Id == dto.SubjectId, cancellationToken);
        if (!subjectExists) throw new NotFoundException(nameof(Subject), dto.SubjectId);

        var existingAssignment = await _db.TeacherSubjectAssignments.SingleOrDefaultAsync(a => a.SubjectId == dto.SubjectId, cancellationToken);

        if (existingAssignment is null)
        {
            _db.TeacherSubjectAssignments.Add(new TeacherSubjectAssignment { TeacherId = dto.TeacherId, SubjectId = dto.SubjectId });
        }
        else if (existingAssignment.TeacherId == dto.TeacherId)
        {
            throw new ConflictException("This teacher is already assigned to this subject.");
        }
        else
        {
            existingAssignment.TeacherId = dto.TeacherId;
            existingAssignment.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Admin roster: every subject that currently has a teacher, one row each.</summary>
    public async Task<List<TeacherAssignmentRowDto>> GetTeacherRosterAsync(CancellationToken cancellationToken = default)
    {
        return await _db.TeacherSubjectAssignments
            .Include(a => a.Teacher)
            .Include(a => a.Subject).ThenInclude(s => s.Class)
            .OrderBy(a => a.Teacher.FullName).ThenBy(a => a.Subject.Class.Name)
            .Select(a => new TeacherAssignmentRowDto
            {
                TeacherId = a.TeacherId,
                TeacherName = a.Teacher.FullName,
                ClassId = a.Subject.ClassId,
                ClassName = a.Subject.Class.Name,
                Section = a.Subject.Class.Section,
                SubjectId = a.SubjectId,
                SubjectName = a.Subject.Name
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>Subjects the current teacher is assigned to teach - used to restrict the
    /// homework-creation form to valid class+subject combinations (see AssignmentsController).</summary>
    public async Task<List<SubjectDto>> GetMineAsync(int teacherId, CancellationToken cancellationToken = default)
    {
        var subjects = await _db.Subjects
            .Include(s => s.Class)
            .Include(s => s.TeacherAssignments).ThenInclude(a => a.Teacher)
            .Where(s => s.TeacherAssignments.Any(a => a.TeacherId == teacherId))
            .OrderBy(s => s.Class.Name).ThenBy(s => s.Class.Section)
            .ToListAsync(cancellationToken);

        return subjects.Select(MapToDto).ToList();
    }

    private async Task EnsureClassSubjectIsUniqueAsync(int classId, string name, int? excludingId, CancellationToken cancellationToken)
    {
        var duplicate = await _db.Subjects
            .Include(s => s.Class)
            .SingleOrDefaultAsync(s => s.ClassId == classId && s.Name == name && s.Id != (excludingId ?? 0), cancellationToken);

        if (duplicate is not null)
        {
            var label = string.IsNullOrEmpty(duplicate.Class.Section) ? duplicate.Class.Name : $"{duplicate.Class.Name} - Section {duplicate.Class.Section}";
            throw new ConflictException($"{label} - {name} already exists.");
        }
    }

    private static SubjectDto MapToDto(Subject s)
    {
        var assignment = s.TeacherAssignments.FirstOrDefault();
        return new SubjectDto
        {
            Id = s.Id,
            Name = s.Name,
            ClassId = s.ClassId,
            ClassName = s.Class.Name,
            ClassSection = s.Class.Section,
            TeacherId = assignment?.TeacherId,
            TeacherName = assignment?.Teacher.FullName
        };
    }
}
