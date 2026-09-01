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
  params: {}, attempts: {1:0,2:0,3:0}, calc: {}, calcChain: {1:{},2:{},3:{}}, locked: {}, running: false,
  // Urutan tumpukan kartu arsip di halaman Sejarah (index 0 = kartu paling
  // depan). `swipeCount` dipakai untuk menentukan boleh/tidaknya gestur
  // swipe-ke-atas (mundur) di kartu terdepan mengembalikan kartu sebelumnya.
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
