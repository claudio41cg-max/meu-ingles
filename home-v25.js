(()=>{
'use strict';
const KEY='meuInglesStableV2';
let homeConversationMode='module';
let chatObserver=null;

function state(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function teacherMode(){return state().teacher||'media'}
function modeActive(m){return teacherMode()===m?'active':''}
function currentModuleTitle(){
  const t=(document.querySelector('#nextLessonTitle')?.textContent||'').trim();
  if(!t)return 'conteúdo atual';
  return (t.split('·')[0]||t).trim();
}
function currentLevel(){return state().level||'A1'}

function applyHome(){
  const home=document.querySelector('#home');
  if(!home)return;
  const panel=home.querySelector('.professorPanel');
  if(panel){
    panel.innerHTML=`
      <div class="homeConversationTop">
        <h2>Converse em inglês</h2>
        <button class="teacherTypesBtn" onclick="openTeacherTypes()">🤖 Tipos de professor</button>
      </div>
      <p class="homeConversationIntro">Pratique com a IA no tema do módulo atual ou converse livremente.</p>
      <div class="homeRobotStage"><img class="homeRobot" src="assets/robot-professor.svg?v=25" alt="Robô professor"></div>
      <div class="homeConversationChoices">
        <button class="homeConversationChoice ${homeConversationMode==='module'?'active':''}" data-home-conversation="module" onclick="chooseHomeConversation('module')"><span class="ico">📚</span><span><b>Tema do módulo</b><small>Revisar o que você estudou</small></span></button>
        <button class="homeConversationChoice ${homeConversationMode==='free'?'active':''}" data-home-conversation="free" onclick="chooseHomeConversation('free')"><span class="ico">∞</span><span><b>Modo livre</b><small>Conversar sobre qualquer assunto</small></span></button>
      </div>
      <div class="modeRow homeModes">
        <button data-mode="leve" class="mode ${modeActive('leve')}" onclick="setStableTeacher('leve')">🙂 Tranquilo</button>
        <button data-mode="media" class="mode ${modeActive('media')}" onclick="setStableTeacher('media')">🤪 Doideira</button>
        <button data-mode="pesada" class="mode hard ${modeActive('pesada')}" onclick="setStableTeacher('pesada')">🔥 Hard 18+</button>
      </div>
      <button class="homeStartConversation" onclick="startHomeConversation()">💬 Conversar agora</button>`;
  }
  const quick=home.querySelector('.quickGrid');
  if(quick){
    quick.innerHTML=`<button class="quickCard goalOnly" onclick="openConversationFromHomeCard()"><span>🗣️</span><span class="goalCopy"><b>Conversar</b><small>Converse com a IA por voz.</small></span><span class="goalArrow">›</span></button>`;
  }
}

window.chooseHomeConversation=mode=>{
  homeConversationMode=mode==='free'?'free':'module';
  document.querySelectorAll('[data-home-conversation]').forEach(b=>b.classList.toggle('active',b.dataset.homeConversation===homeConversationMode));
};

window.openTeacherTypes=()=>{
  window.stableShow?.('settings');
  setTimeout(()=>{
    const h=[...document.querySelectorAll('#settings h3')].find(x=>/Personalidade do professor/i.test(x.textContent||''));
    h?.scrollIntoView({behavior:'smooth',block:'start'});
  },120);
};

window.openConversationFromHomeCard=()=>{
  window.stableShow?.('home');
  setTimeout(()=>{
    document.querySelector('#home .professorPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
    window.startV26Conversation?.();
  },90);
};

window.openDailyGoal=()=>{
  window.stableShow?.('settings');
  setTimeout(()=>{
    const h=[...document.querySelectorAll('#settings h3')].find(x=>/Meta diária/i.test(x.textContent||''));
    h?.scrollIntoView({behavior:'smooth',block:'start'});
  },120);
};

function swapBottomNav(){
  const b=document.querySelector('nav button[data-screen="chat"], nav button[data-screen="goal"]');
  if(!b)return;
  b.dataset.screen='goal';
  b.innerHTML='<i>🎯</i>Minha meta';
  if(b.dataset.goalSwap)return;
  b.dataset.goalSwap='1';
  b.addEventListener('click',e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    window.openDailyGoal?.();
  },true);
}

function moduleScenario(){
  const module=currentModuleTitle(),level=currentLevel();
  return `Módulo atual: ${module}. Nível ${level}. Faça uma conversa de revisão usando somente vocabulário, frases e situações que o aluno já estudou neste módulo. Reaproveite o conteúdo do módulo e varie as perguntas sem puxar assunto de módulos futuros, a menos que o aluno peça.`;
}

window.startHomeConversation=()=>{
  const scenario=homeConversationMode==='free'?'Livre':moduleScenario();
  window.setStableScenario?.(scenario);
  window.stableShow?.('chat');
  setTimeout(()=>{ensureChatRobot();updateChatContext();},30);
};

function ensureChatRobot(){
  const bot=document.querySelector('#chatBot');
  if(!bot)return;
  bot.classList.add('robotSvgBot');
  if(!bot.querySelector('img[data-robot-professor]')){
    bot.innerHTML='<img data-robot-professor src="assets/robot-professor.svg?v=25" alt="Robô professor">';
  }
  const title=document.querySelector('#chat .chatCoach h2');
  if(title)title.textContent='Professor ao vivo';
  setupChatObserver();
}

function updateChatContext(){
  const row=document.querySelector('#chat .scenarioRow');
  if(!row)return;
  let badge=document.querySelector('#chatContextBadge');
  if(!badge){badge=document.createElement('div');badge.id='chatContextBadge';badge.className='chatContextBadge';row.parentNode.insertBefore(badge,row)}
  const s=state().scenario||'Livre';
  if(s.startsWith('Módulo atual:')){
    const m=(s.match(/^Módulo atual:\s*([^\.]+)/)||[])[1]||currentModuleTitle();
    badge.textContent=`📚 Conversa baseada no módulo: ${m}`;
  }else badge.textContent=`💬 Conversa livre: ${s}`;
}

function reactRobot(text){
  const bot=document.querySelector('#chatBot');if(!bot)return;
  bot.classList.remove('robotHappy','robotOops');
  const t=String(text||'').toLowerCase();
  const bad=/quase|tenta|tente|errou|errado|ainda não|não foi|presta atenção/.test(t);
  const good=/boa|acert|certo|perfeito|mandou bem|aí sim|agora sim/.test(t);
  bot.classList.add(bad?'robotOops':good?'robotHappy':'robotHappy');
  setTimeout(()=>bot.classList.remove('robotHappy','robotOops'),1000);
}

function setupChatObserver(){
  if(chatObserver)return;
  const box=document.querySelector('#chatBox');if(!box)return;
  chatObserver=new MutationObserver(list=>{
    for(const m of list){
      for(const n of m.addedNodes){
        if(n.nodeType===1&&n.classList?.contains('botmsg'))reactRobot(n.textContent||'');
      }
    }
  });
  chatObserver.observe(box,{childList:true});
}

function hookGlobals(){
  swapBottomNav();
  const oldShow=window.stableShow;
  if(typeof oldShow==='function'&&!oldShow.__home25){
    const wrapped=function(id){const r=oldShow(id);setTimeout(()=>{if(id==='home')applyHome();if(id==='chat'){ensureChatRobot();updateChatContext()}swapBottomNav()},0);return r};
    wrapped.__home25=true;window.stableShow=wrapped;
  }
  const oldScenario=window.setStableScenario;
  if(typeof oldScenario==='function'&&!oldScenario.__home25){
    const wrappedScenario=function(s){const r=oldScenario(s);setTimeout(()=>{ensureChatRobot();updateChatContext()},0);return r};
    wrappedScenario.__home25=true;window.setStableScenario=wrappedScenario;
  }
  document.querySelectorAll('nav button').forEach(b=>{
    if(b.dataset.home25)return;b.dataset.home25='1';
    b.addEventListener('click',()=>setTimeout(()=>{if(b.dataset.screen==='home')applyHome();if(b.dataset.screen==='chat'){ensureChatRobot();updateChatContext()}swapBottomNav()},20));
  });
}

function init(){hookGlobals();swapBottomNav();applyHome();ensureChatRobot();updateChatContext();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,40));else setTimeout(init,40);
})();
