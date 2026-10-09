import app from "./index.js";
import { handleAuth } from "./auth.js";
import { handlePayfast, runBillingCron } from "./payfast.js";
import { getVoiceById, getVoiceByProviderId, syncVoiceRegistry, seedMissingVoiceSamples } from "./voice-registry.js";
import { createGeneration, markGenerationReady, markGenerationFailed, cleanupExpiredGenerations, mimeTypeForFormat } from "./generations.js";
import { processSvaraFlow, translateSvaraFlowPlan } from "./svaraflow-voice.js";
import { handleSoundGenerate } from "./sound-api.js";
import { ensureSoundProviderCapabilities } from "./sound-capabilities.js";

const PORTRAIT_NAMES = {
  en: "thalia",
  es: "celeste",
  de: "julius",
  fr: "agathe",
  nl: "rhea",
  it: "livia",
  ja: "izanami"
};

const SESSION_COOKIE = "svara_session";
const MAX_GENERATION_CHARS = 10000;
const LEGACY_PROVIDER_VOICE_IDS = {
  "svara-amara-01": "aura-2-thalia-en",
  "svara-james-01": "aura-2-orion-en",
  "svara-thandi-01": "aura-2-thalia-en",
  "svara-daniel-01": "aura-2-orion-en",
  "svara-lea-01": "aura-2-thalia-en",
  "svara-premium-01": "aura-2-thalia-en"
};

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function sessionToken(request) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === SESSION_COOKIE) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return "";
}

