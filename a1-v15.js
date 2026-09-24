(()=>{
'use strict';
const KEY='meuInglesStableV2';
const API=location.hostname.endsWith('github.io')?'https://meu-ingles-claudio.netlify.app':'';
const CHAT=API+'/api/groq-chat',TTS=API+'/api/gemini-tts';
const oldOpen=window.openStableLesson,oldModule=window.openStableModule;
let run=null,menu=false,ctx=null,src=null;

const RAW=[
['','','','👋|hello|olá|Olá!','🙏|thank you|obrigado|Obrigado','✅|yes, please|sim, por favor|Sim, por favor','🙅|no, thank you|não, obrigado|Não, obrigado','👋|goodbye|adeus|Até logo'],
['🙂|My name is...|Meu nome é...|Meu nome é...','🔢|one, two, three, four, five|um, dois, três, quatro, cinco|Números de 1 a 10','🔟|eleven, twelve, thirteen, fourteen, fifteen|onze, doze, treze, quatorze, quinze|Números até 20','📱|My phone number is...|Meu telefone é...|Meu telefone','🎂|I am ... years old.|Eu tenho ... anos.|Minha idade','🏠|My address is...|Meu endereço é...|Meu endereço','🔤|How do you spell your name?|Como se soletra seu nome?|Soletrando meu nome','🪪|My name is... and my phone number is...|Meu nome é... e meu telefone é...|Revisão: meus dados pessoais'],
['👩|mother|mãe|Mãe','👨|father|pai|Pai','👦|brother|irmão|Irmão','👧|sister|irmã|Irmã','🧑‍🤝‍🧑|friend|amigo|Amigo','👨‍👩‍👧‍👦|family|família|Família','👉|this is|este é|Este é','🏠|this is my family.|esta é minha família.|Esta é minha família'],
['🌅|morning|manhã|Manhã','💼|work|trabalho|Trabalho','🍽️|eat|comer|Comer','🥤|drink|beber|Beber','🏠|home|casa|Casa','🌙|night|noite|Noite','😴|sleep|dormir|Dormir','📅|today|hoje|Hoje'],
['❤️|I like|eu gosto|Eu gosto','☕|I like coffee.|eu gosto de café.|Eu gosto de café','❓|do you like?|você gosta?|Você gosta?','👉|do you want?|você quer?|Você quer?','💼|do you work?|você trabalha?|Você trabalha?','📍|where?|onde?|Onde?','❔|what?|o quê?|O quê?','✅|yes|sim|Sim'],
['🏠|house|casa|Casa','🛏️|room|quarto|Quarto','🍳|kitchen|cozinha|Cozinha','🚿|bathroom|banheiro|Banheiro','🛣️|street|rua|Rua','🛒|market|mercado|Mercado','👇|here|aqui|Aqui','👉|there|ali|Ali'],
['🍞|bread|pão|Pão','🍚|rice|arroz|Arroz','🍗|chicken|frango|Frango','🐟|fish|peixe|Peixe','🧃|juice|suco|Suco','📋|menu|cardápio|Cardápio','🧾|bill|conta|Conta','😋|I am hungry.|estou com fome.|Estou com fome'],
['👉|this|isto|Isto','👈|that|aquilo|Aquilo','💲|how much?|quanto custa?|Quanto custa?','🏷️|cheap|barato|Barato','💸|expensive|caro|Caro','🤏|small|pequeno|Pequeno','🙌|big|grande|Grande','🛍️|buy|comprar|Comprar'],
['⬅️|left|esquerda|Esquerda','➡️|right|direita|Direita','⬆️|straight|em frente|Em frente','🚌|bus|ônibus|Ônibus','🚗|car|carro|Carro','🚉|station|estação|Estação','🛑|stop here.|pare aqui.|Pare aqui','📍|is it near?|é perto?|É perto?'],
['🎵|music|música|Música','🎬|movie|filme|Filme','🎮|game|jogo|Jogo','⚽|football|futebol|Futebol','🍳|cook|cozinhar|Cozinhar','🏊|swim|nadar|Nadar','💪|I can|eu consigo|Eu consigo','❓|can you swim?|você consegue nadar?|Você consegue nadar?'],
['🗓️|yesterday|ontem|Ontem','💼|worked|trabalhei|Trabalhei','🍽️|ate|comi|Comi','🥤|drank|bebi|Bebi','📺|watched|assisti|Assisti','🚶|went|fui|Fui','🏠|stayed|fiquei|Fiquei','🎉|weekend|fim de semana|Fim de semana'],
['👋|hello|olá|Olá de novo','🙂|my name is|meu nome é|Meu nome é...','💧|water, please.|água, por favor.|Água, por favor','🛒|where is the market?|onde fica o mercado?|Onde fica o mercado?','💲|how much?|quanto custa?|Quanto custa?','⬅️|turn left.|vire à esquerda.|Vire à esquerda','🙏|thank you|obrigado|Obrigado','👋|goodbye|adeus|Até logo']
];
const MT=['Primeiros contatos','Números e apresentação','Família e pessoas','Rotina diária','Perguntas e hábitos','Casa e cidade','Comida e restaurante','Compras e preços','Direções e transporte','Tempo livre e habilidades','Ontem e fim de semana','Projeto A1'];
const START=['Suas 3 primeiras palavras','Pedindo uma bebida','Eu quero...'];
const BASE=[['☕','coffee','café'],['💧','water','água'],['🥛','milk','leite'],['🙏','please','por favor'],['👉','I want','eu quero']];

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const state=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
function progress(m,n){
  try{return window.getStableLessonProgress?.('A1',m,n)??(done(m,n)?100:0)}catch{return done(m,n)?100:0}
}
function saveProgress(m,n,p){try{window.setStableLessonProgress?.('A1',m,n,p)}catch{}}

function item(m,n){const x=RAW[m]?.[n];if(!x)return null;const [e,en,pt,title]=x.split('|');return{e,en,pt,title}}
function known(m,n){const a=BASE.map(([e,en,pt])=>({e,en,pt}));for(let M=0;M<=m;M++)for(let N=0;N<8;N++){if(M===m&&N>n)break;const x=item(M,N);if(x)a.push(x)}const seen=new Set();return a.filter(x=>{const k=x.en.toLowerCase();if(seen.has(k))return false;seen.add(k);return true})}
function options(cur,m,n){const a=[cur,...known(m,n).reverse().filter(x=>x.en.toLowerCase()!==cur.en.toLowerCase())];return a.slice(0,3)}
function teacher(){const m=state().teacher||'media';return m==='pesada'?['Hard 18+','Algenib']:m==='media'?['Doideira','Puck']:['Tranquilo','Achird']}
function style(){const m=state().teacher||'media';return m==='pesada'?'Voz brasileira humana, adulta, rouca, expressiva e irônica. Fale como pessoa real, nunca como robô.':m==='media'?'Voz brasileira humana, divertida, brincalhona e espontânea. Entonação de conversa real, nunca de locução.':'Voz brasileira humana, amigável, calma e natural. Ritmo de conversa real, sem cadência de robô.'}
function status(t=''){const e=$('#a15Voice');if(e)e.textContent=t}
function bytes(b){const x=atob(b),u=new Uint8Array(x.length);for(let i=0;i<x.length;i++)u[i]=x.charCodeAt(i);return u}
async function pcm(b,rate=24000){const u=bytes(b),a=new Float32Array(u.length/2),v=new DataView(u.buffer,u.byteOffset,u.byteLength);for(let i=0;i<a.length;i++)a[i]=Math.max(-1,Math.min(1,v.getInt16(i*2,true)/32768));ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')await ctx.resume();if(src)try{src.stop()}catch{}const bf=ctx.createBuffer(1,a.length,rate);bf.copyToChannel(a,0);src=ctx.createBufferSource();src.buffer=bf;src.connect(ctx.destination);await new Promise(r=>{src.onended=()=>{src=null;r()};src.start()})}
async function speak(text,lang='en-US',isTeacher=false){status('');if(run?.m===1&&window.geminiSpeak){try{return await window.geminiSpeak(text,lang,isTeacher?(state().voice||'Aoede'):'Achird')}catch{}}const [,tv]=teacher();try{const r=await fetch(TTS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,lang,voice:isTeacher?tv:'Achird',style:isTeacher?style():'Natural American English for a complete beginner. Clear, warm, human pronunciation. Say it once at a comfortable pace.'})});const d=await r.json();if(!r.ok||!d.audio)throw 0;await pcm(d.audio,d.sample_rate||24000);return true}catch{status('⚠️ A voz Gemini não carregou. Toque em ouvir para tentar de novo.');return false}}
function quickReaction(ok){
 const mode=state().teacher||'media';
 const lines={
  leve:{ok:['Muito bem!','Isso mesmo!','Perfeito, acertou!','Ótimo, pode continuar.'],bad:['Quase. Tenta outra vez.','Ainda não. Olha com calma.','Por pouco. Vamos de novo.']},
  media:{ok:['Boa! Mandou bem 😄','Aí sim! Acertou.','Boa, essa entrou na cabeça!','Perfeito! Bora pra próxima.'],bad:['Ih, escapou 😂 tenta de novo.','Quase, meu amigo.','Por pouco! Olha a certa e tenta outra.']},
  pesada:{ok:['Aí, porra! Agora sim 😄','Boa! Acertou bonito.','Agora sim, cacete. Mandou bem!','Isso! Sem enrolar, acertou.'],bad:['Porra, quase 😂 tenta de novo.','Aí não, cacete 😂 olha a certa.','Quase. Presta atenção e manda outra.']}
 };
 const arr=(ok?lines[mode]?.ok:lines[mode]?.bad)||(ok?lines.media.ok:lines.media.bad);
 return arr[Math.floor(Math.random()*arr.length)];
}
function react(ok,heard,target){
 const txt=quickReaction(ok);
 const b=$('#a15Feedback');if(b){b.className='b14Feedback '+(ok?'good':'bad');b.innerHTML='<b>'+esc(txt)+'</b>'}
 /* A voz começa imediatamente. A IA melhora o texto em paralelo, sem segurar o aluno. */
 speak(txt,'pt-BR',true);
 const s=state(),mode=s.teacher||'media';
 fetch(CHAT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'lesson_feedback',message:heard,heard,target,score:ok?100:0,passed:ok,lesson:'A1 iniciante com repetição',level:'A1',personality:mode,scenario:'Poucas palavras, repetição e frases essenciais',error_streak:ok?0:1})})
  .then(r=>r.ok?r.json():null).then(d=>{if(d?.reply_pt&&b)b.innerHTML='<b>'+esc(d.reply_pt)+'</b>'}).catch(()=>{});
}

