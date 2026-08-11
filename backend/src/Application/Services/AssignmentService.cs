using Application.Common.Exceptions;
using Application.DTOs.Assignments;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

/// <summary>
/// Assignment lifecycle: create/update/delete/publish by teachers, visibility rules for students.
/// A teacher may only touch assignments for subjects they are assigned to (enforced here, not
/// just in the UI) - the TeacherSubjectAssignment table created by SubjectService is the source
/// of truth for that check.
/// </summary>
public class AssignmentService
{
    private readonly IApplicationDbContext _db;

    public AssignmentService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AssignmentDto> CreateAsync(int teacherId, CreateAssignmentDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureTeacherOwnsSubjectAsync(teacherId, dto.SubjectId, dto.ClassId, cancellationToken);

        if (dto.Deadline <= DateTime.UtcNow)
        {
            throw new BusinessRuleException("Deadline must be in the future.");
        }

        var assignment = new Assignment
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            Deadline = dto.Deadline,
            MaxMarks = dto.MaxMarks,
            ClassId = dto.ClassId,
            SubjectId = dto.SubjectId,
            TeacherId = teacherId,
            Status = dto.PublishImmediately ? AssignmentStatus.Published : AssignmentStatus.Draft
        };

        _db.Assignments.Add(assignment);
        await _db.SaveChangesAsync(cancellationToken);

