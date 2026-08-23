import { TTSProvider } from "./base.js";

export class DeepgramProvider extends TTSProvider {
  async generate({ text, voice, speed, format = "mp3" }) {
    const key = this.env.DEEPGRAM_API_KEY;
    if (!key) throw new Error("DEEPGRAM_API_KEY is not configured");

    const model = voice.providerVoiceId || "aura-2-thalia-en";
    const output = String(format || "mp3").toLowerCase();
    if (!["mp3", "wav", "pcm"].includes(output)) throw new Error("Unsupported audio output format");

    const url = new URL("https://api.deepgram.com/v1/speak");
    url.searchParams.set("model", model);

    if (output === "mp3") {
      url.searchParams.set("encoding", "mp3");
    } else {
      url.searchParams.set("encoding", "linear16");
      url.searchParams.set("container", output === "wav" ? "wav" : "none");
    }

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
