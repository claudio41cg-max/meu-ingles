(()=>{
'use strict';
const NORMAL_ROBOT='assets/robot-professor.svg?v=26';
const TALK_ROBOT='assets/robot-professor-conversation.svg?v=33';
const IDLE=['idle-curious','idle-smirk','idle-surprised','idle-wink'];
const ACTIVE=['robot-listening','robot-thinking','robot-speaking','robot-happy','robot-oops','robot-angry'];
let scheduled=false;
let moodTimer=null;
let moodIndex=0;

function home(){return document.querySelector('#home')}
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function activeConversation(){const h=home(),c=card();return !!(h?.classList.contains('conversation-focus')&&c?.classList.contains('chat-open'))}

function clearIdle(c){if(c)c.classList.remove(...IDLE)}
function hasActiveMood(c){return !!c&&(ACTIVE.some(x=>c.classList.contains(x))||c.classList.contains('audio-speaking'))}

function applyIdleMood(){
 const c=card();
 if(!activeConversation()||!c||hasActiveMood(c)){clearIdle(c);return}
 clearIdle(c);
 let choices=IDLE;
 if(c.classList.contains('persona-tranquilo'))choices=['idle-curious','idle-smirk'];
 if(c.classList.contains('persona-hard'))choices=['idle-curious','idle-smirk','idle-wink'];
 const next=choices[moodIndex%choices.length];
 moodIndex++;
 c.classList.add(next);
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
   if(!img.dataset.v33Normal)img.dataset.v33Normal=img.getAttribute('src')||NORMAL_ROBOT;
   if(!String(img.getAttribute('src')||'').includes('robot-professor-conversation.svg'))img.setAttribute('src',TALK_ROBOT);
 }else if(img.dataset.v33Normal){
   img.setAttribute('src',img.dataset.v33Normal||NORMAL_ROBOT);
   delete img.dataset.v33Normal;
 }
}

function talkButtonHtml(){return '<span class="robotTalkGlyph" aria-hidden="true">🎙️</span>'}
function ensureTalkButton(){
 const c=card();const wrap=c?.querySelector('.robotVisual');
 if(!c||!wrap)return;
 let b=wrap.querySelector('.robotTalkButton');
 if(!activeConversation()){
   b?.remove();
   return;
 }
 if(!b){
   b=document.createElement('button');
   b.type='button';
   b.className='robotTalkButton';
   b.setAttribute('aria-label','Falar com o professor');
   b.innerHTML=talkButtonHtml();
   b.addEventListener('click',e=>{
     e.preventDefault();e.stopPropagation();
     if(typeof window.v26Mic==='function')window.v26Mic();
   });
   wrap.appendChild(b);
 }
 updateTalkButton(c,b);
}

function updateTalkButton(c,b){
 if(!b)return;
 const glyph=b.querySelector('.robotTalkGlyph');
 if(!glyph)return;
 if(c?.classList.contains('robot-listening')){glyph.textContent='🎙️';b.setAttribute('aria-label','Ouvindo você')}
 else if(c?.classList.contains('robot-thinking')){glyph.textContent='•••';b.setAttribute('aria-label','Professor pensando')}
 else if(c?.classList.contains('audio-speaking')||c?.classList.contains('robot-speaking')){glyph.textContent='🔊';b.setAttribute('aria-label','Professor falando')}
 else{glyph.textContent='🎙️';b.setAttribute('aria-label','Falar com o professor')}
}

function hookTextSend(){
 const btn=document.querySelector('#home .homeChatSend');
 if(btn&&!btn.dataset.v33Send){
   btn.dataset.v33Send='1';
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
 if(input&&!input.dataset.v33Enter){
   input.dataset.v33Enter='1';
   input.addEventListener('keydown',e=>{
     if(e.key==='Enter'&&!e.shiftKey){
       e.preventDefault();
       const value=String(input.value||'').trim();
       if(value&&typeof window.v26Send==='function')window.v26Send();
     }
   },true);
 }
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
 ensureTalkButton();
 hookTextSend();
 const c=card();
 if(c){
   if(hasActiveMood(c))clearIdle(c);
   updateTalkButton(c,c.querySelector('.robotTalkButton'));
 }
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
