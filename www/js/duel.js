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
  // Nilai TERBARU milik lawan yang diketahui dari onSnapshot (dipakai buat
  // menentukan pemenang & buat tahu kapan lawan JUGA sudah kehabisan nyawa
  // — lihat Tugas 6: "duel wajib diselesaikan sampai kedua nyawa habis").
  oppLives: DUEL_LIVES_START, oppScore: 0,
  // true begitu nyawa SENDIRI habis duluan (masuk mode nunggu/nonton lawan).
  iAmDead: false,
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

// Transaction LANGKAH 1: baca dokumen antrian kandidat, kalau masih
// 'waiting' bikin dokumen duel (parent) + tandai antrian kandidat 'matched'.
// Kalau ternyata udah diambil HP lain (race condition), transaction ini
// otomatis gagal (dilempar dari dalam) dan kita coba kandidat berikutnya.
//
// PENTING: dokumen players/ SENGAJA TIDAK dibuat di transaction yang sama!
// Firestore security rules TIDAK BISA get() dokumen yang baru ditulis DI
// DALAM transaction yang sama (rules melihat state SEBELUM transaction
// commit) — jadi rule create players/{uid} yang butuh cek
// get(duels/{duelId}).data.playerUids bakal selalu gagal kalau dibarengin.
// Makanya players/ dibuat di LANGKAH 2, setelah dokumen duel dipastikan
// sudah benar-benar ke-commit.
async function duelTryMatchTransaction(candidateUid){
  const duelRef = db.collection('duels').doc();
  let candData = null;
  try{
    await db.runTransaction(async (tx)=>{
      const candRef = db.collection('matchmakingQueue').doc(candidateUid);
      const candSnap = await tx.get(candRef);
      if(!candSnap.exists || candSnap.data().status !== 'waiting'){
        throw new Error('kandidat sudah diambil');
      }
      candData = candSnap.data();
      tx.set(duelRef, {
        playerUids: [duelMM.myUid, candidateUid],
        status: 'starting',
        winnerUid: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        finishedAt: null,
      });
      tx.update(candRef, { status: 'matched', matchId: duelRef.id });
      tx.delete(db.collection('matchmakingQueue').doc(duelMM.myUid));
    });
  } catch(e){
    return null;
  }

  // LANGKAH 2: dokumen duel udah pasti ke-commit di titik ini — baru
  // sekarang bikin 2 dokumen player-nya.
  try{
    await Promise.all([
      duelRef.collection('players').doc(duelMM.myUid).set(duelInitialPlayerDoc(Object.assign({uid: duelMM.myUid}, duelMM.myProfile))),
      duelRef.collection('players').doc(candidateUid).set(duelInitialPlayerDoc(candData)),
    ]);
  } catch(e){
    console.error('[Phygo] Gagal membuat dokumen player duel:', e);
    return null;
  }
  return duelRef.id;
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
  duelState.oppLives = DUEL_LIVES_START;
  duelState.oppScore = 0;
  duelState.iAmDead = false;
  clearInterval(duelState.timerId);

  document.getElementById('duelOppNameLabel').textContent = (duelState.opponentInfo && duelState.opponentInfo.usernameDisplay) || 'Lawan';
  document.getElementById('duelWaitingOppName').textContent = (duelState.opponentInfo && duelState.opponentInfo.usernameDisplay) || 'lawan';
  hideDuelWaitingOverlay();
  renderDuelLives('duelMyLives', DUEL_LIVES_START);
  renderDuelLives('duelOppLives', DUEL_LIVES_START);
  document.getElementById('duelMyScoreVal').textContent = '0';
  document.getElementById('duelOppScoreVal').textContent = '0';
  document.getElementById('duelOpts').innerHTML = '';
  document.getElementById('duelQuestionText').textContent = '';

  duelTeardownListeners();

  // Dengarkan dokumen player LAWAN — buat update HUD skor/nyawa lawan
  // realtime, DAN buat tahu kapan lawan JUGA kehabisan nyawa (dipakai buat
  // finalisasi duel kalau kita sendiri sudah lebih dulu mati & lagi
  // nunggu/nonton, lihat Tugas 6).
  duelState.unsubOpponent = db.collection('duels').doc(duelId).collection('players').doc(duelState.opponentUid)
    .onSnapshot((snap)=>{
      if(!snap.exists) return;
      const d = snap.data();
      duelState.oppScore = d.score || 0;
      duelState.oppLives = d.lives != null ? d.lives : DUEL_LIVES_START;
      document.getElementById('duelOppScoreVal').textContent = duelState.oppScore;
      renderDuelLives('duelOppLives', duelState.oppLives);

      // Kita sudah lebih dulu mati & lagi nunggu — begitu lawan JUGA
      // kehabisan nyawa, duel resmi selesai, finalisasi (tentukan
      // pemenang lewat skor akhir).
      if(duelState.iAmDead && duelState.oppLives <= 0 && !duelState.finished){
        duelFinalizeDuel();
      }
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

// Nyawa Duel: DULU 3 heart-icon berjejer (dempet/tumpang tindih di layar
// sempit) — SEKARANG cuma 1 heart-icon + label "×N" (Tugas 4).
function renderDuelLives(elId, livesLeft){
  const el = document.getElementById(elId);
  if(!el) return;
  const isLost = livesLeft <= 0;
  el.innerHTML = `<div class="heart-icon ${isLost ? 'lost' : ''}">${svgIcon('heart')}</div><span class="duel-hud-lives-count ${isLost ? 'lost' : ''}">×${Math.max(livesLeft, 0)}</span>`;
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
// (buat disinkronkan real-time ke layar lawan & halaman hasil).
// Sejak jawaban salah/waktu habis bernilai 0 (bukan minus lagi, lihat
// survHitungPoin di survival.js), skor duel TIDAK PERNAH turun — jadi
// "0 sudah paling mentok paling kecil" otomatis benar dengan sendirinya.
function duelApplyPoin(isCorrect, waktuJawabDetik){
  const delta = survHitungPoin(isCorrect, waktuJawabDetik);
  duelState.score += delta;
  document.getElementById('duelMyScoreVal').textContent = duelState.score;
  if(delta !== 0) spawnScorePopup('duelMyScoreVal', delta);
  awardPoin('duel', delta);
  if(duelState.duelId){
    db.collection('duels').doc(duelState.duelId).collection('players').doc(duelState.myUid)
      .update({ score: firebase.firestore.FieldValue.increment(delta), updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
      .catch((e)=> console.error('[Phygo] Gagal sync skor duel:', e));
  }
}

// =====================================================================
// Tugas 6: duel sekarang WAJIB berlanjut sampai KEDUA pemain kehabisan
// nyawa (bukan langsung selesai begitu SALAH SATU pemain mati). Kalau
// nyawa sendiri habis duluan sementara lawan masih hidup, kita MASUK MODE
// NUNGGU/NONTON (overlay di atas layar gameplay, HUD lawan tetap update
// realtime) sampai lawan juga kehabisan nyawa (dicek di listener lawan,
// lihat startDuelGame) atau kita pencet "Menyerah". Pemenang ditentukan
// dari SKOR AKHIR begitu keduanya sudah mati (lihat duelFinalizeDuel).
// =====================================================================
function duelLoseLife(){
  duelState.lives--;
  renderDuelLives('duelMyLives', duelState.lives);
  const myRef = db.collection('duels').doc(duelState.duelId).collection('players').doc(duelState.myUid);

  if(duelState.lives <= 0){
    duelState.iAmDead = true;
    clearInterval(duelState.timerId);
    myRef.update({ lives: 0, status: 'dead', updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});

    if(duelState.oppLives <= 0){
      // Lawan sudah lebih dulu mati (kita mati belakangan) — duel resmi
      // selesai sekarang, tentukan pemenang lewat skor akhir.
      duelFinalizeDuel();
    } else {
      // Lawan masih hidup — jangan langsung ke halaman hasil, tampilkan
      // overlay nunggu di atas layar gameplay (HUD lawan tetap kelihatan).
      showDuelWaitingOverlay();
    }
  } else {
    myRef.update({ lives: duelState.lives, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
    duelNextQuestion();
  }
}

function showDuelWaitingOverlay(){
  const overlay = document.getElementById('duelWaitingOverlay');
  if(overlay) overlay.classList.add('show');
}
function hideDuelWaitingOverlay(){
  const overlay = document.getElementById('duelWaitingOverlay');
  if(overlay) overlay.classList.remove('show');
}

// Menentukan pemenang dari skor akhir (dipanggil begitu KEDUA pemain
// dipastikan sudah kehabisan nyawa). Dibungkus transaction supaya aman
// kalau kedua HP kebetulan sama-sama mencoba finalisasi hampir bersamaan
// (siapa pun yang commit duluan menang, sisanya cukup skip — client yang
// gak sempat nulis tetap kebawa pindah layar lewat listener dokumen duel
// yang sudah aktif dari awal, lihat startDuelGame & duelTeardownListeners).
async function duelFinalizeDuel(){
  if(duelState.finished || !duelState.duelId) return;
  const duelRef = db.collection('duels').doc(duelState.duelId);
  try{
    await db.runTransaction(async (tx)=>{
      const snap = await tx.get(duelRef);
      if(!snap.exists || snap.data().status === 'finished') return;
      const myScore = duelState.score;
      const oppScore = duelState.oppScore || 0;
      let winnerUid = null;
      if(myScore > oppScore) winnerUid = duelState.myUid;
      else if(oppScore > myScore) winnerUid = duelState.opponentUid;
      tx.update(duelRef, { status: 'finished', winnerUid, finishedAt: firebase.firestore.FieldValue.serverTimestamp() });
    });
  } catch(e){
    console.error('[Phygo] Gagal finalisasi duel:', e);
  }
}

// Tombol "Menyerah" di overlay nunggu — langsung selesaikan duel dengan
// lawan sebagai pemenang, gak perlu nunggu lawan kehabisan nyawa juga.
async function duelSurrenderFromWaiting(){
  if(duelState.finished || !duelState.duelId) return;
  const duelRef = db.collection('duels').doc(duelState.duelId);
  try{
    await db.runTransaction(async (tx)=>{
      const snap = await tx.get(duelRef);
      if(!snap.exists || snap.data().status === 'finished') return;
      tx.update(duelRef, { status: 'finished', winnerUid: duelState.opponentUid, finishedAt: firebase.firestore.FieldValue.serverTimestamp() });
    });
    db.collection('duels').doc(duelState.duelId).collection('players').doc(duelState.myUid)
      .update({ status: 'surrendered', updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
  } catch(e){
    console.error('[Phygo] Gagal menyerah dari duel:', e);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const surrenderBtn = document.getElementById('duelWaitingSurrenderBtn');
  if(surrenderBtn){
    surrenderBtn.addEventListener('click', ()=>{
      surrenderBtn.disabled = true;
      duelSurrenderFromWaiting().finally(()=>{ surrenderBtn.disabled = false; });
    });
  }
});

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
    // winnerUid null = seri (skor akhir sama persis setelah kedua nyawa habis).
    let winnerUid = null;
    if(opts && Object.prototype.hasOwnProperty.call(opts, 'winnerUid')){
      winnerUid = opts.winnerUid;
    } else if(duelDoc.exists){
      winnerUid = duelDoc.data().winnerUid;
    }
    const isDraw = !winnerUid;
    const iWon = winnerUid === me.uid;

    document.getElementById('duelResultTitle').textContent = isDraw ? 'Hasil Seri!' : (iWon ? 'Kamu Menang!' : 'Kamu Kalah');
    document.getElementById('duelResultMyScore').textContent = myScore;
    document.getElementById('duelResultOppScore').textContent = oppScore;
    document.getElementById('duelResultOppName').textContent = oppName;
    const iconEl = document.getElementById('duelResultIcon');
    iconEl.style.background = isDraw ? 'var(--surface-c-high)' : (iWon ? 'var(--success-container)' : 'var(--error-container)');
    iconEl.innerHTML = `<span style="color:${isDraw ? 'var(--on-surface-var)' : (iWon ? 'var(--success)' : 'var(--error)')};">${svgIcon(isDraw ? 'swords' : (iWon ? 'trophy' : 'cross'))}</span>`;

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
  const phygoLog = window.phygoLog || ((tag, msg)=> console.log(`[${tag}] ${msg}`));
  phygoLog('DUEL_INVITE_LISTEN', 'Init listener');
  
  teardownDuelInviteListener();
  duelInviteUnsub = db.collection('users').doc(me.uid).collection('duelInvites')
    .where('status', '==', 'pending')
    .onSnapshot((snap)=>{
      phygoLog('DUEL_INVITE_LISTEN', `Received: ${snap.size} invites`);
      // Jangan ganggu kalau lagi di tengah VS/gameplay Duel.
      const busyScreens = ['screen-duelvs', 'screen-duelgame'];
      const isBusy = busyScreens.some(id => document.getElementById(id) && document.getElementById(id).classList.contains('active'));
      if(isBusy) { phygoLog('DUEL_INVITE_LISTEN', 'Busy'); return; }
      if(snap.empty){ phygoLog('DUEL_INVITE_LISTEN', 'No invites'); hideDuelInviteBanner(); return; }
      // Tampilkan undangan TERBARU
      let latest = null;
      snap.forEach(doc => {
        const d = doc.data();
        if(!latest || (d.createdAt && latest.createdAt && d.createdAt.toMillis() > latest.createdAt.toMillis())) latest = Object.assign({ inviteId: doc.id }, d);
      });
      if(latest) { phygoLog('DUEL_INVITE_LISTEN', `Show: ${latest.fromUsername}`); showDuelInviteBanner(latest); }
    }, (err)=> { phygoLog('DUEL_INVITE_LISTEN', `ERROR: ${err.message}`); console.error('[Phygo] listener undangan duel gagal:', err); });
}

function teardownDuelInviteListener(){
  if(duelInviteUnsub) duelInviteUnsub();
  duelInviteUnsub = null;
  hideDuelInviteBanner();
}

function showDuelInviteBanner(invite){
  const phygoLog = window.phygoLog || ((tag, msg)=> console.log(`[${tag}] ${msg}`));
  duelInviteShownFrom = invite.fromUid;
  // PENTING: avatarSvg() dibungkus try/catch sendiri — kalau ini throw
  // (misal fromAvatarId gak cocok format yang diharapkan avatars.js),
  // dulu itu bikin SELURUH fungsi berhenti SEBELUM sempat nge-show
  // banner-nya, dan errornya sering ke-telan diam-diam oleh callback
  // onSnapshot Firestore (gak nyampe ke window.onerror). Sekarang avatar
  // yang gagal di-skip, banner-nya tetap WAJIB muncul.
  try{
    document.getElementById('duelInviteAvatar').innerHTML = avatarSvg(invite.fromAvatarId);
  } catch(e){
    phygoLog('DUEL_INVITE_LISTEN', `avatarSvg GAGAL: ${e.message} (fromAvatarId=${invite.fromAvatarId})`);
  }
  document.getElementById('duelInviteName').textContent = invite.fromUsername || 'User';
  const banner = document.getElementById('duelInviteBanner');
  banner.classList.add('show');
  phygoLog('DUEL_INVITE_LISTEN', 'Banner .show ditambahkan');
  // ===== DIAGNOSTIK SEMENTARA — biar ketahuan pasti kenapa gak keliatan
  // secara visual walau class .show udah nempel. Aman dihapus lagi nanti
  // kalau bannernya udah kebukti muncul normal. =====
  try{
    const rect = banner.getBoundingClientRect();
    const cs = getComputedStyle(banner);
    phygoLog('DUEL_INVITE_LISTEN', `DIAG rect: top=${rect.top.toFixed(0)} left=${rect.left.toFixed(0)} w=${rect.width.toFixed(0)} h=${rect.height.toFixed(0)}`);
    phygoLog('DUEL_INVITE_LISTEN', `DIAG style: display=${cs.display} visibility=${cs.visibility} opacity=${cs.opacity} zIndex=${cs.zIndex} transform=${cs.transform}`);
  } catch(e){
    phygoLog('DUEL_INVITE_LISTEN', `DIAG gagal: ${e.message}`);
  }
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
    if(me){
      db.collection('users').doc(me.uid).collection('duelInvites').doc(fromUid).delete().catch(()=>{});
      db.collection('duelInviteLinks').doc(`${fromUid}_${me.uid}`).set({ status: 'declined' }, { merge: true }).catch(()=>{});
    }
  });
});

// Dipanggil dari social.js (tombol "Ajak Duel" di modal Lihat Profil Teman)
//
// CATATAN DESAIN: pengirim perlu tahu kapan penerima menerima ajakannya.
// Awalnya saya pakai query `duels` (array-contains + where status) buat
// mendeteksi ini, TAPI kombinasi array-contains + where field lain itu
// BUTUH composite index yang belum tentu ke-generate otomatis di project
// kamu — jadi query-nya gagal diam-diam dan pengirim stuck selamanya di
// "Menunggu Balasan...". Sekarang diganti pakai 1 dokumen sinyal langsung
// (duelInviteLinks/{fromUid}_{targetUid}) yang di-dengarkan by ID (bukan
// query), jadi TIDAK butuh index sama sekali.
async function sendDuelInvite(targetUid, targetInfo){
  const me = fbAuth.currentUser;
  if(!me) return;
  const phygoLog = window.phygoLog || ((tag, msg)=> console.log(`[${tag}] ${msg}`));

  phygoLog('DUEL_INVITE', `START: target=${targetInfo?.usernameDisplay||'unknown'}`);

  // Tugas 6: kalau target lagi ada di antrian matchmaking acak (status
  // 'waiting'), tolak undangan di sisi pengirim — jangan sampai target
  // kena 2 alur duel sekaligus (matchmaking acak + ajakan personal).
  try{
    const targetQueueSnap = await db.collection('matchmakingQueue').doc(targetUid).get();
    if(targetQueueSnap.exists && targetQueueSnap.data().status === 'waiting'){
      phygoLog('DUEL_INVITE', 'BLOCKED: target sedang matchmaking');
      Swal.fire({
        icon: 'info', title: 'Sedang Mencari Lawan',
        text: `${targetInfo && targetInfo.usernameDisplay ? targetInfo.usernameDisplay : 'User ini'} lagi mencari lawan lewat matchmaking, gak bisa diajak duel sekarang. Coba lagi nanti.`,
        background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--primary)',
      });
      return;
    }
  } catch(e){
    phygoLog('DUEL_INVITE', `Gagal cek status matchmaking target: ${e.message}`);
    // Kalau pengecekan gagal (misal offline), tetap lanjut kirim undangan
    // seperti biasa — jangan blokir user cuma karena 1 read gagal.
  }

  const linkRef = db.collection('duelInviteLinks').doc(`${me.uid}_${targetUid}`);
  let myProfile;
  try{
    myProfile = await getCurrentUserProfile();
    phygoLog('DUEL_INVITE', `Profile loaded: ${myProfile?.usernameDisplay}`);
    
    phygoLog('DUEL_INVITE', 'Writing invite...');
    await db.collection('users').doc(targetUid).collection('duelInvites').doc(me.uid).set({
      fromUid: me.uid,
      fromUsername: (myProfile && myProfile.usernameDisplay) || 'User',
      fromAvatarId: (myProfile && myProfile.avatarId) || 1,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    phygoLog('DUEL_INVITE', 'Invite written OK');
    
    phygoLog('DUEL_INVITE', 'Writing link...');
    await linkRef.set({
      fromUid: me.uid, targetUid, status: 'pending', duelId: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    phygoLog('DUEL_INVITE', 'SUCCESS - terkirim');
    
  } catch(e){
    phygoLog('DUEL_INVITE', `ERROR: ${e.code} - ${e.message}`);
    console.error('[Phygo] Gagal mengirim ajakan duel:', e);
    Swal.fire({ icon:'error', title:'Gagal Mengirim Ajakan', text: e.message, background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--error)' });
    return;
  }

  if(typeof closeProfileViewModal === 'function') closeProfileViewModal(false);

  let settled = false;
  const unsub = linkRef.onSnapshot((snap)=>{
    if(!snap.exists || settled) return;
    const d = snap.data();
    phygoLog('DUEL_INVITE', `Link status: ${d.status}`);
    if(d.status === 'accepted' && d.duelId){
      settled = true;
      unsub();
      Swal.close();
      navigate('duelvs', { duelId: d.duelId });
    } else if(d.status === 'declined'){
      settled = true;
      unsub();
      Swal.close();
      Swal.fire({ icon:'info', title:'Ajakan Ditolak', background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--primary)', timer:1800, showConfirmButton:false });
    }
  }, (err)=> {
    phygoLog('DUEL_INVITE', `Listener error: ${err.code}`);
    console.error('[Phygo] listener status ajakan duel gagal:', err);
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
    phygoLog('DUEL_INVITE', 'Cancelled');
    unsub();
    db.collection('users').doc(targetUid).collection('duelInvites').doc(me.uid).delete().catch(()=>{});
    linkRef.delete().catch(()=>{});
  }
}

// Dipanggil dari banner ajakan duel (Terima) — bikin dokumen duel dulu
// (LANGKAH 1), BARU bikin 2 dokumen player setelah dokumen duel-nya
// dipastikan ke-commit (LANGKAH 2) — alasan yang sama seperti di
// duelTryMatchTransaction di atas (get() dalam rules gak bisa lihat
// tulisan transaction/operasi yang sama). Ga perlu transaction sama
// sekali di sini karena gak ada pembacaan bersyarat (beda dari matchmaking
// acak yang harus adu cepat rebutan kandidat).
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
  await duelRef.set({
    playerUids: [fromUid, me.uid],
    status: 'starting',
    winnerUid: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    finishedAt: null,
  });
  await Promise.all([
    duelRef.collection('players').doc(me.uid).set(duelInitialPlayerDoc(Object.assign({uid: me.uid}, myProfile))),
    duelRef.collection('players').doc(fromUid).set(duelInitialPlayerDoc(fromProfile)),
  ]);

  // Kasih tahu pengirim (yang lagi nunggu di layar "Menunggu Balasan...")
  // lewat dokumen sinyal — pakai set({merge:true}) buat jaga-jaga kalau
  // dokumennya belum sempat dibuat pengirim (harusnya udah ada duluan).
  db.collection('duelInviteLinks').doc(`${fromUid}_${me.uid}`)
    .set({ status: 'accepted', duelId: duelRef.id }, { merge: true }).catch(()=>{});

  hideDuelInviteBanner();
  db.collection('users').doc(me.uid).collection('duelInvites').doc(fromUid).delete().catch(()=>{});
  navigate('duelvs', { duelId: duelRef.id });
}
