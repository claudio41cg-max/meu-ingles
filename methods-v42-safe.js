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
function ensureHome(){const h=document.querySelector('#home'),a=h?.querySelector('.allCoursesCard');if(!a||h.querySelector('.methodsHomeCardV42'))return;const b=document.createElement('button');b.type='button';b.className='methodsHomeCardV42';b.innerHTML='<span class="methodsHomeArtV42" aria-hidden="true"><svg viewBox="0 0 72 72" role="img"><defs><linearGradient id="mhMapA" x1="10" y1="18" x2="60" y2="58" gradientUnits="userSpaceOnUse"><stop stop-color="#fff4c7"/><stop offset="1" stop-color="#ffd36a"/></linearGradient><linearGradient id="mhMapB" x1="16" y1="58" x2="62" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#9cf0e2"/><stop offset="1" stop-color="#6fc9ff"/></linearGradient><linearGradient id="mhPin" x1="18" y1="30" x2="36" y2="55" gradientUnits="userSpaceOnUse"><stop stop-color="#ff7b88"/><stop offset="1" stop-color="#e84658"/></linearGradient></defs><path d="M9 45.5 24 37l15 6.2L62 32v22L39 65 24 58.8 9 67Z" fill="url(#mhMapA)" stroke="rgba(255,255,255,.55)" stroke-width="1.2" stroke-linejoin="round"/><path d="M9 45.5 24 37v21.8L9 67Z" fill="#d7ef95"/><path d="M39 43.2 62 32v22L39 65Z" fill="url(#mhMapB)"/><path d="M18 41.5c0-5.3 4.1-9.4 9.2-9.4s9.2 4.1 9.2 9.4c0 7.3-9.2 16.2-9.2 16.2S18 48.8 18 41.5Z" fill="url(#mhPin)" stroke="#fff" stroke-width="1.3"/><circle cx="27.2" cy="41.5" r="3.2" fill="#fff"/><path d="M45.8 10v29" stroke="#77512f" stroke-width="4.6" stroke-linecap="round"/><path d="M47 12h13.2l4.7 4.7-4.7 4.7H47Z" fill="#ffc64f" stroke="rgba(255,255,255,.45)" stroke-width=".9"/><path d="M44.7 21.7H30.4l-4.6 4.8 4.6 4.8h14.3Z" fill="#f26f8d" stroke="rgba(255,255,255,.45)" stroke-width=".9"/><path d="M47 31.5h11.8l4.6 4.6-4.6 4.6H47Z" fill="#65b8ef" stroke="rgba(255,255,255,.45)" stroke-width=".9"/><circle cx="45.8" cy="9.4" r="3.2" fill="#fff5d8"/></svg></span><span><small>ESTUDO POR ASSUNTO</small><b>Explorar temas</b><em>Família, viagens, comida, hotel e muito mais.</em></span><i>›</i>';b.onclick=openScreen;a.insertAdjacentElement('afterend',b)}
function ensureUI(){ensureHome();decoratePill();if(session&&isCalmTutorV109())setTimeout(ensureTutorCacheBadgeV109,60)}
function createScreen(){if(screen)return;screen=document.createElement('div');screen.className='methodsScreenV42';screen.innerHTML='<div class="methodsInnerV42"><header><button class="methodsBackV42">‹</button><h2>Métodos</h2><span></span></header><main></main></div>';document.body.appendChild(screen);screen.querySelector('.methodsBackV42').onclick=back}
function openScreen(){createScreen();screenMode='study';view='themes';active=null;renderThemes();screen.classList.add('open');document.body.classList.add('methodsLockV42')}
function closeScreen(){screen?.classList.remove('open');document.body.classList.remove('methodsLockV42')}
function back(){if(screenMode==='conversation'){closeScreen();return}if(view==='lesson'){view='theme';renderTheme(active)}else if(view==='theme'){view='themes';renderThemes()}else closeScreen()}
function renderThemes(){view='themes';const m=screen.querySelector('main');screen.querySelector('h2').textContent='Métodos';screen.querySelector('header span').textContent='40 aulas por tema';m.innerHTML='<section class="methodsHeroV42"><h1>Aprenda por temas</h1><p>Estudos independentes do curso A1–C2.</p></section><section class="methodsThemesV42">'+THEMES.map(t=>`<button data-theme="${t.id}" style="--tc:${t.color}"><h3>${esc(t.title)}</h3><strong>${done(t.id).size}/40 <small>aulas</small></strong><em>${t.emoji}</em><i><u style="width:${done(t.id).size*2.5}%"></u></i></button>`).join('')+'</section>';m.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{active=b.dataset.theme;renderTheme(active)})}
function groupEmoji(themeId,index,fallback){
 const map={
   familia:['👨‍👩‍👧‍👦','👨‍👩‍👧','🧑‍🤝‍🧑','👵👴','👨‍👩‍👧‍👦','🎂','🙂','🔐','🏡','💬']
 };
 return map[themeId]?.[index]||fallback;
}
function renderTheme(id){
 view='theme';
 active=id;
 const t=theme(id),d=done(id),cur=current(id),m=screen.querySelector('main');
 screen.querySelector('h2').textContent=t.title;
 screen.querySelector('header span').textContent=`${d.size}/40`;

 const groups=t.stages.map((stage,index)=>{
   const first=index*4+1;
   const nums=[first,first+1,first+2,first+3];
   const completed=nums.filter(n=>d.has(n)).length;
   const pct=Math.round(completed/4*100);
   const art=groupEmoji(t.id,index,t.emoji);
   return `
     <section class="methodsLessonGroupV96 tone-${index%10}" data-group="${index}">
       <button type="button" class="methodsLessonGroupHeadV96" data-group-toggle="${index}">
         <span class="methodsLessonGroupCopyV96">
           <small>BLOCO ${index+1} · AULAS ${first}–${first+3}</small>
           <b>${esc(stage)}</b>
           <strong>${completed}/4 <em>aulas</em></strong>
           <i><u style="width:${pct}%"></u></i>
         </span>
         <span class="methodsLessonGroupArtV96" aria-hidden="true">${art}</span>
         <span class="methodsLessonGroupArrowV96">⌄</span>
       </button>
       <div class="methodsLessonGroupItemsV96">
         ${nums.map(n=>`
           <button type="button" data-lesson="${n}" class="${d.has(n)?'done':''}">
             <strong>${d.has(n)?'✓':n}</strong>
             <span><b>${esc(title(t,n))}</b><small>Aula ${n} de 40</small></span>
             <i>›</i>
           </button>`).join('')}
       </div>
     </section>`;
 }).join('');

 const totalPct=Math.round(d.size/40*100);
 m.innerHTML=`
   <section class="methodsThemeHeroV96" style="--hero-color:${t.color}">
     <span class="methodsThemeHeroArtV96">${t.emoji}</span>
     <span class="methodsThemeHeroCopyV96">
       <small>40 AULAS · 10 BLOCOS</small>
       <h1>${esc(t.title)}</h1>
       <p>Escolha um bloco de 4 aulas ou continue de onde parou.</p>
       <i><u style="width:${totalPct}%"></u></i>
       <button class="methodsThemeContinueV97">▶ Continuar da aula ${cur}</button>
     </span>
   </section>

   <section class="methodsLessonGroupsV96">${groups}</section>`;

 m.querySelector('.methodsThemeContinueV97').onclick=()=>openLesson(id,cur);

 m.querySelectorAll('[data-group-toggle]').forEach(btn=>btn.onclick=()=>{
   const group=btn.closest('.methodsLessonGroupV96');
   const wasOpen=group.classList.contains('open');
   m.querySelectorAll('.methodsLessonGroupV96').forEach(x=>x.classList.remove('open'));
   if(!wasOpen){
     group.classList.add('open');
     setTimeout(()=>group.scrollIntoView({behavior:'smooth',block:'nearest'}),30);
   }
 });

 const currentGroup=Math.floor((cur-1)/4);
 m.querySelector(`[data-group="${currentGroup}"]`)?.classList.add('current');
 m.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>openLesson(id,Number(b.dataset.lesson)));
}

