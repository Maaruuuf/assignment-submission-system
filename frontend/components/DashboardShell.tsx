"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { IconLogout } from "./icons";

export interface NavItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => ReactNode;
}

interface DashboardShellProps {
  roleLabel: string;
  navItems: NavItem[];
  children: ReactNode;
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-6 py-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-lg font-semibold text-white">
        A
      </div>
      <div>
        <div className="font-display text-base font-semibold leading-tight">Assignments</div>
      </div>
    </div>
  );
}

/// Shared sidebar + topbar shell used by all three role sections. Persistent sidebar on md+
/// screens; on narrower screens it becomes a slide-in drawer triggered from the topbar, so the
/// whole app stays usable on a phone.
export default function DashboardShell({ roleLabel, navItems, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => setIsDrawerOpen(false), [pathname]);

  const nav = (
    <>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-primary-soft text-primary" : "text-ink-muted hover:bg-paper hover:text-ink"
              }`}
            >
              {isActive && <span className="absolute -left-3 h-5 w-1 rounded-r bg-primary" aria-hidden />}
              <Icon className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-sm font-semibold text-primary">
            {user?.fullName?.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.fullName}</div>
            <div className="truncate text-xs text-ink-muted">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-brick-soft hover:text-brick"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-paper md:flex">
      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-base font-semibold text-white">
            A
          </div>
          <span className="font-display text-base font-semibold">Assignments</span>
        </div>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setIsDrawerOpen(true)}
          className="rounded-md border border-border p-2 text-ink"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" className="fill-none stroke-current" strokeWidth="1.8">
            <path d="M2.5 5.5h15M2.5 10h15M2.5 14.5h15" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={() => setIsDrawerOpen(false)} aria-hidden />
      )}

      {/* Sidebar: persistent on md+, slide-in drawer below md */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col border-r border-border bg-surface transition-transform duration-200 md:static md:translate-x-0 ${
          isDrawerOpen ? "translate-x-0" : ""
        }`}
      >
        <div className="hidden md:block">
          <Brand />
        </div>
        <div className="flex items-center justify-between px-4 py-4 md:hidden">
          <span className="font-display text-sm font-semibold text-ink-muted">{roleLabel} menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsDrawerOpen(false)}
            className="rounded-md p-1.5 text-ink-muted hover:bg-paper"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" className="fill-none stroke-current" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <span className="hidden px-6 pb-4 text-xs text-ink-muted md:block">{roleLabel}</span>
        {nav}
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
