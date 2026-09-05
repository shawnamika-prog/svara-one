import { createSoundGeneration, markSoundGenerationFailed } from "./sound-generations.js";
import { getSoundProvider } from "./providers/sound/index.js";
import { reserveSoundCredits, refundSoundCredits, soundCreditCost } from "./sound-credits.js";

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

export async function handleSoundGenerate(request, env, userId) {
  if (!env.DB) return json({ error: "Sound generation storage is not configured." }, 503);
  if (!env.GENERATED_AUDIO) return json({ error: "Sound generation storage is not configured." }, 503);

  const body = await request.clone().json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid JSON request body." }, 400);

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
