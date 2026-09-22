(()=>{
'use strict';

const TTS='https://meu-ingles-livid.vercel.app/api/gemini-tts';
window.MEU_INGLES_TTS_URL=TTS;
const KEY='meuInglesStableV2';
const MIN_API_GAP=150;
const ENGLISH_VOICE='Achird';
const REQUEST_TIMEOUT=10000;

let audioCtx=null;
let currentSource=null;
let currentSeq=0;
let lastApiAt=0;
const audioCache=new Map();
const pendingVoice=new Map();

const TTS_DB='meuInglesTTSCacheV1';
const TTS_STORE='voices';
let ttsDbPromise=null;

function openTtsDb(){
  if(!('indexedDB' in window))return Promise.resolve(null);
  if(ttsDbPromise)return ttsDbPromise;
  ttsDbPromise=new Promise(resolve=>{
    try{
      const req=indexedDB.open(TTS_DB,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(TTS_STORE))db.createObjectStore(TTS_STORE);
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>resolve(null);
      req.onblocked=()=>resolve(null);
    }catch{resolve(null)}
  });
  return ttsDbPromise;
}

async function persistentGet(key){
  const db=await openTtsDb();
  if(!db)return null;
  return await new Promise(resolve=>{
    try{
      const tx=db.transaction(TTS_STORE,'readonly');
      const req=tx.objectStore(TTS_STORE).get(key);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>resolve(null);
    }catch{resolve(null)}
  });
}

async function persistentPut(key,data){
  const db=await openTtsDb();
  if(!db||!data?.audio)return false;
  return await new Promise(resolve=>{
    try{
      const tx=db.transaction(TTS_STORE,'readwrite');
      tx.objectStore(TTS_STORE).put({
        audio:data.audio,
        sample_rate:data.sample_rate||24000,
        voice:data.voice||'',
        model:data.model||'',
        saved_at:Date.now()
      },key);
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>resolve(false);
      tx.onabort=()=>resolve(false);
    }catch{resolve(false)}
  });
}

async function getCachedVoice(key){
  const mem=audioCache.get(key);
  if(mem)return mem;
  const saved=await persistentGet(key);
  if(saved?.audio){
    audioCache.set(key,saved);
    return saved;
  }
  return null;
}

function readState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function currentVoice(){return readState().voice||'Aoede'}
function status(text,ok){
  const el=document.querySelector('#geminiVoiceStatus');
  if(el){
    el.textContent=text;
    el.style.borderColor=ok===true?'#2fbf71':ok===false?'#d9534f':'';
  }
  const warn=document.querySelector('#a15Voice');
  if(warn&&ok===false)warn.textContent=text;
}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function ensureCtx(){
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)throw new Error('AudioContext indisponível');
  if(!audioCtx||audioCtx.state==='closed')audioCtx=new C();
  return audioCtx;
}
async function unlock(){
  const ctx=ensureCtx();
  if(ctx.state==='suspended'){
    try{await ctx.resume()}catch{}
  }
  try{window.meuInglesUnlockAudio?.()}catch{}
  return ctx.state!=='closed';
}
['pointerdown','touchstart','mousedown','keydown'].forEach(type=>{
  document.addEventListener(type,()=>{unlock().catch(()=>{})},{capture:true,passive:true});
});
function b64ToFloat32(b64){
  const bin=atob(String(b64||''));
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const count=Math.floor(bytes.byteLength/2);
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const out=new Float32Array(count);
  for(let i=0;i<count;i++)out[i]=Math.max(-1,Math.min(1,view.getInt16(i*2,true)/32768));
  return out;
}
function stopCurrent(){
  if(currentSource){
    try{currentSource.onended=null}catch{}
    try{currentSource.stop()}catch{}
    try{currentSource.disconnect()}catch{}
    currentSource=null;
  }
}
function stopGeminiTTS(){
  currentSeq++;
  stopCurrent();
  try{window.speechSynthesis?.cancel()}catch{}
  document.querySelectorAll('.bot').forEach(b=>b.classList.remove('speaking'));
  return true;
}
async function playPCM(data,voice,seq){
  await unlock();
  if(seq!==currentSeq)return false;
  const ctx=ensureCtx();
  const samples=b64ToFloat32(data.audio);
  if(!samples.length)throw new Error('Áudio vazio');
  stopCurrent();
  const buf=ctx.createBuffer(1,samples.length,Number(data.sample_rate)||24000);
  buf.copyToChannel(samples,0);
  const src=ctx.createBufferSource();
  src.buffer=buf;
  src.connect(ctx.destination);
  currentSource=src;
  document.querySelectorAll('.bot').forEach(b=>b.classList.add('speaking'));
  await new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(ok)=>{
      if(settled)return;
      settled=true;
      if(currentSource===src)currentSource=null;
      try{src.disconnect()}catch{}
      ok?resolve():reject(new Error('Falha ao reproduzir PCM'));
    };
    src.onended=()=>finish(true);
    try{src.start()}catch{finish(false)}
  });
  if(seq===currentSeq){
    status(`✅ Gemini TTS ativo · ${data.voice||voice} · ${data.model||'voz natural'}`,true);
  }
  document.querySelectorAll('.bot').forEach(b=>b.classList.remove('speaking'));
  return true;
}
async function fetchWithTimeout(url,init,ms){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),ms);
  try{
    return await fetch(url,{...init,signal:ctrl.signal});
  }finally{
    clearTimeout(timer);
  }
}
async function requestVoice(payload){
  const since=Date.now()-lastApiAt;
  if(since<MIN_API_GAP)await wait(MIN_API_GAP-since);
  lastApiAt=Date.now();
  const r=await fetchWithTimeout(TTS,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  },REQUEST_TIMEOUT);
  const raw=await r.text();
  let d=null;
  try{d=JSON.parse(raw)}catch{}
  if(!r.ok){
    const msg=d?.message||d?.error||raw.slice(0,120);
    throw new Error('HTTP '+r.status+' '+msg);
  }
  if(!d?.audio)throw new Error('Gemini não devolveu áudio');
  try{window.MeuInglesAiCost?.recordTTS?.(d,payload)}catch{}
  return d;
}
async function geminiSpeak(text,lang='pt-BR',voice=currentVoice()){
  text=String(text||'').trim();
  if(!text)return false;

  const seq=++currentSeq;
  stopCurrent();

  try{
    try{window.speechSynthesis?.cancel()}catch{}
    await unlock();

    const key=[voice,lang,text].join('|');
    let d=await getCachedVoice(key);
    if(d){
      try{window.dispatchEvent(new CustomEvent('meu-ingles-tts-source',{detail:{source:'cache',text,lang,voice,key}}))}catch{}
    }
    if(!d){
      status('🎙️ Gerando voz natural do Gemini…');
      const payload={
        text,
        lang,
        voice,
        style:String(lang).toLowerCase().startsWith('en')
          ?'Natural American English, very clear, warm, human and conversational. Precise beginner-friendly pronunciation.'
          :'Português brasileiro natural, humano, expressivo e conversacional.'
      };
      let pending=pendingVoice.get(key);
      if(!pending){
        pending=requestVoice(payload).finally(()=>pendingVoice.delete(key));
        pendingVoice.set(key,pending);
      }
      d=await pending;
      audioCache.set(key,d);
      persistentPut(key,d).catch(()=>{});
      try{window.dispatchEvent(new CustomEvent('meu-ingles-tts-source',{detail:{source:'api',text,lang,voice,key}}))}catch{}
    }else{
      status('🎙️ Reproduzindo áudio salvo…');
    }

    if(seq!==currentSeq)return false;
    return await playPCM(d,voice,seq);
  }catch(e){
    if(seq===currentSeq){
      console.error('Gemini TTS frontend',e);
      status('❌ '+String(e&&e.message||e).slice(0,180),false);
      document.querySelectorAll('.bot').forEach(b=>b.classList.remove('speaking'));
    }
    return false;
  }
}

