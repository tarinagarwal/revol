import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Heading } from "./Heading";
import { BackButton } from "./BackButton";

type AppHeaderProps = {
  title?: string;
  showBack?: boolean;
  right?: ReactNode;
  className?: string;
};

/** In-app screen header — back, title, action slot. */
export function AppHeader({ title, showBack = false, right, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-70 flex items-center gap-3 border-b border-charcoal bg-black/90 px-4 py-3 backdrop-blur",
        "pt-[max(0.75rem,env(safe-area-inset-top))]",
        className,
      )}
    >
      {showBack && <BackButton />}
      {title && (
        <Heading level={4} className="flex-1 truncate">
          {title}
        </Heading>
      )}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </header>
  );
}
