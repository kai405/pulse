# Pulse Scoring Specification

Status: Approved
Rubric ID: `pulse-1.0.0`
Score precision: whole numbers from 0 to 100

## Principles

- Deterministic facts are calculated, never guessed by an LLM.
- Interpretive scores require a documented rubric and evidence.
- Missing and unreliable data is omitted, not treated as poor performance.
- Overall scores remain understandable; displayed precision never exceeds meaningful precision.
- Rubric, thresholds, prompt, model, timestamp, confidence, and missing metrics are stored with each analysis.

## Source data

- Recording duration and target duration.
- Word-timestamped transcript and timestamped segments.
- Web Audio samples: RMS volume, pitch estimate, and silence intervals.
- Local vision samples: face availability, head-orientation proxy, framing, facial landmark activity, pose/movement activity.
- Timestamped still frames selected at five-second intervals and around local events.
- Prompt, preset, difficulty, user pace target, and trigger words.

## Score aggregation

| Category | Overall weight | Components |
| --- | ---: | --- |
| Delivery mechanics | 25 | Pace accuracy 6, pace consistency 4, pause rhythm 5, vocal variation 5, duration adherence 5 |
| Fluency | 20 | Filler rate 7, repetition 5, verbal clarity 5, sentence flow 3 |
| Structure and content | 30 | Organization 7, clarity of ideas 6, conciseness 5, relevance 4, opening 4, conclusion 4 |
| Visual presence | 15 | Camera engagement 6, framing/presence 3, facial engagement 3, purposeful movement 3 |
| Confident delivery | 10 | Observable confident-delivery rubric 10 |

Each category is the weighted mean of available components. The overall score is the weighted mean of available categories. Missing weights are normalized across available inputs. A score is not produced if Structure and Content is unavailable or less than 50% of total configured weight is available.

Formula:

```text
weighted_score = round(sum(score_i * weight_i) / sum(available_weight_i))
```

## Deterministic metrics

### Total words

- Unit: words.
- Normalize Unicode apostrophes and hyphens.
- A word is an alphanumeric token that may contain an internal apostrophe or hyphen.
- Do not count standalone punctuation.

### Speaking duration

- Unit: seconds.
- From the first audible/transcribed word start to the last word end for speech metrics.
- The full recording duration is retained separately for duration adherence.

### Overall WPM

```text
WPM = total_words / speaking_duration_seconds * 60
```

If speaking duration is below 10 seconds or total words below 20, WPM is unavailable.

### Pace accuracy score

Compare WPM with the user's target, default 140 WPM.

| Absolute percentage difference | Score |
| --- | ---: |
| <= 5% | 100 |
| <= 10% | 85 |
| <= 20% | 70 |
| <= 30% | 50 |
| > 30% | 25 |

The setup displays a suggested target band of 120–160 WPM but personal target drives scoring.

### Segmented WPM and consistency

- Divide speaking time into contiguous 30-second windows; the last window must contain at least 15 seconds.
- Assign words by timestamp midpoint.
- Pace coefficient of variation is standard deviation divided by mean across valid windows.
- Unavailable with fewer than two valid windows.

| Coefficient of variation | Score |
| --- | ---: |
| <= 0.12 | 100 |
| <= 0.20 | 85 |
| <= 0.30 | 70 |
| <= 0.45 | 50 |
| > 0.45 | 25 |

### Fillers

Default normalized filler lexicon: `um`, `uh`, `erm`, `er`, `ah`, `like`, `you know`, `I mean`, `basically`, `actually`, `literally`, `sort of`, `kind of`.

- Match case-insensitively on token boundaries.
- Prefer the longest phrase match and do not double-count its tokens.
- Treat `like`, `actually`, and `literally` as fillers only when the transcript token is tagged by the disfluency heuristic or surrounded by pause/punctuation evidence; otherwise report as ambiguous and do not score.
- Filler rate is confirmed filler count per speaking minute.

| Fillers/minute | Score |
| --- | ---: |
| <= 1 | 100 |
| <= 2 | 85 |
| <= 4 | 65 |
| <= 6 | 45 |
| > 6 | 25 |

### Pauses

- Short pause: 0.35–0.74 seconds.
- Intentional-range pause: 0.75–2.49 seconds.
- Long pause: at least 2.5 seconds.
- Opening and closing silence are excluded.
- A long pause at sentence punctuation is reported but is not automatically penalized until 4 seconds.
- A long pause inside a sentence is penalized from 2.5 seconds.

Pause rhythm score starts at 100, subtracts 10 per mid-sentence long pause (maximum 40), subtracts 5 per boundary pause over four seconds (maximum 20), and subtracts 20 when there are fewer than two pauses of at least 0.35 seconds per 100 words. Minimum score is 25. It is unavailable below 50 words.

### Repetition

- Immediate repeated token: same normalized non-filler word repeated adjacently.
- Repeated phrase: normalized 2–5 word n-gram occurring at least three times, excluding stopword-only phrases and prompt phrases.
- Report counts and evidence ranges.
- Repetition score starts at 100, subtracts 8 per immediate repeat (maximum 32) and 10 per qualifying repeated phrase (maximum 40). Minimum 25.

### Sentence length and flow

- Sentence boundaries come from transcript punctuation, backed by pauses when punctuation is missing.
- Report mean, median, and maximum words per sentence.
- Do not penalize complexity directly.
- AI sentence-flow rubric evaluates whether sentence structure impaired comprehension, using these measurements as evidence.

### Duration adherence

