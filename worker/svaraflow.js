const SVARAFLOW_SYSTEM_PROMPT = `You are SvaraFlow™, SvaraONE's internal speech-performance analysis layer.

Analyze the user's script and create a private delivery plan for expressive spoken performance.

The user's words are immutable. Do not rewrite, paraphrase, summarize, add, remove, reorder, translate, or substitute any words. Segment text must reproduce the user's words exactly.

Analyze meaningful delivery moments and assign concise internal cues that describe how the existing words should be performed. Use cues selectively and only when supported by the script. Neutral delivery is valid.

Allowed intent cues:
ATMOSPHERE, REFLECTIVE, SUSPENSE, ANTICIPATION, CONTRAST, EMPHASIS, QUESTION, EXCITEMENT, SADNESS, CALM, URGENT, RESOLUTION

Allowed delivery cues:
PACE_SLOW, PACE_NORMAL, PACE_FAST

Allowed pause cues:
PAUSE_SHORT, PAUSE_MEDIUM, PAUSE_LONG

Return the delivery plan as JSON matching the required response schema.

Cover the entire script exactly once.`;

const SVARAFLOW_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["segments"],
  properties: {
    segments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "intent", "delivery", "pause_after"],
        properties: {
          text: { type: "string" },
          intent: { type: ["string", "null"], enum: ["ATMOSPHERE", "REFLECTIVE", "SUSPENSE", "ANTICIPATION", "CONTRAST", "EMPHASIS", "QUESTION", "EXCITEMENT", "SADNESS", "CALM", "URGENT", "RESOLUTION", null] },
          delivery: { type: ["string", "null"], enum: ["PACE_SLOW", "PACE_NORMAL", "PACE_FAST", null] },
          pause_after: { type: ["string", "null"], enum: ["PAUSE_SHORT", "PAUSE_MEDIUM", "PAUSE_LONG", null] }
        }
      }
    }
  }
};

const MAX_SCRIPT_LENGTH = 10000;
const SVARAFLOW_TIMEOUT_MS = 30000;
const ALLOWED_INTENTS = new Set(["ATMOSPHERE", "REFLECTIVE", "SUSPENSE", "ANTICIPATION", "CONTRAST", "EMPHASIS", "QUESTION", "EXCITEMENT", "SADNESS", "CALM", "URGENT", "RESOLUTION"]);
const ALLOWED_DELIVERY = new Set(["PACE_SLOW", "PACE_NORMAL", "PACE_FAST"]);
const ALLOWED_PAUSES = new Set(["PAUSE_SHORT", "PAUSE_MEDIUM", "PAUSE_LONG"]);

function normalizeInput(script) {
  return String(script ?? "").replace(/\r\n/g, "\n").trim();
}

function normalizeForContentComparison(text) {
  return String(text ?? "").normalize("NFKC").toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, "");
}

function validatePlan(original, plan) {
  if (!plan || !Array.isArray(plan.segments) || !plan.segments.length) throw new Error("SvaraFlow returned an invalid delivery plan");
  const segments = plan.segments.map((segment, index) => {
    if (!segment || typeof segment !== "object") throw new Error(`SvaraFlow segment ${index + 1} is invalid`);
    const text = String(segment.text ?? "");
    if (!text.trim()) throw new Error(`SvaraFlow segment ${index + 1} is empty`);
    const intent = segment.intent == null ? null : String(segment.intent);
    const delivery = segment.delivery == null ? null : String(segment.delivery);
    const pauseAfter = segment.pause_after == null ? null : String(segment.pause_after);
    if (intent !== null && !ALLOWED_INTENTS.has(intent)) throw new Error(`SvaraFlow segment ${index + 1} has an invalid intent`);
    if (delivery !== null && !ALLOWED_DELIVERY.has(delivery)) throw new Error(`SvaraFlow segment ${index + 1} has an invalid delivery cue`);
    if (pauseAfter !== null && !ALLOWED_PAUSES.has(pauseAfter)) throw new Error(`SvaraFlow segment ${index + 1} has an invalid pause cue`);
    return { text, intent, delivery, pause_after: pauseAfter };
  });
  const combined = segments.map(segment => segment.text).join(" ");
  if (!normalizeForContentComparison(original) || normalizeForContentComparison(original) !== normalizeForContentComparison(combined)) throw new Error("SvaraFlow changed, omitted, duplicated, or reordered script content");
  return { segments };
}

