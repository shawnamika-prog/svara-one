import { getProvider, getProviderStatus } from "./providers/index.js";
import { deepgramCatalogue, generateLabSample, LAB_TESTS, labAuthorized, labJson } from "./voice-lab.js";

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
    "Access-Control-Allow-Headers":"Content-Type,Authorization,X-Svara-Lab-Token",
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

  // PRIVATE VOICE LAB: temporary research endpoints. Requires a separate
  // SVARA_LAB_TOKEN secret and never exposes DEEPGRAM_API_KEY.
  if (url.pathname==="/api/lab/catalogue" && request.method==="GET") {
    if (!labAuthorized(request,env)) return labJson({error:"Unauthorized"},401);
    try {
      const voices=await deepgramCatalogue(env);
      return labJson({provider:"deepgram",tests:LAB_TESTS.map(([id])=>id),voices:voices.map(v=>({voice_id:v.canonical_name,metadata:v.metadata||{}}))});
    } catch(err) { return labJson({error:String(err?.message||"Catalogue failed").slice(0,300)},502); }
  }

  // Generate up to 6 voices x 7 tests (42 upstream calls), staying below the
  // Cloudflare Free Worker subrequest ceiling. The caller downloads the
  // returned base64 MP3 samples and can upload them for blind evaluation.
  if (url.pathname==="/api/lab/batch" && request.method==="POST") {
    if (!labAuthorized(request,env)) return labJson({error:"Unauthorized"},401);
    try {
      const body=await request.json().catch(()=>({}));
      const voices=[...new Set((Array.isArray(body.voiceIds)?body.voiceIds:[]).map(String).filter(Boolean))].slice(0,6);
      if (!voices.length) return labJson({error:"Provide 1-6 voiceIds"},400);
      const tests=LAB_TESTS.map(([id])=>id);
      const samples=[];
      for (const voiceId of voices) {
        for (const testId of tests) {
          try { samples.push({status:"generated",...(await generateLabSample(env,voiceId,testId))}); }
          catch(err) { samples.push({status:"error",voice_id:voiceId,test_id:testId,error:String(err?.message||"Generation failed").slice(0,300)}); }
        }
      }
      return labJson({provider:"deepgram",generated_at:new Date().toISOString(),samples});
    } catch(err) { return labJson({error:String(err?.message||"Batch failed").slice(0,300)},502); }
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
