import type { ReactNode } from "react";

export type IconProps = {
  size?: number;
  className?: string;
};

type IconBaseProps = IconProps & {
  children: ReactNode;
  viewBox?: string;
  label: string;
};

/**
 * Base for every custom SVG icon. No emoji, no icon fonts, no third-party sets —
 * each icon is hand-drawn SVG registered in this folder.
 */
export function IconBase({ children, size = 24, viewBox = "0 0 24 24", label, className = "" }: IconBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={className}
    >
      {children}
    </svg>
  );
}
