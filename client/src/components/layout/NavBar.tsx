import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Avatar, Button, Divider, Drawer, IconButton, Stack, Text, toast } from "@/components/ui";
import { InfinityHeartIcon, MenuIcon, CloseIcon } from "@/components/icons";
import { useAuthStore } from "@/store/authStore";
import { logoutRequest } from "@/features/auth/auth.api";

const links = [
  { to: "/", label: "Home" },
  { to: "/download", label: "Download" },
];

/**
 * Marketing/site navigation — fixed, translucent over the cinematic canvas,
 * hardens to solid black once scrolled. Auth-aware: signed-in users get
 * their avatar + "Enter Revol" instead of the join CTA. Mobile: drawer menu.
 */
export function NavBar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const signOut = async () => {
    setMenuOpen(false);
    await logoutRequest();
    toast("Signed out — see you soon", "info");
    void navigate("/");
  };

  const authArea = user ? (
    <>
      <Button size="sm" onPress={() => void navigate("/app")}>
        Enter Revol
      </Button>
      <button
        type="button"
        onClick={() => void navigate("/app")}
        aria-label="Your space"
        className="cursor-pointer rounded-full border-none bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
      >
        <Avatar name={user.displayName} size="sm" ring="gold" />
      </button>
    </>
  ) : (
    <Button size="sm" onPress={() => void navigate("/auth/sign-up")}>
      Join Revol
    </Button>
  );

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-80 border-b transition-all duration-slow ease-elegant",
          "pt-[env(safe-area-inset-top)]",
          scrolled ? "border-charcoal bg-black/90 backdrop-blur" : "border-transparent bg-transparent",
        )}
      >
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
          <Link to="/" className="flex items-center gap-3 no-underline" aria-label="Revol home">
            <InfinityHeartIcon size={30} className="text-crimson" />
            <span className="font-display text-xl tracking-cinematic uppercase text-gold">revol</span>
          </Link>

          <div className="ml-auto hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "font-body text-xs tracking-elegant uppercase no-underline transition-colors duration-base ease-elegant",
                    isActive ? "text-gold" : "text-ivory-dim hover:text-ivory",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            {authArea}
          </div>

          <IconButton label="Open menu" className="ml-auto md:hidden" onPress={() => setMenuOpen(true)}>
            <MenuIcon size={22} />
          </IconButton>
        </nav>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Stack gap={6}>
          <div className="flex items-center justify-between">
            <span className="font-display text-lg tracking-cinematic uppercase text-gold">revol</span>
            <IconButton label="Close menu" onPress={() => setMenuOpen(false)}>
              <CloseIcon size={20} />
            </IconButton>
          </div>
          <Divider />
          {user && (
            <div className="flex items-center gap-3">
              <Avatar name={user.displayName} size="md" ring="gold" />
              <Stack gap={0}>
                <Text variant="body">{user.displayName}</Text>
                <Text variant="caption" tone="dim">
                  {user.email}
                </Text>
              </Stack>
            </div>
          )}
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "font-body text-sm tracking-elegant uppercase no-underline transition-colors duration-base",
                  isActive ? "text-gold" : "text-ivory hover:text-gold",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <Stack gap={3}>
              <Button
                fullWidth
                onPress={() => {
                  setMenuOpen(false);
                  void navigate("/app");
                }}
              >
                Enter Revol
              </Button>
              <Button fullWidth variant="outline" onPress={() => void signOut()}>
                Sign out
              </Button>
            </Stack>
          ) : (
            <Button
              fullWidth
              onPress={() => {
                setMenuOpen(false);
                void navigate("/auth/sign-up");
              }}
            >
              Join Revol
            </Button>
          )}
        </Stack>
      </Drawer>
    </>
  );
}
