"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { submissionsApi } from "../../../lib/api";
import type { SubmissionDto } from "../../../lib/types";
import { Card, EmptyState, NoData } from "../../../components/ui";
import StatusBadge, { LateTag } from "../../../components/StatusBadge";

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    submissionsApi.getMine().then(setSubmissions).catch(() => setError("Couldn't load your submissions."));
  }, []);

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">My Submissions</h1>
      <p className="mt-3 text-sm text-ink-muted">Everything you've turned in, and how it was graded.</p>

      {error && <p className="mt-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

      <div className="mt-6">
        <Card>
          <div className="divide-y divide-border">
            {!submissions && <EmptyState>Loading…</EmptyState>}
            {submissions && submissions.length === 0 && (
              <NoData title="Nothing submitted yet" description="Assignments you submit will show up here with their status and grade." />
            )}
            {submissions
              ?.slice()
              .sort((a, b) => new Date(b.submittedAtUtc).getTime() - new Date(a.submittedAtUtc).getTime())
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/student/assignments/${s.assignmentId}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-paper"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{s.assignmentTitle}</span>
                    <p className="mt-1 text-xs text-ink-muted">
                      Submitted {new Date(s.submittedAtUtc).toLocaleString()}
                      {s.marks !== null && ` · ${s.marks} marks`}
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