let methodPilotRuntime=null;

function methodSimilarity(a,b){
 const x=normalizeSpeech(a),y=normalizeSpeech(b);
 if(!x||!y)return 0;
 if(x===y)return 1;
 const xa=x.split(' '),ya=y.split(' ');
 const common=xa.filter(w=>ya.includes(w)).length;
 const wordScore=common/Math.max(xa.length,ya.length);
 const max=Math.max(x.length,y.length);
 const dp=Array.from({length:y.length+1},(_,i)=>i);
 for(let i=1;i<=x.length;i++){
   let prev=dp[0];dp[0]=i;
   for(let j=1;j<=y.length;j++){
     const temp=dp[j];
     dp[j]=Math.min(dp[j]+1,dp[j-1]+1,prev+(x[i-1]===y[j-1]?0:1));
     prev=temp;
   }
 }
 const charScore=1-dp[y.length]/max;
 return Math.max(wordScore,charScore);
}

function methodSpeechDiff(target,heard){
 const tw=String(target||'').replace(/[?.!,]/g,'').trim().split(/\s+/);
 const hw=String(heard||'').replace(/[?.!,]/g,'').trim().split(/\s+/);
 const wrong=[];
 const html=tw.map((word,i)=>{
   const ok=normalizeSpeech(word)===normalizeSpeech(hw[i]||'');
   if(!ok)wrong.push(word);
   return '<span class="'+(ok?'ok':'wrong')+'">'+esc(word)+'</span>';
 }).join(' ');
 return {html,wrong};
}

function methodSpeakPractice(target,button,feedback,onPass){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){
   feedback.innerHTML='<b>Microfone indisponível neste navegador.</b><span>Você ainda pode ouvir e repetir em voz alta.</span>';
   feedback.className='methodSpeakFeedbackV100 bad';
   return;
 }
 try{window.stopGeminiTTS?.()}catch{}
 const rec=new SR();
 rec.lang='en-US';
 rec.interimResults=false;
 rec.maxAlternatives=1;
 button.disabled=true;
 button.classList.add('listening');
 feedback.innerHTML='<b>Estou ouvindo...</b><span>Fale em inglês.</span>';
 feedback.className='methodSpeakFeedbackV100 listening';
 rec.onresult=e=>{
   const heard=String(e.results?.[0]?.[0]?.transcript||'').trim();
   const score=methodSimilarity(heard,target);
   const ok=score>=.76;
   const diff=methodSpeechDiff(target,heard);
   if(ok){
     feedback.innerHTML='<b>✅ Muito bom!</b><span>Pronúncia reconhecida.</span>';
     feedback.className='methodSpeakFeedbackV100 good';
     onPass?.();
   }else{
     const words=diff.wrong.length?diff.wrong.join(', '):target;
     feedback.innerHTML='<b>Quase. Ajuste só esta parte:</b>'+
       '<div class="methodWordDiffV103">'+diff.html+'</div>'+
       '<span>Tente novamente: '+esc(words)+'</span>'+
       '<div class="methodSpeechRetryActionsV107">'+
         '<button type="button" class="methodHearAgainV107">🔊 Ouvir frase</button>'+
         '<button type="button" class="methodTryAgainV107">🎙️ Tentar novamente</button>'+
       '</div>';
     feedback.className='methodSpeakFeedbackV100 bad';
     feedback.querySelector('.methodHearAgainV107')?.addEventListener('click',async function(){
       try{window.stopGeminiTTS?.()}catch{}
       try{await window.geminiSpeak?.(target,'en-US','Achird')}catch{}
     });
     feedback.querySelector('.methodTryAgainV107')?.addEventListener('click',function(){
       if(!button.disabled)button.click();
     });
   }
 };
 rec.onerror=()=>{
   feedback.innerHTML='<b>Não consegui ouvir direito.</b><span>Toque em Falar e tente novamente.</span>';
   feedback.className='methodSpeakFeedbackV100 bad';
 };
 rec.onend=()=>{button.disabled=false;button.classList.remove('listening')};
 try{rec.start()}catch{button.disabled=false;button.classList.remove('listening')}
}

function familyLessonWords(){
 return [
   ['brother','irmão'],['sister','irmã'],['mother','mãe'],
   ['I','eu'],['have','tenho'],['one','um']
 ];
}
function familyMiniPhrases(){
 return [
   ['I have','eu tenho'],['one brother','um irmão'],['my mother','minha mãe']
 ];
}
function shuffleWords(text,seed=1){
 const a=String(text).replace(/[?.!,]/g,'').split(/\s+/).filter(Boolean);
 for(let i=a.length-1;i>0;i--){
   const j=(seed*17+i*13)%(i+1);
   [a[i],a[j]]=[a[j],a[i]];
 }
 if(a.join(' ').toLowerCase()===String(text).replace(/[?.!,]/g,'').toLowerCase())a.reverse();
 return a;
}

function updateFamilyPilotProgress(){
 if(!methodPilotRuntime)return;
 const total=methodPilotRuntime.requiredSpeak||3;
 const spoken=methodPilotRuntime.spoken.size;
 document.querySelectorAll('[data-pilot-step]').forEach((el,i)=>el.classList.toggle('done',methodPilotRuntime.spoken.has(i)));
 const review=document.querySelector('.methodReviewV100');
 if(review)review.classList.add('unlocked');
 const hint=document.querySelector('.methodReviewLockV100');
 if(hint)hint.textContent='Revisão disponível · falas praticadas: '+spoken+'/'+total;
 updateFamilyReviewFinish();
}

function updateFamilyReviewFinish(){
 if(!methodPilotRuntime)return;
 const total=4;
 const count=methodPilotRuntime.review.size;
 const label=document.querySelector('.methodReviewScoreV100');
 if(label)label.textContent=count+'/'+total+' concluídos';
 const finish=document.querySelector('.methodsLessonV100 .finish');
 if(finish){
   finish.disabled=count<total;
   finish.classList.toggle('ready',count>=total);
   if(count>=total)finish.textContent='✓ Aula concluída';
 }
 if(count>=total&&!methodPilotRuntime.savedComplete){
   methodPilotRuntime.savedComplete=true;
   const progress=document.querySelector('.methodPilotProgressV100 u');
   if(progress)progress.style.width='100%';
   complete(methodPilotRuntime.themeId||'familia',Number(methodPilotRuntime.lessonNumber)||1);
 }
}

function markFamilyActivityV107(key){
 if(!methodPilotRuntime)return;
 if(!methodPilotRuntime.activity)methodPilotRuntime.activity=new Set();
 methodPilotRuntime.activity.add(String(key));
 const total=19;
 const pct=Math.min(100,Math.round(methodPilotRuntime.activity.size/total*100));
 const progress=document.querySelector('.methodPilotProgressV100 u');
 if(progress)progress.style.width=pct+'%';
 const hero=document.querySelector('.methodsLessonHeroV103');
 if(hero)hero.dataset.progress=pct;
}

function markFamilyReviewV107(q){
 markFamilyActivityV107('review-'+q);
 updateFamilyReviewFinish();
}

