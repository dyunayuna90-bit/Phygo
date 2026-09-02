"use strict";

// =====================================================================
// MODE SURVIVAL — Kuis arcade cepat berbasis Kurikulum Merdeka (GLB/GLBB/GJB)
// =====================================================================

const SURV_HS_KEY = 'phygo_survival_highscore';
const SURV_QUESTION_TIME = 60; // detik per soal
const SURV_PANIC_AT = 5;       // detik tersisa saat efek panik aktif
const SURV_LIVES_START = 3;
const SURV_ANSWER_DELAY = 1000; // ms — jeda validasi jawaban (morphing + feedback warna)

function survGetHighScore(){ try{ return parseInt(localStorage.getItem(SURV_HS_KEY) || '0', 10) || 0; }catch(e){ return 0; } }
function survSaveHighScore(v){ try{ localStorage.setItem(SURV_HS_KEY, String(v)); }catch(e){} }

// ===== A. Massive Array Kamus Kata =====
const SURV_KENDARAAN = ['mobil sport','kereta komuter','truk ekspedisi','skuter listrik','gokart','bus pariwisata','mobil listrik otonom','motor balap','mobil SUV','taksi online','van logistik','becak motor','trem kota','bus rapid transit','mobil patroli','truk kontainer','mobil pickup','mobil hybrid','kereta cepat Whoosh','mobil sedan','ojek pangkalan','mobil pemadam','ambulans','mobil box','traktor ladang','skuter matik','motor trail','mobil jeep','bus sekolah','mobil boks pendingin'];
const SURV_ORANG = ['Budi','Siti','seorang kurir ojol','atlet sepeda','pembalap gokart','insinyur lalu lintas','pak polisi','Andi','Rina','teknisi lapangan','pengemudi teladan','kurir logistik','peneliti muda','petugas survei','mahasiswa teknik','masinis kereta','penguji kendaraan','narator uji','sopir bus','atlet maraton','pengendara skuter','navigator darat','petugas sensor','pengawas proyek','warga lokal','koordinator uji','pengendara uji','staf telemetri','pengamat jalan raya','analis data'];
const SURV_BENDA = ['bola basket','genteng','buah mangga','koper','obeng','kelereng','batu kali','buah kelapa','kaleng cat','pipa besi','helm proyek','bola tenis','buku ensiklopedia','bola kasti','kotak logistik','batako','bola sepak','palu besi','botol kaca','guci keramik','baut baja','buah durian','helm keselamatan','kotak perkakas','bola voli','batu bata','tegel lantai','papan kayu','bola bekel','buah pepaya'];
const SURV_TEMPAT = ['balkon lantai 5','dahan pohon mangga','jembatan penyeberangan','helikopter SAR','atap gedung perkantoran','tebing curam','menara air','lantai 3 sekolah','balkon apartemen','menara pengawas','struktur jembatan tol','tebing bukit','lantai atas rumah susun','atap stadion','puncak mercusuar','dinding tebing','menara telekomunikasi','atap gudang logistik','jembatan gantung','lantai atas pusat perbelanjaan','balkon hotel','dahan pohon beringin','anjungan pelabuhan','rangka atap stadion','menara mercusuar','tepi jurang','pelataran helipad','atap terminal bus','balkon rumah kaca','titik pantau tebing'];

function survPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function survRound1(x){ return Math.round(x*10)/10; }
function survFmtID(n){ return survRound1(n).toFixed(1).replace('.', ','); }

