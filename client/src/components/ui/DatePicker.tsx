import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Select } from "./Select";
import { Text } from "./Text";

type DatePickerProps = {
  label?: string;
  /** ISO date (YYYY-MM-DD) or "" when unset. Emitted only when complete. */
  value: string;
  onChange: (iso: string) => void;
  minYear?: number;
  maxYear?: number;
  hint?: string;
  error?: string;
  className?: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysIn(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

/** Fully custom date picker — three brand Selects, no native UI anywhere. */
export function DatePicker({
  label,
  value,
  onChange,
  minYear = 1940,
  maxYear = new Date().getFullYear(),
  hint,
  error,
  className,
}: DatePickerProps) {
  const initial = value ? value.split("-").map(Number) : [];
  const [year, setYear] = useState<number | null>(initial[0] ?? null);
  const [month, setMonth] = useState<number | null>(initial[1] ?? null);
  const [day, setDay] = useState<number | null>(initial[2] ?? null);

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(maxYear - i)),
    [minYear, maxYear],
  );
  const dayCount = year && month ? daysIn(year, month) : 31;

  const emit = (y: number | null, m: number | null, d: number | null) => {
    setYear(y);
    setMonth(m);
    let day2 = d;
    if (y && m && d) {
      day2 = Math.min(d, daysIn(y, m));
      onChange(`${y}-${String(m).padStart(2, "0")}-${String(day2).padStart(2, "0")}`);
    } else {
      onChange("");
    }
    setDay(day2);
  };

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label && <span className="font-body text-xs tracking-elegant uppercase text-ivory-dim">{label}</span>}
      <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
        <Select
          placeholder="Day"
          options={Array.from({ length: dayCount }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
          value={day ? String(day) : ""}
          onChange={(v) => emit(year, month, Number(v))}
        />
        <Select
          placeholder="Month"
          options={MONTHS.map((name, i) => ({ value: String(i + 1), label: name }))}
          value={month ? String(month) : ""}
          onChange={(v) => emit(year, Number(v), day)}
        />
        <Select
          placeholder="Year"
          options={years.map((yr) => ({ value: yr, label: yr }))}
          value={year ? String(year) : ""}
          onChange={(v) => emit(Number(v), month, day)}
        />
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
