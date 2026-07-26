import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Text } from "./Text";
import { ChevronDownIcon, CheckIcon } from "@/components/icons";

export type SelectOption = { value: string; label: string };

type SelectProps = {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

/** Fully custom listbox — no native select, keyboard accessible. */
export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = "Select",
  error,
  disabled = false,
  className,
}: SelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  // On open: jump the list to the current selection; keep the active row
  // in view while arrowing through long lists (years, cities...).
  useLayoutEffect(() => {
    if (!open) return;
    const idx = Math.max(
      options.findIndex((o) => o.value === value),
      0,
    );
    setActive(idx);
    listRef.current?.children[idx]?.scrollIntoView({ block: "center" });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const commit = (idx: number) => {
    const opt = options[idx];
    if (opt) {
      onChange?.(opt.value);
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative flex w-full flex-col gap-1.5", className)}>
      {label && (
        <span id={id} className="font-body text-xs tracking-elegant uppercase text-ivory-dim">
          {label}
        </span>
      )}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-labelledby={label ? id : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            commit(active);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-rich-black px-4 py-3",
          "font-body text-base transition-colors duration-base ease-elegant outline-none",
          "focus-visible:border-gold disabled:cursor-not-allowed disabled:opacity-40",
          error ? "border-crimson" : "border-charcoal",
          selected ? "text-ivory" : "text-ivory-dim/50",
        )}
      >
        {selected?.label ?? placeholder}
        <ChevronDownIcon
          size={16}
          className={cn("shrink-0 text-ivory-dim transition-transform duration-base ease-elegant", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute top-full z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-charcoal bg-rich-black shadow-glow-gold animate-[revol-fade-in_0.25s_var(--ease-elegant)]"
        >
          {options.map((opt, idx) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => commit(idx)}
              onMouseEnter={() => setActive(idx)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left font-body text-sm",
                "transition-colors duration-base",
                idx === active ? "bg-charcoal text-gold" : "text-ivory",
              )}
            >
              {opt.label}
              {opt.value === value && <CheckIcon size={16} className="text-gold" />}
            </button>
          ))}
        </div>
      )}
      {error && (
        <Text variant="caption" tone="crimson">
          {error}
        </Text>
      )}
    </div>
  );
}
