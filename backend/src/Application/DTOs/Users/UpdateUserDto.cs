using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Users;

public class UpdateUserDto
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
