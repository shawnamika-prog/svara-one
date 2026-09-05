export class SoundProvider {
  constructor(env) {
    this.env = env;
  }

  async generate() {
    throw new Error("Sound provider not implemented");
  }
}