function lesson(m,n){const cur=item(m,n),k=known(m,n),op=options(cur,m,n),prev=k.filter(x=>x.en.toLowerCase()!==cur.en.toLowerCase()).slice(-1)[0]||{e:'☕',en:'coffee',pt:'café'};const words=cur.en.trim().split(/\s+/),review=[cur,prev,...k.slice(-4).reverse()].filter((x,i,a)=>a.findIndex(y=>y.en.toLowerCase()===x.en.toLowerCase())===i).slice(0,3);const steps=[
{t:words.length>1?'phrase':'learn',x:cur},
{t:'choice',q:`${cur.en} significa:`,ans:cur.pt,op:sh(op.map(x=>x.pt)),audio:cur.en},
{t:'choice',q:'Qual você ouviu?',ans:cur.en,op:sh(op.map(x=>x.en)),audio:cur.en},
{t:'choice',q:`Qual é "${cur.pt}" em inglês?`,ans:cur.en,op:sh(op.map(x=>x.en))},
{t:prev.en.split(/\s+/).length>1?'phrase':'learn',x:prev},
{t:'choice',q:'Ouça de novo e escolha:',ans:cur.en,op:sh(op.map(x=>x.en)),audio:cur.en},
words.length>1&&words.length<=5?{t:'build',q:'Monte em inglês:',pt:cur.pt,target:cur.en,tokens:sh(words)}:{t:'choice',q:`Só para fixar: ${cur.en}`,ans:cur.pt,op:sh(op.map(x=>x.pt)),audio:cur.en},
{t:'choice',q:`Lembra de "${cur.pt}"?`,ans:cur.en,op:sh(op.map(x=>x.en))},
{t:'guided',q:'Escolha o inglês que você acabou de aprender:',ans:cur.en,op:sh(op.map(x=>x.en))},
{t:'review',items:review}
];return{title:cur.title,steps}}

