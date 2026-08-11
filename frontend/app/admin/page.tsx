"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { assignmentsApi, classesApi, subjectsApi, submissionsApi, usersApi } from "../../lib/api";
import type { AssignmentDto, ClassDto, SubjectDto, SubmissionDto, UserDto } from "../../lib/types";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { Card, EmptyState, NoData } from "../../components/ui";
import { IconFileText, IconUsers } from "../../components/icons";

const CHART_COLORS = ["#245c4b", "#b8722e", "#a23b3b"];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [classes, setClasses] = useState<ClassDto[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectDto[] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([usersApi.getAll(), classesApi.getAll(), subjectsApi.getAll(), assignmentsApi.getAll()])
      .then(async ([u, c, s, a]) => {
        setUsers(u);
        setClasses(c);
        setSubjects(s);
        setAssignments(a);
        const lists = await Promise.all(
          a.map((x) => submissionsApi.getForAssignment(x.id).catch(() => [] as SubmissionDto[]))
        );
        setSubmissionCount(lists.flat().length);
      })
      .catch(() => setError("Couldn't load the dashboard. Check that the API is running."));
  }, []);

  const isLoading = !users || !classes || !subjects || !assignments;
  const teacherCount = users?.filter((u) => u.role === "Teacher").length ?? 0;
  const studentCount = users?.filter((u) => u.role === "Student").length ?? 0;
  const adminCount = users?.filter((u) => u.role === "Admin").length ?? 0;
  const recentAssignments = [...(assignments ?? [])].sort((a, b) => b.id - a.id).slice(0, 6);

  const roleSplit = [
    { name: "Teachers", value: teacherCount },
    { name: "Students", value: studentCount },
    { name: "Admins", value: adminCount },
  ].filter((d) => d.value > 0);

  const assignmentsPerClass = (classes ?? []).map((c) => ({
    name: c.name,
    count: (assignments ?? []).filter((a) => a.classId === c.id).length,
  }));

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Overview</h1>
      <p className="mt-3 text-sm text-ink-muted">Every class, subject and assignment across the school, at a glance.</p>

      {error && <p className="mt-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Users" value={isLoading ? "–" : users!.length} icon={<IconUsers />} />
        <StatCard label="Teachers" value={isLoading ? "–" : teacherCount} icon={<IconUsers />} />
        <StatCard label="Students" value={isLoading ? "–" : studentCount} icon={<IconUsers />} tone="amber" />
        <StatCard label="Classes" value={isLoading ? "–" : classes!.length} />
        <StatCard label="Subjects" value={isLoading ? "–" : subjects!.length} />
        <StatCard label="Assignments" value={isLoading ? "–" : assignments!.length} icon={<IconFileText />} />
        <StatCard label="Submissions" value={submissionCount ?? "–"} icon={<IconFileText />} tone="amber" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Users by Role">
          <div className="p-5">
            {isLoading || roleSplit.length === 0 ? (
              <p className="text-sm text-ink-muted">Not enough data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={roleSplit} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {roleSplit.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e1da" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted">
              {roleSplit.map((entry, i) => (
                <span key={entry.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Assignments per Class">
          <div className="p-5">
            {isLoading || assignmentsPerClass.length === 0 ? (
              <p className="text-sm text-ink-muted">Not enough data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={assignmentsPerClass}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e1da" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#5b665f" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#5b665f" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e1da" }} />
                  <Bar dataKey="count" fill="#245c4b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card title="Recent Assignments" action={<Link href="/admin/assignments" className="text-sm font-medium text-primary hover:underline">View all</Link>}>
          <div className="divide-y divide-border">
            {isLoading && <EmptyState>Loading…</EmptyState>}
            {!isLoading && recentAssignments.length === 0 && (
              <NoData title="No assignments yet" description="Teachers will see them here once created." />
            )}
            {!isLoading &&
              recentAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <IconFileText className="shrink-0 text-ink-muted" />
                      <span className="truncate font-medium">{assignment.title}</span>
                    </div>
                    <p className="mt-1 pl-7 text-xs text-ink-muted">
                      {assignment.subjectName} · {assignment.className} · {assignment.teacherName}
                    </p>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
