using Domain.Enums;

namespace Application.Interfaces;

/// <summary>
/// Exposes the identity of the caller for the current HTTP request, read from JWT claims.
/// Services use this instead of touching HttpContext directly so business logic stays testable.
/// </summary>
public interface ICurrentUserService
{
    int UserId { get; }
    UserRole Role { get; }
}
