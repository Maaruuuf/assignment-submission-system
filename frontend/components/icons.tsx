// Minimal hand-rolled stroke icons (20x20, currentColor) so the UI needs no icon-library
// dependency beyond what create-next-app already installs.

type IconProps = { className?: string };

const base = "stroke-current fill-none";

export function IconDashboard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="2.5" width="6.5" height="4" rx="1.2" />
      <rect x="11" y="8.5" width="6.5" height="9" rx="1.2" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <circle cx="7" cy="6.5" r="2.5" />
      <path d="M2.5 17c0-3 2-5 4.5-5s4.5 2 4.5 5" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="2" />
      <path d="M12.8 12.3c2-.2 3.7 1.6 3.7 4.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconBook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <path d="M3 4c1.5-1 3.5-1.3 6.5-.4v12c-3-1-5-.6-6.5.4Z" strokeLinejoin="round" />
      <path d="M16.5 4c-1.5-1-3.5-1.3-6.5-.4v12c3-1 5-.6 6.5.4Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFileText({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <path d="M5 2.5h6.5L15 6v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M7 10h6M7 13h6M7 7h3" strokeLinecap="round" />
    </svg>
  );
}

export function IconInbox({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <path d="M2.5 11 5 4.5h10L17.5 11" strokeLinejoin="round" />
      <path
        d="M2.5 11v4a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4h-4.2a2.3 2.3 0 0 1-4.6 0H2.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLayers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <path d="m10 2.5 7.5 4L10 10.5 2.5 6.5Z" strokeLinejoin="round" />
      <path d="m2.5 10 7.5 4 7.5-4M2.5 13.5 10 17.5l7.5-4" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <path d="M7.5 17.5h-3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 14l4.5-4.5L13 5M17 9.5H7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <circle cx="10" cy="10" r="2.5" />
      <path
        d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.1 4.9l-1.3 1.3M6.2 13.8l-1.3 1.3M15.1 15.1l-1.3-1.3M6.2 6.2 4.9 4.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTable({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" className={`${base} ${className ?? ""}`} strokeWidth="1.6">
      <rect x="2.5" y="3.5" width="15" height="13" rx="1.2" />
      <path d="M2.5 8h15M7.5 8v8.5" strokeLinecap="round" />
    </svg>
  );
}
