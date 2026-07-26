import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type IconButtonProps = {
  children: ReactNode;
  /** Accessible name — required, icons alone say nothing. */
  label: string;
  onPress?: () => void;
  variant?: "solid" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
};

const variantClasses = {
  solid: "bg-charcoal text-ivory hover:bg-rich-black hover:text-gold",
  ghost: "bg-transparent text-ivory-dim hover:text-ivory hover:bg-charcoal/60",
  outline: "bg-transparent text-ivory border border-charcoal hover:border-gold hover:text-gold",
} as const;

const sizeClasses = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

/** Circular icon-only button. */
export function IconButton({
  children,
  label,
  onPress,
  variant = "ghost",
  size = "md",
  disabled = false,
  className,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onPress}
      disabled={disabled}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full",
        "transition-all duration-base ease-elegant outline-none",
        "focus-visible:ring-2 focus-visible:ring-gold/70",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </button>
  );
}
