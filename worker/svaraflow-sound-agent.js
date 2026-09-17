import { validateSoundSvaraFlowSpecification } from "./svaraflow-sound.js";

const TIMEOUT_MS = 30000;
const MAX_TURNS = 20;
const ACTIONS = new Set(["propose", "refine", "clarify", "question", "respond", "approve"]);
const SOUND_ROLES = ["BACKGROUND_MUSIC", "SOUNDTRACK", "SCORE", "JINGLE", "LOOP", "SFX", "AMBIENCE", "TRANSITION"];
const SOUND_INTENTS = ["CALM", "TENSION", "SUSPENSE", "ENERGY", "JOY", "SADNESS", "TRIUMPH", "MYSTERY", "REFLECTIVE", "DRAMATIC", "PLAYFUL", "NEUTRAL"];
const SOURCE_RELATIONSHIPS = ["SUPPORT", "CONTRAST", "AMPLIFY", "TRANSITION", "UNDERLAY", "INDEPENDENT"];
const DYNAMIC_LEVELS = ["LOW", "STEADY", "BUILDING", "PEAK", "RESOLVING"];
const VOCAL_POLICIES = ["INSTRUMENTAL", "VOCAL_ALLOWED", "VOCAL_REQUIRED", "NO_VOCALS"];
const SOURCE_TYPES = ["voice", "sound", "video", "text", "none"];

const SPEC_SCHEMA = {
  type: ["object", "null"],
  additionalProperties: false,
  properties: {
    version: { type: "string", enum: ["1.0"] },
    role: { type: "string", enum: SOUND_ROLES },
    intent: { type: "string", enum: SOUND_INTENTS },
    creative: {
      type: "object", additionalProperties: false,
      properties: {
        mood: { type: ["string", "null"] }, style: { type: ["string", "null"] },
        energy: { type: ["string", "null"] }, texture: { type: ["string", "null"] },
        tempo_bpm: { type: ["number", "null"] }, intensity: { type: ["number", "null"] }, complexity: { type: ["number", "null"] }
      },
      required: ["mood", "style", "energy", "texture", "tempo_bpm", "intensity", "complexity"]
    },
    source: {
      type: "object", additionalProperties: false,
      properties: {
        relationship: { type: "string", enum: SOURCE_RELATIONSHIPS },
        source_type: { type: ["string", "null"], enum: [...SOURCE_TYPES, null] }, source_asset_id: { type: ["string", "null"] }, source_script: { type: ["string", "null"] }
      },
      required: ["relationship", "source_type", "source_asset_id", "source_script"]
    },
    dynamics: {
      type: "object", additionalProperties: false,
      properties: {
        opening: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] }, development: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] }, climax: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] }, ending: { type: ["string", "null"], enum: [...DYNAMIC_LEVELS, null] }
      },
      required: ["opening", "development", "climax", "ending"]
    },
    voice_relationship: {
      type: "object", additionalProperties: false,
      properties: { support_voice: { type: "boolean" }, avoid_competition: { type: "boolean" } },
      required: ["support_voice", "avoid_competition"]
    },
    vocal_policy: { type: ["string", "null"], enum: [...VOCAL_POLICIES, null] },
    constraints: {
      type: "object", additionalProperties: false,
      properties: { duration_seconds: { type: ["number", "null"] }, language: { type: ["string", "null"] }, negative_prompt: { type: ["string", "null"] } },
      required: ["duration_seconds", "language", "negative_prompt"]
    }
  },
  required: ["version", "role", "intent", "creative", "source", "dynamics", "voice_relationship", "vocal_policy", "constraints"]
};

const AGENT_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    action: { type: "string", enum: [...ACTIONS] },
    response: { type: "string" },
    specification: SPEC_SCHEMA
  },
  required: ["action", "response", "specification"]
};

