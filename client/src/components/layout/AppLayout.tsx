import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Avatar, Text } from "@/components/ui";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  InfinityHeartIcon,
  SparkIcon,
  HeartIcon,
  ChatIcon,
  UserIcon,
  UsersIcon,
  SettingsIcon,
  type IconProps,
} from "@/components/icons";
import { useAuthStore } from "@/store/authStore";
import { NotificationBell, NotificationCenter } from "@/features/notifications/NotificationCenter";
import { usePush, showDesktopNotification } from "@/features/notifications/usePush";
import { useRealtime } from "@/features/chat/useRealtime";

type NavItem = { path: string; label: string; icon: (p: IconProps) => React.ReactNode };

const items: NavItem[] = [
  { path: "/app/today", label: "Today", icon: SparkIcon },
  { path: "/app/matches", label: "Matches", icon: HeartIcon },
  { path: "/app/chat", label: "Chat", icon: ChatIcon },
  { path: "/app/communities", label: "Community", icon: UsersIcon },
  { path: "/app/profile", label: "You", icon: UserIcon },
];

/**
 * The in-app shell — one layout, every target:
 *   mobile / APK : slim top bar + bottom TabBar (safe-area aware)
 *   desktop / EXE: left sidebar, content centered
 */
export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  usePush();

  // Live notifications for the whole app section (shared SSE connection).
  useRealtime((event) => {
    if (event.type === "notification") {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showDesktopNotification(event.notification.title, event.notification.body);
    }
  });

  // Refresh the badge when returning to the app.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [queryClient]);

  return (
    // lg+: the shell owns the viewport so panes pin and scroll independently.
    // min-h-svh must be cancelled at lg — min-height beats height, so leaving
    // it on let tall pages grow the shell and scroll the sidebar with them.
    <div className="flex min-h-svh bg-black text-ivory lg:h-svh lg:min-h-0 lg:overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden h-svh w-60 shrink-0 flex-col border-r border-charcoal px-4 py-5 lg:flex">
        {/* Brand and bell share one row — a standalone bell row wasted space
            and pushed the footer past the viewport. */}
        <div className="mb-8 flex shrink-0 items-center justify-between gap-2">
          <NavLink to="/app/today" className="flex min-w-0 items-center gap-2.5 px-1 no-underline">
            <InfinityHeartIcon size={26} className="shrink-0 text-crimson" />
            <span className="truncate font-display text-lg tracking-cinematic uppercase text-gold">revol</span>
          </NavLink>
          <NotificationBell onOpen={() => setNotificationsOpen(true)} />
        </div>
        <nav aria-label="App" className="flex min-h-0 flex-col gap-1 overflow-y-auto">
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
        <div className="mt-auto flex shrink-0 flex-col gap-1 pt-4">
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
      <div className="flex min-w-0 flex-1 flex-col lg:h-svh lg:min-h-0 lg:overflow-hidden">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-70 flex items-center justify-between border-b border-charcoal bg-black/90 px-5 py-3 backdrop-blur lg:hidden pt-[max(0.75rem,env(safe-area-inset-top))]">
          <NavLink to="/app/today" className="flex items-center gap-2.5 no-underline">
            <InfinityHeartIcon size={24} className="text-crimson" />
            <span className="font-display text-base tracking-cinematic uppercase text-gold">revol</span>
          </NavLink>
          <div className="flex items-center gap-1">
            <NotificationBell onOpen={() => setNotificationsOpen(true)} />
            <NavLink
              to="/app/settings"
              aria-label="Settings"
              className="p-2 text-ivory-dim transition-colors duration-base hover:text-ivory"
            >
              <SettingsIcon size={20} />
            </NavLink>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:min-h-0 lg:overflow-y-auto lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-80 border-t border-charcoal bg-black/95 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom)]"
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

      <NotificationCenter open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  );
}
