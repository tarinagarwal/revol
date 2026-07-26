import { IconBase, type IconProps } from "./Icon";

/** Brand mark icon (placeholder geometry — refined with the real logo). */
export function InfinityHeartIcon({ size, className }: IconProps) {
  return (
    <IconBase size={size ?? 24} label="Revol" className={className ?? ""}>
      <path
        d="M12 7c1.5-3 6-3 6.75 0 .56 2.25-1.5 3.75-3.375 3-1.5-.6-2.25-1.875-3.375-3z"
        fill="currentColor"
      />
      <path
        d="M12 7c-1.5-3-6-3-6.75 0-.56 2.25 1.5 3.75 3.375 3 1.5-.6 2.25-1.875 3.375-3z"
        fill="currentColor"
      />
      <path d="M12 10l4.5 3L12 19l-4.5-6 4.5-3z" fill="currentColor" opacity="0.7" />
    </IconBase>
  );
}
