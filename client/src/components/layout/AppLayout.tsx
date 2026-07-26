import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Avatar, Text } from "@/components/ui";
import {
  InfinityHeartIcon,
  SparkIcon,
  HeartIcon,
  ChatIcon,
  UserIcon,
  SettingsIcon,
  type IconProps,
} from "@/components/icons";
import { useAuthStore } from "@/store/authStore";

type NavItem = { path: string; label: string; icon: (p: IconProps) => React.ReactNode };

const items: NavItem[] = [
  { path: "/app/today", label: "Today", icon: SparkIcon },
  { path: "/app/matches", label: "Matches", icon: HeartIcon },
  { path: "/app/chat", label: "Chat", icon: ChatIcon },
  { path: "/app/profile", label: "You", icon: UserIcon },
];

/**
 * The in-app shell — one layout, every target:
 *   mobile / APK : slim top bar + bottom TabBar (safe-area aware)
 *   desktop / EXE: left sidebar, content centered
 */
export function AppLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-svh bg-black text-ivory">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-charcoal px-4 py-6 md:flex">
        <NavLink to="/app/today" className="mb-10 flex items-center gap-3 px-2 no-underline">
          <InfinityHeartIcon size={28} className="text-crimson" />
          <span className="font-display text-lg tracking-cinematic uppercase text-gold">revol</span>
        </NavLink>
        <nav aria-label="App" className="flex flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm no-underline",
                  "transition-colors duration-base ease-elegant",
                  isActive ? "bg-charcoal/60 text-gold" : "text-ivory-dim hover:bg-charcoal/40 hover:text-ivory",
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm no-underline transition-colors duration-base",
                isActive ? "bg-charcoal/60 text-gold" : "text-ivory-dim hover:bg-charcoal/40 hover:text-ivory",
              )
            }
          >
            <SettingsIcon size={20} />
            Settings
          </NavLink>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={user?.displayName ?? "You"} size="sm" ring="gold" />
            <Text variant="caption" tone="dim" className="truncate">
              {user?.displayName}
            </Text>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-70 flex items-center justify-between border-b border-charcoal bg-black/90 px-5 py-3 backdrop-blur md:hidden pt-[max(0.75rem,env(safe-area-inset-top))]">
          <NavLink to="/app/today" className="flex items-center gap-2.5 no-underline">
            <InfinityHeartIcon size={24} className="text-crimson" />
            <span className="font-display text-base tracking-cinematic uppercase text-gold">revol</span>
          </NavLink>
          <NavLink to="/app/settings" aria-label="Settings" className="text-ivory-dim transition-colors duration-base hover:text-ivory">
            <SettingsIcon size={22} />
          </NavLink>
        </header>

        <main className="flex-1 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-80 border-t border-charcoal bg-black/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 font-body text-[10px] tracking-elegant uppercase no-underline",
                  "transition-colors duration-base ease-elegant",
                  isActive ? "text-crimson" : "text-ivory-dim",
                )
              }
            >
              <item.icon size={22} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
