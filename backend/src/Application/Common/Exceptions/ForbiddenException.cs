namespace Application.Common.Exceptions;

/// <summary>
/// Thrown when an authenticated user is not allowed to perform an action on a specific resource
/// (e.g. a teacher grading a submission for a subject they are not assigned to).
/// Mapped to HTTP 403 by the API's exception middleware. Distinct from the 401 the [Authorize]
/// attribute already produces for unauthenticated/wrong-role requests.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message)
    {
    }
}
