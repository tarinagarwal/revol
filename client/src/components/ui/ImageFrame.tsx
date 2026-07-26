import { useState } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

type ImageFrameProps = {
  src: string;
  alt: string;
  aspect?: "square" | "portrait" | "wide";
  /** gold = premium framing. */
  frame?: "none" | "gold";
  className?: string;
};

const aspectClasses = { square: "aspect-square", portrait: "aspect-[3/4]", wide: "aspect-video" } as const;

/** Plain image surface — rounded, skeleton while loading. */
export function ImageFrame({ src, alt, aspect = "square", frame = "none", className }: ImageFrameProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-charcoal",
        aspectClasses[aspect],
        frame === "gold" && "border border-gold/40",
        className,
      )}
    >
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn("size-full object-cover transition-opacity duration-slow ease-elegant", !loaded && "opacity-0")}
      />
    </div>
  );
}
