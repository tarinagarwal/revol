import { cn } from "@/lib/cn";
import { ShieldIcon } from "@/components/icons";
import { Tooltip } from "./Tooltip";

type VerifiedBadgeProps = {
  size?: number;
  /** Renders the word too, for profile headers. */
  withLabel?: boolean;
  className?: string;
};

/** Identity-verified mark (Epic 9). */
export function VerifiedBadge({ size = 14, withLabel = false, className }: VerifiedBadgeProps) {
  const mark = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-gold",
        className,
      )}
    >
      <ShieldIcon size={size} />
      {withLabel && <span className="font-body text-[10px] tracking-elegant uppercase">Verified</span>}
    </span>
  );
  return withLabel ? mark : <Tooltip content="Identity verified">{mark}</Tooltip>;
}
