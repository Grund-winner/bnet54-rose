/* BNET54 - Labu Run Prediction (Runner Game) */
(function () {
  'use strict';

  var predStatus = 'idle';
  var difficulty = 'moyen';
  var safePath = [];

  var predireBtn = document.getElementById('predireBtn');
  var statusDot = document.getElementById('statusDot');
  var statusText = document.getElementById('statusText');
  var labuIdleMsg = document.getElementById('labuIdleMsg');
  var labuAnalyzingMsg = document.getElementById('labuAnalyzingMsg');
  var labuGridWrapper = document.getElementById('labuGridWrapper');
  var labuGrid = document.getElementById('labuGrid');
  var labuSafeCount = document.getElementById('labuSafeCount');
  var labuMultResult = document.getElementById('labuMultResult');

  function getDiffRows(d) { return d === 'facile' ? 3 : d === 'difficile' ? 8 : 5; }
  function genRunnerMult(d) {
    var r = d === 'facile' ? [1.5, 2.5] : d === 'difficile' ? [4.0, 8.0] : [2.5, 4.0];
    var v = r[0] + Math.random() * (r[1] - r[0]);
    return (Math.round(v * 100) / 100).toFixed(2);
  }
  function genSafePath(cols, maxRows, totalRows) {
    var path = [], col = Math.floor(Math.random() * cols);
    for (var i = 0; i < maxRows; i++) {
      path.push({ row: totalRows - 1 - i, col: col });
      col = Math.max(0, Math.min(cols - 1, col + Math.floor(Math.random() * 3) - 1));
    }
    return path;
  }

  function renderGrid() {
    labuGrid.innerHTML = '';
    var COLS = 5, ROWS = 8;
    var safeSet = {};
    for (var s = 0; s < safePath.length; s++) {
      safeSet[safePath[s].row + '-' + safePath[s].col] = s;
    }
    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        var key = row + '-' + col;
        var pidx = safeSet[key];
        var isSafe = pidx !== undefined;
        var isStart = row === ROWS - 1 && isSafe;
        var isEnd = isSafe && pidx === safePath.length - 1 && safePath.length > 0;

        var tile = document.createElement('div');
        tile.className = 'labu-tile';
        if (isSafe) { tile.classList.add('labu-tile-safe'); tile.style.animationDelay = (pidx * 0.15) + 's'; }
        if (isStart) tile.classList.add('labu-tile-start');
        if (isEnd) tile.classList.add('labu-tile-end');

        if (isStart) {
          tile.innerHTML = '<svg class="labu-tile-icon" viewBox="0 0 24 32" fill="none"><circle cx="12" cy="5" r="4" fill="#4a7a3a"/><path d="M12 9 L12 20 M12 14 L7 17 M12 14 L17 17 M12 20 L8 28 M12 20 L16 28" stroke="#4a7a3a" stroke-width="2" stroke-linecap="round"/></svg>';
        }
        if (isEnd && !isStart) {
          tile.innerHTML = '<svg class="labu-tile-icon labu-flag-icon" viewBox="0 0 24 24" fill="none"><path d="M8 4 L8 20" stroke="#ffd740" stroke-width="2" stroke-linecap="round"/><path d="M8 4 L20 7 L8 10" fill="#ffd740"/></svg>';
        }
        labuGrid.appendChild(tile);
      }
    }
    labuSafeCount.textContent = safePath.length + ' cases securisees';
  }

  // Difficulty buttons
  var diffBtns = document.querySelectorAll('.labu-diff-btn');
  for (var d = 0; d < diffBtns.length; d++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        difficulty = btn.getAttribute('data-diff');
        for (var i = 0; i < diffBtns.length; i++) diffBtns[i].classList.toggle('active', diffBtns[i].getAttribute('data-diff') === difficulty);
      });
    })(diffBtns[d]);
  }

  // PREDIRE
  predireBtn.addEventListener('click', function () {
    if (predStatus === 'predicting') return;
    predStatus = 'predicting';
    predireBtn.disabled = true;
    predireBtn.innerHTML = '<span class="predire-loading"><svg viewBox="0 0 24 24" width="20" height="20" class="predire-spinner-svg"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg> Analyse...</span>';
    statusDot.style.backgroundColor = '#e8b830';
    statusText.textContent = 'Analyse...';
    labuIdleMsg.style.display = 'none';
    labuAnalyzingMsg.style.display = 'flex';
    labuGridWrapper.style.display = 'none';
    labuMultResult.style.display = 'none';

    setTimeout(function () {
      var maxRows = getDiffRows(difficulty);
      safePath = genSafePath(5, maxRows, 8);
      var m = genRunnerMult(difficulty);

      labuAnalyzingMsg.style.display = 'none';
      labuGridWrapper.style.display = 'flex';
      renderGrid();

      labuMultResult.textContent = 'Multiplicateur: x' + m;
      labuMultResult.style.display = 'block';
      labuMultResult.style.animation = 'none';
      labuMultResult.offsetHeight;
      labuMultResult.style.animation = '';

      statusDot.style.backgroundColor = '#00e676';
      statusText.textContent = 'Signal actif';
      predStatus = 'active';
      predireBtn.disabled = false;
      predireBtn.innerHTML = 'PREDIRE';
    }, 2000);
  });

  // Anti-zoom
  var pz = function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); };
  document.addEventListener('touchstart', pz, { passive: false });
  document.addEventListener('touchmove', pz, { passive: false });
})();