function renderFamilyPilotLesson(id,n,t,rows,m){
 const words=familyLessonWords();
 const mini=familyMiniPhrases();
 const phrases=[
   ['I have one brother.','Eu tenho um irmão.'],
   ['Do you have any sisters?','Você tem irmãs?'],
   ['This is my mother.','Esta é minha mãe.']
 ];
 methodPilotRuntime={themeId:id,lessonNumber:Number(n),spoken:new Set(),review:new Set(),requiredSpeak:3,scramble:{},activity:new Set(),savedComplete:done(id).has(Number(n))};

 // Pré-carrega silenciosamente o áudio fixo desta aula.
 // Se já estiver salvo no aparelho, nenhuma nova chamada à API é feita.
 setTimeout(()=>{
   const preload=window.preloadGeminiTTS;
   if(typeof preload!=='function')return;
   const fixedAudio=[
     ...words.map(w=>w[0]),
     ...mini.map(p=>p[0]),
     ...phrases.map(p=>p[0]),
     'Do you have any sisters?'
   ];
   fixedAudio.forEach((text,i)=>{
     setTimeout(()=>preload(text,'en-US','Achird').catch(()=>{}),i*220);
   });
 },250);

 const earIcon='<span class="methodAudioIconV103" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M17 6c-5.2 0-9 3.7-9 8.7 0 3.3 1.4 5.4 3.2 7.1 1.8 1.7 2.8 2.8 3 4.2.2 1.1 1.1 1.8 2.2 1.8 1.6 0 2.5-1 2.5-2.2 0-1.7-1.2-2.7-2.6-3.8-1.4-1.2-2.9-2.6-2.9-5.2 0-2.7 1.8-4.7 4.4-4.7 2.4 0 4.2 1.7 4.2 4.1 0 1.5-.6 2.7-1.7 3.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M23 8c2 1.5 3.2 3.8 3.2 6.3M26.2 5.3c3 2.3 4.8 5.5 4.8 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';
 const micIcon='<span class="methodAudioIconV103 mic" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="11" y="4" width="10" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M7 15a9 9 0 0 0 18 0M16 24v4M11 28h10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span>';

 const wordsHtml=words.map(function(w,i){
   return '<button type="button" data-word-listen="'+i+'"><b>'+esc(w[0])+'</b><span>'+esc(w[1])+'</span>'+earIcon+'</button>';
 }).join('');
 const miniHtml=mini.map(function(p,i){
   return '<button type="button" data-mini-listen="'+i+'"><span><b>'+esc(p[0])+'</b><small>'+esc(p[1])+'</small></span>'+earIcon+'</button>';
 }).join('');
 const phrasesHtml=phrases.map(function(r,i){
   return '<article data-pilot-step="'+i+'">'+
     '<div class="methodStepPhraseV100"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></div>'+
     '<div class="methodStepActionsV100">'+
       '<button type="button" data-pilot-listen="'+i+'">'+earIcon+'<span>Ouvir</span></button>'+
       '<button type="button" data-pilot-speak="'+i+'">'+micIcon+'<span>Falar</span></button>'+
     '</div>'+
     '<div class="methodSpeakFeedbackV100" data-pilot-feedback="'+i+'">'+
       '<b>Ouça primeiro e depois repita.</b>'+
       '<span>Se errar uma parte, eu mostro só a palavra que precisa corrigir.</span>'+
     '</div>'+
   '</article>';
 }).join('');
 const scramble0=shuffleWords('I have one brother',3).map(function(w){return '<button type="button" data-word="'+esc(w)+'">'+esc(w)+'</button>';}).join('');
 const scramble1=shuffleWords('This is my mother',7).map(function(w){return '<button type="button" data-word="'+esc(w)+'">'+esc(w)+'</button>';}).join('');

 m.innerHTML=
 '<section class="methodsLessonV42 methodsLessonV99 methodsLessonV100 methodsLessonV103 lesson-tone-0">'+
   '<div class="methodsLessonHeroV99 methodsLessonHeroV100 methodsLessonHeroV103">'+
     '<span class="methodsLessonBlockV99">BLOCO 1 · família</span>'+
     '<small>AULA 1 DE 40 · DO FÁCIL PARA A FRASE</small>'+
     '<h2>família · parte 1</h2>'+
     '<p>Aprenda as palavras, junte as ideias, ouça, fale e finalize com jogos de revisão.</p>'+
     '<i class="methodPilotProgressV100"><u style="width:0%"></u></i>'+
   '</div>'+
   '<section class="methodWarmupV103">'+
     '<header><small>PASSO 1</small><b>Palavras essenciais</b><span>Toque para ouvir.</span></header>'+
     '<div class="methodWordGridV103">'+wordsHtml+'</div>'+
   '</section>'+
   '<section class="methodMiniPhraseV103">'+
     '<header><small>PASSO 2</small><b>Junte as palavras</b><span>Veja como elas começam a formar sentido.</span></header>'+
     '<div>'+miniHtml+'</div>'+
   '</section>'+
   '<section class="methodPracticeTitleV103">'+
     '<small>PASSO 3</small><b>Frases completas</b><span>Ouça primeiro. Depois fale.</span>'+
   '</section>'+
   '<div class="methodsInteractiveCardsV100 methodsInteractiveCardsV103">'+phrasesHtml+'</div>'+
   '<section class="methodReviewV100 methodReviewV103">'+
     '<header>'+
       '<span>🧠 REVISÃO DA AULA</span>'+
       '<b>Agora vamos brincar com o que você aprendeu</b>'+
       '<small class="methodReviewScoreV100">0/4 concluídos</small>'+
     '</header>'+
     '<div class="methodReviewLockV100">Fale as 3 frases para liberar a revisão · 0/3</div>'+
     '<div class="methodReviewBodyV100">'+
       '<div class="methodReviewChallengeV100 methodScrambleV103" data-review="0">'+
         '<small>DESAFIO 1 · MONTE A FRASE</small>'+
         '<b>Monte: “Eu tenho um irmão.”</b>'+
         '<div class="methodScrambleAnswerV103" data-scramble-answer="0"></div>'+
         '<div class="methodScrambleWordsV103" data-scramble="0">'+scramble0+'</div>'+
         '<span class="methodReviewFeedbackV100"></span>'+
       '</div>'+
       '<div class="methodReviewChallengeV100 methodScrambleV103" data-review="1">'+
         '<small>DESAFIO 2 · MONTE A FRASE</small>'+
         '<b>Monte: “Esta é minha mãe.”</b>'+
         '<div class="methodScrambleAnswerV103" data-scramble-answer="1"></div>'+
         '<div class="methodScrambleWordsV103" data-scramble="1">'+scramble1+'</div>'+
         '<span class="methodReviewFeedbackV100"></span>'+
       '</div>'+
       '<div class="methodReviewChallengeV100" data-review="2">'+
         '<small>DESAFIO 3 · ESCUTA</small>'+
         '<b>Ouça e escolha a frase correta.</b>'+
         '<button class="methodReviewListenV100" data-review-listen>'+earIcon+'<span>Ouvir frase</span></button>'+
         '<div class="methodReviewOptionsV100">'+
           '<button data-review-choice="2|wrong">I have one brother.</button>'+
           '<button data-review-choice="2|right">Do you have any sisters?</button>'+
           '<button data-review-choice="2|wrong">This is my mother.</button>'+
         '</div>'+
         '<span class="methodReviewFeedbackV100"></span>'+
       '</div>'+
       '<div class="methodReviewChallengeV100" data-review="3">'+
         '<small>DESAFIO 4 · FALA FINAL</small>'+
         '<b>Fale a frase inteira:</b>'+
         '<strong class="methodReviewTargetV103">This is my mother.</strong>'+
         '<button class="methodReviewSpeakV100" data-review-speak>'+micIcon+'<span>Falar agora</span></button>'+
         '<span class="methodReviewFeedbackV100"></span>'+
       '</div>'+
     '</div>'+
   '</section>'+
   '<footer>'+
     '<button class="robot lessonTutorV106">✦ Conversar com o professor desta aula</button><small class="lessonTutorHintV106">A conversa fica somente no conteúdo desta aula.</small>'+
     '<button class="finish" disabled>✓ Concluir aula</button>'+
   '</footer>'+
 '</section>';

 m.querySelectorAll('[data-pilot-speak]').forEach(function(b,i){
   b.onclick=function(){
     const feedback=m.querySelector('[data-pilot-feedback="'+i+'"]');
     methodSpeakPractice(phrases[i][0],b,feedback,function(){
       methodPilotRuntime.spoken.add(i);
       b.classList.add('activityDoneV108');
       b.closest('article')?.classList.add('activityDoneV108');
       markFamilyActivityV107('phrase-speak-'+i);
       updateFamilyPilotProgress();
     });
   };
 });

 const scrambleTargets=['I have one brother','This is my mother'];

 const playLessonAudio=async function(text,button){
   if(button&&button.dataset.playing==='1')return;
   if(button){
     button.dataset.playing='1';
     button.classList.add('playing');
   }
   try{
     window.stopGeminiTTS?.();
     await speak(text);
   }finally{
     if(button){
       button.dataset.playing='0';
       button.classList.remove('playing');
     }
   }
 };

 m.querySelectorAll('[data-word-listen]').forEach(function(b,i){b.onclick=function(){b.classList.add('activityDoneV108');markFamilyActivityV107('word-'+i);playLessonAudio(words[i][0],b);};});
 m.querySelectorAll('[data-mini-listen]').forEach(function(b,i){b.onclick=function(){b.classList.add('activityDoneV108');markFamilyActivityV107('mini-'+i);playLessonAudio(mini[i][0],b);};});
 m.querySelectorAll('[data-pilot-listen]').forEach(function(b,i){b.onclick=function(){b.classList.add('activityDoneV108');markFamilyActivityV107('phrase-listen-'+i);playLessonAudio(phrases[i][0],b);};});

 m.querySelectorAll('[data-scramble]').forEach(function(box){
   const q=Number(box.dataset.scramble);
   const challenge=box.closest('.methodReviewChallengeV100');
   const answer=m.querySelector('[data-scramble-answer="'+q+'"]');
   const feedback=challenge.querySelector('.methodReviewFeedbackV100');
   const targetWords=scrambleTargets[q].split(' ');
   methodPilotRuntime.scramble[q]=[];

   const evaluate=function(){
     const items=methodPilotRuntime.scramble[q];
     const complete=items.length===targetWords.length;
     const built=items.map(function(x){return x.word;}).join(' ');
     const exact=complete&&normalizeSpeech(built)===normalizeSpeech(scrambleTargets[q]);

     answer.querySelectorAll('button').forEach(function(ab,index){
       const right=normalizeSpeech(ab.textContent)===normalizeSpeech(targetWords[index]||'');
       ab.classList.toggle('correct-word',right);
       ab.classList.toggle('wrong-word',complete&&!right);
     });

     challenge.classList.toggle('passed',exact);
     challenge.classList.toggle('has-errors',complete&&!exact);

     if(exact){
       methodPilotRuntime.review.add(q);
       markFamilyReviewV107(q);
       feedback.textContent='✅ Perfeito! Frase montada corretamente.';
     }else{
       methodPilotRuntime.review.delete(q);
       if(complete){
         feedback.textContent='🔴 Só as palavras em vermelho estão fora do lugar. Toque nelas para trocar.';
       }else{
         feedback.textContent='';
       }
     }
     updateFamilyReviewFinish();
   };

   const redraw=function(){
     answer.innerHTML='';
     methodPilotRuntime.scramble[q].forEach(function(item,index){
       const ab=document.createElement('button');
       ab.type='button';
       ab.textContent=item.word;
       ab.dataset.answerIndex=String(index);
       ab.onclick=function(){
         if(methodPilotRuntime.review.has(q))return;
         const current=methodPilotRuntime.scramble[q][index];
         if(current&&current.btn)current.btn.disabled=false;
         methodPilotRuntime.scramble[q].splice(index,1);
         redraw();
         evaluate();
       };
       answer.appendChild(ab);
     });
     evaluate();
   };

   box.querySelectorAll('button').forEach(function(btn){
     btn.onclick=function(){
       if(methodPilotRuntime.review.has(q))return;
       if(btn.disabled)return;
       if(methodPilotRuntime.scramble[q].length>=targetWords.length)return;
       methodPilotRuntime.scramble[q].push({word:btn.dataset.word,btn:btn});
       btn.disabled=true;
       redraw();
     };
   });
 });

 const reviewListen=m.querySelector('[data-review-listen]');
 reviewListen.onclick=function(){playLessonAudio('Do you have any sisters?',reviewListen);};
 m.querySelectorAll('[data-review-choice]').forEach(function(btn){
   btn.onclick=function(){
     const parts=btn.dataset.reviewChoice.split('|');
     const q=parts[0],result=parts[1];
     const box=btn.closest('.methodReviewChallengeV100');
     const feedback=box.querySelector('.methodReviewFeedbackV100');
     const options=box.querySelectorAll('.methodReviewOptionsV100 button');

     options.forEach(function(x){
       if(!x.classList.contains('reviewCorrectV106'))x.classList.remove('reviewWrongV106');
     });

     if(result==='right'){
       methodPilotRuntime.review.add(Number(q));
       markFamilyReviewV107(Number(q));
       box.classList.add('passed','reviewSuccessV106');
       btn.classList.add('reviewCorrectV106');
       feedback.innerHTML='<b>✓ Muito bem!</b><span>Você escolheu a frase correta.</span>';
       feedback.className='methodReviewFeedbackV100 reviewFeedbackGoodV106';
       options.forEach(function(x){x.disabled=true;});
     }else{
       btn.classList.add('reviewWrongV106');
       feedback.innerHTML='<b>✕ Não foi essa.</b><span>Tente outra opção. A resposta errada ficou marcada em vermelho.</span>';
       feedback.className='methodReviewFeedbackV100 reviewFeedbackBadV106';
     }
     updateFamilyReviewFinish();
   };
 });

 const reviewSpeak=m.querySelector('[data-review-speak]');
 reviewSpeak.onclick=function(){
   const challenge=reviewSpeak.closest('.methodReviewChallengeV100');
   const feedback=challenge.querySelector('.methodReviewFeedbackV100');
   methodSpeakPractice('This is my mother.',reviewSpeak,feedback,function(){
     methodPilotRuntime.review.add(3);
     markFamilyReviewV107(3);
     challenge.classList.add('passed','finalSpeechSuccessV106');
     feedback.innerHTML='<b>✓ Excelente!</b><span>Você falou a frase corretamente. Esta etapa foi concluída.</span>';
     feedback.className='methodReviewFeedbackV100 good finalSpeechFeedbackV106';
     updateFamilyReviewFinish();
   });
 };

 m.querySelector('.robot').onclick=function(){startLessonTutorSphere(id,n,t);};
 m.querySelector('.finish').onclick=function(){
   if(methodPilotRuntime.review.size<4)return;
   const progress=document.querySelector('.methodPilotProgressV100 u');
   if(progress)progress.style.width='100%';
   complete(id,n);
   openLesson(id,n+1);
 };
 updateFamilyPilotProgress();
}

