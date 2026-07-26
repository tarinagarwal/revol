import { IconBase, type IconProps } from "./Icon";

export function WindowsIcon(p: IconProps) {
  return (
    <IconBase label="Windows" {...p}>
      <path d="M4 5.5l7-1v7H4v-6zM12.5 4.3L20 3.2v8.3h-7.5V4.3zM4 12.5h7v7l-7-1v-6zM12.5 12.5H20v8.3l-7.5-1.1v-7.2z" fill="currentColor" />
    </IconBase>
  );
}

export function AndroidIcon(p: IconProps) {
  return (
    <IconBase label="Android" {...p}>
      <path
        d="M7 9.5h10v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.5 8.5a4.5 4.5 0 019 0h-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 3.5l1 1.8M14.5 3.5l-1 1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="7" r="0.6" fill="currentColor" />
      <circle cx="14" cy="7" r="0.6" fill="currentColor" />
      <path d="M5 10v4M19 10v4M10 18.5V21M14 18.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function AppleIcon(p: IconProps) {
  return (
    <IconBase label="Apple" {...p}>
      <path
        d="M15.8 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.75-3.2.75-.7 0-1.7-.73-2.8-.71-1.4 0-2.75.84-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.6 2.15 1.05-.04 1.45-.68 2.7-.68s1.6.68 2.75.66c1.1-.02 1.85-1.04 2.55-2.06.8-1.18 1.1-2.3 1.15-2.36-.03-.01-2.15-.83-2.15-3.55z"
        fill="currentColor"
      />
      <path d="M13.9 6.1c.6-.7 1-1.7.85-2.7-.85.03-1.9.57-2.5 1.28-.55.63-1.03 1.65-.9 2.62.95.07 1.95-.48 2.55-1.2z" fill="currentColor" />
    </IconBase>
  );
}

export function GlobeIcon(p: IconProps) {
  return (
    <IconBase label="Web" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 12h17M12 3.5c-2.5 2.3-3.8 5.2-3.8 8.5s1.3 6.2 3.8 8.5c2.5-2.3 3.8-5.2 3.8-8.5S14.5 5.8 12 3.5z" stroke="currentColor" strokeWidth="1.5" />
    </IconBase>
  );
}

export function DownloadIcon(p: IconProps) {
  return (
    <IconBase label="Download" {...p}>
      <path d="M12 3.5v11m0 0l-4.5-4.5M12 14.5l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 17v2A1.5 1.5 0 006 20.5h12a1.5 1.5 0 001.5-1.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}
