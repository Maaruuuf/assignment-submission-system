
# Assignment & Submission Management System

A role-based Assignment & Submission Management System for a school/college. Admins manage users, classes and subjects;
Teachers create and grade assignments; Students submit their work and view feedback.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Business rules](#key-business-rules)
- [Project structure](#project-structure)
- [Setup](#setup)
- [Database setup](#database-setup)
- [Running the backend](#running-the-backend)
- [Running the frontend](#running-the-frontend)
- [Running the tests](#running-the-tests)
- [Demo accounts](#demo-accounts)
- [Environment variables](#environment-variables)
- [Assumptions](#assumptions)
- [Known limitations](#known-limitations)

## Features

**Admin** - manage user accounts (create, deactivate, permanently delete); manage classes,
sections and subjects; assign/reassign teachers to subjects; view every assignment and
submission in the system; view roster pages (which student is in which class, which teacher
teaches which subject); manage application-level settings.

**Teacher** - create, update, delete, publish/unpublish assignments for a class + subject they're
assigned to; view submissions for their assignments; grade with marks + feedback; move a
submission through a review status (Pending/Reviewed/Accepted/Rejected); see which classes and
subjects they teach.

**Student** - view assignments published for their class; submit an answer (with an optional
PDF/DOCX/image attachment); update a submission before the deadline; view submission status,
marks and feedback; see their own class.

Cross-cutting: JWT login with role-based authorization enforced by the API,
toast notifications, responsive layout, dashboards with charts per role.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS v4 |
| Backend  | ASP.NET Core Web API (.NET 8, C#) |
| Database | PostgreSQL via EF Core |
| Auth     | JWT bearer tokens, role-based authorization |
| Testing  | xUnit + EF Core InMemory + FluentAssertions |
| API docs | Swagger / OpenAPI |
| Other    | `sonner` (toasts), `recharts` (dashboard charts) |

## Data model

`User` (role: Admin/Teacher/Student) — `Class` (e.g. "Grade 9", Section "A") — `Subject`
(belongs to one Class) — `TeacherSubjectAssignment` (which teacher teaches which subject; at
most one teacher per subject) — `StudentClassEnrollment` (which class a student belongs to; a
student has at most one active enrollment) — `Assignment` (created by a teacher, for a
class+subject) — `Submission` (one per student per assignment) — `AppSettings` (single
admin-tunable row).

This is a standard **Clean Architecture** layering on the backend: `Domain` (entities/enums) has
no outgoing dependencies, `Application` (DTOs, business-rule services) depends only on `Domain`
and defines `IApplicationDbContext` rather than depending on EF Core directly, and
`Infrastructure`/`API` are the only layers that know about PostgreSQL, JWTs, or ASP.NET Core
itself.



## Project structure

```
assignment-submission-system/
├── backend/
│   ├── src/
│   │   ├── Domain/          # Entities, enums - no dependencies on anything else
│   │   ├── Application/     # DTOs, service interfaces, business-rule services
│   │   ├── Infrastructure/  # EF Core DbContext + migrations, JWT/password/file-upload implementations
│   │   └── API/             # Controllers, Program.cs, Swagger, middleware
│   ├── tests/
│   │   └── Application.Tests/  # xUnit unit tests for the Application services
│   └── AssignmentSubmissionSystem.sln
├── frontend/
│   ├── app/                 # Next.js App Router pages, grouped by role (admin/teacher/student)
│   ├── components/          # Shared UI primitives (forms, cards, dialogs, charts)
│   └── lib/                 # Typed API client, auth context, shared types
└── README.md                
```

## Setup

Prerequisites: [.NET 8 SDK](https://dotnet.microsoft.com/download), [Node.js 20+](https://nodejs.org),
and a running PostgreSQL instance.

```bash
git clone <repo-url>
cd assignment-submission-system
```

### Backend environment

Secrets are kept out of the repo via a `.env` file (loaded by `DotNetEnv` at startup) rather than
`appsettings.json`.

```bash
cd backend/src/API
cp .env.example .env
```

Edit `.env` with your real Postgres connection string and a random JWT signing key:

```
DATABASE_CONNECTION_STRING=Host=localhost;Port=5432;Database=assignment_submission_system;Username=postgres;Password=YOUR_POSTGRES_PASSWORD
JWT_KEY=YOUR_LONG_RANDOM_JWT_SECRET_AT_LEAST_32_CHARACTERS
```

### Frontend environment

```bash
cd frontend
cp .env.local.example .env.local
```

`.env.local.example` already points at `http://localhost:5000`; only change it if your API runs
elsewhere.

## Database setup

The backend uses EF Core migrations as the source of truth for the schema. From `backend/src/API`, with `.env` filled in:

```bash
dotnet tool install --global dotnet-ef   # once, if not already installed
dotnet restore
dotnet ef database update --project ../Infrastructure --startup-project .
```

This creates every table plus all constraints from the committed migration files in
`backend/src/Infrastructure/Persistence/Migrations/`. On top of that, the API **automatically
seeds demo data on first startup** (`Infrastructure/Persistence/Seed/DbSeeder.cs`): the three demo
accounts below, a sample class/subject, a teacher assignment, a student enrollment, one published
and one draft assignment, and one sample submission. It only seeds once - safe to restart the API
repeatedly.

## Running the backend

```bash
cd backend/src/API
dotnet run
```

Swagger UI opens at `http://localhost:5000/swagger`. 

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000/login`. The API's CORS policy allows `http://localhost:3000` by
default (`Cors:AllowedOrigins` in `appsettings.json`).

## Running the tests

```bash
cd backend/tests/Application.Tests
dotnet test
```

39 unit tests across `Services/*Tests.cs`, covering: role/subject-based authorization on
assignment and submission actions, the deadline/late-flag rule, the update-before-marking rule,
marks-vs-max-marks validation, the Class/Subject/enrollment/teacher-assignment uniqueness rules,
login failure and blocked-account cases, and the deactivate-vs-permanently-delete distinction.
Each test spins up an isolated in-memory database, so they don't need PostgreSQL running.

## Demo accounts

| Role    | Email                | Password    |
|---------|-----------------------|-------------|
| Admin   | admin@school.edu      | Passw0rd!   |
| Teacher | teacher@school.edu    | Passw0rd!   |
| Student | student2@school.edu    | Passw0rd!   |


## Environment variables

| File (gitignored)          | Template (committed)                | Used by  |
|-----------------------------|--------------------------------------|----------|
| `backend/src/API/.env`      | `backend/src/API/.env.example`       | Backend  |
| `frontend/.env.local`       | `frontend/.env.local.example`        | Frontend |

No real secrets, passwords, or keys are committed anywhere in this repository.

## Assumptions

- One teacher per class+subject; a teacher may teach any number of classes/subjects.
- A student belongs to exactly one class at a time.
- Submission review status (Pending/Reviewed/Accepted/Rejected) is a separate concern from
  lateness (`isLate`) and from grading (`marks`/`feedback`) - a teacher can set any combination.
- File attachments accept PDF, DOC, DOCX, PNG and JPG, with a max size controlled by Admin
  settings (default 10 MB).

## Known limitations

- The JWT is stored in browser `localStorage` rather than an httpOnly cookie.
- No refresh-token flow - the token simply expires (8 hours) and the user has to log in again.
- Uploaded files are stored on local disk under `wwwroot/uploads`, not in cloud/blob storage.
- No pagination on list endpoints/pages.
- No email verification or self-service password reset; all accounts are admin-provisioned.

<img width="1365" height="632" alt="Screenshot 2026-11-15 211329" src="https://github.com/user-attachments/assets/1cba816b-0385-41c0-a000-e54d8e46f058" />
<img width="1365" height="632" alt="Screenshot 2026-11-15 211329" src="https://github.com/user-attachments/assets/1017178e-8bcb-40ee-a1cf-2b1b58fa92d3" />
