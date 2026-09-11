const SVARAFLOW_SOUND_REFINEMENT_TIMEOUT_MS = 30000;

const SVARAFLOW_SOUND_REFINEMENT_SYSTEM_PROMPT = `You are SvaraFlow™, SvaraONE's internal Sound creative-intelligence layer continuing an existing creative collaboration.

Your job is to refine the existing Sound understanding in response to the creator's latest feedback.

The human remains the creative director. Apply this priority hierarchy:
1. Latest explicit user feedback
2. Existing approved/current creative understanding
3. Existing source/content
4. Existing explicit creative parameters
5. Your own inference

You may change only the parts of the Sound understanding that the creator's feedback requires. Preserve everything else that remains compatible with the creator's intention.

You are provider-independent. Do not mention providers, APIs, model names, endpoints, products, or provider-specific terminology.

Do not rewrite, paraphrase, omit, invent, translate, or alter an existing source script. Preserve the supplied source asset ID.

Return only the complete refined provider-independent Sound specification matching the required schema.`;

const SOUND_ROLES = new Set(["BACKGROUND_MUSIC", "SOUNDTRACK", "SCORE", "JINGLE", "LOOP", "SFX", "AMBIENCE", "TRANSITION"]);
const SOUND_INTENTS = new Set(["CALM", "TENSION", "SUSPENSE", "ENERGY", "JOY", "SADNESS", "TRIUMPH", "MYSTERY", "REFLECTIVE", "DRAMATIC", "PLAYFUL", "NEUTRAL"]);
const SOURCE_RELATIONSHIPS = new Set(["SUPPORT", "CONTRAST", "AMPLIFY", "TRANSITION", "UNDERLAY", "INDEPENDENT"]);
const DYNAMIC_LEVELS = new Set(["LOW", "STEADY", "BUILDING", "PEAK", "RESOLVING"]);
const VOCAL_POLICIES = new Set(["INSTRUMENTAL", "VOCAL_ALLOWED", "VOCAL_REQUIRED", "NO_VOCALS"]);
const SOURCE_TYPES = new Set(["voice", "sound", "video", "text", "none"]);

const SPEC_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["version", "role", "intent", "creative", "source", "dynamics", "voice_relationship", "vocal_policy", "constraints"],
  properties: {
    version: { type: "string", enum: ["1.0"] },
    role: { type: "string", enum: [...SOUND_ROLES] },
    intent: { type: "string", enum: [...SOUND_INTENTS] },
    creative: {
      type: "object", additionalProperties: false,
      required: ["mood", "style", "energy", "texture", "tempo_bpm", "intensity", "complexity"],
      properties: {
        mood: { type: ["string", "null"] }, style: { type: ["string", "null"] },
        energy: { type: ["string", "null"] }, texture: { type: ["string", "null"] },
        tempo_bpm: { type: ["number", "null"] }, intensity: { type: ["number", "null"] }, complexity: { type: ["number", "null"] }
      }
    },
    source: {
      type: "object", additionalProperties: false,
      required: ["relationship", "source_type", "source_asset_id", "source_script"],
      properties: {
        relationship: { type: "string", enum: [...SOURCE_RELATIONSHIPS] },
        source_type: { type: ["string", "null"], enum: [...SOURCE_TYPES, null] },
        source_asset_id: { type: ["string", "null"] }, source_script: { type: ["string", "null"] }
      }
    },
    dynamics: {
      type: "object", additionalProperties: false,
      required: ["opening", "development", "climax", "ending"],
      properties: {
        opening: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] },
        development: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] },
        climax: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] },
        ending: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] }
      }
    },
    voice_relationship: {
      type: "object", additionalProperties: false,
      required: ["support_voice", "avoid_competition"],
      properties: { support_voice: { type: "boolean" }, avoid_competition: { type: "boolean" } }
    },
    vocal_policy: { type: ["string", "null"], enum: [...VOCAL_POLICIES, null] },
    constraints: {
      type: "object", additionalProperties: false,
      required: ["duration_seconds", "language", "negative_prompt"],
      properties: {
        duration_seconds: { type: ["number", "null"] }, language: { type: ["string", "null"] }, negative_prompt: { type: ["string", "null"] }
      }
    }
  }
};

