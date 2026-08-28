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
          intent: { type: ["string", "null"], enum: ["ATMOSPHERE","REFLECTIVE","SUSPENSE","ANTICIPATION","CONTRAST","EMPHASIS","QUESTION","EXCITEMENT","SADNESS","CALM","URGENT","RESOLUTION",null] },
          delivery: { type: ["string", "null"], enum: ["PACE_SLOW","PACE_NORMAL","PACE_FAST",null] },
          pause_after: { type: ["string", "null"], enum: ["PAUSE_SHORT","PAUSE_MEDIUM","PAUSE_LONG",null] }
        }
      }
    }
  }
};

const STYLE_PROFILES = {
  Creative: {
    Storytelling:{objective:"narrative immersion",energy:["LOW","HIGH"],pace:["SLOW","NORMAL"],emotional_range:"context-dependent",pause_strategy:"emotional and selective",emphasis_strategy:"selective",suspense_strategy:"gradual",contrast_strategy:"natural",ending_strategy:"emotional landing",intent_priority:["ATMOSPHERE","SUSPENSE","REFLECTIVE","CONTRAST","RESOLUTION"]},
    Character:{objective:"believable personality and reaction",energy:["LOW","HIGH"],pace:["SLOW","FAST"],emotional_range:"LOW to HIGH",pause_strategy:"reaction-based",emphasis_strategy:"strong when emotionally justified",suspense_strategy:"contextual",contrast_strategy:"strong",ending_strategy:"character-driven",intent_priority:["EMPHASIS","CONTRAST","EXCITEMENT","SADNESS","SUSPENSE","RESOLUTION"]},
    Audiobook:{objective:"sustained immersive narration",energy:["LOW","MEDIUM"],pace:["SLOW","NORMAL"],emotional_range:"LOW to HIGH",pause_strategy:"natural and sustainable",emphasis_strategy:"restrained",suspense_strategy:"gradual",contrast_strategy:"subtle",ending_strategy:"natural",intent_priority:["ATMOSPHERE","REFLECTIVE","SUSPENSE","CONTRAST","RESOLUTION"]},
    Animation:{objective:"expressive personality and heightened emotion",energy:["MEDIUM","HIGH"],pace:["NORMAL","FAST"],emotional_range:"HIGH",pause_strategy:"dramatic and reaction-based",emphasis_strategy:"strong",suspense_strategy:"exaggerated",contrast_strategy:"strong",ending_strategy:"expressive",intent_priority:["EXCITEMENT","EMPHASIS","CONTRAST","SUSPENSE","RESOLUTION"]}
  },
  Business: {
    Commercial:{objective:"capture attention and persuade",energy:["MEDIUM","HIGH"],pace:["NORMAL","FAST"],emotional_range:"MEDIUM to HIGH",pause_strategy:"strategic",emphasis_strategy:"strong",suspense_strategy:"short anticipation before key messaging",contrast_strategy:"strong",ending_strategy:"memorable and confident",intent_priority:["EXCITEMENT","EMPHASIS","ANTICIPATION","URGENT","RESOLUTION"]},
    Corporate:{objective:"authority and credibility",energy:["LOW","MEDIUM"],pace:["SLOW","NORMAL"],emotional_range:"LOW to MEDIUM",pause_strategy:"controlled",emphasis_strategy:"deliberate",suspense_strategy:"minimal",contrast_strategy:"controlled",ending_strategy:"confident",intent_priority:["EMPHASIS","CALM","CONTRAST","RESOLUTION"]},
    Presentation:{objective:"communicate clearly while maintaining attention",energy:["MEDIUM","MEDIUM"],pace:["NORMAL","NORMAL"],emotional_range:"LOW to MEDIUM",pause_strategy:"point-based",emphasis_strategy:"key concepts",suspense_strategy:"selective",contrast_strategy:"clear",ending_strategy:"confident",intent_priority:["EMPHASIS","CONTRAST","REFLECTIVE","RESOLUTION"]},
    "Product Demo":{objective:"highlight features and benefits",energy:["MEDIUM","HIGH"],pace:["NORMAL","NORMAL"],emotional_range:"MEDIUM",pause_strategy:"strategic before features",emphasis_strategy:"strong on product benefits",suspense_strategy:"anticipation before reveal",contrast_strategy:"benefit-oriented",ending_strategy:"confident",intent_priority:["EMPHASIS","ANTICIPATION","EXCITEMENT","RESOLUTION"]},
    Sales:{objective:"build desire, trust and momentum",energy:["MEDIUM","HIGH"],pace:["NORMAL","FAST"],emotional_range:"MEDIUM to HIGH",pause_strategy:"strategic",emphasis_strategy:"benefits and outcomes",suspense_strategy:"anticipation",contrast_strategy:"persuasive",ending_strategy:"confident and motivating",intent_priority:["EMPHASIS","EXCITEMENT","ANTICIPATION","URGENT","RESOLUTION"]}
  },
  Education: {
    "E-learning":{objective:"comprehension and retention",energy:["LOW","MEDIUM"],pace:["SLOW","NORMAL"],emotional_range:"LOW to MEDIUM",pause_strategy:"comprehension-based",emphasis_strategy:"key concepts",suspense_strategy:"minimal",contrast_strategy:"instructional",ending_strategy:"clear",intent_priority:["EMPHASIS","CONTRAST","REFLECTIVE"]},
    Tutorial:{objective:"guide actions sequentially",energy:["LOW","MEDIUM"],pace:["NORMAL","NORMAL"],emotional_range:"LOW",pause_strategy:"step-based",emphasis_strategy:"actions",suspense_strategy:"minimal",contrast_strategy:"procedural",ending_strategy:"clear",intent_priority:["EMPHASIS","CONTRAST"]},
    Lesson:{objective:"explain concepts naturally",energy:["LOW","MEDIUM"],pace:["SLOW","NORMAL"],emotional_range:"LOW to MEDIUM",pause_strategy:"conceptual",emphasis_strategy:"important ideas",suspense_strategy:"selective",contrast_strategy:"explanatory",ending_strategy:"clear",intent_priority:["EMPHASIS","REFLECTIVE","CONTRAST"]},
    "Language Learning":{objective:"clarity and processing",energy:["LOW","MEDIUM"],pace:["SLOW","SLOW"],emotional_range:"LOW",pause_strategy:"deliberate",emphasis_strategy:"pronunciation and target phrases",suspense_strategy:"none",contrast_strategy:"clear",ending_strategy:"neutral",intent_priority:["EMPHASIS"]}
  },
  Media: {
    Narration:{objective:"natural descriptive guidance",energy:["LOW","MEDIUM"],pace:["SLOW","NORMAL"],emotional_range:"LOW to MEDIUM",pause_strategy:"contextual",emphasis_strategy:"selective",suspense_strategy:"contextual",contrast_strategy:"natural",ending_strategy:"natural",intent_priority:["ATMOSPHERE","REFLECTIVE","RESOLUTION"]},
    Documentary:{objective:"inform while maintaining engagement",energy:["LOW","MEDIUM"],pace:["SLOW","NORMAL"],emotional_range:"LOW to MEDIUM",pause_strategy:"deliberate",emphasis_strategy:"facts and discoveries",suspense_strategy:"controlled",contrast_strategy:"informative",ending_strategy:"authoritative",intent_priority:["ATMOSPHERE","EMPHASIS","REFLECTIVE","SUSPENSE"]},
    Podcast:{objective:"conversational connection",energy:["LOW","MEDIUM_HIGH"],pace:["SLOW","NORMAL_FAST"],emotional_range:"LOW to HIGH",pause_strategy:"natural conversational",emphasis_strategy:"conversational",suspense_strategy:"contextual",contrast_strategy:"natural",ending_strategy:"conversational",intent_priority:["REFLECTIVE","CONTRAST","EMPHASIS"]},
    News:{objective:"clarity, authority and information",energy:["LOW","MEDIUM_HIGH"],pace:["NORMAL","NORMAL"],emotional_range:"LOW",pause_strategy:"concise",emphasis_strategy:"facts and key developments",suspense_strategy:"controlled",contrast_strategy:"strong factual distinction",ending_strategy:"authoritative",intent_priority:["EMPHASIS","CONTRAST","URGENT"]},
    Trailer:{objective:"tension, anticipation and dramatic impact",energy:["LOW","HIGH"],pace:["SLOW","FAST"],emotional_range:"HIGH",pause_strategy:"dramatic",emphasis_strategy:"strong",suspense_strategy:"maximum",contrast_strategy:"strong",ending_strategy:"dramatic",intent_priority:["SUSPENSE","ANTICIPATION","EMPHASIS","EXCITEMENT","RESOLUTION"]}
  },
  Performance: {
    Dramatic:{objective:"maximize dramatic impact",energy:["LOW","HIGH"],pace:["SLOW","FAST"],emotional_range:"HIGH",pause_strategy:"dramatic",emphasis_strategy:"strong",suspense_strategy:"strong",contrast_strategy:"strong",ending_strategy:"dramatic",intent_priority:["SUSPENSE","CONTRAST","EMPHASIS","RESOLUTION"]},
    Inspirational:{objective:"optimism and conviction",energy:["MEDIUM","HIGH"],pace:["NORMAL","NORMAL"],emotional_range:"MEDIUM to HIGH",pause_strategy:"purposeful",emphasis_strategy:"strong",suspense_strategy:"low",contrast_strategy:"motivational",ending_strategy:"uplifting",intent_priority:["EMPHASIS","EXCITEMENT","RESOLUTION"]},
    Calm:{objective:"relaxation and stability",energy:["LOW","LOW"],pace:["SLOW","SLOW"],emotional_range:"LOW to MEDIUM",pause_strategy:"generous",emphasis_strategy:"restrained",suspense_strategy:"minimal",contrast_strategy:"subtle",ending_strategy:"gentle",intent_priority:["CALM","REFLECTIVE","ATMOSPHERE"]},
    Energetic:{objective:"momentum and excitement",energy:["HIGH","HIGH"],pace:["NORMAL","FAST"],emotional_range:"MEDIUM to HIGH",pause_strategy:"tight and strategic",emphasis_strategy:"strong",suspense_strategy:"short",contrast_strategy:"strong",ending_strategy:"energetic",intent_priority:["EXCITEMENT","URGENT","EMPHASIS"]},
    Mystery:{objective:"uncertainty and anticipation",energy:["LOW","MEDIUM"],pace:["SLOW","SLOW"],emotional_range:"MEDIUM to HIGH",pause_strategy:"strategic hesitation",emphasis_strategy:"selective",suspense_strategy:"maximum",contrast_strategy:"subtle",ending_strategy:"unresolved or suspenseful",intent_priority:["SUSPENSE","ANTICIPATION","ATMOSPHERE","REFLECTIVE"]}
  }
};

