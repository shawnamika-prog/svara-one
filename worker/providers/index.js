import { DeepgramProvider } from "./deepgram.js";
import { FishProvider } from "./fish.js";
import { MurfProvider } from "./murf.js";

export function getProvider(env, voice) {
  switch ((voice.provider || "deepgram").toLowerCase()) {
    case "deepgram": return new DeepgramProvider(env);
    case "fish": return new FishProvider(env);
    case "murf": return new MurfProvider(env);
    default: throw new Error(`Unsupported provider: ${voice.provider}`);
  }
}

export function getProviderStatus(env) {
  return {
    deepgram: Boolean(env.DEEPGRAM_API_KEY),
    fish: Boolean(env.FISH_API_KEY),
    murf: Boolean(env.MURF_API_KEY)
  };
}
