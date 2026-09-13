(()=>{
'use strict';

let lastFallback='';
let lastFallbackAt=0;

function removeFirstIntroBubble(){
  const bubbles=[...document.querySelectorAll('#onboarding .onboardBubble')];
  const target=bubbles.find(el=>String(el.textContent||'').includes('Eu vou ensinar, ouvir você falar e reagir ao que acontecer na aula'));
  if(target)target.remove();
}

function currentA15AudioText(){
  const word=document.querySelector('#courseBody .b14Word');
  const wordText=String(word?.textContent||'').trim();
  if(wordText)return wordText;

  const btn=document.querySelector('#courseBody .b14Listen[onclick*="a15Speak"]');
  const code=btn?.getAttribute('onclick')||'';
  const m=code.match(/a15Speak\('([^']+)'\)/);
  if(m){
    try{return decodeURIComponent(m[1])}catch{return m[1]}
  }
  return '';
}

function fallbackA15Voice(){
  const warn=document.querySelector('#a15Voice');
  if(!warn)return;
  const msg=String(warn.textContent||'');
  if(!msg.includes('Gemini não carregou'))return;

  const text=currentA15AudioText();
  if(!text)return;

  const now=Date.now();
  const key=text;
  warn.textContent='';
  if(key===lastFallback&&now-lastFallbackAt<1800)return;
  lastFallback=key;
  lastFallbackAt=now;

  if(typeof window.stableSpeakEnglish==='function'){
    window.stableSpeakEnglish(encodeURIComponent(text));
  }
}

function apply(){
  removeFirstIntroBubble();
  fallbackA15Voice();
}

const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',apply,{once:true});
}else{
  apply();
}
})();
