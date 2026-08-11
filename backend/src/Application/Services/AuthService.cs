using Application.Common.Exceptions;
using Application.DTOs.Auth;
using Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

/// <summary>
/// Handles credential verification and JWT issuance. Kept intentionally small: it does not
/// know how passwords are hashed or how tokens are signed - those are delegated to
/// IPasswordHasher / IJwtTokenService so the algorithm can change without touching this class.
/// </summary>
public class AuthService
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(IApplicationDbContext db, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .SingleOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        // Verify identity/credentials first. This intentionally gives the same error for "no such
        // user" and "wrong password" so the API never reveals which part was incorrect - but a
        // deactivated account is a different situation (the credentials ARE correct), so once we
        // know they're right, that gets its own distinct, honest message instead.
        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new AccountDeactivatedException();
        }

        var (token, expiresAtUtc) = _jwtTokenService.GenerateToken(user);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAtUtc = expiresAtUtc,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString()
        };
    }
}
