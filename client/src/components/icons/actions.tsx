import { IconBase, type IconProps } from "./Icon";

export function CheckIcon(p: IconProps) {
  return (
    <IconBase label="Done" {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <IconBase label="Add" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function HeartIcon(p: IconProps) {
  return (
    <IconBase label="Like" {...p}>
      <path
        d="M12 20.5S4 14.9 4 9.6C4 6.6 6.4 4.5 9 4.5c1.3 0 2.4.7 3 1.6.6-.9 1.7-1.6 3-1.6 2.6 0 5 2.1 5 5.1 0 5.3-8 10.9-8 10.9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function SparkIcon(p: IconProps) {
  return (
    <IconBase label="Chemistry" {...p}>
      <path
        d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" fill="currentColor" />
    </IconBase>
  );
}

export function EyeIcon(p: IconProps) {
  return (
    <IconBase label="Show" {...p}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}

export function EyeOffIcon(p: IconProps) {
  return (
    <IconBase label="Hide" {...p}>
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.9 6.2A9.8 9.8 0 0112 5.8c6 0 9.5 6.2 9.5 6.2a17.6 17.6 0 01-3.2 3.8M6.6 8.4A17 17 0 002.5 12S6 18.2 12 18.2c1 0 2-.2 2.9-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <IconBase label="Private" {...p}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function ShieldIcon(p: IconProps) {
  return (
    <IconBase label="Safety" {...p}>
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 11.8l2.2 2.2L15.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function SettingsIcon(p: IconProps) {
  return (
    <IconBase label="Settings" {...p}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2.8l1.2 2.5 2.7-.6 1 2.5 2.7.7-.6 2.7 2 1.9-2 1.9.6 2.7-2.7.7-1 2.5-2.7-.6L12 21.2l-1.2-2.5-2.7.6-1-2.5-2.7-.7.6-2.7-2-1.9 2-1.9-.6-2.7 2.7-.7 1-2.5 2.7.6L12 2.8z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function BellIcon(p: IconProps) {
  return (
    <IconBase label="Notifications" {...p}>
      <path d="M6 16v-5a6 6 0 1112 0v5l1.5 2.5H4.5L6 16z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 21h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <IconBase label="Profile" {...p}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 20c1.2-3.2 4-5 7.5-5s6.3 1.8 7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function ChatIcon(p: IconProps) {
  return (
    <IconBase label="Messages" {...p}>
      <path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v8a2.5 2.5 0 01-2.5 2.5H9l-5 4V6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </IconBase>
  );
}
