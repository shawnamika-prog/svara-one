import { TTSProvider } from "./base.js";

export class DeepgramProvider extends TTSProvider {
  async generate({ text, voice, speed }) {
    const key = this.env.DEEPGRAM_API_KEY;
    if (!key) throw new Error("DEEPGRAM_API_KEY is not configured");

    const model = voice.providerVoiceId || "aura-2-thalia-en";
    const url = new URL("https://api.deepgram.com/v1/speak");
    url.searchParams.set("model", model);
    // MP3 is a supported REST encoding. Do not send container=mp3:
    // Deepgram's container parameter is for compatible wrappers such as WAV.
    url.searchParams.set("encoding", "mp3");
    if (speed) url.searchParams.set("speed", String(speed));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Token ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      let detail = "";
      try {
        detail = (await response.text()).slice(0, 300);
      } catch {}
      throw new Error(`Deepgram request failed: ${response.status}${detail ? ` — ${detail}` : ""}`);
    }

    return response;
  }
}
