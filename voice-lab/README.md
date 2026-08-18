# Svara Origins Voice Intelligence Lab

Private research layer for discovering which voices perform best for which use cases.

## Principle

**Svara ranks first. Human testing validates the ranking second.**

The initial experiment is provider-neutral at the scoring layer. A provider adapter supplies audio; the evaluator scores the audio against the same standardized tests.

## Current pipeline

1. Enumerate an eligible provider's voice catalogue.
2. Select a controlled sample set.
3. Generate identical test scripts for every voice.
4. Run objective audio/STT preflight checks.
5. Produce judge packets for an authorized audio-capable evaluator.
6. Store raw dimension scores and evidence.
7. Produce use-case rankings and an overall ranking.
8. Only then ask a human to blind-check the top results on the provider's own platform.

### Deepgram first

The first adapter targets Deepgram. Its current `/v1/models` endpoint returns TTS catalogue entries, and Aura-2 voices are identified by model names such as `aura-2-thalia-en`. Deepgram's documentation lists the current Aura-2 catalogue and characteristics. citeturn0search10turn0search0

The runner uses the authorized account catalogue rather than hard-coding a handful of voices.

## Objective preflight

`evaluate.mjs` transcribes each generated sample with Deepgram Nova-3 and computes:

- word error rate against the exact test script
- transcription confidence
- basic audio duration/size/sample-rate/channel metrics when `ffprobe` is installed
- objective pronunciation/intelligibility signals

These are **not** the final Svara quality scores. They are evidence supplied to the subjective evaluator.

## Subjective judge

Naturalness, expression, prosody, instruction following and long-form consistency require an audio-capable evaluator. `evaluate.mjs` creates `judge-packets.json` and `JUDGE_SCHEMA.json` for that step.

The evaluator must receive the actual audio and must not be given provider names, catalogue descriptions, or other metadata that could bias the result.

## Ranking

`rank.mjs` combines the stored dimension scores into an overall score and use-case scores. It does not invent missing subjective scores.

A ranking record should eventually look like:

```json
{
  "voice_id": "provider-voice-id",
  "provider": "deepgram",
  "overall": 9.42,
  "use_cases": {
    "conversation": 9.61,
    "advertising": 9.38,
    "narration": 9.72,
    "storytelling": 9.55,
    "corporate": 9.31,
    "emotional": 9.44
  },
  "dimensions": {
    "naturalness": 9.4,
    "expression": 9.6,
    "prosody": 9.3,
    "instruction_following": 9.5,
    "pronunciation": 9.2,
    "consistency": 9.6,
    "intelligibility": 9.5
  }
}
```

## Guardrails

- Do not crawl or display provider voices without permission.
- Do not store provider credentials in the repository.
- Do not expose automated rankings to customers yet.
- Do not treat LLM judgement as ground truth.
- Do not score provider metadata as audio quality.
- Keep human validation separate from automated scores.
- Do not move production billing/auth work ahead of validating the scoring engine.
