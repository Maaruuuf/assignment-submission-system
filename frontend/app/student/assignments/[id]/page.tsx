"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError, assignmentsApi, submissionsApi, uploadsApi } from "../../../../lib/api";
import type { AssignmentDto, SubmissionDto } from "../../../../lib/types";
import { Button, ErrorBanner, Field, Textarea } from "../../../../components/ui";
import StatusBadge, { LateTag } from "../../../../components/StatusBadge";
import Spinner from "../../../../components/Spinner";

export default function StudentAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = Number(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    assignmentsApi.getById(assignmentId).then(setAssignment).catch(() => setError("Couldn't load this assignment."));
    submissionsApi
      .getMine()
      .then((all) => {
        const mine = all.find((s) => s.assignmentId === assignmentId) ?? null;
        setSubmission(mine);
        if (mine) {
          setAnswerText(mine.answerText);
          if (mine.fileUrl) setAttachedFile({ url: mine.fileUrl, name: mine.fileName ?? "Attached file" });
        }
      })
      .catch(() => {});
  }, [assignmentId]);

  const isPastDeadline = assignment ? new Date() > new Date(assignment.deadline) : false;
  const isLocked = submission?.marks !== null && submission !== null;
  const isLockedByDeadline = isPastDeadline && !!submission && !isLocked;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadsApi.upload(file);
      setAttachedFile({ url: result.url, name: result.fileName });
      toast.success("File attached.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't upload the file.";
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = submission
        ? await submissionsApi.update(submission.id, answerText, attachedFile ?? undefined)
        : await submissionsApi.submit(assignmentId, answerText, attachedFile ?? undefined);
      setSubmission(result);
      toast.success(result.isLate ? "Submitted - marked Late since the deadline has passed." : "Submitted.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't submit your answer.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && !assignment) return <ErrorBanner message={error} />;
  if (!assignment) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold">{assignment.title}</h1>
        {submission && (
          <>
            {submission.isLate && <LateTag />}
            <StatusBadge status={submission.status} />
          </>
        )}
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        {assignment.subjectName} · Due {new Date(assignment.deadline).toLocaleString()} · Max {assignment.maxMarks} marks
      </p>

      <p className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-surface p-5 text-sm text-ink">
        {assignment.description}
      </p>

      {submission?.marks !== null && submission !== null && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">Your grade</h2>
          <p className="mt-2 font-mono text-2xl font-semibold text-primary">
            {submission.marks} / {assignment.maxMarks}
          </p>
          {submission.feedback && <p className="mt-2 text-sm text-ink-muted">{submission.feedback}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">{submission ? "Your answer" : "Submit your answer"}</h2>

        <ErrorBanner message={error} />

        {isPastDeadline && !submission && (
          <p className="rounded-lg bg-amber-soft px-4 py-3 text-sm text-amber">
            The deadline has passed - you can still submit, but it will be marked Late.
          </p>
        )}
        {(isLocked || isLockedByDeadline) && (
          <p className="rounded-lg bg-paper px-4 py-3 text-sm text-ink-muted">
            {isLocked
              ? "This submission has been marked and can no longer be edited."
              : "The deadline has passed - this submission can no longer be edited."}
          </p>
        )}

        <Field label="Answer" htmlFor="answerText">
          <Textarea
            id="answerText"
            required
            rows={8}
            disabled={isLocked || isLockedByDeadline}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />
        </Field>

        {!(isLocked || isLockedByDeadline) && (
          <Field label="Attachment (optional - PDF, DOCX or image)" htmlFor="fileUpload">
            <input
              ref={fileInputRef}
              id="fileUpload"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
            {isUploading && (
              <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                <Spinner /> Uploading…
              </p>
            )}
            {!isUploading && attachedFile && (
              <p className="mt-2 flex items-center gap-2 text-xs text-primary">
                📎 {attachedFile.name}
                <button type="button" onClick={() => setAttachedFile(null)} className="text-brick hover:underline">
                  Remove
                </button>
              </p>
            )}
          </Field>
        )}

        {!isLocked && !isLockedByDeadline && (
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? "Submitting…" : submission ? "Update submission" : "Submit"}
          </Button>
        )}
      </form>
    </div>
  );
}
