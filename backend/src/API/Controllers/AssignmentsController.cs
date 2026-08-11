using Application.DTOs.Assignments;
using Application.Interfaces;
using Application.Services;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly AssignmentService _assignmentService;
    private readonly ICurrentUserService _currentUser;

    public AssignmentsController(AssignmentService assignmentService, ICurrentUserService currentUser)
    {
        _assignmentService = assignmentService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Role-aware listing: Admin gets everything, Teacher gets their own assignments (draft + published),
    /// Student gets only Published assignments for classes they're enrolled in.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AssignmentDto>>> GetAll(CancellationToken cancellationToken)
    {
        var result = _currentUser.Role switch
        {
            UserRole.Admin => await _assignmentService.GetAllAsync(cancellationToken),
            UserRole.Teacher => await _assignmentService.GetForTeacherAsync(_currentUser.UserId, cancellationToken),
            UserRole.Student => await _assignmentService.GetForStudentAsync(_currentUser.UserId, cancellationToken),
            _ => new List<AssignmentDto>()
        };
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AssignmentDto>> GetById(int id, CancellationToken cancellationToken)
        => Ok(await _assignmentService.GetByIdForUserAsync(id, _currentUser.UserId, _currentUser.Role, cancellationToken));

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<AssignmentDto>> Create([FromBody] CreateAssignmentDto dto, CancellationToken cancellationToken)
    {
        var created = await _assignmentService.CreateAsync(_currentUser.UserId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<AssignmentDto>> Update(int id, [FromBody] UpdateAssignmentDto dto, CancellationToken cancellationToken)
        => Ok(await _assignmentService.UpdateAsync(_currentUser.UserId, id, dto, cancellationToken));

    [HttpPost("{id:int}/publish")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Publish(int id, CancellationToken cancellationToken)
    {
        await _assignmentService.SetStatusAsync(_currentUser.UserId, id, AssignmentStatus.Published, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/unpublish")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Unpublish(int id, CancellationToken cancellationToken)
    {
        await _assignmentService.SetStatusAsync(_currentUser.UserId, id, AssignmentStatus.Draft, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _assignmentService.DeleteAsync(_currentUser.UserId, id, cancellationToken);
        return NoContent();
    }
}