function svaraFlowDebugEnabled(env) {
  const value = String(env.SVARAFLOW_DEBUG ?? "").trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function logSvaraFlowAnalysis(original, plan, env) {
  if (!svaraFlowDebugEnabled(env)) return;
  console.log("svaraflow_analysis", { originalLength: original.length, segmentCount: plan.segments.length, plan });
}

function extractJson(text) {
  const value = String(text ?? "").trim();
  if (!value) throw new Error("SvaraFlow returned no usable analysis");
  try { return JSON.parse(value); } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("SvaraFlow returned invalid JSON");
    return JSON.parse(value.slice(start, end + 1));
  }
}

function clonePunctuation(text) { return String(text ?? "").replace(/\s+/g, " ").trim(); }
function countOccurrences(text, token) { return String(text).split(token).length - 1; }
function sentenceEndsWithTerminal(text) { return /[.!?…]$/.test(text); }
function deepgramMaxInputChars(env) {
  const value = Number(env?.DEEPGRAM_MAX_INPUT_CHARS);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 2000;
}

function buildSegmentedScript(segments, separatorMode = "mixed") {
  return segments.map((segment, index) => {
    if (index === 0) return segment.text;
    const previous = segments[index - 1];
    let separator = "\n";
    if (separatorMode === "blank") separator = "\n\n";
    if (separatorMode === "mixed" && previous.pause_after === "PAUSE_LONG") separator = "\n\n";
    return `${separator}${segment.text}`;
  }).join("");
}

/*
 * Minimum-intervention gate.
 * SvaraFlow still decides intent, pace and pause strength. This gate only
 * decides whether punctuation needs to be changed to express that cue.
 * Existing user punctuation always wins when it already provides a strong
 * enough performance boundary. This prevents SvaraFlow from piling pauses
 * onto otherwise well-punctuated human scripts.
 */
function punctuationProfile(text) {
  const value = clonePunctuation(text);
  return {
    hasEllipsis: /(?:\.\.\.|…)/.test(value),
    hasEmDash: /—/.test(value),
    hasStrongInternalPause: /[;:]/.test(value) || /—/.test(value),
    hasComma: /,/.test(value),
    terminal: /[.!?…]$/.test(value),
    endsWithComma: /,$/.test(value)
  };
}

function punctuationStrength(text) {
  const p = punctuationProfile(text);
  if (p.hasEllipsis) return 3;
  if (p.terminal && p.hasEmDash) return 3;
  if (p.terminal) return 1;
  if (p.endsWithComma || p.hasStrongInternalPause) return 1;
  if (p.hasComma) return 1;
  return 0;
}

function pauseStrength(pause) {
  if (pause === "PAUSE_LONG") return 3;
  if (pause === "PAUSE_MEDIUM") return 2;
  if (pause === "PAUSE_SHORT") return 1;
  return 0;
}

function shouldIntervene(text, intent, pause) {
  const p = punctuationProfile(text);
  const requested = pauseStrength(pause);
  if (!requested) return { intervene: false, reason: "No pause cue" };
  if (p.hasEllipsis) return { intervene: false, reason: "Existing ellipsis is already a strong pause cue" };
  if (p.hasEmDash && (requested <= 2 || intent === "EMPHASIS" || intent === "CONTRAST")) return { intervene: false, reason: "Existing em dash already provides an expressive pause cue" };
  const existing = punctuationStrength(text);
  if (existing >= requested) return { intervene: false, reason: "Existing punctuation is sufficient" };
  if (requested === 1 && p.terminal) return { intervene: false, reason: "Existing sentence boundary is sufficient for a short pause" };
  if (requested === 2 && p.terminal) return { intervene: false, reason: "Existing sentence boundary is sufficient for a medium pause" };
  if (requested === 3 && p.terminal && (intent === "SUSPENSE" || intent === "REFLECTIVE" || intent === "ANTICIPATION")) return { intervene: true, reason: "Long pause requested and existing boundary is only a normal sentence stop" };
  return { intervene: requested >= 3 && !p.hasStrongInternalPause, reason: requested >= 3 ? "Long pause requested without a strong existing cue" : "Minimum intervention: existing punctuation retained" };
}

