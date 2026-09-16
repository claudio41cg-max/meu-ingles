(()=>{
'use strict';
const API='https://meu-ingles-livid.vercel.app/api/guided-chat';
const STATE_KEY='meuInglesStableV2';
const METHOD_SESSION='meuInglesMethodSessionV2';
const LESSON_TYPES=['Vocabulário e escuta','Gramática em contexto','Frases essenciais','Compreensão auditiva','Leitura e interpretação','Produção escrita','Conversação com IA','Desafio do módulo'];
const MODULES={
A1:['Primeiros contatos','Alfabeto, números e dados pessoais','Família e pessoas','Rotina diária','Perguntas e hábitos','Casa e cidade','Comida e restaurante','Compras e preços','Direções e transporte','Tempo livre e habilidades','Ontem e fim de semana','Projeto A1: um dia completo em inglês'],
A2:['Rotina em movimento','Histórias do passado','Planos e futuro','Comparando coisas','Viagem e hotel','Saúde e bem-estar','Trabalho e estudo','Experiências de vida','Serviços e problemas','Contando uma história','Vida social','Projeto A2: viagem completa'],
B1:['Experiências e passado','Narrativas mais claras','Futuro e decisões','Condições reais','Conselho e obrigação','Voz passiva básica','Pessoas e coisas','O que alguém disse','Phrasal verbs essenciais','Opiniões e argumentos','Inglês no trabalho e viagem','Projeto B1: conversa de 10 minutos'],
B2:['Tempo e duração','Hipóteses','Desejos e arrependimentos','Passiva avançada','Relato e interpretação','Dedução e probabilidade','Conectando ideias','Expressões naturais','Comunicação profissional','Notícias e mídia','Debate e persuasão','Projeto B2: apresentação e debate'],
C1:['Nuances de tempo e aspecto','Ênfase e inversão','Modalidade avançada','Registro e nominalização','Colocações e idiomaticidade','Escrita profissional e acadêmica','Apresentações de alto nível','Debate e pensamento crítico','Inglês social e humor','Inglês profissional avançado','Escuta rápida e sotaques','Projeto C1: painel profissional'],
C2:['Precisão e escolha de registro','Modalidade e posicionamento','Retórica e persuasão','Linguagem figurada','Idiomaticidade profunda','Argumentação complexa','Edição e precisão','Mediação e paráfrase','Velocidade, sotaques e ruído','Cultura, humor e pragmática','Domínio profissional','Projeto C2: domínio total']};
const A1_SCOPE={
 'Primeiros contatos':'cumprimentos e despedidas; dizer e perguntar nome; apresentações simples; How are you? e respostas curtas; I am / My name is; yes/no; please, thank you, sorry e expressões básicas de cortesia. NÃO usar família, rotina, comida, compras, transporte ou assuntos de módulos seguintes.',
 'Alfabeto, números e dados pessoais':'alfabeto, soletrar nome, números básicos, idade, telefone, e-mail, nacionalidade e dados pessoais simples.',
 'Família e pessoas':'mãe, pai, irmão, irmã, avós, tios, primos, possessivos básicos e descrições simples de pessoas.',
 'Rotina diária':'verbos e horários de rotina diária, manhã/tarde/noite e presente simples básico.',
 'Perguntas e hábitos':'perguntas simples sobre hábitos, frequência e rotinas usando estruturas já adequadas ao A1.',
 'Casa e cidade':'cômodos, objetos básicos, lugares da cidade, there is/are simples e localização.',
 'Comida e restaurante':'comidas, bebidas, gostos, pedidos simples e frases básicas de restaurante.',
 'Compras e preços':'itens, preços, cores, tamanhos, números e perguntas simples de compra.',
 'Direções e transporte':'direções básicas, pontos de referência e meios de transporte comuns.',
 'Tempo livre e habilidades':'hobbies, likes/dislikes e can/can’t básico.',
 'Ontem e fim de semana':'passado simples inicial com atividades muito comuns e marcadores básicos de tempo.',
 'Projeto A1: um dia completo em inglês':'revisão integrada somente do conteúdo A1 já estudado.'
};
const METHOD={
 familia:['Família',['família','pais e filhos','irmãos','avós e netos','tios e primos','idades','descrições','possessivos','rotina em família','conversa em família']],
 comida:['Pedindo comida',['comidas','bebidas','I would like','cardápio','fazendo o pedido','preferências','garçom','problemas no pedido','conta','simulação']],
 viagem:['Viagem',['planejamento','destinos','datas','bagagem','chegada','informações','passeios','problemas','mudando planos','conversa de viagem']],
 hotel:['Hotel',['quartos','reserva','datas','check-in','no quarto','serviços','pedindo ajuda','problemas','check-out','situação completa']],
 aeroporto:['Aeroporto',['aeroporto','check-in','documentos','bagagem','portão','horários','segurança','imigração','atrasos','embarque']],
 transporte:['Transportes',['transportes','pontos','passagens','direções','táxi','metrô','ônibus','tempo de trajeto','conexões','rota completa']],
 trabalho:['Trabalho',['profissões','local de trabalho','rotina','horários','tarefas','colegas','pedidos','reuniões','problemas','conversa profissional']],
 compras:['Compras',['lojas','preços','tamanhos','cores','experimentando','comparando','pagamento','descontos','trocas','compra completa']],
 saude:['Saúde',['corpo','como se sente','sintomas','farmácia','consulta','dor','hábitos','orientações','marcando consulta','conversa completa']],
 casa:['Casa e rotina',['cômodos','objetos','onde está','minha casa','tarefas','manhã','noite','convidando alguém','problemas','conversa completa']]
};
let guided=null,busy=false;
let originals={};
function state(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return {}}}
function methodSession(){try{return JSON.parse(sessionStorage.getItem(METHOD_SESSION)||'null')}catch{return null}}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
function currentVoice(){return state().voice||'Aoede'}
function currentTeacher(){return state().teacher||'media'}
function currentLevel(){return String(state().level||'A1').toUpperCase()}
function card(){return document.querySelector('#home .professorPanel')}
function setRobot(name){const c=card();if(!c)return;c.classList.remove('robot-listening','robot-thinking','robot-speaking','robot-happy','robot-oops','robot-angry');if(name)c.classList.add('robot-'+name)}
function setBusy(on){busy=!!on;const b=document.querySelector('#home .homeChatSend'),m=document.querySelector('#homeChatMic');if(b)b.disabled=busy;b?.classList.toggle('ai-busy',busy);m?.classList.toggle('ai-busy',busy)}
function addMsg(text,who){const box=document.querySelector('#homeInlineChatBox');if(!box||!text)return;const d=document.createElement('div');d.className='homeChatMsg '+who;d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight}
async function speak(text,emotion='neutral'){if(!text)return;setRobot(emotion==='angry'?'angry':emotion==='oops'?'oops':emotion==='happy'?'happy':'speaking');try{await window.geminiSpeak?.(text,'pt-BR',currentVoice())}catch{}setRobot('')}
function courseContext(moduleTitle){
 const s=state(),level=currentLevel(),mods=MODULES[level]||MODULES.A1;let mi=mods.findIndex(x=>norm(x)===norm(moduleTitle));if(mi<0)mi=0;const title=mods[mi];const done=s.done&&typeof s.done==='object'?s.done:{};const completed=[];for(let i=0;i<8;i++)if(done[`${level}-${mi}-${i}`])completed.push(i);let next=0;while(next<8&&done[`${level}-${mi}-${next}`])next++;if(next>7)next=7;const allowedMax=Math.max(next,completed.length?Math.max(...completed):0);const allowed=LESSON_TYPES.slice(0,allowedMax+1);const forbidden=LESSON_TYPES.slice(allowedMax+1);const scope=level==='A1'?(A1_SCOPE[title]||`somente o tema ${title}`):`somente o conteúdo diretamente ligado ao módulo “${title}” no nível ${level}, sem puxar módulos seguintes.`;
 return `Curso ${level}. Módulo ${mi+1} de 12: ${title}. Progresso neste módulo: ${completed.length}/8 aulas concluídas. Aula atual permitida: ${next+1} — ${LESSON_TYPES[next]}. Aulas/conteúdos liberados para treino: ${allowed.map((x,i)=>`${i+1}. ${x}`).join('; ')}. ${forbidden.length?`Conteúdos ainda NÃO liberados: ${forbidden.join('; ')}.`:'Todas as 8 aulas deste módulo já foram liberadas.'} Escopo específico: ${scope} REGRA ABSOLUTA: pratique apenas este módulo e apenas até a aula atual/liberada. Não introduza conteúdos de módulos futuros.`;
}
function methodContext(sess){const data=METHOD[sess?.themeId]||METHOD.familia;const lesson=Math.max(1,Math.min(40,Number(sess?.lesson)||1));const stageIndex=Math.floor((lesson-1)/4);const part=((lesson-1)%4)+1;return `Método independente: ${data[0]}. Aula ${lesson} de 40. Bloco permitido: ${data[1][stageIndex]} — parte ${part}. Ensine somente este assunto e esta progressão. Não misture curso A1-C2, não mude para outro tema e não transforme em conversa livre.`}
function matchModule(text){const mods=MODULES[currentLevel()]||[];const n=norm(text);const num=n.match(/(?:modulo )?(\d{1,2})/);if(num){const i=Number(num[1])-1;if(mods[i])return mods[i]}if(/esse|atual|primeiro contato|primeiros contato/.test(n)){const t=(document.querySelector('#nextLessonTitle')?.textContent||'').split('·')[0].trim();if(t)return t}let best='',score=0;for(const m of mods){const mn=norm(m);if(n.includes(mn))return m;const s=mn.split(' ').filter(w=>w.length>2&&n.includes(w)).length;if(s>score){score=s;best=m}}return score?best:''}
function setPill(text){const p=document.querySelector('#homeTopicPill');if(p)p.textContent=text}
async function guidedAsk(message,{showUser=true}={}){
 if(!guided||busy)return;if(showUser&&message!=='__START__')addMsg(message,'user');setBusy(true);setRobot('thinking');
 try{
  const s=state();const body={learning_mode:guided.kind,learning_context:guided.context,message,level:guided.level,personality:s.teacher||'media',turn:guided.turn,error_streak:guided.errors,history:guided.history.slice(-12)};
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d?.details||d?.error||'guided');
  const reply=[d.reply_pt,d.reply_en].filter(Boolean).join(d.reply_pt&&d.reply_en?'\n':'');guided.history.push({role:'user',content:message},{role:'assistant',content:reply});guided.turn++;if(d.verdict==='wrong'||d.verdict==='almost')guided.errors=Math.min(20,guided.errors+1);else if(d.verdict==='correct')guided.errors=Math.max(0,guided.errors-1);addMsg(reply,'bot');setBusy(false);await speak(reply,d.emotion||'neutral');
 }catch(e){setBusy(false);const msg='A conexão demorou. Vamos continuar exatamente desta aula. Tente responder de novo.';addMsg(msg,'bot');await speak(msg,'oops')}
}
async function beginCourse(moduleTitle){guided={kind:'course',phase:'learning',level:currentLevel(),topic:moduleTitle,context:courseContext(moduleTitle),history:[],turn:0,errors:0};document.querySelector('#homeModulePicker')?.classList.remove('open');setPill(`🧩 ${guided.level} · ${moduleTitle}`);await guidedAsk('__START__',{showUser:false})}
function beginMethodFromSession(sess){const data=METHOD[sess?.themeId]||METHOD.familia;guided={kind:'method',phase:'learning',level:currentLevel(),topic:data[0],context:methodContext(sess),history:[],turn:0,errors:0};setPill(`← ${data[0]} · Aula ${sess.lesson}/40`)}
function install(){
 if(window.__guidedV43)return;window.__guidedV43=true;
 originals.start=window.startV26Conversation;originals.send=window.v26Send;originals.mic=window.v26Mic;originals.pick=window.pickV26Module;originals.close=window.closeV26Conversation;originals.change=window.changeV26Topic;
 if(typeof originals.start==='function')window.startV26Conversation=async function(...a){const activeModule=document.querySelector('#home [data-v26mode="module"]')?.classList.contains('active');const ms=methodSession();const r=await originals.start.apply(this,a);if(ms){beginMethodFromSession(ms);return r}if(activeModule){guided={kind:'course',phase:'choose',level:currentLevel(),topic:'',context:'',history:[],turn:0,errors:0};setPill('🧩 Escolhendo módulo')}else guided=null;return r};
 if(typeof originals.pick==='function')window.pickV26Module=function(i){if(guided?.kind==='course'&&guided.phase==='choose'){const m=(MODULES[currentLevel()]||[])[Number(i)];if(m)beginCourse(m);return}return originals.pick.apply(this,arguments)};
 if(typeof originals.send==='function')window.v26Send=function(){const input=document.querySelector('#homeChatInput');const text=String(input?.value||'').trim();const ms=methodSession();if(ms&&document.querySelector('#home .homeTalkCard.chat-open')){if(!guided||guided.kind!=='method')beginMethodFromSession(ms);if(!text)return;input.value='';if(guided.turn===0&&/aula particular somente sobre este tema/i.test(text))guidedAsk('__START__',{showUser:false});else guidedAsk(text);return}if(guided?.kind==='course'){if(!text||busy)return;input.value='';if(guided.phase==='choose'){addMsg(text,'user');const m=matchModule(text);if(!m){document.querySelector('#homeModulePicker')?.classList.add('open');const msg='Escolha um módulo pelo nome ou pelo número. Vou praticar somente o conteúdo já liberado nele.';addMsg(msg,'bot');speak(msg,'oops');return}beginCourse(m);return}guidedAsk(text);return}return originals.send.apply(this,arguments)};
 if(typeof originals.mic==='function')window.v26Mic=function(){if(!guided)return originals.mic.apply(this,arguments);if(busy||card()?.classList.contains('audio-speaking'))return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;const r=new SR();r.lang=guided.phase==='choose'?'pt-BR':'en-US';r.interimResults=false;r.maxAlternatives=1;setRobot('listening');r.onresult=e=>{setRobot('');const t=e.results?.[0]?.[0]?.transcript;if(!t)return;if(guided.phase==='choose'){addMsg(t,'user');const m=matchModule(t);m?beginCourse(m):(addMsg('Não identifiquei o módulo. Fale o número ou o nome.','bot'),speak('Não identifiquei o módulo. Fale o número ou o nome.','oops'))}else guidedAsk(t)};r.onerror=()=>{setRobot('oops');setTimeout(()=>setRobot(''),700)};r.onend=()=>{if(card()?.classList.contains('robot-listening'))setRobot('')};r.start()};
 if(typeof originals.change==='function')window.changeV26Topic=function(){if(guided?.kind==='course'){guided.phase='choose';guided.topic='';guided.context='';guided.history=[];guided.turn=0;guided.errors=0;setPill('🧩 Escolhendo módulo');document.querySelector('#homeModulePicker')?.classList.add('open');return}return originals.change.apply(this,arguments)};
 if(typeof originals.close==='function')window.closeV26Conversation=function(...a){guided=null;setBusy(false);return originals.close.apply(this,a)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,350));else setTimeout(install,350);
})();
