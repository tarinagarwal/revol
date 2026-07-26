import { useRef } from "react";
import { cn } from "@/lib/cn";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Fires once all digits are filled. */
  onComplete?: (value: string) => void;
  error?: boolean;
  className?: string;
};

/** Segmented OTP field — 6 gold-lit cells, paste-aware, keyboard-first. */
export function OtpInput({ length = 6, value, onChange, onComplete, error = false, className }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const handleChange = (idx: number, char: string) => {
    const digits = value.split("");
    digits[idx] = char.replace(/\D/g, "").slice(-1);
    const next = digits.join("").slice(0, length);
    commit(next);
    if (char && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    commit(e.clipboardData.getData("text"));
    refs.current[Math.min(length - 1, e.clipboardData.getData("text").replace(/\D/g, "").length)]?.focus();
  };

  return (
    <div className={cn("flex justify-between gap-2", className)} onPaste={handlePaste}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            "size-12 rounded-xl border bg-rich-black text-center font-body text-xl text-gold outline-none",
            "transition-colors duration-base ease-elegant",
            error ? "border-crimson" : "border-charcoal focus:border-gold",
          )}
        />
      ))}
    </div>
  );
}
