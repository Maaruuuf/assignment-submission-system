"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assignmentsApi, submissionsApi } from "../../../lib/api";
import type { AssignmentDto, SubmissionDto } from "../../../lib/types";
import { Card, EmptyState, NoData } from "../../../components/ui";
import StatusBadge, { LateTag } from "../../../components/StatusBadge";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([assignmentsApi.getAll(), submissionsApi.getMine()])
      .then(([a, s]) => {
        setAssignments(a);
        setSubmissions(s);
      })
      .catch(() => setError("Couldn't load assignments."));
  }, []);

  const submissionByAssignment = new Map((submissions ?? []).map((s) => [s.assignmentId, s]));

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Assignments</h1>
      <p className="mt-3 text-sm text-ink-muted">Everything published for your class.</p>

      {error && <p className="mt-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

      <div className="mt-6">
        <Card>
          <div className="divide-y divide-border">
            {!assignments && <EmptyState>Loading…</EmptyState>}
            {assignments && assignments.length === 0 && (
              <NoData title="Nothing assigned yet" description="Your teacher hasn't published anything for your class yet." />
            )}
            {assignments
              ?.slice()
              .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
              .map((a) => {
                const submission = submissionByAssignment.get(a.id);
                return (
                  <Link
                    key={a.id}
                    href={`/student/assignments/${a.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-paper"
                  >
                    <div className="min-w-0">
                      <span className="font-medium">{a.title}</span>
                      <p className="mt-1 text-xs text-ink-muted">
                        {a.subjectName} · Due {new Date(a.deadline).toLocaleString()}
                      </p>
                    </div>
                    {submission ? (
                      <div className="flex items-center gap-2">
                        {submission.isLate && <LateTag />}
                        <StatusBadge status={submission.status} />
                      </div>
                    ) : (
                      <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Not submitted
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        </Card>
      </div>
    </div>
  );
}
