# Pulse Product Specification

Status: Approved for implementation on 2026-08-05
Release: Closed beta
Product owner: Pulse team

## Product vision

Pulse helps people improve public speaking through private practice, observable delivery measurements, evidence-linked feedback, and a clear next exercise. It is a practice product, not an emotion detector, clinical tool, or generic AI dashboard.

## Product principles

1. Evidence before judgment: every score and recommendation links to a calculation, transcript passage, audio range, or sampled frame.
2. One useful next step: results prioritize a main action and one supporting action.
3. Honest measurement: unavailable or unreliable signals never silently lower a score.
4. Focus while speaking: the studio shows only the prompt, timing, recording state, waveform, and camera preview.
5. Privacy by default: sessions are private, consent is explicit, retention is finite, and deletion is accessible.
6. Cohesion over breadth: four presets use one practice and analysis system.

## Target users

The primary audience is a general English-speaking learner who wants to improve presentations, interviews, impromptu answers, or short pitches. Secondary audiences include students, professionals, candidates, and founders. The interface and rubric are accent-neutral and do not collect demographic data.

## Problems solved

- Speakers cannot identify recurring delivery habits from memory alone.
- Generic feedback lacks evidence and feels arbitrary.
- Dense live coaching distracts from the behavior being practiced.
- Scores without stable rubrics do not support meaningful progress.
- Video coaching products often overclaim emotion or body-language inference.

## Core use cases

1. Complete a prompted or custom practice session and receive feedback.
2. Inspect an insight at the exact transcript, audio, video, or timeline location that supports it.
3. Understand the highest-priority recurring weakness and launch a targeted next practice.
4. Review, compare, replay, or delete a prior session.
5. Practice as a temporary guest and preserve work by converting to an account.
6. Open a clearly labeled sample analysis when live provider access is unavailable.

## Core user flow

1. Landing page -> `Start practicing`.
2. Continue as guest or request an email magic link.
3. Complete onboarding: display name, goal, experience, preferred preset, pace target, trigger words, and consent acknowledgement.
4. Choose preset, topic, difficulty, prompt, duration, preparation time, and camera preference.
5. Pass microphone/camera preflight, review what is sent and stored, and enter preparation.
6. Complete the preparation timer and five-second recording countdown.
7. Record with prompt, elapsed/target timing, device state, camera preview, and restrained waveform.
8. Finish, or discard and restart. Recording cannot pause.
9. Upload media and create the session before analysis starts.
10. Observe named stages: saving, transcribing, measuring, evaluating, finalizing.
11. Review summary, score categories, evidence, transcript, timeline, playback, and recommendations.
12. Return through history or use the recommended next practice.

## Feature requirements

### Landing

- Explain the measurable practice loop in plain language.
- Show a real example of evidence-linked feedback without fake testimonials.
- Primary CTA starts guest/auth flow; secondary CTA opens the labeled sample.
- State that audio and optional video may be processed by third-party AI.

### Authentication and guest mode

- Supabase email magic-link authentication.
- Anonymous guest identity valid for seven days.
- Guest-to-account conversion retains owned sessions.
- Session and media authorization enforced server-side and by row-level security.
- Expired guest identities and owned data cascade-delete.

### Onboarding

- Required: speaking goal, experience level, preferred preset, target WPM.
- Optional: display name and comma/newline-separated trigger words.
- Defaults: general improvement, beginner, impromptu, 140 WPM.
- Explain camera and microphone use before browser permission prompts.
- Onboarding can be edited in settings.

### Prompts and presets

- Presets: Impromptu, Interview, Presentation, Elevator Pitch.
- Categories: Work and Leadership, Personal Stories, Ideas and Opinions, Everyday Life, Creative and Playful.
- Difficulties: Beginner, Intermediate, Advanced.
- Ship 60 curated prompts: one for every preset/category/difficulty combination.
- Random selection avoids completed prompts within the active filter until exhausted.
- Custom prompt text is limited to 1,000 characters and stored with the session.
- No AI prompt generation, favorites, uploads, or follow-up questions in this release.

