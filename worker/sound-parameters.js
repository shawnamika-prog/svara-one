const TEXT_FIELDS = ["mood", "style", "energy", "texture", "language", "negativePrompt"];
const NUMERIC_FIELDS = ["tempoBpm", "intensity", "complexity", "durationSeconds"];
const BOOLEAN_FIELDS = ["instrumental", "excludeVocals"];

function normalizeText(value, field) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!text) return null;
  if (text.length > 500) throw new Error(`Sound parameter ${field} is too long`);
  return text;
}

function normalizeNumber(value, field, { min = 0, max = null, integer = false } = {}) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || (max !== null && number > max) || (integer && !Number.isInteger(number))) {
    const range = max === null ? `at least ${min}` : `between ${min} and ${max}`;
    throw new Error(`Sound parameter ${field} must be a number ${range}`);
  }
  return number;
}

function normalizeBoolean(value, field, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (value === 0 || value === 1) return Boolean(value);
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  throw new Error(`Sound parameter ${field} must be a boolean`);
}

export function normalizeSoundParameters(parameters, { durationSeconds = null } = {}) {
  if (parameters === null || parameters === undefined) return null;
  if (!parameters || typeof parameters !== "object" || Array.isArray(parameters)) {
    throw new Error("Sound parameters must be an object");
  }

  const normalized = {
    mood: normalizeText(parameters.mood, "mood"),
    style: normalizeText(parameters.style, "style"),
    energy: normalizeText(parameters.energy, "energy"),
    texture: normalizeText(parameters.texture, "texture"),
    tempoBpm: normalizeNumber(parameters.tempoBpm ?? parameters.tempo_bpm, "tempoBpm", { min: 1, max: 400 }),
    intensity: normalizeNumber(parameters.intensity, "intensity", { min: 0, max: 1 }),
    complexity: normalizeNumber(parameters.complexity, "complexity", { min: 0, max: 1 }),
    instrumental: normalizeBoolean(parameters.instrumental, "instrumental", true),
    excludeVocals: normalizeBoolean(
      parameters.excludeVocals ?? parameters.exclude_vocals,
      "excludeVocals",
      true
    ),
    language: normalizeText(parameters.language, "language"),
    negativePrompt: normalizeText(
      parameters.negativePrompt ?? parameters.negative_prompt,
      "negativePrompt"
    ),
    durationSeconds: normalizeNumber(
      parameters.durationSeconds ?? parameters.duration_seconds ?? durationSeconds,
      "durationSeconds",
      { min: 0.001 }
    ),
    customParameters: parameters.customParameters === undefined
      ? (parameters.custom_parameters === undefined ? null : parameters.custom_parameters)
      : parameters.customParameters
  };

  if (normalized.durationSeconds !== null && durationSeconds !== null && Number(durationSeconds) !== normalized.durationSeconds) {
    throw new Error("Sound parameter durationSeconds must match the generation duration");
  }

  return normalized;
}

export function soundParametersForPrompt(parameters) {
  if (!parameters) return "";
  const parts = [];
  if (parameters.mood) parts.push(`mood: ${parameters.mood}`);
  if (parameters.style) parts.push(`style: ${parameters.style}`);
  if (parameters.energy) parts.push(`energy: ${parameters.energy}`);
  if (parameters.texture) parts.push(`texture: ${parameters.texture}`);
  if (parameters.tempoBpm !== null && parameters.tempoBpm !== undefined) parts.push(`tempo: ${parameters.tempoBpm} BPM`);
  if (parameters.intensity !== null && parameters.intensity !== undefined) parts.push(`intensity: ${parameters.intensity}`);
  if (parameters.complexity !== null && parameters.complexity !== undefined) parts.push(`complexity: ${parameters.complexity}`);
  if (parameters.instrumental === true) parts.push("instrumental");
  if (parameters.excludeVocals === true) parts.push("exclude vocals");
  if (parameters.language) parts.push(`language: ${parameters.language}`);
  if (parameters.negativePrompt) parts.push(`avoid: ${parameters.negativePrompt}`);
  return parts.join(", ");
}
