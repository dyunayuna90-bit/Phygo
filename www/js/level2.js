"use strict";

function renderLevel2Step(step, body){ const f = [l2Ex,l2AccIntro,l2Data,l2Form,l2Con,l2Alg,l2Op1,l2Op2,l2Op3,l2Sum,l2Setel,l2Run,l2Hasil,l2Quiz]; f[step](body); }

function l2Ex(body){
  const a=4, t=3, s=0.5*a*t*t;
  body.innerHTML = `<span class="example-tag">${svgIcon('accel')} Observasi Fenomena</span><h2>Perbandingan GLB vs GLBB</h2>${buildRoadStageHTML('#FFB871','#3D2B00', true, true)}<p class="step-text">Mobil berbayang stabil (GLB). Mobil kamu (Oranye) memulai dari diam, namun <b>mesin terus mendorongnya</b>, membuatnya melaju semakin agresif (GLBB).</p><button class="btn btn-ghost ripple-host btn-sm" id="btnReplay">Putar Ulang Observasi</button>`;
  const mToPx=layoutRoadStage(s, s*1.4);
  document.getElementById('stgGate').style.opacity='.4'; document.getElementById('stgGateLabel').textContent='';
  const car=document.getElementById('stgCar'), carWrap=document.getElementById('stgCarWrap'), sh=document.getElementById('stgShadow');
  const gCar=document.getElementById('ghostCar'), gSh=document.getElementById('ghostShadow');
  
  function play(){ 
    gsap.set([car,sh,gCar,gSh], {x:0, left: 10}); 
    
    const tX_ghost = mToPx(s*0.7) - 46;
    const tX_car = mToPx(s) - 46;

    gsap.to([gCar,gSh], { x: tX_ghost, duration:2.0, ease:'none' }); 
    
    gsap.to(carWrap, {rotation: -4, y:-2, duration: 0.4, ease: 'power2.out'})
        .then(()=> gsap.to(carWrap, {rotation: 0, y:0, duration: 0.7, ease:'power1.inOut'}));
        
    gsap.to([car,sh], { x: tX_car, duration:2.0, ease:'power2.in', onUpdate:function(){
       const curX = gsap.getProperty(car, 'x');
       if(this.progress() > 0.3 && Math.random() > 0.55) spawnExhaust(document.getElementById('roadStage'), 10 + curX, '#FFB871');
    }, onComplete:()=>{ 
       gsap.to(carWrap, {rotation: 5, y: 2, duration: 0.2, ease: 'power1.in'}).then(()=> gsap.to(carWrap, {rotation: 0, y:0, duration: 0.4, ease:'back.out(2)'}));
    }}); 
  }
  setTimeout(play, 500); document.getElementById('btnReplay').onclick=play;
  setFooter({ backVisible:false, primaryLabel:'Menarik, Lanjut', onPrimary:()=> wizardGoStep(1) });
}
function l2AccIntro(body){
  const N=6;
  body.innerHTML = `<span class="eyebrow-pill">Langkah Dasar</span><h2>Membedah Makna Percepatan</h2><p class="step-text">Kecepatan mobil tidak datar. Setiap detik berlalu, gaya dorong (percepatan) ditambahkan berlapis-lapis. Lihat grafik bar ini, jarak yang dilahap membentuk kurva eksponensial:</p>
  <div class="acc-chart-wrap"><div id="accBars" class="acc-chart"></div></div>
  <button class="btn btn-ghost ripple-host btn-sm" id="btnReplay" style="margin-top:20px;">Putar Ulang Visualisasi Bar</button><p class="step-text" style="margin-top:20px;">Berbeda dengan GLB, jarak di sini dikalikan dengan <b>kuadrat waktu</b> karena mobil semakin "ganas" di detik-detik akhir.</p>`;
  const wr=document.getElementById('accBars'), bars=[], vals=[];
  for(let i=1;i<=N;i++){
    const col=document.createElement('div'); col.className='acc-col';
    const val=document.createElement('div'); val.className='acc-val'; val.textContent='0';
    const bar=document.createElement('div'); bar.className='acc-bar';
    const lbl=document.createElement('div'); lbl.className='acc-lbl'; lbl.textContent='t='+i;
    col.appendChild(val); col.appendChild(bar); col.appendChild(lbl);
    wr.appendChild(col); bars.push(bar); vals.push(val);
  }
  function play(){
    bars.forEach((b,i)=>{
      gsap.killTweensOf(b);
      const pct = ((i+1)*(i+1))/(N*N)*100;
      const st={h:0};
      gsap.set(b,{height:'0%'});
      gsap.to(st,{ h:pct, duration:0.7, delay:i*0.25, ease:'elastic.out(1, 0.7)', onUpdate:()=>{ b.style.height=st.h+'%'; vals[i].textContent=Math.round(st.h); } });
    });
  }
  setTimeout(play,200); document.getElementById('btnReplay').onclick=play;
  setFooter({ backVisible:true, primaryLabel:'Mengerti', onPrimary:()=> wizardGoStep(1) });
}
function l2Data(body){
  const { S, T } = app.params[2];
  body.innerHTML = `<span class="eyebrow-pill">Misi Berikutnya</span><h2>Target Parameter GLBB</h2><p class="step-text">Mobil harus mencapai garis finis tepat pada waktu yang ditentukan. Titik krusial: Mobil dimulai dari <b>keadaan statis (diam)</b>.</p>
  ${buildRoadStageHTML('#FFB871','#3D2B00', true)}
  <div class="stat-chip-row"><div class="stat-chip"><span class="lbl">Jarak Eksekusi</span><span class="val">${S} m</span></div><div class="stat-chip"><span class="lbl">Batas Waktu</span><span class="val">${T} dtk</span></div><div class="stat-chip"><span class="lbl">V₀ (Awal)</span><span class="val">0 m/s</span></div></div>`;
  layoutRoadStage(S, S*1.2);
  setFooter({ backVisible:true, primaryLabel:'Akses Rumus GLBB', onPrimary:()=> wizardGoStep(1) });
}
function l2Form(body){
  const { S, T } = app.params[2];
  body.innerHTML = `<span class="eyebrow-pill">Mengenal Rumus</span><h2>Persamaan Gerak Dipercepat</h2><div class="formula-box">${tex(String.raw`s = v_0 t + \dfrac{1}{2} a t^2`)}</div>
  <p class="step-text">Persamaan absolut untuk benda yang melaju dari keadaan diam dan terus meningkat.</p>
  <div class="symbol-row"><div class="sym" style="background:var(--surface-c-high);">v₀</div><div class="meaning">Karena mobil statis di awal, <b>V₀ = 0</b>. Komponen ini hancur menjadi nol dan dapat <b>dihapus dari persamaan</b>.</div></div>
  <div class="symbol-row"><div class="sym" style="color:var(--lvl2);">a</div><div class="meaning">Percepatan (Thrust/Daya Dorong). Ini adalah <b>target perhitungan kita</b>.</div></div>
  <div class="symbol-row"><div class="sym">s, t</div><div class="meaning">Jarak target <b>${S} m</b> & Waktu <b>${T} dtk</b>.</div></div>`;
  setFooter({ backVisible:true, primaryLabel:'Lanjut Pemahaman', onPrimary:()=> wizardGoStep(1) });
}
function l2Con(body){
  body.innerHTML = `<span class="eyebrow-pill">Konsep Lanjutan</span><h2>Mengapa Waktu Dikuadratkan?</h2><p class="step-text">Simbol ${texi(String.raw`t^2`)} muncul karena waktu memberikan efek ganda: <br>1. Menambah kecepatan konstan.<br>2. Kecepatan yang tinggi itu dikalikan lagi dengan waktu perjalanan.</p><div style="display:flex;gap:16px;margin-top:24px;"><div style="flex:1;text-align:center;"><div class="mini-track-label">GLB (Linier)</div><canvas id="cmpLin" style="width:100%;height:120px;background:linear-gradient(135deg, var(--surface-c-high), var(--surface-c));border-radius:16px;display:block;box-shadow:inset 0 4px 8px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05);"></canvas></div><div style="flex:1;text-align:center;"><div class="mini-track-label">GLBB (Eksponensial)</div><canvas id="cmpQu" style="width:100%;height:120px;background:linear-gradient(135deg, var(--surface-c-high), var(--surface-c));border-radius:16px;display:block;box-shadow:inset 0 4px 8px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05);"></canvas></div></div><button class="btn btn-ghost ripple-host btn-sm" id="btnR" style="margin-top:24px;">Putar Ulang Perbandingan Grafik</button>`;
  
  const c1=body.querySelector('#cmpLin'), c2=body.querySelector('#cmpQu');
  function play(){ if(!c1||!c2)return; const g1=graphCtx(c1), g2=graphCtx(c2); const p1=[], p2=[]; const st={t:0}; gsap.killTweensOf(st); gsap.to(st,{t:5,duration:2.2,ease:'none',onUpdate:()=>{ p1.push({x:st.t,y:st.t}); p2.push({x:st.t,y:st.t*st.t}); g1.ctx.clearRect(0,0,g1.w,g1.h); drawAxes(g1.ctx,g1.w,g1.h); drawSeries(g1.ctx,g1.w,g1.h,p1,5,5,'#5FE1E2',false); g2.ctx.clearRect(0,0,g2.w,g2.h); drawAxes(g2.ctx,g2.w,g2.h); drawSeries(g2.ctx,g2.w,g2.h,p2,5,25,'#FFB871',false); }}); }
  setTimeout(play,400); body.querySelector('#btnR').onclick=play;
  setFooter({ backVisible:true, primaryLabel:'Mulai Membedah Rumus', onPrimary:()=> wizardGoStep(1) });
}
function l2Alg(body){
  const { S, T } = app.params[2];
  buildAlgebraWidget(body, {
    title: 'Isolasi Variabel Percepatan (a)',
    terms: {
      s: `<i>s</i>`, eq: `=`, h1: `1`, hl: `<div style="height:3px; background:currentColor; width:100%;"></div>`, h2: `2`, a: `<i>a</i>`, t2: `<i>t</i><sup>2</sup>`, ll: `<div style="height:3px; background:currentColor; width:100%;"></div>`,
      mul1: `<span style="opacity:.4;">&times;</span>`, mul2: `<span style="opacity:.4;">&times;</span>`,
      sNum: `<b style="color:var(--lvl2);">${S}</b>`, t2Num: `<b style="color:var(--lvl2);">${T}<sup>2</sup></b>`
    },
    states: [
      { s: {x:80, y:60}, eq: {x:120, y:60}, h1: {x:170, y:42}, hl: {x:170, y:60, w:20}, h2: {x:170, y:78}, mul1: {x:200, y:60, o:1}, a: {x:230, y:60}, mul2: {x:260, y:60, o:1}, t2: {x:295, y:60}, ll: {x:120, y:60, o:0, w:10}, sNum: {x:80, y:60, o:0}, t2Num: {x:295, y:60, o:0} },
      { h2: {x:50, y:60, color:'var(--primary)'}, mul1: {x:80, y:60, o:1, color:'var(--primary)'}, s: {x:115, y:60}, eq: {x:155, y:60}, a: {x:195, y:60}, mul2: {x:225, y:60, o:1}, t2: {x:260, y:60}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, ll: {x:120, y:60, o:0, w:10}, sNum: {x:115, y:42, o:0}, t2Num: {x:260, y:60, o:0} },
      { h2: {x:90, y:42, color:'inherit'}, mul1: {x:120, y:42, color:'inherit', o:1}, s: {x:150, y:42}, ll: {x:120, y:60, o:1, w:95}, t2: {x:120, y:79, color:'var(--lvl2)'}, eq: {x:190, y:60}, a: {x:235, y:60}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, mul2: {x:225, y:60, o:0}, sNum: {x:150, y:42, o:0}, t2Num: {x:120, y:79, o:0} },
      { a: {x:80, y:60, color:'var(--primary)'}, eq: {x:125, y:60}, h2: {x:170, y:42}, mul1: {x:200, y:42, o:1}, s: {x:230, y:42, o:1}, ll: {x:200, y:60, o:1, w:95}, t2: {x:200, y:79, o:1, color:'inherit'}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, mul2: {x:225, y:60, o:0}, sNum: {x:230, y:42, o:0}, t2Num: {x:200, y:79, o:0} },
      { a: {x:80, y:60, color:'var(--primary)'}, eq: {x:125, y:60}, h2: {x:170, y:42}, mul1: {x:200, y:42, o:1}, ll: {x:200, y:60, o:1, w:105}, s: {x:230, y:42, o:0}, t2: {x:200, y:79, o:0}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, mul2: {x:225, y:60, o:0}, sNum: {x:240, y:42, o:1}, t2Num: {x:200, y:79, o:1} }
    ],
    ops: [ null, '× 2 pada kedua ruas', '÷ t² pada kedua ruas', 'Rotasi Persamaan', 'Substitusi Nilai Aktual' ],
    descriptions: [
      `Persamaan awal kita adalah: Jarak (${texi(String.raw`s`)}) = setengah <b>kali</b> percepatan (${texi(String.raw`a`)}) <b>kali</b> waktu kuadrat (${texi(String.raw`t^2`)}). Kita akan merekayasa baliknya.`,
      `Pindahkan pembagi <b>2</b> ke seberang. Ia bertransformasi menjadi <b>pengali</b> bagi jarak. (${texi(String.raw`2s = at^2`)})`,
      `Lemparkan variabel waktu <b>t²</b> ke seberang. Ia akan turun kasta menjadi <b>pembagi</b> di bawah garis.`,
      `Balik persamaannya agar terlihat lebih profesional. Sekarang kita memiliki formula absolut untuk mencari <b>a</b>.`,
      `Injeksi parameter yang diberikan: jarak (<b>s</b>) menjadi <b>${S}</b>, dan batas waktu (<b>t</b>) menjadi <b>${T}</b>. Formulasi siap dieksekusi.`
    ]
  });
}
function l2Op1(body){
  const { S, T } = app.params[2];
  renderOperationStep(body, {
    tag:'Tahap Eksekusi 1 / 3', stageIndex:0, stageTotal:3, title:'Menghitung Kuadrat Waktu', explainHtml:`Batas waktu adalah <b>${T} detik</b>. Mari kita kuadratkan nilainya (dikalikan dengan dirinya sendiri).`,
    masterBefore:`a = \\dfrac{2 \\times ${S}}{\\underbrace{\\textcolor{#FFB871}{${T}^2}}_{\\textcolor{#FFB871}{\\text{eksekusi ini}}}}`, masterAfter:(r)=> `a = \\dfrac{2 \\times ${S}}{\\textcolor{#82DBA3}{${fmt(r,2)}}}`,
    computeLabel:`Kalkulasi ${T} × ${T}`, doCompute:()=> T*T,
    whyAfterHtml:(r)=> `Hasil kuadratis waktu adalah <b>${fmt(r,2)}</b>.`, nextLabel:'Lanjut ke Tahap 2', onNext:(r)=>{ app.calcChain[2].tSq = r; wizardGoStep(1); }
  });
}
function l2Op2(body){
  const { S } = app.params[2]; const c=app.calcChain[2]; if(c.tSq===undefined) return wizardGoStep(-1);
  renderOperationStep(body, {
    tag:'Tahap Eksekusi 2 / 3', stageIndex:1, stageTotal:3, title:'Menggandakan Jarak', explainHtml:`Jarak trek <b>${S} meter</b> harus digandakan untuk mengkompensasi faktor setengah pada rumus awal.`,
    masterBefore:`a = \\dfrac{\\underbrace{\\textcolor{#FFB871}{2 \\times ${S}}}_{\\textcolor{#FFB871}{\\text{eksekusi ini}}}}{${fmt(c.tSq,2)}}`, masterAfter:(r)=> `a = \\dfrac{\\textcolor{#82DBA3}{${fmt(r,2)}}}{${fmt(c.tSq,2)}}`,
    computeLabel:`Kalkulasi 2 × ${S}`, doCompute:()=> 2*S,
    whyAfterHtml:(r)=> `Nilai penggandaan jarak adalah <b>${fmt(r,2)}</b>.`, nextLabel:'Finalisasi Formulasi', onNext:(r)=>{ app.calcChain[2].twoS = r; wizardGoStep(1); }
  });
}
function l2Op3(body){
  const c = app.calcChain[2]; if(c.twoS===undefined) return wizardGoStep(-1);
  renderOperationStep(body, {
    tag:'Tahap Eksekusi 3 / 3', stageIndex:2, stageTotal:3, title:'Penyelesaian Pembagian', explainHtml:`Bagi nilai atas <b>${fmt(c.twoS,2)}</b> dengan nilai waktu kuadrat <b>${fmt(c.tSq,2)}</b>.`,
    masterBefore:`a = \\underbrace{\\textcolor{#FFB871}{\\dfrac{${fmt(c.twoS,2)}}{${fmt(c.tSq,2)}}}}_{\\textcolor{#FFB871}{\\text{eksekusi ini}}}`, masterAfter:(r)=> `a = \\textcolor{#82DBA3}{${fmt(r,2)}}\\text{ m/s}^2`,
    computeLabel:`Bagi ${fmt(c.twoS,2)} : ${fmt(c.tSq,2)}`, doCompute:()=> c.twoS/c.tSq,
    whyAfterHtml:(r)=> `Bingo! Mesin membutuhkan dorongan akselerasi sebesar <b>${fmt(r,2)} m/s²</b>.`, nextLabel:'Pahami Hasilnya', onNext:(r)=>{ app.calc[2]=r; wizardGoStep(1); }
  });
}
function l2Sum(body){
  const { S, T } = app.params[2]; const a = app.calc[2]; if(a===undefined) return wizardGoStep(-1);
  body.innerHTML = `<span class="eyebrow-pill">Laporan Akhir</span><h2>Rekapitulasi Kalkulasi</h2><div class="formula-box">${tex(String.raw`a = \dfrac{2 \times ${S}}{${T}^2} = ${fmt(a,2)}\text{ m/s}^2`)}</div><p class="step-text">Data percepatan <b>${fmt(a,2)} m/s²</b> ini akan diinput ke dalam sistem mesin tuas throttle untuk pengujian.</p>`;
  setFooter({ backVisible:true, primaryLabel:'Akses Panel Mesin (Throttle)', onPrimary:()=> wizardGoStep(1) });
}
function l2Setel(body){
  const tgt=app.calc[2], mX=app.params[2].ctrlMax; if(tgt===undefined) return wizardGoStep(-2);
  const ticksHTML = Array.from({length:11}).map((_, i) => `<div class="mech-tick ${i%2===0?'major':''}"></div>`).join('');
  
  body.innerHTML = `<span class="eyebrow-pill">Fase Pengaturan Hardware</span><h2>Kalibrasi Tuas Akselerasi (Throttle)</h2><p class="step-text">Tarik tuas mekanis di bawah ini untuk mengatur daya dorong mesin (Percepatan) hingga indikator presisi.</p>
    <div class="setel-layout">
      <div class="mech-lever-col">
        <div class="mech-track-wrap">
          <div class="mech-slot-line"></div>
          <div class="mech-led-strip"><div id="levF" class="mech-led-fill" style="height:0%;"></div></div>
          <div class="mech-ticks">${ticksHTML}</div>
          <input type="range" class="lever-input-hidden" id="cSl" min="0" max="${mX}" step="0.1" value="0" orient="vertical">
          <div class="mech-handle" id="levH" style="bottom: 0%;">
             <div class="mech-grip"></div>
             <div class="mech-grip"></div>
             <div class="mech-grip"></div>
          </div>
        </div>
        <div class="mech-unit-label">m/s²</div>
      </div>
      
      <div class="setel-info-col">
        <div class="info-card"><span class="lbl">Target Hitungan</span><div class="val" style="color:var(--lvl2)">${fmt(tgt,1)}</div></div>
        <div class="info-card" style="background:var(--surface-c);"><span class="lbl">Output Mesin Aktual</span><div class="val" id="curVal" style="color:var(--primary)">0.0</div></div>
        <div class="diff-card" id="diffCard"><span class="lbl">Varian Eror</span><div class="val" id="diffVal">${fmt(tgt,1)}</div></div>
        <button class="btn btn-ghost btn-block ripple-host btn-sm" id="bSn" style="margin-top:10px;">Auto-Kalibrasi AI</button>
      </div>
    </div>
    <div class="match-status no" id="mSt">Tuas throttle belum mencapai titik presisi</div>`;
    
  const sl=document.getElementById('cSl'), cv=document.getElementById('curVal'), f=document.getElementById('levF'), h=document.getElementById('levH'), st=document.getElementById('mSt'), dc=document.getElementById('diffCard'), dv=document.getElementById('diffVal'), tol=Math.max(0.15, mX*0.012);
  function ref(){ 
    const v=parseFloat(sl.value), p=clamp(v/mX,0,1)*100; 
    cv.textContent=fmt(v,1); 
    f.style.height=p+'%'; h.style.bottom=`calc(${p}% - 22px)`; 
    const diff=Math.abs(v-tgt), mat=diff<=tol; 
    dv.textContent=fmt(diff,1); dc.className='diff-card'+(mat?' matched':''); 
    st.textContent=mat?'Sistem Stabil. Siap Diuji.':`Koreksi manual diperlukan: ±${fmt(diff,1)} m/s²`; 
    st.className='match-status '+(mat?'yes':'no'); 
    setFooter({ backVisible:true, primaryLabel:'Kunci & Lanjut', primaryDisabled:!mat, onPrimary:()=>{ app.locked[2]=v; wizardGoStep(1); } }); 
  }
  sl.oninput=ref; document.getElementById('bSn').onclick=()=>{sl.value=tgt.toFixed(1); ref();}; ref();
}

