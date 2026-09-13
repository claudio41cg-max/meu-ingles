(()=>{
'use strict';

const MAIN_KEY='meuInglesStableV2';
const API_BASE=location.hostname.endsWith('github.io')?'https://meu-ingles-claudio.netlify.app':'';
const CHAT=API_BASE+'/api/groq-chat';
const TTS=API_BASE+'/api/gemini-tts';
const originalOpen=window.openStableLesson;
let run=null;
let teacherMenuOpen=false;
let audioCtx=null;
let audioSource=null;

const lessons={
  0:{title:'Suas 3 primeiras palavras',steps:[
    {kind:'learn',emoji:'☕',en:'coffee',pt:'café'},
    {kind:'choosePt',question:'O que significa coffee?',answer:'café',options:['café','água','leite'],audio:'coffee'},
    {kind:'learn',emoji:'💧',en:'water',pt:'água'},
    {kind:'choosePt',question:'O que significa water?',answer:'água',options:['leite','água','café'],audio:'water'},
    {kind:'learn',emoji:'🥛',en:'milk',pt:'leite'},
    {kind:'choosePt',question:'O que significa milk?',answer:'leite',options:['água','café','leite'],audio:'milk'},
    {kind:'listen',question:'Qual palavra você ouviu?',answer:'coffee',options:['milk','coffee','water'],audio:'coffee'},
    {kind:'listen',question:'E agora?',answer:'water',options:['water','coffee','milk'],audio:'water'},
    {kind:'chooseEn',question:'Qual palavra significa leite?',answer:'milk',options:['coffee','water','milk']},
    {kind:'review',items:[['☕','coffee','café'],['💧','water','água'],['🥛','milk','leite']]}
  ]},
  1:{title:'Pedindo uma bebida',steps:[
    {kind:'learn',emoji:'🙏',en:'please',pt:'por favor'},
    {kind:'choosePt',question:'O que significa please?',answer:'por favor',options:['obrigado','por favor','bom dia'],audio:'please'},
    {kind:'phrase',emoji:'☕',en:'Coffee, please.',pt:'Café, por favor.'},
    {kind:'choosePt',question:'Coffee, please. significa:',answer:'Café, por favor.',options:['Água, por favor.','Café, por favor.','Leite, por favor.'],audio:'Coffee, please.'},
    {kind:'phrase',emoji:'💧',en:'Water, please.',pt:'Água, por favor.'},
    {kind:'choosePt',question:'Water, please. significa:',answer:'Água, por favor.',options:['Café, por favor.','Leite, por favor.','Água, por favor.'],audio:'Water, please.'},
    {kind:'phrase',emoji:'🥛',en:'Milk, please.',pt:'Leite, por favor.'},
    {kind:'listen',question:'Qual frase você ouviu?',answer:'Milk, please.',options:['Coffee, please.','Milk, please.','Water, please.'],audio:'Milk, please.'},
    {kind:'build',question:'Monte em inglês:',pt:'Café, por favor.',target:'Coffee, please.',tokens:['please.','Coffee,']},
    {kind:'review',items:[['☕','Coffee, please.','Café, por favor.'],['💧','Water, please.','Água, por favor.'],['🥛','Milk, please.','Leite, por favor.']]}
  ]},
  2:{title:'Eu quero...',steps:[
    {kind:'phrase',emoji:'👉',en:'I want',pt:'Eu quero'},
    {kind:'choosePt',question:'I want significa:',answer:'Eu quero',options:['Eu gosto','Eu quero','Eu tenho'],audio:'I want'},
    {kind:'phrase',emoji:'☕',en:'I want coffee.',pt:'Eu quero café.'},
    {kind:'choosePt',question:'I want coffee. significa:',answer:'Eu quero café.',options:['Eu quero café.','Eu quero água.','Eu quero leite.'],audio:'I want coffee.'},
    {kind:'phrase',emoji:'💧',en:'I want water.',pt:'Eu quero água.'},
    {kind:'choosePt',question:'I want water. significa:',answer:'Eu quero água.',options:['Eu quero leite.','Eu quero água.','Eu quero café.'],audio:'I want water.'},
    {kind:'phrase',emoji:'🥛',en:'I want milk.',pt:'Eu quero leite.'},
    {kind:'listen',question:'Qual frase você ouviu?',answer:'I want coffee.',options:['I want water.','I want milk.','I want coffee.'],audio:'I want coffee.'},
    {kind:'build',question:'Monte em inglês:',pt:'Eu quero água.',target:'I want water.',tokens:['water.','I','want']},
    {kind:'conversation',question:'What do you want?',help:'Escolha uma resposta. Depois a professora reage.',choices:['I want coffee.','I want water.','I want milk.']}
  ]}
};

function readState(){try{return JSON.parse(localStorage.getItem(MAIN_KEY)||'{}')||{}}catch{return {}}}
function writeState(s){localStorage.setItem(MAIN_KEY,JSON.stringify(s))}
function modeLabel(m){return m==='pesada'?'Hard 18+':m==='media'?'Doideira':'Tranquilo'}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function speakEnglish(text){if(window.stableSpeakEnglish)window.stableSpeakEnglish(encodeURIComponent(text))}
function bytes(b64){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
async function playPCM(b64,rate=24000){
  const u=bytes(b64),samples=Math.floor(u.length/2),arr=new Float32Array(samples),v=new DataView(u.buffer,u.byteOffset,u.byteLength);
  for(let i=0;i<samples;i++)arr[i]=Math.max(-1,Math.min(1,v.getInt16(i*2,true)/32768));
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')await audioCtx.resume();
  if(audioSource){try{audioSource.stop()}catch{}}
  const buf=audioCtx.createBuffer(1,arr.length,rate);buf.copyToChannel(arr,0);audioSource=audioCtx.createBufferSource();audioSource.buffer=buf;audioSource.connect(audioCtx.destination);
  await new Promise(res=>{audioSource.onended=()=>{audioSource=null;res()};audioSource.start()});
}
function browserSay(text){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='pt-BR';u.rate=1;u.pitch=1;speechSynthesis.speak(u)}catch{}}
async function sayTeacher(text){
  const s=readState();
  try{
    const r=await fetch(TTS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,lang:'pt-BR',voice:s.voice||'Aoede',style:'Voz brasileira humana, natural, curta, espontânea e conversacional. Sem tom de robô.'})});
    if(!r.ok)throw new Error('tts');const d=await r.json();if(!d.audio)throw new Error('audio');await playPCM(d.audio,d.sample_rate||24000);
  }catch{browserSay(text)}
}
function localReaction(ok){
  const m=readState().teacher||'media';
  const good={leve:['Muito bem.','Isso mesmo.','Perfeito, continua.'],media:['Boa! Mandou bem 😄','Aí sim! Agora foi.','Boa, essa entrou na cabeça!'],pesada:['Aí, porra! Agora sim 😄','Boa! Até que enfim, hein? 😂','Agora sim, cacete. Mandou bem!']};
  const bad={leve:['Ainda não. Olha com calma e tenta outra vez.','Quase. Vamos de novo.'],media:['Ih, escapou 😂 tenta de novo.','Quase, meu amigo. Olha a certa e manda outra.'],pesada:['Porra, quase 😂 olha a certa e tenta de novo.','Aí não, cacete 😂 presta atenção nessa e vai outra.']};
  const arr=(ok?good:bad)[m]||good.media;return arr[Math.floor(Math.random()*arr.length)]
}
async function react(ok,heard,target,context){
  if(!run)return;
  run.errors=ok?0:(run.errors||0)+1;
  let text=localReaction(ok);
  const s=readState();
  try{
    const r=await fetch(CHAT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'lesson_feedback',message:heard,heard,target,score:ok?100:0,passed:ok,lesson:context,level:'A1',personality:s.teacher||'media',scenario:'Primeiras aulas A1 com poucas palavras e muita repetição',error_streak:run.errors})});
    if(r.ok){const d=await r.json();if(d.reply_pt)text=d.reply_pt}
  }catch{}
  const box=document.querySelector('#b14Feedback');if(box){box.className='b14Feedback '+(ok?'good':'bad');box.innerHTML='<b>'+esc(text)+'</b>'}
  sayTeacher(text);
}

