(()=>{
'use strict';
const KEY='meuInglesStableV2';
const API=location.hostname.endsWith('github.io')?'https://meu-ingles-claudio.netlify.app':'';
const CHAT=API+'/api/groq-chat';
const PROMPT_KEY='meuInglesLastOpeningV36';
const LEVEL_MODULES={
 A1:['Primeiros contatos','Alfabeto, números e dados pessoais','Família e pessoas','Rotina diária','Perguntas e hábitos','Casa e cidade','Comida e restaurante','Compras e preços','Direções e transporte','Tempo livre e habilidades','Ontem e fim de semana','Projeto A1: um dia completo em inglês'],
 A2:['Rotina em movimento','Histórias do passado','Planos e futuro','Comparando coisas','Viagem e hotel','Saúde e bem-estar','Trabalho e estudo','Experiências de vida','Serviços e problemas','Contando uma história','Vida social','Projeto A2: viagem completa'],
 B1:['Experiências e passado','Narrativas mais claras','Futuro e decisões','Condições reais','Conselho e obrigação','Voz passiva básica','Pessoas e coisas','O que alguém disse','Phrasal verbs essenciais','Opiniões e argumentos','Inglês no trabalho e viagem','Projeto B1: conversa de 10 minutos'],
 B2:['Tempo e duração','Hipóteses','Desejos e arrependimentos','Passiva avançada','Relato e interpretação','Dedução e probabilidade','Conectando ideias','Expressões naturais','Comunicação profissional','Notícias e mídia','Debate e persuasão','Projeto B2: apresentação e debate'],
 C1:['Nuances de tempo e aspecto','Ênfase e inversão','Modalidade avançada','Registro e nominalização','Colocações e idiomaticidade','Escrita profissional e acadêmica','Apresentações de alto nível','Debate e pensamento crítico','Inglês social e humor','Inglês profissional avançado','Escuta rápida e sotaques','Projeto C1: painel profissional'],
 C2:['Precisão e escolha de registro','Modalidade e posicionamento','Retórica e persuasão','Linguagem figurada','Idiomaticidade profunda','Argumentação complexa','Edição e precisão','Mediação e paráfrase','Velocidade, sotaques e ruído','Cultura, humor e pragmática','Domínio profissional','Projeto C2: domínio total']
};
let mode='module',phase='idle',topic='',history=[],turn=0,errorStreak=0,busy=false;
function st(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
function currentLevel(){return (st().level||'A1').toUpperCase()}
function currentTeacher(){return st().teacher||'media'}
function currentVoice(){return st().voice||'Aoede'}
function currentModule(){const t=(document.querySelector('#nextLessonTitle')?.textContent||'').trim();return (t.split('·')[0]||'Primeiros contatos').trim()}
function card(){return document.querySelector('#home .professorPanel')}
function setFocus(on){document.querySelector('#home')?.classList.toggle('conversation-focus',!!on)}
function setRobotState(name){const c=card();if(!c)return;c.classList.remove('robot-listening','robot-thinking','robot-speaking','robot-happy','robot-oops','robot-angry');if(name)c.classList.add('robot-'+name)}
function personaLabel(){return currentTeacher()==='pesada'?'Hard 18+':currentTeacher()==='media'?'Doideira':'Tranquilo'}
function pickOpening(){
 const teacher=currentTeacher();
 const groups={
  module:{
   leve:['Qual módulo você quer treinar hoje, Cláudio? Pode falar o nome ou o número.','Vamos praticar um módulo? Me diga qual você quer começar.','Escolha um módulo para a gente treinar. Pode falar o nome ou o número.','Pronto para praticar? Qual módulo você quer pegar agora?'],
   media:['Bora, Cláudio 😄 Qual módulo você quer encarar agora?','Escolhe um módulo aí e vamos treinar. Pode falar o nome ou o número.','Vamos nessa! Qual módulo você quer praticar hoje?','Manda o módulo, Cláudio. Nome ou número, do jeito que for mais fácil.'],
   pesada:['Escolhe o módulo que você quer treinar, Cláudio. Sem enrolar.','Manda o módulo, porra. Nome ou número e vamos trabalhar.','Qual módulo vai ser hoje? Escolhe logo e bora treinar.','Vamos ver esse inglês, Cláudio. Fala o módulo que você quer pegar.']
  },
  free:{
   leve:['Sobre o que você gostaria de conversar hoje? Escolha qualquer assunto.','Modo livre. Me diga um assunto e eu começo a conversa com você.','Qual assunto você quer praticar hoje? Pode ser qualquer coisa.','Vamos conversar. Escolha um tema que você goste.'],
   media:['Modo livre! 😄 Qual assunto você quer jogar na roda hoje?','Bora conversar, Cláudio. Escolhe um tema e eu puxo o papo.','Manda um assunto aí. Comida, viagem, trabalho, filme, o que você quiser.','Qual vai ser o papo de hoje? Escolhe um tema e vamos nessa.'],
   pesada:['Tá, conversa livre. Qual assunto você quer encarar hoje?','Manda um tema, Cláudio. Vamos ver se esse inglês aguenta o tranco.','Escolhe um assunto e bora conversar sem enrolação.','Qual é o tema? Manda aí e vamos botar esse inglês pra trabalhar.']
  }
 };
 const arr=groups[mode]?.[teacher]||groups.free.media;
 let last=-1;try{last=Number(localStorage.getItem(PROMPT_KEY))}catch{}
 let idx=Math.floor(Math.random()*arr.length);if(arr.length>1&&idx===last)idx=(idx+1)%arr.length;
 try{localStorage.setItem(PROMPT_KEY,String(idx))}catch{}
 return arr[idx];
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addMsg(text,who){const box=document.querySelector('#homeInlineChatBox');if(!box)return;const d=document.createElement('div');d.className='homeChatMsg '+who;d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight}
function setTopicPill(){const p=document.querySelector('#homeTopicPill');if(!p)return;p.textContent=topic?(mode==='module'?`🧩 Módulo: ${topic}`:`💬 Tema: ${topic}`):(mode==='module'?'🧩 Escolhendo módulo':'💬 Escolhendo assunto')}
function setBusy(on){
 busy=!!on;
 const send=document.querySelector('#home .homeChatSend'),mic=document.querySelector('#homeChatMic');
 send?.classList.toggle('ai-busy',busy);mic?.classList.toggle('ai-busy',busy);
 if(send)send.disabled=busy;
}
function wait(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))}
async function say(text,emotion='neutral'){
 if(!text)return;
 setRobotState(emotion==='angry'?'angry':emotion==='oops'?'oops':emotion==='happy'?'happy':'speaking');
 try{
  if(window.geminiSpeak)await Promise.race([window.geminiSpeak(text,'pt-BR',currentVoice()),wait(18000)]);
  else throw new Error('tts');
 }catch(e){
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='pt-BR';u.rate=1;u.pitch=1;speechSynthesis.speak(u)}catch{}
 }
 setRobotState('');
}
function micIcon(){return '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="micg" x1="10" y1="8" x2="54" y2="56"><stop stop-color="#6ee7ff"/><stop offset="1" stop-color="#1688ff"/></linearGradient></defs><rect x="23" y="10" width="18" height="30" rx="9" fill="url(#micg"/><path d="M16 30c0 9 7 16 16 16s16-7 16-16M32 46v9M23 55h18" fill="none" stroke="#dffaff" stroke-width="4" stroke-linecap="round"/></svg>'}
function moduleButtons(){return (LEVEL_MODULES[currentLevel()]||[]).map((m,i)=>`<button class="modulePickBtn" onclick="pickV26Module(${i})"><b>${i+1}</b><span>${esc(m)}</span></button>`).join('')}
function render(){
 const c=card();if(!c)return;
 c.classList.add('homeTalkCard');
 c.innerHTML=`
 <div class="homeConversationTop"><h2>Converse em inglês</h2><button class="teacherTypesBtn" onclick="openTeacherTypes()">🤖 Tipos de professor</button></div>
 <p class="homeConversationIntro">Pratique com a IA no tema de um módulo ou converse livremente.</p>
 <div class="homeRobotStage"><img class="homeRobot" src="assets/robot-professor.svg?v=26" alt="Robô professor"></div>
 <div class="homeConversationChoices">
   <button class="homeConversationChoice methodsCard" data-v26mode="methods" onclick="openMethodsRobot(event)"><span class="ico">🧭</span><span><b>Métodos</b><small>Escolha um tema e uma aula particular</small></span><span class="choiceArrow">›</span></button>
   <button class="homeConversationChoice ${mode==='module'?'active':''}" data-v26mode="module" onclick="startV26FromCard('module')"><span class="ico">🧩</span><span><b>Tema dos módulos</b><small>Escolha um módulo e pratique por áudio</small></span></button>
   <button class="homeConversationChoice ${mode==='free'?'active':''}" data-v26mode="free" onclick="startV26FromCard('free')"><span class="ico">∞</span><span><b>Modo livre</b><small>Converse sobre qualquer assunto</small></span></button>
 </div>
 <div class="homeInlineChat">
   <div class="homeChatHead"><b>Professor ${esc(personaLabel())}</b><button class="homeChatClose" onclick="closeV26Conversation(event)">Sair</button></div>
   <button id="homeTopicPill" class="homeTopicPill" onclick="changeV26Topic()"></button>
   <div id="homeModulePicker" class="homeModulePicker">${moduleButtons()}</div>
   <div id="homeInlineChatBox" class="homeChatBox"></div>
   <div class="homeChatHint">Responda falando ou escrevendo. O professor começa fácil e aumenta a dificuldade aos poucos.</div>
   <div class="homeChatControls"><button id="homeChatMic" class="homeChatMic" onclick="v26Mic()" aria-label="Falar">${micIcon()}</button><input id="homeChatInput" class="homeChatInput" maxlength="500" placeholder="Digite sua resposta..."><button class="homeChatSend" onclick="v26Send()">➤</button></div>
 </div>`;
 if(phase!=='idle'){c.classList.add('chat-open');setFocus(true)}else{c.classList.remove('chat-open');setFocus(false)}
 setTopicPill();
 const inp=document.querySelector('#homeChatInput');inp?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();window.v26Send()}});
}
window.chooseV26Mode=m=>{if(phase!=='idle')return;mode=m==='free'?'free':'module';document.querySelectorAll('[data-v26mode]').forEach(b=>b.classList.toggle('active',b.dataset.v26mode===mode))};
window.startV26FromCard=async m=>{
 if(phase!=='idle')return;
 mode=m==='free'?'free':'module';
 document.querySelectorAll('[data-v26mode]').forEach(b=>b.classList.toggle('active',b.dataset.v26mode===mode));
 await window.startV26Conversation();
};
window.openTeacherTypes=()=>{window.stableShow?.('settings');setTimeout(()=>{[...document.querySelectorAll('#settings h3')].find(x=>/Personalidade do professor/i.test(x.textContent||''))?.scrollIntoView({behavior:'smooth',block:'start'})},120)};
window.startV26Conversation=async()=>{
 if(phase!=='idle')return;
 phase=mode==='module'?'live_course':'live_free';topic='';history=[];turn=0;errorStreak=0;render();

 /* A esfera usa exclusivamente Gemini 3.1 Live.
    Gemini 2.5 TTS fica somente nas aulas normais/botões Ouvir. */
 if(window.MeuInglesGeminiLiveV38?.available){
   try{window.stopGeminiTTS?.()}catch{}
   try{window.speechSynthesis?.cancel?.()}catch{}
   const pill=document.querySelector('#homeTopicPill');
   if(pill)pill.textContent=mode==='module'?'📚 Escolhendo curso':'💬 Escolhendo assunto';
   document.querySelector('#homeModulePicker')?.classList.remove('open');
   await window.MeuInglesGeminiLiveV38.start({kind:mode==='module'?'course':'free'});
   return;
 }

 const prompt=pickOpening();addMsg(prompt,'bot');setTopicPill();await say(prompt,'happy');
};
window.closeV26Conversation=e=>{e?.preventDefault?.();e?.stopPropagation?.();try{window.MeuInglesGeminiLiveV38?.stop?.()}catch{}try{window.stopGeminiTTS?.()}catch{}phase='idle';topic='';history=[];turn=0;errorStreak=0;setBusy(false);setRobotState('');setFocus(false);render();setTimeout(()=>card()?.scrollIntoView({behavior:'smooth',block:'start'}),30)};
window.startV26LiveContext=async context=>{
 try{await window.MeuInglesGeminiLiveV38?.stop?.()}catch{}
 try{window.stopGeminiTTS?.()}catch{}
 mode='free';
 phase='live_external';
 topic=String(context?.topic||'').trim();
 history=[];turn=0;errorStreak=0;
 render();
 const pill=document.querySelector('#homeTopicPill');
 if(pill&&topic)pill.textContent=`💬 Tema: ${topic}`;
 await window.MeuInglesGeminiLiveV38?.start?.(context||{kind:'free'});
};
window.changeV26Topic=()=>{
 if(phase==='idle'||busy)return;
 const picker=document.querySelector('#homeModulePicker');
 if(mode==='module'){
   phase='choose_module';topic='';history=[];turn=0;errorStreak=0;setTopicPill();picker?.classList.toggle('open');
 }else{
   phase='choose_free';topic='';history=[];turn=0;errorStreak=0;setTopicPill();const input=document.querySelector('#homeChatInput');if(input){input.placeholder='Digite o novo assunto...';input.focus()}
 }
};
window.pickV26Module=i=>{
 if(busy)return;
 const modules=LEVEL_MODULES[currentLevel()]||[];const m=modules[Number(i)];if(!m)return;
 document.querySelector('#homeModulePicker')?.classList.remove('open');handleUser(String(Number(i)+1));
};
function matchModule(text){
 const modules=LEVEL_MODULES[currentLevel()]||[];const n=norm(text);
 const num=n.match(/(?:modulo|módulo)?\s*(\d{1,2})/i);if(num){const i=Number(num[1])-1;if(modules[i])return modules[i]}
 if(/esse|atual|primeiro contato|primeiros contato/.test(n))return currentModule();
 let best='';let score=0;for(const m of modules){const mn=norm(m);const words=mn.split(' ').filter(x=>x.length>2);const s=words.filter(w=>n.includes(w)).length;if(n.includes(mn))return m;if(s>score){score=s;best=m}}
 return score>0?best:'';
}
function moodFrom(d){if(d?.emotion)return d.emotion;if(d?.verdict==='wrong')return currentTeacher()==='pesada'?'angry':'oops';if(d?.verdict==='almost')return 'oops';if(d?.verdict==='correct')return 'happy';return 'neutral'}
async function fetchAI(body){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetch(CHAT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
  const raw=await r.text();let d={};try{d=JSON.parse(raw)}catch{}
  if(!r.ok)throw new Error(d?.details||d?.error||'Falha da IA');
  return d;
 }finally{clearTimeout(timer)}
}
function fallbackReply(){
 if(topic){
  if(currentTeacher()==='pesada')return `A conexão deu uma engasgada, mas não vamos parar. Tell me one thing about ${topic}.`;
  if(currentTeacher()==='media')return `A conexão demorou um pouco 😄 Vamos seguir: tell me one thing about ${topic}.`;
  return `A conexão demorou um pouco. Vamos continuar: tell me one thing about ${topic}.`;
 }
 return 'A conexão demorou um pouco. Tente falar de novo.';
}
async function ask(text){
 if(busy)return;setBusy(true);setRobotState('thinking');
 try{
   const body={mode:'conversation',message:text,level:currentLevel(),personality:currentTeacher(),scenario:mode==='module'?`Treino guiado do módulo ${topic}`:`Conversa livre guiada sobre ${topic}`,conversation_mode:mode,learning_topic:topic,turn,error_streak:errorStreak,history:history.slice(-10)};
   let d;try{d=await fetchAI(body)}catch{d={reply_pt:fallbackReply(),verdict:'neutral',emotion:'neutral'}}
   const reply=[d.reply_pt,d.reply_en].filter(Boolean).join(d.reply_pt&&d.reply_en?'\n':'')||fallbackReply();
   history.push({role:'user',content:text},{role:'assistant',content:reply});turn++;
   if(d.verdict==='wrong'||d.verdict==='almost')errorStreak=Math.min(12,errorStreak+1);else if(d.verdict==='correct')errorStreak=Math.max(0,errorStreak-1);
   addMsg(reply,'bot');setBusy(false);await say(reply,moodFrom(d));
 }catch(e){setBusy(false);const msg=fallbackReply();addMsg(msg,'bot');await say(msg,'oops')}finally{setBusy(false)}
}
async function handleUser(text){
 text=String(text||'').trim();if(!text||busy)return;addMsg(text,'user');
 if(phase==='choose_module'){
   const m=matchModule(text);if(!m){document.querySelector('#homeModulePicker')?.classList.add('open');const mods=LEVEL_MODULES[currentLevel()]||[];const msg=`Escolhe um dos módulos abaixo ou fala o número de 1 a ${mods.length}.`;addMsg(msg,'bot');await say(msg,'oops');return}
   topic=m;phase='learning';document.querySelector('#homeModulePicker')?.classList.remove('open');setTopicPill();await ask(`Escolhi o módulo ${m}. Comece agora pelo exercício oral mais fácil desse módulo e faça uma pergunta curta em inglês, com ajuda em português se necessário.`);return;
 }
 if(phase==='choose_free'){
   topic=text.slice(0,80);phase='learning';setTopicPill();await ask(`Quero praticar sobre ${topic}. Comece pela pergunta oral mais fácil possível e aumente a dificuldade aos poucos conforme eu acertar.`);return;
 }
 await ask(text);
}
window.v26Send=()=>{
 if(busy)return;
 const i=document.querySelector('#homeChatInput');const t=String(i?.value||'').trim();
 if(!t)return;
 i.value='';handleUser(t);
};
window.v26Mic=()=>{
 if(busy||card()?.classList.contains('audio-speaking'))return;
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){addMsg('Seu navegador não liberou o reconhecimento de voz. Você pode escrever a resposta.','bot');return}
 const mic=document.querySelector('#homeChatMic');const r=new SR();r.lang=phase==='learning'?'en-US':'pt-BR';r.interimResults=false;r.maxAlternatives=1;setRobotState('listening');mic?.classList.add('listening');
 r.onresult=e=>{mic?.classList.remove('listening');setRobotState('');const t=e.results?.[0]?.[0]?.transcript;if(t)handleUser(t)};
 r.onerror=()=>{mic?.classList.remove('listening');setRobotState('oops');setTimeout(()=>setRobotState(''),700)};
 r.onend=()=>{mic?.classList.remove('listening');if(card()?.classList.contains('robot-listening'))setRobotState('')};r.start();
};
function hookNav(){
 const goal=document.querySelector('nav button[data-screen="goal"]');
 if(goal&&!goal.dataset.v26){
   goal.dataset.v26='1';
   goal.addEventListener('click',e=>{
     e.preventDefault();
     e.stopImmediatePropagation();
     window.stableShow?.('settings');
     setTimeout(()=>{
       const h=[...document.querySelectorAll('#settings h3')].find(x=>/Meta diária/i.test(x.textContent||''));
       h?.scrollIntoView({behavior:'smooth',block:'start'});
     },80);
   },true);
 }
}
function hookShow(){
 const old=window.stableShow;
 if(typeof old==='function'&&!old.__v26){
   const w=function(id){
     const r=old(id);
     setTimeout(()=>{if(id==='home'){render();hookNav()}},35);
     return r;
   };
   w.__v26=true;
   window.stableShow=w;
 }
}
function init(){hookShow();hookNav();render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120));else setTimeout(init,120);
})();
