(function(){
  let history=[];
  const ENDPOINT='https://meu-ingles-claudio.netlify.app/api/groq-chat';
  function st(){try{return typeof state!=='undefined'?state:null}catch(e){return null}}
  function saveSafe(){try{if(typeof save==='function')save()}catch(e){}}
  function mode(){const x=st();return x&&x.teacher?x.teacher:'media'}
  function level(){const x=st();return x&&x.level?x.level:'A1'}
  function faceMarkup(){return '<div class="coachHalo"></div><div class="coachShell"><div class="coachEyes"><span></span><span></span></div><div class="coachMouth"><i></i><i></i><i></i><i></i><i></i></div></div>'}
  function paintOrb(el,kind){if(!el)return;el.classList.remove('listening','thinking','speaking','hard','doida');if(mode()==='pesada')el.classList.add('hard');else if(mode()==='media')el.classList.add('doida');if(kind&&kind!=='idle')el.classList.add(kind)}
  function allOrbs(kind){document.querySelectorAll('.coachOrb').forEach(x=>paintOrb(x,kind));try{if(typeof liveSetMascotState==='function')liveSetMascotState(kind)}catch(e){}}
  function fallbackSpeak(text,lang='pt-BR'){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=lang.startsWith('en')?.9:.98;u.onstart=()=>allOrbs('speaking');u.onend=()=>allOrbs('idle');speechSynthesis.speak(u)}catch(e){allOrbs('idle')}}
  async function speakOne(text,lang='pt-BR'){if(!text)return;try{if(window.GEMINI_TTS){const ok=await GEMINI_TTS.speak(text,lang);if(ok)return}}catch(e){}fallbackSpeak(text,lang)}
  async function speakBoth(pt,en){allOrbs('speaking');await speakOne(pt,'pt-BR');if(en){await new Promise(r=>setTimeout(r,120));await speakOne(en,'en-US')}allOrbs('idle')}
  function setMode(m){const x=st();if(!x)return;x.teacher=m;saveSafe();renderModeButtons();allOrbs('idle')}
  window.coachSetMode=setMode;
  function renderModeButtons(){document.querySelectorAll('[data-coach-mode]').forEach(b=>b.classList.toggle('active',b.dataset.coachMode===mode()))}
  function levelChips(){return ['A1','A2','B1','B2','C1','C2'].map(x=>`<span class="coachLevelChip ${x===level()?'current':''}">${x}</span>`).join('')}
  function injectHome(){
    const home=document.getElementById('home'),hero=home&&home.querySelector('.hero');if(!home||!hero)return;
    const old=document.getElementById('coachHome');if(old)old.remove();
    const block=document.createElement('section');block.id='coachHome';block.className='coachHome';
    block.innerHTML=`<div class="coachHead"><div><h2>Professor IA</h2><p>Acompanha suas aulas e reage conforme o estilo escolhido.</p></div><span id="coachBackend" class="coachOnline">verificando…</span></div><div class="coachStage"><div id="coachHomeOrb" class="coachOrb">${faceMarkup()}</div><div class="coachCopy"><h3>Aprender primeiro. Zoar depois.</h3><p>O nível A1 a C2 controla a dificuldade. Tranquilo, Doideira e Hard controlam só a personalidade.</p><div class="coachLevelStrip">${levelChips()}</div></div></div><div class="coachModeTitle">Como o professor reage nas tarefas</div><div class="coachModes"><button data-coach-mode="leve" class="coachMode" onclick="coachSetMode('leve')">🙂 Tranquilo</button><button data-coach-mode="media" class="coachMode" onclick="coachSetMode('media')">🤪 Doideira</button><button data-coach-mode="pesada" class="coachMode hard" onclick="coachSetMode('pesada')">🔥 Hard 18+</button></div><div class="coachActions"><button class="coachPrimary" onclick="openScreen('course')">📚 Continuar curso</button><button class="coachSecondary" onclick="openScreen('chat')">🗣️ Conversa livre</button></div>`;
    hero.insertAdjacentElement('afterend',block);renderModeButtons();paintOrb(document.getElementById('coachHomeOrb'),'idle');checkBackend();
  }
  async function checkBackend(){
    const badge=document.getElementById('coachBackend'),live=document.getElementById('liveAiState');
    try{
      const r=await fetch(ENDPOINT,{method:'GET',cache:'no-store'});const d=await r.json();const ok=!!(r.ok&&d.ok&&d.key_configured);
      if(badge){badge.className='coachOnline '+(ok?'ok':'bad');badge.textContent=ok?'IA online':'IA indisponível'}
      if(live){live.className='aiState '+(ok?'connected':'pending');live.textContent=ok?'🧠 IA conectada · Groq/Gemini':'⚠️ IA indisponível agora'}
      return ok;
    }catch(e){if(badge){badge.className='coachOnline bad';badge.textContent='IA offline'}if(live){live.className='aiState pending';live.textContent='⚠️ Servidor da IA não respondeu'}return false}
  }
  async function ask(payload){const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let d={};try{d=await r.json()}catch(e){}if(!r.ok)throw new Error(d.error||('http_'+r.status));return d}
  function patchChat(){
    window.liveVoiceChat=async function(){
      let rec=null;try{rec=await prep()}catch(e){}if(!rec)return;
      const btn=document.getElementById('liveMicBtn'),heardEl=document.getElementById('liveLastHeard'),replyEl=document.getElementById('liveLastReply'),hint=document.getElementById('liveHint'),badge=document.getElementById('liveAiState');
      if(btn)btn.classList.add('listening');if(hint)hint.textContent='Pode falar. Eu tô ouvindo.';allOrbs('listening');
      rec.onresult=async e=>{
        const text=e.results[0][0].transcript;if(heardEl)heardEl.textContent=text;if(btn)btn.classList.remove('listening');if(hint)hint.textContent='Pensando…';allOrbs('thinking');
        try{
          const s=st()||{level:'A1',teacher:'media',scenario:'Livre'};
          const d=await ask({mode:'conversation',message:text,level:s.level||'A1',personality:s.teacher||'media',scenario:s.scenario||'Livre',history:history.slice(-8)});
          history.push({role:'user',content:text},{role:'assistant',content:[d.reply_pt,d.reply_en].filter(Boolean).join(' ')});history=history.slice(-10);
          if(replyEl)replyEl.textContent=[d.reply_pt,d.reply_en].filter(Boolean).join(' • ');
          if(badge){badge.className='aiState connected';badge.textContent=`🧠 IA online${d.provider?' · '+d.provider:''}`}
          if(hint)hint.textContent='Respondendo por voz…';await speakBoth(d.reply_pt||'',d.reply_en||'');if(hint)hint.textContent='Pode continuar.';
        }catch(err){console.warn(err);allOrbs('idle');if(replyEl)replyEl.textContent='A IA não respondeu agora. Tente novamente.';if(badge){badge.className='aiState pending';badge.textContent='⚠️ IA temporariamente indisponível'}if(hint)hint.textContent='Tente novamente em alguns segundos.'}
      };
      rec.onerror=()=>{if(btn)btn.classList.remove('listening');allOrbs('idle');if(hint)hint.textContent='Não consegui entender. Tente novamente.'};
      rec.onend=()=>{if(btn)btn.classList.remove('listening')};
      try{rec.start()}catch(e){allOrbs('idle')}
    };
  }
  function wrapLevel(){if(window.__coachLevelWrapped)return;try{const old=window.setLevel;window.setLevel=function(l){const r=old.apply(this,arguments);setTimeout(()=>{injectHome();renderModeButtons()},30);return r};window.__coachLevelWrapped=true}catch(e){}}
  function init(){injectHome();patchChat();wrapLevel();renderModeButtons();setTimeout(checkBackend,350)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80));else setTimeout(init,80);
})();
