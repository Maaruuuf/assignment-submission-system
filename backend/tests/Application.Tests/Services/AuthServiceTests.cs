using Application.Common.Exceptions;
using Application.DTOs.Auth;
using Application.Interfaces;
using Application.Services;
using Application.Tests.Common;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Xunit;

namespace Application.Tests.Services;

/// <summary>Simple in-memory stand-in for IPasswordHasher: "hash" of a password is just "hashed:" + the password.</summary>
file class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string plainTextPassword) => $"hashed:{plainTextPassword}";
    public bool Verify(string plainTextPassword, string hash) => hash == $"hashed:{plainTextPassword}";
}

/// <summary>Simple stand-in for IJwtTokenService so tests don't depend on real signing/config.</summary>
file class FakeJwtTokenService : IJwtTokenService
{
    public (string Token, DateTime ExpiresAtUtc) GenerateToken(User user) => ($"fake-token-for-{user.Id}", DateTime.UtcNow.AddHours(8));
}

public class AuthServiceTests
{
    private static AuthService BuildService(Infrastructure.Persistence.ApplicationDbContext db) =>
        new(db, new FakePasswordHasher(), new FakeJwtTokenService());

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokenAndUserInfo()
    {
        using var db = TestDbContextFactory.Create();
        var hasher = new FakePasswordHasher();
        var user = new User { FullName = "Alice Admin", Email = "admin@school.edu", Role = UserRole.Admin, PasswordHash = hasher.Hash("Passw0rd!"), IsActive = true };
        db.Users.Add(user);
        db.SaveChanges();
        var service = BuildService(db);

        var result = await service.LoginAsync(new LoginRequestDto { Email = "admin@school.edu", Password = "Passw0rd!" });

        result.Token.Should().Be($"fake-token-for-{user.Id}");
        result.Role.Should().Be(nameof(UserRole.Admin));
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsUnauthorized()
    {
        using var db = TestDbContextFactory.Create();
        var hasher = new FakePasswordHasher();
        db.Users.Add(new User { FullName = "Alice Admin", Email = "admin@school.edu", Role = UserRole.Admin, PasswordHash = hasher.Hash("Passw0rd!"), IsActive = true });
        db.SaveChanges();
        var service = BuildService(db);

        var act = () => service.LoginAsync(new LoginRequestDto { Email = "admin@school.edu", Password = "WrongPassword" });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task LoginAsync_DeactivatedUser_ThrowsAccountDeactivatedWithCorrectCredentials()
    {
        using var db = TestDbContextFactory.Create();
        var hasher = new FakePasswordHasher();
        db.Users.Add(new User { FullName = "Old Teacher", Email = "old@school.edu", Role = UserRole.Teacher, PasswordHash = hasher.Hash("Passw0rd!"), IsActive = false });
        db.SaveChanges();
        var service = BuildService(db);

        var act = () => service.LoginAsync(new LoginRequestDto { Email = "old@school.edu", Password = "Passw0rd!" });

        (await act.Should().ThrowAsync<AccountDeactivatedException>())
            .WithMessage("*blocked by the administrator*");
    }

    [Fact]
    public async Task LoginAsync_DeactivatedUserWithWrongPassword_StillGetsInvalidCredentials()
    {
        using var db = TestDbContextFactory.Create();
        var hasher = new FakePasswordHasher();
        db.Users.Add(new User { FullName = "Old Teacher", Email = "old@school.edu", Role = UserRole.Teacher, PasswordHash = hasher.Hash("Passw0rd!"), IsActive = false });
        db.SaveChanges();
        var service = BuildService(db);

        var act = () => service.LoginAsync(new LoginRequestDto { Email = "old@school.edu", Password = "WrongPassword" });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task LoginAsync_UnknownEmail_ThrowsUnauthorized()
    {
        using var db = TestDbContextFactory.Create();
        var service = BuildService(db);

        var act = () => service.LoginAsync(new LoginRequestDto { Email = "nobody@school.edu", Password = "Passw0rd!" });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
