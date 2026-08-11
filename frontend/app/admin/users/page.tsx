"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, usersApi } from "../../../lib/api";
import type { Role, UserDto } from "../../../lib/types";
import { isValidEmail } from "../../../lib/validation";
import { Button, Card, EmptyState, ErrorBanner, Field, Input, Select } from "../../../components/ui";
import StatusBadge from "../../../components/StatusBadge";
import ConfirmDialog from "../../../components/ConfirmDialog";

const ROLES: Role[] = ["Admin", "Teacher", "Student"];

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [activeTab, setActiveTab] = useState<Role | "All">("All");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Student");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadUsers() {
    usersApi.getAll().then(setUsers).catch(() => setError("Couldn't load users."));
  }

  useEffect(loadUsers, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Enter a valid email address (e.g. name@school.edu).");
      return;
    }
    setIsSubmitting(true);
    try {
      await usersApi.create({ fullName, email, password, role });
      toast.success(`${fullName} added as ${role}.`);
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("Student");
      setShowForm(false);
      loadUsers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't create the user.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(user: UserDto) {
    setError(null);
    try {
      if (user.isActive) {
        await usersApi.deactivate(user.id);
        toast.success(`${user.fullName} deactivated.`);
      } else {
        await usersApi.update(user.id, { fullName: user.fullName, isActive: true });
        toast.success(`${user.fullName} reactivated.`);
      }
      loadUsers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't update the user.";
      setError(message);
      toast.error(message);
    }
  }

  const [pendingDelete, setPendingDelete] = useState<UserDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await usersApi.deletePermanently(pendingDelete.id);
      toast.success(`${pendingDelete.fullName} permanently deleted.`);
      setPendingDelete(null);
      loadUsers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Couldn't delete the user.";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  const filtered = (users ?? []).filter((u) => activeTab === "All" || u.role === activeTab);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ledger-rule inline-block font-display text-2xl font-semibold">Users</h1>
          <p className="mt-3 text-sm text-ink-muted">Every account across all three roles.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "Add User"}</Button>
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-2">
          <Field label="Full name" htmlFor="fullName">
            <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Temporary password" htmlFor="password">
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Role" htmlFor="role">
            <Select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex gap-1 border-b border-border">
        {(["All", ...ROLES] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card>
        <div className="divide-y divide-border">
          {!users && <EmptyState>Loading…</EmptyState>}
          {users && filtered.length === 0 && <EmptyState>No users in this category yet.</EmptyState>}
          {filtered.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.fullName}</span>
                  <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-ink-muted">{user.role}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={user.isActive ? "Active" : "Inactive"} />
                <Button variant="secondary" onClick={() => toggleActive(user)}>
                  {user.isActive ? "Deactivate" : "Reactivate"}
                </Button>
                <Button variant="danger" onClick={() => setPendingDelete(user)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete user permanently?"
        description={`"${pendingDelete?.fullName}" and all their related data (enrollment, submissions, or created assignments) will be permanently removed. This is different from deactivating - it cannot be undone.`}
        isBusy={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
