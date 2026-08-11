"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, classesApi, subjectsApi, usersApi } from "../../../lib/api";
import type { ClassDto, SubjectDto, UserDto } from "../../../lib/types";
import { Button, Card, EmptyState, ErrorBanner, Field, Input, Select } from "../../../components/ui";

function classLabel(name: string, section: string) {
  return section ? `${name} - Section ${section}` : name;
}

function EditSubjectRow({
  subject,
  classes,
  onSaved,
  onCancel,
}: {
  subject: SubjectDto;
  classes: ClassDto[] | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(subject.name);
  const [classId, setClassId] = useState(subject.classId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await subjectsApi.update(subject.id, { name, classId });
      toast.success("Subject updated.");
      onSaved();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't update the subject.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3 px-5 py-4">
      <div className="flex-1">
        <Field label="Name" htmlFor={`editSubjectName-${subject.id}`}>
          <Input id={`editSubjectName-${subject.id}`} required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      <div className="w-48">
        <Field label="Class" htmlFor={`editSubjectClass-${subject.id}`}>
          <Select id={`editSubjectClass-${subject.id}`} value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabel(c.name, c.section)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {error && <p className="w-full text-xs text-brick">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectDto[] | null>(null);
  const [classes, setClasses] = useState<ClassDto[] | null>(null);
  const [teachers, setTeachers] = useState<UserDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [classId, setClassId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignTeacherId, setAssignTeacherId] = useState<number | "">("");
  const [assignSubjectId, setAssignSubjectId] = useState<number | "">("");

  function loadSubjects() {
    subjectsApi.getAll().then(setSubjects).catch(() => setError("Couldn't load subjects."));
  }

  useEffect(() => {
    loadSubjects();
    classesApi.getAll().then(setClasses).catch(() => {});
    usersApi
      .getAll()
      .then((all) => setTeachers(all.filter((u) => u.role === "Teacher")))
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await subjectsApi.create({ name, classId: Number(classId) });
      toast.success(`Subject "${name}" created.`);
      setName("");
      setClassId("");
      loadSubjects();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't create the subject.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!assignTeacherId || !assignSubjectId) return;
    const targetSubject = subjects?.find((s) => s.id === assignSubjectId);
    const isReassign = !!targetSubject?.teacherId && targetSubject.teacherId !== assignTeacherId;
    try {
      await subjectsApi.assignTeacher({ teacherId: Number(assignTeacherId), subjectId: Number(assignSubjectId) });
      toast.success(isReassign ? "Subject reassigned to the new teacher." : "Teacher assigned to subject.");
      setAssignTeacherId("");
      loadSubjects();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't assign the teacher.";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Subjects</h1>
      <p className="mt-3 text-sm text-ink-muted">
        Subjects belong to a class, and each subject can have at most one teacher - assigning a new
        one reassigns it, it doesn't add a second teacher. A teacher can be assigned to any number
        of subjects.
      </p>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">New subject</h2>
          <Field label="Name" htmlFor="subjectName">
            <Input id="subjectName" required placeholder="Mathematics" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Class" htmlFor="subjectClass">
            <Select id="subjectClass" required value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
              <option value="">Select a class…</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c.name, c.section)}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create subject"}
          </Button>
        </form>

        <form onSubmit={handleAssign} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">Assign / reassign a teacher</h2>
          <Field label="Subject" htmlFor="assignSubject">
            <Select id="assignSubject" required value={assignSubjectId} onChange={(e) => setAssignSubjectId(Number(e.target.value))}>
              <option value="">Select a subject…</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {classLabel(s.className, s.classSection)} - {s.name}
                  {s.teacherName ? ` (currently ${s.teacherName})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Teacher" htmlFor="assignTeacher">
            <Select id="assignTeacher" required value={assignTeacherId} onChange={(e) => setAssignTeacherId(Number(e.target.value))}>
              <option value="">Select a teacher…</option>
              {teachers?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.email})
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">Assign</Button>
        </form>
      </div>

      <div className="mt-8">
        <Card title="All subjects">
          <div className="divide-y divide-border">
            {!subjects && <EmptyState>Loading…</EmptyState>}
            {subjects && subjects.length === 0 && <EmptyState>No subjects yet - create one above.</EmptyState>}
            {subjects?.map((s) =>
              editingId === s.id ? (
                <EditSubjectRow
                  key={s.id}
                  subject={s}
                  classes={classes}
                  onSaved={() => { setEditingId(null); loadSubjects(); }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    <p className="mt-1 text-xs text-ink-muted">
                      {classLabel(s.className, s.classSection)} · {s.teacherName ?? "No teacher assigned"}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => setEditingId(s.id)}>
                    Edit
                  </Button>
                </div>
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
