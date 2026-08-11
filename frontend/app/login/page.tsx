"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-context";
import { ApiError } from "../../lib/api";
import { isValidEmail } from "../../lib/validation";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@school.edu" },
  { role: "Teacher", email: "teacher@school.edu" },
  { role: "Student", email: "student2@school.edu" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address (e.g. name@school.edu).");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}.`);
      router.push(`/${user.role.toLowerCase()}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-2xl font-semibold text-white">
            A
          </div>
          <h1 className="ledger-rule mx-auto inline-block font-display text-2xl font-semibold">
            Assignment &amp; Submission
          </h1>
          <p className="mt-3 text-sm text-ink-muted">Sign in to your class workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <label className="block text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            placeholder="you@school.edu"
          />

          <label className="mt-4 block text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-paper px-3 py-2 pr-16 text-sm text-ink outline-none focus:border-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-primary hover:text-primary-hover"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-brick-soft px-3 py-2 text-sm text-brick">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-dashed border-border p-4 text-xs text-ink-muted">
          <p className="mb-2 font-semibold text-ink">Demo accounts (password: Passw0rd!)</p>
          <ul className="space-y-1">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex justify-between">
                <span>{account.role}</span>
                <span className="font-mono">{account.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
