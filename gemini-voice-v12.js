(function(){
  const ENDPOINT='https://meu-ingles-claudio.netlify.app/api/gemini-tts';
  let ctx=null,playing=null;
  function b64bytes(b64){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
  async function playPCM(b64,rate=24000){const bytes=b64bytes(b64),samples=Math.floor(bytes.length/2),data=new Float32Array(samples),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let i=0;i<samples;i++)data[i]=Math.max(-1,Math.min(1,view.getInt16(i*2,true)/32768));ctx=ctx||new (window.AudioContext||window.webkitAudioContext)({sampleRate:rate});if(ctx.state==='suspended')await ctx.resume();if(playing){try{playing.stop()}catch(e){}}const buffer=ctx.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);const src=ctx.createBufferSource();src.buffer=buffer;src.connect(ctx.destination);playing=src;await new Promise(resolve=>{src.onended=()=>{playing=null;resolve()};src.start()})}
  function style(){try{if(state.teacher==='pesada')return 'Voz adulta, espontânea e expressiva, com energia e humor.';if(state.teacher==='media')return 'Voz divertida, natural e conversacional.'}catch(e){}return 'Voz calorosa, humana, paciente e natural.'}
  async function speak(text,lang='pt-BR',opts={}){text=String(text||'').trim();if(!text)return false;try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,lang,voice:opts.voice||'Kore',style:opts.style||style()})});if(!r.ok)throw new Error('tts '+r.status);const d=await r.json();if(!d.audio)throw new Error('no_audio');await playPCM(d.audio,d.sample_rate||24000);return true}catch(e){console.warn('Gemini TTS',e);return false}}
  async function speakBoth(pt,en){const ok=await speak(pt,'pt-BR');if(en){await new Promise(r=>setTimeout(r,120));await speak(en,'en-US',{style:'Clear natural English teaching voice, slightly slower than normal conversation.'})}return ok}
  async function status(){try{const r=await fetch(ENDPOINT,{cache:'no-store'}),d=await r.json();return !!(r.ok&&d.key_configured)}catch(e){return false}}
  window.GEMINI_TTS={speak,speakBoth,status,endpoint:ENDPOINT};
})();
