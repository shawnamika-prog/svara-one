import { TTSProvider } from "./base.js";

export class FishProvider extends TTSProvider {
  async generate({ text, voice, speed, stability }) {
    const key = this.env.FISH_API_KEY;
    if (!key) throw new Error("FISH_API_KEY is not configured");
    const model = voice.providerModel || "s2-pro";
    const body = {
      text,
      format: "mp3",
      normalize: true,
      prosody: { speed: Math.min(2, Math.max(0.5, Number(speed) || 1)), volume: 0, normalize_loudness: true },
      temperature: Math.min(1, Math.max(0, 1 - ((Number(stability) || 50) / 100) * 0.7)),
      top_p: 0.7,
      reference_id: voice.providerVoiceId || undefined
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    const r = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "model": model },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`Fish Audio request failed: ${r.status}`);
    return r;
  }
}
