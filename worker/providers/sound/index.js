import { SoundProvider } from "./base.js";

export function getSoundProvider(env, provider) {
  const name = String(provider || "").trim().toLowerCase();

  if (!name) {
    throw new Error("Sound provider is required");
  }

  throw new Error(`Unsupported Sound provider: ${provider}`);
}

export function getSoundProviderStatus(env) {
  return {};
}

export { SoundProvider };
