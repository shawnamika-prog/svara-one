import app from "./index.js";
import { handleAuth } from "./auth.js";
import { handlePayfast, runBillingCron } from "./payfast.js";
import { getVoiceById, getVoiceByProviderId, syncVoiceRegistry, seedMissingVoiceSamples } from "./voice-registry.js";
import { createGeneration, markGenerationReady, markGenerationFailed, cleanupExpiredGenerations, mimeTypeForFormat } from "./generations.js";
import { processSvaraFlow, translateSvaraFlowPlan } from "./svaraflow.js";
import { rankVoicesForStyle } from "./voice-recommendation.js";

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

function parseJsonArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

async function handleVoiceRecommendation(request, env) {
  if (!env.DB) return json({ error: "DB binding is not configured." }, 503);

  const body = await request.clone().json().catch(() => ({}));
  const category = String(body.category || "").trim();
  const style = String(body.style || "").trim();
  const limit = Math.max(1, Math.min(10, Number(body.limit) || 5));

  if (!category || !style) {
    return json({ error: "category and style are required." }, 400);
  }

  try {
    const metadataResult = await env.DB.prepare(`
      SELECT svara_id, provider, provider_voice_id, provider_model,
             characteristics_json, use_cases_json, raw_metadata_json
      FROM voice_intelligence_metadata
      WHERE provider_voice_id IS NOT NULL
      ORDER BY provider_voice_id
    `).all();

    const registryResult = await env.DB.prepare(`
      SELECT svara_id, provider, provider_voice_id, display_name
      FROM voice_registry
      WHERE active = 1
    `).all();

    const voices = (metadataResult.results || []).map(row => {
      const characteristics = parseJsonArray(row.characteristics_json);
      const useCases = parseJsonArray(row.use_cases_json);
      const raw = parseJsonObject(row.raw_metadata_json);
      return {
        provider: String(row.provider || "deepgram"),
        providerVoiceId: String(row.provider_voice_id || ""),
        name: String(raw.name || raw.display_name || ""),
        category: String(raw.language || raw.category || ""),
        region: String(raw.accent || raw.region || ""),
        gender: String(raw.gender || ""),
        age: String(raw.age || ""),
        characteristics,
        metadata: {
          characteristics,
          tags: characteristics,
          use_cases: useCases,
          useCases
        }
      };
    }).filter(voice => voice.providerVoiceId);

    const registryVoices = (registryResult.results || []).map(row => ({
      svaraId: String(row.svara_id || ""),
      provider: String(row.provider || ""),
      providerVoiceId: String(row.provider_voice_id || ""),
      displayName: String(row.display_name || "")
    }));

    const ranked = rankVoicesForStyle(voices, category, style, limit, registryVoices);
    return json({
      ok: true,
      provisional: true,
      category,
      style,
      recommendationCount: ranked.length,
      recommendations: ranked.map(item => ({
        displayName: item.displayName || item.voice?.name || item.voice?.providerVoiceId || "",
        svaraId: item.svaraId || null,
        provider: item.voice?.provider || item.match?.provider || null,
        providerVoiceId: item.match?.providerVoiceId || item.voice?.providerVoiceId || "",
        score: item.match?.score ?? 0,
        matchedUseCases: item.match?.matchedUseCases || [],
        characteristics: item.match?.characteristics || [],
        normalizedCharacteristics: item.match?.normalizedCharacteristics || {},
        reasons: item.match?.reasons || {},
        debug: item.match?.debug || {},
        provisional: true
      }))
    });
  } catch (error) {
    console.error("voice_recommendation_error", error);
    return json({ error: String(error?.message || "Voice recommendation failed").slice(0, 300) }, 502);
  }
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
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 0.5;
  return Math.max(1, Math.ceil(text.length / safeFactor));
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
    creditFactor: number("SVARAONE_CREDIT_FACTOR", 0.5),
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
