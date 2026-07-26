import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Text } from "./Text";
import { Heading } from "./Heading";

type PageProps = {
  children: ReactNode;
  /** narrow = focused flows (settings) · wide = content screens · full = grids */
  width?: "narrow" | "wide" | "full";
  className?: string;
};

const widths = {
  narrow: "max-w-2xl",
  wide: "max-w-5xl",
  full: "max-w-7xl",
} as const;

/**
 * Single source of truth for in-app page framing — consistent responsive
 * gutters and max widths across web, EXE and APK. Screens never hand-roll
 * container widths again.
 */
export function Page({ children, width = "wide", className }: PageProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8", widths[width], className)}>{children}</div>
  );
}

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

/** Consistent screen heading — eyebrow, title, optional actions on the right. */
export function PageHeader({ eyebrow, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow && (
          <Text variant="label" tone="gold">
            {eyebrow}
          </Text>
        )}
        <Heading level={2}>{title}</Heading>
        {subtitle && (
          <Text variant="caption" tone="dim">
            {subtitle}
          </Text>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
