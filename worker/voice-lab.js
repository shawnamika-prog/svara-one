export const LAB_TESTS = [
  ["conversation", "Hey, thanks for joining us. I wanted to tell you about something we've been working on."],
  ["excitement", "We did it! After months of work, the doors finally open today."],
  ["warmth", "Take a breath. You're exactly where you're supposed to be."],
  ["authority", "This is the most important decision your team will make this year."],
  ["storytelling", "The lights disappeared behind her as the train moved into the night."],
  ["south_african_pronunciation", "The team will meet in Johannesburg before travelling to Cape Town and Durban."],
  ["long_form", "The morning began quietly. By midday, the streets were alive with people, conversation and music. A small idea had become a real project, and everyone involved could finally see what was possible when careful work, creativity and persistence came together."]
];

export function labAuthorized(request, env) {
  const expected = env.SVARA_LAB_TOKEN;
  const supplied = request.headers.get("X-Svara-Lab-Token") || "";
  return Boolean(expected && supplied && supplied === expected);
}

export function labJson(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export async function deepgramCatalogue(env) {
  if (!env.DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY is not configured");
  const res = await fetch("https://api.deepgram.com/v1/models", { headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` } });
  if (!res.ok) throw new Error(`Deepgram catalogue failed: ${res.status}`);
  const data = await res.json();
  return (data.tts || []).filter(v => String(v.canonical_name || "").startsWith("aura-2-"));
}

export async function generateLabSample(env, voiceId, testId) {
  const test = LAB_TESTS.find(([id]) => id === testId);
  if (!test) throw new Error("Unknown test");
  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceId)}&encoding=mp3`, {
    method: "POST",
    headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: test[1] })
  });
  if (!res.ok) throw new Error(`Deepgram generation failed: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return { test_id: testId, voice_id: voiceId, text: test[1], mime_type: "audio/mpeg", audio_base64: btoa(binary), bytes: bytes.length };
}
