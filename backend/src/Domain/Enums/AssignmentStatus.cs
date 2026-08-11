namespace Domain.Enums;

/// <summary>
/// Lifecycle state of an assignment as set by the owning teacher.
/// Students can only see and submit to assignments in the Published state.
/// </summary>
public enum AssignmentStatus
{
    Draft = 0,
    Published = 1
}
