import { cn } from "@/lib/cn";
import { CheckIcon } from "@/components/icons";

type ChipProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
};

/** Selectable pill — gold when chosen. */
export function Chip({ label, selected, onToggle, disabled = false, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 font-body text-sm",
        "transition-all duration-base ease-elegant outline-none",
        "focus-visible:ring-2 focus-visible:ring-gold/70",
        "disabled:cursor-not-allowed disabled:opacity-40",
        selected
          ? "border-gold bg-gold/15 text-gold"
          : "border-charcoal bg-rich-black text-ivory-dim hover:border-ivory-dim/50 hover:text-ivory",
        className,
      )}
    >
      {selected && <CheckIcon size={13} />}
      {label}
    </button>
  );
}

type ChipGroupProps = {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
  className?: string;
};

/** Multi-select chip cloud with a max cap. */
export function ChipGroup({ options, selected, onChange, max, className }: ChipGroupProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else if (!max || selected.length < max) {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => (
        <Chip
          key={opt}
          label={opt}
          selected={selected.includes(opt)}
          onToggle={() => toggle(opt)}
          disabled={!!max && !selected.includes(opt) && selected.length >= max}
        />
      ))}
    </div>
  );
}
