"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { assignmentsApi, submissionsApi, subjectsApi } from "../../lib/api";
import type { AssignmentDto, SubjectDto, SubmissionDto, SubmissionStatus } from "../../lib/types";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { Card, EmptyState, NoData } from "../../components/ui";
import { IconFileText, IconInbox } from "../../components/icons";

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  Pending: "#b8722e",
  Reviewed: "#245c4b",
  Accepted: "#245c4b",
  Rejected: "#a23b3b",
};

function classLabel(name: string, section: string) {
  return section ? `${name} - Section ${section}` : name;
}

export default function TeacherDashboardPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null);
  const [mySubjects, setMySubjects] = useState<SubjectDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    subjectsApi.getMine().then(setMySubjects).catch(() => {});
    assignmentsApi
      .getAll()
      .then(async (list) => {
        setAssignments(list);
        const submissionLists = await Promise.all(
          list.map((a) => submissionsApi.getForAssignment(a.id).catch(() => [] as SubmissionDto[]))
        );
        setSubmissions(submissionLists.flat());
      })
      .catch(() => setError("Couldn't load the dashboard. Check that the API is running."));
  }, []);

  const isLoading = !assignments || !submissions;
  const pending = submissions?.filter((s) => s.status === "Pending").length ?? 0;
  const reviewed = submissions?.filter((s) => s.status === "Reviewed" || s.status === "Accepted").length ?? 0;
  const studentsSubmitted = new Set((submissions ?? []).map((s) => s.studentId)).size;

  const statusCounts: SubmissionStatus[] = ["Pending", "Reviewed", "Accepted", "Rejected"];
  const chartData = statusCounts
    .map((status) => ({ status, count: (submissions ?? []).filter((s) => s.status === status).length }))
    .filter((d) => d.count > 0);

  const upcoming = [...(assignments ?? [])]
    .filter((a) => a.status === "Published")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Overview</h1>
      <p className="mt-3 text-sm text-ink-muted">Your assignments and what's waiting on your review.</p>

      {error && <p className="mt-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Assignments" value={isLoading ? "–" : assignments!.length} icon={<IconFileText />} />
        <StatCard label="Pending Review" value={isLoading ? "–" : pending} icon={<IconInbox />} tone="amber" />
        <StatCard label="Reviewed" value={isLoading ? "–" : reviewed} icon={<IconFileText />} />
        <StatCard label="Students Submitted" value={isLoading ? "–" : studentsSubmitted} />
      </div>

      <div className="mt-8">
        <Card title="Teaching Assignments">
          <div className="divide-y divide-border">
            {mySubjects === null && <EmptyState>Loading…</EmptyState>}
            {mySubjects && mySubjects.length === 0 && (
              <NoData title="No subjects assigned yet" description="Ask an admin to assign you a class and subject." />
            )}
            {mySubjects?.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <span className="font-medium">{classLabel(s.className, s.classSection)}</span>
                <span className="text-sm text-ink-muted">{s.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card title="Submission Status">
          <div className="p-5">
            {isLoading || chartData.length === 0 ? (
              <p className="text-sm text-ink-muted">No submissions yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e1da" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#5b665f" />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 12 }} stroke="#5b665f" width={80} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e1da" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {chartData.map((d) => (
                      <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Published Assignments</h2>
          <Link href="/teacher/assignments" className="text-sm font-medium text-primary hover:underline">
            Manage all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {isLoading && <EmptyState>Loading…</EmptyState>}
          {!isLoading && upcoming.length === 0 && (
            <NoData
              title="Nothing published yet"
              description="Create your first assignment to get started."
              action={
                <Link href="/teacher/assignments/new" className="font-medium text-primary hover:underline">
                  Create your first assignment
                </Link>
              }
            />
          )}
          {!isLoading &&
            upcoming.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/teacher/assignments/${assignment.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-paper"
              >
                <div className="min-w-0">
                  <span className="truncate font-medium">{assignment.title}</span>
                  <p className="mt-1 text-xs text-ink-muted">
                    {assignment.subjectName} · {assignment.className} · Due{" "}
                    {new Date(assignment.deadline).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={assignment.status} />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
