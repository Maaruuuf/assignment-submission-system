"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError, assignmentsApi, submissionsApi, uploadsApi } from "../../../../lib/api";
import type { AssignmentDto, SubmissionDto, SubmissionStatus } from "../../../../lib/types";
import { Button, Card, EmptyState, ErrorBanner, Field, Input, Select, Textarea } from "../../../../components/ui";
import StatusBadge, { LateTag } from "../../../../components/StatusBadge";

const STATUS_OPTIONS: SubmissionStatus[] = ["Pending", "Reviewed", "Accepted", "Rejected"];

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function GradeRow({ submission, maxMarks, onChanged }: { submission: SubmissionDto; maxMarks: number; onChanged: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [marks, setMarks] = useState(submission.marks !== null ? String(submission.marks) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (marks.trim() === "") {
      setError("Enter marks before saving.");
      return;
    }
    setIsSubmitting(true);
    try {
      await submissionsApi.grade(submission.id, Number(marks), feedback);
      toast.success(`Graded ${submission.studentName}.`);
      setIsOpen(false);
      onChanged();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't save the grade.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(status: SubmissionStatus) {
    setIsStatusUpdating(true);
    try {
      await submissionsApi.setStatus(submission.id, status);
      toast.success(`Status set to ${status}.`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update the status.");
    } finally {
      setIsStatusUpdating(false);
    }
  }

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{submission.studentName}</span>
            {submission.isLate && <LateTag />}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Submitted {new Date(submission.submittedAtUtc).toLocaleString()}
            {submission.marks !== null && ` · ${submission.marks}/${maxMarks}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Submission status"
            value={submission.status}
            disabled={isStatusUpdating}
            onChange={(e) => handleStatusChange(e.target.value as SubmissionStatus)}
            className="w-36"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={() => setIsOpen((v) => !v)}>
            {isOpen ? "Close" : submission.marks !== null ? "Regrade" : "Grade"}
          </Button>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-paper p-3 text-sm text-ink">{submission.answerText}</p>

      {submission.fileUrl && (
        <a
          href={uploadsApi.resolveUrl(submission.fileUrl)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          📎 {submission.fileName ?? "Attached file"}
        </a>
      )}

      {isOpen && (
        <form onSubmit={handleGrade} className="mt-3 space-y-3 rounded-lg border border-border p-3">
          <ErrorBanner message={error} />
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <Field label={`Marks (/${maxMarks})`} htmlFor={`marks-${submission.id}`}>
              <Input
                id={`marks-${submission.id}`}
                type="number"
                min={0}
                max={maxMarks}
                required
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </Field>
            <Field label="Feedback" htmlFor={`feedback-${submission.id}`}>
              <Textarea id={`feedback-${submission.id}`} rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save grade"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function TeacherAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = Number(params.id);

  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState("");

  function loadSubmissions() {
    submissionsApi.getForAssignment(assignmentId).then(setSubmissions).catch(() => setSubmissions([]));
  }

  useEffect(() => {
    assignmentsApi
      .getById(assignmentId)
      .then((a) => {
        setAssignment(a);
        setTitle(a.title);
        setDescription(a.description);
        setDeadline(toLocalInputValue(a.deadline));
        setMaxMarks(String(a.maxMarks));
      })
      .catch(() => setError("Couldn't load this assignment."));
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (maxMarks.trim() === "" || Number(maxMarks) <= 0) {
      setError("Enter a valid max marks value.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await assignmentsApi.update(assignmentId, {
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
      });
      setAssignment(updated);
      setIsEditing(false);
      toast.success("Assignment updated.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't save changes.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (error && !assignment) return <ErrorBanner message={error} />;
  if (!assignment) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold">{assignment.title}</h1>
            <StatusBadge status={assignment.status} />
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            {assignment.subjectName} · {assignment.className} · Due {new Date(assignment.deadline).toLocaleString()} · Max{" "}
            {assignment.maxMarks} marks
          </p>
        </div>
        <Button variant="secondary" onClick={() => setIsEditing((v) => !v)}>
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      <div className="mt-4">
        <ErrorBanner message={error} />
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-5">
          <Field label="Title" htmlFor="editTitle">
            <Input id="editTitle" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="editDescription">
            <Textarea id="editDescription" required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deadline" htmlFor="editDeadline">
              <Input id="editDeadline" type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </Field>
            <Field label="Max marks" htmlFor="editMaxMarks">
              <Input id="editMaxMarks" type="number" min={1} max={1000} required value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      ) : (
        <p className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-surface p-5 text-sm text-ink">
          {assignment.description}
        </p>
      )}

      <div className="mt-8">
        <Card title={`Submissions (${submissions?.length ?? 0})`}>
          <div className="divide-y divide-border">
            {!submissions && <EmptyState>Loading…</EmptyState>}
            {submissions && submissions.length === 0 && <EmptyState>No submissions yet.</EmptyState>}
            {submissions?.map((s) => (
              <GradeRow key={s.id} submission={s} maxMarks={assignment.maxMarks} onChanged={loadSubmissions} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