// ===== C. 30 Template Soal (10 GLB, 10 GLBB, 10 GJB) =====
// given: variabel yang ditampilkan di soal. find: variabel yang ditanyakan.
const SURV_TEMPLATES = [
  // ---- GLB ----
  { topic:'GLB', given:['v','t'], find:'s', text:(g,e)=>`Berdasarkan data aplikasi navigasi, ${e.ORANG} sedang melakukan perjalanan menggunakan ${e.KEND} dengan laju stabil ${g.v} m/s. Jarak tempuh yang tercatat setelah ${g.t} detik adalah...` },
  { topic:'GLB', given:['s','t'], find:'v', text:(g,e)=>`Dalam sebuah analisis sistem transportasi pintar, sebuah ${e.KEND} terpantau melaju konstan menempuh jarak ${g.s} meter selama ${g.t} detik. Kecepatan rata-rata kendaraan adalah...` },
  { topic:'GLB', given:['v','s'], find:'t', text:(g,e)=>`${e.ORANG} ditugaskan menguji efisiensi energi ${e.KEND} pada kelajuan stabil ${g.v} m/s. Waktu yang dibutuhkan untuk mencapai titik uji sejauh ${g.s} meter adalah...` },
  { topic:'GLB', given:['s','t'], find:'v', text:(g,e)=>`Sebuah sistem radar otomatis mendeteksi pergerakan ${e.KEND} yang melaju lurus stabil. Jika jarak ${g.s} meter ditempuh dalam waktu ${g.t} detik, maka kecepatan yang terekam radar adalah...` },
  { topic:'GLB', given:['v','t'], find:'s', text:(g,e)=>`Untuk distribusi logistik, ${e.ORANG} harus menjaga laju ${e.KEND} tetap ${g.v} m/s. Perpindahan posisi yang berhasil dicapai selama ${g.t} detik adalah...` },
  { topic:'GLB', given:['v','s'], find:'t', text:(g,e)=>`${e.ORANG} mengendarai ${e.KEND} dengan kelajuan tetap ${g.v} m/s. Waktu tempuh untuk lintasan lurus sepanjang ${g.s} meter adalah...` },
  { topic:'GLB', given:['s','t'], find:'v', text:(g,e)=>`Sensor jalan tol mencatat ${e.KEND} melaju stabil menempuh jarak ${g.s} meter dalam waktu ${g.t} detik. Laju kendaraan tersebut bernilai...` },
  { topic:'GLB', given:['s','t'], find:'v', text:(g,e)=>`Dalam uji coba kecepatan, ${e.KEND} melaju konstan dan berhasil melewati sensor sejauh ${g.s} meter selama ${g.t} detik. Kecepatannya adalah...` },
  { topic:'GLB', given:['t','s'], find:'v', text:(g,e)=>`${e.ORANG} mencatat waktu ${g.t} detik saat ${e.KEND} miliknya melaju stabil sejauh ${g.s} meter. Kelajuan kendaraannya tercatat sebesar...` },
  { topic:'GLB', given:['v','t'], find:'s', text:(g,e)=>`Sebuah wahana uji meluncurkan ${e.KEND} dengan kecepatan tetap ${g.v} m/s. Jarak yang ditempuh setelah ${g.t} detik adalah...` },

  // ---- GLBB ----
  { topic:'GLBB', given:['a','t'], find:'v', text:(g,e)=>`Dalam uji kelayakan jalan, sebuah ${e.KEND} yang berhenti mulai bergerak dengan percepatan konstan ${g.a} m/s² sesaat setelah lampu hijau. Laju kendaraan pada detik ke-${g.t} adalah...` },
  { topic:'GLBB', given:['a','t'], find:'s', text:(g,e)=>`Berdasarkan grafik telemetri, ${e.ORANG} memacu ${e.KEND} miliknya dari keadaan diam dengan percepatan ${g.a} m/s². Jarak aman yang telah dilalui dalam ${g.t} detik adalah...` },
  { topic:'GLBB', given:['a','v'], find:'t', text:(g,e)=>`Untuk menganalisis pengereman, sebuah ${e.KEND} dipacu dari posisi diam dengan percepatan ${g.a} m/s² hingga mencapai kelajuan ${g.v} m/s. Rentang waktu akselerasinya adalah...` },
  { topic:'GLBB', given:['a','t'], find:'s', text:(g,e)=>`Sensor mencatat bahwa ${e.ORANG} memacu ${e.KEND} dengan akselerasi ${g.a} m/s². Panjang lintasan yang dibutuhkan selama ${g.t} detik adalah...` },
  { topic:'GLBB', given:['v','a'], find:'t', text:(g,e)=>`Dalam simulasi lalu lintas, ${e.KEND} dirancang melaju dari diam menuju kecepatan ${g.v} m/s dengan percepatan ${g.a} m/s². Durasi pergerakan idealnya adalah...` },
  { topic:'GLBB', given:['a','t'], find:'v', text:(g,e)=>`${e.ORANG} menguji daya dorong ${e.KEND} dari keadaan diam dengan percepatan ${g.a} m/s². Kecepatan akhir setelah ${g.t} detik adalah...` },
  { topic:'GLBB', given:['a','t'], find:'s', text:(g,e)=>`Sebuah mobil eksperimen melaju dari posisi diam dengan percepatan konstan ${g.a} m/s². Jarak tempuh setelah bergerak selama ${g.t} detik adalah...` },
  { topic:'GLBB', given:['v','t'], find:'a', text:(g,e)=>`Dalam uji performa, ${e.KEND} digas dari keadaan diam hingga mencapai kelajuan ${g.v} m/s dalam waktu ${g.t} detik. Percepatan kendaraan tersebut adalah...` },
  { topic:'GLBB', given:['a','t'], find:'s', text:(g,e)=>`${e.ORANG} memacu ${e.KEND} dengan percepatan ${g.a} m/s² dari garis start. Jarak total yang dilalui setelah ${g.t} detik adalah...` },
  { topic:'GLBB', given:['a','t'], find:'v', text:(g,e)=>`Sistem otomatis merekam ${e.KEND} yang bergerak dari keadaan diam dengan percepatan ${g.a} m/s². Kelajuan kendaraan pada detik ke-${g.t} adalah...` },

  // ---- GJB (g = 9,8 m/s²) ----
  { topic:'GJB', given:['h'], find:'t', text:(g,e)=>`Seorang peneliti menjatuhkan ${e.BENDA} tanpa kecepatan awal dari ${e.TEMPAT} setinggi ${g.h} meter. Waktu jatuh benda hingga menyentuh dasar adalah...` },
  { topic:'GJB', given:['t'], find:'h', text:(g,e)=>`Dalam upaya pengiriman bantuan darurat, ${e.BENDA} dilepaskan bebas dan mendarat dalam waktu ${g.t} detik. Estimasi ketinggian vertikal pelepasan benda adalah...` },
  { topic:'GJB', given:['h'], find:'t', text:(g,e)=>`Tim mitigasi menggunakan drone untuk menjatuhkan ${e.BENDA} dari ${e.TEMPAT} setinggi ${g.h} meter. Waktu benda tiba di sasaran adalah...` },
  { topic:'GJB', given:['t'], find:'h', text:(g,e)=>`Untuk mengukur tinggi struktur, siswa menjatuhkan ${e.BENDA} dari ${e.TEMPAT}. Jika waktu jatuh terukur ${g.t} detik, perkiraan tinggi struktur adalah...` },
  { topic:'GJB', given:['t'], find:'v', text:(g,e)=>`Dalam analisis kinematika vertikal, ${e.BENDA} tergelincir bebas dari ${e.TEMPAT}. Kecepatan sesaat sebelum menghantam tanah pada detik ke-${g.t} adalah...` },
  { topic:'GJB', given:['h'], find:'v', text:(g,e)=>`Sebuah ${e.BENDA} dilepaskan tanpa kecepatan awal dari ${e.TEMPAT} setinggi ${g.h} meter. Kecepatan benda saat menyentuh permukaan tanah adalah...` },
  { topic:'GJB', given:['t'], find:'h', text:(g,e)=>`Dalam eksperimen fisika, ${e.BENDA} jatuh bebas dari ${e.TEMPAT} dan mencapai tanah dalam waktu ${g.t} detik. Ketinggian tempat tersebut adalah...` },
  { topic:'GJB', given:['h'], find:'t', text:(g,e)=>`Suatu benda berbentuk ${e.BENDA} dijatuhkan dari atas ${e.TEMPAT} setinggi ${g.h} meter. Waktu yang diperlukan untuk mencapai tanah adalah...` },
  { topic:'GJB', given:['t'], find:'v', text:(g,e)=>`Proyek konstruksi mengalami insiden jatuhnya ${e.BENDA} dari ${e.TEMPAT}. Jika waktu jatuh tercatat ${g.t} detik, kecepatan benda saat membentur tanah adalah...` },
  { topic:'GJB', given:['h'], find:'thalf', text:(g,e)=>`Sebuah ${e.BENDA} dijatuhkan bebas dari ${e.TEMPAT} setinggi ${g.h} meter. Waktu yang dibutuhkan benda untuk menempuh setengah perjalanan ke tanah adalah...` },
];

