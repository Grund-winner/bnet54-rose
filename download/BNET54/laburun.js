/* BNET54 - Labu Run Prediction */
(function () {
  'use strict';

  /* ---- Config ---- */
  var GAME_MODES = {
    facile:    [1.10, 1.20, 1.30, 1.50, 1.80, 2.00, 2.50, 3.00, 4.00, 5.50, 7.50, 10.00],
    moyen:     [1.20, 1.50, 1.70, 2.00, 3.00, 4.50, 6.00, 8.50, 12.00],
    difficile: [1.40, 2.00, 4.00, 8.00, 15.00],
    hardcore:  [1.60, 2.50, 5.00, 10.00]
  };

  var MAX_ROWS = 8;
  var HOP_TIME = 500;

  /* ---- State ---- */
  var currentMode = 'facile';
  var isRunning = false;

  /* ---- DOM refs ---- */
  var predireBtn     = document.getElementById('predireBtn');
  var backBtn        = document.getElementById('backBtn');
  var gameArea       = document.getElementById('gameArea');
  var character      = document.getElementById('character');
  var charHead       = document.getElementById('charHead');
  var crashOverlay   = document.getElementById('crashOverlay');
  var crashFrame     = document.getElementById('crashFrame');
  var multDisplay    = document.getElementById('multDisplay');
  var multValue      = document.getElementById('multValue');
  var loadingOverlay = document.getElementById('loadingOverlay');
  var modeButtons    = document.querySelectorAll('.mode-btn');

  var platforms = [];
  for (var i = 0; i < MAX_ROWS; i++) {
    platforms.push(document.querySelector('#row' + i + ' .platform'));
  }

  /* ---- Helpers ---- */
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function weightedRandom(mode) {
    var mults = GAME_MODES[mode];
    var weights = [];
    for (var i = 0; i < mults.length; i++) {
      var v = mults[i];
      if (v <= 2) weights.push(50);
      else if (v <= 5) weights.push(20);
      else if (v <= 10) weights.push(8);
      else weights.push(2);
    }
    var total = 0;
    for (var j = 0; j < weights.length; j++) total += weights[j];
    var r = Math.random() * total;
    for (var k = 0; k < mults.length; k++) {
      if (r < weights[k]) return mults[k];
      r -= weights[k];
    }
    return mults[mults.length - 1];
  }

  function hopsForMult(mult) {
    if (mult <= 1.5) return 2 + Math.floor(Math.random() * 2);
    if (mult <= 3)   return 3 + Math.floor(Math.random() * 2);
    if (mult <= 6)   return 4 + Math.floor(Math.random() * 2);
    if (mult <= 12)  return 5 + Math.floor(Math.random() * 2);
    return 6 + Math.floor(Math.random() * 2);
  }

  /* ---- Platform position ---- */
  function getPlatformScreenPos(rowIdx) {
    var gameRect = gameArea.getBoundingClientRect();
    var pEl = platforms[rowIdx];
    var pRect = pEl.getBoundingClientRect();
    return {
      left: pRect.left - gameRect.left + pRect.width / 2,
      bottom: gameRect.bottom - pRect.bottom
    };
  }

  /* ---- Reset ---- */
  function resetPlatforms() {
    for (var i = 0; i < platforms.length; i++) {
      platforms[i].className = 'platform';
      var lbl = platforms[i].querySelector('.step-mult');
      if (lbl) lbl.remove();
    }
  }

  function resetCharacter() {
    character.style.display = '';
    character.classList.remove('hopping', 'falling');
    character.classList.add('idle');
    changeHead('Head_01');
  }

  function positionCharacter(rowIdx) {
    var pos = getPlatformScreenPos(rowIdx);
    character.style.left = pos.left + 'px';
    character.style.bottom = pos.bottom + 'px';
  }

  function hideMult() { multDisplay.style.display = 'none'; }

  function showMult(mult, success) {
    multDisplay.style.display = '';
    multDisplay.className = 'multiplier-display' + (success ? '' : ' fail');
    multValue.textContent = mult.toFixed(2) + 'x';
  }

  function changeHead(headName) {
    var img = charHead.querySelector('img');
    if (img) img.src = 'assets/laburun/' + headName + '.png';
  }

  /* ---- Light a platform ---- */
  function lightPlatform(idx, mult, isFinal) {
    var el = platforms[idx];
    el.classList.add(isFinal ? 'final' : 'lit');
    var lbl = document.createElement('span');
    lbl.className = 'step-mult';
    lbl.textContent = mult.toFixed(2) + 'x';
    el.appendChild(lbl);
  }

  /* ---- Crash animation ---- */
  function crashPlatform(idx) {
    platforms[idx].classList.add('crash');
  }

  /* ---- Hop animation ---- */
  function hopTo(rowIdx) {
    return new Promise(function (resolve) {
      character.classList.remove('idle', 'hopping');
      void character.offsetWidth;
      character.classList.add('hopping');
      positionCharacter(rowIdx);
      setTimeout(function () {
        character.classList.remove('hopping');
        resolve();
      }, HOP_TIME);
    });
  }

  /* ---- Fall animation ---- */
  function playFall() {
    return new Promise(function (resolve) {
      character.classList.remove('idle');
      character.classList.add('falling');
      setTimeout(function () {
        character.style.display = 'none';
        resolve();
      }, 600);
    });
  }

  /* ---- Show crash effect ---- */
  function showCrashEffect(rowIdx) {
    return new Promise(function (resolve) {
      crashOverlay.style.display = '';
      var pos = getPlatformScreenPos(rowIdx);
      crashFrame.style.left = (pos.left - 100) + 'px';
      crashFrame.style.top = '50%';
      crashFrame.style.transform = 'translateY(-50%)';

      /* Cycle through crash frames */
      var frames = [];
      for (var i = 1; i <= 8; i++) {
        frames.push('assets/laburun/Crash_' + i + '.png');
      }
      frames.push('assets/laburun/Boom_1.png');
      frames.push('assets/laburun/Boom_2_Vanish.png');

      var fi = 0;
      function nextFrame() {
        if (fi < frames.length) {
          crashFrame.src = frames[fi];
          fi++;
          setTimeout(nextFrame, 100);
        } else {
          setTimeout(function () {
            crashOverlay.style.display = 'none';
            resolve();
          }, 300);
        }
      }
      nextFrame();
    });
  }

  /* ---- Mode Buttons ---- */
  for (var b = 0; b < modeButtons.length; b++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        if (isRunning) return;
        currentMode = btn.getAttribute('data-mode');
        for (var j = 0; j < modeButtons.length; j++) {
          modeButtons[j].classList.toggle('active', modeButtons[j].getAttribute('data-mode') === currentMode);
        }
      });
    })(modeButtons[b]);
  }

  /* ---- Back Button ---- */
  backBtn.addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  /* ---- PREDIRE ---- */
  predireBtn.addEventListener('click', function () {
    if (isRunning) return;
    isRunning = true;
    predireBtn.disabled = true;

    /* Reset state */
    resetPlatforms();
    resetCharacter();
    hideMult();
    crashOverlay.style.display = 'none';

    /* Show loading */
    loadingOverlay.style.display = '';

    /* Position character on first platform */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        positionCharacter(0);
        lightPlatform(0, 1.00, false);
      });
    });

    /* After loading delay, run game */
    setTimeout(function () {
      loadingOverlay.style.display = 'none';
      runPrediction();
    }, 2500);
  });

  /* ---- Main Prediction Logic ---- */
  function runPrediction() {
    var mult = weightedRandom(currentMode);
    var totalHops = Math.min(hopsForMult(mult), MAX_ROWS - 1);
    var success = Math.random() < 0.78;

    /* Generate step multipliers */
    var stepMults = [];
    for (var s = 1; s <= totalHops + 1; s++) {
      var t = s / (totalHops + 1);
      var sm = mult * (0.3 + 0.7 * t);
      sm = Math.round(sm * 100) / 100;
      sm = Math.max(1.10, sm);
      stepMults.push(sm);
    }
    stepMults[stepMults.length - 1] = mult;

    var currentRow = 0;

    function nextHop() {
      if (currentRow <= totalHops) {
        var isFinal = (currentRow === totalHops);

        if (isFinal && success) {
          /* Last hop - success! */
          lightPlatform(currentRow, stepMults[currentRow - 1] || mult, true);
          changeHead('Head_02'); /* happy face */
          hopTo(currentRow).then(function () {
            character.classList.add('idle');
            showMult(mult, true);
            isRunning = false;
            predireBtn.disabled = false;
          });
        } else if (isFinal && !success) {
          /* Crash on final platform */
          crashPlatform(currentRow);
          lightPlatform(currentRow, stepMults[currentRow - 1] || mult, false);
          platforms[currentRow].classList.remove('lit');
          platforms[currentRow].classList.add('crash');
          hopTo(currentRow).then(function () {
            changeHead('Head_04'); /* scared/sad face */
            setTimeout(function () {
              playFall().then(function () {
                showCrashEffect(currentRow).then(function () {
                  showMult(mult, false);
                  isRunning = false;
                  predireBtn.disabled = false;
                });
              });
            }, 200);
          });
        } else {
          /* Normal hop */
          lightPlatform(currentRow, stepMults[currentRow - 1] || 1.10, false);
          changeHead('Head_01');
          hopTo(currentRow).then(function () {
            character.classList.add('idle');
            currentRow++;
            setTimeout(nextHop, 250);
          });
        }
      }
    }

    currentRow = 1;
    setTimeout(nextHop, 300);
  }

  /* ---- Init ---- */
  function init() {
    resetPlatforms();
    resetCharacter();
    hideMult();
    crashOverlay.style.display = 'none';
    loadingOverlay.style.display = 'none';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        positionCharacter(0);
        platforms[0].classList.add('lit');
        var lbl = document.createElement('span');
        lbl.className = 'step-mult';
        lbl.textContent = '1.00x';
        platforms[0].appendChild(lbl);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Anti-zoom ---- */
  var pz = function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); };
  document.addEventListener('touchstart', pz, { passive: false });
  document.addEventListener('touchmove', pz, { passive: false });
})();