# Pulse Repository Instructions

## Product authority

- `PRODUCT_SPEC.md`, `SCORING_SPEC.md`, and `TECHNICAL_DESIGN.md` govern the current closed beta.
- `docs/` contains legacy hardware-first hackathon material. Preserve it for history; do not treat it as current scope.
- Do not add live coaching, wristband UI, emotion/personality inference, sharing, billing, or unrelated breadth.

## Structure

- `app/`: Next.js routes and route handlers.
- `components/`: shared visual primitives and cross-feature components.
- `features/`: vertical product features and their local state.
- `lib/scoring/`: pure deterministic scoring; it must not import UI or provider clients.
- `lib/ai/`: server-only schemas, prompts, and provider adapters.
- `lib/media/`: browser capture and signal helpers.
- `lib/db/`: typed data access and ownership boundaries.
- `inngest/`: durable workflow definitions.
- `supabase/migrations/`: schema, indexes, RLS, and retention migrations.
- `tests/`: shared fixtures and integration/E2E support.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
npm run db:start
npm run db:reset
npm run seed
npm run demo:reset
npm run stress:http
npm run stress:supabase
```

## Code rules

- TypeScript is strict. Avoid `any`; validate unknown external data with Zod.
- Keep scoring deterministic and independently testable.
- Never ask an LLM to estimate transcript/timestamp facts.
- Keep server secrets, evaluator prompts, and service-role credentials out of client bundles.
- Server mutations must verify the authenticated owner even when RLS also applies.
- Never log recordings, frames, transcripts, magic links, tokens, or full provider payloads.
- Store rubric/model/prompt versions and evidence with every analysis.
- Missing or unreliable metrics are unavailable, never zero.
- Do not render user/model HTML. Use React-escaped text.
- Preserve user work in a dirty worktree and avoid destructive Git commands.

## Design-system rules

- `STYLESEED.md` is the bounded design lock; `.styleseed/effective-rules.md` is the compiled authority for implementation.
- Visual work uses `consumer-service × product-ui × education × dashboard × calm-consumer × editorial` and must preserve the evidence-rail signature.
- After changing the lock, run the StyleSeed resolver and read the regenerated effective bundle before editing UI.
- Major visual changes must score at least 85 and be verified from fresh 2× screenshots at narrow and wide viewports; record results in `STYLESEED_SCORE.md`.
- Use existing tokens for color, spacing, radius, border, shadow, and typography.
- Light-first warm neutral canvas, deep ink/navy structure, restrained coral accent.
- No generic purple AI gradients, glassmorphism, neon, fake testimonials, decorative charts, or card nesting without hierarchy.
- Use icons rather than emoji as primary controls.
- Support keyboard, visible focus, screen readers, reduced motion, non-color status, and 44px touch targets.
- Recording UI stays focused; do not add live analytics.
- Sample content must always be visibly labeled.

## Database workflow

- Add schema changes through ordered SQL migrations.
- Run local migrations/reset before integration tests.
- Regenerate database types after schema changes.
- Every owned table and private storage bucket requires explicit RLS tests.
- Deletion and retention jobs must be idempotent.

## Environment variables

- Copy `.env.example` to `.env.local`.
- Required for live analysis: Supabase public/server keys, OpenAI key, and Inngest keys.
- Sentry is optional and must degrade to a safe no-op.
- Never commit real credentials.

## Verification

- Run focused tests after each vertical milestone.
- Before completion run lint, type checking, all tests, and production build.
- Inspect landing, onboarding, setup, preflight, studio, processing, results, history, dashboard, settings, and failure/empty states.
- Inspect 375x667, 430x932, 768x1024, 1440x900, and 1920x1080.
- Check console, failed network requests, overflow, focus, dialogs, labels, and unintended layout shifts.

## Definition of done

- Approved end-to-end journey works with real integrations when credentials are configured.
- Demo fixtures are explicitly labeled and do not replace the real path.
- No important control is fake, no critical TODO remains, and setup documentation matches tested commands.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
