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
     feedback.innerHTML='<b>Quase. Ajuste só esta parte:</b><div class="methodWordDiffV103">'+diff.html+'</div><span>Tente novamente: '+esc(words)+'</span>';
     feedback.className='methodSpeakFeedbackV100 bad';
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
 const progress=document.querySelector('.methodPilotProgressV100 u');
 if(progress)progress.style.width=(spoken/total*100)+'%';
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
 }
}

function renderFamilyPilotLesson(id,n,t,rows,m){
 const words=familyLessonWords();
 const mini=familyMiniPhrases();
 const phrases=[
   ['I have one brother.','Eu tenho um irmão.'],
   ['Do you have any sisters?','Você tem irmãs?'],
   ['This is my mother.','Esta é minha mãe.']
 ];
 methodPilotRuntime={spoken:new Set(),review:new Set(),requiredSpeak:3,scramble:{}};

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
     '<button class="robot">🤖 Aula particular com o robô</button>'+
     '<button class="finish" disabled>✓ Concluir aula</button>'+
   '</footer>'+
 '</section>';

 m.querySelectorAll('[data-pilot-speak]').forEach(function(b,i){
   b.onclick=function(){
     const feedback=m.querySelector('[data-pilot-feedback="'+i+'"]');
     methodSpeakPractice(phrases[i][0],b,feedback,function(){
       methodPilotRuntime.spoken.add(i);
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

 m.querySelectorAll('[data-word-listen]').forEach(function(b,i){b.onclick=function(){playLessonAudio(words[i][0],b);};});
 m.querySelectorAll('[data-mini-listen]').forEach(function(b,i){b.onclick=function(){playLessonAudio(mini[i][0],b);};});
 m.querySelectorAll('[data-pilot-listen]').forEach(function(b,i){b.onclick=function(){playLessonAudio(phrases[i][0],b);};});

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
     if(result==='right'){
       methodPilotRuntime.review.add(Number(q));
       box.classList.add('passed');
       feedback.textContent='✅ Certo!';
       box.querySelectorAll('.methodReviewOptionsV100 button').forEach(function(x){x.disabled=true;});
     }else{
       feedback.textContent='🔁 Tente outra opção.';
     }
     updateFamilyReviewFinish();
   };
 });

 const reviewSpeak=m.querySelector('[data-review-speak]');
 reviewSpeak.onclick=function(){
   const feedback=reviewSpeak.parentElement.querySelector('.methodReviewFeedbackV100');
   methodSpeakPractice('This is my mother.',reviewSpeak,feedback,function(){
     methodPilotRuntime.review.add(3);
     reviewSpeak.parentElement.classList.add('passed');
     updateFamilyReviewFinish();
   });
 };

 m.querySelector('.robot').onclick=function(){startMethodSphere(id,n,'lesson');};
 m.querySelector('.finish').onclick=function(){
   if(methodPilotRuntime.review.size<4)return;
   complete(id,n);
   openLesson(id,n+1);
 };
 updateFamilyPilotProgress();
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