function renderFamilyLesson2(id,n,t,m){
 const words=[
   ['father','pai'],['parents','pais'],['son','filho'],
   ['daughter','filha'],['family','família'],['together','juntos']
 ];
 const mini=[
   ['my father','meu pai'],['my parents','meus pais'],['one daughter','uma filha']
 ];
 const phrases=[
   ['This is my father.','Este é meu pai.'],
   ['My parents are here.','Meus pais estão aqui.'],
   ['I have one daughter.','Eu tenho uma filha.']
 ];
 methodPilotRuntime={themeId:id,lessonNumber:Number(n),spoken:new Set(),review:new Set(),requiredSpeak:3,scramble:{},activity:new Set(),savedComplete:done(id).has(Number(n))};

 setTimeout(()=>{
   const preload=window.preloadGeminiTTS;
   if(typeof preload!=='function')return;
   const fixedAudio=[
     ...words.map(w=>w[0]),
     ...mini.map(p=>p[0]),
     ...phrases.map(p=>p[0]),
     'My parents are here.'
   ];
   fixedAudio.forEach((text,i)=>setTimeout(()=>preload(text,'en-US','Achird').catch(()=>{}),i*220));
 },250);

 const earIcon='<span class="methodAudioIconV103" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M17 6c-5.2 0-9 3.7-9 8.7 0 3.3 1.4 5.4 3.2 7.1 1.8 1.7 2.8 2.8 3 4.2.2 1.1 1.1 1.8 2.2 1.8 1.6 0 2.5-1 2.5-2.2 0-1.7-1.2-2.7-2.6-3.8-1.4-1.2-2.9-2.6-2.9-5.2 0-2.7 1.8-4.7 4.4-4.7 2.4 0 4.2 1.7 4.2 4.1 0 1.5-.6 2.7-1.7 3.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M23 8c2 1.5 3.2 3.8 3.2 6.3M26.2 5.3c3 2.3 4.8 5.5 4.8 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';
 const micIcon='<span class="methodAudioIconV103 mic" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="11" y="4" width="10" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M7 15a9 9 0 0 0 18 0M16 24v4M11 28h10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span>';

 const wordsHtml=words.map((w,i)=>'<button type="button" data-word-listen="'+i+'"><b>'+esc(w[0])+'</b><span>'+esc(w[1])+'</span>'+earIcon+'</button>').join('');
 const miniHtml=mini.map((p,i)=>'<button type="button" data-mini-listen="'+i+'"><span><b>'+esc(p[0])+'</b><small>'+esc(p[1])+'</small></span>'+earIcon+'</button>').join('');
 const phrasesHtml=phrases.map((r,i)=>
   '<article data-pilot-step="'+i+'">'+
     '<div class="methodStepPhraseV100"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></div>'+
     '<div class="methodStepActionsV100">'+
       '<button type="button" data-pilot-listen="'+i+'">'+earIcon+'<span>Ouvir</span></button>'+
       '<button type="button" data-pilot-speak="'+i+'">'+micIcon+'<span>Falar</span></button>'+
     '</div>'+
     '<div class="methodSpeakFeedbackV100" data-pilot-feedback="'+i+'">'+
       '<b>Ouça primeiro e depois repita.</b>'+
       '<span>Se errar uma parte, eu mostro só a palavra que precisa corrigir.</span>'+
     '</div>'+
   '</article>'
 ).join('');

 const scramble0=shuffleWords('This is my father',5).map(w=>'<button type="button" data-word="'+esc(w)+'">'+esc(w)+'</button>').join('');
 const scramble1=shuffleWords('I have one daughter',9).map(w=>'<button type="button" data-word="'+esc(w)+'">'+esc(w)+'</button>').join('');

 m.innerHTML=
 '<section class="methodsLessonV42 methodsLessonV99 methodsLessonV100 methodsLessonV103 lesson-tone-0">'+
   '<div class="methodsLessonHeroV99 methodsLessonHeroV100 methodsLessonHeroV103">'+
     '<span class="methodsLessonBlockV99">BLOCO 1 · família</span>'+
     '<small>AULA 2 DE 40 · UM PASSO A MAIS</small>'+
     '<h2>família · parte 2</h2>'+
     '<p>Continue com novos membros da família, pequenas combinações, fala e revisão.</p>'+
     '<i class="methodPilotProgressV100"><u style="width:0%"></u></i>'+
   '</div>'+
   '<section class="methodWarmupV103">'+
     '<header><small>PASSO 1</small><b>Novas palavras</b><span>Toque para ouvir e marque o que já praticou.</span></header>'+
     '<div class="methodWordGridV103">'+wordsHtml+'</div>'+
   '</section>'+
   '<section class="methodMiniPhraseV103">'+
     '<header><small>PASSO 2</small><b>Junte as palavras</b><span>Agora forme pequenos grupos de sentido.</span></header>'+
     '<div>'+miniHtml+'</div>'+
   '</section>'+
   '<section class="methodPracticeTitleV103">'+
     '<small>PASSO 3</small><b>Frases completas</b><span>Ouça e fale. A dificuldade sobe só um pouquinho.</span>'+
   '</section>'+
   '<div class="methodsInteractiveCardsV100 methodsInteractiveCardsV103">'+phrasesHtml+'</div>'+
   '<section class="methodReviewV100 methodReviewV103">'+
     '<header><span>🧠 REVISÃO DA AULA</span><b>Vamos confirmar o que ficou</b><small class="methodReviewScoreV100">0/4 concluídos</small></header>'+
     '<div class="methodReviewLockV100">Revisão disponível · falas praticadas: 0/3</div>'+
     '<div class="methodReviewBodyV100">'+
       '<div class="methodReviewChallengeV100 methodScrambleV103" data-review="0">'+
         '<small>DESAFIO 1 · MONTE A FRASE</small><b>Monte: “Este é meu pai.”</b>'+
         '<div class="methodScrambleAnswerV103" data-scramble-answer="0"></div>'+
         '<div class="methodScrambleWordsV103" data-scramble="0">'+scramble0+'</div>'+
         '<span class="methodReviewFeedbackV100"></span>'+
       '</div>'+
       '<div class="methodReviewChallengeV100 methodScrambleV103" data-review="1">'+
         '<small>DESAFIO 2 · MONTE A FRASE</small><b>Monte: “Eu tenho uma filha.”</b>'+
         '<div class="methodScrambleAnswerV103" data-scramble-answer="1"></div>'+
         '<div class="methodScrambleWordsV103" data-scramble="1">'+scramble1+'</div>'+
         '<span class="methodReviewFeedbackV100"></span>'+
       '</div>'+
       '<div class="methodReviewChallengeV100" data-review="2">'+
         '<small>DESAFIO 3 · ESCUTA</small><b>Ouça e escolha a frase correta.</b>'+
         '<button class="methodReviewListenV100" data-review-listen>'+earIcon+'<span>Ouvir frase</span></button>'+
         '<div class="methodReviewOptionsV100">'+
           '<button data-review-choice="2|wrong">This is my father.</button>'+
           '<button data-review-choice="2|right">My parents are here.</button>'+
           '<button data-review-choice="2|wrong">I have one daughter.</button>'+
         '</div>'+
         '<span class="methodReviewFeedbackV100"></span>'+
       '</div>'+
       '<div class="methodReviewChallengeV100" data-review="3">'+
         '<small>DESAFIO 4 · FALA FINAL</small><b>Fale a frase inteira:</b>'+
         '<strong class="methodReviewTargetV103">I have one daughter.</strong>'+
         '<button class="methodReviewSpeakV100" data-review-speak>'+micIcon+'<span>Falar agora</span></button>'+
         '<span class="methodReviewFeedbackV100"></span>'+
       '</div>'+
     '</div>'+
   '</section>'+
   '<footer>'+
     '<button class="robot lessonTutorV106">✦ Conversar com o professor desta aula</button>'+
     '<small class="lessonTutorHintV106">A conversa fica somente no conteúdo da Aula 2.</small>'+
     '<button class="finish" disabled>✓ Concluir aula</button>'+
   '</footer>'+
 '</section>';

 const playLessonAudio=async function(text,button){
   if(button&&button.dataset.playing==='1')return;
   if(button){button.dataset.playing='1';button.classList.add('playing');}
   try{window.stopGeminiTTS?.();await speak(text)}
   finally{if(button){button.dataset.playing='0';button.classList.remove('playing')}}
 };

 m.querySelectorAll('[data-word-listen]').forEach((b,i)=>b.onclick=()=>{b.classList.add('activityDoneV108');markFamilyActivityV107('word-'+i);playLessonAudio(words[i][0],b)});
 m.querySelectorAll('[data-mini-listen]').forEach((b,i)=>b.onclick=()=>{b.classList.add('activityDoneV108');markFamilyActivityV107('mini-'+i);playLessonAudio(mini[i][0],b)});
 m.querySelectorAll('[data-pilot-listen]').forEach((b,i)=>b.onclick=()=>{b.classList.add('activityDoneV108');markFamilyActivityV107('phrase-listen-'+i);playLessonAudio(phrases[i][0],b)});
 m.querySelectorAll('[data-pilot-speak]').forEach((b,i)=>b.onclick=()=>{
   const feedback=m.querySelector('[data-pilot-feedback="'+i+'"]');
   methodSpeakPractice(phrases[i][0],b,feedback,()=>{
     methodPilotRuntime.spoken.add(i);
     b.classList.add('activityDoneV108');
     b.closest('article')?.classList.add('activityDoneV108');
     markFamilyActivityV107('phrase-speak-'+i);
     updateFamilyPilotProgress();
   });
 });

 const scrambleTargets=['This is my father','I have one daughter'];
 m.querySelectorAll('[data-scramble]').forEach(box=>{
   const q=Number(box.dataset.scramble);
   const challenge=box.closest('.methodReviewChallengeV100');
   const answer=m.querySelector('[data-scramble-answer="'+q+'"]');
   const feedback=challenge.querySelector('.methodReviewFeedbackV100');
   const targetWords=scrambleTargets[q].split(' ');
   methodPilotRuntime.scramble[q]=[];

   const evaluate=()=>{
     const items=methodPilotRuntime.scramble[q];
     const complete=items.length===targetWords.length;
     const built=items.map(x=>x.word).join(' ');
     const exact=complete&&normalizeSpeech(built)===normalizeSpeech(scrambleTargets[q]);
     answer.querySelectorAll('button').forEach((ab,index)=>{
       const right=normalizeSpeech(ab.textContent)===normalizeSpeech(targetWords[index]||'');
       ab.classList.toggle('correct-word',right);
       ab.classList.toggle('wrong-word',complete&&!right);
     });
     challenge.classList.toggle('passed',exact);
     challenge.classList.toggle('has-errors',complete&&!exact);
     if(exact){
       methodPilotRuntime.review.add(q);
       markFamilyReviewV107(q);
       feedback.textContent='✅ Perfeito! Frase montada corretamente.';
     }else{
       methodPilotRuntime.review.delete(q);
       feedback.textContent=complete?'🔴 Só as palavras em vermelho estão fora do lugar. Toque nelas para trocar.':'';
     }
     updateFamilyReviewFinish();
   };
   const redraw=()=>{
     answer.innerHTML='';
     methodPilotRuntime.scramble[q].forEach((item,index)=>{
       const ab=document.createElement('button');
       ab.type='button';ab.textContent=item.word;
       ab.onclick=()=>{
         if(methodPilotRuntime.review.has(q))return;
         const current=methodPilotRuntime.scramble[q][index];
         if(current?.btn)current.btn.disabled=false;
         methodPilotRuntime.scramble[q].splice(index,1);
         redraw();
       };
       answer.appendChild(ab);
     });
     evaluate();
   };
   box.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
     if(methodPilotRuntime.review.has(q)||btn.disabled||methodPilotRuntime.scramble[q].length>=targetWords.length)return;
     methodPilotRuntime.scramble[q].push({word:btn.dataset.word,btn});
     btn.disabled=true;
     redraw();
   });
 });

 const reviewListen=m.querySelector('[data-review-listen]');
 reviewListen.onclick=()=>playLessonAudio('My parents are here.',reviewListen);

 m.querySelectorAll('[data-review-choice]').forEach(btn=>btn.onclick=()=>{
   const [q,result]=btn.dataset.reviewChoice.split('|');
   const box=btn.closest('.methodReviewChallengeV100');
   const feedback=box.querySelector('.methodReviewFeedbackV100');
   const options=box.querySelectorAll('.methodReviewOptionsV100 button');
   options.forEach(x=>{if(!x.classList.contains('reviewCorrectV106'))x.classList.remove('reviewWrongV106')});
   if(result==='right'){
     methodPilotRuntime.review.add(Number(q));
     markFamilyReviewV107(Number(q));
     box.classList.add('passed','reviewSuccessV106');
     btn.classList.add('reviewCorrectV106');
     feedback.innerHTML='<b>✓ Muito bem!</b><span>Você escolheu a frase correta.</span>';
     feedback.className='methodReviewFeedbackV100 reviewFeedbackGoodV106';
     options.forEach(x=>x.disabled=true);
   }else{
     btn.classList.add('reviewWrongV106');
     feedback.innerHTML='<b>✕ Não foi essa.</b><span>Tente outra opção.</span>';
     feedback.className='methodReviewFeedbackV100 reviewFeedbackBadV106';
   }
   updateFamilyReviewFinish();
 });

 const reviewSpeak=m.querySelector('[data-review-speak]');
 reviewSpeak.onclick=()=>{
   const challenge=reviewSpeak.closest('.methodReviewChallengeV100');
   const feedback=challenge.querySelector('.methodReviewFeedbackV100');
   methodSpeakPractice('I have one daughter.',reviewSpeak,feedback,()=>{
     methodPilotRuntime.review.add(3);
     markFamilyReviewV107(3);
     challenge.classList.add('passed','finalSpeechSuccessV106');
     feedback.innerHTML='<b>✓ Excelente!</b><span>Você falou a frase corretamente.</span>';
     feedback.className='methodReviewFeedbackV100 good finalSpeechFeedbackV106';
     updateFamilyReviewFinish();
   });
 };

 m.querySelector('.robot').onclick=()=>startLessonTutorSphere(id,n,t);
 m.querySelector('.finish').onclick=()=>{
   if(methodPilotRuntime.review.size<4)return;
   complete(id,n);
   openLesson(id,n+1);
 };
 updateFamilyPilotProgress();
}

