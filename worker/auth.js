const SESSION_COOKIE = "svara_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 100000;
const FREE_VOICE_IDS = ["aura-2-thalia-en", "aura-2-celeste-es", "aura-2-julius-de"];

const ALLOWED_ORIGINS = new Set([
  "https://svara.io",
  "https://www.svara.io",
  "https://svara-origins.pages.dev",
  "https://svara-origins.shawnamika.workers.dev",
  "https://svaraone.com",
  "https://www.svaraone.com",
  "https://svaraone.io",
  "https://www.svaraone.io",
  "http://localhost:8788",
  "http://127.0.0.1:8788"
]);

function originHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "null",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };
}

function json(data, status, request, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...originHeaders(request),
      ...extra
    }
  });
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = String(value).replace(/-/g, "+").replace(/_/g, "/") + "===";
  const binary = atob(padded.slice(0, padded.length - (padded.length % 4)));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function hashPassword(password, saltText = null) {
  const salt = saltText ? base64UrlToBytes(saltText) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" }, key, 256);
  return { hash: bytesToBase64Url(new Uint8Array(bits)), salt: bytesToBase64Url(salt) };
}

function safeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
}

async function verifyPassword(password, storedHash, storedSalt) {
  const result = await hashPassword(password, storedSalt);
  return safeEqual(result.hash, storedHash);
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=None`;
}

function normaliseEmail(value) { return String(value || "").trim().toLowerCase(); }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }

function userPayload(user, subscription = null, balance = 0, voices = []) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name || null,
    status: user.status,
    created_at: user.created_at,
    subscription: subscription ? { plan: subscription.plan, status: subscription.status, currency: subscription.billing_currency, interval: subscription.billing_interval, period_start: subscription.period_start, period_end: subscription.period_end } : null,
    credits: balance,
    voices
  };
}

async function currentUser(request, env) {
  if (!env.DB) return null;
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT u.id, u.email, u.display_name, u.status, u.created_at,
      s.id AS session_id,
      sub.plan AS subscription_plan, sub.status AS subscription_status,
      sub.billing_currency, sub.billing_interval, sub.period_start, sub.period_end
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN subscriptions sub ON sub.user_id = u.id AND sub.status IN ('pending','active','past_due')
    WHERE s.token_hash = ? AND s.revoked_at IS NULL
      AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')
      AND u.status = 'active'
    ORDER BY sub.created_at DESC LIMIT 1
  `).bind(tokenHash).first();
  if (!row) return null;

  const balanceRow = await env.DB.prepare(`SELECT balance_after FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`).bind(row.id).first();
  const voiceRows = await env.DB.prepare(`SELECT voice_id FROM user_voices WHERE user_id = ? AND revoked_at IS NULL ORDER BY granted_at ASC`).bind(row.id).all();
  const subscription = row.subscription_plan ? { plan: row.subscription_plan, status: row.subscription_status, billing_currency: row.billing_currency, billing_interval: row.billing_interval, period_start: row.period_start, period_end: row.period_end } : null;
  return userPayload(row, subscription, Number(balanceRow?.balance_after || 0), (voiceRows.results || []).map(item => item.voice_id));
}

