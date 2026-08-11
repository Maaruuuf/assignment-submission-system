import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "primary" | "amber" | "brick";
}

const TONE_STYLES = {
  primary: "text-primary",
  amber: "text-amber",
  brick: "text-brick",
};

/// A single tally figure in the "gradebook" style: a big mono number, a plain-language label,
/// and an optional one-line hint underneath.
export default function StatCard({ label, value, hint, icon, tone = "primary" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-ink-muted">{label}</span>
        {icon ? <span className={TONE_STYLES[tone]}>{icon}</span> : null}
      </div>
      <div className={`mt-2 font-mono text-3xl font-semibold ${TONE_STYLES[tone]}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-muted">{hint}</div> : null}
    </div>
  );
}
