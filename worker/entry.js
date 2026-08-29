import app from "./index.js";
import { handleAuth } from "./auth.js";
import { handlePayfast, runBillingCron } from "./payfast.js";
import { getVoiceById, getVoiceByProviderId, syncVoiceRegistry, seedMissingVoiceSamples } from "./voice-registry.js";
import { createGeneration, markGenerationReady, markGenerationFailed, cleanupExpiredGenerations, mimeTypeForFormat } from "./generations.js";
import { processSvaraFlow, translateSvaraFlowPlan } from "./svaraflow.js";

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
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 0.5;
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

    if (request.method === "GET" && url.pathname === "/api/branding/svaraone-logo.png") {
      const logo = await storedBrandLogo(env);
      if (logo) return logo;
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
  }
};
