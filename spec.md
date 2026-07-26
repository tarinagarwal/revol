# REVOL — Project Specification

> **Real connections. Infinitely.**
> An AI-powered dating platform built around emotional compatibility, mystery, and intentional connection. Attraction should evolve, not be instantly consumed.

**Status:** Spec frozen. Awaiting "go" to scaffold.
**Package manager:** npm (no pnpm, no workspaces)
**Language:** TypeScript across client and server
**UI rule:** No default HTML elements in feature code. Every primitive is hand-built. No emojis — custom SVG icons only.

---

## 1. Architecture

```
revol/
├── client/    → shared React (TS) UI. Serves web, wrapped by Capacitor (mobile) + Electron (desktop)
└── server/    → Node + Fastify + MongoDB + Socket.IO + OpenRouter
```

Two top-level folders only: `client/` and `server/`. Nothing else at root except config/meta files (`README`, `spec.md`, `.gitignore`, `.github/`).

One shared React UI is written once and shipped to four targets:

| Target | Tool | Output |
|---|---|---|
| Web | Vite build (served directly) | website |
| Android / iOS | Capacitor | APK / AAB, IPA |
| Windows / macOS | Electron + electron-builder | EXE / DMG |

---

## 2. Client Stack

| Concern | Choice |
|---|---|
| Core | React + TypeScript + Vite |
| Routing | React Router (memory/hash router — Electron & Capacitor safe) |
| Server state | TanStack Query |
| UI state | Zustand |
| Styling | Tailwind CSS + CSS variables for brand tokens |
| Forms | React Hook Form + Zod |
| Realtime | Socket.IO client |
| Icons | Custom SVG icon set (no emojis, ever) |

**Hard UI rule:** No raw HTML elements used directly in feature code. Every primitive (`Button`, `Input`, `Text`, `Card`, `Modal`, `Icon`, `Avatar`, `Screen`, etc.) is a custom-built component in `client/src/components/ui/`. Feature screens compose only these.

### Client folder structure
```
client/src/
├── components/
│   ├── ui/          → hand-built primitives (Button, Input, Card, Modal, ...)
│   └── icons/       → custom SVG icon components
├── features/        → feature logic (auth, onboarding, discovery, chat, ...)
├── screens/         → composed screens
├── lib/             → api client, socket, helpers
├── store/           → Zustand stores
├── hooks/           → shared hooks
├── theme/           → brand tokens, motion tokens, fonts
└── assets/brand/    → logo + brand assets (single swap point)
```

---

## 3. Server Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js + Fastify (TypeScript) |
| Realtime | Socket.IO (chat, live reveal) |
| Auth | JWT (access + refresh), argon2 password hashing |
| Validation | Zod |
| Media upload | @fastify/multipart → Google Cloud Storage adapter |
| Database | MongoDB + Mongoose |
| Cache / sessions / socket adapter | Upstash Redis |
| Vector search | Upstash Vector (compatibility matching via embeddings) |
| Jobs / scheduler / cron | Upstash QStash (pacing, notifications, retries, webhooks) |
| Rate limiting | @upstash/ratelimit (AI cost guardrails + auth) |
| AI | Single `AIService` → OpenRouter (text · vision · voice), keys server-side only |
| Docs | @fastify/swagger |

### Server folder structure
```
server/src/
├── routes/          → HTTP route definitions
├── modules/         → domain modules (auth, users, matching, chat, ...)
├── plugins/         → Fastify plugins (auth guard, error handler, ...)
├── ai/
│   └── prompts/     → OpenRouter prompt templates
├── db/              → Mongoose connection + models
├── lib/             → storage adapter (GCS), helpers
└── config/          → env loader, constants
```

---

## 4. AI Layer (OpenRouter — no ML)

One server module (`AIService`). All keys server-side only. Responses parsed with Zod.

