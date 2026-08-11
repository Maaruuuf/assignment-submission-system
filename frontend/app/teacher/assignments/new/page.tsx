"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, assignmentsApi, subjectsApi } from "../../../../lib/api";
import type { SubjectDto } from "../../../../lib/types";
import { Button, ErrorBanner, Field, Input, Select, Textarea } from "../../../../components/ui";

function classLabel(name: string, section: string) {
  return section ? `${name} - Section ${section}` : name;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const [mySubjects, setMySubjects] = useState<SubjectDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [publishImmediately, setPublishImmediately] = useState(false);

  useEffect(() => {
    subjectsApi
      .getMine()
      .then(setMySubjects)
      .catch(() => setError("Couldn't load your assigned subjects."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!subjectId) {
      setError("Choose a class and subject first.");
      return;
    }
    if (maxMarks.trim() === "" || Number(maxMarks) <= 0) {
      setError("Enter a valid max marks value.");
      return;
    }
    const subject = mySubjects?.find((s) => s.id === subjectId);
    if (!subject) {
      setError("Choose a class and subject first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await assignmentsApi.create({
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        maxMarks: Number(maxMarks),
        classId: subject.classId,
        subjectId: subject.id,
        publishImmediately,
      });
      toast.success(publishImmediately ? "Assignment created and published." : "Assignment saved as draft.");
      router.push(`/teacher/assignments/${created.id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't create the assignment.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasNoSubjects = mySubjects !== null && mySubjects.length === 0;

  return (
    <div className="max-w-2xl">
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">New Assignment</h1>
      <p className="mt-3 text-sm text-ink-muted">
        You can only create assignments for the classes and subjects an admin has assigned to you.
      </p>

      {hasNoSubjects && (
        <p className="mt-6 rounded-lg bg-amber-soft px-4 py-3 text-sm text-amber">
          You haven't been assigned to any subject yet - ask an admin to assign you one before creating an assignment.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5">
        <div className="mt-1">
          <ErrorBanner message={error} />
        </div>

        <Field label="Title" htmlFor="title">
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Description" htmlFor="description">
          <Textarea id="description" required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field label="Class + Subject" htmlFor="subjectId">
          <Select id="subjectId" required disabled={hasNoSubjects} value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))}>
            <option value="">{mySubjects === null ? "Loading…" : "Select a class + subject…"}</option>
            {mySubjects?.map((s) => (
              <option key={s.id} value={s.id}>
                {classLabel(s.className, s.classSection)} - {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Deadline" htmlFor="deadline">
            <Input id="deadline" type="datetime-local" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>

          <Field label="Max marks" htmlFor="maxMarks">
            <Input
              id="maxMarks"
              type="number"
              min={1}
              max={1000}
              required
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={publishImmediately}
            onChange={(e) => setPublishImmediately(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[#245c4b]"
          />
          Publish immediately (otherwise saved as a draft)
        </label>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting || hasNoSubjects}>
            {isSubmitting ? "Creating…" : "Create assignment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
