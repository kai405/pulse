# Pulse: Practice-to-Live Haptic Speaking Coach

Status: Proposed product direction; documentation only
Event milestone: Cursor Miami Hackathon — August 6, 2026
Release target: Hackathon vertical slice, followed by a private beta
Product owner: Pulse team

## 1. Executive summary

**Pulse helps a speaker discover a habit in practice, choose how they want to be coached, and receive a private wrist pulse when that behavior occurs during a live talk.**

The product has two connected applications:

1. **Practice** records a rehearsal and returns evidence-linked feedback on delivery, fluency, structure, visual presence, and observable confident delivery.
2. **Live** turns a small set of user-confirmed, real-time-detectable practice insights into distinct wristband cues so the speaker can correct course without looking at a screen.

The closed loop is the product:

```text
Practice → find evidence → choose one coachable habit → calibrate a cue
         → speak live → feel the cue → review → practice again
```

This PRD proposes an expansion of the current closed-beta practice product. Until this direction is approved for implementation, `PRODUCT_SPEC.md`, `SCORING_SPEC.md`, and `TECHNICAL_DESIGN.md` remain the authority for the existing app. No wristband or live-mode implementation is authorized by this document alone.

## 2. Problem and opportunity

Speakers often recognize a problem only after a presentation: they rushed, lost eye contact, wandered out of frame, or missed the close. Practice tools can reveal these habits, but the insight disappears at the exact moment it would be most useful. A phone or dashboard is the wrong interface during a speech because checking it breaks presence.

Pulse can bridge rehearsal and performance. It already produces private, evidence-based practice feedback; a lightweight wristband can deliver a quiet, explainable cue during the corresponding live behavior. The opportunity is not “AI that judges everything in real time.” It is a trusted transfer system for a few behaviors the user deliberately chose to improve.

Evidence status: this problem framing comes from the current Pulse product thesis and hackathon brief, not completed user research. The first 10 usability sessions must test whether speakers understand, trust, and act on private cues without feeling distracted.

## 3. Goals

- Let a user turn eligible practice evidence into a tested, user-confirmed live plan in under two minutes.
- Deliver at least 95% of local haptic commands with acknowledgement within the latency target.
- Make every cue understandable: at least 90% of wearers correctly identify selected patterns after calibration.
- Close the improvement loop by connecting every live debrief to a specific next practice.
- Communicate the full practice-to-live value proposition in a reliable 90-second hackathon demo.

## 4. Product principles

1. **The speaker stays in control.** Pulse may suggest a live rule, but the user chooses, edits, tests, and confirms it.
2. **One pulse, one known meaning.** Every vibration maps to a visible rule and a clear corrective action.
3. **Deterministic in the moment.** AI may help explain practice results or translate intent into a bounded plan; validated rules decide whether to vibrate.
4. **Coach less, better.** Live mode permits at most three active rules, with debounce and cooldowns to prevent overload.
5. **Observable behavior only.** Pulse does not infer emotion, personality, anxiety, honesty, attention, attractiveness, disability, or intent.
6. **Private by default.** Live sensing is processed locally where practical, and live media is not recorded or retained by default.
7. **Evidence over scores.** Practice feedback links to evidence; live events link to the exact rule, detection, command, and device acknowledgement.

## 5. Users and user stories

Primary users are students, professionals, interview candidates, founders, and presenters preparing for a short English-language speaking moment.

- As a practicing speaker, I want evidence of my highest-impact recurring habit so that I know what to improve.
- As a speaker preparing to go live, I want to choose and test a cue myself so that its meaning is predictable.
- As a live speaker, I want a private nudge when my selected behavior occurs so that I can correct without looking away from the audience.
- As a speaker after a talk, I want a factual cue history and next exercise so that the live experience improves my next practice.
- As a privacy-conscious user, I want live sensing to avoid recording by default so that coaching does not become surveillance.

The hackathon operator or coach is a supporting persona who can view connection state and the event log, but cannot secretly change rules or send unlabeled cues once a session begins.

## 6. Product vocabulary

