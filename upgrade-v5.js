(() => {
  const MODES = {
    leve: ['🙂','Brincadeira leve','Incentiva, brinca pouco e corrige com calma','LEVE'],
    media: ['😎','Zoeira média','Mais brincalhão, provoca e comemora junto','MÉDIA'],
    pesada: ['🤬','Pesada 18+','Humor adulto, gírias e palavrões opcionais','18+']
  };

  if (state.teacher === 'adult') state.teacher = 'pesada';
  else if (state.teacher === 'zoeiro' || state.teacher === 'amigao') state.teacher = 'media';
  else if (state.teacher === 'calmo') state.teacher = 'leve';
  else if (!MODES[state.teacher]) state.teacher = 'media';
  save();

  const style = document.createElement('style');
  style.textContent = `
    .headerRightV5{display:flex;align-items:center;gap:9px}
    .audioTopV5{width:42px;height:42px;border-radius:50%;border:1px solid #2b4c67;background:#10283b;color:white;font-size:20px;display:grid;place-items:center;position:relative}
    .audioTopV5.ready{background:#0d4b32;border-color:#28c77a}.audioTopV5.listening{background:#126e48;box-shadow:0 0 0 7px #24d98222}.audioTopV5.bad{background:#4b1e25;border-color:#a84750}
    .audioTopV5 i{position:absolute;right:2px;bottom:2px;width:9px;height:9px;border-radius:50%;background:#ff9c3a;border:2px solid #07111d}.audioTopV5.ready i{background:#34e58d}
    .teacher .modeTag{font-size:11px;border:1px solid #37556c;border-radius:999px;padding:5px 8px;color:#b8cad8}.teacher.pesadaV5{border-color:#69323a;background:#24161a}
    .voiceOnlyV5{display:flex;align-items:center;justify-content:center;gap:8px;color:#8ee7ba;font-weight:800;margin-top:8px}.voiceOnlyV5.bad{color:#ffc07c}
  `;
  document.head.appendChild(style);

  const bigMic = document.getElementById('micBox');
  if (bigMic) bigMic.remove();
  const header = document.querySelector('header');
  const avatar = header?.querySelector('.avatar');
  if (header && avatar && !document.getElementById('audioTopV5')) {
    const wrap = document.createElement('div');
    wrap.className = 'headerRightV5';
    const btn = document.createElement('button');
    btn.id = 'audioTopV5';
    btn.className = 'audioTopV5';
    btn.type = 'button';
    btn.title = 'Ativar microfone';
    btn.setAttribute('aria-label','Ativar microfone');
    btn.innerHTML = '<span>🎤</span><i></i>';
    btn.onclick = () => enableMic();
    avatar.before(wrap);
    wrap.appendChild(btn);
    wrap.appendChild(avatar);
  }

  function topMic(status='') {
    const b = document.getElementById('audioTopV5');
    if (!b) return;
    b.classList.remove('ready','listening','bad');
    if (status) b.classList.add(status);
  }

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function ptVoice(){
    const voices = speechSynthesis.getVoices();
    return voices.find(v => /^pt-BR$/i.test(v.lang)) || voices.find(v => /^pt/i.test(v.lang)) || null;
  }
  window.speakPtV5 = function(text, rate=1){
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = rate;
    u.pitch = 1;
    const v = ptVoice(); if (v) u.voice = v;
    speechSynthesis.speak(u);
  };

  function reactionV5(sc, passed){
    const mode = MODES[state.teacher] ? state.teacher : 'media';
    let bank;
    if (passed) bank = {
      leve: ['Aí, Cláudio, agora sim. Mandou bem. Essa saiu certinha.','Muito bom, Cláudio. Agora ficou bonito. Continua assim.','Boa, Cláudio. Acertou bem dessa vez.'],
      media: ['Aê, Cláudio! Agora sim, rapaz. Mandou ver! Desse jeito eu até acredito que tu estudou.','Boa, Cláudio! Agora saiu inglês de verdade. Tá ficando metido, hein?','Aí sim, meu parceiro! Mandou bem pra caramba. Próxima!'],
      pesada: ['Aí sim, Cláudio! Porra, agora saiu bonito. Mandou pra caramba!','Boa, Cláudio! Agora essa porra ficou certa. Tá aprendendo, hein?','Caraca, Cláudio! Agora foi. Mandou bem pra cacete!']
    };
    else if (sc >= 35) bank = {
      leve: ['Tá chegando, Cláudio. Fala mais devagar que vai sair.','Quase, Cláudio. Repete comigo mais devagar.','Boa tentativa. Falta só ajustar um pouquinho.'],
      media: ['Cláudio, meu amigo, o inglês deu uma escorregada aí. Vai mais devagar.','Quase, Cláudio! Não atropela as palavras, rapaz. Tenta de novo.','Tá saindo, mas essa frase ainda tá sambando um pouquinho. Mais uma!'],
      pesada: ['Cláudio, cacete, não atropela a frase toda não. Vai devagar que sai.','Quase, porra! Agora fala sem massacrar as palavras, devagarzinho.','Tá chegando, Cláudio. Essa porra ainda tropeçou, mas vai sair.']
    };
    else bank = {
      leve: ['O reconhecimento se perdeu, Cláudio. Vamos quebrar a frase em pedaços e tentar de novo.','Essa não entrou bem. Faz por partes comigo.','Sem problema. Vamos devagar e tentamos outra vez.'],
      media: ['Cláudio, o Chrome viajou bonito nessa. Vamos por partes antes que ele invente outra frase.','Rapaz, o celular ouviu outra língua aí. Quebra a frase em pedaços e manda de novo.','Essa foi longe, hein? Bora desmontar a frase e montar direito.'],
      pesada: ['Cláudio, cacete, o Chrome se perdeu nessa porra. Vai por partes e manda de novo.','Que porra foi essa que o celular ouviu, Cláudio? Vamos devagar antes que ele peça socorro.','Cláudio, essa frase foi pro caralho no reconhecimento. Quebra em pedaços e tenta outra vez.']
    };
    return pick(bank[mode]);
  }

  window.feedback = function(sc, heard, target){
    const passed = sc >= passLine();
    if (!passed && sc < 35) {
      state.errors.unshift({target, heard, date:new Date().toLocaleDateString('pt-BR')});
      state.errors = state.errors.slice(0,30);
      save();
    }
    setTimeout(() => speakPtV5(reactionV5(sc, passed)), 180);
    return `<span class="voiceOnlyV5 ${passed?'':'bad'}">🔊 Professor respondeu falando</span>`;
  };

  window.setMic = function(text, type=''){
    if (type === 'bad') topMic('bad');
    else if (/ouvindo/i.test(text)) topMic('listening');
    else if (micReady) topMic('ready');
  };
  const originalEnableMic = enableMic;
  window.enableMic = async function(){
    const ok = await originalEnableMic();
    topMic(ok ? 'ready' : 'bad');
    return ok;
  };

  window.renderTeachers = function(){
    const box = document.getElementById('teachers');
    if (!box) return;
    box.innerHTML = Object.entries(MODES).map(([k,v]) => `<button class="teacher ${k==='pesada'?'pesadaV5':''} ${state.teacher===k?'sel':''}" onclick="setTeacher('${k}')"><div class="face">${v[0]}</div><div class="grow"><h3>${v[1]}</h3><p>${v[2]}</p></div><span class="modeTag">${v[3]}</span></button>`).join('');
    const parent = box.parentElement;
    if (parent && !parent.querySelector('.profileHintV5')) {
      const hint = document.createElement('div');
      hint.className = 'profileHintV5 muted';
      hint.style.cssText = 'padding:12px;border:1px solid #2c4b63;border-radius:15px;background:#0a1926;line-height:1.45;font-size:13px';
      hint.innerHTML = '🔊 Depois de você falar, o professor responde <b>em português e por voz</b>. O modo 18+ usa linguagem adulta e palavrões na brincadeira, sem humilhação.';
      box.after(hint);
    }
  };
  window.setTeacher = function(t){
    state.teacher = MODES[t] ? t : 'media';
    save();
    renderTeachers();
    const msg = t==='leve' ? 'Fechado, Cláudio. Vou pegar leve com você.' : t==='media' ? 'Aí sim, Cláudio. Zoeira média ativada. Agora aguenta a resenha.' : 'Modo dezoito mais ativado, Cláudio. Agora a zoeira vem sem filtro.';
    toast('Professor: '+MODES[state.teacher][1]);
    speakPtV5(msg);
  };

  const originalRenderHome = renderHome;
  window.renderHome = function(){
    originalRenderHome();
    const g = document.getElementById('greeting');
    if (g) g.textContent = state.teacher==='pesada' ? 'Hoje o professor tá sem filtro 😈' : state.teacher==='media' ? 'Bora treinar e dar umas risadas? 😄' : 'Vamos treinar no seu ritmo 🙂';
  };

  window.finishLesson = function(){
    if(state.lessons<1) state.lessons=1;
    state.xp += 20; save(); toast('Aula concluída! +20 XP');
    speakPtV5(state.teacher==='pesada' ? 'Boa, Cláudio. Aula concluída. Vinte pontos, porra!' : state.teacher==='media' ? 'Boa, Cláudio! Aula concluída. Mais vinte pontos pra conta.' : 'Muito bem, Cláudio. Aula concluída. Você ganhou vinte pontos.');
  };

  const originalRepeat = repeat;
  window.repeat = async function(target){
    topMic('listening');
    try { return await originalRepeat(target); }
    finally { setTimeout(() => topMic(micReady?'ready':''), 1200); }
  };

  const profile = document.getElementById('profile');
  if (profile) {
    const h3 = profile.querySelector('.profilegrid h3');
    const p = profile.querySelector('.profilegrid p');
    if (h3) h3.textContent = 'Nível de zoeira do professor';
    if (p) p.textContent = 'Escolha o quanto você quer que ele brinque com você.';
  }

  renderHome();
  renderTeachers();
  if (micReady) topMic('ready');
})();
