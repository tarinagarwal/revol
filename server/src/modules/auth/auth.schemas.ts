import { z } from "zod";

/** Zod contracts for every auth endpoint. Client mirrors these shapes. */
export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Name too short").max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Minimum 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "6-digit code"),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "6-digit code"),
  newPassword: z.string().min(8, "Minimum 8 characters").max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role: string;
};
