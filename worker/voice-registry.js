const LANGUAGE_NAMES = {
  en: "English",
  es: "Spanish",
  de: "German",
  fr: "French",
  nl: "Dutch",
  it: "Italian",
  ja: "Japanese"
};

const SAMPLE_SCRIPTS = {
  en: name => `Hi, I'm ${name}. I can bring your ideas to life with a natural voice that feels clear, confident, and human.`,
  es: name => `Hola, soy ${name}. Puedo dar vida a tus ideas con una voz natural, clara, expresiva y humana.`,
  de: name => `Hallo, ich bin ${name}. Ich erwecke Ihre Ideen mit einer natürlichen, klaren, ausdrucksstarken Stimme zum Leben.`,
  fr: name => `Bonjour, je suis ${name}. Je peux donner vie à vos idées avec une voix naturelle, claire, expressive et humaine.`,
  nl: name => `Hallo, ik ben ${name}. Ik geef je ideeën leven met een natuurlijke, heldere, expressieve en menselijke stem.`,
  it: name => `Ciao, sono ${name}. Posso dare vita alle tue idee con una voce naturale, chiara, espressiva e umana.`,
  ja: name => `こんにちは、${name}です。自然で明瞭、表現力豊かな声で、あなたのアイデアに命を吹き込みます。`
};

const FEMALE_NAMES = [
  "Amara","Nia","Maya","Zuri","Lina","Ayla","Sana","Leila","Mila","Amina","Talia","Naomi",
  "Kiara","Elara","Mara","Anika","Lena","Sofia","Mina","Aria","Nala","Arielle","Selene","Mira",
  "Aya","Noa","Elena","Isla","Rhea","Livia","Thandi","Asha","Imani","Kaya","Lara","Nadia",
  "Samira","Zahra","Malia","Alina","Maya","Dalia","Keira","Layla","Aurelia","Inaya","Sienna","Amaya",
  "Kira","Ariana","Mina","Elisa","Rina","Tara","Nyla","Ari","Maya","Zola","Suri","Nora"
];

const MALE_NAMES = [
  "James","Kian","Liam","Noah","Ethan","Daniel","Leo","Adam","Ryan","Elias","Theo","Luca",
  "Milan","Aiden","Kai","Jonah","Caleb","Isaac","Mason","Julian","Sam","Dylan","Adrian","Nico",
  "Amir","Zane","Owen","Evan","Rafael","Mateo","Felix","Roman","Alex","Arlo","Jude","Aaron",
  "Dario","Soren","Kareem","Micah","Eli","Nathan","Joel","Marco","Rayan","Tomas","Enzo","Mika",
  "Andre","Emil","Lorenzo","Nolan","Reid","Theo","Ari","Jasper","Milo","Sebastian","Ravi","Khalil"
];

function languageFromVoiceId(id) {
  const match = String(id || "").match(/-([a-z]{2})$/i);
  return match ? match[1].toLowerCase() : "en";
}

function genderFromMetadata(metadata) {
  const tags = Array.isArray(metadata?.tags) ? metadata.tags.map(String).map(x => x.toLowerCase()) : [];
  const raw = String(metadata?.gender || "").toLowerCase();
  if (raw.includes("mascul") || tags.includes("masculine") || tags.includes("male")) return "masculine";
  if (raw.includes("fem") || tags.includes("feminine") || tags.includes("female")) return "feminine";
  return "";
}

function styleFromMetadata(metadata) {
  const characteristics = Array.isArray(metadata?.characteristics) ? metadata.characteristics : [];
  return characteristics[0] || (Array.isArray(metadata?.tags) && metadata.tags[0]) || "Natural";
}

function providerUseCasesFromMetadata(metadata) {
  const candidates = [metadata?.use_cases, metadata?.useCases, metadata?.use_case, metadata?.useCase];
  const value = candidates.find(candidate => Array.isArray(candidate));
  return value ? value.map(String).filter(Boolean) : [];
}

function slug(value) {
  return String(value || "voice").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "voice";
}

async function shortHash(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].slice(0, 5).map(x => x.toString(16).padStart(2, "0")).join("");
}

function sampleScript(language, name) {
  return (SAMPLE_SCRIPTS[language] || SAMPLE_SCRIPTS.en)(name);
}

