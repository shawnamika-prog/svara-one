import { getProvider, getProviderStatus } from "./providers/index.js";
import { getPortrait } from "./voice-portraits.js";
import { getVoiceById, listVoiceRegistry, syncVoiceRegistry, ensureVoiceSample, seedMissingVoiceSamples } from "./voice-registry.js";

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
    "Access-Control-Allow-Headers":"Content-Type,Authorization,X-Svara-Lab-Token,X-Svara-Voice-Seed-Token",
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

  if(url.pathname==="/api/health") return json({ok:true,service:"svara-origins-api",version:"4",providers:getProviderStatus(env)},200,request);

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

  if(url.pathname.startsWith("/api/voice-samples/")&&request.method==="GET"){
    const svaraId=decodeURIComponent(url.pathname.split("/").pop()||"");
    try{
      const result=await ensureVoiceSample(env,svaraId);
      if(result.error)return json({error:result.error},result.status||404,request);
      return new Response(result.body,{headers:result.headers});
    }catch(err){return json({error:String(err?.message||"Voice sample failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/admin/sync-voices"&&request.method==="POST"){
    const token=request.headers.get("X-Svara-Voice-Seed-Token")||request.headers.get("X-Svara-Sample-Seed-Token")||"";
    if(!env.SAMPLE_SEED_TOKEN || token!==env.SAMPLE_SEED_TOKEN)return new Response("Not found",{status:404});
    try{return json({ok:true,registry:await syncVoiceRegistry(env)},200,request);}catch(err){return json({error:String(err?.message||"Voice sync failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/admin/seed-voice-samples"&&request.method==="POST"){
    const token=request.headers.get("X-Svara-Voice-Seed-Token")||request.headers.get("X-Svara-Sample-Seed-Token")||"";
    if(!env.SAMPLE_SEED_TOKEN || token!==env.SAMPLE_SEED_TOKEN)return new Response("Not found",{status:404});
    try{return json({ok:true,results:await seedMissingVoiceSamples(env,Number(new URL(request.url).searchParams.get("limit"))||3)},200,request);}catch(err){return json({error:String(err?.message||"Voice sample seeding failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/admin/seed-sample-voices"&&request.method==="POST"){
    const token=request.headers.get("X-Svara-Sample-Seed-Token")||"";
    if(!env.SAMPLE_SEED_TOKEN || token!==env.SAMPLE_SEED_TOKEN) return new Response("Not found",{status:404});
    try{return json({ok:true,results:await seedSampleVoices(env)},200,request);}catch(err){return json({error:String(err?.message||"Sample seeding failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/voices"&&request.method==="GET"){
    try{
      let voices=await listVoiceRegistry(env);
      if(!voices.length){await syncVoiceRegistry(env);voices=await listVoiceRegistry(env);}
      return json({provider:"svara",family:"aura-2",voices},200,request);
    }catch(err){
      try{const voices=await deepgramCatalogue(env);return json({provider:"deepgram-fallback",family:"aura-2",voices:voices.map(v=>({voice_id:v.canonical_name,metadata:v.metadata||{}}))},200,request);}catch(fallbackError){return json({error:String(err?.message||"Voice catalogue failed").slice(0,300)},502,request);}
    }
  }

  if(url.pathname==="/api/lab/catalogue"&&request.method==="GET"){
    if(!labAllowed(request)) return new Response("Not found",{status:404});
    try {const voices=await deepgramCatalogue(env);return json({provider:"deepgram",family:"aura-2",tests:LAB_TESTS.map(([id])=>id),voices:voices.map(v=>({voice_id:v.canonical_name,metadata:v.metadata||{}}))},200,request);}catch(err){return json({error:String(err?.message||"Catalogue failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/lab/batch"&&request.method==="POST"){
    if(!labAllowed(request)) return new Response("Not found",{status:404});
    try {const body=await request.json().catch(()=>({}));const requested=[...new Set((Array.isArray(body.voiceIds)?body.voiceIds:[]).map(String).filter(Boolean))].slice(0,6);if(!requested.length)return json({error:"Provide 1-6 voiceIds"},400,request);const catalogue=await deepgramCatalogue(env);const allowed=new Set(catalogue.map(v=>v.canonical_name));const voices=requested.filter(v=>allowed.has(v));if(!voices.length)return json({error:"No selected voices are in the current Aura-2 catalogue"},400,request);const samples=[];for(const voiceId of voices)for(const [testId] of LAB_TESTS){try{samples.push({status:"generated",...(await generateLabSample(env,voiceId,testId))});}catch(err){samples.push({status:"error",voice_id:voiceId,test_id:testId,error:String(err?.message||"Generation failed").slice(0,300)});}}return json({version:"0.1",provider:"deepgram",generated_at:new Date().toISOString(),test_count:LAB_TESTS.length,voice_count:voices.length,samples},200,request);}catch(err){return json({error:String(err?.message||"Lab batch failed").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/video/runway"&&request.method==="POST"){
    if(!env.RUNWAY_API_KEY)return json({error:"Runway is not configured yet. Add the RUNWAY_API_KEY Worker secret in Cloudflare."},503,request);
    try{
      const form=await request.formData();
      const image=form.get("image");
      const promptText=String(form.get("promptText")||"").trim();
      const ratio=String(form.get("ratio")||"1280:720");
      const duration=Number(form.get("duration")||5);
      const allowedRatios=new Set(["1280:720","720:1280","1104:832","832:1104","960:960","1584:672"]);
      if(!image||typeof image.arrayBuffer!=="function")return json({error:"Choose an image to animate."},400,request);
      if(!["image/png","image/jpeg","image/webp"].includes(image.type))return json({error:"Use a PNG, JPEG or WebP image."},400,request);
      if(image.size>20*1024*1024)return json({error:"Image must be 20 MB or smaller."},400,request);
      if(!promptText)return json({error:"Describe the motion you want."},400,request);
      if(promptText.length>2000)return json({error:"Prompt must be 2,000 characters or fewer."},400,request);
      if(!allowedRatios.has(ratio))return json({error:"Choose a supported aspect ratio."},400,request);
      if(![5,10].includes(duration))return json({error:"Choose a 5- or 10-second video."},400,request);
      const version="2024-11-06";
      const descriptorResponse=await fetch("https://api.dev.runwayml.com/v1/uploads",{
        method:"POST",
        headers:{Authorization:`Bearer ${env.RUNWAY_API_KEY}`,"X-Runway-Version":version,"Content-Type":"application/json"},
        body:JSON.stringify({filename:String(image.name||"svaraone-video-input.png"),type:"ephemeral"})
      });
      const descriptor=await descriptorResponse.json().catch(()=>({}));
      if(!descriptorResponse.ok)return json({error:descriptor.error||"Runway could not prepare the image upload.",details:descriptor.issues||undefined},descriptorResponse.status,request);
      if(!descriptor.uploadUrl||!descriptor.fields||!descriptor.runwayUri)return json({error:"Runway returned an incomplete upload descriptor."},502,request);
      const uploadForm=new FormData();
      for(const [key,value] of Object.entries(descriptor.fields))uploadForm.append(key,String(value));
      uploadForm.append("file",image,String(image.name||"svaraone-video-input.png"));
      const uploadResponse=await fetch(descriptor.uploadUrl,{method:"POST",body:uploadForm});
      if(!uploadResponse.ok)return json({error:`Image upload failed (HTTP ${uploadResponse.status}). Please try again.`},502,request);
      const generationResponse=await fetch("https://api.dev.runwayml.com/v1/image_to_video",{
        method:"POST",
        headers:{Authorization:`Bearer ${env.RUNWAY_API_KEY}`,"X-Runway-Version":version,"Content-Type":"application/json"},
        body:JSON.stringify({model:"gen4_turbo",promptImage:descriptor.runwayUri,promptText,ratio,duration})
      });
      const generation=await generationResponse.json().catch(()=>({}));
      if(!generationResponse.ok)return json({error:generation.error||"Runway rejected the video request.",issues:generation.issues||undefined},generationResponse.status,request);
      return json({ok:true,...generation},200,request);
    }catch(err){
      console.error("runway_video_request_failed",err);
      return json({error:String(err?.message||"Video request failed").slice(0,300)},502,request);
    }
  }

  if(url.pathname.startsWith("/api/video/runway/tasks/")&&request.method==="GET"){
    if(!env.RUNWAY_API_KEY)return json({error:"Runway is not configured yet."},503,request);
    const taskId=decodeURIComponent(url.pathname.slice("/api/video/runway/tasks/".length));
    if(!taskId||!/^[A-Za-z0-9_-]+$/.test(taskId))return json({error:"Invalid Runway task ID."},400,request);
    try{
      const upstream=await fetch(`https://api.dev.runwayml.com/v1/tasks/${encodeURIComponent(taskId)}`,{
        headers:{Authorization:`Bearer ${env.RUNWAY_API_KEY}`,"X-Runway-Version":"2024-11-06"}
      });
      const data=await upstream.json().catch(()=>({}));
      return json(data,upstream.status,request);
    }catch(err){return json({error:String(err?.message||"Could not check video status").slice(0,300)},502,request);}
  }

  if(url.pathname==="/api/voice/generate"&&request.method==="POST"){
    try {
      const body=await request.json();
      const text=String(body.text||"").trim();
      if(!text)return json({error:"Text is required"},400,request);
      if(text.length>MAX_CHARS)return json({error:`Maximum ${MAX_CHARS} characters per generation`},400,request);
      let voice=VOICES[body.voiceId]||VOICES["svara-amara-01"];
      const providerVoiceId=String(body.providerVoiceId||"").trim();
      if(/^svara-[a-z0-9-]+$/.test(String(body.voiceId||""))){
        const registryVoice=await getVoiceById(env,body.voiceId);
        if(!registryVoice)return json({error:"Voice not found"},404,request);
        voice={provider:"deepgram",providerVoiceId:registryVoice.providerVoiceId};
      }else if(/^aura-2-[a-z0-9-]+$/.test(providerVoiceId)){
        voice={provider:"deepgram",providerVoiceId};
      }
      const format=String(body.format||"mp3").toLowerCase();
      if(!["mp3","wav","pcm"].includes(format))return json({error:"Unsupported audio output format"},400,request);
      const provider=getProvider(env,voice);
      const upstream=await provider.generate({text,voice,format,speed:Number(body.speed)||1,stability:Number(body.stability)||50,style:String(body.style||"")});
      const headers=new Headers(upstream.headers);
      const contentType=format==="wav"?"audio/wav":format==="pcm"?"audio/l16;rate=24000":"audio/mpeg";
      headers.set("content-type",contentType);
      headers.set("cache-control","private, no-store");
      return new Response(upstream.body,{status:200,headers});
    }catch(err){
      console.error("generation_error",err);
      if(url.searchParams.get("debug")==="1"){
        const message=String(err?.message||"Unknown provider error").slice(0,500);
        return json({error:"Voice generation failed",diagnostic:true,message,provider:"deepgram"},502,request);
      }
      return json({error:"Voice generation failed. Please try again."},502,request);
    }
  }

  if(url.pathname==="/api/branding/svaraone-orb.png"&&request.method==="GET"){
    if(!env.VOICE_SAMPLES) return new Response("Not found",{status:404});
    const object=await env.VOICE_SAMPLES.get("branding/svaraone-orb.png");
    if(!object) return new Response("Not found",{status:404});
    return new Response(object.body,{headers:{"content-type":"image/png","cache-control":"public, max-age=31536000, immutable","etag":object.httpEtag||""}});
  }

  if(env.ASSETS) return env.ASSETS.fetch(request);
  return new Response("Not found",{status:404,headers:cors(request)});
 }
};