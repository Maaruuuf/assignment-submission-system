namespace Application.Common.Exceptions;

/// <summary>Thrown for state conflicts, e.g. registering a duplicate email or double-submitting. Mapped to HTTP 409.</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}
