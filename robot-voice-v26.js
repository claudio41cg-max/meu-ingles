(()=>{
'use strict';
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function startTalking(){const c=card();if(c)c.classList.add('audio-speaking')}
function stopTalking(){const c=card();if(c)c.classList.remove('audio-speaking')}
function hookAudio(a){
 if(!a||a.dataset.robotVoiceHook)return;
 a.dataset.robotVoiceHook='1';
 a.addEventListener('playing',startTalking);
 a.addEventListener('play',startTalking);
 a.addEventListener('ended',stopTalking);
 a.addEventListener('pause',stopTalking);
 a.addEventListener('error',stopTalking);
 a.addEventListener('abort',stopTalking);
}
function scan(){document.querySelectorAll('audio').forEach(hookAudio)}
function init(){
 scan();
 new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTalking()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120));else setTimeout(init,120);
})();
