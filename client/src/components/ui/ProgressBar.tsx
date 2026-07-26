import { cn } from "@/lib/cn";

type ProgressBarProps = {
  /** 0–100 */
  value: number;
  tone?: "crimson" | "gold";
  label?: string;
  className?: string;
};

/** Progress track — onboarding steps, chemistry score, upload progress. */
export function ProgressBar({ value, tone = "gold", label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label && (
        <div className="flex justify-between font-body text-xs tracking-elegant uppercase text-ivory-dim">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-slow ease-elegant",
            tone === "gold" ? "bg-gold" : "bg-crimson",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
