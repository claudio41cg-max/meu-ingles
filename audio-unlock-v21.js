(()=>{
'use strict';

const NativeAudioContext=window.AudioContext||window.webkitAudioContext;
if(!NativeAudioContext)return;

let sharedContext=null;

function getSharedContext(){
  if(!sharedContext||sharedContext.state==='closed'){
    try{sharedContext=new NativeAudioContext()}catch(e){return null}
  }
  return sharedContext;
}

function unlockAudio(){
  const ctx=getSharedContext();
  if(!ctx)return;
  if(ctx.state==='suspended'){
    try{
      const p=ctx.resume();
      if(p&&typeof p.catch==='function')p.catch(()=>{});
    }catch(e){}
  }
}

function SharedAudioContext(){
  return getSharedContext()||new NativeAudioContext();
}

SharedAudioContext.prototype=NativeAudioContext.prototype;
try{Object.setPrototypeOf(SharedAudioContext,NativeAudioContext)}catch(e){}

try{window.AudioContext=SharedAudioContext}catch(e){}
try{if(window.webkitAudioContext)window.webkitAudioContext=SharedAudioContext}catch(e){}

['pointerdown','touchstart','mousedown','keydown'].forEach(type=>{
  document.addEventListener(type,unlockAudio,{capture:true,passive:true});
});

window.meuInglesUnlockAudio=unlockAudio;
})();
