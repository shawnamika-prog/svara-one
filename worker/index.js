import { getProvider, getProviderStatus } from "./providers/index.js";
import { getPortrait } from "./voice-portraits.js";

const LAB_TESTS = [
  ["conversation", "Hey, thanks for joining us. I wanted to tell you about something we've been working on."],
  ["excitement", "We did it! After months of work, the doors finally open today."],
  ["warmth", "Take a breath. You're exactly where you're supposed to be."],
  ["authority", "This is the most important decision your team will make this year."],
  ["storytelling", "The lights disappeared behind her as the train moved into the night."],
  ["south_african_pronunciation", "The team will meet in Johannesburg before travelling to Cape Town and Durban."],
  ["long_form", "The morning began quietly. By midday, the streets were alive with people, conversation and music. A small idea had become a real project, and everyone involved could finally see what was possible when careful work, creativity and persistence came together."]
];

const SAMPLE_VOICES = [
  {code:"en", language:"English", voiceId:"aura-2-thalia-en", name:"Thalia", accent:"American English", text:"Hello, and welcome to SvaraONE. Discover a voice that sounds natural, expressive, and ready for real work."},
  {code:"es", language:"Spanish", voiceId:"aura-2-celeste-es", name:"Celeste", accent:"Colombian Spanish", text:"Hola, y bienvenido a SvaraONE. Descubre una voz natural, expresiva y lista para el trabajo real."},
  {code:"de", language:"German", voiceId:"aura-2-julius-de", name:"Julius", accent:"German", text:"Hallo und willkommen bei SvaraONE. Entdecken Sie eine natürliche, ausdrucksstarke Stimme für echte Projekte."},
  {code:"fr", language:"French", voiceId:"aura-2-agathe-fr", name:"Agathe", accent:"French", text:"Bonjour et bienvenue chez SvaraONE. Découvrez une voix naturelle, expressive et prête pour vos projets."},
  {code:"nl", language:"Dutch", voiceId:"aura-2-rhea-nl", name:"Rhea", accent:"Dutch", text:"Hallo en welkom bij SvaraONE. Ontdek een natuurlijke, expressieve stem die klaar is voor echt werk."},
  {code:"it", language:"Italian", voiceId:"aura-2-livia-it", name:"Livia", accent:"Italian", text:"Ciao e benvenuto su SvaraONE. Scopri una voce naturale, espressiva e pronta per il lavoro reale."},
  {code:"ja", language:"Japanese", voiceId:"aura-2-izanami-ja", name:"Izanami", accent:"Japanese", text:"こんにちは、SvaraONEへようこそ。自然で表現力豊かな音声を、実際のコンテンツにお使いいただけます。"}
];

const HERO_SAMPLE = {
  key: "samples/hero-amara-r2.mp3",
  voiceId: "aura-2-thalia-en",
  language: "English",
  name: "Amara",
  accent: "American English · Conversational",
  text: "Hi, I'm Amara, one of the voices at SvaraONE. SvaraONE turns your words into natural, expressive speech — for videos, businesses, creators, and everything in between. Just write what you want to say, choose your voice, and let SvaraONE bring it to life."
};

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
  "https://svaraone.com",
  "https://www.svaraone.com",
  "https://svaraone.io",
  "https://www.svaraone.io",
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
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...cors(request)}});
}
function labAllowed(request){return ALLOWED_ORIGINS.has(request.headers.get("Origin")||"");}

async function deepgramCatalogue(env) {
  if (!env.DEEPGRAM_API_KEY) throw new Error("DEEPGRAM_API_KEY is not configured");
  const res = await fetch("https://api.deepgram.com/v1/models", {headers:{Authorization:`Token ${env.DEEPGRAM_API_KEY}`}});
  if (!res.ok) throw new Error(`Deepgram catalogue failed: ${res.status}`);
  const data = await res.json();
  return (data.tts || []).filter(v => String(v.canonical_name || "").startsWith("aura-2-"));
}

