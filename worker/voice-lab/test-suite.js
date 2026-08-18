export const VOICE_TESTS = [
  { id: "conversation", name: "Natural conversation", category: "conversation", prompt: "Read naturally, as if speaking to a real person. Keep the tone relaxed, warm and conversational.", text: "Hey, thanks for joining us. I wanted to tell you about something we've been working on, and I think you're going to like it." },
  { id: "excitement", name: "Excitement", category: "emotion", prompt: "Sound genuinely excited and energized, without becoming exaggerated or cartoonish.", text: "We did it! After months of work, the doors finally open today." },
  { id: "warmth", name: "Warmth", category: "emotion", prompt: "Sound warm, reassuring and emotionally present.", text: "Take a breath. You're exactly where you're supposed to be." },
  { id: "authority", name: "Authority", category: "commercial", prompt: "Sound confident, authoritative and polished, like a premium brand announcement.", text: "This is the most important decision your team will make this year." },
  { id: "storytelling", name: "Storytelling", category: "narration", prompt: "Tell the story with controlled pacing, vivid emphasis and natural dramatic variation.", text: "The lights disappeared behind her as the train moved into the night. For the first time, she was completely alone." },
  { id: "sa-pronunciation", name: "South African pronunciation", category: "pronunciation", prompt: "Speak naturally and clearly. Preserve accurate pronunciation of the South African place names.", text: "The team will meet in Johannesburg before travelling to Cape Town and Durban this Thursday." },
  { id: "long-form", name: "Long-form consistency", category: "consistency", prompt: "Maintain a consistent, natural delivery from beginning to end.", text: "Svara Origins brings global voices together in one creative workflow. From short social videos to long-form narration, creators can choose the voice that fits the moment. The goal is simple: professional audio, natural expression and a voice experience that stays consistent from the first sentence to the last." }
];

export const SCORE_DIMENSIONS = [
  { id: "naturalness", label: "Naturalness", description: "How human and believable the delivery sounds." },
  { id: "expression", label: "Expression", description: "How effectively emotion and intent are communicated." },
  { id: "prosody", label: "Prosody", description: "Rhythm, emphasis, pitch movement and pauses." },
  { id: "direction", label: "Direction following", description: "How accurately the requested delivery style is followed." },
  { id: "pronunciation", label: "Pronunciation", description: "Clarity and correctness of words and place names." },
  { id: "consistency", label: "Consistency", description: "Stability of quality across the full sample." },
  { id: "use_case", label: "Use-case fit", description: "How well the voice fits the specific test category." }
];

export function emptyScorecard() {
  return Object.fromEntries(SCORE_DIMENSIONS.map(d => [d.id, null]));
}
