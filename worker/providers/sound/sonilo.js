import { SoundProvider } from "./base.js";

const DEFAULT_SONILO_API_BASE = "https://api.sonilo.com/v1";

const SERVICE_CAPABILITIES = Object.freeze({
  text_to_music: {
    types: ["music", "soundtrack", "jingle", "loop"],
    inputTypes: ["text"],
    operations: ["generate"],
    outputFormats: ["mp3", "wav"]
  },
  video_to_music: {
    types: ["music", "soundtrack"],
    inputTypes: ["video"],
    operations: ["generate"],
    outputFormats: ["mp3", "wav"]
  },
  text_to_sfx: {
    types: ["sfx", "ambience"],
    inputTypes: ["text"],
    operations: ["generate"],
    outputFormats: ["mp3", "wav"]
  },
  video_to_sfx: {
    types: ["sfx", "ambience"],
    inputTypes: ["video"],
    operations: ["generate"],
    outputFormats: ["mp3", "wav"]
  },
  video_to_sound: {
    types: ["soundtrack"],
    inputTypes: ["video"],
    operations: ["generate"],
    outputFormats: ["mp3", "wav"]
  },
  audio_ducking: {
    types: ["soundtrack"],
    inputTypes: ["audio", "voice"],
    operations: ["duck"],
    outputFormats: ["mp3", "wav"]
  }
});

function requireCredential(value, name) {
  const clean = String(value || "").trim();
  if (!clean) throw new Error(`Sonilo ${name} is not configured`);
  return clean;
}

function apiBase(env) {
  return String(env.SONILO_API_BASE_URL || DEFAULT_SONILO_API_BASE).trim().replace(/\/$/, "");
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map(item => String(item || "").trim().toLowerCase()).filter(Boolean)
    : [];
}

function mergeUnique(values) {
  return [...new Set(values.flat().filter(Boolean))];
}

async function soniloFetch(env, path, { method = "GET", body = null } = {}) {
  const apiKey = requireCredential(env.SONILO_API_KEY, "API key");
  const headers = new Headers({
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json"
  });

  const options = { method, headers };
  if (body !== null) options.body = body;

  const response = await fetch(`${apiBase(env)}${path}`, options);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || payload?.code || `Sonilo API returned HTTP ${response.status}`;
    const error = new Error(String(message).slice(0, 500));
    error.status = response.status;
    error.code = payload?.code || null;
    throw error;
  }

  return payload;
}

function serviceCapabilities(serviceNames) {
  const enabled = serviceNames.map(name => SERVICE_CAPABILITIES[name]).filter(Boolean);
  return {
    types: mergeUnique(enabled.map(item => item.types)),
    inputTypes: mergeUnique(enabled.map(item => item.inputTypes)),
    outputFormats: mergeUnique(enabled.map(item => item.outputFormats)),
    operations: mergeUnique(enabled.map(item => item.operations))
  };
}

function formatForRequest(format) {
  const normalized = String(format || "mp3").trim().toLowerCase();
  if (normalized === "pcm") throw new Error("Sonilo does not expose PCM as an output format");
  if (!["mp3", "wav"].includes(normalized)) {
    throw new Error(`Unsupported Sonilo output format: ${format}`);
  }
  return normalized;
}

function serviceForRequest(request) {
  const sourceType = String(request?.sourceType || request?.source_type || "text").trim().toLowerCase();
  const type = String(request?.type || "music").trim().toLowerCase();

  if (sourceType === "video") {
    if (["sfx", "ambience"].includes(type)) return "video_to_sfx";
    if (["music", "soundtrack", "jingle", "loop"].includes(type)) return "video_to_music";
  }

  if (sourceType === "text") {
    if (["sfx", "ambience"].includes(type)) return "text_to_sfx";
    if (["music", "soundtrack", "jingle", "loop"].includes(type)) return "text_to_music";
  }

  throw new Error(`Sonilo does not support source type "${sourceType}" with Sound type "${type}"`);
}

export class SoniloProvider extends SoundProvider {
  getVersion() {
    return "v1";
  }

  getStatus() {
    return {
      configured: Boolean(String(this.env.SONILO_API_KEY || "").trim()),
      provider: "sonilo",
      version: this.getVersion()
    };
  }

  async discoverCapabilities() {
    const payload = await soniloFetch(this.env, "/account/services");
    const services = normalizeList(payload?.available_services);
    const mapped = serviceCapabilities(services);

    return {
      providerVersion: this.getVersion(),
      types: mapped.types,
      inputTypes: mapped.inputTypes,
      outputFormats: mapped.outputFormats,
      operations: mapped.operations,
      supportsInstrumental: false,
      supportsVocals: false,
      supportsVariation: false,
      supportsExtend: false,
      supportsTransform: false,
      supportsRemix: false,
      supportsStems: false,
      minDurationSeconds: services.some(service => service.includes("sfx")) ? 3 : 5,
      maxDurationSeconds: 360,
      parameters: {
        services,
        rpmLimit: Number.isFinite(Number(payload?.rpm_limit)) ? Number(payload.rpm_limit) : null,
        concurrencyLimit: Number.isFinite(Number(payload?.concurrency_limit)) ? Number(payload.concurrency_limit) : null,
        discountFactor: Number.isFinite(Number(payload?.discount_factor)) ? Number(payload.discount_factor) : null,
        maxUploadSizeMb: Number.isFinite(Number(payload?.max_upload_size_mb)) ? Number(payload.max_upload_size_mb) : null,
        trial: payload?.trial && typeof payload.trial === "object" ? payload.trial : null
      }
    };
  }

  async generate(request) {
    const prompt = String(request?.prompt || "").trim();
    if (!prompt) throw new Error("Sonilo prompt is required");
    if (prompt.length > 2000) throw new Error("Sonilo prompts are limited to 2000 characters");

    const duration = Number(request?.durationSeconds);
    if (!Number.isInteger(duration) || duration <= 0) {
      throw new Error("Sonilo requires a positive integer durationSeconds value");
    }

    const format = formatForRequest(request?.format);
    const service = serviceForRequest(request);
    const form = new FormData();
    form.set("prompt", prompt);
    form.set("duration", String(duration));

    if (service === "text_to_music") {
      form.set("mode", "async");
      form.set("output_format", format);
    } else if (service === "text_to_sfx") {
      form.set("audio_format", format);
    } else {
      throw new Error(`Sonilo service "${service}" requires a media input and is not yet wired to Sound generation`);
    }

    const payload = await soniloFetch(this.env, `/${service.replaceAll("_", "-")}`, {
      method: "POST",
      body: form
    });

    return this.normalizeResult({ ...payload, service });
  }

  normalizeResult(result) {
    const task = result || {};
    const service = String(task.service || task.type || "").trim().toLowerCase();
    const audio = Array.isArray(task.audio) ? task.audio[0] : task.audio;

    return {
      provider: "sonilo",
      providerGenerationId: task.task_id || task.id || null,
      status: task.status === "succeeded" ? "ready" : task.status === "failed" ? "failed" : "processing",
      url: audio?.url || task.output_url || null,
      format: audio?.content_type?.includes("mpeg") ? "mp3" : audio?.content_type?.includes("wav") ? "wav" : null,
      durationSeconds: Number.isFinite(Number(task.duration_seconds)) ? Number(task.duration_seconds) : null,
      metadata: {
        service,
        taskType: task.type || null,
        contentType: audio?.content_type || task.content_type || null,
        fileSize: Number.isFinite(Number(audio?.file_size || task.output_bytes))
          ? Number(audio?.file_size || task.output_bytes)
          : null
      }
    };
  }
}
