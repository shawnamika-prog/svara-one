import { SoundProvider } from "./base.js";

const SOUND_PROVIDERS = Object.freeze({});

export function getSoundProvider(env, provider) {
  const name = String(provider || "").trim().toLowerCase();

  if (!name) {
    throw new Error("Sound provider is required");
  }

  const ProviderClass = SOUND_PROVIDERS[name];
  if (!ProviderClass) {
    throw new Error(`Unsupported Sound provider: ${provider}`);
  }

  return new ProviderClass(env);
}

export function getSoundProviderStatus(env) {
  return Object.fromEntries(
    Object.entries(SOUND_PROVIDERS).map(([name, ProviderClass]) => {
      const provider = new ProviderClass(env);
      return [name, provider.getStatus()];
    })
  );
}

export { SoundProvider };
