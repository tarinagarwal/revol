import { cn } from "@/lib/cn";

type SkeletonProps = {
  /** Shape via className: h-4 w-32, size-12 rounded-full, etc. */
  className?: string;
};

/** Shimmering placeholder while content loads. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-lg bg-charcoal",
        "bg-[linear-gradient(100deg,transparent_30%,rgb(212_166_74/0.08)_50%,transparent_70%)] bg-[length:200%_100%]",
        "animate-[revol-shimmer_1.8s_linear_infinite]",
        className,
      )}
    />
  );
}
