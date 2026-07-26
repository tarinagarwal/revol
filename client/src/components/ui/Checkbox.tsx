import { useId } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon } from "@/components/icons";

type CheckboxProps = {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** Custom checkbox — hidden native input for a11y, gold check on charcoal. */
export function Checkbox({ label, checked, onChange, disabled = false, className }: CheckboxProps) {
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
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex size-5 items-center justify-center rounded-md border transition-all duration-base ease-elegant",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-gold/70",
          checked ? "border-gold bg-gold text-black" : "border-charcoal bg-rich-black text-transparent",
        )}
      >
        <CheckIcon size={13} />
      </span>
      {label && <span className="font-body text-sm text-ivory">{label}</span>}
    </label>
  );
}
