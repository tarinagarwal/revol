import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

/** Bottom sheet — mobile-first surface for actions/reports/filters. */
export function Sheet({ open, onClose, children, className }: SheetProps) {
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
    <div className="fixed inset-0 z-100 flex items-end justify-center" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[revol-fade-in_0.3s_var(--ease-elegant)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-t-3xl border border-b-0 border-charcoal bg-rich-black p-6",
          "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          "animate-[revol-sheet-up_0.45s_var(--ease-reveal)]",
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-charcoal" aria-hidden />
        {children}
      </div>
    </div>,
    document.body,
  );
}
