using Application.DTOs.Settings;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

/// <summary>
/// Application-level settings, admin-tunable. There is always exactly one row (Id = 1),
/// created by DbSeeder if it doesn't already exist - this service just reads/writes it.
/// </summary>
public class SettingsService
{
    private readonly IApplicationDbContext _db;

    public SettingsService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AppSettingsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateRowAsync(cancellationToken);
        return MapToDto(settings);
    }

    public async Task<AppSettingsDto> UpdateAsync(AppSettingsDto dto, CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateRowAsync(cancellationToken);

        settings.MaxUploadSizeMb = dto.MaxUploadSizeMb;
        settings.AllowResubmissionBeforeDeadline = dto.AllowResubmissionBeforeDeadline;
        settings.DefaultMaxMarks = dto.DefaultMaxMarks;
        settings.DefaultDeadlineDays = dto.DefaultDeadlineDays;
        settings.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return MapToDto(settings);
    }

    private async Task<AppSettings> GetOrCreateRowAsync(CancellationToken cancellationToken)
    {
        var settings = await _db.Settings.FirstOrDefaultAsync(cancellationToken);
        if (settings is not null) return settings;

        settings = new AppSettings();
        _db.Settings.Add(settings);
        await _db.SaveChangesAsync(cancellationToken);
        return settings;
    }

    private static AppSettingsDto MapToDto(AppSettings s) => new()
    {
        MaxUploadSizeMb = s.MaxUploadSizeMb,
        AllowResubmissionBeforeDeadline = s.AllowResubmissionBeforeDeadline,
        DefaultMaxMarks = s.DefaultMaxMarks,
        DefaultDeadlineDays = s.DefaultDeadlineDays
    };
}
