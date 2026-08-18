import { DeepgramProvider } from "./deepgram.js";
export function getProvider(env, voice) {
  switch ((voice.provider || "deepgram").toLowerCase()) {
    case "deepgram": return new DeepgramProvider(env);
    default: throw new Error(`Unsupported provider: ${voice.provider}`);
  }
}
