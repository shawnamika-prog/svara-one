const PLANS = {
  starter: { priceVar: "SVARAONE_STARTER_PRICE", creditVar: "SVARAONE_STARTER_CREDITS", voiceVar: "SVARAONE_STARTER_VOICES" },
  creator: { priceVar: "SVARAONE_CREATOR_PRICE", creditVar: "SVARAONE_CREATOR_CREDITS", voiceVar: "SVARAONE_CREATOR_VOICES" },
  pro: { priceVar: "SVARAONE_PRO_PRICE", creditVar: "SVARAONE_PRO_CREDITS", voiceVar: null },
  studio: { priceVar: "SVARAONE_STUDIO_PRICE", creditVar: "SVARAONE_STUDIO_CREDITS", voiceVar: null }
};

function payfastHost(env) {
  return String(env.PAYFAST_SANDBOX || "true").toLowerCase() === "false"
    ? "www.payfast.co.za"
    : "sandbox.payfast.co.za";
}

function pfEncode(value) {
  const bytes = new TextEncoder().encode(String(value).trim());
  let output = "";
  for (const byte of bytes) {
    const safe = (byte >= 0x30 && byte <= 0x39) || (byte >= 0x41 && byte <= 0x5a) ||
      (byte >= 0x61 && byte <= 0x7a) || byte === 0x2d || byte === 0x2e || byte === 0x5f;
    if (safe) output += String.fromCharCode(byte);
    else if (byte === 0x20) output += "+";
    else output += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return output;
}

const PAYFAST_SIGNATURE_FIELDS = [
  "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url", "notify_method",
  "name_first", "name_last", "email_address", "cell_number", "m_payment_id", "amount",
  "item_name", "item_description", "custom_int1", "custom_int2", "custom_int3", "custom_int4",
  "custom_int5", "custom_str1", "custom_str2", "custom_str3", "custom_str4", "custom_str5",
  "email_confirmation", "confirmation_address", "currency", "payment_method", "subscription_type",
  "billing_date", "recurring_amount", "frequency", "cycles", "subscription_notify_email",
  "subscription_notify_webhook", "subscription_notify_buyer"
];

function pfParamString(entries) {
  const values = new Map(entries.map(([key, value]) => [key, value]));
  return PAYFAST_SIGNATURE_FIELDS
    .filter(key => values.has(key) && values.get(key) !== undefined && values.get(key) !== null && String(values.get(key)) !== "")
    .map(key => `${key}=${pfEncode(values.get(key))}`)
    .join("&");
}

function pfItnParamString(entries) {
  return entries
    .filter(([key]) => key !== "signature")
    .map(([key, value]) => `${key}=${pfEncode(value ?? "")}`)
    .join("&");
}

function md5(input) {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const total = (((bytes.length + 8) >> 6) + 1) * 64;
  const data = new Uint8Array(total);
  data.set(bytes); data[bytes.length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(total - 8, bitLen >>> 0, true);
  view.setUint32(total - 4, Math.floor(bitLen / 0x100000000), true);
  const add = (a, b) => (a + b) >>> 0;
  const rol = (x, n) => (x << n) | (x >>> (32 - n));
  const F = (x, y, z) => (x & y) | (~x & z);
  const G = (x, y, z) => (x & z) | (y & ~z);
  const H = (x, y, z) => x ^ y ^ z;
  const I = (x, y, z) => y ^ (x | ~z);
  const T = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0);
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let offset = 0; offset < total; offset += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(offset + i * 4, true);
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) { f = F(b,c,d); g = i; }
      else if (i < 32) { f = G(b,c,d); g = (5*i + 1) % 16; }
      else if (i < 48) { f = H(b,c,d); g = (3*i + 5) % 16; }
      else { f = I(b,c,d); g = (7*i) % 16; }
      const next = d;
      const sum = add(add(add(a, f), M[g]), T[i]);
      d = c; c = b; b = add(b, rol(sum, S[i])); a = next;
    }
    a0 = add(a0, a); b0 = add(b0, b); c0 = add(c0, c); d0 = add(d0, d);
  }
  const out = new Uint8Array(16); const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true); outView.setUint32(4, b0, true); outView.setUint32(8, c0, true); outView.setUint32(12, d0, true);
  return [...out].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function signature(entries, passphrase) {
  const base = pfParamString(entries);
  return md5(passphrase ? `${base}&passphrase=${pfEncode(passphrase)}` : base);
}

