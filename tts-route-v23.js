(()=>{
'use strict';

const OLD_TTS='https://meu-ingles-claudio.netlify.app/api/gemini-tts';
const NEW_TTS='https://meu-ingles-livid.vercel.app/api/gemini-tts';
const OLD_CHAT='https://meu-ingles-claudio.netlify.app/api/groq-chat';
const NEW_CHAT='https://meu-ingles-livid.vercel.app/api/groq-chat';
const nativeFetch=window.fetch.bind(window);

try{
  if(window.speechSynthesis){
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak=()=>{};
  }
}catch(e){}

function routedUrl(url){
  if(!url)return null;
  const s=String(url);
  if(s===OLD_TTS||s.startsWith(OLD_TTS+'?'))return s.replace(OLD_TTS,NEW_TTS);
  if(s===OLD_CHAT||s.startsWith(OLD_CHAT+'?'))return s.replace(OLD_CHAT,NEW_CHAT);
  return null;
}

window.MEU_INGLES_TTS_URL=NEW_TTS;
window.MEU_INGLES_CHAT_URL=NEW_CHAT;
window.fetch=function(input,init){
  try{
    const url=typeof input==='string'||input instanceof URL?String(input):input?.url;
    const next=routedUrl(url);
    if(next){
      if(typeof Request!=='undefined'&&input instanceof Request){
        input=new Request(next,input);
      }else{
        input=next;
      }
    }
  }catch(e){
    console.warn('Meu Inglês route shim',e);
  }
  return nativeFetch(input,init);
};
})();