### Practice setup

- Duration choices: 1, 2, 3, and 5 minutes; default 2; hard maximum 10.
- Preparation choices: off, 15, 30, and 60 seconds; default 30.
- Video recommended but optional.
- Show selected target metrics without allowing rubric-weight editing.
- Display estimated media retention and processing behavior.

### Device preflight

- Explain permission rationale before requesting access.
- Independently report microphone and camera readiness.
- Show microphone input activity and a camera preview.
- Permit audio-only continuation if the camera is denied or absent.
- Block recording when the microphone is denied, absent, or silent.
- Provide browser-specific recovery instructions.

### Recording studio

- Preparation timer followed by a five-second countdown.
- Prominent recording state with screen-reader announcements.
- Prompt remains visible.
- Timer includes elapsed time, target marker, overtime state, and ten-minute hard stop.
- Show camera preview, restrained waveform, and device state only.
- Controls: finish and discard/restart. No pause/resume.
- Confirm destructive discard and accidental navigation.
- Maintain local capture until safe upload confirmation.

### Processing

- Create a durable session row before provider processing.
- Persist each processing stage and failure reason.
- Retry transient stages with bounded attempts.
- Preserve completed deterministic outputs if semantic evaluation fails.
- Refreshing or reopening routes back to current session status.
- Never show invented percentages; show named stages.
- Recordings under 10 seconds, below 20 transcribed words, or effectively silent are incomplete and unscored.

### Results

- Immediate summary: overall score, strongest dimension, priority improvement, main action.
- Five category scores with target comparison, previous compatible comparison, explanation, confidence, and evidence.
- Explain when overall/category scores were reweighted for missing data.
- Timestamped transcript with click-to-seek behavior.
- Highlights: fillers, repeated words/phrases, pauses, pace segments, trigger words, and AI evidence.
- Search/filter controls only when they materially reduce transcript scanning.
- Timeline displays pace, pauses, filler/trigger events, looking-away events, and AI frame evidence.
- Audio/video playback uses private signed URLs.
- Recommendations: one priority, one supporting action, up to three strengths.
- Every recommendation explains evidence, importance, and how to practice.

### History

- List prior sessions with date, prompt, preset, duration, status, score, and rubric version.
- Filter by preset and status; sort newest, oldest, and score.
- Reopen completed, partial, processing, failed, and incomplete sessions.
- Automatically compare with the most recent compatible session.
- Delete a session with explicit confirmation and cascade behavior.
- Delete media alone while preserving transcript-derived results.

### Dashboard and progress

- Lead with recurring priority skill and next recommended practice.
- Show weekly goal, sessions, speaking minutes, recent sessions, and strongest improvement.
- Charts: overall/category scores, filler rate, pace versus target, pause rhythm, camera engagement, confident delivery, and weekly frequency.
- Ranges: 7 days, 30 days, and all time.
- Trends require three sessions with the same rubric version and compatible preset.
- Personal baseline is the median of the first three valid compatible sessions.
- Recommendation uses the highest-impact recurring weakness across up to three compatible sessions.
- No claims of significance and no daily streak pressure.

### Settings and privacy

- Edit profile, goal, experience, preferred preset, target WPM, weekly target, and trigger words.
- Explain active media/transcript retention and third-party processors.
- Delete media, individual sessions, or the account.
- Show scoring rubric version and provider limitations.
- Appearance controls, notifications, exports, and sharing are deferred.

### Sample data

- Provide a clearly labeled sample session and six labeled historical sample summaries.
- Sample records must never be attached to or presented as the current user's practice.
- Sample results remain readable when live AI is unavailable.
- A seed/reset command restores deterministic demo data.

## Screen inventory

