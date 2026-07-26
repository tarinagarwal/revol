import { IconBase, type IconProps } from "./Icon";

export function UsersIcon(p: IconProps) {
  return (
    <IconBase label="Community" {...p}>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 19c.9-2.7 3-4.3 5.5-4.3s4.6 1.6 5.5 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 5.4a3.2 3.2 0 010 5.2M17.5 14.9c1.6.6 2.8 1.9 3.4 3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <IconBase label="Event" {...p}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}
