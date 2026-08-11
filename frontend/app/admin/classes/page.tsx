"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, classesApi, usersApi } from "../../../lib/api";
import type { ClassDto, UserDto } from "../../../lib/types";
import { Button, Card, EmptyState, ErrorBanner, Field, Input, Select } from "../../../components/ui";

function EditClassRow({ classItem, onSaved, onCancel }: { classItem: ClassDto; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(classItem.name);
  const [section, setSection] = useState(classItem.section ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await classesApi.update(classItem.id, { name, section: section || undefined });
      toast.success("Class updated.");
      onSaved();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't update the class.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3 px-5 py-4">
      <div className="flex-1">
        <Field label="Name" htmlFor={`editName-${classItem.id}`}>
          <Input id={`editName-${classItem.id}`} required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      <div className="w-32">
        <Field label="Section" htmlFor={`editSection-${classItem.id}`}>
          <Input id={`editSection-${classItem.id}`} value={section} onChange={(e) => setSection(e.target.value)} />
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

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassDto[] | null>(null);
  const [students, setStudents] = useState<UserDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [enrollClassId, setEnrollClassId] = useState<number | "">("");
  const [enrollStudentId, setEnrollStudentId] = useState<number | "">("");

  function loadClasses() {
    classesApi.getAll().then(setClasses).catch(() => setError("Couldn't load classes."));
  }

  useEffect(() => {
    loadClasses();
    usersApi
      .getAll()
      .then((all) => setStudents(all.filter((u) => u.role === "Student")))
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await classesApi.create({ name, section: section || undefined });
      toast.success(`Class "${name}" created.`);
      setName("");
      setSection("");
      loadClasses();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't create the class.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!enrollClassId || !enrollStudentId) return;
    try {
      await classesApi.enrollStudent(Number(enrollClassId), Number(enrollStudentId));
      toast.success("Student enrolled.");
      setEnrollStudentId("");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't enroll the student.";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Classes</h1>
      <p className="mt-3 text-sm text-ink-muted">Classes/courses that subjects and assignments hang off of.</p>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">New class</h2>
          <Field label="Name" htmlFor="className">
            <Input id="className" required placeholder="Grade 10" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Section (optional)" htmlFor="section">
            <Input id="section" placeholder="A" value={section} onChange={(e) => setSection(e.target.value)} />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create class"}
          </Button>
        </form>

        <form onSubmit={handleEnroll} className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold">Enroll a student</h2>
          <Field label="Class" htmlFor="enrollClass">
            <Select id="enrollClass" required value={enrollClassId} onChange={(e) => setEnrollClassId(Number(e.target.value))}>
              <option value="">Select a class…</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `- ${c.section}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Student" htmlFor="enrollStudent">
            <Select id="enrollStudent" required value={enrollStudentId} onChange={(e) => setEnrollStudentId(Number(e.target.value))}>
              <option value="">Select a student…</option>
              {students?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.email})
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">Enroll</Button>
        </form>
      </div>

      <div className="mt-8">
        <Card title="All classes">
          <div className="divide-y divide-border">
            {!classes && <EmptyState>Loading…</EmptyState>}
            {classes && classes.length === 0 && <EmptyState>No classes yet - create one above.</EmptyState>}
            {classes?.map((c) =>
              editingId === c.id ? (
                <EditClassRow key={c.id} classItem={c} onSaved={() => { setEditingId(null); loadClasses(); }} onCancel={() => setEditingId(null)} />
              ) : (
                <div key={c.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {c.section && <span className="ml-2 text-sm text-ink-muted">Section {c.section}</span>}
                  </div>
                  <Button variant="secondary" onClick={() => setEditingId(c.id)}>
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