Handles:
- Compatibility reasoning + chemistry scoring ("why you match")
- Embedding generation (personality/values/profile text) → stored in Upstash Vector
- Icebreaker / conversation-starter generation
- Vision: profile/photo understanding + authenticity signal
- Voice: intro / voice-note transcription + tone analysis

---

## 4a. Upstash Layer

| Product | Role in Revol |
|---|---|
| **Redis** | Cache, sessions, Socket.IO adapter, ratelimit backing |
| **Vector** | Compatibility matching + chemistry scoring by similarity. Embeddings handled by Vector's **hosted BGE_M3 model** (multilingual, 1024-dim, COSINE) — we send raw text, Upstash embeds + stores. No OpenRouter embedding call, no ML pipeline. |
| **QStash** | Background jobs + scheduling over HTTP: one-meaningful-match daily pacing, delayed reveal unlocks, notification dispatch, AI-call retries, media→AI post-processing, webhooks, cron. Calls back into the public Cloud Run URL. |
| **Ratelimit** | `@upstash/ratelimit` on Redis — AI cost guardrails per user + auth endpoint protection. |

**Access pattern:** `@upstash/redis` (REST) for cache / ratelimit / vector / qstash consistency; native Redis protocol (TLS) for the Socket.IO adapter. Each product has its own token from the Upstash console — all server-side only, never in the client.

**Env (server/.env):** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REDIS_URL`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`. Rotate the account API key after setup since it was shared in chat.

**Provisioned status (2026-07-26, account `support@looksgoodtomeow.in`):**

| Resource | Name | Status |
|---|---|---|
| Redis | `revol-redis` — global, primary us-east-1, TLS, free tier | ✅ Live, verified (`PONG`), creds in `server/.env` |
| Vector | `revol-vector` — us-east-1, BGE_M3, 1024-dim, COSINE, free tier (200K vectors, 10K queries/day) | ✅ Live, verified (`/info`), creds in `server/.env` |
| QStash | account-level, `eu-central-1` endpoint | ✅ Live, verified (`/v2/schedules` → 200), creds in `server/.env` (incl. `QSTASH_URL` — SDK must use the EU endpoint, not the default) |

---

## 4b. Free-Tier Posture

Everything is built to run on free tiers during development. Confirmed:

| Service | Free tier | Notes |
|---|---|---|
| Upstash Redis | Yes | ~500K commands/mo, 256MB |
| Upstash Vector | Yes | ~10K queries/day |
| Upstash QStash | Yes | ~500 messages/day |
| Upstash Ratelimit | Yes | SDK — runs on the free Redis |
| MongoDB Atlas | Yes | M0 cluster, 512MB |
| Google Cloud (Cloud Run, Storage) | Yes | Cloud Run ~2M req/mo, Storage ~5GB. Needs a billing account attached even on free tier. |
| GitHub (repo + Actions + Releases) | Yes | Free minutes for the repo |
| Capacitor / Electron / Vite / Fastify / React | Yes | Open source |

**Two honest exceptions — not free:**
1. **OpenRouter** — pay-per-token. Free models exist (`:free` variants) and we default to them in dev, but production-grade vision/voice models cost money. No fixed monthly free credit.
2. **App store publishing** — Google Play ($25 one-time) and Apple Developer ($99/yr) are required only when you actually publish the mobile apps. Building/testing locally and desktop/web releases stay free.

Code is written provider-agnostic where it matters (AI model IDs, storage adapter) so we can stay on free/cheap tiers and swap later without rework.

---

## 5. Media & Hosting (Google Cloud)

- **Media upload:** Google Cloud Storage via a storage adapter (signed upload URLs, delete, access control). Images + audio.
- **Hosting (live since 2026-07-26):**
  - Server → Cloud Run `revol-server` (asia-south1, min-instances=1, project `revol-prod-2026`)
  - Web → **Vercel** at https://revol-dating.vercel.app *(decision: Vercel stays; replaced the GCS+CDN plan)*
  - Media → GCS bucket `revol-media-2026` (private, signed reads)
  - Release artifacts → GitHub Releases (EXE/APK + electron-updater feed)
  - Secrets → Cloud Run env vars for now (Secret Manager migration = later hardening)
  - Brand assets: placeholder logo everywhere; real logo + app icons/splash pending from founder
