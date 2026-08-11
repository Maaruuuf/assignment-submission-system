"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assignmentsApi, submissionsApi } from "../../../lib/api";
import type { SubmissionDto } from "../../../lib/types";
import { Card, EmptyState } from "../../../components/ui";
import StatusBadge, { LateTag } from "../../../components/StatusBadge";

type Row = SubmissionDto & { assignmentId: number };

export default function TeacherSubmissionsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<"All" | "Needs review">("Needs review");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assignmentsApi
      .getAll()
      .then(async (assignments) => {
        const lists = await Promise.all(
          assignments.map((a) => submissionsApi.getForAssignment(a.id).catch(() => [] as SubmissionDto[]))
        );
        setRows(lists.flat() as Row[]);
      })
      .catch(() => setError("Couldn't load submissions."));
  }, []);

  const filtered = (rows ?? []).filter((r) => filter === "All" || r.status === "Pending");
  const sorted = [...filtered].sort((a, b) => new Date(b.submittedAtUtc).getTime() - new Date(a.submittedAtUtc).getTime());

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Submissions</h1>
      <p className="mt-3 text-sm text-ink-muted">Every submission across your assignments, newest first.</p>

      {error && <p className="mt-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

      <div className="mt-6 flex gap-1 border-b border-border">
        {(["Needs review", "All"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Card>
          <div className="divide-y divide-border">
            {!rows && <EmptyState>Loading…</EmptyState>}
            {rows && sorted.length === 0 && <EmptyState>Nothing here - you're all caught up.</EmptyState>}
            {sorted.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/assignments/${s.assignmentId}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-paper"
              >
                <div className="min-w-0">
                  <span className="font-medium">{s.studentName}</span>
                  <p className="mt-1 text-xs text-ink-muted">
                    {s.assignmentTitle} · Submitted {new Date(s.submittedAtUtc).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.isLate && <LateTag />}
                  <StatusBadge status={s.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
