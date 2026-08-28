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
          intent: {
            type: ["string", "null"],
            enum: ["ATMOSPHERE", "REFLECTIVE", "SUSPENSE", "ANTICIPATION", "CONTRAST", "EMPHASIS", "QUESTION", "EXCITEMENT", "SADNESS", "CALM", "URGENT", "RESOLUTION", null]
          },
          delivery: {
            type: ["string", "null"],
            enum: ["PACE_SLOW", "PACE_NORMAL", "PACE_FAST", null]
          },
          pause_after: {
            type: ["string", "null"],
            enum: ["PAUSE_SHORT", "PAUSE_MEDIUM", "PAUSE_LONG", null]
          }
        }
      }
    }
  }
};

const SVARAFLOW_STYLE_PROFILES = {
  Creative: {
    Storytelling: { objective: "narrative immersion", energy: ["LOW", "HIGH"], pace: ["SLOW", "NORMAL"], emotional_range: "context-dependent", pause_strategy: "emotional and selective", emphasis_strategy: "selective", suspense_strategy: "gradual", contrast_strategy: "natural", ending_strategy: "emotional landing", intent_priority: ["ATMOSPHERE", "SUSPENSE", "REFLECTIVE", "CONTRAST", "RESOLUTION"] },
    Character: { objective: "believable personality and reaction", energy: ["LOW", "HIGH"], pace: ["SLOW", "FAST"], emotional_range: "LOW to HIGH", pause_strategy: "reaction-based", emphasis_strategy: "strong when emotionally justified", suspense_strategy: "contextual", contrast_strategy: "strong", ending_strategy: "character-driven", intent_priority: ["EMPHASIS", "CONTRAST", "EXCITEMENT", "SADNESS", "SUSPENSE", "RESOLUTION"] },
    Audiobook: { objective: "sustained immersive narration", energy: ["LOW", "MEDIUM"], pace: ["SLOW", "NORMAL"], emotional_range: "LOW to HIGH", pause_strategy: "natural and sustainable", emphasis_strategy: "restrained", suspense_strategy: "gradual", contrast_strategy: "subtle", ending_strategy: "natural", intent_priority: ["ATMOSPHERE", "REFLECTIVE", "SUSPENSE", "CONTRAST", "RESOLUTION"] },
    Animation: { objective: "expressive personality and heightened emotion", energy: ["MEDIUM", "HIGH"], pace: ["NORMAL", "FAST"], emotional_range: "HIGH", pause_strategy: "dramatic and reaction-based", emphasis_strategy: "strong", suspense_strategy: "exaggerated", contrast_strategy: "strong", ending_strategy: "expressive", intent_priority: ["EXCITEMENT", "EMPHASIS", "CONTRAST", "SUSPENSE", "RESOLUTION"] }
  },
  Business: {
    Commercial: { objective: "capture attention and persuade", energy: ["MEDIUM", "HIGH"], pace: ["NORMAL", "FAST"], emotional_range: "MEDIUM to HIGH", pause_strategy: "strategic", emphasis_strategy: "strong", suspense_strategy: "short anticipation before key messaging", contrast_strategy: "strong", ending_strategy: "memorable and confident", intent_priority: ["EXCITEMENT", "EMPHASIS", "ANTICIPATION", "URGENT", "RESOLUTION"] },
    Corporate: { objective: "authority and credibility", energy: ["LOW", "MEDIUM"], pace: ["SLOW", "NORMAL"], emotional_range: "LOW to MEDIUM", pause_strategy: "controlled", emphasis_strategy: "deliberate", suspense_strategy: "minimal", contrast_strategy: "controlled", ending_strategy: "confident", intent_priority: ["EMPHASIS", "CALM", "CONTRAST", "RESOLUTION"] },
    Presentation: { objective: "communicate clearly while maintaining attention", energy: ["MEDIUM", "MEDIUM"], pace: ["NORMAL", "NORMAL"], emotional_range: "LOW to MEDIUM", pause_strategy: "point-based", emphasis_strategy: "key concepts", suspense_strategy: "selective", contrast_strategy: "clear", ending_strategy: "confident", intent_priority: ["EMPHASIS", "CONTRAST", "REFLECTIVE", "RESOLUTION"] },
    "Product Demo": { objective: "highlight features and benefits", energy: ["MEDIUM", "HIGH"], pace: ["NORMAL", "NORMAL"], emotional_range: "MEDIUM", pause_strategy: "strategic before features", emphasis_strategy: "strong on product benefits", suspense_strategy: "anticipation before reveal", contrast_strategy: "benefit-oriented", ending_strategy: "confident", intent_priority: ["EMPHASIS", "ANTICIPATION", "EXCITEMENT", "RESOLUTION"] },
    Sales: { objective: "build desire, trust and momentum", energy: ["MEDIUM", "HIGH"], pace: ["NORMAL", "FAST"], emotional_range: "MEDIUM to HIGH", pause_strategy: "strategic", emphasis_strategy: "benefits and outcomes", suspense_strategy: "anticipation", contrast_strategy: "persuasive", ending_strategy: "confident and motivating", intent_priority: ["EMPHASIS", "EXCITEMENT", "ANTICIPATION", "URGENT", "RESOLUTION"] }
  },
  Education: {
    "E-learning": { objective: "comprehension and retention", energy: ["LOW", "MEDIUM"], pace: ["SLOW", "NORMAL"], emotional_range: "LOW to MEDIUM", pause_strategy: "comprehension-based", emphasis_strategy: "key concepts", suspense_strategy: "minimal", contrast_strategy: "instructional", ending_strategy: "clear", intent_priority: ["EMPHASIS", "CONTRAST", "REFLECTIVE"] },
    Tutorial: { objective: "guide actions sequentially", energy: ["LOW", "MEDIUM"], pace: ["NORMAL", "NORMAL"], emotional_range: "LOW", pause_strategy: "step-based", emphasis_strategy: "actions", suspense_strategy: "minimal", contrast_strategy: "procedural", ending_strategy: "clear", intent_priority: ["EMPHASIS", "CONTRAST"] },
    Lesson: { objective: "explain concepts naturally", energy: ["LOW", "MEDIUM"], pace: ["SLOW", "NORMAL"], emotional_range: "LOW to MEDIUM", pause_strategy: "conceptual", emphasis_strategy: "important ideas", suspense_strategy: "selective", contrast_strategy: "explanatory", ending_strategy: "clear", intent_priority: ["EMPHASIS", "REFLECTIVE", "CONTRAST"] },
    "Language Learning": { objective: "clarity and processing", energy: ["LOW", "MEDIUM"], pace: ["SLOW", "SLOW"], emotional_range: "LOW", pause_strategy: "deliberate", emphasis_strategy: "pronunciation and target phrases", suspense_strategy: "none", contrast_strategy: "clear", ending_strategy: "neutral", intent_priority: ["EMPHASIS"] }
  },
  Media: {
    Narration: { objective: "natural descriptive guidance", energy: ["LOW", "MEDIUM"], pace: ["SLOW", "NORMAL"], emotional_range: "LOW to MEDIUM", pause_strategy: "contextual", emphasis_strategy: "selective", suspense_strategy: "contextual", contrast_strategy: "natural", ending_strategy: "natural", intent_priority: ["ATMOSPHERE", "REFLECTIVE", "RESOLUTION"] },
    Documentary: { objective: "inform while maintaining engagement", energy: ["LOW", "MEDIUM"], pace: ["SLOW", "NORMAL"], emotional_range: "LOW to MEDIUM", pause_strategy: "deliberate", emphasis_strategy: "facts and discoveries", suspense_strategy: "controlled", contrast_strategy: "informative", ending_strategy: "authoritative", intent_priority: ["ATMOSPHERE", "EMPHASIS", "REFLECTIVE", "SUSPENSE"] },
    Podcast: { objective: "conversational connection", energy: ["LOW", "MEDIUM_HIGH"], pace: ["SLOW", "NORMAL_FAST"], emotional_range: "LOW to HIGH", pause_strategy: "natural conversational", emphasis_strategy: "conversational", suspense_strategy: "contextual", contrast_strategy: "natural", ending_strategy: "conversational", intent_priority: ["REFLECTIVE", "CONTRAST", "EMPHASIS"] },
    News: { objective: "clarity, authority and information", energy: ["LOW", "MEDIUM_HIGH"], pace: ["NORMAL", "NORMAL"], emotional_range: "LOW", pause_strategy: "concise", emphasis_strategy: "facts and key developments", suspense_strategy: "controlled", contrast_strategy: "strong factual distinction", ending_strategy: "authoritative", intent_priority: ["EMPHASIS", "CONTRAST", "URGENT"] },
    Trailer: { objective: "tension, anticipation and dramatic impact", energy: ["LOW", "HIGH"], pace: ["SLOW", "FAST"], emotional_range: "HIGH", pause_strategy: "dramatic", emphasis_strategy: "strong", suspense_strategy: "maximum", contrast_strategy: "strong", ending_strategy: "dramatic", intent_priority: ["SUSPENSE", "ANTICIPATION", "EMPHASIS", "EXCITEMENT", "RESOLUTION"] }
  },
  Performance: {
    Dramatic: { objective: "maximize dramatic impact", energy: ["LOW", "HIGH"], pace: ["SLOW", "FAST"], emotional_range: "HIGH", pause_strategy: "dramatic", emphasis_strategy: "strong", suspense_strategy: "strong", contrast_strategy: "strong", ending_strategy: "dramatic", intent_priority: ["SUSPENSE", "CONTRAST", "EMPHASIS", "RESOLUTION"] },
    Inspirational: { objective: "optimism and conviction", energy: ["MEDIUM", "HIGH"], pace: ["NORMAL", "NORMAL"], emotional_range: "MEDIUM to HIGH", pause_strategy: "purposeful", emphasis_strategy: "strong", suspense_strategy: "low", contrast_strategy: "motivational", ending_strategy: "uplifting", intent_priority: ["EMPHASIS", "EXCITEMENT", "RESOLUTION"] },
    Calm: { objective: "relaxation and stability", energy: ["LOW", "LOW"], pace: ["SLOW", "SLOW"], emotional_range: "LOW to MEDIUM", pause_strategy: "generous", emphasis_strategy: "restrained", suspense_strategy: "minimal", contrast_strategy: "subtle", ending_strategy: "gentle", intent_priority: ["CALM", "REFLECTIVE", "ATMOSPHERE"] },
    Energetic: { objective: "momentum and excitement", energy: ["HIGH", "HIGH"], pace: ["NORMAL", "FAST"], emotional_range: "MEDIUM to HIGH", pause_strategy: "tight and strategic", emphasis_strategy: "strong", suspense_strategy: "short", contrast_strategy: "strong", ending_strategy: "energetic", intent_priority: ["EXCITEMENT", "URGENT", "EMPHASIS"] },
    Mystery: { objective: "uncertainty and anticipation", energy: ["LOW", "MEDIUM"], pace: ["SLOW", "SLOW"], emotional_range: "MEDIUM to HIGH", pause_strategy: "strategic hesitation", emphasis_strategy: "selective", suspense_strategy: "maximum", contrast_strategy: "subtle", ending_strategy: "unresolved or suspenseful", intent_priority: ["SUSPENSE", "ANTICIPATION", "ATMOSPHERE", "REFLECTIVE"] }
  }
};

