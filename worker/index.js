import { getProvider, getProviderStatus } from "./providers/index.js";
import { LAB_TESTS, generateLabSample, deepgramCatalogue } from "./voice-lab.js";

const LAB_TESTS = [
  ["conversation", "Hey, thanks for joining us. I wanted to tell you about something we've been working on."],
  ["excitement", "We did it! After months of work, the doors finally open today."],
  ["warmth", "Take a breath. You're exactly where you're supposed to be."],
  ["authority", "This is the most important decision your team will make this year."],
  ["storytelling", "The lights disappeared behind her as the train moved into the night."],
  ["south_african_pronunciation", "The team will meet in Johannesburg before travelling to Cape Town and Durban."],
  ["long_form", "The morning began quietly. By midday, the streets were alive with people, conversation and music. A small idea had become a real project, and everyone involved could finally see what was possible when careful work, creativity and persistence came together."]
];

function labAuthorized(request, env) {
  const expected = env.SVARA_LAB_TOKEN;
  const supplied = request.headers.get("X-Svara-Lab-Token") || "";
  return Boolean(expected && supplied && supplied === expected);
}

function labJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

async function deepgramCatalogue(env) {
  if (!env.DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY is not configured");
  const res = await fetch("https://api.deepgram.com/v1/models", {
    headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}` }
  });
  if (!res.ok) throw new Error(`Deepgram catalogue failed: ${res.status}`);
  const data = await res.json();
  return (data.tts || []).filter(v => String(v.canonical_name || "").startsWith("aura-2-"));
}

async function generateLabSample(env, voiceId, testId) {
  const test = LAB_TESTS.find(([id]) => id === testId);
  if (!test) throw new Error("Unknown test");
  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceId)}&encoding=mp3`, {
    method: "POST",
    headers: { Authorization: `Token ${env.DEEPGRAM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: test[1] })
  });
  if (!res.ok) throw new Error(`Deepgram generation failed: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return {
    test_id: testId,
    voice_id: voiceId,
    text: test[1],
    mime_type: "audio/mpeg",
    audio_base64: btoa(binary),
    bytes: bytes.length
  };
}

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
function cors(request){const origin=request.headers.get("Origin")||"";return {"Access-Control-Allow-Origin":ALLOWED_ORIGINS.has(origin)?origin:"null","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization","Vary":"Origin"};}
function json(data,status=200,request){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8",...cors(request)}});}
function labAllowed(request){return ALLOWED_ORIGINS.has(request.headers.get("Origin")||"");}

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

  // Private Voice Intelligence Lab. Fixed-scope research only.
  if (url.pathname==="/api/lab/catalogue" && request.method==="GET") {
    if (!labAuthorized(request,env)) return labJson({error:"Unauthorized"},401);
    try {
      const voices=await deepgramCatalogue(env);
      return labJson({provider:"deepgram",tests:LAB_TESTS.map(([id])=>id),voices:voices.map(v=>({voice_id:v.canonical_name,metadata:v.metadata||{}}))});
    } catch(err) { return labJson({error:String(err?.message||"Catalogue failed").slice(0,300)},502); }
  }

  if (url.pathname==="/api/lab/batch" && request.method==="POST") {
    if (!labAuthorized(request,env)) return labJson({error:"Unauthorized"},401);
    try {
      const body=await request.json().catch(()=>({}));
      const voices=[...new Set((Array.isArray(body.voiceIds)?body.voiceIds:[]).map(String).filter(Boolean))].slice(0,6);
      if (!voices.length) return labJson({error:"Provide 1-6 voiceIds"},400);
      const samples=[];
      for (const voiceId of voices) {
        for (const [testId] of LAB_TESTS) {
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
      return json({version:"0.1",provider:"deepgram",test_count:LAB_TESTS.length,voice_count:voices.length,samples},200,request);
    }catch(err){return json({error:String(err?.message||"Lab batch failed").slice(0,300)},502,request);}
  }
  if(url.pathname==="/api/lab/sample"&&request.method==="POST"){
    if(!labAllowed(request))return new Response("Not found",{status:404});
    try{const body=await request.json();const allowedTests=new Set(LAB_TESTS.map(([id])=>id));const voice=String(body.voice||"");const test=String(body.test||"");if(!/^aura-2-[a-z0-9-]+$/.test(voice)||!allowedTests.has(test))return json({error:"Invalid lab selection"},400,request);const sample=await generateLabSample(env,voice,test);const binary=atob(sample.audio_base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Response(bytes,{status:200,headers:{"content-type":"audio/mpeg","cache-control":"no-store","x-svara-lab-voice":voice,"x-svara-lab-test":test}});}catch(err){return json({error:String(err?.message||"Lab generation failed").slice(0,300)},502,request);}
  }
  if(url.pathname==="/api/voice/generate"&&request.method==="POST"){
    try{const body=await request.json();const text=String(body.text||"").trim();if(!text)return json({error:"Text is required"},400,request);if(text.length>MAX_CHARS)return json({error:`Maximum ${MAX_CHARS} characters per generation`},400,request);const voice=VOICES[body.voiceId]||VOICES["svara-amara-01"];const provider=getProvider(env,voice);const upstream=await provider.generate({text,voice,speed:Number(body.speed)||1,stability:Number(body.stability)||50,style:String(body.style||"")});const headers=new Headers(upstream.headers);headers.set("content-type","audio/mpeg");headers.set("cache-control","private, no-store");return new Response(upstream.body,{status:200,headers});}
    catch(err){console.error("generation_error",err);if(url.searchParams.get("debug")==="1"){const message=String(err?.message||"Unknown provider error").slice(0,500);return json({error:"Voice generation failed",diagnostic:true,message,provider:(VOICES["svara-amara-01"]?.provider||"unknown")},502,request);}return json({error:"Voice generation failed. Please try again."},502,request);}
  }
  if(env.ASSETS)return env.ASSETS.fetch(request);
  return new Response("Not found",{status:404,headers:cors(request)});
}};
