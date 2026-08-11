"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError, assignmentsApi } from "../../../lib/api";
import type { AssignmentDto } from "../../../lib/types";
import { Button, Card, ErrorBanner, NoData } from "../../../components/ui";
import StatusBadge from "../../../components/StatusBadge";
import ConfirmDialog from "../../../components/ConfirmDialog";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AssignmentDto | null>(null);

  function load() {
    assignmentsApi.getAll().then(setAssignments).catch(() => setError("Couldn't load your assignments."));
  }

  useEffect(load, []);

  async function togglePublish(assignment: AssignmentDto) {
    setError(null);
    setBusyId(assignment.id);
    try {
      if (assignment.status === "Published") {
        await assignmentsApi.unpublish(assignment.id);
        toast.success(`"${assignment.title}" unpublished.`);
      } else {
        await assignmentsApi.publish(assignment.id);
        toast.success(`"${assignment.title}" published.`);
      }
      load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't update the assignment.";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await assignmentsApi.remove(pendingDelete.id);
      toast.success(`"${pendingDelete.title}" deleted.`);
      setPendingDelete(null);
      load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't delete the assignment.";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">My Assignments</h1>
          <p className="mt-3 text-sm text-ink-muted">Everything you've created, draft or published.</p>
        </div>
        <Link href="/teacher/assignments/new">
          <Button>New Assignment</Button>
        </Link>
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-6">
        <Card>
          <div className="divide-y divide-border">
            {!assignments && <div className="px-5 py-6 text-sm text-ink-muted">Loading…</div>}
            {assignments && assignments.length === 0 && (
              <NoData
                title="No assignments yet"
                description="Create your first assignment to publish it to a class."
                action={
                  <Link href="/teacher/assignments/new">
                    <Button>Create your first assignment</Button>
                  </Link>
                }
              />
            )}
            {assignments
              ?.slice()
              .sort((a, b) => b.id - a.id)
              .map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <Link href={`/teacher/assignments/${a.id}`} className="min-w-0 flex-1 hover:underline">
                    <span className="font-medium">{a.title}</span>
                    <p className="mt-1 text-xs text-ink-muted">
                      {a.subjectName} · {a.className} · Due {new Date(a.deadline).toLocaleDateString()}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <Button variant="secondary" disabled={busyId === a.id} onClick={() => togglePublish(a)}>
                      {a.status === "Published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="danger" disabled={busyId === a.id} onClick={() => setPendingDelete(a)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete assignment?"
        description={`"${pendingDelete?.title}" and all its submissions will be permanently removed. This action cannot be undone.`}
        isBusy={busyId === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
