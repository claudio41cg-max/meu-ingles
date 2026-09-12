(function(){
  const LIVE_SCENARIOS=['Livre','Restaurante','Aeroporto','Bar','Hotel','Trabalho'];
  let liveHistory=[];
  function one(sel){return document.querySelector(sel)}
  function liveState(){
    if(typeof state!=='undefined'){
      if(!state.voiceName)state.voiceName='';
      if(!state.scenario)state.scenario='Livre';
      return state;
    }
    return {teacher:'media',level:'A1',voiceName:'',scenario:'Livre'};
  }
  function liveSave(){try{if(typeof save==='function')save()}catch(e){console.warn(e)}}
  function mutateTeacherLabels(){
    try{
      TEACHERS.leve=['🙂','Tranquilo','Paciente, natural e com brincadeira leve','TRANQUILO'];
      TEACHERS.media=['🤪','Doideira','Zoeira solta, provoca e comemora junto','DOIDEIRA'];
      TEACHERS.pesada=['🔥','Hard 18+','Humor adulto, gírias e palavrões na brincadeira','HARD 18+'];
    }catch(e){console.warn(e)}
  }
  function replaceChatScreen(){
    const chat=document.getElementById('chat');
    if(!chat)return;
    chat.innerHTML=`
      <div class="top"><button class="back" onclick="openScreen('home')">‹</button><h2>Conversa Viva</h2></div>
      <div class="modePanel"><h3>🎭 Personalidade</h3><p class="muted">Escolha o nível da resenha.</p><div id="liveModes" class="liveModeStrip"></div></div>
      <div class="liveHero">
        <span class="liveBadge">✨ PROFESSOR AO VIVO</span>
        <div class="mascotWrap"><div class="mascotGlow"></div><div id="liveMascot" class="mascot"><div class="mascotMouth"></div></div></div>
        <div id="liveStatus" class="liveStatus">Pronto para conversar</div>
        <div id="liveHint" class="liveHint">Escolha uma situação e toque no microfone.</div>
        <div id="liveScenarios" class="scenarioStrip"></div>
        <button id="liveMicBtn" class="liveMic" onclick="liveVoiceChat()">🎙️</button>
        <div class="voiceOnlyNote">A resposta principal é por voz. O texto fica só como apoio.</div>
        <div class="liveControls"><select id="liveVoiceSelect" class="selectBox" onchange="liveSetVoice(this.value)"></select><button class="btn" onclick="livePreviewVoice()">🔊 Testar voz</button></div>
        <div id="liveAiState" class="aiState pending">🧠 Conversa Viva pronta. Falta apenas conectar a IA real pelo servidor seguro.</div>
        <div class="transcriptMini"><small>Você disse</small><b id="liveLastHeard">—</b><small style="margin-top:8px">Assistente</small><b id="liveLastReply">—</b></div>
        <div id="chatBox" style="display:none"></div>
      </div>`;
  }
  function updateHomeCard(){
    const buttons=[...document.querySelectorAll('.card')];
    const b=buttons.find(x=>x.getAttribute('onclick')&&x.getAttribute('onclick').includes("openScreen('chat')"));
    if(b)b.innerHTML='<div class="ico">🗣️</div><h3>Conversa Viva <span style="font-size:10px;color:#69c7ff">NOVO</span></h3><p>Fale com o personagem e receba resposta por voz.</p>';
    const nav=[...document.querySelectorAll('nav button')].find(x=>x.dataset.s==='chat');
    if(nav)nav.innerHTML='<i>🗣️</i>Conversar';
  }
  function personalityClass(){const s=liveState();return s.teacher==='pesada'?'hard':s.teacher==='media'?'doida':''}
  window.liveSetMascotState=function(kind){
    const m=one('#liveMascot'),st=one('#liveStatus'); if(!m)return;
    m.classList.remove('listening','thinking','speaking','hard','doida');
    const pc=personalityClass();if(pc)m.classList.add(pc);if(kind&&kind!=='idle')m.classList.add(kind);
    if(st)st.textContent=kind==='listening'?'Tô te ouvindo...':kind==='thinking'?'Deixa eu pensar...':kind==='speaking'?'Falando com você...':'Pronto para conversar';
  }
  function liveRenderModes(){
    const el=one('#liveModes');if(!el)return;const s=liveState();
    const items=[['leve','🙂','Tranquilo'],['media','🤪','Doideira'],['pesada','🔥','Hard 18+']];
    el.innerHTML=items.map(([k,ico,label])=>`<button class="liveModeBtn ${k==='pesada'?'hard':''} ${s.teacher===k?'active':''}" onclick="liveSetTeacher('${k}')">${ico} ${label}</button>`).join('');
  }
  window.liveSetTeacher=function(t){
    const s=liveState();s.teacher=t;liveSave();liveRenderModes();liveSetMascotState('idle');
    const text=t==='leve'?'Fechado, Cláudio. Modo tranquilo ativado.':t==='media'?'Aí sim, Cláudio. Modo doideira ativado. Agora segura a resenha.':'Modo hard dezoito mais ativado, Cláudio. Agora a zoeira vem sem filtro.';
    liveSpeakPt(text);
    try{if(typeof renderTeachers==='function')renderTeachers()}catch(e){}
  }
  function liveRenderScenarios(){
    const el=one('#liveScenarios');if(!el)return;const s=liveState();
    el.innerHTML=LIVE_SCENARIOS.map(x=>`<button class="scenarioBtn ${s.scenario===x?'active':''}" onclick="liveSetScenario('${x}')">${x}</button>`).join('');
  }
  window.liveSetScenario=function(x){const s=liveState();s.scenario=x;liveSave();liveRenderScenarios();const h=one('#liveHint');if(h)h.textContent=x==='Livre'?'Converse sobre qualquer assunto.':`Situação: ${x}. Fale como se estivesse nela.`;liveSpeakPt(`Situação ${x} selecionada.`)}
  function voiceList(){return speechSynthesis.getVoices()||[]}
  function chosenVoice(){const s=liveState();const all=voiceList();return all.find(v=>v.name===s.voiceName)||all.find(v=>/^pt(-|_)?br/i.test(v.lang))||all.find(v=>/^pt/i.test(v.lang))||null}
  window.livePopulateVoices=function(){
    const sel=one('#liveVoiceSelect');if(!sel)return;const s=liveState(),all=voiceList();let pts=all.filter(v=>/^pt(-|_)?br/i.test(v.lang)||/^pt/i.test(v.lang));if(!pts.length)pts=all;
    sel.innerHTML='<option value="">🎙️ Voz automática</option>'+pts.map(v=>`<option value="${v.name.replace(/"/g,'&quot;')}">${v.name} · ${v.lang}</option>`).join('');sel.value=s.voiceName||'';
  }
  window.liveSetVoice=function(name){const s=liveState();s.voiceName=name;liveSave();try{toast(name?'Voz alterada':'Voz automática')}catch(e){}}
  window.liveSpeakPt=function(text,rate=1){
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='pt-BR';u.rate=rate;u.pitch=1;const v=chosenVoice();if(v)u.voice=v;
    u.onstart=()=>liveSetMascotState('speaking');u.onend=()=>liveSetMascotState('idle');speechSynthesis.speak(u);
  }
  window.livePreviewVoice=function(){const s=liveState();liveSpeakPt(s.teacher==='pesada'?'E aí, Cláudio. Essa é a minha voz no modo hard. Bora nessa porra.':s.teacher==='media'?'E aí, Cláudio! Essa é a minha voz. Bora aprender inglês na resenha.':'Olá, Cláudio. Essa é a minha voz. Vamos praticar inglês juntos.')}
  function englishVoice(){const all=voiceList();return all.find(v=>/^en(-|_)?us/i.test(v.lang))||all.find(v=>/^en/i.test(v.lang))||null}
  function liveSpeakBoth(pt,en){
    speechSynthesis.cancel();const a=new SpeechSynthesisUtterance(pt);a.lang='pt-BR';a.rate=1;const pv=chosenVoice();if(pv)a.voice=pv;a.onstart=()=>liveSetMascotState('speaking');
    a.onend=()=>{if(!en){liveSetMascotState('idle');return}const b=new SpeechSynthesisUtterance(en);b.lang='en-US';b.rate=.88;const ev=englishVoice();if(ev)b.voice=ev;b.onstart=()=>liveSetMascotState('speaking');b.onend=()=>liveSetMascotState('idle');speechSynthesis.speak(b)};
    speechSynthesis.speak(a);
  }
  function localAnswer(t){
    const s=liveState(),l=t.toLowerCase(),sc=s.scenario;
    const en=/hello|\bhi\b|hey|olá|oi/.test(l)?'Hi, Cláudio! How are you today?':/water|drink|água|bebida/.test(l)?'I would like some water, please.':/work|trabalho/.test(l)?'Tell me about your work.':/airport|aeroporto/.test(l)?'Where is the check-in counter?':sc==='Restaurante'?'What would you like to order?':sc==='Aeroporto'?'May I see your passport, please?':sc==='Bar'?'What would you like to drink?':sc==='Hotel'?'Do you have a reservation?':sc==='Trabalho'?'What do you do for work?':'Tell me something about your day.';
    const bank=s.teacher==='pesada'?['Boa, Cláudio. Agora manda a próxima sem frescura.','Aí sim, porra. Bora continuar essa conversa.','Cláudio, gostei. Agora responde essa sem fugir.']:s.teacher==='media'?['Boa, Cláudio! Agora quero ver a próxima.','Aí sim, meu parceiro. Segue o jogo.','Tá desenrolando, hein? Agora responde essa.']:['Muito bem, Cláudio. Vamos continuar.','Boa. Agora tente responder a próxima.','Ótimo. Vamos seguir com a conversa.'];
    return{reply_pt:bank[Math.floor(Math.random()*bank.length)],reply_en:en};
  }
  async function askAI(text){
    const endpoint=window.MEU_INGLES_AI_ENDPOINT||'';if(!endpoint)return localAnswer(text);const s=liveState();
    try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,level:s.level,personality:s.teacher,scenario:s.scenario,history:liveHistory.slice(-8)})});if(!r.ok)throw new Error('AI '+r.status);const d=await r.json();return{reply_pt:d.reply_pt||d.reply||'Vamos continuar.',reply_en:d.reply_en||''}}catch(e){console.warn(e);return localAnswer(text)}
  }
  async function answerUser(text){
    liveSetMascotState('thinking');const hint=one('#liveHint');if(hint)hint.textContent='Preparando a resposta...';const a=await askAI(text);liveHistory.push({role:'user',content:text},{role:'assistant',content:a.reply_pt+' '+a.reply_en});const out=one('#liveLastReply');if(out)out.textContent=(a.reply_pt+(a.reply_en?' • '+a.reply_en:'')).trim();if(hint)hint.textContent=a.reply_en?'Primeiro eu respondo em português, depois falo a frase em inglês.':'Resposta por voz';setTimeout(()=>liveSpeakBoth(a.reply_pt,a.reply_en),160);
  }
  window.liveVoiceChat=async function(){
    let r=null;try{r=await prep()}catch(e){}if(!r)return;const btn=one('#liveMicBtn');if(btn)btn.classList.add('listening');liveSetMascotState('listening');const hint=one('#liveHint');if(hint)hint.textContent='Pode falar. Eu tô ouvindo.';
    r.onresult=e=>{const text=e.results[0][0].transcript;const heard=one('#liveLastHeard');if(heard)heard.textContent=text;if(btn)btn.classList.remove('listening');answerUser(text)};
    r.onerror=()=>{if(btn)btn.classList.remove('listening');liveSetMascotState('idle');try{toast('Não entendi. Tente novamente.')}catch(e){}const s=liveState();liveSpeakPt(s.teacher==='pesada'?'Não peguei, Cláudio. Fala de novo essa porra.':s.teacher==='media'?'Não peguei, Cláudio. Manda de novo.':'Não consegui entender. Tente novamente.')};
    r.onend=()=>{if(btn)btn.classList.remove('listening');try{setMicTop(micReady?'ready':'')}catch(e){}};try{r.start()}catch(e){if(btn)btn.classList.remove('listening');liveSetMascotState('idle')}
  }
  function updateAiBadge(){const e=one('#liveAiState');if(!e)return;if(window.MEU_INGLES_AI_ENDPOINT){e.className='aiState connected';e.textContent='🧠 IA real conectada e pronta.'}else{e.className='aiState pending';e.textContent='🧠 Conversa Viva pronta. Falta apenas conectar a IA real pelo servidor seguro.'}}
  function patchGlobals(){
    try{initChat=function(){};}catch(e){}
    try{renderAssistantModes=function(){liveRenderModes()};}catch(e){}
    try{setTeacher=function(t){liveSetTeacher(t)};}catch(e){}
    try{speakPt=function(t,rate=1){liveSpeakPt(t,rate)};}catch(e){}
  }
  function init(){mutateTeacherLabels();replaceChatScreen();updateHomeCard();patchGlobals();liveRenderModes();liveRenderScenarios();livePopulateVoices();liveSetMascotState('idle');updateAiBadge();try{renderTeachers()}catch(e){};if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=livePopulateVoices}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
