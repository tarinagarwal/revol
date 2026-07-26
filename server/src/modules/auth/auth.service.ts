import { createHash, randomUUID } from "node:crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { User, type UserDoc } from "../../db/models/User.js";
import { Session } from "../../db/models/Session.js";
import { env } from "../../config/env.js";
import { generateOtp, hashOtp, otpExpiry, otpMatches, OTP_MAX_ATTEMPTS } from "../../lib/otp.js";
import { sendOtpEmail } from "../../lib/mailer.js";
import type { PublicUser } from "./auth.schemas.js";

const REFRESH_TTL_DAYS = 30;

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function toPublicUser(u: UserDoc): PublicUser {
  return {
    id: String(u._id),
    email: u.email,
    displayName: u.displayName,
    emailVerified: u.emailVerified,
    role: u.role,
  };
}

/* ---------- refresh tokens (own secret + Session rotation) ---------- */

function hashJti(jti: string): string {
  return createHash("sha256").update(jti).digest("hex");
}

function signRefreshToken(userId: string, jti: string): string {
  if (!env.JWT_REFRESH_SECRET) throw new AuthError(500, "Refresh secret missing");
  return jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` });
}

export async function issueSession(userId: string, userAgent: string): Promise<string> {
  const jti = randomUUID();
  await Session.create({
    userId,
    jtiHash: hashJti(jti),
    userAgent,
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86_400_000),
  });
  return signRefreshToken(userId, jti);
}

/** Rotation: verify → kill old session → mint new one. Reuse = hard fail. */
export async function rotateSession(
  refreshToken: string,
  userAgent: string,
): Promise<{ userId: string; newRefreshToken: string }> {
  if (!env.JWT_REFRESH_SECRET) throw new AuthError(500, "Refresh secret missing");
  let payload: { sub?: string; jti?: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub?: string; jti?: string };
  } catch {
    throw new AuthError(401, "Invalid refresh token");
  }
  if (!payload.sub || !payload.jti) throw new AuthError(401, "Invalid refresh token");

  const deleted = await Session.findOneAndDelete({ jtiHash: hashJti(payload.jti) });
  if (!deleted) {
    // Token replay or already-rotated — revoke everything for safety.
    await Session.deleteMany({ userId: payload.sub });
    throw new AuthError(401, "Session expired — sign in again");
  }

  const newRefreshToken = await issueSession(payload.sub, userAgent);
  return { userId: payload.sub, newRefreshToken };
}

export async function revokeSession(refreshToken: string): Promise<void> {
  if (!env.JWT_REFRESH_SECRET) return;
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { jti?: string };
    if (payload.jti) await Session.deleteOne({ jtiHash: hashJti(payload.jti) });
  } catch {
    // Already invalid — nothing to revoke.
  }
}

/* ---------- OTP dispatch ---------- */

async function dispatchOtp(user: UserDoc, purpose: "verify-email" | "reset-password"): Promise<string | undefined> {
  const code = generateOtp();
  await User.updateOne(
    { _id: user._id },
    { otp: { codeHash: hashOtp(code), purpose, expiresAt: otpExpiry(), attempts: 0 } },
  );

  if (env.DEV_MODE) {
    console.log(`[auth][DEV_MODE] OTP for ${user.email} (${purpose}): ${code}`);
  }
  try {
    await sendOtpEmail(user.email, purpose, code);
  } catch (err) {
    // In dev the logged code keeps the flow moving; in prod this is fatal.
    if (!env.DEV_MODE) throw new AuthError(502, "Could not send email — try again shortly");
    console.warn("[auth][DEV_MODE] email send failed (continuing):", (err as Error).message);
  }
  return env.DEV_MODE ? code : undefined;
}

async function consumeOtp(user: UserDoc, purpose: "verify-email" | "reset-password", code: string): Promise<void> {
  const otp = user.otp;
  if (!otp || otp.purpose !== purpose) throw new AuthError(400, "No active code — request a new one");
  if (otp.expiresAt.getTime() < Date.now()) throw new AuthError(400, "Code expired — request a new one");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new AuthError(429, "Too many attempts — request a new code");

  if (!otpMatches(code, otp.codeHash)) {
    await User.updateOne({ _id: user._id }, { $inc: { "otp.attempts": 1 } });
    throw new AuthError(400, "Incorrect code");
  }
  await User.updateOne({ _id: user._id }, { otp: null });
}

/* ---------- flows ---------- */

export async function signup(input: { displayName: string; email: string; password: string }) {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new AuthError(409, "An account with this email already exists");

  const passwordHash = await argon2.hash(input.password);
  const user = await User.create({
    displayName: input.displayName,
    email: input.email,
    passwordHash,
  });

  const devOtp = await dispatchOtp(user, "verify-email");
  return { user: toPublicUser(user), devOtp };
}

export async function verifyEmail(email: string, code: string) {
  const user = await User.findOne({ email });
  if (!user) throw new AuthError(404, "Account not found");
  if (user.emailVerified) return { user: toPublicUser(user) };

  await consumeOtp(user, "verify-email", code);
  user.emailVerified = true;
  await user.save();
  return { user: toPublicUser(user) };
}

export async function resendVerification(email: string) {
  const user = await User.findOne({ email });
  if (!user) throw new AuthError(404, "Account not found");
  if (user.emailVerified) throw new AuthError(400, "Email already verified");
  const devOtp = await dispatchOtp(user, "verify-email");
  return { devOtp };
}

export async function login(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email });
  if (!user) throw new AuthError(401, "Invalid email or password");

  const ok = await argon2.verify(user.passwordHash, input.password).catch(() => false);
  if (!ok) throw new AuthError(401, "Invalid email or password");

  user.lastLoginAt = new Date();
  await user.save();
  return { user: toPublicUser(user), userDoc: user };
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email });
  // Never reveal whether the account exists.
  if (!user) return { devOtp: undefined };
  const devOtp = await dispatchOtp(user, "reset-password");
  return { devOtp };
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const user = await User.findOne({ email });
  if (!user) throw new AuthError(400, "Invalid reset request");

  await consumeOtp(user, "reset-password", code);
  user.passwordHash = await argon2.hash(newPassword);
  await user.save();
  // Password changed — kill every session on every device.
  await Session.deleteMany({ userId: user._id });
}
