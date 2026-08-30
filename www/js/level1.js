"use strict";

function renderLevel1Step(step, body){ const f = [l1Ex,l1Basics,l1SpeedIntro,l1Data,l1Formula,l1Op,l1Sum,l1Setel,l1Run,l1Hasil,l1Quiz]; f[step](body); }

function l1Ex(body){
  const v=10, t=5, s=v*t;
  body.innerHTML = `<span class="example-tag">${svgIcon('speed')} Mari Perhatikan</span><h2>Mobil melaju stabil 10 m/s selama 5 detik</h2>${buildRoadStageHTML('#5FE1E2','#063B3C',false)}<p class="step-text">Kecepatannya tetap dari awal sampai akhir. Amati pergerakannya yang halus tanpa hentakan.</p><button class="btn btn-ghost ripple-host btn-sm" id="btnReplay">Putar Ulang Simulasi</button>`;
  const mToPx=layoutRoadStage(s, s*1.4);
  document.getElementById('stgGate').style.opacity='.4'; document.getElementById('stgGateLabel').textContent='';
  const car=document.getElementById('stgCar'), carWrap=document.getElementById('stgCarWrap'), sh=document.getElementById('stgShadow'), tm=document.getElementById('stgTimer');
  
  function play(){ 
    gsap.set([car,sh], {x:0, left: 10});
    const wheels=document.querySelectorAll('.wheel');
    if(tm) tm.textContent = fmt(0,1)+' dtk';
    
    gsap.to(carWrap, {rotation: -1.5, y: -1, duration: 0.2, ease: 'power2.out'})
        .then(()=> gsap.to(carWrap, {rotation: 0, y: 0, duration: 0.4, ease:'power1.inOut'}));
    
    const tX = mToPx(s) - 46; 
    
    gsap.to([car,sh], { x: tX, duration: 1.8, ease:'none', onUpdate:function(){
      const p = this.progress();
      if(tm) tm.textContent = fmt(p*t,1)+' dtk';
      if(p > 0.1 && p < 0.9 && Math.random() > 0.6) spawnDustAdv(document.getElementById('roadStage'), 10 + gsap.getProperty(car, 'x') + 10);
      wheels.forEach(w => w.style.transform = `rotate(${p * 1080}deg)`);
    }, onComplete:()=>{
      if(tm) tm.textContent = fmt(t,1)+' dtk';
      gsap.to(carWrap, {rotation: 4, y: 1.5, duration: 0.2, ease: 'power1.in'})
          .then(()=> gsap.to(carWrap, {rotation: 0, y: 0, duration: 0.4, ease:'back.out(2)'}));
    }}); 
  }
  setTimeout(play, 500); document.getElementById('btnReplay').onclick=play;
  setFooter({ backVisible:false, primaryLabel:'Baik, Mengerti', onPrimary:()=> wizardGoStep(1) });
}
function l1Basics(body){
  body.innerHTML = `<span class="eyebrow-pill">Langkah Dasar</span><h2>Mengenal Jarak & Waktu</h2>
    <div style="margin-top:16px;"><div class="mini-track-label">Jarak tempuh (s)</div><div style="position:relative;height:56px;background:linear-gradient(to right, var(--surface-c-high), var(--surface-c));border-radius:16px;overflow:hidden;box-shadow:inset 0 4px 8px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.05);"><div id="rulerBar" style="position:absolute;left:0;top:0;bottom:0;width:0%;background:linear-gradient(90deg, var(--primary-container), var(--primary));border-radius:16px;box-shadow:inset 0 -2px 4px rgba(0,0,0,0.3);"></div><div id="rulerLabel" style="position:absolute;right:20px;top:50%;transform:translateY(-50%);font-family:var(--font-mono);font-weight:900;font-size:20px;text-shadow:0 2px 4px rgba(0,0,0,0.8);">0 m</div></div></div>
    <div style="margin-top:32px;"><div class="mini-track-label">Waktu tempuh (t)</div><div style="display:flex;align-items:center;gap:24px;"><div style="position:relative; width:64px; height:64px;"><svg width="64" height="64" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="var(--surface-c)" stroke="var(--outline-var)" stroke-width="4"/><line id="clockHand" x1="20" y1="20" x2="20" y2="6" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="20" r="3" fill="var(--primary)"/></svg></div><div id="clockLabel" style="font-family:var(--font-mono);font-weight:900;font-size:26px;color:var(--primary);text-shadow:0 2px 4px rgba(0,0,0,0.5);">0 detik</div></div></div>
    <button class="btn btn-ghost ripple-host btn-sm" id="btnReplay" style="margin-top:24px;">Putar Ulang Animasi</button>
    <p class="step-text" style="margin-top:24px;">Kita akan diberikan target <b>Jarak</b> dan <b>Waktu</b>. Tugas kita adalah mengkalkulasi kecepatannya.</p>`;
  
  const rb=body.querySelector('#rulerBar'), rl=body.querySelector('#rulerLabel'), ch=body.querySelector('#clockHand'), cl=body.querySelector('#clockLabel');
  function play(){ const st={m:0,s:0}; gsap.killTweensOf(st); gsap.to(st,{m:50,s:5,duration:2.5,ease:'none',onUpdate:()=>{ if(!rb)return; rb.style.width=(st.m/50*100)+'%'; rl.textContent=fmt(st.m,0)+' m'; ch.setAttribute('transform',`rotate(${st.s/5*360},20,20)`); cl.textContent=fmt(st.s,1)+' dtk'; }}); }
  setTimeout(play,400); body.querySelector('#btnReplay').onclick=play;
  setFooter({ backVisible:true, primaryLabel:'Lanjut', onPrimary:()=> wizardGoStep(1) });
}
function l1SpeedIntro(body){
  body.innerHTML = `<span class="eyebrow-pill">Langkah Dasar</span><h2>Kecepatan Tetap = Stabil</h2><p class="step-text">Setiap detik, jarak yang ditempuh selalu proporsional. Mari perhatikan perbedaannya.</p><div style="margin-top:20px;"><div class="mini-track-label">GLB Stabil (Fokus kita)</div><div class="mini-track" style="height:48px;"><div class="mini-dot" id="dotConst" style="background:var(--primary);"></div></div></div><div style="margin-top:24px;"><div class="mini-track-label">Kecepatan Berubah (Bukan GLB)</div><div class="mini-track" style="height:48px;"><div class="mini-dot" id="dotVary" style="background:var(--outline); opacity:0.7;"></div></div></div><button class="btn btn-ghost ripple-host btn-sm" id="btnReplayCmp" style="margin-top:24px;">Putar Ulang Perbandingan</button>`;
  
  const dc=body.querySelector('#dotConst'), dv=body.querySelector('#dotVary');
  function play(){ if(!dc||!dv)return; gsap.set([dc,dv],{x:0}); gsap.to(dc,{x:els.wizardBody.clientWidth * 0.88 - 34, duration:2,ease:'none'}); gsap.to(dv,{x:els.wizardBody.clientWidth * 0.88 - 34, duration:2,ease:'power3.in'}); }
  setTimeout(play,400); body.querySelector('#btnReplayCmp').onclick=play;
  setFooter({ backVisible:true, primaryLabel:'Lanjut', onPrimary:()=> wizardGoStep(1) });
}
function l1Data(body){
  const { S, T } = app.params[1];
  body.innerHTML = `<span class="eyebrow-pill">Mari Mencoba</span><h2>Tugas Kalkulasi Kamu</h2><p class="step-text">Kendaraan ini harus menyeberangi area tepat pada waktu yang ditentukan. Tidak boleh terlalu cepat, tidak boleh terlambat.</p>
  ${buildRoadStageHTML('#5FE1E2','#063B3C',false)}
  <div class="stat-chip-row"><div class="stat-chip"><span class="lbl">Panjang Trek</span><span class="val">${S} m</span></div><div class="stat-chip"><span class="lbl">Batas Waktu</span><span class="val">${T} dtk</span></div></div>`;
  layoutRoadStage(S, S*1.2);
  setFooter({ backVisible:true, primaryLabel:'Lihat Rumus', onPrimary:()=> wizardGoStep(1) });
}
function l1Formula(body){
  const { S, T } = app.params[1];
  body.innerHTML = `<span class="eyebrow-pill">Mengenal Rumus</span><h2>Rumus GLB Dasar</h2><div class="formula-box">${tex(String.raw`v = \dfrac{s}{t}`)}</div>
    <div class="symbol-row"><div class="sym">v</div><div class="meaning">Kecepatan kendaraan (target pencarian kita).</div></div>
    <div class="symbol-row"><div class="sym">s</div><div class="meaning">Jarak target, yaitu <b>${S} m</b>.</div></div>
    <div class="symbol-row"><div class="sym">t</div><div class="meaning">Waktu yang diberikan, yaitu <b>${T} dtk</b>.</div></div>
    <p class="step-text" style="margin-top:24px; text-align:center; font-weight:500;">Karena gerakannya stabil, kita cukup membagi jarak dengan waktunya secara langsung.</p>`;
  setFooter({ backVisible:true, primaryLabel:'Mulai Menghitung', onPrimary:()=> wizardGoStep(1) });
}
function l1Op(body){
  const { S, T } = app.params[1];
  renderOperationStep(body, {
    tag:'Proses Kalkulasi', title:'Membagi Jarak dengan Waktu',
    explainHtml:`Mari kita membagi jarak trek <b>${S} meter</b> dengan batas waktu <b>${T} detik</b>.`,
    masterBefore:`v = \\underbrace{\\textcolor{#FFB871}{\\dfrac{${S}}{${T}}}}_{\\textcolor{#FFB871}{\\text{hitung ini}}}`,
    masterAfter:(r)=> `v = \\textcolor{#82DBA3}{${fmt(r,2)}}\\text{ m/s}`,
    computeLabel:`Eksekusi Pembagian ${S} : ${T}`, doCompute:()=> S/T,
    whyAfterHtml:(r)=> `Kalkulasi Selesai! Kendaraan harus disetel melaju pada kecepatan <b>${fmt(r,2)} m/s</b>.`,
    nextLabel:'Lanjut Konfirmasi', onNext:(r)=>{ app.calc[1]=r; wizardGoStep(1); }
  });
}
function l1Sum(body){
  const v = app.calc[1]; if(v===undefined) return wizardGoStep(-1);
  body.innerHTML = `<span class="eyebrow-pill">Kesimpulan</span><h2>Ringkasan Kalkulasi</h2><div class="formula-box">${tex(String.raw`v = ${fmt(v,2)}\text{ m/s}`)}</div><p class="step-text">Ini adalah hasil perhitungan presisi kamu. Sekarang kita akan menyetel mesin kendaraan sesuai dengan angka ini untuk pembuktian.</p>`;
  setFooter({ backVisible:true, primaryLabel:'Setel Mesin Kendaraan', onPrimary:()=> wizardGoStep(1) });
}
function l1Setel(body){
  const tgt=app.calc[1], mX=app.params[1].ctrlMax; if(tgt===undefined) return wizardGoStep(-2);
  body.innerHTML = `<span class="eyebrow-pill">Persiapan Akhir</span><h2>Setel Kecepatan (Throttle)</h2>
    <div class="match-row"><div class="match-card"><span class="lbl">Hasil Hitungan</span><div class="val">${fmt(tgt,1)}</div></div><div class="match-card" style="background:var(--surface-c);"><span class="lbl">Sensor Mesin</span><div class="val" id="curVal" style="color:var(--primary)">0.0</div></div></div>
    
    <div style="display:flex; justify-content:center; margin: 24px 0;">
      <div style="position:relative; width:260px; height:140px; background:radial-gradient(ellipse at bottom, #1A2224, transparent); border-radius:130px 130px 0 0; border:2px solid #2A363A; border-bottom:none; display:flex; justify-content:center; align-items:flex-end; padding-bottom:10px; box-shadow:inset 0 10px 20px rgba(0,0,0,0.8);">
        <svg width="240" height="130" viewBox="0 -25 200 125" style="position:absolute; bottom:10px;">
          <path d="M10 90 A90 90 0 0 1 190 90" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="12" stroke-linecap="butt" stroke-dasharray="4 8"/>
          <path d="M10 90 A90 90 0 0 1 190 90" fill="none" stroke="var(--primary)" stroke-width="12" stroke-linecap="butt" stroke-dasharray="283" stroke-dashoffset="283" id="gaugeArc" style="transition: stroke-dashoffset 0.1s linear;"/>
          <g id="needle" style="transform-origin: 100px 90px; transition: transform 0.1s linear;">
            <path d="M96 90 L100 15 L104 90 Z" fill="#fff"/>
            <circle cx="100" cy="90" r="8" fill="#111" stroke="#fff" stroke-width="3"/>
          </g>
        </svg>
      </div>
    </div>

    <div class="m3-slider-wrap"><input type="range" class="m3-slider" id="ctrlSlider" min="0" max="${mX}" step="0.1" value="0"></div>
    <div class="match-status no" id="matchStatus">Geser tuas gas (throttle) agar nilainya presisi</div>
    <button class="btn btn-ghost btn-block ripple-host btn-sm" id="btnSnap">Sinkronkan Otomatis</button>`;
  const sl=document.getElementById('ctrlSlider'), cv=document.getElementById('curVal'), n=document.getElementById('needle'), arc=document.getElementById('gaugeArc'), st=document.getElementById('matchStatus'), tol=Math.max(0.15, mX*0.015);
  function update(v){ const p=clamp(v/mX,0,1); sl.style.setProperty('--pct',(p*100)+'%'); n.style.transform=`rotate(${-90+p*180}deg)`; arc.style.strokeDashoffset=283-p*283; }
  function ref(){ const v=parseFloat(sl.value); cv.textContent=fmt(v,1); update(v); const mat=Math.abs(v-tgt)<=tol; st.textContent=mat?'Kalibrasi Sempurna!':'Selisih '+fmt(Math.abs(v-tgt),1)+' m/s'; st.className='match-status '+(mat?'yes':'no'); setFooter({ backVisible:true, primaryLabel:'Kunci & Konfirmasi', primaryDisabled:!mat, onPrimary:()=>{ app.locked[1]=v; wizardGoStep(1); } }); }
  sl.oninput=ref; document.getElementById('btnSnap').onclick=()=>{sl.value=tgt.toFixed(1); ref();}; ref();
}

