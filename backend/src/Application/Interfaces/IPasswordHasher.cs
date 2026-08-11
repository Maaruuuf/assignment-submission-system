namespace Application.Interfaces;

/// <summary>Wraps the hashing algorithm used for user credentials so Application never sees raw crypto APIs.</summary>
public interface IPasswordHasher
{
    string Hash(string plainTextPassword);
    bool Verify(string plainTextPassword, string hash);
}
