(()=>{
'use strict';
const KEY='meuInglesStableV2';
const oldOpen=window.openStableLesson,oldModule=window.openStableModule;
let run=null;

const MODULE_TITLES=[
 'Rotina em movimento','Histórias do passado','Planos e futuro','Comparando coisas',
 'Viagem e hotel','Saúde e bem-estar','Trabalho e estudo','Experiências de vida',
 'Serviços e problemas','Contando uma história','Vida social','Projeto A2: viagem completa'
];

const RAW=[
 [
  '⏰|I usually wake up at seven.|Eu geralmente acordo às sete.|Minha rotina de manhã',
  '🚌|I take the bus to work.|Eu vou de ônibus para o trabalho.|Indo para o trabalho',
  '💻|I am working from home today.|Hoje estou trabalhando de casa.|Hoje é diferente',
  '🍽️|I often have lunch at noon.|Eu frequentemente almoço ao meio-dia.|Hora do almoço',
  '🏠|I get home around six.|Eu chego em casa por volta das seis.|Voltando para casa',
  '🍳|I do not usually cook on weekdays.|Eu normalmente não cozinho nos dias úteis.|Durante a semana',
  '❓|What time do you start work?|Que horas você começa a trabalhar?|Perguntando horários',
  '🌙|I go to bed later on weekends.|Eu vou dormir mais tarde nos fins de semana.|Fim de semana'
 ],
 [
  '👨‍👩‍👧|I visited my family last weekend.|Eu visitei minha família no fim de semana passado.|Fim de semana passado',
  '🎬|We watched a movie yesterday.|Nós assistimos a um filme ontem.|Ontem à noite',
  '🚫|I did not go out last night.|Eu não saí ontem à noite.|Forma negativa',
  '❓|Did you enjoy the trip?|Você gostou da viagem?|Pergunta no passado',
  '📱|She bought a new phone.|Ela comprou um celular novo.|Algo que aconteceu',
  '⏳|They arrived late.|Eles chegaram tarde.|Chegando atrasado',
  '😴|I was tired after work.|Eu estava cansado depois do trabalho.|Como eu estava',
  '🍝|We had dinner together.|Nós jantamos juntos.|Terminando a história'
 ],
 [
  '🗓️|I am going to travel next month.|Eu vou viajar no próximo mês.|Plano marcado',
  '📞|I will call you later.|Eu vou te ligar mais tarde.|Decisão rápida',
  '🏠|We are going to stay at a hotel.|Nós vamos ficar em um hotel.|Onde vamos ficar',
  '☀️|It will be sunny tomorrow.|Vai fazer sol amanhã.|Previsão',
  '🎓|She is going to study tonight.|Ela vai estudar hoje à noite.|Plano de estudo',
  '🤝|I will help you with that.|Eu vou te ajudar com isso.|Oferecendo ajuda',
  '❓|What are you going to do this weekend?|O que você vai fazer neste fim de semana?|Perguntando planos',
  '✈️|Our flight leaves at nine.|Nosso voo sai às nove.|Horário futuro'
 ],
 [
  '📏|This room is bigger than that one.|Este quarto é maior do que aquele.|Maior ou menor',
  '💰|The bus is cheaper than the taxi.|O ônibus é mais barato que o táxi.|Comparando preços',
  '⚡|My new phone is faster.|Meu celular novo é mais rápido.|Mais rápido',
  '😊|This restaurant is better.|Este restaurante é melhor.|Melhor opção',
  '🚗|The train is more comfortable than the bus.|O trem é mais confortável que o ônibus.|Mais confortável',
  '📦|This bag is too heavy.|Esta bolsa é pesada demais.|Muito pesado',
  '🏨|Which hotel is closer?|Qual hotel é mais perto?|Qual é melhor',
  '🌆|Rio is busier in the summer.|O Rio fica mais movimentado no verão.|Comparando épocas'
 ],
 [
  '🛎️|I have a reservation.|Eu tenho uma reserva.|Chegando ao hotel',
  '🪪|Can I see your passport?|Posso ver seu passaporte?|No check-in',
  '🛏️|Is breakfast included?|O café da manhã está incluído?|Pergunta no hotel',
  '🧳|Where can I leave my luggage?|Onde posso deixar minha bagagem?|Guardando bagagem',
  '🔑|The key card is not working.|O cartão-chave não está funcionando.|Problema no quarto',
  '🚿|There is no hot water.|Não tem água quente.|Reclamando de um problema',
  '🗺️|How do I get to the city center?|Como eu chego ao centro da cidade?|Pedindo direção',
  '🕚|What time is check-out?|Que horas é o check-out?|Saindo do hotel'
 ],
 [
  '🤒|I do not feel well.|Eu não estou me sentindo bem.|Não estou bem',
  '🤕|I have a headache.|Estou com dor de cabeça.|Descrevendo um sintoma',
  '💊|You should take this medicine.|Você deveria tomar este remédio.|Dando conselho',
  '🛌|You need to rest.|Você precisa descansar.|O que fazer',
  '🥤|Drink plenty of water.|Beba bastante água.|Cuidando da saúde',
  '🏥|Where is the nearest pharmacy?|Onde fica a farmácia mais próxima?|Procurando ajuda',
  '📅|I have a doctor appointment tomorrow.|Eu tenho consulta médica amanhã.|Consulta marcada',
  '🙂|I feel much better today.|Hoje eu me sinto muito melhor.|Estou melhor'
 ],
 [
  '💼|I work for a small company.|Eu trabalho para uma empresa pequena.|Falando do trabalho',
  '🕘|I start work at nine.|Eu começo a trabalhar às nove.|Horário de trabalho',
  '📧|I need to send an email.|Eu preciso enviar um e-mail.|Tarefa do trabalho',
  '📚|I am studying for a test.|Eu estou estudando para uma prova.|Estudando agora',
  '🧑‍🏫|The class starts at eight.|A aula começa às oito.|Horário da aula',
  '📝|I have to finish this report.|Eu tenho que terminar este relatório.|Obrigação',
  '🤝|Can you help me with this project?|Você pode me ajudar com este projeto?|Pedindo ajuda',
  '🎯|I want to improve my English for work.|Eu quero melhorar meu inglês para o trabalho.|Meu objetivo'
 ],
 [
  '🌍|I have been to São Paulo twice.|Eu já fui a São Paulo duas vezes.|Experiência de viagem',
  '🍣|I have never tried sushi.|Eu nunca experimentei sushi.|Algo que nunca fiz',
  '🎤|Have you ever sung in public?|Você já cantou em público?|Você já fez isso?',
  '✈️|She has traveled abroad.|Ela já viajou para o exterior.|Experiência dela',
  '🎓|I have learned a lot this year.|Eu aprendi muito este ano.|O que aprendi',
  '🏃|We have already finished.|Nós já terminamos.|Já terminou',
  '⌛|I have not seen that movie yet.|Eu ainda não vi esse filme.|Ainda não',
  '⭐|It was one of my best experiences.|Foi uma das minhas melhores experiências.|Avaliando a experiência'
 ],
 [
  '📱|My phone is not working.|Meu celular não está funcionando.|Problema com o celular',
  '📶|The internet is very slow.|A internet está muito lenta.|Internet lenta',
  '💳|My card was declined.|Meu cartão foi recusado.|Problema no pagamento',
  '📦|My order has not arrived.|Meu pedido não chegou.|Pedido atrasado',
  '🔧|Can you fix this today?|Você pode consertar isso hoje?|Pedindo conserto',
  '🧾|I would like a refund.|Eu gostaria de um reembolso.|Pedindo reembolso',
  '☎️|I need to speak to customer service.|Eu preciso falar com o atendimento ao cliente.|Falando com suporte',
  '✅|Thank you for solving the problem.|Obrigado por resolver o problema.|Problema resolvido'
 ],
 [
  '▶️|First, we went to the beach.|Primeiro, nós fomos à praia.|Começando uma história',
  '➡️|Then, we had lunch.|Depois, nós almoçamos.|Continuando',
  '🌧️|Suddenly, it started to rain.|De repente, começou a chover.|Algo inesperado',
  '🏃|So we ran back to the hotel.|Então corremos de volta para o hotel.|O que aconteceu depois',
  '😄|Luckily, the rain stopped.|Felizmente, a chuva parou.|Mudança na história',
  '🌇|After that, we walked downtown.|Depois disso, caminhamos pelo centro.|Mais um acontecimento',
  '📸|We took a lot of pictures.|Nós tiramos muitas fotos.|Detalhe da história',
  '🏁|Finally, we went back home.|Finalmente, voltamos para casa.|Terminando a história'
 ],
 [
  '👋|Would you like to come with us?|Você gostaria de vir com a gente?|Fazendo um convite',
  '😊|That sounds great.|Isso parece ótimo.|Aceitando',
  '🙏|Thanks for inviting me.|Obrigado por me convidar.|Agradecendo',
  '🚫|Sorry, I cannot make it tonight.|Desculpe, não consigo ir hoje à noite.|Recusando com educação',
  '📅|Are you free on Saturday?|Você está livre no sábado?|Combinando um dia',
  '🕗|Let us meet at eight.|Vamos nos encontrar às oito.|Marcando horário',
  '📍|Where should we meet?|Onde devemos nos encontrar?|Marcando lugar',
  '🎉|We had a great time.|Nós nos divertimos muito.|Depois do encontro'
 ],
 [
  '✈️|I am going to Rio next month.|Eu vou ao Rio no próximo mês.|Planejando a viagem',
  '🏨|I have booked a hotel near the beach.|Eu reservei um hotel perto da praia.|Hotel reservado',
  '🧳|I need to pack my suitcase.|Eu preciso arrumar minha mala.|Preparando a mala',
  '🛎️|I would like to check in, please.|Eu gostaria de fazer o check-in, por favor.|Chegando ao hotel',
  '🗺️|What is the best way to get downtown?|Qual é a melhor forma de chegar ao centro?|Se locomovendo',
  '🍽️|Can you recommend a good restaurant?|Você pode recomendar um bom restaurante?|Pedindo recomendação',
  '📸|Yesterday, I visited the main attractions.|Ontem, visitei as principais atrações.|Contando o passeio',
  '😊|It has been a fantastic trip.|Tem sido uma viagem fantástica.|Encerrando a viagem'
 ]
];

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const state=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
const parse=x=>{const [e,en,pt,title]=x.split('|');return{e,en,pt,title}};
const item=(m,n)=>RAW[m]?.[n]?parse(RAW[m][n]):null;
const done=(m,n)=>!!state().done?.[`A2-${m}-${n}`];
const progress=(m,n)=>{try{return window.getStableLessonProgress?.('A2',m,n)??(done(m,n)?100:0)}catch{return done(m,n)?100:0}};
const saveProgress=(m,n,p)=>{try{window.setStableLessonProgress?.('A2',m,n,p)}catch{}};
const unlocked=(m,n)=>n===0||done(m,n-1)||progress(m,n)>0;
const known=(m,n)=>{const a=[];for(let i=0;i<8;i++){const x=item(m,i);if(x&&i<=n)a.push(x)}if(m>0){for(let i=5;i<8;i++){const x=item(m-1,i);if(x)a.push(x)}}return a};
function makeOptions(correct,pool){
 const c=String(correct??'');
 const distractors=[...new Set((pool||[]).map(x=>String(x??'')).filter(x=>norm(x)&&norm(x)!==norm(c)))];
 return sh([c,...sh(distractors).slice(0,2)]);
}
const opts=(cur,m,n,field)=>{
 const pool=[...RAW[m].map(parse),...known(m,n)].filter(x=>x.en!==cur.en).map(x=>x[field]);
 return makeOptions(cur[field],pool);
};
function speak(t,lang='en-US'){try{return window.geminiSpeak?.(t,lang,state().voice||'Aoede')}catch{return Promise.resolve(false)}}
function feedback(ok){return ok?'Boa! Você acertou.':'Quase. Veja a resposta certa e tente de novo.'}

function lesson(m,n){
 const cur=item(m,n),prev=item(m,Math.max(0,n-1))||cur;
 const words=cur.en.replace(/[?.!,]/g,'').split(/\s+/);
 const moduleItems=RAW[m].map(parse);
 const previousModuleItems=m>0?RAW[m-1].map(parse):[];
 const gamePool=sh([cur,prev,...moduleItems,...previousModuleItems])
   .filter((x,i,a)=>a.findIndex(y=>norm(y.en)===norm(x.en))===i)
   .slice(0,3);
 return {title:cur.title,steps:[
  {t:'learn',x:cur},
  {t:'choice',q:`“${cur.en}” significa:`,ans:cur.pt,op:opts(cur,m,n,'pt'),audio:cur.en},
  {t:'choice',q:'Qual frase você ouviu?',ans:cur.en,op:opts(cur,m,n,'en'),audio:cur.en},
  {t:'build',q:'Monte a frase em inglês:',pt:cur.pt,target:words.join(' '),tokens:sh(words)},
  {t:'choice',q:`Como dizer “${cur.pt}” em inglês?`,ans:cur.en,op:opts(cur,m,n,'en')},
  {t:'game',items:gamePool},
  {t:'review',items:sh([cur,prev,...gamePool]).filter((x,i,a)=>a.findIndex(y=>y.en===x.en)===i).slice(0,3)}
 ]};
}

function shell(inner){
 const pct=Math.round((run.i+1)/run.lesson.steps.length*100);
 return `<div class="beginner14 a2CourseLesson tone-${run.m%6} module-${run.m}">
  <div class="b14Top"><button class="b14Back" onclick="a2ExitLesson()" aria-label="Voltar ao módulo">‹</button><div class="b14Progress"><span style="width:${pct}%"></span></div><button class="a2ExitLesson" onclick="a2ExitLesson()">Sair</button></div>
  <div class="b14Card"><div class="b14Eyebrow">A2 · MÓDULO ${run.m+1} · AULA ${run.n+1}</div>${inner}</div>
 </div>`;
}
const next=()=>`<div class="b14Footer"><button class="b14Next" onclick="a2Next()">Continuar</button></div>`;
function render(){
 const s=run.lesson.steps[run.i];let h='';
 if(s.t==='learn'){
  h=`<div class="b14Emoji">${s.x.e}</div><div class="b14Word">${esc(s.x.en)}</div><div class="b14Translation">${esc(s.x.pt)}</div><button class="b14Listen" onclick="a2Speak('${encodeURIComponent(s.x.en)}')">🔊 Ouvir</button>${next()}`;
 }else if(s.t==='choice'){
  h=`<h2>${esc(s.q)}</h2>${s.audio?`<button class="b14Listen" onclick="a2Speak('${encodeURIComponent(s.audio)}')">🔊 Ouvir</button>`:''}<div class="b14Choices">${s.op.map(o=>`<button class="b14Choice" data-a2-choice="${encodeURIComponent(o)}" onclick="a2Answer('${encodeURIComponent(o)}')">${esc(o)}</button>`).join('')}</div><div id="a2Feedback"></div>`;
 }else if(s.t==='build'){
  const ans=run.built.map((x,i)=>`<span class="b14Token ${run.checked?(norm(x)===norm(s.target.split(/\s+/)[i]||'')?'correct':'wrong'):''}">${esc(x)}</span>`).join('');
  h=`<h2>${esc(s.q)}</h2><div class="b14Translation" style="font-size:24px;color:#fff;font-weight:850">${esc(s.pt)}</div><div class="b14Answer">${ans||'<span style="color:#8198aa">Toque nas palavras</span>'}</div><div class="b14Bank">${s.tokens.map((x,i)=>`<button onclick="a2Pick(${i})" ${run.used.includes(i)?'disabled class="used"':''}>${esc(x)}</button>`).join('')}</div><div class="b14Actions"><button class="b14Clear" onclick="a2Clear()">Limpar</button><button class="b14Check" onclick="a2Check()">Verificar</button></div>${run.checked&&!run.ok?`<div class="b14CorrectOrder">Correto: ${esc(s.target)}</div>`:''}<div id="a2Feedback"></div>${run.checked&&run.ok?next():''}`;
 }else if(s.t==='game'){
  const q=s.items[run.gameIndex||0];
  if(!q){
   h=`<div class="a2GameWin"><div>🎮</div><h2>Desafio concluído!</h2><p>Você acertou ${run.gameScore||0} de ${s.items.length} rodadas.</p></div>${next()}`;
  }else{
   const moduleDistractors=RAW[run.m].map(parse).filter(x=>norm(x.en)!==norm(q.en)).map(x=>x.pt);
   const options=makeOptions(q.pt,moduleDistractors);
   h=`<div class="a2GameBadge">🎮 DESAFIO RÁPIDO · RODADA ${(run.gameIndex||0)+1}/${s.items.length}</div><h2>Escolha a tradução correta:</h2><div class="a2GamePrompt">${esc(q.en)}</div><div class="b14Choices">${options.map(o=>`<button class="b14Choice" data-a2-game="${encodeURIComponent(o)}" onclick="a2GameAnswer('${encodeURIComponent(o)}')">${esc(o)}</button>`).join('')}</div><div id="a2Feedback"></div>`;
  }
 }else{
  h=`<h2>Revisão do que você aprendeu</h2><div class="b14Review">${s.items.map(x=>`<button class="b14Mini" onclick="a2Speak('${encodeURIComponent(x.en)}')"><span>${x.e}</span><b>${esc(x.en)}</b><small>${esc(x.pt)}</small></button>`).join('')}</div><div class="b14Footer"><button class="b14Next" onclick="a2Finish()">Concluir aula · +40 XP</button></div>`;
 }
 $('#courseBody').innerHTML=shell(h);window.scrollTo(0,0);
 if(s.t==='learn')setTimeout(()=>speak(s.x.en),250);
 if(s.t==='choice'&&s.audio)setTimeout(()=>speak(s.audio),250);
}
window.a2Speak=e=>speak(decodeURIComponent(e));
window.a2ExitLesson=()=>{try{window.stopGeminiTTS?.()}catch{};try{window.speechSynthesis?.cancel?.()}catch{};if(run)openStableModule('A2',run.m)};
window.a2Next=()=>{run.i++;if(run.i>=run.lesson.steps.length)return finish();saveProgress(run.m,run.n,Math.round(run.i/run.lesson.steps.length*100));run.built=[];run.used=[];run.checked=false;run.ok=false;run.gameIndex=0;run.gameScore=0;render()};
window.a2Answer=e=>{const s=run.lesson.steps[run.i],v=decodeURIComponent(e),ok=norm(v)===norm(s.ans);document.querySelectorAll('[data-a2-choice]').forEach(b=>{const x=decodeURIComponent(b.dataset.a2Choice);if(norm(x)===norm(v))b.classList.add(ok?'correct':'wrong');if(!ok&&norm(x)===norm(s.ans))b.classList.add('correct');b.disabled=true});const f=$('#a2Feedback');if(f)f.innerHTML=`<div class="b14Feedback ${ok?'good':'bad'}"><b>${feedback(ok)}</b></div>${next()}`;};
window.a2Pick=i=>{if(run.checked||run.used.includes(i))return;run.used.push(i);run.built.push(run.lesson.steps[run.i].tokens[i]);render()};
window.a2Clear=()=>{run.built=[];run.used=[];run.checked=false;run.ok=false;render()};
window.a2Check=()=>{const s=run.lesson.steps[run.i];run.checked=true;run.ok=norm(run.built.join(' '))===norm(s.target);render();const f=$('#a2Feedback');if(f)f.innerHTML=`<div class="b14Feedback ${run.ok?'good':'bad'}"><b>${feedback(run.ok)}</b></div>`;};
window.a2GameAnswer=e=>{const s=run.lesson.steps[run.i],q=s.items[run.gameIndex||0],v=decodeURIComponent(e),ok=norm(v)===norm(q.pt);if(ok)run.gameScore=(run.gameScore||0)+1;document.querySelectorAll('[data-a2-game]').forEach(b=>{const x=decodeURIComponent(b.dataset.a2Game);if(norm(x)===norm(v))b.classList.add(ok?'correct':'wrong');if(!ok&&norm(x)===norm(q.pt))b.classList.add('correct');b.disabled=true});const f=$('#a2Feedback');if(f)f.innerHTML=`<div class="b14Feedback ${ok?'good':'bad'}"><b>${feedback(ok)}</b></div><div class="b14Footer"><button class="b14Next blue" onclick="a2GameNext()">Próxima rodada</button></div>`;};
window.a2GameNext=()=>{run.gameIndex=(run.gameIndex||0)+1;render()};

function validateLesson(l){
 return !!l&&Array.isArray(l.steps)&&l.steps.length>0&&l.steps.every(s=>{
  if(s.t==='choice')return Array.isArray(s.op)&&s.op.length>=3&&s.op.some(o=>norm(o)===norm(s.ans));
  if(s.t==='build')return Array.isArray(s.tokens)&&s.tokens.length>0&&!!s.target;
  if(s.t==='game')return Array.isArray(s.items)&&s.items.length>0;
  return true;
 });
}
function start(m,n){
 if(!unlocked(m,n))return;
 const l=lesson(m,n);
 if(!validateLesson(l)){console.error('A2: aula inválida',m,n,l);openStableModule('A2',m);return}
 const pct=progress(m,n),i=done(m,n)?0:Math.min(l.steps.length-1,Math.floor(pct/100*l.steps.length));
 run={m,n,i,lesson:l,built:[],used:[],checked:false,ok:false,gameIndex:0,gameScore:0};
 render();
}
function finish(){
 const s=state();s.done=s.done&&typeof s.done==='object'?s.done:{};s.progress=s.progress&&typeof s.progress==='object'?s.progress:{};
 const k=`A2-${run.m}-${run.n}`;s.progress[k]=100;if(!s.done[k]){s.done[k]=true;s.xp=(Number(s.xp)||0)+40}s.level='A2';save(s);
 sessionStorage.setItem('a2back',String(run.m));location.reload();
}
window.a2Finish=finish;

function lessonCards(m){
 return Array.from({length:8},(_,n)=>{
  const x=item(m,n),pct=progress(m,n),isDone=done(m,n),isUnlocked=unlocked(m,n);
  return `<div class="a2LessonCard ${isDone?'done':''} ${!isUnlocked?'locked':''}" role="button" tabindex="${isUnlocked?0:-1}" ${isUnlocked?`onclick="openStableLesson('A2',${m},${n})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStableLesson('A2',${m},${n})}"`:''}>
    <div class="a2LessonCopy"><div class="a2LessonNumber">AULA ${n+1}</div><h4>${esc(x.title)}</h4><div class="a2LessonStatus">${isDone?'Concluída · toque para revisar':!isUnlocked?'🔒 Conclua a aula anterior':pct>0?`Em andamento · ${pct}%`:'Toque para começar'}</div><div class="moduleProgress"><span style="width:${pct}%"></span></div></div>
    <div class="a2LessonArt" aria-hidden="true"><span>${!isUnlocked?'🔒':x.e}</span></div>
  </div>`;
 }).join('');
}
function moduleView(m){
 m=Number(m)||0;
 $('#courseBody').innerHTML=`<div class="a2ModuleLessons tone-${m%6}"><div class="a2ModuleLessonsHead"><button class="back" onclick="renderStableCourse()">‹</button><div><div class="a2ModuleLessonsEyebrow">A2 · MÓDULO ${m+1}</div><h2>${esc(MODULE_TITLES[m])}</h2><div class="muted">8 aulas progressivas · perguntas, escuta, frases e jogos</div></div></div><div class="a2LessonGrid">${lessonCards(m)}</div></div>`;
 window.scrollTo(0,0);
}
window.openStableModule=(l,m)=>l==='A2'?moduleView(m):oldModule?.(l,m);
window.openStableLesson=(l,m,n)=>l==='A2'?start(Number(m),Number(n)):oldOpen?.(l,m,n);
const back=sessionStorage.getItem('a2back');if(back!==null){sessionStorage.removeItem('a2back');setTimeout(()=>{window.stableShow?.('course');moduleView(Number(back)||0)},250)}
})();