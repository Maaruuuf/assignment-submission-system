using Application.DTOs.Classes;
using Application.Interfaces;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClassesController : ControllerBase
{
    private readonly ClassService _classService;
    private readonly ICurrentUserService _currentUser;

    public ClassesController(ClassService classService, ICurrentUserService currentUser)
    {
        _classService = classService;
        _currentUser = currentUser;
    }

    /// <summary>Any authenticated user can list classes (teachers/students need this to pick a class in the UI).</summary>
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<ClassDto>>> GetAll(CancellationToken cancellationToken)
        => Ok(await _classService.GetAllAsync(cancellationToken));

    /// <summary>Admin roster: every student and the class/section they're currently enrolled in.</summary>
    [HttpGet("roster")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<StudentEnrollmentDto>>> GetStudentRoster(CancellationToken cancellationToken)
        => Ok(await _classService.GetStudentRosterAsync(cancellationToken));

    /// <summary>The current student's own class, or 204 if not enrolled anywhere yet.</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ClassDto>> GetMine(CancellationToken cancellationToken)
    {
        var myClass = await _classService.GetMyClassAsync(_currentUser.UserId, cancellationToken);
        return myClass is null ? NoContent() : Ok(myClass);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ClassDto>> Create([FromBody] CreateClassDto dto, CancellationToken cancellationToken)
        => Ok(await _classService.CreateAsync(dto, cancellationToken));

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ClassDto>> Update(int id, [FromBody] CreateClassDto dto, CancellationToken cancellationToken)
        => Ok(await _classService.UpdateAsync(id, dto, cancellationToken));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _classService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>Enrolls a student in a class.</summary>
    [HttpPost("{classId:int}/enroll/{studentId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> EnrollStudent(int classId, int studentId, CancellationToken cancellationToken)
    {
        await _classService.EnrollStudentAsync(classId, studentId, cancellationToken);
        return NoContent();
    }
}
