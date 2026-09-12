(function(){
  function s(){
    if(typeof state==='undefined') return null;
    state.hardErrorStreak=state.hardErrorStreak||{};
    return state;
  }
  function say(text){
    try{
      if(typeof liveSpeakPt==='function') return liveSpeakPt(text);
      if(typeof speakPt==='function') return speakPt(text);
    }catch(e){}
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);u.lang='pt-BR';speechSynthesis.speak(u);
    }catch(e){}
  }
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function keyFor(target){return String(target||'').toLowerCase().trim()}
  function updateStreak(target,passed){
    const st=s();if(!st)return 0;
    const k=keyFor(target);
    if(passed){st.hardErrorStreak[k]=0;}else{st.hardErrorStreak[k]=(st.hardErrorStreak[k]||0)+1;}
    try{save()}catch(e){}
    return st.hardErrorStreak[k]||0;
  }
  function hardText(n){
    if(n<=1)return pick([
      'Cláudio, quase. Errou essa, mas tá tranquilo. Bora de novo.',
      'Primeira escorregada, Cláudio. Nada grave. Escuta e manda outra vez.',
      'Ô Cláudio, essa saiu meio torta. Tenta de novo que dá pra acertar.'
    ]);
    if(n===2)return pick([
      'Porra, Cláudio, de novo? Presta atenção nessa merda e manda mais devagar.',
      'Segunda vez, cacete. Bora focar nessa frase aí e não inventa moda.',
      'Cláudio, meu parceiro, já é a segunda. Escuta direito e manda essa porra de novo.'
    ]);
    if(n===3)return pick([
      'Ah não, aí não dá não, porra. Tá de sacanagem? Terceira vez. Bora prestar atenção.',
      'Caralho, Cláudio, terceira vez na mesma frase? Agora tu vai acertar essa porra nem que seja na marra.',
      'Aí tu tá me quebrando, cacete. Três vezes. Respira, escuta e fala devagar.'
    ]);
    if(n===4)return pick([
      'Caralho, Cláudio! Quatro vezes? Tu tem o quê na cabeça, cacete? Tem minhoca aí? Bora, foca nessa porra.',
      'Ah não, porra. Quatro vezes já. Tu tá de sacanagem comigo, né? Escuta essa merda com calma e tenta de novo.',
      'Cláudio, pelo amor de Deus, cacete. Quatro vezes. Agora presta atenção palavra por palavra.'
    ]);
    return pick([
      'Tá de sacanagem, caralho? De novo essa porra? Tu tem minhoca na cabeça ou tá guardando cocô aí? Bora acertar essa merda agora.',
      'Ah não, aí eu não aguento mais não, porra. Já perdeu a conta de quantas vezes errou. Foca, cacete, e manda direito.',
      'Cláudio, que porra é essa? Essa frase já virou inimiga pessoal. Escuta devagar e acaba com essa desgraça agora.',
      'Meu irmão, já passou da zoeira. Tu tá brigando com essa frase e ela tá ganhando. Bora, cacete, mais uma vez.'
    ]);
  }
  function mediumText(n){
    if(n<=1)return 'Quase, Cláudio 😄. Bora tentar de novo.';
    if(n===2)return 'Rapaz, segunda vez já 😂. Escuta com calma e manda de novo.';
    if(n===3)return 'Cláudio, meu parceiro 😂 terceira vez! Agora concentra nessa frase.';
    return 'Aí tu tá fazendo hora comigo 😂. Bora acertar isso agora, palavra por palavra.';
  }
  function calmText(n){
    if(n<=1)return 'Quase. Tente novamente com calma.';
    if(n===2)return 'Ainda não ficou certo. Ouça mais uma vez e repita devagar.';
    return 'Vamos dividir a frase em partes para facilitar. Você consegue.';
  }
  function correctText(){
    const st=s();
    if(!st)return 'Muito bem!';
    if(st.teacher==='pesada')return pick(['Aí sim, porra! Agora saiu bonito.','Boa, Cláudio! Finalmente essa porra saiu direito.','Agora sim, cacete! Mandou bem.']);
    if(st.teacher==='media')return pick(['Aí sim, Cláudio! Mandou bem 😄','Boa! Agora saiu bonito.','Perfeito! Dessa vez foi.']);
    return pick(['Muito bem! Agora ficou certo.','Perfeito. Boa pronúncia.','Ótimo. Vamos continuar.']);
  }
  window.v8EscalatingReaction=function(target,passed){
    const st=s();const n=updateStreak(target,passed);
    if(passed)return correctText();
    if(!st)return calmText(n);
    if(st.teacher==='pesada')return hardText(n);
    if(st.teacher==='media')return mediumText(n);
    return calmText(n);
  };
  function resultBox(btn){return btn&&btn.closest('.lesson')?btn.closest('.lesson').querySelector('.result'):null}
  function streakBadge(n){
    if(!n)return '';
    return `<div style="margin-top:10px;font-size:12px;color:#ffb66b">🔥 sequência de erros nessa frase: <b>${n}</b></div>`;
  }
  function patchCourse(){
    if(typeof window.practiceLessonV6!=='function'||typeof window.L_V6==='undefined')return;
    window.practiceLessonV6=async function(btn,index){
      const st=s();
      const lesson=L_V6[st.level][index];
      const r=await prep();if(!r)return;
      const box=resultBox(btn);toast('Estou ouvindo...');
      r.onstart=()=>{try{setMicTop('listening')}catch(e){}};
      r.onresult=e=>{
        const best=bestHeard(e.results[0],lesson[1]),heard=best.heard,sc=best.sc,passed=sc>=passLine();
        try{saveError(sc,heard,lesson[1])}catch(e){}
        const reply=v8EscalatingReaction(lesson[1],passed);
        const n=(s().hardErrorStreak||{})[keyFor(lesson[1])]||0;
        if(box){
          box.className='result show '+(passed?'good':'bad');
          box.innerHTML=`<b>${sc}% de compatibilidade</b><p>Eu ouvi: “${heard}”</p><div class="voiceReply ${passed?'':'bad'}">🔊 Assistente respondeu por voz</div>${st.teacher==='pesada'&&!passed?streakBadge(n):''}<small class="muted">A porcentagem mede o texto reconhecido pelo Chrome; não é uma nota exata da pronúncia.</small>`;
        }
        setTimeout(()=>say(reply),160);
      };
      r.onerror=()=>{
        try{setMicTop('bad')}catch(e){}
        toast('Não entendi. Tente de novo.');
        const st2=s();
        say(st2&&st2.teacher==='pesada'?'Não ouvi direito, Cláudio. Fala essa porra de novo.':st2&&st2.teacher==='media'?'Não peguei, Cláudio. Manda de novo.':'Não consegui ouvir bem. Tente novamente.');
      };
      r.onend=()=>{try{setMicTop(micReady?'ready':'')}catch(e){}};
      try{r.start()}catch(e){toast('Não consegui iniciar a escuta')}
    };
  }
  function addHardHint(){
    const box=document.querySelector('#profile .profilegrid');if(!box||document.getElementById('hardProgressiveNote'))return;
    const d=document.createElement('div');d.id='hardProgressiveNote';d.className='panel';d.style.padding='13px';
    d.innerHTML='<b>🔥 Hard progressivo</b><p class="muted" style="margin:6px 0 0">No Hard 18+, a zoeira aumenta quando você erra a mesma coisa várias vezes e volta ao normal quando acerta.</p>';
    box.insertBefore(d,box.lastElementChild);
  }
  function init(){patchCourse();addHardHint();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,50));else setTimeout(init,50);
})();
