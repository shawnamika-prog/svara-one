const CHARACTERISTIC_NORMALIZATION = {
  warm: { warmth: "HIGH" },
  warmth: { warmth: "HIGH" },
  caring: { warmth: "HIGH", empathy: "HIGH" },
  empathetic: { empathy: "HIGH", warmth: "MEDIUM" },
  calm: { energy: "LOW" },
  energetic: { energy: "HIGH" },
  enthusiastic: { energy: "HIGH", expressiveness: "HIGH" },
  expressive: { expressiveness: "HIGH" },
  natural: { naturalness: "HIGH" },
  smooth: { smoothness: "HIGH" },
  melodic: { expressiveness: "MEDIUM", smoothness: "HIGH" },
  confident: { confidence: "HIGH" },
  professional: { professionalism: "HIGH" },
  clear: { clarity: "HIGH" },
  knowledgeable: { authority: "HIGH" },
  trustworthy: { trustworthiness: "HIGH" },
  approachable: { approachability: "HIGH" },
  friendly: { warmth: "MEDIUM", approachability: "HIGH" },
  positive: { positivity: "HIGH" },
  patient: { patience: "HIGH", energy: "LOW" },
  polite: { politeness: "HIGH" },
  sincere: { sincerity: "HIGH" },
  engaging: { engagement: "HIGH" },
  comfortable: { naturalness: "HIGH", comfort: "HIGH" },
  casual: { casualness: "HIGH", naturalness: "HIGH" },
  cheerful: { positivity: "HIGH", energy: "HIGH" },
  breathy: { breathiness: "HIGH" },
  baritone: { vocal_depth: "HIGH" },
  deep: { vocal_depth: "HIGH" },
  raspy: { vocal_texture: "HIGH" },
  southern: { regional_character: "HIGH" }
};

const NORMALIZED_FIELDS = [
  "warmth", "energy", "naturalness", "expressiveness", "confidence", "professionalism",
  "clarity", "authority", "trustworthiness", "approachability", "empathy", "patience",
  "politeness", "sincerity", "engagement", "comfort", "casualness", "positivity",
  "breathiness", "vocal_depth", "vocal_texture", "regional_character"
];

function cleanString(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanString(value).toLowerCase().replace(/[-_]/g, " ");
}

function stringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

export function providerUseCases(metadata = {}) {
  return stringArray(metadata.use_cases ?? metadata.useCases ?? metadata.useCase);
}

export function providerCharacteristics(metadata = {}) {
  return stringArray(metadata.characteristics ?? metadata.tags);
}

export function normalizeVoiceCharacteristics(characteristics = []) {
  const normalized = {};
  for (const field of NORMALIZED_FIELDS) normalized[field] = null;

  for (const characteristic of characteristics) {
    const mapping = CHARACTERISTIC_NORMALIZATION[normalizeKey(characteristic)];
    if (!mapping) continue;
    for (const [field, value] of Object.entries(mapping)) {
      const current = normalized[field];
      if (current === "HIGH") continue;
      if (current === "MEDIUM" && value === "LOW") continue;
      normalized[field] = value;
    }
  }

  return normalized;
}

export function modelFamilyFromProviderVoiceId(providerVoiceId) {
  const value = cleanString(providerVoiceId).toLowerCase();
  if (value.startsWith("aura-2-")) return "aura-2";
  return value ? value.split("-").slice(0, 2).join("-") : "";
}

export function buildSvaraVoiceProfile(voice = {}) {
  const metadata = voice.metadata && typeof voice.metadata === "object" ? voice.metadata : {};
  const characteristics = providerCharacteristics(metadata).length
    ? providerCharacteristics(metadata)
    : stringArray(voice.characteristics);
  const useCases = providerUseCases(metadata);

  return {
    provider: cleanString(voice.provider || "deepgram"),
    model: modelFamilyFromProviderVoiceId(voice.providerVoiceId),
    providerVoiceId: cleanString(voice.providerVoiceId),
    providerMetadata: {
      name: cleanString(voice.name),
      language: cleanString(voice.category),
      accent: cleanString(voice.region),
      gender: cleanString(voice.gender),
      age: cleanString(voice.age),
      characteristics,
      useCases
    },
    svaraAttributes: normalizeVoiceCharacteristics(characteristics),
    calibration: {
      naturalSpeed: null,
      styleSpeed: {},
      styleFit: {},
      performanceFit: {}
    }
  };
}

export function voiceIntelligenceForRowVoice(voice) {
  return buildSvaraVoiceProfile(voice);
}