const SVARAFLOW_DEFAULT_CATEGORY = "Creative";
const SVARAFLOW_DEFAULT_STYLE = "Storytelling";

export function getSvaraFlowStyleProfile(category = SVARAFLOW_DEFAULT_CATEGORY, style = SVARAFLOW_DEFAULT_STYLE) {
  const categoryProfiles = SVARAFLOW_STYLE_PROFILES[category];
  if (!categoryProfiles) throw new Error(`Unknown SvaraFlow category: ${category}`);
  const profile = categoryProfiles[style];
  if (!profile) throw new Error(`Unknown SvaraFlow style: ${category}/${style}`);
  return {
    category,
    style,
    ...profile
  };
}

export function listSvaraFlowStyles() {
  return Object.entries(SVARAFLOW_STYLE_PROFILES).map(([category, styles]) => ({
    category,
    styles: Object.keys(styles)
  }));
}

const MAX_SCRIPT_LENGTH = 10000;
const SVARAFLOW_TIMEOUT_MS = 30000;
const ALLOWED_INTENTS = new Set(["ATMOSPHERE", "REFLECTIVE", "SUSPENSE", "ANTICIPATION", "CONTRAST", "EMPHASIS", "QUESTION", "EXCITEMENT", "SADNESS", "CALM", "URGENT", "RESOLUTION"]);
const ALLOWED_DELIVERY = new Set(["PACE_SLOW", "PACE_NORMAL", "PACE_FAST"]);
const ALLOWED_PAUSES = new Set(["PAUSE_SHORT", "PAUSE_MEDIUM", "PAUSE_LONG"]);

