# Svara Origins Voice Intelligence Lab

Private research layer for discovering which voices perform best for which use cases.

## Principle

Svara ranks first. Human testing validates the ranking second.

The initial experiment is intentionally provider-neutral at the scoring layer. A provider adapter supplies audio; the evaluator scores the audio against the same standardized tests.

## First phase

1. Enumerate an eligible provider's voice catalogue.
2. Select a controlled sample set.
3. Generate identical test scripts for every voice.
4. Analyze audio and transcription quality.
5. Score each dimension using `evaluation-rubric.json`.
6. Produce use-case rankings and an overall ranking.
7. Only then ask a human to blind-check the top results on the provider's own platform.

## Do not do yet

- Do not crawl or display provider voices without permission.
- Do not store provider credentials in the repository.
- Do not expose automated rankings to customers yet.
- Do not treat LLM judgement as ground truth.
- Do not move production billing/auth work ahead of validating the scoring engine.

## Deepgram first

Deepgram's current API exposes a public TTS model catalogue and metadata endpoint, and Aura-2 voice IDs can be passed to `/v1/speak`. The first implementation should use the account's authorized model catalogue rather than hard-coding a handful of voices. See the official documentation for the current catalogue and request format.

## Output target

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
