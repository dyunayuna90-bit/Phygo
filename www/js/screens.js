"use strict";

function renderHome(){
  renderHomeHeader();
  renderHomeContinueCard();
  renderHomeAchievement();
  renderSurvivalCard(document.getElementById('homeSurvivalCard'));
  renderHomeStreakCard();
  renderHomeHistoryScroll();
  renderHomeQuote();
}

// ===== Header â€” sapaan dinamis sesuai jam + tanggal hari ini =====
function greetingText(){
  const h = new Date().getHours();
  if(h < 11) return 'Selamat pagi';
  if(h < 15) return 'Selamat siang';
  if(h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function todayLongDate(){
  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date();
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]}`;
}

function renderHomeHeader(){
  const holder = document.getElementById('homeHeader');
  if(!holder) return;
  holder.innerHTML = `
    <div class="home-header-text">
      <h1>${greetingText()}</h1>
      <p>${todayLongDate()}</p>
    </div>
  `;
}

// ===== Kartu CTA utama â€” 1 kartu adaptif yang menggantikan tombol lama +
// notifikasi lama, jadi selalu ada satu ajakan aksi paling relevan:
// 1) Ada wizard belum selesai -> ajak lanjutkan persis di step itu.
// 2) Ada level materi berikutnya -> ajak mulai level itu.
// 3) Semua level selesai -> ajak coba Mode Survival.
function renderHomeContinueCard(){
  const holder = document.getElementById('homeContinueCard');
  if(!holder) return;

  const lp = getLastProgress();
  const L = lp ? LEVELS[lp.level] : null;

  let eyebrow, title, sub, action;
  if(lp && L && !app.completed.has(lp.level)){
    eyebrow = 'Lanjutkan Belajar';
    title = `Level ${lp.level}: ${L.title}`;
    sub = 'Kamu berhenti di tengah jalan â€” yuk selesaikan sekarang.';
    action = resumeLastActivity;
  } else {
    const nextLevel = [1,2,3].find(id => !app.completed.has(id));
    if(nextLevel){
      const NL = LEVELS[nextLevel];
      eyebrow = app.completed.size === 0 ? 'Mulai Belajar' : 'Level Berikutnya';
      title = `Level ${nextLevel}: ${NL.title}`;
      sub = 'Pelajari materinya, lalu uji lewat simulasi interaktif.';
      action = ()=> navigate('materi', {level:nextLevel});
    } else {
      eyebrow = 'Semua Level Tuntas!';
      title = 'Asah Kecepatanmu di Mode Survival';
      sub = 'Jawab soal cepat-cepatan dan kejar skor tertinggimu.';
      action = ()=> navigate('survival', {});
    }
  }

  holder.innerHTML = `
    <button class="home-cta ripple-host" id="homeCtaBtn">
      <div class="home-cta-icon-bg">${svgIcon('speed')}</div>
      <span class="home-cta-eyebrow">${eyebrow}</span>
      <h3 class="home-cta-title">${title}</h3>
      <p class="home-cta-sub">${sub}</p>
      <span class="home-cta-go">${svgIcon('chevronRight')}</span>
    </button>
  `;
  document.getElementById('homeCtaBtn').addEventListener('click', action);
}

function renderHomeAchievement(){
  const holder = document.getElementById('homeAchievementCard');
  if(!holder) return;
  const pct = Math.round((app.completed.size / 3) * 100);
  const lvlChips = [1,2,3].map(id=>{
    const done = app.completed.has(id);
    return `<span class="ach-lvl-chip ${done?'done':''}">${done ? svgIcon('checkSm') : id}</span>`;
  }).join('');
  holder.innerHTML = `
    <div class="gami-card home-card">
      <div class="home-card-icon-bg">${svgIcon('trophy')}</div>
      <div class="g-chart">
        <svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="15"/><circle class="prog" cx="18" cy="18" r="15" stroke-dasharray="${pct}, 100"/></svg>
        <div class="g-val">${app.completed.size}/3</div>
      </div>
      <div class="g-info">
        <h3>Pencapaian</h3>
        <p>Selesaikan semua tantangan dasar fisika.</p>
        <div class="ach-lvl-row">${lvlChips}</div>
      </div>
    </div>
  `;
  apply3DTilt(holder.querySelector('.gami-card'), 10, 0);
}

// ===== Kartu Streak â€” pendamping kartu Survival di baris bento kedua =====
function renderHomeStreakCard(){
  const holder = document.getElementById('homeStreakCard');
  if(!holder) return;
  const streak = getStreakCount();
  const msg = streak <= 1 ? 'Ayo mulai kebiasaan belajar!' : 'Pertahankan terus, jangan putus!';
  holder.innerHTML = `
    <div class="streak-card home-card">
      <div class="home-card-icon-bg">${svgIcon('fire')}</div>
      <span class="streak-icon-box">${svgIcon('fire')}</span>
      <div class="streak-val">${streak}</div>
      <div class="streak-label">Hari Beruntun</div>
      <p class="streak-msg">${msg}</p>
    </div>
  `;
}

// ===== Teaser Arsip Sejarah â€” scroll horizontal ala Pinterest, tap langsung
// membuka wizard arsip level terkait (reuse openHistoryWizard) =====
function renderHomeHistoryScroll(){
  const holder = document.getElementById('homeHistoryScroll');
  if(!holder || typeof HISTORY_LEVELS === 'undefined') return;
  const ids = Object.keys(HISTORY_LEVELS).map(Number).sort((a,b)=>a-b);
  holder.innerHTML = ids.map(id => {
    const L = HISTORY_LEVELS[id];
    return `
      <button class="history-teaser-card ripple-host" data-level="${id}">
        <span class="htc-icon">${svgIcon(L.icon)}</span>
        <span class="htc-eyebrow">${L.eyebrow}</span>
        <span class="htc-title">${L.title}</span>
      </button>
    `;
  }).join('');
  Array.from(holder.children).forEach(card=>{
    card.addEventListener('click', ()=> openHistoryWizard(Number(card.dataset.level), card));
  });
}

function renderHomeQuote(){
  const holder = document.getElementById('homeQuoteCard');
  if(!holder) return;
  const q = PHYSICS_QUOTES[getQuoteIndex() % PHYSICS_QUOTES.length];
  holder.innerHTML = `
    <div class="quote-card home-card">
      <div class="home-card-icon-bg">${svgIcon('quote')}</div>
      <div class="quote-mark">${svgIcon('quote')}</div>
      <p class="quote-text">${q.text}</p>
      <span class="quote-by">${q.by}${q.year ? ', ' + q.year : ''}</span>
    </div>
  `;
}

// ===== Halaman "Level" â€” peta zig-zag (tidak diubah tampilannya) =====
function renderLevelMap(){
  const mapEl = document.getElementById('journeyMap');
  Array.from(mapEl.children).forEach(c => { if(c.id !== 'jPathSvg') c.remove(); });

  let highestCompleted = Math.max(0, ...Array.from(app.completed));

  [3,2,1].forEach(id=>{
    const L = LEVELS[id], done = app.completed.has(id);
    const locked = !done && id > highestCompleted + 1;
    const active = !locked && !done;

    const wrap = document.createElement('div');
    wrap.className = `j-node-wrap ${id%2===0 ? 'right' : 'left'}`;
    wrap.dataset.id = id;

    const btn = document.createElement('button');
    btn.className = `j-node ripple-host`;

    if (app.justUnlockedLevel === id) {
      btn.classList.add('locked'); 
      btn.innerHTML = `<div class="icon-wrap" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${svgIcon('lock')}</div>`;
    } else {
      btn.classList.add(done ? 'completed' : (active ? 'active-node' : 'locked'));
      btn.innerHTML = `<div class="icon-wrap" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${locked ? svgIcon('lock') : (done ? svgIcon('check') : svgIcon(L.icon))}</div>`;
    }

    if(!locked) btn.addEventListener('click', ()=> navigate('materi', {level:id}));

    const lbl = document.createElement('div');
    lbl.className = 'j-node-label';
    lbl.textContent = `Lvl ${id}: ${L.title.split(' ')[0]}`; 

    wrap.appendChild(btn); wrap.appendChild(lbl); mapEl.appendChild(wrap);
    apply3DTilt(btn, 25, 0); 
  });

  setTimeout(drawJourneyLines, 50);
}

// ===================================================================
// ===== Halaman "Sejarah" â€” Tumpukan kartu arsip + wizard konten ====
// ===================================================================

let historyCardEls = null; // {levelId: HTMLElement} â€” dibuat sekali, dipakai ulang
const HIST_PEEK = 46;         // px "pucuk" kartu di belakang yang kelihatan di atas kartu depannya
const HIST_SCALE_STEP = 0.045;
const HIST_CARD_H = 380;      // harus sinkron dengan min-height .history-card di CSS

function renderHistoryDashboard(){
  const holder = document.getElementById('historyStackHolder');
  if(!holder) return;
  if(!historyCardEls) buildHistoryCards();
  layoutHistoryStack(false);
}

function buildHistoryCards(){
  const holder = document.getElementById('historyStackHolder');
  if(!holder || typeof HISTORY_LEVELS === 'undefined') return;
  holder.innerHTML = '';
  historyCardEls = {};
  const ids = Object.keys(HISTORY_LEVELS).map(Number).sort((a,b)=>a-b);
  ids.forEach(id=>{
    const L = HISTORY_LEVELS[id];
    const card = document.createElement('button');
    card.className = 'history-card ripple-host';
    card.dataset.level = id;
    card.setAttribute('aria-label', 'Buka arsip: ' + L.title);
    card.innerHTML = `
      <div class="history-card-top">
        <span class="history-card-eyebrow">${L.eyebrow}</span>
        <h3 class="history-card-title">${L.title}</h3>
      </div>
      <div class="history-card-icon-bg">${svgIcon(L.icon)}</div>
      <p class="history-card-desc">${L.summary}</p>
      <div class="history-card-footer">
        <span class="history-card-count">${L.arsip.length} Arsip Tercatat</span>
        <span class="history-card-cta">${svgIcon('chevronRight')}</span>
      </div>
    `;
    holder.appendChild(card);
    historyCardEls[id] = card;
    attachHistoryCardGestures(card, id);
  });
  // Kalau urutan tersimpan sebelumnya sudah tidak sinkron (mis. level baru
  // ditambahkan di config), regenerasi urutan awal supaya tetap konsisten.
  if(!app.history.order || app.history.order.length !== ids.length){
    app.history.order = ids.slice();
    app.history.swipeCount = 0;
  }
  // Tinggi wadah dihitung persis pas: tinggi 1 kartu + "pucuk" kartu-kartu di
  // belakangnya. Ini yang mencegah kartu paling belakang numpuk/nabrak ke
  // judul tab di atasnya, berapa pun jumlah kartunya nanti.
  const depth = Math.max(0, ids.length - 1);
  holder.style.minHeight = (HIST_CARD_H + depth * HIST_PEEK) + 'px';
}

// Menata ulang posisi visual seluruh kartu berdasarkan `app.history.order`.
// order[0] = kartu paling depan (aktif). Kartu di belakangnya digeser TURUN
// makin jauh (bukan naik) sehingga bagian atas tiap kartu di belakang selalu
// nongol/"pucuk" di ATAS kartu yang ada di depannya â€” dan karena kartu paling
// belakang justru berada paling dekat ke atas wadah (bukan mencuat ke luar
// wadah), dia tidak akan pernah numpuk ke judul tab.
function layoutHistoryStack(animate){
  if(!historyCardEls || !app.history) return;
  const order = app.history.order;
  const maxDepth = order.length - 1;
  order.forEach((id, idx)=>{
    const card = historyCardEls[id];
    if(!card) return;
    card.style.display = '';
    const y = (maxDepth - idx) * HIST_PEEK;
    const scale = 1 - idx * HIST_SCALE_STEP;
    card.style.zIndex = 30 - idx;
    card.style.pointerEvents = idx === 0 ? 'auto' : 'none';
    card.classList.toggle('is-front', idx === 0);
    if(animate){
      gsap.to(card, { y, scale, opacity:1, rotate:0, duration:.55, ease:'back.out(1.3)', overwrite:'auto' });
    } else {
      gsap.set(card, { y, scale, opacity:1, rotate:0 });
    }
  });
}

function attachHistoryCardGestures(card, id){
  let startY = 0, startX = 0, dragging = false, moved = false, baseY = 0;
  card.addEventListener('pointerdown', (e)=>{
    if(card.style.pointerEvents === 'none') return;
    dragging = true; moved = false; startY = e.clientY; startX = e.clientX;
    // Kartu terdepan istirahat di posisi y > 0 (bukan 0) karena sekarang
    // ditumpuk mundur ke bawah â€” jadi harus dicatat dulu titik awalnya,
    // supaya geseran jari itungannya RELATIF ke situ. Kalau tidak, kartu
    // bakal "loncat" ke y:0 dulu begitu jari mulai bergerak.
    baseY = gsap.getProperty(card, 'y') || 0;
    try{ card.setPointerCapture(e.pointerId); }catch(err){}
    gsap.killTweensOf(card);
  });
  card.addEventListener('pointermove', (e)=>{
    if(!dragging) return;
    const dy = e.clientY - startY, dx = e.clientX - startX;
    if(Math.abs(dy) > 6 || Math.abs(dx) > 6) moved = true;
    // Kartu terdepan HANYA boleh diseret ke bawah (buang/mundur-maju biasa).
    // Gerakan ke atas sengaja tidak diberi efek apa pun di kartu ini â€” swipe
    // ke atas adalah gestur "mundur" global (lihat endDrag), bukan aksi yang
    // menempel/menyeret kartu terdepan.
    if(dy > 0) gsap.set(card, { y: baseY + dy * 0.85, rotate: clamp(dx * 0.04, -10, 10) });
  });
  function endDrag(e){
    if(!dragging) return;
    dragging = false;
    const dy = (typeof e.clientY === 'number' ? e.clientY : startY) - startY;
    if(dy > 100){ commitHistorySwipe(card, id); }
    else if(dy < -70){ historySwipeBack(); }
    else if(moved){ gsap.to(card, { y:baseY, rotate:0, duration:.4, ease:'back.out(2)' }); }
    else { openHistoryWizard(id, card); }
  }
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', ()=>{
    dragging = false;
    gsap.to(card, { y:baseY, rotate:0, duration:.3 });
  });
}

// Swipe ke bawah pada kartu terdepan: kartu itu "dibuang" dan pindah ke
// paling belakang tumpukan.
function commitHistorySwipe(card, id){
  gsap.to(card, {
    y:'+=380', opacity:0, rotate:-8, duration:.4, ease:'power2.in',
    onComplete:()=>{
      app.history.order.push(app.history.order.shift());
      app.history.swipeCount++;
      gsap.set(card, { y: HIST_CARD_H + 60, opacity:0, rotate:0, scale: 1 - (app.history.order.length-1) * HIST_SCALE_STEP });
      layoutHistoryStack(true);
    }
  });
}

// Gestur "mundur": swipe ke atas pada kartu terdepan. Ini LITERAL kebalikan
// dari animasi commitHistorySwipe di atas, dimainkan mundur, untuk SATU kartu
// yang balik itu saja (kartu lain tidak diapa-apakan selain digeser halus
// biasa ke slot barunya â€” tidak ada animasi kedua yang saling tabrakan).
//
// Alur commitHistorySwipe (maju) utk kartu yg dibuang:
//   depan -> [tween: turun+memudar] -> [lompat instan: sembunyi jauh di
//   bawah] -> [tween: naik ke slot paling belakang]
// Di sini kita mainkan PERSIS urutan itu terbalik utk kartu yg kembali:
//   belakang -> [tween: turun+memudar, sembunyi jauh di bawah] ->
//   [lompat instan: balik ke posisi "baru saja dibuang"] -> [tween: naik
//   balik ke slot depan]
// Supaya tidak ketutupan/tembus kartu lain selagi jalan, kartu ini langsung
// dipindah ke z-index paling atas SEBELUM animasi dimulai.
function historySwipeBack(){
  if(!app.history || app.history.swipeCount <= 0 || !historyCardEls) return;
  const order = app.history.order;
  const returningId = order[order.length - 1];
  const returningCard = historyCardEls[returningId];

  order.unshift(order.pop());
  app.history.swipeCount--;
  const maxDepth = order.length - 1;
  const frontY = maxDepth * HIST_PEEK;

  if(returningCard){
    gsap.killTweensOf(returningCard);
    // FASE 1: kartu dikunci di lapisan PALING BAWAH (bukan sekadar dibiarkan
    // pakai z-index lama) selagi turun & memudar. Ini perlu, karena begitu
    // `order` di-rotate, kartu yang tadinya "kedua dari belakang" ikut naik
    // jadi kartu paling belakang yang baru â€” dan kalau z-index kartu balik
    // ini tidak dikunci, sesaat z-index keduanya bisa SERI, bikin urutan
    // render jadi acak (kartu balik ini sempat nembus 1 kartu di depannya).
    returningCard.style.zIndex = 0;
    gsap.to(returningCard, {
      y: HIST_CARD_H + 60, opacity: 0, rotate: 0, scale: 1, duration: .3, ease: 'power1.in',
      onComplete: () => {
        // Di titik ini kartu sudah sepenuhnya transparan (opacity 0) â€” baru
        // SEKARANG aman untuk mengangkatnya ke lapisan paling atas, karena
        // tidak ada apa pun yang kelihatan untuk "nembus".
        returningCard.style.zIndex = 31;
        returningCard.style.pointerEvents = 'auto';
        returningCard.classList.add('is-front');
        gsap.set(returningCard, { y: frontY + 380, opacity: 0, rotate: -8, scale: 1 });
        gsap.to(returningCard, { y: frontY, opacity: 1, rotate: 0, scale: 1, duration: .4, ease: 'power2.out' });
      }
    });
  }

  // Kartu-kartu lain (termasuk yang tadinya di depan): geser halus biasa ke
  // slot barunya, tak perlu animasi macam-macam.
  order.forEach((id, idx) => {
    if(id === returningId) return;
    const card = historyCardEls[id];
    if(!card) return;
    const y = (maxDepth - idx) * HIST_PEEK;
    const scale = 1 - idx * HIST_SCALE_STEP;
    card.style.zIndex = 30 - idx;
    card.style.pointerEvents = idx === 0 ? 'auto' : 'none';
    card.classList.toggle('is-front', idx === 0);
    gsap.to(card, { y, scale, opacity: 1, rotate: 0, duration: .55, ease: 'back.out(1.3)', overwrite: 'auto' });
  });
}

// Transisi buka wizard â€” sederhana & stabil: kartu cukup "menekan" sedikit
// (bounce kecil) sebagai umpan balik sentuhan, TANPA memudar/menghilang,
// lalu pindah screen. Konten wizard sendiri masuk dengan fade+slide halus
// dari router.js, jadi transisinya tetap terasa menyatu tanpa perlu morphing
// DOM yang rawan glitch.
function openHistoryWizard(level, cardEl){
  gsap.killTweensOf(cardEl);
  gsap.to(cardEl, {
    scale:0.95, duration:.16, ease:'power2.out',
    onComplete(){
      navigate('history-wizard', { level, step:0 });
      gsap.to(cardEl, { scale:1, duration:.25, ease:'power2.out' });
    }
  });
}

function closeHistoryWizard(){ navigate('history', {}, false); }

function hwGoStep(delta){
  const count = HISTORY_LEVELS[historyWizard.level].arsip.length;
  const nextStep = historyWizard.step + delta;
  if(nextStep < 0 || nextStep >= count){ closeHistoryWizard(); return; }
  historyWizard.previousStep = historyWizard.step;
  navigate('history-wizard', { level: historyWizard.level, step: clamp(nextStep, 0, count-1) });
}

function renderHistoryWizardStep(isInitial){
  const L = HISTORY_LEVELS[historyWizard.level];
  const step = historyWizard.step;
  const item = L.arsip[step];
  const count = L.arsip.length;

  let dotsHtml = '';
  for(let i=0; i<count; i++) dotsHtml += `<div class="step-dot ${i===step?'current':(i<step?'done':'')}"></div>`;
  hwEls.progress.innerHTML = dotsHtml;

  smoothUpdate(hwEls.body, ()=>{
    gsap.killTweensOf(hwEls.body.querySelectorAll('*'));
    hwEls.body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'wizard-step-content history-step';
    wrap.innerHTML = `
      <span class="eyebrow-pill">${item.tag}</span>
      <h2>${item.title}</h2>
      <div class="history-image-frame">
        <img src="${item.image}" alt="${item.imageAlt || item.title}" loading="lazy"
             onerror="this.closest('.history-image-frame').classList.add('img-missing'); this.remove();">
        <div class="history-image-fallback">${svgIcon('image')}</div>
      </div>
      ${item.figure ? `
      <div class="info-card history-figure-card">
        <div>
          <span class="lbl">${item.figure.role || ''}</span>
          <div style="font-weight:900; font-size:16px; margin-top:2px;">${item.figure.name}</div>
        </div>
        <span style="font-family:var(--font); font-weight:700; font-size:13px; color:var(--on-surface-var); text-align:right;">${item.figure.years || ''}</span>
      </div>` : ''}
      ${item.body.map(p=>`<p class="step-text">${p}</p>`).join('')}
      ${item.formula ? `<div class="formula-box">${tex(String.raw`${item.formula}`)}</div><p class="formula-note">${item.formulaNote || ''}</p>` : ''}
    `;
    hwEls.body.appendChild(wrap);
    if(!isInitial){
      const isForward = step > historyWizard.previousStep;
      gsap.fromTo(wrap,
        { x: isForward ? 40 : -40, opacity:0 },
        { x:0, opacity:1, duration:.5, ease:'back.out(1.1)' }
      );
    }
  });

  const isLast = step === count - 1;
  hwEls.back.style.visibility = step === 0 ? 'hidden' : 'visible';
  hwEls.back.innerHTML = svgIcon('arrowBack');
  hwEls.back.onclick = ()=> hwGoStep(-1);
  hwEls.primary.textContent = isLast ? 'Tutup Arsip' : 'Lanjut';
  hwEls.primary.onclick = isLast ? closeHistoryWizard : (()=> hwGoStep(1));
}

// ===== Halaman "Pengaturan" =====
function renderSettingsScreen(){
  const activeTheme = getTheme();
  document.querySelectorAll('#themeGrid .theme-swatch').forEach(el=>{
    el.classList.toggle('active', el.dataset.theme === activeTheme);
  });
}

function resetAllData(){
  Swal.fire({
    icon:'warning',
    title:'Reset Semua Data?',
    text:'Seluruh pencapaian, skor tertinggi, dan progres yang tersimpan akan dihapus permanen dan tidak bisa dikembalikan.',
    showCancelButton:true,
    confirmButtonText:'Ya, Hapus Semua',
    cancelButtonText:'Batal',
    background:'#1C2426', color:'#E3E3E6',
    confirmButtonColor:'var(--error)',
    cancelButtonColor:'var(--surface-c-high)'
  }).then(res=>{
    if(!res.isConfirmed) return;
    ['phygo_completed','phygo_last_progress','phygo_survival_highscore','phygo_quote_ctr','phygo_streak'].forEach(k=>{
      try{ localStorage.removeItem(k); }catch(e){}
    });
    app.completed = new Set();
    app.justUnlockedLevel = null;
    app.params = {}; app.attempts = {1:0,2:0,3:0}; app.calc = {}; app.calcChain = {1:{},2:{},3:{}}; app.locked = {};
    navigate('home', {}, true);
    Swal.fire({ icon:'success', title:'Data berhasil direset', background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--primary)' });
  });
}

function exportDataJson(){
  const data = {
    version: 1,
    completed: [...app.completed],
    lastProgress: getLastProgress(),
    survivalHighScore: survGetHighScore(),
    quoteCtr: getQuoteIndex(),
    streak: getStreakData(),
    theme: getTheme(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'phygo-backup.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 2000);
  Swal.fire({ icon:'success', title:'Data berhasil diekspor', text:'File phygo-backup.json telah diunduh.', background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--primary)' });
}

function importDataJson(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    try{
      const data = JSON.parse(e.target.result);
      if(!data || !Array.isArray(data.completed)) throw new Error('format tidak valid');

      app.completed = new Set(data.completed.filter(n => [1,2,3].includes(n)));
      try{ localStorage.setItem('phygo_completed', JSON.stringify([...app.completed])); }catch(err){}

      if(data.lastProgress && typeof data.lastProgress.level === 'number' && typeof data.lastProgress.step === 'number'){
        saveLastProgress(data.lastProgress.level, data.lastProgress.step);
      } else {
        clearLastProgress();
      }

      if(typeof data.survivalHighScore === 'number') survSaveHighScore(data.survivalHighScore);
      if(typeof data.quoteCtr === 'number'){ try{ localStorage.setItem('phygo_quote_ctr', String(data.quoteCtr)); }catch(err){} }
      if(data.streak && typeof data.streak.count === 'number'){ try{ localStorage.setItem('phygo_streak', JSON.stringify(data.streak)); }catch(err){} }
      if(data.theme) setTheme(data.theme);

      Swal.fire({ icon:'success', title:'Data berhasil dipulihkan', background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--primary)' })
        .then(()=>{ renderSettingsScreen(); navigate('home', {}, true); });
    }catch(err){
      Swal.fire({ icon:'error', title:'Impor Gagal', text:'File JSON tidak valid atau rusak.', background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--error)' });
    }
  };
  reader.readAsText(file);
}

// ===== Halaman "Tentang Aplikasi" â€” halaman penuh (bukan pop-up) =====
function renderAppInfo(){
  document.getElementById('appInfoPurpose').textContent = APP_INFO.purpose;
  document.getElementById('appInfoTeam').innerHTML = APP_INFO.team.map(n => `
    <div class="appinfo-team-item">
      <div class="appinfo-team-avatar">${n.trim().charAt(0)}</div>
      <span>${n}</span>
    </div>
  `).join('');
  document.getElementById('appInfoRepoUrl').textContent = APP_INFO.repoUrl.replace(/^https?:\/\//,'');
  const repoLink = document.getElementById('appInfoRepoLink');
  repoLink.href = APP_INFO.repoUrl;
  repoLink.querySelector('.appinfo-repo-icon').innerHTML = svgIcon('code');
}

// Tombol "Sakti" â€” satu-satunya pintu masuk untuk melanjutkan progres.
// Karena hasil kalkulasi antar-step (app.calc/app.locked/app.calcChain/
// app.lastResult) cuma hidup di memory dan ikut hilang kalau app sempat
// di-close, di sini kita regenerate parameter soal-nya persis seperti saat
// user pertama kali membuka halaman materi level tsb (lihat renderMateri()).
// Wizard tetap diarahkan ke step terakhir yang tersimpan â€” dan itu AMAN,
// karena tiap step renderer di level1/2/3.js sudah otomatis mundur sendiri
// (wizardGoStep(-1)) kalau ada data hitungan yang belum tersedia, sehingga
// user tidak akan pernah nyangkut di step yang rusak/kosong maupun harus
// mengulang dari awal wizard.
function resumeLastActivity(){
  const lp = getLastProgress();
  if(!lp || !LEVELS[lp.level]) return;
  const L = LEVELS[lp.level];
  app.params[lp.level] = L.genParams();
  app.attempts[lp.level] = 0;
  navigate('simulasi', { level: lp.level, step: lp.step });
}

function drawJourneyLines() {
  const svg = document.getElementById('jPathSvg');
  if(!svg) return;
  const nodes = Array.from(document.querySelectorAll('.j-node-wrap')).reverse(); 
  if(nodes.length < 2) return;
  
  const mapEl = document.getElementById('journeyMap');
  const mapRect = mapEl.getBoundingClientRect();
  
  let pathsHTML = '';
  
  for(let i=0; i<nodes.length-1; i++) {
    const node1 = nodes[i].querySelector('.j-node');
    const node2 = nodes[i+1].querySelector('.j-node');
    
    const rect1 = node1.getBoundingClientRect(); const rect2 = node2.getBoundingClientRect();
    const x1 = rect1.left + rect1.width/2 - mapRect.left, y1 = rect1.top + rect1.height/2 - mapRect.top;
    const x2 = rect2.left + rect2.width/2 - mapRect.left, y2 = rect2.top + rect2.height/2 - mapRect.top;
    
    const d = `M ${x1},${y1} Q ${(x1+x2)/2},${(y1+y2)/2 + 30} ${x2},${y2}`; 
    
    pathsHTML += `<path d="${d}" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="26" stroke-linecap="round" transform="translate(0, 10)"/>`;
    pathsHTML += `<path d="${d}" fill="none" stroke="var(--surface-c)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>`;
    
    const targetLevel = parseInt(nodes[i+1].dataset.id);
    let extraStyle = '', animClass = '';
    
    if (app.justUnlockedLevel === targetLevel) {
       animClass = 'path-line-anim';
       extraStyle = 'stroke-dasharray: 500; stroke-dashoffset: 500;'; 
    } else if (targetLevel <= Math.max(0, ...Array.from(app.completed)) + 1) {
       extraStyle = ''; 
    } else { extraStyle = 'display: none;'; }

    pathsHTML += `<path class="${animClass}" d="${d}" fill="none" stroke="var(--primary)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.9; ${extraStyle}"/>`;
  }
  
  svg.innerHTML = pathsHTML;

  if (app.justUnlockedLevel) {
     const targetLvl = app.justUnlockedLevel;
     const animatedLine = svg.querySelector('.path-line-anim');
     const unlockedBtn = Array.from(nodes).find(n => parseInt(n.dataset.id) === targetLvl)?.querySelector('.j-node');
     
     if (animatedLine && unlockedBtn) {
       const iconWrap = unlockedBtn.querySelector('.icon-wrap');
       const tl = gsap.timeline();
       tl.to(animatedLine, {strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut'})
         .set(animatedLine, {strokeDasharray: 'none'}) 
         .to(unlockedBtn, {x: -6, duration: 0.05, yoyo: true, repeat: 9})
         .to(iconWrap, {rotationY: -90, scale: 0.5, duration: 0.2, ease: 'power1.in'})
         .add(() => {
            unlockedBtn.classList.remove('locked'); unlockedBtn.classList.add('active-node');
            iconWrap.innerHTML = svgIcon('unlock'); gsap.set(iconWrap, {rotationY: 90, scale: 0.5});
         })
         .to(iconWrap, {rotationY: 0, scale: 1, duration: 0.4, ease: 'back.out(2.5)'})
         .to(unlockedBtn, {scale: 1.2, duration: 0.3, delay: 0.2})
         .to(iconWrap, {rotationY: -90, scale: 0.5, duration: 0.2, ease: 'power1.in'})
         .add(() => {
            iconWrap.innerHTML = svgIcon(LEVELS[targetLvl].icon); gsap.set(iconWrap, {rotationY: 90, scale: 0.5});
         })
         .to(iconWrap, {rotationY: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)'})
         .to(unlockedBtn, {scale: 1, duration: 0.4, ease: 'power2.out'})
         .add(() => { unlockedBtn.addEventListener('click', ()=> navigate('materi', {level:targetLvl})); });
     }
     app.justUnlockedLevel = null; 
  }
}
window.addEventListener('resize', drawJourneyLines, {passive: true});

function renderMateri(id){
  const L = LEVELS[id];
  els.materiEyebrow.textContent = L.eyebrow; els.materiTitle.textContent = L.title;
  els.materiBody.innerHTML = L.materi.map(p=>`<p class="step-text">${p}</p>`).join('') + `<p class="step-text">${L.analogy}</p>`;
  els.materiFormula.innerHTML = tex(String.raw`${L.formula}`); els.materiFormulaNote.innerHTML = L.formulaNote;
  app.params[id] = L.genParams(); app.attempts[id] = 0;
  els.btnKeSimulasi.onclick = ()=> navigate('simulasi', {level:id, step:0});
}

function wizardGoStep(delta){ 
  wizard.previousStep = wizard.step;
  navigate('simulasi', {level: wizard.level, step: clamp(wizard.step + delta, 0, STEP_COUNTS[wizard.level]-1)}); 
}

function goToDashboard(){ app.running = false; navigate(app.activeTab || 'home', {}, false); }

function setFooter(cfg){
  els.wizBack.style.visibility = cfg.backVisible ? 'visible' : 'hidden';
  els.wizBack.innerHTML = svgIcon(cfg.backIcon || 'arrowBack');
  els.wizBack.onclick = cfg.onBack || (()=> wizardGoStep(-1));
  els.wizPrimary.style.display = cfg.primaryHidden ? 'none' : '';
  els.wizPrimary.textContent = cfg.primaryLabel || 'Lanjut';
  els.wizPrimary.disabled = !!cfg.primaryDisabled; els.wizPrimary.onclick = cfg.onPrimary || (()=>{});
}

function showQuizFeedback(type, title, desc, buttonsHtml, ctxExtra) {
  const bg = document.getElementById('quizFbBackdrop');
  const fb = document.getElementById('quizFb');
  const t = document.getElementById('qfTitle');
  const d = document.getElementById('qfDesc');
  const acts = document.getElementById('qfActions');
  
  bg.classList.add('show');
  fb.className = 'quiz-feedback show ' + type;
  
  let icon = 'info';
  if(type === 'success') icon = 'check';
  else if(type === 'error' || type === 'fatal') icon = 'cross';
  
  t.innerHTML = svgIcon(icon) + ' ' + title;
  d.innerHTML = desc;
  acts.innerHTML = buttonsHtml;

  // Simpan konteks sheet ini + tandai "terbuka" dengan nge-push 1 history
  // entry dummy, supaya tombol back Android nutup SHEET ini dulu (lewat
  // popstate di router.js), bukan langsung mundur ke wizard step sebelumnya.
  window.quizFbCtx = Object.assign({ type: type }, ctxExtra || {});
  window.quizFbOpen = true;
  history.pushState({ quizFbSheet: true }, '', location.hash);
}

function hideQuizFeedback() {
  document.getElementById('quizFbBackdrop').classList.remove('show');
  document.getElementById('quizFb').classList.remove('show');
}

// Dipanggil tombol2 di dalam sheet (Klaim Pencapaian / Coba Lagi / Ulangi / Menyerah).
// Nge-pop dulu history entry dummy milik sheet, baru eksekusi aksinya di
// handleQuizFbHistoryPop() (lihat router.js) supaya history tetap konsisten
// dan tombol back Android tidak "nyangkut".
window.qfBtnAction = function(actionType, param) {
  if(actionType === 'next') closeQuizFeedback({ action:'next', level: param });
  else if(actionType === 'retry') closeQuizFeedback({ action:'retry' });
  else if(actionType === 'restart') closeQuizFeedback({ action:'restart' });
  else if(actionType === 'giveup') closeQuizFeedback({ action:'giveup' });
};

function closeQuizFeedback(pendingAction) {
  window.quizFbPendingAction = pendingAction || null;
  if(window.quizFbOpen) {
    history.back(); // -> memicu popstate -> handleQuizFbHistoryPop()
  } else {
    hideQuizFeedback();
    if(pendingAction) runQuizFbAction(pendingAction);
  }
}

// Dipanggil dari router.js SETELAH history entry dummy sheet berhasil di-pop,
// baik itu karena tombol di dalam sheet DIKLIK, maupun karena user menekan
// tombol back Android secara native.
function handleQuizFbHistoryPop() {
  hideQuizFeedback();
  const pending = window.quizFbPendingAction;
  window.quizFbPendingAction = null;
  if(pending) {
    runQuizFbAction(pending);
  } else {
    forceCloseQuizFeedback();
  }
}

// Eksekusi efek "resmi" dari tiap tombol (dipanggil setelah history bersih).
function runQuizFbAction(pending) {
  if(pending.action === 'next') {
    const wasCompleted = app.completed.has(pending.level);
    app.completed.add(pending.level);
    localStorage.setItem('phygo_completed', JSON.stringify([...app.completed]));
    if(!wasCompleted) { app.justUnlockedLevel = pending.level + 1; bumpQuoteIndex(); }
    clearLastProgress();
    navigate(app.activeTab || 'home', {}, false);
  } else if(pending.action === 'retry') {
    resetQuizForRetry();
  } else if(pending.action === 'restart') {
    wizardGoStep(-wizard.step);
  } else if(pending.action === 'giveup') {
    playSadAnimationAndExit();
  }
}

// User menekan tombol back Android/browser SAAT sheet ijo/merah masih aktif.
// Sheet-nya yang ditutup (bukan wizard-nya yang mundur):
// - error  : nyawa memang sudah berkurang saat jawaban salah tadi, jadi di
//            sini cukup reset opsi & biarkan user pilih jawaban lain.
// - success: jangan otomatis lanjut ke level berikutnya tanpa aksi eksplisit
//            dari user, ubah tombol utama jadi "Akhiri Level" biar user yang
//            memutuskan kapan klaim pencapaiannya.
// - fatal  : nyawa sudah habis, tidak ada opsi lanjut yang logis -> keluar
//            sama seperti menekan "Menyerah Saja".
function resetQuizForRetry() {
  const selectedEl = document.querySelector('.quiz-opt.wrong');
  if(selectedEl) selectedEl.classList.remove('wrong');
  setFooter({ backVisible:false, primaryLabel:'Pilih Jawaban Dulu', primaryDisabled:true });
  window.quizIsAnswered = false;
}

function forceCloseQuizFeedback() {
  const ctx = window.quizFbCtx || {};
  if(ctx.type === 'error') {
    resetQuizForRetry();
  } else if(ctx.type === 'success') {
    setFooter({ backVisible:false, primaryLabel:'Akhiri Level', primaryDisabled:false,
      onPrimary: ()=> runQuizFbAction({ action:'next', level: ctx.level }) });
  } else if(ctx.type === 'fatal') {
    playSadAnimationAndExit();
  }
}

function playSadAnimationAndExit() {
  hideQuizFeedback();
  const sadOl = document.getElementById('sadOverlay');
  const crack = document.getElementById('crackLine');
  sadOl.classList.add('show');
  
  gsap.fromTo('#sadHeart', {scale:1}, {scale:1.2, duration:0.3, yoyo:true, repeat:3, ease:'power1.inOut', onComplete:() => {
     gsap.to('#sadHeart', {x:-5, duration:0.05, yoyo:true, repeat:10});
     gsap.to(crack, {opacity:1, strokeDasharray:"50", strokeDashoffset:"50", duration:0});
     gsap.to(crack, {strokeDashoffset:0, duration:0.5, ease:'power2.out'});
  }});
  
  setTimeout(() => {
     sadOl.classList.remove('show');
     navigate(app.activeTab || 'home', {}, false);
  }, 3000);
}

function renderQuizStep(body, cfg){
  let selectedIdx = -1;
  window.quizIsAnswered = false;
  let lives = 3;
  
  body.innerHTML = `
    <div style="margin-bottom:16px;">
      <span class="eyebrow-pill" style="margin:0;">Kuis Ujian Akhir</span>
    </div>
    <h2 style="margin-bottom:12px;">Uji Konsep Mandiri</h2>
    ${cfg.visualHtml ? `<div class="quiz-visual-box" id="quizVisualBox">${cfg.visualHtml}</div>` : ''}
    <p class="step-text" style="font-size:16px; margin-bottom: 20px; font-weight:500;">${cfg.question}</p>
    <div class="quiz-options" id="quizOpts">
      ${cfg.options.map((opt, i) => `
        <div class="quiz-opt ripple-host" data-idx="${i}">
          <div class="quiz-opt-letter">${String.fromCharCode(65+i)}</div>
          <div class="quiz-opt-text">${opt.html}</div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Pill nyawa dipindah ke elemen mengambang di luar area scroll, jadi tetap
  // kelihatan terus walau konten soal di-scroll ke bawah.
  const livesContainer = els.quizLivesFloat;
  function updateLives() {
    if(!livesContainer) return;
    livesContainer.classList.add('show');
    livesContainer.innerHTML = Array(3).fill(0).map((_, i) => `<div class="heart-icon ${i >= lives ? 'lost' : ''}">${svgIcon('heart')}</div>`).join('');
  }
  updateLives();

  // Sejajarin posisi pill nyawa PERSIS ke tinggi capsule "Kuis Ujian Akhir"
  // (bukan tebak-tebak jarak lewat CSS, tapi diukur langsung dari posisi
  // asli elemennya di layar, jadi presisi di device manapun).
  requestAnimationFrame(() => {
    const eyebrow = body.querySelector('.eyebrow-pill');
    const shell = livesContainer ? livesContainer.closest('.wizard-shell') : null;
    if(eyebrow && shell && livesContainer){
      const eyebrowRect = eyebrow.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      const floatRect = livesContainer.getBoundingClientRect();
      const eyebrowCenterY = eyebrowRect.top + eyebrowRect.height / 2;
      const topPx = (eyebrowCenterY - shellRect.top) - (floatRect.height / 2);
      livesContainer.style.top = topPx + 'px';
    }
  });

  if(cfg.setupVisual) {
    requestAnimationFrame(() => cfg.setupVisual(body.querySelector('#quizVisualBox')));
  }

  const opts = body.querySelectorAll('.quiz-opt');
  opts.forEach(opt => {
    opt.addEventListener('click', () => {
      if(window.quizIsAnswered) return;
      opts.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedIdx = parseInt(opt.dataset.idx);
      setFooter({ backVisible:false, primaryLabel:'Kunci & Cek Jawaban', primaryDisabled:false, onPrimary: checkAnswer });
    });
  });
  
  setFooter({ backVisible:false, primaryLabel:'Pilih Jawaban Dulu', primaryDisabled:true });
  
  function checkAnswer() {
     if(selectedIdx < 0) return;
     window.quizIsAnswered = true;
     const isCorrect = selectedIdx === cfg.correctIdx;
     const selectedEl = opts[selectedIdx];
     
     if (isCorrect) {
       selectedEl.classList.remove('selected');
       selectedEl.classList.add('correct');
       showQuizFeedback('success', 'Tepat Sekali!', cfg.explainCorrect, `<button class="btn btn-block ripple-host" style="background:#fff; color:var(--success-container); font-size:16px; font-weight:900;" onclick="window.qfBtnAction('next', ${cfg.level})">Klaim Pencapaian</button>`, { level: cfg.level });
     } else {
       selectedEl.classList.remove('selected');
       selectedEl.classList.add('wrong');
       lives--;
       updateLives();

       if (lives > 0) {
           showQuizFeedback('error', 'Masih Kurang Tepat', cfg.explainWrong + `<br><br><div style="display:inline-flex;align-items:center;gap:8px;">Sisa Nyawa: <b>${lives}</b> <span style="display:inline-flex;color:var(--error);width:20px;height:20px;">${svgIcon('heart')}</span></div>`, `<button class="btn btn-block ripple-host" style="background:#fff; color:var(--error-container); font-size:16px; font-weight:900;" onclick="window.qfBtnAction('retry')">Mengerti, Coba Lagi</button>`);
       } else {
           showQuizFeedback('fatal', 'Nyawa Habis!', 'Kamu telah kehabisan nyawa pada kuis ini. Apakah kamu ingin memantapkan materi dari awal, atau menyerah untuk saat ini?', `
             <button class="btn btn-primary btn-block ripple-host" style="font-size:16px; font-weight:900;" onclick="window.qfBtnAction('restart')">Ulangi Materi Level ${cfg.level}</button>
             <button class="btn btn-ghost btn-block ripple-host" style="font-size:16px; font-weight:900;" onclick="window.qfBtnAction('giveup')">Menyerah Saja</button>
           `);
       }
     }
  }
}

function renderWizardStep(isInitial = false){
  const count=STEP_COUNTS[wizard.level]; let html='';
  for(let i=0;i<count;i++) html += `<div class="step-dot ${i===wizard.step?'current':(i<wizard.step?'done':'')}"></div>`;
  els.wizardProgress.innerHTML = html;

  // Reset pill nyawa mengambang tiap pindah step â€” hanya renderQuizStep yang
  // akan mengisi & menampilkannya lagi kalau step ini memang kuis.
  if(els.quizLivesFloat){ els.quizLivesFloat.classList.remove('show'); els.quizLivesFloat.innerHTML = ''; }
  
  smoothUpdate(els.wizardBody, () => {
    // FIX LAG: matiin semua tween/timeline GSAP yang masih nempel di konten
    // step SEBELUMNYA sebelum kontennya dibuang. Tanpa ini, animasi infinite
    // (repeat:-1) di preview kuis dsb tetap jalan selamanya di background
    // walau elemennya udah gak ada di layar â€” makin sering pindah step,
    // makin numpuk, makin berat. Ini akar masalah "makin lama makin ngelag".
    gsap.killTweensOf(els.wizardBody.querySelectorAll('*'));
    els.wizardBody.innerHTML = '';
    const newContent = document.createElement('div');
    newContent.className = 'wizard-step-content';
    els.wizardBody.appendChild(newContent);
    
    const renders = [renderLevel1Step, renderLevel2Step, renderLevel3Step];
    renders[wizard.level-1](wizard.step, newContent);
    
    if (!isInitial) {
      const isForward = wizard.step > wizard.previousStep;
      gsap.fromTo(newContent, 
        {x: isForward ? 40 : -40, opacity: 0},
        {x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.1)'}
      );
    }
  });
}


function buildRoadStageHTML(carColor, wheelColor, isL2=false, includeGhost=false){
  const carBody = isL2 ? 'M4 22 L14 10 H44 L56 18 L64 22 L64 30 L4 30 Z' : 'M6 20 L16 8 H46 L58 20 L62 30 L6 30 Z';
  
  return `
    <div class="sim-wrapper">
      <div class="sim-hud">
        <div class="sim-timer" id="stgTimer">0.00 dtk</div>
      </div>
      <div class="sim-stage preview" id="roadStage">
        <div class="sky-deco"><div class="cloud" style="left:10%;top:15%;width:60px;height:25px;"></div><div class="cloud" style="left:65%;top:10%;width:80px;height:30px;"></div></div>
        
        <div class="parallax-bg layer-3" id="pxL3"></div>
        <div class="parallax-bg layer-2" id="pxL2"></div>
        
        <div class="finish-gate" id="stgGate"></div>
        <div class="finish-label" id="stgGateLabel"></div>
        
        <div class="road-container">
           <div class="road"></div>
        </div>
        <div class="track-scale" id="stgScale"></div>
        
        ${includeGhost ? `
          <div style="position:absolute; top:16px; left:16px; font-size:13px; font-weight:800; color:#fff; background:rgba(20,20,20,0.85); padding:6px 14px; border-radius:8px; z-index:10; box-shadow:0 4px 10px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1);" id="ghostLbl">Mobil GLB (Stabil)</div>
          <div class="car-shadow ghost" id="ghostShadow"></div>
          <div class="car ghost" id="ghostCar">
             <div class="car-svg-wrap">
              <svg viewBox="0 0 70 40" width="70" height="40">
                <path d="M6 20 L16 8 H46 L58 20 L62 30 L6 30 Z" fill="#8B9698" />
                <rect x="22" y="10" width="20" height="8" rx="2" fill="#151B1D" opacity="0.6"/>
                <circle class="wheel" cx="18" cy="30" r="8" fill="#151B1D" stroke="#8B9698" stroke-width="2"/>
                <circle class="wheel" cx="52" cy="30" r="8" fill="#151B1D" stroke="#8B9698" stroke-width="2"/>
              </svg>
             </div>
          </div>
        `:''}
        
        <div class="car-shadow" id="stgShadow"></div>
        <div class="car" id="stgCar">
          <div class="car-svg-wrap" id="stgCarWrap">
            <svg viewBox="0 0 70 40" width="70" height="40">
              <path d="${carBody}" fill="${carColor}"/>
              <rect x="24" y="12" width="18" height="6" rx="2" fill="#0E1416" opacity="0.8"/>
              <path d="M58 20 L64 22 L64 26 L56 26 Z" fill="#fff" opacity="0.7"/>
              <circle class="wheel" cx="18" cy="30" r="8" fill="var(--bg)" stroke="${wheelColor}" stroke-width="3"/>
              <circle class="wheel" cx="52" cy="30" r="8" fill="var(--bg)" stroke="${wheelColor}" stroke-width="3"/>
              <circle class="wheel" cx="18" cy="30" r="3" fill="${carColor}"/>
              <circle class="wheel" cx="52" cy="30" r="3" fill="${carColor}"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="hud-formula" id="stgHud"></div>
    </div>
  `;
}

function layoutRoadStage(S, trackMeters){
  const stageEl = document.getElementById('roadStage');
  const gate=document.getElementById('stgGate'), gl=document.getElementById('stgGateLabel'), sc=document.getElementById('stgScale');
  if(!stageEl) return ()=>0;
  function mToPx(m){ return 40 + (m/trackMeters) * (stageEl.clientWidth-80); }
  function layout(){
    const gx = mToPx(S); gate.style.left=gx+'px'; gl.style.left=gx+'px'; gl.textContent=S+' m'; sc.innerHTML='';
    const step = Math.max(10, Math.round(trackMeters/5/10)*10);
    for(let m=0; m<=trackMeters; m+=step) {
      const sp = document.createElement('span'); sp.textContent = m+'m'; sc.appendChild(sp);
    }
  }
  layout(); window.addEventListener('resize', layout, {passive:true}); return mToPx;
}

function buildAlgebraWidget(container, config) {
  let idx = 0;
  const total = config.states.length;
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; min-height:100%; width:100%;">
      <span class="eyebrow-pill">Jembatan Logika Matematis</span>
      <h2 style="text-align:center;">${config.title}</h2>
      <div id="algDots"></div>
      <div class="bridge-box">
        <div class="bridge-op empty" id="algOp"></div>
        <div class="alg-stage" id="algStage">
          <div id="algInner" style="position:absolute; left:50%; top:0; width:340px; height:100%; transform:translateX(-50%);"></div>
        </div>
      </div>
      <div style="flex:1; display:flex; flex-direction:column;">
        <p class="step-text" id="algDesc" style="text-align:center; flex:1; margin-bottom:20px; font-weight:500;">${config.descriptions[0]}</p>
        <button class="btn btn-primary btn-block ripple-host" id="algBtn" style="margin-top:auto; flex-shrink:0; font-size:18px;">Langkah Selanjutnya</button>
      </div>
    </div>
  `;
  const dotsEl = container.querySelector('#algDots');
  const opEl = container.querySelector('#algOp');
  const innerStage = container.querySelector('#algInner');
  const desc = container.querySelector('#algDesc');
  const btn = container.querySelector('#algBtn');

  const elsWidget = {};
  for(const t in config.terms){
    const el = document.createElement('div');
    el.innerHTML = config.terms[t];
    el.style.position = 'absolute';
    el.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.fontSize = '28px';
    el.style.fontFamily = 'var(--font-mono)';
    el.style.fontWeight = '900';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.whiteSpace = 'nowrap';
    innerStage.appendChild(el);
    elsWidget[t] = el;
  }

  function rowHtml(){
    const parts=[];
    const isMany = total > 5;
    const dCls = isMany ? 'stage-dot small' : 'stage-dot';
    const lCls = isMany ? 'stage-line short' : 'stage-line';
    for(let i=0; i<total; i++){
      if(i>0) parts.push(`<div class="${lCls}${i<=idx?' done':''}"></div>`);
      parts.push(`<div class="${dCls} ${i===idx?'current':(i<idx?'done':'')}">${i<idx?svgIcon('checkSm'):(i+1)}</div>`);
    }
    return `<div class="stage-tracker" style="flex-wrap:nowrap;">${parts.join('')}</div>`;
  }

  function renderState(i, animateOp) {
    const state = config.states[i];
    for(const t in state) {
      if(!elsWidget[t]) continue;
      const s = state[t];
      elsWidget[t].style.left = s.x + 'px';
      elsWidget[t].style.top = s.y + 'px';
      elsWidget[t].style.opacity = s.o !== undefined ? s.o : 1;
      if(s.w !== undefined) elsWidget[t].style.width = s.w + 'px';
      if(s.h !== undefined) elsWidget[t].style.height = s.h + 'px';
      elsWidget[t].style.color = s.color || 'inherit';
      elsWidget[t].style.transform = `translate(-50%, -50%) scale(${s.s !== undefined ? s.s : 1})`;
      if (s.color) { elsWidget[t].style.textShadow = `0 0 10px ${s.color}`; } else { elsWidget[t].style.textShadow = 'none'; }
    }
    dotsEl.innerHTML = rowHtml();
    
    const op = config.ops ? config.ops[i] : null;
    if(op){
      opEl.classList.remove('empty');
      opEl.innerHTML = `${svgIcon('swap')}<span>${op}</span>`;
      if(animateOp) gsap.fromTo(opEl, {scale:0.5, opacity:0, y:10}, {scale:1, opacity:1, y:0, duration:.5, ease:'back.out(2)'});
    } else {
      opEl.classList.add('empty'); opEl.innerHTML = '';
    }
    desc.innerHTML = config.descriptions[i];
    gsap.fromTo(desc, {opacity:0, scale:0.95}, {opacity:1, scale:1, duration:.4});
    btn.textContent = i === total - 1 ? 'Selesai Membedah Rumus' : 'Langkah Selanjutnya';
  }

  setTimeout(()=> renderState(0, false), 50);

  btn.onclick = () => {
    if(idx < total - 1){ 
      smoothUpdate(els.wizardBody, () => {
        idx++; renderState(idx, true); 
      });
    }
    else { wizardGoStep(1); }
  };
  function goBack(){
    if(idx > 0){ 
      smoothUpdate(els.wizardBody, () => {
        idx--; renderState(idx, true); 
      });
    }
    else { wizardGoStep(-1); }
  }
  setFooter({ backVisible:true, onBack:goBack, primaryHidden:true });
}

function renderOperationStep(body, cfg){
  let trackerHtml = '';
  if(cfg.stageTotal){
    const dots=[];
    for(let i=0;i<cfg.stageTotal;i++){
      if(i>0) dots.push(`<div class="stage-line${i<=cfg.stageIndex?' done':''}"></div>`);
      const cls = i===cfg.stageIndex?'current':(i<cfg.stageIndex?'done':'');
      dots.push(`<div class="stage-dot ${cls}">${i<cfg.stageIndex?svgIcon('checkSm'):(i+1)}</div>`);
    }
    trackerHtml = `<div class="stage-tracker" style="margin-bottom:24px;">${dots.join('')}</div>`;
  }
  
  body.innerHTML = `
    <span class="eyebrow-pill">${cfg.tag}</span>
    <h2>${cfg.title}</h2>
    ${trackerHtml}
    <div class="master-box">
      <div id="masterExpr">${tex(String.raw`${cfg.masterBefore}`)}</div>
    </div>
    <p class="step-text" id="opExplain" style="font-weight:500;">${cfg.explainHtml}</p>
    <button class="btn btn-primary btn-block ripple-host" id="opBtn" style="font-size:18px;">${cfg.computeLabel}</button>
  `;
  let computed = false;
  let lastResult = null;
  
  document.getElementById('opBtn').addEventListener('click', ()=>{
    smoothUpdate(els.wizardBody, () => {
      if(computed){
        computed = false; lastResult = null;
        const mbox = document.getElementById('masterExpr');
        mbox.innerHTML = tex(String.raw`${cfg.masterBefore}`);
        gsap.fromTo(mbox, {scale:1.1, rotationX: -10}, {scale:1, rotationX:0, duration:.6, ease:'back.out(2)'});
        const ex = document.getElementById('opExplain');
        ex.innerHTML = cfg.explainHtml;
        gsap.fromTo(ex, {opacity:0, y:-10}, {opacity:1, y:0, duration:.4});
        
        const btn = document.getElementById('opBtn');
        btn.textContent = cfg.computeLabel; btn.className = 'btn btn-primary btn-block ripple-host';
        setFooter({ backVisible:true, primaryLabel: cfg.nextLabel||'Lanjut', primaryDisabled:true });
      } else {
        const res = cfg.doCompute(); lastResult = res; computed = true;
        const mbox = document.getElementById('masterExpr');
        mbox.innerHTML = tex(String.raw`${cfg.masterAfter(res)}`);
        gsap.fromTo(mbox, {scale:1.15, rotationX: 10}, {scale:1, rotationX:0, duration:.6, ease:'elastic.out(1, 0.5)'});
        if(cfg.whyAfterHtml){
          const ex = document.getElementById('opExplain'); ex.innerHTML = cfg.whyAfterHtml(res);
          gsap.fromTo(ex, {opacity:0, y:10, scale:0.95}, {opacity:1, y:0, scale:1, duration:.5});
        }
        
        const btn = document.getElementById('opBtn');
        btn.textContent = 'Ulang Hitungan'; btn.className = 'btn btn-ghost btn-block ripple-host';
        setFooter({ backVisible:true, primaryLabel: cfg.nextLabel||'Lanjut', primaryDisabled:false, onPrimary:()=> cfg.onNext(lastResult) });
      }
    });
  });
  setFooter({ backVisible:true, primaryLabel: cfg.nextLabel||'Lanjut', primaryDisabled:true });
}

function renderResultStep(body, cfg){
  // Akurasi ditampilkan dibulatkan ke bilangan bulat (%). Supaya "Selisih Kesalahan"
  // tidak pernah menampilkan angka non-nol saat akurasi yang ditampilkan sudah 100%
  // (atau sebaliknya), kedua nilai ini diturunkan dari pembulatan akurasi yang sama.
  const accRounded = Math.round(cfg.accuracy);
  const diffDecimals = cfg.diffDecimals===undefined ? 1 : cfg.diffDecimals;
  const diffDisplay = accRounded>=100 ? (fmt(0,diffDecimals)+' '+cfg.diffUnit) : (fmt(cfg.diffValue,diffDecimals)+' '+cfg.diffUnit);
  body.innerHTML = `
    <div class="result-hero">
      <div class="icon-circle ${cfg.success?'win':'lose'}" id="resultIcon">${svgIcon(cfg.success?'check':'cross')}</div>
      <h2>${cfg.success ? 'Berhasil Tepat Sasaran!' : 'Belum Tepat Sasaran'}</h2>
    </div>
    <div class="result-row"><span>Tingkat Akurasi Hitungan</span><b style="color:${cfg.success?'var(--success)':'var(--error)'}; font-size:24px;">${accRounded}%</b></div>
    <div class="accuracy-bar-track"><div class="accuracy-bar-fill" id="accBar" style="width:0%; background: ${cfg.success?'var(--success)':'var(--error)'};"></div></div>
    <div style="margin-top:24px; background:var(--surface-c); border-radius:var(--r-l); padding:8px 20px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);">
      ${cfg.given.map(g=>`<div class="result-row"><span>${g[0]}</span><b>${g[1]}</b></div>`).join('')}
      <div class="result-row"><span>${cfg.computedLabel}</span><b style="color:var(--primary)">${cfg.computed}</b></div>
      <div class="result-row"><span>${cfg.targetLabel}</span><b style="color:var(--on-surface)">${cfg.target}</b></div>
      <div class="result-row" style="border:none; padding-bottom:8px;"><span>Selisih Kesalahan</span><b style="color:${cfg.success?'var(--success)':'var(--error)'}">${diffDisplay}</b></div>
    </div>
    <p class="step-text" style="margin-top:24px; font-weight: 600; text-align:center;">${cfg.success ? cfg.explainSuccess : cfg.explainFail}</p>
  `;
  requestAnimationFrame(()=>{
    gsap.fromTo('#resultIcon', {scale:0, rotationY:180}, {scale:1, rotationY:0, duration:.8, ease:'back.out(2)'});
    gsap.to('#accBar', {width:accRounded+'%', duration:1, ease:'power3.out', delay:.2});
  });
  
  const attempts = app.attempts[cfg.level];
  if(cfg.success){ 
    setFooter({ backVisible:false, primaryLabel:'Lanjut ke Kuis Ujian Akhir', onPrimary:()=>{ 
      wizardGoStep(1); 
    }}); 
  }
  else if(attempts >= 3){ setFooter({ backVisible:false, primaryLabel:'Lihat Jawaban Benar', onPrimary:()=>{ Swal.fire({ icon:'info', title:'Perhitungan yang Tepat', html:`${texi(String.raw`${cfg.varName} = ${cfg.correctAnswer} \text{ ${cfg.unit}}`)}`, background: '#1C2426', color:'#E3E3E6', confirmButtonColor: '#57E0E6' }); }}); }
  else { setFooter({ backVisible:false, primaryLabel:`Coba Lagi (Percobaan ${attempts+1} dari 3)`, onPrimary:()=>{ app.calcChain[cfg.level] = {}; navigate('simulasi', {level:cfg.level, step:cfg.retryStep}); }}); }
}