- **Database:** MongoDB (Atlas or GCP-hosted).

---

## 6. Auto-Update (required on both platforms)

- **Desktop:** `electron-updater` → checks GitHub Releases → custom in-app UI ("Update available / Download / Restart & Install").
- **Mobile:** native store-version check → custom "Update available → Go to store" screen. *(OTA / Capacitor Live Updates: deliberately skipped for now — decision 2026-07-26; revisit if release cadence demands it.)*
- **Both** driven by a server release-manifest / `/version` endpoint to control rollout. No default dialogs — all custom UI.

---

## 7. Brand Tokens

```
--color-crimson:  #FF002E   passion / accent / CTA
--color-gold:     #D4A64A   premium / highlights / secondary accent
--color-black:    #000000   base / mystery / depth
```

- **Typography:** cinematic wide-spaced serif for headlines/wordmark; minimal geometric sans-serif for UI/body.
- **Aesthetic:** dark cinematic base, soft glow, blur/reveal mechanics, gold micro-accents, elegant slow easing. No loud gradients, no clutter, no playful/meme visuals.
- **Motion:** gradual reveals, soft fades, blur transitions, glow pulses, floating movement, elegant easing — reusable motion tokens.
- **Logo:** placeholder random image for now, swapped when real logo arrives. Isolated in `assets/brand/` for one-file swap.

**Brand voice:** emotionally intelligent, mysterious, calm confidence, elegant, intimate, modern. Never corporate, hyper-casual, desperate, loud, manipulative, or gimmicky.

**Messaging pillars:** Mystery · Compatibility · Intentional Dating.

---

## 8. Feature Set (all in one package — no phasing)

AI compatibility matching · blurred-profile / progressive reveal mechanic · chemistry score with reasoning · one-meaningful-match pacing · depth onboarding · realtime chat + AI icebreakers · voice intros/notes · identity verification · privacy controls · report/block/safety · groups/events/communities · premium tier · mobile + desktop auto-update · GCS media · GCP hosting.

---

## 9. Master Task List

### EPIC 0 — Foundation & Scaffold
- [ ] Root structure: `client/` + `server/` only, `.gitignore`, `README`, `.github/`
- [ ] `client/`: Vite + React + strict TypeScript
- [ ] `client/`: Tailwind + brand tokens (Crimson / Gold / Black), serif + geometric-sans fonts
- [ ] `client/`: React Router (memory/hash router — Electron/Capacitor safe)
- [ ] `client/`: TanStack Query + Zustand + React Hook Form + Zod wiring
- [ ] `client/`: folder structure (components/ui, components/icons, features, screens, lib, store, hooks, theme, assets/brand)
- [ ] `server/`: Fastify + strict TypeScript + folder structure (routes, modules, plugins, ai, db, lib, config)
- [ ] `server/`: Mongoose connection + config/env loader
- [ ] `server/`: health route + `/version` release-manifest route
- [ ] Shared Zod schema/types convention between client & server

### EPIC 1 — Custom UI Kit (no default HTML, no emojis)
- [ ] Custom SVG icon system + icon components (heart, infinity, lock, mic, camera, etc.)
- [ ] Primitives: `Screen`, `Text`, `Heading`, `Button`, `IconButton`, `Input`, `TextArea`, `Select`, `Checkbox`, `Toggle`, `Radio`
- [ ] Layout: `Stack`, `Row`, `Grid`, `Spacer`, `Divider`, `SafeArea`
- [ ] Surfaces: `Card`, `Modal`, `Sheet`, `Drawer`, `Toast`, `Tooltip`, `Popover`
- [ ] Media/identity: `Avatar`, `BlurImage` (reveal mechanic), `ImageFrame`
- [ ] Feedback: `Spinner`, `Skeleton`, `ProgressBar`, `EmptyState`, `ErrorState`
- [ ] Motion primitives: fade, blur-reveal, glow-pulse, float, elegant easing tokens
- [ ] Nav: `TabBar`, `AppHeader`, `BackButton`

