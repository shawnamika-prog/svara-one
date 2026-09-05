import { getSoundProvider } from "./providers/sound/index.js";
import { createSoundCapabilities } from "./providers/sound/capabilities.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function configuredProvider(env) {
  return String(env.SVARAONE_SOUND_PROVIDER || "").trim().toLowerCase();
}

async function hashCapabilities(capabilities) {
  const payload = JSON.stringify(capabilities);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function parseCapabilities(row) {
  if (!row?.capabilities_json) return null;
  try {
    return JSON.parse(row.capabilities_json);
  } catch {
    return null;
  }
}

export async function getCachedSoundCapabilities(env, provider = configuredProvider(env)) {
  if (!env.DB || !provider) return null;

  const row = await env.DB.prepare(`
    SELECT id, provider, provider_version, discovery_hash, capabilities_json,
           source, status, discovered_at, last_verified_at, last_error,
           created_at, updated_at
    FROM sound_provider_capabilities
    WHERE provider = ?
    LIMIT 1
  `).bind(provider).first();

  const capabilities = parseCapabilities(row);
  if (!row || !capabilities) return null;

  return { ...row, capabilities };
}

export async function discoverSoundProviderCapabilities(env, provider = configuredProvider(env)) {
  if (!provider) throw new Error("Sound provider is not configured.");
  if (!env.DB) throw new Error("Database is not configured.");

  const soundProvider = getSoundProvider(env, provider);
  const rawCapabilities = soundProvider.getCapabilities();
  const capabilities = createSoundCapabilities(rawCapabilities || {});
  const discoveryHash = await hashCapabilities(capabilities);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const providerVersion = String(rawCapabilities?.providerVersion || "").trim() || null;

  await env.DB.prepare(`
    INSERT INTO sound_provider_capabilities
      (id, provider, provider_version, discovery_hash, capabilities_json,
       source, status, discovered_at, last_verified_at, last_error,
       created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'provider_adapter', 'active', ?, ?, NULL, ?, ?)
    ON CONFLICT(provider) DO UPDATE SET
      provider_version = excluded.provider_version,
      discovery_hash = excluded.discovery_hash,
      capabilities_json = excluded.capabilities_json,
      source = excluded.source,
      status = 'active',
      discovered_at = CASE
        WHEN sound_provider_capabilities.discovery_hash = excluded.discovery_hash
          THEN sound_provider_capabilities.discovered_at
        ELSE excluded.discovered_at
      END,
      last_verified_at = excluded.last_verified_at,
      last_error = NULL,
      updated_at = excluded.updated_at
  `).bind(
    id,
    provider,
    providerVersion,
    discoveryHash,
    JSON.stringify(capabilities),
    now,
    now,
    now,
    now
  ).run();

  return getCachedSoundCapabilities(env, provider);
}

export async function ensureSoundProviderCapabilities(env) {
  const provider = configuredProvider(env);
  if (!provider) return { status: "skipped", reason: "provider_not_configured" };

  const cached = await getCachedSoundCapabilities(env, provider);
  if (cached) return { status: "cached", provider, capabilities: cached };

  try {
    const discovered = await discoverSoundProviderCapabilities(env, provider);
    return { status: "discovered", provider, capabilities: discovered };
  } catch (error) {
    console.error("sound_capability_discovery_error", error);
    return { status: "failed", provider, error: error.message };
  }
}

export async function handleSoundCapabilities(request, env) {
  if (request.method !== "GET") return json({ error: "Method not allowed." }, 405);

  const provider = configuredProvider(env);
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
