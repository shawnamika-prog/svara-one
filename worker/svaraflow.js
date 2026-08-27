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

Return valid JSON only. Use exactly this structure:
{
  "segments": [
    {
      "text": "exact existing words from the script",
      "intent": "ONE_ALLOWED_INTENT_OR_NULL",
      "delivery": "ONE_ALLOWED_DELIVERY_OR_NULL",
      "pause_after": "ONE_ALLOWED_PAUSE_OR_NULL"
    }
  ]
}

Cover the entire script exactly once.`;

const MAX_SCRIPT_LENGTH = 10000;
const SVARAFLOW_TIMEOUT_MS = 30000;
const ALLOWED_INTENTS = new Set([
  "ATMOSPHERE", "REFLECTIVE", "SUSPENSE", "ANTICIPATION", "CONTRAST",
  "EMPHASIS", "QUESTION", "EXCITEMENT", "SADNESS", "CALM", "URGENT", "RESOLUTION"
]);
const ALLOWED_DELIVERY = new Set(["PACE_SLOW", "PACE_NORMAL", "PACE_FAST"]);
const ALLOWED_PAUSES = new Set(["PAUSE_SHORT", "PAUSE_MEDIUM", "PAUSE_LONG"]);

function normalizeInput(script) {
  return String(script ?? "").replace(/\r\n/g, "\n").trim();
}

function normalizeForContentComparison(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

function validatePlan(original, plan) {
  if (!plan || !Array.isArray(plan.segments) || !plan.segments.length) {
    throw new Error("SvaraFlow returned an invalid delivery plan");
  }

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
  const originalCore = normalizeForContentComparison(original);
  const combinedCore = normalizeForContentComparison(combined);

  if (!originalCore || originalCore !== combinedCore) {
    throw new Error("SvaraFlow changed, omitted, duplicated, or reordered script content");
  }

  return { segments };
}

function svaraFlowDebugEnabled(env) {
  const value = String(env.SVARAFLOW_DEBUG ?? "").trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function logSvaraFlowAnalysis(original, plan, env) {
  if (!svaraFlowDebugEnabled(env)) return;
  console.log("svaraflow_analysis", {
    originalLength: original.length,
    segmentCount: plan.segments.length,
    plan
  });
}

function extractJson(text) {
  const value = String(text ?? "").trim();
  if (!value) throw new Error("SvaraFlow returned no usable analysis");
  try {
    return JSON.parse(value);
  } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("SvaraFlow returned invalid JSON");
    return JSON.parse(value.slice(start, end + 1));
  }
}

function clonePunctuation(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function countOccurrences(text, token) {
  return String(text).split(token).length - 1;
}

function applyShortPause(text) {
  const value = clonePunctuation(text);
  if (!value) return value;
  if (/[.!?…]$/.test(value)) return value;
  if (/[,;:]$/.test(value)) return value;
  return value + ",";
}

function applyMediumPause(text, intent) {
  const value = clonePunctuation(text);
  if (!value) return value;
  if (/[.!?…]$/.test(value)) return value;
  if (intent === "CONTRAST" && /\b(and|but|yet|however)\b/i.test(value)) {
    return value.replace(/\s+(and|but|yet|however)\b/i, " — $1");
  }
  return value + "...";
}

function applyLongPause(text) {
  const value = clonePunctuation(text);
  if (!value) return value;
  if (/[.!?…]$/.test(value)) return value;
  return value + "...";
}

function translateSegment(segment, index) {
  let text = clonePunctuation(segment.text);
  const intent = segment.intent;
  const delivery = segment.delivery;
  const pause = segment.pause_after;

  if (delivery === "PACE_FAST") {
    text = text.replace(/\.\.\./g, ".");
  }

  if (pause === "PAUSE_SHORT") {
    text = applyShortPause(text);
  } else if (pause === "PAUSE_MEDIUM") {
    text = applyMediumPause(text, intent);
  } else if (pause === "PAUSE_LONG") {
    text = applyLongPause(text);
  }

  return { text, index };
}

function validatePreparedScript(original, prepared) {
  const originalCore = normalizeForContentComparison(original);
  const preparedCore = normalizeForContentComparison(prepared);
  if (!originalCore || originalCore !== preparedCore) {
    throw new Error("SvaraFlow 3E changed, omitted, duplicated, or reordered script content");
  }
}

export function translateSvaraFlowPlan(originalScript, plan, env = {}) {
  const original = normalizeInput(originalScript);
  const validatedPlan = validatePlan(original, plan);

  const translatedSegments = validatedPlan.segments.map((segment, index) => translateSegment(segment, index));
  let preparedScript = translatedSegments.map(segment => segment.text).join(" ");

  // Keep the v1 translator conservative: avoid runaway ellipsis insertion.
  const ellipsisCount = countOccurrences(preparedScript, "...");
  if (ellipsisCount > Math.max(3, Math.ceil(validatedPlan.segments.length / 2))) {
    preparedScript = preparedScript.replace(/\.\.\./g, ".");
  }

  validatePreparedScript(original, preparedScript);

  const metadata = {
    originalLength: original.length,
    preparedLength: preparedScript.length,
    transformationCount: translatedSegments.reduce((count, segment, index) => {
      return count + (segment.text !== clonePunctuation(validatedPlan.segments[index].text) ? 1 : 0);
    }, 0),
    segmentCount: translatedSegments.length,
    svaraflowVersion: "3E-A-v1"
  };

  if (svaraFlowDebugEnabled(env)) {
    console.log("svaraflow_3e_debug", {
      originalScript: original,
      preparedScript,
      metadata,
      segments: translatedSegments.map((segment, index) => ({
        index: index + 1,
        source: validatedPlan.segments[index],
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

  if (svaraFlowDebugEnabled(env)) {
    console.log("svaraflow_openai_request_start", {
      model,
      scriptLength: script.length,
      timeoutMs: SVARAFLOW_TIMEOUT_MS
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        instructions: SVARAFLOW_SYSTEM_PROMPT,
        input: `Return the SvaraFlow delivery plan as JSON.\n\n${script}`,
        text: {
          format: {
            type: "json_object"
          }
        },
        max_output_tokens: Math.min(12000, Math.max(1024, script.length + 1024))
      })
    });

    if (svaraFlowDebugEnabled(env)) {
      console.log("svaraflow_openai_response", {
        status: response.status,
        elapsedMs: Date.now() - startedAt
      });
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`SvaraFlow provider error ${response.status}: ${detail.slice(0, 300)}`);
    }

    const data = await response.json();
    const text = typeof data.output_text === "string"
      ? data.output_text
      : (Array.isArray(data.output) ? data.output : [])
        .flatMap(item => Array.isArray(item.content) ? item.content : [])
        .map(item => typeof item.text === "string" ? item.text : "")
        .join("");

    const plan = validatePlan(script, extractJson(text));
    logSvaraFlowAnalysis(script, plan, env);
    return plan;
  } catch (error) {
    if (error?.name === "AbortError") {
      if (svaraFlowDebugEnabled(env)) {
        console.error("svaraflow_openai_timeout", {
          elapsedMs: Date.now() - startedAt,
          timeoutMs: SVARAFLOW_TIMEOUT_MS
        });
      }
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
  if (originalScript.length > MAX_SCRIPT_LENGTH) {
    throw new Error(`SvaraFlow maximum is ${MAX_SCRIPT_LENGTH} characters`);
  }

  if (svaraFlowDebugEnabled(env)) {
    console.log("svaraflow_debug_start", {
      scriptLength: originalScript.length,
      model: String(env.SVARAFLOW_MODEL || "gpt-5-mini")
    });
  }

  return callModel(originalScript, env);
}

export { SVARAFLOW_SYSTEM_PROMPT };
