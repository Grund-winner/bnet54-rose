/* ================================================================
   BNET54 - Accueil JS
   ================================================================ */
(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var overlay = document.getElementById('overlay');
  var dropdown = document.getElementById('dropdown');
  var infoModal = document.getElementById('infoModal');
  var infoModalBg = document.getElementById('infoModalBg');
  var infoModalClose = document.getElementById('infoModalClose');
  var menuInfo = document.getElementById('menuInfo');

  function toggleMenu() {
    var isOpen = dropdown.classList.contains('open');
    if (isOpen) { closeMenu(); } else { dropdown.classList.add('open'); overlay.classList.add('open'); }
  }
  function closeMenu() { dropdown.classList.remove('open'); overlay.classList.remove('open'); }
  function openInfo() { closeMenu(); infoModal.classList.add('open'); }
  function closeInfo() { infoModal.classList.remove('open'); }

  menuBtn.addEventListener('click', function (e) { e.preventDefault(); toggleMenu(); });
  overlay.addEventListener('click', closeMenu);
  menuInfo.addEventListener('click', function (e) { e.preventDefault(); openInfo(); });
  infoModalBg.addEventListener('click', closeInfo);
  infoModalClose.addEventListener('click', closeInfo);

  // Anti-zoom
  var preventZoom = function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); };
  document.addEventListener('touchstart', preventZoom, { passive: false });
  document.addEventListener('touchmove', preventZoom, { passive: false });
  var lockVp = function () {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute('content', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  };
  window.addEventListener('resize', lockVp);
  setTimeout(lockVp, 500);
})();