const DEFAULT_CATEGORY = "Creative";
const DEFAULT_STYLE = "Storytelling";
const MAX_SCRIPT_LENGTH = 10000;
const TIMEOUT_MS = 30000;
const ALLOWED_INTENTS = new Set(["ATMOSPHERE","REFLECTIVE","SUSPENSE","ANTICIPATION","CONTRAST","EMPHASIS","QUESTION","EXCITEMENT","SADNESS","CALM","URGENT","RESOLUTION"]);
const ALLOWED_DELIVERY = new Set(["PACE_SLOW","PACE_NORMAL","PACE_FAST"]);
const ALLOWED_PAUSES = new Set(["PAUSE_SHORT","PAUSE_MEDIUM","PAUSE_LONG"]);

export function getSvaraFlowStyleProfile(category = DEFAULT_CATEGORY, style = DEFAULT_STYLE) {
  const styles = STYLE_PROFILES[category];
  if (!styles) throw new Error(`Unknown SvaraFlow category: ${category}`);
  if (!styles[style]) throw new Error(`Unknown SvaraFlow style: ${category}/${style}`);
  return { category, style, ...styles[style] };
}

export function listSvaraFlowStyles() {
  return Object.entries(STYLE_PROFILES).map(([category, styles]) => ({ category, styles: Object.keys(styles) }));
}

