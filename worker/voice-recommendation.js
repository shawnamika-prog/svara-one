import { getSvaraFlowStyleProfile } from "./svaraflow.js";
import { buildSvaraVoiceProfile } from "./voice-intelligence.js";

// Provisional scoring only. These weights are intentionally calibration-ready and must be validated by 3F-B testing.
const USE_CASE_WEIGHTS = {
  storytelling: 40,
  audiobook: 35,
  advertising: 35,
  commercial: 35,
  informative: 25,
  interview: 20,
  "casual chat": 15,
  "customer service": 10,
  ivr: 5
};

const STYLE_USE_CASES = {
  "Creative/Storytelling": ["storytelling", "audiobook"],
  "Creative/Character": ["storytelling", "audiobook"],
  "Creative/Audiobook": ["audiobook", "storytelling"],
  "Creative/Animation": ["storytelling", "commercial"],
  "Business/Commercial": ["commercial", "advertising"],
  "Business/Corporate": ["informative", "commercial"],
  "Business/Presentation": ["informative", "interview"],
  "Business/Product Demo": ["commercial", "advertising", "informative"],
  "Business/Sales": ["commercial", "advertising"],
  "Education/E-learning": ["informative"],
  "Education/Tutorial": ["informative"],
  "Education/Lesson": ["informative"],
  "Education/Language Learning": ["informative"],
  "Media/Narration": ["storytelling", "informative", "audiobook"],
  "Media/Documentary": ["informative", "storytelling"],
  "Media/Podcast": ["interview", "casual chat"],
  "Media/News": ["informative", "interview"],
  "Media/Trailer": ["commercial", "advertising", "storytelling"],
  "Performance/Dramatic": ["storytelling", "audiobook", "commercial"],
  "Performance/Inspirational": ["commercial", "informative", "storytelling"],
  "Performance/Calm": ["audiobook", "storytelling", "informative"],
  "Performance/Energetic": ["commercial", "advertising"],
  "Performance/Mystery": ["storytelling", "audiobook"]
};

const STYLE_CHARACTERISTIC_PREFERENCES = {
  "Creative/Storytelling": { positive: ["naturalness", "expressiveness", "smoothness", "warmth"], negative: ["energy"] },
  "Creative/Character": { positive: ["expressiveness", "naturalness", "engagement", "warmth"], negative: [] },
  "Creative/Audiobook": { positive: ["naturalness", "smoothness", "warmth", "expressiveness"], negative: ["energy"] },
  "Creative/Animation": { positive: ["expressiveness", "engagement", "energy", "warmth"], negative: [] },
  "Business/Commercial": { positive: ["confidence", "clarity", "energy", "expressiveness", "engagement"], negative: ["breathiness"] },
  "Business/Corporate": { positive: ["professionalism", "confidence", "clarity", "trustworthiness", "authority"], negative: ["casualness"] },
  "Business/Presentation": { positive: ["clarity", "confidence", "professionalism", "engagement"], negative: [] },
  "Business/Product Demo": { positive: ["clarity", "confidence", "engagement", "professionalism"], negative: [] },
  "Business/Sales": { positive: ["confidence", "energy", "engagement", "warmth"], negative: [] },
  "Education/E-learning": { positive: ["clarity", "naturalness", "patience", "approachability"], negative: ["energy"] },
  "Education/Tutorial": { positive: ["clarity", "patience", "naturalness", "approachability"], negative: [] },
  "Education/Lesson": { positive: ["clarity", "naturalness", "patience", "warmth"], negative: [] },
  "Education/Language Learning": { positive: ["clarity", "patience", "naturalness"], negative: ["energy"] },
  "Media/Narration": { positive: ["naturalness", "smoothness", "expressiveness", "warmth", "trustworthiness"], negative: ["energy"] },
  "Media/Documentary": { positive: ["clarity", "naturalness", "authority", "trustworthiness", "expressiveness"], negative: [] },
  "Media/Podcast": { positive: ["naturalness", "approachability", "warmth", "casualness", "engagement"], negative: ["professionalism"] },
  "Media/News": { positive: ["clarity", "authority", "confidence", "professionalism"], negative: ["casualness", "warmth"] },
  "Media/Trailer": { positive: ["expressiveness", "energy", "confidence", "engagement"], negative: [] },
  "Performance/Dramatic": { positive: ["expressiveness", "engagement", "vocal_depth", "vocal_texture"], negative: [] },
  "Performance/Inspirational": { positive: ["confidence", "expressiveness", "warmth", "energy", "engagement"], negative: [] },
  "Performance/Calm": { positive: ["smoothness", "warmth", "naturalness", "breathiness"], negative: ["energy"] },
  "Performance/Energetic": { positive: ["energy", "expressiveness", "confidence", "engagement"], negative: [] },
  "Performance/Mystery": { positive: ["smoothness", "vocal_depth", "vocal_texture", "breathiness", "naturalness"], negative: ["energy"] }
};

function clean(value) {
  return String(value ?? "").trim();
}

function key(category, style) {
  return `${clean(category)}/${clean(style)}`;
}

function normalizeUseCase(value) {
  return clean(value).toLowerCase();
}

function characteristicValue(value) {
  if (value === "HIGH") return 1;
  if (value === "MEDIUM") return 0.5;
  if (value === "LOW") return 0;
  return null;
}

function useCaseScore(useCases, preferredUseCases) {
  const normalized = new Set(useCases.map(normalizeUseCase));
  if (!preferredUseCases.length) return 0;
  let best = 0;
  for (const useCase of preferredUseCases) {
    if (normalized.has(useCase)) best = Math.max(best, USE_CASE_WEIGHTS[useCase] || 0);
  }
  return Math.min(40, best);
}

