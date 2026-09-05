const SOUND_FORMATS = new Set(["mp3", "wav", "pcm"]);
const SOUND_STATUSES = new Set(["processing", "ready", "failed", "storage_failed"]);

function requireDb(env) {
  if (!env?.DB) throw new Error("D1 Sound generation storage is not configured.");
}

function normalizeFormat(format) {
  const value = String(format || "mp3").trim().toLowerCase();
  if (!SOUND_FORMATS.has(value)) throw new Error("Unsupported Sound output format");
  return value;
}

function normalizeStatus(status) {
  const value = String(status || "processing").trim().toLowerCase();
  if (!SOUND_STATUSES.has(value)) throw new Error("Unsupported Sound generation status");
  return value;
}

function normalizeCredits(value) {
  const credits = Number(value);
  if (!Number.isFinite(credits) || credits < 0) throw new Error("Sound generation credits must be a non-negative number");
  return Math.floor(credits);
}

function normalizeOptionalNumber(value, field) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a non-negative number`);
  return number;
}

export function mimeTypeForSoundFormat(format) {
  switch (normalizeFormat(format)) {
    case "wav": return "audio/wav";
    case "pcm": return "audio/l16;rate=24000";
    default: return "audio/mpeg";
  }
}

export async function createSoundGeneration(env, {
  id,
  userId,
  provider,
  providerGenerationId = null,
  type,
  prompt = null,
  sourceType = null,
  sourceAssetId = null,
  durationSeconds = null,
  sampleRate = null,
  channels = null,
  format = "mp3",
  mimeType = null,
  creditsCharged = 0,
  creditReferenceId = null,
  parentGenerationId = null,
  folderId = null,
  expiresAt = null,
  inputs = [],
  parameters = null
}) {
  requireDb(env);

  const generationId = String(id || "").trim();
  const ownerId = String(userId || "").trim();
  const providerName = String(provider || "").trim();
  const generationType = String(type || "").trim();
  const outputFormat = normalizeFormat(format);

  if (!generationId) throw new Error("Sound generation ID is required");
  if (!ownerId) throw new Error("Sound generation user ID is required");
  if (!providerName) throw new Error("Sound provider is required");
  if (!generationType) throw new Error("Sound generation type is required");

  const outputMimeType = String(mimeType || mimeTypeForSoundFormat(outputFormat));
  const credits = normalizeCredits(creditsCharged);
  const duration = normalizeOptionalNumber(durationSeconds, "durationSeconds");
  const rate = sampleRate === null || sampleRate === undefined || sampleRate === "" ? null : Number(sampleRate);
  const channelCount = channels === null || channels === undefined || channels === "" ? null : Number(channels);

  if (rate !== null && (!Number.isInteger(rate) || rate <= 0)) throw new Error("sampleRate must be a positive integer");
  if (channelCount !== null && (!Number.isInteger(channelCount) || channelCount <= 0)) throw new Error("channels must be a positive integer");
  if (!Array.isArray(inputs)) throw new Error("Sound generation inputs must be an array");
  if (parameters !== null && typeof parameters !== "object") throw new Error("Sound generation parameters must be an object");

  const statements = [
    env.DB.prepare(`
      INSERT INTO sound_generations (
        id, user_id, provider, provider_generation_id, type, prompt,
        source_type, source_asset_id, duration_seconds, sample_rate, channels,
        format, mime_type, status, r2_key, r2_etag, size_bytes,
        credits_charged, credit_reference_id, parent_generation_id, folder_id,
        created_at, completed_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', NULL, NULL, NULL, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), NULL, ?)
    `).bind(
      generationId,
      ownerId,
      providerName,
      providerGenerationId,
      generationType,
      prompt,
      sourceType,
      sourceAssetId,
      duration,
      rate,
      channelCount,
      outputFormat,
      outputMimeType,
      credits,
      creditReferenceId,
      parentGenerationId,
      folderId,
      expiresAt
    )
  ];

  for (const input of inputs) {
    if (!input || typeof input !== "object") throw new Error("Invalid Sound generation input");
    const inputType = String(input.inputType ?? input.input_type ?? "").trim();
    if (!inputType) throw new Error("Sound generation input type is required");
    statements.push(env.DB.prepare(`
      INSERT INTO sound_generation_inputs (
        id, sound_generation_id, input_type, asset_id, text_content, role
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      String(input.id || crypto.randomUUID()),
      generationId,
      inputType,
      input.assetId ?? input.asset_id ?? null,
      input.textContent ?? input.text_content ?? null,
      input.role ?? null
    ));
  }

  if (parameters) {
    statements.push(env.DB.prepare(`
      INSERT INTO sound_generation_parameters (
        id, sound_generation_id, mood, style, energy, texture,
        tempo_bpm, intensity, complexity, instrumental, exclude_vocals,
        language, negative_prompt, duration_seconds, custom_parameters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      String(parameters.id || crypto.randomUUID()),
      generationId,
      parameters.mood ?? null,
      parameters.style ?? null,
      parameters.energy ?? null,
      parameters.texture ?? null,
      parameters.tempoBpm ?? parameters.tempo_bpm ?? null,
      parameters.intensity ?? null,
      parameters.complexity ?? null,
      parameters.instrumental === undefined ? 1 : (parameters.instrumental ? 1 : 0),
      parameters.excludeVocals === undefined && parameters.exclude_vocals === undefined
        ? 1
        : ((parameters.excludeVocals ?? parameters.exclude_vocals) ? 1 : 0),
      parameters.language ?? null,
      parameters.negativePrompt ?? parameters.negative_prompt ?? null,
      parameters.durationSeconds ?? parameters.duration_seconds ?? null,
      parameters.customParameters === undefined
        ? (parameters.custom_parameters === undefined ? null : JSON.stringify(parameters.custom_parameters))
        : JSON.stringify(parameters.customParameters)
    ));
  }

  await env.DB.batch(statements);
  return {
    id: generationId,
    status: "processing",
    format: outputFormat,
    mimeType: outputMimeType,
    creditsCharged: credits,
    r2Key: null,
    expiresAt
  };
}

export async function markSoundGenerationReady(env, id, {
  r2Key = null,
  r2Etag = null,
  sizeBytes = null,
  durationSeconds = null,
  sampleRate = null,
  channels = null
} = {}) {
  requireDb(env);
  const generationId = String(id || "").trim();
  if (!generationId) throw new Error("Sound generation ID is required");

  const size = sizeBytes === null || sizeBytes === undefined ? null : Number(sizeBytes);
  if (size !== null && (!Number.isInteger(size) || size < 0)) throw new Error("sizeBytes must be a non-negative integer");

  const result = await env.DB.prepare(`
    UPDATE sound_generations
    SET status = 'ready',
        r2_key = ?,
        r2_etag = ?,
        size_bytes = ?,
        duration_seconds = COALESCE(?, duration_seconds),
        sample_rate = COALESCE(?, sample_rate),
        channels = COALESCE(?, channels),
        completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).bind(
    r2Key,
    r2Etag,
    size,
    durationSeconds === null || durationSeconds === undefined ? null : Number(durationSeconds),
    sampleRate === null || sampleRate === undefined ? null : Number(sampleRate),
    channels === null || channels === undefined ? null : Number(channels),
    generationId
  ).run();

  if (!result.meta?.changes) throw new Error("Sound generation not found");
  return { id: generationId, status: "ready" };
}

export async function markSoundGenerationFailed(env, id, status = "failed") {
  requireDb(env);
  const generationId = String(id || "").trim();
  const safeStatus = normalizeStatus(status);
  if (safeStatus !== "failed" && safeStatus !== "storage_failed") {
    throw new Error("Sound generation failure status must be failed or storage_failed");
  }
  if (!generationId) throw new Error("Sound generation ID is required");

  const result = await env.DB.prepare(`
    UPDATE sound_generations
    SET status = ?, completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).bind(safeStatus, generationId).run();

  if (!result.meta?.changes) throw new Error("Sound generation not found");
  return { id: generationId, status: safeStatus };
}

export async function getSoundGeneration(env, id) {
  requireDb(env);
  const generationId = String(id || "").trim();
  if (!generationId) throw new Error("Sound generation ID is required");

  return env.DB.prepare(`
    SELECT id, user_id, provider, provider_generation_id, type, prompt,
           source_type, source_asset_id, duration_seconds, sample_rate, channels,
           format, mime_type, status, r2_key, r2_etag, size_bytes,
           credits_charged, credit_reference_id, parent_generation_id, folder_id,
           created_at, completed_at, expires_at
    FROM sound_generations
    WHERE id = ?
    LIMIT 1
  `).bind(generationId).first();
}
