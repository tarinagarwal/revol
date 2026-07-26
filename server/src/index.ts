import { buildApp } from "./app.js";
import { connectDb, disconnectDb } from "./db/connect.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  await connectDb();
  const app = await buildApp();

  const close = async (signal: string): Promise<void> => {
    app.log.info(`${signal} received — shutting down`);
    await app.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void close("SIGINT"));
  process.on("SIGTERM", () => void close("SIGTERM"));

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(`[revol] server listening on :${env.PORT}`);
}

main().catch((err) => {
  console.error("[revol] fatal boot error", err);
  process.exit(1);
});