function teacherTop(){
  const s=readState(),m=s.teacher||'media';
  return `<div class="b14Teacher"><button onclick="toggleB14Teacher()">Professor: ${esc(modeLabel(m))} ▾</button></div>${teacherMenuOpen?`<div class="b14TeacherMenu"><button class="${m==='leve'?'active':''}" onclick="setB14Teacher('leve')">🙂 Tranquilo</button><button class="${m==='media'?'active':''}" onclick="setB14Teacher('media')">🤪 Doideira</button><button class="${m==='pesada'?'active':''}" onclick="setB14Teacher('pesada')">🔥 Hard 18+</button></div>`:''}`;
}
window.toggleB14Teacher=()=>{teacherMenuOpen=!teacherMenuOpen;render()};
window.setB14Teacher=m=>{window.setStableTeacher?.(m);teacherMenuOpen=false;render()};

function shell(inner){
  const total=lessons[run.n].steps.length,pct=Math.round(((run.step+1)/total)*100);
  return `<div class="beginner14"><div class="b14Top"><button class="b14Back" onclick="openStableModule('A1',0)">‹</button><div class="b14Progress"><span style="width:${pct}%"></span></div></div>${teacherTop()}<div class="b14Card"><div class="b14Eyebrow">A1 · ${run.step+1} de ${total}</div>${inner}</div></div>`;
}
function nextButton(label='Continuar'){return `<div class="b14Footer"><button class="b14Next" onclick="nextB14()">${label}</button></div>`}
function audioButton(text){return `<button class="b14Listen" onclick="b14Speak('${encodeURIComponent(text)}')">🔊 Ouvir</button>`}
window.b14Speak=enc=>speakEnglish(decodeURIComponent(enc));
window.nextB14=()=>{if(!run)return;run.step=Math.min(lessons[run.n].steps.length-1,run.step+1);run.built=[];run.checked=false;run.feedback='';render()};

