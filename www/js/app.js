"use strict";

// Terapkan tema tersimpan sedini mungkin (masih ketutup #appLoader, jadi ga ada "flash" warna)
setTheme(getTheme());

// Kutipan fisika di Home berganti tiap kali aplikasi dibuka (lihat juga
// bumpQuoteIndex() yang dipanggil tiap naik level, di screens.js)
bumpQuoteIndex();

// Init tombol exit wizard (butuh els dari state.js + svgIcon dari helpers.js + goToDashboard dari screens.js)
if(els.wizExit){ els.wizExit.innerHTML = svgIcon('doorExit'); els.wizExit.onclick = goToDashboard; }

// Init tombol exit wizard Sejarah + tombol "Mundur" di dashboard tumpukan kartu
if(hwEls.exit){ hwEls.exit.innerHTML = svgIcon('doorExit'); hwEls.exit.onclick = closeHistoryWizard; }
const historyMundurBtn = document.getElementById('historyMundurBtn');
if(historyMundurBtn){
  historyMundurBtn.querySelector('.history-mundur-icon').innerHTML = svgIcon('undo');
  historyMundurBtn.addEventListener('click', undoHistorySwipe);
}

// ===== Ikon statis Bottom Navigation =====
document.getElementById('navHome').querySelector('.bn-icon').innerHTML = svgIcon('home');
document.getElementById('navLevel').querySelector('.bn-icon').innerHTML = svgIcon('mapRoute');
document.getElementById('navHistory').querySelector('.bn-icon').innerHTML = svgIcon('history');
document.getElementById('navSettings').querySelector('.bn-icon').innerHTML = svgIcon('gear');
document.querySelectorAll('.bn-item').forEach(btn=>{
  btn.addEventListener('click', ()=> navigate(btn.dataset.screen, {}, true));
});

// ===== Tombol "Lanjutkan Main" (mengambang) di Home =====
document.querySelector('#btnContinuePlay .bcf-icon').innerHTML = svgIcon('play');
document.getElementById('btnContinuePlay').addEventListener('click', handleContinuePlay);

// ===== Ikon & aksi statis di Pengaturan =====
document.getElementById('btnExportData').querySelector('.settings-row-icon').innerHTML = svgIcon('download');
document.getElementById('btnImportData').querySelector('.settings-row-icon').innerHTML = svgIcon('upload');
document.getElementById('btnResetData').querySelector('.settings-row-icon').innerHTML = svgIcon('trash');
document.getElementById('btnAppInfo').querySelector('.settings-row-icon').innerHTML = svgIcon('info');
document.querySelectorAll('.settings-row-chevron').forEach(el => el.innerHTML = svgIcon('chevronRight'));

document.getElementById('btnExportData').addEventListener('click', exportDataJson);
document.getElementById('btnResetData').addEventListener('click', resetAllData);
document.getElementById('btnAppInfo').addEventListener('click', ()=> navigate('appinfo', {}, false));

// ===== Halaman "Tentang Aplikasi" =====
document.getElementById('btnAppInfoBack').innerHTML = svgIcon('arrowBack');
document.getElementById('btnAppInfoBack').addEventListener('click', ()=> navigate('settings', {}, false));

const importFileInput = document.getElementById('importFileInput');
document.getElementById('btnImportData').addEventListener('click', ()=> importFileInput.click());
importFileInput.addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if(file) importDataJson(file);
  importFileInput.value = '';
});

document.querySelectorAll('#themeGrid .theme-swatch').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    setTheme(btn.dataset.theme);
    document.querySelectorAll('#themeGrid .theme-swatch').forEach(el => el.classList.toggle('active', el === btn));
  });
});

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