### EPIC 2 — Auth
- [ ] Server: signup / login / logout, argon2 hashing
- [ ] Server: JWT access + refresh, refresh rotation, auth guard plugin
- [ ] Server: password reset + email verification flow
- [ ] Client: auth store, token persistence, refresh interceptor
- [ ] Client screens: Splash, Sign In, Sign Up, Forgot/Reset, Verify
- [ ] Session/route guards (protected vs public)

### EPIC 3 — Onboarding (depth-first)
- [ ] Data model: onboarding profile (personality, values, intent, preferences)
- [ ] Server: onboarding progress endpoints
- [ ] Client: multi-step onboarding flow (custom stepper, gradual reveals)
- [ ] Interests / prompts / relationship-goal capture
- [ ] Voice intro capture step (records → GCS → transcribe/analyze via AI)

### EPIC 4 — Media (Google Cloud Storage)
- [ ] Server: GCS storage adapter (signed upload URLs, delete, access control)
- [ ] Server: @fastify/multipart + validation (type/size), image + audio
- [ ] Server: media metadata model
- [ ] Client: upload component (progress, retry), camera/gallery via Capacitor
- [ ] Client: audio recorder component for voice notes/intros

### EPIC 5 — AI Layer (OpenRouter — text · vision · voice)
- [ ] Server: `AIService` module, OpenRouter client, key handling (server-only)
- [ ] Prompt templates dir + Zod response parsing
- [ ] Compatibility reasoning + chemistry score ("why you match")
- [ ] Embedding generation (profile/personality/values) → Upstash Vector upsert
- [ ] Icebreaker / conversation-starter generation
- [ ] Vision: profile/photo understanding + authenticity signal
- [ ] Voice: intro/voice-note transcription + tone analysis
- [ ] Rate limiting / cost guardrails per user (@upstash/ratelimit)

### EPIC 6 — Profile & Discovery
- [ ] Data models: User, Profile, Preferences, Media
- [ ] Server: profile CRUD, view/edit, settings
- [ ] Server: discovery/match queue (compatibility-first via Upstash Vector similarity, one-meaningful-match pacing)
- [ ] Blurred profile / progressive reveal mechanic (server reveal-state + client `BlurImage`)
- [ ] Chemistry score display with AI reasoning
- [ ] Client screens: Profile view, Edit profile, Discovery/match screen, Reveal flow

### EPIC 7 — Interactions & Matching
- [ ] Server: like / pass / interest signals, mutual-match detection
- [ ] Server: match lifecycle + reveal unlock rules (reward conversation quality)
- [ ] Client: Matches list, match detail, reveal-unlock UI
- [ ] Anticipation/pacing logic (daily match cadence via QStash schedules + delayed reveal unlocks)

### EPIC 8 — Realtime Chat
- [ ] Server: Socket.IO gateway, auth handshake, rooms
- [ ] Server: message model, history, read receipts, typing
- [ ] Server: AI icebreaker injection + conversation-quality scoring
- [ ] Client: chat screen (custom bubbles), typing, delivery/read states
- [ ] Client: voice-note send/play in chat
- [ ] Offline queue + reconnect handling

### EPIC 9 — Safety, Verification & Privacy
- [ ] Server: identity verification flow (selfie/photo + AI vision check)
- [ ] Server: report / block / unmatch endpoints + moderation queue
- [ ] Server: privacy controls (data visibility, delete account, data export)
- [ ] Client: verification screen, report/block sheets, privacy settings
- [ ] Content safety filtering on media + messages

