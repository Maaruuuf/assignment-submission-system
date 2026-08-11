"use client";

import type { ReactNode } from "react";
import { RequireRole } from "../../lib/auth-context";
import DashboardShell, { type NavItem } from "../../components/DashboardShell";
import { IconBook, IconDashboard, IconFileText, IconLayers, IconSettings, IconTable, IconUsers } from "../../components/icons";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: IconDashboard },
  { label: "Users", href: "/admin/users", icon: IconUsers },
  { label: "Classes", href: "/admin/classes", icon: IconLayers },
  { label: "Subjects", href: "/admin/subjects", icon: IconBook },
  { label: "Assignments", href: "/admin/assignments", icon: IconFileText },
  { label: "Rosters", href: "/admin/rosters", icon: IconTable },
  { label: "Settings", href: "/admin/settings", icon: IconSettings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="Admin">
      <DashboardShell roleLabel="Admin" navItems={NAV_ITEMS}>
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
