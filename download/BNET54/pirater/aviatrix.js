/* BNET54 - Pirater Aviatrix */
(function () {
  'use strict';
  var CURVE_COLOR = '#e63946';
  var MIN_MULT = 10.0;
  var MAX_MULT = 25.0;
  var predStatus = 'idle';
  var canvasAnimId = null;

  var multValue = document.getElementById('multValue');
  var multSignalLabel = document.getElementById('multSignalLabel');
  var multState = document.getElementById('multState');
  var predireBtn = document.getElementById('predireBtn');
  var statusDot = document.getElementById('statusDot');
  var statusText = document.getElementById('statusText');
  var canvas = document.getElementById('crashCanvas');
  var ctx = canvas.getContext('2d');

  function genMult() {
    var r = MIN_MULT + Math.random() * (MAX_MULT - MIN_MULT);
    return (Math.round(r * 100) / 100).toFixed(2);
  }

  function startCanvas() {
    stopCanvas();
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
    var progress = 0, crashPt = 0.4 + Math.random() * 0.5, pts = [], N = 60;
    function build() {
      pts = [];
      for (var i = 0; i <= N; i++) {
        var t = i / N, x = t * w, y;
        if (t <= crashPt) {
          y = h - (Math.pow(t / crashPt, 1.5) * h * 0.85) + Math.sin(t * 12) * 3 + Math.sin(t * 5) * 2;
        } else { y = h - h * 0.85 + (t - crashPt) * 200; }
        pts.push({ x: x, y: Math.max(0, Math.min(h, y)) });
      }
    }
    build();
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (var g = 1; g <= 5; g++) {
        var gy = h - (g / 5) * h * 0.85;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '10px -apple-system,sans-serif';
        ctx.fillText((g * 5) + 'x', 4, gy - 3);
      }
      var dc = Math.floor(progress * pts.length);
      if (dc > 1) {
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < dc; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = CURVE_COLOR; ctx.lineWidth = 2.5;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = CURVE_COLOR; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.lineTo(pts[dc - 1].x, h); ctx.lineTo(pts[0].x, h); ctx.closePath();
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, CURVE_COLOR + '20'); grad.addColorStop(1, CURVE_COLOR + '05');
        ctx.fillStyle = grad; ctx.fill();
        if (dc <= pts.length) {
          var p = pts[dc - 1];
          ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = CURVE_COLOR; ctx.fill();
          ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = CURVE_COLOR + '30'; ctx.fill();
        }
      }
      progress += 0.005;
      if (progress > 1.2) { progress = 0; crashPt = 0.4 + Math.random() * 0.5; build(); }
      canvasAnimId = requestAnimationFrame(draw);
    }
    draw();
  }
  function stopCanvas() { if (canvasAnimId) { cancelAnimationFrame(canvasAnimId); canvasAnimId = null; } }

  predireBtn.addEventListener('click', function () {
    if (predStatus === 'predicting') return;
    predStatus = 'predicting'; predireBtn.disabled = true;
    predireBtn.innerHTML = '<span class="pir-predire-loading"><svg viewBox="0 0 24 24" width="20" height="20" class="pir-spinner-svg"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg> Analyse...</span>';
    statusDot.style.backgroundColor = '#e63946'; statusText.textContent = 'Analyse...';
    multValue.textContent = '...'; multSignalLabel.style.display = 'none';
    multState.textContent = 'Analyse en cours...';
    setTimeout(function () {
      var m = genMult();
      multValue.textContent = 'x' + m;
      multValue.className = 'pir-mult-value pir-mult-bounce';
      multSignalLabel.style.display = 'block';
      multState.textContent = 'Signal actif';
      statusDot.style.backgroundColor = '#00e676'; statusText.textContent = 'Signal actif';
      predStatus = 'active'; predireBtn.disabled = false;
      predireBtn.innerHTML = 'PREDIRE';
    }, 2500);
  });

  var pz = function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); };
  document.addEventListener('touchstart', pz, { passive: false });
  document.addEventListener('touchmove', pz, { passive: false });
  window.addEventListener('resize', function () { startCanvas(); });
  startCanvas();
})();
