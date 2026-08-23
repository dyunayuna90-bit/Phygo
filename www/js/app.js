"use strict";

// Init tombol exit wizard (butuh els dari state.js + svgIcon dari helpers.js + goToDashboard dari screens.js)
if(els.wizExit){ els.wizExit.innerHTML = svgIcon('doorExit'); els.wizExit.onclick = goToDashboard; }

// Entry point — dijalankan setelah semua module lain ke-load
history.replaceState({screen:'home'}, '', '#home'); showScreen('home');

// Loading screen awal: dashboard sebenarnya udah dirender di atas (synchronous),
// tapi kita tetap kasih jeda kecil + tunggu font siap sebelum loader-nya
// di-fade-out, biar transisinya mulus dan gak "ngedip"/patah pas pertama kali dibuka.
(function initialLoadFadeOut(){
  const loader = document.getElementById('appLoader');
  if(!loader) return;
  const minDelay = new Promise(res => setTimeout(res, 400));
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.all([minDelay, fontsReady]).then(() => {
    requestAnimationFrame(() => {
      loader.classList.add('hide');
      setTimeout(() => loader.remove(), 400);
    });
  });
})();
