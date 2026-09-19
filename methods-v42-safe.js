(()=>{
'use strict';
const STORE='meuInglesMethodsV2',SESSION='meuInglesMethodSessionV2';
const THEMES=[
 ['familia','Família','👨‍👩‍👧‍👦','#ffd45a',['família','pais e filhos','irmãos','avós e netos','tios e primos','idades','descrições','possessivos','rotina em família','conversa em família'],[['This is my mother.','Esta é minha mãe.'],['I have one brother.','Eu tenho um irmão.'],['Do you have any sisters?','Você tem irmãs?']]],
 ['comida','Pedindo comida','🍕','#aaa8ff',['comidas','bebidas','I would like','cardápio','fazendo o pedido','preferências','garçom','problemas no pedido','conta','simulação'],[['I would like a hamburger, please.','Eu gostaria de um hambúrguer, por favor.'],['Can I have some water?','Posso pedir água?'],['Can I have the bill, please?','Pode trazer a conta?']]],
 ['viagem','Viagem','🧳','#ff956d',['planejamento','destinos','datas','bagagem','chegada','informações','passeios','problemas','mudando planos','conversa de viagem'],[['I am traveling tomorrow.','Eu vou viajar amanhã.'],['Where is the city center?','Onde fica o centro?'],['How long does it take?','Quanto tempo demora?']]],
 ['hotel','Hotel','🏨','#5ed6c4',['quartos','reserva','datas','check-in','no quarto','serviços','pedindo ajuda','problemas','check-out','situação completa'],[['I have a reservation.','Eu tenho uma reserva.'],['What time is breakfast?','Que horas é o café?'],['I would like to check out.','Eu gostaria de fazer o check-out.']]],
 ['aeroporto','Aeroporto','✈️','#72b9ff',['aeroporto','check-in','documentos','bagagem','portão','horários','segurança','imigração','atrasos','embarque'],[['Where is the check-in counter?','Onde fica o check-in?'],['Which gate is it?','Qual é o portão?'],['My flight is delayed.','Meu voo está atrasado.']]],
 ['transporte','Transportes','🚌','#f4a6cd',['transportes','pontos','passagens','direções','táxi','metrô','ônibus','tempo de trajeto','conexões','rota completa'],[['Where is the bus stop?','Onde fica o ponto?'],['How much is the ticket?','Quanto custa a passagem?'],['Which line should I take?','Qual linha eu pego?']]],
 ['trabalho','Trabalho','💼','#8fd18b',['profissões','local de trabalho','rotina','horários','tarefas','colegas','pedidos','reuniões','problemas','conversa profissional'],[['I work in the morning.','Eu trabalho de manhã.'],['I have a meeting today.','Tenho uma reunião hoje.'],['What do you do for work?','Com o que você trabalha?']]],
 ['compras','Compras','🛍️','#ffd184',['lojas','preços','tamanhos','cores','experimentando','comparando','pagamento','descontos','trocas','compra completa'],[['How much is this?','Quanto custa isto?'],['Can I try this on?','Posso experimentar?'],['Can I pay by card?','Posso pagar com cartão?']]],
 ['saude','Saúde','🩺','#81d9e7',['corpo','como se sente','sintomas','farmácia','consulta','dor','hábitos','orientações','marcando consulta','conversa completa'],[['I have a headache.','Estou com dor de cabeça.'],['I need a pharmacy.','Preciso de uma farmácia.'],['I feel better today.','Estou melhor hoje.']]],
 ['casa','Casa e rotina','🏠','#d6a5ff',['cômodos','objetos','onde está','minha casa','tarefas','manhã','noite','convidando alguém','problemas','conversa completa'],[['The kitchen is small.','A cozinha é pequena.'],['My keys are on the table.','Minhas chaves estão na mesa.'],['I make coffee every morning.','Faço café toda manhã.']]]
].map(x=>({id:x[0],title:x[1],emoji:x[2],color:x[3],stages:x[4],examples:x[5]}));
let screen=null,view='themes',screenMode='study',active=null,session=readSession(),starting=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const theme=id=>THEMES.find(t=>t.id===id)||THEMES[0];
const title=(t,n)=>`${t.stages[Math.floor((Math.max(1,Math.min(40,n))-1)/4)]} · parte ${((n-1)%4)+1}`;
function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return {}}}
function item(id){const r=load();r.themes=r.themes||{};r.themes[id]=r.themes[id]||{completed:[],current:1};return{r,i:r.themes[id]}}
function save(r){try{localStorage.setItem(STORE,JSON.stringify(r))}catch{}}
function current(id){return Math.max(1,Math.min(40,Number(item(id).i.current)||1))}
function done(id){return new Set(item(id).i.completed||[])}
function setCurrent(id,n){const x=item(id);x.i.current=Math.max(1,Math.min(40,Number(n)||1));x.r.lastTheme=id;x.r.lastLesson=x.i.current;save(x.r)}
function complete(id,n){const x=item(id),s=new Set(x.i.completed||[]);s.add(Number(n));x.i.completed=[...s].sort((a,b)=>a-b);x.i.current=Math.min(40,Number(n)+1);save(x.r);refresh()}
function readSession(){try{return JSON.parse(sessionStorage.getItem(SESSION)||'null')}catch{return null}}
function saveSession(){try{session?sessionStorage.setItem(SESSION,JSON.stringify(session)):sessionStorage.removeItem(SESSION)}catch{}}
function clearSession(){session=null;saveSession()}
function ensureHome(){const h=document.querySelector('#home'),a=h?.querySelector('.allCoursesCard');if(!a||h.querySelector('.methodsHomeCardV42'))return;const b=document.createElement('button');b.type='button';b.className='methodsHomeCardV42';b.innerHTML='<span class="methodsHomeArtV42" aria-hidden="true"><svg viewBox="0 0 72 72" role="img"><path d="M10 47l15-8 15 6 19-10v23l-19 8-15-6-15 8z" fill="#f4efe2"/><path d="M10 47l15-8v21l-15 8z" fill="#d8e79b"/><path d="M25 39l15 6v21l-15-6z" fill="#f7d67a"/><path d="M40 45l19-10v23l-19 8z" fill="#98d7ef"/><path d="M17 43c0-5 4-9 9-9s9 4 9 9c0 7-9 15-9 15s-9-8-9-15z" fill="#e8585f"/><circle cx="26" cy="43" r="3.2" fill="#fff"/><rect x="42" y="10" width="5" height="29" rx="2.5" fill="#8f623d"/><path d="M45 13h15l4 5-4 5H45z" fill="#f3b43f"/><path d="M45 22H30l-4 5 4 5h15z" fill="#ef6f86"/><path d="M45 31h13l4 5-4 5H45z" fill="#58aee7"/></svg></span><span><small>ESTUDO POR ASSUNTO</small><b>Métodos</b><em>Família, viagens, comida, hotel e muito mais.</em></span><i>›</i>';b.onclick=openScreen;a.insertAdjacentElement('afterend',b)}
function ensureUI(){ensureHome();decoratePill()}
function createScreen(){if(screen)return;screen=document.createElement('div');screen.className='methodsScreenV42';screen.innerHTML='<div class="methodsInnerV42"><header><button class="methodsBackV42">‹</button><h2>Métodos</h2><span></span></header><main></main></div>';document.body.appendChild(screen);screen.querySelector('.methodsBackV42').onclick=back}
function openScreen(){createScreen();screenMode='study';view='themes';active=null;renderThemes();screen.classList.add('open');document.body.classList.add('methodsLockV42')}
function closeScreen(){screen?.classList.remove('open');document.body.classList.remove('methodsLockV42')}
function back(){if(screenMode==='conversation'){closeScreen();return}if(view==='lesson'){view='theme';renderTheme(active)}else if(view==='theme'){view='themes';renderThemes()}else closeScreen()}
function renderThemes(){view='themes';const m=screen.querySelector('main');screen.querySelector('h2').textContent='Métodos';screen.querySelector('header span').textContent='40 aulas por tema';m.innerHTML='<section class="methodsHeroV42"><h1>Aprenda por temas</h1><p>Estudos independentes do curso A1–C2.</p></section><section class="methodsThemesV42">'+THEMES.map(t=>`<button data-theme="${t.id}" style="--tc:${t.color}"><h3>${esc(t.title)}</h3><strong>${done(t.id).size}/40 <small>aulas</small></strong><em>${t.emoji}</em><i><u style="width:${done(t.id).size*2.5}%"></u></i></button>`).join('')+'</section>';m.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{active=b.dataset.theme;renderTheme(active)})}
function renderTheme(id){view='theme';active=id;const t=theme(id),d=done(id),cur=current(id),m=screen.querySelector('main');screen.querySelector('h2').textContent=t.title;screen.querySelector('header span').textContent=`${d.size}/40`;m.innerHTML=`<section class="methodsThemeHeadV42"><h1>${t.emoji} ${esc(t.title)}</h1><p>Escolha onde quer começar ou continue de onde parou.</p></section><section class="methodsActionsV42"><button class="cont">▶ Continuar da aula ${cur}</button><button class="start">Do início</button><button class="random">Aleatória</button></section><section class="methodsLessonsV42">${Array.from({length:40},(_,i)=>{const n=i+1;return `<button data-lesson="${n}" class="${d.has(n)?'done':''}"><b>${d.has(n)?'✓':n}</b><span>${esc(title(t,n))}<small>Aula ${n} de 40</small></span><i>›</i></button>`}).join('')}</section>`;m.querySelector('.cont').onclick=()=>openLesson(id,cur);m.querySelector('.start').onclick=()=>openLesson(id,1);m.querySelector('.random').onclick=()=>openLesson(id,1+Math.floor(Math.random()*40));m.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>openLesson(id,Number(b.dataset.lesson)))}
function openLesson(id,n){view='lesson';active=id;setCurrent(id,n);const t=theme(id),m=screen.querySelector('main'),rows=[0,1,2].map(i=>t.examples[(n+i)%t.examples.length]);screen.querySelector('h2').textContent=`${t.title} · Aula ${n}`;screen.querySelector('header span').textContent=`${n}/40`;m.innerHTML=`<section class="methodsLessonV42"><div><small>AULA ${n} DE 40</small><h2>${esc(title(t,n))}</h2><p>Treino de vocabulário e conversação sobre ${esc(t.title)}.</p><i><u style="width:${Math.round(n/40*100)}%"></u></i></div>${rows.map((r,i)=>`<article><b>${esc(r[0])}</b><span>${esc(r[1])}</span><button data-speak="${i}">🔊 Ouvir</button></article>`).join('')}<footer><button class="robot">🤖 Aula particular com o robô</button><button class="finish">✓ Concluir aula</button></footer></section>`;m.querySelectorAll('[data-speak]').forEach((b,i)=>b.onclick=()=>speak(rows[i][0]));m.querySelector('.robot').onclick=()=>startMethodSphere(id,n,'lesson');m.querySelector('.finish').onclick=()=>{complete(id,n);n<40?openLesson(id,n+1):renderTheme(id)}}
async function speak(text){try{const v=JSON.parse(localStorage.getItem('meuInglesStableV2')||'{}').voice||'Aoede';await window.geminiSpeak?.(text,'en-US',v)}catch{}}
function refresh(){if(!screen?.classList.contains('open'))return;view==='themes'?renderThemes():view==='theme'&&renderTheme(active)}
function openConversationMethods(){
 createScreen();
 screenMode='conversation';
 view='conversationThemes';
 active=null;
 renderConversationThemes();
 screen.classList.add('open');
 document.body.classList.add('methodsLockV42');
}
window.openMethodsRobot=e=>{e?.preventDefault?.();e?.stopPropagation?.();openConversationMethods()}

