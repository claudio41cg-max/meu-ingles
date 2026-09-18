(()=>{
'use strict';
const NORMAL_ROBOT='assets/robot-professor.svg?v=26';
const TALK_ROBOT='assets/robot-professor-conversation.svg?v=33';
const IDLE=['idle-front','idle-smile','idle-alert','idle-surprised'];
const ACTIVE=['robot-listening','robot-thinking','robot-speaking','robot-happy','robot-oops','robot-angry'];
let scheduled=false;
let moodTimer=null;
let moodIndex=0;
let recognition=null;
let listening=false;
let lastMicStart=0;

function home(){return document.querySelector('#home')}
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function activeConversation(){const h=home(),c=card();return !!(h?.classList.contains('conversation-focus')&&c?.classList.contains('chat-open'))}
function clearIdle(c){if(c)c.classList.remove(...IDLE,'idle-curious','idle-smirk','idle-wink')}
function hasActiveMood(c){return !!c&&(ACTIVE.some(x=>c.classList.contains(x))||c.classList.contains('audio-speaking'))}
function setRobotState(name){const c=card();if(!c)return;c.classList.remove(...ACTIVE);if(name)c.classList.add('robot-'+name)}

function applyIdleMood(){
 const c=card();
 if(!activeConversation()||!c||hasActiveMood(c)){clearIdle(c);return}
 clearIdle(c);
 const choices=c.classList.contains('persona-hard')?['idle-front','idle-alert','idle-smile']:
   c.classList.contains('persona-tranquilo')?['idle-front','idle-smile','idle-alert']:
   ['idle-smile','idle-alert','idle-surprised','idle-front'];
 c.classList.add(choices[moodIndex%choices.length]);
 moodIndex++;
}

function manageMoodTimer(){
 if(activeConversation()){
   if(!moodTimer){applyIdleMood();moodTimer=setInterval(applyIdleMood,4200)}
 }else{
   if(moodTimer){clearInterval(moodTimer);moodTimer=null}
   clearIdle(card());
 }
}

function setRobotAsset(){
 const c=card();const img=c?.querySelector('.homeRobot');
 if(!img)return;
 if(activeConversation()){
   if(!img.dataset.v35Normal)img.dataset.v35Normal=img.getAttribute('src')||NORMAL_ROBOT;
   if(!String(img.getAttribute('src')||'').includes('robot-professor-conversation.svg'))img.setAttribute('src',TALK_ROBOT);
 }else if(img.dataset.v35Normal){
   img.setAttribute('src',img.dataset.v35Normal||NORMAL_ROBOT);
   delete img.dataset.v35Normal;
 }
}

function lockScreen(){
 /* A conversa deve continuar rolável no navegador. Remove a trava antiga
    que fixava html/body/main e fazia a segunda tela parecer congelada. */
 document.documentElement.classList.remove('conversation-screen-lock-root');
 document.body.classList.remove('conversation-screen-lock');
}

function micLang(){
 const pill=(document.querySelector('#homeTopicPill')?.textContent||'').toLowerCase();
 return pill.includes('escolhendo')?'pt-BR':'en-US';
}

function cleanupRecognition(){
 listening=false;
 recognition=null;
 const mic=document.querySelector('#homeChatMic');
 mic?.classList.remove('listening','voice-busy');
 if(card()?.classList.contains('robot-listening'))setRobotState('');
}

function showMicError(kind){
 const input=document.querySelector('#homeChatInput');
 if(!input)return;
 const old=input.placeholder;
 input.placeholder=kind==='no-speech'?'Não ouvi. Toque no microfone e fale novamente.':'Não consegui ouvir agora. Tente novamente.';
 setTimeout(()=>{if(input&&input.placeholder!==old)input.placeholder='Digite sua resposta...'},1800);
}

function robustMic(){
 const now=Date.now();
 if(now-lastMicStart<700)return;
 if(listening&&recognition){try{recognition.stop()}catch{};return}
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){showMicError('unsupported');return}
 lastMicStart=now;
 const mic=document.querySelector('#homeChatMic');
 const r=new SR();
 recognition=r;
 listening=true;
 r.lang=micLang();
 r.interimResults=false;
 r.continuous=false;
 r.maxAlternatives=1;
 setRobotState('listening');
 mic?.classList.add('listening');

 r.onresult=e=>{
   const transcript=String(e?.results?.[0]?.[0]?.transcript||'').trim();
   cleanupRecognition();
   if(!transcript){showMicError('no-speech');return}
   const input=document.querySelector('#homeChatInput');
   if(!input)return;
   input.value=transcript;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   setTimeout(()=>{
     if(typeof window.v26Send==='function')window.v26Send();
   },40);
 };
 r.onerror=e=>{
   const type=e?.error||'error';
   cleanupRecognition();
   if(type!=='aborted')showMicError(type);
 };
 r.onend=()=>cleanupRecognition();
 try{r.start()}catch{cleanupRecognition();showMicError('start')}
}

function bindMic(){
 const mic=document.querySelector('#homeChatMic');
 if(!mic||mic.dataset.v35Mic)return;
 mic.dataset.v35Mic='1';
 mic.type='button';
 mic.removeAttribute('onclick');
 mic.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();robustMic()});
}

function bindSend(){
 const btn=document.querySelector('#home .homeChatSend');
 if(!btn||btn.dataset.v35Send)return;
 btn.dataset.v35Send='1';
 btn.type='button';
 btn.removeAttribute('onclick');
 btn.addEventListener('click',e=>{
   e.preventDefault();e.stopPropagation();
   const input=document.querySelector('#homeChatInput');
   if(!input||!String(input.value||'').trim())return;
   if(typeof window.v26Send==='function')window.v26Send();
 });
}

function stopRecognitionWhenLeaving(){
 if(activeConversation())return;
 if(recognition){try{recognition.abort()}catch{}}
 cleanupRecognition();
}

function decorate(){
 scheduled=false;
 lockScreen();
 setRobotAsset();
 document.querySelectorAll('#home .robotTalkButton').forEach(x=>x.remove());
 bindMic();
 bindSend();
 stopRecognitionWhenLeaving();
 const c=card();if(c&&hasActiveMood(c))clearIdle(c);
 manageMoodTimer();
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(decorate)}

function init(){
 /* A v35 assume sozinha a camada de interação. Nada de segundo acionamento do microfone. */
 window.v26Mic=robustMic;
 schedule();
 const h=home();
 if(h)new MutationObserver(schedule).observe(h,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&recognition){try{recognition.abort()}catch{}}else schedule()});
 window.addEventListener('resize',schedule,{passive:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,280));else setTimeout(init,280);
})();
