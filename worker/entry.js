import app from "./index.js";
import "./generation-folders.js";
import { handleAuth } from "./auth.js";
import { handlePayfast, runBillingCron } from "./payfast.js";
import { getVoiceById, getVoiceByProviderId, syncVoiceRegistry, seedMissingVoiceSamples } from "./voice-registry.js";
import { createGeneration, markGenerationReady, markGenerationFailed, cleanupExpiredGenerations, mimeTypeForFormat } from "./generations.js";
import "./voice-history.js";
import { processSvaraFlow, translateSvaraFlowPlan } from "./svaraflow-voice.js";
import { handleSoundGenerate } from "./sound-api.js";
import { ensureSoundProviderCapabilities } from "./sound-capabilities.js";

const PORTRAIT_NAMES = {
  en: "thalia",
  es: "celeste",
  de: "julius",
  fr: "agathe",
  nl: "rhea",
  it: "livia",
  ja: "izanami"
};

const SESSION_COOKIE = "svara_session";
const MAX_GENERATION_CHARS = 10000;
const VIDEO_DISCOVERY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title","logline","recommendedFormat","durationSeconds","audience","objective","keyMessage","creativeDirection","visualStyle","tone","callToAction","sceneOutline","openQuestions","assumptions"],
  properties: {
    title: { type: "string", description: "A short, memorable human-facing concept title, ideally 3–7 words." },
    logline: { type: "string", description: "One vivid, natural sentence communicating the story and emotional hook. About 25 words maximum. Speak to a person, not another AI." },
    recommendedFormat: { type: "string", description: "A concise format and aspect-ratio recommendation, maximum 12 words." },
    durationSeconds: { type: "integer", description: "Recommended total runtime in seconds." },
    audience: { type: "string", description: "The primary audience in plain language, maximum 18 words." },
    objective: { type: "string", description: "The single most important outcome, maximum 18 words. Avoid marketing jargon." },
    keyMessage: { type: "string", description: "The one thought the viewer should remember, maximum 20 words." },
    creativeDirection: { type: "string", description: "A human-readable story idea in 1–2 sentences, maximum 45 words. Describe the experience and emotional arc, not instructions for an AI generator." },
    visualStyle: { type: "string", description: "A short visual identity in plain language, maximum 12 words; no imperative prompt language." },
    tone: { type: "string", description: "Two to four natural tone words, not a sentence." },
    callToAction: { type: "string", description: "A concise closing invitation, maximum 12 words; do not invent unsupported product claims." },
    sceneOutline: {
      type: "array", minItems: 3, maxItems: 6,
      items: {
        type: "object", additionalProperties: false,
        required: ["title","purpose","visualDescription","cameraDirection","narration","durationSeconds"],
        properties: {
          title: { type: "string", description: "An evocative scene heading, 2–6 words." },
          purpose: { type: "string", description: "One short sentence explaining the story beat or feeling, maximum 16 words." },
          visualDescription: { type: "string", description: "One concrete, filmable description of what the audience sees and what changes, maximum 28 words. No generic production advice." },
          cameraDirection: { type: "string", description: "One concise shot, framing or movement choice that serves the story, maximum 14 words." },
          narration: { type: "string", description: "Only actual proposed spoken words, natural and memorable, maximum 18 words. Empty string is valid if narration is not needed; never write narration instructions." },
          durationSeconds: { type: "integer", description: "Approximate duration for this scene in seconds." }
        }
      }
    },
    openQuestions: { type: "array", minItems: 1, maxItems: 3, items: { type: "string", description: "A genuinely important decision for the user, phrased as a short human question." } },
    assumptions: { type: "array", minItems: 1, maxItems: 3, items: { type: "string", description: "A short, transparent assumption only where information is missing." } }
  }
};

async function createVideoRefinement(body, env) {
 const request=String(body?.request||"").trim(),scope=["whole","scene","visuals","narration"].includes(body?.scope)?body.scope:"whole",concept=body?.concept;
 if(!request)throw Object.assign(new Error("Tell SvaraFlow what you'd like to refine."),{status:400});
 if(request.length>1200)throw Object.assign(new Error("Keep each refinement request to 1,200 characters or fewer."),{status:400});
 if(!concept||typeof concept!=="object"||!Array.isArray(concept.sceneOutline)||concept.sceneOutline.length<3||concept.sceneOutline.length>6)throw Object.assign(new Error("The current concept is missing or incomplete. Develop the concept again before refining it."),{status:400});
 const sceneIndex=Number.isInteger(body?.sceneIndex)?body.sceneIndex:-1;
 if(scope==="scene"&&(sceneIndex<0||sceneIndex>=concept.sceneOutline.length))throw Object.assign(new Error("Choose a scene to refine."),{status:400});
 const apiKey=String(env.OPENAI_API_KEY||"").trim();if(!apiKey)throw Object.assign(new Error("Creative refinement is not configured yet. The OpenAI API key is missing from Cloudflare."),{status:503});
 const model=String(env.SVARAFLOW_VIDEO_MODEL||env.SVARAFLOW_MODEL||"gpt-5-mini").trim(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
 try{
  const instructions=["You are SvaraFlow™, a thoughtful creative director refining an existing video concept with its human creator.","The current concept is the source of truth. Treat the user's request as a targeted edit, not permission to start over.","Preserve all unaffected creative choices, factual details, tone, audience, story beats, duration and scene order. Do not rewrite fields that do not need to change.","If scope is one scene, keep every other scene semantically unchanged. If scope is narration, preserve visual and camera direction. If scope is visuals, preserve narration and story meaning.","Only adjust connected fields when necessary for coherence. Do not introduce unsupported claims, new facts, or media-generation claims.","Return the complete revised concept in the required schema. Keep all fields concise and human-facing. Empty narration is valid.","This response does not approve the concept, create a storyboard, generate media, or spend media credits."].join("\n");
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${apiKey}`},signal:controller.signal,body:JSON.stringify({model,instructions,input:JSON.stringify({refinementRequest:request,scope,targetScene:scope==="scene"?concept.sceneOutline[sceneIndex]:null,currentConcept:concept}),text:{format:{type:"json_schema",name:"svaraone_video_concept_revision",strict:true,schema:VIDEO_DISCOVERY_SCHEMA}},max_output_tokens:5000})});
  if(!response.ok){const detail=await response.text().catch(()=>"");console.error("video_refinement_openai_error",{status:response.status,detail:detail.slice(0,500)});throw Object.assign(new Error("SvaraFlow couldn't refine the concept right now. Please try again."),{status:502});}
  const payload=await response.json(),outputText=typeof payload.output_text==="string"?payload.output_text:(Array.isArray(payload.output)?payload.output:[]).flatMap(item=>Array.isArray(item.content)?item.content:[]).map(item=>typeof item.text==="string"?item.text:"").join("");
  let revised;try{revised=JSON.parse(outputText)}catch{throw Object.assign(new Error("SvaraFlow returned an unreadable revision. Please try again."),{status:502});}
  if(!revised||!Array.isArray(revised.sceneOutline)||revised.sceneOutline.length<3||revised.sceneOutline.length>6)throw Object.assign(new Error("SvaraFlow returned an incomplete revision. Please try again."),{status:502});
  revised.durationSeconds=Number.isInteger(revised.durationSeconds)?Math.min(180,Math.max(15,revised.durationSeconds)):concept.durationSeconds;
  revised.sceneOutline=revised.sceneOutline.map((scene,index)=>({...scene,title:String(scene.title||`Scene ${index+1}`).slice(0,120),durationSeconds:Math.min(30,Math.max(2,Number.isInteger(scene.durationSeconds)?scene.durationSeconds:5))}));
  return {ok:true,concept:revised,meta:{provider:"openai",model,refinement:true,mediaGenerated:false}};
 }catch(error){if(error?.name==="AbortError")throw Object.assign(new Error("Creative refinement timed out. Please try again."),{status:504});throw error;}finally{clearTimeout(timeout);}
}

async function createVideoDiscovery(body, env) {
  const idea = String(body?.idea || "").trim();
  const productUrl = String(body?.url || "").trim();
  const audience = String(body?.audience || "").trim();
  const goal = String(body?.goal || "").trim();
  const mode = body?.mode === "brief" ? "brief" : "discover";
  if (!idea && !productUrl) throw Object.assign(new Error("Add an idea or a website/product link to begin discovery."), { status: 400 });
  if (idea.length > 6000) throw Object.assign(new Error("Keep the idea or brief to 6,000 characters or fewer."), { status: 400 });
  if (productUrl && (productUrl.length > 500 || !/^https?:\/\//i.test(productUrl))) throw Object.assign(new Error("Enter a valid website URL beginning with http:// or https://."), { status: 400 });
  if (audience.length > 300 || goal.length > 300) throw Object.assign(new Error("Audience and objective must each be 300 characters or fewer."), { status: 400 });
  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw Object.assign(new Error("Creative Discovery is not configured yet. The OpenAI API key is missing from Cloudflare."), { status: 503 });
  const model = String(env.SVARAFLOW_VIDEO_MODEL || env.SVARAFLOW_MODEL || "gpt-5-mini").trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const instructions = [
      "You are SvaraFlow™, a thoughtful, experienced human-facing creative director helping a person discover what their video could become.",
      "Your first job is creative thinking, not writing a production brief for another AI system. Sound perceptive, clear, imaginative and collaborative; never refer to prompts, generators, AI tools, production pipelines or instructions to another system.",
      "Start from the user's intent. Find the human story, the audience's reason to care, a clear emotional progression and a specific, memorable creative idea. Do not default to generic marketing language or stock creator-tool imagery.",
      "The user may provide only one sentence. Move the idea forward with reasonable assumptions; do not interrogate the user or make them complete a brief.",
      "Write for a human: concise, natural language, concrete choices, no jargon, no repetition. Prefer one strong idea over lists of generic possibilities.",
      "The concept summary must feel like a creative partner explaining the idea to the user. The scene outline must tell a coherent story from opening hook through development to resolution.",
      "For every scene, provide one concrete filmable visual, one concise camera choice that supports the story, and actual proposed narration words only when narration belongs in that scene. Empty narration is valid. Never put instructions such as 'use...', 'prioritize...' or 'end with...' inside creative fields.",
      "Keep all fields short according to their schema descriptions. Avoid repeating the same idea in creativeDirection, visualStyle, keyMessage and callToAction.",
      "Respect the supplied audience and objective. Do not invent product features, results, claims or facts. If details are unknown, disclose only the most material assumptions.",
      "Do not claim to have visited or verified a supplied URL. Treat it only as a reference string; use only the user's supplied description.",
      "Do not claim that images, video, voice, music or other media have been generated.",
      "Make 3 to 6 scenes with durations adding up approximately to durationSeconds. Return only data matching the required JSON schema."
    ].join("\n");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model, instructions,
        input: JSON.stringify({ entryPath: mode, idea, productUrl, intendedAudience: audience || null, objective: goal || null }),
        text: { format: { type: "json_schema", name: "svaraone_video_concept", strict: true, schema: VIDEO_DISCOVERY_SCHEMA } },
        max_output_tokens: 5000
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("video_discovery_openai_error", { status: response.status, detail: detail.slice(0, 500) });
      throw Object.assign(new Error(response.status === 401 ? "The OpenAI API key was rejected. Check the OPENAI_API_KEY secret in Cloudflare." : "SvaraFlow could not develop the concept right now. Please try again."), { status: 502 });
    }
    const payload = await response.json();
    const outputText = typeof payload.output_text === "string" ? payload.output_text : (Array.isArray(payload.output) ? payload.output : []).flatMap(item => Array.isArray(item.content) ? item.content : []).map(item => typeof item.text === "string" ? item.text : "").join("");
    let concept;
    try { concept = JSON.parse(outputText); } catch { throw Object.assign(new Error("SvaraFlow returned an unreadable concept. Please try again."), { status: 502 }); }
    if (!concept || !Array.isArray(concept.sceneOutline) || concept.sceneOutline.length < 3 || concept.sceneOutline.length > 6) {
      throw Object.assign(new Error("SvaraFlow returned an incomplete storyboard outline. Please try again."), { status: 502 });
    }
    const allowedDuration = Number(concept.durationSeconds);
    concept.durationSeconds = Number.isInteger(allowedDuration) ? Math.min(180, Math.max(15, allowedDuration)) : 30;
    concept.sceneOutline = concept.sceneOutline.map((scene, index) => ({
      ...scene,
      title: String(scene.title || `Scene ${index + 1}`).slice(0, 120),
      durationSeconds: Math.min(30, Math.max(2, Number.isInteger(scene.durationSeconds) ? scene.durationSeconds : 5))
    }));
    return { ok: true, concept, meta: { provider: "openai", model, referenceFilesAnalysed: false, urlFetched: false } };
  } catch (error) {
    if (error?.name === "AbortError") throw Object.assign(new Error("Creative Discovery timed out. Please try again."), { status: 504 });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const LEGACY_PROVIDER_VOICE_IDS = {
  "svara-amara-01": "aura-2-thalia-en",
  "svara-james-01": "aura-2-orion-en",
  "svara-thandi-01": "aura-2-thalia-en",
  "svara-daniel-01": "aura-2-orion-en",
  "svara-lea-01": "aura-2-thalia-en",
  "svara-premium-01": "aura-2-thalia-en"
};

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function sessionToken(request) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === SESSION_COOKIE) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return "";
}

async function authenticatedUserId(request, env) {
  if (!env.DB) return null;
  const token = sessionToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT u.id
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')
      AND u.status = 'active'
    LIMIT 1
  `).bind(tokenHash).first();
  return row?.id || null;
}

function fullVoiceCatalogueEnabled(env) {
  const value = String(env.SVARAONE_FULL_VOICE_CATALOGUE ?? "").trim().toLowerCase();
  if (value === "true" || value === "1" || value === "yes") return true;
  if (value === "false" || value === "0" || value === "no") return false;
  return false;
}

async function voiceAccess(request, env) {
  const fullCatalogue = fullVoiceCatalogueEnabled(env);
  if (fullCatalogue) return { fullCatalogue: true, voiceIds: [] };

  const userId = await authenticatedUserId(request, env);
  if (!userId || !env.DB) return { fullCatalogue: false, voiceIds: [] };
  const rows = await env.DB.prepare(
    "SELECT voice_id FROM user_voices WHERE user_id = ? AND revoked_at IS NULL ORDER BY granted_at ASC"
  ).bind(userId).all();
  return {
    fullCatalogue: false,
    voiceIds: (rows.results || []).map(row => String(row.voice_id || "")).filter(Boolean)
  };
}

async function resolveProviderVoiceId(body, env) {
  const requested = String(body?.providerVoiceId || "").trim();
  if (/^aura-2-[a-z0-9-]+$/.test(requested)) return requested;
  const svaraId = String(body?.voiceId || "").trim();
  if (/^svara-[a-z0-9-]+$/.test(svaraId)) {
    const voice = await getVoiceById(env, svaraId);
    if (voice) return voice.providerVoiceId;
  }
  const legacy = LEGACY_PROVIDER_VOICE_IDS[svaraId] || "";
  if (legacy) return legacy;
  return "";
}

async function composeCharacterDirection({ env, projectTitle, projectData, name, description, notes, preferences }) {
  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw Object.assign(new Error("SvaraFlow character direction is not configured. The OpenAI API key is missing from Cloudflare."), { status: 503 });
  const model = String(env.SVARAFLOW_VIDEO_MODEL || env.SVARAFLOW_MODEL || "gpt-5-mini").trim();
  const fields = projectData?.fields && typeof projectData.fields === "object" ? projectData.fields : {};
  const fieldValue = key => String(fields[key]?.value ?? "").trim().slice(0, 1200);
  const concept = projectData?.discoveryConcept && typeof projectData.discoveryConcept === "object" ? projectData.discoveryConcept : null;
  const storyContext = concept ? {
    title: String(concept.title || "").slice(0, 180),
    logline: String(concept.logline || "").slice(0, 500),
    creativeDirection: String(concept.creativeDirection || "").slice(0, 700),
    visualStyle: String(concept.visualStyle || "").slice(0, 250),
    tone: String(concept.tone || "").slice(0, 180),
    keyMessage: String(concept.keyMessage || "").slice(0, 300),
    scenes: Array.isArray(concept.sceneOutline) ? concept.sceneOutline.slice(0, 6).map(scene => ({
      title: String(scene?.title || "").slice(0, 100),
      purpose: String(scene?.purpose || "").slice(0, 220),
      visualDescription: String(scene?.visualDescription || "").slice(0, 300),
      narration: String(scene?.narration || "").slice(0, 180)
    })) : []
  } : null;
  const projectContext = {
    projectTitle: String(projectTitle || "").slice(0, 180),
    storyConcept: storyContext,
    visualStyle: fieldValue("visualStyle"),
    projectPalette: fieldValue("palette"),
    visualNotes: fieldValue("visualNotes"),
    brandLogoAvailable: Boolean(projectData?.brandAssets?.logo?.key || projectData?.brandAssets?.logo?.id),
    brandReferenceAvailable: Boolean(projectData?.brandAssets?.reference?.key || projectData?.brandAssets?.reference?.id)
  };
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["directionSummary", "imagePrompt", "candidateDirections"],
    properties: {
      directionSummary: { type: "string", description: "A concise, human-facing summary of the interpreted character direction, maximum 65 words." },
      imagePrompt: { type: "string", description: "A concrete, production-ready visual prompt for one character concept image, maximum 1800 words. Include identity, silhouette, face, materials, styling, framing, neutral background and visual consistency. Do not include text in the image." },
      candidateDirections: {
        type: "array", minItems: 3, maxItems: 3,
        items: {
          type: "object", additionalProperties: false,
          required: ["label", "variation"],
          properties: {
            label: { type: "string", description: "A concise, distinctive candidate title, 2–5 words." },
            variation: { type: "string", description: "Specific visual choices that make this candidate meaningfully different while preserving the shared identity and all non-negotiables, maximum 90 words." }
          }
        }
      }
    }
  };
  const instructions = [
    "You are SvaraFlow™, SvaraOne's creative director and orchestration layer.",
    "Interpret the creator's direction; do not merely concatenate fields or pass their raw wording through. Resolve compatible choices into one coherent character design brief.",
    "The creator's Creative Direction Brief and explicit must-preserve notes outrank generic defaults. Do not contradict the requested character foundation, valid preferences, saved project story, or brand palette.",
    "Use the saved project concept and Visual Style panel as context when present. Treat missing context as unknown; do not invent brand facts or claim to have visually inspected uploaded logo/reference files.",
    "If a project colour palette is present, preserve it. If it is absent, choose a restrained palette that serves the brief and explain it through the imagePrompt, without pretending it came from the brand kit.",
    "Create exactly three genuinely different candidate directions. Each should share the same core identity and non-negotiables but differ in a meaningful art-direction choice such as silhouette, material treatment, shape language, or styling. Do not vary only the outfit or colour.",
    "The imagePrompt must request a single polished character concept on a simple neutral studio background, full character visible, clear silhouette and expressive face, no collage, no multiple views, no captions, no lettering, no logo text, and no watermark.",
    "Each candidate variation will be generated as a separate image request. Make every variation self-contained when appended to the shared imagePrompt.",
    "Return only JSON matching the supplied schema. Be concise, specific and visually actionable."
  ].join("\n");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        instructions,
        input: JSON.stringify({
          creator: { name: name || null, creativeDirectionBrief: description, mustPreserve: notes || null, preferences },
          savedProjectContext: projectContext
        }),
        text: { format: { type: "json_schema", name: "svaraone_character_direction", strict: true, schema } },
        max_output_tokens: 3200
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("character_direction_openai_error", { status: response.status, detail: detail.slice(0, 400) });
      throw Object.assign(new Error("SvaraFlow couldn't compose the character direction. Please try again."), { status: 502 });
    }
    const payload = await response.json();
    const outputText = typeof payload.output_text === "string" ? payload.output_text : (Array.isArray(payload.output) ? payload.output : []).flatMap(item => Array.isArray(item.content) ? item.content : []).map(item => typeof item.text === "string" ? item.text : "").join("");
    let direction;
    try { direction = JSON.parse(outputText); } catch { throw Object.assign(new Error("SvaraFlow returned an unreadable character direction. Please try again."), { status: 502 }); }
    if (!direction || typeof direction.imagePrompt !== "string" || !direction.imagePrompt.trim() || !Array.isArray(direction.candidateDirections) || direction.candidateDirections.length !== 3) {
      throw Object.assign(new Error("SvaraFlow returned an incomplete character direction. Please try again."), { status: 502 });
    }
    const candidateDirections = direction.candidateDirections.map((item, index) => ({
      label: String(item?.label || "Direction " + (index + 1)).trim().slice(0, 80),
      variation: String(item?.variation || "").trim().slice(0, 900)
    }));
    if (candidateDirections.some(item => !item.variation)) throw Object.assign(new Error("SvaraFlow did not provide all three distinct candidate directions. Please try again."), { status: 502 });
    if (new Set(candidateDirections.map(item => item.label.toLowerCase())).size !== 3) throw Object.assign(new Error("SvaraFlow returned duplicate candidate labels. Please try again."), { status: 502 });
    return {
      directionSummary: String(direction.directionSummary || "").trim().slice(0, 500),
      imagePrompt: direction.imagePrompt.trim().slice(0, 10000),
      candidateDirections,
      model
    };
  } catch (error) {
    if (error?.name === "AbortError") throw Object.assign(new Error("SvaraFlow character direction timed out. Please try again."), { status: 504 });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function composeExportCreditCost(env) {
  const raw = String(env.SVARAONE_COMPOSE_EXPORT_CREDITS ?? "").trim();
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const cost = Number(raw);
  return Number.isSafeInteger(cost) && cost > 0 ? cost : null;
}

async function reserveComposeExportCredits(userId, cost, env, referenceId) {
  const existing = await env.DB.prepare(
    "SELECT id, amount FROM credit_ledger WHERE user_id=? AND reference_id=? AND reason='compose_export' LIMIT 1"
  ).bind(userId, referenceId).first();
  if (existing) return { alreadyCharged: true, cost: Math.abs(Number(existing.amount) || cost), referenceId };

  const latest = await env.DB.prepare(
    "SELECT balance_after FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC, rowid DESC LIMIT 1"
  ).bind(userId).first();
  if (!latest || Number(latest.balance_after) < cost) return null;

  const debitId = crypto.randomUUID();
  const result = await env.DB.prepare(`
    INSERT INTO credit_ledger (id,user_id,amount,balance_after,reason,reference_id,period_key)
    SELECT ?, ?, ?, balance_after - ?, 'compose_export', ?, 'compose_export'
    FROM credit_ledger
    WHERE user_id=? AND balance_after >= ?
    ORDER BY created_at DESC, rowid DESC
    LIMIT 1
  `).bind(debitId,userId,-cost,cost,referenceId,userId,cost).run();
  if (!result.meta?.changes) return null;
  const balance = await env.DB.prepare(
    "SELECT balance_after FROM credit_ledger WHERE id=?"
  ).bind(debitId).first("balance_after");
  return { alreadyCharged: false, cost, referenceId, balance: Number(balance || 0) };
}

async function refundComposeExportCredits(userId, cost, referenceId, env) {
  const existing = await env.DB.prepare(
    "SELECT id FROM credit_ledger WHERE user_id=? AND reference_id=? AND reason='compose_export_refund' LIMIT 1"
  ).bind(userId,referenceId).first();
  if (existing) return { refunded: false, alreadyRefunded: true };
  const latest = await env.DB.prepare(
    "SELECT balance_after FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC, rowid DESC LIMIT 1"
  ).bind(userId).first();
  if (!latest) throw new Error("Credit ledger balance is unavailable for refund.");
  const result = await env.DB.prepare(`
    INSERT INTO credit_ledger (id,user_id,amount,balance_after,reason,reference_id,period_key)
    SELECT ?, ?, ?, balance_after + ?, 'compose_export_refund', ?, 'compose_export'
    FROM credit_ledger
    WHERE user_id=?
    ORDER BY created_at DESC, rowid DESC
    LIMIT 1
  `).bind(crypto.randomUUID(),userId,cost,cost,referenceId,userId).run();
  if (!result.meta?.changes) throw new Error("Credit refund could not be recorded.");
  return { refunded: true, alreadyRefunded: false };
}

function generationCost(text, env) {
  const factor = Number(env.SVARAONE_CREDIT_FACTOR);
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 1;
  const normalizedCharacters = Math.max(100, Math.ceil(text.length / 100) * 100);
  return Math.max(1, Math.ceil(normalizedCharacters * safeFactor));
}

async function reserveCredits(userId, cost, env, referenceId = crypto.randomUUID()) {
  const result = await env.DB.prepare(`
    INSERT INTO credit_ledger
      (id, user_id, amount, balance_after, reason, reference_id, period_key)
    SELECT ?, ?, ?, balance_after - ?, 'generation', ?, 'generation'
    FROM credit_ledger
    WHERE user_id = ?
      AND balance_after >= ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(
    crypto.randomUUID(), userId, -cost, cost, referenceId, userId, cost
  ).run();

  if (!result.meta?.changes) return null;
  const balance = await env.DB.prepare(
    "SELECT balance_after FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(userId).first("balance_after");
  return { referenceId, balance: Number(balance || 0) };
}

async function refundCredits(userId, cost, referenceId, env) {
  await env.DB.prepare(`
    INSERT INTO credit_ledger
      (id, user_id, amount, balance_after, reason, reference_id, period_key)
    SELECT ?, ?, ?, balance_after + ?, 'generation_refund', ?, 'generation'
    FROM credit_ledger
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(
    crypto.randomUUID(), userId, cost, cost, referenceId, userId
  ).run();
}

async function storedPortrait(env, code) {
  if (!env.VOICE_SAMPLES) return null;

  const cleanCode = String(code || "").replace(/-v\d+$/, "");
  const portraitName = PORTRAIT_NAMES[cleanCode];
  if (!portraitName) return null;

  for (const extension of ["webp", "png"]) {
    const key = `portraits/${portraitName}.${extension}`;
    const object = await env.VOICE_SAMPLES.get(key);
    if (!object) continue;

    return new Response(object.body, {
      headers: {
        "content-type": extension === "webp" ? "image/webp" : "image/png",
        "cache-control": "public, max-age=31536000, immutable",
        "etag": object.httpEtag || ""
      }
    });
  }

  return null;
}

async function storedBrandLogo(env) {
  if (!env.VOICE_SAMPLES) return null;
  const object = await env.VOICE_SAMPLES.get("branding/svaraone-logo.png");
  if (!object) return null;

  return new Response(object.body, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
      "etag": object.httpEtag || ""
    }
  });
}

