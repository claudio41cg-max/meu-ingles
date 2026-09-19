(()=>{
'use strict';
let overlay=null;

function ensure(){
  if(overlay)return;
  overlay=document.createElement('section');
  overlay.className='miniGamesHubV88';
  overlay.innerHTML=`
    <div class="miniGamesHubInnerV88">
      <header>
        <button type="button" class="miniGamesBackV88" aria-label="Voltar">‹</button>
        <div>
          <small>APRENDA INGLÊS JOGANDO</small>
          <h2>Mini jogos</h2>
        </div>
      </header>

      <div class="miniGamesGridV88">
        <button type="button" class="miniGameCardV88 match">
          <span class="miniGameArtV88">🧩</span>
          <div>
            <small>ASSOCIAÇÃO</small>
            <b>Combinar palavras</b>
            <em>Inglês + português</em>
          </div>
          <i>›</i>
        </button>

        <button type="button" class="miniGameCardV88 memory">
          <span class="miniGameArtV88">🧠</span>
          <div>
            <small>MEMÓRIA</small>
            <b>Jogo da memória</b>
            <em>Vire cartas e encontre os pares</em>
          </div>
          <i>›</i>
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('.miniGamesBackV88').onclick=close;
  overlay.querySelector('.miniGameCardV88.match').onclick=()=>{
    close();
    window.openWordMatchGame?.();
  };
  overlay.querySelector('.miniGameCardV88.memory').onclick=()=>{
    close();
    window.MemoryGame?.open({
      levelsUrl:'memoria-game/levels.json',
      onExit:function(){}
    });
  };
}

function close(){
  overlay?.classList.remove('open');
  document.body.classList.remove('miniGamesHubLockV88');
}

window.openMiniGamesHub=()=>{
  ensure();
  overlay.classList.add('open');
  document.body.classList.add('miniGamesHubLockV88');
};
})();