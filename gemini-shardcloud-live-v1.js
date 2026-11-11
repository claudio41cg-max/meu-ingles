(()=>{
'use strict';
// Gemini Live separado da ponte GPT no S20. Nenhuma chave ou senha é salva no navegador.
const GATEWAY='https://meu-ingles-gateway.shardweb.app';
const WS='wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';
const state={running:false,starting:false,muted:false};
let socket=null,stream=null,inputCtx=null,outputCtx=null,inputNode=null,processor=null;
let setupTimer=null,sessionTimer=null,queueAt=0,password='',generation=0,notifier=()=>{},sendAudio=false;
function notify(name,detail){try{notifier(name,detail)}catch(e){console.warn('[Meu Ingles Gemini] callback',e)}}
function passwordDialog(){
 return new Promise(resolve=>{
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(1,7,17,.86);display:grid;place-items:center;padding:18px';
  overlay.innerHTML='<form style="width:min(100%,380px);padding:22px;border-radius:20px;background:#11243e;border:1px solid #49749c;color:white;font-family:system-ui"><h3 style="margin:0 0 12px">Gemini Live • ShardCloud</h3><p style="font-size:14px;line-height:1.45">Digite a senha exclusiva do gateway. Ela não será gravada neste aparelho. Conversa de até 2 minutos por sessão, usando os créditos da API Google.</p><input type="password" required autocomplete="off" placeholder="Senha do gateway" style="width:100%;padding:12px;border-radius:10px;border:1px solid #6396c4;background:#08182b;color:white;font-size:16px;box-sizing:border-box"><div style="display:flex;gap:8px;margin-top:14px"><button type="button" style="flex:1;padding:12px;border-radius:10px;background:#263e55;color:white;border:0">Cancelar</button><button type="submit" style="flex:1;padding:12px;border-radius:10px;background:#167fd1;color:white;border:0;font-weight:700">Conectar</button></div></form>';
  const form=overlay.querySelector('form'),field=overlay.querySelector('input');
  let done=false;
  const finish=value=>{if(done)return;done=true;overlay.remove();resolve(value)};
  form.onsubmit=e=>{e.preventDefault();finish(field.value)};
  form.querySelector('button[type="button"]').onclick=()=>finish('');
  document.body.appendChild(overlay);field.focus();
 });
}
function toBase64(bytes){let raw='';for(let i=0;i<bytes.length;i+=16384)raw+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(raw)}
function outputPCM(encoded){
 if(!outputCtx||state.muted)return;
 const raw=atob(encoded),size=Math.floor(raw.length/2);if(!size)return;
 const buffer=outputCtx.createBuffer(1,size,24000),samples=buffer.getChannelData(0);
 for(let i=0;i<size;i++){const n=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);samples[i]=(n&32768?n-65536:n)/32768}
 const source=outputCtx.createBufferSource();source.buffer=buffer;source.connect(outputCtx.destination);
 queueAt=Math.max(queueAt,outputCtx.currentTime+.02);source.start(queueAt);queueAt+=buffer.duration;
}
function send(obj){if(socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify(obj));return true}return false}
async function cleanup(){
 clearTimeout(setupTimer);clearTimeout(sessionTimer);setupTimer=sessionTimer=null;
 sendAudio=false;state.running=false;state.starting=false;state.muted=false;
 const s=socket;socket=null;try{s?.close()}catch{}
 try{processor?.disconnect()}catch{}try{inputNode?.disconnect()}catch{}
 try{stream?.getTracks().forEach(t=>t.stop())}catch{}
 try{await inputCtx?.close()}catch{}try{await outputCtx?.close()}catch{}
 processor=null;inputNode=null;stream=null;inputCtx=null;outputCtx=null;queueAt=0;
}
async function stop(){
 generation++;await cleanup();notify('stopped');return true;
}
async function start(options={}){
 if(state.running||state.starting)return false;
 if(!window.isSecureContext)throw new Error('O Gemini Live requer HTTPS.');
 state.starting=true;const mine=++generation;notifier=options.onState||(()=>{});
 try{
  // Senha só em memória durante a página aberta. Nunca em localStorage.
  if(!password)password=await passwordDialog();
  if(!password)throw new Error('Conexão cancelada.');
  const response=await fetch(GATEWAY+'/api/gemini-test-token',{
   method:'POST',headers:{'content-type':'application/json'},cache:'no-store',
   body:JSON.stringify({password}),signal:AbortSignal.timeout(20000)
  });
  const type=response.headers.get('content-type')||'';
  if(!type.includes('application/json'))throw new Error('Gateway indisponível: HTTP '+response.status);
  const result=await response.json();
  if(!response.ok||!result.ok||!result.token){
   if(response.status===401)password='';
   throw new Error(result.error||'Não foi possível obter token Gemini');
  }
  if(mine!==generation)return false;
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  inputCtx=new AudioContext({sampleRate:16000});outputCtx=new AudioContext({sampleRate:24000});
  await inputCtx.resume();await outputCtx.resume();
  inputNode=inputCtx.createMediaStreamSource(stream);processor=inputCtx.createScriptProcessor(4096,1,1);
  processor.onaudioprocess=e=>{
   if(!sendAudio||state.muted||socket?.readyState!==WebSocket.OPEN)return;
   const samples=e.inputBuffer.getChannelData(0),pcm=new Uint8Array(samples.length*2),view=new DataView(pcm.buffer);
   for(let i=0;i<samples.length;i++){const s=Math.max(-1,Math.min(1,samples[i]));view.setInt16(i*2,s<0?s*32768:s*32767,true)}
   send({realtimeInput:{audio:{mimeType:'audio/pcm;rate=16000',data:toBase64(pcm)}}});
  };
  inputNode.connect(processor);processor.connect(inputCtx.destination);
  if(mine!==generation)return false;
  return await new Promise((resolve,reject)=>{
   let settled=false;
   const fail=message=>{if(settled)return;settled=true;reject(new Error(message))};
   socket=new WebSocket(WS+'?access_token='+encodeURIComponent(result.token));
   setupTimer=setTimeout(()=>fail('O Gemini não confirmou a sessão em 15 segundos.'),15000);
   socket.onopen=()=>{
    const instructions=String(options.instructions||'Você é um professor brasileiro de inglês. Faça perguntas curtas e aguarde a resposta do aluno.');
    send({setup:{model:'models/'+result.model,generationConfig:{responseModalities:['AUDIO']},systemInstruction:{parts:[{text:instructions}]}}});
   };
   socket.onmessage=async e=>{
    if(mine!==generation)return;
    let obj;try{obj=JSON.parse(typeof e.data==='string'?e.data:await e.data.text())}catch{return}
    if(obj.setupComplete&&!settled){
     clearTimeout(setupTimer);settled=true;state.starting=false;state.running=true;sendAudio=true;
     notify('live',{model:result.model,provider:'Gemini Live'});
     sessionTimer=setTimeout(()=>{notify('error','Sessão Gemini encerrada após 2 minutos para controlar os créditos.');stop()},120000);
     resolve(true);
     sendText('Comece agora com uma saudação curta e conduza a atividade conforme as instruções recebidas. Aguarde a resposta do aluno.');
    }
    if(obj.serverContent?.interrupted&&outputCtx)queueAt=outputCtx.currentTime;
    for(const part of obj.serverContent?.modelTurn?.parts||[]){
     if(part.inlineData?.data){
      notify('assistant-speaking');
      try{outputPCM(part.inlineData.data)}catch(err){console.warn('[Meu Ingles Gemini] audio',err)}
     }
    }
    if(obj.serverContent?.turnComplete)notify('assistant-done');
   };
   socket.onerror=()=>{if(!settled)fail('Erro de WebSocket do Gemini.');else notify('error','Erro de conexão Gemini Live.')};
   socket.onclose=e=>{
    if(mine!==generation)return;
    const message='Conexão Gemini encerrada (código '+e.code+(e.reason?', '+e.reason.slice(0,100):'')+').';
    if(!settled)fail(message);
    else {notify('error',message);stop()}
   };
  });
 }catch(e){
  if(mine===generation){await cleanup();notify('error',e.message)}
  throw e;
 }
}
function sendText(text){
 if(!state.running)return false;
 return send({clientContent:{turns:[{role:'user',parts:[{text:String(text)}]}],turnComplete:true}});
}
function toggleMute(){if(!state.running)return;state.muted=!state.muted;notify(state.muted?'muted':'unmuted');return state.muted}
window.MeuInglesShardGeminiLive={start,stop,toggleMute,sendText,state};
})();