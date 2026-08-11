export default function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" className={`animate-spin ${className ?? ""}`} fill="none">
      <circle cx="12" cy="12" r="9" strokeWidth="3" className="stroke-current opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeWidth="3" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}
