import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const API_KEY = process.env.DEEPGRAM_API_KEY;
if (!API_KEY) throw new Error("DEEPGRAM_API_KEY is required");

const OUT = process.env.SVARA_VOICE_LAB_DIR || ".voice-lab-output";
const MAX_VOICES = Number(process.env.SVARA_VOICE_LAB_MAX_VOICES || 12);
const TESTS = [
  ["conversation", "Hey, thanks for joining us. I wanted to tell you about something we've been working on."],
  ["excitement", "We did it! After months of work, the doors finally open today."],
  ["warmth", "Take a breath. You're exactly where you're supposed to be."],
  ["authority", "This is the most important decision your team will make this year."],
  ["storytelling", "The lights disappeared behind her as the train moved into the night."],
  ["south_african_pronunciation", "The team will meet in Johannesburg before travelling to Cape Town and Durban."],
  ["long_form", "The morning began quietly. By midday, the streets were alive with people, conversation and music. A small idea had become a real project, and everyone involved could finally see what was possible when careful work, creativity and persistence came together."]
];

const headers = { Authorization: `Token ${API_KEY}` };
const catalogueRes = await fetch("https://api.deepgram.com/v1/models", { headers });
if (!catalogueRes.ok) throw new Error(`Deepgram catalogue failed: ${catalogueRes.status} ${await catalogueRes.text()}`);
const catalogue = await catalogueRes.json();
const voices = (catalogue.tts || []).filter(v => String(v.canonical_name || "").startsWith("aura-2-")).slice(0, MAX_VOICES);
if (!voices.length) throw new Error("No Aura-2 TTS voices returned by Deepgram");

await mkdir(OUT, { recursive: true });
const samples = [];

for (const voice of voices) {
  const voiceId = voice.canonical_name;
  const safe = voiceId.replace(/[^a-z0-9_-]/gi, "_");
  for (const [testId, text] of TESTS) {
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceId)}&encoding=mp3`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      samples.push({ provider: "deepgram", voice_id: voiceId, test_id: testId, status: "error", http_status: response.status, error: (await response.text()).slice(0, 500) });
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const file = join(OUT, `${safe}__${testId}.mp3`);
    await writeFile(file, bytes);
    samples.push({
      provider: "deepgram",
      voice_id: voiceId,
      test_id: testId,
      status: "generated",
      file,
      bytes: bytes.length,
      catalogue_metadata: voice.metadata || {}
    });
  }
}

await writeFile(join(OUT, "samples.json"), JSON.stringify({ generated_at: new Date().toISOString(), provider: "deepgram", tests: TESTS.map(([id]) => id), samples }, null, 2));
console.log(`Generated ${samples.filter(s => s.status === "generated").length} samples across ${voices.length} voices.`);