function top(){const [label]=teacher();return `<div class="b14Teacher"><button onclick="a15Menu()">Professor: ${label} ▾</button></div>${menu?`<div class="b14TeacherMenu"><button onclick="a15Teacher('leve')">🙂 Tranquilo</button><button onclick="a15Teacher('media')">🤪 Doideira</button><button onclick="a15Teacher('pesada')">🔥 Hard 18+</button></div>`:''}`}
window.a15Menu=()=>{menu=!menu;render()};
window.a15Teacher=m=>{window.setStableTeacher?.(m);menu=false;render()};
function shell(inner){
 const p=Math.round((run.i+1)/run.lesson.steps.length*100);
 if(run.m===0){
   document.querySelector('#course')?.classList.add('first-contacts-lesson-active');
   const screenTitle=document.querySelector('#course > .top h2');
   if(screenTitle)screenTitle.textContent='Tela inicial';
 }
 return `<div class="beginner14 ${run.m===0?'firstContactsLessonScreen':''} ${run.m===1?'moduleTwoLessonScreen':''}"><div class="b14Top"><button class="b14Back" onclick="openStableModule('A1',${run.m})">‹</button><div class="b14Progress"><span style="width:${p}%"></span></div></div>${run.m===0?'':top()}<div class="b14Card"><div class="b14Eyebrow">A1 · ${run.i+1} de ${run.lesson.steps.length}</div>${inner}<div id="a15Voice" class="b14VoiceWarn"></div></div></div>`;
}
const next=()=>`<div class="b14Footer"><button class="b14Next" onclick="a15Next()">Continuar</button></div>`;
window.a15Next=()=>{if(++run.i>=run.lesson.steps.length)return finish();saveProgress(run.m,run.n,Math.round(run.i/run.lesson.steps.length*100));run.built=[];run.checked=false;run.used=[];render()};
window.a15Speak=e=>speak(decodeURIComponent(e));
function render(){const s=run.lesson.steps[run.i];let h='';if(s.t==='learn'||s.t==='phrase'){h=`<div class="b14Emoji">${s.x.e||'💬'}</div><div class="b14Word">${esc(s.x.en)}</div><div class="b14Translation">${esc(s.x.pt)}</div><button class="b14Listen" onclick="a15Speak('${encodeURIComponent(s.x.en)}')">🔊 Ouvir</button>${next()}`}
else if(s.t==='choice'){h=`<h2>${esc(s.q)}</h2>${s.audio?`<button class="b14Listen" onclick="a15Speak('${encodeURIComponent(s.audio)}')">🔊 Ouvir</button>`:''}<div class="b14Choices">${s.op.map(o=>`<button class="b14Choice" data-a15="${encodeURIComponent(o)}" onclick="a15Answer('${encodeURIComponent(o)}')">${esc(o)}</button>`).join('')}</div><div id="a15Feedback"></div>`}
else if(s.t==='guided'){h=`<h2>${esc(s.q)}</h2><div class="b14Conversation">${s.op.map(o=>`<button data-a15="${encodeURIComponent(o)}" onclick="a15Answer('${encodeURIComponent(o)}')">${esc(o)}</button>`).join('')}</div><div id="a15Feedback"></div>`}
else if(s.t==='build'){const exp=s.target.split(/\s+/),ans=run.built.map((x,i)=>`<span class="b14Token ${run.checked?(x===exp[i]?'correct':'wrong'):''}">${esc(x)}</span>`).join('');h=`<h2>${esc(s.q)}</h2><div class="b14Translation" style="font-size:28px;color:#fff;font-weight:850">${esc(s.pt)}</div><div class="b14Answer">${ans||'<span style="color:#8198aa">Toque nas palavras</span>'}</div><div class="b14Bank">${s.tokens.map((x,i)=>`<button onclick="a15Pick(${i})" ${run.used?.includes(i)?'disabled class="used"':''}>${esc(x)}</button>`).join('')}</div><div class="b14Actions"><button class="b14Clear" onclick="a15Clear()">Limpar</button><button class="b14Check" onclick="a15Check()">Verificar</button></div>${run.checked&&!run.ok?`<div class="b14CorrectOrder">Correto: ${esc(s.target)}</div>`:''}<div id="a15Feedback"></div>${run.checked&&run.ok?next():run.checked&&!run.ok?`<div class="b14Footer"><button class="b14Next blue" onclick="a15Clear()">Tentar de novo</button></div>`:''}`}
else{h=`<h2>Você já conhece isso</h2><div class="b14Review">${s.items.map(x=>`<button class="b14Mini" onclick="a15Speak('${encodeURIComponent(x.en)}')"><span>${x.e||'🔁'}</span><b>${esc(x.en)}</b><small>${esc(x.pt)}</small></button>`).join('')}</div><div class="b14Footer"><button class="b14Next" onclick="a15Finish()">Concluir aula · +30 XP</button></div>`}
$('#courseBody').innerHTML=shell(h);window.scrollTo(0,0);if((s.t==='learn'||s.t==='phrase')&&s.x)setTimeout(()=>speak(s.x.en),250);if(s.t==='choice'&&s.audio)setTimeout(()=>speak(s.audio),250)}
window.a15Answer=e=>{const s=run.lesson.steps[run.i],v=decodeURIComponent(e),ok=v===s.ans;document.querySelectorAll('[data-a15]').forEach(b=>{const x=decodeURIComponent(b.dataset.a15);if(x===v)b.classList.add(ok?'correct':'wrong');if(!ok&&x===s.ans)b.classList.add('correct');b.disabled=true});const f=$('#a15Feedback');if(f)f.insertAdjacentHTML('afterend',ok?next():`<div class="b14Footer"><button class="b14Next blue" onclick="a15Retry()">Tentar de novo</button></div>`);react(ok,v,s.ans)};
window.a15Retry=()=>render();
window.a15Pick=i=>{if(run.checked)return;run.used=run.used||[];if(run.used.includes(i))return;run.used.push(i);run.built.push(run.lesson.steps[run.i].tokens[i]);render()};
window.a15Clear=()=>{run.built=[];run.used=[];run.checked=false;run.ok=false;render()};
window.a15Check=()=>{const s=run.lesson.steps[run.i],v=run.built.join(' ');run.checked=true;run.ok=v===s.target;render();react(run.ok,v,s.target)};