const SURV_UNITS = { s:'meter', v:'m/s', t:'detik', a:'m/s²', h:'meter', thalf:'detik' };

// Menghasilkan nilai variabel "given" + jawaban benar (variabel "find"),
// dengan hubungan fisis yang selalu konsisten satu sama lain.
function survGenerateValues(tpl){
  const g = {}; let correct;
  const G = tpl.given;
  if(tpl.topic === 'GLB'){
    if(G.includes('v') && G.includes('t') && tpl.find === 's'){
      g.v = survRound1(rand(10,30)); g.t = Math.round(rand(4,12));
      correct = survRound1(g.v * g.t);
    } else if(G.includes('s') && G.includes('t') && tpl.find === 'v'){
      const v0 = survRound1(rand(10,30)); g.t = Math.round(rand(4,12));
      g.s = survRound1(v0 * g.t);
      correct = survRound1(g.s / g.t);
    } else { // given v & s, find t
      g.v = survRound1(rand(10,30)); const t0 = Math.round(rand(4,12));
      g.s = survRound1(g.v * t0);
      correct = survRound1(g.s / g.v);
    }
  } else if(tpl.topic === 'GLBB'){
    if(G.includes('a') && G.includes('t') && tpl.find === 'v'){
      g.a = survRound1(rand(1,5)); g.t = Math.round(rand(3,10));
      correct = survRound1(g.a * g.t);
    } else if(G.includes('a') && G.includes('t') && tpl.find === 's'){
      g.a = survRound1(rand(1,5)); g.t = Math.round(rand(3,10));
      correct = survRound1(0.5 * g.a * g.t * g.t);
    } else if((tpl.find === 't')){ // given a & v (dua urutan), find t
      g.a = survRound1(rand(1,5)); const t0 = Math.round(rand(3,10));
      g.v = survRound1(g.a * t0);
      correct = survRound1(g.v / g.a);
    } else { // given v & t, find a
      const a0 = survRound1(rand(1,5)); g.t = Math.round(rand(3,10));
      g.v = survRound1(a0 * g.t);
      correct = survRound1(g.v / g.t);
    }
  } else { // GJB
    const GRAV = 9.8;
    if(tpl.find === 't' && G.includes('h')){
      g.h = Math.round(rand(13,80));
      correct = survRound1(Math.sqrt(2*g.h/GRAV));
    } else if(tpl.find === 'h' && G.includes('t')){
      g.t = survRound1(rand(1.2,4.5));
      correct = survRound1(0.5 * GRAV * g.t * g.t);
    } else if(tpl.find === 'v' && G.includes('t')){
      g.t = survRound1(rand(1.2,4.5));
      correct = survRound1(GRAV * g.t);
    } else if(tpl.find === 'v' && G.includes('h')){
      g.h = Math.round(rand(13,80));
      correct = survRound1(Math.sqrt(2*GRAV*g.h));
    } else { // find thalf, given h
      g.h = Math.round(rand(13,80));
      correct = survRound1(Math.sqrt(g.h/GRAV));
    }
  }
  return { given:g, correct };
}

