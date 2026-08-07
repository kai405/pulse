# Hackathon action plan

## North-star deliverable

By demo time, Pulse must run one end-to-end loop:

1. type/choose Presenter Coach prompt;
2. display its validated three-rule plan;
3. start a timed session;
4. detect one visible state;
5. vibrate the wristband;
6. show the matching event in the dashboard.

Everything else is optional.

## Before the event: preparation that does not pre-build the submission

Check the event rules before doing any implementation. If the build must start at the event, prepare only equipment, accounts, documentation, and an empty repository.

- Inventory exact components and test that each powers on.
- Install Cursor, Node/Python, USB drivers, Arduino IDE/PlatformIO, and a browser that supports the selected device transport.
- Create accounts/API keys, deployment account, and a blank repository if permitted.
- Read MediaPipe/OpenCV, ESP32, DRV2605L, and deployment docs; bookmark examples.
- Make a wiring diagram and pack labelled parts, two USB cables, a battery pack, headphones, tape, and Velcro.
- Practice the 90-second spoken pitch without creating the final product code.

## Build order

### Phase 0 — 0:00–0:20: scope lock

- Create repository and task board.
- Freeze MVP rules: 30-second timer, face absent, one stage-zone rule.
- Decide transport: build USB serial first.
- Assign one owner to wearable/firmware and one owner to product/app, if working as a team.

### Phase 1 — 0:20–1:00: hardware heartbeat

- Flash firmware that accepts a command and plays four patterns.
- Test patterns via serial terminal.
- Put the motor into a wearable strap.
- Do not continue until each pattern works ten times in a row.

### Phase 2 — 0:30–1:30: app shell and public deployment

- Build a minimal polished landing/session page.
- Add device connection indicator and manual pattern-test buttons.
- Deploy the marketing/dashboard shell early to a public URL.
- Add the prompt and editable coaching-plan UI using mocked plan data first.

### Phase 3 — 1:30–2:30: real-time rules

- Implement session timer and timer cue.
- Add webcam preview and face-presence detection.
- Feed events into one central rule engine.
- Send a real device command on event.
- Add cooldowns; log each event.

### Phase 4 — 2:30–3:15: prompt translator and stage zone

- Add constrained JSON prompt-to-plan translation.
- Validate and render it for user confirmation.
- Add the stage-zone rule only if face detection is stable.
- Do not add additional skills.

### Phase 5 — 3:15–4:00: polish and rehearsals

- Remove debug controls from the presentation path.
- Make states readable from several feet away.
- Record a backup demo video.
- Run three complete rehearsals with someone else wearing the wristband.
- Package the device, charger, backup cable, and laptop power.

## Cut list

Cut features in this order if time slips:

1. Stage-zone detection; retain timer + face-absence cue.
2. LLM plan generation; retain a well-designed preconfigured plan and prompt mock UI.
3. BLE; retain USB serial device connection.
4. Live camera overlay polish; retain clear state panel and event log.

Never cut the working wrist vibration, the timer cue, or the visible explanation for a cue.

## Roles for a two-person team

| Role | Owns | Done when |
| --- | --- | --- |
| Device lead | Firmware, motor, power, transport, physical strap | All patterns reliable and acknowledged |
| Product lead | Web app, camera, rules, prompt UI, deployment, pitch | One complete session works and is presentation-ready |

Both people rehearse the pitch. One operates the dashboard; the other wears the device and gives the short presentation.

## Submission package

- Public repository with setup instructions.
- Public product/landing page URL.
- 60–90 second demo video as backup.
- A short README explaining the architecture and privacy boundaries.
- One slide or clear landing-page section: problem, magic loop, future skills, and hackathon stack.
