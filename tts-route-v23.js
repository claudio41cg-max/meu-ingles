(()=>{
'use strict';

const OLD_TTS='https://meu-ingles-claudio.netlify.app/api/gemini-tts';
const NEW_TTS='https://meu-ingles-livid.vercel.app/api/gemini-tts';
const nativeFetch=window.fetch.bind(window);

function shouldRoute(url){
  if(!url)return false;
  const s=String(url);
  return s===OLD_TTS||s.startsWith(OLD_TTS+'?');
}

window.MEU_INGLES_TTS_URL=NEW_TTS;
window.fetch=function(input,init){
  try{
    const url=typeof input==='string'||input instanceof URL?String(input):input?.url;
    if(shouldRoute(url)){
      const next=String(url).replace(OLD_TTS,NEW_TTS);
      if(typeof Request!=='undefined'&&input instanceof Request){
        input=new Request(next,input);
      }else{
        input=next;
      }
    }
  }catch(e){
    console.warn('TTS route shim',e);
  }
  return nativeFetch(input,init);
};
})();