async function storedHeroBackground(env) {
  if (!env.VOICE_SAMPLES) return null;
  const object = await env.VOICE_SAMPLES.get("branding/hero-bg.png");
  if (!object) return null;

  return new Response(object.body, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
      "etag": object.httpEtag || ""
    }
  });
}

async function storedSoundAsset(request, env, userId, generationId) {
  if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Sound asset storage is not configured." }, 503);

  const generation = await env.DB.prepare(`
    SELECT id, user_id, status, r2_key, format, mime_type, size_bytes, duration_seconds
    FROM sound_generations
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `).bind(generationId, userId).first();

  if (!generation) return json({ error: "Sound generation not found." }, 404);
  if (String(generation.status) !== "ready" || !generation.r2_key) {
    return json({ error: "Sound asset is not ready." }, 409);
  }

  const totalSize = Number(generation.size_bytes);
  const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
  const rangeHeader = request.headers.get("Range");
  let object;
  let status = 200;
  const headers = new Headers({
    "content-type": String(generation.mime_type || mimeTypeForFormat(generation.format || "mp3")),
    "cache-control": "private, no-store",
    "accept-ranges": "bytes",
    "x-svaraone-generation-id": String(generation.id)
  });

  if (rangeHeader && Number.isFinite(totalSize) && totalSize > 0) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match) {
      headers.set("content-range", `bytes */${totalSize}`);
      return new Response(null, { status: 416, headers });
    }

    let start;
    let end;
    if (match[1] === "") {
      const suffixLength = Number(match[2]);
      if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
        headers.set("content-range", `bytes */${totalSize}`);
        return new Response(null, { status: 416, headers });
      }
      start = Math.max(0, totalSize - suffixLength);
      end = totalSize - 1;
    } else {
      start = Number(match[1]);
      end = match[2] === "" ? totalSize - 1 : Number(match[2]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= totalSize || end < start) {
        headers.set("content-range", `bytes */${totalSize}`);
        return new Response(null, { status: 416, headers });
      }
      end = Math.min(end, totalSize - 1);
    }

    object = await env.GENERATED_AUDIO.get(generation.r2_key, {
      range: { offset: start, length: end - start + 1 }
    });
    if (!object) return json({ error: "Sound asset not found." }, 404);

    const length = end - start + 1;
    headers.set("content-length", String(length));
    headers.set("content-range", `bytes ${start}-${end}/${totalSize}`);
    status = 206;
  } else {
    object = await env.GENERATED_AUDIO.get(generation.r2_key);
    if (!object) return json({ error: "Sound asset not found." }, 404);
    if (object.size !== undefined) headers.set("content-length", String(object.size));
  }

  if (object.httpEtag) headers.set("etag", object.httpEtag);
  if (wantsDownload) {
    const extension = String(generation.format || "mp3").toLowerCase();
    headers.set("content-disposition", 'attachment; filename="svaraone-sound-' + String(generation.id) + '.' + extension + '"');
  }
  return new Response(object.body, { status, headers });
}

function pricing(env) {
  const number = (name, fallback) => {
    const value = Number(env[name]);
    return Number.isFinite(value) ? value : fallback;
  };
  const boolean = (name, fallback) => {
    const value = String(env[name] ?? "").trim().toLowerCase();
    if (value === "true" || value === "1" || value === "yes") return true;
    if (value === "false" || value === "0" || value === "no") return false;
    return fallback;
  };

  return {
    currency: "USD",
    billing: "annual",
    creditFactor: number("SVARAONE_CREDIT_FACTOR", 1),
    fullVoiceCatalogue: boolean("SVARAONE_FULL_VOICE_CATALOGUE", false),
    free: {
      price: 0,
      credits: number("SVARAONE_FREE_CREDITS", 5000),
      billing: "one-time",
      voices: number("SVARAONE_FREE_VOICES", 3)
    },
    plans: {
      starter: { price: number("SVARAONE_STARTER_PRICE", 120), credits: number("SVARAONE_STARTER_CREDITS", 75000), voices: number("SVARAONE_STARTER_VOICES", 10) },
      creator: { price: number("SVARAONE_CREATOR_PRICE", 240), credits: number("SVARAONE_CREATOR_CREDITS", 250000), voices: number("SVARAONE_CREATOR_VOICES", 20) },
      pro: { price: number("SVARAONE_PRO_PRICE", 480), credits: number("SVARAONE_PRO_CREDITS", 600000), voices: number("SVARAONE_PRO_VOICES", 90) },
      studio: { price: number("SVARAONE_STUDIO_PRICE", 840), credits: number("SVARAONE_STUDIO_CREDITS", 1500000), voices: number("SVARAONE_STUDIO_VOICES", 90) }
    }
  };
}

