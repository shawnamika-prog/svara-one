import { getProvider, getProviderStatus } from "./providers/index.js";
import { LAB_TESTS, generateLabSample } from "./voice-lab.js";

const VOICES = {
  "svara-amara-01": {provider:"deepgram",providerVoiceId:"aura-2-thalia-en"},
  "svara-james-01": {provider:"deepgram",providerVoiceId:"aura-2-orion-en"},
  "svara-thandi-01": {provider:"deepgram",providerVoiceId:"aura-2-thalia-en"},
  "svara-daniel-01": {provider:"deepgram",providerVoiceId:"aura-2-orion-en"},
  "svara-lea-01": {provider:"deepgram",providerVoiceId:"aura-2-thalia-en"},
  "svara-premium-01": {provider:"deepgram",providerVoiceId:"aura-2-thalia-en"}
};

const MAX_CHARS = 10000;
const ALLOWED_ORIGINS = new Set([
  "https://svara.io",
  "https://www.svara.io",
  "https://svara-origins.pages.dev",
  "https://svara-origins.shawnamika.workers.dev",
  "http://localhost:8788",
  "http://127.0.0.1:8788"
]);

function cors(request) {
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "null",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type,Authorization",
    "Vary":"Origin"
  };
}
function json(data,status=200,request) {
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8",...cors(request)}});
}

export default {
 async fetch(request,env) {
  if (request.method==="OPTIONS") return new Response(null,{headers:cors(request)});
  const url=new URL(request.url);

  if (url.pathname==="/api/health") return json({ok:true,service:"svara-origins-api",version:"2",providers:getProviderStatus(env)},200,request);

  // TEMPORARY PRIVATE-BETA LAB ROUTE. Fixed tests/voices only; no arbitrary text.
  // It uses the existing DEEPGRAM_API_KEY secret and should be removed after calibration.
  if (url.pathname==="/api/lab/sample" && request.method==="POST") {
    const origin=request.headers.get("Origin")||"";
    if (!ALLOWED_ORIGINS.has(origin)) return new Response("Not found",{status:404});
    try {
      const body=await request.json();
      const allowedTests=new Set(LAB_TESTS.map(([id])=>id));
      const voice=String(body.voice||"");
      const test=String(body.test||"");
      if (!/^aura-2-[a-z0-9-]+$/.test(voice) || !allowedTests.has(test)) return json({error:"Invalid lab selection"},400,request);
      const sample=await generateLabSample(env,voice,test);
      const binary=atob(sample.audio_base64);
      const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
      return new Response(bytes,{status:200,headers:{"content-type":"audio/mpeg","cache-control":"no-store","x-svara-lab-voice":voice,"x-svara-lab-test":test}});
    } catch(err) {
      console.error("lab_generation_error",err);
      return json({error:String(err?.message||"Lab generation failed").slice(0,300)},502,request);
    }
  }

  if (url.pathname==="/api/voice/generate" && request.method==="POST") {
    try {
      const body=await request.json();
      const text=String(body.text||"").trim();
      if(!text) return json({error:"Text is required"},400,request);
      if(text.length>MAX_CHARS) return json({error:`Maximum ${MAX_CHARS} characters per generation`},400,request);
      const voice=VOICES[body.voiceId] || VOICES["svara-amara-01"];
      const provider=getProvider(env,voice);
      const upstream=await provider.generate({
        text,
        voice,
        speed:Number(body.speed)||1,
        stability:Number(body.stability)||50,
        style:String(body.style||"")
      });
      const headers=new Headers(upstream.headers);
      headers.set("content-type","audio/mpeg");
      headers.set("cache-control","private, no-store");
      return new Response(upstream.body,{status:200,headers});
    } catch(err) {
      console.error("generation_error",err);
      if (url.searchParams.get("debug")==="1") {
        const message=String(err?.message||"Unknown provider error").slice(0,500);
        return json({error:"Voice generation failed",diagnostic:true,message,provider:(VOICES["svara-amara-01"]?.provider||"unknown")},502,request);
      }
      return json({error:"Voice generation failed. Please try again."},502,request);
    }
  }
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return new Response("Not found",{status:404,headers:cors(request)});
 }
};
