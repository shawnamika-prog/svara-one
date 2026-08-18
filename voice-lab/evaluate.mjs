import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";

const execFileAsync = promisify(execFile);
const input = process.argv[2] || ".voice-lab-output/samples.json";
const outputDir = process.env.SVARA_VOICE_LAB_DIR || ".voice-lab-output";
const API_KEY = process.env.DEEPGRAM_API_KEY;
if (!API_KEY) throw new Error("DEEPGRAM_API_KEY is required for transcription evaluation");

const manifest = JSON.parse(await readFile(input, "utf8"));
const TESTS = new Map([
  ["conversation", "Hey, thanks for joining us. I wanted to tell you about something we've been working on."],
  ["excitement", "We did it! After months of work, the doors finally open today."],
  ["warmth", "Take a breath. You're exactly where you're supposed to be."],
  ["authority", "This is the most important decision your team will make this year."],
  ["storytelling", "The lights disappeared behind her as the train moved into the night."],
  ["south_african_pronunciation", "The team will meet in Johannesburg before travelling to Cape Town and Durban."],
  ["long_form", "The morning began quietly. By midday, the streets were alive with people, conversation and music. A small idea had become a real project, and everyone involved could finally see what was possible when careful work, creativity and persistence came together."]
]);

function normalize(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9']+/g, " ").trim().split(/\s+/).filter(Boolean);
}
function wordErrorRate(reference, hypothesis) {
  const a = normalize(reference), b = normalize(hypothesis);
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : Math.min(prev[j - 1] + 1, prev[j] + 1, cur[j - 1] + 1);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return a.length ? prev[b.length] / a.length : 0;
}

async function audioMetrics(file) {
  try {
    const { stdout } = await execFileAsync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=sample_rate,channels", "-of", "json", file]);
    const parsed = JSON.parse(stdout);
    const stream = parsed.streams?.[0] || {};
    return {
      duration_seconds: Number(parsed.format?.duration || 0),
      bytes: Number(parsed.format?.size || 0),
      sample_rate: Number(stream.sample_rate || 0),
      channels: Number(stream.channels || 0)
    };
  } catch {
    return { duration_seconds: null, bytes: null, sample_rate: null, channels: null, ffprobe_available: false };
  }
}

async function transcribe(file) {
  const bytes = await readFile(file);
  const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true", {
    method: "POST",
    headers: { Authorization: `Token ${API_KEY}`, "Content-Type": "audio/mpeg" },
    body: bytes
  });
  if (!response.ok) throw new Error(`Deepgram transcription failed: ${response.status} ${(await response.text()).slice(0, 300)}`);
  const json = await response.json();
  const alt = json.results?.channels?.[0]?.alternatives?.[0] || {};
  return { transcript: alt.transcript || "", confidence: Number(alt.confidence || 0) };
}

await mkdir(outputDir, { recursive: true });
const evaluations = [];
const judgePackets = [];
for (const sample of manifest.samples || []) {
  if (sample.status !== "generated") continue;
  const reference = TESTS.get(sample.test_id) || "";
  const metrics = await audioMetrics(sample.file);
  const stt = await transcribe(sample.file);
  const wer = wordErrorRate(reference, stt.transcript);
  const pronunciation = Math.max(1, Math.min(10, 10 - wer * 10));
  const intelligibility = Math.max(1, Math.min(10, 5 + stt.confidence * 5 - Math.min(3, wer * 5)));
  const base = {
    provider: sample.provider,
    voice_id: sample.voice_id,
    test_id: sample.test_id,
    file: sample.file,
    reference_text: reference,
    transcript: stt.transcript,
    transcription_confidence: stt.confidence,
    word_error_rate: Number(wer.toFixed(4)),
    objective_dimensions: {
      pronunciation: Number(pronunciation.toFixed(2)),
      intelligibility: Number(intelligibility.toFixed(2))
    },
    audio_metrics: metrics
  };
  evaluations.push(base);
  judgePackets.push({
    ...base,
    judge_prompt: `Evaluate this ${sample.test_id} voice sample for Svara Origins. Do not use provider name, voice metadata, or reputation. Judge only the audio against the supplied script and test purpose. Return JSON with scores 1-10 for naturalness, expression, prosody, instruction_following, consistency, plus brief evidence for each. Pronunciation and intelligibility should be treated as evidence from the supplied transcript/objective metrics, not guessed. Test script: ${reference}. Transcript: ${stt.transcript}.`
  });
}

await writeFile(join(outputDir, "evaluations.json"), JSON.stringify({ generated_at: new Date().toISOString(), methodology: "objective audio/STT preflight; subjective dimensions require a separate audio-capable judge", evaluations }, null, 2));
await writeFile(join(outputDir, "judge-packets.json"), JSON.stringify({ generated_at: new Date().toISOString(), note: "Feed each packet plus its referenced audio to an authorized audio-capable evaluator. Do not treat provider metadata as a score.", packets: judgePackets }, null, 2));
console.log(`Evaluated ${evaluations.length} generated samples. Wrote evaluations.json and judge-packets.json.`);