function teacherModeV109(){
 try{return JSON.parse(localStorage.getItem('meuInglesStableV2')||'{}')?.teacher||'media'}catch{return'media'}
}
function isCalmTutorV109(){return teacherModeV109()==='leve'}

const CALM_TUTOR_LINES_V109={
 opening:[
  'Boa. Vamos fazer uma revisão rápida desta aula.',
  'Beleza. Vamos revisar só o que você acabou de estudar.',
  'Muito bem. Agora vamos conferir o que ficou desta aula.',
  'Ótimo. Vamos fazer uma revisão curta antes de seguir.',
  'Perfeito. Agora é só revisar um pouquinho.',
  'Vamos nessa. Uma revisão rápida e a gente fecha esta aula.',
  'Certo. Vamos confirmar o que você aprendeu agora.',
  'Tranquilo. Vamos revisar esta aula sem enrolar.'
 ],
 closing:[
  'Boa. Revisão concluída. Agora vamos para a próxima aula.',
  'Muito bem. Fechamos esta aula. Pode seguir para a próxima.',
  'Ótimo trabalho. Essa aula terminou. Vamos avançar.',
  'Mandou bem. Revisão feita. Agora é hora da próxima aula.',
  'Perfeito. Essa parte está concluída. Vamos seguir.',
  'Certo. Terminamos por aqui. Próxima aula.',
  'Boa. Você fechou esta etapa. Agora vamos avançar.',
  'Muito bem. Aula revisada. Vamos para a próxima.'
 ],
 encouragement:[
  'Boa, continua assim.',
  'Muito bem, segue nessa.',
  'Isso aí, vamos em frente.',
  'Mandou bem, continua.',
  'Perfeito, segue o jogo.',
  'Ótimo, vamos continuar.',
  'Boa, está no caminho certo.',
  'Muito bom, vamos adiante.'
 ],
 transition:[
  'Beleza, vamos para a próxima.',
  'Certo, seguimos.',
  'Boa, próxima etapa.',
  'Perfeito, vamos adiante.',
  'Tudo certo, pode continuar.',
  'Ótimo, vamos para mais uma.',
  'Fechado, seguimos daqui.',
  'Vamos nessa, próxima.'
 ],
 retry:[
  'Quase. Tenta mais uma vez.',
  'Tá perto. Vamos de novo.',
  'Sem problema. Repete mais uma vez.',
  'Quase lá. Faz mais uma tentativa.',
  'Vamos outra vez, com calma.',
  'Tenta de novo. Você consegue.'
 ]
};
const CALM_BANK_EXPRESSIONS_V112=[
 'boa','beleza','muito bem','ótimo','otimo','perfeito','mandou bem',
 'continua assim','vamos seguir','vamos em frente','próxima aula','proxima aula',
 'tenta de novo','mais uma vez','quase','sem problema','você consegue','voce consegue',
 'vamos continuar','vamos avançar','vamos avancar','isso aí','isso ai'
];

