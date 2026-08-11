import type { AssignmentStatus, SubmissionStatus } from "../lib/types";

type Status = AssignmentStatus | SubmissionStatus | "Active" | "Inactive";

const STYLES: Record<Status, string> = {
  Published: "bg-primary-soft text-primary",
  Draft: "bg-amber-soft text-amber",
  Pending: "bg-amber-soft text-amber",
  Reviewed: "bg-primary-soft text-primary",
  Accepted: "bg-primary-soft text-primary",
  Rejected: "bg-brick-soft text-brick",
  Active: "bg-primary-soft text-primary",
  Inactive: "bg-brick-soft text-brick",
};

/// Small pill used everywhere a Draft/Published or Pending/Reviewed/Accepted/Rejected status needs to be shown.
export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${STYLES[status] ?? "bg-border text-ink-muted"}`}
    >
      {status}
    </span>
  );
}

/// Lateness is informational, not a status - shown as its own small tag next to StatusBadge.
export function LateTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-brick-soft px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brick">
      Late
    </span>
  );
}
