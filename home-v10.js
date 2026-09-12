(function(){
  function st(){
    try{return typeof state!=='undefined'?state:null}catch(e){return null}
  }
  function teacher(){const s=st();return s&&s.teacher?s.teacher:'media'}
  function renderModes(){
    const box=document.getElementById('homeLiveModes');if(!box)return;
    const t=teacher();
    box.innerHTML=[
      ['leve','🙂','Tranquilo'],
      ['media','🤪','Doideira'],
      ['pesada','🔥','Hard 18+']
    ].map(([k,ico,label])=>`<button class="homeMode ${k==='pesada'?'hard':''} ${t===k?'active':''}" onclick="homeSetMode('${k}')">${ico}<br>${label}</button>`).join('');
    paintPersonality();
  }
  function paintPersonality(){
    const m=document.getElementById('homeTotem');if(!m)return;
    m.classList.remove('hard','doida');
    const t=teacher();if(t==='pesada')m.classList.add('hard');else if(t==='media')m.classList.add('doida');
  }
  function setHomeState(kind){
    const m=document.getElementById('homeTotem'),status=document.getElementById('homeLiveStatus'),sub=document.getElementById('homeLiveSub'),btn=document.getElementById('homeTalkBtn');
    if(m){m.classList.remove('listening','thinking','speaking');paintPersonality();if(kind&&kind!=='idle')m.classList.add(kind)}
    if(status)status.textContent=kind==='listening'?'Tô te ouvindo...':kind==='thinking'?'Deixa eu pensar...':kind==='speaking'?'Tô falando com você...':'Bora conversar?';
    if(sub)sub.textContent=kind==='listening'?'Fala normalmente. Eu vou entender e responder.':kind==='thinking'?'A IA está montando a resposta.':kind==='speaking'?'A resposta vem por voz.':'Escolha o nível da resenha e toque em falar.';
    if(btn)btn.classList.toggle('listening',kind==='listening');
  }
  function inject(){
    const home=document.getElementById('home');if(!home||document.getElementById('homeLive'))return;
    const hero=home.querySelector('.hero');if(!hero)return;
    const block=document.createElement('section');block.id='homeLive';block.className='homeLive';
    block.innerHTML=`
      <div class="homeLiveTop">
        <div><h2>🗣️ Conversa Viva</h2><p>Converse de verdade com sua professora de IA.</p></div>
        <div class="homeAiDot">IA conectada</div>
      </div>
      <div class="homeTotemWrap">
        <div class="homeTotemGlow"></div>
        <div id="homeTotem" class="homeTotem"><div class="homeTotemMouth"></div></div>
      </div>
      <div id="homeLiveStatus" class="homeStatus">Bora conversar?</div>
      <div id="homeLiveSub" class="homeSubstatus">Escolha o nível da resenha e toque em falar.</div>
      <div id="homeLiveModes" class="homeModes"></div>
      <button id="homeTalkBtn" class="homeTalkBtn" onclick="homeStartLive()"><span class="micIco">🎙️</span> Falar agora</button>
      <div class="homeLiveFoot">Tranquilo ensina com calma · Doideira provoca · Hard 18+ vai ficando mais pesado quando você insiste no mesmo erro.</div>`;
    hero.insertAdjacentElement('afterend',block);
    renderModes();setHomeState('idle');
    const ai=block.querySelector('.homeAiDot');if(ai&&!window.MEU_INGLES_AI_ENDPOINT)ai.textContent='IA local';
  }
  window.homeSetMode=function(mode){
    try{if(typeof window.liveSetTeacher==='function')window.liveSetTeacher(mode);else{const s=st();if(s){s.teacher=mode;try{save()}catch(e){}}}}catch(e){}
    renderModes();setHomeState('idle');
  };
  window.homeStartLive=function(){
    setHomeState('listening');
    if(typeof window.liveVoiceChat==='function')return window.liveVoiceChat();
    try{toast('Conversa Viva ainda está carregando. Tente novamente em um instante.')}catch(e){}
    setHomeState('idle');
  };
  function wrapGlobals(){
    if(typeof window.liveSetMascotState==='function'&&!window.__homeMascotWrapped){
      const old=window.liveSetMascotState;
      window.liveSetMascotState=function(kind){const r=old.apply(this,arguments);setHomeState(kind);return r};
      window.__homeMascotWrapped=true;
    }
    if(typeof window.liveSetTeacher==='function'&&!window.__homeTeacherWrapped){
      const old=window.liveSetTeacher;
      window.liveSetTeacher=function(mode){const r=old.apply(this,arguments);renderModes();paintPersonality();return r};
      window.__homeTeacherWrapped=true;
    }
  }
  function init(){inject();wrapGlobals();renderModes();setHomeState('idle')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80));else setTimeout(init,80);
})();