function renderConversationThemes(){
 view='conversationThemes';
 const m=screen.querySelector('main');
 screen.querySelector('h2').textContent='Escolha um tema';
 screen.querySelector('header span').textContent='Conversa com a esfera';
 m.className='conversationMethodsMainV74';
 m.innerHTML=`<section class="conversationMethodsIntroV74">
   <span>MÉTODOS</span>
   <h1>Escolha um tema</h1>
   <p>Toque em um tema para entrar direto na conversa com a esfera.</p>
 </section>
 <section class="conversationMethodsCardsV74">
   ${THEMES.map((t,index)=>{
     const total=done(t.id).size;
     const pct=Math.round(total/40*100);
     return `<button data-conv-theme="${t.id}" class="conversationThemeCardV74 tone-${index%8}">
       <span class="conversationThemeArtV74"><em>${t.emoji}</em></span>
       <span class="conversationThemeInfoV74">
         <b>${esc(t.title)}</b>
         <small><strong>${total}</strong>/40 aulas concluídas</small>
         <span class="conversationThemeProgressV74"><u style="width:${pct}%"></u></span>
       </span>
       <i>›</i>
     </button>`;
   }).join('')}
 </section>`;
 m.querySelectorAll('[data-conv-theme]').forEach(b=>b.onclick=()=>startMethodSphere(b.dataset.convTheme,null,'theme'));
}

