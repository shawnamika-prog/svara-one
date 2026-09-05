function stringList(value, field) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`Sound capability ${field} must be an array`);

  return [...new Set(
    value.map(item => String(item || "").trim().toLowerCase()).filter(Boolean)
  )];
}

function booleanValue(value, field) {
  if (value === undefined) return false;
  if (typeof value !== "boolean") throw new Error(`Sound capability ${field} must be a boolean`);
  return value;
}

function durationValue(value, field) {
  if (value === undefined || value === null) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`Sound capability ${field} must be a non-negative number or null`);
  }
  return number;
}

function parametersValue(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Sound capability parameters must be an object");
  }
  return value;
}

export function createSoundCapabilities(overrides = {}) {
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new Error("Sound capability overrides must be an object");
  }

  const capabilities = {
    types: stringList(overrides.types, "types"),
    inputTypes: stringList(overrides.inputTypes, "inputTypes"),
    outputFormats: stringList(overrides.outputFormats, "outputFormats"),
    operations: stringList(overrides.operations, "operations"),
    supportsInstrumental: booleanValue(overrides.supportsInstrumental, "supportsInstrumental"),
    supportsVocals: booleanValue(overrides.supportsVocals, "supportsVocals"),
    supportsVariation: booleanValue(overrides.supportsVariation, "supportsVariation"),
    supportsExtend: booleanValue(overrides.supportsExtend, "supportsExtend"),
    supportsTransform: booleanValue(overrides.supportsTransform, "supportsTransform"),
    supportsRemix: booleanValue(overrides.supportsRemix, "supportsRemix"),
    supportsStems: booleanValue(overrides.supportsStems, "supportsStems"),
    minDurationSeconds: durationValue(overrides.minDurationSeconds, "minDurationSeconds"),
    maxDurationSeconds: durationValue(overrides.maxDurationSeconds, "maxDurationSeconds"),
    parameters: parametersValue(overrides.parameters)
  };

  if (
    capabilities.minDurationSeconds !== null &&
    capabilities.maxDurationSeconds !== null &&
    capabilities.maxDurationSeconds < capabilities.minDurationSeconds
  ) {
    throw new Error("Sound capability maxDurationSeconds cannot be less than minDurationSeconds");
  }

  return Object.freeze({
    ...capabilities,
    types: Object.freeze(capabilities.types),
    inputTypes: Object.freeze(capabilities.inputTypes),
    outputFormats: Object.freeze(capabilities.outputFormats),
    operations: Object.freeze(capabilities.operations),
    parameters: Object.freeze(capabilities.parameters)
  });
}
