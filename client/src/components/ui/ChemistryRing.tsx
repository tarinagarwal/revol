import { cn } from "@/lib/cn";

type ChemistryRingProps = {
  /** 0–100 */
  score: number;
  size?: number;
  className?: string;
};

/** The chemistry score — a slow-lit gold arc around a crimson number. */
export function ChemistryRing({ score, size = 96, className }: ChemistryRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Chemistry ${Math.round(clamped)} percent`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-charcoal)" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="transition-[stroke-dashoffset] duration-[1400ms] ease-reveal"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl text-crimson">{Math.round(clamped)}</span>
        <span className="font-body text-[9px] tracking-elegant uppercase text-ivory-dim">chemistry</span>
      </div>
    </div>
  );
}
