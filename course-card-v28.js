(()=>{
'use strict';

const KEY='meuInglesStableV2';
const MODULES={
A1:['Primeiros contatos','Alfabeto, números e dados pessoais','Família e pessoas','Rotina diária','Perguntas e hábitos','Casa e cidade','Comida e restaurante','Compras e preços','Direções e transporte','Tempo livre e habilidades','Ontem e fim de semana','Projeto A1: um dia completo em inglês'],
A2:['Rotina em movimento','Histórias do passado','Planos e futuro','Comparando coisas','Viagem e hotel','Saúde e bem-estar','Trabalho e estudo','Experiências de vida','Serviços e problemas','Contando uma história','Vida social','Projeto A2: viagem completa'],
B1:['Experiências e passado','Narrativas mais claras','Futuro e decisões','Condições reais','Conselho e obrigação','Voz passiva básica','Pessoas e coisas','O que alguém disse','Phrasal verbs essenciais','Opiniões e argumentos','Inglês no trabalho e viagem','Projeto B1: conversa de 10 minutos'],
B2:['Tempo e duração','Hipóteses','Desejos e arrependimentos','Passiva avançada','Relato e interpretação','Dedução e probabilidade','Conectando ideias','Expressões naturais','Comunicação profissional','Notícias e mídia','Debate e persuasão','Projeto B2: apresentação e debate'],
C1:['Nuances de tempo e aspecto','Ênfase e inversão','Modalidade avançada','Registro e nominalização','Colocações e idiomaticidade','Escrita profissional e acadêmica','Apresentações de alto nível','Debate e pensamento crítico','Inglês social e humor','Inglês profissional avançado','Escuta rápida e sotaques','Projeto C1: painel profissional'],
C2:['Precisão e escolha de registro','Modalidade e posicionamento','Retórica e persuasão','Linguagem figurada','Idiomaticidade profunda','Argumentação complexa','Edição e precisão','Mediação e paráfrase','Velocidade, sotaques e ruído','Cultura, humor e pragmática','Domínio profissional','Projeto C2: domínio total']
};
const TYPES=['Vocabulário e escuta','Gramática em contexto','Frases essenciais','Compreensão auditiva','Leitura e interpretação','Produção escrita','Conversação com IA','Desafio do módulo'];

function state(){
  try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}
}
function nextLesson(){
  const s=state();
  const level=(s.level||'A1').toUpperCase();
  const done=s.done&&typeof s.done==='object'?s.done:{};
  for(let m=0;m<12;m++)for(let n=0;n<8;n++){
    if(!done[`${level}-${m}-${n}`])return {level,m,n,complete:false};
  }
  return {level,m:11,n:7,complete:true};
}
function updateCard(){
  const title=document.querySelector('#nextLessonTitle');
  const meta=document.querySelector('#nextLessonMeta');
  if(!title||!meta)return;
  const n=nextLesson();
  if(title.textContent!=='Todos os Cursos')title.textContent='Todos os Cursos';
  let text='';
  if(n.complete){
    text=`${n.level} concluído · toque no card para ver todos os módulos`;
  }else{
    const module=(MODULES[n.level]||[])[n.m]||'Módulo atual';
    const type=TYPES[n.n]||'Aula';
    text=`${n.level} · ${module} · Aula ${n.n+1} · ${type}`;
  }
  if(meta.textContent!==text)meta.textContent=text;
}

function init(){
  updateCard();
  const oldShow=window.stableShow;
  if(typeof oldShow==='function'&&!oldShow.__courseCardV28){
    const wrapped=function(id){
      const r=oldShow(id);
      if(id==='home')setTimeout(updateCard,40);
      return r;
    };
    wrapped.__courseCardV28=true;
    window.stableShow=wrapped;
  }
  window.addEventListener('focus',()=>setTimeout(updateCard,30));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,160));
else setTimeout(init,160);
})();
