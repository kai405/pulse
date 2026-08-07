# Product specification

## Product statement

**Pulse is a private AI coach for moments when looking at a screen would be distracting.** It converts live visual context into simple haptic guidance.

The initial user is a person delivering a short pitch, presentation, interview response, or rehearsal. They need feedback without interrupting eye contact or breaking their flow.

## The problem

Most coaching feedback arrives before or after the moment it matters. A presenter cannot read a dashboard while speaking, and a visible notification makes them look less present. They need a quiet nudge, not another screen.

## The MVP experience

1. The user connects a wristband and chooses **Presenter Coach**.
2. They type a natural-language instruction.
3. Pulse shows the generated coaching plan and lets the user edit it before starting.
4. The camera watches the presenter during a timed rehearsal.
5. A deterministic signal triggers a distinct vibration pattern.
6. The app shows the current state and a timestamped event log so the demo audience can see why the wristband buzzed.

## Prompt and resulting plan

### Demo prompt

“Coach my 60-second pitch. Give me a short cue at 30 seconds, buzz me if I look down for more than 2 seconds, and tell me if I step outside the presentation zone.”

### Coaching-plan UI

The LLM may translate natural language into this small, validated schema; it must not control the device freely.

```json
{
  "session_seconds": 60,
  "rules": [
    {"id": "halfway", "type": "timer", "at_seconds": 30, "haptic": "short"},
    {"id": "eyes_up", "type": "face_absent", "after_seconds": 2, "haptic": "double"},
    {"id": "stay_centered", "type": "outside_zone", "after_seconds": 1.5, "haptic": "long"}
  ]
}
```

The user sees and confirms the plan. This is both safer and more credible than claiming that a prompt creates arbitrary computer vision capabilities.

## Haptic language

| Pattern | Meaning in the demo | Motor output |
| --- | --- | --- |
| Short | Time checkpoint | 180 ms buzz |
| Double | Re-engage / look up | Two 120 ms buzzes, 150 ms apart |
| Long | Return to presentation zone | 600 ms buzz |
| Success | Session complete | Three quick 90 ms buzzes |

The wristband only sends a cue; it does not claim to diagnose emotion, attention, health, or safety risk.

## What the audience sees

- Live camera preview with a face/zone overlay.
- A large session timer.
- Current coaching state: `ON PACE`, `FACE MISSING`, or `OUTSIDE ZONE`.
- The confirmed coaching plan.
- A real-time event log, such as `00:30 · halfway cue sent`.
- Device connection and vibration acknowledgement.

## Deliberately excluded from the MVP

- Autonomous learning of arbitrary activities from a prompt.
- Collision avoidance, navigation assistance, or accessibility/safety claims.
- Health, hydration, posture, or medical claims.
- Casino/card recognition or real-world gambling advice.
- App-store mobile software, cloud accounts, payments, user profiles, and long-term analytics.

## Future skills (show as static concept cards only)

- Focus coach: private cue when a chosen distraction pattern occurs.
- Task timer: discrete interval reminders.
- Practice coach: user-defined cues for a sport, interview, or rehearsal.
- Game-training mode: educational strategy drills away from real-money play.

## Success definition

In a 90-second live demo, a stranger can answer “what is it?” with: “A wristband that privately coaches you in real time when you cannot look at a screen.”
