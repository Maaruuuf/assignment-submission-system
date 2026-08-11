namespace Application.Common.Exceptions;

/// <summary>
/// Thrown at login when the email/password are correct but the account has been deactivated by
/// an admin. Deliberately distinct from "invalid credentials" so the person isn't told their
/// correct password is wrong - see AuthService.LoginAsync. Mapped to HTTP 403.
/// </summary>
public class AccountDeactivatedException : Exception
{
    public AccountDeactivatedException()
        : base("Your account has been blocked by the administrator. Please contact the administrator.")
    {
    }
}
