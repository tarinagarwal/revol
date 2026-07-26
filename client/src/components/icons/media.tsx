import { IconBase, type IconProps } from "./Icon";

export function CameraIcon(p: IconProps) {
  return (
    <IconBase label="Camera" {...p}>
      <path d="M4 8.5A1.5 1.5 0 015.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0120 8.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5v-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}

export function MicIcon(p: IconProps) {
  return (
    <IconBase label="Voice" {...p}>
      <rect x="9.2" y="3.5" width="5.6" height="10" rx="2.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 11.5a6 6 0 0012 0M12 17.5V21M9 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <IconBase label="Play" {...p}>
      <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
    </IconBase>
  );
}

export function PauseIcon(p: IconProps) {
  return (
    <IconBase label="Pause" {...p}>
      <rect x="7" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1" fill="currentColor" />
    </IconBase>
  );
}

export function ImageIcon(p: IconProps) {
  return (
    <IconBase label="Image" {...p}>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 17.5l4.5-4 3 2.5 3.5-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function InfinityIcon(p: IconProps) {
  return (
    <IconBase label="Infinite" {...p}>
      <path
        d="M8 15.5c-2.2 0-4-1.6-4-3.5s1.8-3.5 4-3.5c3.5 0 4.5 7 8 7 2.2 0 4-1.6 4-3.5S18.2 8.5 16 8.5c-3.5 0-4.5 7-8 7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
