import app from "./index.js";
import { handleAuth } from "./auth.js";
import { handlePayfast, runBillingCron } from "./payfast.js";

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

function generationCost(text, env) {
  const factor = Number(env.SVARAONE_CREDIT_FACTOR);
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 0.5;
  return Math.max(1, Math.ceil(text.length / safeFactor));
}

async function reserveCredits(userId, cost, env) {
  const referenceId = crypto.randomUUID();
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
          "cache-control": "public, max-age=60"
        }
      });
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/voice-portraits/")) {
      const code = url.pathname.split("/").pop();
      const portrait = await storedPortrait(env, code);
      if (portrait) return portrait;
    }

    if (request.method === "POST" && url.pathname === "/api/voice/generate") {
      const body = await request.clone().json().catch(() => ({}));
      const text = String(body.text || "").trim();
      if (!text) return new Response(JSON.stringify({ error: "Text is required" }), { status: 400, headers: { "content-type": "application/json" } });
      if (text.length > MAX_GENERATION_CHARS) return new Response(JSON.stringify({ error: `Maximum ${MAX_GENERATION_CHARS} characters per generation` }), { status: 400, headers: { "content-type": "application/json" } });

      const userId = await authenticatedUserId(request, env);
      if (!userId) return new Response(JSON.stringify({ error: "Authentication required." }), { status: 401, headers: { "content-type": "application/json" } });
      if (!env.DB) return new Response(JSON.stringify({ error: "Account service is not configured." }), { status: 503, headers: { "content-type": "application/json" } });

      const cost = generationCost(text, env);
      const reservation = await reserveCredits(userId, cost, env);
      if (!reservation) return new Response(JSON.stringify({ error: "Not enough credits." }), { status: 402, headers: { "content-type": "application/json" } });

      try {
        const response = await app.fetch(request, env, ctx);
        if (!response.ok) {
          await refundCredits(userId, cost, reservation.referenceId, env);
          return response;
        }
        const headers = new Headers(response.headers);
        headers.set("X-SvaraONE-Credits-Remaining", String(reservation.balance));
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      } catch (error) {
        await refundCredits(userId, cost, reservation.referenceId, env);
        throw error;
      }
    }

    return app.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runBillingCron(env));
  }
};
