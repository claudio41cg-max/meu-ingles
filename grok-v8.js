(function(){
  let ws=null, connecting=null, transcript='', audioChunks=[], audioCtx=null, oldLiveVoiceChat=null;
  const CFG={
    get endpoint(){return window.MEU_INGLES_XAI_SESSION_ENDPOINT||''},
    get enabled(){return window.MEU_INGLES_XAI_ENABLED===true},
    get model(){return window.MEU_INGLES_XAI_MODEL||'grok-voice-latest'},
    get voice(){return window.MEU_INGLES_XAI_VOICE||'eve'}
  };
  function st(){return typeof state!=='undefined'?state:{teacher:'media',level:'A1',scenario:'Livre'}}
  function modeName(){return st().teacher==='pesada'?'HARD 18+':st().teacher==='media'?'DOIDEIRA':'TRANQUILO'}
  function hardRules(){
    if(st().teacher==='leve')return 'Se o aluno errar, corrija com calma, incentivo e humor leve. Não use palavrões.';
    if(st().teacher==='media')return 'Se o aluno errar, faça zoeira moderada e divertida. Pode provocar, mas sem humilhar. Quando ele acertar, comemore.';
    return `Modo HARD 18+ consensual. Você pode usar palavrões brasileiros e zoeira pesada, sempre com objetivo pedagógico. A irritação deve ser PROGRESSIVA quando o aluno repete o mesmo erro: primeiro erro = zoeira leve; segundo = mais irritado; terceiro = bem puto; quarto ou mais = hard de verdade, com frases no estilo “Ah não, aí não dá não, porra”, “Tá de sacanagem, caralho?”, “Tu tem o quê na cabeça, cacete? Tem minhoca aí?”. Pode brincar com “tem cocô na cabeça?” se combinar com o momento. Assim que o aluno acertar, zere a irritação e comemore. Nunca ameace, nunca use ódio contra raça, religião, deficiência, orientação sexual, aparência, família ou qualquer característica pessoal sensível. A zoeira é sobre o erro de inglês e a situação da aula.`;
  }
  function instructions(){
    const s=st();
    return `Você é a professora de inglês do aplicativo Meu Inglês. O aluno se chama Cláudio. Nível atual: ${s.level||'A1'}. Cenário: ${s.scenario||'Livre'}. Personalidade: ${modeName()}.
Fale de forma natural, rápida e humana. Use português brasileiro para explicar, corrigir e brincar. Use inglês durante os exercícios e exemplos. Não transforme toda resposta em palestra. Faça conversa curta, viva e divertida.
Quando o aluno disser algo em inglês, avalie gramática, naturalidade e adequação ao nível. Se houver erro, explique de forma simples e dê a forma correta. Se estiver certo, reconheça e avance a conversa.
${hardRules()}
Mantenha internamente a contagem de erros consecutivos da MESMA construção ou frase. Se ele mudar de assunto, não carregue irritação sem motivo. Se acertar, zere essa contagem.
Evite respostas repetitivas. Varie as piadas e reações. O objetivo é ensinar inglês e manter a aula animada.`;
  }
  async function getToken(){
    if(!CFG.endpoint)throw new Error('Endpoint da xAI não configurado');
    const r=await fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purpose:'meu-ingles-voice'})});
    if(!r.ok)throw new Error('Servidor de sessão xAI: '+r.status);
    const d=await r.json();
    if(!d.value)throw new Error('Servidor não devolveu token temporário');
    return d.value;
  }
  function setBadge(kind,text){
    const e=document.getElementById('liveAiState');if(!e)return;
    e.className='aiState '+kind;e.textContent=text;
  }
  function concatBytes(chunks){let n=0;chunks.forEach(x=>n+=x.length);const out=new Uint8Array(n);let o=0;chunks.forEach(x=>{out.set(x,o);o+=x.length});return out}
  function b64bytes(b64){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
  async function playPCM(){
    if(!audioChunks.length)return;
    const bytes=concatBytes(audioChunks);audioChunks=[];
    const samples=Math.floor(bytes.length/2);if(!samples)return;
    const f=new Float32Array(samples);const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    for(let i=0;i<samples;i++)f[i]=Math.max(-1,Math.min(1,dv.getInt16(i*2,true)/32768));
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)({sampleRate:24000});
    if(audioCtx.state==='suspended')await audioCtx.resume();
    const b=audioCtx.createBuffer(1,f.length,24000);b.copyToChannel(f,0);const src=audioCtx.createBufferSource();src.buffer=b;src.connect(audioCtx.destination);
    try{liveSetMascotState('speaking')}catch(e){}
    src.onended=()=>{try{liveSetMascotState('idle')}catch(e){}};src.start();
  }
  function onEvent(ev){
    if(ev.type==='session.created'||ev.type==='session.updated')setBadge('connected','🧠 Grok Voice conectado.');
    if(ev.type==='response.created'){transcript='';audioChunks=[];try{liveSetMascotState('thinking')}catch(e){}}
    if(ev.type==='response.output_audio.delta'&&ev.delta)audioChunks.push(b64bytes(ev.delta));
    if(ev.type==='response.audio.delta'&&ev.delta)audioChunks.push(b64bytes(ev.delta));
    if(ev.type==='response.output_audio_transcript.delta'&&ev.delta){transcript+=ev.delta;const el=document.getElementById('liveLastReply');if(el)el.textContent=transcript;}
    if(ev.type==='response.audio_transcript.delta'&&ev.delta){transcript+=ev.delta;const el=document.getElementById('liveLastReply');if(el)el.textContent=transcript;}
    if(ev.type==='response.done'){playPCM();if(transcript){const h=document.getElementById('liveHint');if(h)h.textContent='Grok respondeu por voz.'}}
    if(ev.type==='error'){console.warn('xAI realtime',ev);setBadge('pending','⚠️ Grok desconectou. Vou usar o modo local até reconectar.');}
  }
  async function connect(){
    if(!CFG.enabled)throw new Error('Grok ainda não foi ativado');
    if(ws&&ws.readyState===WebSocket.OPEN)return ws;
    if(connecting)return connecting;
    connecting=(async()=>{
      setBadge('pending','🧠 Conectando ao Grok Voice...');
      const token=await getToken();
      const url=`wss://api.x.ai/v1/realtime?model=${encodeURIComponent(CFG.model)}`;
      const socket=new WebSocket(url,[`xai-client-secret.${token}`]);
      await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error('Tempo esgotado ao conectar')),12000);
        socket.onopen=()=>{clearTimeout(timer);resolve()};
        socket.onerror=()=>{clearTimeout(timer);reject(new Error('Falha no WebSocket da xAI'))};
      });
      ws=socket;
      ws.onmessage=m=>{try{onEvent(JSON.parse(m.data))}catch(e){console.warn(e)}};
      ws.onclose=()=>{ws=null;setBadge('pending','🧠 Grok offline. O modo local continua funcionando.');};
      ws.send(JSON.stringify({type:'session.update',session:{voice:CFG.voice,instructions:instructions(),resumption:{enabled:true},audio:{output:{format:{type:'audio/pcm',rate:24000},transport:'json'}}}}));
      setBadge('connected','🧠 Grok Voice conectado.');
      return ws;
    })();
    try{return await connecting}finally{connecting=null}
  }
  async function sendText(text){
    const socket=await connect();
    socket.send(JSON.stringify({type:'session.update',session:{instructions:instructions()}}));
    socket.send(JSON.stringify({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text}]}}));
    socket.send(JSON.stringify({type:'response.create',response:{instructions:`Responda ao turno do aluno agora. Personalidade atual: ${modeName()}. Cenário: ${st().scenario||'Livre'}. Nível: ${st().level||'A1'}. Siga a irritação progressiva se houver erros repetidos.`}}));
  }
  function configured(){return !!CFG.endpoint&&CFG.enabled}
  function patchVoiceChat(){
    if(typeof window.liveVoiceChat!=='function'||oldLiveVoiceChat)return;
    oldLiveVoiceChat=window.liveVoiceChat;
    window.liveVoiceChat=async function(){
      if(!configured())return oldLiveVoiceChat();
      let r=null;try{r=await prep()}catch(e){}if(!r)return;
      const btn=document.getElementById('liveMicBtn');if(btn)btn.classList.add('listening');
      try{liveSetMascotState('listening')}catch(e){}
      const h=document.getElementById('liveHint');if(h)h.textContent='Pode falar. O Grok vai te responder por voz.';
      r.onresult=async e=>{
        const text=e.results[0][0].transcript;const heard=document.getElementById('liveLastHeard');if(heard)heard.textContent=text;if(btn)btn.classList.remove('listening');
        try{liveSetMascotState('thinking')}catch(err){}
        try{await sendText(text)}catch(err){console.warn(err);setBadge('pending','⚠️ Não consegui conectar ao Grok. Voltando ao modo local.');oldLiveVoiceChat();}
      };
      r.onerror=()=>{if(btn)btn.classList.remove('listening');try{liveSetMascotState('idle')}catch(e){};try{toast('Não entendi. Tente de novo.')}catch(e){}};
      r.onend=()=>{if(btn)btn.classList.remove('listening')};
      try{r.start()}catch(e){if(btn)btn.classList.remove('listening')}
    };
  }
  function paintPrepared(){
    const e=document.getElementById('liveAiState');if(!e)return;
    if(CFG.enabled&&CFG.endpoint){e.className='aiState pending';e.textContent='🧠 Grok Voice preparado. Conecta quando você falar.'}
    else{e.className='aiState pending';e.textContent='🧠 Grok Voice preparado no código. Falta ativar o servidor seguro e a chave da xAI.'}
  }
  window.GROK_LIVE={connect,sendText,isConfigured:configured,instructions};
  function init(){paintPrepared();patchVoiceChat()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120));else setTimeout(init,120);
})();