function addEllipsisBeforeFinalClause(text) {
  const value = clonePunctuation(text);
  if (!value || value.includes("...")) return value;
  const commaIndex = value.indexOf(",");
  if (commaIndex > 8 && commaIndex < value.length - 12) return `${value.slice(0, commaIndex)}...${value.slice(commaIndex + 1)}`.replace(/\.\.\.\s+/g, "... ");
  return value.replace(/[.!?]$/, "...");
}

function applyShortPause(text, intent) {
  const value = clonePunctuation(text);
  if (!value) return value;
  if (intent === "SUSPENSE" || intent === "ANTICIPATION" || intent === "REFLECTIVE") {
    if (value.includes("...")) return value;
    if (/,/.test(value)) return addEllipsisBeforeFinalClause(value);
    if (sentenceEndsWithTerminal(value)) return value.replace(/[.!?]$/, "...");
  }
  if (sentenceEndsWithTerminal(value) || /[,;:]$/.test(value)) return value;
  return value + ",";
}

function applyMediumPause(text, intent) {
  const value = clonePunctuation(text);
  if (!value) return value;
  if (intent === "CONTRAST") {
    const contrastMatch = value.match(/\s+(and|but|yet|however)\b/i);
    if (contrastMatch && !value.includes(" — ")) return value.replace(contrastMatch[0], ` — ${contrastMatch[1]}`);
  }
  if (intent === "ATMOSPHERE" || intent === "REFLECTIVE" || intent === "ANTICIPATION") {
    if (/,/.test(value) && !value.includes("...")) return addEllipsisBeforeFinalClause(value);
  }
  if (sentenceEndsWithTerminal(value)) return value.replace(/[.!?]$/, "...");
  return value + "...";
}

function applyLongPause(text) {
  const value = clonePunctuation(text);
  if (!value || value.includes("...")) return value;
  return value.replace(/[.!?]$/, "...");
}

function translateSegment(segment, index) {
  const source = clonePunctuation(segment.text);
  let text = source;
  let intervention = shouldIntervene(source, segment.intent, segment.pause_after);
  if (segment.delivery === "PACE_FAST" && !source.includes("...")) text = text.replace(/\.\.\./g, ".");
  if (intervention.intervene) {
    if (segment.pause_after === "PAUSE_SHORT") text = applyShortPause(text, segment.intent);
    else if (segment.pause_after === "PAUSE_MEDIUM") text = applyMediumPause(text, segment.intent);
    else if (segment.pause_after === "PAUSE_LONG") text = applyLongPause(text, segment.intent);
  }
  return { text, index, intervention };
}

function validatePreparedScript(original, prepared) {
  if (!normalizeForContentComparison(original) || normalizeForContentComparison(original) !== normalizeForContentComparison(prepared)) throw new Error("SvaraFlow 3E changed, omitted, duplicated, or reordered script content");
}

function fitPreparedScript(original, validatedPlan, translatedSegments, env) {
  const maxChars = deepgramMaxInputChars(env);
  if (original.length > maxChars) throw new Error(`SvaraFlow cannot fit this script in the configured Deepgram limit of ${maxChars} characters. The original script is already ${original.length} characters.`);
  const sourceSegments = validatedPlan.segments;
  const working = translatedSegments.map((segment, index) => ({ ...segment, sourceText: clonePunctuation(sourceSegments[index].text), pauseAfter: sourceSegments[index].pause_after }));
  let preparedScript = buildSegmentedScript(working, "mixed");
  if (preparedScript.length <= maxChars) return preparedScript;
  for (const priority of ["PAUSE_SHORT", "PAUSE_MEDIUM", "PAUSE_LONG"]) {
    for (const segment of working) {
      if (preparedScript.length <= maxChars) break;
      if (segment.pauseAfter !== priority || segment.text === segment.sourceText) continue;
      segment.text = segment.sourceText;
      preparedScript = buildSegmentedScript(working, "mixed");
    }
    if (preparedScript.length <= maxChars) return preparedScript;
  }
  preparedScript = buildSegmentedScript(working, "single");
  if (preparedScript.length <= maxChars) return preparedScript;
  preparedScript = working.map((segment, index) => index === 0 ? segment.text : `${working[index - 1].pauseAfter === "PAUSE_LONG" || working[index - 1].pauseAfter === "PAUSE_MEDIUM" ? "\n" : " "}${segment.text}`).join("");
  if (preparedScript.length > maxChars) throw new Error(`SvaraFlow could not fit the prepared script within the configured Deepgram limit of ${maxChars} characters without changing user content.`);
  return preparedScript;
}