const SYSTEM_PROMPT = `You are SvaraFlow™, SvaraONE's agentic Sound creative intelligence.

You are an active creative collaborator, not a hard-coded response generator. Reason over the creator's request, the conversation, the current Sound direction, and the available normalized adapter capabilities before deciding what to do.

The human is the creative director. You must understand conversational intent:
- propose: establish a Sound direction from a new request, creative exploration request, or request for ideas/directions
- refine: materially change the direction in response to requested changes
- clarify: the creator is dissatisfied or unclear and has not specified what should change; ask a useful focused question
- question: answer a question about the current direction or collaboration without inventing a new generation
- respond: acknowledge or respond naturally to conversational feedback that does not request a new generation or a change of direction
- approve: the creator clearly accepts the current direction AND indicates that generation should proceed

Approval requires an actual decision to proceed with generation AND an existing proposed/current Sound specification that the creator is accepting. Never treat a request to retry, repeat, continue, reconsider, suggest ideas, or provide directions as approval when there is no existing Sound specification. A retry after a failed request is a request to repeat the analysis/conversation, not permission to generate.

Praise, thanks, excitement, compliments, or conversational acknowledgements by themselves are NOT approval. Messages such as liking the result, saying thank you, or celebrating success after generation must not trigger another generation. When the creator is merely acknowledging the result, respond naturally and take no generation action.

When the creator asks for ideas, suggestions, options, directions, or a few Sound concepts, remain in exploration. Explain the useful options in the response and do not approve generation. A direction becomes executable only after the creator accepts or explicitly asks to generate from an existing specification.

Never treat every follow-up as refinement. Approval language must be recognized from meaning, not a fixed phrase list. Vague dissatisfaction should lead to a clarifying response. A request for a new direction must produce a genuinely reconsidered specification, not a cosmetic rewrite.

Provider capabilities are supplied as normalized data. Use them to advise the creator when the requested work is unsupported or needs to be expressed differently. Do not mention provider names, APIs, endpoints, model names, or proprietary provider terminology.

Duration limits are hard constraints, not suggestions. When the supplied capabilities define a minimum or maximum duration for the applicable Sound service, never propose or approve a duration outside that range. If the creator requests a duration above the discovered maximum, do not silently reduce it and do not generate it. Tell the creator the maximum duration available for that Sound type and that they can choose a supported duration. Likewise, if the creator requests a duration below the discovered minimum, state the minimum supported duration. Example: "The maximum duration I can create for this Sound type is 6 minutes. I can create it at 6 minutes or less." Do not mention the provider name.

Missing capability data is NOT evidence that a Sound operation is unsupported. Never tell the creator that text-only Sound generation is unavailable merely because capabilities are missing, stale, or could not be loaded. For a valid text-based music, soundtrack, jingle, loop, SFX, or ambience request, continue the creative conversation and approve generation when the creator clearly asks to proceed. Only advise that an operation is unsupported when the supplied capabilities explicitly show that the requested operation/input/type is unsupported.

Preserve explicit creator decisions. When refining, change what the feedback requires and preserve compatible choices. Do not drop important creative requirements such as instruments, orchestration, emotional arc, narrative purpose, or ending unless creator changes them.

A strong Sound direction can include emotional arc, instrumentation, orchestration, dynamics, texture, pacing, ending/resolution, and relationship to existing source material. Do not force a generic structure when the creator's request calls for something specific.

Response should sound like a thoughtful creative collaborator. Keep it concise but useful. Return only the structured result.`;

function text(value) { return String(value ?? "").trim(); }
function jsonFromOutput(value) {
  const raw = text(value);
  if (!raw) throw new Error("SvaraFlow Sound agent returned no usable output");
  try { return JSON.parse(raw); } catch {
    const start = raw.indexOf("{"); const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("SvaraFlow Sound agent returned invalid JSON");
    return JSON.parse(raw.slice(start, end + 1));
  }
}
function compactConversation(conversation) {
  return (Array.isArray(conversation) ? conversation : []).slice(-MAX_TURNS).map(turn => ({ role: turn?.role === "assistant" ? "assistant" : "user", content: text(turn?.content).slice(0, 4000) })).filter(turn => turn.content);
}
function modelInput({ message, conversation, currentSpecification, context, capabilities }) {
  return [
    `Latest creator message: ${text(message)}`,
    `Conversation:\n${JSON.stringify(compactConversation(conversation))}`,
    `Current Sound specification:\n${currentSpecification ? JSON.stringify(currentSpecification) : "none"}`,
    `Creative context:\n${JSON.stringify(context || {})}`,
    `Available normalized adapter capabilities:\n${JSON.stringify(capabilities || { unavailable: true })}`
  ].join("\n\n");
}

