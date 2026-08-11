using Application.DTOs.Settings;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

/// <summary>Application-level settings. Admin-only, per the project brief's "manage application-level settings".</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SettingsController : ControllerBase
{
    private readonly SettingsService _settingsService;

    public SettingsController(SettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    public async Task<ActionResult<AppSettingsDto>> Get(CancellationToken cancellationToken)
        => Ok(await _settingsService.GetAsync(cancellationToken));

    [HttpPut]
    public async Task<ActionResult<AppSettingsDto>> Update([FromBody] AppSettingsDto dto, CancellationToken cancellationToken)
        => Ok(await _settingsService.UpdateAsync(dto, cancellationToken));
}