async function handleFreeTake(request, env, ctx, body, userId) {
  const generationId = String(body?.generationId || "").trim();
  const script = String(body?.text ?? "");
  if (!generationId) return json({ error: "Generation ID is required." }, 400);
  if (!script) return json({ error: "Text is required." }, 400);
  if (script.length > MAX_GENERATION_CHARS) return json({ error: `Maximum ${MAX_GENERATION_CHARS} characters per generation` }, 400);

  const generation = await env.DB.prepare(`
    SELECT id, user_id, voice_id, provider_voice_id, voice_name, script,
           speed, stability, style, format, credits_charged, is_free_take,
           take_number, status, r2_key
    FROM generations
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `).bind(generationId, userId).first();

  if (!generation) return json({ error: "Generation not found." }, 404);
  if (String(generation.script || "") !== script) return json({ error: "Free take is no longer available because the script changed." }, 409);
  if (Number(generation.is_free_take) === 1 || Number(generation.take_number) !== 1) return json({ error: "Free take has already been used." }, 409);
  if (String(generation.status || "") !== "ready") return json({ error: "Generation is not ready for another take." }, 409);
  if (!generation.r2_key) return json({ error: "Original audio storage is unavailable." }, 409);

  const claim = await env.DB.prepare(`
    UPDATE generations
    SET status = 'generating'
    WHERE id = ? AND user_id = ? AND status = 'ready'
      AND take_number = 1 AND is_free_take = 0 AND script = ?
  `).bind(generationId, userId, script).run();

  if (!claim.meta?.changes) return json({ error: "Free take is no longer available." }, 409);

  try {
    const providerRequest = new Request(request.url, {
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify({
        voiceId: String(generation.voice_id || ""),
        providerVoiceId: String(generation.provider_voice_id || ""),
        text: String(generation.script || ""),
        format: String(generation.format || "mp3"),
        speed: Number(generation.speed) || 1,
        stability: Number.isFinite(Number(generation.stability)) ? Number(generation.stability) : 50,
        style: String(generation.style || "")
      })
    });

    const response = await app.fetch(providerRequest, env, ctx);
    if (!response.ok) {
      await env.DB.prepare("UPDATE generations SET status = 'ready' WHERE id = ? AND user_id = ? AND status = 'generating'").bind(generationId, userId).run();
      return response;
    }
    if (!response.body) throw new Error("Free take response had no body");

    const audioBytes = await response.arrayBuffer();
    if (!audioBytes.byteLength) throw new Error("Free take response was empty");

    const format = String(generation.format || "mp3").toLowerCase();
    const storedObject = await env.GENERATED_AUDIO.put(generation.r2_key, audioBytes, {
      httpMetadata: {
        contentType: mimeTypeForFormat(format),
        cacheControl: "private, no-store"
      },
      customMetadata: {
        generationId,
        userId,
        voiceId: String(generation.voice_id || ""),
        providerVoiceId: String(generation.provider_voice_id || ""),
        format,
        take: "2"
      }
    });

    if (!storedObject) throw new Error("R2 did not confirm the free take upload");

    await env.DB.prepare(`
      UPDATE generations
      SET status = 'ready',
          take_number = 2,
          is_free_take = 1,
          r2_etag = ?,
          size_bytes = ?,
          completed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ? AND user_id = ? AND status = 'generating'
    `).bind(
      storedObject.etag || null,
      Number.isFinite(Number(audioBytes.byteLength)) ? Number(audioBytes.byteLength) : null,
      generationId,
      userId
    ).run();

    const headers = new Headers(response.headers);
    headers.set("X-SvaraONE-Generation-ID", generationId);
    headers.set("X-SvaraONE-Free-Take", "true");
    return new Response(audioBytes, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    try {
      await env.DB.prepare("UPDATE generations SET status = 'ready' WHERE id = ? AND user_id = ? AND status = 'generating'").bind(generationId, userId).run();
    } catch (restoreError) {
      console.error("free_take_restore_error", restoreError);
    }
    console.error("free_take_error", error);
    return json({ error: "Free take could not be saved." }, 502);
  }
}

export default {
  async fetch(request, env, ctx) {
    const authResponse = await handleAuth(request, env);
    if (authResponse) return authResponse;

    const payfastResponse = await handlePayfast(request, env);
    if (payfastResponse) return payfastResponse;

    const url = new URL(request.url);

    if (url.pathname === "/api/video/characters/generate" && request.method === "POST") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Character generation storage is not configured." }, 503);
      let body = {}; try { body = await request.json(); } catch { return json({ error: "Send character details as JSON." }, 400); }
      const projectId = String(body.projectId || "").trim(), name = String(body.name || "").trim().slice(0,100), description = String(body.description || "").trim(), notes = String(body.notes || "").trim();
      const rawPreferences = body.preferences && typeof body.preferences === "object" && !Array.isArray(body.preferences) ? body.preferences : {};
      const allowedPreferences = {
        foundation: ["Mascot / brand character","Human character","Animal character","Fantasy / imaginary being","No recurring character"],
        style: ["Cinematic 3D animation","Stylised animated film","Photorealistic live action","Illustrated / graphic","Anime-inspired","Stop-motion / handcrafted","Let SvaraFlow decide"],
        world: ["Futuristic / technology","Modern / contemporary","Natural / outdoors","Fantasy / surreal","Historical / period","Everyday / relatable","Let SvaraFlow decide"],
        mood: ["Confident and inspiring","Warm and friendly","Bold and dramatic","Playful and energetic","Calm and thoughtful","Mysterious and atmospheric","Let SvaraFlow decide"],
        rendering: ["Stylised","Semi-realistic","Photorealistic","Let SvaraFlow decide"]
      };
      const missingPreference = Object.entries(allowedPreferences).find(([key, options]) => !options.includes(String(rawPreferences[key] || "")));
      if (missingPreference) return json({ error: "Choose a valid option for " + ({foundation:"character foundation",style:"visual style",world:"world and environment",mood:"emotional tone",rendering:"character rendering"}[missingPreference[0]] || missingPreference[0]) + "." }, 400);
      const preferences = Object.fromEntries(Object.entries(allowedPreferences).map(([key]) => [key, String(rawPreferences[key])]));
      if (!projectId || !/^[a-zA-Z0-9_-]{1,80}$/.test(projectId)) return json({ error: "Save or open a valid Video project before generating characters." }, 400);
      if (!description || description.length > 1800 || notes.length > 1000 || name.length > 100) return json({ error: "Add a character description (maximum 1,800 characters) and keep the name and preservation notes within their limits." }, 400);
      const project = await env.DB.prepare("SELECT title, project_data_json FROM video_projects WHERE id=? AND user_id=? LIMIT 1").bind(projectId,userId).first();
      if (!project) return json({ error: "Save the Video project before generating character options." }, 404);
      let projectData = {};
      try { projectData = JSON.parse(project.project_data_json || "{}"); } catch {}
      // Project palette and visual notes are authoritative when present; they are not a hidden character dropdown.
      const projectFields = projectData.fields && typeof projectData.fields === "object" ? projectData.fields : {};
      preferences.palette = String(projectFields.palette?.value || "").trim().slice(0, 300) || "No saved project palette; choose one that best serves the brief.";
      preferences.projectVisualStyle = String(projectFields.visualStyle?.value || "").trim().slice(0, 160);
      preferences.projectVisualNotes = String(projectFields.visualNotes?.value || "").trim().slice(0, 1000);
      const provider = String(env.IMAGE_PROVIDER || "openai").trim().toLowerCase();
      const apiUrl = String(env.IMAGE_API_URL || "https://api.openai.com/v1/images/generations").trim();
      const apiKey = String(env.IMAGE_API_KEY || "").trim();
      const model = String(env.IMAGE_MODEL || "gpt-image-1").trim();
      const factor = Number(env.SVARAONE_CREDIT_FACTOR);
      const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : NaN;
      const modelRates = {
        "gpt-image-1": { textInputPerMillion: 5, imageOutputPerMillion: 40, mediumSquarePerImage: 0.042 },
        "gpt-image-1.5": { textInputPerMillion: 5, imageOutputPerMillion: 32, mediumSquarePerImage: 0.034 }
      };
      const rates = modelRates[model];
      if (!apiKey || !apiUrl || !Number.isFinite(safeFactor) || !rates) return json({ error: "Character generation requires IMAGE_API_KEY, IMAGE_API_URL, IMAGE_MODEL (gpt-image-1 or gpt-image-1.5), and the existing SVARAONE_CREDIT_FACTOR in Cloudflare." }, 503);
      if (provider !== "openai") return json({ error: "Character generation currently supports the OpenAI image API only." }, 503);
      if (!/^https:\/\//i.test(apiUrl)) return json({ error: "IMAGE_API_URL must use HTTPS." }, 503);
      let direction;
      try {
        direction = await composeCharacterDirection({ env, projectTitle: project.title, projectData, name, description, notes, preferences });
      } catch (error) {
        const status = Number.isInteger(error?.status) ? error.status : 502;
        console.error("character_direction_error", { status, message: String(error?.message || error).slice(0, 250) });
        return json({ error: String(error?.message || "SvaraFlow could not prepare the character direction.").slice(0, 300) }, status);
      }
      const candidatePrompts = direction.candidateDirections.map(item => [
        direction.imagePrompt,
        "Distinct candidate art direction: " + item.variation,
        "This is one image for the named candidate direction. Commit to this direction clearly; do not combine it with the other candidate directions.",
        "Preserve all core identity, project palette and must-preserve details. Show one full character, centered and clearly readable on a simple neutral studio background. No text, captions, collage, multiple views or watermark."
      ].join("\n"));
      // Reserve for all three separate image requests and their separate prompt-token usage.
      const promptTokensEstimate = candidatePrompts.reduce((total, prompt) => total + Math.ceil(prompt.length / 3), 0);
      const estimatedUsd = (3 * rates.mediumSquarePerImage) + (promptTokensEstimate * rates.textInputPerMillion / 1_000_000);
      const reservedCredits = Math.max(1, Math.ceil(estimatedUsd * safeFactor));
      if (!Number.isSafeInteger(reservedCredits)) return json({ error: "The configured credit factor produces an invalid reservation." }, 503);
      const referenceId = crypto.randomUUID(), debitId = crypto.randomUUID();
      const debit = await env.DB.prepare(`INSERT INTO credit_ledger (id,user_id,amount,balance_after,reason,reference_id,period_key)
        SELECT ?, ?, ?, balance_after - ?, 'character_image_reservation', ?, 'character_image'
        FROM credit_ledger WHERE user_id=? AND balance_after >= ? ORDER BY created_at DESC,rowid DESC LIMIT 1`).bind(debitId,userId,-reservedCredits,reservedCredits,referenceId,userId,reservedCredits).run();
      if (!debit.meta?.changes) return json({ error: "You do not have enough credits to generate three character options." }, 402);
      let refundNeeded = true;
      try {
        const generationResults = await Promise.allSettled(candidatePrompts.map(async (prompt, index) => {
          const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 90000);
          let providerResponse;
          try {
            providerResponse = await fetch(apiUrl, { method:"POST", headers:{ "content-type":"application/json", authorization:"Bearer " + apiKey }, signal:controller.signal, body:JSON.stringify({ model, prompt, n:1, size:"1024x1024", quality:"medium" }) });
          } catch (error) {
            if (error?.name === "AbortError") throw new Error("OpenAI image generation timed out for " + direction.candidateDirections[index].label + ".");
            throw error;
          } finally { clearTimeout(timeout); }
          if (!providerResponse.ok) {
            const detail = await providerResponse.text().catch(() => "");
            console.error("character_image_provider_error", { provider, status:providerResponse.status, detail:detail.slice(0,350), candidate:index+1 });
            throw Object.assign(new Error(providerResponse.status === 401 ? "The image provider rejected its API key. Check the Cloudflare secret." : "The image provider could not generate all character options. Please try again."), { status:502 });
          }
          const payload = await providerResponse.json();
          const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.images) ? payload.images : [];
          const item = items[0];
          const imageUrl = typeof item?.b64_json === "string" && item.b64_json ? "data:image/png;base64," + item.b64_json :
            typeof item?.url === "string" && item.url.startsWith("https://") ? item.url :
            typeof item?.image_url === "string" && item.image_url.startsWith("https://") ? item.image_url : "";
          if (!imageUrl) throw new Error("OpenAI did not return a usable image for " + direction.candidateDirections[index].label + ".");
          const usage = payload.usage || {};
          const inputTextTokens = Number(usage.input_tokens_details?.text_tokens ?? usage.input_tokens);
          const outputImageTokens = Number(usage.output_tokens_details?.image_tokens ?? usage.output_tokens);
          if (!Number.isFinite(inputTextTokens) || inputTextTokens < 0 || !Number.isFinite(outputImageTokens) || outputImageTokens <= 0) {
            throw new Error("OpenAI did not return the usage details required to calculate actual generation cost. No credits were charged.");
          }
          return { imageUrl, label:direction.candidateDirections[index].label, direction:direction.candidateDirections[index].variation, inputTextTokens, outputImageTokens };
        }));
        const failedGeneration = generationResults.find(result => result.status === "rejected");
        if (failedGeneration) throw failedGeneration.reason;
        const generated = generationResults.map(result => result.value);
        const inputTextTokens = generated.reduce((total, item) => total + item.inputTextTokens, 0);
        const outputImageTokens = generated.reduce((total, item) => total + item.outputImageTokens, 0);
        const actualUsd = (inputTextTokens * rates.textInputPerMillion + outputImageTokens * rates.imageOutputPerMillion) / 1_000_000;
        const actualCredits = Math.max(1, Math.ceil(actualUsd * safeFactor));
        const settleDelta = reservedCredits - actualCredits;
        let balance = await env.DB.prepare("SELECT balance_after FROM credit_ledger WHERE id=?").bind(debitId).first("balance_after");
        if (settleDelta > 0) {
          const settled = await env.DB.prepare(`INSERT INTO credit_ledger (id,user_id,amount,balance_after,reason,reference_id,period_key)
            SELECT ?, ?, ?, balance_after + ?, 'character_image_cost_adjustment', ?, 'character_image'
            FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1`).bind(crypto.randomUUID(),userId,settleDelta,settleDelta,referenceId,userId).run();
          if (!settled.meta?.changes) throw new Error("Could not reconcile the character-generation credit reservation.");
          balance = await env.DB.prepare("SELECT balance_after FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1").bind(userId).first("balance_after");
        } else if (settleDelta < 0) {
          const extra = -settleDelta;
          const settled = await env.DB.prepare(`INSERT INTO credit_ledger (id,user_id,amount,balance_after,reason,reference_id,period_key)
            SELECT ?, ?, ?, balance_after - ?, 'character_image_cost_adjustment', ?, 'character_image'
            FROM credit_ledger WHERE user_id=? AND balance_after >= ? ORDER BY created_at DESC,rowid DESC LIMIT 1`).bind(crypto.randomUUID(),userId,-extra,extra,referenceId,userId,extra).run();
          if (!settled.meta?.changes) throw new Error("The actual generation cost exceeded the reservation and there are not enough credits to settle it.");
          balance = await env.DB.prepare("SELECT balance_after FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1").bind(userId).first("balance_after");
        }
        refundNeeded = false;
        return json({
          ok:true,
          candidates:generated.map(({imageUrl,label,direction:variation})=>({imageUrl,label,direction:variation})),
          directionSummary:direction.directionSummary,
          creditsRemaining:Number(balance?.balance_after ?? balance ?? 0),
          creditsCharged:actualCredits,
          provider,
          model,
          directionModel:direction.model
        });
      } catch(error) {
        if (refundNeeded) {
          try {
            await env.DB.prepare(`INSERT INTO credit_ledger (id,user_id,amount,balance_after,reason,reference_id,period_key)
              SELECT ?, ?, ?, balance_after + ?, 'character_image_refund', ?, 'character_image'
              FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1`).bind(crypto.randomUUID(),userId,reservedCredits,reservedCredits,referenceId,userId).run();
          } catch(refundError) { console.error("character_image_refund_error",refundError); }
        }
        const status = Number.isInteger(error?.status) ? error.status : 502;
        console.error("character_image_generation_error", { message:String(error?.message || error).slice(0,250) });
        return json({ error:String(error?.message || "Character generation failed. Your credits have been refunded.").slice(0,300) }, status);
      }
    }

    if (url.pathname === "/api/video/characters/approve" && request.method === "POST") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Character storage is not configured." }, 503);
      let body = {}; try { body = await request.json(); } catch { return json({ error: "Send character details as JSON." }, 400); }
      const projectId=String(body.projectId||"").trim(),name=String(body.name||"").trim().slice(0,100),description=String(body.description||"").trim(),notes=String(body.notes||"").trim(),imageData=String(body.imageData||"");
      if (!projectId || !/^[a-zA-Z0-9_-]{1,80}$/.test(projectId)) return json({error:"A valid Video project is required."},400);
      if (!description || description.length>1800 || notes.length>1000) return json({error:"The character description or notes are invalid."},400);
      const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(imageData);
      if (!match || imageData.length>18_000_000) return json({error:"Select one of the generated image options before approving."},400);
      const project=await env.DB.prepare("SELECT project_data_json FROM video_projects WHERE id=? AND user_id=? LIMIT 1").bind(projectId,userId).first();
      if(!project)return json({error:"Project not found."},404);
      const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
      if(!bytes.length||bytes.length>12*1024*1024)return json({error:"The selected character image is too large."},413);
      let data={};try{data=JSON.parse(project.project_data_json||"{}")}catch{}
      const id=crypto.randomUUID(),extension=match[1]==="jpeg"?"jpg":match[1],key="users/"+userId+"/video-projects/"+projectId+"/characters/"+id+"."+extension;
      await env.GENERATED_AUDIO.put(key,bytes,{httpMetadata:{contentType:"image/"+match[1],cacheControl:"private, no-store"},customMetadata:{userId,projectId,assetKind:"character",assetId:id}});
      const character={id,name:name||"Untitled character",description,notes,key,type:"image/"+match[1],approvedAt:new Date().toISOString()};
      const characters=Array.isArray(data.characters)?data.characters:[];
      characters.push(character);data.characters=characters;
      const saved=await env.DB.prepare("UPDATE video_projects SET project_data_json=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND user_id=?").bind(JSON.stringify(data),projectId,userId).run();
      if(!saved.meta?.changes){await env.GENERATED_AUDIO.delete(key);return json({error:"The approved character could not be saved to the project."},500);}
      return json({ok:true,character:{id,name:character.name,description,notes,approvedAt:character.approvedAt}});
    }

    if (request.method === "POST" && url.pathname === "/api/video/refine") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      let body = {};
      try { body = await request.json(); } catch { return json({ error: "Send refinement details as JSON." }, 400); }
      try { return json(await createVideoRefinement(body, env)); }
      catch (error) {
        const status = Number.isInteger(error?.status) ? error.status : 502;
        console.error("video_refinement_error", { status, message: String(error?.message || "Refinement failed").slice(0, 300) });
        return json({ error: String(error?.message || "Creative refinement failed. Please try again.").slice(0, 300) }, status);
      }
    }

    if (url.pathname === "/api/video/projects" && request.method === "GET") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Video project storage is not configured." }, 503);
      try {
        const rows = await env.DB.prepare(`SELECT id, title, current_stage, approved_stages_json, created_at, updated_at FROM video_projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100`).bind(userId).all();
        return json({ ok: true, projects: (rows.results || []).map(row => {
          let approvedStages = [];
          try { approvedStages = JSON.parse(row.approved_stages_json || "[]"); } catch {}
          return { id: row.id, title: row.title, currentStage: row.current_stage, approvedStages, createdAt: row.created_at, updatedAt: row.updated_at };
        }) });
      } catch (error) { console.error("video_projects_list_error", error); return json({ error: "Saved Video projects could not be listed." }, 500); }
    }
    const videoBrandAssetMatch = url.pathname.match(/^\/api\/video\/projects\/([a-zA-Z0-9_-]+)\/brand-assets\/(logo|reference)$/);
    if (videoBrandAssetMatch && ["POST","GET","DELETE"].includes(request.method)) {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Brand Kit storage is not configured." }, 503);
      const projectId = videoBrandAssetMatch[1], kind = videoBrandAssetMatch[2];
      try {
        const project = await env.DB.prepare("SELECT id, project_data_json FROM video_projects WHERE id = ? AND user_id = ? LIMIT 1").bind(projectId, userId).first();
        if (!project) return json({ error: "Project not found." }, 404);
        let data = {}; try { data = JSON.parse(project.project_data_json || "{}"); } catch {}
        const assets = data.brandAssets && typeof data.brandAssets === "object" ? data.brandAssets : {};
        const prefix = "users/" + userId + "/video-projects/" + projectId + "/brand-assets/" + kind + "/";
        if (request.method === "POST") {
          const form = await request.formData(), file = form.get("file");
          if (!(file instanceof File) || !file.size) return json({ error: "Choose a non-empty image file." }, 400);
          if (file.size > 10 * 1024 * 1024) return json({ error: "Brand images must be 10 MB or smaller." }, 413);
          const allowed = kind === "logo" ? new Set(["image/png","image/jpeg","image/webp","image/svg+xml"]) : new Set(["image/png","image/jpeg","image/webp"]);
          const contentType = String(file.type || "").toLowerCase();
          if (!allowed.has(contentType)) return json({ error: "This image type is not supported." }, 415);
          const name = String(file.name || (kind + ".img")).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120) || (kind + ".img");
          const id = crypto.randomUUID(), key = prefix + id + "-" + name.replace(/\s+/g, "_");
          await env.GENERATED_AUDIO.put(key, file.stream(), { httpMetadata: { contentType }, customMetadata: { userId, projectId, assetKind: kind, assetId: id, originalName: name } });
          const previous = assets[kind];
          assets[kind] = { id, kind, name, size: file.size, type: contentType, key, uploadedAt: new Date().toISOString() };
          data.brandAssets = assets;
          const saved = await env.DB.prepare("UPDATE video_projects SET project_data_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ?").bind(JSON.stringify(data), projectId, userId).run();
          if (!saved.meta?.changes) { await env.GENERATED_AUDIO.delete(key); return json({ error: "Brand asset metadata could not be saved." }, 500); }
          if (previous?.key && previous.key.startsWith(prefix)) await env.GENERATED_AUDIO.delete(previous.key);
          return json({ ok: true, asset: assets[kind] });
        }
        const asset = assets[kind];
        if (!asset || typeof asset.key !== "string" || !asset.key.startsWith(prefix)) return json({ error: "Brand asset not found." }, 404);
        if (request.method === "DELETE") {
          await env.GENERATED_AUDIO.delete(asset.key);
          delete assets[kind]; data.brandAssets = assets;
          const saved = await env.DB.prepare("UPDATE video_projects SET project_data_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ?").bind(JSON.stringify(data), projectId, userId).run();
          if (!saved.meta?.changes) return json({ error: "Brand asset metadata could not be updated." }, 500);
          return json({ ok: true, kind });
        }
        const object = await env.GENERATED_AUDIO.get(asset.key);
        if (!object) return json({ error: "The stored brand image could not be found." }, 404);
        const headers = new Headers(); object.writeHttpMetadata(headers);
        headers.set("content-type", asset.type || "application/octet-stream");
        headers.set("content-disposition", "inline; filename*=UTF-8''" + encodeURIComponent(asset.name || (kind + ".img")));
        headers.set("cache-control", "private, no-store");
        return new Response(object.body, { headers });
      } catch (error) {
        console.error("video_brand_asset_error", { message: String(error?.message || error).slice(0, 240) });
        return json({ error: "Brand asset operation failed." }, 500);
      }
    }

    const videoReferenceMatch = url.pathname.match(/^\/api\/video\/projects\/([a-zA-Z0-9_-]+)\/references(?:\/([a-zA-Z0-9_-]+))?$/);
    if (videoReferenceMatch && ["POST","GET","DELETE"].includes(request.method)) {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Video reference storage is not configured." }, 503);
      const projectId = videoReferenceMatch[1], assetId = videoReferenceMatch[2] || "";
      try {
        const project = await env.DB.prepare("SELECT id, project_data_json FROM video_projects WHERE id = ? AND user_id = ? LIMIT 1").bind(projectId, userId).first();
        if (!project) return json({ error: "Project not found." }, 404);
        let data = {}; try { data = JSON.parse(project.project_data_json || "{}"); } catch {}
        const references = Array.isArray(data.discoveryReferences) ? data.discoveryReferences : [];
        if (request.method === "POST") {
          if (assetId) return json({ error: "Invalid reference upload route." }, 404);
          const form = await request.formData(), file = form.get("file");
          if (!(file instanceof File) || !file.size) return json({ error: "Choose a non-empty reference file." }, 400);
          if (file.size > 10 * 1024 * 1024) return json({ error: "Each reference file must be 10 MB or smaller." }, 413);
          const name = String(file.name || "reference").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120) || "reference";
          const extension = (name.split(".").pop() || "").toLowerCase();
          if (!new Set(["pdf","doc","docx","txt","md","ppt","pptx","png","jpg","jpeg","webp"]).has(extension)) return json({ error: "This reference file type is not supported." }, 415);
          const id = crypto.randomUUID(), key = "video-project-assets/" + userId + "/" + projectId + "/references/" + id + "-" + name.replace(/\s+/g, "_");
          const contentType = String(file.type || "application/octet-stream").slice(0, 120);
          await env.GENERATED_AUDIO.put(key, file.stream(), { httpMetadata: { contentType }, customMetadata: { userId, projectId, assetId: id, originalName: name } });
          return json({ ok: true, reference: { id, name, size: file.size, type: contentType, key, uploadedAt: new Date().toISOString() } });
        }
        const reference = references.find(item => item && item.id === assetId && typeof item.key === "string" && item.key.startsWith("video-project-assets/" + userId + "/" + projectId + "/references/"));
        if (!reference) return json({ error: "Reference file not found." }, 404);
        if (request.method === "DELETE") {
          await env.GENERATED_AUDIO.delete(reference.key);
          data.discoveryReferences = references.filter(item => item.id !== assetId);
          const updated = await env.DB.prepare("UPDATE video_projects SET project_data_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ?").bind(JSON.stringify(data), projectId, userId).run();
          if (!updated.meta?.changes) return json({ error: "Reference file metadata could not be updated." }, 500);
          return json({ ok: true, id: assetId });
        }
        const object = await env.GENERATED_AUDIO.get(reference.key);
        if (!object) return json({ error: "The stored reference file could not be found." }, 404);
        const headers = new Headers(); object.writeHttpMetadata(headers);
        headers.set("content-type", reference.type || "application/octet-stream");
        headers.set("content-disposition", "attachment; filename*=UTF-8''" + encodeURIComponent(reference.name || "reference"));
        headers.set("cache-control", "private, no-store");
        return new Response(object.body, { headers });
      } catch (error) { console.error("video_reference_error", { message: String(error?.message || error).slice(0, 240) }); return json({ error: "Video reference file operation failed." }, 500); }
    }

    const videoProjectMatch = url.pathname.match(/^\/api\/video\/projects\/(?!current$)([a-zA-Z0-9_-]+)$/);
    if (videoProjectMatch && (request.method === "GET" || request.method === "DELETE")) {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Video project storage is not configured." }, 503);
      const id = videoProjectMatch[1];
      if (request.method === "DELETE") {
        try {
          const existing = await env.DB.prepare("SELECT id FROM video_projects WHERE id = ? AND user_id = ? LIMIT 1").bind(id, userId).first();
          if (!existing) return json({ error: "Project not found or you do not have permission to delete it." }, 404);
          if (env.GENERATED_AUDIO) {
            for (const prefix of ["video-project-assets/" + userId + "/" + id + "/references/", "users/" + userId + "/video-projects/" + id + "/brand-assets/"]) {
              let cursor;
              do {
                const page = await env.GENERATED_AUDIO.list({ prefix, cursor, limit: 1000 });
                if (page.objects?.length) await env.GENERATED_AUDIO.delete(page.objects.map(object => object.key));
                cursor = page.truncated ? page.cursor : undefined;
              } while (cursor);
            }
          }
          const result = await env.DB.prepare("DELETE FROM video_projects WHERE id = ? AND user_id = ?").bind(id, userId).run();
          if (!result.meta?.changes) return json({ error: "Project could not be deleted." }, 500);
          return json({ ok: true, id });
        } catch (error) { console.error("video_project_delete_error", error); return json({ error: "The Video project could not be deleted." }, 500); }
      }
      try {
        const row = await env.DB.prepare("SELECT id, title, current_stage, approved_stages_json, project_data_json, created_at, updated_at FROM video_projects WHERE id = ? AND user_id = ? LIMIT 1").bind(id, userId).first();
        if (!row) return json({ error: "Project not found." }, 404);
        let projectData = {}, approvedStages = [];
        try { projectData = JSON.parse(row.project_data_json || "{}"); } catch {}
        try { approvedStages = JSON.parse(row.approved_stages_json || "[]"); } catch {}
        // Repair legacy projects whose Brand Kit metadata was lost by an older
        // autosave: recover the matching objects from R2's authoritative prefix.
        if (env.GENERATED_AUDIO) {
          const assets = projectData.brandAssets && typeof projectData.brandAssets === "object" ? projectData.brandAssets : {};
          let repaired = false;
          for (const kind of ["logo", "reference"]) {
            if (assets[kind]?.key) continue;
            const prefix = "users/" + userId + "/video-projects/" + row.id + "/brand-assets/" + kind + "/";
            const page = await env.GENERATED_AUDIO.list({ prefix, limit: 100 });
            const candidate = (page.objects || []).filter(object =>
              object.customMetadata?.userId === userId &&
              object.customMetadata?.projectId === row.id &&
              object.customMetadata?.assetKind === kind
            ).sort((a, b) => String(b.uploaded || "").localeCompare(String(a.uploaded || "")))[0];
            if (!candidate) continue;
            assets[kind] = {
              id: candidate.customMetadata.assetId || candidate.key.split("/").pop().split("-")[0],
              kind,
              name: candidate.customMetadata.originalName || candidate.key.split("/").pop(),
              size: candidate.size,
              type: candidate.httpMetadata?.contentType || (kind === "logo" ? "image/png" : "image/png"),
              key: candidate.key,
              uploadedAt: candidate.uploaded ? new Date(candidate.uploaded).toISOString() : null
            };
            repaired = true;
          }
          if (repaired) {
            projectData.brandAssets = assets;
            await env.DB.prepare("UPDATE video_projects SET project_data_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ?")
              .bind(JSON.stringify(projectData), row.id, userId).run();
          }
        }
        return json({ ok: true, project: { id: row.id, title: row.title, currentStage: row.current_stage, approvedStages, data: projectData, createdAt: row.created_at, updatedAt: row.updated_at } });
      } catch (error) { console.error("video_project_open_error", error); return json({ error: "The saved Video project could not be opened." }, 500); }
    }

    if ((request.method === "GET" || request.method === "PUT") && url.pathname === "/api/video/projects/current") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Video project storage is not configured." }, 503);
      if (request.method === "GET") {
        try {
          const row = await env.DB.prepare(`
            SELECT id, title, current_stage, approved_stages_json, project_data_json, created_at, updated_at
            FROM video_projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1
          `).bind(userId).first();
          if (!row) return json({ ok: true, project: null });
          let projectData = {}, approvedStages = [];
          try { projectData = JSON.parse(row.project_data_json || "{}"); } catch {}
          try { approvedStages = JSON.parse(row.approved_stages_json || "[]"); } catch {}
          return json({ ok: true, project: { id: row.id, title: row.title, currentStage: row.current_stage, approvedStages, data: projectData, createdAt: row.created_at, updatedAt: row.updated_at } });
        } catch (error) {
          console.error("video_project_load_error", error);
          return json({ error: "The saved Video project could not be loaded." }, 500);
        }
      }
      let body = {};
      try { body = await request.json(); } catch { return json({ error: "Send project data as JSON." }, 400); }
      const id = String(body.id || "").trim();
      const currentStage = Number(body.currentStage);
      const title = String(body.title || "Untitled video project").trim().slice(0, 180) || "Untitled video project";
      const approvedStages = Array.isArray(body.approvedStages) ? [...new Set(body.approvedStages.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].sort((a,b)=>a-b) : [];
      const projectData = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : null;
      if (!id || id.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(id)) return json({ error: "A valid project ID is required." }, 400);
      if (!Number.isInteger(currentStage) || currentStage < 0 || currentStage > 6) return json({ error: "The current workflow stage is invalid." }, 400);
      if (!projectData) return json({ error: "Project data is missing or invalid." }, 400);
      const approvedJson = JSON.stringify(approvedStages);
      try {
        // Brand Kit metadata is managed by the dedicated R2 upload/delete routes.
        // Preserve it from the latest D1 row so a concurrent ordinary autosave
        // cannot overwrite an upload that completed moments earlier.
        const existingProject = await env.DB.prepare(
          "SELECT project_data_json FROM video_projects WHERE id = ? AND user_id = ? LIMIT 1"
        ).bind(id, userId).first();
        let existingData = {};
        try { existingData = JSON.parse(existingProject?.project_data_json || "{}"); } catch {}
        if (existingData.brandAssets && typeof existingData.brandAssets === "object") {
          projectData.brandAssets = {
            ...existingData.brandAssets,
            ...(projectData.brandAssets && typeof projectData.brandAssets === "object" ? projectData.brandAssets : {})
          };
          for (const kind of ["logo", "reference"]) {
            const savedAsset = existingData.brandAssets[kind];
            const incomingAsset = projectData.brandAssets?.[kind];
            // An empty/stale client snapshot must not erase a valid server asset.
            if (savedAsset?.key && (!incomingAsset || !incomingAsset.key)) projectData.brandAssets[kind] = savedAsset;
          }
        }
        // Character images and profiles are persisted by the dedicated approval route.
        // Preserve these server-owned assets when the regular workspace autosaves.
        if (Array.isArray(existingData.characters)) {
          projectData.characters = existingData.characters;
        }
        const projectDataJson = JSON.stringify(projectData);
        if (projectDataJson.length > 180000) return json({ error: "This project is too large to save. Reduce the amount of text or remove unsupported file data." }, 413);
        const result = await env.DB.prepare(`
          INSERT INTO video_projects (id, user_id, title, current_stage, approved_stages_json, project_data_json)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            current_stage = excluded.current_stage,
            approved_stages_json = excluded.approved_stages_json,
            project_data_json = excluded.project_data_json,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE video_projects.user_id = excluded.user_id
        `).bind(id, userId, title, currentStage, approvedJson, projectDataJson).run();
        if (!result.meta?.changes) {
          const existing = await env.DB.prepare("SELECT id FROM video_projects WHERE id = ?").bind(id).first();
          if (existing) return json({ error: "This project cannot be updated from the current account." }, 403);
        }
        const saved = await env.DB.prepare("SELECT updated_at FROM video_projects WHERE id = ? AND user_id = ?").bind(id, userId).first();
        if (!saved) return json({ error: "The Video project could not be saved." }, 500);
        return json({ ok: true, id, updatedAt: saved.updated_at });
      } catch (error) {
        console.error("video_project_save_error", error);
        return json({ error: "The Video project could not be saved. Your current work is still open; please retry." }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/video/discovery") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      let body = {};
      try { body = await request.json(); } catch { return json({ error: "Send discovery details as JSON." }, 400); }
      try {
        const result = await createVideoDiscovery(body, env);
        return json(result);
      } catch (error) {
        const status = Number.isInteger(error?.status) ? error.status : 502;
        console.error("video_discovery_error", { status, message: String(error?.message || "Discovery failed").slice(0, 300) });
        return json({ error: String(error?.message || "Creative Discovery failed. Please try again.").slice(0, 300) }, status);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/compositions/export") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.GENERATED_AUDIO) return json({ error: "Composition storage is not configured." }, 503);
      if (!env.DB) return json({ error: "Credit accounting is not configured." }, 503);
      const exportCost = composeExportCreditCost(env);
      if (exportCost === null) return json({ error: "Compose export credit pricing is missing or invalid. Configure SVARAONE_COMPOSE_EXPORT_CREDITS as a positive integer." }, 503);

      const contentType = String(request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      const format = String(request.headers.get("x-svara-composition-format") || "").trim().toLowerCase();
      const expectedTypes = { wav: "audio/wav", mp3: "audio/mpeg", pcm: "audio/l16" };
      const extensionByFormat = { wav: "wav", mp3: "mp3", pcm: "pcm" };
      if (!expectedTypes[format] || contentType !== expectedTypes[format]) {
        return json({ error: "Select a supported matching export format: WAV, MP3 or PCM." }, 415);
      }
      if (!request.body) return json({ error: "Composition audio is required." }, 400);

      const declaredSize = Number(request.headers.get("x-svara-composition-size") || request.headers.get("content-length") || 0);
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (!Number.isInteger(declaredSize) || declaredSize < 4) return json({ error: "A valid audio byte length is required." }, 400);
      if (contentLength > 0 && contentLength !== declaredSize) return json({ error: "Audio content length does not match the declared export size." }, 400);
      if (declaredSize > 80000000) return json({ error: "Composition export exceeds the current 80 MB limit." }, 413);
      const durationSeconds = Number(request.headers.get("x-svara-composition-duration") || 0);
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 420) {
        return json({ error: "Composition duration must be greater than zero and no longer than 7 minutes." }, 400);
      }
      const trackCount = Number(request.headers.get("x-svara-composition-track-count") || 0);
      if (!Number.isInteger(trackCount) || trackCount < 1 || trackCount > 100) {
        return json({ error: "Composition track count is invalid." }, 400);
      }

      const requestedFilename = String(request.headers.get("x-svara-composition-filename") || "")
        .replace(/[\\/]/g, "")
        .replace(/[^a-zA-Z0-9 _().-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[. ]+$/g, "");
      const baseFilename = requestedFilename.replace(/\.(wav|mp3|pcm)$/i, "").trim().slice(0, 120);
      if (!baseFilename || baseFilename === "." || baseFilename === "..") {
        return json({ error: "A valid composition filename is required." }, 400);
      }
      const extension = extensionByFormat[format];
      const filename = baseFilename + "." + extension;
      const id = crypto.randomUUID();
      const requestKey = String(request.headers.get("x-svara-compose-export-key") || "").trim();
      if (!/^[a-f0-9-]{36}$/i.test(requestKey)) return json({ error: "A valid export attempt key is required. Please retry the export." }, 400);
      const referenceId = requestKey;
      const key = "users/" + userId + "/compositions/" + id + "." + extension;
      const createdAt = new Date().toISOString();
      if (format === "pcm" && (declaredSize % 4 !== 0 || Math.abs(durationSeconds - declaredSize / 96000) > 0.02)) {
        return json({ error: "PCM byte length does not match 24 kHz, 16-bit stereo audio duration." }, 400);
      }

      const reservation = await reserveComposeExportCredits(userId, exportCost, env, referenceId).catch(error => {
        console.error("compose_export_credit_reservation_error", error);
        return { error };
      });
      if (reservation?.error) return json({ error: "Compose export credits could not be reserved. No export was saved." }, 503);
      if (!reservation) return json({ error: "Not enough credits to export this composition.", creditsRequired: exportCost }, 402);
      if (reservation.alreadyCharged) return json({ error: "This export attempt has already been charged. Refresh Composition History before starting a new export." }, 409);

      try {
        let receivedBytes = 0;
        const firstBytes = new Uint8Array(44);
        let firstBytesLength = 0;
        let formatChecked = format === "pcm";
        const validatedAudioBody = request.body.pipeThrough(new TransformStream({
          transform(chunk, controller) {
            receivedBytes += chunk.byteLength;
            if (receivedBytes > 80000000) throw new Error("COMPOSITION_EXPORT_TOO_LARGE");
            if (firstBytesLength < firstBytes.length) {
              const take = Math.min(firstBytes.length - firstBytesLength, chunk.byteLength);
              firstBytes.set(chunk.subarray(0, take), firstBytesLength);
              firstBytesLength += take;
            }
            if (!formatChecked && format === "wav" && firstBytesLength >= 44) {
              const header = new DataView(firstBytes.buffer);
              const textAt = (offset, length) => String.fromCharCode(...firstBytes.subarray(offset, offset + length));
              const dataLength = header.getUint32(40, true);
              const wavDurationSeconds = dataLength / (44100 * 4);
              if (
                textAt(0, 4) !== "RIFF" ||
                textAt(8, 4) !== "WAVE" ||
                textAt(12, 4) !== "fmt " ||
                header.getUint32(16, true) !== 16 ||
                header.getUint16(20, true) !== 1 ||
                header.getUint16(22, true) !== 2 ||
                header.getUint32(24, true) !== 44100 ||
                header.getUint16(34, true) !== 16 ||
                textAt(36, 4) !== "data" ||
                dataLength < 4 ||
                dataLength % 4 !== 0 ||
                Math.abs(durationSeconds - wavDurationSeconds) > 0.02
              ) throw new Error("INVALID_COMPOSITION_WAV");
              formatChecked = true;
            }
            if (!formatChecked && format === "mp3" && firstBytesLength >= 3) {
              const isId3 = firstBytes[0] === 0x49 && firstBytes[1] === 0x44 && firstBytes[2] === 0x33;
              const isMpegFrame = firstBytes[0] === 0xff && (firstBytes[1] & 0xe0) === 0xe0;
              if (!isId3 && !isMpegFrame) throw new Error("INVALID_COMPOSITION_MP3");
              formatChecked = true;
            }
            controller.enqueue(chunk);
          },
          flush() {
            if (receivedBytes !== declaredSize) throw new Error("INVALID_COMPOSITION_LENGTH");
            if (format === "wav") {
              const header = new DataView(firstBytes.buffer);
              if (
                !formatChecked ||
                receivedBytes !== 44 + header.getUint32(40, true) ||
                receivedBytes !== 8 + header.getUint32(4, true)
              ) throw new Error("INVALID_COMPOSITION_WAV");
            } else if (format === "mp3") {
              if (!formatChecked || receivedBytes < 100) throw new Error("INVALID_COMPOSITION_MP3");
            } else if (format === "pcm") {
              if (receivedBytes % 4 !== 0 || Math.abs(durationSeconds - receivedBytes / 96000) > 0.02) {
                throw new Error("INVALID_COMPOSITION_PCM");
              }
            }
          }
        }));
        const fixedLengthAudio = new FixedLengthStream(declaredSize);
        const storedPromise = env.GENERATED_AUDIO.put(key, fixedLengthAudio.readable, {
          httpMetadata: {
            contentType: format === "wav" ? "audio/wav" : format === "mp3" ? "audio/mpeg" : "audio/l16;rate=24000;channels=2",
            cacheControl: "private, no-store"
          },
          customMetadata: {
            compositionExportId: id,
            userId,
            filename,
            format,
            durationSeconds: String(durationSeconds),
            trackCount: String(trackCount),
            sampleRate: format === "pcm" ? "24000" : "44100",
            channels: "2",
            createdAt
          }
        });
        const validationPromise = validatedAudioBody.pipeTo(fixedLengthAudio.writable);
        const [stored] = await Promise.all([storedPromise, validationPromise.then(() => null)]);
        if (!stored) throw new Error("R2 did not confirm the Composition upload.");
        if (Number(stored.size) !== declaredSize) {
          await env.GENERATED_AUDIO.delete(key);
          try { if (!reservation.alreadyCharged) await refundComposeExportCredits(userId, reservation.cost, referenceId, env); }
          catch (refundError) { console.error("compose_export_size_mismatch_refund_error", refundError); }
          return json({ error: "Uploaded audio size did not match the declared content length. Credits were refunded if the reservation was recorded." }, 400);
        }
        const remainingRow = await env.DB.prepare(
          "SELECT balance_after FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC, rowid DESC LIMIT 1"
        ).bind(userId).first();
        return json({
          success: true,
          creditsCharged: reservation.cost,
          creditsRemaining: Number(remainingRow?.balance_after ?? reservation.balance ?? 0),
          id,
          filename,
          format: format.toUpperCase(),
          mimeType: format === "wav" ? "audio/wav" : format === "mp3" ? "audio/mpeg" : "audio/l16;rate=24000;channels=2",
          durationSeconds,
          trackCount,
          sizeBytes: Number(stored.size),
          createdAt,
          assetUrl: "/api/compositions/assets/" + id
        });
      } catch (error) {
        try { await env.GENERATED_AUDIO.delete(key); } catch (cleanupError) { console.error("composition_export_cleanup_error", cleanupError); }
        try {
          if (!reservation.alreadyCharged) await refundComposeExportCredits(userId, reservation.cost, referenceId, env);
        } catch (refundError) {
          console.error("compose_export_credit_refund_error", refundError);
        }
        if (error?.message === "COMPOSITION_EXPORT_TOO_LARGE") return json({ error: "Composition export exceeds the current 80 MB limit." }, 413);
        if (error?.message === "INVALID_COMPOSITION_WAV") return json({ error: "The uploaded file is not a complete supported PCM WAV." }, 400);
        if (error?.message === "INVALID_COMPOSITION_MP3") return json({ error: "The uploaded file is not a valid MP3 stream." }, 400);
        if (error?.message === "INVALID_COMPOSITION_PCM") return json({ error: "The uploaded file is not a complete supported PCM stream." }, 400);
        if (error?.message === "INVALID_COMPOSITION_LENGTH") return json({ error: "Uploaded audio size did not match the declared content length." }, 400);
        console.error("composition_export_storage_error", error);
        return json({ error: "Composition could not be saved to R2. No saved asset was confirmed." }, 502);
      }
    }

    if (request.method === "GET" && url.pathname === "/api/compositions") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.GENERATED_AUDIO) return json({ error: "Composition storage is not configured." }, 503);
      try {
        const requestedLimit = Number(url.searchParams.get("limit") || 100);
        const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 100;
        const search = String(url.searchParams.get("search") || "").trim().toLowerCase();
        const prefix = "users/" + userId + "/compositions/";
        const candidates = [];
        let cursor;
        let scanned = 0;
        do {
          const page = await env.GENERATED_AUDIO.list({
            prefix,
            limit: Math.min(1000, Math.max(1, 1000 - scanned)),
            include: ["httpMetadata", "customMetadata"],
            ...(cursor ? { cursor } : {})
          });
          candidates.push(...(page.objects || []).filter(object => /\.(wav|mp3|pcm)$/i.test(String(object.key || ""))));
          scanned += (page.objects || []).length;
          if (!page.truncated || !page.cursor || scanned >= 1000) break;
          cursor = page.cursor;
        } while (scanned < 1000);

        const displayNameRows = await env.DB.prepare("SELECT composition_id,display_name FROM composition_display_names WHERE user_id=?").bind(userId).all();
        const displayNames = new Map((displayNameRows.results || []).map(row => [String(row.composition_id), String(row.display_name || "")]));
        const assignmentRows = await env.DB.prepare("SELECT composition_id,folder_id FROM composition_folder_assignments WHERE user_id=?").bind(userId).all();
        const folderAssignments = new Map((assignmentRows.results || []).map(row => [String(row.composition_id), String(row.folder_id || "")]));
        const folderIds = [...new Set([...folderAssignments.values()].filter(Boolean))];
        const folderNames = new Map();
        if (folderIds.length) {
          const placeholders = folderIds.map(() => "?").join(",");
          const folderRows = await env.DB.prepare("SELECT id,name FROM library_folders WHERE user_id=? AND id IN (" + placeholders + ")").bind(userId, ...folderIds).all();
          for (const row of folderRows.results || []) folderNames.set(String(row.id), String(row.name));
        }

        const compositions = candidates.map(object => {
          const key = String(object.key || "");
          const filenameFromKey = key.split("/").pop() || "";
          const extension = filenameFromKey.split(".").pop()?.toLowerCase() || "wav";
          const id = filenameFromKey.slice(0, -(extension.length + 1));
          const meta = object.customMetadata || {};
          const compositionId = String(meta.compositionExportId || id);
          const displayName = displayNames.get(compositionId) || "";
          const filename = displayName ? displayName + "." + extension : String(meta.filename || filenameFromKey);
          return {
            id: compositionId,
            filename,
            format: String(meta.format || extension).toUpperCase(),
            mimeType: String(object.httpMetadata?.contentType || (extension === "mp3" ? "audio/mpeg" : extension === "pcm" ? "audio/l16;rate=24000;channels=2" : "audio/wav")),
            durationSeconds: Number(meta.durationSeconds) || 0,
            trackCount: Number(meta.trackCount) || 0,
            sizeBytes: Number(object.size) || 0,
            createdAt: String(meta.createdAt || object.uploaded?.toISOString?.() || ""),
            folderId: folderAssignments.get(String(meta.compositionExportId || id)) || null,
            folderName: folderNames.get(folderAssignments.get(String(meta.compositionExportId || id)) || "") || null,
            assetUrl: "/api/compositions/assets/" + id
          };
        }).filter(item => {
          if (!search) return true;
          return (item.filename + " " + item.format).toLowerCase().includes(search);
        }).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)).slice(0, limit);

        return json({ compositions, count: compositions.length, limit });
      } catch (error) {
        console.error("composition_list_error", error);
        return json({ error: "Could not load saved compositions." }, 500);
      }
    }


    
    if (url.pathname.startsWith("/api/compositions/drafts/") && url.pathname.endsWith("/complete") && request.method === "POST") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Composition draft storage is not configured." }, 503);
      const parts = url.pathname.split("/");
      const draftId = String(parts[parts.length - 2] || "");
      if (!/^[0-9a-f-]{36}$/i.test(draftId)) return json({ error: "Composition draft not found." }, 404);
      let payload;
      try { payload = await request.json(); } catch { return json({ error: "A valid composition ID is required." }, 400); }
      const compositionId = String(payload?.compositionId || "");
      if (!/^[0-9a-f-]{36}$/i.test(compositionId)) return json({ error: "A valid composition ID is required." }, 400);
      try {
        const ownedExport = await env.GENERATED_AUDIO?.list({ prefix: "users/" + userId + "/compositions/" + compositionId + ".", limit: 5 });
        if (!(ownedExport?.objects || []).some(object => /\.(wav|mp3|pcm)$/i.test(String(object.key || "")))) {
          return json({ error: "The exported composition could not be verified for this user." }, 409);
        }
        const result = await env.DB.prepare(
          "UPDATE composition_drafts SET completed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),last_exported_composition_id=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE draft_id=? AND user_id=? AND completed_at IS NULL"
        ).bind(compositionId, draftId, userId).run();
        if (!result.meta?.changes) {
          const existing = await env.DB.prepare("SELECT draft_id FROM composition_drafts WHERE draft_id=? AND user_id=? AND completed_at IS NOT NULL").bind(draftId, userId).first();
          if (!existing) return json({ error: "Saved draft not found for this user." }, 404);
        }
        return json({ success: true, draftId, compositionId, completed: true });
      } catch (error) {
        console.error("composition_draft_complete_error", error);
        return json({ error: /no such column:\s*completed_at/i.test(String(error?.message || error)) ? "Draft completion storage is not initialized. Apply migrations/0016_composition_draft_completion.sql to Cloudflare D1, then retry." : "Could not mark the draft as completed." }, /no such column:\s*completed_at/i.test(String(error?.message || error)) ? 503 : 500);
      }
    }

