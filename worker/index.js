const VOICE_MODELS = {
  "TEST-VOICE-01": "aura-2-thalia-en",
  "TEST-VOICE-02": "aura-2-asteria-en",
  "TEST-VOICE-03": "aura-2-andromeda-en"
};

const MAX_CHARS = 2000;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin)
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    if (url.pathname !== "/api/voice/generate") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    if (!env.DEEPGRAM_API_KEY) {
      return json({ error: "Development voice service is not configured yet." }, 503, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be valid JSON." }, 400, origin);
    }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const voiceId = typeof body.voiceId === "string" ? body.voiceId : "TEST-VOICE-01";
    const format = body.format === "wav" ? "wav" : "mp3";
    const speed = Number(body.speed);

    if (!text) {
      return json({ error: "Text is required." }, 400, origin);
    }

    if (text.length > MAX_CHARS) {
      return json({
        error: `Development generation is limited to ${MAX_CHARS} characters per request.`
      }, 413, origin);
    }

    const model = VOICE_MODELS[voiceId];
    if (!model) {
      return json({ error: "Unknown development voice." }, 400, origin);
    }

    const params = new URLSearchParams({
      model,
      encoding: format === "wav" ? "linear16" : "mp3"
    });

    if (format === "wav") {
      params.set("container", "wav");
      params.set("sample_rate", "24000");
    }

    if (Number.isFinite(speed)) {
      params.set("speed", String(Math.min(1.5, Math.max(0.7, speed))));
    }

    const response = await fetch(`https://api.deepgram.com/v1/speak?${params.toString()}`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const detail = await response.text();
      return json({
        error: "The development voice provider could not generate audio.",
        providerStatus: response.status,
        detail: detail.slice(0, 500)
      }, response.status, origin);
    }

    const headers = new Headers(corsHeaders(origin));
    headers.set("Content-Type", response.headers.get("Content-Type") || (format === "wav" ? "audio/wav" : "audio/mpeg"));
    headers.set("Cache-Control", "no-store");
    headers.set("X-Svara-Voice-Id", voiceId);
    headers.set("X-Svara-Provider", "development");

    return new Response(response.body, { status: 200, headers });
  }
};
