import { createSoundGeneration, getSoundGeneration, markSoundGenerationFailed, markSoundGenerationReady, setSoundGenerationProviderResult } from "./sound-generations.js";
import { getSoundProvider } from "./providers/sound/index.js";
import { reserveSoundCredits, refundSoundCredits, soundCreditCost } from "./sound-credits.js";
import { getCachedSoundCapabilities } from "./sound-capabilities.js";

const MAX_PROMPT_CHARS = 2000;
const SOUND_TYPES = new Set(["music", "soundtrack", "sfx", "ambience", "jingle", "loop"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function normalizeType(value) {
  const type = String(value || "music").trim().toLowerCase();
  if (!SOUND_TYPES.has(type)) throw new Error("Unsupported Sound generation type");
  return type;
}

function normalizeFormat(value) {
  const format = String(value || "mp3").trim().toLowerCase();
  if (!["mp3", "wav", "pcm"].includes(format)) throw new Error("Unsupported Sound output format");
  return format;
}

function normalizeOptionalNumber(value, field, { integer = false } = {}) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) {
    throw new Error(`${field} must be a non-negative ${integer ? "integer" : "number"}`);
  }
  return number;
}

function extensionForFormat(format) {
  const value = String(format || "mp3").trim().toLowerCase();
  return ["mp3", "wav", "pcm"].includes(value) ? value : "mp3";
}

function mimeTypeForSoundResult(result, fallbackFormat) {
  const supplied = String(result?.mimeType || "").trim();
  if (supplied) return supplied;
  switch (extensionForFormat(result?.format || fallbackFormat)) {
    case "wav": return "audio/wav";
    case "pcm": return "audio/l16;rate=24000";
    default: return "audio/mpeg";
  }
}

function soundR2Key(generation) {
  const format = extensionForFormat(generation.format);
  const createdAt = new Date(generation.created_at || Date.now());
  const pad = value => String(value).padStart(2, "0");
  const stamp = `${createdAt.getUTCFullYear()}${pad(createdAt.getUTCMonth() + 1)}${pad(createdAt.getUTCDate())}_${pad(createdAt.getUTCHours())}${pad(createdAt.getUTCMinutes())}${pad(createdAt.getUTCSeconds())}`;
  return `users/${generation.user_id}/sound/svaraone_sound_${stamp}.${format}`;
}

async function storeSoundResult(env, generation, result) {
  if (!env.GENERATED_AUDIO) throw new Error("Sound generation storage is not configured.");
  if (!result?.url) throw new Error("Sound provider returned no audio URL.");
  if (result.status !== "ready") throw new Error("Sound provider result is not ready for storage.");

  const r2Key = String(generation.r2_key || soundR2Key(generation));
  const existing = await env.GENERATED_AUDIO.head(r2Key);
  if (existing) {
    await markSoundGenerationReady(env, generation.id, {
      r2Key,
      r2Etag: existing.etag || null,
      sizeBytes: existing.size,
      durationSeconds: result.durationSeconds,
      sampleRate: result.sampleRate,
      channels: result.channels
    });
    return {
      r2Key,
      r2Etag: existing.etag || null,
      sizeBytes: Number(existing.size) || 0
    };
  }

  const providerResponse = await fetch(String(result.url), {
    method: "GET",
    headers: { "accept": mimeTypeForSoundResult(result, generation.format) }
  });

  if (!providerResponse.ok) {
    throw new Error(`Sound provider asset fetch returned HTTP ${providerResponse.status}`);
  }
  if (!providerResponse.body) throw new Error("Sound provider asset response had no body.");

  const contentType = mimeTypeForSoundResult(result, generation.format);
  const stored = await env.GENERATED_AUDIO.put(r2Key, providerResponse.body, {
    httpMetadata: {
      contentType,
      cacheControl: "private, no-store"
    },
    customMetadata: {
      generationId: String(generation.id),
      userId: String(generation.user_id),
      provider: String(generation.provider),
      providerGenerationId: String(generation.provider_generation_id || result.providerGenerationId || ""),
      type: String(generation.type),
      format: extensionForFormat(result.format || generation.format),
      source: "sound-provider"
    }
  });

  if (!stored) throw new Error("R2 did not confirm the Sound asset upload.");

  try {
    await markSoundGenerationReady(env, generation.id, {
      r2Key,
      r2Etag: stored.etag || null,
      sizeBytes: stored.size,
      durationSeconds: result.durationSeconds,
      sampleRate: result.sampleRate,
      channels: result.channels
    });
  } catch (error) {
    try {
      await env.GENERATED_AUDIO.delete(r2Key);
    } catch (cleanupError) {
      console.error("sound_r2_metadata_cleanup_error", cleanupError);
    }
    throw error;
  }

  return {
    r2Key,
    r2Etag: stored.etag || null,
    sizeBytes: Number(stored.size) || 0
  };
}

