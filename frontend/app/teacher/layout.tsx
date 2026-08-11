"use client";

import type { ReactNode } from "react";
import { RequireRole } from "../../lib/auth-context";
import DashboardShell, { type NavItem } from "../../components/DashboardShell";
import { IconDashboard, IconFileText, IconInbox } from "../../components/icons";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/teacher", icon: IconDashboard },
  { label: "My Assignments", href: "/teacher/assignments", icon: IconFileText },
  { label: "Submissions", href: "/teacher/submissions", icon: IconInbox },
];

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="Teacher">
      <DashboardShell roleLabel="Teacher" navItems={NAV_ITEMS}>
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