if (url.pathname === "/api/compositions/drafts" && request.method === "GET") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Composition draft storage is not configured." }, 503);
      try {
        const rows = await env.DB.prepare(
          "SELECT draft_id,display_name,created_at,updated_at,last_exported_composition_id FROM composition_drafts WHERE user_id=? AND completed_at IS NULL ORDER BY updated_at DESC LIMIT 100"
        ).bind(userId).all();
        return json({ drafts: (rows.results || []).map(row => ({
          id: row.draft_id,
          name: row.display_name || "Untitled Composition",
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastExportedCompositionId: row.last_exported_composition_id || null
        })) });
      } catch (error) {
        console.error("composition_drafts_list_error", error);
        return json({ error: /no such table:\s*composition_drafts/i.test(String(error?.message || error)) ? "Composition draft storage is not initialized. Apply migrations/0015_composition_drafts.sql to the SvaraONE Cloudflare D1 database, then retry." : "Could not load saved composition drafts. Check the Worker logs for composition_drafts_list_error." }, /no such table:\s*composition_drafts/i.test(String(error?.message || error)) ? 503 : 500);
      }
    }

    if (url.pathname === "/api/compositions/drafts" && request.method === "POST") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Composition draft storage is not configured." }, 503);
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > 262144) return json({ error: "Composition draft is too large." }, 413);
      let payload;
      try { payload = await request.json(); } catch { return json({ error: "A valid draft JSON body is required." }, 400); }
      const draftId = String(payload?.draftId || "");
      const displayName = String(payload?.name || "Untitled Composition").trim().slice(0, 120) || "Untitled Composition";
      const tracks = payload?.tracks;
      if (!/^[0-9a-f-]{36}$/i.test(draftId)) return json({ error: "A valid draft ID is required." }, 400);
      if (!Array.isArray(tracks) || tracks.length < 1 || tracks.length > 100) return json({ error: "A draft must contain between 1 and 100 tracks." }, 400);

      const normalizedTracks = [];
      for (let index = 0; index < tracks.length; index++) {
        const track = tracks[index] || {};
        const source = track.sourceAsset || {};
        const type = String(source.type || "");
        const assetId = String(source.id || "");
        if (!["voice", "sound", "composition"].includes(type) || !/^[0-9a-f-]{36}$/i.test(assetId)) {
          return json({ error: "Track " + (index + 1) + " has an invalid source asset reference." }, 400);
        }
        let sourceOwned = false;
        if (type === "voice") {
          sourceOwned = !!(await env.DB.prepare(
            "SELECT id FROM generations WHERE id=? AND user_id=? AND status='ready' AND r2_key IS NOT NULL LIMIT 1"
          ).bind(assetId, userId).first());
        } else if (type === "sound") {
          sourceOwned = !!(await env.DB.prepare(
            "SELECT id FROM sound_generations WHERE id=? AND user_id=? AND status='ready' AND r2_key IS NOT NULL LIMIT 1"
          ).bind(assetId, userId).first());
        } else if (env.GENERATED_AUDIO) {
          const sourcePage = await env.GENERATED_AUDIO.list({ prefix: "users/" + userId + "/compositions/" + assetId + ".", limit: 5 });
          sourceOwned = (sourcePage.objects || []).some(object => /\.(wav|mp3|pcm)$/i.test(String(object.key || "")));
        }
        if (!sourceOwned) return json({ error: "Track " + (index + 1) + " references a missing or inaccessible source asset." }, 409);
        const number = (value, fallback, min, max) => {
          const n = Number(value);
          return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
        };
        normalizedTracks.push({
          trackId: String(track.trackId || ("track-" + (index + 1))).slice(0, 100),
          sourceAsset: { type, id: assetId },
          order: index,
          startSeconds: number(track.startSeconds, 0, 0, 3600),
          trimIn: number(track.trimIn, 0, 0, 0.98),
          trimOut: number(track.trimOut, 0, 0, 0.98),
          fadeIn: number(track.fadeIn, 0, 0, 10),
          fadeOut: number(track.fadeOut, 0, 0, 10),
          volume: number(track.volume, 1, 0, 1),
          muted: !!track.muted,
          solo: !!track.solo,
          declaredDuration: number(track.declaredDuration, 0, 0, 3600),
          cutGroup: String(track.cutGroup || "").slice(0, 100),
          cutClip: !!track.cutClip
        });
      }
      const recipe = JSON.stringify({ schemaVersion: 1, draftId, tracks: normalizedTracks });
      if (recipe.length > 262144) return json({ error: "Composition draft is too large." }, 413);
      try {
        await env.DB.prepare(
          "INSERT INTO composition_drafts (draft_id,user_id,display_name,schema_version,recipe_json,updated_at) VALUES (?,?,?,1,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(draft_id,user_id) DO UPDATE SET display_name=excluded.display_name,schema_version=1,recipe_json=excluded.recipe_json,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"
        ).bind(draftId, userId, displayName, recipe).run();
        return json({ success: true, draftId, name: displayName, schemaVersion: 1, trackCount: normalizedTracks.length });
      } catch (error) {
        console.error("composition_draft_save_error", error);
        return json({ error: /no such table:\s*composition_drafts/i.test(String(error?.message || error)) ? "Composition draft storage is not initialized. Apply migrations/0015_composition_drafts.sql to the SvaraONE Cloudflare D1 database, then retry." : "Could not save the composition draft. Check the Worker logs for composition_draft_save_error." }, /no such table:\s*composition_drafts/i.test(String(error?.message || error)) ? 503 : 500);
      }
    }

    if (url.pathname.startsWith("/api/compositions/drafts/") && request.method === "DELETE") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Composition draft storage is not configured." }, 503);
      const draftId = String(url.pathname.split("/").pop() || "");
      if (!/^[0-9a-f-]{36}$/i.test(draftId)) return json({ error: "Composition draft not found." }, 404);
      try {
        const result = await env.DB.prepare("DELETE FROM composition_drafts WHERE draft_id=? AND user_id=? AND completed_at IS NULL").bind(draftId, userId).run();
        if (!result.meta?.changes) return json({ error: "Unfinished draft not found for this user." }, 404);
        return json({ success: true, draftId, deleted: true });
      } catch (error) {
        console.error("composition_draft_delete_error", error);
        return json({ error: /no such table:\s*composition_drafts/i.test(String(error?.message || error)) ? "Composition draft storage is not initialized. Apply migrations/0015_composition_drafts.sql to Cloudflare D1, then retry." : /no such column:\s*completed_at/i.test(String(error?.message || error)) ? "Draft completion storage is not initialized. Apply migrations/0016_composition_draft_completion.sql to Cloudflare D1, then retry." : "Could not delete the composition draft." }, /no such table:\s*composition_drafts|no such column:\s*completed_at/i.test(String(error?.message || error)) ? 503 : 500);
      }
    }

    if (url.pathname.startsWith("/api/compositions/drafts/") && request.method === "GET") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Composition draft storage is not configured." }, 503);
      const draftId = String(url.pathname.split("/").pop() || "");
      if (!/^[0-9a-f-]{36}$/i.test(draftId)) return json({ error: "Composition draft not found." }, 404);
      try {
        const row = await env.DB.prepare(
          "SELECT display_name,schema_version,recipe_json,updated_at FROM composition_drafts WHERE draft_id=? AND user_id=? LIMIT 1"
        ).bind(draftId, userId).first();
        if (!row) return json({ error: "Composition draft not found." }, 404);
        const recipe = JSON.parse(String(row.recipe_json || ""));
        if (Number(row.schema_version) !== 1 || Number(recipe?.schemaVersion) !== 1 || !Array.isArray(recipe?.tracks)) {
          return json({ error: "This composition draft version is not supported." }, 409);
        }
        const resolvedTracks = [];
        for (const track of recipe.tracks) {
          const source = track.sourceAsset || {};
          const sourceId = String(source.id || "");
          const sourceType = String(source.type || "");
          let resolved = { available: false, type: sourceType, id: sourceId };
          if (sourceType === "voice") {
            const asset = await env.DB.prepare("SELECT g.id,g.voice_name,g.format,g.r2_key,vdn.display_name FROM generations g LEFT JOIN voice_display_names vdn ON vdn.generation_id=g.id AND vdn.user_id=g.user_id WHERE g.id=? AND g.user_id=? AND g.status='ready' AND g.r2_key IS NOT NULL LIMIT 1").bind(sourceId, userId).first();
            if (asset?.r2_key) {
              const storageFilename = String(asset.r2_key).split("/").pop() || "";
              const extension = storageFilename.split(".").pop()?.toLowerCase() || String(asset.format || "mp3").toLowerCase();
              const filename = String(asset.display_name || storageFilename.replace(/\\.[^.]+$/, "")) + "." + extension;
              resolved = { available: true, type: "voice", id: sourceId, filename, storageFilename, format: String(asset.format || extension).toUpperCase(), assetUrl: "/api/generations/media?filename=" + encodeURIComponent(storageFilename), durationSeconds: Number(track.declaredDuration) || 30 };
            }
          } else if (sourceType === "sound") {
            const asset = await env.DB.prepare("SELECT sg.id,sg.type,sg.prompt,sg.duration_seconds,sg.format,sg.r2_key,sdn.display_name FROM sound_generations sg LEFT JOIN sound_display_names sdn ON sdn.generation_id=sg.id AND sdn.user_id=sg.user_id WHERE sg.id=? AND sg.user_id=? AND sg.status='ready' AND sg.r2_key IS NOT NULL LIMIT 1").bind(sourceId, userId).first();
            if (asset?.r2_key) {
              const storageFilename = String(asset.r2_key).split("/").pop() || "sound.mp3";
              const extension = storageFilename.split(".").pop()?.toLowerCase() || String(asset.format || "mp3").toLowerCase();
              const filename = String(asset.display_name || storageFilename.replace(/\\.[^.]+$/, "")) + "." + extension;
              resolved = { available: true, type: "sound", id: sourceId, filename, storageFilename, soundType: String(asset.type || ""), format: String(asset.format || extension).toUpperCase(), assetUrl: "/api/sound/assets/" + encodeURIComponent(sourceId), durationSeconds: Number(asset.duration_seconds) || Number(track.declaredDuration) || 30 };
            }
          } else if (sourceType === "composition") {
            const page = await env.GENERATED_AUDIO.list({ prefix: "users/" + userId + "/compositions/" + sourceId + ".", limit: 5, include: ["httpMetadata", "customMetadata"] });
            const object = (page.objects || []).find(item => /\.(wav|mp3|pcm)$/i.test(String(item.key || "")));
            if (object?.key) {
              const meta = object.customMetadata || {};
              const filename = String(object.key).split("/").pop() || "";
              const extension = filename.split(".").pop() || "wav";
              const format = String(meta.format || extension).toUpperCase();
              resolved = { available: true, type: "composition", id: sourceId, filename: String(meta.filename || filename), format, assetUrl: "/api/compositions/assets/" + encodeURIComponent(sourceId) + (format === "PCM" ? "?preview=1" : ""), durationSeconds: Number(meta.durationSeconds) || Number(track.declaredDuration) || 30 };
            }
          }
          resolvedTracks.push({ ...track, resolvedAsset: resolved });
        }
        return json({ success: true, draftId, name: row.display_name || "Untitled Composition", updatedAt: row.updated_at, recipe: { ...recipe, tracks: resolvedTracks } });
      } catch (error) {
        console.error("composition_draft_load_error", error);
        return json({ error: "Could not load the saved composition draft." }, 500);
      }
    }

    if (url.pathname === "/api/compositions/recipe" && request.method === "POST") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Composition recipe storage is not configured." }, 503);

      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > 262144) return json({ error: "Composition recipe is too large." }, 413);
      let payload;
      try { payload = await request.json(); } catch { return json({ error: "A valid recipe JSON body is required." }, 400); }
      const compositionId = String(payload?.compositionId || "");
      const tracks = payload?.tracks;
      if (!/^[0-9a-f-]{36}$/i.test(compositionId)) return json({ error: "Composition asset not found." }, 404);
      if (!Array.isArray(tracks) || tracks.length < 1 || tracks.length > 100) {
        return json({ error: "A recipe must contain between 1 and 100 tracks." }, 400);
      }

      const compositionPrefix = "users/" + userId + "/compositions/" + compositionId + ".";
      const compositionPage = await env.GENERATED_AUDIO.list({ prefix: compositionPrefix, limit: 5 });
      const compositionObject = (compositionPage.objects || []).find(object => /\.(wav|mp3|pcm)$/i.test(String(object.key || "")));
      if (!compositionObject?.key) return json({ error: "Composition asset not found." }, 404);

      const normalizedTracks = [];
      for (let index = 0; index < tracks.length; index++) {
        const track = tracks[index] || {};
        const source = track.sourceAsset || {};
        const type = String(source.type || "");
        const assetId = String(source.id || "");
        if (!["voice", "sound", "composition"].includes(type) || !/^[0-9a-f-]{36}$/i.test(assetId)) {
          return json({ error: "Track " + (index + 1) + " has an invalid source asset reference." }, 400);
        }
        let sourceOwned = false;
        if (type === "voice") {
          sourceOwned = !!(await env.DB.prepare(
            "SELECT id FROM generations WHERE id=? AND user_id=? AND status='ready' AND r2_key IS NOT NULL LIMIT 1"
          ).bind(assetId, userId).first());
        } else if (type === "sound") {
          sourceOwned = !!(await env.DB.prepare(
            "SELECT id FROM sound_generations WHERE id=? AND user_id=? AND status='ready' AND r2_key IS NOT NULL LIMIT 1"
          ).bind(assetId, userId).first());
        } else {
          const sourcePrefix = "users/" + userId + "/compositions/" + assetId + ".";
          const sourcePage = await env.GENERATED_AUDIO.list({ prefix: sourcePrefix, limit: 5 });
          sourceOwned = (sourcePage.objects || []).some(object => /\.(wav|mp3|pcm)$/i.test(String(object.key || "")));
        }
        if (!sourceOwned) return json({ error: "Track " + (index + 1) + " references a missing or inaccessible source asset." }, 409);

        const number = (value, fallback, min, max) => {
          const n = Number(value);
          return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
        };
        normalizedTracks.push({
          trackId: String(track.trackId || ("track-" + (index + 1))).slice(0, 100),
          sourceAsset: { type, id: assetId },
          order: index,
          startSeconds: number(track.startSeconds, 0, 0, 3600),
          trimIn: number(track.trimIn, 0, 0, 0.98),
          trimOut: number(track.trimOut, 0, 0, 0.98),
          fadeIn: number(track.fadeIn, 0, 0, 10),
          fadeOut: number(track.fadeOut, 0, 0, 10),
          volume: number(track.volume, 1, 0, 1),
          muted: !!track.muted,
          solo: !!track.solo,
          declaredDuration: number(track.declaredDuration, 0, 0, 3600),
          cutGroup: String(track.cutGroup || "").slice(0, 100),
          cutClip: !!track.cutClip
        });
      }

      const recipe = JSON.stringify({ schemaVersion: 1, compositionId, tracks: normalizedTracks });
      if (recipe.length > 262144) return json({ error: "Composition recipe is too large." }, 413);
      try {
        await env.DB.prepare(
          "INSERT INTO composition_recipes (composition_id,user_id,schema_version,recipe_json,updated_at) VALUES (?,?,1,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(composition_id,user_id) DO UPDATE SET schema_version=1,recipe_json=excluded.recipe_json,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')"
        ).bind(compositionId, userId, recipe).run();
        return json({ success: true, compositionId, schemaVersion: 1, trackCount: normalizedTracks.length });
      } catch (error) {
        console.error("composition_recipe_save_error", error);
        return json({ error: "Could not save the editable composition recipe. Confirm the S15 D1 migration has been applied." }, 500);
      }
    }

    if (url.pathname === "/api/compositions/recipe" && request.method === "GET") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB || !env.GENERATED_AUDIO) return json({ error: "Composition recipe storage is not configured." }, 503);
      const compositionId = String(url.searchParams.get("id") || "");
      if (!/^[0-9a-f-]{36}$/i.test(compositionId)) return json({ error: "Composition asset not found." }, 404);
      const prefix = "users/" + userId + "/compositions/" + compositionId + ".";
      const page = await env.GENERATED_AUDIO.list({ prefix, limit: 5 });
      if (!(page.objects || []).some(object => /\.(wav|mp3|pcm)$/i.test(String(object.key || "")))) {
        return json({ error: "Composition asset not found." }, 404);
      }
      try {
        const row = await env.DB.prepare(
          "SELECT schema_version,recipe_json,updated_at FROM composition_recipes WHERE composition_id=? AND user_id=? LIMIT 1"
        ).bind(compositionId, userId).first();
        if (!row) return json({ success: true, compositionId, available: false, recipe: null });
        let recipe;
        try { recipe = JSON.parse(String(row.recipe_json || "")); } catch { return json({ error: "The saved composition recipe is invalid." }, 500); }
        if (!recipe || Number(row.schema_version) !== 1 || Number(recipe.schemaVersion) !== 1 || !Array.isArray(recipe.tracks)) {
          return json({ error: "This composition recipe version is not supported." }, 409);
        }
        const resolvedTracks = [];
        for (const track of recipe.tracks) {
          const source = track.sourceAsset || {};
          const sourceId = String(source.id || "");
          const sourceType = String(source.type || "");
          let resolved = { available: false, type: sourceType, id: sourceId };
          if (sourceType === "voice") {
            const asset = await env.DB.prepare(
              "SELECT id,voice_name,format,r2_key FROM generations WHERE id=? AND user_id=? AND status='ready' AND r2_key IS NOT NULL LIMIT 1"
            ).bind(sourceId, userId).first();
            if (asset?.r2_key) {
              const filename = String(asset.r2_key).split("/").pop() || "";
              resolved = {
                available: true, type: "voice", id: sourceId,
                filename: String(asset.voice_name || filename),
                format: String(asset.format || "").toUpperCase(),
                assetUrl: "/api/generations/media?filename=" + encodeURIComponent(filename),
                durationSeconds: Number(track.declaredDuration) || 30
              };
            }
          } else if (sourceType === "sound") {
            const asset = await env.DB.prepare(
              "SELECT id,type,prompt,duration_seconds,format,r2_key FROM sound_generations WHERE id=? AND user_id=? AND status='ready' AND r2_key IS NOT NULL LIMIT 1"
            ).bind(sourceId, userId).first();
            if (asset?.r2_key) {
              const filename = String(asset.r2_key).split("/").pop() || "";
              resolved = {
                available: true, type: "sound", id: sourceId,
                filename: String(asset.prompt || filename).slice(0, 120),
                soundType: String(asset.type || ""),
                format: String(asset.format || "").toUpperCase(),
                assetUrl: "/api/sound/assets/" + encodeURIComponent(sourceId),
                durationSeconds: Number(asset.duration_seconds) || Number(track.declaredDuration) || 30
              };
            }
          } else if (sourceType === "composition") {
            const sourcePrefix = "users/" + userId + "/compositions/" + sourceId + ".";
            const sourcePage = await env.GENERATED_AUDIO.list({ prefix: sourcePrefix, limit: 5, include: ["httpMetadata", "customMetadata"] });
            const sourceObject = (sourcePage.objects || []).find(object => /\.(wav|mp3|pcm)$/i.test(String(object.key || "")));
            if (sourceObject?.key) {
              const meta = sourceObject.customMetadata || {};
              const filename = String(sourceObject.key).split("/").pop() || "";
              const extension = filename.split(".").pop() || "wav";
              const format = String(meta.format || extension).toUpperCase();
              resolved = {
                available: true, type: "composition", id: sourceId,
                filename: String(meta.filename || filename),
                format,
                assetUrl: "/api/compositions/assets/" + encodeURIComponent(sourceId) + (format === "PCM" ? "?preview=1" : ""),
                durationSeconds: Number(meta.durationSeconds) || Number(track.declaredDuration) || 30
              };
            }
          }
          resolvedTracks.push({ ...track, resolvedAsset: resolved });
        }
        return json({ success: true, compositionId, available: true, schemaVersion: 1, updatedAt: row.updated_at, recipe: { ...recipe, tracks: resolvedTracks } });
      } catch (error) {
        console.error("composition_recipe_load_error", error);
        return json({ error: "Could not load the editable composition recipe. Confirm the S15 D1 migration has been applied." }, 500);
      }
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/compositions/assets/") && url.pathname.split("/").length === 5) {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.GENERATED_AUDIO) return json({ error: "Composition storage is not configured." }, 503);

      let id = "";
      try { id = decodeURIComponent(url.pathname.split("/").pop() || ""); } catch {}
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Composition asset not found." }, 404);

      const prefix = "users/" + userId + "/compositions/" + id + ".";
      const candidates = await env.GENERATED_AUDIO.list({ prefix, limit: 5 });
      const listed = (candidates.objects || []).find(item => /\.(wav|mp3|pcm)$/i.test(String(item.key || "")));
      if (!listed?.key) return json({ error: "Composition asset not found." }, 404);
      const key = String(listed.key);
      const metadata = await env.GENERATED_AUDIO.head(key);
      if (!metadata || (metadata.customMetadata?.userId && metadata.customMetadata.userId !== userId)) {
        return json({ error: "Composition asset not found." }, 404);
      }

      const basename = key.split("/").pop() || ("svaraone-composition-" + id + ".wav");
      const extension = basename.split(".").pop()?.toLowerCase() || "wav";
      const format = String(metadata.customMetadata?.format || extension).toLowerCase();
      const rawContentType = String(metadata.httpMetadata?.contentType || "");
      const contentType = format === "wav" ? "audio/wav" : format === "mp3" ? "audio/mpeg" : rawContentType || "audio/l16;rate=24000;channels=2";
      const totalSize = Number(metadata.size || 0);
      const minimumSize = format === "wav" ? 44 : format === "mp3" ? 100 : 4;
      if (!Number.isFinite(totalSize) || totalSize < minimumSize) return json({ error: "Composition asset is unavailable." }, 404);

      const wantsDownload = url.searchParams.get("download") === "1";
      const wantsPcmPreview = format === "pcm" && url.searchParams.get("preview") === "1" && !wantsDownload;
      const storedFilename = String(metadata.customMetadata?.filename || basename).replace(/["\r\n]/g, "");
      const headers = new Headers({
        "content-type": wantsPcmPreview ? "audio/wav" : contentType,
        "cache-control": "private, no-store",
        "x-svaraone-composition-id": id
      });

      if (wantsPcmPreview) {
        if (totalSize % 4 !== 0) return json({ error: "PCM asset is incomplete." }, 404);
        const pcmObject = await env.GENERATED_AUDIO.get(key);
        if (!pcmObject) return json({ error: "Composition asset not found." }, 404);
        const previewFilename = storedFilename.replace(/\.pcm$/i, ".wav");
        headers.set("content-length", String(totalSize + 44));
        headers.set("content-disposition", 'inline; filename="' + previewFilename + '"');
        const wavHeaderBuffer = new ArrayBuffer(44);
        const wavHeader = new DataView(wavHeaderBuffer);
        const writeString = (offset, value) => {
          for (let index = 0; index < value.length; index++) wavHeader.setUint8(offset + index, value.charCodeAt(index));
        };
        writeString(0, "RIFF");
        wavHeader.setUint32(4, 36 + totalSize, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        wavHeader.setUint32(16, 16, true);
        wavHeader.setUint16(20, 1, true);
        wavHeader.setUint16(22, 2, true);
        wavHeader.setUint32(24, 24000, true);
        wavHeader.setUint32(28, 24000 * 2 * 2, true);
        wavHeader.setUint16(32, 4, true);
        wavHeader.setUint16(34, 16, true);
        writeString(36, "data");
        wavHeader.setUint32(40, totalSize, true);
        // L16 PCM is big-endian; WAV PCM samples are little-endian. Swap each
        // sample's bytes without assuming R2 chunks align to sample boundaries.
        let carryByte = null;
        const wavOrderBody = pcmObject.body.pipeThrough(new TransformStream({
          transform(chunk, controller) {
            const bytes = new Uint8Array(chunk.byteLength + (carryByte === null ? 0 : 1));
            let offset = 0;
            if (carryByte !== null) {
              bytes[0] = carryByte;
              offset = 1;
              carryByte = null;
            }
            bytes.set(chunk, offset);
            const completeLength = bytes.length - (bytes.length % 2);
            for (let index = 0; index < completeLength; index += 2) {
              const value = bytes[index];
              bytes[index] = bytes[index + 1];
              bytes[index + 1] = value;
            }
            if (completeLength < bytes.length) carryByte = bytes[bytes.length - 1];
            if (completeLength) controller.enqueue(bytes.slice(0, completeLength));
          },
          flush() {
            if (carryByte !== null) throw new Error("Incomplete PCM sample while creating preview WAV.");
          }
        }));
        const reader = wavOrderBody.getReader();
        const previewStream = new ReadableStream({
          async start(controller) {
            controller.enqueue(new Uint8Array(wavHeaderBuffer));
            try {
              while (true) {
                const part = await reader.read();
                if (part.done) break;
                controller.enqueue(part.value);
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            } finally {
              reader.releaseLock();
            }
          },
          cancel(reason) {
            return reader.cancel(reason);
          }
        });
        return new Response(previewStream, { status: 200, headers });
      }

      const rangeHeader = request.headers.get("Range");
      let object;
      let status = 200;
      headers.set("accept-ranges", "bytes");
      headers.set("content-disposition", (wantsDownload ? "attachment" : "inline") + '; filename="' + storedFilename + '"');
      if (metadata.httpEtag) headers.set("etag", metadata.httpEtag);

      if (rangeHeader) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
        if (!match) {
          headers.set("content-range", "bytes */" + totalSize);
          return new Response(null, { status: 416, headers });
        }
        let rangeStart;
        let rangeEnd;
        if (match[1] === "") {
          const suffixLength = Number(match[2]);
          if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
            headers.set("content-range", "bytes */" + totalSize);
            return new Response(null, { status: 416, headers });
          }
          rangeStart = Math.max(0, totalSize - suffixLength);
          rangeEnd = totalSize - 1;
        } else {
          rangeStart = Number(match[1]);
          rangeEnd = match[2] === "" ? totalSize - 1 : Number(match[2]);
          if (!Number.isInteger(rangeStart) || !Number.isInteger(rangeEnd) || rangeStart < 0 || rangeStart >= totalSize || rangeEnd < rangeStart) {
            headers.set("content-range", "bytes */" + totalSize);
            return new Response(null, { status: 416, headers });
          }
          rangeEnd = Math.min(rangeEnd, totalSize - 1);
        }
        object = await env.GENERATED_AUDIO.get(key, { range: { offset: rangeStart, length: rangeEnd - rangeStart + 1 } });
        if (!object) return json({ error: "Composition asset not found." }, 404);
        headers.set("content-length", String(rangeEnd - rangeStart + 1));
        headers.set("content-range", "bytes " + rangeStart + "-" + rangeEnd + "/" + totalSize);
        status = 206;
      } else {
        object = await env.GENERATED_AUDIO.get(key);
        if (!object) return json({ error: "Composition asset not found." }, 404);
        headers.set("content-length", String(totalSize));
      }
      if (object.httpEtag) headers.set("etag", object.httpEtag);
      return new Response(object.body, { status, headers });
    }

    if (request.method === "GET" && url.pathname === "/api/branding/svaraone-logo.png") {
      const logo = await storedBrandLogo(env);
      if (logo) return logo;
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET" && url.pathname === "/api/branding/hero-bg.png") {
      const heroBackground = await storedHeroBackground(env);
      if (heroBackground) return heroBackground;
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/branding/studio-") && url.pathname.endsWith("-card.png")) {
      const filename = url.pathname.split("/").pop() || "";
      const allowed = new Set([
        "studio-voice-card.png",
        "studio-sound-card.png",
        "studio-video-card.png",
        "studio-compose-card.png"
      ]);
      if (allowed.has(filename) && env.VOICE_SAMPLES) {
        const object = await env.VOICE_SAMPLES.get(`branding/${filename}`);
        if (object) {
          return new Response(object.body, {
            headers: {
              "content-type": "image/png",
              "cache-control": "public, max-age=31536000, immutable",
              "etag": object.httpEtag || ""
            }
          });
        }
      }
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET" && url.pathname === "/api/pricing") {
      return new Response(JSON.stringify(pricing(env)), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/api/voice-access") {
      try {
        return json(await voiceAccess(request, env));
      } catch (error) {
        console.error("voice_access_error", error);
        return json({ fullCatalogue: false, voiceIds: [], error: "Voice access service unavailable." }, 503);
      }
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/voice-portraits/")) {
      const code = url.pathname.split("/").pop();
      const portrait = await storedPortrait(env, code);
      if (portrait) return portrait;
    }

    if (request.method === "GET" && url.pathname === "/api/sound/capabilities") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      const { handleSoundCapabilities } = await import("./sound-capabilities.js");
      return handleSoundCapabilities(request, env);
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/sound/assets/") && url.pathname.split("/").length === 5) {
      const generationId = decodeURIComponent(url.pathname.split("/").pop() || "");
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      return storedSoundAsset(request, env, userId, generationId);
    }


    if (request.method === "POST" && url.pathname === "/api/sound/generations/rename") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Sound history storage is not configured." }, 503);
      try {
        const body = await request.json().catch(() => ({}));
        const generationId = String(body?.generationId || "").trim();
        const displayName = String(body?.displayName || "").trim().replace(/(?:\\.(?:wav|mp3|pcm))+$/i, "");
        if (!generationId || !displayName) return json({ error: "Sound generation and filename are required." }, 400);
        if (displayName.length > 100 || /[\\/\\\\]/.test(displayName)) return json({ error: "Use a filename up to 100 characters without path separators." }, 400);
        const row = await env.DB.prepare("SELECT id,format FROM sound_generations WHERE id=? AND user_id=? LIMIT 1").bind(generationId,userId).first();
        if (!row) return json({ error: "Sound generation not found." }, 404);
        await env.DB.prepare("INSERT INTO sound_display_names (generation_id,user_id,display_name,updated_at) VALUES (?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(generation_id,user_id) DO UPDATE SET display_name=excluded.display_name,updated_at=excluded.updated_at").bind(generationId,userId,displayName).run();
        return json({ success: true, generationId, filename: displayName + "." + String(row.format || "mp3").toLowerCase() });
      } catch (error) {
        console.error("sound_generation_rename_error", error);
        return json({ error: "Could not rename Sound generation." }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/sound/generations/delete") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Sound history storage is not configured." }, 503);
      try {
        const body = await request.json().catch(() => ({}));
        const generationId = String(body?.generationId || "").trim();
        if (!generationId) return json({ error: "Sound generation ID is required." }, 400);
        const row = await env.DB.prepare("SELECT id,r2_key FROM sound_generations WHERE id=? AND user_id=? LIMIT 1").bind(generationId,userId).first();
        if (!row) return json({ error: "Sound generation not found." }, 404);
        if (row.r2_key && env.GENERATED_AUDIO) {
          const prefix = "users/" + userId + "/";
          if (!String(row.r2_key).startsWith(prefix)) return json({ error: "Sound asset ownership could not be verified." }, 403);
          await env.GENERATED_AUDIO.delete(row.r2_key);
        }
        await env.DB.prepare("DELETE FROM sound_display_names WHERE generation_id=? AND user_id=?").bind(generationId,userId).run();
        const deleted = await env.DB.prepare("DELETE FROM sound_generations WHERE id=? AND user_id=?").bind(generationId,userId).run();
        if (!deleted.meta?.changes) return json({ error: "Sound generation not found." }, 404);
        return json({ success: true, generationId });
      } catch (error) {
        console.error("sound_generation_delete_error", error);
        return json({ error: "Could not delete Sound generation." }, 500);
      }
    }

    if (request.method === "GET" && url.pathname === "/api/sound/generations") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      if (!env.DB) return json({ error: "Sound history storage is not configured." }, 503);

      const requestedLimit = Number(url.searchParams.get("limit") || 20);
      const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20;
      const requestedPage = Number(url.searchParams.get("page") || 1);
      const page = Number.isInteger(requestedPage) ? Math.max(requestedPage, 1) : 1;
      const offset = (page - 1) * limit;
      const requestedStatus = String(url.searchParams.get("status") || "").trim().toLowerCase();
      const requestedType = String(url.searchParams.get("type") || "").trim().toLowerCase();
      const requestedSourceType = String(url.searchParams.get("sourceType") || "").trim().toLowerCase();
      const requestedFormat = String(url.searchParams.get("format") || "").trim().toLowerCase();
      const requestedDate = String(url.searchParams.get("date") || "").trim().toLowerCase();
      const requestedFolder = String(url.searchParams.get("folderId") || "").trim();

      const requestedSearch = String(url.searchParams.get("search") || "").trim().toLowerCase();
      const allowedStatuses = new Set(["processing", "ready", "failed", "storage_failed"]);
      const allowedDates = new Set(["today", "7d", "30d"]);
      if (requestedStatus && !allowedStatuses.has(requestedStatus)) return json({ error: "Invalid Sound generation status." }, 400);
      if (requestedDate && !allowedDates.has(requestedDate)) return json({ error: "Invalid Sound generation date filter." }, 400);

      const conditions = ["sg.user_id = ?"];
      const bindings = [userId];
      if (requestedStatus) { conditions.push("sg.status = ?"); bindings.push(requestedStatus); }
      if (requestedType) { conditions.push("LOWER(sg.type) = ?"); bindings.push(requestedType); }
      if (requestedSourceType) { conditions.push("LOWER(sg.source_type) = ?"); bindings.push(requestedSourceType); }
      if (requestedFormat) { conditions.push("LOWER(sg.format) = ?"); bindings.push(requestedFormat); }
      if (requestedFolder) { if (requestedFolder === "__unfiled__") conditions.push("sg.folder_id IS NULL"); else { conditions.push("sg.folder_id = ?"); bindings.push(requestedFolder); } }
      if (requestedSearch) {
        conditions.push("(LOWER(COALESCE(sg.prompt, '')) LIKE ? OR LOWER(COALESCE(sg.type, '')) LIKE ? OR LOWER(COALESCE(sg.source_type, '')) LIKE ?)");
        const searchTerm = "%" + requestedSearch + "%";
        bindings.push(searchTerm, searchTerm, searchTerm);
      }
      if (requestedDate) {
        const dateModifier = requestedDate === "today" ? "-1 day" : requestedDate === "7d" ? "-7 days" : "-30 days";
        conditions.push("sg.created_at >= datetime('now', ?)");
        bindings.push(dateModifier);
      }

      const where = conditions.join(" AND ");
      const totalRow = await env.DB.prepare("SELECT COUNT(*) AS total FROM sound_generations sg WHERE " + where).bind(...bindings).first();
      const total = Number(totalRow?.total || 0);
      const rows = await env.DB.prepare(`
        SELECT
          sg.id,
          sg.user_id,
          sg.provider,
          sg.provider_generation_id,
          sg.type,
          sg.prompt,
          sdn.display_name,
          sg.source_type,
          sg.source_asset_id,
          sg.duration_seconds,
          sg.sample_rate,
          sg.channels,
          sg.format,
          sg.mime_type,
          sg.status,
          sg.r2_key,
          sg.r2_etag,
          sg.size_bytes,
          sg.credits_charged,
          sg.credit_reference_id,
          sg.parent_generation_id,
          sg.folder_id,
          lf.name AS folder_name,
          sg.created_at,
          sg.completed_at,
          sg.expires_at
        FROM sound_generations sg
        LEFT JOIN library_folders lf
          ON lf.id = sg.folder_id
         AND lf.user_id = sg.user_id
        LEFT JOIN sound_display_names sdn
          ON sdn.generation_id = sg.id AND sdn.user_id = sg.user_id
        WHERE ${where}
        ORDER BY sg.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindings, limit, offset).all();

      const generations = (rows.results || []).map(row => ({
        id: row.id,
        provider: row.provider,
        providerGenerationId: row.provider_generation_id,
        type: row.type,
        prompt: row.prompt,
        filename: String(row.display_name || String(row.r2_key || "").split("/").pop().replace(/\\.[^.]+$/, "")).replace(/(?:\\.(?:wav|mp3|pcm))+$/i, "") + "." + String(row.format || "mp3").toLowerCase(),
        sourceType: row.source_type,
        sourceAssetId: row.source_asset_id,
        durationSeconds: row.duration_seconds,
        sampleRate: row.sample_rate,
        channels: row.channels,
        format: row.format,
        mimeType: row.mime_type,
        status: row.status,
        r2Key: row.r2_key,
        r2Etag: row.r2_etag,
        sizeBytes: row.size_bytes,
        creditsCharged: row.credits_charged,
        creditReferenceId: row.credit_reference_id,
        parentGenerationId: row.parent_generation_id,
        folderId: row.folder_id,
        folderName: row.folder_name,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        expiresAt: row.expires_at,
        assetUrl: row.status === "ready" ? `/api/sound/assets/${encodeURIComponent(row.id)}` : null
      }));

      const pageCount = total ? Math.ceil(total / limit) : 0;
      return json({
        generations,
        count: generations.length,
        total,
        limit,
        page,
        pageCount,
        hasNext: page < pageCount,
        hasPrevious: page > 1 && pageCount > 0,
        filters: {
          status: requestedStatus || null,
          type: requestedType || null,
          sourceType: requestedSourceType || null,
          format: requestedFormat || null,
          date: requestedDate || null,
          search: requestedSearch || null
        }
      });
    }

    if (request.method === "POST" && url.pathname === "/api/sound/generate") {
      const userId = await authenticatedUserId(request, env);
      if (!userId) return json({ error: "Authentication required." }, 401);
      return handleSoundGenerate(request, env, userId);
    }

    if (request.method === "POST" && url.pathname === "/api/voice/generate") {
      const body = await request.clone().json().catch(() => ({}));
      const userId = await authenticatedUserId(request, env);
      if (!userId) return new Response(JSON.stringify({ error: "Authentication required." }), { status: 401, headers: { "content-type": "application/json" } });
      if (!env.DB) return new Response(JSON.stringify({ error: "Account service is not configured." }), { status: 503, headers: { "content-type": "application/json" } });
      if (!env.GENERATED_AUDIO) return new Response(JSON.stringify({ error: "Generation storage is not configured." }), { status: 503, headers: { "content-type": "application/json" } });

      if (request.headers.get("X-SvaraONE-Free-Take") === "true") {
        return handleFreeTake(request, env, ctx, body, userId);
      }

      const text = String(body.text || "").trim();
      if (!text) return new Response(JSON.stringify({ error: "Text is required" }), { status: 400, headers: { "content-type": "application/json" } });
      if (text.length > MAX_GENERATION_CHARS) return new Response(JSON.stringify({ error: `Maximum ${MAX_GENERATION_CHARS} characters per generation` }), { status: 400, headers: { "content-type": "application/json" } });

      const access = await voiceAccess(request, env);
      const providerVoiceId = await resolveProviderVoiceId(body, env);
      if (!providerVoiceId) return new Response(JSON.stringify({ error: "Voice not found." }), { status: 404, headers: { "content-type": "application/json" } });
      if (!access.fullCatalogue && !access.voiceIds.includes(providerVoiceId)) {
        return new Response(JSON.stringify({ error: "That voice is not available on your current plan." }), { status: 403, headers: { "content-type": "application/json" } });
      }

      let generationText = text;
      let svaraFlowMetadata = null;
      if (body.svaraFlow === true) {
        try {
          const deliveryPlan = await processSvaraFlow(text, env);
          const translated = translateSvaraFlowPlan(text, deliveryPlan, env);
          generationText = translated.preparedScript;
          svaraFlowMetadata = translated.metadata;
        } catch (svaraFlowError) {
          console.error("svaraflow_error", svaraFlowError);
          generationText = text;
        }
      }

      const cost = generationCost(generationText, env);
      const generationId = crypto.randomUUID();
      const reservation = await reserveCredits(userId, cost, env, generationId);
      if (!reservation) return new Response(JSON.stringify({ error: "Not enough credits." }), { status: 402, headers: { "content-type": "application/json" } });

      const format = String(body.format || "mp3").toLowerCase();
      try {
        const generation = await createGeneration(env, {
          id: generationId,
          userId,
          voiceId: body.voiceId || providerVoiceId,
          providerVoiceId,
          voiceName: body.voiceName || providerVoiceId,
          script: text,
          speed: Number(body.speed) || 1,
          stability: Number.isFinite(Number(body.stability)) ? Number(body.stability) : 50,
          style: body.style || "",
          format,
          creditsCharged: cost,
          creditReferenceId: reservation.referenceId
        });

        const providerRequest = generationText === text
          ? request
          : new Request(request.url, {
              method: request.method,
              headers: new Headers(request.headers),
              body: JSON.stringify({ ...body, text: generationText })
            });
        const response = await app.fetch(providerRequest, env, ctx);
        if (!response.ok) {
          await markGenerationFailed(env, generation.id, "failed");
          await refundCredits(userId, cost, reservation.referenceId, env);
          return response;
        }

        if (!response.body) throw new Error("Generated audio response had no body");

        const audioBytes = await response.arrayBuffer();
        if (!audioBytes.byteLength) throw new Error("Generated audio response was empty");

        const storedObject = await env.GENERATED_AUDIO.put(generation.r2Key, audioBytes, {
          httpMetadata: {
            contentType: mimeTypeForFormat(format),
            cacheControl: "private, no-store"
          },
          customMetadata: {
            generationId,
            userId,
            voiceId: String(body.voiceId || providerVoiceId),
            providerVoiceId,
            format
          }
        });

        if (!storedObject) throw new Error("R2 did not confirm the generated audio upload");
        await markGenerationReady(env, generation.id, storedObject, audioBytes.byteLength);

        const headers = new Headers(response.headers);
        headers.set("X-SvaraONE-Credits-Remaining", String(reservation.balance));
        headers.set("X-SvaraONE-Generation-ID", generation.id);
        return new Response(audioBytes, { status: response.status, statusText: response.statusText, headers });
      } catch (error) {
        try { await markGenerationFailed(env, generationId, "storage_failed"); } catch (markError) { console.error("generation_failure_mark_error", markError); }
        await refundCredits(userId, cost, reservation.referenceId, env);
        console.error("generation_persistence_error", error);
        return new Response(JSON.stringify({ error: "Voice generation could not be saved. Your credits were refunded." }), {
          status: 502,
          headers: { "content-type": "application/json", "cache-control": "no-store" }
        });
      }
    }

    return app.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runBillingCron(env));
    ctx.waitUntil((async()=>{
      try {
        await syncVoiceRegistry(env);
        await seedMissingVoiceSamples(env, 3);
      } catch (error) {
        console.error("voice_registry_sync_error", error);
      }
    })());
    ctx.waitUntil((async()=>{
      try {
        const result = await cleanupExpiredGenerations(env, 100);
        if (result.deleted) console.log("generation_cleanup", result);
      } catch (error) {
        console.error("generation_cleanup_cron_error", error);
      }
    })());
    ctx.waitUntil((async()=>{
      try {
        const result = await ensureSoundProviderCapabilities(env);
        if (result.status !== "cached") console.log("sound_capability_maintenance", result);
      } catch (error) {
        console.error("sound_capability_cron_error", error);
      }
    })());
  }
};