async function handleSoundResult(env, userId, body) {
  const generationId = String(body?.generationId || "").trim();
  if (!generationId) return json({ error: "Generation ID is required." }, 400);

  const generation = await getSoundGeneration(env, generationId);
  if (!generation || String(generation.user_id) !== String(userId)) {
    return json({ error: "Sound generation not found." }, 404);
  }

  if (String(generation.status) === "ready") {
    return json({
      id: generation.id,
      status: generation.status,
      provider: generation.provider,
      result: null,
      stored: true,
      r2Key: generation.r2_key || null
    }, 200);
  }

  if (String(generation.status) === "failed" || String(generation.status) === "storage_failed") {
    return json({
      id: generation.id,
      status: generation.status,
      provider: generation.provider,
      result: null
    }, 200);
  }

  if (!generation.provider_generation_id) {
    return json({
      id: generation.id,
      status: "processing",
      provider: generation.provider,
      result: null
    }, 202);
  }

  try {
    const soundProvider = getSoundProvider(env, generation.provider);
    const result = await soundProvider.getResult(generation.provider_generation_id);

    if (result?.providerGenerationId && result.providerGenerationId !== generation.provider_generation_id) {
      await setSoundGenerationProviderResult(env, generation.id, result.providerGenerationId);
    }

    if (result?.status === "failed") {
      await markSoundGenerationFailed(env, generation.id, "failed");
      const refund = await refundSoundCredits(
        generation.user_id,
        generation.credits_charged,
        generation.credit_reference_id,
        env
      );

      return json({
        id: generation.id,
        status: "failed",
        provider: generation.provider,
        result,
        creditsRefunded: refund.refunded
      }, 502);
    }

    if (result?.status === "ready") {
      try {
        const stored = await storeSoundResult(env, generation, result);
        return json({
          id: generation.id,
          status: "ready",
          provider: generation.provider,
          result: {
            ...result,
            url: null,
            stored: true,
            r2Key: stored.r2Key,
            r2Etag: stored.r2Etag,
            sizeBytes: stored.sizeBytes
          },
          stored: true
        }, 200);
      } catch (storageError) {
        console.error("sound_r2_storage_error", storageError);
        try {
          await markSoundGenerationFailed(env, generation.id, "storage_failed");
        } catch (markError) {
          console.error("sound_storage_failure_mark_error", markError);
        }
        const refund = await refundSoundCredits(
          generation.user_id,
          generation.credits_charged,
          generation.credit_reference_id,
          env
        );
        return json({
          id: generation.id,
          status: "storage_failed",
          provider: generation.provider,
          result: null,
          creditsRefunded: refund.refunded
        }, 502);
      }
    }

    return json({
      id: generation.id,
      status: result?.status || "processing",
      provider: generation.provider,
      result: result || null
    }, result?.status === "ready" ? 200 : 202);
  } catch (error) {
    console.error("sound_generation_result_error", error);
    return json({
      error: String(error?.message || "Sound result retrieval failed").slice(0, 300),
      generationId: generation.id,
      provider: generation.provider
    }, 502);
  }
}