### EPIC 10 — Community
- [ ] Server: groups / events / communities models + CRUD + membership
- [ ] Server: event RSVP + discovery
- [ ] Client: Communities browse, group detail, events, RSVP flows

### EPIC 11 — Premium / Monetization
- [ ] Server: subscription tiers, entitlements, premium-gated features
- [ ] Server: purchase verification hooks (store IAP + web billing stub)
- [ ] Client: paywall screens, premium badges, upgrade flow
- [ ] Feature gating across discovery/chat/insights

### EPIC 12 — Notifications
- [ ] Server: notification model + dispatch via QStash (new match, message, reveal, event)
- [ ] Push: Capacitor push (FCM/APNs) + desktop notifications (Electron)
- [ ] Client: in-app notification center + preferences

### EPIC 13 — Packaging: Mobile (Capacitor)
- [ ] Capacitor init + Android/iOS platforms wired into `client/`
- [ ] Native plugins: camera, filesystem, push, haptics, status bar
- [ ] Build config for APK/AAB + IPA
- [ ] App icons/splash from brand assets

### EPIC 14 — Packaging: Desktop (Electron)
- [ ] Electron shell + electron-builder wired into `client/`
- [ ] Main/preload/IPC structure, secure defaults
- [ ] EXE (Windows) + DMG (macOS) build config
- [ ] Desktop notifications + tray

### EPIC 15 — Auto-Update (both, required)
- [ ] Desktop: `electron-updater` → GitHub Releases feed
- [ ] Desktop: custom in-app update UI (Available / Download / Restart & Install)
- [ ] Mobile: Capacitor Live Updates (OTA JS/assets) + native store-version check
- [ ] Mobile: custom "Update available → store" screen
- [ ] Server: release-manifest / `/version` endpoint driving rollout for both

### EPIC 16 — CI/CD & Releases (GitHub)
- [ ] `.github/workflows`: build client (web/mobile/desktop) + server
- [ ] Release-on-tag: desktop artifacts → GitHub Releases; mobile update bundle + manifest
- [ ] Lint / typecheck / test gates
- [ ] Versioning + changelog convention

### EPIC 17 — Hosting & Deploy (GCP)
- [ ] Server → Cloud Run (Dockerfile, env/secrets via Secret Manager)
- [ ] Web build → Cloud Storage + Cloud CDN (or Firebase Hosting)
- [ ] MongoDB (Atlas or GCP-hosted) connection + network config
- [ ] GCS buckets: media + release manifests
- [ ] gcloud deploy scripts

### EPIC 18 — Cross-Cutting
- [ ] Error handling + logging (server) / error boundaries (client)
- [ ] Rate limiting, CORS, security headers, input sanitization
- [ ] Env management (`.env` per client/server, GCP secrets in prod)
- [ ] i18n-ready string layer (no hardcoded copy in components)
- [ ] Accessibility pass on custom UI kit
- [ ] Analytics/event hooks (privacy-respecting)

### EPIC 19 — QA & Docs
- [ ] Server unit/integration tests (Fastify + Mongo test setup)
- [ ] Client component/interaction tests
- [ ] E2E smoke on web + one mobile + one desktop build
- [ ] `README` per client/server + architecture doc + brand-token doc

---

## 10. Initial Deliverable (what "start" means)

1. Scaffold `client/` (Vite + React TS + Tailwind + router + brand theme tokens + custom UI component skeletons + folder structure).
2. Scaffold `server/` (Fastify + TS + Mongoose connection + folder structure + health/version routes + AIService skeleton).
3. Capacitor + Electron config wired into `client/` (with auto-update flows).
4. `.gitignore`, root `README`, `.github/` release workflow skeletons.
5. No feature logic yet — clean, organized, runnable skeleton.
