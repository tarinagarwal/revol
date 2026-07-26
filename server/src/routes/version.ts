import type { FastifyInstance } from "fastify";

/**
 * Release manifest — drives auto-update on every platform (Epic 15).
 *   desktop : electron-updater checks GitHub Releases; this endpoint gates rollout
 *   mobile  : app compares its version, shows custom "update available" screen
 * Versions bump via the release workflow; storage moves to Mongo/GCS later.
 */
const manifest = {
  api: "0.1.0",
  channels: {
    desktop: {
      latest: "0.2.0",
      feed: "github-releases",
      mandatory: false,
    },
    mobile: {
      latest: "0.2.0",
      minSupported: "0.1.0",
      storeUrls: {
        // Until store listings exist, "store" = latest GitHub release.
        android: "https://github.com/tarinagarwal/revol/releases/latest",
        ios: "https://github.com/tarinagarwal/revol/releases/latest",
      },
      mandatory: false,
    },
    web: {
      latest: "0.2.0",
    },
  },
};

export async function versionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/version", async () => manifest);
}