function normalizeSpeech(s){
 return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
}
function lessonMap(t){
 return Array.from({length:40},(_,i)=>`${i+1}: ${title(t,i+1)}`).join(' | ');
}
function recentCompleted(id){
 const arr=[...done(id)].sort((a,b)=>a-b);
 return arr.slice(-5);
}
async function startMethodSphere(id,requestedLesson=null,source='theme'){
 const t=theme(id),completed=done(id),cur=requestedLesson?Math.max(1,Math.min(40,Number(requestedLesson)||1)):current(id);
 const askChoice=!requestedLesson;
 starting=true;
 session={
   themeId:id,
   lesson:cur,
   mode:askChoice?'pending':'continue',
   reviewLesson:null,
   turns:0,
   booting:true,
   source
 };
 saveSession();
 closeScreen();
 window.stableShow?.('home');
 await wait(90);
 try{window.stopGeminiTTS?.()}catch{}
 const recent=recentCompleted(id);
 await window.startV26LiveContext?.({
   kind:'method',
   topic:t.title,
   lesson:`Aula ${cur} de 40`,
   lessonTitle:title(t,cur),
   completedCount:completed.size,
   nextLesson:current(id),
   recentCompleted:recent,
   recentTitles:recent.map(n=>`${n}: ${title(t,n)}`).join(' | '),
   lessonMap:lessonMap(t),
   askProgressChoice:askChoice,
   exactLesson:requestedLesson?cur:null,
   instruction:askChoice
     ?`O aluno entrou em ${t.title}. Use o progresso real. Pergunte se quer continuar da aula ${cur} ou revisar uma aula já concluída. Se pedir revisão por número, use exatamente o mapa de aulas fornecido.`
     :`O aluno abriu diretamente a aula ${cur} de ${t.title}. Comece por essa aula, sem perguntar qual aula quer.`
 });
 session.booting=false;
 saveSession();
 starting=false;
 setTimeout(decoratePill,120);
 setTimeout(decoratePill,900);
}

