import { SoundProvider } from "./base.js";

const MUBERT_API_BASE = "https://music-api.mubert.com/api/v3";

function requireCredential(value, name) {
  const clean = String(value || "").trim();
  if (!clean) throw new Error(`Mubert ${name} is not configured`);
  return clean;
}

async function mubertFetch(env, path, { method = "GET", body = null } = {}) {
  const companyId = requireCredential(env.MUBERT_COMPANY_ID, "company ID");
  const licenseToken = requireCredential(env.MUBERT_LICENSE_TOKEN, "license token");

  const headers = new Headers({
    "company-id": companyId,
    "license-token": licenseToken,
    "accept": "application/json"
  });

  const options = { method, headers };
  if (body !== null) {
    headers.set("content-type", "application/json");
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${MUBERT_API_BASE}${path}`, options);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Mubert API returned HTTP ${response.status}`;
    throw new Error(String(message).slice(0, 500));
  }

  return payload;
}

function featureSet(license) {
  return new Set((Array.isArray(license?.features) ? license.features : [])
    .map(value => String(value || "").trim().toLowerCase())
    .filter(Boolean));
}

function normalizeModeTypes(modes) {
  const result = [];
  if (modes.includes("track")) result.push("music", "soundtrack");
  if (modes.includes("jingle")) result.push("jingle");
  if (modes.includes("loop")) result.push("loop");
  return [...new Set(result)];
}

export class MubertProvider extends SoundProvider {
  getVersion() {
    return "api-v3";
  }

  getStatus() {
    return {
      configured: Boolean(String(this.env.MUBERT_COMPANY_ID || "").trim() && String(this.env.MUBERT_LICENSE_TOKEN || "").trim()),
      provider: "mubert",
      version: this.getVersion()
    };
  }

  async discoverCapabilities() {
    const payload = await mubertFetch(this.env, "/service/licenses");
    const license = payload?.data;
    if (!license || typeof license !== "object") {
      throw new Error("Mubert license response did not contain a license model");
    }

    const features = featureSet(license);
    const modes = Array.isArray(license.track_modes)
      ? license.track_modes.map(value => String(value || "").trim().toLowerCase()).filter(Boolean)
      : [];
    const formats = Array.isArray(license.track_formats)
      ? license.track_formats.map(value => String(value || "").trim().toLowerCase()).filter(Boolean)
      : [];
    const intensities = Array.isArray(license.intensities)
      ? license.intensities.map(value => String(value || "").trim().toLowerCase()).filter(Boolean)
      : [];

    const capabilities = {
      providerVersion: this.getVersion(),
      types: normalizeModeTypes(modes),
      inputTypes: [
        ...(features.has("ttm") ? ["text"] : []),
        ...(features.has("itm") ? ["image"] : [])
      ],
      outputFormats: formats,
      operations: [
        ...(features.has("track") ? ["generate"] : []),
        ...(features.has("streaming") ? ["stream"] : [])
      ],
      supportsInstrumental: false,
      supportsVocals: false,
      supportsVariation: false,
      supportsExtend: false,
      supportsTransform: false,
      supportsRemix: modes.includes("mix"),
      supportsStems: false,
      minDurationSeconds: null,
      maxDurationSeconds: Number.isFinite(Number(license?.license_limits?.max_track_duration))
        ? Number(license.license_limits.max_track_duration)
        : null,
      parameters: {
        bitrates: Array.isArray(license.bitrates) ? license.bitrates : [],
        intensities,
        modes,
        defaults: {
          bitrate: license.default_bitrate ?? null,
          intensity: license.default_intensity ?? null,
          mode: license.default_mode ?? null,
          format: license.default_format ?? null
        },
        features: [...features]
      }
    };

    return capabilities;
  }

  async generate(request) {
    const customerId = requireCredential(this.env.MUBERT_CUSTOMER_ID, "customer ID");
    const accessToken = requireCredential(this.env.MUBERT_ACCESS_TOKEN, "access token");

    const prompt = String(request?.prompt || "").trim();
    if (!prompt) throw new Error("Mubert prompt is required");
    if (prompt.length > 200) throw new Error("Mubert text prompts are limited to 200 characters");

    const duration = Number(request?.durationSeconds);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Mubert requires a positive durationSeconds value");
    }

    const parameters = request?.parameters && typeof request.parameters === "object"
      ? request.parameters
      : {};

    const body = {
      prompt,
      duration,
      format: String(request?.format || parameters.format || "mp3").toLowerCase(),
      bitrate: parameters.bitrate ?? undefined,
      intensity: parameters.intensity ?? undefined,
      mode: parameters.mode ?? (request?.type === "loop" ? "loop" : request?.type === "jingle" ? "jingle" : "track")
    };

    Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);

    const response = await fetch(`${MUBERT_API_BASE}/public/tracks`, {
      method: "POST",
      headers: {
        "customer-id": customerId,
        "access-token": accessToken,
        "content-type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message = payload?.message || payload?.error || `Mubert API returned HTTP ${response.status}`;
      throw new Error(String(message).slice(0, 500));
    }

    return this.normalizeResult(payload);
  }

  normalizeResult(result) {
    const track = result?.data || result || {};
    const generation = Array.isArray(track.generations) ? track.generations[0] : null;

    return {
      provider: "mubert",
      providerGenerationId: track.id || generation?.session_id || null,
      status: generation?.status || "processing",
      url: generation?.url || null,
      format: generation?.format || null,
      durationSeconds: Number.isFinite(Number(track.duration)) ? Number(track.duration) : null,
      metadata: {
        sessionId: track.session_id || null,
        playlistIndex: track.playlist_index || null,
        mode: track.mode || null,
        intensity: track.intensity || null,
        bitrate: generation?.bitrate ?? track.bitrate ?? null,
        bpm: track.bpm ?? null,
        key: track.key ?? null,
        expiresAt: generation?.expired_at || null
      }
    };
  }
}
