"use strict";

function showScreen(name, opts){
  // FIX LAG: kalau user KELUAR dari wizard (bukan sekadar pindah step di
  // dalamnya), pastikan semua tween GSAP yang masih nempel di konten wizard
  // dimatiin juga. Ini jaga-jaga selain fix utama di renderWizardStep().
  if(name !== 'simulasi' && els.wizardBody){
    gsap.killTweensOf(els.wizardBody.querySelectorAll('*'));
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  if(name==='home') { renderHome(); requestAnimationFrame(()=>animateIn(document.getElementById('homeScroll'))); }
  else if(name==='materi') { renderMateri(opts.level); requestAnimationFrame(()=>animateIn(document.getElementById('materiScroll'))); }
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

