import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
};

/** Side panel — nav on mobile, filters/detail on desktop. */
export function Drawer({ open, onClose, side = "right", children, className }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-100" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[revol-fade-in_0.3s_var(--ease-elegant)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "absolute top-0 bottom-0 flex w-80 max-w-[85vw] flex-col border-charcoal bg-rich-black p-6",
          "pt-[max(1.5rem,env(safe-area-inset-top))]",
          side === "right"
            ? "right-0 border-l animate-[revol-drawer-left_0.45s_var(--ease-reveal)]"
            : "left-0 border-r animate-[revol-drawer-right_0.45s_var(--ease-reveal)]",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
