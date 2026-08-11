using Application.DTOs.Submissions;
using Application.Interfaces;
using Application.Services;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly SubmissionService _submissionService;
    private readonly ICurrentUserService _currentUser;

    public SubmissionsController(SubmissionService submissionService, ICurrentUserService currentUser)
    {
        _submissionService = submissionService;
        _currentUser = currentUser;
    }

    /// <summary>Student submits an answer for the first time. Accepted even if late (flagged Late), never rejected.</summary>
    [HttpPost("assignments/{assignmentId:int}/submissions")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<SubmissionDto>> Submit(int assignmentId, [FromBody] CreateSubmissionDto dto, CancellationToken cancellationToken)
    {
        var result = await _submissionService.SubmitAsync(_currentUser.UserId, assignmentId, dto, cancellationToken);
        return Ok(result);
    }

    /// <summary>Student updates their own submission - only while the assignment's deadline hasn't passed.</summary>
    [HttpPut("submissions/{submissionId:int}")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<SubmissionDto>> Update(int submissionId, [FromBody] CreateSubmissionDto dto, CancellationToken cancellationToken)
        => Ok(await _submissionService.UpdateAsync(_currentUser.UserId, submissionId, dto, cancellationToken));

    /// <summary>Teacher (owner of the assignment's subject) or Admin lists every submission for an assignment.</summary>
    [HttpGet("assignments/{assignmentId:int}/submissions")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<List<SubmissionDto>>> GetForAssignment(int assignmentId, CancellationToken cancellationToken)
        => Ok(await _submissionService.GetForAssignmentAsync(_currentUser.UserId, _currentUser.Role, assignmentId, cancellationToken));

    /// <summary>Student views their own submission history, with status/marks/feedback.</summary>
    [HttpGet("submissions/mine")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<SubmissionDto>>> GetMine(CancellationToken cancellationToken)
        => Ok(await _submissionService.GetForStudentAsync(_currentUser.UserId, cancellationToken));

    /// <summary>Teacher/Admin grades a submission with marks + feedback.</summary>
    [HttpPost("submissions/{submissionId:int}/grade")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<SubmissionDto>> Grade(int submissionId, [FromBody] GradeSubmissionDto dto, CancellationToken cancellationToken)
        => Ok(await _submissionService.GradeAsync(_currentUser.UserId, _currentUser.Role, submissionId, dto, cancellationToken));

    /// <summary>Teacher/Admin moves a submission through Pending/Reviewed/Accepted/Rejected.</summary>
    [HttpPatch("submissions/{submissionId:int}/status")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<SubmissionDto>> SetStatus(int submissionId, [FromQuery] SubmissionStatus status, CancellationToken cancellationToken)
        => Ok(await _submissionService.SetStatusAsync(_currentUser.UserId, _currentUser.Role, submissionId, status, cancellationToken));
}