function l2Run(body){
  const { S, T } = app.params[2], a = app.locked[2]; if(a===undefined) return wizardGoStep(-1);
  const mMax=Math.max(S*1.5,S+40);
  body.innerHTML = `<div class="sim-layout">${buildRoadStageHTML('#FFB871','#3D2B00', true)}<div class="sim-side-panel"><span class="panel-label">Daya Dorong (Percepatan)</span><div style="font-family:var(--font-mono);font-weight:900;font-size:36px;color:var(--lvl2); text-shadow:0 2px 8px rgba(255,184,113,0.3);">${fmt(a,1)} <span style="font-size:16px;color:var(--on-surface-var);">m/s²</span></div><span class="panel-label">Grafik Eksponensial GLBB</span><canvas class="mini-graph" id="graphCanvas"></canvas><div class="graph-legend"><span><i style="background:#FFB871"></i>Kurva Jarak</span><span><i style="background:#FFB4AB;opacity:.8"></i>Batas Target</span></div></div></div>`;
  const mToPx=layoutRoadStage(S, mMax);
  setFooter({ backVisible:true, primaryLabel:'Eksekusi Simulasi GLBB', onPrimary:()=> runL2(a, S, T, mToPx) });
}

function runL2(a, S, T, mToPx){
  if(app.running) return; app.running=true; setFooter({ backVisible:false, primaryLabel:'Menjalankan Simulasi...', primaryDisabled:true });
  
  const car=document.getElementById('stgCar'), carWrap=document.getElementById('stgCarWrap'), sh=document.getElementById('stgShadow'), tm=document.getElementById('stgTimer'), hud=document.getElementById('stgHud'), gr=graphCtx(document.getElementById('graphCanvas'));
  const pL2=document.getElementById('pxL2'), pL3=document.getElementById('pxL3');
  
  gsap.set([car,sh],{x:0, left:10}); 
  gsap.set([pL2,pL3],{backgroundPositionX:0});
  
  const dist=0.5*a*T*T, dur=T, pts=[]; let lD=0, lH=0;
  const tX = mToPx(dist) - 46;
  const wheelsL2=document.querySelectorAll('#stgCar .wheel');
  
  gsap.to(carWrap, {rotation: -5, y: -3, duration: 0.4, ease: 'power2.out'}) 
      .then(()=> gsap.to(carWrap, {rotation: 0, y: 0, duration: 0.7, ease: 'power1.inOut'})); 
  
  const tl=gsap.timeline({onComplete:()=>{ 
    app.running=false; 
    gsap.to(carWrap, {rotation: 5, y: 2, duration: 0.2, ease: 'power1.in'}) 
        .then(() => gsap.to(carWrap, {rotation: 0, y: 0, duration: 0.4, ease: 'back.out(2)'}));

    app.lastResult={level:2, a, S, T, dist, success:Math.abs(dist-S)<=Math.max(3,S*0.05)}; 
    setFooter({backVisible:true, backIcon:'replay', onBack:()=>runL2(a,S,T,mToPx), primaryLabel:'Lihat Laporan Akhir', onPrimary:()=>wizardGoStep(1)}); 
  }});
  
  const animDur = Math.min(dur * 0.4, 2.0);
  tl.to([car,sh], {x:tX, duration:animDur, ease:'power2.in'});
  
  tl.to({}, {duration:animDur, onUpdate:function(){ 
    const p=this.progress(), t=p*T, s=0.5*a*t*t; tm.textContent=fmt(t,1)+' dtk'; pts.push({x:t,y:s}); 
    
    pL2.style.backgroundPositionX = -(s * 2) + 'px';
    pL3.style.backgroundPositionX = -(s * 0.5) + 'px';
    
    const curX = gsap.getProperty(car, 'x');
    if(p > 0.1 && Math.random() < p * 0.6) spawnExhaust(document.getElementById('roadStage'), 10 + curX - 5, '#FFB871');
    if(t-lD>0.15 && p > 0.3){ lD=t; spawnDustAdv(document.getElementById('roadStage'), 10 + curX + 10); }
    if(p > 0.6 && Math.random() > 0.5) spawnSpeedLine(document.getElementById('roadStage'));

    wheelsL2.forEach(w => w.style.transform = `rotate(${Math.pow(p, 2) * 2000 * (dist/30)}deg)`);

    gr.ctx.clearRect(0,0,gr.w,gr.h); drawAxes(gr.ctx,gr.w,gr.h); 
    drawSeries(gr.ctx,gr.w,gr.h,[{x:0,y:S},{x:T,y:S}],T,Math.max(S,dist)*1.15,'#FFB4AB',true); 
    drawSeries(gr.ctx,gr.w,gr.h,pts,T,Math.max(S,dist)*1.15,'#FFB871',false); 
    
    if(t-lH>0.15){ lH=t; hud.classList.add('show'); hud.innerHTML=texi(String.raw`s = \tfrac{1}{2} a t^2 = \tfrac{1}{2} \times ${fmt(a,1)} \times ${fmt(t,1)}^2 = ${fmt(s,1)}\text{ m}`); } 
  }}, 0);
}

