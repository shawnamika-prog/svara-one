import { readFile, writeFile } from "node:fs/promises";

const input = process.argv[2] || ".voice-lab-output/evaluations.json";
const output = process.argv[3] || ".voice-lab-output/rankings.json";
const data = JSON.parse(await readFile(input, "utf8"));

const dimensions = ["naturalness", "expression", "prosody", "instruction_following", "pronunciation", "consistency", "intelligibility"];
const weights = {
  naturalness: 0.20,
  expression: 0.18,
  prosody: 0.14,
  instruction_following: 0.12,
  pronunciation: 0.12,
  consistency: 0.12,
  intelligibility: 0.12
};
const useCases = {
  conversation: ["naturalness", "prosody", "intelligibility", "consistency"],
  advertising: ["naturalness", "expression", "prosody", "instruction_following"],
  narration: ["naturalness", "intelligibility", "pronunciation", "consistency"],
  storytelling: ["expression", "prosody", "naturalness", "consistency"],
  corporate: ["naturalness", "intelligibility", "instruction_following", "pronunciation"],
  emotional: ["expression", "prosody", "instruction_following", "naturalness"]
};

const avg = (obj, keys) => keys.reduce((sum, key) => sum + Number(obj[key] || 0), 0) / keys.length;
const rows = (data.evaluations || []).map(item => {
  const d = item.dimensions || {};
  const overall = dimensions.reduce((sum, key) => sum + Number(d[key] || 0) * weights[key], 0);
  const scores = Object.fromEntries(Object.entries(useCases).map(([name, keys]) => [name, Number(avg(d, keys).toFixed(2))]));
  return { provider: item.provider, voice_id: item.voice_id, dimensions: d, overall: Number(overall.toFixed(2)), use_cases: scores };
}).sort((a, b) => b.overall - a.overall);

const rankings = { generated_at: new Date().toISOString(), methodology: { dimensions, weights, use_cases }, voices: rows };
await writeFile(output, JSON.stringify(rankings, null, 2));
console.log(JSON.stringify(rankings, null, 2));