function renderLearn(st){
  return `<div class="b14Emoji">${st.emoji}</div><div class="b14Word">${esc(st.en)}</div><div class="b14Translation">${esc(st.pt)}</div>${audioButton(st.en)}${nextButton()}`;
}
function renderPhrase(st){
  return `<div class="b14Emoji">${st.emoji||'💬'}</div><div class="b14Word" style="font-size:34px">${esc(st.en)}</div><div class="b14Translation">${esc(st.pt)}</div>${audioButton(st.en)}${nextButton()}`;
}
function renderChoice(st,kind){
  const opts=st._opts||(st._opts=shuffle(st.options));
  return `<h2>${esc(st.question)}</h2>${st.audio?audioButton(st.audio):''}<div class="b14Choices">${opts.map(o=>`<button class="b14Choice" data-b14-choice="${encodeURIComponent(o)}" onclick="answerB14('${encodeURIComponent(o)}')">${esc(o)}</button>`).join('')}</div><div id="b14Feedback"></div>`;
}
window.answerB14=async enc=>{
  if(!run)return;const st=lessons[run.n].steps[run.step];if(st.answered)return;
  const value=decodeURIComponent(enc),ok=value===st.answer;st.answered=ok;
  document.querySelectorAll('[data-b14-choice]').forEach(b=>{const v=decodeURIComponent(b.dataset.b14Choice);if(v===value)b.classList.add(ok?'correct':'wrong');if(!ok&&v===st.answer)b.classList.add('correct');b.disabled=true});
  const box=document.querySelector('#b14Feedback');if(box)box.insertAdjacentHTML('afterend',ok?nextButton():`<div class="b14Footer"><button class="b14Next blue" onclick="retryB14()">Tentar de novo</button></div>`);
  await react(ok,value,st.answer,kindLabel(st.kind));
};
window.retryB14=()=>{if(!run)return;const st=lessons[run.n].steps[run.step];st.answered=false;st._opts=shuffle(st.options);render()};
function kindLabel(k){return k==='listen'?'Reconhecer pelo áudio':'Vocabulário iniciante'}

function renderReview(st){
  return `<h2>Você já conhece estas palavras</h2><div class="b14Review">${st.items.map(([e,en,pt])=>`<button class="b14Mini" onclick="b14Speak('${encodeURIComponent(en)}')"><span>${e}</span><b>${esc(en)}</b><small>${esc(pt)}</small></button>`).join('')}</div><p class="b14Translation" style="font-size:18px">Toque nelas para ouvir de novo.</p><div class="b14Footer"><button class="b14Next" onclick="finishB14()">Concluir aula · +30 XP</button></div>`;
}
function renderConversation(st){
  return `<h2>${esc(st.question)}</h2>${audioButton(st.question)}<div class="b14Translation" style="font-size:18px">${esc(st.help)}</div><div class="b14Conversation">${st.choices.map(c=>`<button onclick="conversationB14('${encodeURIComponent(c)}')">${esc(c)}</button>`).join('')}</div><div id="b14Feedback"></div>`;
}
window.conversationB14=async enc=>{const text=decodeURIComponent(enc);document.querySelectorAll('.b14Conversation button').forEach(b=>b.disabled=true);await react(true,text,'uma resposta com I want + bebida','Mini conversa A1');const box=document.querySelector('#b14Feedback');if(box)box.insertAdjacentHTML('afterend',`<div class="b14Footer"><button class="b14Next" onclick="finishB14()">Concluir aula · +30 XP</button></div>`)};

