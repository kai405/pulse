# Pulse StyleSeed Score

Rule set: `consumer-service × product-ui × education × dashboard × calm-consumer × editorial`

Scored on 2026-08-05 using the eight-category StyleSeed rubric, followed by a rendered-pixel pass at 2× device scale. The quality floor requested for this project is 85.

## Source and route scores

| Major surface | Score | Grade | Primary evidence |
| --- | ---: | :---: | --- |
| Landing | 96 | A | One editorial promise, real product result preview, restrained action palette |
| Authentication | 91 | A | Focused sign-in choice, privacy-forward guest path, product evidence panel |
| Onboarding | 93 | A | One decision per step, visible progress, clear selected and disabled states |
| Today dashboard | 92 | A | One recommendation dominates; trends and history progressively recede |
| Practice setup | 91 | A | Prompt is the focal object; capture and timing remain subordinate |
| Recording studio | 94 | A | Distraction-free dark room, explicit permissions, visible recording states |
| Processing | 93 | A | Real stages, safe-leave message, recoverable failure model |
| Result overview | 95 | A | Score immediately resolves into strength, evidence, and one next action |
| Transcript & evidence | 96 | A | Timestamped evidence and media are visibly linked; uncertainty is disclosed |
| History | 90 | A | Compact evidence-first rows, labeled sample state, useful filter empty state |
| Progress | 93 | A | One speaking signal now leads; supporting habits explain rather than compete |
| Settings & privacy | 89 | B | Clear form and deletion states; the intentionally conventional settings layout is the least distinctive surface |

## Rendered artifact scores

| Screenshot | Score | Result |
| --- | ---: | --- |
| `desktop-landing.png` | 96 | Pass |
| `desktop-auth.png` | 91 | Pass |
| `desktop-onboarding.png` | 93 | Pass |
| `desktop-dashboard.png` | 92 | Pass |
| `desktop-practice.png` | 91 | Pass |
| `desktop-studio-preflight.png` | 94 | Pass |
| `desktop-processing.png` | 93 | Pass |
| `desktop-processing-failed.png` | 92 | Pass |
| `desktop-result-overview.png` | 95 | Pass |
| `desktop-result-evidence.png` | 96 | Pass |
| `desktop-history.png` | 90 | Pass |
| `desktop-history-empty.png` | 90 | Pass |
| `desktop-progress.png` | 93 | Pass |
| `desktop-settings.png` | 89 | Pass |
| `mobile-landing.png` | 91 | Pass |
| `mobile-practice.png` | 89 | Pass |
| `mobile-result.png` | 90 | Pass |
| `tablet-landing.png` | 94 | Pass |
| `tablet-practice.png` | 92 | Pass |
| `tablet-result.png` | 93 | Pass |
| `projector-landing.png` | 96 | Pass |
| `projector-practice.png` | 93 | Pass |
| `projector-result.png` | 95 | Pass |

## Lowest-scoring surface breakdown

### Design Score: 89 / 100 — Settings & privacy

- Color discipline: 16/16 — all roles use the shared semantic palette.
- Hierarchy & typography: 14/16 — profile, privacy, workspace, and deletion order is clear; compact metadata is intentionally secondary (`components/settings-form.tsx:48`).
- Layout & rhythm: 9/12 — the desktop demo workspace leaves the right rail shorter than the main form (`components/settings-form.tsx:57`).
- Cards & elevation: 9/10 — one restrained surface language is used throughout (`app/globals.css:98`).
- States & accessibility: 17/18 — labels, saved status, error state, destructive confirmation, and 44px controls are present (`components/settings-form.tsx:50`, `components/settings-form.tsx:69`).
- Motion & interaction: 6/6 — feedback is immediate and global reduced-motion behavior remains available (`app/globals.css:124`).
- Coherence: 11/12 — form, workspace, and privacy geometry remain consistent; header icon treatments are bounded to section identity.
- Distinctiveness: 7/10 — this surface deliberately favors familiar settings conventions over the stronger editorial composition used elsewhere.

## Revision loop

The initial Progress composition scored **83** because four equal KPI cards competed for attention. It was rebuilt around one dominant speaking signal, a compact evidence-backed habit list, and the product-specific **Evidence rail**. The revised render scores **93**. No final major screen is below 85.

## Verification record

- 23 screenshots rendered from the running Next.js application, including processing failure and filtered-empty history states.
- Viewports: 390×844, 768×1024, 1440×900, and 1920×1080.
- Fonts were awaited by Playwright before capture.
- Mobile landing, practice, and results were checked for horizontal overflow.
- The effective StyleSeed bundle passed resolver drift validation.
