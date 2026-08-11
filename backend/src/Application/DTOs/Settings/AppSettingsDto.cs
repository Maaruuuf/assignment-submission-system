namespace Application.DTOs.Settings;

public class AppSettingsDto
{
    public int MaxUploadSizeMb { get; set; }
    public bool AllowResubmissionBeforeDeadline { get; set; }
    public int DefaultMaxMarks { get; set; }
    public int DefaultDeadlineDays { get; set; }
}
