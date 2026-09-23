(()=>{
'use strict';
const KEY='meuInglesStableV2';
const API='https://meu-ingles-livid.vercel.app';
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
function currentName(){return String(st().name||'aluno').trim()||'aluno'}
function homeGuideSteps(){
  const n=currentName();
  return [
    {
      sel:'#home [data-v26mode="methods"]',
      text:`Oi, ${n}! Se você quiser praticar por assunto, toque em Explorar temas. Lá você pode escolher temas como família, viagens, comida, hotel e muito mais, e praticar inglês com a inteligência artificial.`
    },
    {
      sel:'#home [data-v26mode="module"]',
      text:'Se você quiser continuar o que já está estudando, use Inglês com AI. Ele acompanha o conteúdo do seu curso e ajuda você a revisar e avançar nas aulas. Toque em Inglês com AI e vá direto para a IA.'
    },
    {
      sel:'#home [data-v26mode="free"]',
      text:'E se você quiser conversar sem roteiro, escolha Bate-papo livre. Você pode falar sobre praticamente qualquer assunto e praticar inglês de forma mais natural. Toque em Bate-papo livre e vá direto para a IA.'
    }
  ];
}
let homeGuideBusy=false;
let homeGuidePreloading=false;
let homeGuidePreloadSignature='';
let homeGuideRun=0;

function clearGuideHighlight(){
  document.querySelectorAll('#home .homeConversationChoice').forEach(x=>x.classList.remove('guide-highlight'));
}
function setGuideHighlight(sel){
  clearGuideHighlight();
  document.querySelector(sel)?.classList.add('guide-highlight');
}
function setGuideRobotSpeaking(on){
  const stage=document.querySelector('#home .homeRobotStage');
  const img=stage?.querySelector('.homeRobot');
  const hint=stage?.querySelector('.homeRobotGuideHint');
  if(img){
    const wanted=on?'assets/robot-professor-talking.svg?v=4':'assets/robot-professor.svg?v=26';
    if(img.getAttribute('src')!==wanted)img.setAttribute('src',wanted);
  }
  if(hint)hint.textContent=on?'🔇 Toque para parar':'🔊 Toque em mim';
  stage?.classList.toggle('home-guide-speaking',!!on);
}
function stopHomeGuideAudio(){
  try{window.stopGeminiTTS?.()}catch{}
  try{window.speechSynthesis?.cancel?.()}catch{}
}
window.stopHomeRobotGuide=()=>{
  if(!homeGuideBusy)return;
  homeGuideRun++;
  homeGuideBusy=false;
  stopHomeGuideAudio();
  clearGuideHighlight();
  const robot=document.querySelector('#home .homeRobotStage');
  robot?.classList.remove('home-guide-speaking','home-guide-react','guide-mood-0','guide-mood-1','guide-mood-2','guide-mood-3');
  setGuideRobotSpeaking(false);
  setRobotState('');
  setTimeout(preloadHomeGuideAudio,220);
};
async function preloadHomeGuideAudio(){
  if(homeGuidePreloading||typeof window.preloadGeminiTTS!=='function')return;
  const voice=currentVoice();
  const steps=homeGuideSteps();
  const signature=[voice,currentName(),...steps.map(x=>x.text)].join('|');
  if(signature===homeGuidePreloadSignature)return;
  homeGuidePreloading=true;
  try{
    for(const step of steps){
      await window.preloadGeminiTTS(step.text,'pt-BR',voice);
    }
    homeGuidePreloadSignature=signature;
  }catch(e){
    console.warn('Pré-carga do tutorial do robô',e);
  }finally{
    homeGuidePreloading=false;
  }
}

window.playHomeRobotGuide=async()=>{
  if(phase!=='idle')return;
  if(homeGuideBusy){
    window.stopHomeRobotGuide();
    return;
  }

  const robot=document.querySelector('#home .homeRobotStage');
  if(!robot)return;

  const run=++homeGuideRun;
  homeGuideBusy=true;
  clearGuideHighlight();
  robot.classList.add('home-guide-react');
  setRobotState('happy');

  try{
    stopHomeGuideAudio();
    await new Promise(r=>setTimeout(r,70));
    if(run!==homeGuideRun)return;

    const voice=currentVoice();
    const steps=homeGuideSteps();

    for(let i=0;i<steps.length;i++){
      if(run!==homeGuideRun||!homeGuideBusy)return;
      const step=steps[i];
      setGuideHighlight(step.sel);
      robot.classList.remove('guide-mood-0','guide-mood-1','guide-mood-2','guide-mood-3');
      robot.classList.add('guide-mood-'+i);
      setGuideRobotSpeaking(true);
      setRobotState('speaking');

      const ok=typeof window.geminiSpeak==='function'
        ?await window.geminiSpeak(step.text,'pt-BR',voice)
        :false;

      if(run!==homeGuideRun||!homeGuideBusy)return;
      if(!ok)break;
    }
  }finally{
    if(run!==homeGuideRun)return;
    clearGuideHighlight();
    robot.classList.remove('home-guide-speaking','home-guide-react','guide-mood-0','guide-mood-1','guide-mood-2','guide-mood-3');
    setGuideRobotSpeaking(false);
    setRobotState('happy');
    homeGuideBusy=false;
    setTimeout(()=>{
      if(run===homeGuideRun)setRobotState('');
    },650);
    setTimeout(preloadHomeGuideAudio,250);
  }
}

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
function setTopicPill(){const p=document.querySelector('#homeTopicPill');if(!p)return;p.textContent=topic?(mode==='module'?`📚 Curso: ${topic}`:`💬 Tema: ${topic}`):(mode==='module'?'📚 Escolhendo curso':'💬 Escolhendo assunto')}
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
  try{
    window.nativeSpeechFallback?.(text,'pt-BR');
  }catch{}
 }
 setRobotState('');
}
function aiMark(){
 return '<span class="cardAiMark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3c1.25 6.4 4.6 9.75 11 11-6.4 1.25-9.75 4.6-11 11-1.25-6.4-4.6-9.75-11-11 6.4-1.25 9.75-4.6 11-11Z" fill="currentColor"/><path d="M25 3c.55 2.8 2.2 4.45 5 5-2.8.55-4.45 2.2-5 5-.55-2.8-2.2-4.45-5-5 2.8-.55 4.45-2.2 5-5Z" fill="currentColor" opacity=".72"/></svg></span>';
}
function exploreVisual(){
 return '<span class="ico choiceVisual exploreChoiceVisual" aria-hidden="true"><svg viewBox="0 0 72 72" role="img"><defs><linearGradient id="smallMhMapA" x1="10" y1="18" x2="60" y2="58" gradientUnits="userSpaceOnUse"><stop stop-color="#fff4c7"/><stop offset="1" stop-color="#ffd36a"/></linearGradient><linearGradient id="smallMhMapB" x1="16" y1="58" x2="62" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#9cf0e2"/><stop offset="1" stop-color="#6fc9ff"/></linearGradient><linearGradient id="smallMhPin" x1="18" y1="30" x2="36" y2="55" gradientUnits="userSpaceOnUse"><stop stop-color="#ff7b88"/><stop offset="1" stop-color="#e84658"/></linearGradient></defs><path d="M9 45.5 24 37l15 6.2L62 32v22L39 65 24 58.8 9 67Z" fill="url(#smallMhMapA)" stroke="rgba(255,255,255,.55)" stroke-width="1.2" stroke-linejoin="round"/><path d="M9 45.5 24 37v21.8L9 67Z" fill="#d7ef95"/><path d="M39 43.2 62 32v22L39 65Z" fill="url(#smallMhMapB)"/><path d="M18 41.5c0-5.3 4.1-9.4 9.2-9.4s9.2 4.1 9.2 9.4c0 7.3-9.2 16.2-9.2 16.2S18 48.8 18 41.5Z" fill="url(#smallMhPin)" stroke="#fff" stroke-width="1.3"/><circle cx="27.2" cy="41.5" r="3.2" fill="#fff"/><path d="M45.8 10v29" stroke="#77512f" stroke-width="4.6" stroke-linecap="round"/><path d="M47 12h13.2l4.7 4.7-4.7 4.7H47Z" fill="#ffc64f" stroke="rgba(255,255,255,.45)" stroke-width=".9"/><path d="M44.7 21.7H30.4l-4.6 4.8 4.6 4.8h14.3Z" fill="#f26f8d" stroke="rgba(255,255,255,.45)" stroke-width=".9"/><path d="M47 31.5h11.8l4.6 4.6-4.6 4.6H47Z" fill="#65b8ef" stroke="rgba(255,255,255,.45)" stroke-width=".9"/><circle cx="45.8" cy="9.4" r="3.2" fill="#fff5d8"/></svg></span>';
}
function courseVisual(){
 return '<span class="ico choiceVisual courseChoiceVisual" aria-hidden="true"><svg viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="journeyBlueMini" x1="14" y1="12" x2="70" y2="73" gradientUnits="userSpaceOnUse"><stop stop-color="#7BE7FF"/><stop offset=".5" stop-color="#32B7FF"/><stop offset="1" stop-color="#1677FF"/></linearGradient><linearGradient id="journeyMintMini" x1="20" y1="70" x2="71" y2="25" gradientUnits="userSpaceOnUse"><stop stop-color="#68F2C4"/><stop offset="1" stop-color="#D8FFF3"/></linearGradient></defs><path d="M16 64h14V51H16v13Zm20 0h14V40H36v24Zm20 0h14V27H56v37Z" fill="url(#journeyBlueMini)"/><path d="M17 22h16M17 28h11" stroke="#E8FBFF" stroke-width="4" stroke-linecap="round"/><path d="M18 70c16-1 29-7 38-17 5-5 9-11 12-18" stroke="url(#journeyMintMini)" stroke-width="5" stroke-linecap="round"/><path d="m63 36 7-4-1 8" stroke="#D8FFF3" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="70" r="5" fill="#86F8D2"/></svg></span>';
}
function micIcon(){return '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="micg" x1="10" y1="8" x2="54" y2="56"><stop stop-color="#6ee7ff"/><stop offset="1" stop-color="#1688ff"/></linearGradient></defs><rect x="23" y="10" width="18" height="30" rx="9" fill="url(#micg"/><path d="M16 30c0 9 7 16 16 16s16-7 16-16M32 46v9M23 55h18" fill="none" stroke="#dffaff" stroke-width="4" stroke-linecap="round"/></svg>'}
function moduleButtons(){return (LEVEL_MODULES[currentLevel()]||[]).map((m,i)=>`<button class="modulePickBtn" onclick="pickV26Module(${i})"><b>${i+1}</b><span>${esc(m)}</span></button>`).join('')}
function render(){
 const c=card();if(!c)return;
 c.classList.add('homeTalkCard');
 c.innerHTML=`
 <div class="homeConversationTop"><h2>Converse e Divirta-se</h2><button class="teacherTypesBtn" onclick="openTeacherTypes()">🤖 Tipos de professor</button></div>
 <p class="homeConversationIntro">Escolha entre Explorar temas, Inglês com AI ou Bate-papo livre.</p>
 <button class="homeRobotStage homeRobotGuideButton" type="button" onclick="playHomeRobotGuide()" aria-label="Iniciar ou parar tutorial">
   <img class="homeRobot" src="assets/robot-professor.svg?v=26" alt="Robô professor">
   <span class="homeRobotGuideHint">🔊 Toque em mim</span><span class="bot homeTtsProbe" aria-hidden="true"></span>
 </button>
 <div class="homeConversationChoices">
   <button class="homeConversationChoice methodsCard" data-v26mode="methods" onclick="openMethodsRobot(event)">${exploreVisual()}<span class="choiceCopy"><b>Explorar temas</b><small>Escolha um tema entre família, viagens, comida, hotel e muito mais.</small></span>${aiMark()}</button>
   <button class="homeConversationChoice ${mode==='module'?'active':''}" data-v26mode="module" onclick="startV26FromCard('module')">${courseVisual()}<span class="choiceCopy"><b>Inglês com AI</b><small>Siga aulas guiadas e avance com a IA</small></span>${aiMark()}</button>
   <button class="homeConversationChoice ${mode==='free'?'active':''}" data-v26mode="free" onclick="startV26FromCard('free')"><span class="ico choiceVisual">💬</span><span class="choiceCopy"><b>Bate-papo livre</b><small>Converse sobre qualquer assunto sem roteiro</small></span>${aiMark()}</button>
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
 if(phase==='idle')setTimeout(preloadHomeGuideAudio,180);
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
   topic='';history=[];turn=0;errorStreak=0;
   picker?.classList.remove('open');
   setTopicPill();
   const live=window.MeuInglesGeminiLiveV38;
   if(live?.state?.running||live?.state?.starting){
     live.sendText?.('Quero escolher outro curso. Volte para a escolha entre A1, A2, B1, B2, C1 ou C2.');
     return;
   }
   phase='choose_module';
   picker?.classList.add('open');
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
  /* O microfone da esfera pertence exclusivamente ao Gemini 3.1 Live. */
  const live=window.MeuInglesGeminiLiveV38;
  if(!live?.available){
    console.warn('Gemini Live indisponível: microfone da esfera não usa SpeechRecognition como fallback.');
    return;
  }
  if(live.state?.running||live.state?.starting)live.stop?.();
  else live.start?.({kind:phase==='live_course'?'course':phase==='live_external'?'external':'free'});
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,35));else setTimeout(init,35);
})();
