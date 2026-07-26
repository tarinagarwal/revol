import { useState } from "react";
import { cn } from "@/lib/cn";

type AvatarProps = {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** gold ring = premium, glow = active match. */
  ring?: "none" | "gold" | "glow";
  /** Mystery mechanic — blur until revealed. */
  blurred?: boolean;
  className?: string;
};

const sizeClasses = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg", xl: "size-24 text-2xl" } as const;
const ringClasses = {
  none: "",
  gold: "ring-2 ring-gold ring-offset-2 ring-offset-black",
  glow: "ring-2 ring-crimson ring-offset-2 ring-offset-black shadow-glow-crimson",
} as const;

/** Identity mark — image with initials fallback, blur-capable. */
export function Avatar({ src, name, size = "md", ring = "none", blurred = false, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-charcoal",
        sizeClasses[size],
        ringClasses[ring],
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className={cn(
            "size-full object-cover transition-all ease-reveal duration-reveal",
            blurred && "blur-md scale-110",
          )}
        />
      ) : (
        <span className="font-display text-gold">{initials}</span>
      )}
    </span>
  );
}
