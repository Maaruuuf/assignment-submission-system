using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Classes;

public class CreateClassDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Section { get; set; }
}
