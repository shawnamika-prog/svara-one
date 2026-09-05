# Sound Provider Contract — S5-1

SvaraONE Sound providers are execution adapters behind the Sound domain. The contract is intentionally separate from the Voice provider system.

## Required methods

- `generate(request)` — execute a Sound generation request using the provider API.
- `getCapabilities()` — return the provider's supported Sound capabilities.
- `normalizeResult(result)` — convert the provider-specific response into SvaraONE's internal Sound result shape.
- `getStatus()` — report provider configuration/availability without executing generation.

Providers own provider-specific authentication, request mapping, and response parsing. The Sound API owns authentication, validation, credits, generation persistence, and later storage orchestration.

## Boundary

```text
Sound API
    ↓
SoundProvider contract
    ↓
Provider adapter
    ↓
External Sound API
```

The contract must not contain provider-specific fields or assumptions.
