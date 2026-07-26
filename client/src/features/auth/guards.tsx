import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { getOnboardingState } from "@/features/onboarding/onboarding.api";
import { Screen, Spinner } from "@/components/ui";

/** Blocks unauthenticated users; unverified users go finish OTP. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!user || !accessToken) {
    return <Navigate to="/auth/sign-in" state={{ from: location.pathname }} replace />;
  }
  if (!user.emailVerified) {
    return <Navigate to="/auth/verify" state={{ email: user.email }} replace />;
  }
  return children;
}

/** Inside RequireAuth: sends unfinished profiles to onboarding. */
export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({ queryKey: ["onboarding-state"], queryFn: getOnboardingState });

  if (isLoading) {
    return (
      <Screen centered>
        <Spinner size={32} />
      </Screen>
    );
  }
  if (data && !data.completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

/**
 * Layout guard for the entire in-app section: authenticated AND onboarded.
 * Every route nested under this Outlet is protected automatically — new
 * app screens can never ship unguarded.
 */
export function ProtectedOutlet() {
  return (
    <RequireAuth>
      <RequireOnboarded>
        <Outlet />
      </RequireOnboarded>
    </RequireAuth>
  );
}

/** Keeps signed-in users out of auth screens. */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuthStore();
  if (user && accessToken && user.emailVerified) {
    return <Navigate to="/app" replace />;
  }
  return children;
}
