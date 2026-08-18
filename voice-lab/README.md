# Svara Origins — Voice Intelligence Lab

Private research tooling. This directory is **not production** and is not included in the customer-facing app.

## Goal

Svara ranks voices independently before the founder validates the results on the vendors' own platforms.

Every eligible provider/voice is evaluated against the same controlled test suite.

## Pipeline

1. Provider catalogue discovery
2. Rights/eligibility gate
3. Generate the standardized test suite
4. Store sample metadata/audio outside Git
5. Run objective checks (duration, speech rate, transcription fidelity, clipping/loudness where available)
6. Run a separate evaluator model for subjective dimensions
7. Apply the Svara weighted scoring model
8. Produce rankings by use case
9. Founder independently validates the top-ranked voices on provider platforms

## Research rules

- Provider marketing labels are metadata, not evidence of quality.
- Do not crawl, display or commercially expose provider voices without permission.
- Never put provider keys in the repository.
- Do not expose automated rankings to customers yet.
- Do not treat an LLM judgement as ground truth.
- Keep generation, measurement, subjective evaluation and ranking as separate modules.

## First provider: Deepgram

Deepgram exposes a public TTS model catalogue through its Models API, including TTS model IDs and metadata. The runner should query the live catalogue rather than hard-code a handful of voices. Deepgram's current docs show Aura-2 model IDs such as `aura-2-thalia-en` and describe metadata including accent, tags, sample and use cases. citehttps://developers.deepgram.com/docs/tts-models

## Running the lab

The runner is intentionally a local/research command, not a Cloudflare endpoint. Never put provider keys in the repository.

Required environment variable:

`DEEPGRAM_API_KEY`

Optional output directory:

`SVARA_VOICE_LAB_DIR=./.voice-lab-output`

Example:

```bash
node voice-lab/run-deepgram.mjs
```

The runner writes generated audio and metadata to the output directory, which is ignored by Git.

## Output

The runner creates `samples.json`. The evaluator consumes that manifest and returns structured scores. The ranking module then produces deterministic Svara rankings from those scores.

This separation lets us test generation, measurement, subjective evaluation and ranking independently.

## Target ranking record

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
