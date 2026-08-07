# Pulse Implementation Plan

Status: Approved
Deadline target: 2026-08-06 23:59 America/New_York

## Milestone 1 — Governing specifications

Objective: turn approved decisions into durable product, scoring, technical, and repository rules.

Files/modules: `PRODUCT_SPEC.md`, `SCORING_SPEC.md`, `TECHNICAL_DESIGN.md`, `IMPLEMENTATION_PLAN.md`, `AGENTS.md`.

Dependencies: approved Final Decision Summary.

Acceptance:

- No material product placeholders remain.
- Legacy hardware documents remain preserved and are identified as superseded for this release.
- Architecture and scoring rules are testable.

Tests: documentation consistency review.

Risks: documentation can drift; implementation changes must update these files.

## Milestone 2 — Runnable foundation and design system

Objective: establish a deployable, typed application with representative screens and tests.

Files/modules: package configuration, Next.js app shell, global styles, components, environment validation, Supabase migrations/types, test configs.

Dependencies: Node 22, npm, hosted credentials for live integrations.

Acceptance:

- Landing, app shell, loading, not-found, and error surfaces render responsively.
- Design tokens, typography, focus, reduced motion, and component primitives are consistent.
- Environment has safe development handling without exposing secrets.
- Lint, type checking, unit smoke tests, and build pass.

Tests: component smoke/accessibility tests and production build.

Risks: dependency install/network; prefer justified, maintained packages.

## Milestone 3 — Practice setup and capture

Objective: a guest/user can configure and record a real session.

Files/modules: auth/guest, onboarding, prompt data, setup, device preflight, recording state machine, media/local signal utilities.

Dependencies: browser media APIs, Supabase identity/storage.

Acceptance:

- Approved presets, prompt taxonomy, durations, preparation, and custom prompts work.
- Microphone/camera permission and recovery states work.
- Audio/video recording, countdown, hard stop, finish, and restart work.
- Audio-only fallback and sensitive navigation guard work.

Tests: setup validation, state-machine unit tests, mocked-media integration, permission E2E.

Risks: MediaRecorder platform differences and camera model loading.

## Milestone 4 — Analysis and evidence-linked results

Objective: produce credible deterministic and semantic results from stored sessions.

Files/modules: scoring library, AI schemas/adapter, job workflow, status UI, results summary, transcript, timeline, media playback.

Dependencies: OpenAI, Inngest, Supabase media/data.

Acceptance:

- Objective metrics reproduce from timestamps and local signal samples.
- Structured evaluator is schema-validated and evidence-checked.
- Missing/low-confidence data reweights transparently.
- Partial failure preserves usable output and supports retry.
- Results link insights to transcript/frame/timeline evidence.

Tests: required scoring units, schema fixtures, workflow integration, results E2E, provider failures.

Risks: provider latency, word-timestamp quality, image payload size, AI evidence mismatch.

## Milestone 5 — History, progress, settings, and privacy

Objective: make repeated practice useful and data controls trustworthy.

Files/modules: dashboard, charts, history filters, comparison, recommendations, settings, deletion/retention, seed/reset.

Dependencies: completed session schema and scoring outputs.

Acceptance:

- Real stored sessions drive dashboard and history.
- Baselines/trends obey compatibility and minimum-session rules.
- Session/media/account deletion enforces ownership and cascade semantics.
- Sample data is always labeled and separable from user data.
- Guest expiry and 30-day media retention jobs are idempotent.

Tests: trend/baseline units, authorization/deletion integration, critical history/progress E2E.

Risks: misleading small-sample trends and orphaned storage objects.

## Milestone 6 — Quality, deployment, and demo reliability

Objective: ship a cohesive, inspectable, demo-ready closed beta.

Files/modules: all product surfaces, deployment configuration, README/setup, monitoring, demo script/checklist.

Dependencies: all prior milestones.

Acceptance:

- Critical journey and approved failure cases pass.
- Keyboard, focus, contrast, live regions, and reduced motion are verified.
- Approved viewport matrix is visually inspected.
- Console/network issues and broken controls are resolved.
- Lint, type check, unit, integration, E2E, and production build pass.
- Local and deployment setup commands are accurate.

Tests: complete automated suite plus manual/visual inspection.

Risks: missing external credentials; complete boundaries and clearly report any live-provider block.