function text(value) { return String(value ?? "").replace(/\r\n/g, "\n").trim(); }
function nullableText(value) { const v = text(value); return v || null; }
function nullableNumber(value) { if (value === null || value === undefined || value === "") return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
function jsonFromOutput(value) {
  const raw = text(value);
  if (!raw) throw new Error("SvaraFlow Sound refinement returned no usable output");
  try { return JSON.parse(raw); } catch {
    const start = raw.indexOf("{"); const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("SvaraFlow Sound refinement returned invalid JSON");
    return JSON.parse(raw.slice(start, end + 1));
  }
}

function validateSpecification(spec, context = {}) {
  if (!spec || typeof spec !== "object") throw new Error("SvaraFlow Sound refinement returned an invalid specification");
  if (String(spec.version) !== "1.0") throw new Error("SvaraFlow Sound refinement returned an unsupported specification version");
  if (!SOUND_ROLES.has(String(spec.role))) throw new Error("SvaraFlow Sound refinement returned an invalid role");
  if (!SOUND_INTENTS.has(String(spec.intent))) throw new Error("SvaraFlow Sound refinement returned an invalid intent");
  const c = spec.creative;
  if (!c || typeof c !== "object") throw new Error("SvaraFlow Sound refinement returned an invalid creative section");
  for (const field of ["intensity", "complexity"]) {
    const n = nullableNumber(c[field]); if (n !== null && (n < 0 || n > 1)) throw new Error(`SvaraFlow Sound refinement returned invalid ${field}`);
  }
  const tempo = nullableNumber(c.tempo_bpm); if (tempo !== null && tempo <= 0) throw new Error("SvaraFlow Sound refinement returned invalid tempo_bpm");
  const s = spec.source;
  if (!s || typeof s !== "object" || !SOURCE_RELATIONSHIPS.has(String(s.relationship))) throw new Error("SvaraFlow Sound refinement returned an invalid source relationship");
  const sourceType = s.source_type == null ? null : text(s.source_type).toLowerCase();
  if (sourceType !== null && !SOURCE_TYPES.has(sourceType)) throw new Error("SvaraFlow Sound refinement returned an invalid source type");
  const d = spec.dynamics;
  if (!d || typeof d !== "object") throw new Error("SvaraFlow Sound refinement returned an invalid dynamics section");
  for (const key of ["opening", "development", "climax", "ending"]) if (d[key] != null && !DYNAMIC_LEVELS.has(String(d[key]))) throw new Error(`SvaraFlow Sound refinement returned invalid ${key} dynamics`);
  const vr = spec.voice_relationship;
  if (!vr || typeof vr !== "object" || typeof vr.support_voice !== "boolean" || typeof vr.avoid_competition !== "boolean") throw new Error("SvaraFlow Sound refinement returned invalid voice relationship flags");
  const vp = spec.vocal_policy == null ? null : String(spec.vocal_policy); if (vp !== null && !VOCAL_POLICIES.has(vp)) throw new Error("SvaraFlow Sound refinement returned an invalid vocal policy");
  const constraints = spec.constraints; if (!constraints || typeof constraints !== "object") throw new Error("SvaraFlow Sound refinement returned invalid constraints");
  const duration = nullableNumber(constraints.duration_seconds); if (duration !== null && duration <= 0) throw new Error("SvaraFlow Sound refinement returned invalid duration_seconds");
  const sourceScript = nullableText(s.source_script);
  const expectedScript = nullableText(context.sourceScript);
  if (expectedScript && sourceScript !== expectedScript) throw new Error("SvaraFlow Sound refinement changed the supplied source script");
  const sourceAssetId = nullableText(s.source_asset_id);
  const expectedAssetId = nullableText(context.sourceAssetId);
  if (expectedAssetId && sourceAssetId !== expectedAssetId) throw new Error("SvaraFlow Sound refinement changed the supplied source asset ID");
  return {
    version: "1.0", role: String(spec.role), intent: String(spec.intent),
    creative: { mood: nullableText(c.mood), style: nullableText(c.style), energy: nullableText(c.energy), texture: nullableText(c.texture), tempo_bpm: tempo, intensity: nullableNumber(c.intensity), complexity: nullableNumber(c.complexity) },
    source: { relationship: String(s.relationship), source_type: sourceType, source_asset_id: sourceAssetId, source_script: sourceScript },
    dynamics: { opening: d.opening == null ? null : String(d.opening), development: d.development == null ? null : String(d.development), climax: d.climax == null ? null : String(d.climax), ending: d.ending == null ? null : String(d.ending) },
    voice_relationship: { support_voice: Boolean(vr.support_voice), avoid_competition: Boolean(vr.avoid_competition) },
    vocal_policy: vp,
    constraints: { duration_seconds: duration, language: nullableText(constraints.language), negative_prompt: nullableText(constraints.negative_prompt) }
  };
}

function modelInput({ feedback, currentSpecification, originalContext }) {
  return [
    `Creator feedback: ${text(feedback)}`,
    `Current Sound specification:\n${JSON.stringify(currentSpecification)}`,
    `Original creative request: ${text(originalContext?.prompt)}`,
    `Original Sound type: ${text(originalContext?.type) || "music"}`,
    `Original creative parameters: ${JSON.stringify(originalContext?.parameters && typeof originalContext.parameters === "object" ? originalContext.parameters : {})}`,
    `Generation constraints: ${JSON.stringify(originalContext?.constraints && typeof originalContext.constraints === "object" ? originalContext.constraints : {})}`,
    `Existing source type: ${text(originalContext?.sourceType) || "none"}`,
    `Existing source asset ID: ${nullableText(originalContext?.sourceAssetId) || "none"}`,
    `Existing source script:\n${nullableText(originalContext?.sourceScript) || "none"}`
  ].join("\n");
}

async function callModel(input, env) {
  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("SvaraFlow provider is not configured");
  const model = String(env.SVARAFLOW_MODEL || "gpt-5-mini").trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SVARAFLOW_SOUND_REFINEMENT_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model, input: [
        { role: "system", content: [{ type: "input_text", text: SVARAFLOW_SOUND_REFINEMENT_SYSTEM_PROMPT }] },
        { role: "user", content: [{ type: "input_text", text: modelInput(input) }] }
      ], text: { format: { type: "json_schema", name: "svaraflow_sound_refined_specification", strict: true, schema: SPEC_SCHEMA } } }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(String(payload?.error?.message || `SvaraFlow Sound refinement failed with HTTP ${response.status}`).slice(0, 300));
    const outputText = Array.isArray(payload?.output) ? payload.output.flatMap(item => Array.isArray(item?.content) ? item.content : []).map(item => item?.text).filter(Boolean).join("\n") : "";
    return jsonFromOutput(outputText);
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("SvaraFlow Sound refinement request timed out");
    throw error;
  } finally { clearTimeout(timeout); }
}

export async function refineSvaraFlowSound({ feedback, currentSpecification, originalContext }, env = {}) {
  const creatorFeedback = text(feedback);
  if (!creatorFeedback) throw new Error("SvaraFlow Sound refinement feedback is required");
  if (!currentSpecification || typeof currentSpecification !== "object") throw new Error("Current Sound specification is required for refinement");
  const result = await callModel({ feedback: creatorFeedback, currentSpecification, originalContext }, env);
  return validateSpecification(result, { sourceScript: originalContext?.sourceScript || null, sourceAssetId: originalContext?.sourceAssetId || null });
}

export const SVARAFLOW_SOUND_REFINEMENT = { version: "1.0", systemPrompt: SVARAFLOW_SOUND_REFINEMENT_SYSTEM_PROMPT, responseSchema: SPEC_SCHEMA };