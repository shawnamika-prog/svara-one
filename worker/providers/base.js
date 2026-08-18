export class TTSProvider {
  constructor(env) { this.env = env; }
  async generate() { throw new Error("Provider not implemented"); }
}
