(()=>{
'use strict';
const API=location.hostname.endsWith('github.io')?'https://meu-ingles-claudio.netlify.app':'';
const TTS=API+'/api/gemini-tts';
const KEY='meuInglesStableV2';
const MIN_API_GAP=150;
const ENGLISH_VOICE='Achird';
let player=null,currentUrl='',unlocked=false,speaking=false,lastApiAt=0;
let speakQueue=Promise.resolve();
const audioCache=new Map();
function readState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function currentVoice(){return readState().voice||'Aoede'}
function status(text,ok){const el=document.querySelector('#geminiVoiceStatus');if(el){el.textContent=text;el.style.borderColor=ok===true?'#2fbf71':ok===false?'#d9534f':''}const warn=document.querySelector('#a15Voice');if(warn&&ok===false)warn.textContent=text}
function ensurePlayer(){if(player)return player;player=document.createElement('audio');player.preload='auto';player.playsInline=true;player.style.display='none';document.body.appendChild(player);return player}
function makeSilentWav(){const rate=8000,samples=80,dataLen=samples*2,buf=new ArrayBuffer(44+dataLen),v=new DataView(buf);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+dataLen,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,dataLen,true);return new Blob([buf],{type:'audio/wav'})}
function pcmToWavBlob(b64,rate){const bin=atob(String(b64||''));const pcm=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)pcm[i]=bin.charCodeAt(i);const dataLen=pcm.length,buf=new ArrayBuffer(44+dataLen),v=new DataView(buf),u=new Uint8Array(buf);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+dataLen,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,dataLen,true);u.set(pcm,44);return new Blob([buf],{type:'audio/wav'})}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function unlock(){if(unlocked)return true;const a=ensurePlayer();try{const url=URL.createObjectURL(makeSilentWav());a.src=url;const p=a.play();if(p&&p.then)await p;a.pause();a.currentTime=0;URL.revokeObjectURL(url);unlocked=true;return true}catch(e){status('⚠️ Áudio do navegador bloqueado: toque novamente em Testar voz.',false);return false}}
['pointerdown','touchstart','mousedown'].forEach(type=>document.addEventListener(type,()=>{unlock().catch(()=>{})},{capture:true,passive:true}));
async function playData(data,voice){
 const a=ensurePlayer();
 const blob=pcmToWavBlob(data.audio,Number(data.sample_rate)||24000);
 if(currentUrl)URL.revokeObjectURL(currentUrl);
 currentUrl=URL.createObjectURL(blob);
 a.src=currentUrl;
 a.currentTime=0;
 document.querySelectorAll('.bot').forEach(b=>b.classList.add('speaking'));
 const ended=new Promise((resolve,reject)=>{
   const cleanup=()=>{
     a.onended=null;
     a.onerror=null;
   };
   a.onended=()=>{cleanup();resolve()};
   a.onerror=()=>{cleanup();reject(new Error('Falha ao reproduzir WAV Gemini'))};
 });
 const p=a.play();
 if(p&&p.then)await p;
 await ended;
 status(`✅ Gemini TTS ativo · ${data.voice||voice} · ${data.model||'voz natural'}`,true);
 return true;
}
async function requestVoice(payload,attempt=0){const since=Date.now()-lastApiAt;if(since<MIN_API_GAP)await wait(MIN_API_GAP-since);lastApiAt=Date.now();const r=await fetch(TTS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const raw=await r.text();let d=null;try{d=JSON.parse(raw)}catch{}if(r.status===429&&attempt<2){const retry=Math.max(1,Number(d?.retry_after_seconds)||Number(r.headers.get('Retry-After'))||3);status(`⏳ Limite momentâneo do Gemini. Tentando novamente em ${retry}s…`);await wait((retry+0.5)*1000);return requestVoice(payload,attempt+1)}if(!r.ok)throw new Error('HTTP '+r.status+' '+(d?.message||d?.error||raw.slice(0,120)));if(!d?.audio)throw new Error('Gemini não devolveu áudio');return d}
async function runSpeak(text,lang,voice){
 speaking=true;
 try{
   try{window.speechSynthesis?.cancel()}catch{}
   await unlock();
   const key=[voice,lang,text].join('|');
   if(audioCache.has(key)){
     status('🎙️ Reproduzindo voz natural do Gemini…');
     return await playData(audioCache.get(key),voice);
   }
   status('🎙️ Gerando voz natural do Gemini…');
   const payload={text,lang,voice,style:lang.startsWith('en')?'Natural American English, warm, human and conversational.':'Português brasileiro natural, humano, expressivo e conversacional.'};
   const d=await requestVoice(payload);
   audioCache.set(key,d);
   return await playData(d,voice);
 }catch(e){
   console.error('Gemini TTS frontend',e);
   status('❌ '+String(e&&e.message||e).slice(0,180),false);
   return false;
 }finally{
   speaking=false;
   document.querySelectorAll('.bot').forEach(b=>b.classList.remove('speaking'));
 }
}
function geminiSpeak(text,lang='pt-BR',voice=currentVoice()){
 text=String(text||'').trim();
 if(!text)return Promise.resolve(false);
 const task=()=>runSpeak(text,lang,voice);
 const queued=speakQueue.then(task,task);
 speakQueue=queued.catch(()=>false);
 return queued;
}
window.previewStableVoice=()=>geminiSpeak('Oi, Cláudio. Essa é a minha voz. Bora aprender inglês de um jeito que não dá sono?','pt-BR',currentVoice());
window.stableSpeakEnglish=enc=>geminiSpeak(decodeURIComponent(String(enc||'')),'en-US',ENGLISH_VOICE);
window.geminiSpeak=geminiSpeak;
try{if(window.speechSynthesis&&typeof window.speechSynthesis.speak==='function'){window.speechSynthesis.speak=(utterance)=>{const text=utterance?.text||'',lang=utterance?.lang||'pt-BR';try{utterance?.onstart?.(new Event('start'))}catch{}geminiSpeak(text,lang,String(lang).toLowerCase().startsWith('en')?ENGLISH_VOICE:currentVoice()).then(ok=>{if(!ok)status('❌ A voz Gemini falhou. A voz antiga do Android continua bloqueada para não falar por cima.',false);try{utterance?.onend?.(new Event('end'))}catch{}})}}}catch(e){}
})();