function l2Hasil(body){
  const r=app.lastResult; if(!r||r.level!==2) return wizardGoStep(-1); app.attempts[2]++;
  renderResultStep(body, { level:2, retryStep:6, success:r.success, accuracy:clamp(100-(Math.abs(r.dist-r.S)/r.S)*100,0,100), varName:'a', unit:'m/s²', correctAnswer:fmt((2*r.S)/(r.T*r.T),2),
    given:[['Daya Dorong (Akselerasi) Diatur', fmt(r.a,1)+' m/s²'],['Batas Waktu Eksekusi', fmt(r.T,1)+' dtk']], computed:fmt(r.dist,1)+' m', computedLabel:'Jarak Aktual yang Dicapai', target:fmt(r.S,1)+' m', targetLabel:'Jarak Target Zona', diff:fmt(Math.abs(r.dist-r.S),1)+' m',
    explainSuccess:`Brilian! Analisis formulasi dan konversi aljabar yang kamu lakukan terbukti 100% kompatibel dengan simulasi fisika ini.`,
    explainFail:`Simulasi gagal mencapai target. Ingat kembali cara isolasi variabel pada manipulasi aljabar yang telah kita lalui.`
  });
}

function l2Quiz(body) {
  renderQuizStep(body, {
    level: 2,
    visualHtml: `
      <div style="display:flex; justify-content:space-around; align-items:center; width:100%; height:100%; padding:0 10px;">
         <div style="text-align:center;">
            <div style="font-size:11px; font-weight:800; color:var(--on-surface-var); letter-spacing:1px;">KONDISI AWAL</div>
            <div style="font-family:var(--font-mono); font-size:18px; font-weight:900; color:var(--on-surface); margin-top:8px;">${texi(String.raw`v_0 = 36`)} <span style="font-size:12px;">km/h</span></div>
            <div style="font-family:var(--font-mono); font-size:12px; color:var(--on-surface-var); margin-top:4px;">( ${texi(String.raw`10 \text{ m/s}`)} )</div>
         </div>
         <div style="display:flex; flex-direction:column; align-items:center; color:var(--lvl2);">
            ${svgIcon('accel')}
            <div style="font-family:var(--font-mono); font-weight:900; margin-top:4px;">${texi(String.raw`a = 1 \text{ m/s}^2`)}</div>
            <div id="q2Time" style="font-family:var(--font-mono); font-weight:800; font-size:14px; background:var(--surface-c-high); padding:2px 8px; border-radius:6px; margin-top:8px;">${texi(String.raw`t = 0 \text{ s}`)}</div>
         </div>
         <div style="text-align:center;">
            <div style="font-size:11px; font-weight:800; color:var(--on-surface-var); letter-spacing:1px;">HASIL AKHIR</div>
            <div style="font-family:var(--font-mono); font-size:18px; font-weight:900; color:var(--primary); margin-top:8px;">${texi(String.raw`v = ?`)}</div>
            <div style="font-family:var(--font-mono); font-size:18px; font-weight:900; color:var(--success); margin-top:4px;">${texi(String.raw`s = ?`)}</div>
         </div>
      </div>
    `,
    setupVisual: (box) => {
        const time = box.querySelector('#q2Time');
        const obj = {t:0};
        gsap.to(obj, {t:20, duration:3, ease:'power1.inOut', repeat:-1, repeatDelay:1, onUpdate: () => {
            time.innerHTML = texi(String.raw`t = ${Math.round(obj.t)} \text{ s}`);
            if(Math.round(obj.t) > 0) { time.style.color = 'var(--lvl2)'; } else { time.style.color = 'inherit'; }
        }});
    },
    question: `Sebuah mobil bergerak dengan kecepatan awal ${texi(String.raw`v_0 = 36 \text{ km/jam}`)}, kemudian dipercepat dengan dorongan akselerasi stabil sebesar ${texi(String.raw`a = 1 \text{ m/s}^2`)}. Hitunglah kecepatan akhir (${texi(String.raw`v`)}) dan total jarak tempuhnya (${texi(String.raw`s`)}) selama rentang waktu ${texi(String.raw`t = 20 \text{ s}`)}!`,
    options: [
      { html: `<span class="quiz-opt-label">Kecepatan ${texi(String.raw`v = 20 \text{ m/s}`)} & Jarak ${texi(String.raw`s = 400 \text{ m}`)}</span>` },
      { html: `<span class="quiz-opt-label">Kecepatan ${texi(String.raw`v = 25 \text{ m/s}`)} & Jarak ${texi(String.raw`s = 500 \text{ m}`)}</span>` },
      { html: `<span class="quiz-opt-label">Kecepatan ${texi(String.raw`v = 30 \text{ m/s}`)} & Jarak ${texi(String.raw`s = 600 \text{ m}`)}</span>` },
      { html: `<span class="quiz-opt-label">Kecepatan ${texi(String.raw`v = 35 \text{ m/s}`)} & Jarak ${texi(String.raw`s = 700 \text{ m}`)}</span>` }
    ],
    correctIdx: 2,
    explainCorrect: `Luar Biasa! Mari kita bedah:<br><br>1. Konversi satuan kecepatan awal:<br>${tex(String.raw`v_0 = \frac{36.000 \text{ m}}{3.600 \text{ s}} = 10 \text{ m/s}`)}<br>2. Kecepatan akhir:<br>${tex(String.raw`v = v_0 + at = 10 + (1 \times 20) = 30 \text{ m/s}`)}<br>3. Jarak tempuh eksponensial:<br>${tex(String.raw`s = v_0t + \frac{1}{2}at^2`)}<br>${tex(String.raw`s = (10 \times 20) + (\frac{1}{2} \times 1 \times 20^2) = 200 + 200 = 600 \text{ m}`)}`,
    explainWrong: `Tunggu dulu, perhatikan baik-baik jebakan satuan. Pertama, konversi ${texi(String.raw`36 \text{ km/jam}`)} ke ${texi(String.raw`\text{m/s}`)} (dengan membaginya dengan 3.6).<br><br>Lalu gunakan dua rumus sakti GLBB kita:<br>• ${texi(String.raw`v = v_0 + at`)}<br>• ${texi(String.raw`s = v_0t + \frac{1}{2}at^2`)}`
  });
}

