import { create } from "zustand";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { CheckIcon, CloseIcon, SparkIcon } from "@/components/icons";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastState = {
  toasts: ToastItem[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = "info") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper — `toast("Saved", "success")` from anywhere. */
export function toast(message: string, tone: ToastTone = "info"): void {
  useToastStore.getState().push(message, tone);
}

const toneStyles: Record<ToastTone, { border: string; icon: typeof CheckIcon }> = {
  success: { border: "border-gold/50", icon: CheckIcon },
  error: { border: "border-crimson/60", icon: CloseIcon },
  info: { border: "border-charcoal", icon: SparkIcon },
};

/** Mount once in App — renders the toast stack bottom-center. */
export function ToastHost() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;
  return createPortal(
    <div className="fixed bottom-6 left-1/2 z-110 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => {
        const ToneIcon = toneStyles[t.tone].icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border bg-rich-black/95 px-4 py-3 text-left backdrop-blur",
              "animate-[revol-toast-in_0.35s_var(--ease-reveal)]",
              toneStyles[t.tone].border,
            )}
          >
            <ToneIcon size={16} className={t.tone === "error" ? "text-crimson" : "text-gold"} />
            <span className="font-body text-sm text-ivory">{t.message}</span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
