import type { ReactNode } from "react";

type TextVariant = "display" | "heading" | "body" | "caption" | "label";

type TextProps = {
  children: ReactNode;
  variant?: TextVariant;
  /** Gold accent for premium moments, crimson for emotional emphasis. */
  tone?: "ivory" | "dim" | "gold" | "crimson";
  className?: string;
};

const variantClasses: Record<TextVariant, string> = {
  display: "font-display text-4xl tracking-cinematic uppercase",
  heading: "font-display text-2xl tracking-elegant",
  body: "font-body text-base",
  caption: "font-body text-sm",
  label: "font-body text-xs tracking-elegant uppercase",
};

const toneClasses = {
  ivory: "text-ivory",
  dim: "text-ivory-dim",
  gold: "text-gold",
  crimson: "text-crimson",
} as const;

/** Sole primitive for rendering text. Feature code never uses raw tags. */
export function Text({ children, variant = "body", tone = "ivory", className = "" }: TextProps) {
  return (
    <span className={[variantClasses[variant], toneClasses[tone], className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
