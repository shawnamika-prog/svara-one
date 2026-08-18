import { TTSProvider } from "./base.js";

export class MurfProvider extends TTSProvider {
  async generate({ text, voice, speed, style }) {
    const key = this.env.MURF_API_KEY;
    if (!key) throw new Error("MURF_API_KEY is not configured");
    const normalizedSpeed = Number(speed) || 1;
    const rate = Math.round((normalizedSpeed - 1) * 100);
    const body = {
      text,
      voiceId: voice.providerVoiceId,
      modelVersion: voice.providerModel || "GEN2",
      format: "MP3",
      channelType: "MONO",
      sampleRate: 44100,
      rate: Math.max(-50, Math.min(50, rate)),
      style: voice.providerStyle || style || undefined,
      locale: voice.providerLocale || undefined
    };
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    const r = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`Murf request failed: ${r.status}`);
    const data = await r.json();
    if (!data.audioFile) throw new Error("Murf returned no audio file");
    return fetch(data.audioFile);
  }
}