function normalizeBankTextV112(s){
 return String(s||'')
   .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
   .toLowerCase().replace(/[^a-z0-9 ]/g,' ')
   .replace(/\s+/g,' ').trim();
}
function analyzeLiveOutputV112(text){
 const norm=normalizeBankTextV112(text);
 if(!norm)return{words:0,hits:0,matches:[]};
 const words=norm.split(' ').filter(Boolean).length;
 const matches=[];
 for(const raw of CALM_BANK_EXPRESSIONS_V112){
   const exp=normalizeBankTextV112(raw);
   if(exp&&norm.includes(exp)&&!matches.includes(exp))matches.push(exp);
 }
 return{words,hits:matches.length,matches};
}


function tutorLinePickV109(group){
 const arr=CALM_TUTOR_LINES_V109[group]||[];
 if(!arr.length)return'';
 const key='miTutorLineV109:'+group;
 let i=0;
 try{i=Number(localStorage.getItem(key)||0)||0}catch{}
 const text=arr[i%arr.length];
 try{localStorage.setItem(key,String((i+1)%arr.length))}catch{}
 return text;
}

function ensureTutorCacheBadgeV109(){
 if(!session||!isCalmTutorV109())return null;
 let el=document.querySelector('.tutorCacheDebugV109');
 if(!el){
   el=document.createElement('div');
   el.className='tutorCacheDebugV109';
   el.innerHTML=
     '<b>PROTÓTIPO · Tranquilo</b>'+
     '<span data-cache-status>monitorando</span>'+
     '<small><i data-bank-played>Banco tocado 0</i><i data-cache-count>Cache real 0</i><i data-live-count>Live falas 0</i><i data-live-words>Live palavras 0</i><i data-bank-count>Banco detectado 0</i><i data-api-count>API 2.5 0</i></small>'+
     '<button type="button" data-cache-test>Testar CACHE</button>';
   document.body.appendChild(el);
   el.querySelector('[data-cache-test]').onclick=async e=>{
     e.preventDefault();e.stopPropagation();
     const btn=e.currentTarget;
     btn.disabled=true;
     flashTutorSourceV109('testando...','');
     try{await playTutorCacheLineV109('encouragement')}finally{btn.disabled=false}
   };
 }
 const ch=session.cacheHits||0,lv=session.liveTurns||0,lw=session.liveWords||0,bh=session.bankHits||0,bp=session.bankPlayed||0,ap=session.apiTts||0;
 el.querySelector('[data-bank-played]').textContent='Banco tocado '+bp;
 el.querySelector('[data-cache-count]').textContent='Cache real '+ch;
 el.querySelector('[data-live-count]').textContent='Live falas '+lv;
 el.querySelector('[data-live-words]').textContent='Live palavras '+lw;
 el.querySelector('[data-bank-count]').textContent='Banco detectado '+bh;
 el.querySelector('[data-api-count]').textContent='API 2.5 '+ap;
 el.style.display='block';
 return el;
}

