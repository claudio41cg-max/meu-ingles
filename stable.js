(()=>{
'use strict';

const API_BASE='https://meu-ingles-livid.vercel.app';
const CHAT=API_BASE+'/api/groq-chat';
const COURSE=API_BASE+'/api/course-lesson';

const LEVELS={A1:'Iniciante',A2:'Básico',B1:'Intermediário',B2:'Avançado',C1:'Fluente',C2:'Domínio total'};
const MODULES={
A1:['Primeiros contatos','Alfabeto, números e dados pessoais','Família e pessoas','Rotina diária','Perguntas e hábitos','Casa e cidade','Comida e restaurante','Compras e preços','Direções e transporte','Tempo livre e habilidades','Ontem e fim de semana','Projeto A1: um dia completo em inglês'],
A2:['Rotina em movimento','Histórias do passado','Planos e futuro','Comparando coisas','Viagem e hotel','Saúde e bem-estar','Trabalho e estudo','Experiências de vida','Serviços e problemas','Contando uma história','Vida social','Projeto A2: viagem completa'],
B1:['Experiências e passado','Narrativas mais claras','Futuro e decisões','Condições reais','Conselho e obrigação','Voz passiva básica','Pessoas e coisas','O que alguém disse','Phrasal verbs essenciais','Opiniões e argumentos','Inglês no trabalho e viagem','Projeto B1: conversa de 10 minutos'],
B2:['Tempo e duração','Hipóteses','Desejos e arrependimentos','Passiva avançada','Relato e interpretação','Dedução e probabilidade','Conectando ideias','Expressões naturais','Comunicação profissional','Notícias e mídia','Debate e persuasão','Projeto B2: apresentação e debate'],
C1:['Nuances de tempo e aspecto','Ênfase e inversão','Modalidade avançada','Registro e nominalização','Colocações e idiomaticidade','Escrita profissional e acadêmica','Apresentações de alto nível','Debate e pensamento crítico','Inglês social e humor','Inglês profissional avançado','Escuta rápida e sotaques','Projeto C1: painel profissional'],
C2:['Precisão e escolha de registro','Modalidade e posicionamento','Retórica e persuasão','Linguagem figurada','Idiomaticidade profunda','Argumentação complexa','Edição e precisão','Mediação e paráfrase','Velocidade, sotaques e ruído','Cultura, humor e pragmática','Domínio profissional','Projeto C2: domínio total']};
const LESSON_TYPES=['Vocabulário e escuta','Gramática em contexto','Frases essenciais','Compreensão auditiva','Leitura e interpretação','Produção escrita','Conversação com IA','Desafio do módulo'];
const LESSON_ICONS=['🧠','🧩','💬','🎧','📖','✍️','🗣️','🏁'];
const NEW_KEY='meuInglesStableV2';
const OLD_KEY='meuInglesStableV1';
const defaults={name:'',level:'A1',teacher:'media',voice:'Aoede',scenario:'Livre',xp:0,done:{},progress:{},onboarded:false,goal:'Conversar melhor',daily:10,errorStreak:0};
let saved={};
try{saved=JSON.parse(localStorage.getItem(NEW_KEY)||localStorage.getItem(OLD_KEY)||'{}')||{}}catch(e){saved={}}
const state=Object.assign({},defaults,saved);
state.done=state.done&&typeof state.done==='object'?state.done:{};
state.progress=state.progress&&typeof state.progress==='object'?state.progress:{};

let audioCtx=null;
let source=null;
let micReady=false;
let chatHistory=[];
let lessonRuntime=null;
let onboardStep=0;
let onboardDraft={name:state.name,level:state.level,goal:state.goal,daily:state.daily,teacher:state.teacher,voice:state.voice};

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dec=v=>decodeURIComponent(String(v||''));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

function save(){
  localStorage.setItem(NEW_KEY,JSON.stringify(state));
  renderTopStats();
  renderSettingsState();
}
function modeLabel(t=state.teacher){return t==='pesada'?'Hard 18+':t==='media'?'Doideira':'Tranquilo'}
function modeClass(t=state.teacher){return t==='pesada'?'hard':t==='media'?'doida':''}
function voiceForTeacher(t){return t==='pesada'?'Kore':t==='media'?'Leda':'Aoede'}
function voiceStyle(){
  if(state.teacher==='pesada')return 'Voz brasileira humana, rápida, irônica e muito expressiva, com energia de professora que perdeu um pouco a paciência mas continua divertida.';
  if(state.teacher==='media')return 'Voz brasileira humana, espontânea, brincalhona, energética e conversacional, como uma professora amiga tirando onda.';
  return 'Voz brasileira humana, acolhedora, natural, paciente e conversacional, sem soar como locução de robô.';
}
function show(id){
  const target=$('#'+id); if(!target)return;
  $$('.screen').forEach(x=>x.classList.remove('active'));
  target.classList.add('active');
  document.body.classList.toggle('onboarding-mode',id==='onboarding');
  $$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.screen===id));
  window.scrollTo(0,0);
  if(id==='course')renderCourse();
  if(id==='chat')renderChatHeader();
  if(id==='settings')renderSettingsState();
  if(id==='home')renderHomePath();
  if(id==='onboarding')renderOnboarding();
}
window.stableShow=show;

function setTeacher(t){
  if(!['leve','media','pesada'].includes(t))return;
  state.teacher=t;
  save();
  $$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===t));
  $$('.bot').forEach(b=>{b.classList.remove('hard','doida');const c=modeClass();if(c)b.classList.add(c)});
  $$('.miniBot').forEach(b=>{b.classList.remove('hard','doida');const c=modeClass();if(c)b.classList.add(c)});
  if($('#modeText'))$('#modeText').textContent=modeLabel();
  if($('#chatMode'))$('#chatMode').textContent=modeLabel();
}
window.setStableTeacher=setTeacher;

function setVoice(v){
  if(!['Aoede','Kore','Leda','Zephyr'].includes(v))return;
  state.voice=v;save();
}
window.setStableVoice=setVoice;
window.previewStableVoice=()=>speak(`Oi, ${state.name||'aluno'}. Essa é a minha voz. Bora aprender inglês de um jeito que não dá sono?`, 'pt-BR');

function setLevel(l){
  if(!LEVELS[l])return;
  state.level=l;save();renderCourse();renderHomePath();
}
window.setStableLevel=setLevel;
function setDaily(n){state.daily=clamp(Number(n)||10,5,60);save()}
window.setStableDaily=setDaily;
function setGoal(g){state.goal=String(g||'Conversar melhor').slice(0,80);save()}
window.setStableGoal=setGoal;