// Pengecoh pintar: 3 angka berdekatan secara matematis dengan jawaban benar.
function survGenerateDecoys(correct){
  const used = new Set([correct]);
  const decoys = [];
  const magnitude = Math.max(Math.abs(correct)*0.18, 1.2);
  let guard = 0;
  while(decoys.length < 3 && guard < 60){
    guard++;
    const sign = Math.random() < 0.5 ? -1 : 1;
    let val = survRound1(correct + sign * (0.3 + Math.random()*0.9) * magnitude);
    if(val <= 0) val = survRound1(correct + (0.3 + Math.random()*0.9) * magnitude);
    if(!used.has(val)){ used.add(val); decoys.push(val); }
  }
  return decoys;
}

function survGenerateQuestion(lastTopic){
  let pool = SURV_TEMPLATES.filter(t => t.topic !== lastTopic);
  if(!pool.length) pool = SURV_TEMPLATES;
  const tpl = survPick(pool);
  const { given, correct } = survGenerateValues(tpl);
  const entities = { KEND: survPick(SURV_KENDARAAN), ORANG: survPick(SURV_ORANG), BENDA: survPick(SURV_BENDA), TEMPAT: survPick(SURV_TEMPAT) };

  const gDisplay = {};
  for(const k in given) gDisplay[k] = survFmtID(given[k]);

  let text = tpl.text(gDisplay, entities);
  text = text.charAt(0).toUpperCase() + text.slice(1);

  const unit = SURV_UNITS[tpl.find];
  const decoys = survGenerateDecoys(correct);
  const optionValues = [correct, ...decoys];
  // acak posisi opsi
  for(let i = optionValues.length - 1; i > 0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [optionValues[i], optionValues[j]] = [optionValues[j], optionValues[i]];
  }
  const correctIdx = optionValues.indexOf(correct);
  const options = optionValues.map(v => `${survFmtID(v)} ${unit}`);

  return { topic: tpl.topic, text, options, correctIdx, correctLabel: `${survFmtID(correct)} ${unit}` };
}