| Term | Meaning |
| --- | --- |
| Practice insight | Evidence-backed observation from a recorded rehearsal. |
| Live trigger | A user-confirmed condition that can be detected reliably during a talk. |
| Cue | The corrective meaning the speaker assigns to a trigger. |
| Haptic pattern | The physical pulse cadence used to communicate that cue. |
| Coaching plan | Up to three trigger/cue rules plus timing, thresholds, and cooldowns. |
| Tracked phrase | A word or phrase highlighted in post-practice analysis; this avoids confusing the current “trigger words” feature with live triggers. |

Not every insight can become a live trigger. Structure, relevance, clarity, and other semantic judgments remain post-session feedback until they can be measured with acceptable latency and reliability.

## 7. Experience A — Practice application

The current practice experience remains the foundation:

1. Enter as a guest or by email magic link; set speaking goal, experience, preferred mode, pace target, and consent.
2. Choose Impromptu, Interview, Presentation, or Elevator Pitch; select a curated/custom prompt, difficulty, duration, preparation time, and optional camera.
3. Pass microphone/camera preflight, prepare, and record in a deliberately quiet studio UI.
4. Observe honest processing stages, then receive an overall summary, five category scores, transcript/timeline evidence, playback, strengths, and one priority next action.
5. Revisit sessions through history and track compatible progress without false statistical claims.

### New practice-to-live bridge

Eligible result cards gain **Use as a live cue**. Selecting it opens a plan builder that shows:

- the practice evidence that motivated the suggestion;
- what Pulse can detect live and what it cannot;
- a recommended condition and conservative threshold;
- the haptic meaning, cooldown, and expected corrective action;
- a wristband test before the rule can be saved.

For the hackathon release, the bridge supports these mappings:

| Practice evidence | Live condition | Default cue | Scope |
| --- | --- | --- | --- |
| Duration adherence or weak close | Selected time checkpoint / session end | Short pulse / success pattern | P0 |
| Sustained camera disengagement | Face absent for 2 seconds | Double pulse: re-engage | P0 |
| Framing or position drift | Outside a calibrated presentation zone for 1.5 seconds | Long pulse: recenter | P1 if stable |
| Pace outside personal target | Outside target band for a sustained window | Slow down / move forward | Later validation |
| Long silence or filler burst | Threshold within a rolling window | Reset / pause deliberately | Later validation |

The user may start with a recommended rule, edit supported thresholds, or decline it. Pulse never converts a low-confidence or unsupported insight into a live rule.

## 8. Experience B — Live speaking application

### Setup and calibration

The user starts Live mode from a saved coaching plan or an eligible practice result. Before speaking, Pulse must:

1. connect to the wristband and show transport, battery when available, and acknowledgement state;
2. play every selected pattern and require the wearer to confirm that each is distinct and comfortable;
3. check the sensors required by the plan and disable rules whose sensor is unavailable;
4. calibrate a presentation zone when that rule is enabled;
5. show the complete plan in plain language and require final confirmation.

The hackathon hardware target is an ESP32, DRV2605L driver, and vibration motor. USB serial is the reliable primary transport; BLE is a presentation-quality enhancement only after the wired path is dependable.

### During the talk

The speaker should not need to watch Pulse. The companion dashboard is for setup, an operator, or a projected hackathon explanation and shows only:

- session timer and running/paused/stopped state;
- device and required-sensor status;
- confirmed rule cards and current deterministic state;
- a timestamped event trail: condition detected, command sent, device acknowledged, condition cleared.

When a condition remains true for its threshold and is outside its cooldown, Pulse sends exactly one mapped pattern. A cue is never logged as delivered without a device acknowledgement. Rules use smoothing, hysteresis, and a default 10-second per-rule cooldown; the user can stop all cues immediately.

Default hackathon haptic language:

| Pattern | Meaning | Motor output |
| --- | --- | --- |
| Short | Time checkpoint | 180 ms |
| Double | Re-engage | Two 120 ms pulses, 150 ms apart |
| Long | Recenter | 600 ms |
| Success | Session complete | Three 90 ms pulses |

