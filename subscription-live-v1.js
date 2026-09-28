(()=>{
'use strict';

const DEFAULT_BACKEND='https://turbo-engine-production.up.railway.app';
const VOICE_MAP={
  Aoede:'cove',
  Kore:'ember',
  Leda:'juniper',
  Zephyr:'breeze',
  cove:'cove',
  juniper:'juniper',
  maple:'maple',
  spruce:'spruce',
  ember:'ember',
  vale:'vale',
  breeze:'breeze',
  arbor:'arbor',
  sol:'sol'
};

const state={
  pc:null,
  stream:null,
  channel:null,
  audio:null,
  running:false,
  starting:false,
  muted:false,
  voice:'cove',
  onTranscript:null,
  onState:null,
  pendingSpeak:null
};

function emit(name,detail){
  try{state.onState?.(name,detail)}catch{}
}

function waitIce(peer){
  if(peer.iceGatheringState==='complete')return Promise.resolve();
  return new Promise(resolve=>{
    const timer=setTimeout(resolve,5000);
    const on=()=>{
      if(peer.iceGatheringState!=='complete')return;
      clearTimeout(timer);
      peer.removeEventListener('icegatheringstatechange',on);
      resolve();
    };
    peer.addEventListener('icegatheringstatechange',on);
  });
}

async function stop(){
  const pc=state.pc,stream=state.stream,channel=state.channel,audio=state.audio;
  state.pc=null;state.stream=null;state.channel=null;state.audio=null;
  state.running=false;state.starting=false;state.muted=false;
  try{state.pendingSpeak?.resolve?.(false)}catch{}
  state.pendingSpeak=null;
  try{channel?.close()}catch{}
  try{pc?.close()}catch{}
  try{stream?.getTracks().forEach(t=>t.stop())}catch{}
  try{if(audio){audio.pause();audio.srcObject=null;audio.remove()}}catch{}
  emit('stopped');
}

function parseEvent(raw){
  let event;
  try{event=JSON.parse(String(raw||''))}catch{return}
  const type=String(event?.type||'');
  if(type==='input_audio_buffer.speech_started'){
    emit('user-speaking');
    return;
  }
  if(type==='input_audio_buffer.speech_stopped'){
    emit('user-stopped');
    return;
  }
  if(type==='response.output_audio.delta'||type==='response.audio.delta'){
    emit('assistant-speaking');
  }
  if(type==='response.output_audio.done'||type==='response.audio.done'){
    emit('assistant-done');
  }
  if(type==='turn.done'){
    const role=event?.turn?.role;
    const text=String(event?.turn?.transcript||'').trim();
    if(text&&(role==='user'||role==='assistant')){
      try{state.onTranscript?.({role,text,final:true})}catch{}
      try{
        window.dispatchEvent(new CustomEvent(
          role==='user'?'meu-ingles-live-user-turn':'meu-ingles-live-output-turn',
          {detail:{text,role}}
        ));
      }catch{}
    }
    if(role==='assistant'){
      try{window.dispatchEvent(new CustomEvent('meu-ingles-live-turn-complete',{detail:{text}}))}catch{}
    }
    emit(role==='assistant'?'assistant-done':'user-stopped');
    return;
  }
  if(type==='input_transcript.added'||type==='output_transcript.added'){
    const text=String(event?.item?.text||'').trim();
    if(text)try{state.onTranscript?.({role:type.startsWith('input')?'user':'assistant',text,final:false})}catch{}
    return;
  }
  if(type==='response.done'){
    const pending=state.pendingSpeak;
    state.pendingSpeak=null;
    try{pending?.resolve?.(true)}catch{}
    emit('response-done',event);
    return;
  }
  if(type==='response.cancelled'||type==='response.failed'){
    const pending=state.pendingSpeak;
    state.pendingSpeak=null;
    try{pending?.resolve?.(false)}catch{}
    emit('response-done',event);
    return;
  }
  if(type==='error'){
    const pending=state.pendingSpeak;
    state.pendingSpeak=null;
    try{pending?.resolve?.(false)}catch{}
    emit('error',String(event?.error?.message||event?.message||'Erro no GPT Live.'));
  }
}

async function start(options={}){
  if(state.starting)return false;
  await stop();
  state.starting=true;
  emit('connecting');

  try{
    const auth=typeof window.meuInglesTurboAuth==='function'
      ?await window.meuInglesTurboAuth()
      :'';
    if(!auth)throw new Error('Faça login no GPT do Meu Inglês.');

    state.voice=VOICE_MAP[String(options.voice||'')]||'cove';
    state.onTranscript=typeof options.onTranscript==='function'?options.onTranscript:null;
    state.onState=typeof options.onState==='function'?options.onState:null;

    const stream=await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
      video:false
    });
    const pc=new RTCPeerConnection();
    const channel=pc.createDataChannel('oai-events');
    const audio=document.createElement('audio');
    audio.autoplay=true;
    audio.playsInline=true;
    audio.style.display='none';
    document.body.appendChild(audio);

    state.stream=stream;
    state.pc=pc;
    state.channel=channel;
    state.audio=audio;

    for(const track of stream.getAudioTracks())pc.addTrack(track,stream);

    pc.ontrack=e=>{
      const media=e.streams?.[0]||new MediaStream([e.track]);
      audio.srcObject=media;
      audio.play().catch(()=>{});
      emit('audio');
    };
    pc.onconnectionstatechange=()=>{
      emit('connection',pc.connectionState);
      if(['failed','disconnected','closed'].includes(pc.connectionState)){
        state.running=false;
      }
    };
    channel.onopen=()=>emit('channel-open');
    channel.onmessage=e=>parseEvent(e.data);

    const offer=await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitIce(pc);

    const backend=String(window.meuInglesTurboBase||DEFAULT_BACKEND);
    const response=await fetch(backend+'/__turbo/voice/start',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'authorization':'Bearer '+auth
      },
      body:JSON.stringify({
        sdp:pc.localDescription?.sdp||'',
        voice:state.voice,
        instructions:String(options.instructions||'').slice(0,12000)
      })
    });
    const data=await response.json().catch(()=>({}));
    if(response.status===401){
      try{window.meuInglesGptLogout?.()}catch{}
      throw new Error('Login do GPT expirou. Entre novamente.');
    }
    if(!response.ok||!data?.ok||!data?.sdp)throw new Error(data?.error||'Não foi possível abrir o GPT Live.');

    await pc.setRemoteDescription({type:'answer',sdp:data.sdp});
    state.running=true;
    state.starting=false;
    emit('live',{voice:data.voice||state.voice,model:data.model||'GPT Live'});
    return true;
  }catch(error){
    const message=String(error?.message||error);
    await stop();
    emit('error',message);
    throw error;
  }
}


