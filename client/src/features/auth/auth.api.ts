import { api } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/store/authStore";

/** Typed calls for every auth endpoint. devOtp appears only when server DEV_MODE=true. */

type AuthResponse = { user: AuthUser; accessToken: string; refreshToken: string };

export async function signupRequest(input: { displayName: string; email: string; password: string }) {
  return api<{ user: AuthUser; devOtp?: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyEmailRequest(email: string, code: string) {
  const data = await api<AuthResponse>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
  return data;
}

export async function resendOtpRequest(email: string) {
  return api<{ ok: boolean; devOtp?: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function loginRequest(email: string, password: string) {
  const data = await api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
  return data;
}

export async function forgotPasswordRequest(email: string) {
  return api<{ ok: boolean; devOtp?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(email: string, code: string, newPassword: string) {
  return api<{ ok: boolean }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export async function logoutRequest() {
  const { refreshToken, clear } = useAuthStore.getState();
  try {
    if (refreshToken) {
      await api("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
    }
  } finally {
    clear();
  }
}