// ===== State & Alur Permainan =====
const survState = { lives: SURV_LIVES_START, score: 0, lastTopic: null, current: null, timeLeft: SURV_QUESTION_TIME, timerId: null, deadline: null, answering: false };

function renderSurvivalCard(holder){
  if(!holder) return;
  const hs = survGetHighScore();
  holder.innerHTML = `
    <button class="survival-card home-card ripple-host" id="survivalCardBtn">
      <div class="home-card-icon-bg">${svgIcon('fire')}</div>
      <div class="survival-icon-box">${svgIcon('fire')}</div>
      <div class="survival-info">
        <h3>Mode Survival</h3>
      </div>
      <div class="survival-badge">
        <span class="sv-trophy">${svgIcon('trophy')}</span>
        <span>${hs} poin</span>
      </div>
    </button>
  `;
  document.getElementById('survivalCardBtn').addEventListener('click', ()=> navigate('survival', {}));
}

function startSurvivalGame(){
  survState.lives = SURV_LIVES_START;
  survState.score = 0;
  survState.lastTopic = null;
  survState.answering = false;
  clearInterval(survState.timerId);

  renderSurvivalLives();
  renderSurvivalScore();
  document.getElementById('survOpts').innerHTML = '';
  document.getElementById('survQuestionText').textContent = '';

  const overlay = document.getElementById('survCountdownOverlay');
  const numEl = document.getElementById('survCountdownNum');
  overlay.classList.add('show');
  const seq = ['3','2','1','MULAI!'];
  let i = 0;
  numEl.textContent = seq[0];
  gsap.fromTo(numEl, {scale:0.5, opacity:0}, {scale:1, opacity:1, duration:0.3, ease:'back.out(2)'});
  const tick = setInterval(()=>{
    i++;
    if(i >= seq.length){
      clearInterval(tick);
      overlay.classList.remove('show');
      survNextQuestion();
      return;
    }
    numEl.textContent = seq[i];
    gsap.fromTo(numEl, {scale:0.5, opacity:0}, {scale:1, opacity:1, duration:0.3, ease:'back.out(2)'});
  }, 700);
}

function renderSurvivalLives(){
  const el = document.getElementById('survLives');
  if(!el) return;
  el.innerHTML = Array(SURV_LIVES_START).fill(0).map((_,i)=>`<div class="heart-icon ${i >= survState.lives ? 'lost' : ''}">${svgIcon('heart')}</div>`).join('');
}

function renderSurvivalScore(){
  const el = document.getElementById('survScoreVal');
  if(el) el.textContent = survState.score;
}

function survNextQuestion(){
  survState.answering = false;
  const q = survGenerateQuestion(survState.lastTopic);
  survState.lastTopic = q.topic;
  survState.current = q;

  const qText = document.getElementById('survQuestionText');
  const opts = document.getElementById('survOpts');
  qText.textContent = q.text;
  opts.classList.remove('frozen');
  opts.innerHTML = q.options.map((opt, i) => `
    <div class="quiz-opt ripple-host" data-idx="${i}">
      <div class="quiz-opt-letter">${String.fromCharCode(65+i)}</div>
      <div class="quiz-opt-text">${opt}</div>
    </div>
  `).join('');
  opts.querySelectorAll('.quiz-opt').forEach(el => {
    el.addEventListener('click', () => survHandleAnswer(parseInt(el.dataset.idx)));
  });

  gsap.fromTo([qText, ...opts.querySelectorAll('.quiz-opt')], {opacity:0, y:14}, {opacity:1, y:0, duration:0.4, stagger:0.05, ease:'back.out(1.4)'});

  survStartTimer();
}

