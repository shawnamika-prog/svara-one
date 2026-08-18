import { TTSProvider } from "./base.js";
export class DeepgramProvider extends TTSProvider {
  async generate({text, voice, speed}) {
    const key = this.env.DEEPGRAM_API_KEY;
    if (!key) throw new Error("DEEPGRAM_API_KEY is not configured");
    const model = voice.providerVoiceId || "aura-2-thalia-en";
    const url = new URL("https://api.deepgram.com/v1/speak");
    url.searchParams.set("model", model);
    url.searchParams.set("encoding", "mp3");
    url.searchParams.set("container", "mp3");
    if (speed) url.searchParams.set("speed", String(speed));
    const r = await fetch(url, {method:"POST",headers:{"Authorization":`Token ${key}`,"Content-Type":"application/json"},body:JSON.stringify({text})});
    if (!r.ok) throw new Error(`Deepgram request failed: ${r.status}`);
    return r;
  }
}
