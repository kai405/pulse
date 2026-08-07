# Pulse

Record a practice speech and get private, evidence-linked feedback that shows what to improve and exactly where it happened.

## Problem

People preparing for presentations, interviews, impromptu answers, and short pitches struggle to notice recurring speaking habits from memory alone. Today they rehearse without feedback, ask someone else to watch, or use tools that return generic scores without showing the evidence behind them.

## Solution

Pulse guides a speaker from a prompt through a timed browser recording to private post-session analysis. It combines word-timestamped transcription and deterministic delivery measurements with structured AI feedback, then links every score and recommendation to transcript, audio, or video evidence. Pulse ends with one prioritized improvement and a concrete next exercise, while marking missing or unreliable signals as unavailable instead of scoring them as zero.

## Core features (V1)

- Guest or email magic-link entry, lightweight onboarding, and setup across Impromptu, Interview, Presentation, and Elevator Pitch modes with curated or custom prompts.
- Microphone/camera preflight and a focused timed recording studio; audio is required and video is optional.
- Durable post-session processing that combines timestamped transcription, deterministic metrics, and structured AI evaluation with honest stages and retryable failures.
- Evidence-rich results with versioned overall and category scores, timestamped transcript and timeline, private playback, and one recommended next practice.
- Private session history and progress, media/session/account deletion controls, and a clearly labeled sample analysis when live integrations are unavailable.

## Out of scope

- Live transcription, live analytics, or coaching during a recording.
- Wristbands, Bluetooth, firmware, haptics, or other hardware controls.
- Emotion, personality, honesty, attractiveness, or accent scoring.
- Sharing, collaboration, public profiles, teams, payments, notifications, exports, or gamified streaks.
- Native apps, multilingual scoring, AI-generated prompts, script uploads, multiple saved takes, or offline analysis of new sessions.

## Success criteria

In a three-minute live demo, a judge can enter as a guest, choose an impromptu prompt, record a response of at least 20 words with optional video, and reach a private result showing a score, timestamped supporting evidence, and one actionable next exercise. Clicking an evidence item seeks to the matching transcript or media moment, and no unavailable signal is presented as a poor score.

## Tech stack

Next.js 16, React 19, strict TypeScript, Tailwind CSS, Supabase Auth/Postgres/private Storage, Inngest, OpenAI, MediaPipe/Web Audio, and Vercel.

This was submitted before 6:30 P.M on August 6 and rocks!
