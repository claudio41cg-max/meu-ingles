/**
 * Jogo da Memoria - minigame standalone (HTML/CSS/JS puro)
 * Integrado ao Meu Inglês.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'mg_progress_v1';

  var DEFAULT_LEVELS = [
    { id: 1, name: 'Fácil', timeSeconds: 60, pairs: [
      ['APPLE', 'MAÇÃ'], ['DOG', 'CÃO'], ['HOME', 'CASA'], ['FRIEND', 'AMIGO']
    ]},
    { id: 2, name: 'Médio', timeSeconds: 90, pairs: [
      ['GIRL', 'GAROTA'], ['BOY', 'GAROTO'], ['CAT', 'GATO'],
      ['WATER', 'ÁGUA'], ['BOOK', 'LIVRO'], ['SUN', 'SOL']
    ]},
    { id: 3, name: 'Difícil', timeSeconds: 120, pairs: [
      ['TIME', 'TEMPO'], ['WORK', 'TRABALHO'], ['NIGHT', 'NOITE'],
      ['FOOD', 'COMIDA'], ['CITY', 'CIDADE'], ['ROAD', 'ESTRADA'],
      ['MONEY', 'DINHEIRO'], ['HAPPY', 'FELIZ']
    ]}
  ];

  var state = null;
  var els = {};
  var audioCtx = null;
  var allLevels = DEFAULT_LEVELS;

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveBest(levelId, stars) {
    try {
      var progress = loadProgress();
      if (!progress[levelId] || progress[levelId] < stars) {
        progress[levelId] = stars;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      }
      return progress[levelId];
    } catch (e) { return stars; }
  }

  function vibrate(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  }

  function getAudioCtx() {
    if (!audioCtx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }

  function beep(freq, duration, type, gain, delay) {
    var ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(ctx.destination);
    var start = ctx.currentTime + (delay || 0);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain || 0.15, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  var sfx = {
    flip: function () { beep(480, 0.09, 'triangle', 0.1); },
    match: function () { beep(660, 0.1, 'sine', 0.16); beep(880, 0.16, 'sine', 0.14, 0.09); beep(1108, 0.18, 'sine', 0.1, 0.17); },
    wrong: function () { beep(220, 0.1, 'sawtooth', 0.1); beep(160, 0.2, 'sawtooth', 0.1, 0.09); },
    win: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { beep(f, 0.22, 'sine', 0.15, i * 0.12); }); },
    lose: function () { [380, 300, 220].forEach(function (f, i) { beep(f, 0.25, 'sawtooth', 0.12, i * 0.14); }); }
  };

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function fetchLevels(url) {
    return new Promise(function (resolve) {
      if (!url || typeof fetch !== 'function') return resolve(DEFAULT_LEVELS);
      fetch(url)
        .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
        .then(function (data) { resolve(data && data.levels && data.levels.length ? data.levels : DEFAULT_LEVELS); })
        .catch(function () { resolve(DEFAULT_LEVELS); });
    });
  }

  function burstConfetti(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = global.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    var colors = ['#ffd60a', '#8c52ff', '#2ecc71', '#ff5e5e', '#00c8ff'];
    var particles = [];
    for (var i = 0; i < 70; i++) {
      particles.push({
        x: w / 2, y: h * 0.35,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * -7 - 2,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3
      });
    }
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(function (p) {
        p.vy += 0.22;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (elapsed < 2200) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }
    requestAnimationFrame(frame);
  }

  function buildDom(mountPoint, fullscreen) {
    var root = document.createElement('div');
    root.className = 'mg-root';

    var closeBtn = null;
    if (fullscreen) {
      closeBtn = document.createElement('button');
      closeBtn.className = 'mg-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', 'Fechar');
      root.appendChild(closeBtn);
    }

    var title = document.createElement('div');
    title.className = 'mg-title';
    title.textContent = 'Jogo da Memória';
    root.appendChild(title);

    var menuScreen = document.createElement('div');
    menuScreen.className = 'mg-menu-screen';
    var menuList = document.createElement('div');
    menuList.className = 'mg-menu-list';
    menuScreen.appendChild(menuList);
    root.appendChild(menuScreen);

    var gameScreen = document.createElement('div');
    gameScreen.className = 'mg-game-screen mg-hidden';

    var homeBtn = document.createElement('button');
    homeBtn.className = 'mg-home';
    homeBtn.innerHTML = '🏠';
    homeBtn.setAttribute('aria-label', 'Voltar ao menu');
    gameScreen.appendChild(homeBtn);

    var header = document.createElement('div');
    header.className = 'mg-header';
    header.innerHTML =
      '<div class="mg-card-info">' +
        '<div class="mg-ring-wrap">' +
          '<svg viewBox="0 0 60 60">' +
            '<circle class="mg-ring-bg" cx="30" cy="30" r="26"></circle>' +
            '<circle class="mg-ring-fg" data-mg="ring" cx="30" cy="30" r="26"></circle>' +
          '</svg>' +
          '<div class="mg-ring-text" data-mg="time">--</div>' +
        '</div>' +
        '<label>Tempo</label>' +
      '</div>' +
      '<div class="mg-card-info"><span data-mg="moves">0</span><label>Jogadas</label></div>' +
      '<div class="mg-card-info"><span data-mg="pairs">0/0</span><label>Pares</label></div>';
    gameScreen.appendChild(header);

    var boardContainer = document.createElement('div');
    boardContainer.className = 'mg-board-container';
    var grid = document.createElement('div');
    grid.className = 'mg-grid';
    boardContainer.appendChild(grid);
    gameScreen.appendChild(boardContainer);

    var comboToast = document.createElement('div');
    comboToast.className = 'mg-combo-toast';
    gameScreen.appendChild(comboToast);

    root.appendChild(gameScreen);

    var resultPanel = document.createElement('div');
    resultPanel.className = 'mg-result-panel';
    resultPanel.innerHTML =
      '<div class="mg-result-card">' +
        '<div class="mg-result-emoji" data-mg="r-emoji">-</div>' +
        '<div class="mg-result-title" data-mg="r-title">-</div>' +
        '<div class="mg-result-sub" data-mg="r-sub"></div>' +
        '<div class="mg-stars" data-mg="r-stars"></div>' +
        '<div class="mg-result-best" data-mg="r-best"></div>' +
        '<div class="mg-result-buttons">' +
          '<button class="mg-btn mg-btn-primary" data-mg="btn-next">Próxima fase</button>' +
          '<button class="mg-btn mg-btn-secondary" data-mg="btn-retry">Jogar de novo</button>' +
          '<button class="mg-btn mg-btn-secondary" data-mg="btn-menu">Menu de fases</button>' +
        '</div>' +
      '</div>';
    root.appendChild(resultPanel);

    var confettiCanvas = document.createElement('canvas');
    confettiCanvas.className = 'mg-confetti-canvas';
    root.appendChild(confettiCanvas);

    mountPoint.appendChild(root);

    return {
      root: root, grid: grid, closeBtn: closeBtn, comboToast: comboToast,
      menuScreen: menuScreen, menuList: menuList, gameScreen: gameScreen, homeBtn: homeBtn,
      resultPanel: resultPanel, confettiCanvas: confettiCanvas,
      timeEl: header.querySelector('[data-mg="time"]'),
      ringEl: header.querySelector('[data-mg="ring"]'),
      movesEl: header.querySelector('[data-mg="moves"]'),
      pairsEl: header.querySelector('[data-mg="pairs"]'),
      rEmoji: resultPanel.querySelector('[data-mg="r-emoji"]'),
      rTitle: resultPanel.querySelector('[data-mg="r-title"]'),
      rSub: resultPanel.querySelector('[data-mg="r-sub"]'),
      rStars: resultPanel.querySelector('[data-mg="r-stars"]'),
      rBest: resultPanel.querySelector('[data-mg="r-best"]'),
      btnNext: resultPanel.querySelector('[data-mg="btn-next"]'),
      btnRetry: resultPanel.querySelector('[data-mg="btn-retry"]'),
      btnMenu: resultPanel.querySelector('[data-mg="btn-menu"]')
    };
  }

  function updateMenuData(levels) {
    var progress = loadProgress();
    els.menuList.innerHTML = '';

    levels.forEach(function (level, index) {
      var prevStars = index === 0 ? 1 : (progress[levels[index - 1].id] || 0);
      var unlocked = index === 0 || prevStars >= 1;
      var stars = progress[level.id] || 0;

      var card = document.createElement('div');
      card.className = 'mg-level-card' + (unlocked ? '' : ' mg-locked');

      var left = document.createElement('div');
      left.className = 'mg-level-info';
      var nameEl = document.createElement('div');
      nameEl.className = 'mg-level-name';
      nameEl.textContent = level.name || ('Fase ' + level.id);
      var pairsEl = document.createElement('div');
      pairsEl.className = 'mg-level-pairs';
      pairsEl.textContent = (level.section ? level.section + ' · ' : '') + level.pairs.length + ' pares · ' + level.timeSeconds + 's';
      left.appendChild(nameEl);
      left.appendChild(pairsEl);

      var right = document.createElement('div');
      right.className = 'mg-level-status';
      if (unlocked) {
        right.innerHTML = '<span class="mg-mini-stars">' +
          '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</span>';
      } else {
        right.innerHTML = '<span class="mg-lock-icon">🔒</span>';
      }

      card.appendChild(left);
      card.appendChild(right);

      if (unlocked) {
        card.addEventListener('click', function () {
          startLevel(level);
          showGame();
        });
      }

      els.menuList.appendChild(card);
    });
  }

  function renderMenu(levels) { updateMenuData(levels); showMenu(); }
  function showMenu() {
    els.menuScreen.classList.remove('mg-hidden');
    els.gameScreen.classList.add('mg-hidden');
    els.resultPanel.classList.remove('mg-show');
  }
  function showGame() {
    els.menuScreen.classList.add('mg-hidden');
    els.gameScreen.classList.remove('mg-hidden');
  }

  var RING_CIRC = 2 * Math.PI * 26;

  function startLevel(levelDef) {
    var cardsData = [];
    levelDef.pairs.forEach(function (pair, idx) {
      cardsData.push({ text: pair[0], type: 'en', pairId: idx });
      cardsData.push({ text: pair[1], type: 'pt', pairId: idx });
    });
    shuffle(cardsData);

    state.level = levelDef;
    state.totalPairs = levelDef.pairs.length;
    if (state.mountPoint) {
      state.mountPoint.setAttribute('data-mg-theme', String(levelDef.theme || Math.ceil((levelDef.id || 1) / 10)));
    }
    state.matchedPairs = 0;
    state.moves = 0;
    state.timeLeft = levelDef.timeSeconds;
    state.totalTime = levelDef.timeSeconds;
    state.locked = false;
    state.firstPick = null;
    state.finished = false;
    state.combo = 0;

    els.grid.innerHTML = '';
    els.resultPanel.classList.remove('mg-show');
    els.ringEl.style.strokeDasharray = RING_CIRC;
    els.ringEl.style.strokeDashoffset = 0;
    els.ringEl.style.stroke = '#2ecc71';

    cardsData.forEach(function (data, index) {
      var card = document.createElement('div');
      card.className = 'mg-card mg-' + data.type;
      card.dataset.index = index;

      var inner = document.createElement('div');
      inner.className = 'mg-card-inner';

      var back = document.createElement('div');
      back.className = 'mg-card-face mg-card-back';
      back.textContent = '🧠';

      var front = document.createElement('div');
      front.className = 'mg-card-face mg-card-front';
      var flag = document.createElement('div');
      flag.className = 'mg-flag';
      flag.textContent = data.type === 'en' ? '🇺🇸' : '🇧🇷';
      var txt = document.createElement('div');
      txt.textContent = data.text;
      front.appendChild(flag);
      front.appendChild(txt);

      inner.appendChild(back);
      inner.appendChild(front);
      card.appendChild(inner);

      card.addEventListener('click', function () { onCardClick(index); });
      els.grid.appendChild(card);
    });

    state.cardsData = cardsData;
    state.cardEls = Array.prototype.slice.call(els.grid.children);

    updateHud();
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 1000);
  }

  function tick() {
    if (state.finished) return;
    state.timeLeft--;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      updateHud();
      endGame(false);
      return;
    }
    updateHud();
  }

  function updateHud() {
    els.timeEl.textContent = state.timeLeft;
    els.movesEl.textContent = state.moves;
    els.pairsEl.textContent = state.matchedPairs + '/' + state.totalPairs;

    var ratio = Math.max(state.timeLeft / state.totalTime, 0);
    els.ringEl.style.strokeDasharray = RING_CIRC;
    els.ringEl.style.strokeDashoffset = RING_CIRC * (1 - ratio);
    els.ringEl.style.stroke = ratio > 0.5 ? '#2ecc71' : (ratio > 0.2 ? '#ffb400' : '#ff5e5e');
  }

  function showCombo(text) {
    els.comboToast.textContent = text;
    els.comboToast.classList.add('mg-show');
    clearTimeout(state.comboTimer);
    state.comboTimer = setTimeout(function () {
      els.comboToast.classList.remove('mg-show');
    }, 900);
  }

  function onCardClick(index) {
    if (state.finished || state.locked) return;
    var cardEl = state.cardEls[index];
    if (cardEl.classList.contains('mg-flipped') || cardEl.classList.contains('mg-matched')) return;

    cardEl.classList.add('mg-flipped');
    sfx.flip();
    vibrate(12);

    if (state.firstPick === null) {
      state.firstPick = index;
      return;
    }

    state.moves++;
    updateHud();
    state.locked = true;

    var a = state.firstPick, b = index;
    var dataA = state.cardsData[a], dataB = state.cardsData[b];
    var isMatch = dataA.pairId === dataB.pairId && dataA.type !== dataB.type;

    if (isMatch) {
      setTimeout(function () {
        state.cardEls[a].classList.add('mg-matched', 'mg-pop');
        state.cardEls[b].classList.add('mg-matched', 'mg-pop');
        state.matchedPairs++;
        state.combo++;
        updateHud();
        sfx.match();
        vibrate([20, 30, 20]);
        if (state.combo >= 2) showCombo('🔥 Combo x' + state.combo + '!');
        state.firstPick = null;
        state.locked = false;
        if (state.matchedPairs === state.totalPairs) endGame(true);
      }, 250);
    } else {
      state.combo = 0;
      setTimeout(function () {
        sfx.wrong();
        vibrate(80);
        state.cardEls[a].classList.add('mg-shake');
        state.cardEls[b].classList.add('mg-shake');
        setTimeout(function () {
          state.cardEls[a].classList.remove('mg-flipped', 'mg-shake');
          state.cardEls[b].classList.remove('mg-flipped', 'mg-shake');
        }, 380);
        state.firstPick = null;
        state.locked = false;
      }, 650);
    }
  }

  function computeStars() {
    var pairs = Math.max(1, state.totalPairs);
    var moves = Math.max(state.moves, pairs);
    var moveRatio = moves / pairs;
    var timeRatio = Math.max(0, state.timeLeft / Math.max(1, state.totalTime));

    if (moveRatio <= 1.8 && timeRatio >= 0.25) return 3;
    if (moveRatio <= 2.8 && timeRatio >= 0.08) return 2;
    return 1;
  }

  function renderStars(container, count) {
    container.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.textContent = '★';
      if (i < count) s.classList.add('mg-filled');
      container.appendChild(s);
    }
  }

  function endGame(won) {
    state.finished = true;
    clearInterval(state.timerId);

    var result = {
      levelId: state.level.id,
      won: won,
      moves: state.moves,
      timeLeft: state.timeLeft,
      stars: won ? computeStars() : 0
    };

    var currentIndex = allLevels.findIndex(function (l) { return l.id === state.level.id; });
    var nextLevel = allLevels[currentIndex + 1];

    if (won) {
      sfx.win();
      vibrate([30, 40, 30, 40, 60]);
      var best = saveBest(state.level.id, result.stars);
      els.rEmoji.textContent = '🏆';
      els.rTitle.textContent = 'Você venceu!';
      els.rSub.textContent = state.moves + ' jogadas · ' + state.timeLeft + 's restantes · ' + (state.level.difficulty || '');
      renderStars(els.rStars, result.stars);
      els.rBest.textContent = 'Melhor resultado: ' + '★'.repeat(best) + '☆'.repeat(3 - best);
      els.btnNext.classList.toggle('mg-hidden', !nextLevel);
      els.btnNext.textContent = nextLevel ? ('Próxima: ' + nextLevel.name) : 'Concluído';
      burstConfetti(els.confettiCanvas);
      updateMenuData(allLevels);
    } else {
      sfx.lose();
      vibrate(200);
      els.rEmoji.textContent = '⏱️';
      els.rTitle.textContent = 'O tempo acabou!';
      els.rSub.textContent = 'Você encontrou ' + state.matchedPairs + ' de ' + state.totalPairs + ' pares.';
      els.rStars.innerHTML = '';
      els.rBest.textContent = '';
      els.btnNext.classList.add('mg-hidden');
    }

    els.resultPanel.classList.add('mg-show');

    if (typeof state.opts.onComplete === 'function') {
      try { state.opts.onComplete(result); } catch (e) {}
    }
  }

  var MemoryGame = {
    open: function (options) {
      options = options || {};
      MemoryGame.close();

      var fullscreen = !options.container;
      var mountPoint;

      if (fullscreen) {
        mountPoint = document.createElement('div');
        mountPoint.className = 'mg-overlay';
        document.body.appendChild(mountPoint);
      } else {
        mountPoint = typeof options.container === 'string'
          ? document.querySelector(options.container)
          : options.container;
        if (!mountPoint) {
          var fallbackOpts = {};
          for (var k in options) fallbackOpts[k] = options[k];
          fallbackOpts.container = null;
          return MemoryGame.open(fallbackOpts);
        }
        mountPoint.classList.add('mg-overlay');
        mountPoint.style.position = mountPoint.style.position || 'relative';
      }

      els = buildDom(mountPoint, fullscreen);
      state = { opts: options, mountPoint: mountPoint, fullscreen: fullscreen, timerId: null, combo: 0 };

      if (els.closeBtn) {
        els.closeBtn.addEventListener('click', function () {
          MemoryGame.close();
          if (typeof options.onExit === 'function') options.onExit();
        });
      }

      els.btnRetry.addEventListener('click', function () { startLevel(state.level); showGame(); });
      els.btnNext.addEventListener('click', function () {
        var idx = allLevels.findIndex(function (l) { return l.id === state.level.id; });
        var next = allLevels[idx + 1];
        if (next) { startLevel(next); showGame(); }
      });
      els.btnMenu.addEventListener('click', function () { renderMenu(allLevels); });
      els.homeBtn.addEventListener('click', function () {
        if (state.timerId) clearInterval(state.timerId);
        state.finished = true;
        renderMenu(allLevels);
      });

      fetchLevels(options.levelsUrl).then(function (levels) {
        allLevels = levels;
        if (options.level) {
          var levelDef = levels.filter(function (l) { return l.id === options.level; })[0] || levels[0];
          startLevel(levelDef);
          showGame();
        } else {
          renderMenu(levels);
        }
      });
    },

    close: function () {
      if (state && state.timerId) clearInterval(state.timerId);
      if (state && state.mountPoint) {
        if (state.fullscreen) state.mountPoint.remove();
        else {
          state.mountPoint.innerHTML = '';
          state.mountPoint.classList.remove('mg-overlay');
        }
      }
      state = null;
      els = {};
    }
  };

  global.MemoryGame = MemoryGame;
  global.openMemoryGame = function (level, onComplete) {
    MemoryGame.open({ level: level, levelsUrl: 'memoria-game/levels.json', onComplete: onComplete });
  };

})(window);