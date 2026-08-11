using Domain.Common;

namespace Domain.Entities;

/// <summary>
/// Single-row table of application-level settings an Admin can tune. There is always exactly
/// one row (Id = 1) - see Infrastructure/Persistence/Seed/DbSeeder for how it's created.
/// </summary>
public class AppSettings : BaseEntity
{
    public int MaxUploadSizeMb { get; set; } = 10;
    public bool AllowResubmissionBeforeDeadline { get; set; } = true;
    public int DefaultMaxMarks { get; set; } = 100;
    public int DefaultDeadlineDays { get; set; } = 7;
}