function doneKey(l,m,n){return `${l}-${m}-${n}`}
function lessonProgress(l,m,n){
  const k=doneKey(l,m,n);
  if(state.done[k])return 100;
  return clamp(Number(state.progress?.[k])||0,0,99);
}
function setLessonProgress(l,m,n,p){
  const k=doneKey(l,m,n);
  state.progress=state.progress&&typeof state.progress==='object'?state.progress:{};
  const next=clamp(Math.round(Number(p)||0),0,100);
  const prev=Number(state.progress[k])||0;
  if(state.done[k])state.progress[k]=100;
  else if(next>prev)state.progress[k]=Math.min(99,next);
  save();
  return state.progress[k]||0;
}
window.getStableLessonProgress=lessonProgress;
window.setStableLessonProgress=setLessonProgress;
function moduleDone(l,m){let n=0;for(let i=0;i<8;i++)if(state.done[doneKey(l,m,i)])n++;return n}
function levelDone(l){let n=0;for(let m=0;m<12;m++)n+=moduleDone(l,m);return n}
function findNextLesson(l=state.level){
  for(let m=0;m<12;m++)for(let n=0;n<8;n++)if(!state.done[doneKey(l,m,n)])return {l,m,n};
  return {l,m:11,n:7,complete:true};
}
function renderTopStats(){
  const all=Object.values(state.done||{}).filter(Boolean).length;
  const current=levelDone(state.level);
  if($('#levelStat'))$('#levelStat').textContent=state.level;
  if($('#xpStat'))$('#xpStat').textContent=state.xp;
  if($('#doneStat'))$('#doneStat').textContent=all;
  if($('#modeText'))$('#modeText').textContent=modeLabel();
  if($('#homeName'))$('#homeName').textContent=state.name||'Aluno';
  if($('#courseProgressBar'))$('#courseProgressBar').style.width=`${Math.round(current/96*100)}%`;
  if($('#courseProgressText'))$('#courseProgressText').textContent=`${current} de 96 aulas deste nível`;
  if($('#dailyGoalText'))$('#dailyGoalText').textContent=`${state.daily} min por dia`;
  const c=modeClass();
  $$('.bot').forEach(b=>{b.classList.remove('hard','doida');if(c)b.classList.add(c)});
  $$('.miniBot').forEach(b=>{b.classList.remove('hard','doida');if(c)b.classList.add(c)});
}
function renderHomePath(){
  renderTopStats();
  const next=findNextLesson();
  const totalLessons=Object.keys(LEVELS).length*12*8;
  const allDone=Object.values(state.done||{}).filter(Boolean).length;
  const allPct=Math.round(allDone/totalLessons*100);
  if($('#allCourseProgressBar'))$('#allCourseProgressBar').style.width=`${allPct}%`;
  if($('#allCourseProgressText'))$('#allCourseProgressText').textContent=`${allDone} de ${totalLessons} aulas concluídas · ${allPct}%`;
  if($('#nextLessonTitle'))$('#nextLessonTitle').textContent=next.complete?'Nível concluído!':`${MODULES[next.l][next.m]} · Aula ${next.n+1}`;
  if($('#nextLessonMeta'))$('#nextLessonMeta').textContent=next.complete?'Você pode revisar este nível ou avançar para o próximo.':`${next.l} · ${LESSON_TYPES[next.n]}`;
}
window.continueStableCourse=()=>{
  const next=findNextLesson();
  show('course');
  setTimeout(()=>window.openStableLesson(next.l,next.m,next.n),0);
};

function renderSettingsState(){
  $$('[data-level]').forEach(b=>b.classList.toggle('active',b.dataset.level===state.level));
  $$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.teacher));
  $$('[data-voice]').forEach(b=>b.classList.toggle('active',b.dataset.voice===state.voice));
  $$('[data-daily]').forEach(b=>b.classList.toggle('active',Number(b.dataset.daily)===Number(state.daily)));
}
window.restartStableOnboarding=()=>{
  onboardStep=0;
  onboardDraft={name:state.name,level:state.level,goal:state.goal,daily:state.daily,teacher:state.teacher,voice:state.voice};
  state.onboarded=false;save();show('onboarding');
};

function onboardingFrame(inner,{back=true,next=true,nextText='Continuar',blue=false,nextAction='nextStableOnboarding()'}={}){
  const pct=Math.round(((onboardStep+1)/7)*100);
  return `<div class="onboard onboard-step-${onboardStep}"><div class="onboardTop">${back?'<button class="onboardBack" onclick="prevStableOnboarding()">‹</button>':'<span style="width:42px"></span>'}<div class="onboardProgress"><span style="width:${pct}%"></span></div></div><div class="onboardMain">${inner}</div>${next?`<div class="onboardFooter"><button class="onboardNext ${blue?'blue':''}" onclick="${nextAction}">${nextText}</button></div>`:''}</div>`;
}
function selectedClass(a,b){return a===b?'selected':''}

