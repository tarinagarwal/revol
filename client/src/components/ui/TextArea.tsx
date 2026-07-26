import type { ChangeEvent, FocusEvent, Ref } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { Text } from "./Text";

type TextAreaProps = {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  rows?: number;
  disabled?: boolean;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLTextAreaElement>) => void;
  ref?: Ref<HTMLTextAreaElement>;
  className?: string;
};

/** Multiline input — same field language as Input. */
export function TextArea({ label, hint, error, rows = 4, className, ref, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="font-body text-xs tracking-elegant uppercase text-ivory-dim">
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        className={cn(
          "w-full resize-y rounded-xl border bg-rich-black px-4 py-3 font-body text-base text-ivory outline-none",
          "transition-colors duration-base ease-elegant placeholder:text-ivory-dim/50",
          error ? "border-crimson" : "border-charcoal focus:border-gold",
        )}
        {...rest}
      />
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
