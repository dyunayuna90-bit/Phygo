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

  // Bottom nav hanya untuk 4 tab dashboard (home/level/history/profile);
  // disembunyikan saat masuk mode belajar (materi/simulasi/survival/history-wizard)
  // supaya lebih fokus.
  const TAB_SCREENS = ['home', 'level', 'history', 'profile'];
  const bottomNav = document.getElementById('bottomNav');
  if(bottomNav){
    bottomNav.classList.toggle('hide', !TAB_SCREENS.includes(name));
    document.querySelectorAll('.bn-item').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
  }

  // FIX: ingat tab dashboard (home/level/history/profile) terakhir yang
  // aktif SEBELUM user masuk ke mode belajar (materi/simulasi/survival/dll).
  // Dipakai supaya saat keluar/selesai dari mode belajar itu, user balik ke
  // tab asalnya (misal: 'level'), bukan selalu dilempar ke 'home'.
  if(TAB_SCREENS.includes(name)){
    app.activeTab = name;
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
  else if(name==='profile') {
    // FIX BUG "TRANSISI TAB PROFIL GAK MULUS": renderProfileScreen() itu ASYNC
    // (nunggu fetch Firestore). Dulu animateIn() dipicu LANGSUNG tanpa nunggu,
    // jadi race condition (kadang mulus krn cache, kadang patah krn belum
    // selesai). Sekarang animateIn() BARU dipanggil setelah promise-nya
    // benar-benar selesai (await), baru mulus terus setiap saat.
    renderProfileScreen().then(()=>{
      requestAnimationFrame(()=>animateIn(document.getElementById('profileScroll')));
    });
  }
  else if(name==='settings') { renderSettingsScreen(); requestAnimationFrame(()=>animateIn(document.getElementById('settingsScroll'))); }
  else if(name==='social') { renderSocialScreen(); requestAnimationFrame(()=>animateIn(document.getElementById('socialScroll'))); }
  else if(name==='appinfo') { renderAppInfo(); requestAnimationFrame(()=>animateIn(document.getElementById('appInfoScroll'))); }
  else if(name==='rankinfo') { renderRankInfoScreen((opts&&opts.label)||'Solo', (opts&&opts.poin)||0); requestAnimationFrame(()=>animateIn(document.getElementById('rankInfoScroll'))); }
  else if(name==='materi') { renderMateri(opts.level); requestAnimationFrame(()=>animateIn(document.getElementById('materiScroll'))); }
  else if(name==='survival'){
    startSurvivalGame();
  }
  else if(name==='duelmatch'){ startDuelMatchmaking(opts); }
  else if(name==='duelvs'){ renderDuelVsScreen(opts); }
  else if(name==='duelgame'){ startDuelGame(opts); }
  else if(name==='duelresult'){ renderDuelResultScreen(opts); }
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
  // FIX: layar auth (login/daftar) sebelumnya sama sekali gak nyambung ke
  // history, jadi tombol back HP di form Daftar nembus keluar app (atau
  // "diem aja") alih-alih balik ke form Masuk. Sekarang entry history-nya
  // ditandai {authForm:'login'|'register'} (lihat auth-ui.js) — kalau ini
  // yang lagi aktif, cukup toggle form-nya, JANGAN sentuh showScreen sama
  // sekali (dashboard belum tentu ke-render/ke-init sama sekali kalau user
  // masih di layar auth).
  if(e.state && e.state.authForm){
    handleAuthHistoryPop(e.state);
    return;
  }
  // Kalau lagi di layar auth (belum login) TAPI entry-nya bukan authForm
  // (misal history awal sebelum fix ini), tetap fallback ke form login,
  // jangan malah nyoba render dashboard yang belum tentu siap.
  if(document.getElementById('screen-auth').classList.contains('active') && document.getElementById('app').style.display === 'none'){
    handleAuthHistoryPop({ authForm: 'login' });
    return;
  }
  // Kalau sheet kuis (ijo/merah) lagi aktif, history entry yang baru saja
  // "dimakan" oleh tombol back adalah entry dummy milik sheet itu sendiri.
  // Jadi cukup tutup sheet-nya lewat handleQuizFbHistoryPop() dan JANGAN
  // pindah screen — layar di baliknya (wizard step) tidak berubah sama sekali.
  if(window.quizFbOpen){
    window.quizFbOpen = false;
    handleQuizFbHistoryPop();
    return;
  }
  // Sama seperti sheet kuis di atas: kalau ada modal fitur Sosial yang lagi
  // terbuka (Tambah Teman / Undangan / Lihat Profil Teman / Edit Profil),
  // tombol back HP cukup menutup modal itu, JANGAN pindah screen di baliknya.
  if(window.socialModalOpen && typeof handleSocialModalHistoryPop === 'function'){
    handleSocialModalHistoryPop();
    return;
  }
  // Tombol back HP saat lagi nyari lawan Duel: batalin pencarian (keluar dari
  // antrian matchmaking) dulu, baru boleh pindah screen seperti biasa.
  if(document.getElementById('screen-duelmatch').classList.contains('active') && typeof cancelDuelMatchmaking === 'function'){
    cancelDuelMatchmaking();
  }
  showScreen(e.state?e.state.screen:'home', e.state);
});
