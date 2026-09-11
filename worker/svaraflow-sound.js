const SVARAFLOW_SOUND_VERSION = "1.0";
const SVARAFLOW_SOUND_TIMEOUT_MS = 30000;
const MAX_CREATIVE_REQUEST_CHARS = 2000;
const MAX_SOURCE_SCRIPT_CHARS = 10000;

const SOUND_ROLES = new Set([
  "BACKGROUND_MUSIC",
  "SOUNDTRACK",
  "SCORE",
  "JINGLE",
  "LOOP",
  "SFX",
  "AMBIENCE",
  "TRANSITION"
]);

const SOUND_INTENTS = new Set([
  "CALM",
  "TENSION",
  "SUSPENSE",
  "ENERGY",
  "JOY",
  "SADNESS",
  "TRIUMPH",
  "MYSTERY",
  "REFLECTIVE",
  "DRAMATIC",
  "PLAYFUL",
  "NEUTRAL"
]);

const SOURCE_RELATIONSHIPS = new Set([
  "SUPPORT",
  "CONTRAST",
  "AMPLIFY",
  "TRANSITION",
  "UNDERLAY",
  "INDEPENDENT"
]);

const DYNAMIC_LEVELS = new Set([
  "LOW",
  "STEADY",
  "BUILDING",
  "PEAK",
  "RESOLVING"
]);

const VOCAL_POLICIES = new Set([
  "INSTRUMENTAL",
  "VOCAL_ALLOWED",
  "VOCAL_REQUIRED",
  "NO_VOCALS"
]);

const ALLOWED_SOURCE_TYPES = new Set([
  "voice",
  "sound",
  "video",
  "text",
  "none"
]);

const SVARAFLOW_SOUND_SYSTEM_PROMPT = `You are SvaraFlow™, SvaraONE's internal Sound creative-intelligence layer.

Your job is to understand what the creator is trying to make and express that understanding as a provider-independent Sound specification.

You are not a music provider and must not use provider-specific APIs, model names, endpoints, parameters, products, or proprietary terminology. Do not decide which provider should execute the work.

The human is the creative director. Follow this priority hierarchy exactly:
1. Explicit user instruction
2. Existing source or content
3. Explicit user creative parameters
4. Your own inference

You may infer missing creative direction, emotional intent, narrative relationship, dynamics, and useful constraints, but you must never override an explicit user decision.

Neutral is valid. Do not force emotion when the request or source does not support one.

Existing source content matters. When an existing Voice source is supplied, use its stored script/content to understand the relationship between the Voice and the requested Sound. Do not rewrite the source script.

Return only the provider-independent Sound specification described by the response schema.`;

const SVARAFLOW_SOUND_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "version",
    "role",
    "intent",
    "creative",
    "source",
    "dynamics",
    "voice_relationship",
    "vocal_policy",
    "constraints"
  ],
  properties: {
    version: { type: "string", enum: [SVARAFLOW_SOUND_VERSION] },
    role: {
      type: "string",
      enum: [...SOUND_ROLES]
    },
    intent: {
      type: "string",
      enum: [...SOUND_INTENTS]
    },
    creative: {
      type: "object",
      additionalProperties: false,
      required: [
        "mood",
        "style",
        "energy",
        "texture",
        "tempo_bpm",
        "intensity",
        "complexity"
      ],
      properties: {
        mood: { type: ["string", "null"] },
        style: { type: ["string", "null"] },
        energy: { type: ["string", "null"] },
        texture: { type: ["string", "null"] },
        tempo_bpm: { type: ["number", "null"] },
        intensity: { type: ["number", "null"] },
        complexity: { type: ["number", "null"] }
      }
    },
    source: {
      type: "object",
      additionalProperties: false,
      required: [
        "relationship",
        "source_type",
        "source_asset_id",
        "source_script"
      ],
      properties: {
        relationship: {
          type: "string",
          enum: [...SOURCE_RELATIONSHIPS]
        },
        source_type: {
          type: ["string", "null"],
          enum: [...ALLOWED_SOURCE_TYPES, null]
        },
        source_asset_id: { type: ["string", "null"] },
        source_script: { type: ["string", "null"] }
      }
    },
    dynamics: {
      type: "object",
      additionalProperties: false,
      required: ["opening", "development", "climax", "ending"],
      properties: {
        opening: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] },
        development: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] },
        climax: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] },
        ending: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] }
      }
    },
    voice_relationship: {
      type: "object",
      additionalProperties: false,
      required: ["support_voice", "avoid_competition"],
      properties: {
        support_voice: { type: "boolean" },
        avoid_competition: { type: "boolean" }
      }
    },
    vocal_policy: {
      type: ["string", "null"],
      enum: [...VOCAL_POLICIES, null]
    },
    constraints: {
      type: "object",
      additionalProperties: false,
      required: ["duration_seconds", "language", "negative_prompt"],
      properties: {
        duration_seconds: { type: ["number", "null"] },
        language: { type: ["string", "null"] },
        negative_prompt: { type: ["string", "null"] }
      }
    }
  }
};

function normalizeText(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeSourceType(value) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || null;
}