async function deepgramCatalogue(env) {
  if (!env.DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY is not configured");
  const res = await fetch("https://api.deepgram.com/v1/models", {
    headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` }
  });
  if (!res.ok) throw new Error(`Deepgram catalogue failed: ${res.status}`);
  const data = await res.json();
  return (data.tts || []).filter(v => String(v.canonical_name || "").startsWith("aura-2-"));
}

async function chooseDisplayName(env, metadata, usedNames) {
  const gender = genderFromMetadata(metadata);
  const pool = gender === "masculine" ? MALE_NAMES : gender === "feminine" ? FEMALE_NAMES : [...FEMALE_NAMES, ...MALE_NAMES];
  for (const name of pool) {
    if (!usedNames.has(name.toLowerCase())) {
      usedNames.add(name.toLowerCase());
      return name;
    }
  }
  let n = usedNames.size + 1;
  while (usedNames.has(`voice ${n}`)) n++;
  const fallback = `Voice ${n}`;
  usedNames.add(fallback.toLowerCase());
  return fallback;
}

function rowToVoice(row) {
  let characteristics = [];
  let metadata = {};
  try { characteristics = JSON.parse(row.characteristics_json || "[]"); } catch (_) {}
  try { metadata = JSON.parse(row.metadata_json || "{}"); } catch (_) {}
  return {
    id: row.svara_id,
    name: row.display_name,
    region: row.accent || row.language,
    category: row.language,
    style: row.style || "Natural",
    gender: row.gender || "",
    age: row.age || "",
    provider: row.provider,
    providerVoiceId: row.provider_voice_id,
    sampleUrl: `/api/voice-samples/${encodeURIComponent(row.svara_id)}`,
    sampleKey: row.sample_key,
    sampleStatus: row.sample_status,
    languageName: LANGUAGE_NAMES[row.language] || row.language.toUpperCase(),
    characteristics,
    metadata
  };
}

export async function listVoiceRegistry(env) {
  if (!env.DB) throw new Error("DB binding is not configured");
  const result = await env.DB.prepare(`
    SELECT * FROM voice_registry
    WHERE active = 1
    ORDER BY CASE language
      WHEN 'en' THEN 1 WHEN 'es' THEN 2 WHEN 'de' THEN 3 WHEN 'fr' THEN 4
      WHEN 'nl' THEN 5 WHEN 'it' THEN 6 WHEN 'ja' THEN 7 ELSE 99 END,
      display_name COLLATE NOCASE
  `).all();
  return (result.results || []).map(rowToVoice);
}

export async function getVoiceById(env, svaraId) {
  if (!env.DB) return null;
  const row = await env.DB.prepare("SELECT * FROM voice_registry WHERE svara_id = ? AND active = 1 LIMIT 1").bind(String(svaraId || "")).first();
  return row ? rowToVoice(row) : null;
}

export async function getVoiceByProviderId(env, providerVoiceId) {
  if (!env.DB) return null;
  const row = await env.DB.prepare("SELECT * FROM voice_registry WHERE provider_voice_id = ? AND active = 1 LIMIT 1").bind(String(providerVoiceId || "")).first();
  return row ? rowToVoice(row) : null;
}

export async function syncVoiceRegistry(env) {
  if (!env.DB) throw new Error("DB binding is not configured");
  const catalogue = await deepgramCatalogue(env);
  const existingResult = await env.DB.prepare("SELECT * FROM voice_registry").all();
  const existing = new Map((existingResult.results || []).map(row => [String(row.provider_voice_id), row]));
  const usedNames = new Set((existingResult.results || []).map(row => String(row.display_name || "").toLowerCase()));
  const activeProviderIds = new Set();
  const writes = [];
  let added = 0;
  let updated = 0;

  for (const model of catalogue) {
    const providerVoiceId = String(model.canonical_name || "");
    if (!providerVoiceId) continue;
    activeProviderIds.add(providerVoiceId);
    const metadata = model.metadata || {};
    const language = languageFromVoiceId(providerVoiceId);
    const gender = genderFromMetadata(metadata);
    const characteristics = Array.isArray(metadata.characteristics) ? metadata.characteristics : [];
    const age = String(metadata.age || "");
    const accent = String(metadata.accent || metadata.language || "");
    const style = styleFromMetadata(metadata);
    const metadataJson = JSON.stringify(metadata);
    const previous = existing.get(providerVoiceId);

    if (previous) {
      if (String(previous.metadata_json || "{}") !== metadataJson || Number(previous.active) !== 1 || String(previous.accent || "") !== accent || String(previous.gender || "") !== gender || String(previous.age || "") !== age || String(previous.style || "") !== style) {
        writes.push(env.DB.prepare(`UPDATE voice_registry SET language=?, accent=?, gender=?, age=?, style=?, characteristics_json=?, metadata_json=?, active=1, updated_at=datetime('now') WHERE provider_voice_id=?`).bind(language, accent, gender, age, style, JSON.stringify(characteristics), metadataJson, providerVoiceId));
        updated++;
      }
      continue;
    }

    const displayName = await chooseDisplayName(env, metadata, usedNames);
    const hash = await shortHash(providerVoiceId);
    const svaraId = `svara-${language}-${slug(displayName)}-${hash}`;
    const sampleKey = `samples/voices/${svaraId}.mp3`;
    writes.push(env.DB.prepare(`INSERT INTO voice_registry (svara_id, provider, provider_voice_id, display_name, language, accent, gender, age, style, characteristics_json, metadata_json, sample_key, sample_status, active) VALUES (?, 'deepgram', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'missing', 1)`).bind(svaraId, providerVoiceId, displayName, language, accent, gender, age, style, JSON.stringify(characteristics), metadataJson, sampleKey));
    added++;
  }

  for (const row of existingResult.results || []) {
    if (Number(row.active) === 1 && !activeProviderIds.has(String(row.provider_voice_id))) {
      writes.push(env.DB.prepare("UPDATE voice_registry SET active=0, updated_at=datetime('now') WHERE provider_voice_id=?").bind(String(row.provider_voice_id)));
    }
  }

  for (let i = 0; i < writes.length; i += 80) await env.DB.batch(writes.slice(i, i + 80));

  const syncedRows = await env.DB.prepare("SELECT svara_id, provider_voice_id FROM voice_registry WHERE provider='deepgram'").all();
  const svaraIdByProvider = new Map((syncedRows.results || []).map(row => [String(row.provider_voice_id), String(row.svara_id)]));
  const metadataWrites = [];

  for (const model of catalogue) {
    const providerVoiceId = String(model.canonical_name || "");
    const svaraId = svaraIdByProvider.get(providerVoiceId);
    if (!svaraId) continue;
    const metadata = model.metadata || {};
    const characteristics = Array.isArray(metadata.characteristics) ? metadata.characteristics : [];
    const useCases = providerUseCasesFromMetadata(metadata);
    const rawMetadataJson = JSON.stringify(metadata);
    metadataWrites.push(env.DB.prepare(`INSERT INTO voice_intelligence_metadata (svara_id, provider, provider_voice_id, provider_model, characteristics_json, use_cases_json, raw_metadata_json, updated_at) VALUES (?, 'deepgram', ?, 'aura-2', ?, ?, ?, datetime('now')) ON CONFLICT(svara_id) DO UPDATE SET provider=excluded.provider, provider_voice_id=excluded.provider_voice_id, provider_model=excluded.provider_model, characteristics_json=excluded.characteristics_json, use_cases_json=excluded.use_cases_json, raw_metadata_json=excluded.raw_metadata_json, updated_at=datetime('now')`).bind(svaraId, providerVoiceId, JSON.stringify(characteristics), JSON.stringify(useCases), rawMetadataJson));
  }

  for (let i = 0; i < metadataWrites.length; i += 80) await env.DB.batch(metadataWrites.slice(i, i + 80));
  return { provider: "deepgram", family: "aura-2", total: catalogue.length, added, updated, active: activeProviderIds.size, intelligenceMetadataSynced: metadataWrites.length };
}

async function generateAudio(env, providerVoiceId, text) {
  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(providerVoiceId)}&encoding=mp3`, {
    method: "POST",
    headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error(`Deepgram sample generation failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function ensureVoiceSample(env, svaraId) {
  if (!env.VOICE_SAMPLES) throw new Error("VOICE_SAMPLES R2 binding is not configured");
  const voice = await getVoiceById(env, svaraId);
  if (!voice) return { error: "Voice not found", status: 404 };
  const existing = await env.VOICE_SAMPLES.get(voice.sampleKey);
  if (existing) {
    if (env.DB) await env.DB.prepare("UPDATE voice_registry SET sample_status='ready', updated_at=datetime('now') WHERE svara_id=?").bind(voice.id).run();
    return { body: existing.body, headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable", "etag": existing.httpEtag || "" }, voice };
  }

  const text = sampleScript(voice.category, voice.name);
  const bytes = await generateAudio(env, voice.providerVoiceId, text);
  await env.VOICE_SAMPLES.put(voice.sampleKey, bytes, {
    httpMetadata: { contentType: "audio/mpeg", cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { assetType: "voice-sample", svaraId: voice.id, provider: voice.provider, providerVoiceId: voice.providerVoiceId, language: voice.category, name: voice.name }
  });
  await env.DB.prepare("UPDATE voice_registry SET sample_status='ready', updated_at=datetime('now') WHERE svara_id=?").bind(voice.id).run();
  return { body: bytes, headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" }, voice };
}

export async function seedMissingVoiceSamples(env, limit = 3) {
  if (!env.DB || !env.VOICE_SAMPLES) throw new Error("DB and VOICE_SAMPLES bindings are required");
  const rows = await env.DB.prepare(`SELECT svara_id FROM voice_registry WHERE active=1 AND sample_status!='ready' ORDER BY created_at ASC LIMIT ?`).bind(Math.max(1, Math.min(20, Number(limit) || 3))).all();
  const results = [];
  for (const row of rows.results || []) {
    try {
      const result = await ensureVoiceSample(env, row.svara_id);
      results.push({ id: row.svara_id, status: result.error ? "error" : "ready" });
    } catch (error) {
      results.push({ id: row.svara_id, status: "error", error: String(error?.message || "Sample generation failed").slice(0, 200) });
    }
  }
  return results;
}

export function sampleScriptForVoice(voice) {
  return sampleScript(voice.category, voice.name);
}