const ONBOARD_GUIDES=[
  'Oi! Eu vou conhecer um pouco você primeiro. Depois você pode estudar pelos cursos, aprender por temas em Métodos ou praticar uma conversa comigo.',
  'Funciona assim: você me conta seu nível e sua meta, eu organizo o começo do curso e depois você escolhe entre aulas, temas específicos ou conversação.',
  'Aqui você não fica preso a um caminho só. Pode seguir o curso, estudar um assunto em Métodos ou entrar numa conversa para praticar de verdade.',
  'Primeiro eu ajusto o aplicativo ao seu jeito. Depois você pode continuar pelas aulas, escolher um tema específico ou conversar comigo quando quiser.',
  'Rapidinho: eu vou perguntar seu nome, seu nível, sua meta e o tipo de professor que combina com você. Depois o aplicativo fica todo personalizado.',
  'Você pode aprender de três jeitos principais: curso passo a passo, Métodos por assunto e conversa livre. Eu vou te ajudar a escolher o melhor caminho.',
  'Antes de começar eu preparo seu perfil. Depois você decide se quer estudar uma aula, treinar um assunto específico ou partir para a conversação.',
  'Meu trabalho é deixar o inglês menos engessado. Você escolhe a meta, o ritmo e o estilo do professor, e depois pode alternar entre curso, Métodos e conversa.'
];
let onboardGuideBusy=false;
function pickOnboardGuide(){
  let last=-1;
  try{last=Number(localStorage.getItem('meuInglesLastGuideV1'))}catch{}
  let i=Math.floor(Math.random()*ONBOARD_GUIDES.length);
  if(ONBOARD_GUIDES.length>1&&i===last)i=(i+1)%ONBOARD_GUIDES.length;
  try{localStorage.setItem('meuInglesLastGuideV1',String(i))}catch{}
  return {text:ONBOARD_GUIDES[i],index:i};
}
window.playStableOnboardGuide=async()=>{
  if(onboardGuideBusy)return;
  const robot=document.querySelector('.onboardGuideRobot');
  if(!robot)return;
  const {text,index}=pickOnboardGuide();
  onboardGuideBusy=true;
  robot.classList.add('is-speaking','mood-'+(index%4));
  try{
    window.stopGeminiTTS?.();
    if(typeof window.geminiSpeak==='function'){
      await window.geminiSpeak(text,'pt-BR',onboardDraft.voice||voiceForTeacher(onboardDraft.teacher));
    }else{
      await speak(text,'pt-BR');
    }
  }finally{
    robot.classList.remove('is-speaking','mood-0','mood-1','mood-2','mood-3');
    onboardGuideBusy=false;
  }
};
function renderOnboarding(){
  const root=$('#onboardingBody'); if(!root)return;
  if(onboardStep===0){
    root.innerHTML=onboardingFrame(`<div class="onboardWelcome">
      <button class="onboardGuideRobot" type="button" onclick="playStableOnboardGuide()" aria-label="Ouvir apresentação do professor">
        <span class="guideGlow"></span>
        <img src="assets/robot-professor.svg?v=26" alt="Robô professor">
        <span class="guideTap">🔊 Toque em mim</span>
      </button>
      <div class="onboardBubble onboardWelcomeBubble">Eu posso te mostrar rapidinho como o aplicativo funciona.</div>
      <h1>Seu inglês, do seu jeito.</h1>
      <p class="lead">Eu ajusto o curso ao seu nível, acompanho sua meta e deixo você escolher como quer aprender.</p>
      <div class="onboardWelcomeChips">
        <span>📚 Cursos</span><span>🧭 Métodos</span><span>💬 Conversa</span>
      </div>
    </div>`,{back:false,nextText:'Começar agora',blue:true});
    return;
  }
  if(onboardStep===1){
    root.innerHTML=onboardingFrame(`<div class="onboardBubble">Antes de começar, como você gostaria de ser chamado?</div><div class="onboardNameStep"><div class="onboardNameEmoji">👋</div><h1>Qual é o seu nome?</h1><p class="lead">Vou usar esse nome para falar com você e personalizar sua tela inicial.</p><input id="onboardNameInput" class="onboardNameInput" type="text" maxlength="40" autocomplete="name" enterkeyhint="next" placeholder="Digite seu nome" value="${esc(onboardDraft.name||'')}" oninput="setStableOnboardName(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();confirmStableOnboardName()}"><div id="onboardNameError" class="onboardNameError"></div></div>`,{nextText:'Continuar',blue:true,nextAction:'confirmStableOnboardName()'});
    setTimeout(()=>document.querySelector('#onboardNameInput')?.focus(),60);
    return;
  }
  if(onboardStep===2){
    const opts=[['A1','🌱','Estou começando','Começar praticamente do zero'],['A2','🧱','Sei o básico','Palavras e situações do dia a dia'],['B1','🚶','Consigo conversar um pouco','Quero ganhar confiança'],['B2','🚀','Converso sobre vários temas','Quero naturalidade e vocabulário'],['C1','🎯','Falo bem','Quero precisão e fluência'],['C2','🏆','Quero domínio total','Nuance, registro e naturalidade']];
    root.innerHTML=onboardingFrame(`<div class="onboardBubble">Quanto você já entende de inglês?</div><div class="onboardOptions">${opts.map(([v,i,t,s])=>`<button class="onboardOption ${selectedClass(onboardDraft.level,v)}" onclick="selectStableOnboard('level','${v}')"><span class="ico">${i}</span><span><b>${v} · ${t}</b><small>${s}</small></span></button>`).join('')}</div>`);
    return;
  }
  if(onboardStep===3){
    const opts=[['Conversar melhor','🗣️','Conversar com pessoas'],['Viajar','✈️','Viajar com mais segurança'],['Trabalho','💼','Crescer no trabalho'],['Estudos','📚','Estudar e ler melhor'],['Entretenimento','🎬','Filmes, jogos e internet'],['Desafio pessoal','🔥','Aprender por prazer e desafio']];
    root.innerHTML=onboardingFrame(`<div class="onboardBubble">Qual é o principal motivo para você aprender inglês?</div><div class="onboardOptions">${opts.map(([v,i,t])=>`<button class="onboardOption ${selectedClass(onboardDraft.goal,v)}" onclick="selectStableOnboard('goal','${v}')"><span class="ico">${i}</span><span><b>${t}</b><small>${v}</small></span></button>`).join('')}</div>`);
    return;
  }
  if(onboardStep===4){
    const opts=[[5,'⚡','5 minutos','Leve'],[10,'☕','10 minutos','Fácil de manter'],[15,'🎯','15 minutos','Ritmo forte'],[20,'🔥','20 minutos','Intensivo']];
    root.innerHTML=onboardingFrame(`<div class="onboardBubble">Quanto tempo você quer estudar por dia?</div><div class="onboardOptions">${opts.map(([v,i,t,s])=>`<button class="onboardOption ${Number(onboardDraft.daily)===v?'selected':''}" onclick="selectStableOnboard('daily','${v}')"><span class="ico">${i}</span><span><b>${t}</b><small>${s}</small></span></button>`).join('')}</div>`);
    return;
  }
  if(onboardStep===5){
    const opts=[['leve','🙂','Tranquilo','Paciente, claro e sem palavrões.'],['media','🤪','Doideira','Brinca, provoca e tira onda dos erros.'],['pesada','🔥','Hard 18+','Vai ficando mais impaciente e boca-suja quando os erros se repetem.']];
    root.innerHTML=onboardingFrame(`<div class="onboardBubble">Agora escolha a personalidade do professor. Você poderá trocar isso durante qualquer aula.</div><div class="onboardTeacherGrid">${opts.map(([v,i,t,s])=>`<button class="teacherChoice ${v==='pesada'?'hard':''} ${selectedClass(onboardDraft.teacher,v)}" onclick="selectStableOnboardTeacher('${v}')"><span class="teacherEmoji">${i}</span><b>${t}</b><small>${s}</small></button>`).join('')}</div><button class="previewBtn" onclick="previewStableOnboardTeacher()">🔊 Ouvir uma amostra</button>`);
    return;
  }
  const summary=`<div class="onboardMascot"><div class="bot xl ${modeClass(onboardDraft.teacher)}"><div class="eyes"><i></i><i></i></div><div class="mouth"><i></i><i></i><i></i><i></i><i></i></div></div></div><div class="onboardBubble">Pronto, ${esc(onboardDraft.name)}. Eu já sei de onde você vai começar e como devo falar com você.</div><div class="onboardSummary"><div class="summaryRow"><span>Nome</span><b>${esc(onboardDraft.name)}</b></div><div class="summaryRow"><span>Nível</span><b>${onboardDraft.level} · ${LEVELS[onboardDraft.level]}</b></div><div class="summaryRow"><span>Objetivo</span><b>${esc(onboardDraft.goal)}</b></div><div class="summaryRow"><span>Meta</span><b>${onboardDraft.daily} min/dia</b></div><div class="summaryRow"><span>Professor</span><b>${modeLabel(onboardDraft.teacher)}</b></div></div>`;
  root.innerHTML=onboardingFrame(summary,{nextText:'Entrar no curso',blue:true,nextAction:'finishStableOnboarding()'});
}
window.setStableOnboardName=value=>{onboardDraft.name=String(value||'').replace(/\s+/g,' ').slice(0,40)};
window.confirmStableOnboardName=()=>{
  const input=document.querySelector('#onboardNameInput');
  const name=String(input?.value||onboardDraft.name||'').trim().replace(/\s+/g,' ').slice(0,40);
  const error=document.querySelector('#onboardNameError');
  if(!name){
    if(error)error.textContent='Digite seu nome para continuar.';
    input?.focus();
    return;
  }
  onboardDraft.name=name;
  onboardStep=2;
  renderOnboarding();
};
window.selectStableOnboard=(key,value)=>{
  if(key==='daily')onboardDraft.daily=Number(value)||10;
  else onboardDraft[key]=value;
  renderOnboarding();
};
window.selectStableOnboardTeacher=t=>{onboardDraft.teacher=t;onboardDraft.voice=voiceForTeacher(t);renderOnboarding()};
window.previewStableOnboardTeacher=async()=>{
  const prevTeacher=state.teacher,prevVoice=state.voice;
  state.teacher=onboardDraft.teacher;state.voice=onboardDraft.voice;
  const n=onboardDraft.name||'meu aluno';
  const samples={leve:`${n}, tranquilo. Errou? A gente corrige e tenta de novo. Bora.`,media:`${n}, meu amigo, acorda esse inglês aí! Bora mandar essa frase direito.`,pesada:`${n}, porra, não me abandona agora não! Bora acertar essa frase antes que eu perca a pouca paciência que me resta.`};
  await speak(samples[onboardDraft.teacher]||samples.media,'pt-BR');
  state.teacher=prevTeacher;state.voice=prevVoice;
};
window.nextStableOnboarding=()=>{onboardStep=Math.min(6,onboardStep+1);renderOnboarding()};
window.prevStableOnboarding=()=>{onboardStep=Math.max(0,onboardStep-1);renderOnboarding()};
window.finishStableOnboarding=async()=>{
  Object.assign(state,{name:String(onboardDraft.name||'Aluno').trim().slice(0,40),level:onboardDraft.level,goal:onboardDraft.goal,daily:Number(onboardDraft.daily)||10,teacher:onboardDraft.teacher,voice:onboardDraft.voice||voiceForTeacher(onboardDraft.teacher),onboarded:true,errorStreak:0});
  save();setTeacher(state.teacher);show('home');
  await speak(`Fechado, ${state.name}. Seu curso começa no ${state.level}. E lembra: se enjoar de mim, você troca o tipo de professor na hora.`, 'pt-BR');
};

