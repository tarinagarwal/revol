import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "../../lib/upstash.js";
import { env } from "../../config/env.js";
import { User } from "../../db/models/User.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from "./auth.schemas.js";
import {
  AuthError,
  forgotPassword,
  issueSession,
  login,
  resendVerification,
  resetPassword,
  revokeSession,
  rotateSession,
  signup,
  toPublicUser,
  verifyEmail,
} from "./auth.service.js";

/* Rate limits — generous enough for humans, hostile to scripts. */
let otpLimiter: Ratelimit | null = null;
let loginLimiter: Ratelimit | null = null;

function limiters() {
  if (!otpLimiter) {
    otpLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:otp",
    });
    loginLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      prefix: "rl:login",
    });
  }
  return { otpLimiter: otpLimiter!, loginLimiter: loginLimiter! };
}

async function enforce(limiter: Ratelimit, key: string, reply: FastifyReply): Promise<boolean> {
  const { success } = await limiter.limit(key);
  if (!success) {
    await reply.status(429).send({ error: "Too many requests — slow down and try again soon" });
    return false;
  }
  return true;
}

function handleAuthError(err: unknown, reply: FastifyReply) {
  if (err instanceof AuthError) {
    return reply.status(err.status).send({ error: err.message });
  }
  throw err;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /* ---------- signup + verification ---------- */

  app.post("/auth/signup", async (req, reply) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    if (!(await enforce(limiters().otpLimiter, `signup:${req.ip}`, reply))) return;

    try {
      const { user, devOtp } = await signup(parsed.data);
      return reply.status(201).send({ user, ...(env.DEV_MODE ? { devOtp } : {}) });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.post("/auth/verify-email", async (req, reply) => {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input" });

    try {
      const { user } = await verifyEmail(parsed.data.email, parsed.data.code);
      // Verified — sign them straight in (no second login step after OTP).
      const accessToken = app.jwt.sign({ sub: user.id, role: user.role, emailVerified: true });
      const refreshToken = await issueSession(user.id, req.headers["user-agent"] ?? "");
      return reply.send({ user, accessToken, refreshToken });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.post("/auth/resend-otp", async (req, reply) => {
    const parsed = resendOtpSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid input" });
    if (!(await enforce(limiters().otpLimiter, `otp:${parsed.data.email}`, reply))) return;

    try {
      const { devOtp } = await resendVerification(parsed.data.email);
      return reply.send({ ok: true, ...(env.DEV_MODE ? { devOtp } : {}) });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  /* ---------- login / refresh / logout ---------- */

  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid input" });
    if (!(await enforce(limiters().loginLimiter, `login:${req.ip}:${parsed.data.email}`, reply))) return;

    try {
      const { user } = await login(parsed.data);
      const accessToken = app.jwt.sign({ sub: user.id, role: user.role, emailVerified: user.emailVerified });
      const refreshToken = await issueSession(user.id, req.headers["user-agent"] ?? "");
      return reply.send({ user, accessToken, refreshToken });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.post("/auth/refresh", async (req, reply) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid input" });

    try {
      const { userId, newRefreshToken } = await rotateSession(
        parsed.data.refreshToken,
        req.headers["user-agent"] ?? "",
      );
      const user = await User.findById(userId);
      if (!user) throw new AuthError(401, "Account not found");
      const accessToken = app.jwt.sign({
        sub: userId,
        role: user.role,
        emailVerified: user.emailVerified,
      });
      return reply.send({ user: toPublicUser(user), accessToken, refreshToken: newRefreshToken });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.post("/auth/logout", async (req, reply) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (parsed.success) await revokeSession(parsed.data.refreshToken);
    return reply.send({ ok: true });
  });

  /* ---------- password reset ---------- */

  app.post("/auth/forgot-password", async (req, reply) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid input" });
    if (!(await enforce(limiters().otpLimiter, `forgot:${parsed.data.email}`, reply))) return;

    const { devOtp } = await forgotPassword(parsed.data.email);
    // Same response whether or not the account exists.
    return reply.send({ ok: true, ...(env.DEV_MODE ? { devOtp } : {}) });
  });

  app.post("/auth/reset-password", async (req, reply) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input" });

    try {
      await resetPassword(parsed.data.email, parsed.data.code, parsed.data.newPassword);
      return reply.send({ ok: true });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  /* ---------- session introspection ---------- */

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply) => {
    const user = await User.findById(req.user.sub);
    if (!user) return reply.status(404).send({ error: "Account not found" });
    return reply.send({ user: toPublicUser(user) });
  });
}
