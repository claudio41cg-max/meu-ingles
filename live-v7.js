(function(){
  const LIVE_SCENARIOS=['Livre','Restaurante','Aeroporto','Bar','Hotel','Trabalho'];
  function one(sel){return document.querySelector(sel)}
  function liveState(){
    try{
      if(typeof state!=='undefined'){
        if(!state.scenario)state.scenario='Livre';
        return state;
      }
    }catch(e){}
    return {teacher:'media',level:'A1',scenario:'Livre'};
  }
  function liveSave(){try{if(typeof save==='function')save()}catch(e){}}
  function replaceChatScreen(){
    const chat=document.getElementById('chat');if(!chat)return;
    chat.innerHTML=`<div class="top"><button class="back" onclick="openScreen('home')">‹</button><h2>Conversa Viva</h2></div>
      <div class="modePanel"><h3>🎭 Personalidade</h3><p class="muted">Escolha como o professor reage. O nível de inglês continua separado.</p><div id="liveModes" class="liveModeStrip"></div></div>
      <div class="liveHero">
        <span class="liveBadge">✨ PROFESSOR AO VIVO</span>
        <div class="mascotWrap"><div class="mascotGlow"></div><div id="liveMascot" class="mascot"><div class="mascotMouth"></div></div></div>
        <div id="liveStatus" class="liveStatus">Pronto para conversar</div>
        <div id="liveHint" class="liveHint">Escolha uma situação e toque no microfone.</div>
        <div id="liveScenarios" class="scenarioStrip"></div>
        <button id="liveMicBtn" class="liveMic" onclick="liveVoiceChat()">🎙️</button>
        <div id="liveAiState" class="aiState pending">🧠 Verificando conexão…</div>
        <div class="transcriptMini"><small>Você disse</small><b id="liveLastHeard">—</b><small style="margin-top:8px">Assistente</small><b id="liveLastReply">—</b></div>
        <div id="chatBox" style="display:none"></div>
      </div>`;
  }
  function personalityClass(){const s=liveState();return s.teacher==='pesada'?'hard':s.teacher==='media'?'doida':''}
  window.liveSetMascotState=function(kind){
    const m=one('#liveMascot'),st=one('#liveStatus');if(!m)return;
    m.classList.remove('listening','thinking','speaking','hard','doida');
    const pc=personalityClass();if(pc)m.classList.add(pc);if(kind&&kind!=='idle')m.classList.add(kind);
    if(st)st.textContent=kind==='listening'?'Tô te ouvindo...':kind==='thinking'?'Deixa eu pensar...':kind==='speaking'?'Falando com você...':'Pronto para conversar';
  };
  function renderModes(){
    const el=one('#liveModes');if(!el)return;const s=liveState();
    const items=[['leve','🙂','Tranquilo'],['media','🤪','Doideira'],['pesada','🔥','Hard 18+']];
    el.innerHTML=items.map(([k,i,l])=>`<button class="liveModeBtn ${k==='pesada'?'hard':''} ${s.teacher===k?'active':''}" onclick="liveSetTeacher('${k}')">${i} ${l}</button>`).join('');
  }
  window.liveSetTeacher=function(t){const s=liveState();s.teacher=t;liveSave();renderModes();liveSetMascotState('idle')};
  function renderScenarios(){const el=one('#liveScenarios');if(!el)return;const s=liveState();el.innerHTML=LIVE_SCENARIOS.map(x=>`<button class="scenarioBtn ${s.scenario===x?'active':''}" onclick="liveSetScenario('${x}')">${x}</button>`).join('')}
  window.liveSetScenario=function(x){const s=liveState();s.scenario=x;liveSave();renderScenarios();const h=one('#liveHint');if(h)h.textContent=x==='Livre'?'Converse sobre qualquer assunto.':`Situação: ${x}. Fale como se estivesse nela.`};
  window.liveVoiceChat=window.liveVoiceChat||function(){};
  function init(){replaceChatScreen();renderModes();renderScenarios();liveSetMascotState('idle')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
