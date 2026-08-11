"use client";

import { useEffect, useState } from "react";
import { assignmentsApi } from "../../../lib/api";
import type { AssignmentDto } from "../../../lib/types";
import { Card, EmptyState, NoData } from "../../../components/ui";
import StatusBadge from "../../../components/StatusBadge";

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assignmentsApi.getAll().then(setAssignments).catch(() => setError("Couldn't load assignments."));
  }, []);

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Assignments</h1>
      <p className="mt-3 text-sm text-ink-muted">Every assignment across every teacher and class - view only.</p>

      {error && <p className="mt-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

      <div className="mt-6">
        <Card>
          <div className="divide-y divide-border">
            {!assignments && <EmptyState>Loading…</EmptyState>}
            {assignments && assignments.length === 0 && (
              <NoData title="No assignments yet" description="Assignments will appear here once a teacher creates one." />
            )}
            {assignments
              ?.slice()
              .sort((a, b) => b.id - a.id)
              .map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <span className="font-medium">{a.title}</span>
                    <p className="mt-1 text-xs text-ink-muted">
                      {a.subjectName} · {a.className} · {a.teacherName} · Due {new Date(a.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-muted">Max {a.maxMarks}</span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
