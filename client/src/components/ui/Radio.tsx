import { useId } from "react";
import { cn } from "@/lib/cn";

export type RadioOption = { value: string; label: string; description?: string };

type RadioGroupProps = {
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

/** Custom radio group — gold dot, card-style options. */
export function RadioGroup({ options, value, onChange, label, disabled = false, className }: RadioGroupProps) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex w-full flex-col gap-2", className)}>
      {label && <span className="font-body text-xs tracking-elegant uppercase text-ivory-dim">{label}</span>}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-base ease-elegant",
              active ? "border-gold bg-charcoal/50" : "border-charcoal bg-rich-black hover:border-ivory-dim/40",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-base",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-gold/70",
                active ? "border-gold" : "border-charcoal",
              )}
            >
              <span className={cn("size-2.5 rounded-full bg-gold transition-all duration-base", active ? "scale-100" : "scale-0")} />
            </span>
            <span className="flex flex-col">
              <span className="font-body text-sm text-ivory">{opt.label}</span>
              {opt.description && <span className="font-body text-xs text-ivory-dim">{opt.description}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
