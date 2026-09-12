(function(){
  const ENDPOINT='https://meu-ingles-claudio.netlify.app/api/gemini-tts';
  let ctx=null, playing=null;
  function b64bytes(b64){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
  async function playPCM(b64,rate=24000){
    const bytes=b64bytes(b64);const samples=Math.floor(bytes.length/2);const data=new Float32Array(samples);const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    for(let i=0;i<samples;i++)data[i]=Math.max(-1,Math.min(1,view.getInt16(i*2,true)/32768));
    ctx=ctx||new (window.AudioContext||window.webkitAudioContext)({sampleRate:rate});if(ctx.state==='suspended')await ctx.resume();
    if(playing){try{playing.stop()}catch(e){}}
    const buffer=ctx.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);const src=ctx.createBufferSource();src.buffer=buffer;src.connect(ctx.destination);playing=src;
    window.dispatchEvent(new CustomEvent('gemini-voice-state',{detail:'speaking'}));
    await new Promise(resolve=>{src.onended=()=>{playing=null;window.dispatchEvent(new CustomEvent('gemini-voice-state',{detail:'idle'}));resolve()};src.start()});
  }
  function personalityStyle(){
    try{if(state.teacher==='pesada')return 'Voz expressiva, adulta, espontânea, com energia e humor; não soe como locução robótica.';if(state.teacher==='media')return 'Voz leve, divertida, espontânea e sorridente; soe como uma professora brasileira conversando naturalmente.'}catch(e){}
    return 'Voz calorosa, paciente, humana e natural, como uma professora particular conversando de perto.';
  }
  async function speak(text,lang='pt-BR',opts={}){
    text=String(text||'').trim();if(!text)return false;
    window.dispatchEvent(new CustomEvent('gemini-voice-state',{detail:'loading'}));
    try{
      const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,lang,voice:opts.voice||'Kore',style:opts.style||personalityStyle()})});
      if(!r.ok)throw new Error('Gemini TTS '+r.status);const d=await r.json();if(!d.audio)throw new Error('no audio');await playPCM(d.audio,d.sample_rate||24000);return true;
    }catch(e){console.warn('Gemini voice',e);window.dispatchEvent(new CustomEvent('gemini-voice-state',{detail:'error'}));return false}
  }
  async function speakBoth(pt,en){const ok=await speak(pt,'pt-BR');if(en){await new Promise(r=>setTimeout(r,140));await speak(en,'en-US',{style:'Clear, natural teaching voice. Speak a little slower than normal conversation, without sounding robotic.'})}return ok}
  async function status(){try{const r=await fetch(ENDPOINT,{cache:'no-store'});const d=await r.json();return !!(r.ok&&d.key_configured)}catch(e){return false}}
  window.GEMINI_TTS={speak,speakBoth,status,endpoint:ENDPOINT};
  const old=window.liveSpeakPt;
  if(typeof old==='function')window.liveSpeakPt=async function(text){const ok=await speak(text,'pt-BR');if(!ok)return old.apply(this,arguments)};
})();
