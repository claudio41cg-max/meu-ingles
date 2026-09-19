(()=>{
'use strict';

const LEVELS=[
  [
    ['HELLO','OLÁ'],
    ['SORRY','DESCULPE'],
    ['YES','SIM'],
    ['NO','NÃO'],
    ['THANK YOU','OBRIGADO']
  ],
  [
    ['GIRL','GAROTA'],
    ['BOY','GAROTO'],
    ['DOG','CÃO'],
    ['CAT','GATO'],
    ['HOUSE','CASA']
  ],
  [
    ['WATER','ÁGUA'],
    ['MILK','LEITE'],
    ['BREAD','PÃO'],
    ['RICE','ARROZ'],
    ['FISH','PEIXE']
  ],
  [
    ['LEFT','ESQUERDA'],
    ['RIGHT','DIREITA'],
    ['STREET','RUA'],
    ['BUS','ÔNIBUS'],
    ['CAR','CARRO']
  ],
  [
    ['MOTHER','MÃE'],
    ['FATHER','PAI'],
    ['BROTHER','IRMÃO'],
    ['SISTER','IRMÃ'],
    ['FRIEND','AMIGO']
  ]
];

let screen=null;
let level=0;
let moves=12;
let matched=new Set();
let selectedEn=null;
let selectedPt=null;
let locked=false;

function voice(){
  try{return JSON.parse(localStorage.getItem('meuInglesStableV2')||'{}').voice||'Aoede'}catch{return 'Aoede'}
}
async function speak(text){
  try{
    if(window.geminiSpeak)await window.geminiSpeak(text,'en-US',voice());
    else{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='en-US';u.rate=.82;speechSynthesis.speak(u);
    }
  }catch{}
}
function shuffle(a){
  const arr=[...a];
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function create(){
  if(screen)return;
  screen=document.createElement('section');
  screen.className='wordMatchV84';
  screen.innerHTML=`
    <div class="wmInnerV84">
      <header class="wmTopV84">
        <button type="button" class="wmCloseV84" aria-label="Sair">‹</button>
        <div class="wmObjectiveV84"><small>OBJETIVO</small><b>Adivinhar todas<br>as palavras</b></div>
        <div class="wmMovesV84"><b id="wmMovesV84">12</b><small>MOVIMENTOS</small></div>
        <button type="button" class="wmResetV84" aria-label="Reiniciar">↻</button>
      </header>
      <div class="wmLevelV84"><span>NÍVEL</span><b id="wmLevelV84">1</b></div>
      <main>
        <div id="wmBoardV84" class="wmBoardV84"></div>
        <div id="wmStatusV84" class="wmStatusV84" aria-live="polite"></div>
      </main>
    </div>`;
  document.body.appendChild(screen);
  screen.querySelector('.wmCloseV84').onclick=close;
  screen.querySelector('.wmResetV84').onclick=()=>start(level);
}
function close(){
  try{window.stopGeminiTTS?.()}catch{}
  screen?.classList.remove('open');
  document.body.classList.remove('wmLockV84');
}
function start(nextLevel=0){
  create();
  level=Math.max(0,Math.min(LEVELS.length-1,nextLevel));
  moves=12;
  matched=new Set();
  selectedEn=null;
  selectedPt=null;
  locked=false;
  screen.querySelector('#wmLevelV84').textContent=String(level+1);
  screen.querySelector('#wmMovesV84').textContent=String(moves);
  screen.querySelector('#wmStatusV84').innerHTML='';
  renderBoard();
}
function renderBoard(){
  const pairs=LEVELS[level];
  const ens=shuffle(pairs.map((p,i)=>({id:i,text:p[0]})));
  const pts=shuffle(pairs.map((p,i)=>({id:i,text:p[1]})));
  const board=screen.querySelector('#wmBoardV84');
  board.innerHTML=`
    <div class="wmColumnV84 en">${ens.map(x=>`<button type="button" data-en="${x.id}" class="${matched.has(x.id)?'matched':''}">${x.text}</button>`).join('')}</div>
    <div class="wmColumnV84 pt">${pts.map(x=>`<button type="button" data-pt="${x.id}" class="${matched.has(x.id)?'matched':''}">${x.text}</button>`).join('')}</div>`;
  board.querySelectorAll('[data-en]').forEach(b=>b.onclick=()=>select('en',Number(b.dataset.en),b));
  board.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>select('pt',Number(b.dataset.pt),b));
}
function clearSelection(){
  screen.querySelectorAll('.wmWordSelectedV84').forEach(x=>x.classList.remove('wmWordSelectedV84','wrong'));
  selectedEn=null;selectedPt=null;
}
async function select(side,id,button){
  if(locked||matched.has(id))return;

  const board=screen.querySelector('#wmBoardV84');
  if(side==='en'){
    board.querySelectorAll('[data-en]').forEach(x=>x.classList.remove('wmWordSelectedV84'));
    selectedEn=id;
    button.classList.add('wmWordSelectedV84');
    speak(LEVELS[level][id][0]);
  }else{
    board.querySelectorAll('[data-pt]').forEach(x=>x.classList.remove('wmWordSelectedV84'));
    selectedPt=id;
    button.classList.add('wmWordSelectedV84');
  }

  if(selectedEn===null||selectedPt===null)return;
  locked=true;

  if(selectedEn===selectedPt){
    const idMatch=selectedEn;
    matched.add(idMatch);
    screen.querySelectorAll(`[data-en="${idMatch}"],[data-pt="${idMatch}"]`).forEach(x=>x.classList.add('correct'));
    screen.querySelector('#wmStatusV84').innerHTML='<b>✓ ACERTOU!</b>';

    setTimeout(()=>{
      screen.querySelectorAll(`[data-en="${idMatch}"],[data-pt="${idMatch}"]`).forEach(x=>x.classList.add('matched'));
      clearSelection();
      locked=false;
      if(matched.size===LEVELS[level].length)win();
    },420);
  }else{
    moves=Math.max(0,moves-1);
    screen.querySelector('#wmMovesV84').textContent=String(moves);
    screen.querySelectorAll('.wmWordSelectedV84').forEach(x=>x.classList.add('wrong'));
    screen.querySelector('#wmStatusV84').innerHTML='<b>✕ TENTE DE NOVO</b>';

    setTimeout(()=>{
      clearSelection();
      locked=false;
      screen.querySelector('#wmStatusV84').innerHTML='';
      if(moves<=0)lose();
    },620);
  }
}
function win(){
  const status=screen.querySelector('#wmStatusV84');
  const last=level>=LEVELS.length-1;
  status.innerHTML=`
    <div class="wmResultV84 win">
      <span>🏆</span>
      <h2>Você venceu!</h2>
      <p>Todos os pares foram encontrados.</p>
      <button type="button" id="wmNextV84">${last?'Jogar novamente':'Próximo nível'}</button>
    </div>`;
  screen.querySelector('#wmNextV84').onclick=()=>start(last?0:level+1);
}
function lose(){
  const status=screen.querySelector('#wmStatusV84');
  status.innerHTML=`
    <div class="wmResultV84 lose">
      <span>😅</span>
      <h2>Acabaram os movimentos</h2>
      <p>Tente outra vez e encontre os pares.</p>
      <button type="button" id="wmAgainV84">Tentar novamente</button>
    </div>`;
  screen.querySelector('#wmAgainV84').onclick=()=>start(level);
}
window.openWordMatchGame=()=>{
  start(0);
  screen.classList.add('open');
  document.body.classList.add('wmLockV84');
};
})();