function l1Run(body){
  const { S, T } = app.params[1]; const v = app.locked[1]; if(v===undefined) return wizardGoStep(-1);
  const mMax=Math.max(S*1.5,S+40);
  body.innerHTML = `<div class="sim-layout">${buildRoadStageHTML('#5FE1E2','#063B3C',false)}<div class="sim-side-panel"><span class="panel-label">Kecepatan Dikonfigurasi</span><div style="font-family:var(--font-mono);font-weight:900;font-size:36px;color:var(--primary);">${fmt(v,1)} <span style="font-size:16px;color:var(--on-surface-var);">m/s</span></div><span class="panel-label">Grafik Linier Jarak vs Waktu</span><canvas class="mini-graph" id="graphCanvas"></canvas><div class="graph-legend"><span><i style="background:#5FE1E2"></i>Jarak Tempuh</span><span><i style="background:#FFB4AB;opacity:.8"></i>Batas Target</span></div></div></div>`;
  const mToPx=layoutRoadStage(S, mMax);
  setFooter({ backVisible:true, primaryLabel:'Jalankan Simulasi', onPrimary:()=> runL1(v, S, T, mToPx) });
}

function runL1(v, S, T, mToPx){
  if(app.running) return; app.running=true; setFooter({ backVisible:false, primaryLabel:'Memproses Simulasi...', primaryDisabled:true });
  const car=document.getElementById('stgCar'), carWrap=document.getElementById('stgCarWrap'), sh=document.getElementById('stgShadow'), tm=document.getElementById('stgTimer'), hud=document.getElementById('stgHud'), gr=graphCtx(document.getElementById('graphCanvas'));
  const pL2=document.getElementById('pxL2'), pL3=document.getElementById('pxL3');
  
  gsap.set([car,sh],{x:0, left:10});
  gsap.set([pL2,pL3],{backgroundPositionX:0});
  
  const dist=v*T, dur=T, pts=[]; let lD=0, lH=0;
  const tX = mToPx(dist) - 46; 
  const wheelsL1=document.querySelectorAll('#stgCar .wheel');
  
  gsap.to(carWrap, {rotation: -2, y: -1, duration: 0.2, ease: 'power2.out'})
      .then(()=> gsap.to(carWrap, {rotation: 0, y: 0, duration: 0.4, ease:'power1.inOut'}));
  
  const tl=gsap.timeline({onComplete:()=>{ 
    app.running=false; 
    tm.textContent = fmt(T,1)+' dtk';
    pts.push({x:T, y:dist});
    gr.ctx.clearRect(0,0,gr.w,gr.h); drawAxes(gr.ctx,gr.w,gr.h);
    drawSeries(gr.ctx,gr.w,gr.h,[{x:0,y:S},{x:T,y:S}],T,Math.max(S,dist)*1.15,'#FFB4AB',true);
    drawSeries(gr.ctx,gr.w,gr.h,pts,T,Math.max(S,dist)*1.15,'#5FE1E2',false);
    hud.classList.add('show'); hud.innerHTML=texi(String.raw`s = v \times t = ${fmt(v,1)} \times ${fmt(T,1)} = ${fmt(dist,1)}\text{ m}`);
    gsap.to(carWrap, {rotation: 4, y: 1.5, duration: 0.2, ease: 'power1.in'})
        .then(()=> gsap.to(carWrap, {rotation: 0, y: 0, duration: 0.4, ease:'back.out(2)'}));
    
    app.lastResult={level:1, v, S, T, dist, success:Math.abs(dist-S)<=Math.max(3,S*0.05)}; 
    setFooter({backVisible:true, backIcon:'replay', onBack:()=>runL1(v,S,T,mToPx), primaryLabel:'Lihat Laporan Akhir', onPrimary:()=>wizardGoStep(1)}); 
  }});
  
  const animDur = dur * 0.45;
  tl.to([car,sh], {x:tX, duration:animDur, ease:'none'});
  
  tl.to({}, {duration:animDur, onUpdate:function(){ 
    const p=this.progress(), t=p*T, s=v*t; tm.textContent=fmt(t,1)+' dtk'; pts.push({x:t,y:s}); 
    
    pL2.style.backgroundPositionX = -(s * 2) + 'px';
    pL3.style.backgroundPositionX = -(s * 0.5) + 'px';
    
    wheelsL1.forEach(w => w.style.transform = `rotate(${p * 360 * (dist/20)}deg)`);

    gr.ctx.clearRect(0,0,gr.w,gr.h); drawAxes(gr.ctx,gr.w,gr.h); 
    drawSeries(gr.ctx,gr.w,gr.h,[{x:0,y:S},{x:T,y:S}],T,Math.max(S,dist)*1.15,'#FFB4AB',true); 
    drawSeries(gr.ctx,gr.w,gr.h,pts,T,Math.max(S,dist)*1.15,'#5FE1E2',false); 
    
    if(t-lH>0.15){ lH=t; hud.classList.add('show'); hud.innerHTML=texi(String.raw`s = v \times t = ${fmt(v,1)} \times ${fmt(t,1)} = ${fmt(s,1)}\text{ m}`); } 
    if(t-lD>0.15){ lD=t; spawnDustAdv(document.getElementById('roadStage'), 10 + gsap.getProperty(car, 'x') + 15); } 
  }}, 0);
}

