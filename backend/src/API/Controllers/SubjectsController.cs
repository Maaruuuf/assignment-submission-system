using Application.DTOs.Subjects;
using Application.Interfaces;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubjectsController : ControllerBase
{
    private readonly SubjectService _subjectService;
    private readonly ICurrentUserService _currentUser;

    public SubjectsController(SubjectService subjectService, ICurrentUserService currentUser)
    {
        _subjectService = subjectService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubjectDto>>> GetAll([FromQuery] int? classId, CancellationToken cancellationToken)
        => Ok(await _subjectService.GetAllAsync(classId, cancellationToken));

    /// <summary>Subjects the current teacher is assigned to teach - used to restrict the homework-creation form.</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<List<SubjectDto>>> GetMine(CancellationToken cancellationToken)
        => Ok(await _subjectService.GetMineAsync(_currentUser.UserId, cancellationToken));

    /// <summary>Admin roster: every subject that currently has a teacher assigned.</summary>
    [HttpGet("roster")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<TeacherAssignmentRowDto>>> GetTeacherRoster(CancellationToken cancellationToken)
        => Ok(await _subjectService.GetTeacherRosterAsync(cancellationToken));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SubjectDto>> Create([FromBody] CreateSubjectDto dto, CancellationToken cancellationToken)
        => Ok(await _subjectService.CreateAsync(dto, cancellationToken));

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SubjectDto>> Update(int id, [FromBody] CreateSubjectDto dto, CancellationToken cancellationToken)
        => Ok(await _subjectService.UpdateAsync(id, dto, cancellationToken));

    /// <summary>Assigns a teacher to a subject, or reassigns it if it already has a different teacher.</summary>
    [HttpPost("assign-teacher")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherDto dto, CancellationToken cancellationToken)
    {
        await _subjectService.AssignTeacherAsync(dto, cancellationToken);
        return NoContent();
    }
}
