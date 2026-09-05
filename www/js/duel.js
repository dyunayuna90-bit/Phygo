"use strict";

// =====================================================================
// DUEL.JS — Mode Duel 1v1 real-time (Tugas 4 & 5)
//
// KONSEP INTI (PENTING, biar gampang di-maintain nanti):
// Soal antara 2 pemain BEDA-BEDA — masing-masing HP generate soal sendiri
// pakai generator yang SAMA PERSIS dengan Survival (survGenerateQuestion,
// lihat survival.js). Yang disinkronkan real-time cuma 2 ANGKA per pemain:
// skor & sisa nyawa, lewat 1 dokumen Firestore (duels/{duelId}) yang
// didengarkan (onSnapshot) oleh KEDUA HP. Sengaja TIDAK ada Cloud Function
// (project ini murni client + Firestore) — semua logic termasuk
// matchmaking pakai Firestore transaction dari sisi client.
//
// STRUKTUR FIRESTORE:
//   matchmakingQueue/{uid}        -> antrian "cari lawan acak"
//   duels/{duelId}                -> { playerUids:[a,b], status, winnerUid }
//   duels/{duelId}/players/{uid}  -> { usernameDisplay, avatarId, rankValue,
//                                      score, lives, status, updatedAt }
//   users/{uid}/duelInvites/{fromUid} -> ajakan duel personal dari teman
//
// Poin per soal PERSIS sama seperti Survival (lihat survHitungPoin() di
// survival.js) — dan SETIAP kali dapat/kehilangan poin, langsung ditulis
// permanen ke users/{uid}.poinDuel + totalPoin lewat awardPoin('duel', delta)
// (lihat auth.js), SEKALIGUS ke duels/{duelId}/players/{uid}.score (buat
// disinkronkan real-time ke layar lawan & halaman hasil).
// =====================================================================

const DUEL_LIVES_START = SURV_LIVES_START; // 3, sama seperti Survival
const DUEL_RANK_WINDOW_NARROW = 1500; // toleransi selisih poinDuel di 10 detik pertama pencarian
const DUEL_WIDEN_AFTER_MS = 10000;    // setelah ini, kriteria diperlonggar jadi "siapa aja"
const DUEL_GIVEUP_AFTER_MS = 45000;   // kalau sampai segini belum ketemu, nyerah
const DUEL_POLL_INTERVAL_MS = 3000;

// ===== State global mode Duel — direset tiap mulai matchmaking/game baru =====
const duelMM = {
  searching: false, myUid: null, myProfile: null, startedAt: 0,
  unsubOwnQueue: null, pollTimer: null, giveupTimer: null, matched: false,
  triedUids: new Set(),
};
const duelState = {
  duelId: null, myUid: null, opponentUid: null, opponentInfo: null, myInfo: null,
  lives: DUEL_LIVES_START, score: 0, lastTopic: null, current: null,
  timeLeft: SURV_QUESTION_TIME, timerId: null, deadline: null, answering: false,
  questionStartedAt: null, finished: false,
  unsubOpponent: null, unsubDuelDoc: null,
};

