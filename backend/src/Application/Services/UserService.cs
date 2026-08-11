using Application.Common.Exceptions;
using Application.DTOs.Users;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

/// <summary>
/// Admin-only user management: create/list/update/deactivate accounts for every role.
/// Controller-level [Authorize(Roles = "Admin")] keeps non-admins out entirely, so this
/// service does not repeat that check on every method.
/// </summary>
public class UserService
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IApplicationDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<List<UserDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Users
            .OrderBy(u => u.Role).ThenBy(u => u.FullName)
            .Select(u => MapToDto(u))
            .ToListAsync(cancellationToken);
    }

    public async Task<UserDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await FindOrThrowAsync(id, cancellationToken);
        return MapToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, ignoreCase: true, out var role))
        {
            throw new BusinessRuleException($"'{dto.Role}' is not a valid role. Use Admin, Teacher or Student.");
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var emailTaken = await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
        if (emailTaken)
        {
            throw new ConflictException($"A user with email '{dto.Email}' already exists.");
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.Hash(dto.Password),
            Role = role,
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        return MapToDto(user);
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto, CancellationToken cancellationToken = default)
    {
        var user = await FindOrThrowAsync(id, cancellationToken);

        user.FullName = dto.FullName.Trim();
        user.IsActive = dto.IsActive;
        user.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return MapToDto(user);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        // Soft delete: deactivated users can no longer log in, but their historical
        // assignments/submissions remain intact for audit purposes.
        var user = await FindOrThrowAsync(id, cancellationToken);
        user.IsActive = false;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Permanently removes a user and everything that exists only because of them - distinct from
    /// DeactivateAsync, which just blocks login and keeps history intact. Order matters here
    /// because several of these relationships are RESTRICT at the DB level (not cascading), so
    /// dependents have to be cleared explicitly before the user row itself can go:
    ///   Student: their submissions, then their class enrollment.
    ///   Teacher: their created assignments (this cascades to that assignment's submissions
    ///            automatically, since Submission -> Assignment IS a DB cascade), then their
    ///            subject assignments.
    /// </summary>
    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await FindOrThrowAsync(id, cancellationToken);

        var ownSubmissions = await _db.Submissions.Where(s => s.StudentId == id).ToListAsync(cancellationToken);
        _db.Submissions.RemoveRange(ownSubmissions);

        var enrollments = await _db.StudentClassEnrollments.Where(e => e.StudentId == id).ToListAsync(cancellationToken);
        _db.StudentClassEnrollments.RemoveRange(enrollments);

        var createdAssignments = await _db.Assignments.Where(a => a.TeacherId == id).ToListAsync(cancellationToken);
        _db.Assignments.RemoveRange(createdAssignments);

        var teachingAssignments = await _db.TeacherSubjectAssignments.Where(a => a.TeacherId == id).ToListAsync(cancellationToken);
        _db.TeacherSubjectAssignments.RemoveRange(teachingAssignments);

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<User> FindOrThrowAsync(int id, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FindAsync(new object[] { id }, cancellationToken);
        return user ?? throw new NotFoundException(nameof(User), id);
    }

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role.ToString(),
        IsActive = user.IsActive
    };
}
