(()=>{
'use strict';

/*
  conversation-v35
  Responsabilidade: aparência, estados visuais e pequenos ajustes da conversa.
  IMPORTANTE: este arquivo NÃO controla microfone.
  #homeChatMic pertence exclusivamente ao gemini-live-v38 quando a esfera está aberta.
*/

const NORMAL_ROBOT='assets/robot-professor.svg?v=26';
const TALK_ROBOT='assets/robot-professor-conversation.svg?v=33';
const IDLE=['idle-front','idle-smile','idle-alert','idle-surprised'];
const ACTIVE=['robot-listening','robot-thinking','robot-speaking','robot-happy','robot-oops','robot-angry'];

let scheduled=false;
let moodTimer=null;
let moodIndex=0;

function home(){return document.querySelector('#home')}
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function activeConversation(){
  const h=home(),c=card();
  return !!(h?.classList.contains('conversation-focus')&&c?.classList.contains('chat-open'));
}
function clearIdle(c){
  if(c)c.classList.remove(...IDLE,'idle-curious','idle-smirk','idle-wink');
}
function hasActiveMood(c){
  return !!c&&(ACTIVE.some(x=>c.classList.contains(x))||c.classList.contains('audio-speaking'));
}

function applyIdleMood(){
  const c=card();
  if(!activeConversation()||!c||hasActiveMood(c)){clearIdle(c);return}
  clearIdle(c);
  const choices=c.classList.contains('persona-hard')
    ?['idle-front','idle-alert','idle-smile']
    :c.classList.contains('persona-tranquilo')
      ?['idle-front','idle-smile','idle-alert']
      :['idle-smile','idle-alert','idle-surprised','idle-front'];
  c.classList.add(choices[moodIndex%choices.length]);
  moodIndex++;
}

function manageMoodTimer(){
  if(activeConversation()){
    if(!moodTimer){
      applyIdleMood();
      moodTimer=setInterval(applyIdleMood,4200);
    }
  }else{
    if(moodTimer){clearInterval(moodTimer);moodTimer=null}
    clearIdle(card());
  }
}

function setRobotAsset(){
  const c=card();
  const img=c?.querySelector('.homeRobot');
  if(!img)return;

  if(activeConversation()){
    if(!img.dataset.v35Normal)img.dataset.v35Normal=img.getAttribute('src')||NORMAL_ROBOT;
    if(!String(img.getAttribute('src')||'').includes('robot-professor-conversation.svg')){
      img.setAttribute('src',TALK_ROBOT);
    }
  }else if(img.dataset.v35Normal){
    img.setAttribute('src',img.dataset.v35Normal||NORMAL_ROBOT);
    delete img.dataset.v35Normal;
  }
}

function unlockScreen(){
  document.documentElement.classList.remove('conversation-screen-lock-root');
  document.body.classList.remove('conversation-screen-lock');
}

function bindSend(){
  const btn=document.querySelector('#home .homeChatSend');
  if(!btn||btn.dataset.v35Send)return;
  btn.dataset.v35Send='1';
  btn.type='button';
  btn.removeAttribute('onclick');
  btn.addEventListener('click',e=>{
    /*
      Se o Live estiver ativo, gemini-live-v38 intercepta este clique em capture.
      Fora disso, mantém compatibilidade com o envio de texto da v26.
    */
    e.preventDefault();
    e.stopPropagation();
    const input=document.querySelector('#homeChatInput');
    if(!input||!String(input.value||'').trim())return;
    if(typeof window.v26Send==='function')window.v26Send();
  });
}

function decorate(){
  scheduled=false;
  unlockScreen();
  setRobotAsset();
  document.querySelectorAll('#home .robotTalkButton').forEach(x=>x.remove());
  bindSend();
  const c=card();
  if(c&&hasActiveMood(c))clearIdle(c);
  manageMoodTimer();
}

function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(decorate);
}

function init(){
  schedule();
  const h=home();
  if(h){
    new MutationObserver(schedule).observe(h,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','src']
    });
  }
  window.addEventListener('resize',schedule,{passive:true});
}

/* Limpeza defensiva de qualquer marca antiga deixada pela v35 anterior. */
document.addEventListener('click',e=>{
  const mic=e.target?.closest?.('#homeChatMic');
  if(mic&&mic.dataset.v35Mic)delete mic.dataset.v35Mic;
},true);

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,280));
}else{
  setTimeout(init,280);
}
})();
