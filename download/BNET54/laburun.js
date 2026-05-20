/* BNET54 - Labu Run Prediction */
(function () {
  'use strict';

  /* ============================================================
     CONFIG
     - Higher difficulty = SAFER predictions (less risk)
     - FACILE: wider range, moderate risk
     - MOYEN: moderate range
     - DIFFICILE: narrower, safer
     - HARDCORE: very narrow, very safe
     ============================================================ */
  var GAME_MODES = {
    facile:    [1.10, 1.20, 1.30, 1.50, 1.80, 2.00, 2.50, 3.00],
    moyen:     [1.15, 1.25, 1.40, 1.60, 1.80, 2.00, 2.50, 3.00, 3.50],
    difficile: [1.30, 1.50, 1.70, 1.80, 2.00, 2.20, 2.50],
    hardcore:  [1.50, 1.60, 1.70, 1.80, 2.00, 2.20]
  };

  /* Weight: lower multipliers more likely (safer prediction) */
  function getWeight(v) {
    if (v <= 1.5) return 45;
    if (v <= 2.0) return 30;
    if (v <= 2.5) return 15;
    if (v <= 3.0) return 7;
    return 3;
  }

  var SUCCESS_CHANCE = {
    facile:    0.72,
    moyen:     0.78,
    difficile: 0.84,
    hardcore:  0.90
  };

  /* ---- DOM ---- */
  var predireBtn      = document.getElementById('predireBtn');
  var backBtn         = document.getElementById('backBtn');
  var gameArea        = document.getElementById('gameArea');
  var character       = document.getElementById('character');
  var charImg         = document.getElementById('charImg');
  var startPlatform   = document.getElementById('startPlatform');
  var landingPlatform = document.getElementById('landingPlatform');
  var crashLayer      = document.getElementById('crashLayer');
  var crashImg        = document.getElementById('crashImg');
  var coeffDisplay    = document.getElementById('coeffDisplay');
  var coeffInner      = document.getElementById('coeffInner');
  var loadingLayer    = document.getElementById('loadingLayer');
  var modeButtons     = document.querySelectorAll('.mode-btn');

  var currentMode = 'facile';
  var isRunning = false;

  /* ---- Helpers ---- */
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function pickMultiplier(mode) {
    var mults = GAME_MODES[mode];
    var weights = [];
    var total = 0;
    for (var i = 0; i < mults.length; i++) {
      var w = getWeight(mults[i]);
      weights.push(w);
      total += w;
    }
    var r = Math.random() * total;
    for (var k = 0; k < mults.length; k++) {
      if (r < weights[k]) return mults[k];
      r -= weights[k];
    }
    return mults[mults.length - 1];
  }

  /* Build coefficient display using game number sprites */
  function buildCoeffSprites(mult) {
    coeffInner.innerHTML = '';
    var str = mult.toFixed(2);
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      var img = document.createElement('img');
      if (ch === '.') {
        img.src = 'assets/laburun/num_dot.png';
      } else {
        img.src = 'assets/laburun/num_' + ch + '.png';
      }
      img.alt = ch;
      img.draggable = false;
      coeffInner.appendChild(img);
    }
  }

  function getPlatScreenPos(el) {
    var gRect = gameArea.getBoundingClientRect();
    var pRect = el.getBoundingClientRect();
    return {
      left: pRect.left - gRect.left + pRect.width / 2,
      bottom: gRect.bottom - pRect.bottom
    };
  }

  /* ---- Reset ---- */
  function reset() {
    startPlatform.className = 'platform start-platform';
    landingPlatform.className = 'platform landing-platform';
    landingPlatform.style.opacity = '0.4';
    character.style.display = '';
    character.classList.remove('jumping', 'falling');
    character.classList.add('idle');
    charImg.src = 'assets/laburun/character_01.png';
    crashLayer.style.display = 'none';
    coeffDisplay.style.display = 'none';
    coeffDisplay.className = 'coeff-display';
    loadingLayer.style.display = 'none';
  }

  /* ---- Position character on platform ---- */
  function positionOnPlatform(platEl) {
    var pos = getPlatScreenPos(platEl);
    character.style.left = pos.left + 'px';
    character.style.bottom = pos.bottom + 'px';
  }

  /* ---- Jump animation ---- */
  function doJump(targetPlat) {
    return new Promise(function (resolve) {
      character.classList.remove('idle', 'jumping');
      void character.offsetWidth;
      character.classList.add('jumping');
      positionOnPlatform(targetPlat);
      setTimeout(function () {
        character.classList.remove('jumping');
        resolve();
      }, 550);
    });
  }

  /* ---- Fall animation ---- */
  function doFall() {
    return new Promise(function (resolve) {
      character.classList.remove('idle');
      character.classList.add('falling');
      charImg.src = 'assets/laburun/character_04.png';
      setTimeout(function () {
        character.style.display = 'none';
        resolve();
      }, 500);
    });
  }

  /* ---- Show crash frames ---- */
  function showCrash() {
    return new Promise(function (resolve) {
      crashLayer.style.display = '';
      var frames = [
        'assets/laburun/Crash_1.png',
        'assets/laburun/Crash_3.png',
        'assets/laburun/Crash_5.png',
        'assets/laburun/Crash_7.png',
        'assets/laburun/Crash_9.png',
        'assets/laburun/Boom_1.png',
        'assets/laburun/Smoke_1_Screen.png'
      ];
      var fi = 0;
      function next() {
        if (fi < frames.length) {
          crashImg.src = frames[fi];
          fi++;
          setTimeout(next, 120);
        } else {
          setTimeout(function () {
            crashLayer.style.display = 'none';
            resolve();
          }, 400);
        }
      }
      next();
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

  backBtn.addEventListener('click', function () { window.location.href = 'index.html'; });

  /* ============================================================
     PREDIRE - Single Jump Mechanic
     ============================================================ */
  predireBtn.addEventListener('click', function () {
    if (isRunning) return;
    isRunning = true;
    predireBtn.disabled = true;
    reset();

    /* Show start platform as lit */
    startPlatform.classList.add('lit');

    /* Position character on start */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        positionOnPlatform(startPlatform);
      });
    });

    /* Show loading */
    loadingLayer.style.display = '';

    /* After loading, execute */
    setTimeout(function () {
      loadingLayer.style.display = 'none';
      executePrediction();
    }, 2200);
  });

  function executePrediction() {
    var mult = pickMultiplier(currentMode);
    var success = Math.random() < (SUCCESS_CHANCE[currentMode] || 0.78);

    /* Show landing platform */
    landingPlatform.style.opacity = '1';

    /* Change character to ready expression */
    charImg.src = 'assets/laburun/character_02.png';

    /* Single jump to landing platform */
    doJump(landingPlatform).then(function () {
      if (success) {
        /* SUCCESS - character lands safely */
        charImg.src = 'assets/laburun/character_03.png';
        character.classList.add('idle');
        landingPlatform.classList.add('gold');

        /* Show coefficient */
        setTimeout(function () {
          buildCoeffSprites(mult);
          coeffDisplay.style.display = '';
          isRunning = false;
          predireBtn.disabled = false;
        }, 300);
      } else {
        /* FAIL - character crashes */
        landingPlatform.classList.add('crash-state');

        setTimeout(function () {
          doFall().then(function () {
            showCrash().then(function () {
              buildCoeffSprites(mult);
              coeffDisplay.className = 'coeff-display fail';
              coeffDisplay.style.display = '';
              isRunning = false;
              predireBtn.disabled = false;
            });
          });
        }, 200);
      }
    });
  }

  /* ---- Init ---- */
  function init() {
    reset();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        positionOnPlatform(startPlatform);
        startPlatform.classList.add('lit');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Anti-zoom */
  var pz = function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); };
  document.addEventListener('touchstart', pz, { passive: false });
  document.addEventListener('touchmove', pz, { passive: false });
})();