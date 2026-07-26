import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heading, Text } from "@/components/ui";
import { InfinityHeartIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const lines = [
  "Attraction starts before appearance.",
  "Chemistry before clarity.",
  "Mystery makes connection meaningful.",
  "Beyond the swipe.",
];

/**
 * Split-screen auth shell.
 * Left (md+): cinematic brand panel — layered glows, floating mark,
 * rotating taglines. Right: the form column, atmospheric on mobile too.
 */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLineIdx((i) => (i + 1) % lines.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-svh bg-black text-ivory">
      {/* Brand panel */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-r border-charcoal md:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_35%_40%,rgb(255_0_46/0.16),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_75%_75%,rgb(212_166_74/0.1),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-1/4 size-96 rounded-full bg-crimson/5 blur-3xl animate-[revol-float_7s_ease-in-out_infinite]"
        />
        <div className="relative z-10 flex max-w-md flex-col items-center gap-10 px-10 text-center">
          <InfinityHeartIcon size={80} className="text-crimson animate-[revol-float_5s_ease-in-out_infinite]" />
          <Text variant="display" tone="gold">
            revol
          </Text>
          <div className="relative h-16 w-full">
            {lines.map((line, i) => (
              <span
                key={line}
                className={cn(
                  "absolute inset-0 flex items-start justify-center font-display text-2xl italic leading-snug text-ivory transition-all duration-[900ms] ease-reveal",
                  i === lineIdx ? "opacity-100 blur-0 translate-y-0" : "opacity-0 blur-sm translate-y-2",
                )}
              >
                {line}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2" aria-hidden>
            {lines.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-slow ease-elegant",
                  i === lineIdx ? "w-6 bg-gold" : "w-1.5 bg-charcoal",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Mobile atmosphere */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgb(255_0_46/0.08),transparent_70%)] md:hidden"
        />
        <div className="relative z-10 flex items-center justify-between px-8 pt-[max(2rem,env(safe-area-inset-top))]">
          <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Revol home">
            <InfinityHeartIcon size={26} className="text-crimson md:hidden" />
            <span className="font-display text-base tracking-cinematic uppercase text-gold md:hidden">revol</span>
          </Link>
          <Link
            to="/"
            className="font-body text-xs tracking-elegant uppercase text-ivory-dim no-underline transition-colors duration-base hover:text-ivory"
          >
            Back to site
          </Link>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm animate-[revol-blur-reveal_0.7s_var(--ease-reveal)]">
            <div className="mb-8 flex flex-col gap-2">
              <Heading level={2}>{title}</Heading>
              <Text variant="caption" tone="dim">
                {subtitle}
              </Text>
            </div>
            {children}
          </div>
        </div>

        <div className="relative z-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
          <Text variant="caption" tone="dim" className="font-display italic">
            Built for deeper connection.
          </Text>
        </div>
      </div>
    </div>
  );
}
