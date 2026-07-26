import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

/** Hover/focus hint — pure CSS reveal, no positioning lib. */
export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-90 -translate-x-1/2 whitespace-nowrap rounded-lg border border-charcoal bg-rich-black px-3 py-1.5",
          "font-body text-xs text-ivory opacity-0 transition-opacity duration-base ease-elegant",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {content}
      </span>
    </span>
  );
}
