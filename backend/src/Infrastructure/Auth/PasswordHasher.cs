using Application.Interfaces;

namespace Infrastructure.Auth;

/// <summary>BCrypt-backed password hashing. BCrypt embeds its own salt, so no salt storage is needed.</summary>
public class PasswordHasher : IPasswordHasher
{
    public string Hash(string plainTextPassword) => BCrypt.Net.BCrypt.HashPassword(plainTextPassword);

    public bool Verify(string plainTextPassword, string hash) => BCrypt.Net.BCrypt.Verify(plainTextPassword, hash);
}