async function generateAudio(env, voiceId, text) {
  const res=await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceId)}&encoding=mp3`,{method:"POST",headers:{Authorization:`Token ${env.DEEPGRAM_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({text})});
  if(!res.ok) throw new Error(`Deepgram generation failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function storedPortrait(env,code){
  if(!env.VOICE_SAMPLES) throw new Error("VOICE_SAMPLES R2 binding is not configured");
  const svg=getPortrait(code);
  if(!svg) return new Response("Not found",{status:404});
  const key=`portraits/${code}.svg`;
  const existing=await env.VOICE_SAMPLES.get(key);
  if(existing) return new Response(existing.body,{headers:{"content-type":"image/svg+xml; charset=utf-8","cache-control":"public, max-age=31536000, immutable","etag":existing.httpEtag||""}});
  await env.VOICE_SAMPLES.put(key,svg,{httpMetadata:{contentType:"image/svg+xml; charset=utf-8",cacheControl:"public, max-age=31536000, immutable"},customMetadata:{assetType:"voice-portrait",code}});
  return new Response(svg,{headers:{"content-type":"image/svg+xml; charset=utf-8","cache-control":"public, max-age=31536000, immutable"}});
}

async function storedSample(env, sample) {
  if(!env.VOICE_SAMPLES) throw new Error("VOICE_SAMPLES R2 binding is not configured");
  const key=`samples/${sample.code}.mp3`;
  const existing=await env.VOICE_SAMPLES.get(key);
  if(existing) return new Response(existing.body,{headers:{"content-type":"audio/mpeg","cache-control":"public, max-age=31536000, immutable","etag":existing.httpEtag||""}});
  const bytes=await generateAudio(env,sample.voiceId,sample.text);
  await env.VOICE_SAMPLES.put(key,bytes,{httpMetadata:{contentType:"audio/mpeg",cacheControl:"public, max-age=31536000, immutable"},customMetadata:{language:sample.language,voiceId:sample.voiceId,name:sample.name}});
  return new Response(bytes,{headers:{"content-type":"audio/mpeg","cache-control":"public, max-age=31536000, immutable"}});
}

async function storedHeroSample(env) {
  if(!env.VOICE_SAMPLES) throw new Error("VOICE_SAMPLES R2 binding is not configured");
  const existing=await env.VOICE_SAMPLES.get(HERO_SAMPLE.key);
  if(existing) return new Response(existing.body,{headers:{"content-type":"audio/mpeg","cache-control":"public, max-age=31536000, immutable","etag":existing.httpEtag||""}});
  const bytes=await generateAudio(env,HERO_SAMPLE.voiceId,HERO_SAMPLE.text);
  await env.VOICE_SAMPLES.put(HERO_SAMPLE.key,bytes,{httpMetadata:{contentType:"audio/mpeg",cacheControl:"public, max-age=31536000, immutable"},customMetadata:{language:HERO_SAMPLE.language,voiceId:HERO_SAMPLE.voiceId,name:HERO_SAMPLE.name,accent:HERO_SAMPLE.accent,version:"r2"}});
  return new Response(bytes,{headers:{"content-type":"audio/mpeg","cache-control":"public, max-age=31536000, immutable"}});
}

async function seedSampleVoices(env) {
  if(!env.VOICE_SAMPLES) throw new Error("VOICE_SAMPLES R2 binding is not configured");
  const results=[];
  for(const sample of SAMPLE_VOICES){
    const key=`samples/${sample.code}.mp3`;
    if(await env.VOICE_SAMPLES.head(key)){results.push({language:sample.language,status:"cached"});continue;}
    const bytes=await generateAudio(env,sample.voiceId,sample.text);
    await env.VOICE_SAMPLES.put(key,bytes,{httpMetadata:{contentType:"audio/mpeg",cacheControl:"public, max-age=31536000, immutable"},customMetadata:{language:sample.language,voiceId:sample.voiceId,name:sample.name}});
    results.push({language:sample.language,status:"generated"});
  }
  return results;
}

async function generateLabSample(env, voiceId, testId) {
  const test=LAB_TESTS.find(([id])=>id===testId);
  if(!test) throw new Error("Unknown test");
  const bytes=await generateAudio(env,voiceId,test[1]);
  let binary=""; for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return {test_id:testId,voice_id:voiceId,text:test[1],mime_type:"audio/mpeg",audio_base64:btoa(binary),bytes:bytes.length};
}

export default {
 async fetch(request,env){
  if(request.method==="OPTIONS") return new Response(null,{headers:cors(request)});
  const url=new URL(request.url);

  if(url.pathname==="/api/health") return json({ok:true,service:"svara-origins-api",version:"3",providers:getProviderStatus(env)},200,request);

  if(url.pathname==="/api/sample-voices"&&request.method==="GET") return json({voices:SAMPLE_VOICES.map(({code,language,name,accent,voiceId})=>({code,language,name,accent,voiceId}))},200,request);

  if(url.pathname.startsWith("/api/voice-portraits/")&&request.method==="GET"){
    const code=url.pathname.split("/").pop();
    try{return await storedPortrait(env,code);}catch(err){return json({error:String(err?.message||"Portrait failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/sample-hero"&&request.method==="GET"){
    try{return await storedHeroSample(env);}catch(err){return json({error:String(err?.message||"Hero sample generation failed").slice(0,300)},502,request);}
  }

  if(url.pathname.startsWith("/api/sample-voices/")&&request.method==="GET"){
    const code=url.pathname.split("/").pop(); const sample=SAMPLE_VOICES.find(v=>v.code===code);
    if(!sample) return json({error:"Unknown sample language"},404,request);
    try{return await storedSample(env,sample);}catch(err){return json({error:String(err?.message||"Sample generation failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/admin/seed-sample-voices"&&request.method==="POST"){
    const token=request.headers.get("X-Svara-Sample-Seed-Token")||"";
    if(!env.SAMPLE_SEED_TOKEN || token!==env.SAMPLE_SEED_TOKEN) return new Response("Not found",{status:404});
    try{return json({ok:true,results:await seedSampleVoices(env)},200,request);}catch(err){return json({error:String(err?.message||"Sample seeding failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/voices"&&request.method==="GET"){
    try {const voices=await deepgramCatalogue(env);return json({provider:"deepgram",family:"aura-2",voices:voices.map(v=>({voice_id:v.canonical_name,metadata:v.metadata||{}}))},200,request);}catch(err){return json({error:String(err?.message||"Voice catalogue failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/lab/catalogue"&&request.method==="GET"){
    if(!labAllowed(request)) return new Response("Not found",{status:404});
    try {const voices=await deepgramCatalogue(env);return json({provider:"deepgram",family:"aura-2",tests:LAB_TESTS.map(([id])=>id),voices:voices.map(v=>({voice_id:v.canonical_name,metadata:v.metadata||{}}))},200,request);}catch(err){return json({error:String(err?.message||"Catalogue failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/lab/batch"&&request.method==="POST"){
    if(!labAllowed(request)) return new Response("Not found",{status:404});
    try {const body=await request.json().catch(()=>({}));const requested=[...new Set((Array.isArray(body.voiceIds)?body.voiceIds:[]).map(String).filter(Boolean))].slice(0,6);if(!requested.length)return json({error:"Provide 1-6 voiceIds"},400,request);const catalogue=await deepgramCatalogue(env);const allowed=new Set(catalogue.map(v=>v.canonical_name));const voices=requested.filter(v=>allowed.has(v));if(!voices.length)return json({error:"No selected voices are in the current Aura-2 catalogue"},400,request);const samples=[];for(const voiceId of voices)for(const [testId] of LAB_TESTS){try{samples.push({status:"generated",...(await generateLabSample(env,voiceId,testId))});}catch(err){samples.push({status:"error",voice_id:voiceId,test_id:testId,error:String(err?.message||"Generation failed").slice(0,300)});}}return json({version:"0.1",provider:"deepgram",generated_at:new Date().toISOString(),test_count:LAB_TESTS.length,voice_count:voices.length,samples},200,request);}catch(err){return json({error:String(err?.message||"Lab batch failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/voice/generate"&&request.method==="POST"){
    try {const body=await request.json();const text=String(body.text||"").trim();if(!text)return json({error:"Text is required"},400,request);if(text.length>MAX_CHARS)return json({error:`Maximum ${MAX_CHARS} characters per generation`},400,request);let voice=VOICES[body.voiceId]||VOICES["svara-amara-01"];const providerVoiceId=String(body.providerVoiceId||"").trim();if(/^aura-2-[a-z0-9-]+$/.test(providerVoiceId))voice={provider:"deepgram",providerVoiceId};const provider=getProvider(env,voice);const upstream=await provider.generate({text,voice,speed:Number(body.speed)||1,stability:Number(body.stability)||50,style:String(body.style||"")});const headers=new Headers(upstream.headers);headers.set("content-type","audio/mpeg");headers.set("cache-control","private, no-store");return new Response(upstream.body,{status:200,headers});}catch(err){console.error("generation_error",err);if(url.searchParams.get("debug")==="1"){const message=String(err?.message||"Unknown provider error").slice(0,500);return json({error:"Voice generation failed",diagnostic:true,message,provider:"deepgram"},502,request);}return json({error:"Voice generation failed. Please try again."},502,request);}
  }

  if(env.ASSETS) return env.ASSETS.fetch(request);
  return new Response("Not found",{status:404,headers:cors(request)});
 }
};