function extractJson(text) {
  const value = normalizeText(text);
  if (!value) throw new Error("SvaraFlow Sound returned no usable analysis");
  try {
    return JSON.parse(value);
  } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("SvaraFlow Sound returned invalid JSON");
    return JSON.parse(value.slice(start, end + 1));
  }
}

function validateRange(value, field) {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`SvaraFlow Sound returned invalid ${field}`);
  }
  return value;
}

function validateSpecification(specification, context = {}) {
  if (!specification || typeof specification !== "object") {
    throw new Error("SvaraFlow Sound returned an invalid specification");
  }
  if (String(specification.version) !== SVARAFLOW_SOUND_VERSION) {
    throw new Error("SvaraFlow Sound returned an unsupported specification version");
  }
  if (!SOUND_ROLES.has(String(specification.role))) {
    throw new Error("SvaraFlow Sound returned an invalid role");
  }
  if (!SOUND_INTENTS.has(String(specification.intent))) {
    throw new Error("SvaraFlow Sound returned an invalid intent");
  }

  const creative = specification.creative;
  if (!creative || typeof creative !== "object") {
    throw new Error("SvaraFlow Sound returned an invalid creative section");
  }
  const tempo = normalizeNullableNumber(creative.tempo_bpm);
  if (tempo !== null && tempo <= 0) throw new Error("SvaraFlow Sound returned an invalid tempo_bpm");
  const intensity = validateRange(normalizeNullableNumber(creative.intensity), "intensity");
  const complexity = validateRange(normalizeNullableNumber(creative.complexity), "complexity");

  const source = specification.source;
  if (!source || typeof source !== "object") {
    throw new Error("SvaraFlow Sound returned an invalid source section");
  }
  if (!SOURCE_RELATIONSHIPS.has(String(source.relationship))) {
    throw new Error("SvaraFlow Sound returned an invalid source relationship");
  }
  const sourceType = source.source_type == null ? null : normalizeSourceType(source.source_type);
  if (sourceType !== null && !ALLOWED_SOURCE_TYPES.has(sourceType)) {
    throw new Error("SvaraFlow Sound returned an invalid source type");
  }

  const dynamics = specification.dynamics;
  if (!dynamics || typeof dynamics !== "object") {
    throw new Error("SvaraFlow Sound returned an invalid dynamics section");
  }
  for (const key of ["opening", "development", "climax", "ending"]) {
    const value = dynamics[key] == null ? null : String(dynamics[key]);
    if (value !== null && !DYNAMIC_LEVELS.has(value)) {
      throw new Error(`SvaraFlow Sound returned an invalid ${key} dynamic`);
    }
  }

  const voiceRelationship = specification.voice_relationship;
  if (!voiceRelationship || typeof voiceRelationship !== "object") {
    throw new Error("SvaraFlow Sound returned an invalid voice relationship");
  }
  if (typeof voiceRelationship.support_voice !== "boolean" || typeof voiceRelationship.avoid_competition !== "boolean") {
    throw new Error("SvaraFlow Sound returned invalid voice relationship flags");
  }

  const vocalPolicy = specification.vocal_policy == null ? null : String(specification.vocal_policy);
  if (vocalPolicy !== null && !VOCAL_POLICIES.has(vocalPolicy)) {
    throw new Error("SvaraFlow Sound returned an invalid vocal policy");
  }

  const constraints = specification.constraints;
  if (!constraints || typeof constraints !== "object") {
    throw new Error("SvaraFlow Sound returned an invalid constraints section");
  }
  const duration = normalizeNullableNumber(constraints.duration_seconds);
  if (duration !== null && duration <= 0) throw new Error("SvaraFlow Sound returned an invalid duration_seconds");

  const sourceScript = normalizeNullableText(source.source_script);
  const expectedSourceScript = normalizeNullableText(context.sourceScript);
  if (expectedSourceScript && sourceScript !== expectedSourceScript) {
    throw new Error("SvaraFlow Sound changed the supplied source script");
  }

  const sourceAssetId = normalizeNullableText(source.source_asset_id);
  const expectedSourceAssetId = normalizeNullableText(context.sourceAssetId);
  if (expectedSourceAssetId && sourceAssetId !== expectedSourceAssetId) {
    throw new Error("SvaraFlow Sound changed the supplied source asset ID");
  }

  return {
    version: SVARAFLOW_SOUND_VERSION,
    role: String(specification.role),
    intent: String(specification.intent),
    creative: {
      mood: normalizeNullableText(creative.mood),
      style: normalizeNullableText(creative.style),
      energy: normalizeNullableText(creative.energy),
      texture: normalizeNullableText(creative.texture),
      tempo_bpm: tempo,
      intensity,
      complexity
    },
    source: {
      relationship: String(source.relationship),
      source_type: sourceType,
      source_asset_id: sourceAssetId,
      source_script: sourceScript
    },
    dynamics: {
      opening: dynamics.opening == null ? null : String(dynamics.opening),
      development: dynamics.development == null ? null : String(dynamics.development),
      climax: dynamics.climax == null ? null : String(dynamics.climax),
      ending: dynamics.ending == null ? null : String(dynamics.ending)
    },
    voice_relationship: {
      support_voice: Boolean(voiceRelationship.support_voice),
      avoid_competition: Boolean(voiceRelationship.avoid_competition)
    },
    vocal_policy: vocalPolicy,
    constraints: {
      duration_seconds: duration,
      language: normalizeNullableText(constraints.language),
      negative_prompt: normalizeNullableText(constraints.negative_prompt)
    }
  };
}

