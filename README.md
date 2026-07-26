# REVOL

> Real connections. Infinitely.

AI-powered dating platform built around emotional compatibility, mystery, and intentional connection. Full specification: [spec.md](./spec.md).

## Architecture

```
revol/
├── client/    React + TS + Vite — one UI shipped to web, Capacitor (Android/iOS), Electron (Win/macOS)
└── server/    Node + Fastify + TS — MongoDB · Upstash (Redis/Vector/QStash) · OpenRouter · GCS
```

## Development

```bash
# client (http://localhost:5173)
cd client && npm install && npm run dev

# server (http://localhost:8080)
cd server && npm install && npm run dev
```

Server env: copy `server/.env.example` → `server/.env` and fill in values.

## Rules of the codebase

- **npm only.** No pnpm/yarn.
- **No default HTML elements in feature code** — everything composes primitives from `client/src/components/ui/`.
- **No emojis in the product** — custom SVG icons only (`client/src/components/icons/`).
- **All AI goes through `server/src/ai/AIService.ts`** — keys never reach the client.
- Brand tokens live in `client/src/theme/tokens.css` — Crimson `#FF002E`, Gold `#D4A64A`, Black `#000000`.