function waitChannelOpen(timeout=7000){
  const channel=state.channel;
  if(!channel)return Promise.reject(new Error('Canal GPT Live indisponível.'));
  if(channel.readyState==='open')return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{
      cleanup();
      reject(new Error('O canal GPT Live demorou para abrir.'));
    },timeout);
    const onOpen=()=>{cleanup();resolve()};
    const onClose=()=>{cleanup();reject(new Error('A sessão GPT Live foi encerrada.'))};
    function cleanup(){
      clearTimeout(timer);
      try{channel.removeEventListener('open',onOpen)}catch{}
      try{channel.removeEventListener('close',onClose)}catch{}
    }
    channel.addEventListener('open',onOpen,{once:true});
    channel.addEventListener('close',onClose,{once:true});
  });
}

async function speakExact(text){
  text=String(text||'').trim();
  if(!text)return false;
  if(!state.running&&!state.starting)throw new Error('GPT Live não está conectado.');
  await waitChannelOpen();
  try{state.pendingSpeak?.resolve?.(false)}catch{}
  const done=new Promise(resolve=>{state.pendingSpeak={resolve}});
  const event={
    type:'response.create',
    response:{
      input:[],
      output_modalities:['audio','text'],
      instructions:'Fale exatamente o texto a seguir, sem acrescentar, remover, resumir ou responder nada antes ou depois. Use português brasileiro natural e claro:\n\n'+text
    }
  };
  state.channel.send(JSON.stringify(event));
  return await done;
}

function cancelSpeech(){
  try{
    if(state.channel?.readyState==='open'){
      state.channel.send(JSON.stringify({type:'response.cancel'}));
      state.channel.send(JSON.stringify({type:'output_audio_buffer.clear'}));
    }
  }catch{}
  try{state.pendingSpeak?.resolve?.(false)}catch{}
  state.pendingSpeak=null;
}

function setMuted(value){
  const muted=!!value;
  state.muted=muted;
  for(const track of state.stream?.getAudioTracks?.()||[])track.enabled=!muted;
  emit(muted?'muted':'unmuted');
  return muted;
}

function toggleMute(){return setMuted(!state.muted)}

window.MeuInglesSubscriptionLive={
  state,
  start,
  stop,
  setMuted,
  toggleMute,
  speakExact,
  cancelSpeech,
  voiceFor(value){return VOICE_MAP[String(value||'')]||'cove'}
};
})();