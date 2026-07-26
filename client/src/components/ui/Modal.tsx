import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Heading } from "./Heading";
import { IconButton } from "./IconButton";
import { CloseIcon } from "@/components/icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Block closing via backdrop/ESC (destructive confirmations). */
  locked?: boolean;
  className?: string;
};

/** Centered dialog — portal, blurred backdrop, ESC + backdrop close. */
export function Modal({ open, onClose, title, children, locked = false, className }: ModalProps) {
  useEffect(() => {
    if (!open || locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, locked, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-[revol-fade-in_0.3s_var(--ease-elegant)]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={locked ? undefined : onClose} aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-charcoal bg-rich-black p-6",
          "animate-[revol-blur-reveal_0.5s_var(--ease-reveal)]",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <Heading level={4}>{title}</Heading>}
          {!locked && (
            <IconButton label="Close" onPress={onClose} className="-mr-2">
              <CloseIcon size={18} />
            </IconButton>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
