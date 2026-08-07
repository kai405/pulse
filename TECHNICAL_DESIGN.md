# Pulse Technical Design

Status: Approved for implementation
Architecture goal: the simplest durable web architecture that keeps media private, metrics reproducible, and processing retryable.

## Stack

- Next.js App Router, React, strict TypeScript, npm.
- Tailwind CSS and repository-native components built on Radix primitives.
- Zod for external-boundary validation and React Hook Form for complex forms.
- Supabase Postgres, Auth, and private Storage.
- Generated Supabase database types and SQL migrations; no second ORM layer.
- Inngest for durable analysis stages and retry orchestration.
- OpenAI official Node SDK.
- MediaPipe Tasks Vision and Web Audio in browser workers.
- TanStack Query for polling/mutations around session processing.
- Vitest, Testing Library, MSW, and Playwright.
- Vercel deployment; optional Sentry monitoring.

## Architecture

```text
Browser
  ├─ Next.js UI / route handlers
  ├─ MediaRecorder: audio-only + replay video
  ├─ Web Audio samples
  └─ MediaPipe worker -> local visual samples + selected JPEG frames
          │
          ▼
Supabase private Storage + Postgres session row
          │ event
          ▼
Inngest workflow
  1. validate/finalize media metadata
  2. transcribe audio with word timestamps
  3. calculate deterministic metrics
  4. evaluate transcript + metrics + selected frames
  5. validate evidence and aggregate scores
  6. persist immutable analysis and recommendations
          │
          ▼
Results / History / Progress
```

## Project structure

```text
app/                    Next.js routes and layouts
components/             reusable UI and product components
features/               vertical product features
lib/                    environment, auth, storage, analytics, utilities
lib/scoring/            pure scoring and transcript metric functions
lib/ai/                 OpenAI schemas, prompts, and provider adapter
lib/media/              browser capture and analysis helpers
lib/db/                 typed queries and ownership boundaries
inngest/                durable functions and stage orchestration
supabase/migrations/    schema, indexes, RLS, retention jobs
tests/                  fixtures, integration, and E2E support
public/                 local static assets and labeled demo fixtures
```

## Data flow

1. Browser creates an authenticated or anonymous Supabase identity.
2. Setup creates a draft session owned by that identity.
3. Browser records a compact audio-only WebM and lower-bitrate replay video simultaneously.
4. Local signal summaries and selected JPEG frames are generated without rendering metrics live.
5. Signed uploads write media into owner-prefixed private storage paths.
6. `complete-upload` validates ownership, MIME, size, and metadata, changes status to queued, and emits an Inngest event.
7. Workflow writes each stage before/after processing. Idempotency key is session ID plus analysis version.
8. Transcript ingestion stores words/segments; pure functions produce deterministic metrics and evidence.
9. OpenAI returns strict structured semantic/visual results.
10. Evidence validation verifies transcript excerpts/ranges and known frame timestamps.
11. Aggregation uses the persisted rubric snapshot and stores an immutable result.
12. Client polls authorized session state and renders partial or complete results.

## Database schema

All owned tables include `id uuid`, `user_id uuid`, `created_at timestamptz`, and `updated_at timestamptz` where mutation is allowed.

### `profiles`

- `user_id` PK/FK auth.users
- `display_name`, `goal`, `experience_level`, `preferred_mode`
- `target_wpm`, `weekly_session_goal`, `onboarding_completed_at`
- `guest_expires_at`, `media_retention_days`

### `trigger_words`

- normalized unique `(user_id, phrase)`
- display phrase and enabled flag

### `practice_prompts`

- curated stable slug, mode, category, difficulty, prompt text, active flag
- system prompts have null owner; custom prompt text is copied to sessions rather than globally shared

### `practice_sessions`

- owner, prompt snapshot, optional curated prompt ID
- mode, category, difficulty, target/preparation seconds, target WPM
- video enabled, recording duration, speaking duration
- status enum: draft, recording, uploading, queued, transcribing, measuring, evaluating, finalizing, completed, partial, incomplete, failed, deleted
- current stage, failure code/message, retry count
- rubric version, active analysis version, completed timestamp
- sample flag is never set on user-owned sessions

### `recordings`

- session FK cascade
- audio/video object paths, MIME, bytes, duration, checksums
- capture capabilities and media quality metadata
- expires_at and deleted_at

### `transcripts`

- session/version unique, text, provider/model, language, confidence, source hash

### `transcript_segments`

- transcript FK cascade, ordinal, start/end milliseconds, text, confidence
- word-level timing stored as validated JSONB for efficient initial release retrieval

### `analysis_results`

- session/version unique, rubric version, prompt version, model ID
- overall/category scores, confidence summary, missing metrics
- threshold snapshot and aggregation metadata JSONB
- immutable created timestamp

### `metric_results`

- analysis FK cascade, metric key, category, numeric/text value, unit
- score, confidence, available flag, unavailable reason
- threshold/evidence JSONB

### `feedback_items`

- analysis FK cascade, type, category, priority, title, explanation, action
- evidence references JSONB

### `visual_samples`

- session FK cascade, timestamp, local confidence, derived measurements
- optional private sampled-frame object path and expiry

### `practice_recommendations`

- user, source analysis, skill key, priority, exercise/prompt configuration, completed timestamp

### `product_events`

- user/session nullable, event name, categorical properties, timestamp
- never stores prompt, transcript, trigger, media, or frame content

### `rubric_versions`