1. Landing
2. Authentication/guest entry
3. Onboarding
4. Dashboard
5. Practice setup and prompt picker
6. Device preflight
7. Preparation/countdown
8. Recording studio
9. Processing
10. Results: overview, evidence/transcript, timeline
11. History
12. Settings/privacy
13. Labeled sample results
14. Not found and unauthorized states

## State requirements

### Empty

- New dashboard explains that three compatible sessions establish a baseline.
- Empty history offers `Start a practice` and `View sample analysis`.
- Filters with no matches retain filters and offer a reset.

### Loading

- Route-level skeletons preserve final layout dimensions.
- Media loading is distinct from analysis loading.
- Charts identify insufficient data rather than drawing invented lines.

### Errors

- Permission denied: device-specific steps and retry.
- Missing microphone: block recording and link to setup.
- Upload failure: retain local blob for same-tab retry where browser permits.
- Transcription failure: retain session/media and retry transcription.
- Evaluation failure: show objective results and retry semantic evaluation.
- Expired signed media URL: refresh it without losing playback position.
- Unauthorized/not found: reveal no ownership details.

## Permissions and privacy

- Ask for microphone/camera only immediately before preflight.
- State what is recorded, uploaded, stored, sent to OpenAI, retained, and deleted.
- Complete video remains in Pulse storage; only selected frames are sent for AI evaluation.
- OpenAI API data is not used for training by default; default abuse-monitoring retention may be up to 30 days.
- Never log media, full transcripts, magic links, access tokens, or evaluator prompts.
- All media buckets are private.

## Accessibility

- Target WCAG 2.2 AA.
- Complete keyboard navigation and visible focus.
- Semantic headings, landmarks, dialogs, forms, and errors.
- Live-region announcements for countdown, recording, upload, and processing state.
- Captions/transcript access for recorded speech.
- Touch targets at least 44 by 44 CSS pixels.
- Status is never communicated by color alone.
- Respect `prefers-reduced-motion`.
- Charts include textual summaries and accessible labels.

## Analytics events

Analytics contains identifiers and categorical metadata only, never prompt text, transcript text, media, frame content, or trigger words.

- `landing_cta_clicked`
- `auth_started`, `auth_completed`, `guest_started`, `guest_converted`
- `onboarding_completed`
- `practice_setup_completed`
- `permission_requested`, `permission_result`
- `recording_started`, `recording_restarted`, `recording_completed`
- `upload_completed`, `analysis_stage_changed`, `analysis_failed`, `analysis_completed`
- `results_tab_viewed`, `evidence_seeked`
- `recommendation_started`
- `history_filtered`, `session_reopened`
- `media_deleted`, `session_deleted`, `account_deleted`
- `sample_viewed`

## Explicitly out of scope

- Live transcript, live delivery metrics, and live coaching.
- Wristband, BLE, firmware, device configuration, and haptic controls.
- Emotion, personality, honesty, attractiveness, or accent scoring.
- Generic body-language quality claims.
- AI-generated prompts, favorites, script uploads, and follow-up questions.
- Pause/resume, multiple saved takes, and collaboration.
- Sharing, exports, public profiles, teams, payments, notifications, badges, and daily streaks.
- Multilingual rubrics, native apps, dark mode, arbitrary comparisons, and offline analysis of new sessions.

## Acceptance criteria

- A guest and signed-in user can complete the approved end-to-end flow.
- Real media, transcription, deterministic metrics, structured evaluation, persistence, history, progress, and deletion work.
- Every score is reproducible from a stored rubric snapshot and evidence.
- Low-confidence data cannot silently reduce a score.
- Processing is durable across refresh and supports bounded retries.
- Authorization prevents cross-user reads, writes, signed media access, and deletion.
- Empty, loading, permission, incomplete, partial, failure, and deletion states are present.
- Critical unit, integration, and end-to-end suites pass.
- UI is inspected at 375x667, 430x932, 768x1024, 1440x900, and 1920x1080.
- Lint, type checking, tests, and production build pass without major console errors.