function flashTutorSourceV109(label,kind){
 const el=ensureTutorCacheBadgeV109();
 if(!el)return;
 const s=el.querySelector('[data-cache-status]');
 s.textContent=label;
 el.classList.remove('is-cache','is-live','is-api');
 el.classList.add(kind);
 clearTimeout(el._flashTimer);
 el._flashTimer=setTimeout(()=>{
   s.textContent='monitorando';
   el.classList.remove('is-cache','is-live','is-api');
 },1800);
}

async function playTutorCacheLineV109(group){
 if(!isCalmTutorV109())return false;
 const text=tutorLinePickV109(group);
 if(!text)return false;
 ensureTutorCacheBadgeV109();
 try{
   await window.geminiSpeak?.(text,'pt-BR');
   return true;
 }catch{return false}
}

function preloadTutorCachePilotV109(){
 if(!isCalmTutorV109()||typeof window.preloadGeminiTTS!=='function')return;
 const picks=[
   CALM_TUTOR_LINES_V109.opening[0],
   CALM_TUTOR_LINES_V109.closing[0],
   CALM_TUTOR_LINES_V109.encouragement[0],
   CALM_TUTOR_LINES_V109.transition[0],
   CALM_TUTOR_LINES_V109.retry[0]
 ].filter(Boolean);
 picks.forEach((text,i)=>setTimeout(()=>window.preloadGeminiTTS(text,'pt-BR').catch(()=>{}),180+i*250));
}

window.MeuInglesCacheToolV113=async function(fc){
 if(!session||!isCalmTutorV109()||String(fc?.name||'')!=='play_cached_teacher_phrase'){
   return{ok:false,reason:'cache_inactive'};
 }
 const allowed=new Set(['opening','encouragement','retry','transition','closing']);
 const requested=String(fc?.args?.category||'encouragement');
 const category=allowed.has(requested)?requested:'encouragement';
 session.bankPlayed=(session.bankPlayed||0)+1;
 saveSession();
 flashTutorSourceV109('⚡ BANCO · '+category,'is-cache');
 ensureTutorCacheBadgeV109();
 const ok=await playTutorCacheLineV109(category);
 return{ok:!!ok,category,played_locally:true,instruction:'Nao repita verbalmente esta reacao. Continue apenas com a proxima pergunta ou correcao especifica, se necessario.'};
};

async function startLessonTutorSphere(id,n,t){
 const lesson2=Number(n)===2;
 const allowedVocabulary=lesson2
   ?['father','parents','son','daughter','family','together']
   :['brother','sister','mother','I','have','one'];
 const allowedPhrases=lesson2
   ?['This is my father.','My parents are here.','I have one daughter.']
   :['I have one brother.','Do you have any sisters?','This is my mother.'];

 starting=true;
 session={
   themeId:id,
   lesson:n,
   mode:'lesson-only',
   reviewLesson:null,
   turns:0,
   tutorReviewTurns:0,
   tutorEnding:false,
   cacheHits:0,
   liveTurns:0,
   liveWords:0,
   bankHits:0,
   bankPlayed:0,
   apiTts:0,
   cachePilot:isCalmTutorV109(),
   booting:true,
   source:'lesson-tutor'
 };
 saveSession();
 closeScreen();
 window.stableShow?.('home');
 await wait(90);
 try{window.stopGeminiTTS?.()}catch{}

 if(isCalmTutorV109()){
   preloadTutorCachePilotV109();
 }

 await window.startV26LiveContext?.({
   kind:'method-lesson-only',
   cachePilot:isCalmTutorV109(),
   topic:t.title,
   lesson:'Aula '+n+' de 40',
   lessonTitle:title(t,n),
   exactLesson:n,
   maxReviewRounds:2,
   allowedVocabulary:allowedVocabulary.join(', '),
   allowedPhrases:allowedPhrases.join(' | '),
   instruction:
     'Você é o professor exclusivo da aula Família · Aula '+n+'. '+
     'Converse SOMENTE sobre o conteúdo desta aula. '+
     'Vocabulário permitido: '+allowedVocabulary.join(', ')+'. '+
     'Frases principais: '+allowedPhrases.join('; ')+'. '+
     'Você pode explicar significado, pronúncia, gramática básica dessas frases, pedir repetição, corrigir o aluno e criar pequenas variações usando apenas este conteúdo e parentesco básico diretamente ligado à aula. '+
     'Se o aluno tentar falar de viagem, futebol, notícias, outros módulos ou qualquer assunto fora desta aula, não siga o assunto. Diga de forma breve que nesta conversa vocês vão praticar somente esta aula e redirecione para uma palavra ou frase estudada. '+
     'Não avance para outra aula e não altere o progresso automaticamente. '+
     'Fale de forma curta, amigável e prática, fazendo o aluno participar.'
 });
 if(isCalmTutorV109()){
   setTimeout(()=>ensureTutorCacheBadgeV109(),120);
   setTimeout(()=>ensureTutorCacheBadgeV109(),700);
   setTimeout(async()=>{
     ensureTutorCacheBadgeV109();
     await playTutorCacheLineV109('opening');
   },1100);
 }
 session.booting=false;
 saveSession();
 starting=false;
 setTimeout(decoratePill,120);
 setTimeout(decoratePill,900);
}


async function returnToMethodLessonV108(){
 const live=window.MeuInglesGeminiLiveV38;
 try{await live?.stop?.()}catch{}
 try{window.stopGeminiTTS?.()}catch{}
 document.querySelector('.tutorCacheDebugV109')?.remove();
 if(screen){
   screenMode='study';
   screen.classList.add('open');
   document.body.classList.add('methodsLockV42');
   if(session?.themeId)active=session.themeId;
 }
 setTimeout(()=>screen?.querySelector('main')?.scrollTo?.({top:0,behavior:'smooth'}),40);
}

