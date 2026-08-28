import { getSvaraFlowStyleProfile } from "./svaraflow.js";
import { buildSvaraVoiceProfile } from "./voice-intelligence.js";

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
  "Performance/Calm": { positive: ["calmness", "smoothness", "warmth", "naturalness", "breathiness"], negative: ["energy"] },
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
  if (!positive.length && !negative.length) return 15;

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

  if (energy === 0 && hasLow) score += 5;
  else if (energy === 0.5 && hasMedium) score += 5;
  else if (energy === 1 && hasHigh) score += 5;
  else if ((energy === 0 && hasMedium) || (energy === 0.5 && (hasLow || hasHigh)) || (energy === 1 && hasMedium)) score += 2;

  return Math.min(15, score);
}

function paceScore(profile, calibration) {
  const preferred = Array.isArray(profile?.pace) ? profile.pace : [];
  if (!preferred.length) return 5;
  if (calibration?.styleSpeed && typeof calibration.styleSpeed === "object") return 5;
  return 5;
}

export function scoreVoiceForStyle(voice, category, style) {
  const profile = getSvaraFlowStyleProfile(category, style);
  const intelligence = voice?.voiceIntelligence || buildSvaraVoiceProfile(voice);
  const providerMetadata = intelligence.providerMetadata || {};
  const useCases = Array.isArray(providerMetadata.useCases) ? providerMetadata.useCases : [];
  const attributes = intelligence.svaraAttributes || {};
  const styleKey = key(category, style);
  const preferredUseCases = STYLE_USE_CASES[styleKey] || [];
  const preferences = STYLE_CHARACTERISTIC_PREFERENCES[styleKey] || { positive: [], negative: [] };

  const useCase = useCaseScore(useCases, preferredUseCases);
  const characteristics = characteristicScore(attributes, preferences);
  const styleFit = styleProfileScore(profile, attributes);
  const performance = paceScore(profile, intelligence.calibration);
  const score = Math.round(Math.min(100, useCase + characteristics + styleFit + performance));

  return {
    score,
    category,
    style,
    reasons: {
      useCase,
      characteristics,
      styleFit,
      performance
    },
    matchedUseCases: useCases.filter(value => preferredUseCases.includes(normalizeUseCase(value))),
    characteristics: providerMetadata.characteristics || [],
    providerVoiceId: intelligence.providerVoiceId || voice?.providerVoiceId || ""
  };
}

export function rankVoicesForStyle(voices = [], category, style, limit = 5) {
  return voices
    .map(voice => ({ voice, match: scoreVoiceForStyle(voice, category, style) }))
    .sort((a, b) => b.match.score - a.match.score || String(a.voice?.name || "").localeCompare(String(b.voice?.name || "")))
    .slice(0, Math.max(1, Math.min(10, Number(limit) || 5)));
}
