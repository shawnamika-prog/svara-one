export class SoundProvider {
  constructor(env) {
    this.env = env;
  }

  async generate(_request) {
    throw new Error("Sound provider generate() not implemented");
  }

  getCapabilities() {
    throw new Error("Sound provider getCapabilities() not implemented");
  }

  normalizeResult(_result) {
    throw new Error("Sound provider normalizeResult() not implemented");
  }

  getStatus() {
    throw new Error("Sound provider getStatus() not implemented");
  }
}