function handleLiveMethodInput(raw){
 if(!session||session.booting)return;
 const n=normalizeSpeech(raw);
 if(!n)return;
 const t=theme(session.themeId);

 if(session.mode==='pending'){
   const num=(n.match(/(?:aula|numero|revisar|revisao)?\s*(\d{1,2})/)||[])[1];
   const wantsReview=/revis|voltar|anterior|refazer/.test(n);
   const wantsContinue=/continu|seguir|proxim|avancar|onde parei|de onde parei/.test(n);

   if(wantsReview){
     let lesson=num?Number(num):Math.max(1,current(session.themeId)-1);
     lesson=Math.max(1,Math.min(40,lesson));
     session.mode='review';
     session.reviewLesson=lesson;
     session.lesson=lesson;
     session.turns=0;
     saveSession();
     setTimeout(decoratePill,20);
     return;
   }
   if(wantsContinue){
     session.mode='continue';
     session.reviewLesson=null;
     session.lesson=current(session.themeId);
     session.turns=0;
     saveSession();
     setTimeout(decoratePill,20);
     return;
   }
 }

 if(session.mode==='review'){
   if(/continu|seguir|proxim|avancar|voltar pro curso|onde parei/.test(n)){
     session.mode='continue';
     session.reviewLesson=null;
     session.lesson=current(session.themeId);
     session.turns=0;
     saveSession();
     setTimeout(decoratePill,20);
   }
   return;
 }

 if(session.mode==='continue'){
   session.turns=(session.turns||0)+1;
   const explicitAdvance=/proxim|avancar|pode avancar|concluir|terminei|ja entendi|entendi essa/.test(n);
   if(explicitAdvance||session.turns>=8){
     const lesson=Math.max(1,Math.min(40,Number(session.lesson)||current(session.themeId)));
     complete(session.themeId,lesson);
     session.lesson=current(session.themeId);
     session.turns=0;
     saveSession();
     setTimeout(decoratePill,20);
   }else{
     saveSession();
   }
 }
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function decoratePill(){if(!session)return;const p=document.querySelector('#homeTopicPill');if(!p)return;const t=theme(session.themeId);const label=session.mode==='review'?`Revisão · Aula ${session.lesson}`:session.mode==='pending'?`Continuar ou revisar`:`Aula ${session.lesson}/40`;p.textContent=`← ${t.title} · ${label}`;p.classList.add('methodSessionPill');p.onclick=e=>{e.preventDefault();e.stopPropagation();openConversationMethods()}}
function wrap(){
 if(window.__methodsV42Wrapped)return;
 const close=window.closeV26Conversation,start=window.startV26Conversation;
 if(typeof close==='function')window.closeV26Conversation=function(...a){const r=close.apply(this,a);if(session)clearSession();setTimeout(ensureUI,0);return r};
 if(typeof start==='function')window.startV26Conversation=async function(...a){const r=await start.apply(this,a);setTimeout(ensureUI,0);return r};
 window.addEventListener('meu-ingles-live-user-turn',e=>handleLiveMethodInput(e?.detail?.text||''));
 window.__methodsV42Wrapped=true;
}
function init(){wrap();ensureUI();document.addEventListener('click',e=>{if(!starting&&e.target.closest('#home .homeConversationChoice[data-v26mode="free"]'))clearSession()});window.addEventListener('pageshow',()=>setTimeout(ensureUI,50));document.addEventListener('visibilitychange',()=>!document.hidden&&setTimeout(ensureUI,50));setTimeout(ensureUI,300)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,420),{once:true}):setTimeout(init,420);
})();
