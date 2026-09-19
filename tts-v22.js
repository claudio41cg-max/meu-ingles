(()=>{
'use strict';

const API=location.hostname.endsWith('github.io')?'https://meu-ingles-claudio.netlify.app':'';
const TTS=(window.MEU_INGLES_TTS_URL||API+'/api/gemini-tts');
const KEY='meuInglesStableV2';
const MIN_API_GAP=150;
const ENGLISH_VOICE='Achird';
const REQUEST_TIMEOUT=12000;

let audioCtx=null;
let currentSource=null;
let currentSeq=0;
let lastApiAt=0;
const audioCache=new Map();

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
async function requestVoice(payload,attempt=0){
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
  if(r.status===429&&attempt<2){
    const retry=Math.max(1,Number(d?.retry_after_seconds)||Number(r.headers.get('Retry-After'))||3);
    status(`⏳ Limite momentâneo do Gemini. Tentando novamente em ${retry}s…`);
    await wait((retry+.5)*1000);
    return requestVoice(payload,attempt+1);
  }
  if(!r.ok)throw new Error('HTTP '+r.status+' '+(d?.message||d?.error||raw.slice(0,120)));
  if(!d?.audio)throw new Error('Gemini não devolveu áudio');
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
    let d=audioCache.get(key);
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
      d=await requestVoice(payload);
      audioCache.set(key,d);
    }else{
      status('🎙️ Reproduzindo voz natural do Gemini…');
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
window.geminiSpeak=geminiSpeak;
window.stopGeminiTTS=stopGeminiTTS;

try{
  if(window.speechSynthesis&&typeof window.speechSynthesis.speak==='function'){
    window.speechSynthesis.speak=(utterance)=>{
      const text=utterance?.text||'';
      const lang=utterance?.lang||'pt-BR';
      try{utterance?.onstart?.(new Event('start'))}catch{}
      geminiSpeak(
        text,
        lang,
        String(lang).toLowerCase().startsWith('en')?ENGLISH_VOICE:currentVoice()
      ).then(()=>{
        try{utterance?.onend?.(new Event('end'))}catch{}
      });
    };
  }
}catch{}

})();