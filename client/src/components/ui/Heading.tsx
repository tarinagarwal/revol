import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeadingLevel = 1 | 2 | 3 | 4;

type HeadingProps = {
  children: ReactNode;
  level?: HeadingLevel;
  tone?: "ivory" | "gold" | "crimson";
  className?: string;
};

const levelClasses: Record<HeadingLevel, string> = {
  1: "font-display text-5xl md:text-6xl leading-tight",
  2: "font-display text-3xl md:text-4xl leading-snug",
  3: "font-display text-2xl leading-snug",
  4: "font-display text-xl leading-snug",
};

const toneClasses = {
  ivory: "text-ivory",
  gold: "text-gold",
  crimson: "text-crimson",
} as const;

/** Semantic display headings — cinematic serif, correct h-level for a11y/SEO. */
export function Heading({ children, level = 2, tone = "ivory", className }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cn(levelClasses[level], toneClasses[tone], "m-0 font-medium", className)}>{children}</Tag>;
}
