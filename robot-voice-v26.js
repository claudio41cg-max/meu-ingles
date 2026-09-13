(()=>{
'use strict';
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function hook(){
 const old=window.geminiSpeak;
 if(typeof old!=='function'||old.__robotVoice26)return;
 const wrapped=async function(...args){
   const c=card();
   if(c){c.classList.remove('robot-thinking','robot-listening','robot-happy','robot-oops','robot-angry');c.classList.add('robot-speaking')}
   try{return await old.apply(this,args)}finally{if(c)c.classList.remove('robot-speaking')}
 };
 wrapped.__robotVoice26=true;window.geminiSpeak=wrapped;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(hook,180));else setTimeout(hook,180);
})();
