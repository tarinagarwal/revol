import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";

/**
 * JWT plugin + `app.authenticate` guard.
 * Access tokens: 15 min, signed with JWT_ACCESS_SECRET.
 * Refresh tokens are handled separately in the auth service (own secret,
 * rotation via Session docs) — this plugin only guards API access.
 */
export type AccessPayload = {
  sub: string;
  role: string;
  emailVerified: boolean;
};

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessPayload;
    user: AccessPayload;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  if (!env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is required");
  }

  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: "15m" },
  });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      await reply.status(401).send({ error: "Unauthorized" });
    }
  });
});
