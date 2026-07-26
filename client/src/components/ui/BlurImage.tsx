import { useState } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

type BlurImageProps = {
  src: string;
  alt: string;
  /** 0 = fully revealed, 1..3 = increasing mystery. THE core reveal mechanic. */
  blurLevel?: 0 | 1 | 2 | 3;
  aspect?: "square" | "portrait" | "wide";
  className?: string;
};

const blurClasses = { 0: "blur-0 scale-100", 1: "blur-sm scale-105", 2: "blur-lg scale-110", 3: "blur-2xl scale-125" } as const;
const aspectClasses = { square: "aspect-square", portrait: "aspect-[3/4]", wide: "aspect-video" } as const;

/**
 * Progressive-reveal image — Revol's signature mechanic.
 * Server owns the reveal state; UI just renders the level with a slow
 * elegant transition between levels.
 */
export function BlurImage({ src, alt, blurLevel = 3, aspect = "portrait", className }: BlurImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-charcoal", aspectClasses[aspect], className)}>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <img
        src={src}
        alt={blurLevel > 0 ? "Hidden profile" : alt}
        onLoad={() => setLoaded(true)}
        className={cn(
          "size-full object-cover transition-all ease-reveal",
          "duration-[1200ms]",
          blurClasses[blurLevel],
          !loaded && "opacity-0",
        )}
      />
      {blurLevel > 0 && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" aria-hidden />
      )}
    </div>
  );
}
