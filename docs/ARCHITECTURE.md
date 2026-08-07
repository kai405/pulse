# System architecture

## Principle

Use AI for language-to-configuration and use deterministic code for real-time decisions. This avoids variable model latency and makes each haptic cue explainable.

```text
User prompt
   ↓
LLM plan translator → validated rule schema → editable coaching plan
                                               ↓
Camera → local vision worker → event/rule engine → device gateway → wristband vibration motor
                         ↓                          ↓
                    live overlay                WebSocket event log
                         ↓                          ↓
                       web dashboard ←──────────────┘
```

## Recommended hackathon architecture

### App host

Use the laptop as the primary host. It provides the webcam, browser UI, reliable development tooling, and simple deployment for the dashboard.

- Frontend: Next.js/React or Vite/React.
- Backend: a small Node/TypeScript service, Python FastAPI service, or browser-only prototype.
- Realtime: WebSocket or Server-Sent Events for state and log updates.
- Deployment: Vercel/Netlify for the public product page; the live device demo may run locally, with a clear local-demo indicator.

### Vision worker

Use local, pre-trained landmarks/detection rather than a remote LLM on every video frame.

- MediaPipe Face Landmarker or Face Detection: presence/absence and approximate head pose.
- MediaPipe Pose Landmarker: optional presentation-zone tracking.
- OpenCV: camera handling, smoothing, and drawing overlays.

The simple reliable rule is **face missing for 2 seconds**. Treat “looking down” as a stretch goal unless it proves stable in the venue lighting.

### Rule engine

Input: timer plus smoothed vision state. Output: named haptic event.

Properties:

- Debounce: do not repeat a rule more than once in 8–10 seconds.
- Cooldown and hysteresis: do not flip rapidly between states.
- Acknowledgement: log command sent and device acknowledgement separately.
- Fallback: allow a keyboard button to trigger each pattern during hardware testing only; do not depend on it in the judged demo.

### Device gateway

The app sends one of `short`, `double`, `long`, or `success` to the wearable. The device responds with `ack` plus battery/connection state if available.

Use one transport, not several:

1. **Preferred:** ESP32 wristband over BLE, using Web Bluetooth from Chrome or a small local BLE gateway.
2. **Reliable fallback:** USB serial from laptop to an Arduino/ESP32 driving the motor.
3. **Pi-only fallback:** Raspberry Pi receives a local HTTP/WebSocket command and drives a motor through GPIO and a transistor.

BLE is visually more compelling; USB serial is more reliable in a crowded room. Build the serial path first, then add BLE only if it is stable.

## Prompt translator constraints

The LLM returns only JSON matching an allowlisted rule type. Validate it with Zod/Pydantic before displaying or running it. Supported types are:

- `timer` — one cue at a configured time.
- `face_absent` — cue after a sustained absence.
- `outside_zone` — cue after a sustained exit from a manually calibrated frame zone.

Any unsupported request becomes a friendly message: “Pulse can coach timing, camera engagement, and stage position in this prototype.”

## Data and privacy

- Process camera frames locally for the demo.
- Do not save video.
- Store only session configuration and anonymous event timestamps in browser memory.
- Say this out loud in the pitch: “The camera is a sensor, not a recording product.”

## Definition of done

The dashboard, vision rules, device commands, motor patterns, and event log run as one connected system for three consecutive rehearsals without manual repair.