function normalizeInput(script) { return String(script ?? "").replace(/\r\n/g, "\n").trim(); }
function normalizeForContentComparison(text) { return String(text ?? "").normalize("NFKC").toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, ""); }

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

function svaraFlowDebugEnabled(env) { const value = String(env.SVARAFLOW_DEBUG ?? "").trim().toLowerCase(); return value === "true" || value === "1" || value === "yes"; }
function logSvaraFlowAnalysis(original, plan, env) { if (svaraFlowDebugEnabled(env)) console.log("svaraflow_analysis", { originalLength: original.length, segmentCount: plan.segments.length, plan }); }
function extractJson(text) {
  const value = String(text ?? "").trim();
  if (!value) throw new Error("SvaraFlow returned no usable analysis");
  try { return JSON.parse(value); } catch { const start = value.indexOf("{"); const end = value.lastIndexOf("}"); if (start === -1 || end <= start) throw new Error("SvaraFlow returned invalid JSON"); return JSON.parse(value.slice(start, end + 1)); }
}
function clonePunctuation(text) { return String(text ?? "").replace(/\s+/g, " ").trim(); }
function countOccurrences(text, token) { return String(text).split(token).length - 1; }
function sentenceEndsWithTerminal(text) { return /[.!?…]$/.test(text); }
function addEllipsisBeforeFinalClause(text) {
  const value = clonePunctuation(text);
  if (!value || value.includes("...")) return value;
  const commaIndex = value.indexOf(",");
  if (commaIndex > 8 && commaIndex < value.length - 12) return `${value.slice(0, commaIndex)}...${value.slice(commaIndex + 1)}`.replace(/\.\.\.\s+/g, "... ");
  return value.replace(/[.!?]$/, "...");
}
function applyShortPause(text, intent) {
  const value = clonePunctuation(text); if (!value) return value;
  if (intent === "SUSPENSE" || intent === "ANTICIPATION" || intent === "REFLECTIVE") { if (value.includes("...")) return value; if (/,/.test(value)) return addEllipsisBeforeFinalClause(value); if (sentenceEndsWithTerminal(value)) return value.replace(/[.!?]$/, "..."); }
  if (sentenceEndsWithTerminal(value) || /[,;:]$/.test(value)) return value; return value + ",";
}
function applyMediumPause(text, intent) {
  const value = clonePunctuation(text); if (!value) return value;
  if (intent === "CONTRAST") { const contrastMatch = value.match(/\s+(and|but|yet|however)\b/i); if (contrastMatch && !value.includes(" — ")) return value.replace(contrastMatch[0], ` — ${contrastMatch[1]}`); }
  if (intent === "ATMOSPHERE" || intent === "REFLECTIVE" || intent === "ANTICIPATION") { if (/,/.test(value) && !value.includes("...")) return addEllipsisBeforeFinalClause(value); }
  if (sentenceEndsWithTerminal(value)) return value.replace(/[.!?]$/, "..."); return value + "...";
}
function applyLongPause(text, intent) { const value = clonePunctuation(text); if (!value) return value; if (value.includes("...")) return value; return value.replace(/[.!?]$/, "..."); }
function translateSegment(segment, index) {
  let text = clonePunctuation(segment.text);
  if (segment.delivery === "PACE_FAST") text = text.replace(/\.\.\./g, ".");
  if (segment.pause_after === "PAUSE_SHORT") text = applyShortPause(text, segment.intent);
  else if (segment.pause_after === "PAUSE_MEDIUM") text = applyMediumPause(text, segment.intent);
  else if (segment.pause_after === "PAUSE_LONG") text = applyLongPause(text, segment.intent);
  return { text, index };
}
function validatePreparedScript(original, prepared) {
  if (!normalizeForContentComparison(original) || normalizeForContentComparison(original) !== normalizeForContentComparison(prepared)) throw new Error("SvaraFlow 3E changed, omitted, duplicated, or reordered script content");
}
export function translateSvaraFlowPlan(originalScript, plan, env = {}) {
  const original = normalizeInput(originalScript); const validatedPlan = validatePlan(original, plan);
  const translatedSegments = validatedPlan.segments.map((segment, index) => translateSegment(segment, index));
  let preparedScript = translatedSegments.map(segment => segment.text).join(" ");
  const ellipsisCount = countOccurrences(preparedScript, "..."); const maxEllipses = Math.max(2, Math.ceil(validatedPlan.segments.length / 2));
  if (ellipsisCount > maxEllipses) { let seen = 0; preparedScript = preparedScript.replace(/\.\.\./g, () => { seen += 1; return seen <= maxEllipses ? "..." : "."; }); }
  validatePreparedScript(original, preparedScript);
  const metadata = { originalLength: original.length, preparedLength: preparedScript.length, transformationCount: translatedSegments.reduce((count, segment, index) => count + (segment.text !== clonePunctuation(validatedPlan.segments[index].text) ? 1 : 0), 0), segmentCount: translatedSegments.length, svaraflowVersion: "3E-B-v1" };
  if (svaraFlowDebugEnabled(env)) console.log("svaraflow_3e_debug", { originalScript: original, preparedScript, metadata, segments: translatedSegments.map((segment, index) => ({ index: index + 1, source: validatedPlan.segments[index], output: segment.text })) });
  return { preparedScript, metadata };
}