async function register(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = normaliseEmail(body.email);
  const password = String(body.password || "");
  const displayName = String(body.display_name || body.displayName || "").trim().slice(0, 80) || null;
  const freeCredits = Math.max(0, Number(env.SVARAONE_FREE_CREDITS || 5000));
  const freeVoices = Math.max(0, Math.min(FREE_VOICE_IDS.length, Number(env.SVARAONE_FREE_VOICES || 3)));

  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400, request);
  if (password.length < 10) return json({ error: "Password must be at least 10 characters." }, 400, request);
  if (password.length > 128) return json({ error: "Password is too long." }, 400, request);
  if (!env.DB) return json({ error: "Account service is not configured." }, 503, request);

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE LIMIT 1").bind(email).first();
  if (existing) return json({ error: "An account with that email already exists." }, 409, request);

  const userId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const sessionToken = randomToken();
  const tokenHash = await sha256(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  const passwordData = await hashPassword(password);
  const statements = [
    env.DB.prepare(`INSERT INTO users (id, email, display_name, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)`).bind(userId, email, displayName, passwordData.hash, passwordData.salt),
    env.DB.prepare(`INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`).bind(sessionId, userId, tokenHash, expiresAt),
    env.DB.prepare(`INSERT INTO credit_ledger (id, user_id, amount, balance_after, reason, reference_id, period_key) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), userId, freeCredits, freeCredits, "free_signup", userId, "signup"),
    env.DB.prepare(`INSERT INTO account_events (id, user_id, event_type, reference_id, metadata_json) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), userId, "account_created", sessionId, JSON.stringify({ method: "password", free_credits: freeCredits, free_voices: freeVoices }))
  ];
  for (const voiceId of FREE_VOICE_IDS.slice(0, freeVoices)) {
    statements.push(env.DB.prepare(`INSERT INTO user_voices (id, user_id, voice_id) VALUES (?, ?, ?)`).bind(crypto.randomUUID(), userId, voiceId));
  }

  try {
    await env.DB.batch(statements);
  } catch (error) {
    const message = String(error?.message || "");
    if (/unique|constraint/i.test(message)) return json({ error: "An account with that email already exists." }, 409, request);
    console.error("register_error", error);
    return json({ error: "Unable to create the account." }, 500, request);
  }

  const user = await currentUser(new Request(request.url, { headers: { Cookie: sessionCookie(sessionToken) } }), env);
  return json({ ok: true, user }, 201, request, { "Set-Cookie": sessionCookie(sessionToken) });
}

async function login(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = normaliseEmail(body.email);
  const password = String(body.password || "");
  if (!validEmail(email) || !password) return json({ error: "Email and password are required." }, 400, request);
  if (!env.DB) return json({ error: "Account service is not configured." }, 503, request);

  const user = await env.DB.prepare(`SELECT id, email, display_name, status, created_at, password_hash, password_salt FROM users WHERE email = ? COLLATE NOCASE LIMIT 1`).bind(email).first();
  if (!user || user.status !== "active" || !user.password_hash || !user.password_salt) return json({ error: "Invalid email or password." }, 401, request);
  if (!await verifyPassword(password, user.password_hash, user.password_salt)) return json({ error: "Invalid email or password." }, 401, request);

  const sessionId = crypto.randomUUID();
  const sessionToken = randomToken();
  const tokenHash = await sha256(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`).bind(sessionId, user.id, tokenHash, expiresAt),
    env.DB.prepare(`INSERT INTO account_events (id, user_id, event_type, reference_id, metadata_json) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), user.id, "login", sessionId, JSON.stringify({ method: "password" }))
  ]);

  const freshRequest = new Request(request.url, { headers: { Cookie: sessionCookie(sessionToken) } });
  return json({ ok: true, user: await currentUser(freshRequest, env) }, 200, request, { "Set-Cookie": sessionCookie(sessionToken) });
}

async function logout(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token && env.DB) {
    const tokenHash = await sha256(token);
    const session = await env.DB.prepare("SELECT id, user_id FROM sessions WHERE token_hash = ? LIMIT 1").bind(tokenHash).first();
    if (session) await env.DB.batch([
      env.DB.prepare("UPDATE sessions SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").bind(session.id),
      env.DB.prepare(`INSERT INTO account_events (id, user_id, event_type, reference_id) VALUES (?, ?, ?, ?)`).bind(crypto.randomUUID(), session.user_id, "logout", session.id)
    ]);
  }
  return json({ ok: true }, 200, request, { "Set-Cookie": sessionCookie("", 0) });
}

async function me(request, env) {
  const user = await currentUser(request, env);
  return json({ authenticated: !!user, user }, 200, request);
}

export async function handleAuth(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/auth/")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: originHeaders(request) });
  try {
    if (url.pathname === "/api/auth/register" && request.method === "POST") return await register(request, env);
    if (url.pathname === "/api/auth/login" && request.method === "POST") return await login(request, env);
    if (url.pathname === "/api/auth/logout" && request.method === "POST") return await logout(request, env);
    if (url.pathname === "/api/auth/me" && request.method === "GET") return await me(request, env);
    return json({ error: "Not found" }, 404, request);
  } catch (error) {
    console.error("auth_error", error);
    return json({ error: "Account service error." }, 500, request);
  }
}