function parseRequestedDurationSeconds(message) {
  const value = text(message).toLowerCase().replace(/,/g, ".");
  const match = value.match(/(?:about|around|approximately|roughly|exactly|make\s+(?:it|this)\s+)?(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m)\b/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unit = match[2];
  return /^(seconds?|secs?|s)$/.test(unit) ? amount : amount * 60;
}

function applicableDurationConstraint(context = {}, capabilities = null) {
  const type = text(context.type).toLowerCase();
  const sourceType = text(context.sourceType || "text").toLowerCase();
  const services = capabilities?.parameters?.serviceConstraints;
  if (!services || typeof services !== "object") return null;

  let service = null;
  if (sourceType === "video") {
    if (["sfx", "ambience"].includes(type)) service = "video_to_sfx";
    else if (["music", "soundtrack", "jingle", "loop"].includes(type)) service = "video_to_music";
  } else if (["text", "voice"].includes(sourceType)) {
    if (["sfx", "ambience"].includes(type)) service = "text_to_sfx";
    else if (["music", "soundtrack", "jingle", "loop"].includes(type)) service = "text_to_music";
  }

  if (!service || !services[service]) return null;
  const constraint = services[service];
  const min = Number(constraint.minDurationSeconds);
  const max = Number(constraint.maxDurationSeconds);
  return {
    service,
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null
  };
}

function durationLabel(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "";
  if (value % 60 === 0) return `${value / 60} minute${value === 60 ? "" : "s"}`;
  return `${value} seconds`;
}

function durationLimitResponse(context = {}, capabilities = null, requestedDurationSeconds = null) {
  const constraint = applicableDurationConstraint(context, capabilities);
  if (!constraint) return null;
  const requested = Number(requestedDurationSeconds ?? context.durationSeconds);
  if (!Number.isFinite(requested) || requested <= 0) return null;

  if (constraint.max !== null && requested > constraint.max) {
    return `The maximum duration I can create for this Sound type is ${durationLabel(constraint.max)}. I can create it at ${durationLabel(constraint.max)} or less.`;
  }
  if (constraint.min !== null && requested < constraint.min) {
    return `The minimum duration I can create for this Sound type is ${durationLabel(constraint.min)}. I can create it at ${durationLabel(constraint.min)} or longer.`;
  }
  return null;
}

async function callModel(input, env) {
  const apiKey = text(env.OPENAI_API_KEY);
  if (!apiKey) throw new Error("SvaraFlow provider is not configured");
  const model = text(env.SVARAFLOW_MODEL) || "gpt-5-mini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
          { role: "user", content: [{ type: "input_text", text: modelInput(input) }] }
        ],
        text: { format: { type: "json_schema", name: "svaraflow_sound_agent_turn", strict: true, schema: AGENT_SCHEMA } }
      }),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(String(payload?.error?.message || `SvaraFlow Sound agent failed with HTTP ${response.status}`).slice(0, 300));
    const outputText = Array.isArray(payload?.output)
      ? payload.output.flatMap(item => Array.isArray(item?.content) ? item.content : []).map(item => item?.text).filter(Boolean).join("\n")
      : "";
    return jsonFromOutput(outputText);
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("SvaraFlow Sound agent request timed out");
    throw error;
  } finally { clearTimeout(timeout); }
}

export async function runSvaraFlowSoundAgent(input = {}, env = {}) {
  const message = text(input.message);
  if (!message) throw new Error("Creator message is required");

  const requestedDurationSeconds = parseRequestedDurationSeconds(message);
  const limitResponse = durationLimitResponse(input.context || {}, input.capabilities, requestedDurationSeconds);
  if (limitResponse) {
    return { action: "clarify", response: limitResponse, specification: null };
  }

  const result = await callModel(input, env);
  if (!ACTIONS.has(String(result.action))) throw new Error("SvaraFlow Sound agent returned an invalid action");
  if (!text(result.response)) throw new Error("SvaraFlow Sound agent returned no response");
  let specification = null;
  if (result.specification) {
    specification = validateSoundSvaraFlowSpecification(result.specification, {
      sourceScript: input.context?.sourceScript || null,
      sourceAssetId: input.context?.sourceAssetId || null
    });
  }
  if (["propose", "refine"].includes(result.action) && !specification) throw new Error("SvaraFlow Sound agent returned no Sound specification for this action");
  if (result.action === "approve" && !specification && input.currentSpecification) specification = validateSoundSvaraFlowSpecification(input.currentSpecification, { sourceScript: input.context?.sourceScript || null, sourceAssetId: input.context?.sourceAssetId || null });

  if (result.action === "approve" && !input.currentSpecification) {
    const fallbackAction = specification ? "propose" : "clarify";
    const fallbackResponse = fallbackAction === "propose"
      ? "Here is a Sound direction to explore for this Voice. Review it and tell me what you want to keep, change, or generate."
      : "I can explore Sound ideas for this Voice first. Tell me what direction you want to consider, or ask me for a few options.";
    return { action: fallbackAction, response: text(result.response) || fallbackResponse, specification };
  }

  const returnedDuration = Number(specification?.constraints?.duration_seconds);
  const returnedLimitResponse = durationLimitResponse(input.context || {}, input.capabilities, Number.isFinite(returnedDuration) && returnedDuration > 0 ? returnedDuration : null);
  if (returnedLimitResponse) {
    return { action: "clarify", response: returnedLimitResponse, specification: null };
  }

  return { action: result.action, response: text(result.response), specification };
}
