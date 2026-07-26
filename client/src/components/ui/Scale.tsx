import { cn } from "@/lib/cn";
import { Text } from "./Text";

type ScaleProps = {
  statement: string;
  low: string;
  high: string;
  value: number | null;
  onChange: (value: number) => void;
  className?: string;
};

/** 1–5 agreement scale — five glowing dots between two poles. */
export function Scale({ statement, low, high, value, onChange, className }: ScaleProps) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-charcoal bg-rich-black p-5", className)}>
      <Text variant="body" className="font-display italic">
        {statement}
      </Text>
      <div className="flex items-center gap-3">
        <Text variant="caption" tone="dim" className="w-20 shrink-0 text-right text-[11px]">
          {low}
        </Text>
        <div role="radiogroup" aria-label={statement} className="flex flex-1 items-center justify-between px-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = value === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${n} of 5`}
                onClick={() => onChange(n)}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-full outline-none",
                  "transition-all duration-base ease-elegant focus-visible:ring-2 focus-visible:ring-gold/70",
                )}
              >
                <span
                  className={cn(
                    "rounded-full transition-all duration-slow ease-elegant",
                    active
                      ? "size-5 bg-crimson shadow-glow-crimson"
                      : "size-3 bg-charcoal hover:bg-ivory-dim/40",
                  )}
                />
              </button>
            );
          })}
        </div>
        <Text variant="caption" tone="dim" className="w-20 shrink-0 text-[11px]">
          {high}
        </Text>
      </div>
    </div>
  );
}