function characteristicScore(attributes, preferences) {
  const positive = preferences?.positive || [];
  const negative = preferences?.negative || [];
  let positiveTotal = 0;
  let positiveHits = 0;

  for (const field of positive) {
    const value = characteristicValue(attributes[field]);
    if (value == null) continue;
    positiveTotal += value;
    positiveHits++;
  }

  const positiveScore = positiveHits ? (positiveTotal / positiveHits) * 25 : 0;
  let negativePenalty = 0;

  for (const field of negative) {
    const value = characteristicValue(attributes[field]);
    if (value == null) continue;
    negativePenalty += value * 5;
  }

  return Math.max(0, Math.min(30, positiveScore + 5 - negativePenalty));
}

function styleProfileScore(profile, attributes) {
  const energy = characteristicValue(attributes.energy);
  const expectedEnergy = Array.isArray(profile.energy) ? profile.energy : [];
  if (energy == null || !expectedEnergy.length) return 10;

  const hasLow = expectedEnergy.includes("LOW");
  const hasMedium = expectedEnergy.includes("MEDIUM");
  const hasHigh = expectedEnergy.includes("HIGH");
  let score = 10;

  if (energy === 0 && hasLow) score += 10;
  else if (energy === 0.5 && hasMedium) score += 10;
  else if (energy === 1 && hasHigh) score += 10;
  else if ((energy === 0 && hasMedium) || (energy === 0.5 && (hasLow || hasHigh)) || (energy === 1 && hasMedium)) score += 5;

  return Math.min(20, score);
}

function performanceScore(profile, calibration) {
  // No empirical speed/style calibration exists yet. Keep this neutral until 3F-B supplies evidence.
  if (!Array.isArray(profile?.pace) || !profile.pace.length) return 10;
  if (calibration?.styleSpeed && typeof calibration.styleSpeed === "object") return 10;
  return 10;
}

function registryIdentityMap(voices = []) {
  const map = new Map();
  for (const voice of voices) {
    const providerVoiceId = clean(voice?.providerVoiceId || voice?.provider_voice_id);
    if (!providerVoiceId) continue;
    map.set(providerVoiceId, voice);
  }
  return map;
}

function resolveRegistryIdentity(voice, registryMap) {
  const providerVoiceId = clean(voice?.providerVoiceId || voice?.provider_voice_id);
  const registryVoice = registryMap.get(providerVoiceId);
  if (!registryVoice) return {};

  return {
    svaraId: registryVoice.svaraId || registryVoice.svara_id || "",
    displayName: registryVoice.displayName || registryVoice.display_name || registryVoice.name || "",
    provider: registryVoice.provider || voice.provider || ""
  };
}

function buildRecommendationVoice(voice) {
  const existing = voice?.voiceIntelligence;
  if (existing?.providerMetadata?.characteristics?.length || existing?.providerMetadata?.useCases?.length) {
    return existing;
  }

  const metadata = voice?.metadata && typeof voice.metadata === "object" ? voice.metadata : {};
  const characteristics = Array.isArray(metadata.characteristics)
    ? metadata.characteristics
    : (Array.isArray(metadata.tags) ? metadata.tags : []);
  const useCases = Array.isArray(metadata.use_cases)
    ? metadata.use_cases
    : (Array.isArray(metadata.useCases) ? metadata.useCases : []);

  return buildSvaraVoiceProfile({
    ...voice,
    metadata: {
      ...metadata,
      characteristics,
      tags: characteristics,
      use_cases: useCases
    }
  });
}

export function scoreVoiceForStyle(voice, category, style) {
  const profile = getSvaraFlowStyleProfile(category, style);
  const intelligence = buildRecommendationVoice(voice);
  const providerMetadata = intelligence.providerMetadata || {};
  const useCases = Array.isArray(providerMetadata.useCases) ? providerMetadata.useCases : [];
  const attributes = intelligence.svaraAttributes || {};
  const styleKey = key(category, style);
  const preferredUseCases = STYLE_USE_CASES[styleKey] || [];
  const preferences = STYLE_CHARACTERISTIC_PREFERENCES[styleKey] || { positive: [], negative: [] };

  const useCase = useCaseScore(useCases, preferredUseCases);
  const characteristics = characteristicScore(attributes, preferences);
  const styleFit = styleProfileScore(profile, attributes);
  const performance = performanceScore(profile, intelligence.calibration);
  const score = Math.round(Math.min(100, useCase + characteristics + styleFit + performance));

  return {
    score,
    category,
    style,
    provisional: true,
    reasons: {
      useCase,
      characteristics,
      styleFit,
      performance
    },
    matchedUseCases: useCases.filter(value => preferredUseCases.includes(normalizeUseCase(value))),
    characteristics: providerMetadata.characteristics || [],
    providerVoiceId: intelligence.providerVoiceId || voice?.providerVoiceId || "",
    debug: {
      normalizedAttributes: attributes,
      sourceCharacteristics: providerMetadata.characteristics || [],
      sourceUseCases: useCases
    }
  };
}

export function rankVoicesForStyle(voices = [], category, style, limit = 5, registryVoices = []) {
  const registryMap = registryIdentityMap(registryVoices);

  return voices
    .map(voice => {
      const match = scoreVoiceForStyle(voice, category, style);
      const identity = resolveRegistryIdentity(voice, registryMap);
      return {
        voice,
        match,
        ...identity
      };
    })
    .sort((a, b) => b.match.score - a.match.score || String(a.displayName || a.voice?.name || "").localeCompare(String(b.displayName || b.voice?.name || "")))
    .slice(0, Math.max(1, Math.min(10, Number(limit) || 5)));
}
