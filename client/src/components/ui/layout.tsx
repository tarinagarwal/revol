import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BoxProps = { children?: ReactNode; className?: string };
type GapProps = BoxProps & { gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12 | 16 };

const gapClasses = { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 5: "gap-5", 6: "gap-6", 8: "gap-8", 12: "gap-12", 16: "gap-16" } as const;

/** Vertical flex column. */
export function Stack({ children, gap = 4, className }: GapProps) {
  return <div className={cn("flex flex-col", gapClasses[gap], className)}>{children}</div>;
}

/** Horizontal flex row, centered cross-axis. */
export function Row({ children, gap = 4, className }: GapProps) {
  return <div className={cn("flex flex-row items-center", gapClasses[gap], className)}>{children}</div>;
}

/** Responsive grid — pass cols via className (e.g. grid-cols-2 md:grid-cols-3). */
export function Grid({ children, gap = 4, className }: GapProps) {
  return <div className={cn("grid", gapClasses[gap], className)}>{children}</div>;
}

/** Flexible empty space. */
export function Spacer({ className }: BoxProps) {
  return <div className={cn("flex-1", className)} aria-hidden />;
}

/** Thin charcoal rule; gold variant for premium sections. */
export function Divider({ tone = "charcoal", className }: { tone?: "charcoal" | "gold"; className?: string }) {
  return <hr className={cn("h-px w-full border-0", tone === "gold" ? "bg-gold/30" : "bg-charcoal", className)} aria-hidden />;
}

/** Pads content inside device safe areas (Capacitor notches). */
export function SafeArea({ children, className }: BoxProps) {
  return (
    <div
      className={cn(
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