const A1_ART=['👋','🔤','👨‍👩‍👧','⏰','❓','🏠','🍽️','🛍️','🗺️','🎮','📅','🏆'];
function a1ModuleArt(m){
  const icon=A1_ART[m]||'✨';
  return `<div class="a1ModuleArt" aria-hidden="true">
    <span class="a1ArtBlob a1ArtBlobOne"></span>
    <span class="a1ArtBlob a1ArtBlobTwo"></span>
    <span class="a1ArtIcon">${icon}</span>
  </div>`;
}

const A2_ART=['🏃','🕰️','🗓️','⚖️','✈️','🩺','💼','🌍','🛠️','📖','🤝','🧳'];
function a2ModuleArt(m){
  const icon=A2_ART[m]||'✨';
  return `<div class="a2ModuleArt" aria-hidden="true">
    <span class="a2ArtBlob a2ArtBlobOne"></span>
    <span class="a2ArtBlob a2ArtBlobTwo"></span>
    <span class="a2ArtIcon">${icon}</span>
  </div>`;
}
function currentModuleIndexForLevel(l){
  for(let m=0;m<12;m++)if(moduleDone(l,m)<8)return m;
  return 11;
}
function syncActiveLevelTab(){
  requestAnimationFrame(()=>{
    const tabs=document.querySelector('#course .levelTabs');
    const active=tabs?.querySelector('.levelTab.active');
    if(!tabs||!active)return;
    const left=active.offsetLeft-(tabs.clientWidth-active.offsetWidth)/2;
    tabs.scrollTo({left:Math.max(0,left),behavior:'smooth'});
  });
}
function renderCourse(){
  const root=$('#courseBody'); if(!root)return;
  const l=state.level;
  const levelCompleted=levelDone(l);
  const currentModuleIndex=currentModuleIndexForLevel(l);
  const currentModuleTitle=MODULES[l]?.[currentModuleIndex]||'Curso concluído';
  const currentModuleDone=moduleDone(l,currentModuleIndex);
  const head=`<section class="courseLevelStatus" aria-label="Resumo do nível atual">
    <div class="levelTabs">${Object.keys(LEVELS).map(x=>`<button data-level="${x}" class="levelTab ${x===l?'active':''}" onclick="setStableLevel('${x}')">${x} · ${LEVELS[x]}</button>`).join('')}</div>
    <div class="courseLevelSummary">
      <div class="courseLevelIdentity">
        <small>NÍVEL ATUAL</small>
        <h2>${l} · ${LEVELS[l]}</h2>
      </div>
      <div class="courseLevelProgressText"><b>${levelCompleted}</b><span>de 96 aulas concluídas</span></div>
    </div>
    <div class="courseCurrentModule">
      <span class="courseCurrentModuleLabel">MÓDULO ATUAL</span>
      <div><b>Módulo ${currentModuleIndex+1}</b><strong>${esc(currentModuleTitle)}</strong></div>
      <em>${currentModuleDone}/8 aulas</em>
    </div>
  </section>`;

  if(l==='A1'){
    root.innerHTML=head+`<div class="a1ModuleGrid">${MODULES.A1.map((title,m)=>{
      const d=moduleDone('A1',m),pct=Math.round(d/8*100);
      return `<div class="a1ModuleCard tone-${m%6} ${d===8?'complete':''}" role="button" tabindex="0"
        onclick="openStableModule('A1',${m})"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStableModule('A1',${m})}">
        <div class="a1ModuleCopy">
          <div class="a1ModuleNumber">MÓDULO ${m+1}</div>
          <h3>${esc(title)}</h3>
          <div class="a1ModuleCount">${d}/8 aulas</div>
          <div class="moduleProgress"><span style="width:${pct}%"></span></div>
        </div>
        ${a1ModuleArt(m)}
      </div>`;
    }).join('')}</div>`;
    syncActiveLevelTab();
    return;
  }

  if(l==='A2'){
    root.innerHTML=head+`<div class="a2ModuleGrid">${MODULES.A2.map((title,m)=>{
      const d=moduleDone('A2',m),pct=Math.round(d/8*100);
      return `<div class="a2ModuleCard tone-${m%6} ${d===8?'complete':''}" role="button" tabindex="0"
        onclick="openStableModule('A2',${m})"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStableModule('A2',${m})}">
        <div class="a2ModuleCopy">
          <div class="a2ModuleNumber">MÓDULO ${m+1}</div>
          <h3>${esc(title)}</h3>
          <div class="a2ModuleCount">${d}/8 aulas</div>
          <div class="moduleProgress"><span style="width:${pct}%"></span></div>
        </div>
        ${a2ModuleArt(m)}
      </div>`;
    }).join('')}</div>`;
    syncActiveLevelTab();
    return;
  }

  root.innerHTML=head+`${MODULES[l].map((title,m)=>{const d=moduleDone(l,m),pct=Math.round(d/8*100);return `<div class="module ${d===8?'complete':''}"><h3>${d===8?'✅ ':''}${m+1}. ${esc(title)}</h3><p>8 aulas progressivas com explicação, vocabulário, escuta, tradução, fala e professor IA.</p><div class="moduleProgress"><span style="width:${pct}%"></span></div><div class="moduleMeta"><span class="tag">${d}/8 concluídas</span><span class="tag">Nível ${l}</span></div><button class="btn primary" onclick="openStableModule('${l}',${m})">${d?'Continuar módulo':'Abrir módulo'}</button></div>`}).join('')}`;
  syncActiveLevelTab();
}
window.renderStableCourse=renderCourse;