// Anti-Cheat (Strict): waktu dihitung dari selisih waktu mutlak (Date.now())
// terhadap sebuah deadline tetap, bukan dengan mengurangi timeLeft per-tick.
// Dengan begitu, saat user minimize/pindah tab/keluar app lalu kembali,
// setInterval boleh saja "tertahan" oleh browser, tapi begitu tick berikutnya
// (atau event visibilitychange) berjalan, sisa waktu akan langsung terpotong
// secara akurat sesuai waktu nyata yang sudah berlalu — tidak bisa dicurangi.
function survStartTimer(){
  clearInterval(survState.timerId);
  survState.timeLeft = SURV_QUESTION_TIME;
  survState.deadline = Date.now() + SURV_QUESTION_TIME * 1000;
  const timerEl = document.getElementById('survTimerVal');
  const fillEl = document.getElementById('survProgressFill');
  survUpdateTimerUI(timerEl, fillEl);

  survState.timerId = setInterval(()=> survTick(timerEl, fillEl), 100);
}

function survTick(timerEl, fillEl){
  if(survState.deadline == null) return;
  const remain = Math.max(0, survRound1((survState.deadline - Date.now()) / 1000));
  survState.timeLeft = remain;
  survUpdateTimerUI(timerEl, fillEl);
  if(remain <= 0){
    clearInterval(survState.timerId);
    survHandleTimeout();
  }
}

// Saat aplikasi kembali terlihat (kembali dari minimize/tab lain), langsung
// hitung ulang sisa waktu dari selisih waktu mutlak, tanpa menunggu tick
// interval berikutnya — memastikan sisa waktu terpotong akurat seketika itu.
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible' && survState.timerId != null && !survState.answering){
    const timerEl = document.getElementById('survTimerVal');
    const fillEl = document.getElementById('survProgressFill');
    survTick(timerEl, fillEl);
  }
});

function survUpdateTimerUI(timerEl, fillEl){
  if(!timerEl || !fillEl) return;
  timerEl.textContent = survState.timeLeft.toFixed(1);
  fillEl.style.width = (survState.timeLeft / SURV_QUESTION_TIME * 100) + '%';
  const panic = survState.timeLeft <= SURV_PANIC_AT;
  timerEl.classList.toggle('panic', panic);
  fillEl.classList.toggle('panic', panic);
}

function survHandleTimeout(){
  if(survState.answering) return;
  survState.answering = true;
  const opts = document.getElementById('survOpts');
  opts.classList.add('frozen');
  survLoseLife();
}

function survHandleAnswer(idx){
  if(survState.answering) return;
  survState.answering = true;
  clearInterval(survState.timerId);

  const opts = document.getElementById('survOpts');
  opts.classList.add('frozen');
  const optEl = opts.querySelector(`.quiz-opt[data-idx="${idx}"]`);
  const isCorrect = idx === survState.current.correctIdx;
  if(optEl) optEl.classList.add(isCorrect ? 'correct' : 'wrong');

  // Validasi jeda 1 detik penuh (morphing bentuk + feedback warna) + anti-spam click
  setTimeout(()=>{
    if(isCorrect){
      survState.score++;
      renderSurvivalScore();
      survNextQuestion();
    } else {
      survLoseLife();
    }
  }, SURV_ANSWER_DELAY);
}

function survLoseLife(){
  survState.lives--;
  renderSurvivalLives();
  if(survState.lives <= 0){
    survGameOver();
  } else {
    survNextQuestion();
  }
}

function survGameOver(){
  clearInterval(survState.timerId);
  survState.deadline = null;
  const hs = survGetHighScore();
  if(survState.score > hs) survSaveHighScore(survState.score);

  document.getElementById('survGoScore').textContent = survState.score;
  const corrEl = document.getElementById('survGoCorrection');
  if(survState.current){
    corrEl.textContent = `Jawaban benar untuk soal terakhir adalah: ${survState.current.correctLabel}`;
  } else {
    corrEl.textContent = '';
  }

  document.getElementById('survGameoverBackdrop').classList.add('show');
  document.getElementById('survGameoverModal').classList.add('show');
}

function survHideGameOver(){
  document.getElementById('survGameoverBackdrop').classList.remove('show');
  document.getElementById('survGameoverModal').classList.remove('show');
}

function survRetry(){
  survHideGameOver();
  startSurvivalGame();
}

function survGoHome(){
  survHideGameOver();
  clearInterval(survState.timerId);
  goToDashboard();
}

document.addEventListener('DOMContentLoaded', ()=>{});
if(document.getElementById('survBtnRetry')) document.getElementById('survBtnRetry').onclick = survRetry;
if(document.getElementById('survBtnHome')) document.getElementById('survBtnHome').onclick = survGoHome;

