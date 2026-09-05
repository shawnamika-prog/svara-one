export const SOUND_CAPABILITY_TYPES = Object.freeze([
  "music",
  "soundtrack",
  "sfx",
  "ambience",
  "jingle",
  "loop"
]);

export const SOUND_INPUT_TYPES = Object.freeze([
  "text",
  "audio",
  "video",
  "image"
]);

export const SOUND_OUTPUT_FORMATS = Object.freeze([
  "mp3",
  "wav",
  "pcm"
]);

export function createSoundCapabilities(overrides = {}) {
  return Object.freeze({
    types: Object.freeze([...SOUND_CAPABILITY_TYPES]),
    inputTypes: Object.freeze([]),
    outputFormats: Object.freeze([]),
    supportsInstrumental: false,
    supportsVocals: false,
    supportsVariation: false,
    supportsExtend: false,
    supportsTransform: false,
    supportsRemix: false,
    supportsStems: false,
    minDurationSeconds: null,
    maxDurationSeconds: null,
    ...overrides
  });
}