- immutable version, compatibility major, published timestamp, definition JSONB

## Ownership and deletion

- RLS requires `auth.uid() = user_id` for every owned row.
- Storage paths begin with user ID and use matching private-bucket policies.
- Service-role access is limited to server handlers and durable workers.
- Session deletion uses a server-side transaction plus idempotent storage cleanup.
- Account deletion queues owned storage cleanup, deletes owned rows, then deletes auth identity.
- Media-only deletion removes storage objects and recording paths while retaining results.
- Retention job deletes account media and sampled frames at 30 days; all guest data expires at seven days.

## APIs and server actions

- `POST /api/sessions` create an authorized session and return limited signed upload targets.
- `POST /api/sessions/:id/complete-upload` validate derived metadata and queue workflow.
- `GET /api/sessions/:id/status` return authorized stage and failure state.
- `POST /api/sessions/:id/retry` retry eligible failed/partial stage.
- `GET /api/sessions/:id/media` issue short-lived signed playback URLs.
- `DELETE /api/sessions/:id/media` delete recording only.
- `DELETE /api/sessions/:id` cascade-delete session.
- `DELETE /api/account` cascade-delete account.
- Inngest serve route exposes signed workflow handlers.

All inputs and outputs use Zod schemas. Mutation handlers verify the authenticated owner independently of client-provided IDs.

## Recording and browser processing

- Request microphone and optional front camera after explanatory UI.
- Record separate audio-only and replay video blobs to keep transcription uploads under 25 MB.
- Prefer WebM/Opus and capability-detect alternatives.
- Enforce client and server size limits; ten-minute hard stop.
- Web Audio samples RMS and clipping at a bounded rate; the server derives vocal-variation evidence from those samples.
- MediaPipe samples face presence, conservative head orientation, and framing locally and retains derived measurements.
- Select target-duration-aware interval JPEGs plus bounded looking-away event frames, maximum 48.
- Never render coaching metrics live.

## AI integration

### Transcription

- `whisper-1` verbose output with word-level timestamps.
- English language hint and bounded prompt keywords from trigger words.
- Validate timestamps are monotonic and inside recording duration.

### Structured evaluator

- `gpt-5.6-sol` via Responses API with strict JSON Schema.
- Input: versioned rubric instructions, mode/difficulty, prompt, transcript with ranges, deterministic summaries, and timestamped sampled images.
- Output dimensions include score, confidence, explanation, evidence, strength, weakness, recommendation, and unable reason.
- One evaluator request per analysis version; the user can retry eligible partial/failed analysis up to three times.
- Set `store: false` where supported and send a privacy-preserving safety identifier.
- Prompt and schema remain server-side.

### Failure behavior

- Transcription failure leaves queued media retryable.
- Deterministic analysis failure marks failed with safe error code.
- Evaluator failure creates partial results from deterministic metrics.
- Evidence validation failure retries once, then omits invalid AI dimensions.
- No new offline analysis fallback; labeled sample results remain viewable.

## State management

- Server Components fetch initial authenticated data.
- TanStack Query handles status polling and mutations.
- Recording state and `MediaStream` objects remain feature-local and are explicitly cleaned up when the studio unmounts.
- URL state owns history filters and results tabs.
- No sensitive media blobs enter persistent browser storage.

## Security

- Secrets are server-only and validated at startup/use boundaries.
- Apply process-local throttles to magic-link and guest creation by edge-provided address, and session creation by authenticated user. Production also requires Vercel Firewall/rate rules because serverless instances do not share memory.
- Accept only allowlisted audio/video/image MIME types and bounded sizes.
- Generate upload paths server-side.
- Sanitize rendered user text through React escaping; never render model HTML.
- Use CSP, secure headers, same-site cookies, and origin checks.
- Redact provider payloads and sensitive fields from logs and monitoring.
- Test object-level authorization and destructive ownership paths.

## Environment variables

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
SENTRY_DSN                 optional
NEXT_PUBLIC_SENTRY_DSN     optional
```

## Deployment

- Vercel project `pulse-speaking-coach`.
- Supabase project with migrations, private buckets, email auth URLs, and retention schedule.
- Inngest application connected to the deployed serve endpoint.
- OpenAI project-scoped key stored only in Vercel/Inngest secrets.
- Generated Vercel production URL; no custom domain requirement.

## Observability

- Structured stage logs with session ID, stage, duration, retry, and safe error code.
- Never log transcript or media/frame content.
- First-party funnel and reliability events.
- Sentry captures sanitized client/server exceptions when configured.
- Health route verifies application configuration without revealing values.

## Testing strategy

- Unit: tokenization, WPM, fillers, pauses, triggers, repetition, bands, aggregation, missing data, rubric compatibility, schemas.
- Integration: auth ownership, session creation, upload metadata, transcript ingestion, persistence, retry, signed playback, deletion, retention.
- E2E: guest/auth onboarding, prompt/setup, fixture recording, processing, results, transcript seek, progress, history reopen, deletion.
- Failure E2E: denied/missing devices, silence, short recording, transcription failure, evaluator failure, refresh, slow response, empty state, long transcript.
- Visual/accessibility: keyboard, focus, reduced motion, console/network, and approved viewport matrix.

## Future hardware boundary

Analysis may emit a typed `CoachingSignal` domain event containing `sessionId`, `timestampMs`, `kind`, `severity`, `evidenceId`, and `rubricVersion`. No live signal producer, device gateway, Bluetooth UI, firmware, or haptic behavior is implemented in this release.
