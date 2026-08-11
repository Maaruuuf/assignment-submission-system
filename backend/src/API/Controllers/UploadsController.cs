using Application.Common.Exceptions;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class UploadResultDto
{
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

/// <summary>
/// Handles file attachments for submissions (PDF/DOCX/image). Files are stored on local disk
/// under wwwroot/uploads and served back via ASP.NET Core's static file middleware - simple and
/// sufficient for this project's scope; a production system would use blob storage instead.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadsController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"
    };

    private readonly IWebHostEnvironment _environment;
    private readonly SettingsService _settingsService;

    public UploadsController(IWebHostEnvironment environment, SettingsService settingsService)
    {
        _environment = environment;
        _settingsService = settingsService;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<UploadResultDto>> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            throw new BusinessRuleException("No file was provided.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
        {
            throw new BusinessRuleException("Only PDF, DOC, DOCX, PNG and JPG files are allowed.");
        }

        var settings = await _settingsService.GetAsync(cancellationToken);
        var maxBytes = settings.MaxUploadSizeMb * 1024L * 1024L;
        if (file.Length > maxBytes)
        {
            throw new BusinessRuleException($"File exceeds the {settings.MaxUploadSizeMb} MB upload limit.");
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsFolder);

        var storedFileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(uploadsFolder, storedFileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        return Ok(new UploadResultDto { Url = $"/uploads/{storedFileName}", FileName = file.FileName });
    }
}
