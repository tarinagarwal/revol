import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

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

/** Keeps signed-in users out of auth screens. */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuthStore();
  if (user && accessToken && user.emailVerified) {
    return <Navigate to="/app" replace />;
  }
  return children;
}
