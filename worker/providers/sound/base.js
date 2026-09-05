export class SoundProvider {
  constructor(env) {
    this.env = env;
  }

  async generate(_request) {
    throw new Error("Sound provider generate() not implemented");
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
