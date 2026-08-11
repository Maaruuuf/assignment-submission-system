"use client";

import type { ReactNode } from "react";
import { RequireRole } from "../../lib/auth-context";
import DashboardShell, { type NavItem } from "../../components/DashboardShell";
import { IconDashboard, IconFileText, IconInbox } from "../../components/icons";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: IconDashboard },
  { label: "Assignments", href: "/student/assignments", icon: IconFileText },
  { label: "My Submissions", href: "/student/submissions", icon: IconInbox },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="Student">
      <DashboardShell roleLabel="Student" navItems={NAV_ITEMS}>
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
