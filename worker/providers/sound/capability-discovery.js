import { createSoundCapabilities } from "./capabilities.js";
import { getSoundProvider } from "./index.js";

const CAPABILITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function hashCapabilities(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(stableStringify(value))
  );
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function providerName(env) {
  return String(env.SVARAONE_SOUND_PROVIDER || "").trim().toLowerCase();
}

function parseCapabilities(row) {
  if (!row?.capabilities_json) return null;
  try {
    return JSON.parse(row.capabilities_json);
  } catch {
    return null;
  }
}

export async function getCachedSoundCapabilities(env, provider = providerName(env)) {
  if (!env.DB || !provider) return null;

  const row = await env.DB.prepare(`
    SELECT provider, provider_version, discovery_hash, capabilities_json,
           source, status, discovered_at, last_verified_at, last_error
    FROM sound_provider_capabilities
    WHERE provider = ?
    LIMIT 1
  `).bind(provider).first();

  if (!row || row.status !== "active") return null;

  const capabilities = parseCapabilities(row);
  if (!capabilities) return null;

  return { ...row, capabilities };
}

export async function discoverSoundProviderCapabilities(env, provider = providerName(env)) {
  if (!env.DB) throw new Error("Sound capability storage is not configured.");
  if (!provider) return null;

  const soundProvider = getSoundProvider(env, provider);
  if (typeof soundProvider.discoverCapabilities !== "function") {
    throw new Error(`Sound provider ${provider} does not implement capability discovery`);
  }

  const raw = await soundProvider.discoverCapabilities();
  const capabilities = createSoundCapabilities(raw || {});
  const discoveryHash = await hashCapabilities(capabilities);
  const providerVersion = typeof soundProvider.getVersion === "function"
    ? String(soundProvider.getVersion() || "").trim() || null
    : null;
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO sound_provider_capabilities
      (id, provider, provider_version, discovery_hash, capabilities_json,
       source, status, discovered_at, last_verified_at, last_error, updated_at)
    VALUES (?, ?, ?, ?, ?, 'provider', 'active', ?, ?, NULL, ?)
    ON CONFLICT(provider) DO UPDATE SET
      provider_version = excluded.provider_version,
      discovery_hash = excluded.discovery_hash,
      capabilities_json = excluded.capabilities_json,
      source = excluded.source,
      status = excluded.status,
      discovered_at = CASE
        WHEN sound_provider_capabilities.discovery_hash = excluded.discovery_hash
          THEN sound_provider_capabilities.discovered_at
        ELSE excluded.discovered_at
      END,
      last_verified_at = excluded.last_verified_at,
      last_error = NULL,
      updated_at = excluded.updated_at
  `).bind(
    crypto.randomUUID(),
    provider,
    providerVersion,
    discoveryHash,
    JSON.stringify(capabilities),
    now,
    now,
    now
  ).run();

  return {
    provider,
    providerVersion,
    discoveryHash,
    capabilities,
    discoveredAt: now,
    lastVerifiedAt: now
  };
}

export async function refreshSoundProviderCapabilities(env, provider = providerName(env), { force = false } = {}) {
  if (!provider) return { status: "skipped", reason: "no_provider" };
  if (!env.DB) return { status: "skipped", reason: "no_db" };

  const cached = await getCachedSoundCapabilities(env, provider);
  if (!force && cached?.last_verified_at) {
    const age = Date.now() - Date.parse(cached.last_verified_at);
    if (Number.isFinite(age) && age < CAPABILITY_CACHE_TTL_MS) {
      return { status: "cached", provider, capabilities: cached.capabilities };
    }
  }

  try {
    const result = await discoverSoundProviderCapabilities(env, provider);
    return { status: "discovered", ...result };
  } catch (error) {
    const message = String(error?.message || "Sound capability discovery failed").slice(0, 500);
    const now = new Date().toISOString();

    const existing = await getCachedSoundCapabilities(env, provider);
    if (existing) {
      await env.DB.prepare(`
        UPDATE sound_provider_capabilities
        SET status = 'active', last_verified_at = ?, last_error = ?, updated_at = ?
        WHERE provider = ?
      `).bind(now, message, now, provider).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO sound_provider_capabilities
          (id, provider, capabilities_json, source, status, last_verified_at, last_error, updated_at)
        VALUES (?, ?, ?, 'provider', 'discovery_failed', ?, ?, ?)
        ON CONFLICT(provider) DO UPDATE SET
          status = excluded.status,
          last_verified_at = excluded.last_verified_at,
          last_error = excluded.last_error,
          updated_at = excluded.updated_at
      `).bind(crypto.randomUUID(), provider, JSON.stringify({}), now, message, now).run();
    }

    return {
      status: "discovery_failed",
      provider,
      error: message,
      usedCachedCapabilities: Boolean(existing),
      capabilities: existing?.capabilities || null
    };
  }
}
