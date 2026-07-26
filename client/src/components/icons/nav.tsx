import { IconBase, type IconProps } from "./Icon";

export function ChevronLeftIcon(p: IconProps) {
  return (
    <IconBase label="Back" {...p}>
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <IconBase label="Expand" {...p}>
      <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <IconBase label="Forward" {...p}>
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <IconBase label="Continue" {...p}>
      <path d="M4 12h16m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function MenuIcon(p: IconProps) {
  return (
    <IconBase label="Menu" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <IconBase label="Close" {...p}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}

export function HomeIcon(p: IconProps) {
  return (
    <IconBase label="Home" {...p}>
      <path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1v-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </IconBase>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <IconBase label="Search" {...p}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconBase>
  );
}
