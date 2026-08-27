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

function normalizeInput(script) {
  return String(script ?? "").replace(/\r\n/g, "\n").trim();
}

function validateOutput(original, processed) {
  const value = String(processed ?? "").trim();
  if (!value) throw new Error("SvaraFlow returned an empty script");
  if (value.length > MAX_SCRIPT_LENGTH) throw new Error("SvaraFlow returned an oversized script");

  // Step 3A is intentionally conservative: the processor may alter punctuation
  // and spacing, but it must not materially change the amount of text.
  const stripPunctuation = text => text
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "")
    .trim();

  const originalCore = stripPunctuation(original);
  const processedCore = stripPunctuation(value);
  if (originalCore !== processedCore) {
    throw new Error("SvaraFlow changed the script content");
  }

  return value;
}

async function callModel(script, env) {
  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("SvaraFlow provider is not configured");

  const model = String(env.SVARAFLOW_MODEL || "gpt-5-mini").trim();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      instructions: SVARAFLOW_SYSTEM_PROMPT,
      input: script,
      temperature: 0.2,
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
    : (data.output || [])
      .flatMap(item => item.content || [])
      .map(item => item.text || "")
      .join("");

  return validateOutput(script, text);
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