function buildInput({ prompt, type, existingSource, parameters, durationSeconds, format }) {
  const creativeRequest = normalizeText(prompt);
  if (!creativeRequest) throw new Error("SvaraFlow Sound creative request is required");
  if (creativeRequest.length > MAX_CREATIVE_REQUEST_CHARS) {
    throw new Error(`SvaraFlow Sound creative request exceeds ${MAX_CREATIVE_REQUEST_CHARS} characters`);
  }

  const source = existingSource && typeof existingSource === "object" ? existingSource : null;
  const sourceScript = normalizeNullableText(source?.script);
  if (sourceScript && sourceScript.length > MAX_SOURCE_SCRIPT_CHARS) {
    throw new Error(`SvaraFlow Sound source script exceeds ${MAX_SOURCE_SCRIPT_CHARS} characters`);
  }

  return {
    prompt: creativeRequest,
    type: normalizeNullableText(type)?.toLowerCase() || "music",
    existingSource: source ? {
      sourceType: normalizeSourceType(source.inputType || source.sourceType) || "none",
      sourceAssetId: normalizeNullableText(source.assetId || source.sourceAssetId),
      script: sourceScript
    } : null,
    parameters: parameters && typeof parameters === "object" ? parameters : {},
    constraints: {
      durationSeconds: normalizeNullableNumber(durationSeconds),
      format: normalizeNullableText(format)?.toLowerCase() || "mp3"
    }
  };
}

function modelInputText(input) {
  const sections = [
    `Creative request: ${input.prompt}`,
    `Requested Sound type: ${input.type}`,
    `Creative parameters: ${JSON.stringify(input.parameters)}`,
    `Generation constraints: ${JSON.stringify(input.constraints)}`
  ];

  if (input.existingSource) {
    sections.push(`Existing source type: ${input.existingSource.sourceType}`);
    if (input.existingSource.sourceAssetId) sections.push(`Existing source asset ID: ${input.existingSource.sourceAssetId}`);
    if (input.existingSource.script) sections.push(`Existing source script:\n${input.existingSource.script}`);
  } else {
    sections.push("Existing source: none");
  }

  return sections.join("\n");
}

async function callModel(input, env) {
  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("SvaraFlow provider is not configured");
  const model = String(env.SVARAFLOW_MODEL || "gpt-5-mini").trim();
  if (!model) throw new Error("SvaraFlow model is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SVARAFLOW_SOUND_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: SVARAFLOW_SOUND_SYSTEM_PROMPT }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: modelInputText(input) }]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "svaraflow_sound_specification",
            strict: true,
            schema: SVARAFLOW_SOUND_RESPONSE_SCHEMA
          }
        }
      }),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload?.error?.message || `SvaraFlow Sound request failed with HTTP ${response.status}`;
      throw new Error(String(detail).slice(0, 300));
    }

    const outputText = Array.isArray(payload?.output)
      ? payload.output
          .flatMap(item => Array.isArray(item?.content) ? item.content : [])
          .map(item => item?.text)
          .filter(Boolean)
          .join("\n")
      : "";

    if (!outputText) throw new Error("SvaraFlow Sound returned no output");
    return extractJson(outputText);
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("SvaraFlow Sound request timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeSoundSvaraFlowInput(input = {}) {
  return buildInput(input);
}

export function validateSoundSvaraFlowSpecification(specification, context = {}) {
  return validateSpecification(specification, context);
}

export async function processSvaraFlowSound(input = {}, env = {}) {
  const normalized = buildInput(input);
  const rawSpecification = await callModel(normalized, env);
  const specification = validateSpecification(rawSpecification, {
    sourceScript: normalized.existingSource?.script || null,
    sourceAssetId: normalized.existingSource?.sourceAssetId || null
  });

  if (String(env.SVARAFLOW_DEBUG || "").trim().toLowerCase() === "true") {
    console.log("svaraflow_sound_analysis", {
      version: SVARAFLOW_SOUND_VERSION,
      input: normalized,
      specification
    });
  }

  return specification;
}

export const SVARAFLOW_SOUND = {
  version: SVARAFLOW_SOUND_VERSION,
  roles: [...SOUND_ROLES],
  intents: [...SOUND_INTENTS],
  sourceRelationships: [...SOURCE_RELATIONSHIPS],
  dynamics: [...DYNAMIC_LEVELS],
  vocalPolicies: [...VOCAL_POLICIES],
  systemPrompt: SVARAFLOW_SOUND_SYSTEM_PROMPT,
  responseSchema: SVARAFLOW_SOUND_RESPONSE_SCHEMA
};
