import { createHash, randomInt } from "node:crypto";

/** 6-digit OTP utilities. Codes are stored hashed, never plaintext. */
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function otpMatches(code: string, codeHash: string): boolean {
  return hashOtp(code) === codeHash;
}

export function otpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
}
