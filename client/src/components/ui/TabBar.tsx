import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import type { IconProps } from "@/components/icons";

export type TabItem = {
  path: string;
  label: string;
  icon: ComponentType<IconProps>;
};

type TabBarProps = {
  items: TabItem[];
  className?: string;
};

/** Bottom app navigation — fixed, safe-area aware. */
export function TabBar({ items, className }: TabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-80 border-t border-charcoal bg-black/90 backdrop-blur",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ path, label, icon: ItemIcon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-3 font-body text-[10px] tracking-elegant uppercase",
                "transition-colors duration-base ease-elegant",
                isActive ? "text-crimson" : "text-ivory-dim hover:text-ivory",
              )
            }
          >
            <ItemIcon size={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
