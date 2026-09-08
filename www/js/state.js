"use strict";

const els = {
  materiEyebrow: document.getElementById('materiEyebrow'),
  materiTitle: document.getElementById('materiTitle'),
  materiBody: document.getElementById('materiBody'),
  materiFormula: document.getElementById('materiFormula'),
  materiFormulaNote: document.getElementById('materiFormulaNote'),
  btnKeSimulasi: document.getElementById('btnKeSimulasi'),
  wizardProgress: document.getElementById('wizardProgress'),
  wizardBody: document.getElementById('wizardBody'),
  wizBack: document.getElementById('wizBack'),
  wizExit: document.getElementById('wizExit'),
  wizPrimary: document.getElementById('wizPrimary'),
  quizLivesFloat: document.getElementById('quizLivesFloat'),
};

// Elemen-elemen khusus halaman "Sejarah" (wizard arsip) — dipisah dari `els`
// supaya state wizard simulasi & wizard sejarah tidak pernah tercampur.
const hwEls = {
  progress: document.getElementById('hwProgress'),
  body: document.getElementById('hwBody'),
  back: document.getElementById('hwBack'),
  exit: document.getElementById('hwExit'),
  primary: document.getElementById('hwPrimary'),
};

// =====================================================================
// FIX "PROGRES IKUT NYANGKUT DI DEVICE WALAU GANTI AKUN": completed,
// lastProgress, dan streak dulu diisi langsung dari localStorage di sini
// (nempel per-DEVICE, bukan per-AKUN) — jadi kalau logout lalu login pakai
// akun lain di HP yang sama, progres akun SEBELUMNYA ikut kebawa salah ke
// akun baru. Sekarang semuanya MULAI KOSONG di sini, dan baru diisi dari
// Firestore (field completedLevels/lastProgress/streakCount/streakLastDate
// di dokumen users/{uid}) lewat hydrateAppProgressFromFirestore() di
// auth.js — dipanggil sekali tiap dashboard dibuka setelah login (lihat
// goToDashboardAfterAuth di auth-ui.js), jadi datanya selalu sesuai akun
// yang SEDANG login saat itu, bukan sisa akun sebelumnya.
const app = {
  completed: new Set(),
  survivalHighScore: 0,
  lastProgress: null,
  streak: { count: 0, lastDate: null },
  justUnlockedLevel: null,
  // Tab dashboard terakhir (home/level/history/settings) yang aktif — dipakai
  // router.js & screens.js supaya keluar dari mode belajar balik ke tab asal.
  activeTab: 'home',
  params: {}, attempts: {1:0,2:0,3:0}, calc: {}, calcChain: {1:{},2:{},3:{}}, locked: {}, running: false,
  // Urutan tumpukan kartu arsip di halaman Sejarah (index 0 = kartu paling
  // depan). `swipeCount` dipakai untuk menentukan kapan tombol "Mundur" tampil.
  history: {
    order: (typeof HISTORY_LEVELS !== 'undefined') ? Object.keys(HISTORY_LEVELS).map(Number).sort((a,b)=>a-b) : [],
    swipeCount: 0
  },
};
const wizard = { level:1, step:0, previousStep:0 };
const historyWizard = { level:1, step:0, previousStep:0 };

// ===== "Notifikasi Aktivitas" — mengingat posisi wizard/simulasi terakhir
// milik level yang BELUM diselesaikan. Sekarang disimpan murni ke Firestore
// (field lastProgress di dokumen users/{uid}, lihat saveLastProgressToFirestore/
// clearLastProgressInFirestore di auth.js) setiap kali user masuk/pindah step
// wizard (lihat router.js) — di-cache di app.lastProgress SELAMA sesi app ini
// berjalan (bukan localStorage lagi), dan dihapus begitu levelnya resmi
// diselesaikan (lihat runQuizFbAction di screens.js).
function saveLastProgress(level, step){
  app.lastProgress = { level, step };
  if(typeof saveLastProgressToFirestore === 'function') saveLastProgressToFirestore(level, step);
}
function getLastProgress(){
  return app.lastProgress;
}
function clearLastProgress(){
  app.lastProgress = null;
  if(typeof clearLastProgressInFirestore === 'function') clearLastProgressInFirestore();
}

// ===== Indeks Kutipan Fisika di Home — berganti tiap app dibuka & tiap naik level =====
// SENGAJA TETAP di localStorage (bukan per-akun) — ini murni variasi
// tampilan kutipan, bukan "progres" milik akun, jadi aman dipakai bersama
// walau device-nya dipakai gonta-ganti akun.
const QUOTE_CTR_KEY = 'phygo_quote_ctr';
function getQuoteIndex(){ try{ return parseInt(localStorage.getItem(QUOTE_CTR_KEY) || '0', 10) || 0; }catch(e){ return 0; } }
function bumpQuoteIndex(){
  const n = getQuoteIndex() + 1;
  try{ localStorage.setItem(QUOTE_CTR_KEY, String(n)); }catch(e){}
  return n;
}

// ===== Streak Belajar — menghitung hari berturut-turut user membuka app =====
// Ditampilkan di header & kartu "Streak" pada Home. Naik +1 kalau hari ini
// beda dari terakhir kali dibuka DAN kemarin masih tercatat aktif; reset ke 1
// kalau ada hari yang terlewat, supaya datanya selalu jujur/akurat. Sekarang
// disimpan murni ke Firestore (field streakCount/streakLastDate, lihat
// saveStreakToFirestore di auth.js), di-cache di app.streak selama sesi app
// ini berjalan — BUKAN localStorage lagi (lihat catatan panjang di atas app).
function todayStr(){
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}
function getStreakData(){
  return app.streak;
}
function bumpStreak(){
  const t = todayStr();
  const data = app.streak;
  if(data.lastDate === t) return data.count; // sudah dihitung hari ini
  const y = new Date(); y.setDate(y.getDate()-1);
  const yStr = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
  const count = (data.lastDate === yStr) ? data.count + 1 : 1;
  app.streak = { count, lastDate: t };
  if(typeof saveStreakToFirestore === 'function') saveStreakToFirestore(count, t);
  return count;
}
function getStreakCount(){ return app.streak.count; }