function start(m,n){if(m===1&&!unlocked(m,n))return;const l=lesson(m,n),pct=progress(m,n),i=done(m,n)?0:Math.min(l.steps.length-1,Math.floor(pct/100*l.steps.length));run={m,n,i,lesson:l,built:[],used:[],checked:false,ok:false};render()}
function finish(){const s=state();s.done=s.done&&typeof s.done==='object'?s.done:{};s.progress=s.progress&&typeof s.progress==='object'?s.progress:{};const k=`A1-${run.m}-${run.n}`;s.progress[k]=100;if(!s.done[k]){s.done[k]=true;s.xp=(Number(s.xp)||0)+30}s.level='A1';save(s);sessionStorage.setItem('a15back',String(run.m));location.reload()}
window.a15Finish=finish;
function title(m,n){if(m===0&&n<3)return START[n];return item(m,n)?.title||`Lição ${n+1}`}
function done(m,n){return !!state().done?.[`A1-${m}-${n}`]}
function unlocked(m,n){return n===0||done(m,n-1)||progress(m,n)>0}
const FIRST_CONTACTS_ART=['☕','🥤','👉','👋','🙏','✅','🙅','👋'];
function firstContactsCards(){
 return Array.from({length:8},(_,n)=>{
  const isDone=done(0,n);
  const icon=FIRST_CONTACTS_ART[n]||'✨';
  return `<div class="firstContactsLessonCard ${isDone?'done':''}" role="button" tabindex="0"
    onclick="openStableLesson('A1',0,${n})"
    onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStableLesson('A1',0,${n})}">
    <div class="firstContactsLessonCopy">
      <div class="firstContactsLessonNumber">AULA ${n+1}</div>
      <h4>${esc(title(0,n))}</h4>
      <div class="firstContactsLessonStatus">${isDone?'Concluída · toque para revisar':progress(0,n)>0?`Em andamento · ${progress(0,n)}%`:'Toque para começar'}</div>
      <div class="lessonCardProgressV118"><span style="width:${progress(0,n)}%"></span></div>
    </div>
    <div class="firstContactsLessonArt" aria-hidden="true">
      <span class="firstContactsArtGlow"></span>
      <span class="firstContactsArtIcon">${icon}</span>
    </div>
  </div>`;
 }).join('');
}
const MODULE_TWO_ART=['🙂','🔢','🔟','📱','🎂','🏠','🔤','🪪'];
function moduleTwoCards(){
 return Array.from({length:8},(_,n)=>{
  const pct=progress(1,n),isDone=done(1,n),isUnlocked=unlocked(1,n);
  const icon=MODULE_TWO_ART[n]||'🔤';
  const statusText=isDone?'Concluída · toque para revisar':!isUnlocked?'🔒 Conclua a aula anterior':pct>0?`Em andamento · ${pct}%`:'Toque para começar';
  return `<div class="moduleTwoLessonCard ${isDone?'done':''} ${!isUnlocked?'locked':''}" role="button" tabindex="${isUnlocked?0:-1}"
    ${isUnlocked?`onclick="openStableLesson('A1',1,${n})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStableLesson('A1',1,${n})}"`:''}>
    <div class="moduleTwoLessonCopy">
      <div class="moduleTwoLessonNumber">AULA ${n+1}</div>
      <h4>${esc(title(1,n))}</h4>
      <div class="moduleTwoLessonStatus">${statusText}</div>
      <div class="lessonCardProgressV118"><span style="width:${pct}%"></span></div>
    </div>
    <div class="moduleTwoLessonArt" aria-hidden="true"><span class="moduleTwoArtGlow"></span><span class="moduleTwoArtIcon">${!isUnlocked?'🔒':icon}</span></div>
  </div>`;
 }).join('');
}
function moduleView(m){
 m=Number(m)||0;
 document.querySelector('#course')?.classList.remove('first-contacts-lesson-active');
 const screenTitle=document.querySelector('#course > .top h2');
 if(screenTitle)screenTitle.textContent='Curso de Inglês';
 if(m===0){
   $('#courseBody').innerHTML=`<div class="firstContactsView">
     <div class="firstContactsHead">
       <button class="back firstContactsBack" onclick="renderStableCourse()">‹</button>
       <div>
         <div class="firstContactsEyebrow">A1 · MÓDULO 1</div>
         <h2>Primeiros contatos</h2>
       </div>
     </div>
     <div class="firstContactsLessons">${firstContactsCards()}</div>
   </div>`;
   window.scrollTo(0,0);
   return;
 }
 if(m===1){
   $('#courseBody').innerHTML=`<div class="moduleTwoView">
     <div class="moduleTwoHead">
       <button class="back moduleTwoBack" onclick="renderStableCourse()">‹</button>
       <div>
         <div class="moduleTwoEyebrow">A1 · MÓDULO 2</div>
         <h2>Alfabeto, números e dados pessoais</h2>
         <p>8 aulas progressivas · ouvir, responder, montar frases e revisar</p>
       </div>
     </div>
     <div class="moduleTwoLessons">${moduleTwoCards()}</div>
   </div>`;
   window.scrollTo(0,0);
   return;
 }
 const cards=Array.from({length:8},(_,n)=>{const pct=progress(m,n),isDone=done(m,n);return `<div class="lessonCard ${isDone?'done':''}"><span class="lessonIcon">${isDone?'✅':(item(m,n)?.e||'💬')}</span><h4>${n+1}. ${esc(title(m,n))}</h4><p>${isDone?'Concluída':pct>0?`Em andamento · ${pct}%`:'Não iniciada'}</p><div class="lessonCardProgressV118"><span style="width:${pct}%"></span></div><button class="btn primary" style="margin-top:10px" onclick="openStableLesson('A1',${m},${n})">${isDone?'Revisar':pct>0?'Continuar':'Começar'}</button></div>`}).join('');
 $('#courseBody').innerHTML=`<div class="top"><button class="back" onclick="renderStableCourse()">‹</button><div><h2 style="margin:0">${m+1}. ${esc(MT[m])}</h2><div class="muted">A1 · poucas palavras, muita repetição</div></div></div><div class="lessonGrid">${cards}</div>`;
 window.scrollTo(0,0);
}
window.openStableModule=(l,m)=>l==='A1'?moduleView(m):oldModule?.(l,m);
window.openStableLesson=(l,m,n)=>{m=Number(m);n=Number(n);if(l==='A1'&&!(m===0&&n<=2))return start(m,n);return oldOpen?.(l,m,n)};
const back=sessionStorage.getItem('a15back');if(back!==null){sessionStorage.removeItem('a15back');setTimeout(()=>{window.stableShow?.('course');moduleView(Number(back)||0)},250)}
})();