function renderBuild(st){
  const tokens=st.tokens.map((t,i)=>({t,i}));
  const bank=st._bank||(st._bank=shuffle(tokens));
  const answer=(run.built||[]).map((x,pos)=>{let cls='';if(run.checked)cls=x.t===st.target.split(' ')[pos]?'correct':'wrong';return `<span class="b14Token ${cls}">${esc(x.t)}</span>`}).join('');
  return `<h2>${esc(st.question)}</h2><div class="b14Translation" style="font-size:28px;color:#fff;font-weight:850">${esc(st.pt)}</div><div class="b14Answer">${answer||'<span style="color:#8198aa">Toque nas palavras</span>'}</div><div class="b14Bank">${bank.map(x=>`<button class="${run.built?.some(y=>y.i===x.i)?'used':''}" onclick="pickB14(${x.i})" ${run.built?.some(y=>y.i===x.i)?'disabled':''}>${esc(x.t)}</button>`).join('')}</div><div class="b14Actions"><button class="b14Clear" onclick="clearB14()">Limpar</button><button class="b14Check" onclick="checkB14()">Verificar</button></div>${run.checked&&!run.buildOk?`<div class="b14CorrectOrder">Correto: ${esc(st.target)}</div>`:''}<div id="b14Feedback"></div>${run.checked&&run.buildOk?nextButton():run.checked&&!run.buildOk?`<div class="b14Footer"><button class="b14Next blue" onclick="clearB14()">Tentar de novo</button></div>`:''}`;
}
window.pickB14=i=>{if(!run||run.checked)return;const st=lessons[run.n].steps[run.step],item=(st._bank||[]).find(x=>x.i===i);if(item&&!run.built.some(x=>x.i===i)){run.built.push(item);render()}};
window.clearB14=()=>{if(!run)return;run.built=[];run.checked=false;run.buildOk=false;render()};
window.checkB14=async()=>{if(!run)return;const st=lessons[run.n].steps[run.step];const heard=run.built.map(x=>x.t).join(' ');run.checked=true;run.buildOk=heard===st.target;render();await react(run.buildOk,heard,st.target,'Montar uma frase curta A1')};

function render(){
  if(!run)return;const root=document.querySelector('#courseBody');if(!root)return;const st=lessons[run.n].steps[run.step];let inner='';
  if(st.kind==='learn')inner=renderLearn(st);
  else if(st.kind==='phrase')inner=renderPhrase(st);
  else if(st.kind==='choosePt'||st.kind==='chooseEn'||st.kind==='listen')inner=renderChoice(st,st.kind);
  else if(st.kind==='build')inner=renderBuild(st);
  else if(st.kind==='conversation')inner=renderConversation(st);
  else if(st.kind==='review')inner=renderReview(st);
  root.innerHTML=shell(inner);window.scrollTo(0,0);
  if((st.kind==='learn'||st.kind==='phrase'||st.kind==='listen')&&st.audio!==false){setTimeout(()=>speakEnglish(st.audio||st.en),250)}
}

function start(l,m,n){
  run={l,m,n,step:0,built:[],checked:false,buildOk:false,errors:0};
  const data=lessons[n];if(!data)return originalOpen?.(l,m,n);
  data.steps.forEach(s=>{delete s.answered;delete s._opts;delete s._bank});
  render();
}
function completeMainState(){
  const s=readState();s.done=s.done&&typeof s.done==='object'?s.done:{};const key=`A1-0-${run.n}`;
  if(!s.done[key]){s.done[key]=true;s.xp=(Number(s.xp)||0)+30}s.level='A1';writeState(s);
}
window.finishB14=()=>{if(!run)return;completeMainState();sessionStorage.setItem('b14Return','1');location.reload()};

window.openStableLesson=(l,m,n)=>{
  if(l==='A1'&&Number(m)===0&&Number(n)>=0&&Number(n)<=2)return start(l,Number(m),Number(n));
  return originalOpen?.(l,m,n);
};

function restoreAfterFinish(){
  if(sessionStorage.getItem('b14Return')!=='1')return;sessionStorage.removeItem('b14Return');
  setTimeout(()=>{window.stableShow?.('course');window.openStableModule?.('A1',0)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restoreAfterFinish);else restoreAfterFinish();
})();
