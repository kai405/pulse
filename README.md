# Pulse

Pulse is a privacy-conscious public-speaking practice application. A user chooses a prompt, records a timed audio/video response, and receives evidence-linked delivery, fluency, structure, visual-presence, and observable confident-delivery feedback. The first release is a polished closed beta; wristband and live haptic coaching are explicitly deferred.

## Product documents

- `PRODUCT_SPEC.md` — approved experience, states, privacy, and acceptance criteria
- `SCORING_SPEC.md` — exact metrics, thresholds, weights, confidence, and evidence rules
- `TECHNICAL_DESIGN.md` — data flow, schema, APIs, AI pipeline, security, and deployment
- `IMPLEMENTATION_PLAN.md` — vertical milestones and verification gates
- `AGENTS.md` — repository conventions and definition of done
- `STYLESEED.md` — locked visual grammar and signature design move
- `STYLESEED_SCORE.md` — per-screen source and rendered visual scores

The older hardware-first hackathon notes under `docs/` are preserved historical context and do not define this release.

## Stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage, Inngest, OpenAI, MediaPipe, Vitest, Testing Library, Playwright, and Vercel.

## Local setup

Requirements: Node 22+, npm 10+, Docker Desktop for local Supabase, and Chrome for E2E tests.

```bash
npm install
cp .env.example .env.local
npm run db:start
```

Copy the local Supabase URL, anon key, and service-role key printed by `db:start` into `.env.local`, then add an OpenAI API key for real transcription and semantic analysis.

```bash
npm run db:reset
npm run seed
npm run dev
```

Open `http://localhost:3000`. Without Supabase/OpenAI credentials, the complete UI and clearly labeled sample analysis remain available; new recording analysis is never faked.

## Commands

```bash
npm run dev                 # development server
npm run build               # production build
npm run start               # serve production build
npm run lint                # ESLint
npm run typecheck           # strict TypeScript
npm test                    # unit/component tests
npm run test:integration    # API/integration boundary tests
npm run test:e2e            # desktop + mobile browser tests
npm run db:start            # local Supabase stack
npm run db:reset            # apply migrations from scratch
npm run db:types            # regenerate database types
npm run seed                # upsert 60 curated prompts
npm run demo:reset          # reset prompt seed only; sample sessions are code fixtures
npm run stress:http         # concurrent local route load test
npm run stress:supabase     # disposable auth/RLS/storage/retention stress audit
```

## Environment variables

- `NEXT_PUBLIC_APP_URL`: deployed application origin.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser/server Supabase connection.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only storage, processing, retention, and deletion access.
- `OPENAI_API_KEY`: server-only Whisper transcription and structured semantic/frame evaluation.
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`: durable deployed processing. Local development falls back to Next.js post-response work.
- `CRON_SECRET`: 24+ random characters protecting the retention route.
- Sentry variables are reserved for sanitized monitoring and are optional in this build.

Never prefix secrets with `NEXT_PUBLIC_` or commit `.env.local`.

## Processing flow

1. The browser captures a separate audio track, optional video, RMS samples, conservative on-device face/framing signals, and at most 48 frames.
2. Media uploads directly to private Supabase buckets with short-lived signed upload tokens.
3. `whisper-1` produces segment and word timestamps.
4. Deterministic code calculates pace, fillers, pauses, repetition, duration, vocal variation, framing, and camera-orientation proxies.
5. A single structured OpenAI evaluator assesses semantic qualities and selected frames. Unsupported transcript/frame evidence is rejected.
6. Versioned scores and source evidence persist; low-confidence or missing metrics are visibly omitted and reweighted.

## Deployment

1. Create a Supabase project and apply `supabase/migrations/202608050001_initial_schema.sql` through the CLI or linked project workflow.
2. Run `npm run seed` against that project.
3. Create an Inngest app and configure its keys.
4. Import the repository into Vercel, set every production environment variable, and deploy.
5. Add Vercel Firewall/rate rules for `/api/auth/*` and session mutations; application throttles protect a hot instance but are not a distributed rate-limit store.
6. In Supabase Auth, enable anonymous sign-ins and email OTP, add the deployed `/auth/callback` URL, and verify private bucket policies.
7. Confirm `/api/inngest` registration and the `vercel.json` daily retention cron.
8. Run the demo checklist in `docs/DEMO_CHECKLIST.md` against the deployed URL.

## Privacy and limitations

Media defaults to 30-day retention; guest workspaces expire after seven days. Transcripts and analysis remain until session/account deletion. OpenAI processes audio, transcript/metrics, and selected frames, but the complete video is not sent to the evaluator. Visual metrics are observable proxies with visible confidence—not emotion, personality, honesty, attractiveness, or internal-state inference.

English transcription is the supported release language. Safari is best-effort; the primary support target is current desktop/mobile Chrome, Edge, and Firefox. Live coaching, sharing, exports, script uploads, AI prompt generation, and wristband communication are out of scope.
