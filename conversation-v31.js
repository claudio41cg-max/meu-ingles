(()=>{
'use strict';
const KEY='meuInglesStableV2';
let scheduled=false;
function state(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function personaClass(){const t=state().teacher||'media';return t==='pesada'?'persona-hard':t==='leve'?'persona-tranquilo':'persona-doideira'}
function faceHtml(){return '<div class="robotFaceOverlay" aria-hidden="true"><span class="rBrow left"></span><span class="rBrow right"></span><span class="rEye left"></span><span class="rEye right"></span><span class="rMouth"></span></div>'}
function ensureRobotVisual(){
 const c=card();if(!c)return;
 c.classList.remove('persona-tranquilo','persona-doideira','persona-hard');c.classList.add(personaClass());
 const stage=c.querySelector('.homeRobotStage');const img=stage?.querySelector('.homeRobot');if(!stage||!img)return;
 let wrap=stage.querySelector('.robotVisual');
 if(!wrap){
   wrap=document.createElement('div');wrap.className='robotVisual';
   img.parentNode.insertBefore(wrap,img);wrap.appendChild(img);wrap.insertAdjacentHTML('beforeend',faceHtml());
 }else if(!wrap.querySelector('.robotFaceOverlay'))wrap.insertAdjacentHTML('beforeend',faceHtml());
}
function decorate(){scheduled=false;ensureRobotVisual()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(decorate)}
function init(){
 schedule();
 const home=document.querySelector('#home');if(home)new MutationObserver(schedule).observe(home,{childList:true,subtree:true});
 document.addEventListener('click',e=>{if(e.target.closest('[data-mode]'))setTimeout(schedule,60)},true);
 window.addEventListener('storage',e=>{if(e.key===KEY)schedule()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,220));else setTimeout(init,220);
})();