export async function handleSoundGenerate(request, env, userId) {
  if (!env.DB) return json({ error: "Sound generation storage is not configured." }, 503);

  const body = await request.clone().json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid JSON request body." }, 400);

  if (body.resultOnly === true) {
    return handleSoundResult(env, userId, body);
  }

  if (body.capabilitiesOnly === true) {
    const provider = String(body.provider || env.SVARAONE_SOUND_PROVIDER || "").trim().toLowerCase();
    if (!provider) return json({ error: "Sound provider is not configured." }, 503);

    const cached = await getCachedSoundCapabilities(env, provider);
    if (!cached) return json({ error: "Sound provider capabilities are not available." }, 503);

    return json({
      provider: cached.provider,
      providerVersion: cached.provider_version,
      status: cached.status,
      lastVerifiedAt: cached.last_verified_at,
      capabilities: cached.capabilities
    });
  }

  if (!env.GENERATED_AUDIO) return json({ error: "Sound generation storage is not configured." }, 503);

  const prompt = String(body.prompt ?? "").trim();
  if (!prompt) return json({ error: "Prompt is required." }, 400);
  if (prompt.length > MAX_PROMPT_CHARS) return json({ error: `Maximum ${MAX_PROMPT_CHARS} characters per Sound prompt.` }, 400);

  let type;
  let format;
  try {
    type = normalizeType(body.type);
    format = normalizeFormat(body.format);
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  let durationSeconds;
  let sampleRate;
  let channels;
  try {
    durationSeconds = normalizeOptionalNumber(body.durationSeconds, "durationSeconds");
    sampleRate = normalizeOptionalNumber(body.sampleRate, "sampleRate", { integer: true });
    channels = normalizeOptionalNumber(body.channels, "channels", { integer: true });
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  if (durationSeconds === null || durationSeconds <= 0) {
    return json({ error: "A positive durationSeconds value is required for Sound generation." }, 400);
  }

  const provider = String(body.provider || env.SVARAONE_SOUND_PROVIDER || "").trim().toLowerCase();
  if (!provider) return json({ error: "Sound provider is not configured." }, 503);

  const cost = soundCreditCost(env, durationSeconds);
  if (cost === null) {
    return json({ error: "Sound credit pricing is not configured." }, 503);
  }

  const generationId = crypto.randomUUID();
  const reservation = await reserveSoundCredits(userId, cost, env, generationId);
  if (!reservation) return json({ error: "Not enough credits." }, 402);

  const inputs = Array.isArray(body.inputs) ? body.inputs : [
    { inputType: "text", textContent: prompt, role: "prompt" }
  ];

  let generation;
  try {
    generation = await createSoundGeneration(env, {
      id: generationId,
      userId,
      provider,
      type,
      prompt,
      sourceType: body.sourceType ?? null,
      sourceAssetId: body.sourceAssetId ?? null,
      durationSeconds,
      sampleRate,
      channels,
      format,
      creditsCharged: reservation.cost,
      creditReferenceId: reservation.referenceId,
      inputs,
      parameters: body.parameters && typeof body.parameters === "object"
        ? body.parameters
        : null
    });
  } catch (error) {
    try {
      await refundSoundCredits(userId, reservation.cost, reservation.referenceId, env);
    } catch (refundError) {
      console.error("sound_generation_create_refund_error", refundError);
    }
    console.error("sound_generation_create_error", error);
    return json({ error: "Sound generation could not be created. Your credits were refunded." }, 500);
  }

  try {
    const soundProvider = getSoundProvider(env, provider);
    const result = await soundProvider.generate({
      generationId,
      userId,
      type,
      prompt,
      sourceType: body.sourceType ?? null,
      sourceAssetId: body.sourceAssetId ?? null,
      durationSeconds,
      sampleRate,
      channels,
      format,
      parameters: body.parameters ?? null,
      inputs
    });

    if (result?.providerGenerationId) {
      await setSoundGenerationProviderResult(env, generationId, result.providerGenerationId);
    }

    return json({
      id: generation.id,
      status: generation.status,
      provider,
      creditsCharged: reservation.cost,
      creditsRemaining: reservation.balance,
      result: result ?? null
    }, 202);
  } catch (error) {
    try {
      await markSoundGenerationFailed(env, generationId, "failed");
    } catch (markError) {
      console.error("sound_generation_failure_mark_error", markError);
    }

    try {
      await refundSoundCredits(userId, reservation.cost, reservation.referenceId, env);
    } catch (refundError) {
      console.error("sound_generation_refund_error", refundError);
    }

    console.error("sound_generation_error", error);
    return json({
      error: String(error?.message || "Sound generation failed").slice(0, 300),
      generationId,
      creditsRefunded: reservation.cost
    }, 502);
  }
}