function planConfig(env, plan) {
  const config = PLANS[plan];
  if (!config) return null;
  const price = Number(env[config.priceVar]);
  const credits = Number(env[config.creditVar]);
  const voices = config.voiceVar ? Number(env[config.voiceVar]) : null;
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(credits) || credits <= 0) return null;
  return { price, credits, voices: Number.isFinite(voices) ? voices : null };
}

function zarAmountForPlan(env, plan) {
  const config = planConfig(env, plan);
  const rate = Number(env.SVARAONE_PAYFAST_ZAR_PER_USD);
  if (!config || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.round(config.price * rate * 100) / 100;
}

function addYear(iso) { const date = new Date(iso); date.setUTCFullYear(date.getUTCFullYear() + 1); return date.toISOString(); }
function periodKey(date = new Date()) { return date.toISOString().slice(0, 7); }

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const bytes = new Uint8Array(digest); let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function deepgramVoices(env) {
  if (!env.DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY is not configured");
  const response = await fetch("https://api.deepgram.com/v1/models", { headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` } });
  if (!response.ok) throw new Error(`Deepgram catalogue failed: ${response.status}`);
  const data = await response.json();
  return (data.tts || []).filter(voice => String(voice.canonical_name || "").startsWith("aura-2-"));
}

async function authenticatedUser(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map(part => part.trim()).find(part => part.startsWith("svara_session="))?.slice("svara_session=".length) || "";
  if (!token || !env.DB) return null;
  const tokenHash = await sha256(decodeURIComponent(token));
  return env.DB.prepare(`SELECT id,email,display_name FROM users WHERE id=(SELECT user_id FROM sessions WHERE token_hash=? AND revoked_at IS NULL AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now') LIMIT 1) AND status='active'`).bind(tokenHash).first();
}

async function checkout(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: "Authentication required." }), { status: 401, headers: { "content-type": "application/json" } });
  const body = await request.json().catch(() => ({}));
  const plan = String(body.plan || "").toLowerCase();
  const config = planConfig(env, plan);
  if (!config) return new Response(JSON.stringify({ error: "Invalid paid plan." }), { status: 400, headers: { "content-type": "application/json" } });
  const amountZar = zarAmountForPlan(env, plan);
  if (amountZar === null) return new Response(JSON.stringify({ error: "Payfast ZAR pricing is not configured yet." }), { status: 503, headers: { "content-type": "application/json" } });
  const merchantId = String(env.PAYFAST_MERCHANT_ID || "").trim();
  const merchantKey = String(env.PAYFAST_MERCHANT_KEY || "").trim();
  const passphrase = String(env.PAYFAST_PASSPHRASE || "").trim();
  if (!merchantId || !merchantKey || !passphrase) return new Response(JSON.stringify({ error: "Payfast sandbox credentials are not configured yet." }), { status: 503, headers: { "content-type": "application/json" } });
  const origin = new URL(request.url); const paymentId = crypto.randomUUID();
  const entries = [
    ["merchant_id", merchantId], ["merchant_key", merchantKey],
    ["return_url", `${origin.origin}/billing.html?status=success&plan=${encodeURIComponent(plan)}`],
    ["cancel_url", `${origin.origin}/billing.html?status=cancelled&plan=${encodeURIComponent(plan)}`],
    ["notify_url", `${origin.origin}/api/payments/payfast/itn`],
    ["name_first", user.display_name || "SvaraONE Customer"], ["email_address", user.email],
    ["m_payment_id", paymentId], ["amount", amountZar.toFixed(2)],
    ["item_name", `SvaraONE ${plan[0].toUpperCase()}${plan.slice(1)} — Annual`],
    ["item_description", `${config.credits.toLocaleString("en-US")} SvaraONE Credits per month`],
    ["custom_str1", plan], ["custom_str2", user.id]
  ];
  await env.DB.prepare(`INSERT INTO account_events (id,user_id,event_type,reference_id,metadata_json) VALUES (?,?,?,?,?)`).bind(crypto.randomUUID(), user.id, "payment_pending", paymentId, JSON.stringify({ provider: "payfast", plan, amount_usd: config.price, amount_zar: amountZar, credits: config.credits, sandbox: payfastHost(env).startsWith("sandbox.") })).run();
  const fields = Object.fromEntries(entries.map(([key, value]) => [key, String(value)])); fields.signature = signature(entries, passphrase);
  return new Response(JSON.stringify({ ok: true, provider: "payfast", sandbox: payfastHost(env).startsWith("sandbox."), action: `https://${payfastHost(env)}/eng/process`, fields, plan, amount_usd: config.price, amount_zar: amountZar }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

async function activateSubscription(data, env) {
  if (!env.DB) throw new Error("DB is not configured");
  const paymentId = String(data.m_payment_id || "").trim();
  const pending = await env.DB.prepare("SELECT user_id, metadata_json FROM account_events WHERE event_type='payment_pending' AND reference_id=? ORDER BY created_at DESC LIMIT 1").bind(paymentId).first();
  if (!pending) throw new Error("Unknown Payfast payment reference");
  const meta = JSON.parse(pending.metadata_json || "{}");
  const plan = String(meta.plan || data.custom_str1 || "").toLowerCase();
  const config = planConfig(env, plan); if (!config) throw new Error("Unknown plan in payment reference");
  const expectedZar = Number(meta.amount_zar); const grossZar = Number(data.amount_gross);
  if (!Number.isFinite(expectedZar) || !Number.isFinite(grossZar) || Math.abs(expectedZar - grossZar) > 0.01) throw new Error("Payfast amount mismatch");
  const existing = await env.DB.prepare("SELECT id FROM subscriptions WHERE payfast_payment_id=? LIMIT 1").bind(String(data.pf_payment_id || "")).first(); if (existing) return;
  const active = await env.DB.prepare("SELECT id FROM subscriptions WHERE user_id=? AND status='active' AND period_end > strftime('%Y-%m-%dT%H:%M:%fZ','now') LIMIT 1").bind(pending.user_id).first(); if (active) throw new Error("User already has an active subscription");
  const start = new Date().toISOString(), end = addYear(start), key = periodKey(new Date(start));
  const balanceRow = await env.DB.prepare("SELECT balance_after FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 1").bind(pending.user_id).first();
  const balance = Number(balanceRow?.balance_after || 0); const subscriptionId = crypto.randomUUID(); const paymentReference = String(data.pf_payment_id || paymentId);
  const voices = await deepgramVoices(env); const desiredVoiceCount = config.voices || voices.length; const selectedVoices = voices.slice(0, Math.max(0, desiredVoiceCount));
  const statements = [
    env.DB.prepare(`UPDATE user_voices SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL`).bind(start, pending.user_id),
    env.DB.prepare(`INSERT INTO subscriptions (id,user_id,plan,status,payfast_payment_id,payfast_token,amount_zar,amount_net_zar,paid_at,billing_currency,billing_interval,period_start,period_end) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(subscriptionId,pending.user_id,plan,"active",paymentReference,String(data.token || "") || null,expectedZar,Number(data.amount_net) || null,start,"USD","year",start,end),
    env.DB.prepare(`INSERT INTO credit_ledger (id,user_id,amount,balance_after,reason,reference_id,period_key) VALUES (?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),pending.user_id,config.credits,balance+config.credits,"subscription_credit",subscriptionId,key),
    env.DB.prepare(`INSERT INTO account_events (id,user_id,event_type,reference_id,metadata_json) VALUES (?,?,?,?,?)`).bind(crypto.randomUUID(),pending.user_id,"subscription_activated",subscriptionId,JSON.stringify({ provider:"payfast", payment_id:data.pf_payment_id, plan, credits:config.credits, voice_count:selectedVoices.length, amount_zar:expectedZar, amount_net_zar:Number(data.amount_net)||null })),
    ...selectedVoices.flatMap(voice => [
      env.DB.prepare(`UPDATE user_voices SET revoked_at=NULL WHERE user_id=? AND voice_id=?`).bind(pending.user_id,voice.canonical_name),
      env.DB.prepare(`INSERT OR IGNORE INTO user_voices (id,user_id,voice_id,revoked_at) VALUES (?,?,?,NULL)`).bind(crypto.randomUUID(),pending.user_id,voice.canonical_name)
    ])
  ];
  await env.DB.batch(statements);
}

async function verifyItn(request, env) {
  const raw = await request.text();
  const params = [...new URLSearchParams(raw).entries()];
  const received = Object.fromEntries(params);
  if (!received.signature) return new Response("INVALID", { status: 400 });
  const merchantId = String(env.PAYFAST_MERCHANT_ID || "").trim();
  if (received.merchant_id !== merchantId) return new Response("INVALID", { status: 400 });
  const passphrase = String(env.PAYFAST_PASSPHRASE || "").trim();
  const itnParamString = pfItnParamString(params);
  const expectedSignature = md5(passphrase ? `${itnParamString}&passphrase=${pfEncode(passphrase)}` : itnParamString);
  if (received.signature !== expectedSignature) return new Response("INVALID", { status: 400 });

  const host = payfastHost(env);
  const validationResponse = await fetch(`https://${host}/eng/query/validate`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: itnParamString
  });
  const validationText = (await validationResponse.text()).trim();
  if (validationText !== "VALID") throw new Error(`Payfast ITN validation failed: ${validationText || "empty response"}`);

  if (received.payment_status === "COMPLETE") await activateSubscription(received, env);
  else if (received.payment_status === "CANCELLED") {
    await env.DB.prepare(`INSERT INTO account_events (id,user_id,event_type,reference_id,metadata_json) SELECT ?,user_id,'payment_cancelled',?,? FROM account_events WHERE event_type='payment_pending' AND reference_id=? ORDER BY created_at DESC LIMIT 1`).bind(crypto.randomUUID(),received.m_payment_id,JSON.stringify({provider:"payfast",payment_id:received.pf_payment_id||null}),received.m_payment_id).run();
  }
  return new Response("OK", { status: 200 });
}

async function allocateMonthlyCredits(env) {
  if (!env.DB) return;
  const rows = await env.DB.prepare(`SELECT id,user_id,plan,period_start,period_end FROM subscriptions WHERE status='active' AND period_end > strftime('%Y-%m-%dT%H:%M:%fZ','now')`).all();
  const now = new Date(); const key = periodKey(now);
  for (const subscription of rows.results || []) {
    const config = planConfig(env, subscription.plan); if (!config) continue;
    const already = await env.DB.prepare("SELECT id FROM credit_ledger WHERE user_id=? AND reason='subscription_credit' AND period_key=? LIMIT 1").bind(subscription.user_id,key).first(); if (already) continue;
    const balanceRow = await env.DB.prepare("SELECT balance_after FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 1").bind(subscription.user_id).first();
    const balance = Number(balanceRow?.balance_after || 0);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO credit_ledger (id,user_id,amount,balance_after,reason,reference_id,period_key) VALUES (?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),subscription.user_id,config.credits,balance+config.credits,"subscription_credit",subscription.id,key),
      env.DB.prepare(`INSERT INTO account_events (id,user_id,event_type,reference_id,metadata_json) VALUES (?,?,?,?,?)`).bind(crypto.randomUUID(),subscription.user_id,"monthly_credits_allocated",subscription.id,JSON.stringify({provider:"payfast",plan:subscription.plan,credits:config.credits,period_key:key}))
    ]);
  }
}

export async function handlePayfast(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/payments/payfast/checkout" && request.method === "POST") return checkout(request, env);
  if (url.pathname === "/api/payments/payfast/itn" && request.method === "POST") {
    try { return await verifyItn(request, env); }
    catch (error) { console.error("payfast_itn_error", error); return new Response("INVALID", { status: 400 }); }
  }
  return null;
}

export async function runBillingCron(env) {
  try { await allocateMonthlyCredits(env); }
  catch (error) { console.error("billing_cron_error", error); }
}