window.openStableModule=(l,m)=>{
  state.level=l;save();
  const title=MODULES[l][m];

  if(l==='A2'){
    const tone=m%6;
    $('#courseBody').innerHTML=`<div class="a2ModuleLessons tone-${tone}">
      <div class="a2ModuleLessonsHead">
        <button class="back" onclick="renderStableCourse()">‹</button>
        <div>
          <div class="a2ModuleLessonsEyebrow">A2 · MÓDULO ${m+1}</div>
          <h2>${esc(title)}</h2>
        </div>
      </div>
      <div class="a2LessonGrid">${LESSON_TYPES.map((t,n)=>{
        const done=!!state.done[doneKey(l,m,n)],pct=lessonProgress(l,m,n);
        const status=done?'Concluída · toque para revisar':pct>0?`Em andamento · ${pct}%`:'Toque para começar';
        return `<div class="a2LessonCard ${done?'done':''}" role="button" tabindex="0"
          onclick="openStableLesson('A2',${m},${n})"
          onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStableLesson('A2',${m},${n})}">
          <div class="a2LessonCopy">
            <div class="a2LessonNumber">AULA ${n+1}</div>
            <h4>${esc(t)}${done?' ✓':''}</h4>
            <div class="a2LessonStatus">${status}</div>
            <div class="lessonCardProgressV118"><span style="width:${pct}%"></span></div>
          </div>
          <div class="a2LessonArt" aria-hidden="true"><span>${LESSON_ICONS[n]}</span></div>
        </div>`;
      }).join('')}</div>
    </div>`;
    window.scrollTo(0,0);
    return;
  }

  $('#courseBody').innerHTML=`<div class="top"><button class="back" onclick="renderStableCourse()">‹</button><div><h2 style="margin:0">${esc(title)}</h2><div class="muted">${l} · Módulo ${m+1}</div></div></div><div class="lessonGrid">${LESSON_TYPES.map((t,n)=>{const done=!!state.done[doneKey(l,m,n)],pct=lessonProgress(l,m,n);const status=done?'Concluída':pct>0?`Em andamento · ${pct}%`:'Não iniciada';return `<div class="lessonCard ${done?'done':''}"><span class="lessonIcon">${LESSON_ICONS[n]}</span><h4>${n+1}. ${t} ${done?'✓':''}</h4><p>${status}</p><div class="lessonCardProgressV118"><span style="width:${pct}%"></span></div><button class="btn primary" style="margin-top:10px" onclick="openStableLesson('${l}',${m},${n})">${done?'Revisar':pct>0?'Continuar':'Começar'}</button></div>`}).join('')}</div>`;
  window.scrollTo(0,0);
};

function fallbackLesson(l,m,n){
  const title=MODULES[l][m];
  return {title:`${LESSON_TYPES[n]} · ${title}`,goal_pt:`Usar inglês de nível ${l} no tema ${title}.`,explanation_pt:`Nesta aula você vai aprender e praticar inglês relacionado a ${title}.`,examples:[{en:'Let’s practice this topic in English.',pt:'Vamos praticar este tema em inglês.'},{en:'I can use this in a real conversation.',pt:'Eu consigo usar isso em uma conversa real.'},{en:'This is useful in everyday life.',pt:'Isso é útil no dia a dia.'}],vocabulary:[{en:'hello',pt:'olá'},{en:'practice',pt:'praticar'},{en:'conversation',pt:'conversa'},{en:'English',pt:'inglês'},{en:'learn',pt:'aprender'}],practice_steps:['Ouça os exemplos.','Escolha a tradução correta.','Monte a frase.','Repita em voz alta.'],speaking_prompt_en:'Tell me one simple thing about this topic.',speaking_help_pt:'Fale uma frase simples relacionada ao tema.',model_answer_en:'I can talk about this topic in English.',mini_reading_en:'Practice helps you use English with more confidence.',mini_reading_question_pt:'Qual é a ideia principal?',final_task_pt:'Fale uma frase completa usando o conteúdo desta aula.'};
}
async function getLesson(l,m,n){
  const title=MODULES[l][m];
  const r=await fetch(COURSE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level:l,module_title:title,grammar:`gramática adequada ao nível ${l} e ao tema ${title}`,vocabulary:`vocabulário de ${title}`,can_do:`comunicar-se sobre ${title}`,lesson_type:LESSON_TYPES[n],lesson_number:n+1})});
  if(!r.ok)throw new Error('lesson '+r.status);
  return r.json();
}
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function uniq(arr){return [...new Set(arr.filter(Boolean))]}
function prepareLessonRuntime(l,m,n,d){
  const vocab=(d.vocabulary||[]).filter(v=>v&&v.en&&v.pt);
  while(vocab.length<4)vocab.push(fallbackLesson(l,m,n).vocabulary[vocab.length%5]);
  const examples=(d.examples||[]).filter(e=>e&&e.en&&e.pt);
  while(examples.length<3)examples.push(fallbackLesson(l,m,n).examples[examples.length%3]);
  const v1=vocab[n%vocab.length],v2=vocab[(n+1)%vocab.length];
  const phrase=examples[n%examples.length];
  const phraseTokens=String(phrase.en).trim().split(/\s+/).map((text,id)=>({id,text}));
  const savedPct=lessonProgress(l,m,n);
  const savedStage=state.done[doneKey(l,m,n)]?0:Math.min(5,Math.floor(savedPct/17));
  lessonRuntime={l,m,n,d,stage:savedStage,vocab,examples,vocabTarget:v1,vocabOptions:shuffle(uniq([v1.pt,...vocab.filter(v=>v!==v1).map(v=>v.pt)]).slice(0,4)),listenTarget:v2,listenOptions:shuffle(uniq([v2.en,...vocab.filter(v=>v!==v2).map(v=>v.en)]).slice(0,4)),phrase,phrasePool:shuffle(phraseTokens),built:[],passed:{},busy:false};
}
window.openStableLesson=async(l,m,n)=>{
  const root=$('#courseBody');
  root.innerHTML=`<div class="top"><button class="back" onclick="openStableModule('${l}',${m})">‹</button><h2>Aula ${n+1}</h2></div><div class="panel"><h3>Preparando a aula…</h3><p class="muted">A IA está montando o conteúdo do seu nível.</p></div>`;
  let d;
  try{d=await getLesson(l,m,n)}catch(e){console.warn(e);d=fallbackLesson(l,m,n)}
  prepareLessonRuntime(l,m,n,d);
  renderLessonStage();
};

