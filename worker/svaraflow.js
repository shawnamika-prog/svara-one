const SVARAFLOW_SYSTEM_PROMPT = `You are SvaraFlow™, SvaraONE's internal speech-delivery preparation layer.

Your only job is to prepare a user's script for expressive spoken delivery before it is sent to a text-to-speech engine.

Rules:
- Preserve the user's words, meaning, names, facts, and intended language.
- Do not add new information.
- Do not remove meaningful content.
- Do not rewrite the script into a different message.
- Improve spoken flow primarily through punctuation and sentence structure.
- Add or adjust periods, commas, question marks, exclamation marks, dashes, and paragraph breaks only when they improve natural delivery.
- Break up excessively long sentences when the existing words support a natural spoken boundary.
- Use punctuation deliberately to create natural pauses, rhythm, emphasis, and conversational delivery.
- Preserve intentional wording, capitalization where meaningful, numbers, URLs, and special terms.
- Do not explain your changes.
- Return only the speech-ready script as plain text.`;

const MAX_SCRIPT_LENGTH = 10000;
const SVARAFLOW_TIMEOUT_MS = 15000;

function normalizeInput(script) {
  return String(script ?? "").replace(/\r\n/g, "\n").trim();
}

function normalizeForContentComparison(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

function validateOutput(original, processed) {
  const value = String(processed ?? "").trim();
  if (!value) throw new Error("SvaraFlow returned an empty script");
  if (value.length > MAX_SCRIPT_LENGTH) throw new Error("SvaraFlow returned an oversized script");

  const originalCore = normalizeForContentComparison(original);
  const processedCore = normalizeForContentComparison(value);

  if (!originalCore || originalCore !== processedCore) {
    throw new Error("SvaraFlow changed the script content");
  }

  return value;
}

async function callModel(script, env) {
  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("SvaraFlow provider is not configured");

  const model = String(env.SVARAFLOW_MODEL || "gpt-5-mini").trim();
  if (!model) throw new Error("SvaraFlow model is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SVARAFLOW_TIMEOUT_MS);

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
        input: script,
        max_output_tokens: Math.min(12000, Math.max(512, script.length + 512))
      })
    });

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

    if (!text.trim()) throw new Error("SvaraFlow returned no usable text");

    const processed = validateOutput(script, text);

    // Temporary development diagnostic. Enable with SVARAFLOW_DEBUG=true.
    // This is intentionally server-side only and must be disabled before launch.
    if (String(env.SVARAFLOW_DEBUG || "").trim().toLowerCase() === "true") {
      console.log("svaraflow_debug", JSON.stringify({
        original: script,
        processed,
        changed: script !== processed,
        originalLength: script.length,
        processedLength: processed.length
      }));
    }

    return processed;
  } catch (error) {
    if (error?.name === "AbortError") {
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

  return callModel(originalScript, env);
}

export { SVARAFLOW_SYSTEM_PROMPT };
