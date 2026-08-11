namespace Application.Common.Exceptions;

/// <summary>
/// Thrown when a request violates a documented business rule (e.g. submitting after updates are
/// no longer allowed, publishing an assignment with no deadline). Mapped to HTTP 400.
/// </summary>
public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message)
    {
    }
}