function teacherDock(){
  return `<div class="teacherDock"><div class="teacherDockTop"><div class="miniBot ${modeClass()}">🤖</div><div class="grow"><b>Professor ${modeLabel()}</b><small>Você pode trocar agora sem sair da aula.</small></div><button class="tinyBtn" onclick="previewStableVoice()">🔊</button></div><div class="teacherModes"><button data-mode="leve" class="${state.teacher==='leve'?'active':''}" onclick="setStableTeacher('leve')">🙂 Tranquilo</button><button data-mode="media" class="${state.teacher==='media'?'active':''}" onclick="setStableTeacher('media')">🤪 Doideira</button><button data-mode="pesada" class="hard ${state.teacher==='pesada'?'active':''}" onclick="setStableTeacher('pesada')">🔥 Hard 18+</button></div></div>`;
}
function lessonShell(content,stage){
  const r=lessonRuntime, pct=Math.round(((stage+1)/6)*100);
  const extra=r.l==='A2'?` a2LessonShell tone-${r.m%6}`:'';
  return `<div class="lessonShell${extra}"><div class="lessonHeader"><button class="back" onclick="openStableModule('${r.l}',${r.m})">‹</button><div class="lessonHeaderGrow"><b>${esc(r.d.title||LESSON_TYPES[r.n])}</b><small>${r.l} · Módulo ${r.m+1} · Aula ${r.n+1}</small></div></div><div class="lessonProgress"><span style="width:${pct}%"></span></div>${teacherDock()}${content}</div>`;
}
function nextStageButton(label='Continuar'){return `<button class="btn primary wide" onclick="nextStableLessonStage()">${label}</button>`}
function reactionHTML(){return `<div id="coachReaction"></div>`}
function renderLessonStage(){
  const r=lessonRuntime;if(!r)return;
  const d=r.d;
  let content='';
  if(r.stage===0){
    content=`<div class="lessonStage"><span class="stageBadge">📘 1 DE 6 · APRENDA</span><h2>${esc(d.title||LESSON_TYPES[r.n])}</h2><p class="muted">${esc(d.goal_pt||'')}</p><p>${esc(d.explanation_pt||'')}</p><h3>Exemplos</h3>${r.examples.slice(0,3).map(e=>`<div class="example"><b>${esc(e.en)}</b><span>${esc(e.pt)}</span><button class="btn" style="margin-top:9px" onclick="stableSpeakEnglish('${encodeURIComponent(e.en)}')">🔊 Ouvir</button></div>`).join('')}<h3>Vocabulário da aula</h3>${r.vocab.slice(0,6).map(v=>`<div class="vocab" onclick="stableSpeakEnglish('${encodeURIComponent(v.en)}')"><b>${esc(v.en)}</b><span>${esc(v.pt)}</span></div>`).join('')}<div class="stageActions">${nextStageButton('Começar prática')}</div></div>`;
  }else if(r.stage===1){
    const v=r.vocabTarget;
    content=`<div class="lessonStage"><span class="stageBadge">🧠 2 DE 6 · PALAVRA NOVA</span><h2>Qual é a tradução de <b>${esc(v.en)}</b>?</h2><button class="audioBig" onclick="stableSpeakEnglish('${encodeURIComponent(v.en)}')">🔊</button><div class="choiceGrid">${r.vocabOptions.map(o=>`<button class="choice" data-quiz="vocab" data-value="${encodeURIComponent(o)}" onclick="answerStableQuiz('vocab','${encodeURIComponent(o)}')">${esc(o)}</button>`).join('')}</div>${reactionHTML()}</div>`;
  }else if(r.stage===2){
    const v=r.listenTarget;
    content=`<div class="lessonStage"><span class="stageBadge">🎧 3 DE 6 · ESCUTE</span><h2>Qual palavra você ouviu?</h2><div class="audioPrompt"><button class="audioBig" onclick="stableSpeakEnglish('${encodeURIComponent(v.en)}')">🔊</button><div><b>Ouvir novamente</b><div class="muted">Toque no alto-falante quantas vezes precisar.</div></div></div><div class="choiceGrid">${r.listenOptions.map(o=>`<button class="choice" data-quiz="listen" data-value="${encodeURIComponent(o)}" onclick="answerStableQuiz('listen','${encodeURIComponent(o)}')">${esc(o)}</button>`).join('')}</div>${reactionHTML()}</div>`;
    setTimeout(()=>speak(v.en,'en-US'),200);
  }else if(r.stage===3){
    content=`<div class="lessonStage"><span class="stageBadge">🧩 4 DE 6 · MONTE A FRASE</span><h2>Monte em inglês:</h2><p class="speakTarget" style="font-size:22px">${esc(r.phrase.pt)}</p><div class="answerLine">${r.built.map(x=>`<span class="answerToken">${esc(x.text)}</span>`).join('')||'<span class="muted">Toque nas palavras abaixo…</span>'}</div><div class="wordBank">${r.phrasePool.map(x=>`<button class="wordChip ${r.built.some(y=>y.id===x.id)?'used':''}" onclick="pickStableWord(${x.id})">${esc(x.text)}</button>`).join('')}</div><div class="stageActions"><button class="btn" onclick="clearStableBuilder()">Limpar</button><button class="btn primary" onclick="checkStableBuilder()">Verificar</button></div>${reactionHTML()}</div>`;
  }else if(r.stage===4){
    const target=r.phrase.en;
    content=`<div class="lessonStage"><span class="stageBadge">🎙️ 5 DE 6 · FALE</span><h2>Agora fale esta frase:</h2><div class="speakTarget">${esc(target)}</div><p class="helpText">${esc(r.phrase.pt)}</p><button class="audioBig" style="margin:auto;display:grid;place-items:center" onclick="stableSpeakEnglish('${encodeURIComponent(target)}')">🔊</button><button class="mic" id="lessonMic" onclick="stableRepeatTarget()">🎙️</button><p class="helpText">Eu vou ouvir o que o Chrome reconheceu e a IA vai reagir.</p>${reactionHTML()}</div>`;
  }else{
    const q=d.speaking_prompt_en||'Tell me something about this topic.';
    content=`<div class="lessonStage"><span class="stageBadge">🗣️ 6 DE 6 · CONVERSE</span><h2>Responda ao professor</h2><div class="example"><b>${esc(q)}</b><span>${esc(d.speaking_help_pt||'Responda em inglês do seu jeito.')}</span><button class="btn" style="margin-top:9px" onclick="stableSpeakEnglish('${encodeURIComponent(q)}')">🔊 Ouvir pergunta</button></div><button class="mic" id="openMic" onclick="stableOpenAnswerMic()">🎙️</button><div class="openAnswer"><input id="openAnswerText" maxlength="300" placeholder="Ou escreva sua resposta em inglês"><button onclick="stableOpenAnswerText()">Enviar</button></div>${reactionHTML()}<div id="finishLessonBox"></div></div>`;
  }
  $('#courseBody').innerHTML=lessonShell(content,r.stage);
  window.scrollTo(0,0);
}
window.nextStableLessonStage=()=>{if(!lessonRuntime)return;lessonRuntime.stage=Math.min(5,lessonRuntime.stage+1);setLessonProgress(lessonRuntime.l,lessonRuntime.m,lessonRuntime.n,Math.round(lessonRuntime.stage/6*100));renderLessonStage()};

