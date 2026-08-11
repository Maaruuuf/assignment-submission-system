"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

/// Entry point: sends the visitor straight to their role's dashboard, or to /login if signed out.
export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? `/${user.role.toLowerCase()}` : "/login");
  }, [user, isLoading, router]);

  return <div className="flex min-h-screen items-center justify-center bg-paper text-ink-muted">Loading…</div>;
}