function duelInitialPlayerDoc(profileLike){
  return {
    uid: profileLike.uid,
    usernameDisplay: profileLike.usernameDisplay || 'User',
    avatarId: profileLike.avatarId || 1,
    rankValue: profileLike.poinDuel || profileLike.rankValue || 0,
    score: 0,
    lives: DUEL_LIVES_START,
    status: 'playing',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
}

// =====================================================================
// KARTU ENTRY POINT DI HOME
// =====================================================================
function renderDuelCard(holder){
  if(!holder) return;
  holder.innerHTML = `
    <button class="duel-card ripple-host" id="duelCardBtn">
      <div class="duel-card-icon-box">${svgIcon('swords')}</div>
      <div class="duel-card-text">
        <span class="duel-card-eyebrow">1 vs 1 Real-time</span>
        <div class="duel-card-title">Mode Duel</div>
        <div class="duel-card-sub">Adu cepat jawab soal fisika lawan pemain lain</div>
      </div>
      <div class="duel-card-go">${svgIcon('chevronRight')}</div>
    </button>
  `;
  document.getElementById('duelCardBtn').addEventListener('click', ()=> navigate('duelmatch', {}));
}

// =====================================================================
// MATCHMAKING — cari lawan acak (Tugas 4 poin 2)
// =====================================================================
async function startDuelMatchmaking(){
  duelMM.searching = true;
  duelMM.matched = false;
  duelMM.startedAt = Date.now();
  duelMM.triedUids = new Set();

  document.getElementById('duelmatchStatusText').textContent = 'Mencari lawan setara...';
  document.getElementById('duelmatchMyAvatar').innerHTML = '';
  document.getElementById('duelmatchOppAvatar').innerHTML = '?';
  document.getElementById('duelmatchCancelBtn').disabled = false;
  document.getElementById('duelmatchCancelBtn').textContent = 'Batalkan';

  const me = fbAuth.currentUser;
  if(!me){ navigate('home', {}, true); return; }

  try{
    const profile = await getCurrentUserProfile();
    if(!profile){ navigate('home', {}, true); return; }
    duelMM.myUid = me.uid;
    duelMM.myProfile = profile;
    document.getElementById('duelmatchMyAvatar').innerHTML = avatarSvg(profile.avatarId);

    // Daftar ke antrian supaya orang lain juga bisa nemuin kita
    await db.collection('matchmakingQueue').doc(me.uid).set({
      uid: me.uid,
      usernameDisplay: profile.usernameDisplay || 'User',
      avatarId: profile.avatarId || 1,
      rankValue: profile.poinDuel || 0,
      status: 'waiting',
      matchId: null,
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Dengarkan dokumen antrian MILIK SENDIRI — kalau ada HP lain yang
    // berhasil "mencocokkan" kita lewat transaction mereka, statusnya
    // bakal berubah jadi 'matched' di sini.
    duelMM.unsubOwnQueue = db.collection('matchmakingQueue').doc(me.uid).onSnapshot((snap)=>{
      if(!snap.exists || duelMM.matched) return;
      const d = snap.data();
      if(d.status === 'matched' && d.matchId){
        duelFinalizeMatch(d.matchId);
      }
    }, (err)=> console.error('[Phygo] listener antrian duel gagal:', err));

    // Mulai coba mencocokkan dari sisi sendiri juga, berkala.
    duelMM.pollTimer = setInterval(duelAttemptMatchTick, DUEL_POLL_INTERVAL_MS);
    duelAttemptMatchTick();

    duelMM.giveupTimer = setTimeout(duelGiveUpSearching, DUEL_GIVEUP_AFTER_MS);
  } catch(e){
    console.error('[Phygo] Gagal mulai matchmaking duel:', e);
    Swal.fire({ icon:'error', title:'Gagal Memulai Pencarian', text: e.message, background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--error)' })
      .then(()=> navigate('home', {}, true));
  }
}

async function duelAttemptMatchTick(){
  if(duelMM.matched || !duelMM.searching) return;
  const elapsed = Date.now() - duelMM.startedAt;
  const widened = elapsed >= DUEL_WIDEN_AFTER_MS;
  document.getElementById('duelmatchStatusText').textContent = widened
    ? 'Masih mencari... memperluas kriteria lawan'
    : 'Mencari lawan setara...';

  try{
    const snap = await db.collection('matchmakingQueue').where('status', '==', 'waiting').limit(25).get();
    let candidates = snap.docs
      .filter(d => d.id !== duelMM.myUid && !duelMM.triedUids.has(d.id))
      .map(d => ({ id: d.id, data: d.data() }));

    if(!widened){
      const myRank = duelMM.myProfile.poinDuel || 0;
      candidates = candidates.filter(c => Math.abs((c.data.rankValue||0) - myRank) <= DUEL_RANK_WINDOW_NARROW);
    }
    // Lawan ter-dekat rank-nya dicoba duluan.
    const myRank = duelMM.myProfile.poinDuel || 0;
    candidates.sort((a,b)=> Math.abs((a.data.rankValue||0)-myRank) - Math.abs((b.data.rankValue||0)-myRank));

    for(const cand of candidates){
      if(duelMM.matched) return;
      const duelId = await duelTryMatchTransaction(cand.id);
      if(duelId){
        duelFinalizeMatch(duelId);
        return;
      }
      duelMM.triedUids.add(cand.id); // gagal (kemungkinan udah diambil HP lain), jangan dicoba lagi
    }
  } catch(e){
    console.error('[Phygo] Gagal cek antrian duel:', e);
  }
}

// Transaction: baca dokumen antrian kandidat, kalau masih 'waiting' bikin
// duel + 2 dokumen player sekaligus, lalu tandai antrian kandidat 'matched'.
// Kalau ternyata udah diambil HP lain (race condition), transaction ini
// otomatis gagal (dilempar dari dalam) dan kita coba kandidat berikutnya.
async function duelTryMatchTransaction(candidateUid){
  const duelRef = db.collection('duels').doc();
  try{
    await db.runTransaction(async (tx)=>{
      const candRef = db.collection('matchmakingQueue').doc(candidateUid);
      const candSnap = await tx.get(candRef);
      if(!candSnap.exists || candSnap.data().status !== 'waiting'){
        throw new Error('kandidat sudah diambil');
      }
      const candData = candSnap.data();
      tx.set(duelRef, {
        playerUids: [duelMM.myUid, candidateUid],
        status: 'starting',
        winnerUid: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        finishedAt: null,
      });
      tx.set(duelRef.collection('players').doc(duelMM.myUid), duelInitialPlayerDoc(Object.assign({uid: duelMM.myUid}, duelMM.myProfile)));
      tx.set(duelRef.collection('players').doc(candidateUid), duelInitialPlayerDoc(candData));
      tx.update(candRef, { status: 'matched', matchId: duelRef.id });
      tx.delete(db.collection('matchmakingQueue').doc(duelMM.myUid));
    });
    return duelRef.id;
  } catch(e){
    return null;
  }
}

function duelFinalizeMatch(duelId){
  if(duelMM.matched) return;
  duelMM.matched = true;
  duelMM.searching = false;
  duelStopMatchmakingTimers();
  navigate('duelvs', { duelId });
}

function duelStopMatchmakingTimers(){
  if(duelMM.pollTimer) clearInterval(duelMM.pollTimer);
  if(duelMM.giveupTimer) clearTimeout(duelMM.giveupTimer);
  if(duelMM.unsubOwnQueue) duelMM.unsubOwnQueue();
  duelMM.pollTimer = null; duelMM.giveupTimer = null; duelMM.unsubOwnQueue = null;
}

function cancelDuelMatchmaking(){
  if(duelMM.matched) return; // udah ketemu lawan, jangan dibatalin lagi
  duelMM.searching = false;
  duelStopMatchmakingTimers();
  if(duelMM.myUid){
    db.collection('matchmakingQueue').doc(duelMM.myUid).delete().catch(()=>{});
  }
}

function duelGiveUpSearching(){
  if(duelMM.matched) return;
  cancelDuelMatchmaking();
  Swal.fire({
    icon: 'info', title: 'Lawan Tidak Ditemukan',
    text: 'Gak ada lawan yang tersedia, coba lagi nanti.',
    background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--primary)',
  }).then(()=> navigate('home', {}, true));
}

// Tombol "Batalkan" manual di layar matchmaking
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('duelmatchCancelBtn');
  if(btn) btn.addEventListener('click', ()=>{
    cancelDuelMatchmaking();
    navigate('home', {}, true);
  });
});

// =====================================================================
// LAYAR VS + COUNTDOWN (Tugas 4 poin 3) — dipakai baik hasil matchmaking
// acak MAUPUN hasil menerima ajakan duel dari teman (Tugas 5).
// =====================================================================
async function renderDuelVsScreen(opts){
  const duelId = opts && opts.duelId;
  const me = fbAuth.currentUser;
  if(!duelId || !me){ navigate('home', {}, true); return; }

  try{
    const duelDoc = await db.collection('duels').doc(duelId).get();
    if(!duelDoc.exists){ navigate('home', {}, true); return; }
    const playerUids = duelDoc.data().playerUids || [];
    const opponentUid = playerUids.find(u => u !== me.uid);
    if(!opponentUid){ navigate('home', {}, true); return; }

    const [myDoc, oppDoc] = await Promise.all([
      db.collection('duels').doc(duelId).collection('players').doc(me.uid).get(),
      db.collection('duels').doc(duelId).collection('players').doc(opponentUid).get(),
    ]);
    const myInfo = myDoc.exists ? myDoc.data() : { usernameDisplay:'Kamu', avatarId:1, rankValue:0 };
    const oppInfo = oppDoc.exists ? oppDoc.data() : { usernameDisplay:'Lawan', avatarId:1, rankValue:0 };

    duelState.duelId = duelId;
    duelState.myUid = me.uid;
    duelState.opponentUid = opponentUid;
    duelState.myInfo = myInfo;
    duelState.opponentInfo = oppInfo;

    const myRank = getRankBadge(myInfo.rankValue || 0);
    const oppRank = getRankBadge(oppInfo.rankValue || 0);

    document.getElementById('duelvsMyAvatar').innerHTML = avatarSvg(myInfo.avatarId);
    document.getElementById('duelvsMyName').textContent = myInfo.usernameDisplay || 'Kamu';
    const myRankEl = document.getElementById('duelvsMyRank');
    myRankEl.textContent = myRank.rank; myRankEl.style.color = myRank.color;

    document.getElementById('duelvsOppAvatar').innerHTML = avatarSvg(oppInfo.avatarId);
    document.getElementById('duelvsOppName').textContent = oppInfo.usernameDisplay || 'Lawan';
    const oppRankEl = document.getElementById('duelvsOppRank');
    oppRankEl.textContent = oppRank.rank; oppRankEl.style.color = oppRank.color;

    // Animasi VS masuk
    gsap.fromTo('.duel-vs-player', {opacity:0, y:20}, {opacity:1, y:0, duration:0.5, stagger:0.12, ease:'back.out(1.4)'});
    gsap.fromTo('.duel-vs-mark', {scale:0, rotate:-15}, {scale:1, rotate:0, duration:0.5, delay:0.2, ease:'back.out(2.2)'});

    // Countdown 3-2-1-MULAI, TIDAK perlu presisi antar HP (cuma buat feel)
    setTimeout(()=>{
      const overlay = document.getElementById('duelvsCountdownOverlay');
      const numEl = document.getElementById('duelvsCountdownNum');
      overlay.classList.add('show');
      const seq = ['3','2','1','MULAI!'];
      let i = 0;
      numEl.textContent = seq[0];
      gsap.fromTo(numEl, {scale:0.5, opacity:0}, {scale:1, opacity:1, duration:0.3, ease:'back.out(2)'});
      const tick = setInterval(()=>{
        i++;
        if(i >= seq.length){
          clearInterval(tick);
          navigate('duelgame', { duelId }, true);
          return;
        }
        numEl.textContent = seq[i];
        gsap.fromTo(numEl, {scale:0.5, opacity:0}, {scale:1, opacity:1, duration:0.3, ease:'back.out(2)'});
      }, 700);
    }, 900);
  } catch(e){
    console.error('[Phygo] Gagal memuat layar VS duel:', e);
    navigate('home', {}, true);
  }
}

// =====================================================================
// GAMEPLAY DUEL (Tugas 4 poin 4) — generator & UI PERSIS Survival, cuma
// nambah HUD lawan yang disinkron real-time lewat onSnapshot.
// =====================================================================
function startDuelGame(opts){
  const duelId = (opts && opts.duelId) || duelState.duelId;
  duelState.duelId = duelId;
  duelState.lives = DUEL_LIVES_START;
  duelState.score = 0;
  duelState.lastTopic = null;
  duelState.answering = false;
  duelState.finished = false;
  clearInterval(duelState.timerId);

  document.getElementById('duelOppNameLabel').textContent = (duelState.opponentInfo && duelState.opponentInfo.usernameDisplay) || 'Lawan';
  renderDuelLives('duelMyLives', DUEL_LIVES_START);
  renderDuelLives('duelOppLives', DUEL_LIVES_START);
  document.getElementById('duelMyScoreVal').textContent = '0';
  document.getElementById('duelOppScoreVal').textContent = '0';
  document.getElementById('duelOpts').innerHTML = '';
  document.getElementById('duelQuestionText').textContent = '';

  duelTeardownListeners();

  // Dengarkan dokumen player LAWAN — buat update HUD skor/nyawa lawan realtime.
  duelState.unsubOpponent = db.collection('duels').doc(duelId).collection('players').doc(duelState.opponentUid)
    .onSnapshot((snap)=>{
      if(!snap.exists) return;
      const d = snap.data();
      document.getElementById('duelOppScoreVal').textContent = d.score || 0;
      renderDuelLives('duelOppLives', d.lives != null ? d.lives : DUEL_LIVES_START);
    }, (err)=> console.error('[Phygo] listener player lawan gagal:', err));

  // Dengarkan dokumen duel utama — buat tahu kapan game berakhir (baik
  // karena nyawa kita abis, MAUPUN karena nyawa lawan abis duluan).
  duelState.unsubDuelDoc = db.collection('duels').doc(duelId).onSnapshot((snap)=>{
    if(!snap.exists) return;
    const d = snap.data();
    if(d.status === 'finished' && !duelState.finished){
      duelState.finished = true;
      duelTeardownListeners();
      clearInterval(duelState.timerId);
      navigate('duelresult', { duelId, winnerUid: d.winnerUid }, true);
    }
  }, (err)=> console.error('[Phygo] listener dokumen duel gagal:', err));

  duelNextQuestion();
}

function duelTeardownListeners(){
  if(duelState.unsubOpponent) duelState.unsubOpponent();
  if(duelState.unsubDuelDoc) duelState.unsubDuelDoc();
  duelState.unsubOpponent = null; duelState.unsubDuelDoc = null;
}

function renderDuelLives(elId, livesLeft){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = Array(DUEL_LIVES_START).fill(0).map((_,i)=>`<div class="heart-icon ${i >= livesLeft ? 'lost' : ''}">${svgIcon('heart')}</div>`).join('');
}

function duelNextQuestion(){
  if(duelState.finished) return;
  duelState.answering = false;
  // Generator SAMA PERSIS dengan Survival (survGenerateQuestion, survival.js)
  const q = survGenerateQuestion(duelState.lastTopic);
  duelState.lastTopic = q.topic;
  duelState.current = q;

  const qText = document.getElementById('duelQuestionText');
  const opts = document.getElementById('duelOpts');
  qText.textContent = q.text;
  opts.classList.remove('frozen');
  opts.innerHTML = q.options.map((opt, i) => `
    <div class="quiz-opt ripple-host" data-idx="${i}">
      <div class="quiz-opt-letter">${String.fromCharCode(65+i)}</div>
      <div class="quiz-opt-text">${opt}</div>
    </div>
  `).join('');
  opts.querySelectorAll('.quiz-opt').forEach(el => {
    el.addEventListener('click', () => duelHandleAnswer(parseInt(el.dataset.idx)));
  });

  gsap.fromTo([qText, ...opts.querySelectorAll('.quiz-opt')], {opacity:0, y:14}, {opacity:1, y:0, duration:0.4, stagger:0.05, ease:'back.out(1.4)'});

  duelState.questionStartedAt = Date.now();
  duelStartTimer();
}

function duelStartTimer(){
  clearInterval(duelState.timerId);
  duelState.timeLeft = SURV_QUESTION_TIME;
  duelState.deadline = Date.now() + SURV_QUESTION_TIME * 1000;
  const timerEl = document.getElementById('duelTimerVal');
  const fillEl = document.getElementById('duelProgressFill');
  duelUpdateTimerUI(timerEl, fillEl);
  duelState.timerId = setInterval(()=> duelTick(timerEl, fillEl), 100);
}

function duelTick(timerEl, fillEl){
  if(duelState.deadline == null || duelState.finished) return;
  const remain = Math.max(0, survRound1((duelState.deadline - Date.now()) / 1000));
  duelState.timeLeft = remain;
  duelUpdateTimerUI(timerEl, fillEl);
  if(remain <= 0){
    clearInterval(duelState.timerId);
    duelHandleTimeout();
  }
}

function duelUpdateTimerUI(timerEl, fillEl){
  if(!timerEl || !fillEl) return;
  timerEl.textContent = duelState.timeLeft.toFixed(1);
  fillEl.style.width = (duelState.timeLeft / SURV_QUESTION_TIME * 100) + '%';
  const panic = duelState.timeLeft <= SURV_PANIC_AT;
  timerEl.classList.toggle('panic', panic);
  fillEl.classList.toggle('panic', panic);
}

function duelHandleTimeout(){
  if(duelState.answering || duelState.finished) return;
  duelState.answering = true;
  document.getElementById('duelOpts').classList.add('frozen');
  duelApplyPoin(false, SURV_QUESTION_TIME);
  duelLoseLife();
}

function duelHandleAnswer(idx){
  if(duelState.answering || duelState.finished) return;
  duelState.answering = true;
  clearInterval(duelState.timerId);

  const opts = document.getElementById('duelOpts');
  opts.classList.add('frozen');
  const optEl = opts.querySelector(`.quiz-opt[data-idx="${idx}"]`);
  const isCorrect = idx === duelState.current.correctIdx;
  if(optEl) optEl.classList.add(isCorrect ? 'correct' : 'wrong');

  const waktuJawab = (Date.now() - (duelState.questionStartedAt || Date.now())) / 1000;
  duelApplyPoin(isCorrect, waktuJawab);

  setTimeout(()=>{
    if(isCorrect){
      duelNextQuestion();
    } else {
      duelLoseLife();
    }
  }, SURV_ANSWER_DELAY);
}

// Nulis poin ke 2 tempat sekaligus: (1) permanen ke profil (poinDuel +
// totalPoin, lewat awardPoin di auth.js), (2) skor duel yang lagi jalan
// (buat disinkronkan real-time ke layar lawan).
function duelApplyPoin(isCorrect, waktuJawabDetik){
  const delta = survHitungPoin(isCorrect, waktuJawabDetik);
  duelState.score += delta;
  document.getElementById('duelMyScoreVal').textContent = duelState.score;
  awardPoin('duel', delta);
  if(duelState.duelId){
    db.collection('duels').doc(duelState.duelId).collection('players').doc(duelState.myUid)
      .update({ score: firebase.firestore.FieldValue.increment(delta), updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
      .catch((e)=> console.error('[Phygo] Gagal sync skor duel:', e));
  }
}

function duelLoseLife(){
  duelState.lives--;
  renderDuelLives('duelMyLives', duelState.lives);
  const myRef = db.collection('duels').doc(duelState.duelId).collection('players').doc(duelState.myUid);

  if(duelState.lives <= 0){
    // Nyawa sendiri abis duluan = KALAH, terlepas dari skor (SENGAJA, lihat
    // catatan Tugas 4 poin 5 — strategi "buru-buru menang sebelum kesalip"
    // memang dibiarkan, bukan bug).
    myRef.update({ lives: 0, status: 'finished', updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
    if(!duelState.finished){
      duelState.finished = true;
      db.collection('duels').doc(duelState.duelId).update({
        status: 'finished', winnerUid: duelState.opponentUid,
        finishedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch((e)=> console.error('[Phygo] Gagal menutup duel:', e));
      duelTeardownListeners();
      clearInterval(duelState.timerId);
      navigate('duelresult', { duelId: duelState.duelId, winnerUid: duelState.opponentUid }, true);
    }
  } else {
    myRef.update({ lives: duelState.lives, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
    duelNextQuestion();
  }
}

// =====================================================================
// HALAMAN HASIL (Tugas 4 poin 6)
// =====================================================================
async function renderDuelResultScreen(opts){
  const duelId = (opts && opts.duelId) || duelState.duelId;
  const me = fbAuth.currentUser;
  duelTeardownListeners();
  clearInterval(duelState.timerId);
  if(!duelId || !me){ navigate('home', {}, true); return; }

  try{
    const [myDoc, oppDoc, duelDoc] = await Promise.all([
      db.collection('duels').doc(duelId).collection('players').doc(me.uid).get(),
      db.collection('duels').doc(duelId).collection('players').doc(duelState.opponentUid || (opts && opts.opponentUid)).get(),
      db.collection('duels').doc(duelId).get(),
    ]);
    const myScore = myDoc.exists ? (myDoc.data().score || 0) : duelState.score;
    const oppScore = oppDoc.exists ? (oppDoc.data().score || 0) : 0;
    const oppName = oppDoc.exists ? (oppDoc.data().usernameDisplay || 'Lawan') : 'Lawan';
    const winnerUid = (opts && opts.winnerUid) || (duelDoc.exists ? duelDoc.data().winnerUid : null);
    const iWon = winnerUid === me.uid;

    document.getElementById('duelResultTitle').textContent = iWon ? 'Kamu Menang!' : 'Kamu Kalah';
    document.getElementById('duelResultMyScore').textContent = myScore;
    document.getElementById('duelResultOppScore').textContent = oppScore;
    document.getElementById('duelResultOppName').textContent = oppName;
    const iconEl = document.getElementById('duelResultIcon');
    iconEl.style.background = iWon ? 'var(--success-container)' : 'var(--error-container)';
    iconEl.innerHTML = `<span style="color:${iWon ? 'var(--success)' : 'var(--error)'};">${svgIcon(iWon ? 'trophy' : 'cross')}</span>`;

    gsap.fromTo('.duel-result-shell > *', {opacity:0, y:16}, {opacity:1, y:0, duration:0.45, stagger:0.08, ease:'back.out(1.4)'});
  } catch(e){
    console.error('[Phygo] Gagal memuat hasil duel:', e);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const retryBtn = document.getElementById('duelResultRetryBtn');
  const homeBtn = document.getElementById('duelResultHomeBtn');
  if(retryBtn) retryBtn.addEventListener('click', ()=> navigate('duelmatch', {}, true));
  if(homeBtn) homeBtn.addEventListener('click', ()=> navigate('home', {}, true));
});

// =====================================================================
// AJAKAN DUEL DARI SOSIAL (Tugas 5)
// =====================================================================
let duelInviteUnsub = null;
let duelInviteShownFrom = null; // uid pengirim undangan yang lagi ditampilkan di banner

function initDuelInviteListener(){
  const me = fbAuth.currentUser;
  if(!me) return;
  teardownDuelInviteListener();
  duelInviteUnsub = db.collection('users').doc(me.uid).collection('duelInvites')
    .where('status', '==', 'pending')
    .onSnapshot((snap)=>{
      // Jangan ganggu kalau lagi di tengah VS/gameplay Duel.
      const busyScreens = ['screen-duelvs', 'screen-duelgame'];
      const isBusy = busyScreens.some(id => document.getElementById(id) && document.getElementById(id).classList.contains('active'));
      if(isBusy) return;
      if(snap.empty){ hideDuelInviteBanner(); return; }
      // Tampilkan undangan TERBARU (yang lain menunggu giliran, cukup dibiarkan di data).
      let latest = null;
      snap.forEach(doc => {
        const d = doc.data();
        if(!latest || (d.createdAt && latest.createdAt && d.createdAt.toMillis() > latest.createdAt.toMillis())) latest = Object.assign({ inviteId: doc.id }, d);
      });
      if(latest) showDuelInviteBanner(latest);
    }, (err)=> console.error('[Phygo] listener undangan duel gagal:', err));
}

function teardownDuelInviteListener(){
  if(duelInviteUnsub) duelInviteUnsub();
  duelInviteUnsub = null;
  hideDuelInviteBanner();
}

function showDuelInviteBanner(invite){
  duelInviteShownFrom = invite.fromUid;
  document.getElementById('duelInviteAvatar').innerHTML = avatarSvg(invite.fromAvatarId);
  document.getElementById('duelInviteName').textContent = invite.fromUsername || 'User';
  const banner = document.getElementById('duelInviteBanner');
  banner.classList.add('show');
}

function hideDuelInviteBanner(){
  duelInviteShownFrom = null;
  const banner = document.getElementById('duelInviteBanner');
  if(banner) banner.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', ()=>{
  const acceptBtn = document.getElementById('duelInviteAcceptBtn');
  const declineBtn = document.getElementById('duelInviteDeclineBtn');
  if(acceptBtn) acceptBtn.addEventListener('click', async ()=>{
    if(!duelInviteShownFrom) return;
    const fromUid = duelInviteShownFrom;
    acceptBtn.disabled = true;
    try{ await acceptDuelInvite(fromUid); }
    catch(e){
      console.error('[Phygo] Gagal menerima ajakan duel:', e);
      Swal.fire({ icon:'error', title:'Gagal', text: e.message, background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--error)' });
    } finally { acceptBtn.disabled = false; }
  });
  if(declineBtn) declineBtn.addEventListener('click', async ()=>{
    if(!duelInviteShownFrom) return;
    const fromUid = duelInviteShownFrom;
    hideDuelInviteBanner();
    const me = fbAuth.currentUser;
    if(me) db.collection('users').doc(me.uid).collection('duelInvites').doc(fromUid).delete().catch(()=>{});
  });
});

// Dipanggil dari social.js (tombol "Ajak Duel" di modal Lihat Profil Teman)
async function sendDuelInvite(targetUid, targetInfo){
  const me = fbAuth.currentUser;
  if(!me) return;
  let myProfile;
  try{
    myProfile = await getCurrentUserProfile();
    await db.collection('users').doc(targetUid).collection('duelInvites').doc(me.uid).set({
      fromUid: me.uid,
      fromUsername: (myProfile && myProfile.usernameDisplay) || 'User',
      fromAvatarId: (myProfile && myProfile.avatarId) || 1,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch(e){
    console.error('[Phygo] Gagal mengirim ajakan duel:', e);
    Swal.fire({ icon:'error', title:'Gagal Mengirim Ajakan', text: e.message, background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--error)' });
    return;
  }

  if(typeof closeProfileViewModal === 'function') closeProfileViewModal(false);

  let settled = false;
  const unsub = db.collection('duels')
    .where('playerUids', 'array-contains', me.uid)
    .where('status', '==', 'starting')
    .onSnapshot((snap)=>{
      snap.forEach((doc)=>{
        if(settled) return;
        const d = doc.data();
        if((d.playerUids || []).includes(targetUid)){
          settled = true;
          unsub();
          Swal.close();
          navigate('duelvs', { duelId: doc.id });
        }
      });
    });

  await Swal.fire({
    icon: 'info',
    title: 'Menunggu Balasan...',
    text: `Undangan duel dikirim ke ${targetInfo && targetInfo.usernameDisplay ? targetInfo.usernameDisplay : 'teman kamu'}.`,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: 'Batalkan',
    allowOutsideClick: false,
    background: '#1C2426', color: '#E3E3E6', cancelButtonColor: 'var(--surface-c-high)',
  });

  if(!settled){
    unsub();
    db.collection('users').doc(targetUid).collection('duelInvites').doc(me.uid).delete().catch(()=>{});
  }
}

// Dipanggil dari banner ajakan duel (Terima) — bikin dokumen duel + 2
// dokumen player sekaligus (batch, ga perlu transaction krn ga ada
// pembacaan bersyarat kayak di matchmaking acak), lalu langsung ke VS.
async function acceptDuelInvite(fromUid){
  const me = fbAuth.currentUser;
  if(!me) throw new Error('Anda belum login.');
  const [myProfile, fromSnap] = await Promise.all([
    getCurrentUserProfile(),
    db.collection('users').doc(fromUid).get(),
  ]);
  if(!fromSnap.exists) throw new Error('Profil pengundang tidak ditemukan.');
  const fromProfile = Object.assign({ uid: fromUid }, fromSnap.data());

  const duelRef = db.collection('duels').doc();
  await db.runTransaction(async (tx)=>{
    tx.set(duelRef, {
      playerUids: [fromUid, me.uid],
      status: 'starting',
      winnerUid: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      finishedAt: null,
    });
    tx.set(duelRef.collection('players').doc(me.uid), duelInitialPlayerDoc(Object.assign({uid: me.uid}, myProfile)));
    tx.set(duelRef.collection('players').doc(fromUid), duelInitialPlayerDoc(fromProfile));
  });

  hideDuelInviteBanner();
  db.collection('users').doc(me.uid).collection('duelInvites').doc(fromUid).delete().catch(()=>{});
  navigate('duelvs', { duelId: duelRef.id });
}