async function answerQuiz(kind,encoded){
  const r=lessonRuntime;if(!r||r.busy)return;
  const value=dec(encoded);
  const target=kind==='vocab'?r.vocabTarget.pt:r.listenTarget.en;
  const ok=normalize(value)===normalize(target);
  $$(`[data-quiz="${kind}"]`).forEach(b=>{const same=normalize(dec(b.dataset.value))===normalize(value);if(same)b.classList.add(ok?'correct':'wrong')});
  const d=await coachReact(ok,kind==='vocab'?`Tradução de ${r.vocabTarget.en}`:`Reconhecer a palavra ${r.listenTarget.en}`,value,target);
  if(ok){r.passed[kind]=true;const box=$('#coachReaction');if(box)box.insertAdjacentHTML('beforeend',`<div class="stageActions">${nextStageButton()}</div>`)}
  return d;
}
window.answerStableQuiz=answerQuiz;

window.pickStableWord=id=>{
  const r=lessonRuntime;if(!r)return;
  const token=r.phrasePool.find(x=>x.id===id);if(!token||r.built.some(x=>x.id===id))return;
  r.built.push(token);renderLessonStage();
};
window.clearStableBuilder=()=>{if(lessonRuntime){lessonRuntime.built=[];renderLessonStage()}};
window.checkStableBuilder=async()=>{
  const r=lessonRuntime;if(!r||r.busy)return;
  const heard=r.built.map(x=>x.text).join(' '),target=r.phrase.en;
  const ok=normalize(heard)===normalize(target);
  await coachReact(ok,'Montar a frase',heard,target);
  if(ok){r.passed.builder=true;const box=$('#coachReaction');if(box)box.insertAdjacentHTML('beforeend',`<div class="stageActions">${nextStageButton()}</div>`)}else{r.built=[]}
};