function normalizeInput(script) { return String(script ?? "").replace(/\r\n/g, "\n").trim(); }
function normalizeForContentComparison(text) { return String(text ?? "").normalize("NFKC").toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, ""); }
function debugEnabled(env) { const v = String(env?.SVARAFLOW_DEBUG ?? "").trim().toLowerCase(); return v === "true" || v === "1" || v === "yes"; }

function validatePlan(original, plan) {
  if (!plan || !Array.isArray(plan.segments) || !plan.segments.length) throw new Error("SvaraFlow returned an invalid delivery plan");
  const segments = plan.segments.map((s, i) => {
    if (!s || typeof s !== "object") throw new Error(`SvaraFlow segment ${i + 1} is invalid`);
    const text = String(s.text ?? "");
    if (!text.trim()) throw new Error(`SvaraFlow segment ${i + 1} is empty`);
    const intent = s.intent == null ? null : String(s.intent);
    const delivery = s.delivery == null ? null : String(s.delivery);
    const pause_after = s.pause_after == null ? null : String(s.pause_after);
    if (intent !== null && !ALLOWED_INTENTS.has(intent)) throw new Error(`SvaraFlow segment ${i + 1} has an invalid intent`);
    if (delivery !== null && !ALLOWED_DELIVERY.has(delivery)) throw new Error(`SvaraFlow segment ${i + 1} has an invalid delivery cue`);
    if (pause_after !== null && !ALLOWED_PAUSES.has(pause_after)) throw new Error(`SvaraFlow segment ${i + 1} has an invalid pause cue`);
    return { text, intent, delivery, pause_after };
  });
  if (!normalizeForContentComparison(original) || normalizeForContentComparison(original) !== normalizeForContentComparison(segments.map(s => s.text).join(" "))) throw new Error("SvaraFlow changed, omitted, duplicated, or reordered script content");
  return { segments };
}

