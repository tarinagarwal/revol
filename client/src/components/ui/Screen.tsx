import type { ReactNode } from "react";

type ScreenProps = {
  children: ReactNode;
  /** Center content both axes (splash/empty states). */
  centered?: boolean;
  className?: string;
};

/**
 * Root container for every screen. Dark cinematic canvas,
 * safe-area aware (Capacitor notches / Electron chrome).
 */
export function Screen({ children, centered = false, className = "" }: ScreenProps) {
  return (
    <main
      className={[
        "min-h-full bg-black text-ivory",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        centered ? "flex flex-col items-center justify-center" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </main>
  );
}
