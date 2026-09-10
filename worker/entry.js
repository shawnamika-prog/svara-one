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
        speed: generation.speed,
        stability: generation.stability,
        style: generation.style
      })
    });
    const providerId = await resolveProviderVoiceId({ voiceId: generation.voice_id, providerVoiceId: generation.provider_voice_id }, env);
    const provider = await getVoiceByProviderId(env, providerId);
    if (!provider) throw new Error("Voice provider is not configured");
    const audio = await provider.generate({ text: script, voiceId: providerId, format: generation.format || "mp3", speed: generation.speed, stability: generation.stability, style: generation.style }, env);
    const result = await provider.normalizeResult(audio, env);
    if (!result?.audio) throw new Error("Voice provider returned no audio");
    const takeNumber = 2;
    const nextId = crypto.randomUUID();
    const r2Key = `users/${userId}/generations/svara1_${String(generation.voice_name || "voice").toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}.${generation.format || "mp3"}`;
    await env.GENERATED_AUDIO.put(r2Key, result.audio, { httpMetadata: { contentType: mimeTypeForFormat(generation.format || "mp3") } });
    await env.DB.prepare(`
      INSERT INTO generations
        (id, user_id, voice_id, provider_voice_id, voice_name, script,
         speed, stability, style, format, mime_type, status, r2_key,
         size_bytes, credits_charged, is_free_take, take_number,
         parent_generation_id, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, ?, 0, 1, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).bind(nextId, userId, generation.voice_id, providerId, generation.voice_name, script, generation.speed, generation.stability, generation.style, generation.format || "mp3", mimeTypeForFormat(generation.format || "mp3"), r2Key, result.audio.length, generationId).run();
    await env.DB.prepare(`UPDATE generations SET status = 'ready' WHERE id = ?`).bind(generationId).run();
    return json({ ok: true, generationId: nextId, takeNumber, status: "ready", r2Key }, 200);
  } catch (error) {
    await env.DB.prepare(`UPDATE generations SET status = 'ready' WHERE id = ? AND user_id = ?`).bind(generationId, userId).run();
    return json({ error: String(error?.message || "Free take failed").slice(0, 300) }, 502);
  }
}

async function handleVoiceGeneration(request, env, ctx, body, userId) {
  const text = String(body?.text ?? "");
  if (!text.trim()) return json({ error: "Text is required." }, 400);
  if (text.length > MAX_GENERATION_CHARS) return json({ error: `Maximum ${MAX_GENERATION_CHARS} characters per generation` }, 400);
  const voiceId = String(body?.voiceId || "").trim();
  const providerVoiceId = await resolveProviderVoiceId(body, env);
  if (!providerVoiceId) return json({ error: "Voice is required." }, 400);
  const voice = await getVoiceByProviderId(env, providerVoiceId);
  if (!voice) return json({ error: "Voice not found." }, 404);
  const cost = generationCost(text, env);
  const referenceId = crypto.randomUUID();
  const reservation = await reserveCredits(userId, cost, env, referenceId);
  if (!reservation) return json({ error: "Insufficient credits." }, 402);
  const generationId = crypto.randomUUID();
  try {
    const plan = await processSvaraFlow(text, env);
    const translated = translateSvaraFlowPlan(text, plan, env);
    const audio = await voice.generate({ text: translated.preparedScript, voiceId: providerVoiceId, format: body?.format || "mp3", speed: body?.speed, stability: body?.stability, style: body?.style }, env);
    if (!audio?.length) throw new Error("Voice provider returned no audio");
    const format = body?.format || "mp3";
    const mimeType = mimeTypeForFormat(format);
    const voiceName = String(voice.name || body?.voiceName || "voice");
    const safeName = voiceName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "voice";
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,"0")}${String(now.getUTCDate()).padStart(2,"0")}_${String(now.getUTCHours()).padStart(2,"0")}${String(now.getUTCMinutes()).padStart(2,"0")}${String(now.getUTCSeconds()).padStart(2,"0")}`;
    const r2Key = `users/${userId}/generations/svara1_${safeName}_${stamp}.${format}`;
    await env.GENERATED_AUDIO.put(r2Key, audio, { httpMetadata: { contentType: mimeType } });
    await env.DB.prepare(`
      INSERT INTO generations
        (id, user_id, voice_id, provider_voice_id, voice_name, script,
         speed, stability, style, format, mime_type, status, r2_key,
         size_bytes, credits_charged, credit_reference_id, take_number,
         created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, ?, ?, ?, 1,
              strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    `).bind(generationId, userId, voiceId || providerVoiceId, providerVoiceId, voiceName, text, body?.speed ?? null, body?.stability ?? null, body?.style ?? null, format, mimeType, r2Key, audio.length, cost, referenceId).run();
    return json({ ok: true, generationId, status: "ready", r2Key, creditsCharged: cost, svaraflow: translated.metadata }, 200);
  } catch (error) {
    await refundCredits(userId, cost, referenceId, env);
    return json({ error: String(error?.message || "Generation failed").slice(0, 300) }, 502);
  }
}

async function handleVoiceMedia(request, env, userId) {
  if (!env.DB || !env.GENERATED_AUDIO) return new Response("Not found", { status: 404 });
  const filename = new URL(request.url).searchParams.get("filename") || "";
  if (!filename) return new Response("Not found", { status: 404 });
  const row = await env.DB.prepare(`SELECT id, user_id, r2_key, mime_type FROM generations WHERE user_id = ? AND r2_key LIKE ? ORDER BY created_at DESC LIMIT 1`).bind(userId, `%/${filename}`).first();
  if (!row?.r2_key) return new Response("Not found", { status: 404 });
  const object = await env.GENERATED_AUDIO.get(row.r2_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: { "content-type": row.mime_type || "audio/mpeg", "cache-control": "private, no-store" } });
}

async function handlePricing(request, env) {
  return json(pricing(env), 200, request);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });

    if (url.pathname === "/api/sound/generate") {
      return handleSoundGenerate(request, env, ctx);
    }

    const userId = await authenticatedUserId(request, env);

    if (url.pathname === "/api/pricing" && request.method === "GET") return handlePricing(request, env);

    if (url.pathname === "/api/generations/media" && request.method === "GET") {
      if (!userId) return new Response("Unauthorized", { status: 401 });
      return handleVoiceMedia(request, env, userId);
    }

    if (url.pathname.startsWith("/api/sound/assets/") && request.method === "GET") {
      if (!userId) return json({ error: "Unauthorized." }, 401);
      const generationId = decodeURIComponent(url.pathname.split("/").pop() || "");
      return storedSoundAsset(request, env, userId, generationId);
    }

    if (url.pathname === "/api/voice/generate" && request.method === "POST") {
      if (!userId) return json({ error: "Unauthorized." }, 401);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
      if (body?.freeTake) return handleFreeTake(request, env, ctx, body, userId);
      return handleVoiceGeneration(request, env, ctx, body, userId);
    }

    return app.fetch(request, env, ctx);
  }
};