async function callModel(script, env) {
  const apiKey = String(env.OPENAI_API_KEY || "").trim(); if (!apiKey) throw new Error("SvaraFlow provider is not configured");
  const model = String(env.SVARAFLOW_MODEL || "gpt-5-mini").trim(); if (!model) throw new Error("SvaraFlow model is not configured");
  const startedAt = Date.now(); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), SVARAFLOW_TIMEOUT_MS);
  if (svaraFlowDebugEnabled(env)) console.log("svaraflow_openai_request_start", { model, scriptLength: script.length, timeoutMs: SVARAFLOW_TIMEOUT_MS });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, signal: controller.signal, body: JSON.stringify({ model, instructions: SVARAFLOW_SYSTEM_PROMPT, input: `Return the SvaraFlow delivery plan as JSON.\n\n${script}`, text: { format: { type: "json_schema", name: "svaraflow_delivery_plan", strict: true, schema: SVARAFLOW_RESPONSE_SCHEMA } }, max_output_tokens: Math.min(12000, Math.max(2048, script.length + 1024)) }) });
    if (svaraFlowDebugEnabled(env)) console.log("svaraflow_openai_response", { status: response.status, elapsedMs: Date.now() - startedAt });
    if (!response.ok) { const detail = await response.text().catch(() => ""); throw new Error(`SvaraFlow provider error ${response.status}: ${detail.slice(0, 300)}`); }
    const data = await response.json();
    const text = typeof data.output_text === "string" ? data.output_text : (Array.isArray(data.output) ? data.output : []).flatMap(item => Array.isArray(item.content) ? item.content : []).map(item => typeof item.text === "string" ? item.text : "").join("");
    const plan = validatePlan(script, extractJson(text)); logSvaraFlowAnalysis(script, plan, env); return plan;
  } catch (error) {
    if (error?.name === "AbortError") { if (svaraFlowDebugEnabled(env)) console.error("svaraflow_openai_timeout", { elapsedMs: Date.now() - startedAt, timeoutMs: SVARAFLOW_TIMEOUT_MS }); throw new Error(`SvaraFlow timed out after ${SVARAFLOW_TIMEOUT_MS}ms`); }
    throw error;
  } finally { clearTimeout(timeout); }
}
export async function processSvaraFlow(script, env) {
  const originalScript = normalizeInput(script); if (!originalScript) throw new Error("SvaraFlow requires script text"); if (originalScript.length > MAX_SCRIPT_LENGTH) throw new Error(`SvaraFlow maximum is ${MAX_SCRIPT_LENGTH} characters`);
  if (svaraFlowDebugEnabled(env)) console.log("svaraflow_debug_start", { scriptLength: originalScript.length, model: String(env.SVARAFLOW_MODEL || "gpt-5-mini") });
  return callModel(originalScript, env);
}

export { SVARAFLOW_SYSTEM_PROMPT, SVARAFLOW_STYLE_PROFILES };
