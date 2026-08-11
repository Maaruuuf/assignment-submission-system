using Domain.Entities;

namespace Application.Interfaces;

/// <summary>Issues signed JWTs that carry the user's id, email and role as claims.</summary>
public interface IJwtTokenService
{
    /// <summary>Generates a signed token for the given user and returns it alongside its UTC expiry.</summary>
    (string Token, DateTime ExpiresAtUtc) GenerateToken(User user);
}