window.previewStableVoice=()=>geminiSpeak(
  'Oi, Cláudio. Essa é a minha voz. Bora aprender inglês de um jeito que não dá sono?',
  'pt-BR',
  currentVoice()
);
window.stableSpeakEnglish=enc=>geminiSpeak(
  decodeURIComponent(String(enc||'')),
  'en-US',
  ENGLISH_VOICE
);
async function preloadGeminiTTS(text,lang='pt-BR',voice=currentVoice()){
  text=String(text||'').trim();
  if(!text)return false;
  const key=[voice,lang,text].join('|');
  if(await getCachedVoice(key))return true;
  let pending=pendingVoice.get(key);
  if(!pending){
    const payload={
      text,
      lang,
      voice,
      style:String(lang).toLowerCase().startsWith('en')
        ?'Natural American English, very clear, warm, human and conversational. Precise beginner-friendly pronunciation.'
        :'Português brasileiro natural, humano, expressivo e conversacional.'
    };
    pending=requestVoice(payload)
      .then(d=>{
        audioCache.set(key,d);
        persistentPut(key,d).catch(()=>{});
        return true;
      })
      .catch(e=>{console.warn('Gemini TTS preload',e);return false})
      .finally(()=>pendingVoice.delete(key));
    pendingVoice.set(key,pending);
  }
  return await pending;
}

window.geminiSpeak=geminiSpeak;
window.preloadGeminiTTS=preloadGeminiTTS;
window.stopGeminiTTS=stopGeminiTTS;
window.MeuInglesTTS={
  speak:geminiSpeak,
  preload:preloadGeminiTTS,
  stop:stopGeminiTTS,
  endpoint:TTS,
  cache:'indexeddb'
};


})();