"use client";

import { useEffect, useState } from "react";
import { classesApi, subjectsApi } from "../../../lib/api";
import type { StudentEnrollmentDto, TeacherAssignmentRowDto } from "../../../lib/types";
import { Card, NoData } from "../../../components/ui";

export default function AdminRostersPage() {
  const [students, setStudents] = useState<StudentEnrollmentDto[] | null>(null);
  const [teachers, setTeachers] = useState<TeacherAssignmentRowDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([classesApi.getStudentRoster(), subjectsApi.getTeacherRoster()])
      .then(([s, t]) => {
        setStudents(s);
        setTeachers(t);
      })
      .catch(() => setError("Couldn't load rosters."));
  }, []);

  return (
    <div>
      <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Rosters</h1>
      <p className="mt-3 text-sm text-ink-muted">Who's enrolled where, and who's teaching what.</p>

      {error && <p className="mt-6 rounded-lg bg-brick-soft px-4 py-3 text-sm text-brick">{error}</p>}

      <div className="mt-6">
        <Card title="Student Assignments">
          {!students || students.length === 0 ? (
            <NoData title="No students enrolled yet" description="Enroll students from the Classes page." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Class</th>
                  <th className="px-5 py-3 font-medium">Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((row) => (
                  <tr key={row.studentId}>
                    <td className="px-5 py-3">{row.studentName}</td>
                    <td className="px-5 py-3">{row.className}</td>
                    <td className="px-5 py-3">{row.section || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <Card title="Teacher Assignments">
          {!teachers || teachers.length === 0 ? (
            <NoData title="No teacher assignments yet" description="Assign teachers to subjects from the Subjects page." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-medium">Teacher</th>
                  <th className="px-5 py-3 font-medium">Class</th>
                  <th className="px-5 py-3 font-medium">Section</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teachers.map((row) => (
                  <tr key={`${row.teacherId}-${row.subjectId}`}>
                    <td className="px-5 py-3">{row.teacherName}</td>
                    <td className="px-5 py-3">{row.className}</td>
                    <td className="px-5 py-3">{row.section || "—"}</td>
                    <td className="px-5 py-3">{row.subjectName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
