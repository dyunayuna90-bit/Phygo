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

const app = {
  completed: new Set(JSON.parse(localStorage.getItem('phygo_completed') || '[]')),
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
// milik level yang BELUM diselesaikan. Disimpan ke localStorage setiap kali
// user masuk/pindah step wizard (lihat router.js), jadi datanya tetap ada
// walau app di-close paksa / out tiba-tiba, dan dihapus begitu levelnya
// resmi diselesaikan (lihat runQuizFbAction di screens.js).
const LAST_PROGRESS_KEY = 'phygo_last_progress';

function saveLastProgress(level, step){
  try{ localStorage.setItem(LAST_PROGRESS_KEY, JSON.stringify({ level, step, ts: Date.now() })); }catch(e){}
}
function getLastProgress(){
  try{
    const raw = localStorage.getItem(LAST_PROGRESS_KEY);
    if(!raw) return null;
    const data = JSON.parse(raw);
    if(!data || typeof data.level !== 'number' || typeof data.step !== 'number') return null;
    return data;
  }catch(e){ return null; }
}
function clearLastProgress(){
  try{ localStorage.removeItem(LAST_PROGRESS_KEY); }catch(e){}
}

// ===== Indeks Kutipan Fisika di Home — berganti tiap app dibuka & tiap naik level =====
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
// kalau ada hari yang terlewat, supaya datanya selalu jujur/akurat.
const STREAK_KEY = 'phygo_streak';
function todayStr(){
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}
function getStreakData(){
  try{
    const raw = localStorage.getItem(STREAK_KEY);
    const d = raw ? JSON.parse(raw) : null;
    return (d && typeof d.count === 'number') ? d : {count:0, lastDate:null};
  }catch(e){ return {count:0, lastDate:null}; }
}
function bumpStreak(){
  const t = todayStr();
  const data = getStreakData();
  if(data.lastDate === t) return data.count; // sudah dihitung hari ini
  const y = new Date(); y.setDate(y.getDate()-1);
  const yStr = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
  const count = (data.lastDate === yStr) ? data.count + 1 : 1;
  try{ localStorage.setItem(STREAK_KEY, JSON.stringify({count, lastDate:t})); }catch(e){}
  return count;
}
function getStreakCount(){ return getStreakData().count; }
