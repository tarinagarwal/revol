import { cn } from "@/lib/cn";

type SpinnerProps = {
  size?: number;
  tone?: "ivory" | "gold" | "crimson" | "black";
  className?: string;
};

const toneClasses = {
  ivory: "text-ivory",
  gold: "text-gold",
  crimson: "text-crimson",
  black: "text-black",
} as const;

/** Rotating arc loader. */
export function Spinner({ size = 24, tone = "gold", className }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", toneClasses[tone], className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
