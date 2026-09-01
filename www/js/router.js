"use strict";

function showScreen(name, opts){
  // FIX LAG: kalau user KELUAR dari wizard (bukan sekadar pindah step di
  // dalamnya), pastikan semua tween GSAP yang masih nempel di konten wizard
  // dimatiin juga. Ini jaga-jaga selain fix utama di renderWizardStep().
  if(name !== 'simulasi' && els.wizardBody){
    gsap.killTweensOf(els.wizardBody.querySelectorAll('*'));
  }
  if(name !== 'history-wizard' && hwEls.body){
    gsap.killTweensOf(hwEls.body.querySelectorAll('*'));
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');

  // Bottom nav hanya untuk 4 tab dashboard (home/level/history/settings);
  // disembunyikan saat masuk mode belajar (materi/simulasi/survival/history-wizard)
  // supaya lebih fokus.
  const TAB_SCREENS = ['home', 'level', 'history', 'settings'];
  const bottomNav = document.getElementById('bottomNav');
  if(bottomNav){
    bottomNav.classList.toggle('hide', !TAB_SCREENS.includes(name));
    document.querySelectorAll('.bn-item').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
  }

  if(name==='home') { renderHome(); requestAnimationFrame(()=>animateIn(document.getElementById('homeScroll'))); }
  else if(name==='level') { renderLevelMap(); requestAnimationFrame(()=>animateIn(document.getElementById('levelScroll'))); }
  else if(name==='history') { renderHistoryDashboard(); requestAnimationFrame(()=>animateIn(document.getElementById('historyScroll'))); }
  else if(name==='history-wizard'){
    historyWizard.level = opts.level; historyWizard.step = opts.step || 0; historyWizard.previousStep = historyWizard.step;
    renderHistoryWizardStep(true);
    requestAnimationFrame(()=>{
      gsap.fromTo(hwEls.body, {opacity:0, y:20}, {opacity:1, y:0, duration:0.5, ease:'back.out(1.2)'});
    });
  }
  else if(name==='settings') { renderSettingsScreen(); requestAnimationFrame(()=>animateIn(document.getElementById('settingsScroll'))); }
  else if(name==='appinfo') { renderAppInfo(); requestAnimationFrame(()=>animateIn(document.getElementById('appInfoScroll'))); }
  else if(name==='materi') { renderMateri(opts.level); requestAnimationFrame(()=>animateIn(document.getElementById('materiScroll'))); }
  else if(name==='survival'){
    startSurvivalGame();
  }
  else if(name==='simulasi'){
    wizard.level = opts.level; wizard.step = opts.step || 0; wizard.previousStep = wizard.step;
    if(wizard.step === 0){ app.calc[opts.level]=undefined; app.locked[opts.level]=undefined; app.calcChain[opts.level]={}; }
    // Simpan posisi wizard ini (khusus level yg belum selesai) supaya tombol
    // "Lanjutkan" di dashboard selalu tahu harus balik ke sini — termasuk
    // kalau app-nya ke-close paksa / out tiba-tiba di step manapun.
    if(!app.completed.has(wizard.level)){ saveLastProgress(wizard.level, wizard.step); }
    renderWizardStep(true); 
    requestAnimationFrame(()=>{
       gsap.fromTo(els.wizardBody, {opacity:0, y:20}, {opacity:1, y:0, duration:0.5, ease:'back.out(1.2)'});
    });
  }
  document.querySelectorAll('#screen-'+name+' .scroll-pane').forEach(s=> s.scrollTop=0);
}

function navigate(name, opts, replace){ const state = Object.assign({screen:name}, opts||{}); if(replace) history.replaceState(state, '', '#'+name); else history.pushState(state, '', '#'+name); showScreen(name, opts); }

window.addEventListener('popstate', (e)=>{
  // Kalau sheet kuis (ijo/merah) lagi aktif, history entry yang baru saja
  // "dimakan" oleh tombol back adalah entry dummy milik sheet itu sendiri.
  // Jadi cukup tutup sheet-nya lewat handleQuizFbHistoryPop() dan JANGAN
  // pindah screen — layar di baliknya (wizard step) tidak berubah sama sekali.
  if(window.quizFbOpen){
    window.quizFbOpen = false;
    handleQuizFbHistoryPop();
    return;
  }
  showScreen(e.state?e.state.screen:'home', e.state);
});

