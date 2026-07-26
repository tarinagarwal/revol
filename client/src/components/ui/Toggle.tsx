import { useId } from "react";
import { cn } from "@/lib/cn";

type ToggleProps = {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** Custom switch — crimson glow when on. */
export function Toggle({ label, checked, onChange, disabled = false, className }: ToggleProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer items-center gap-3 select-none",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 rounded-full border transition-all duration-slow ease-elegant",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-gold/70",
          checked ? "border-crimson bg-crimson/90 shadow-glow-crimson" : "border-charcoal bg-rich-black",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-ivory transition-transform duration-slow ease-elegant",
            checked && "translate-x-5",
          )}
        />
      </span>
      {label && <span className="font-body text-sm text-ivory">{label}</span>}
    </label>
  );
}
