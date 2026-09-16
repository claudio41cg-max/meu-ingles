(()=>{
'use strict';
const COURSE_SELECTOR='#home .homeConversationChoice[data-v26mode="module"]';
const MIC_SELECTOR='#homeChatMic';
let speakWrapped=false;

function chatOpen(){return !!document.querySelector('#home .homeTalkCard.chat-open')}
function courseMode(){return chatOpen()&&!!document.querySelector(COURSE_SELECTOR)?.classList.contains('active')}
function live(){return window.MeuInglesGeminiLiveV38}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}

function stopLiveIfNeeded(){
 const l=live();
 try{if(l&&(l.state?.running||l.state?.starting))l.stop?.()}catch{}
}

function wrapTTS(){
 if(speakWrapped||typeof window.geminiSpeak!=='function')return;
 const original=window.geminiSpeak;
 window.geminiSpeak=async function(...args){
  const ok=await original.apply(this,args);
  if(ok!==false||!courseMode())return ok;
  for(let i=0;i<24;i++){
   if(!document.querySelector('#home .homeTalkCard.audio-speaking'))break;
   await wait(250);
  }
  await wait(180);
  if(!courseMode())return ok;
  return original.apply(this,args);
 };
 speakWrapped=true;
}

function interceptCourseMic(e){
 const target=e.target?.closest?.(MIC_SELECTOR);
 if(!target||!courseMode())return;
 stopLiveIfNeeded();
 e.preventDefault();
 e.stopPropagation();
 e.stopImmediatePropagation();
 Promise.resolve().then(()=>window.v26Mic?.());
}

function watchCourseStart(e){
 const target=e.target?.closest?.('#home .homeStartConversation');
 if(!target)return;
 const active=!!document.querySelector(COURSE_SELECTOR)?.classList.contains('active');
 if(active)setTimeout(stopLiveIfNeeded,0);
}

function init(){
 wrapTTS();
 document.addEventListener('click',interceptCourseMic,true);
 document.addEventListener('click',watchCourseStart,true);
 window.addEventListener('pageshow',()=>{wrapTTS();if(courseMode())stopLiveIfNeeded()});
 setTimeout(wrapTTS,700);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
