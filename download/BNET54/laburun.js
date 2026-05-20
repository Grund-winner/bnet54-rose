/* BNET54 - Labu Run Prediction */
(function () {
  'use strict';

  /* ---- Config ---- */
  var GAME_MODES = {
    facile:   [1.10, 1.20, 1.30, 1.50, 1.80, 2.00, 2.50, 3.00, 4.00, 5.50, 7.50, 10.00],
    moyen:    [1.20, 1.50, 1.70, 2.00, 3.00, 4.50, 6.00, 8.50, 12.00],
    difficile:[1.40, 2.00, 4.00, 8.00, 15.00],
    hardcore: [1.60, 2.50, 5.00, 10.00]
  };

  var CIRCLES = 8;
  var HOP_DELAY = 480;

  /* ---- State ---- */
  var currentMode = 'facile';
  var isRunning = false;

  /* ---- DOM ---- */
  var predireBtn    = document.getElementById('predireBtn');
  var statusDot     = document.getElementById('statusDot');
  var statusText    = document.getElementById('statusText');
  var labuTunnel    = document.getElementById('labuTunnel');
  var labuRabbit    = document.getElementById('labuRabbit');
  var rabbitAlive   = document.getElementById('rabbitAlive');
  var rabbitDead    = document.getElementById('rabbitDead');
  var labuResult    = document.getElementById('labuResult');
  var resultMult    = document.getElementById('resultMult');
  var labuLoading   = document.getElementById('labuLoading');
  var modeButtons   = document.querySelectorAll('.labu-mode-btn');
  var circleEls     = [];
  for (var i = 0; i < CIRCLES; i++) {
    circleEls.push(document.getElementById('c' + i));
  }

  /* ---- Helpers ---- */
  function getCirclePos(el) {
    var tunnelRect = labuTunnel.getBoundingClientRect();
    var cRect = el.getBoundingClientRect();
    return {
      left: cRect.left - tunnelRect.left + cRect.width / 2,
      bottom: tunnelRect.bottom - cRect.bottom
    };
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

  function hopCountForMult(mult) {
    if (mult <= 1.5) return Math.floor(Math.random() * 2) + 2;
    if (mult <= 3) return Math.floor(Math.random() * 2) + 3;
    if (mult <= 6) return Math.floor(Math.random() * 2) + 4;
    if (mult <= 12) return Math.floor(Math.random() * 2) + 5;
    return Math.floor(Math.random() * 2) + 6;
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /* ---- Circle Management ---- */
  function resetCircles() {
    for (var i = 0; i < circleEls.length; i++) {
      circleEls[i].className = 'labu-circle';
      var lbl = circleEls[i].querySelector('.circle-mult');
      if (lbl) lbl.remove();
    }
  }

  function lightCircle(idx, mult, isFinal) {
    var el = circleEls[idx];
    el.classList.add(isFinal ? 'final' : 'lit');
    var lbl = document.createElement('span');
    lbl.className = 'circle-mult';
    lbl.textContent = mult + 'x';
    el.appendChild(lbl);
  }

  /* ---- Rabbit Management ---- */
  function positionRabbit(circleIdx) {
    var pos = getCirclePos(circleEls[circleIdx]);
    labuRabbit.style.left = pos.left + 'px';
    labuRabbit.style.bottom = pos.bottom + 'px';
  }

  function resetRabbit() {
    rabbitAlive.style.display = '';
    rabbitDead.style.display = 'none';
    labuRabbit.classList.remove('dead', 'hopping');
    labuRabbit.classList.add('idle');
  }

  function showDeadRabbit() {
    rabbitAlive.style.display = 'none';
    rabbitDead.style.display = '';
    labuRabbit.classList.remove('idle');
    labuRabbit.classList.add('dead');
  }

  /* ---- Result ---- */
  function showResult(mult, success) {
    labuResult.style.display = '';
    labuResult.className = 'labu-result-badge' + (success ? '' : ' fail');
    resultMult.textContent = mult + 'x';
  }

  function hideResult() {
    labuResult.style.display = 'none';
  }

  /* ---- Hop Animation ---- */
  function hopTo(circleIdx) {
    return new Promise(function (resolve) {
      labuRabbit.classList.remove('idle', 'hopping');
      void labuRabbit.offsetWidth;
      labuRabbit.classList.add('hopping');
      positionRabbit(circleIdx);
      setTimeout(function () {
        labuRabbit.classList.remove('hopping');
        resolve();
      }, HOP_DELAY);
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

  /* ---- PREDIRE ---- */
  predireBtn.addEventListener('click', function () {
    if (isRunning) return;
    isRunning = true;
    predireBtn.disabled = true;

    /* Status */
    statusDot.style.backgroundColor = '#00e676';
    statusText.textContent = 'Analyse...';

    /* Show loading */
    labuLoading.style.display = '';
    hideResult();
    resetCircles();
    resetRabbit();
    positionRabbit(0);

    setTimeout(function () {
      labuLoading.style.display = 'none';

      /* Generate prediction */
      var mult = weightedRandom(currentMode);
      var hops = Math.min(hopCountForMult(mult), CIRCLES - 1);
      var success = Math.random() < 0.78;

      /* Generate step multipliers (increasing toward final) */
      var stepMults = [];
      for (var s = 0; s <= hops; s++) {
        var t = (s + 1) / (hops + 1);
        var stepM = (mult * (0.3 + 0.7 * t));
        stepM = Math.round(stepM * 100) / 100;
        stepM = Math.max(1.10, stepM);
        stepMults.push(stepM);
      }
      stepMults[stepMults.length - 1] = mult;

      /* Run hop sequence */
      runHopSequence(stepMults, hops, mult, success);
    }, 2200);
  });

  function runHopSequence(stepMults, finalHop, mult, success) {
    var idx = 0;

    function nextHop() {
      if (idx <= finalHop) {
        var isFinal = (idx === finalHop);
        lightCircle(idx, stepMults[idx], isFinal);
        hopTo(idx).then(function () {
          idx++;
          if (idx <= finalHop) {
            setTimeout(nextHop, 200);
          } else {
            /* Reached final circle */
            setTimeout(function () {
              if (success) {
                labuRabbit.classList.add('idle');
                showResult(mult, true);
                statusDot.style.backgroundColor = '#00e676';
                statusText.textContent = 'Signal actif';
              } else {
                showDeadRabbit();
                showResult(mult, false);
                statusDot.style.backgroundColor = '#ff5252';
                statusText.textContent = 'Chute detectee';
              }
              isRunning = false;
              predireBtn.disabled = false;
            }, 400);
          }
        });
      }
    }

    setTimeout(nextHop, 300);
  }

  /* ---- Init ---- */
  function init() {
    resetCircles();
    resetRabbit();
    hideResult();
    /* Wait for layout, then position rabbit on first circle */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        positionRabbit(0);
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