function normalize(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s']/g,' ').replace(/\s+/g,' ').trim()}
function levenshtein(a,b){a=normalize(a);b=normalize(b);const m=a.length,n=b.length,dp=Array(n+1);for(let j=0;j<=n;j++)dp[j]=j;for(let i=1;i<=m;i++){let prev=dp[0];dp[0]=i;for(let j=1;j<=n;j++){const tmp=dp[j];dp[j]=Math.min(dp[j]+1,dp[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=tmp}}return dp[n]}
function similarity(a,b){const x=normalize(a),y=normalize(b);if(!x&&!y)return 100;if(!x||!y)return 0;const dist=levenshtein(x,y),max=Math.max(x.length,y.length);return Math.round((1-dist/max)*100)}
function recognition(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;const r=new SR();r.lang='en-US';r.interimResults=false;r.continuous=false;r.maxAlternatives=5;return r}
async function ensureMic(){if(micReady)return true;if(!navigator.mediaDevices?.getUserMedia)return false;try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());micReady=true;return true}catch(e){return false}}
async function listen(){if(!await ensureMic())throw new Error('mic permission');const r=recognition();if(!r)throw new Error('recognition');return r}

window.stableRepeatTarget=async()=>{
  const r=lessonRuntime;if(!r)return;
  const btn=$('#lessonMic'),box=$('#coachReaction');let rec;
  try{rec=await listen()}catch(e){if(box)box.innerHTML='<div class="coachReaction bad">Não consegui acessar o microfone. Confira a permissão do Chrome.</div>';return}
  btn?.classList.add('listening');if(box)box.innerHTML='<div class="coachReaction">🎧 Estou ouvindo…</div>';
  rec.onresult=async e=>{const heard=e.results[0][0].transcript,target=r.phrase.en,score=similarity(heard,target),ok=score>=72;btn?.classList.remove('listening');await coachReact(ok,'Repetição de frase',heard,target,score);if(ok){r.passed.speech=true;const out=$('#coachReaction');if(out)out.insertAdjacentHTML('beforeend',`<div class="stageActions">${nextStageButton('Falar com o professor')}</div>`)}};
  rec.onerror=()=>{btn?.classList.remove('listening');if(box)box.innerHTML='<div class="coachReaction bad">Não consegui entender. Fale de novo um pouco mais devagar.</div>'};
  rec.start();
};

async function askAI(payload){
  const r=await fetch(CHAT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error('AI '+r.status);
  return r.json();
}
function fallbackReaction(ok){
  const s=state.errorStreak;
  if(ok)return state.teacher==='pesada'?'Aí, porra! Agora sim. Mandou bem.':state.teacher==='media'?'Boa! Agora saiu inglês de verdade 😄':`Muito bem, ${state.name}. Essa ficou boa.`;
  if(state.teacher==='pesada')return s>=4?'Cláudio, caralho 😂 essa resposta tá te dando uma surra. Olha a correta e tenta de novo.':s>=2?'Porra, Cláudio, de novo não 😂 Bora prestar atenção nessa agora.':'Quase. Não me faz perder a paciência tão cedo, hein?';
  if(state.teacher==='media')return s>=3?'Rapaz… essa palavra já tá pagando aluguel na sua cabeça 😂 Bora de novo.':'Ih, escapou! Olha a resposta certa e tenta outra vez.';
  return 'Ainda não. Olha a forma correta e tente novamente com calma.';
}
async function coachReact(ok,lesson,heard,target,score=ok?100:0){
  const r=lessonRuntime;if(r)r.busy=true;
  state.errorStreak=ok?0:Math.min(20,(state.errorStreak||0)+1);save();
  const box=$('#coachReaction');if(box)box.innerHTML='<div class="coachReaction">🧠 Professor pensando…</div>';
  let reply='',replyEn='';
  try{
    const d=await askAI({mode:'lesson_feedback',message:heard,heard,target,score,passed:ok,lesson,level:r?.l||state.level,personality:state.teacher,scenario:`Curso ${r?.l||state.level}: ${r?MODULES[r.l][r.m]:'aula'}`,error_streak:state.errorStreak});
    reply=d.reply_pt||fallbackReaction(ok);replyEn=d.reply_en||'';
  }catch(e){reply=fallbackReaction(ok)}
  if(box)box.innerHTML=`<div class="coachReaction ${ok?'good':'bad'}"><b>${esc(reply)}</b>${replyEn?`<div class="muted" style="margin-top:6px">${esc(replyEn)}</div>`:''}<span class="scorePill">${ok?'Correto':'Tente de novo'}${Number.isFinite(score)?` · ${score}%`:''}</span></div>`;
  if(r)r.busy=false;
  await speakBoth(reply,replyEn);
  return {reply,replyEn};
}

window.stableOpenAnswerMic=async()=>{
  const btn=$('#openMic'),box=$('#coachReaction');let rec;
  try{rec=await listen()}catch(e){if(box)box.innerHTML='<div class="coachReaction bad">Não consegui acessar o microfone.</div>';return}
  btn?.classList.add('listening');if(box)box.innerHTML='<div class="coachReaction">🎧 Estou ouvindo…</div>';
  rec.onresult=e=>{btn?.classList.remove('listening');handleOpenAnswer(e.results[0][0].transcript)};
  rec.onerror=()=>{btn?.classList.remove('listening');if(box)box.innerHTML='<div class="coachReaction bad">Não consegui entender. Tente novamente.</div>'};
  rec.start();
};
window.stableOpenAnswerText=()=>{const input=$('#openAnswerText');const t=input?.value.trim();if(t)handleOpenAnswer(t)};
async function handleOpenAnswer(text){
  const r=lessonRuntime;if(!r||r.busy)return;r.busy=true;
  const box=$('#coachReaction');if(box)box.innerHTML=`<div class="coachReaction"><b>Você:</b> ${esc(text)}<br><br>🧠 Pensando…</div>`;
  let d;
  try{d=await askAI({mode:'conversation',message:`Atividade da aula: ${r.d.speaking_prompt_en||''}\nResposta do aluno: ${text}\nAvalie se a resposta participa da atividade. Se o aluno disser que não sabe, ajude em vez de fingir que acertou.`,level:r.l,personality:state.teacher,scenario:`Curso ${r.l}: ${MODULES[r.l][r.m]}`,history:[]})}catch(e){d={verdict:'conversation',reply_pt:'Recebi sua resposta. Vamos continuar a prática.',reply_en:''}}
  const good=!['wrong','help'].includes(String(d.verdict||'conversation'));
  state.errorStreak=good?0:Math.min(20,(state.errorStreak||0)+1);save();
  if(box)box.innerHTML=`<div class="coachReaction ${good?'good':'bad'}"><b>Você:</b> ${esc(text)}<br><br><b>Professor:</b> ${esc(d.reply_pt||'')}${d.reply_en?`<div class="muted" style="margin-top:6px">${esc(d.reply_en)}</div>`:''}</div>`;
  if(good){setLessonProgress(r.l,r.m,r.n,90);const finish=$('#finishLessonBox');if(finish)finish.innerHTML='<div class="stageActions"><button class="btn primary wide" onclick="finishStableLesson()">✅ Concluir aula · +30 XP</button></div>'}
  r.busy=false;await speakBoth(d.reply_pt||'',d.reply_en||'');
}
window.finishStableLesson=()=>{
  const r=lessonRuntime;if(!r)return;
  const k=doneKey(r.l,r.m,r.n);
  state.progress=state.progress&&typeof state.progress==='object'?state.progress:{};
  state.progress[k]=100;
  if(!state.done[k]){state.done[k]=true;state.xp+=30}
  save();
  window.openStableModule(r.l,r.m);
};

function renderChatHeader(){
  const bot=$('#chatBot');if(bot){bot.className='bot '+modeClass()}
  if($('#chatMode'))$('#chatMode').textContent=modeLabel();
  if($('#chatLevel'))$('#chatLevel').textContent=state.level;
  $$('[data-chat-scenario]').forEach(b=>b.classList.toggle('active',b.dataset.chatScenario===state.scenario));
}
window.setStableScenario=s=>{state.scenario=s;save();renderChatHeader()};
function addMsg(text,who,meta=''){
  const box=$('#chatBox');if(!box)return;
  const d=document.createElement('div');d.className='msg '+(who==='user'?'user':'botmsg');d.innerHTML=`${esc(text)}${meta?`<small>${esc(meta)}</small>`:''}`;box.appendChild(d);box.scrollTop=999999;
}
async function sendChat(text){
  text=String(text||'').trim();if(!text)return;
  addMsg(text,'user');const bot=$('#chatBot');bot?.classList.add('thinking');
  try{
    const d=await askAI({mode:'conversation',message:text,level:state.level,personality:state.teacher,scenario:state.scenario,history:chatHistory.slice(-8),error_streak:state.errorStreak});
    chatHistory.push({role:'user',content:text},{role:'assistant',content:(d.reply_pt||'')+' '+(d.reply_en||'')});
    const reply=[d.reply_pt,d.reply_en].filter(Boolean).join(' • ');addMsg(reply,'bot',d.provider||'');bot?.classList.remove('thinking');await speakBoth(d.reply_pt||'',d.reply_en||'');
  }catch(e){bot?.classList.remove('thinking');addMsg('A IA não respondeu agora. Tente novamente em alguns segundos.','bot')}
}
window.stableChatSend=()=>{const i=$('#chatText');const t=i?.value.trim();if(t){i.value='';sendChat(t)}};
window.stableChatMic=async()=>{
  let r;try{r=await listen()}catch(e){addMsg('Não consegui acessar o microfone.','bot');return}
  const bot=$('#chatBot'),mic=$('#chatMic');bot?.classList.add('listening');mic?.classList.add('listening');
  r.onresult=e=>{bot?.classList.remove('listening');mic?.classList.remove('listening');sendChat(e.results[0][0].transcript)};
  r.onerror=()=>{bot?.classList.remove('listening');mic?.classList.remove('listening');addMsg('Não consegui entender. Tente novamente.','bot')};
  r.start();
};

async function speak(text,lang){
  text=String(text||'').trim();
  if(!text)return false;
  if(typeof window.geminiSpeak!=='function')return false;
  const voice=String(lang||'').toLowerCase().startsWith('en')?'Achird':(state.voice||'Aoede');
  try{return await window.geminiSpeak(text,lang,voice)}
  catch(e){console.error('Stable TTS',e);return false}
}
window.stableSpeakEnglish=enc=>speak(dec(enc),'en-US');
async function speakBoth(pt,en){
  if(pt)await speak(pt,'pt-BR');
  if(en)await speak(en,'en-US');
}

async function checkAI(){
  const badge=$('#aiStatus');if(!badge)return;
  try{
    const r=await fetch(CHAT,{cache:'no-store'}),d=await r.json();
    if(r.ok&&d.ok&&d.key_configured){badge.className='status ok';badge.textContent=`🧠 ${d.provider||'IA'} online e pronta`;return}
    throw new Error('offline');
  }catch(e){badge.className='status bad';badge.textContent='⚠️ IA temporariamente indisponível'}
}
async function cleanupOld(){try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}if('caches'in window){const names=await caches.keys();await Promise.all(names.map(n=>caches.delete(n)))}}catch(e){}}

function init(){
  cleanupOld();
  renderTopStats();
  setTeacher(state.teacher);
  renderCourse();
  renderChatHeader();
  renderSettingsState();
  renderHomePath();
  checkAI();setInterval(checkAI,45000);
  $$('nav button').forEach(b=>b.onclick=()=>show(b.dataset.screen));
  $('#chatText')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();window.stableChatSend()}});
  if(state.onboarded)show('home');else show('onboarding');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();