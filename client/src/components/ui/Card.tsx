import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  children: ReactNode;
  /** gold = premium framing, glow = emotional emphasis. */
  variant?: "default" | "gold" | "glow";
  padded?: boolean;
  onPress?: () => void;
  className?: string;
};

const variantClasses = {
  default: "border-charcoal bg-rich-black",
  gold: "border-gold/40 bg-rich-black shadow-glow-gold",
  glow: "border-crimson/30 bg-rich-black shadow-glow-crimson",
} as const;

/** Surface container. Interactive when onPress given. */
export function Card({ children, variant = "default", padded = true, onPress, className }: CardProps) {
  const classes = cn(
    "rounded-2xl border transition-all duration-slow ease-elegant",
    variantClasses[variant],
    padded && "p-6",
    onPress && "cursor-pointer text-left w-full hover:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/70 outline-none",
    className,
  );
  if (onPress) {
    return (
      <button type="button" onClick={onPress} className={classes}>
        {children}
      </button>
    );
  }
  return <div className={classes}>{children}</div>;
}