### Live debrief

At the end, Pulse shows trigger count, cue acknowledgements, delivery latency, and—where objectively measurable—time until the condition cleared. It does not generate a new overall speaking score from incomplete live data. The debrief recommends either repeating the same cue plan or launching a targeted practice session.

Live video and audio are not stored by default. If future users explicitly choose a recorded live analysis, it must use the same consent, retention, private storage, evidence, and deletion guarantees as Practice.

## 9. Requirements and acceptance criteria

### Must-have (P0)

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| P0-1 | Preserve the complete existing practice journey. | A guest or signed-in user can record, analyze, inspect evidence, revisit, and delete a practice session. |
| P0-2 | Convert eligible evidence into a user-confirmed plan. | A result can prefill a supported rule; its source evidence, threshold, cue, and limitations are visible before save. |
| P0-3 | Enforce a bounded coaching plan. | No more than three enabled rules; unsupported rule types and conflicting haptic meanings cannot start a session. |
| P0-4 | Calibrate the wristband and required sensors. | Live mode remains blocked until the device acknowledges a test and every enabled rule reports ready. |
| P0-5 | Run timer and one stable visual rule deterministically. | A checkpoint and sustained face-absence event each fire once at threshold and not again during cooldown. |
| P0-6 | Deliver and prove a haptic cue. | The dashboard distinguishes detection, command, acknowledgement, timeout, and cleared state; it never claims an unacknowledged vibration. |
| P0-7 | Fail safely. | Disconnect, denied camera, poor tracking, or hardware timeout disables affected cues, explains recovery, and never fabricates events. |
| P0-8 | Protect focus, privacy, and accessibility. | No live score or dense speaker-facing analytics; no live media retained by default; status is available through text and not color/haptics alone. |
| P0-9 | Close the learning loop. | Ending Live mode produces a factual event debrief and a direct path to the relevant next practice. |

### Nice-to-have (P1)

- Calibrated presentation-zone rule after reliable venue testing.
- Stable BLE connection with USB serial fallback.
- Personal threshold suggestions derived from multiple compatible practices.
- Correction-time summaries for visual rules.
- Saved coaching-plan templates for interview, pitch, and presentation contexts.

### Future considerations (P2)

- Low-latency pace, silence, and filler triggers after accuracy and distraction testing.
- Optional recorded live analysis with explicit consent.
- Native/mobile device gateway, firmware updates, multiple wearable form factors, and coach-assisted plans.
- Multilingual transcription and rubrics after language-specific validation.

### End-to-end acceptance scenarios

1. **Given** a completed practice with eligible camera-engagement evidence, **when** the user chooses Use as a live cue, **then** Pulse creates an editable face-absence rule and displays the supporting evidence.
2. **Given** a confirmed plan and connected device, **when** a condition stays true past its threshold, **then** exactly one mapped pattern is sent and acknowledged within the latency target.
3. **Given** a noisy signal near a boundary, **when** it flickers without meeting duration and hysteresis requirements, **then** no cue fires.
4. **Given** a device disconnect, **when** a trigger occurs, **then** Pulse records a delivery failure—not a vibration—and offers reconnect and retest.
5. **Given** camera permission is denied, **when** the plan requires a visual rule, **then** that rule cannot silently run; timer-only mode remains available.
6. **Given** the user ends a live talk, **when** the debrief opens, **then** no live recording exists unless the user explicitly opted in before the session.

## 10. Success metrics

Targets are initial hypotheses because the live product has no baseline; review them after the first 10 usability sessions.

