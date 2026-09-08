export function soundResultMimeType(format) {
  switch (String(format || "").trim().toLowerCase()) {
    case "wav": return "audio/wav";
    case "mp3": return "audio/mpeg";
    case "pcm": return "audio/l16;rate=24000";
    default: return null;
  }
}

export class SoundProvider {
  constructor(env) {
    this.env = env;
  }

  async generate(_request) {
    throw new Error("Sound provider generate() not implemented");
  }

  async getResult(_providerGenerationId) {
    throw new Error("Sound provider result retrieval not implemented");
  }

  async discoverCapabilities() {
    throw new Error("Sound provider discoverCapabilities() not implemented");
  }

  getVersion() {
    return null;
  }

  normalizeResult(_result) {
    throw new Error("Sound provider normalizeResult() not implemented");
  }

  getStatus() {
    throw new Error("Sound provider getStatus() not implemented");
  }
}