| Recording/target ratio | Score |
| --- | ---: |
| 0.90–1.10 | 100 |
| 0.80–1.20 | 80 |
| 0.70–1.30 | 60 |
| otherwise | 35 |

### Trigger words

- Case-insensitive longest-match token or phrase detection.
- Store count and timestamp evidence.
- Informational by default and excluded from scoring.

### Camera engagement

- A local head-orientation proxy, not literal eye tracking.
- Engaged frames require a detected face, acceptable yaw/pitch thresholds, and adequate landmark confidence.
- Denominator includes only frames with reliable face/pose input.
- Unavailable if fewer than 60% of expected local samples are reliable.

| Engaged reliable frames | Score |
| --- | ---: |
| >= 85% | 100 |
| >= 70% | 85 |
| >= 55% | 65 |
| >= 40% | 45 |
| < 40% | 25 |

Looking-away events require at least 1.5 continuous seconds outside the engaged threshold and use a three-second cooldown.

### Framing, facial engagement, and movement

- Framing availability is the percentage of reliable samples with face and upper torso inside configurable safe bounds.
- Facial engagement uses normalized landmark motion; it never infers emotion.
- Movement activity uses normalized pose displacement and gesture-region motion.
- These are inputs to bounded AI rubrics, not universal claims that more movement is always better.

### Vocal variation

- Calculate RMS volume and voiced pitch samples in browser.
- Normalize within the session; do not compare absolute pitch across users.
- Use interquartile pitch range and RMS variation.
- Unavailable when voiced sample coverage is below 60% or clipping/noise invalidates input.
- Score uses mode-aware bands and AI interpretation to avoid rewarding exaggerated variation.

## AI rubrics

AI dimensions use levels 1–5 mapped to 20, 40, 60, 80, and 100. Each dimension returns `score`, `confidence`, `explanation`, `evidence`, `strength`, `weakness`, `recommendation`, and `unable_reason`.

### Level anchors

1. Meaningfully blocks comprehension or task success; repeated, material evidence.
2. Understandable in parts but important weaknesses repeatedly interfere.
3. Competent and understandable with specific, noticeable opportunities.
4. Strong and purposeful with minor, bounded improvement opportunities.
5. Exceptional for the selected mode and duration; evidence shows consistent control.

### Semantic dimensions

- Organization: recognizable progression and useful sequencing.
- Clarity of ideas: claims and relationships are understandable and sufficiently explained.
- Conciseness: content advances the response without avoidable detours.
- Relevance: directly addresses the prompt and mode.
- Opening: establishes purpose, context, or interest promptly.
- Conclusion: resolves the central idea and provides appropriate closure.
- Verbal clarity: phrasing is comprehensible without scoring accent conformity.
- Sentence flow: sentence construction supports listening comprehension.

### Visual dimensions

- Facial engagement: visible, audience-directed expressiveness without emotion inference.
- Purposeful movement: gesture and movement appear supportive rather than absent, repetitive, or distracting.
- The evaluator receives timestamped frames and local metrics. It cannot claim continuity between sampled frames.

### Confident delivery

This category describes perceived delivery behavior, not a person's internal state. Evidence may include audible commitment, avoidable hesitation, projection, composure after pauses, stable completion of thoughts, and audience-directed presence. It must not mention personality, honesty, anxiety diagnosis, attractiveness, disability, or accent quality.

## Prompt/preset adaptation

- Category weights remain fixed.
- Interview relevance emphasizes directness and evidence.
- Presentation emphasizes progression, signposting, and conclusion.
- Elevator Pitch emphasizes value clarity, specificity, and concise close.
- Impromptu emphasizes a coherent through-line without expecting formal signposting.
- Difficulty changes expectations for specificity and structure, not delivery physiology.

## Confidence and missing data

- Confidence values: `high`, `medium`, `low`.
- Low-confidence components are displayed with limitations and omitted from aggregation.
- Medium-confidence components remain scored with a visible note.
- Missing video removes Visual Presence and visual evidence from Confident Delivery; remaining weights normalize.
- Transcription confidence failures prevent semantic scoring rather than substituting invented text.
- If available configured weight is below 50%, no overall score is shown.

## Evidence rules

- Objective evidence uses timestamp ranges and raw/target values.
- Transcript evidence stores start/end segment IDs and a short excerpt.
- Visual evidence stores timestamp and derived frame reference.
- AI excerpts must be exact substrings of persisted transcript text; validation rejects unsupported excerpts.
- Recommendations must cite at least one evidence item.

## Versioning and comparability

Persist rubric ID, threshold snapshot, model ID, evaluator prompt version, analysis timestamp, confidence, missing metrics, and source-data version. Trends require matching rubric major version and preset. Minor rubric versions may compare only when explicitly marked compatible. Re-analysis creates a new immutable analysis version; it never mutates the historical rubric snapshot.

## Test examples and edges

- 140 words in 60 seconds at a 140 target -> WPM 140, pace score 100.
- 70 words in 30 seconds -> WPM 140.
- 3 fillers in 60 seconds -> filler rate 3, score 65.
- No camera -> Visual Presence unavailable; overall weights normalize.
- Poor lighting with unreliable landmark coverage -> visual metrics shown unavailable, never zero.
- 8-second recording -> incomplete, no score.
- 15-word recording -> incomplete, no score.
- Intentional four-second close after a complete sentence -> reported, not treated as a mid-thought pause.
- A trigger phrase overlapping a single trigger token -> longest phrase wins.
- Repeated prompt wording -> excluded from repetition when it is necessary to answer.
- Rubric `pulse-2.x` session -> not silently trended with `pulse-1.x`.