        return await MapToDtoAsync(assignment, cancellationToken);
    }

    public async Task<AssignmentDto> UpdateAsync(int teacherId, int assignmentId, UpdateAssignmentDto dto, CancellationToken cancellationToken = default)
    {
        var assignment = await GetOwnedAssignmentOrThrowAsync(teacherId, assignmentId, cancellationToken);

        assignment.Title = dto.Title.Trim();
        assignment.Description = dto.Description.Trim();
        assignment.Deadline = dto.Deadline;
        assignment.MaxMarks = dto.MaxMarks;
        assignment.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return await MapToDtoAsync(assignment, cancellationToken);
    }

    public async Task SetStatusAsync(int teacherId, int assignmentId, AssignmentStatus status, CancellationToken cancellationToken = default)
    {
        var assignment = await GetOwnedAssignmentOrThrowAsync(teacherId, assignmentId, cancellationToken);
        assignment.Status = status;
        assignment.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int teacherId, int assignmentId, CancellationToken cancellationToken = default)
    {
        var assignment = await GetOwnedAssignmentOrThrowAsync(teacherId, assignmentId, cancellationToken);

        var hasSubmissions = await _db.Submissions.AnyAsync(s => s.AssignmentId == assignmentId, cancellationToken);
        if (hasSubmissions)
        {
            throw new BusinessRuleException("Cannot delete an assignment that already has student submissions.");
        }

        _db.Assignments.Remove(assignment);
        await _db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Assignments visible to a student: Published, and in a class the student is enrolled in.</summary>
    public async Task<List<AssignmentDto>> GetForStudentAsync(int studentId, CancellationToken cancellationToken = default)
    {
        var enrolledClassIds = await _db.StudentClassEnrollments
            .Where(e => e.StudentId == studentId)
            .Select(e => e.ClassId)
            .ToListAsync(cancellationToken);

        var assignments = await _db.Assignments
            .Include(a => a.Class).Include(a => a.Subject).Include(a => a.Teacher)
            .Where(a => a.Status == AssignmentStatus.Published && enrolledClassIds.Contains(a.ClassId))
            .OrderBy(a => a.Deadline)
            .ToListAsync(cancellationToken);

        return assignments.Select(MapToDto).ToList();
    }

    /// <summary>Assignments (draft + published) created by a specific teacher.</summary>
    public async Task<List<AssignmentDto>> GetForTeacherAsync(int teacherId, CancellationToken cancellationToken = default)
    {
        var assignments = await _db.Assignments
            .Include(a => a.Class).Include(a => a.Subject).Include(a => a.Teacher)
            .Where(a => a.TeacherId == teacherId)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return assignments.Select(MapToDto).ToList();
    }

    /// <summary>Full, unfiltered assignment list - Admin only.</summary>
    public async Task<List<AssignmentDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var assignments = await _db.Assignments
            .Include(a => a.Class).Include(a => a.Subject).Include(a => a.Teacher)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return assignments.Select(MapToDto).ToList();
    }

    /// <summary>
    /// Single-assignment lookup with role-appropriate visibility: admins see everything, teachers
    /// see their own (draft or published), students only see it if published and in their class.
    /// </summary>
    public async Task<AssignmentDto> GetByIdForUserAsync(int assignmentId, int userId, UserRole role, CancellationToken cancellationToken = default)
    {
        var assignment = await _db.Assignments
            .Include(a => a.Class).Include(a => a.Subject).Include(a => a.Teacher)
            .SingleOrDefaultAsync(a => a.Id == assignmentId, cancellationToken)
            ?? throw new NotFoundException(nameof(Assignment), assignmentId);

        var visible = role switch
        {
            UserRole.Admin => true,
            UserRole.Teacher => assignment.TeacherId == userId,
            UserRole.Student => assignment.Status == AssignmentStatus.Published
                                 && await _db.StudentClassEnrollments.AnyAsync(
                                        e => e.StudentId == userId && e.ClassId == assignment.ClassId, cancellationToken),
            _ => false
        };

        if (!visible)
        {
            throw new ForbiddenException("You do not have access to this assignment.");
        }

        return MapToDto(assignment);
    }

    /// <summary>Throws NotFound if the assignment doesn't exist, Forbidden if this teacher doesn't own it.</summary>
    private async Task<Assignment> GetOwnedAssignmentOrThrowAsync(int teacherId, int assignmentId, CancellationToken cancellationToken)
    {
        var assignment = await _db.Assignments.SingleOrDefaultAsync(a => a.Id == assignmentId, cancellationToken)
                          ?? throw new NotFoundException(nameof(Assignment), assignmentId);

        if (assignment.TeacherId != teacherId)
        {
            throw new ForbiddenException("You can only manage assignments you created.");
        }

        return assignment;
    }

    /// <summary>
    /// Verifies the teacher is assigned to the given subject AND that the subject belongs to
    /// the given class, before letting them create an assignment against that pair.
    /// </summary>
    private async Task EnsureTeacherOwnsSubjectAsync(int teacherId, int subjectId, int classId, CancellationToken cancellationToken)
    {
        var subject = await _db.Subjects.SingleOrDefaultAsync(s => s.Id == subjectId, cancellationToken)
                      ?? throw new NotFoundException(nameof(Subject), subjectId);

        if (subject.ClassId != classId)
        {
            throw new BusinessRuleException("The selected subject does not belong to the selected class.");
        }

        var isAssigned = await _db.TeacherSubjectAssignments
            .AnyAsync(a => a.TeacherId == teacherId && a.SubjectId == subjectId, cancellationToken);

        if (!isAssigned)
        {
            throw new ForbiddenException("You are not assigned to teach this subject.");
        }
    }

    private async Task<AssignmentDto> MapToDtoAsync(Assignment assignment, CancellationToken cancellationToken)
    {
        // The freshly-created entity may not have navigation properties loaded, so reload with includes.
        await _db.Entry(assignment).Reference(a => a.Class).LoadAsync(cancellationToken);
        await _db.Entry(assignment).Reference(a => a.Subject).LoadAsync(cancellationToken);
        await _db.Entry(assignment).Reference(a => a.Teacher).LoadAsync(cancellationToken);
        return MapToDto(assignment);
    }

    private static AssignmentDto MapToDto(Assignment a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Description = a.Description,
        Deadline = a.Deadline,
        MaxMarks = a.MaxMarks,
        Status = a.Status.ToString(),
        ClassId = a.ClassId,
        ClassName = a.Class.Name,
        SubjectId = a.SubjectId,
        SubjectName = a.Subject.Name,
        TeacherId = a.TeacherId,
        TeacherName = a.Teacher.FullName
    };
}
