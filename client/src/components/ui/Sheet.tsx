import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Heading } from "./Heading";
import { IconButton } from "./IconButton";
import { CloseIcon } from "@/components/icons";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Adaptive surface: bottom sheet on mobile, centered dialog on desktop.
 * The frame is capped to the viewport and the BODY scrolls internally —
 * the header and close control never scroll away.
 */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock the page behind the sheet.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[revol-fade-in_0.3s_var(--ease-elegant)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative flex w-full flex-col overflow-hidden border border-charcoal bg-rich-black",
          // mobile: bottom sheet
          "max-h-[88svh] rounded-t-3xl border-b-0",
          // desktop: centered dialog
          "sm:max-h-[85svh] sm:max-w-lg sm:rounded-2xl sm:border-b",
          "animate-[revol-sheet-up_0.45s_var(--ease-reveal)] sm:animate-[revol-blur-reveal_0.4s_var(--ease-reveal)]",
          className,
        )}
      >
        {/* Header — pinned */}
        <div className="shrink-0 px-6 pt-5 sm:pt-6">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-charcoal sm:hidden" aria-hidden />
          {title && (
            <div className="mb-4 flex items-center justify-between gap-4">
              <Heading level={4}>{title}</Heading>
              <IconButton label="Close" onPress={onClose} className="-mr-2">
                <CloseIcon size={18} />
              </IconButton>
            </div>
          )}
        </div>

        {/* Body — the only scrolling region */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
