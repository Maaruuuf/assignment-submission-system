// Mirrors the DTOs returned by the ASP.NET Core API (backend/src/Application/DTOs).
// Keeping these in one file makes it obvious when the frontend and backend contracts drift.

export type Role = "Admin" | "Teacher" | "Student";

export interface CurrentUser {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  userId: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface ClassDto {
  id: number;
  name: string;
  section: string;
}

export interface StudentEnrollmentDto {
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  section: string;
}

export interface SubjectDto {
  id: number;
  name: string;
  classId: number;
  className: string;
  classSection: string;
  teacherId: number | null;
  teacherName: string | null;
}

export interface TeacherAssignmentRowDto {
  teacherId: number;
  teacherName: string;
  classId: number;
  className: string;
  section: string;
  subjectId: number;
  subjectName: string;
}

export type AssignmentStatus = "Draft" | "Published";

export interface AssignmentDto {
  id: number;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  status: AssignmentStatus;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
}

export type SubmissionStatus = "Pending" | "Reviewed" | "Accepted" | "Rejected";

export interface SubmissionDto {
  id: number;
  assignmentId: number;
  assignmentTitle: string;
  studentId: number;
  studentName: string;
  answerText: string;
  fileUrl: string | null;
  fileName: string | null;
  submittedAtUtc: string;
  status: SubmissionStatus;
  isLate: boolean;
  marks: number | null;
  feedback: string | null;
  gradedAtUtc: string | null;
}

export interface AppSettingsDto {
  maxUploadSizeMb: number;
  allowResubmissionBeforeDeadline: boolean;
  defaultMaxMarks: number;
  defaultDeadlineDays: number;
}
