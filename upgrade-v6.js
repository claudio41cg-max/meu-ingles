(()=>{
const L={"A1":[["Cumprimentos","How are you?","Como você está?"],["Apresentação","My name is Claudio.","Meu nome é Cláudio."],["País e cidade","I'm from Brazil.","Eu sou do Brasil."],["Conhecendo alguém","Nice to meet you.","Prazer em conhecer você."],["Bom dia","Good morning!","Bom dia!"],["Pedindo água","I would like some water, please.","Eu gostaria de um pouco de água, por favor."],["No banheiro","Where is the bathroom?","Onde fica o banheiro?"],["Compras","How much is this?","Quanto custa isto?"],["Quando não entender","I don't understand.","Eu não entendo."],["Despedida","See you tomorrow.","Até amanhã."]],"A2":[["Trabalho","What do you do for work?","Com o que você trabalha?"],["Rotina","I wake up at six o'clock.","Eu acordo às seis horas."],["Restaurante","Could I have the menu, please?","Eu poderia ver o cardápio, por favor?"],["Transporte","I'm looking for the bus station.","Estou procurando a rodoviária."],["Fim de semana","How was your weekend?","Como foi seu fim de semana?"],["Mercado","I need to buy some groceries.","Eu preciso comprar mantimentos."],["Pedindo ajuda","Can you help me, please?","Você pode me ajudar, por favor?"],["Horários","What time does it open?","Que horas abre?"],["Reserva","I'd like to make a reservation.","Eu gostaria de fazer uma reserva."],["Encerrando conversa","It was great talking to you.","Foi ótimo conversar com você."]],"B1":[["Dia de trabalho","I've been working all day.","Estou trabalhando o dia todo."],["Condição","If I have time, I'll call you.","Se eu tiver tempo, vou ligar para você."],["Hábito","I'm used to waking up early.","Estou acostumado a acordar cedo."],["Opinião","What do you think about it?","O que você acha disso?"],["Surpresa","I didn't expect that to happen.","Eu não esperava que isso acontecesse."],["Explicação","Could you explain that again?","Você poderia explicar isso novamente?"],["Concordando com ressalva","I agree with you, but...","Eu concordo com você, mas..."],["Experiência","I've never been there before.","Eu nunca estive lá antes."],["Trânsito","The traffic was worse than usual.","O trânsito estava pior que o normal."],["Objetivo","I'm trying to improve my English.","Estou tentando melhorar meu inglês."]],"B2":[["Hipótese passada","I would have gone if I had known.","Eu teria ido se soubesse."],["Ponto de vista","From my point of view, that's a good idea.","Do meu ponto de vista, essa é uma boa ideia."],["Explicando uma razão","The main reason is that we need more time.","A principal razão é que precisamos de mais tempo."],["Contraste","Despite the delay, we arrived on time.","Apesar do atraso, chegamos na hora."],["Expectativa","I'm looking forward to hearing from you.","Estou ansioso para receber notícias suas."],["Dependência","It depends on what you mean.","Depende do que você quer dizer."],["Discordância educada","That's not necessarily the case.","Isso não é necessariamente verdade."],["Arrependimento","I wish I had started earlier.","Eu gostaria de ter começado mais cedo."],["Nova estratégia","Let's try a different approach.","Vamos tentar uma abordagem diferente."],["Análise","There are several factors to consider.","Há vários fatores a considerar."]],"C1":[["Condição formal","Had I known, I would have acted differently.","Se eu soubesse, teria agido de forma diferente."],["Ponto importante","It's worth bearing in mind that things can change.","Vale lembrar que as coisas podem mudar."],["Justificando","I find it difficult to justify that decision.","Acho difícil justificar essa decisão."],["Preocupação","What concerns me most is the lack of time.","O que mais me preocupa é a falta de tempo."],["Evidência","The evidence appears to suggest that we were right.","As evidências parecem sugerir que estávamos certos."],["Argumentação","I would argue that this is the best option.","Eu argumentaria que esta é a melhor opção."],["Perspectiva","It's a matter of perspective.","É uma questão de perspectiva."],["Questionamento","The proposal raises several questions.","A proposta levanta várias questões."],["Empatia","I can see where you're coming from.","Eu entendo o seu ponto de vista."],["Avaliação","We need to weigh the benefits against the risks.","Precisamos pesar os benefícios contra os riscos."]],"C2":[["Concessão","Be that as it may, we still need a solution.","Seja como for, ainda precisamos de uma solução."],["Nuance","The issue is far more nuanced than it seems.","A questão é muito mais complexa do que parece."],["Possibilidade","I wouldn't rule out that possibility.","Eu não descartaria essa possibilidade."],["Previsibilidade","It hardly comes as a surprise.","Isso dificilmente chega a ser uma surpresa."],["Crítica","The argument doesn't quite hold up.","O argumento não se sustenta muito bem."],["Reconhecimento","That's a compelling point.","Esse é um ponto convincente."],["Mal-entendido","We seem to be talking at cross purposes.","Parece que estamos falando de coisas diferentes sem perceber."],["Distinção","The distinction is subtle but important.","A distinção é sutil, mas importante."],["Concordância parcial","I take your point, although I remain unconvinced.","Entendo seu ponto, embora eu continue não convencido."],["Conclusão","That conclusion follows logically from the evidence.","Essa conclusão decorre logicamente das evidências."]]};
state.completed=state.completed||{};
TEACHERS.leve=['🙂','Moderada','Incentiva, brinca pouco e corrige com calma','MODERADA'];
TEACHERS.media=['😎','Zoeira média','Mais brincalhona, provoca e comemora junto','ZOEIRA'];
TEACHERS.pesada=['🔞','Adulto 18+','Humor adulto, gírias e palavrões na brincadeira','18+'];

const style=document.createElement('style');
style.textContent=`.level{color:#f4f9ff!important;background:linear-gradient(145deg,#15324b,#0d2132)!important;border:1px solid #3a688b!important;box-shadow:0 6px 16px #0003;transition:.15s}.level strong{background:#1c5b88!important;color:#fff}.level h3{color:#fff!important}.level:active{transform:scale(.985);background:#1b3d59!important}.level.sel{outline:3px solid #2d9cff!important;border-color:#70bdff!important;background:linear-gradient(145deg,#19486c,#102c43)!important;box-shadow:0 0 0 3px #168cff20,0 8px 22px #0005}.level.sel strong{background:#168cff!important}.lesson.completed{border-color:#248a5e;background:linear-gradient(145deg,#0d2a21,#0b1d1a)}.doneMark{display:inline-flex;margin-left:8px;font-size:12px;color:#8ff0bd;border:1px solid #2b8b60;border-radius:999px;padding:3px 7px}.modePanel{margin-bottom:14px;padding:14px;border:1px solid #31526c;border-radius:18px;background:#0c1c2b}.modePanel h3{margin:0 0 4px}.modeStrip{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.modeBtn{border:1px solid #3a607e;background:#143047;color:#eaf6ff;border-radius:14px;padding:11px 6px;font-weight:800;font-size:12px}.modeBtn.active{background:linear-gradient(135deg,#0b72cc,#168cff);border-color:#67baff;box-shadow:0 0 0 2px #168cff26}.modeBtn.adult{border-color:#79434a}.modeBtn.adult.active{background:linear-gradient(135deg,#8a2632,#c73545)}`;
document.head.appendChild(style);

const course=document.getElementById('course');
course.innerHTML=`<div class="top"><button class="back" onclick="openScreen('home')">‹</button><h2>Curso</h2></div><div class="panel"><h3>Seu nível: <span id="courseLevel">A1</span></h3><p class="muted">Escolha o nível e avance no seu ritmo.</p><div id="levels" class="levels"></div></div><div class="title"><h2 id="courseTitle">Aulas A1</h2><small id="courseModule">10 aulas</small></div><div id="lessonList"></div>`;

const chat=document.getElementById('chat');
const top=chat.querySelector('.top');
const mode=document.createElement('div');
mode.className='modePanel';
mode.innerHTML='<h3>🎭 Jeito da assistente</h3><p class="muted">Troque a qualquer momento.</p><div id="chatModes" class="modeStrip"></div>';
top.insertAdjacentElement('afterend',mode);

const ph=document.querySelector('#profile .profilegrid > div:first-child');
if(ph)ph.innerHTML='<h3>🎭 Nível da assistente</h3><p class="muted">Escolha como ela vai conversar, corrigir e brincar com você.</p>';

function key(i){return state.level+'-'+i}
function doneCount(){return (L[state.level]||[]).filter((_,i)=>state.completed[key(i)]).length}
window.renderAssistantModesV6=function(){
 const box=document.getElementById('chatModes');if(!box)return;
 box.innerHTML=Object.entries(TEACHERS).map(([k,v])=>`<button class="modeBtn ${k==='pesada'?'adult':''} ${state.teacher===k?'active':''}" onclick="setTeacher('${k}')">${v[0]} ${v[1]}</button>`).join('');
};
window.renderCourseV6=function(){
 const list=L[state.level]||[];
 document.getElementById('courseLevel').textContent=state.level;
 document.getElementById('courseTitle').textContent='Aulas '+state.level;
 document.getElementById('courseModule').textContent=list.length+' aulas';
 document.getElementById('lessonList').innerHTML=list.map((l,i)=>{const done=!!state.completed[key(i)];return `<div class="lesson ${done?'completed':''}"><h3>${i+1}. ${l[0]}${done?'<span class="doneMark">✓ concluída</span>':''}</h3><div class="phrase">${l[1]}</div><div class="muted">${l[2]}</div><div class="controls"><button class="btn speak" onclick="speakEn(L_V6[state.level][${i}][1])">🔊 Ouvir</button><button class="btn" onclick="practiceLessonV6(this,${i})">🎙️ Repetir</button><button class="btn primary" onclick="finishLessonV6(${i})">${done?'Concluída ✓':'Concluir'}</button></div><div class="result"></div></div>`}).join('');
};
window.L_V6=L;
renderLevels=function(){
 const box=document.getElementById('levels');box.innerHTML=LEVELS.map(x=>`<button class="level ${state.level===x[0]?'sel':''}" onclick="setLevel('${x[0]}')"><strong>${x[0]}</strong><div><h3>${x[1]}</h3><p>${x[2]}</p></div></button>`).join('');
};
setLevel=function(l){state.level=l;save();renderLevels();renderCourseV6();toast('Nível '+l+' selecionado')};
renderHome=function(){
 const total=(L[state.level]||[]).length||10,done=doneCount();
 levelStat.textContent=state.level;xpStat.textContent=state.xp;streakStat.textContent=state.streak;
 progress.style.width=Math.min(100,done/total*100)+'%';lessonCount.textContent=done+'/'+total;
 const cl=document.getElementById('courseLevel');if(cl)cl.textContent=state.level;
 greeting.textContent=state.teacher==='pesada'?'Hoje a assistente tá sem filtro 😈':state.teacher==='media'?'Bora treinar e dar umas risadas? 😄':'Vamos treinar no seu ritmo 🙂';
};
const oldOpen=openScreen;
openScreen=function(id){
 document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.s===id));
 if(id==='course')renderCourseV6();if(id==='chat'){initChat();renderAssistantModesV6()}if(id==='review')renderReview();if(id==='profile')renderTeachers();window.scrollTo(0,0);
};
setTeacher=function(t){
 state.teacher=t;save();renderTeachers();renderAssistantModesV6();toast('Assistente: '+TEACHERS[t][1]);
 speakPt(t==='leve'?'Fechado, Cláudio. Vou conversar de forma mais moderada.':t==='media'?'Aí sim, Cláudio. Zoeira média ativada. Agora aguenta a resenha.':'Modo dezoito mais ativado, Cláudio. Agora a zoeira vem sem filtro.');
};
resultHtml=function(sc,heard,passed){return `<b>${sc}% de compatibilidade</b><p>Eu ouvi: “${heard}”</p><div class="voiceReply ${passed?'':'bad'}">🔊 Assistente respondeu por voz</div><small class="muted">A porcentagem mede o texto reconhecido pelo Chrome; não é uma nota exata da pronúncia.</small>`};
window.practiceLessonV6=async function(btn,index){
 const lesson=L[state.level][index],r=await prep();if(!r)return;const box=btn.closest('.lesson').querySelector('.result');toast('Estou ouvindo...');
 r.onstart=()=>setMicTop('listening');
 r.onresult=e=>{const best=bestHeard(e.results[0],lesson[1]),heard=best.heard,sc=best.sc,passed=sc>=passLine();saveError(sc,heard,lesson[1]);box.className='result show '+(passed?'good':'bad');box.innerHTML=resultHtml(sc,heard,passed);setTimeout(()=>speakPt(reaction(sc,passed)),180)};
 r.onerror=()=>{setMicTop('bad');toast('Não entendi. Tente de novo.');speakPt(state.teacher==='pesada'?'Não ouvi direito, Cláudio. Fala essa porra de novo.':state.teacher==='media'?'Não peguei, Cláudio. Manda de novo, sem pressa.':'Não consegui ouvir bem. Tente novamente.')};
 r.onend=()=>setMicTop(micReady?'ready':'');try{r.start()}catch(e){toast('Não consegui iniciar a escuta')}
};
window.finishLessonV6=function(index){
 const k=key(index),fresh=!state.completed[k];state.completed[k]=true;state.lessons=doneCount();if(fresh)state.xp+=20;save();renderCourseV6();toast(fresh?'Aula concluída! +20 XP':'Essa aula já estava concluída');
 if(fresh)speakPt(state.teacher==='pesada'?'Boa, Cláudio. Aula concluída. Vinte pontos, porra!':state.teacher==='media'?'Boa, Cláudio! Aula concluída. Mais vinte pontos pra conta.':'Muito bem. Aula concluída. Você ganhou vinte pontos.');
};
function coach(){return state.teacher==='pesada'?pick(['Boa, Cláudio. Essa porra tá saindo!','Aí, caramba. Continua que agora engrenou.','Mandou bem, Cláudio. Bora pra próxima sem frescura.']):state.teacher==='media'?pick(['Boa, Cláudio. Tá desenrolando, hein?','Aí sim, meu parceiro. Continua.','Boa! Agora quero ver a próxima.']):pick(['Muito bem, Cláudio. Vamos continuar.','Boa tentativa. Continue assim.','Ótimo. Vamos para a próxima frase.'])}
function speakBoth(pt,en){speechSynthesis.cancel();const a=new SpeechSynthesisUtterance(pt);a.lang='pt-BR';a.rate=1;const vp=getVoice('pt-br')||getVoice('pt');if(vp)a.voice=vp;a.onend=()=>{const b=new SpeechSynthesisUtterance(en);b.lang='en-US';b.rate=.88;const ve=getVoice('en');if(ve)b.voice=ve;speechSynthesis.speak(b)};speechSynthesis.speak(a)}
reply=function(t){
 const s=t.toLowerCase(),en=/hello|\bhi\b|oi|olá/.test(s)?'Hi, Cláudio! How are you today?':/work|trabalho/.test(s)?'Tell me about your work. Try: I work every day.':/travel|viagem/.test(s)?'Imagine you are at the airport. Ask me: Where is the check-in counter?':'Good! Tell me one thing you did today in English.';
 const pt=coach();setTimeout(()=>{addMsg(`<small>${pt}</small><br><b>${en}</b>`,'bot');speakBoth(pt,en)},300);
};
renderLevels();renderCourseV6();renderAssistantModesV6();renderTeachers();renderHome();
})();
