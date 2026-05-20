/* ================================================================
   BNET54 - Prediction Platform
   Complete JavaScript - SPA Routing, Canvas, Predictions
   ================================================================ */

(function () {
  'use strict';

  /* ==============================================================
     GAME CONFIGURATION
     ============================================================== */

  var GAMES = {
    aero: {
      name: 'Aero',
      type: 'crash',
      bg: 'assets/games/screenshots/aero_bg.png',
      curveColor: '#00bfff',
      minMult: 1.2,
      maxMult: 5.0
    },
    jetx: {
      name: 'JetX',
      type: 'crash',
      bg: 'assets/games/screenshots/jetx_bg.png',
      curveColor: '#ff00ff',
      minMult: 1.1,
      maxMult: 6.0
    },
    aviator: {
      name: 'Aviator',
      type: 'crash',
      bg: 'assets/games/screenshots/aviator_bg.jpg',
      curveColor: '#cc0000',
      minMult: 1.0,
      maxMult: 8.0
    },
    aviatrix: {
      name: 'Aviatrix',
      type: 'crash',
      bg: 'assets/games/screenshots/aviatrix_bg.jpg',
      curveColor: '#00cc44',
      minMult: 1.1,
      maxMult: 5.5
    },
    laburun: {
      name: 'Labu Run',
      type: 'runner',
      bg: 'assets/games/screenshots/laburun_bg.png',
      rows: 8,
      cols: 5
    }
  };

  /* ==============================================================
     STATE
     ============================================================== */

  var currentGame = null;
  var predStatus = 'idle'; // idle | predicting | active
  var multiplier = null;
  var difficulty = 'moyen';
  var history = [];
  var safePath = [];
  var canvasAnimId = null;

  /* ==============================================================
     DOM REFERENCES
     ============================================================== */

  var pageHome = document.getElementById('page-home');
  var pagePrediction = document.getElementById('page-prediction');
  var menuBtn = document.getElementById('menuBtn');
  var overlay = document.getElementById('overlay');
  var dropdown = document.getElementById('dropdown');
  var infoModal = document.getElementById('infoModal');
  var infoModalBg = document.getElementById('infoModalBg');
  var infoModalClose = document.getElementById('infoModalClose');
  var menuInfo = document.getElementById('menuInfo');
  var menuPrediction = document.getElementById('menuPrediction');
  var gamesGrid = document.getElementById('gamesGrid');

  var predGameTitle = document.getElementById('predGameTitle');
  var gameSectionCrash = document.getElementById('gameSectionCrash');
  var gameSectionRunner = document.getElementById('gameSectionRunner');
  var gameBgImg = document.getElementById('gameBgImg');
  var gameBgImgRunner = document.getElementById('gameBgImgRunner');
  var crashCanvas = document.getElementById('crashCanvas');
  var multValue = document.getElementById('multValue');
  var multSignalLabel = document.getElementById('multSignalLabel');
  var multState = document.getElementById('multState');
  var historyRow = document.getElementById('historyRow');
  var historyChips = document.getElementById('historyChips');
  var labuDifficulty = document.getElementById('labuDifficulty');
  var labuPredictionArea = document.getElementById('labuPredictionArea');
  var labuIdleMsg = document.getElementById('labuIdleMsg');
  var labuAnalyzingMsg = document.getElementById('labuAnalyzingMsg');
  var labuGridWrapper = document.getElementById('labuGridWrapper');
  var labuGrid = document.getElementById('labuGrid');
  var labuSafeCount = document.getElementById('labuSafeCount');
  var labuMultResult = document.getElementById('labuMultResult');
  var predireBtn = document.getElementById('predireBtn');
  var backBtn = document.getElementById('backBtn');
  var statusDot = document.getElementById('statusDot');
  var statusText = document.getElementById('statusText');

  /* ==============================================================
     HELPERS
     ============================================================== */

  function generateMultiplier(min, max) {
    var raw = min + Math.random() * (max - min);
    return (Math.round(raw * 100) / 100).toFixed(2);
  }

  function generateSafePath(cols, maxRows, totalRows) {
    var path = [];
    var col = Math.floor(Math.random() * cols);
    for (var i = 0; i < maxRows; i++) {
      var row = totalRows - 1 - i;
      path.push({ row: row, col: col });
      var move = Math.floor(Math.random() * 3) - 1;
      col = Math.max(0, Math.min(cols - 1, col + move));
    }
    return path;
  }

  function getDifficultyRows(diff) {
    switch (diff) {
      case 'facile': return 3;
      case 'difficile': return 8;
      default: return 5;
    }
  }

  function generateRunnerMultiplier(diff) {
    var ranges = {
      facile: [1.5, 2.5],
      moyen: [2.5, 4.0],
      difficile: [4.0, 8.0]
    };
    var range = ranges[diff] || ranges.moyen;
    return generateMultiplier(range[0], range[1]);
  }

  /* ==============================================================
     ANTI-ZOOM
     ============================================================== */

  function initAntiZoom() {
    var preventZoom = function (e) {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    };
    var onGesture = function (e) { e.preventDefault(); };
    var onWheel = function (e) {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    var onKey = function (e) {
      if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].indexOf(e.key) !== -1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('gesturestart', onGesture, { passive: false });
    document.addEventListener('gesturechange', onGesture, { passive: false });
    document.addEventListener('gestureend', onGesture, { passive: false });
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('keydown', onKey);

    var lockViewport = function () {
      var vp = document.querySelector('meta[name="viewport"]');
      if (vp) {
        vp.setAttribute('content',
          'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
      }
    };
    window.addEventListener('resize', lockViewport);
    setTimeout(lockViewport, 500);
  }

  /* ==============================================================
     MENU & MODAL
     ============================================================== */

  function toggleMenu() {
    var isOpen = dropdown.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      dropdown.classList.add('open');
      overlay.classList.add('open');
    }
  }

  function closeMenu() {
    dropdown.classList.remove('open');
    overlay.classList.remove('open');
  }

  function openInfoModal() {
    closeMenu();
    infoModal.classList.add('open');
  }

  function closeInfoModal() {
    infoModal.classList.remove('open');
  }

  /* ==============================================================
     PAGE NAVIGATION
     ============================================================== */

  function showPage(pageId) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
  }

  function goToPrediction(gameSlug) {
    var config = GAMES[gameSlug];
    if (!config) return;

    currentGame = config;
    predStatus = 'idle';
    multiplier = null;
    history = [];
    safePath = [];

    // Set title
    predGameTitle.textContent = config.name;

    // Show/hide crash vs runner sections
    var isRunner = config.type === 'runner';
    gameSectionCrash.style.display = isRunner ? 'none' : 'block';
    gameSectionRunner.style.display = isRunner ? 'block' : 'none';
    historyRow.style.display = isRunner ? 'none' : 'block';
    labuDifficulty.style.display = isRunner ? 'block' : 'none';
    labuPredictionArea.style.display = isRunner ? 'block' : 'none';

    // Set backgrounds
    if (!isRunner) {
      gameBgImg.src = config.bg;
      gameBgImg.alt = config.name;
    } else {
      gameBgImgRunner.src = config.bg;
      gameBgImgRunner.alt = config.name;
    }

    // Reset multiplier display
    multValue.textContent = '--';
    multValue.className = 'mult-value';
    multSignalLabel.style.display = 'none';
    multState.textContent = 'En attente du signal';

    // Reset history
    historyChips.innerHTML = '';

    // Reset labu
    labuIdleMsg.style.display = 'flex';
    labuAnalyzingMsg.style.display = 'none';
    labuGridWrapper.style.display = 'none';
    labuMultResult.style.display = 'none';
    labuGrid.innerHTML = '';

    // Reset status
    statusDot.style.backgroundColor = '#e8b830';
    statusText.textContent = 'Pret';

    // Reset PREDIRE button
    predireBtn.disabled = false;
    predireBtn.innerHTML = 'PREDIRE';

    // Reset difficulty to moyen
    difficulty = 'moyen';
    var diffBtns = document.querySelectorAll('.labu-diff-btn');
    for (var d = 0; d < diffBtns.length; d++) {
      diffBtns[d].classList.toggle('active', diffBtns[d].getAttribute('data-diff') === 'moyen');
    }

    // Show prediction page
    showPage('page-prediction');

    // Start canvas animation for crash games
    if (!isRunner) {
      startCrashCurve(config.curveColor);
    } else {
      stopCrashCurve();
    }
  }

  function goHome() {
    stopCrashCurve();
    currentGame = null;
    showPage('page-home');
  }

  /* ==============================================================
     CRASH CURVE CANVAS
     ============================================================== */

  function startCrashCurve(curveColor) {
    stopCrashCurve();
    var canvas = crashCanvas;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = window.devicePixelRatio || 1;
    var w = canvas.offsetWidth;
    var h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    var progress = 0;
    var crashPoint = 0.4 + Math.random() * 0.5;
    var points = [];
    var numPoints = 60;

    function buildPoints() {
      points = [];
      for (var i = 0; i <= numPoints; i++) {
        var t = i / numPoints;
        var isCrashed = t > crashPoint;
        var x = (i / numPoints) * w;
        var y;
        if (!isCrashed) {
          var base = Math.pow(t / crashPoint, 1.5);
          var noise = Math.sin(t * 12) * 3 + Math.sin(t * 5) * 2;
          y = h - (base * (h * 0.85)) + noise;
        } else {
          y = h - (h * 0.85) + (t - crashPoint) * 200;
        }
        points.push({ x: x, y: Math.max(0, Math.min(h, y)) });
      }
    }

    buildPoints();

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (var gi = 1; gi <= 5; gi++) {
        var gy = h - (gi / 5) * h * 0.85;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillText(gi + 'x', 4, gy - 3);
      }

      // Curve
      var drawCount = Math.floor(progress * points.length);
      if (drawCount > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < drawCount; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = curveColor;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Fill under curve
        ctx.lineTo(points[drawCount - 1].x, h);
        ctx.lineTo(points[0].x, h);
        ctx.closePath();
        var gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, curveColor + '20');
        gradient.addColorStop(1, curveColor + '05');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Dot
        if (drawCount > 0 && drawCount <= points.length) {
          var p = points[drawCount - 1];
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = curveColor;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = curveColor + '30';
          ctx.fill();
        }
      }

      progress += 0.005;
      if (progress > 1.2) {
        progress = 0;
        crashPoint = 0.4 + Math.random() * 0.5;
        buildPoints();
      }

      canvasAnimId = requestAnimationFrame(draw);
    }

    draw();
  }

  function stopCrashCurve() {
    if (canvasAnimId) {
      cancelAnimationFrame(canvasAnimId);
      canvasAnimId = null;
    }
  }

  /* ==============================================================
     PREDIRE HANDLER
     ============================================================== */

  function handlePredict() {
    if (predStatus === 'predicting' || !currentGame) return;

    predStatus = 'predicting';
    predireBtn.disabled = true;
    predireBtn.innerHTML =
      '<span class="predire-loading">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" class="predire-spinner-svg">' +
      '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.5" ' +
      'stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>' +
      ' Analyse...</span>';

    // Update status
    statusDot.style.backgroundColor = '#e8b830';
    statusText.textContent = 'Analyse...';

    if (currentGame.type === 'runner') {
      safePath = [];
      multiplier = null;
      labuIdleMsg.style.display = 'none';
      labuAnalyzingMsg.style.display = 'flex';
      labuGridWrapper.style.display = 'none';
      labuMultResult.style.display = 'none';
    } else {
      multiplier = null;
      multValue.textContent = '...';
      multSignalLabel.style.display = 'none';
      multState.textContent = 'Analyse en cours...';
    }

    setTimeout(function () {
      var newMult;

      if (currentGame.type === 'runner') {
        var maxRows = getDifficultyRows(difficulty);
        safePath = generateSafePath(5, maxRows, 8);
        newMult = generateRunnerMultiplier(difficulty);
        multiplier = newMult;

        // Show grid
        labuAnalyzingMsg.style.display = 'none';
        labuGridWrapper.style.display = 'flex';
        renderLabuGrid();

        // Show multiplier
        labuMultResult.textContent = 'Multiplicateur: x' + newMult;
        labuMultResult.style.display = 'block';
        labuMultResult.className = 'labu-mult-result pred-bounce';

        // Re-trigger animation
        labuMultResult.style.animation = 'none';
        labuMultResult.offsetHeight; // force reflow
        labuMultResult.style.animation = '';
      } else {
        newMult = generateMultiplier(currentGame.minMult, currentGame.maxMult);
        multiplier = newMult;

        multValue.textContent = 'x' + newMult;
        multValue.className = 'mult-value mult-bounce';
        multSignalLabel.style.display = 'block';
        multState.textContent = 'Signal actif';

        // Re-trigger animation
        multValue.style.animation = 'none';
        multValue.offsetHeight;
        multValue.style.animation = '';
      }

      // Update status
      statusDot.style.backgroundColor = '#00e676';
      statusText.textContent = 'Signal actif';

      // Add to history
      history.unshift(newMult);
      if (history.length > 5) history = history.slice(0, 5);
      renderHistory();

      // Reset button
      predStatus = 'active';
      predireBtn.disabled = false;
      predireBtn.innerHTML = 'PREDIRE';

    }, 2000);
  }

  /* ==============================================================
     HISTORY RENDER
     ============================================================== */

  function renderHistory() {
    historyChips.innerHTML = '';
    for (var i = 0; i < history.length; i++) {
      var mult = history[i];
      var numMult = parseFloat(mult);
      var chip = document.createElement('span');
      chip.className = 'history-chip' + (numMult >= 3 ? ' history-chip-high' : '');
      chip.textContent = mult + 'x';
      historyChips.appendChild(chip);
    }
  }

  /* ==============================================================
     LABU RUN GRID RENDER
     ============================================================== */

  function renderLabuGrid() {
    labuGrid.innerHTML = '';
    var COLS = 5;
    var ROWS = 8;

    // Build safe set for quick lookup
    var safeSet = {};
    for (var s = 0; s < safePath.length; s++) {
      var sp = safePath[s];
      safeSet[sp.row + '-' + sp.col] = s;
    }

    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        var key = row + '-' + col;
        var pathIdx = safeSet[key];
        var isSafe = pathIdx !== undefined;
        var isStart = row === ROWS - 1 && isSafe;
        var isEnd = isSafe && pathIdx === safePath.length - 1 && safePath.length > 0;
        var delay = isSafe ? (pathIdx * 0.15) : 0;

        var tile = document.createElement('div');
        tile.className = 'labu-tile';
        if (isSafe) tile.classList.add('labu-tile-safe');
        if (isStart) tile.classList.add('labu-tile-start');
        if (isEnd) tile.classList.add('labu-tile-end');
        if (isSafe) {
          tile.style.animationDelay = delay + 's';
        }

        if (isStart) {
          tile.innerHTML =
            '<svg class="labu-tile-icon" viewBox="0 0 24 32" fill="none">' +
            '<circle cx="12" cy="5" r="4" fill="#4a7a3a"/>' +
            '<path d="M12 9 L12 20 M12 14 L7 17 M12 14 L17 17 M12 20 L8 28 M12 20 L16 28" ' +
            'stroke="#4a7a3a" stroke-width="2" stroke-linecap="round"/>' +
            '</svg>';
        }

        if (isEnd && !isStart) {
          tile.innerHTML =
            '<svg class="labu-tile-icon labu-flag-icon" viewBox="0 0 24 24" fill="none">' +
            '<path d="M8 4 L8 20" stroke="#ffd740" stroke-width="2" stroke-linecap="round"/>' +
            '<path d="M8 4 L20 7 L8 10" fill="#ffd740"/>' +
            '</svg>';
        }

        labuGrid.appendChild(tile);
      }
    }

    labuSafeCount.textContent = safePath.length + ' cases securisees';
  }

  /* ==============================================================
     DIFFICULTY SELECTOR
     ============================================================== */

  function handleDifficulty(diff) {
    difficulty = diff;
    var btns = document.querySelectorAll('.labu-diff-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-diff') === diff);
    }
  }

  /* ==============================================================
     EVENT LISTENERS
     ============================================================== */

  // Menu
  menuBtn.addEventListener('click', function (e) {
    e.preventDefault();
    toggleMenu();
  });

  overlay.addEventListener('click', closeMenu);

  // Info modal
  menuInfo.addEventListener('click', function (e) {
    e.preventDefault();
    openInfoModal();
  });

  menuPrediction.addEventListener('click', function (e) {
    e.preventDefault();
    closeMenu();
  });

  infoModalBg.addEventListener('click', closeInfoModal);
  infoModalClose.addEventListener('click', closeInfoModal);

  // Game cards
  var gameCards = document.querySelectorAll('.game[data-game]');
  for (var g = 0; g < gameCards.length; g++) {
    (function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        var slug = card.getAttribute('data-game');
        goToPrediction(slug);
      });
    })(gameCards[g]);
  }

  // Back button
  backBtn.addEventListener('click', function () {
    goHome();
  });

  // PREDIRE button
  predireBtn.addEventListener('click', handlePredict);

  // Difficulty buttons
  var diffBtns = document.querySelectorAll('.labu-diff-btn');
  for (var d = 0; d < diffBtns.length; d++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        handleDifficulty(btn.getAttribute('data-diff'));
      });
    })(diffBtns[d]);
  }

  // Window resize - re-init canvas
  window.addEventListener('resize', function () {
    if (currentGame && currentGame.type === 'crash' && pagePrediction.classList.contains('active')) {
      startCrashCurve(currentGame.curveColor);
    }
  });

  /* ==============================================================
     INIT
     ============================================================== */

  initAntiZoom();

})();
