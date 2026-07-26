import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Heading } from "./Heading";
import { Text } from "./Text";
import { InfinityIcon, CloseIcon } from "@/components/icons";

type StateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Empty state — calm, atmospheric, never loud. */
export function EmptyState({ title, description, icon, action, className }: StateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 py-16 text-center", className)}>
      <span className="text-ivory-dim/60">{icon ?? <InfinityIcon size={40} />}</span>
      <Heading level={4} tone="ivory">
        {title}
      </Heading>
      {description && (
        <Text variant="caption" tone="dim" className="max-w-xs">
          {description}
        </Text>
      )}
      {action}
    </div>
  );
}

/** Error state — crimson accent, recovery action slot. */
export function ErrorState({ title, description, icon, action, className }: StateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 py-16 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full border border-crimson/40 text-crimson">
        {icon ?? <CloseIcon size={22} />}
      </span>
      <Heading level={4} tone="ivory">
        {title}
      </Heading>
      {description && (
        <Text variant="caption" tone="dim" className="max-w-xs">
          {description}
        </Text>
      )}
      {action}
    </div>
  );
}
