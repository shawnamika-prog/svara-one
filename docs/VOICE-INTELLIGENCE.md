# Svara Origins — Voice Intelligence

## Strategic objective

Svara Origins should not be locked to one TTS vendor. The product promise is **the best voice for the job**, with providers treated as infrastructure.

## Validation phase

Before Supabase, R2 or Stripe, validate the hypothesis that the best voice differs by provider and use case.

Run the same standardized scripts against every voice that Svara is contractually permitted to test. Record:

- provider
- provider voice ID
- language / locale
- voice metadata
- test script and version
- generated audio reference
- latency
- output duration
- speech-to-text transcription
- acoustic metrics
- human scores
- automated scores
- final Svara Voice Score
- use-case-specific rankings
- provider cost estimate
- rights / commercial eligibility

## Standard score dimensions

1. Naturalness
2. Expression
3. Prosody
4. Direction following
5. Pronunciation
6. Consistency
7. Use-case fit

The overall score must be accompanied by use-case scores. A voice can be excellent for narration and mediocre for conversation.

## Automated evaluation architecture

```text
Provider catalogue
       ↓
Eligibility / rights check
       ↓
Test orchestrator
       ↓
Standardized prompts
       ↓
Provider TTS
       ↓
Audio analysis + STT
       ↓
Structured LLM evaluation
       ↓
Svara scoring model
       ↓
Voice Index
       ↓
Use-case rankings
```

### Important constraint

Svara must not automatically crawl, reproduce, display, rank for commercial use, or redistribute provider voices unless the provider's agreement permits the relevant activity. Standard consumer/API subscriptions should not be assumed to grant OEM/reseller rights.

## Human calibration first

The first version intentionally requires human scoring. Automated scoring should be calibrated against human judgments before it becomes authoritative.

Target: at least 3 independent human ratings across a representative sample of voices and test categories. Measure agreement and revise the rubric before training/locking the automated evaluator.

## Provider abstraction

Every provider must implement a common interface:

```js
provider.generate({ text, voice, speed, stability, style })
```

Provider-specific controls should be translated behind this interface. The customer-facing Svara product must not expose provider names or provider-specific implementation details.

## Launch strategy

1. Deepgram remains the working baseline.
2. Build the Voice Intelligence lab.
3. Test eligible providers privately.
4. Identify exceptional voices by use case.
5. Negotiate OEM / reseller / embedded agreements with winning providers.
6. Launch Svara Credits and routing only after rights and unit economics are confirmed.
7. Add Svara Originals licensed voices as a proprietary supply layer.