function extractJson(text) {
  const value = String(text ?? "").trim();
  if (!value) throw new Error("SvaraFlow returned no usable analysis");
  try { return JSON.parse(value); } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("SvaraFlow returned invalid JSON");
    return JSON.parse(value.slice(start, end + 1));
  }
}

function clean(text) { return String(text ?? "").replace(/\s+/g, " ").trim(); }
function terminal(text) { return /[.!?…]$/.test(text); }
function ellipsisBeforeClause(text) {
  const v = clean(text);
  if (!v || v.includes("...")) return v;
  const comma = v.indexOf(",");
  if (comma > 8 && comma < v.length - 12) return `${v.slice(0, comma)}...${v.slice(comma + 1)}`.replace(/\.\.\.\s+/g, "... ");
  return v.replace(/[.!?]$/, "...");
}
function translateSegment(segment) {
  let text = clean(segment.text);
  const intent = segment.intent;
  if (segment.delivery === "PACE_FAST") text = text.replace(/\.\.\./g, ".");
  if (segment.pause_after === "PAUSE_SHORT" && (intent === "SUSPENSE" || intent === "ANTICIPATION" || intent === "REFLECTIVE")) {
    text = text.includes("...") ? text : (/,/.test(text) ? ellipsisBeforeClause(text) : (terminal(text) ? text.replace(/[.!?]$/, "...") : `${text},`));
  } else if (segment.pause_after === "PAUSE_MEDIUM") {
    if (intent === "CONTRAST") {
      const m = text.match(/\s+(and|but|yet|however)\b/i);
      if (m && !text.includes(" — ")) text = text.replace(m[0], ` — ${m[1]}`);
    } else if ((intent === "ATMOSPHERE" || intent === "REFLECTIVE" || intent === "ANTICIPATION") && /,/.test(text) && !text.includes("...")) text = ellipsisBeforeClause(text);
    else if (terminal(text)) text = text.replace(/[.!?]$/, "...");
    else text += "...";
  } else if (segment.pause_after === "PAUSE_LONG") {
    if (!text.includes("...")) text = text.replace(/[.!?]$/, "...");
  }
  return text;
}

export function translateSvaraFlowPlan(originalScript, plan, env = {}) {
  const original = normalizeInput(originalScript);
  const validated = validatePlan(original, plan);
  const outputs = validated.segments.map(translateSegment);
  let preparedScript = outputs.join(" ");
  const maxEllipses = Math.max(2, Math.ceil(validated.segments.length / 2));
  let count = 0;
  preparedScript = preparedScript.replace(/\.\.\./g, () => (++count <= maxEllipses ? "..." : "."));
  if (normalizeForContentComparison(original) !== normalizeForContentComparison(preparedScript)) throw new Error("SvaraFlow 3E changed, omitted, duplicated, or reordered script content");
  const metadata = { originalLength: original.length, preparedLength: preparedScript.length, transformationCount: outputs.reduce((n, v, i) => n + (v !== clean(validated.segments[i].text) ? 1 : 0), 0), segmentCount: outputs.length, svaraflowVersion: "3E-B-v2" };
  if (debugEnabled(env)) console.log("svaraflow_3e_debug", { originalScript: original, preparedScript, metadata, segments: outputs.map((text, i) => ({ index: i + 1, source: validated.segments[i], output: text })) });
  return { preparedScript, metadata };
}

