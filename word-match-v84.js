(()=>{
'use strict';

const STORE='meuInglesWordMatchV85';

const BANK=[
  // 1 — muito fácil
  ['YES','SIM',1],['NO','NÃO',1],['HELLO','OLÁ',1],['BYE','TCHAU',1],
  ['CAT','GATO',1],['DOG','CÃO',1],['BOY','GAROTO',1],['GIRL','GAROTA',1],
  ['CAR','CARRO',1],['BUS','ÔNIBUS',1],['HOME','CASA',1],['WATER','ÁGUA',1],
  ['MILK','LEITE',1],['BREAD','PÃO',1],['FISH','PEIXE',1],['RICE','ARROZ',1],
  ['ONE','UM',1],['TWO','DOIS',1],['THREE','TRÊS',1],['RED','VERMELHO',1],

  // 2 — fácil
  ['SORRY','DESCULPE',2],['PLEASE','POR FAVOR',2],['THANK YOU','OBRIGADO',2],
  ['FRIEND','AMIGO',2],['MOTHER','MÃE',2],['FATHER','PAI',2],['SISTER','IRMÃ',2],
  ['BROTHER','IRMÃO',2],['STREET','RUA',2],['MARKET','MERCADO',2],
  ['HOTEL','HOTEL',2],['SCHOOL','ESCOLA',2],['FOOD','COMIDA',2],
  ['COFFEE','CAFÉ',2],['JUICE','SUCO',2],['CHICKEN','FRANGO',2],
  ['LEFT','ESQUERDA',2],['RIGHT','DIREITA',2],['MORNING','MANHÃ',2],
  ['NIGHT','NOITE',2],['WORK','TRABALHO',2],['SLEEP','DORMIR',2],

  // 3 — médio leve
  ['HOW MUCH?','QUANTO CUSTA?',3],['GOOD MORNING','BOM DIA',3],
  ['GOOD NIGHT','BOA NOITE',3],['SEE YOU','ATÉ LOGO',3],
  ['I AM HUNGRY','ESTOU COM FOME',3],['I WANT WATER','EU QUERO ÁGUA',3],
  ['I LIKE COFFEE','EU GOSTO DE CAFÉ',3],['MY NAME IS','MEU NOME É',3],
  ['WHERE IS IT?','ONDE FICA?',3],['GO STRAIGHT','SIGA EM FRENTE',3],
  ['TURN LEFT','VIRE À ESQUERDA',3],['TURN RIGHT','VIRE À DIREITA',3],
  ['HOW ARE YOU?','COMO VOCÊ ESTÁ?',3],['I AM FINE','EU ESTOU BEM',3],
  ['NICE TO MEET YOU','PRAZER EM CONHECER',3],['I NEED HELP','PRECISO DE AJUDA',3],
  ['WAIT HERE','ESPERE AQUI',3],['COME WITH ME','VENHA COMIGO',3],

  // 4 — médio
  ['WHAT IS YOUR NAME?','QUAL É O SEU NOME?',4],
  ['WHERE IS THE HOTEL?','ONDE FICA O HOTEL?',4],
  ['CAN YOU HELP ME?','PODE ME AJUDAR?',4],
  ['I WOULD LIKE COFFEE','EU GOSTARIA DE CAFÉ',4],
  ['WHAT TIME IS IT?','QUE HORAS SÃO?',4],
  ['I DO NOT UNDERSTAND','EU NÃO ENTENDO',4],
  ['PLEASE SPEAK SLOWLY','FALE DEVAGAR, POR FAVOR',4],
  ['HOW DO I GET THERE?','COMO EU CHEGO LÁ?',4],
  ['I AM LEARNING ENGLISH','ESTOU APRENDENDO INGLÊS',4],
  ['I HAVE A RESERVATION','TENHO UMA RESERVA',4],
  ['THE BILL, PLEASE','A CONTA, POR FAVOR',4],
  ['WHERE IS THE BATHROOM?','ONDE FICA O BANHEIRO?',4]
];

const THEMES=[
  ['#8f43ec','#6926c9','#c68cff'],
  ['#2d86df','#1761b6','#79bdff'],
  ['#f09a2f','#c56a1f','#ffd07a'],
  ['#1eb993','#11816f','#74f0d0'],
  ['#e45883','#a92c59','#ff9fbd'],
  ['#7866dc','#5143ab','#b1a7ff']
];

let screen=null;
let stage=1;
let moves=0;
let selectedEn=null;
let selectedPt=null;
let locked=false;
let itemsEn=[];
let itemsPt=[];
let audioCtx=null;

function loadProgress(){
  try{
    const p=JSON.parse(localStorage.getItem(STORE)||'{}')||{};
    return {
      unlocked:Math.max(1,Math.min(40,Number(p.unlocked)||1)),
      best:p.best&&typeof p.best==='object'?p.best:{}
    };
  }catch{return {unlocked:1,best:{}}}
}
function saveProgress(p){
  try{localStorage.setItem(STORE,JSON.stringify(p))}catch{}
}
function rng(seed){
  let x=seed|0;
  return ()=>{x=(x*1664525+1013904223)|0;return ((x>>>0)/4294967296)};
}
function shuffleSeed(a,seed){
  const arr=[...a],r=rng(seed);
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(r()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function pairCountForStage(n){
  if(n<=5)return 3;
  if(n<=14)return 4;
  if(n<=27)return 5;
  return 6;
}
function tierForStage(n){
  if(n<=8)return 1;
  if(n<=18)return 2;
  if(n<=30)return 3;
  return 4;
}
function configForStage(n){
  const pairs=pairCountForStage(n);
  const tier=tierForStage(n);
  const base=pairs*2+3;
  const bonus=n<=5?3:n<=15?2:1;
  return {pairs,tier,moves:base+bonus};
}
function stagePairs(n){
  const {pairs,tier}=configForStage(n);
  const allowed=BANK.filter(x=>x[2]<=tier);
  const exact=BANK.filter(x=>x[2]===tier);
  const chosen=[];
  const used=new Set();
  const pickFrom=(src,count,seed)=>{
    for(const x of shuffleSeed(src,seed)){
      const key=x[0]+'|'+x[1];
      if(used.has(key))continue;
      used.add(key);chosen.push(x);
      if(chosen.length>=count)break;
    }
  };
  if(tier>1)pickFrom(exact,Math.max(1,Math.floor(pairs/2)),n*97+11);
  pickFrom(allowed,pairs,n*131+29);
  return chosen.slice(0,pairs).map((x,i)=>({id:i,en:x[0],pt:x[1]}));
}
function voice(){
  try{return JSON.parse(localStorage.getItem('meuInglesStableV2')||'{}').voice||'Aoede'}catch{return 'Aoede'}
}
async function speak(text){
  try{
    if(window.geminiSpeak)await window.geminiSpeak(text,'en-US',voice());
    else{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.82;speechSynthesis.speak(u);
    }
  }catch{}
}
function tone(type){
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    audioCtx=audioCtx||new C();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const now=audioCtx.currentTime;
    const notes=type==='hit'?[420,620,820]:type==='drop'?[180,140]:type==='win'?[520,660,820]:[190,150];
    notes.forEach((freq,i)=>{
      const o=audioCtx.createOscillator();
      const g=audioCtx.createGain();
      o.type=type==='drop'?'triangle':'sine';
      o.frequency.setValueAtTime(freq,now+i*.065);
      g.gain.setValueAtTime(type==='drop'?.07:.045,now+i*.065);
      g.gain.exponentialRampToValueAtTime(.001,now+i*.065+.11);
      o.connect(g);g.connect(audioCtx.destination);
      o.start(now+i*.065);o.stop(now+i*.065+.12);
    });
  }catch{}
}
function create(){
  if(screen)return;
  screen=document.createElement('section');
  screen.className='wordMatchV84';
  screen.innerHTML=`
    <div class="wmInnerV84">
      <header class="wmTopV84">
        <button type="button" class="wmCloseV84" aria-label="Sair">‹</button>
        <div class="wmObjectiveV84">
          <small>OBJETIVO</small>
          <b>Combine todos<br>os pares</b>
        </div>
        <div class="wmMovesV84">
          <b id="wmMovesV84">0</b>
          <small>MOVIMENTOS</small>
        </div>
        <button type="button" class="wmResetV84" aria-label="Reiniciar">↻</button>
      </header>
      <div class="wmProgressRowV84">
        <div class="wmLevelV84"><span>FASE</span><b id="wmLevelV84">1</b><em>/40</em></div>
        <div class="wmDifficultyV84" id="wmDifficultyV84">Fácil</div>
      </div>
      <main>
        <div id="wmBoardV84" class="wmBoardV84"></div>
        <div id="wmStatusV84" class="wmStatusV84" aria-live="polite"></div>
      </main>
    </div>`;
  document.body.appendChild(screen);
  screen.querySelector('.wmCloseV84').onclick=close;
  screen.querySelector('.wmResetV84').onclick=()=>start(stage);
}
function close(){
  try{window.stopGeminiTTS?.()}catch{}
  screen?.classList.remove('open');
  document.body.classList.remove('wmLockV84');
}
function difficultyLabel(t){
  return t===1?'Bem fácil':t===2?'Fácil':t===3?'Intermediário': 'Desafio leve';
}
function start(nextStage=1){
  create();
  stage=Math.max(1,Math.min(40,Number(nextStage)||1));
  const cfg=configForStage(stage);
  moves=cfg.moves;
  selectedEn=null;selectedPt=null;locked=false;
  const pairs=stagePairs(stage);
  itemsEn=shuffleSeed(pairs,stage*211+7).map(x=>({...x}));
  itemsPt=shuffleSeed(pairs,stage*223+19).map(x=>({...x}));
  const palette=THEMES[(stage-1)%THEMES.length];
  screen.style.setProperty('--wm-main',palette[0]);
  screen.style.setProperty('--wm-deep',palette[1]);
  screen.style.setProperty('--wm-light',palette[2]);
  screen.querySelector('#wmLevelV84').textContent=String(stage);
  screen.querySelector('#wmMovesV84').textContent=String(moves);
  screen.querySelector('#wmDifficultyV84').textContent=difficultyLabel(cfg.tier);
  screen.querySelector('#wmStatusV84').innerHTML='';
  renderBoard(false);
}
function buttonHtml(x,side,index){
  const text=side==='en'?x.en:x.pt;
  return `<button type="button" data-side="${side}" data-id="${x.id}" data-index="${index}" aria-label="${text}"><span>${text}</span></button>`;
}
function renderBoard(animateDrop=true,previousRects=null){
  const board=screen.querySelector('#wmBoardV84');
  board.style.setProperty('--wm-rows',String(Math.max(itemsEn.length,itemsPt.length)));
  board.innerHTML=`
    <div class="wmColumnV84 en">${itemsEn.map((x,i)=>buttonHtml(x,'en',i)).join('')}</div>
    <div class="wmColumnV84 pt">${itemsPt.map((x,i)=>buttonHtml(x,'pt',i)).join('')}</div>`;
  board.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>select(b.dataset.side,Number(b.dataset.id),b));
  if(animateDrop&&previousRects){
    requestAnimationFrame(()=>{
      board.querySelectorAll('[data-side]').forEach(b=>{
        const key=b.dataset.side+':'+b.dataset.id;
        const old=previousRects[key];
        if(!old)return;
        const now=b.getBoundingClientRect();
        const dy=old.top-now.top;
        if(Math.abs(dy)<2)return;
        b.animate(
          [{transform:`translateY(${dy}px) rotateX(-7deg)`},{transform:'translateY(8px) rotateX(3deg)'},{transform:'translateY(0) rotateX(0)'}],
          {duration:430,easing:'cubic-bezier(.22,.84,.35,1)'}
        );
      });
      tone('drop');
    });
  }
}
function captureRects(){
  const map={};
  screen.querySelectorAll('#wmBoardV84 [data-side]').forEach(b=>{
    map[b.dataset.side+':'+b.dataset.id]=b.getBoundingClientRect();
  });
  return map;
}
function clearSelection(){
  screen.querySelectorAll('.wmWordSelectedV84').forEach(x=>x.classList.remove('wmWordSelectedV84','wrong'));
  selectedEn=null;selectedPt=null;
}
function findButton(side,id){
  return screen.querySelector(`[data-side="${side}"][data-id="${id}"]`);
}
async function select(side,id,button){
  if(locked)return;
  if(side==='en'){
    screen.querySelectorAll('[data-side="en"]').forEach(x=>x.classList.remove('wmWordSelectedV84'));
    selectedEn=id;button.classList.add('wmWordSelectedV84');
    const item=itemsEn.find(x=>x.id===id);if(item)speak(item.en);
  }else{
    screen.querySelectorAll('[data-side="pt"]').forEach(x=>x.classList.remove('wmWordSelectedV84'));
    selectedPt=id;button.classList.add('wmWordSelectedV84');
  }
  if(selectedEn===null||selectedPt===null)return;

  locked=true;
  if(selectedEn===selectedPt){
    const idMatch=selectedEn;
    tone('hit');
    findButton('en',idMatch)?.classList.add('correct','wmPopOutV84');
    findButton('pt',idMatch)?.classList.add('correct','wmPopOutV84');
    screen.querySelector('#wmStatusV84').innerHTML='<b>✓ ACERTOU!</b>';
    const previous=captureRects();

    setTimeout(()=>{
      itemsEn=itemsEn.filter(x=>x.id!==idMatch);
      itemsPt=itemsPt.filter(x=>x.id!==idMatch);
      selectedEn=null;selectedPt=null;
      renderBoard(true,previous);
      locked=false;
      screen.querySelector('#wmStatusV84').innerHTML='';
      if(itemsEn.length===0)win();
    },320);
  }else{
    moves=Math.max(0,moves-1);
    tone('bad');
    screen.querySelector('#wmMovesV84').textContent=String(moves);
    screen.querySelectorAll('.wmWordSelectedV84').forEach(x=>x.classList.add('wrong','wmShakeV84'));
    screen.querySelector('#wmStatusV84').innerHTML='<b>✕ TENTE OUTRA VEZ</b>';
    setTimeout(()=>{
      clearSelection();locked=false;
      screen.querySelector('#wmStatusV84').innerHTML='';
      if(moves<=0)lose();
    },520);
  }
}
function win(){
  tone('win');
  const p=loadProgress();
  const remaining=moves;
  p.best[stage]=Math.max(Number(p.best[stage])||0,remaining);
  if(stage<40)p.unlocked=Math.max(p.unlocked,stage+1);
  saveProgress(p);
  const status=screen.querySelector('#wmStatusV84');
  const last=stage===40;
  status.innerHTML=`
    <div class="wmResultV84 win">
      <span>🏆</span>
      <h2>Fase ${stage} concluída!</h2>
      <p>Você terminou com <b>${remaining}</b> movimentos sobrando.</p>
      <button type="button" id="wmNextV84">${last?'Jogar novamente':'Próxima fase'}</button>
    </div>`;
  screen.querySelector('#wmNextV84').onclick=()=>start(last?1:stage+1);
}
function lose(){
  const status=screen.querySelector('#wmStatusV84');
  status.innerHTML=`
    <div class="wmResultV84 lose">
      <span>😅</span>
      <h2>Quase!</h2>
      <p>Os movimentos acabaram. A fase continua igual para você tentar de novo.</p>
      <button type="button" id="wmAgainV84">Tentar novamente</button>
    </div>`;
  screen.querySelector('#wmAgainV84').onclick=()=>start(stage);
}
window.openWordMatchGame=()=>{
  const p=loadProgress();
  start(p.unlocked);
  screen.classList.add('open');
  document.body.classList.add('wmLockV84');
};
})();