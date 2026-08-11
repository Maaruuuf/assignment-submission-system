"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { assignmentsApi, classesApi, submissionsApi } from "../../lib/api";
import type { AssignmentDto, ClassDto, SubmissionDto } from "../../lib/types";
import StatCard from "../../components/StatCard";
import { LateTag } from "../../components/StatusBadge";
import { Card, EmptyState, NoData } from "../../components/ui";
import { IconFileText } from "../../components/icons";

export default function StudentDashboardPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null);
  const [myClass, setMyClass] = useState<ClassDto | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classesApi.getMine().then(setMyClass).catch(() => setMyClass(null));
    Promise.all([assignmentsApi.getAll(), submissionsApi.getMine()])
      .then(([a, s]) => {
        setAssignments(a);
        setSubmissions(s);
      })
      .catch(() => setError("Couldn't load the dashboard. Check that the API is running."));
  }, []);

  const isLoading = !assignments || !submissions;
  const submittedAssignmentIds = new Set((submissions ?? []).map((s) => s.assignmentId));
  const notYetSubmitted = (assignments ?? []).filter((a) => !submittedAssignmentIds.has(a.id));
  const pending = (submissions ?? []).filter((s) => s.status === "Pending").length;
  const reviewed = (submissions ?? []).filter((s) => s.status === "Reviewed" || s.status === "Accepted").length;
  const graded = (submissions ?? []).filter((s) => s.marks !== null);
  const averageMarks =
    graded.length > 0 ? Math.round(graded.reduce((sum, s) => sum + (s.marks ?? 0), 0) / graded.length) : null;

  const marksHistory = [...graded]
    .sort((a, b) => new Date(a.gradedAtUtc ?? a.submittedAtUtc).getTime() - new Date(b.gradedAtUtc ?? b.submittedAtUtc).getTime())
    .map((s) => ({ name: s.assignmentTitle.length > 14 ? `${s.assignmentTitle.slice(0, 14)}…` : s.assignmentTitle, marks: s.marks }));

  const upcoming = [...notYetSubmitted]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Overview</h1>
      <p className="mt-3 text-sm text-ink-muted">What's due, and how your recent work was graded.</p>

      {error && <p className="mt-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">My Class</h2>
        {myClass === undefined && <p className="mt-2 text-sm text-ink-muted">Loading…</p>}
        {myClass === null && <p className="mt-2 text-sm text-ink-muted">You haven't been enrolled in a class yet - contact an admin.</p>}
        {myClass && (
          <p className="mt-2 text-sm text-ink">
             <span className="font-mono font-semibold">{myClass.name}</span>
            {myClass.section && (
              <>
                {" "}
                · Section <span className="font-mono font-semibold">{myClass.section}</span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Assignments" value={isLoading ? "–" : assignments!.length} icon={<IconFileText />} />
        <StatCard label="Pending" value={isLoading ? "–" : pending} tone="amber" />
        <StatCard label="Reviewed" value={isLoading ? "–" : reviewed} />
        <StatCard label="Average Marks" value={averageMarks ?? "–"} hint={graded.length ? `Across ${graded.length} graded` : "No grades yet"} />
      </div>

      <div className="mt-8">
        <Card title="Marks History">
          <div className="p-5">
            {marksHistory.length === 0 ? (
              <p className="text-sm text-ink-muted">No graded submissions yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={marksHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e1da" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#5b665f" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#5b665f" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e1da" }} />
                  <Line type="monotone" dataKey="marks" stroke="#245c4b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Due Soon</h2>
            <Link href="/student/assignments" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading && <EmptyState>Loading…</EmptyState>}
            {!isLoading && upcoming.length === 0 && <NoData title="You're all caught up" description="Nothing outstanding right now." />}
            {!isLoading &&
              upcoming.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/student/assignments/${assignment.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-paper"
                >
                  <div className="min-w-0">
                    <span className="truncate font-medium">{assignment.title}</span>
                    <p className="mt-1 text-xs text-ink-muted">{assignment.subjectName}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-ink-muted">
                    Due {new Date(assignment.deadline).toLocaleDateString()}
                  </span>
                </Link>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Recent Grades</h2>
            <Link href="/student/submissions" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading && <EmptyState>Loading…</EmptyState>}
            {!isLoading && graded.length === 0 && <NoData title="Nothing graded yet" description="Grades will show up here once a teacher reviews your work." />}
            {!isLoading &&
              graded.slice(0, 6).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{submission.assignmentTitle}</span>
                      {submission.isLate && <LateTag />}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{submission.feedback ?? "No feedback left."}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-primary">{submission.marks}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
