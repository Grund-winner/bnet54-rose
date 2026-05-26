/* ================================================================
   BNET54 - Section Piratée - Logique partagée
   Basé sur le script EURO54 Pirater (Aviator + Crash patterns)
   
   Fonctionnalités:
   - Intervalle de côtes (10.01X - 25.99X)
   - Heure de mise prédite (actuelle + 2-3 min, fin = début + 1 min)
   - Chance (86-97%)
   - Compte à rebours
   - Barre de chargement (10s)
   - Sauvegarde/restore localStorage
   ================================================================ */

var pirGame = pirGame || {};

(function () {
  'use strict';

  var STORAGE_PREFIX = 'bnet54_pir_';
  var isGenerating = false;
  var countdownInterval = null;
  var targetTime = null;

  /* --- Utilitaires --- */

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function getRan(min, max) {
    return Math.random() * (max - min) + min;
  }

  function formatTime(date) {
    return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  function formatTimeShort(date) {
    return pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function storageKey(field) {
    return STORAGE_PREFIX + pirGame.name + '_' + field;
  }

  function saveState(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  function loadState(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function clearState() {
    var keys = ['coeffMin', 'coeffMax', 'timeRange', 'chance', 'timeLeft', 'timestamp'];
    for (var i = 0; i < keys.length; i++) {
      try { localStorage.removeItem(storageKey(keys[i])); } catch (e) { /* ignore */ }
    }
  }

  /* --- Génération du signal --- */

  function generateSignal() {
    if (isGenerating) return;

    var btn = document.getElementById('pirSignalBtn');
    var loaderBar = document.getElementById('pirLoaderBar');
    var coeffDisplay = document.getElementById('pirCoeff');
    var timeDisplay = document.getElementById('pirTime');
    var chanceDisplay = document.getElementById('pirChance');
    var countdownDisplay = document.getElementById('pirCountdown');

    isGenerating = true;
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.textContent = 'ANALYSE EN COURS...';

    // Reset display
    coeffDisplay.textContent = '---';
    coeffDisplay.classList.remove('animate');
    timeDisplay.textContent = '--:--:-- - --:--:--';
    chanceDisplay.textContent = '--%';
    countdownDisplay.textContent = '--:--';

    // Démarrer la barre de chargement
    loaderBar.style.transition = 'none';
    loaderBar.style.width = '0%';
    loaderBar.offsetHeight; // force reflow
    loaderBar.classList.add('animate');
    loaderBar.style.width = '100%';

    // Afficher les résultats après 10 secondes (comme EUR54)
    setTimeout(function () {
      // Réinitialiser la barre
      loaderBar.classList.remove('animate');
      loaderBar.style.transition = 'width 0.3s ease';
      loaderBar.style.width = '0%';

      // Générer l'intervalle de côtes
      var minCoeff = getRan(10.01, 15.00).toFixed(2);
      var maxCoeff = getRan(15.01, 25.99).toFixed(2);
      var coeffText = minCoeff + 'X - ' + maxCoeff + 'X';

      coeffDisplay.textContent = coeffText;
      coeffDisplay.classList.add('animate');
      saveState(storageKey('coeffMin'), minCoeff);
      saveState(storageKey('coeffMax'), maxCoeff);

      // Générer l'heure de mise
      var now = new Date();
      var randomOffset = getRan(2, 3); // 2 à 3 minutes
      var startTime = new Date(now.getTime() + (randomOffset * 60 * 1000));
      var endTime = new Date(startTime.getTime() + 1 * 60 * 1000); // +1 minute

      var timeText = formatTime(startTime) + ' - ' + formatTime(endTime);
      timeDisplay.textContent = timeText;
      saveState(storageKey('timeRange'), timeText);

      targetTime = startTime;

      // Générer la chance
      var chance = Math.floor(getRan(86, 97));
      chanceDisplay.textContent = chance + '%';
      saveState(storageKey('chance'), chance);

      // Démarrer le compte à rebours
      startCountdown();

      // Réactiver le bouton après que le countdown soit fini
      // (le countdown le fera automatiquement)

    }, 10000);
  }

  /* --- Compte à rebours --- */

  function startCountdown() {
    if (countdownInterval) { clearInterval(countdownInterval); }

    var countdownDisplay = document.getElementById('pirCountdown');
    var duration = Math.floor((targetTime - new Date()) / 1000);
    if (duration < 0) duration = 0;

    var timeLeft = duration;
    saveState(storageKey('timeLeft'), timeLeft);
    saveState(storageKey('timestamp'), Date.now());

    countdownInterval = setInterval(function () {
      var minutes = Math.floor(timeLeft / 60);
      var seconds = timeLeft % 60;
      countdownDisplay.textContent = pad(minutes) + ':' + pad(seconds);

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownDisplay.textContent = '00:00';
        isGenerating = false;

        var btn = document.getElementById('pirSignalBtn');
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.textContent = 'OBTENIR LE SIGNAL';

        clearState();
        return;
      }

      timeLeft--;
      saveState(storageKey('timeLeft'), timeLeft);
      saveState(storageKey('timestamp'), Date.now());
    }, 1000);
  }

  /* --- Restauration de l'état --- */

  function restoreState() {
    var coeffMin = loadState(storageKey('coeffMin'));
    var coeffMax = loadState(storageKey('coeffMax'));
    var timeRange = loadState(storageKey('timeRange'));
    var chance = loadState(storageKey('chance'));
    var savedTimeLeft = loadState(storageKey('timeLeft'));
    var savedTimestamp = loadState(storageKey('timestamp'));

    var coeffDisplay = document.getElementById('pirCoeff');
    var timeDisplay = document.getElementById('pirTime');
    var chanceDisplay = document.getElementById('pirChance');
    var countdownDisplay = document.getElementById('pirCountdown');
    var btn = document.getElementById('pirSignalBtn');

    if (coeffMin && coeffMax) {
      coeffDisplay.textContent = coeffMin + 'X - ' + coeffMax + 'X';
    }

    if (timeRange) {
      timeDisplay.textContent = timeRange;
    }

    if (chance) {
      chanceDisplay.textContent = chance + '%';
    }

    // Restaurer le countdown
    if (savedTimeLeft && savedTimestamp) {
      var elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
      var remaining = parseInt(savedTimeLeft) - elapsed;

      if (remaining > 0) {
        isGenerating = true;
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.textContent = 'SIGNAL ACTIF...';

        targetTime = new Date(Date.now() + remaining * 1000);
        var timeLeft = remaining;
        countdownInterval = setInterval(function () {
          var minutes = Math.floor(timeLeft / 60);
          var seconds = timeLeft % 60;
          countdownDisplay.textContent = pad(minutes) + ':' + pad(seconds);

          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            countdownDisplay.textContent = '00:00';
            isGenerating = false;
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.textContent = 'OBTENIR LE SIGNAL';
            clearState();
            return;
          }

          timeLeft--;
          saveState(storageKey('timeLeft'), timeLeft);
          saveState(storageKey('timestamp'), Date.now());
        }, 1000);
      } else {
        clearState();
      }
    }
  }

  /* --- Initialisation --- */

  function init() {
    var btn = document.getElementById('pirSignalBtn');
    if (btn) {
      btn.addEventListener('click', generateSignal);
    }

    // Restaurer l'état sauvegardé
    restoreState();
  }

  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Anti-zoom
  var preventZoom = function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  };
  document.addEventListener('touchstart', preventZoom, { passive: false });
  document.addEventListener('touchmove', preventZoom, { passive: false });

  var lockVp = function () {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute('content', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  };
  window.addEventListener('resize', lockVp);
  setTimeout(lockVp, 500);

})();