function finishLessonTutorV108(){
 if(!session||session.mode!=='lesson-only'||session.tutorEnding)return;
 session.tutorEnding=true;
 saveSession();

 if(isCalmTutorV109()){
   setTimeout(async()=>{
     const live=window.MeuInglesGeminiLiveV38;
     try{await live?.stop?.()}catch{}
     await playTutorCacheLineV109('closing');
     await returnToMethodLessonV108();
     if(done(session.themeId).has(Number(session.lesson))){
       view='theme';
       renderTheme(session.themeId);
       screen?.classList.add('open');
       document.body.classList.add('methodsLockV42');
     }
   },120);
   return;
 }

 setTimeout(()=>{
   const live=window.MeuInglesGeminiLiveV38;
   live?.sendText?.(
     'Finalize esta revisão agora em uma resposta curta. Diga que a revisão desta aula terminou, elogie de forma breve e diga que agora é hora de seguir para a próxima aula. Não faça nova pergunta.'
   );
   session.endAfterTutorTurn=true;
   saveSession();
 },80);
}

function openLesson(id,n){
 view='lesson';
 active=id;
 setCurrent(id,n);
 const t=theme(id),m=screen.querySelector('main'),rows=[0,1,2].map(i=>t.examples[(n+i)%t.examples.length]);
 const groupIndex=Math.floor((n-1)/4);
 const blockName=t.stages[groupIndex]||t.title;
 screen.querySelector('h2').textContent=`${t.title} · Aula ${n}`;
 screen.querySelector('header span').textContent=`${n}/40`;
 if(id==='familia'&&Number(n)===1){
   renderFamilyPilotLesson(id,n,t,rows,m);
   return;
 }
 if(id==='familia'&&Number(n)===2){
   renderFamilyLesson2(id,n,t,m);
   return;
 }
 m.innerHTML=`
   <section class="methodsLessonV42 methodsLessonV99 lesson-tone-${groupIndex%10}">
     <div class="methodsLessonHeroV99">
       <span class="methodsLessonBlockV99">BLOCO ${groupIndex+1} · ${esc(blockName)}</span>
       <small>AULA ${n} DE 40</small>
       <h2>${esc(title(t,n))}</h2>
       <p>Treino de vocabulário e conversação sobre ${esc(t.title)}.</p>
       <i><u style="width:${Math.round(n/40*100)}%"></u></i>
     </div>
     <div class="methodsLessonCardsV99">
       ${rows.map((r,i)=>`
         <article>
           <span class="methodsPhraseIndexV99">${i+1}</span>
           <div class="methodsPhraseCopyV99">
             <b>${esc(r[0])}</b>
             <span>${esc(r[1])}</span>
           </div>
           <button data-speak="${i}">🔊 Ouvir</button>
         </article>`).join('')}
     </div>
     <footer>
       <button class="robot">🤖 Aula particular com o robô</button>
       <button class="finish">✓ Concluir aula</button>
     </footer>
   </section>`;
 m.querySelectorAll('[data-speak]').forEach((b,i)=>b.onclick=()=>speak(rows[i][0]));
 m.querySelector('.robot').onclick=()=>startMethodSphere(id,n,'lesson');
 m.querySelector('.finish').onclick=()=>{complete(id,n);n<40?openLesson(id,n+1):renderTheme(id)};
}
async function speak(text){try{await window.geminiSpeak?.(text,'en-US','Achird')}catch{}}
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
   cacheHits:0,
   liveTurns:0,
   liveWords:0,
   bankHits:0,
   bankPlayed:0,
   apiTts:0,
   cachePilot:isCalmTutorV109(),
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
 if(isCalmTutorV109()){
   setTimeout(()=>ensureTutorCacheBadgeV109(),120);
   setTimeout(()=>ensureTutorCacheBadgeV109(),700);
 }
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

 if(session.mode==='lesson-only'){
   session.tutorReviewTurns=(session.tutorReviewTurns||0)+1;
   saveSession();
   if(session.tutorReviewTurns>=2)finishLessonTutorV108();
   return;
 }

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
function decoratePill(){
 if(!session)return;
 const p=document.querySelector('#homeTopicPill');
 if(!p)return;
 const t=theme(session.themeId);
 if(session.mode==='lesson-only'){
   p.textContent='← Voltar para '+t.title+' · Aula '+session.lesson;
   p.classList.add('methodSessionPill','lessonTutorBackV108');
   p.onclick=async e=>{e.preventDefault();e.stopPropagation();await returnToMethodLessonV108()};
   return;
 }
 const label=session.mode==='review'?`Revisão · Aula ${session.lesson}`:session.mode==='pending'?`Continuar ou revisar`:`Aula ${session.lesson}/40`;
 p.textContent=`← ${t.title} · ${label}`;
 p.classList.add('methodSessionPill');
 p.onclick=e=>{e.preventDefault();e.stopPropagation();openConversationMethods()};
}
function wrap(){
 if(window.__methodsV42Wrapped)return;
 const close=window.closeV26Conversation,start=window.startV26Conversation;
 if(typeof close==='function')window.closeV26Conversation=function(...a){const r=close.apply(this,a);document.querySelector('.tutorCacheDebugV109')?.remove();if(session)clearSession();setTimeout(ensureUI,0);return r};
 if(typeof start==='function')window.startV26Conversation=async function(...a){const r=await start.apply(this,a);setTimeout(ensureUI,0);return r};
 window.addEventListener('meu-ingles-live-user-turn',e=>handleLiveMethodInput(e?.detail?.text||''));
 window.addEventListener('meu-ingles-tts-source',e=>{
   if(!session||!isCalmTutorV109())return;
   if(e?.detail?.source==='cache'){
     session.cacheHits=(session.cacheHits||0)+1;
     flashTutorSourceV109('⚡ CACHE','is-cache');
   }else if(e?.detail?.source==='api'){
     session.apiTts=(session.apiTts||0)+1;
     flashTutorSourceV109('☁ API 2.5','is-api');
   }
   saveSession();
   ensureTutorCacheBadgeV109();
 });
 window.addEventListener('meu-ingles-live-output-turn',e=>{
   if(!session||!isCalmTutorV109())return;
   const a=analyzeLiveOutputV112(e?.detail?.text||'');
   session.liveWords=(session.liveWords||0)+a.words;
   session.bankHits=(session.bankHits||0)+a.hits;
   saveSession();
   if(a.hits>0){
     flashTutorSourceV109('◇ BANCO '+a.hits+' possível','is-bank');
   }
   ensureTutorCacheBadgeV109();
 });
 window.addEventListener('meu-ingles-live-turn-complete',()=>{
   if(session&&isCalmTutorV109()&&!session.endAfterTutorTurn){
     session.liveTurns=(session.liveTurns||0)+1;
     saveSession();
     flashTutorSourceV109('● LIVE 3.1','is-live');
     ensureTutorCacheBadgeV109();
   }
   if(!session||session.mode!=='lesson-only'||!session.endAfterTutorTurn)return;
   session.endAfterTutorTurn=false;
   saveSession();
   setTimeout(async()=>{
     await returnToMethodLessonV108();
     if(done(session.themeId).has(Number(session.lesson))){
       view='theme';
       renderTheme(session.themeId);
       screen?.classList.add('open');
       document.body.classList.add('methodsLockV42');
     }
   },3800);
 });
 window.__methodsV42Wrapped=true;
}
function init(){wrap();ensureUI();document.addEventListener('click',e=>{if(!starting&&e.target.closest('#home .homeConversationChoice[data-v26mode="free"]')){document.querySelector('.tutorCacheDebugV109')?.remove();clearSession()}});window.addEventListener('pageshow',()=>setTimeout(ensureUI,50));document.addEventListener('visibilitychange',()=>!document.hidden&&setTimeout(ensureUI,50));setTimeout(ensureUI,300)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,420),{once:true}):setTimeout(init,420);
})();
