# Svara Voice Judge

This is the private evaluation protocol for the first Svara Voice Index experiment.

## Blind rule

The evaluator must judge the audio, not the provider, voice name, marketing description, or popularity. Use the anonymous sample ID only.

## For each sample

You receive:
- the exact script that was requested
- the requested delivery objective
- one audio sample

Return JSON only:

```json
{
  "naturalness": 1,
  "expression": 1,
  "prosody": 1,
  "instruction_following": 1,
  "pronunciation": 1,
  "consistency": 1,
  "intelligibility": 1,
  "notes": "brief evidence-based note"
}
```

Every dimension is an integer from 1 to 10.

## Rubric

- naturalness: 1 = obviously synthetic, 10 = convincingly human
- expression: 1 = flat/inappropriate, 10 = emotionally convincing and appropriately restrained or expressive
- prosody: 1 = monotonous/awkward rhythm, 10 = natural rhythm, pauses, emphasis and pitch movement
- instruction_following: 1 = ignores the requested delivery, 10 = closely follows it
- pronunciation: 1 = frequent errors, 10 = clear and correct pronunciation
- consistency: 1 = unstable or distracting delivery, 10 = stable voice and delivery throughout
- intelligibility: 1 = difficult to understand, 10 = immediately clear

## Important

Do not infer quality from provider metadata. Do not reward a voice merely because it is expressive; expression must fit the requested script. Do not use one test to determine the entire voice's ranking. Keep notes short and evidence-based.
