import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "gold" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Submit inside <Form>. */
  type?: "button" | "submit";
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-crimson text-ivory hover:bg-crimson-soft active:bg-crimson-deep hover:shadow-glow-crimson",
  gold: "bg-gold text-black hover:bg-gold-soft active:bg-gold-deep hover:shadow-glow-gold",
  ghost: "bg-transparent text-ivory hover:bg-charcoal/60",
  outline: "bg-transparent text-ivory border border-charcoal hover:border-gold hover:text-gold",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-5 py-2 text-xs",
  md: "px-8 py-3 text-sm",
  lg: "px-10 py-4 text-base",
};

/** Sole button primitive. Slow, elegant transitions per motion identity. */
export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onPress}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-body tracking-elegant uppercase",
        "transition-all duration-slow ease-elegant outline-none",
        "focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading && <Spinner size={16} tone={variant === "gold" ? "black" : "ivory"} />}
      {children}
    </button>
  );
}
