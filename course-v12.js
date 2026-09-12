(function(){
const LEVEL_INFO={A1:['Iniciante','Comece do zero e construa a base para situações simples do dia a dia.'],A2:['Básico','Amplie a base e lide com situações cotidianas com mais autonomia.'],B1:['Intermediário','Converse sobre experiências, trabalho, viagens e opiniões com confiança.'],B2:['Avançado','Use inglês natural, argumente e compreenda assuntos mais complexos.'],C1:['Fluente','Refine precisão, registro, apresentações, debates e linguagem profissional.'],C2:['Domínio total','Trabalhe nuance, estilo, velocidade, persuasão e domínio avançado.']};
const RAW={
A1:[
['Primeiros contatos','verbo to be afirmativo; pronomes pessoais','cumprimentos, nomes, países, nacionalidades','apresentar-se e cumprimentar alguém'],
['Alfabeto, números e dados pessoais','to be em perguntas; adjetivos possessivos','alfabeto, números, idade, telefone, e-mail','soletrar e informar dados pessoais'],
['Família e pessoas','have/has; possessivos','família, relações, aparência e personalidade básica','apresentar e descrever pessoas próximas'],
['Rotina diária','present simple afirmativo','ações diárias, dias da semana, horários','descrever sua rotina e horários'],
['Perguntas e hábitos','do/does; negativas; advérbios de frequência','hábitos, frequência, tarefas do dia','perguntar e responder sobre hábitos'],
['Casa e cidade','there is/are; preposições de lugar','cômodos, móveis, lugares da cidade','descrever onde mora e localizar objetos'],
['Comida e restaurante','some/any; contáveis e incontáveis','comidas, bebidas, cardápio, quantidades','pedir comida e bebida de forma simples'],
['Compras e preços','this/that/these/those; plurais; how much','roupas, cores, tamanhos, dinheiro','comprar itens e perguntar preços'],
['Direções e transporte','imperativos; can para pedidos','ruas, transporte, esquerda/direita, pontos de referência','pedir e entender direções simples'],
['Tempo livre e habilidades','can/can’t; like + ing','hobbies, esportes, música, lazer','falar do que gosta e sabe fazer'],
['Ontem e fim de semana','was/were; passado simples regular e frequente','ontem, fim de semana, lugares e atividades','contar fatos simples do passado'],
['Projeto A1: um dia completo em inglês','revisão integrada A1','revisão de sobrevivência, rotina, compras, transporte e restaurante','passar por um dia simples usando inglês básico']
],
A2:[
['Rotina em movimento','present simple x present continuous','rotina, ações agora, trabalho e casa','distinguir hábitos de ações em andamento'],
['Histórias do passado','past simple regular e irregular','viagens, acontecimentos, verbos frequentes','contar o que aconteceu em uma sequência simples'],
['Planos e futuro','be going to; present continuous para planos','planos, datas, compromissos, férias','falar sobre planos futuros'],
['Comparando coisas','comparativos e superlativos','lugares, produtos, pessoas, preços','comparar opções e fazer escolhas'],
['Viagem e hotel','could/would para pedidos','aeroporto, hotel, reserva, bagagem','resolver situações comuns de viagem'],
['Saúde e bem-estar','should/shouldn’t; have got','corpo, sintomas, hábitos saudáveis','descrever sintomas e entender conselhos simples'],
['Trabalho e estudo','have to/don’t have to; must básico','tarefas, profissões, estudos, regras','explicar obrigações e responsabilidades'],
['Experiências de vida','present perfect introdutório','experiências, viagens, atividades','dizer o que já fez ou nunca fez'],
['Serviços e problemas','pedidos educados; too/enough','lojas, banco, telefone, problemas e soluções','pedir ajuda e explicar um problema'],
['Contando uma história','conectores first/then/after/because/so','eventos, emoções, sequência','contar uma história curta com começo, meio e fim'],
['Vida social','convites, sugestões e respostas','eventos, encontros, cinema, restaurante','convidar, aceitar, recusar e combinar planos'],
['Projeto A2: viagem completa','revisão integrada A2','viagem, serviços, saúde, compras e vida social','viajar e resolver tarefas comuns com autonomia básica']
],
B1:[
['Experiências e passado','present perfect x past simple','experiências, conquistas, mudanças','relacionar experiências passadas ao presente'],
['Narrativas mais claras','past continuous; past simple; when/while','histórias, incidentes, contexto','narrar acontecimentos com contexto e interrupções'],
['Futuro e decisões','will, going to, present continuous','previsões, decisões, planos','distinguir intenção, plano e decisão espontânea'],
['Condições reais','zero e first conditional','regras, consequências, planos possíveis','falar sobre condições e resultados prováveis'],
['Conselho e obrigação','modais should, must, have to, might','problemas, regras, conselhos, possibilidades','aconselhar e explicar obrigações com nuance'],
['Voz passiva básica','passive present e past','processos, notícias, produtos','falar sobre ações quando o agente não é importante'],
['Pessoas e coisas','relative clauses who/which/that/where','descrições, pessoas, objetos, lugares','dar descrições mais precisas'],
['O que alguém disse','reported speech introdutório','conversas, mensagens, pedidos','relatar falas e informações simples'],
['Phrasal verbs essenciais','phrasal verbs frequentes e padrões verbais','trabalho, viagem, casa, relacionamentos','entender e usar combinações verbais comuns'],
['Opiniões e argumentos','language of opinion; linking words','opiniões, vantagens, desvantagens','explicar e defender uma opinião'],
['Inglês no trabalho e viagem','pedidos, telefonemas, e-mails e situações práticas','reuniões, telefone, aeroporto, problemas','agir com independência em trabalho e viagem'],
['Projeto B1: conversa de 10 minutos','revisão integrada B1','temas cotidianos e profissionais','sustentar uma conversa espontânea de nível intermediário']
],
B2:[
['Tempo e duração','present perfect continuous; past perfect','duração, projetos, mudanças','explicar duração, causa e sequência temporal'],
['Hipóteses','second e third conditional','decisões, alternativas, consequências','discutir situações hipotéticas e resultados passados'],
['Desejos e arrependimentos','wish/if only; would rather','arrependimentos, preferências, mudanças','expressar desejo, crítica e arrependimento'],
['Passiva avançada','passive com modais e estruturas impessoais','notícias, processos, relatórios','usar a passiva em contextos formais e informativos'],
['Relato e interpretação','reported speech avançado; reporting verbs','mídia, conversas, reuniões','relatar posições com precisão'],
['Dedução e probabilidade','must/might/can’t have; modais de dedução','evidências, hipóteses, acontecimentos','inferir causas e probabilidades'],
['Conectando ideias','discourse markers e contraste','argumentos, exemplos, concessões','organizar fala e texto com fluidez'],
['Expressões naturais','phrasal verbs, collocations e idioms comuns','relações, trabalho, emoções, decisões','soar menos traduzido e mais natural'],
['Comunicação profissional','registro formal e informal; e-mails; reuniões','negociação, apresentações, feedback','atuar em situações profissionais exigentes'],
['Notícias e mídia','linguagem de notícias; hedging','sociedade, tecnologia, atualidades','compreender e comentar notícias com cautela'],
['Debate e persuasão','argumentação, refutação e concessão','temas controversos e decisões','defender posição e responder a contrapontos'],
['Projeto B2: apresentação e debate','revisão integrada B2','apresentação, perguntas e debate','apresentar um tema e lidar com perguntas espontâneas']
],
C1:[
['Nuances de tempo e aspecto','contrastes avançados de tempos e aspecto','mudança, continuidade, perspectiva','escolher tempos verbais por nuance e intenção'],
['Ênfase e inversão','inversion; cleft sentences; fronting','ênfase, surpresa, contraste','controlar foco e impacto da mensagem'],
['Modalidade avançada','modal perfects; degrees of certainty','certeza, obrigação, crítica, especulação','expressar graus finos de certeza e julgamento'],
['Registro e nominalização','nominalisation; formal style','relatórios, propostas, análise','transformar linguagem informal em profissional'],
['Colocações e idiomaticidade','collocations avançadas e padrões lexicais','decisões, problemas, relações, negócios','usar combinações naturais e evitar traduções literais'],
['Escrita profissional e acadêmica','estrutura, coesão, hedging, síntese','relatórios, ensaios, propostas','produzir textos claros, coesos e sofisticados'],
['Apresentações de alto nível','signposting; rhetorical questions; emphasis','apresentações, dados, storytelling','conduzir apresentação longa e responder perguntas'],
['Debate e pensamento crítico','qualifying claims; rebuttal; evidence','argumentação, evidência, vieses','avaliar argumentos e responder com precisão'],
['Inglês social e humor','registro, ironia, understatement, pragmática','humor, relações, conversas informais','entender subtexto e adaptar o tom'],
['Inglês profissional avançado','negociação, diplomacia, feedback delicado','liderança, conflito, decisão','negociar e comunicar mensagens sensíveis'],
['Escuta rápida e sotaques','reduções, connected speech, variação','sotaques e fala espontânea','acompanhar fala natural em velocidade real'],
['Projeto C1: painel profissional','revisão integrada C1','apresentação, debate, escrita e negociação','participar de um painel complexo com fluidez']
],
C2:[
['Precisão e escolha de registro','controle fino de formalidade e voz','registro, intenção, audiência','escolher formulações com precisão social e retórica'],
['Modalidade e posicionamento','stance, epistemic modality, hedging avançado','certeza, dúvida, responsabilidade','posicionar-se com sutileza e precisão'],
['Retórica e persuasão','rhetorical structure, framing, emphasis','persuasão, discursos, negociação','construir mensagens persuasivas sofisticadas'],
['Linguagem figurada','metáfora, ironia, understatement, allusion','figuras de linguagem e subtexto','interpretar e criar linguagem figurada natural'],
['Idiomaticidade profunda','idioms, collocations raras, lexical nuance','expressões, escolhas lexicais, conotação','selecionar palavras por conotação e naturalidade'],
['Argumentação complexa','dialectic, counterargument, synthesis','debates, ensaios, decisões','sintetizar posições complexas sem perder nuance'],
['Edição e precisão','editing, concision, ambiguity control','clareza, estilo, erros sutis','editar fala e escrita em nível profissional'],
['Mediação e paráfrase','reformulation, summarising, mediation','resumos, tradução de ideias, negociação','reformular ideias complexas para públicos diferentes'],
['Velocidade, sotaques e ruído','connected speech extremo; variação regional','fala rápida, sotaques, contexto implícito','compreender fala rápida e variação ampla'],
['Cultura, humor e pragmática','pragmatics, implicature, cultural reference','humor, indiretas, etiqueta linguística','interpretar intenção além das palavras'],
['Domínio profissional','specialised discourse e liderança','apresentações, crise, estratégia, influência','atuar com precisão em situações profissionais críticas'],
['Projeto C2: domínio total','revisão integrada C2','debate, mediação, persuasão e estilo','demonstrar domínio amplo, flexível e preciso do inglês']
]};
const TYPES=['Vocabulário e escuta','Gramática em contexto','Frases essenciais','Compreensão auditiva','Leitura e interpretação','Produção escrita','Conversação com IA','Desafio do módulo'];
const COURSE_ENDPOINT='https://meu-ingles-claudio.netlify.app/api/course-lesson';
const CHAT_ENDPOINT='https://meu-ingles-claudio.netlify.app/api/groq-chat';
const PROGRESS_KEY='MI_course_v12_progress',CACHE_KEY='MI_course_v12_cache';
function stateSafe(){try{return state}catch(e){return {level:'A1',teacher:'media'}}}
function loadJson(k,def){try{return JSON.parse(localStorage.getItem(k)||'null')||def}catch(e){return def}}
function saveJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function progress(){return loadJson(PROGRESS_KEY,{done:{}})}
function markDone(level,m,l){const p=progress();p.done[`${level}-${m}-${l}`]=true;saveJson(PROGRESS_KEY,p)}
function isDone(level,m,l){return !!progress().done[`${level}-${m}-${l}`]}
function moduleCount(level,m){let n=0;for(let i=0;i<8;i++)if(isDone(level,m,i))n++;return n}
function levelCount(level){let n=0;for(let m=0;m<12;m++)n+=moduleCount(level,m);return n}
function moduleUnlocked(level,m){return m===0||moduleCount(level,m-1)>=7}
function lessonUnlocked(level,m,l){return l===0||isDone(level,m,l-1)}
function moduleObj(level,m){const x=RAW[level][m];return{title:x[0],grammar:x[1],vocab:x[2],canDo:x[3]}}
function cache(){return loadJson(CACHE_KEY,{items:{},order:[]})}
function cacheGet(k){return cache().items[k]||null}
function cachePut(k,v){const c=cache();c.items[k]=v;c.order=c.order.filter(x=>x!==k);c.order.push(k);while(c.order.length>25){const old=c.order.shift();delete c.items[old]}saveJson(CACHE_KEY,c)}
function setLevelV12(l){const s=stateSafe();s.level=l;try{save()}catch(e){}renderHome()}
window.setCourseLevelV12=setLevelV12;
function levelTabs(level){return Object.keys(LEVEL_INFO).map(k=>`<button class="courseLevelTab ${k===level?'active':''}" onclick="setCourseLevelV12('${k}')">${k} · ${LEVEL_INFO[k][0]}</button>`).join('')}
function renderHome(){const course=document.getElementById('course');if(!course)return;const level=stateSafe().level||'A1',count=levelCount(level),pct=Math.round(count/96*100);course.innerHTML=`<div class="top"><button class="back" onclick="openScreen('home')">‹</button><h2>Curso de Inglês</h2></div><div class="courseV12"><div class="courseHero"><div class="courseLevelTabs">${levelTabs(level)}</div><h2>${level} · ${LEVEL_INFO[level][0]}</h2><p>${LEVEL_INFO[level][1]}</p><div class="courseStats"><div class="courseStat"><b>12</b><small>módulos</small></div><div class="courseStat"><b>96</b><small>aulas</small></div><div class="courseStat"><b>${pct}%</b><small>progresso</small></div></div><div class="courseBar"><i style="width:${pct}%"></i></div></div><div class="moduleList">${RAW[level].map((x,m)=>moduleCard(level,m)).join('')}</div>${count===96?`<div class="certBox">🏆 Você concluiu as 96 aulas do ${level}. Faça o desafio final e, quando se sentir pronto, avance para o próximo nível.</div>`:''}</div>`}
function moduleCard(level,m){const x=moduleObj(level,m),done=moduleCount(level,m),locked=!moduleUnlocked(level,m);return `<div class="moduleCard ${locked?'locked':''}"><div class="moduleTop"><div class="moduleNum">${m+1}</div><div class="moduleGrow"><h3>${x.title}</h3><p><b>Objetivo:</b> ${x.canDo}</p><div class="moduleMeta"><span class="moduleTag">📘 ${x.grammar}</span><span class="moduleTag">🗣️ ${x.vocab}</span></div></div></div><div class="moduleProgress"><div class="miniBar"><span style="width:${done/8*100}%"></span></div><b>${done}/8</b><button class="moduleOpen" ${locked?'disabled':''} onclick="openCourseModuleV12('${level}',${m})">${locked?'🔒 Bloqueado':'Abrir'}</button></div></div>`}
window.openCourseModuleV12=function(level,m){const course=document.getElementById('course'),x=moduleObj(level,m);course.innerHTML=`<div class="top"><button class="back" onclick="renderCourseV12()">‹</button><h2>${level} · Módulo ${m+1}</h2></div><div class="courseV12"><div class="courseHero"><h2>${x.title}</h2><p>${x.canDo}</p><div class="moduleMeta"><span class="moduleTag">📘 ${x.grammar}</span><span class="moduleTag">🗣️ ${x.vocab}</span></div><div class="courseBar"><i style="width:${moduleCount(level,m)/8*100}%"></i></div></div><div class="lessonGrid">${TYPES.map((t,l)=>lessonCard(level,m,l,t)).join('')}</div></div>`;window.scrollTo(0,0)};
function lessonCard(level,m,l,t){const done=isDone(level,m,l),locked=!lessonUnlocked(level,m,l);return `<div class="lessonV12 ${done?'done':''} ${locked?'locked':''}"><h4>${l+1}. ${t} ${done?'✓':''}</h4><p>${l===7?'Reúna tudo o que aprendeu no módulo em uma atividade maior.':'Aula guiada com explicação, exemplos e prática.'}</p><div class="lessonActions"><button class="lessonAction primary" ${locked?'disabled':''} onclick="openCourseLessonV12('${level}',${m},${l})">${locked?'🔒 Aguarde':done?'Revisar aula':'Começar aula'}</button></div></div>`}
async function getLesson(level,m,l){const key=`${level}-${m}-${l}`,cached=cacheGet(key);if(cached)return cached;const x=moduleObj(level,m);const r=await fetch(COURSE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level,module_title:x.title,grammar:x.grammar,vocabulary:x.vocab,can_do:x.canDo,lesson_type:TYPES[l],lesson_number:l+1})});if(!r.ok)throw new Error('course '+r.status);const d=await r.json();cachePut(key,d);return d}
function fallbackLesson(level,m,l){const x=moduleObj(level,m);return{title:`${TYPES[l]} · ${x.title}`,goal_pt:x.canDo,explanation_pt:`Nesta aula você vai trabalhar ${x.grammar}. O vocabulário principal inclui ${x.vocab}.`,examples:[{en:'Listen, repeat, and use the new language in context.',pt:'Ouça, repita e use a nova linguagem em contexto.'}],vocabulary:x.vocab.split(',').slice(0,6).map(v=>({en:v.trim(),pt:'vocabulário do módulo'})),practice_steps:['Leia o objetivo da aula.','Ouça e repita os exemplos.','Crie uma frase sua.','Responda à pergunta oral.'],speaking_prompt_en:'Use the language from this lesson in one complete sentence.',speaking_help_pt:'Use uma frase completa com o conteúdo do módulo.',model_answer_en:'I can use this lesson in a complete sentence.',mini_reading_en:'This short lesson helps you use English in a real situation.',mini_reading_question_pt:'Qual é a ideia principal?',final_task_pt:'Fale uma frase completa usando o conteúdo desta aula.'}}
window.openCourseLessonV12=async function(level,m,l){const course=document.getElementById('course'),x=moduleObj(level,m);course.innerHTML=`<div class="top"><button class="back" onclick="openCourseModuleV12('${level}',${m})">‹</button><h2>${level} · Aula ${l+1}</h2></div><div class="courseV12"><div class="lessonPanel"><div class="courseLoading">Preparando sua aula de ${TYPES[l]}…</div></div></div>`;window.scrollTo(0,0);let lesson;try{lesson=await getLesson(level,m,l)}catch(e){console.warn(e);lesson=fallbackLesson(level,m,l)}renderLesson(level,m,l,lesson,x)};
function esc(s){return String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
function renderLesson(level,m,l,d,x){const course=document.getElementById('course');course.innerHTML=`<div class="top"><button class="back" onclick="openCourseModuleV12('${level}',${m})">‹</button><h2>${level} · Aula ${l+1}</h2></div><div class="courseV12"><div class="lessonPanel"><h2>${esc(d.title||TYPES[l])}</h2><p class="muted">${esc(d.goal_pt||x.canDo)}</p><div class="lessonSection"><h3>📘 Entenda</h3><p>${esc(d.explanation_pt||'')}</p></div><div class="lessonSection"><h3>💬 Exemplos</h3>${(d.examples||[]).map((e,i)=>`<div class="exampleRow"><b>${esc(e.en)}</b><span>${esc(e.pt)}</span><div class="lessonActions"><button class="lessonAction" onclick="courseHear('${encodeURIComponent(e.en)}','en-US')">🔊 Ouvir</button></div></div>`).join('')}</div><div class="lessonSection"><h3>🧠 Vocabulário</h3>${(d.vocabulary||[]).map(v=>`<div class="vocabRow"><b>${esc(v.en)}</b><span>${esc(v.pt)}</span></div>`).join('')}</div><div class="lessonSection"><h3>✍️ Prática guiada</h3><ol class="stepList">${(d.practice_steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>${d.mini_reading_en?`<div class="lessonSection"><h3>📖 Leitura</h3><div class="exampleRow"><b>${esc(d.mini_reading_en)}</b><span>${esc(d.mini_reading_question_pt||'')}</span><div class="lessonActions"><button class="lessonAction" onclick="courseHear('${encodeURIComponent(d.mini_reading_en)}','en-US')">🔊 Ouvir leitura</button></div></div></div>`:''}<div class="lessonSection"><h3>🎙️ Fale com o professor</h3><div class="speakingBox"><div class="speakingPrompt">${esc(d.speaking_prompt_en||'Speak about this topic.')}</div><p class="muted">${esc(d.speaking_help_pt||'Responda em inglês.')}</p><button id="courseMic" class="courseMic" onclick="courseAnswerV12('${level}',${m},${l},'${encodeURIComponent(d.speaking_prompt_en||'Speak about this topic.')}','${encodeURIComponent(d.model_answer_en||'')}')">🎙️</button><div id="courseFeedback"></div></div></div><div class="lessonSection"><h3>🏁 Tarefa final</h3><p>${esc(d.final_task_pt||'Use o conteúdo da aula em uma frase completa.')}</p><button class="lessonAction done" onclick="finishCourseLessonV12('${level}',${m},${l})">✅ ${isDone(level,m,l)?'Aula concluída':'Concluir aula'}</button></div></div></div>`}
window.courseHear=async function(encoded,lang){const text=decodeURIComponent(encoded);if(window.GEMINI_TTS){const ok=await GEMINI_TTS.speak(text,lang);if(ok)return}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;speechSynthesis.speak(u)}catch(e){}}
window.courseAnswerV12=async function(level,m,l,qEnc,modelEnc){let r=null;try{r=await prep()}catch(e){}if(!r)return;const mic=document.getElementById('courseMic'),box=document.getElementById('courseFeedback'),q=decodeURIComponent(qEnc),model=decodeURIComponent(modelEnc);if(mic)mic.classList.add('listening');if(box)box.innerHTML='<div class="courseLoading">Estou ouvindo…</div>';r.onresult=async e=>{const heard=e.results[0][0].transcript;if(mic)mic.classList.remove('listening');if(box)box.innerHTML='<div class="courseLoading">O professor está analisando sua resposta…</div>';const st=stateSafe(),x=moduleObj(level,m);try{const rr=await fetch(CHAT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'conversation',message:`Pergunta da aula: ${q}\nResposta do aluno: ${heard}\nResposta-modelo possível: ${model}`,level,personality:st.teacher,scenario:`Curso ${level}, módulo ${x.title}, aula ${TYPES[l]}`})});if(!rr.ok)throw new Error('chat '+rr.status);const d=await rr.json();if(box)box.innerHTML=`<div class="courseFeedback ${d.verdict==='correct'?'good':d.verdict==='wrong'?'bad':''}"><b>Você disse:</b> ${esc(heard)}<br><br><b>Professor:</b> ${esc(d.reply_pt||'')} ${d.reply_en?`<br><span class="muted">${esc(d.reply_en)}</span>`:''}</div>`;if(window.GEMINI_TTS)await GEMINI_TTS.speakBoth(d.reply_pt||'',d.reply_en||'')}catch(err){if(box)box.innerHTML='<div class="courseFeedback bad">A IA não respondeu agora. Sua resposta não foi marcada como certa nem errada. Tente novamente em alguns segundos.</div>'}};r.onerror=()=>{if(mic)mic.classList.remove('listening');if(box)box.innerHTML='<div class="courseFeedback bad">Não consegui ouvir. Tente novamente.</div>'};try{r.start()}catch(e){if(mic)mic.classList.remove('listening')}};
window.finishCourseLessonV12=function(level,m,l){markDone(level,m,l);try{if(typeof toast==='function')toast('Aula concluída ✓')}catch(e){};openCourseModuleV12(level,m)};
window.renderCourseV12=renderHome;
function init(){window.renderCourseV6=renderHome;renderHome()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,260));else setTimeout(init,260);
})();