async function authenticatedUserId(request, env) {
  if (!env.DB) return null;
  const token = sessionToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT u.id
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')
      AND u.status = 'active'
    LIMIT 1
  `).bind(tokenHash).first();
  return row?.id || null;
}

function fullVoiceCatalogueEnabled(env) {
  const value = String(env.SVARAONE_FULL_VOICE_CATALOGUE ?? "").trim().toLowerCase();
  if (value === "true" || value === "1" || value === "yes") return true;
  if (value === "false" || value === "0" || value === "no") return false;
  return false;
}

async function voiceAccess(request, env) {
  const fullCatalogue = fullVoiceCatalogueEnabled(env);
  if (fullCatalogue) return { fullCatalogue: true, voiceIds: [] };

  const userId = await authenticatedUserId(request, env);
  if (!userId || !env.DB) return { fullCatalogue: false, voiceIds: [] };
  const rows = await env.DB.prepare(
    "SELECT voice_id FROM user_voices WHERE user_id = ? AND revoked_at IS NULL ORDER BY granted_at ASC"
  ).bind(userId).all();
  return {
    fullCatalogue: false,
    voiceIds: (rows.results || []).map(row => String(row.voice_id || "")).filter(Boolean)
  };
}

async function resolveProviderVoiceId(body, env) {
  const requested = String(body?.providerVoiceId || "").trim();
  if (/^aura-2-[a-z0-9-]+$/.test(requested)) return requested;
  const svaraId = String(body?.voiceId || "").trim();
  if (/^svara-[a-z0-9-]+$/.test(svaraId)) {
    const voice = await getVoiceById(env, svaraId);
    if (voice) return voice.providerVoiceId;
  }
  const legacy = LEGACY_PROVIDER_VOICE_IDS[svaraId] || "";
  if (legacy) return legacy;
  return "";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function generationCost(text, env) {
  const factor = Number(env.SVARAONE_CREDIT_FACTOR);
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 1;
  const normalizedCharacters = Math.max(100, Math.ceil(text.length / 100) * 100);
  return Math.max(1, Math.ceil(normalizedCharacters * safeFactor));
}

async function reserveCredits(userId, cost, env, referenceId = crypto.randomUUID()) {
  const result = await env.DB.prepare(`
    INSERT INTO credit_ledger
      (id, user_id, amount, balance_after, reason, reference_id, period_key)
    SELECT ?, ?, ?, balance_after - ?, 'generation', ?, 'generation'
    FROM credit_ledger
    WHERE user_id = ?
      AND balance_after >= ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(
    crypto.randomUUID(), userId, -cost, cost, referenceId, userId, cost
  ).run();

  if (!result.meta?.changes) return null;
  const balance = await env.DB.prepare(
    "SELECT balance_after FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(userId).first("balance_after");
  return { referenceId, balance: Number(balance || 0) };
}

async function refundCredits(userId, cost, referenceId, env) {
  await env.DB.prepare(`
    INSERT INTO credit_ledger
      (id, user_id, amount, balance_after, reason, reference_id, period_key)
    SELECT ?, ?, ?, balance_after + ?, 'generation_refund', ?, 'generation'
    FROM credit_ledger
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(
    crypto.randomUUID(), userId, cost, cost, referenceId, userId
  ).run();
}

async function storedPortrait(env, code) {
  if (!env.VOICE_SAMPLES) return null;

  const cleanCode = String(code || "").replace(/-v\d+$/, "");
  const portraitName = PORTRAIT_NAMES[cleanCode];
  if (!portraitName) return null;

  for (const extension of ["webp", "png"]) {
    const key = `portraits/${portraitName}.${extension}`;
    const object = await env.VOICE_SAMPLES.get(key);
    if (!object) continue;

    return new Response(object.body, {
      headers: {
        "content-type": extension === "webp" ? "image/webp" : "image/png",
        "cache-control": "public, max-age=31536000, immutable",
        "etag": object.httpEtag || ""
      }
    });
  }

  return null;
}

async function storedBrandLogo(env) {
  if (!env.VOICE_SAMPLES) return null;
  const object = await env.VOICE_SAMPLES.get("branding/svaraone-logo.png");
  if (!object) return null;

  return new Response(object.body, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
      "etag": object.httpEtag || ""
    }
  });
}

async function storedHeroBackground(env) {
  if (!env.VOICE_SAMPLES) return null;
  const object = await env.VOICE_SAMPLES.get("branding/hero-bg.png");
  if (!object) return null;

  return new Response(object.body, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
      "etag": object.httpEtag || ""
    }
  });
}

async function storedSoundAsset(request, env, userId, generationId) {
  if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Sound asset storage is not configured." }, 503);

  const generation = await env.DB.prepare(`
    SELECT id, user_id, status, r2_key, format, mime_type, size_bytes, duration_seconds
    FROM sound_generations
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `).bind(generationId, userId).first();

  if (!generation) return json({ error: "Sound generation not found." }, 404);
  if (String(generation.status) !== "ready" || !generation.r2_key) {
    return json({ error: "Sound asset is not ready." }, 409);
  }

  const totalSize = Number(generation.size_bytes);
  const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
  const rangeHeader = request.headers.get("Range");
  let object;
  let status = 200;
  const headers = new Headers({
    "content-type": String(generation.mime_type || mimeTypeForFormat(generation.format || "mp3")),
    "cache-control": "private, no-store",
    "accept-ranges": "bytes",
    "x-svaraone-generation-id": String(generation.id)
  });

  if (rangeHeader && Number.isFinite(totalSize) && totalSize > 0) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match) {
      headers.set("content-range", `bytes */${totalSize}`);
      return new Response(null, { status: 416, headers });
    }

    let start;
    let end;
    if (match[1] === "") {
      const suffixLength = Number(match[2]);
      if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
        headers.set("content-range", `bytes */${totalSize}`);
        return new Response(null, { status: 416, headers });
      }
      start = Math.max(0, totalSize - suffixLength);
      end = totalSize - 1;
    } else {
      start = Number(match[1]);
      end = match[2] === "" ? totalSize - 1 : Number(match[2]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= totalSize || end < start) {
        headers.set("content-range", `bytes */${totalSize}`);
        return new Response(null, { status: 416, headers });
      }
      end = Math.min(end, totalSize - 1);
    }

    object = await env.GENERATED_AUDIO.get(generation.r2_key, {
      range: { offset: start, length: end - start + 1 }
    });
    if (!object) return json({ error: "Sound asset not found." }, 404);

    const length = end - start + 1;
    headers.set("content-length", String(length));
    headers.set("content-range", `bytes ${start}-${end}/${totalSize}`);
    status = 206;
  } else {
    object = await env.GENERATED_AUDIO.get(generation.r2_key);
    if (!object) return json({ error: "Sound asset not found." }, 404);
    if (object.size !== undefined) headers.set("content-length", String(object.size));
  }

  if (object.httpEtag) headers.set("etag", object.httpEtag);
  if (wantsDownload) {
    const extension = String(generation.format || "mp3").toLowerCase();
    headers.set("content-disposition", 'attachment; filename="svaraone-sound-' + String(generation.id) + '.' + extension + '"');
  }
  return new Response(object.body, { status, headers });
}

function pricing(env) {
  const number = (name, fallback) => {
    const value = Number(env[name]);
    return Number.isFinite(value) ? value : fallback;
  };
  const boolean = (name, fallback) => {
    const value = String(env[name] ?? "").trim().toLowerCase();
    if (value === "true" || value === "1" || value === "yes") return true;
    if (value === "false" || value === "0" || value === "no") return false;
    return fallback;
  };

  return {
    currency: "USD",
    billing: "annual",
    creditFactor: number("SVARAONE_CREDIT_FACTOR", 1),
    fullVoiceCatalogue: boolean("SVARAONE_FULL_VOICE_CATALOGUE", false),
    free: {
      price: 0,
      credits: number("SVARAONE_FREE_CREDITS", 5000),
      billing: "one-time",
      voices: number("SVARAONE_FREE_VOICES", 3)
    },
    plans: {
      starter: { price: number("SVARAONE_STARTER_PRICE", 120), credits: number("SVARAONE_STARTER_CREDITS", 75000), voices: number("SVARAONE_STARTER_VOICES", 10) },
      creator: { price: number("SVARAONE_CREATOR_PRICE", 240), credits: number("SVARAONE_CREATOR_CREDITS", 250000), voices: number("SVARAONE_CREATOR_VOICES", 20) },
      pro: { price: number("SVARAONE_PRO_PRICE", 480), credits: number("SVARAONE_PRO_CREDITS", 600000), voices: number("SVARAONE_PRO_VOICES", 90) },
      studio: { price: number("SVARAONE_STUDIO_PRICE", 840), credits: number("SVARAONE_STUDIO_CREDITS", 1500000), voices: number("SVARAONE_STUDIO_VOICES", 90) }
    }
  };
}

async function handleFreeTake(request, env, ctx, body, userId) {
  const generationId = String(body?.generationId || "").trim();
  const script = String(body?.text ?? "");
  if (!generationId) return json({ error: "Generation ID is required." }, 400);
  if (!script) return json({ error: "Text is required." }, 400);
  if (script.length > MAX_GENERATION_CHARS) return json({ error: `Maximum ${MAX_GENERATION_CHARS} characters per generation` }, 400);

  const generation = await env.DB.prepare(`
    SELECT id, user_id, voice_id, provider_voice_id, voice_name, script,
           speed, stability, style, format, credits_charged, is_free_take,
           take_number, status, r2_key
    FROM generations
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `).bind(generationId, userId).first();

  if (!generation) return json({ error: "Generation not found." }, 404);
  if (String(generation.script || "") !== script) return json({ error: "Free take is no longer available because the script changed." }, 409);
  if (Number(generation.is_free_take) === 1 || Number(generation.take_number) !== 1) return json({ error: "Free take has already been used." }, 409);
  if (String(generation.status || "") !== "ready") return json({ error: "Generation is not ready for another take." }, 409);
  if (!generation.r2_key) return json({ error: "Original audio storage is unavailable." }, 409);

  const claim = await env.DB.prepare(`
    UPDATE generations
    SET status = 'generating'
    WHERE id = ? AND user_id = ? AND status = 'ready'
      AND take_number = 1 AND is_free_take = 0 AND script = ?
  `).bind(generationId, userId, script).run();

  if (!claim.meta?.changes) return json({ error: "Free take is no longer available." }, 409);

  try {
    const providerRequest = new Request(request.url, {
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify({
        voiceId: String(generation.voice_id || ""),
        providerVoiceId: String(generation.provider_voice_id || ""),
        text: String(generation.script || ""),
        format: String(generation.format || "mp3"),
        speed: Number(generation.speed) || 1,
        stability: Number.isFinite(Number(generation.stability)) ? Number(generation.stability) : 50,
        style: String(generation.style || "")
      })
    });

    const response = await app.fetch(providerRequest, env, ctx);
    if (!response.ok) {
      await env.DB.prepare("UPDATE generations SET status = 'ready' WHERE id = ? AND user_id = ? AND status = 'generating'").bind(generationId, userId).run();
      return response;
    }
    if (!response.body) throw new Error("Free take response had no body");

    const audioBytes = await response.arrayBuffer();
    if (!audioBytes.byteLength) throw new Error("Free take response was empty");

    const format = String(generation.format || "mp3").toLowerCase();
    const storedObject = await env.GENERATED_AUDIO.put(generation.r2_key, audioBytes, {
      httpMetadata: {
        contentType: mimeTypeForFormat(format),
        cacheControl: "private, no-store"
      },
      customMetadata: {
        generationId,
        userId,
        voiceId: String(generation.voice_id || ""),
        providerVoiceId: String(generation.provider_voice_id || ""),
        format,
        take: "2"
      }
    });

    if (!storedObject) throw new Error("R2 did not confirm the free take upload");

    await env.DB.prepare(`
      UPDATE generations
      SET status = 'ready',
          take_number = 2,
          is_free_take = 1,
          r2_etag = ?,
          size_bytes = ?,
          completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ? AND user_id = ? AND status = 'generating'
    `).bind(
      storedObject.etag || null,
      Number.isFinite(Number(audioBytes.byteLength)) ? Number(audioBytes.byteLength) : null,
      generationId,
      userId
    ).run();

    const headers = new Headers(response.headers);
    headers.set("X-SvaraONE-Generation-ID", generationId);
    headers.set("X-SvaraONE-Free-Take", "true");
    return new Response(audioBytes, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    try {
      await env.DB.prepare("UPDATE generations SET status = 'ready' WHERE id = ? AND user_id = ? AND status = 'generating'").bind(generationId, userId).run();
    } catch (restoreError) {
      console.error("free_take_restore_error", restoreError);
    }
    console.error("free_take_error", error);
    return json({ error: "Free take could not be saved." }, 502);
  }
}

export default {
  async fetch(request, env, ctx) {
    const authResponse = await handleAuth(request, env);
    if (authResponse) return authResponse;

    const payfastResponse = await handlePayfast(request, env);
    if (payfastResponse) return payfastResponse;

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/compositions/export") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.GENERATED_AUDIO) return json({ error: "Composition storage is not configured." }, 503);

      const contentType = String(request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      const format = String(request.headers.get("x-svara-composition-format") || "").trim().toLowerCase();
      const expectedTypes = { wav: "audio/wav", mp3: "audio/mpeg", pcm: "audio/l16" };
      const extensionByFormat = { wav: "wav", mp3: "mp3", pcm: "pcm" };
      if (!expectedTypes[format] || contentType !== expectedTypes[format]) {
        return json({ error: "Select a supported matching export format: WAV, MP3 or PCM." }, 415);
      }
      if (!request.body) return json({ error: "Composition audio is required." }, 400);

      const declaredSize = Number(request.headers.get("x-svara-composition-size") || request.headers.get("content-length") || 0);
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (!Number.isInteger(declaredSize) || declaredSize < 4) return json({ error: "A valid audio byte length is required." }, 400);
      if (contentLength > 0 && contentLength !== declaredSize) return json({ error: "Audio content length does not match the declared export size." }, 400);
      if (declaredSize > 80000000) return json({ error: "Composition export exceeds the current 80 MB limit." }, 413);
      const durationSeconds = Number(request.headers.get("x-svara-composition-duration") || 0);
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 420) {
        return json({ error: "Composition duration must be greater than zero and no longer than 7 minutes." }, 400);
      }
      const trackCount = Number(request.headers.get("x-svara-composition-track-count") || 0);
      if (!Number.isInteger(trackCount) || trackCount < 1 || trackCount > 100) {
        return json({ error: "Composition track count is invalid." }, 400);
      }

      const requestedFilename = String(request.headers.get("x-svara-composition-filename") || "")
        .replace(/[\\/]/g, "")
        .replace(/[^a-zA-Z0-9 _().-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[. ]+$/g, "");
      const baseFilename = requestedFilename.replace(/\.(wav|mp3|pcm)$/i, "").trim().slice(0, 120);
      if (!baseFilename || baseFilename === "." || baseFilename === "..") {
        return json({ error: "A valid composition filename is required." }, 400);
      }
      const extension = extensionByFormat[format];
      const filename = baseFilename + "." + extension;
      const id = crypto.randomUUID();
      const key = "users/" + userId + "/compositions/" + id + "." + extension;
      const createdAt = new Date().toISOString();
      if (format === "pcm" && (declaredSize % 4 !== 0 || Math.abs(durationSeconds - declaredSize / 96000) > 0.02)) {
        return json({ error: "PCM byte length does not match 24 kHz, 16-bit stereo audio duration." }, 400);
      }

      try {
        let receivedBytes = 0;
        const firstBytes = new Uint8Array(44);
        let firstBytesLength = 0;
        let formatChecked = format === "pcm";
        const validatedAudioBody = request.body.pipeThrough(new TransformStream({
          transform(chunk, controller) {
            receivedBytes += chunk.byteLength;
            if (receivedBytes > 80000000) throw new Error("COMPOSITION_EXPORT_TOO_LARGE");
            if (firstBytesLength < firstBytes.length) {
              const take = Math.min(firstBytes.length - firstBytesLength, chunk.byteLength);
              firstBytes.set(chunk.subarray(0, take), firstBytesLength);
              firstBytesLength += take;
            }
            if (!formatChecked && format === "wav" && firstBytesLength >= 44) {
              const header = new DataView(firstBytes.buffer);
              const textAt = (offset, length) => String.fromCharCode(...firstBytes.subarray(offset, offset + length));
              const dataLength = header.getUint32(40, true);
              const wavDurationSeconds = dataLength / (44100 * 4);
              if (
                textAt(0, 4) !== "RIFF" ||
                textAt(8, 4) !== "WAVE" ||
                textAt(12, 4) !== "fmt " ||
                header.getUint32(16, true) !== 16 ||
                header.getUint16(20, true) !== 1 ||
                header.getUint16(22, true) !== 2 ||
                header.getUint32(24, true) !== 44100 ||
                header.getUint16(34, true) !== 16 ||
                textAt(36, 4) !== "data" ||
                dataLength < 4 ||
                dataLength % 4 !== 0 ||
                Math.abs(durationSeconds - wavDurationSeconds) > 0.02
              ) throw new Error("INVALID_COMPOSITION_WAV");
              formatChecked = true;
            }
            if (!formatChecked && format === "mp3" && firstBytesLength >= 3) {
              const isId3 = firstBytes[0] === 0x49 && firstBytes[1] === 0x44 && firstBytes[2] === 0x33;
              const isMpegFrame = firstBytes[0] === 0xff && (firstBytes[1] & 0xe0) === 0xe0;
              if (!isId3 && !isMpegFrame) throw new Error("INVALID_COMPOSITION_MP3");
              formatChecked = true;
            }
            controller.enqueue(chunk);
          },
          flush() {
            if (receivedBytes !== declaredSize) throw new Error("INVALID_COMPOSITION_LENGTH");
            if (format === "wav") {
              const header = new DataView(firstBytes.buffer);
              if (
                !formatChecked ||
                receivedBytes !== 44 + header.getUint32(40, true) ||
                receivedBytes !== 8 + header.getUint32(4, true)
              ) throw new Error("INVALID_COMPOSITION_WAV");
            } else if (format === "mp3") {
              if (!formatChecked || receivedBytes < 100) throw new Error("INVALID_COMPOSITION_MP3");
            } else if (format === "pcm") {
              if (receivedBytes % 4 !== 0 || Math.abs(durationSeconds - receivedBytes / 96000) > 0.02) {
                throw new Error("INVALID_COMPOSITION_PCM");
              }
            }
          }
        }));
        const fixedLengthAudio = new FixedLengthStream(declaredSize);
        const storedPromise = env.GENERATED_AUDIO.put(key, fixedLengthAudio.readable, {
          httpMetadata: {
            contentType: format === "wav" ? "audio/wav" : format === "mp3" ? "audio/mpeg" : "audio/l16;rate=24000;channels=2",
            cacheControl: "private, no-store"
          },
          customMetadata: {
            compositionExportId: id,
            userId,
            filename,
            format,
            durationSeconds: String(durationSeconds),
            trackCount: String(trackCount),
            sampleRate: format === "pcm" ? "24000" : "44100",
            channels: "2",
            createdAt
          }
        });
        const validationPromise = validatedAudioBody.pipeTo(fixedLengthAudio.writable);
        const [stored] = await Promise.all([storedPromise, validationPromise.then(() => null)]);
        if (!stored) throw new Error("R2 did not confirm the Composition upload.");
        if (Number(stored.size) !== declaredSize) {
          await env.GENERATED_AUDIO.delete(key);
          return json({ error: "Uploaded audio size did not match the declared content length." }, 400);
        }
        return json({
          success: true,
          id,
          filename,
          format: format.toUpperCase(),
          mimeType: format === "wav" ? "audio/wav" : format === "mp3" ? "audio/mpeg" : "audio/l16;rate=24000;channels=2",
          durationSeconds,
          trackCount,
          sizeBytes: Number(stored.size),
          createdAt,
          assetUrl: "/api/compositions/assets/" + id
        });
      } catch (error) {
        try { await env.GENERATED_AUDIO.delete(key); } catch (cleanupError) { console.error("composition_export_cleanup_error", cleanupError); }
        if (error?.message === "COMPOSITION_EXPORT_TOO_LARGE") return json({ error: "Composition export exceeds the current 80 MB limit." }, 413);
        if (error?.message === "INVALID_COMPOSITION_WAV") return json({ error: "The uploaded file is not a complete supported PCM WAV." }, 400);
        if (error?.message === "INVALID_COMPOSITION_MP3") return json({ error: "The uploaded file is not a valid MP3 stream." }, 400);
        if (error?.message === "INVALID_COMPOSITION_PCM") return json({ error: "The uploaded file is not a complete supported PCM stream." }, 400);
        if (error?.message === "INVALID_COMPOSITION_LENGTH") return json({ error: "Uploaded audio size did not match the declared content length." }, 400);
        console.error("composition_export_storage_error", error);
        return json({ error: "Composition could not be saved to R2. No saved asset was confirmed." }, 502);
      }
    }

    if (request.method === "GET" && url.pathname === "/api/compositions") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.GENERATED_AUDIO) return json({ error: "Composition storage is not configured." }, 503);
      try {
        const requestedLimit = Number(url.searchParams.get("limit") || 100);
        const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 100;
        const search = String(url.searchParams.get("search") || "").trim().toLowerCase();
        const prefix = "users/" + userId + "/compositions/";
        const candidates = [];
        let cursor;
        let scanned = 0;
        do {
          const page = await env.GENERATED_AUDIO.list({
            prefix,
            limit: Math.min(1000, Math.max(1, 1000 - scanned)),
            include: ["httpMetadata", "customMetadata"],
            ...(cursor ? { cursor } : {})
          });
          candidates.push(...(page.objects || []).filter(object => /\.(wav|mp3|pcm)$/i.test(String(object.key || ""))));
          scanned += (page.objects || []).length;
          if (!page.truncated || !page.cursor || scanned >= 1000) break;
          cursor = page.cursor;
        } while (scanned < 1000);

        const compositions = candidates.map(object => {
          const key = String(object.key || "");
          const filenameFromKey = key.split("/").pop() || "";
          const extension = filenameFromKey.split(".").pop()?.toLowerCase() || "wav";
          const id = filenameFromKey.slice(0, -(extension.length + 1));
          const meta = object.customMetadata || {};
          const filename = String(meta.filename || filenameFromKey);
          return {
            id: String(meta.compositionExportId || id),
            filename,
            format: String(meta.format || extension).toUpperCase(),
            mimeType: String(object.httpMetadata?.contentType || (extension === "mp3" ? "audio/mpeg" : extension === "pcm" ? "audio/l16;rate=24000;channels=2" : "audio/wav")),
            durationSeconds: Number(meta.durationSeconds) || 0,
            trackCount: Number(meta.trackCount) || 0,
            sizeBytes: Number(object.size) || 0,
            createdAt: String(meta.createdAt || object.uploaded?.toISOString?.() || ""),
            assetUrl: "/api/compositions/assets/" + id
          };
        }).filter(item => {
          if (!search) return true;
          return (item.filename + " " + item.format).toLowerCase().includes(search);
        }).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)).slice(0, limit);

        return json({ compositions, count: compositions.length, limit });
      } catch (error) {
        console.error("composition_list_error", error);
        return json({ error: "Could not load saved compositions." }, 500);
      }
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/compositions/assets/") && url.pathname.split("/").length === 5) {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.GENERATED_AUDIO) return json({ error: "Composition storage is not configured." }, 503);

      let id = "";
      try { id = decodeURIComponent(url.pathname.split("/").pop() || ""); } catch {}
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Composition asset not found." }, 404);

      const prefix = "users/" + userId + "/compositions/" + id + ".";
      const candidates = await env.GENERATED_AUDIO.list({ prefix, limit: 5 });
      const listed = (candidates.objects || []).find(item => /\.(wav|mp3|pcm)$/i.test(String(item.key || "")));
      if (!listed?.key) return json({ error: "Composition asset not found." }, 404);
      const key = String(listed.key);
      const metadata = await env.GENERATED_AUDIO.head(key);
      if (!metadata || (metadata.customMetadata?.userId && metadata.customMetadata.userId !== userId)) {
        return json({ error: "Composition asset not found." }, 404);
      }

      const basename = key.split("/").pop() || ("svaraone-composition-" + id + ".wav");
      const extension = basename.split(".").pop()?.toLowerCase() || "wav";
      const format = String(metadata.customMetadata?.format || extension).toLowerCase();
      const rawContentType = String(metadata.httpMetadata?.contentType || "");
      const contentType = format === "wav" ? "audio/wav" : format === "mp3" ? "audio/mpeg" : rawContentType || "audio/l16;rate=24000;channels=2";
      const totalSize = Number(metadata.size || 0);
      const minimumSize = format === "wav" ? 44 : format === "mp3" ? 100 : 4;
      if (!Number.isFinite(totalSize) || totalSize < minimumSize) return json({ error: "Composition asset is unavailable." }, 404);

      const wantsDownload = url.searchParams.get("download") === "1";
      const wantsPcmPreview = format === "pcm" && url.searchParams.get("preview") === "1" && !wantsDownload;
      const storedFilename = String(metadata.customMetadata?.filename || basename).replace(/["\r\n]/g, "");
      const headers = new Headers({
        "content-type": wantsPcmPreview ? "audio/wav" : contentType,
        "cache-control": "private, no-store",
        "x-svaraone-composition-id": id
      });

      if (wantsPcmPreview) {
        if (totalSize % 4 !== 0) return json({ error: "PCM asset is incomplete." }, 404);
        const pcmObject = await env.GENERATED_AUDIO.get(key);
        if (!pcmObject) return json({ error: "Composition asset not found." }, 404);
        const previewFilename = storedFilename.replace(/\.pcm$/i, ".wav");
        headers.set("content-length", String(totalSize + 44));
        headers.set("content-disposition", 'inline; filename="' + previewFilename + '"');
        const wavHeaderBuffer = new ArrayBuffer(44);
        const wavHeader = new DataView(wavHeaderBuffer);
        const writeString = (offset, value) => {
          for (let index = 0; index < value.length; index++) wavHeader.setUint8(offset + index, value.charCodeAt(index));
        };
        writeString(0, "RIFF");
        wavHeader.setUint32(4, 36 + totalSize, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        wavHeader.setUint32(16, 16, true);
        wavHeader.setUint16(20, 1, true);
        wavHeader.setUint16(22, 2, true);
        wavHeader.setUint32(24, 24000, true);
        wavHeader.setUint32(28, 24000 * 2 * 2, true);
        wavHeader.setUint16(32, 4, true);
        wavHeader.setUint16(34, 16, true);
        writeString(36, "data");
        wavHeader.setUint32(40, totalSize, true);
        const reader = pcmObject.body.getReader();
        const previewStream = new ReadableStream({
          async start(controller) {
            controller.enqueue(new Uint8Array(wavHeaderBuffer));
            try {
              while (true) {
                const part = await reader.read();
                if (part.done) break;
                controller.enqueue(part.value);
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            } finally {
              reader.releaseLock();
            }
          },
          cancel(reason) {
            return reader.cancel(reason);
          }
        });
        return new Response(previewStream, { status: 200, headers });
      }

      const rangeHeader = request.headers.get("Range");
      let object;
      let status = 200;
      headers.set("accept-ranges", "bytes");
      headers.set("content-disposition", (wantsDownload ? "attachment" : "inline") + '; filename="' + storedFilename + '"');
      if (metadata.httpEtag) headers.set("etag", metadata.httpEtag);

      if (rangeHeader) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
        if (!match) {
          headers.set("content-range", "bytes */" + totalSize);
          return new Response(null, { status: 416, headers });
        }
        let rangeStart;
        let rangeEnd;
        if (match[1] === "") {
          const suffixLength = Number(match[2]);
          if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
            headers.set("content-range", "bytes */" + totalSize);
            return new Response(null, { status: 416, headers });
          }
          rangeStart = Math.max(0, totalSize - suffixLength);
          rangeEnd = totalSize - 1;
        } else {
          rangeStart = Number(match[1]);
          rangeEnd = match[2] === "" ? totalSize - 1 : Number(match[2]);
          if (!Number.isInteger(rangeStart) || !Number.isInteger(rangeEnd) || rangeStart < 0 || rangeStart >= totalSize || rangeEnd < rangeStart) {
            headers.set("content-range", "bytes */" + totalSize);
            return new Response(null, { status: 416, headers });
          }
          rangeEnd = Math.min(rangeEnd, totalSize - 1);
        }
        object = await env.GENERATED_AUDIO.get(key, { range: { offset: rangeStart, length: rangeEnd - rangeStart + 1 } });
        if (!object) return json({ error: "Composition asset not found." }, 404);
        headers.set("content-length", String(rangeEnd - rangeStart + 1));
        headers.set("content-range", "bytes " + rangeStart + "-" + rangeEnd + "/" + totalSize);
        status = 206;
      } else {
        object = await env.GENERATED_AUDIO.get(key);
        if (!object) return json({ error: "Composition asset not found." }, 404);
        headers.set("content-length", String(totalSize));
      }
      if (object.httpEtag) headers.set("etag", object.httpEtag);
      return new Response(object.body, { status, headers });
    }

    if (request.method === "GET" && url.pathname === "/api/branding/svaraone-logo.png") {
      const logo = await storedBrandLogo(env);
      if (logo) return logo;
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET" && url.pathname === "/api/branding/hero-bg.png") {
      const heroBackground = await storedHeroBackground(env);
      if (heroBackground) return heroBackground;
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/branding/studio-") && url.pathname.endsWith("-card.png")) {
      const filename = url.pathname.split("/").pop() || "";
      const allowed = new Set([
        "studio-voice-card.png",
        "studio-sound-card.png",
        "studio-video-card.png",
        "studio-compose-card.png"
      ]);
      if (allowed.has(filename) && env.VOICE_SAMPLES) {
        const object = await env.VOICE_SAMPLES.get(`branding/${filename}`);
        if (object) {
          return new Response(object.body, {
            headers: {
              "content-type": "image/png",
              "cache-control": "public, max-age=31536000, immutable",
              "etag": object.httpEtag || ""
            }
          });
        }
      }
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET" && url.pathname === "/api/pricing") {
      return new Response(JSON.stringify(pricing(env)), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/api/voice-access") {
      try {
        return json(await voiceAccess(request, env));
      } catch (error) {
        console.error("voice_access_error", error);
        return json({ fullCatalogue: false, voiceIds: [], error: "Voice access service unavailable." }, 503);
      }
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/voice-portraits/")) {
      const code = url.pathname.split("/").pop();
      const portrait = await storedPortrait(env, code);
      if (portrait) return portrait;
    }

    if (request.method === "GET" && url.pathname === "/api/sound/capabilities") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      const { handleSoundCapabilities } = await import("./sound-capabilities.js");
      return handleSoundCapabilities(request, env);
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/sound/assets/") && url.pathname.split("/").length === 5) {
      const generationId = decodeURIComponent(url.pathname.split("/").pop() || "");
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      return storedSoundAsset(request, env, userId, generationId);
    }

    if (request.method === "GET" && url.pathname === "/api/sound/generations") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Sound history storage is not configured." }, 503);

      const requestedLimit = Number(url.searchParams.get("limit") || 20);
      const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20;
      const requestedPage = Number(url.searchParams.get("page") || 1);
      const page = Number.isInteger(requestedPage) ? Math.max(requestedPage, 1) : 1;
      const offset = (page - 1) * limit;
      const requestedStatus = String(url.searchParams.get("status") || "").trim().toLowerCase();
      const requestedType = String(url.searchParams.get("type") || "").trim().toLowerCase();
      const requestedSourceType = String(url.searchParams.get("sourceType") || "").trim().toLowerCase();
      const requestedFormat = String(url.searchParams.get("format") || "").trim().toLowerCase();
      const requestedDate = String(url.searchParams.get("date") || "").trim().toLowerCase();
      const requestedFolder = String(url.searchParams.get("folderId") || "").trim();

      const requestedSearch = String(url.searchParams.get("search") || "").trim().toLowerCase();
      const allowedStatuses = new Set(["processing", "ready", "failed", "storage_failed"]);
      const allowedDates = new Set(["today", "7d", "30d"]);
      if (requestedStatus && !allowedStatuses.has(requestedStatus)) return json({ error: "Invalid Sound generation status." }, 400);
      if (requestedDate && !allowedDates.has(requestedDate)) return json({ error: "Invalid Sound generation date filter." }, 400);

      const conditions = ["sg.user_id = ?"];
      const bindings = [userId];
      if (requestedStatus) { conditions.push("sg.status = ?"); bindings.push(requestedStatus); }
      if (requestedType) { conditions.push("LOWER(sg.type) = ?"); bindings.push(requestedType); }
      if (requestedSourceType) { conditions.push("LOWER(sg.source_type) = ?"); bindings.push(requestedSourceType); }
      if (requestedFormat) { conditions.push("LOWER(sg.format) = ?"); bindings.push(requestedFormat); }
      if (requestedFolder) { if (requestedFolder === "__unfiled__") conditions.push("sg.folder_id IS NULL"); else { conditions.push("sg.folder_id = ?"); bindings.push(requestedFolder); } }
      if (requestedSearch) {
        conditions.push("(LOWER(COALESCE(sg.prompt, '')) LIKE ? OR LOWER(COALESCE(sg.type, '')) LIKE ? OR LOWER(COALESCE(sg.source_type, '')) LIKE ?)");
        const searchTerm = "%" + requestedSearch + "%";
        bindings.push(searchTerm, searchTerm, searchTerm);
      }
      if (requestedDate) {
        const dateModifier = requestedDate === "today" ? "-1 day" : requestedDate === "7d" ? "-7 days" : "-30 days";
        conditions.push("sg.created_at >= datetime('now', ?)");
        bindings.push(dateModifier);
      }

      const where = conditions.join(" AND ");
      const totalRow = await env.DB.prepare("SELECT COUNT(*) AS total FROM sound_generations sg WHERE " + where).bind(...bindings).first();
      const total = Number(totalRow?.total || 0);
      const rows = await env.DB.prepare(`
        SELECT
          sg.id,
          sg.user_id,
          sg.provider,
          sg.provider_generation_id,
          sg.type,
          sg.prompt,
          sg.source_type,
          sg.source_asset_id,
          sg.duration_seconds,
          sg.sample_rate,
          sg.channels,
          sg.format,
          sg.mime_type,
          sg.status,
          sg.r2_key,
          sg.r2_etag,
          sg.size_bytes,
          sg.credits_charged,
          sg.credit_reference_id,
          sg.parent_generation_id,
          sg.folder_id,
          lf.name AS folder_name,
          sg.created_at,
          sg.completed_at,
          sg.expires_at
        FROM sound_generations sg
        LEFT JOIN library_folders lf
          ON lf.id = sg.folder_id
         AND lf.user_id = sg.user_id
        WHERE ${where}
        ORDER BY sg.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindings, limit, offset).all();

      const generations = (rows.results || []).map(row => ({
        id: row.id,
        provider: row.provider,
        providerGenerationId: row.provider_generation_id,
        type: row.type,
        prompt: row.prompt,
        sourceType: row.source_type,
        sourceAssetId: row.source_asset_id,
        durationSeconds: row.duration_seconds,
        sampleRate: row.sample_rate,
        channels: row.channels,
        format: row.format,
        mimeType: row.mime_type,
        status: row.status,
        r2Key: row.r2_key,
        r2Etag: row.r2_etag,
        sizeBytes: row.size_bytes,
        creditsCharged: row.credits_charged,
        creditReferenceId: row.credit_reference_id,
        parentGenerationId: row.parent_generation_id,
        folderId: row.folder_id,
        folderName: row.folder_name,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        expiresAt: row.expires_at,
        assetUrl: row.status === "ready" ? `/api/sound/assets/${encodeURIComponent(row.id)}` : null
      }));

      const pageCount = total ? Math.ceil(total / limit) : 0;
      return json({
        generations,
        count: generations.length,
        total,
        limit,
        page,
        pageCount,
        hasNext: page < pageCount,
        hasPrevious: page > 1 && pageCount > 0,
        filters: {
          status: requestedStatus || null,
          type: requestedType || null,
          sourceType: requestedSourceType || null,
          format: requestedFormat || null,
          date: requestedDate || null,
          search: requestedSearch || null
        }
      });
    }

    if (request.method === "POST" && url.pathname === "/api/sound/generate") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      return handleSoundGenerate(request, env, userId);
    }

    if (request.method === "POST" && url.pathname === "/api/voice/generate") {
      const body = await request.clone().json().catch(() => ({}));
      const userId = await authenticatedUserId(request, env);
      if (!userId) return new Response(JSON.stringify({ error: "Authentication required." }), { status: 401, headers: { "content-type": "application/json" } });
      if (!env.DB) return new Response(JSON.stringify({ error: "Account service is not configured." }), { status: 503, headers: { "content-type": "application/json" } });
      if (!env.GENERATED_AUDIO) return new Response(JSON.stringify({ error: "Generation storage is not configured." }), { status: 503, headers: { "content-type": "application/json" } });

      if (request.headers.get("X-SvaraONE-Free-Take") === "true") {
        return handleFreeTake(request, env, ctx, body, userId);
      }

      const text = String(body.text || "").trim();
      if (!text) return new Response(JSON.stringify({ error: "Text is required" }), { status: 400, headers: { "content-type": "application/json" } });
      if (text.length > MAX_GENERATION_CHARS) return new Response(JSON.stringify({ error: `Maximum ${MAX_GENERATION_CHARS} characters per generation` }), { status: 400, headers: { "content-type": "application/json" } });

      const access = await voiceAccess(request, env);
      const providerVoiceId = await resolveProviderVoiceId(body, env);
      if (!providerVoiceId) return new Response(JSON.stringify({ error: "Voice not found." }), { status: 404, headers: { "content-type": "application/json" } });
      if (!access.fullCatalogue && !access.voiceIds.includes(providerVoiceId)) {
        return new Response(JSON.stringify({ error: "That voice is not available on your current plan." }), { status: 403, headers: { "content-type": "application/json" } });
      }

      let generationText = text;
      let svaraFlowMetadata = null;
      if (body.svaraFlow === true) {
        try {
          const deliveryPlan = await processSvaraFlow(text, env);
          const translated = translateSvaraFlowPlan(text, deliveryPlan, env);
          generationText = translated.preparedScript;
          svaraFlowMetadata = translated.metadata;
        } catch (svaraFlowError) {
          console.error("svaraflow_error", svaraFlowError);
          generationText = text;
        }
      }

      const cost = generationCost(generationText, env);
      const generationId = crypto.randomUUID();
      const reservation = await reserveCredits(userId, cost, env, generationId);
      if (!reservation) return new Response(JSON.stringify({ error: "Not enough credits." }), { status: 402, headers: { "content-type": "application/json" } });

      const format = String(body.format || "mp3").toLowerCase();
      try {
        const generation = await createGeneration(env, {
          id: generationId,
          userId,
          voiceId: body.voiceId || providerVoiceId,
          providerVoiceId,
          voiceName: body.voiceName || providerVoiceId,
          script: text,
          speed: Number(body.speed) || 1,
          stability: Number.isFinite(Number(body.stability)) ? Number(body.stability) : 50,
          style: body.style || "",
          format,
          creditsCharged: cost,
          creditReferenceId: reservation.referenceId
        });

        const providerRequest = generationText === text
          ? request
          : new Request(request.url, {
              method: request.method,
              headers: new Headers(request.headers),
              body: JSON.stringify({ ...body, text: generationText })
            });
        const response = await app.fetch(providerRequest, env, ctx);
        if (!response.ok) {
          await markGenerationFailed(env, generation.id, "failed");
          await refundCredits(userId, cost, reservation.referenceId, env);
          return response;
        }

        if (!response.body) throw new Error("Generated audio response had no body");

        const audioBytes = await response.arrayBuffer();
        if (!audioBytes.byteLength) throw new Error("Generated audio response was empty");

        const storedObject = await env.GENERATED_AUDIO.put(generation.r2Key, audioBytes, {
          httpMetadata: {
            contentType: mimeTypeForFormat(format),
            cacheControl: "private, no-store"
          },
          customMetadata: {
            generationId,
            userId,
            voiceId: String(body.voiceId || providerVoiceId),
            providerVoiceId,
            format
          }
        });

        if (!storedObject) throw new Error("R2 did not confirm the generated audio upload");
        await markGenerationReady(env, generation.id, storedObject, audioBytes.byteLength);

        const headers = new Headers(response.headers);
        headers.set("X-SvaraONE-Credits-Remaining", String(reservation.balance));
        headers.set("X-SvaraONE-Generation-ID", generation.id);
        return new Response(audioBytes, { status: response.status, statusText: response.statusText, headers });
      } catch (error) {
        try { await markGenerationFailed(env, generationId, "storage_failed"); } catch (markError) { console.error("generation_failure_mark_error", markError); }
        await refundCredits(userId, cost, reservation.referenceId, env);
        console.error("generation_persistence_error", error);
        return new Response(JSON.stringify({ error: "Voice generation could not be saved. Your credits were refunded." }), {
          status: 502,
          headers: { "content-type": "application/json", "cache-control": "no-store" }
        });
      }
    }

    return app.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runBillingCron(env));
    ctx.waitUntil((async()=>{
      try {
        await syncVoiceRegistry(env);
        await seedMissingVoiceSamples(env, 3);
      } catch (error) {
        console.error("voice_registry_sync_error", error);
      }
    })());
    ctx.waitUntil((async()=>{
      try {
        const result = await cleanupExpiredGenerations(env, 100);
        if (result.deleted) console.log("generation_cleanup", result);
      } catch (error) {
        console.error("generation_cleanup_cron_error", error);
      }
    })());
    ctx.waitUntil((async()=>{
      try {
        const result = await ensureSoundProviderCapabilities(env);
        if (result.status !== "cached") console.log("sound_capability_maintenance", result);
      } catch (error) {
        console.error("sound_capability_cron_error", error);
      }
    })());
  }
};