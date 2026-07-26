import type { ChangeEvent, FocusEvent, ReactNode, Ref } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { Text } from "./Text";

type InputProps = {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "tel";
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  autoComplete?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  /** React 19 ref-as-prop — RHF register spreads straight in. */
  ref?: Ref<HTMLInputElement>;
  className?: string;
};

/** Sole text input primitive. Dark glass field, gold focus, crimson error. */
export function Input({ label, hint, error, leading, trailing, className, ref, ...rest }: InputProps) {
  const id = useId();
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="font-body text-xs tracking-elegant uppercase text-ivory-dim">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-rich-black px-4",
          "transition-colors duration-base ease-elegant",
          error ? "border-crimson" : "border-charcoal focus-within:border-gold",
        )}
      >
        {leading && <span className="flex shrink-0 items-center text-ivory-dim">{leading}</span>}
        <input
          id={id}
          ref={ref}
          className="w-full border-none bg-transparent py-3 font-body text-base text-ivory outline-none placeholder:text-ivory-dim/50"
          {...rest}
        />
        {trailing && <span className="flex shrink-0 items-center text-ivory-dim">{trailing}</span>}
      </div>
      {error ? (
        <Text variant="caption" tone="crimson">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="dim">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}
