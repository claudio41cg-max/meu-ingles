(()=>{
'use strict';
const NORMAL_ROBOT='assets/robot-professor.svg?v=26';
const TALK_ROBOT='assets/robot-professor-conversation.svg?v=33';
const IDLE=['idle-front','idle-smile','idle-alert','idle-surprised'];
const ACTIVE=['robot-listening','robot-thinking','robot-speaking','robot-happy','robot-oops','robot-angry'];
let scheduled=false;
let moodTimer=null;
let moodIndex=0;

function home(){return document.querySelector('#home')}
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function activeConversation(){const h=home(),c=card();return !!(h?.classList.contains('conversation-focus')&&c?.classList.contains('chat-open'))}
function clearIdle(c){if(c)c.classList.remove(...IDLE,'idle-curious','idle-smirk','idle-wink')}
function hasActiveMood(c){return !!c&&(ACTIVE.some(x=>c.classList.contains(x))||c.classList.contains('audio-speaking'))}

function applyIdleMood(){
 const c=card();
 if(!activeConversation()||!c||hasActiveMood(c)){clearIdle(c);return}
 clearIdle(c);
 let choices=IDLE;
 if(c.classList.contains('persona-tranquilo'))choices=['idle-front','idle-smile','idle-alert'];
 if(c.classList.contains('persona-hard'))choices=['idle-front','idle-alert','idle-smile'];
 if(c.classList.contains('persona-doideira'))choices=['idle-smile','idle-alert','idle-surprised','idle-front'];
 c.classList.add(choices[moodIndex%choices.length]);
 moodIndex++;
}

function manageMoodTimer(){
 if(activeConversation()){
   if(!moodTimer){applyIdleMood();moodTimer=setInterval(applyIdleMood,3900)}
 }else{
   if(moodTimer){clearInterval(moodTimer);moodTimer=null}
   clearIdle(card());
 }
}

function setRobotAsset(){
 const c=card();const img=c?.querySelector('.homeRobot');
 if(!img)return;
 if(activeConversation()){
   if(!img.dataset.v34Normal)img.dataset.v34Normal=img.getAttribute('src')||NORMAL_ROBOT;
   if(!String(img.getAttribute('src')||'').includes('robot-professor-conversation.svg'))img.setAttribute('src',TALK_ROBOT);
 }else if(img.dataset.v34Normal){
   img.setAttribute('src',img.dataset.v34Normal||NORMAL_ROBOT);
   delete img.dataset.v34Normal;
 }
}

function removeChestMic(){
 document.querySelectorAll('#home .robotTalkButton').forEach(x=>x.remove());
}

function hookTextSend(){
 const btn=document.querySelector('#home .homeChatSend');
 if(btn&&!btn.dataset.v34Send){
   btn.dataset.v34Send='1';
   btn.type='button';
   btn.removeAttribute('onclick');
   btn.addEventListener('click',e=>{
     e.preventDefault();e.stopPropagation();
     const input=document.querySelector('#homeChatInput');
     if(!input||!String(input.value||'').trim())return;
     if(typeof window.v26Send==='function')window.v26Send();
   });
 }
 const input=document.querySelector('#homeChatInput');
 if(input&&!input.dataset.v34Enter){
   input.dataset.v34Enter='1';
   input.addEventListener('keydown',e=>{
     if(e.key==='Enter'&&!e.shiftKey){
       e.preventDefault();
       if(String(input.value||'').trim()&&typeof window.v26Send==='function')window.v26Send();
     }
   },true);
 }
}

function hookMic(){
 const mic=document.querySelector('#homeChatMic');
 if(!mic||mic.dataset.v34Mic)return;
 mic.dataset.v34Mic='1';
 mic.type='button';
 mic.addEventListener('click',e=>{
   e.preventDefault();e.stopPropagation();
   if(typeof window.v26Mic==='function')window.v26Mic();
 },true);
}

function lockScreen(){
 const on=activeConversation();
 document.documentElement.classList.toggle('conversation-screen-lock-root',on);
 document.body.classList.toggle('conversation-screen-lock',on);
 if(on)window.scrollTo(0,0);
}

function decorate(){
 scheduled=false;
 lockScreen();
 setRobotAsset();
 removeChestMic();
 hookTextSend();
 hookMic();
 const c=card();
 if(c&&hasActiveMood(c))clearIdle(c);
 manageMoodTimer();
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(decorate)}

function init(){
 schedule();
 const h=home();
 if(h)new MutationObserver(schedule).observe(h,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearIdle(card());else schedule()});
 window.addEventListener('resize',schedule,{passive:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,260));else setTimeout(init,260);
})();
