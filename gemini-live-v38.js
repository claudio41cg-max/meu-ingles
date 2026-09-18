(()=>{
'use strict';

const MODEL='gemini-3.1-flash-live-preview';
const LIVE_WS=String(window.MEU_INGLES_LIVE_WS||'wss://radar-gemini-live-a5bf.claudio41cg.workers.dev/v1/live-ws');
const KEY='meuInglesStableV2';
const COURSE_MODULES={
 A1:['Primeiros contatos','Alfabeto, números e dados pessoais','Família e pessoas','Rotina diária','Perguntas e hábitos','Casa e cidade','Comida e restaurante','Compras e preços','Direções e transporte','Tempo livre e habilidades','Ontem e fim de semana','Projeto A1: um dia completo em inglês'],
 A2:['Rotina em movimento','Histórias do passado','Planos e futuro','Comparando coisas','Viagem e hotel','Saúde e bem-estar','Trabalho e estudo','Experiências de vida','Serviços e problemas','Contando uma história','Vida social','Projeto A2: viagem completa'],
 B1:['Experiências e passado','Narrativas mais claras','Futuro e decisões','Condições reais','Conselho e obrigação','Voz passiva básica','Pessoas e coisas','O que alguém disse','Phrasal verbs essenciais','Opiniões e argumentos','Inglês no trabalho e viagem','Projeto B1: conversa de 10 minutos'],
 B2:['Tempo e duração','Hipóteses','Desejos e arrependimentos','Passiva avançada','Relato e interpretação','Dedução e probabilidade','Conectando ideias','Expressões naturais','Comunicação profissional','Notícias e mídia','Debate e persuasão','Projeto B2: apresentação e debate'],
 C1:['Nuances de tempo e aspecto','Ênfase e inversão','Modalidade avançada','Registro e nominalização','Colocações e idiomaticidade','Escrita profissional e acadêmica','Apresentações de alto nível','Debate e pensamento crítico','Inglês social e humor','Inglês profissional avançado','Escuta rápida e sotaques','Projeto C1: painel profissional'],
 C2:['Precisão e escolha de registro','Modalidade e posicionamento','Retórica e persuasão','Linguagem figurada','Idiomaticidade profunda','Argumentação complexa','Edição e precisão','Mediação e paráfrase','Velocidade, sotaques e ruído','Cultura, humor e pragmática','Domínio profissional','Projeto C2: domínio total']
};
const MIC_SELECTOR='#homeChatMic';
const MODULE_BTN_SELECTOR='#homeModulePicker .modulePickBtn';
const CLOSE_SELECTOR='#home .homeChatClose';

let ws=null,micStream=null,inputCtx=null,sourceNode=null,processor=null,sinkGain=null,outputCtx=null,outputCursor=0;
let running=false,starting=false,setupReady=false,micSending=false,manualStop=false,firstAudio=false,stage='idle';
let setupTimer=null,introTimer=null;
const outputSources=new Set();

function state(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function mic(){return document.querySelector(MIC_SELECTOR)}
function teacher(){return state().teacher||'media'}
function level(){return String(state().level||'A1').toUpperCase()}
function teacherLabel(){return teacher()==='pesada'?'Hard 18+':teacher()==='leve'?'Tranquilo':'Doideira'}
function topicText(){return String(document.querySelector('#homeTopicPill')?.textContent||'').trim()}
function mode(){return /curso|módulo|modulo/i.test(topicText())?'course':'free'}
function selectedTopic(){const t=topicText();const m=t.match(/(?:Módulo|Modulo|Tema):\s*(.+)$/i);return m?m[1].trim():''}
function choosing(){return /escolhendo/i.test(topicText())}
function conversationOpen(){return !!card()?.classList.contains('chat-open')}

function robot(name=''){
 const c=card();if(!c)return;
 c.classList.remove('robot-listening','robot-thinking','robot-speaking','robot-happy','robot-oops','robot-angry','gemini-live-running');
 if(name)c.classList.add('robot-'+name);
 if(running||starting)c.classList.add('gemini-live-running');
}
function setMicState(name=''){
 const b=mic();if(!b)return;
 b.classList.remove('gemini-live-connecting','gemini-live-listening','gemini-live-speaking','gemini-live-error');
 if(name)b.classList.add('gemini-live-'+name);
 b.setAttribute('aria-pressed',(running||starting)?'true':'false');
 b.title=name==='listening'?'Gemini Live ouvindo':name==='speaking'?'Gemini Live falando':name==='connecting'?'Conectando ao Gemini Live':'Iniciar Gemini Live';
}
function installStyle(){
 if(document.getElementById('meuInglesLiveV38Style'))return;
 const s=document.createElement('style');s.id='meuInglesLiveV38Style';
 s.textContent=`
 #homeChatMic.gemini-live-connecting{box-shadow:0 0 0 8px rgba(62,181,255,.10),0 0 30px rgba(62,181,255,.48)!important;animation:miLivePulse38 1s ease-in-out infinite}
 #homeChatMic.gemini-live-listening{background:radial-gradient(circle at 35% 28%,#63f3d0,#10aee8 52%,#0872d8)!important;box-shadow:0 0 0 9px rgba(41,229,190,.10),0 0 32px rgba(41,229,190,.62)!important;animation:miLivePulse38 1.15s ease-in-out infinite}
 #homeChatMic.gemini-live-speaking{background:radial-gradient(circle at 35% 28%,#9bf5ff,#338dff 58%,#2258e8)!important;box-shadow:0 0 0 9px rgba(73,151,255,.10),0 0 36px rgba(73,151,255,.72)!important;animation:miLiveTalk38 .48s ease-in-out infinite alternate}
 #homeChatMic.gemini-live-error{background:radial-gradient(circle at 35% 28%,#ff8b9c,#d72d52 60%,#8f1230)!important;box-shadow:0 0 28px rgba(255,70,105,.55)!important}
 @keyframes miLivePulse38{0%,100%{transform:scale(1)}50%{transform:scale(1.055)}}
 @keyframes miLiveTalk38{from{transform:scale(1)}to{transform:scale(1.075)}}`;
 document.head.appendChild(s);
}

function personaInstruction(){
 if(teacher()==='pesada')return 'Professor Hard 18+: seja firme, provocador e adulto. Pode usar palavrões leves a fortes de forma bem-humorada e pedagógica, sem humilhar o aluno. Comece intenso, mas controlado. Se houver erros repetidos, aumente a bronca e a energia, sempre corrigindo e ensinando.';
 if(teacher()==='leve')return 'Professor Tranquilo: seja paciente, acolhedor, calmo e claro. Corrija sem pressa e incentive o aluno.';
 return 'Professor Doideira: seja animado, engraçado, imprevisível e energético, mas continue ensinando com clareza.';
}
function courseCatalog(){
 return Object.entries(COURSE_MODULES).map(([level,mods])=>level+': '+mods.map((m,i)=>(i+1)+'. '+m).join(' | ')).join('\n');
}
function systemText(){
 const currentMode=mode();
 if(currentMode==='course'){
  return [
   'Você é o ÚNICO professor de voz ativo nesta sessão do aplicativo Meu Inglês.',
   'Esta sessão usa Gemini 3.1 Live em mãos livres. Não espere outro TTS e não peça para o aluno apertar o microfone a cada resposta.',
   `Personalidade ativa: ${teacherLabel()}. ${personaInstruction()}`,
   'MODO CURSO A1–C2. Não assuma o nível salvo do aplicativo. Primeiro descubra verbalmente qual curso o aluno quer: A1, A2, B1, B2, C1 ou C2.',
   'REGRA DE FLUXO: 1) pergunte o curso; 2) depois pergunte o módulo daquele curso; 3) só depois comece a aula.',
   'REGRA ABSOLUTA: o módulo deve ser um dos módulos oficiais listados abaixo. Nunca invente módulo, nunca escolha tema da internet e nunca substitua por outro assunto.',
   'CATÁLOGO OFICIAL DE CURSOS E MÓDULOS:',
   courseCatalog(),
   'Quando o aluno disser o curso, confirme em uma frase curta e pergunte qual módulo desse curso ele quer. Se disser apenas um número de módulo, use exatamente a posição correspondente da lista daquele curso.',
   'Depois que o módulo for escolhido, permaneça exclusivamente nele durante a aula. Não mude para outro módulo sem o aluno pedir.',
   'No A1, use vocabulário e estruturas realmente simples. Faça uma pergunta curta por vez e espere a resposta.',
   'Corrija um erro por vez. Se o aluno acertar, avance aos poucos dentro do mesmo módulo.',
   'Use português do Brasil somente quando ajudar a compreensão. A prática deve priorizar inglês compatível com o nível escolhido.',
   'Se o aluno interromper você, pare e ouça. Continue a partir do que ele acabou de dizer.',
   'Não invente progresso, notas, módulos ou conteúdo já estudado que não esteja nesta conversa.'
  ].join('\n');
 }

 const topic=selectedTopic();
 return [
  'Você é o professor de inglês por voz do aplicativo Meu Inglês.',
  `Nível atual do aluno: ${level()}.`,
  `Personalidade ativa: ${teacherLabel()}. ${personaInstruction()}`,
  topic?`O tema de conversa livre escolhido é "${topic}".`:'O aluno escolheu conversa livre. Primeiro pergunte sobre qual assunto ele quer conversar e aprender.',
  'A experiência é áudio em tempo real. Fale de forma natural, como uma pessoa conversando ao vivo.',
  'Ensine do mais fácil para o mais difícil.',
  'Quando o aluno errar pronúncia, gramática ou vocabulário, corrija uma coisa por vez e peça para repetir.',
  'Não transforme a conversa em palestra. Faça perguntas curtas e espere a resposta.',
  'Se o aluno interromper você, pare e ouça.'
 ].join('\n');
}
function introText(){
 if(mode()==='course'){
  return 'Inicie agora em português do Brasil com uma frase curta perguntando qual curso o aluno quer estudar: A1, A2, B1, B2, C1 ou C2. Não comece nenhuma aula antes de ele escolher o curso e depois o módulo.';
 }
 return selectedTopic()? `Comece uma conversa oral bem fácil sobre ${selectedTopic()}. Faça uma pergunta curta ao aluno.` : 'Pergunte ao aluno qual assunto ele quer conversar e praticar em inglês. Seja breve.';
}

function bytesToBase64(buffer){const b=new Uint8Array(buffer);let out='';for(let i=0;i<b.length;i+=0x8000)out+=String.fromCharCode(...b.subarray(i,Math.min(i+0x8000,b.length)));return btoa(out)}
function base64ToBytes(v){const s=atob(String(v||'')),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b}
function toPCM16(input,inputRate,targetRate=16000){if(!input?.length)return new ArrayBuffer(0);const ratio=Math.max(1,inputRate/targetRate),len=Math.max(1,Math.floor(input.length/ratio)),out=new Int16Array(len);for(let i=0;i<len;i++){const a=Math.floor(i*ratio),z=Math.min(input.length,Math.max(a+1,Math.floor((i+1)*ratio)));let sum=0;for(let j=a;j<z;j++)sum+=input[j];let x=Math.max(-1,Math.min(1,sum/Math.max(1,z-a)));out[i]=x<0?Math.round(x*32768):Math.round(x*32767)}return out.buffer}
async function prepareOutput(){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('AudioContext indisponível');if(!outputCtx||outputCtx.state==='closed')outputCtx=new C();if(outputCtx.state==='suspended')await outputCtx.resume();outputCursor=Math.max(outputCursor,outputCtx.currentTime)}
function stopOutput(){for(const n of [...outputSources]){try{n.stop()}catch{}}outputSources.clear();if(outputCtx)outputCursor=outputCtx.currentTime}
async function playAudio(b64,rate=24000){await prepareOutput();const bytes=base64ToBytes(b64),count=Math.floor(bytes.byteLength/2);if(!count)return;const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),samples=new Float32Array(count);for(let i=0;i<count;i++)samples[i]=view.getInt16(i*2,true)/32768;const buf=outputCtx.createBuffer(1,count,rate);buf.copyToChannel(samples,0);const n=outputCtx.createBufferSource();n.buffer=buf;n.connect(outputCtx.destination);const when=Math.max(outputCtx.currentTime+.015,outputCursor);outputCursor=when+buf.duration;outputSources.add(n);n.onended=()=>outputSources.delete(n);n.start(when);firstAudio=true;robot('speaking');setMicState('speaking')}

async function prepareMic(){
 if(micStream&&processor)return;
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microfone não suportado');
 micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1},video:false});
 const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('AudioContext indisponível');inputCtx=new C();if(inputCtx.state==='suspended')await inputCtx.resume();sourceNode=inputCtx.createMediaStreamSource(micStream);processor=inputCtx.createScriptProcessor(4096,1,1);sinkGain=inputCtx.createGain();sinkGain.gain.value=0;sourceNode.connect(processor);processor.connect(sinkGain);sinkGain.connect(inputCtx.destination);
 processor.onaudioprocess=e=>{if(!micSending||!running||!setupReady||ws?.readyState!==WebSocket.OPEN)return;const raw=e.inputBuffer.getChannelData(0),chunk=toPCM16(raw,inputCtx.sampleRate,16000);if(!chunk.byteLength)return;send({realtimeInput:{audio:{data:bytesToBase64(chunk),mimeType:'audio/pcm;rate=16000'}}})};
}
async function stopMic(){try{if(processor){processor.onaudioprocess=null;processor.disconnect()}}catch{}try{sourceNode?.disconnect()}catch{}try{sinkGain?.disconnect()}catch{}try{micStream?.getTracks()?.forEach(t=>t.stop())}catch{}processor=null;sourceNode=null;sinkGain=null;micStream=null;micSending=false;if(inputCtx){try{await inputCtx.close()}catch{}}inputCtx=null}
function send(obj){if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify(obj));return true}return false}
async function readData(data){if(typeof data==='string')return data;if(data instanceof Blob)return await data.text();if(data instanceof ArrayBuffer)return new TextDecoder().decode(data);if(ArrayBuffer.isView(data))return new TextDecoder().decode(data.buffer,data.byteOffset,data.byteLength);return String(data??'')}
function diag(d){const s=String(d?.stage||'');if(!s)return;stage='proxy-'+s;console.log('[Meu Inglês Live]',s,d)}
function handle(m){
 if(m?.__radarProxy||m?.__meuInglesProxy){diag(m.__radarProxy||m.__meuInglesProxy);return}
 if(m?.setupComplete!==undefined){clearTimeout(setupTimer);setupReady=true;stage='ready';send({clientContent:{turns:[{role:'user',parts:[{text:introText()}]}],turnComplete:true}});clearTimeout(introTimer);introTimer=setTimeout(()=>{if(running&&!firstAudio){micSending=true;robot('listening');setMicState('listening')}},5000);return}
 if(m?.serverContent?.interrupted){stopOutput();robot('listening');setMicState('listening')}
 const parts=m?.serverContent?.modelTurn?.parts||[];for(const p of parts){const inline=p?.inlineData||p?.inline_data;if(!inline?.data)continue;const mime=String(inline.mimeType||inline.mime_type||'audio/pcm;rate=24000');if(!/^audio\//i.test(mime))continue;const rate=Number((mime.match(/rate=(\d+)/i)||[])[1])||24000;playAudio(inline.data,rate).catch(console.warn)}
 if(m?.serverContent?.turnComplete){micSending=true;robot('listening');setMicState('listening')}
}
async function cleanup(closeSocket=false){clearTimeout(setupTimer);clearTimeout(introTimer);setupTimer=introTimer=null;setupReady=false;running=false;starting=false;micSending=false;if(closeSocket&&ws){try{ws.onclose=null;ws.onerror=null;ws.onmessage=null;ws.close(1000,'user_stop')}catch{}}ws=null;await stopMic();stopOutput();robot('');setMicState('')}
async function start(){
 if(running||starting||!conversationOpen())return;
 starting=true;manualStop=false;firstAudio=false;stage='start';installStyle();robot('thinking');setMicState('connecting');
 try{
  try{speechSynthesis.cancel()}catch{}
  await Promise.all([prepareOutput(),prepareMic()]);
  stage='worker-websocket';ws=new WebSocket(LIVE_WS+'?app=meu-ingles&v=38');
  ws.onopen=()=>{stage='browser-websocket-open';running=true;starting=false;send({setup:{model:`models/${MODEL}`,generationConfig:{responseModalities:['AUDIO']},systemInstruction:{parts:[{text:systemText()}]}}});setupTimer=setTimeout(()=>{if(running&&!setupReady){console.warn('[Meu Inglês Live] setupComplete ainda não chegou');setMicState('error');robot('oops')}},8000)};
  ws.onmessage=async e=>{try{handle(JSON.parse(await readData(e.data)))}catch(err){console.warn('[Meu Inglês Live] mensagem inválida',err)}};
  ws.onerror=e=>{console.warn('[Meu Inglês Live] websocket',e);setMicState('error');robot('oops')};
  ws.onclose=async e=>{const manual=manualStop;console.warn('[Meu Inglês Live] fechado',e?.code,e?.reason);await cleanup(false);if(!manual){setMicState('error');robot('oops');setTimeout(()=>{setMicState('');robot('')},1400)}};
 }catch(e){console.warn('[Meu Inglês Live] start',e);await cleanup(true);setMicState('error');robot('oops');setTimeout(()=>{setMicState('');robot('')},1600)}
}
async function stop(){manualStop=true;stage='manual-stop';await cleanup(true);stage='idle'}
function toggle(){if(running||starting)stop();else start()}
function sendText(text){const t=String(text||'').trim();if(!t||!running||!setupReady)return false;send({clientContent:{turns:[{role:'user',parts:[{text:t}]}],turnComplete:true}});return true}
function selectModule(btn){const name=String(btn?.textContent||'').replace(/^\s*\d+\s*/,'').trim();if(!name)return;document.querySelector('#homeModulePicker')?.classList.remove('open');const pill=document.querySelector('#homeTopicPill');if(pill)pill.textContent=`🧩 Módulo: ${name}`;sendText(`O aluno escolheu o módulo ${name}. Continue a conversa oral dentro desse módulo, começando pelo mais fácil.`)}

function interceptClick(e){
 const target=e.target?.closest?.(MIC_SELECTOR+','+MODULE_BTN_SELECTOR+','+CLOSE_SELECTOR);if(!target)return;
 if(target.matches(MIC_SELECTOR)){
  if(!conversationOpen())return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toggle();return;
 }
 if(target.matches(MODULE_BTN_SELECTOR)&&(running||starting)){
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();selectModule(target);return;
 }
 if(target.matches(CLOSE_SELECTOR)&&(running||starting))stop();
}
function interceptSend(e){
 if(!(running&&setupReady))return;
 const btn=e.target?.closest?.('#home .homeChatSend');if(!btn)return;
 const input=document.querySelector('#homeChatInput');const text=String(input?.value||'').trim();if(!text)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();input.value='';sendText(text);
}
function interceptEnter(e){if(!(running&&setupReady)||e.key!=='Enter'||!e.target?.matches?.('#homeChatInput'))return;const text=String(e.target.value||'').trim();if(!text)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();e.target.value='';sendText(text)}

document.addEventListener('click',interceptClick,true);
document.addEventListener('click',interceptSend,true);
document.addEventListener('keydown',interceptEnter,true);
window.addEventListener('pagehide',()=>{manualStop=true;cleanup(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||starting))stop()});
installStyle();
window.MeuInglesGeminiLiveV38={available:true,start,stop,toggle,sendText,get state(){return{running,starting,setupReady,micSending,stage,model:MODEL,worker:LIVE_WS}}};
})();
