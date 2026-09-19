(()=>{
'use strict';

const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LETTER_SOUNDS={
 A:'A, pronounced ay',B:'B, pronounced bee',C:'C, pronounced see',D:'D, pronounced dee',
 E:'E, pronounced ee',F:'F, pronounced ef',G:'G, pronounced gee',H:'H, pronounced aitch',
 I:'I, pronounced eye',J:'J, pronounced jay',K:'K, pronounced kay',L:'L, pronounced el',
 M:'M, pronounced em',N:'N, pronounced en',O:'O, pronounced oh',P:'P, pronounced pee',
 Q:'Q, pronounced cue',R:'R, pronounced ar',S:'S, pronounced ess',T:'T, pronounced tee',
 U:'U, pronounced you',V:'V, pronounced vee',W:'W, pronounced double you',
 X:'X, pronounced ex',Y:'Y, pronounced why',Z:'Z, pronounced zee'
};

const PRONUNCIATION=[
 ['Saudações','Hello','Olá'],
 ['Saudações','Good morning','Bom dia'],
 ['Saudações','How are you?','Como você está?'],
 ['Dia a dia','Water, please.','Água, por favor.'],
 ['Dia a dia','I want coffee.','Eu quero café.'],
 ['Dia a dia','Thank you.','Obrigado.'],
 ['Viagem','Where is the hotel?','Onde fica o hotel?'],
 ['Viagem','How much is it?','Quanto custa?'],
 ['Viagem','Turn left.','Vire à esquerda.'],
 ['Conversa','Nice to meet you.','Prazer em conhecer você.'],
 ['Conversa','What do you like?','Do que você gosta?'],
 ['Conversa','See you later.','Até mais.']
];


const NUMBER_GROUPS=[
  ['1 a 20',[
    ['1','One'],['2','Two'],['3','Three'],['4','Four'],['5','Five'],
    ['6','Six'],['7','Seven'],['8','Eight'],['9','Nine'],['10','Ten'],
    ['11','Eleven'],['12','Twelve'],['13','Thirteen'],['14','Fourteen'],['15','Fifteen'],
    ['16','Sixteen'],['17','Seventeen'],['18','Eighteen'],['19','Nineteen'],['20','Twenty']
  ]],
  ['Dezenas',[
    ['30','Thirty'],['40','Forty'],['50','Fifty'],['60','Sixty'],
    ['70','Seventy'],['80','Eighty'],['90','Ninety'],['100','One hundred']
  ]],
  ['Como combinar',[
    ['21','Twenty-one'],['32','Thirty-two'],['45','Forty-five'],['58','Fifty-eight'],
    ['67','Sixty-seven'],['74','Seventy-four'],['86','Eighty-six'],['99','Ninety-nine']
  ]],
  ['Centenas e mil',[
    ['200','Two hundred'],['300','Three hundred'],['400','Four hundred'],
    ['500','Five hundred'],['600','Six hundred'],['700','Seven hundred'],
    ['800','Eight hundred'],['900','Nine hundred'],['1000','One thousand']
  ]]
];

let screen=null;
let currentMode='alphabet';

function voice(){
  try{return JSON.parse(localStorage.getItem('meuInglesStableV2')||'{}').voice||'Aoede'}catch{return 'Aoede'}
}
async function speak(text){
  try{
    if(typeof window.geminiSpeak!=='function')throw new Error('Gemini TTS indisponível');
    const ok=await window.geminiSpeak(text,'en-US','Achird');
    if(!ok)throw new Error('Gemini TTS não reproduziu o áudio');
  }catch(e){
    console.warn('Prática sem fallback de voz do navegador:',e);
  }
}
function create(){
  if(screen)return;
  screen=document.createElement('section');
  screen.className='livePracticeScreenV82';
  screen.innerHTML=`
    <div class="livePracticeInnerV82">
      <header>
        <button type="button" class="practiceBackV82" aria-label="Voltar">‹</button>
        <div><small>PRÁTICA AO VIVO</small><h2 id="practiceTitleV82">Alfabeto</h2></div>
      </header>
      <main id="practiceBodyV82"></main>
    </div>`;
  document.body.appendChild(screen);
  screen.querySelector('.practiceBackV82').onclick=close;
}
function close(){
  try{window.stopGeminiTTS?.()}catch{}
  screen?.classList.remove('open');
  document.body.classList.remove('practiceLockV82');
}
function renderAlphabet(){
  const body=screen.querySelector('#practiceBodyV82');
  screen.querySelector('#practiceTitleV82').textContent='Alfabeto';
  body.innerHTML=`
    <section class="practiceHeroV82 alphabetHeroV82">
      <span>🔤</span>
      <div><h1>Alfabeto em inglês</h1><p>Toque em uma letra para ouvir a pronúncia.</p></div>
    </section>
    <section class="alphabetGridV82">
      ${ALPHABET.map(l=>`<button type="button" data-letter="${l}"><b>${l}</b><small>ouvir</small></button>`).join('')}
    </section>`;
  body.querySelectorAll('[data-letter]').forEach(b=>b.onclick=()=>{
    body.querySelectorAll('[data-letter]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const l=b.dataset.letter;
    speak(LETTER_SOUNDS[l]||l);
  });
}
function renderPronunciation(){
  const body=screen.querySelector('#practiceBodyV82');
  screen.querySelector('#practiceTitleV82').textContent='Pronúncia';
  const groups=[...new Set(PRONUNCIATION.map(x=>x[0]))];
  body.innerHTML=`
    <section class="practiceHeroV82 pronunciationHeroV82">
      <span>🗣️</span>
      <div><h1>Treino de pronúncia</h1><p>Ouça, repita e compare o ritmo da frase.</p></div>
    </section>
    ${groups.map(g=>`
      <section class="pronunciationGroupV82">
        <h3>${g}</h3>
        ${PRONUNCIATION.filter(x=>x[0]===g).map((x,i)=>`
          <article>
            <div><b>${x[1]}</b><small>${x[2]}</small></div>
            <button type="button" data-say="${encodeURIComponent(x[1])}" aria-label="Ouvir ${x[1]}">🔊 Ouvir</button>
          </article>`).join('')}
      </section>`).join('')}
    <section class="numbersPracticeV82">
      <div class="numbersTitleV82">
        <div><span>🔢</span><div><h3>Números</h3><p>Aprenda a base, as dezenas e como chegar até mil.</p></div></div>
      </div>
      ${NUMBER_GROUPS.map((g,i)=>`
        <details class="numberGroupV82" ${i===0?'open':''}>
          <summary><span>${g[0]}</span><small>${g[1].length} exemplos</small></summary>
          <div class="numberGridV82">
            ${g[1].map(n=>`
              <button type="button" class="numberCardV82" data-say="${encodeURIComponent(n[1])}" aria-label="Ouvir ${n[1]}">
                <span class="numberValueV82">${n[0]}</span>
                <span class="numberWordV82">${n[1]}</span>
                <span class="numberListenV82">🔊</span>
              </button>`).join('')}
          </div>
        </details>`).join('')}
    </section>`;
  body.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>{
    const text=decodeURIComponent(b.dataset.say||'');
    speak(text);
  });
}
window.openLivePractice=mode=>{
  create();
  currentMode=mode==='pronunciation'?'pronunciation':'alphabet';
  if(currentMode==='pronunciation')renderPronunciation();else renderAlphabet();
  screen.classList.add('open');
  document.body.classList.add('practiceLockV82');
};
})();