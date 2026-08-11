// Thin typed wrapper around the ASP.NET Core API. Every call goes through `apiFetch`, which
// attaches the JWT (if present) and turns the backend's { status, title, detail } error shape
// (see API/Middleware/ExceptionHandlingMiddleware.cs) into a JS Error with a readable message.

import type {
  AppSettingsDto,
  AssignmentDto,
  ClassDto,
  LoginResponse,
  StudentEnrollmentDto,
  SubjectDto,
  SubmissionDto,
  SubmissionStatus,
  TeacherAssignmentRowDto,
  UserDto,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_STORAGE_KEY = "assm_token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = body?.detail ?? body?.title ?? `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return body as T;
}

/// Like apiFetch, but for multipart/form-data - the browser sets its own Content-Type (with the
/// boundary), so this deliberately does NOT set one, unlike the JSON helper above.
async function apiFetchForm<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", headers, body: formData });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = body?.detail ?? body?.title ?? `Upload failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return body as T;
}

// ---------- Auth ----------
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};

// ---------- Users (Admin) ----------
export const usersApi = {
  getAll: () => apiFetch<UserDto[]>("/api/users"),
  create: (dto: { fullName: string; email: string; password: string; role: string }) =>
    apiFetch<UserDto>("/api/users", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: { fullName: string; isActive: boolean }) =>
    apiFetch<UserDto>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  deactivate: (id: number) => apiFetch<void>(`/api/users/${id}`, { method: "DELETE" }),
  deletePermanently: (id: number) => apiFetch<void>(`/api/users/${id}/permanent`, { method: "DELETE" }),
};

// ---------- Classes (Admin) ----------
export const classesApi = {
  getAll: () => apiFetch<ClassDto[]>("/api/classes"),
  create: (dto: { name: string; section?: string }) =>
    apiFetch<ClassDto>("/api/classes", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: { name: string; section?: string }) =>
    apiFetch<ClassDto>(`/api/classes/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  remove: (id: number) => apiFetch<void>(`/api/classes/${id}`, { method: "DELETE" }),
  enrollStudent: (classId: number, studentId: number) =>
    apiFetch<void>(`/api/classes/${classId}/enroll/${studentId}`, { method: "POST" }),
  getStudentRoster: () => apiFetch<StudentEnrollmentDto[]>("/api/classes/roster"),
  getMine: () => apiFetch<ClassDto | null>("/api/classes/mine").then((c) => c ?? null),
};

// ---------- Subjects (Admin) ----------
export const subjectsApi = {
  getAll: (classId?: number) =>
    apiFetch<SubjectDto[]>(`/api/subjects${classId ? `?classId=${classId}` : ""}`),
  create: (dto: { name: string; classId: number }) =>
    apiFetch<SubjectDto>("/api/subjects", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: { name: string; classId: number }) =>
    apiFetch<SubjectDto>(`/api/subjects/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  assignTeacher: (dto: { teacherId: number; subjectId: number }) =>
    apiFetch<void>("/api/subjects/assign-teacher", { method: "POST", body: JSON.stringify(dto) }),
  getMine: () => apiFetch<SubjectDto[]>("/api/subjects/mine"),
  getTeacherRoster: () => apiFetch<TeacherAssignmentRowDto[]>("/api/subjects/roster"),
};

// ---------- Assignments ----------
export const assignmentsApi = {
  getAll: () => apiFetch<AssignmentDto[]>("/api/assignments"),
  getById: (id: number) => apiFetch<AssignmentDto>(`/api/assignments/${id}`),
  create: (dto: {
    title: string;
    description: string;
    deadline: string;
    maxMarks: number;
    classId: number;
    subjectId: number;
    publishImmediately: boolean;
  }) => apiFetch<AssignmentDto>("/api/assignments", { method: "POST", body: JSON.stringify(dto) }),
  update: (id: number, dto: { title: string; description: string; deadline: string; maxMarks: number }) =>
    apiFetch<AssignmentDto>(`/api/assignments/${id}`, { method: "PUT", body: JSON.stringify(dto) }),
  publish: (id: number) => apiFetch<void>(`/api/assignments/${id}/publish`, { method: "POST" }),
  unpublish: (id: number) => apiFetch<void>(`/api/assignments/${id}/unpublish`, { method: "POST" }),
  remove: (id: number) => apiFetch<void>(`/api/assignments/${id}`, { method: "DELETE" }),
};

// ---------- Submissions ----------
export const submissionsApi = {
  submit: (assignmentId: number, answerText: string, file?: { url: string; name: string }) =>
    apiFetch<SubmissionDto>(`/api/assignments/${assignmentId}/submissions`, {
      method: "POST",
      body: JSON.stringify({ answerText, fileUrl: file?.url, fileName: file?.name }),
    }),
  update: (submissionId: number, answerText: string, file?: { url: string; name: string }) =>
    apiFetch<SubmissionDto>(`/api/submissions/${submissionId}`, {
      method: "PUT",
      body: JSON.stringify({ answerText, fileUrl: file?.url, fileName: file?.name }),
    }),
  getForAssignment: (assignmentId: number) =>
    apiFetch<SubmissionDto[]>(`/api/assignments/${assignmentId}/submissions`),
  getMine: () => apiFetch<SubmissionDto[]>("/api/submissions/mine"),
  grade: (submissionId: number, marks: number, feedback: string) =>
    apiFetch<SubmissionDto>(`/api/submissions/${submissionId}/grade`, {
      method: "POST",
      body: JSON.stringify({ marks, feedback }),
    }),
  setStatus: (submissionId: number, status: SubmissionStatus) =>
    apiFetch<SubmissionDto>(`/api/submissions/${submissionId}/status?status=${status}`, { method: "PATCH" }),
};

// ---------- Uploads ----------
export const uploadsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetchForm<{ url: string; fileName: string }>("/api/uploads", formData);
  },
  /// Resolves a stored relative URL (e.g. "/uploads/xyz.pdf") against the API's own origin.
  resolveUrl: (url: string) => `${API_BASE_URL}${url}`,
};

// ---------- Settings (Admin) ----------
export const settingsApi = {
  get: () => apiFetch<AppSettingsDto>("/api/settings"),
  update: (dto: AppSettingsDto) => apiFetch<AppSettingsDto>("/api/settings", { method: "PUT", body: JSON.stringify(dto) }),
};