export function translateSvaraFlowPlan(originalScript, plan, env = {}) {
  const original = normalizeInput(originalScript);
  const validatedPlan = validatePlan(original, plan);
  const translatedSegments = validatedPlan.segments.map((segment, index) => ({ ...translateSegment(segment, index), pause_after: segment.pause_after }));
  let preparedScript = fitPreparedScript(original, validatedPlan, translatedSegments, env);
  validatePreparedScript(original, preparedScript);
  const metadata = {
    originalLength: original.length,
    preparedLength: preparedScript.length,
    maxInputChars: deepgramMaxInputChars(env),
    transformationCount: translatedSegments.reduce((count, segment, index) => count + (segment.text !== clonePunctuation(validatedPlan.segments[index].text) ? 1 : 0), 0),
    interventionCount: translatedSegments.reduce((count, segment) => count + (segment.intervention?.intervene ? 1 : 0), 0),
    segmentCount: translatedSegments.length,
    svaraflowVersion: "3E-C-v2"
  };
  if (svaraFlowDebugEnabled(env)) {
    console.log("svaraflow_3e_debug", {
      originalScript: original,
      preparedScript,
      metadata,
      segments: translatedSegments.map((segment, index) => ({
        index: index + 1,
        source: validatedPlan.segments[index],
        gate: segment.intervention,
        output: segment.text
      }))
    });
  }
  return { preparedScript, metadata };
}

async function callModel(script, env) {
  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("SvaraFlow provider is not configured");
  const model = String(env.SVARAFLOW_MODEL || "gpt-5-mini").trim();
  if (!model) throw new Error("SvaraFlow model is not configured");
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SVARAFLOW_TIMEOUT_MS);
  if (svaraFlowDebugEnabled(env)) console.log("svaraflow_openai_request_start", { model, scriptLength: script.length, timeoutMs: SVARAFLOW_TIMEOUT_MS });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        instructions: SVARAFLOW_SYSTEM_PROMPT,
        input: `Return the SvaraFlow delivery plan as JSON.\n\n${script}`,
        text: { format: { type: "json_schema", name: "svaraflow_delivery_plan", strict: true, schema: SVARAFLOW_RESPONSE_SCHEMA } },
        max_output_tokens: Math.min(12000, Math.max(2048, script.length + 1024))
      })
    });
    if (svaraFlowDebugEnabled(env)) console.log("svaraflow_openai_response", { status: response.status, elapsedMs: Date.now() - startedAt });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`SvaraFlow provider error ${response.status}: ${detail.slice(0, 300)}`);
    }
    const data = await response.json();
    const text = typeof data.output_text === "string" ? data.output_text : (Array.isArray(data.output) ? data.output : []).flatMap(item => Array.isArray(item.content) ? item.content : []).map(item => typeof item.text === "string" ? item.text : "").join("");
    const plan = validatePlan(script, extractJson(text));
    logSvaraFlowAnalysis(script, plan, env);
    return plan;
  } catch (error) {
    if (error?.name === "AbortError") {
      if (svaraFlowDebugEnabled(env)) console.error("svaraflow_openai_timeout", { elapsedMs: Date.now() - startedAt, timeoutMs: SVARAFLOW_TIMEOUT_MS });
      throw new Error(`SvaraFlow timed out after ${SVARAFLOW_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function processSvaraFlow(script, env) {
  const originalScript = normalizeInput(script);
  if (!originalScript) throw new Error("SvaraFlow requires script text");
  if (originalScript.length > MAX_SCRIPT_LENGTH) throw new Error(`SvaraFlow maximum is ${MAX_SCRIPT_LENGTH} characters`);
  if (svaraFlowDebugEnabled(env)) console.log("svaraflow_debug_start", { scriptLength: originalScript.length, model: String(env.SVARAFLOW_MODEL || "gpt-5-mini") });
  return callModel(originalScript, env);
}

export { SVARAFLOW_SYSTEM_PROMPT };