| Outcome | Success threshold | Measurement |
| --- | ---: | --- |
| Hackathon reliability | 3 consecutive end-to-end demos without manual repair | Rehearsal checklist |
| Cue delivery | ≥95% of sent commands acknowledged; p95 acknowledgement within 500 ms on the local transport | Local event timestamps |
| Cue comprehension | ≥90% of wearers identify every selected pattern after calibration | Pre-session confirmation test |
| Signal quality | ≤1 false visual cue in a five-minute controlled talk | Reviewed rule/event log |
| Useful correction | ≥70% of eligible visual events clear within five seconds after an acknowledged cue | Detection and cleared timestamps |
| Practice-to-live activation | ≥60% of beta users who complete three practices save or start a live plan | Privacy-safe funnel events |
| Trust | ≥80% report that cues felt understandable and not distracting | One-question post-session survey |
| Privacy | 0 live media objects stored without explicit opt-in | Storage audit |

Analytics may include categorical mode, rule IDs/types, timestamps, latency, readiness, and error codes. It must not include media, transcript/prompt text, tracked phrases, frame content, or secrets.

## 11. Non-goals

- Real-time semantic critique, arbitrary prompt-generated capabilities, or an always-on AI agent.
- Emotion, personality, honesty, confidence-as-an-internal-state, accent, medical, diagnostic, safety, navigation, or accessibility claims.
- Hidden operator cues, continuous surveillance, or storing live camera/audio by default.
- More than three simultaneous rules, complex custom vibration composition, or gamified cue volume.
- Collaboration, sharing, payments, teams, public profiles, or a general wearable marketplace for the hackathon release.

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| False cues reduce trust | Allowlisted deterministic rules, explicit thresholds, calibration, confidence gates, hysteresis, and visible evidence. |
| Cues distract the speaker | Maximum three rules, fixed distinguishable patterns, comfort test, cooldowns, and instant stop. |
| Hardware fails in the venue | Prove USB serial first, require acknowledgements, carry spare motor/cable/power, and keep a backup demo video. |
| Camera tracking degrades | Bright preflight, local reliability check, disable unreliable visual rules, retain timer-only mode. |
| Product overclaims “AI” | Use AI only for bounded suggestion/translation; show the validated plan and deterministic event reason. |
| Practice and live vocabularies collide | Rename existing “trigger words” in user-facing copy to tracked phrases; reserve trigger for live rule conditions. |

## 13. Release plan and decisions

### Hackathon vertical slice — August 6, 2026

Ship one undeniable loop: complete or open a practice result, turn a timing or camera-engagement insight into a confirmed plan, test the wristband, trigger a real pulse during a short live pitch, and show the acknowledged event plus factual debrief.

Locked scope decisions:

- USB serial is primary; BLE is a stretch goal.
- Timer plus sustained face absence are P0; presentation zone is the first cut.
- The wristband is an output device, not a camera or inference device.
- Live sensing is local and live media is not stored by default.
- A working pulse, an explainable reason, and an acknowledgement are never cut.

### Private beta

Harden reconnection and BLE, test cue comprehension and false positives with real speakers, add presentation-zone calibration, persist user-approved coaching plans, and tune thresholds from compatible practice history.

### Later

Only add pace, pause, or filler cues after low-latency accuracy, privacy, and speaker-distraction studies meet explicit launch thresholds. Keep semantic feedback in Practice until it can be both timely and defensible.

## 14. Open questions before implementation

| Question | Owner | Blocking? | Recommended default |
| --- | --- | --- | --- |
| Which exact ESP32/driver/motor assembly will be used at the event? | Hardware | Yes | Existing ESP32 + DRV2605L + coin motor plan. |
| Can the selected browser reliably access serial on the demo laptop? | Engineering | Yes | Current Chrome with USB serial; verify before UI work. |
| What event schedule defines the final code-freeze and demo length? | Team | Yes | Optimize for the existing 90-second demo. |
| Should private beta persist live event logs across devices? | Product/privacy | No | Store locally per session until users demonstrate value. |
| When is a practice-derived threshold sufficiently personalized? | Product/data | No | Require three compatible sessions; use conservative defaults before then. |

## 15. Definition of done

Pulse is ready for the hackathon demo when a new viewer can understand the product in one sentence, a speaker can move from practice evidence to a confirmed cue without explanation, the wristband performs the correct physical pulse for a real trigger, the dashboard proves why and whether it was delivered, privacy claims match actual behavior, and the full loop succeeds three times consecutively.
