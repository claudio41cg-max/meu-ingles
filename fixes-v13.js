(function(){
  function faceMarkup(){return '<div class="coachHalo"></div><div class="coachShell"><div class="coachEyes"><span></span><span></span></div><div class="coachMouth"><i></i><i></i><i></i><i></i><i></i></div></div>'}

  function repairMascot(){
    const m=document.getElementById('liveMascot');if(!m)return;
    m.classList.remove('proMascot');
    m.classList.add('coachOrb','liveCoachOrb');
    if(!m.querySelector('.coachShell'))m.innerHTML=faceMarkup();
    try{if(typeof liveSetMascotState==='function')liveSetMascotState('idle')}catch(e){}
  }

  async function speakWord(en){
    en=String(en||'').trim();if(!en)return;
    let ok=false;
    try{if(window.GEMINI_TTS)ok=await GEMINI_TTS.speak(en,'en-US',{style:'Natural English teaching voice. Pronounce the word clearly once, at normal speed.'})}catch(e){}
    if(ok)return;
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(en);u.lang='en-US';u.rate=.85;speechSynthesis.speak(u)}catch(e){}
  }

  function wireVocabulary(){
    const course=document.getElementById('course');if(!course)return;
    [...course.querySelectorAll('.lessonSection')].forEach(sec=>{
      const h=sec.querySelector('h3');if(!h||!h.textContent.includes('Vocabulário'))return;
      if(!sec.querySelector('.vocabHint')){
        const hint=document.createElement('div');hint.className='vocabHint';hint.textContent='Toque em cada palavra para ouvir a pronúncia.';h.insertAdjacentElement('afterend',hint);
      }
      sec.querySelectorAll('.vocabRow').forEach(row=>{
        if(row.dataset.v13==='1')return;row.dataset.v13='1';row.classList.add('vocabInteractive');row.setAttribute('role','button');row.setAttribute('tabindex','0');
        const word=(row.querySelector('b')?.textContent||'').trim(),pt=(row.querySelector('span')?.textContent||'').trim();
        const play=async()=>{row.classList.add('playing');try{if(typeof toast==='function')toast(`🔊 ${word}${pt?' · '+pt:''}`)}catch(e){};await speakWord(word);setTimeout(()=>row.classList.remove('playing'),250)};
        row.addEventListener('click',play);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();play()}});
      });
    });
  }

  async function refreshAiStatus(){
    const badge=document.getElementById('coachBackend'),live=document.getElementById('liveAiState'),endpoint=window.MEU_INGLES_AI_ENDPOINT||'';
    if(!endpoint)return;
    try{
      const r=await fetch(endpoint,{method:'GET',cache:'no-store'}),d=await r.json();
      const ok=r.ok&&d.ok&&d.key_configured;
      if(badge){badge.className='coachOnline '+(ok?'ok':'bad');badge.textContent=ok?'IA online':'IA sem chave'}
      if(live){live.className='aiState '+(ok?'connected':'pending');live.textContent=ok?'🧠 IA conectada. Groq com Gemini de reserva.':'⚠️ Servidor da IA sem chave.'}
    }catch(e){
      if(badge){badge.className='coachOnline bad';badge.textContent='Servidor offline'}
      if(live){live.className='aiState pending';live.textContent='⚠️ O servidor da IA ainda não respondeu.'}
    }
  }

  function init(){repairMascot();wireVocabulary();refreshAiStatus();
    const target=document.body;if(target){new MutationObserver(()=>{repairMascot();wireVocabulary()}).observe(target,{childList:true,subtree:true})}
    setInterval(refreshAiStatus,30000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,450));else setTimeout(init,450);
})();
