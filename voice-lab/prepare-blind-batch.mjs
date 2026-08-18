import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const input = process.argv[2] || ".voice-lab-output/samples.json";
const output = process.argv[3] || ".voice-lab-output/blind-batch.json";
const data = JSON.parse(await readFile(input, "utf8"));

const tests = new Map([
  ["conversation", "Natural conversational delivery"],
  ["excitement", "Genuine excitement and forward energy"],
  ["warmth", "Warm, reassuring and human"],
  ["authority", "Confident, credible and authoritative without sounding robotic"],
  ["storytelling", "Engaging narrative delivery with appropriate pacing"],
  ["south_african_pronunciation", "Clear pronunciation of South African place names and natural English delivery"],
  ["long_form", "Consistent, intelligible delivery over a longer passage"]
]);

let seed = 0x9e3779b9;
const random = () => {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
};

const generated = data.samples.filter(s => s.status === "generated");
const groups = new Map();
for (const sample of generated) {
  const key = sample.voice_id;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(sample);
}

const voices = [...groups.keys()].sort(() => random() - 0.5);
const voiceAlias = new Map(voices.map((voice, i) => [voice, `V${String(i + 1).padStart(2, "0")}`]));
const blindSamples = generated.map((sample, i) => ({
  sample_id: `S${String(i + 1).padStart(3, "0")}`,
  blind_voice_id: voiceAlias.get(sample.voice_id),
  test_id: sample.test_id,
  objective: tests.get(sample.test_id) || sample.test_id,
  audio_file: basename(sample.file),
  provider: "redacted",
  voice_id: "redacted"
}));

const blindVoices = voices.map(voice => ({ blind_voice_id: voiceAlias.get(voice), sample_count: groups.get(voice).length }));
await writeFile(output, JSON.stringify({
  generated_at: new Date().toISOString(),
  purpose: "Blind Svara voice evaluation",
  voices: blindVoices,
  samples: blindSamples,
  reveal_map: Object.fromEntries(voices.map(voice => [voiceAlias.get(voice), voice]))
}, null, 2));
console.log(`Prepared ${blindSamples.length} blind samples across ${voices.length} voices.`);
console.log(`Reveal map is stored in ${output} and must not be shown to the judge.`);