function l1Hasil(body){
  const r=app.lastResult; if(!r||r.level!==1) return wizardGoStep(-1); app.attempts[1]++;
  renderResultStep(body, { level:1, retryStep:4, success:r.success, accuracy:clamp(100-(Math.abs(r.dist-r.S)/r.S)*100,0,100), varName:'v', unit:'m/s', correctAnswer:fmt(r.S/r.T,2),
    given:[['Kecepatan Mesin Disetel', fmt(r.v,1)+' m/s'],['Batas Waktu Eksekusi', fmt(r.T,1)+' dtk']], computed:fmt(r.dist,1)+' m', computedLabel:'Jarak Aktual yang Ditempuh', target:fmt(r.S,1)+' m', targetLabel:'Jarak Target Zona', diffValue:Math.abs(r.dist-r.S), diffUnit:'m', diffDecimals:1,
    explainSuccess:`Luar biasa! Karena gerakannya stabil tanpa percepatan, membagi jarak murni dengan waktu akan selalu memberikan kalibrasi yang absolut.`,
    explainFail:`Simulasi menunjukkan ketidaktepatan pendaratan. Pastikan kamu hanya membagi jarak dengan waktu tanpa intervensi variabel lain.`
  });
}

function l1Quiz(body) {
  const miniGraph = (path, color='var(--primary)') => `<svg width="40" height="30" viewBox="-5 -5 50 40" style="display:inline-block; vertical-align:middle; margin-left:8px; border-left:2px solid rgba(255,255,255,0.4); border-bottom:2px solid rgba(255,255,255,0.4); overflow:visible;"><path d="${path}" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;

  renderQuizStep(body, {
    level: 1,
    visualHtml: `
      <div style="position:relative; width:100%; height:100%; overflow:hidden; border-radius:12px; background:var(--surface);">
        <div style="position:absolute; bottom:20px; left:0; right:0; height:4px; background:var(--surface-c-high);"></div>
        <div id="q1Car" style="position:absolute; bottom:24px; left:10px; width:48px; height:20px; background:var(--primary); border-radius:8px 12px 4px 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.5);"></div>
        <div style="position:absolute; bottom:24px; right:30px; width:12px; height:36px; background:repeating-linear-gradient(45deg, var(--error) 0, var(--error) 4px, #fff 4px, #fff 8px); border-radius:4px;"></div>
        <div style="position:absolute; top:16px; left:10px; font-family:var(--font-mono); color:var(--primary); font-weight:800; font-size:14px;">${texi(String.raw`v = 30`)} m/s</div>
        <div style="position:absolute; top:16px; right:10px; font-family:var(--font-mono); color:var(--error); font-weight:800; font-size:14px;">${texi(String.raw`s = 120`)} m</div>
        <div id="q1Time" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-family:var(--font-mono); font-size:24px; font-weight:900; color:var(--on-surface); background:rgba(0,0,0,0.6); padding:4px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">${texi(String.raw`t = ?`)}</div>
      </div>
    `,
    setupVisual: (box) => {
        const car = box.querySelector('#q1Car');
        const maxDist = box.clientWidth - 80;
        gsap.to(car, {x: maxDist, duration: 2.5, ease: 'none', repeat: -1, repeatDelay: 0.5});
    },
    question: `Sebuah mobil melaju di jalan tol dengan kecepatan konstan yang disetel pada ${texi(String.raw`v = 30 \text{ m/s}`)}. Sensor radar mendeteksi adanya zona perbaikan jalan pada jarak ${texi(String.raw`s = 120 \text{ m}`)} di depan. Jika mobil tidak mengerem dan tetap melaju stabil, dalam berapa detik (${texi(String.raw`t = ?`)}) mobil tersebut akan menabrak zona perbaikan, dan bagaimana bentuk grafik Jarak vs Waktu (${texi(String.raw`s-t`)}) yang merekam kejadian tersebut?`,
    options: [
      { html: `<span class="quiz-opt-label">${texi(String.raw`4 \text{ s}`)} (Grafik Lurus Diagonal Naik)</span> ${miniGraph("M0,30 L40,0", "var(--primary)")}` },
      { html: `<span class="quiz-opt-label">${texi(String.raw`4 \text{ s}`)} (Grafik Melengkung ke Atas)</span> ${miniGraph("M0,30 Q30,30 40,0", "var(--lvl2)")}` },
      { html: `<span class="quiz-opt-label">${texi(String.raw`3 \text{ s}`)} (Grafik Lurus Diagonal Naik)</span> ${miniGraph("M0,30 L40,0", "var(--primary)")}` },
      { html: `<span class="quiz-opt-label">${texi(String.raw`4 \text{ s}`)} (Grafik Lurus Mendatar)</span> ${miniGraph("M0,15 L40,15", "var(--error)")}` },
      { html: `<span class="quiz-opt-label">${texi(String.raw`3 \text{ s}`)} (Grafik Diagonal Turun)</span> ${miniGraph("M0,0 L40,30", "var(--lvl3)")}` }
    ],
    correctIdx: 0,
    explainCorrect: `Luar biasa! Waktu dicari dengan rasio ${texi(String.raw`t = \frac{s}{v} = \frac{120}{30} = 4 \text{ s}`)}. Karena kecepatannya konstan (GLB), grafiknya linear berupa garis lurus mendaki, tidak melengkung eksponensial.`,
    explainWrong: `Gunakan rumus dasar GLB: ${texi(String.raw`s = v \times t`)}. Maka persamaannya ${texi(String.raw`120 = 30 \times t`)}. Selain itu, grafik GLB (${texi(String.raw`s-t`)}) berbentuk linear (garis lurus menanjak), bukan eksponensial (melengkung) ataupun mendatar.`
  });
}

