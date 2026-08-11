using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Users;

public class CreateUserDto
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    /// <summary>One of: Admin, Teacher, Student.</summary>
    [Required]
    public string Role { get; set; } = string.Empty;
}