function buildInstructions(profile) {
  return `You are SvaraFlow™, SvaraONE's internal speech-performance analysis layer.\n\nAnalyze the user's script for spoken performance using this selected profile:\nCategory: ${profile.category}\nStyle: ${profile.style}\nObjective: ${profile.objective}\nEnergy range: ${profile.energy.join(" to ")}\nPace range: ${profile.pace.join(" to ")}\nEmotional range: ${profile.emotional_range}\nPause strategy: ${profile.pause_strategy}\nEmphasis strategy: ${profile.emphasis_strategy}\nSuspense strategy: ${profile.suspense_strategy}\nContrast strategy: ${profile.contrast_strategy}\nEnding strategy: ${profile.ending_strategy}\nPriority intents: ${profile.intent_priority.join(", ")}\n\nThe selected profile is guidance, not a command. The meaning of the script always wins. Do not force an effect where the words do not support it. Neutral delivery is valid.\n\nThe user's words are immutable. Do not rewrite, paraphrase, summarize, add, remove, reorder, translate, or substitute any words. Segment text must reproduce the user's words exactly.\n\nAllowed intent cues: ATMOSPHERE, REFLECTIVE, SUSPENSE, ANTICIPATION, CONTRAST, EMPHASIS, QUESTION, EXCITEMENT, SADNESS, CALM, URGENT, RESOLUTION\nAllowed delivery cues: PACE_SLOW, PACE_NORMAL, PACE_FAST\nAllowed pause cues: PAUSE_SHORT, PAUSE_MEDIUM, PAUSE_LONG\n\nReturn only JSON matching the required response schema. Cover the entire script exactly once.`;
}

async function callModel(script, env, profile) {
  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw new Error("SvaraFlow provider is not configured");
  const model = String(env.SVARAFLOW_MODEL || "gpt-5-mini").trim();
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (debugEnabled(env)) console.log("svaraflow_openai_request_start", { model, scriptLength: script.length, timeoutMs: TIMEOUT_MS, category: profile.category, style: profile.style });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method:"POST", headers:{"content-type":"application/json",authorization:`Bearer ${apiKey}`}, signal:controller.signal, body:JSON.stringify({ model, instructions:buildInstructions(profile), input:`Return the SvaraFlow delivery plan as JSON.\n\n${script}`, text:{format:{type:"json_schema",name:"svaraflow_delivery_plan",strict:true,schema:SVARAFLOW_RESPONSE_SCHEMA}}, max_output_tokens:Math.min(12000,Math.max(2048,script.length+1024)) }) });
    if (debugEnabled(env)) console.log("svaraflow_openai_response", { status:response.status, elapsedMs:Date.now()-startedAt, category:profile.category, style:profile.style });
    if (!response.ok) throw new Error(`SvaraFlow provider error ${response.status}: ${(await response.text().catch(()=>"")).slice(0,300)}`);
    const data = await response.json();
    const text = typeof data.output_text === "string" ? data.output_text : (Array.isArray(data.output)?data.output:[]).flatMap(x=>Array.isArray(x.content)?x.content:[]).map(x=>typeof x.text==="string"?x.text:"").join("");
    const plan = validatePlan(script, extractJson(text));
    if (debugEnabled(env)) console.log("svaraflow_analysis", { originalLength:script.length, segmentCount:plan.segments.length, category:profile.category, style:profile.style, profile, plan });
    return plan;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error(`SvaraFlow timed out after ${TIMEOUT_MS}ms`);
    throw error;
  } finally { clearTimeout(timeout); }
}

export async function processSvaraFlow(script, env, options = {}) {
  const original = normalizeInput(script);
  if (!original) throw new Error("SvaraFlow requires script text");
  if (original.length > MAX_SCRIPT_LENGTH) throw new Error(`SvaraFlow maximum is ${MAX_SCRIPT_LENGTH} characters`);
  const category = String(options.category || env.SVARAFLOW_CATEGORY || DEFAULT_CATEGORY).trim() || DEFAULT_CATEGORY;
  const style = String(options.style || env.SVARAFLOW_STYLE || DEFAULT_STYLE).trim() || DEFAULT_STYLE;
  const profile = getSvaraFlowStyleProfile(category, style);
  if (debugEnabled(env)) console.log("svaraflow_debug_start", { scriptLength:original.length, model:String(env.SVARAFLOW_MODEL||"gpt-5-mini"), category, style });
  return callModel(original, env, profile);
}

export { SVARAFLOW_RESPONSE_SCHEMA };
