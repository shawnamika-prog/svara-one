import app from "./index.js";

const PORTRAIT_CODES = new Set(["en", "es", "de", "fr", "nl", "it", "ja"]);

async function storedPortrait(env, code) {
  if (!env.VOICE_SAMPLES) return null;
  const cleanCode = String(code || "").replace(/-v\d+$/, "");
  if (!PORTRAIT_CODES.has(cleanCode)) return null;

  for (const extension of ["webp", "png"]) {
    const key = `portraits/${cleanCode}.${extension}`;
    const object = await env.VOICE_SAMPLES.get(key);
    if (!object) continue;

    return new Response(object.body, {
      headers: {
        "content-type": extension === "webp" ? "image/webp" : "image/png",
        "cache-control": "public, max-age=31536000, immutable",
        "etag": object.httpEtag || ""
      }
    });
  }

  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname.startsWith("/api/voice-portraits/")) {
      const code = url.pathname.split("/").pop();
      const portrait = await storedPortrait(env, code);
      if (portrait) return portrait;
    }

    return app.fetch(request, env, ctx);
  }
};
