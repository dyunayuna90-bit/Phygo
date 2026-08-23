"use strict";

function buildFallStageHTML(H){
  return `<div class="sim-wrapper"><div class="sim-hud"><div class="sim-timer" id="stgTimer">0.00 dtk</div></div><div class="fall-stage" id="fallStage"><div class="fall-grid"></div><div class="fall-tower"></div><div class="ruler-link" style="position:absolute; left:50%; top:50px; width:60px; border-top:2px dashed rgba(255,255,255,0.2); z-index:1;"></div><div class="ruler" id="ruler" style="top:50px; bottom:20px;"></div><div class="motion-blur-tail" id="mbTail" style="top:36px; bottom:100%;"></div><div class="fall-ball" id="ball" style="top:36px;"></div><div class="ground-hit"></div></div><div class="hud-formula" id="stgHud"></div></div>`;
}
function buildRuler(H){
  const r = document.getElementById('ruler'); if(!r) return; r.innerHTML='';
  for(let i=0;i<=5;i++){ const t=document.createElement('div'); t.className='tick'; t.style.top=(i/5*100)+'%'; t.innerHTML=`<span>${fmt(H-(H*i/5),0)} m</span>`; r.appendChild(t); }
}

function renderLevel3Step(step, body){ const f = [l3Ex,l3Gr,l3Data,l3Form,l3Con,l3Alg,l3Op1,l3Op2,l3Op3,l3Sum,l3Setel,l3Run,l3Hasil,l3Quiz]; f[step](body); }

function l3Ex(body){
  const h=20, t=Math.sqrt(2*h/9.8);
  body.innerHTML = `<span class="example-tag">${svgIcon('drop')} Observasi Fenomena</span><h2>Daya Tarik Natural Bumi (20m)</h2>${buildFallStageHTML(h)}<p class="step-text">Benda logam ini ditarik secara natural ke inti bumi dengan kecepatan jatuh (gravitasi) sebesar <b>9,8 m/s²</b> tanpa ada intervensi tambahan.</p><button class="btn btn-ghost ripple-host btn-sm" id="btnReplay">Putar Ulang Observasi</button>`;
  buildRuler(h); const b=document.getElementById('ball'), stg=document.getElementById('fallStage'), tail=document.getElementById('mbTail');
  
  function play(){ 
    const fY = stg.clientHeight - 20; const fSpan = fY - 36 - 36;
    gsap.killTweensOf(b); gsap.set(b,{top:36, y:0, scaleX:1, scaleY:1}); 
    gsap.set(tail, {opacity:0, height:0});
    
    gsap.to(b, {scaleX:1.1, scaleY:0.9, duration:0.1, yoyo:true, repeat:1});

    gsap.to(b,{
      y: fSpan, duration: Math.min(t, 2.2), ease:'power2.in',
      onUpdate: function() {
         const prog = this.progress();
         if(prog > 0.2) { 
           gsap.set(tail, {opacity: prog*0.8, height: prog*80, bottom: 'auto', top: 36 + (fSpan*prog) - (prog*80)}); 
         }
      },
      onComplete: () => {
         gsap.set(tail, {opacity:0});
         explodeSplash(stg, stg.clientWidth/2, 20, 'var(--lvl3)');
         
         const bounceTl = gsap.timeline();
         bounceTl.to(b, { scaleX: 1.4, scaleY: 0.4, y: fSpan + 10, duration: 0.08, ease: "power2.inOut" })
                 .to(b, { scaleX: 0.8, scaleY: 1.2, y: fSpan - 30, duration: 0.15, ease: "power2.out" })
                 .to(b, { scaleX: 1, scaleY: 1, duration: 0.1, ease: "power1.in" }, "-=0.05")
                 .to(b, { y: fSpan, duration: 0.12, ease: "power2.in" })
                 .to(b, { scaleX: 1.1, scaleY: 0.9, y: fSpan + 3, duration: 0.06, ease: "power2.out" })
                 .to(b, { scaleX: 1, scaleY: 1, y: fSpan, duration: 0.06, ease: "power2.in" });
      }
    }); 
  }
  setTimeout(play,600); document.getElementById('btnReplay').onclick=play;
  setFooter({ backVisible:false, primaryLabel:'Lanjut Pahami Intinya', onPrimary:()=> wizardGoStep(1) });
}
function l3Gr(body){
  body.innerHTML = `<span class="eyebrow-pill">Konsep Inti</span><h2>Gravitasi = Percepatan Abstrak</h2><p class="step-text">Gravitasi Bumi adalah mesin pendorong tak terlihat yang selalu memberikan daya sebesar <b>9,8 m/s²</b> ke arah bawah. Mengingat sifatnya yang berupa "percepatan", rumus jarak GLBB sebelumnya sangat valid digunakan.</p>
  <div style="position:relative;height:240px;background:radial-gradient(circle at 50% 0%, var(--surface-c-high), var(--bg));border-radius:24px;overflow:hidden;margin-top:24px; border:1px solid rgba(255,255,255,0.05); box-shadow: inset 0 10px 20px rgba(0,0,0,0.5);"><div id="gDot" style="position:absolute;left:50%;top:20px;width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 30% 30%, #fff, var(--lvl3));transform:translateX(-50%); box-shadow: 0 5px 15px rgba(0,0,0,0.5);"></div></div>
  <button class="btn btn-ghost ripple-host btn-sm" id="btnR" style="margin-top:20px;">Uji Tarikan</button>`;
  
  const d=body.querySelector('#gDot');
  function play(){ if(!d)return; gsap.killTweensOf(d); gsap.set(d,{top:20}); gsap.to(d,{top:190,duration:1.2,ease:'power2.in'}); }
  setTimeout(play,400); body.querySelector('#btnR').onclick=play;
  setFooter({ backVisible:true, primaryLabel:'Baik, Lanjut', onPrimary:()=> wizardGoStep(1) });
}
function l3Data(body){
  const { H } = app.params[3];
  body.innerHTML = `<span class="eyebrow-pill">Misi Terakhir</span><h2>Target Parameter Gravitasi</h2><p class="step-text">Sebuah bola baja berada dalam suspensi statis di ketinggian ekstrem. Kalkulasi dengan presisi absolut pada <b>detik ke berapa</b> ia akan membentur permukaan.</p>
  ${buildFallStageHTML(H)}
  <div class="stat-chip-row"><div class="stat-chip"><span class="lbl">Ketinggian Rilis (h)</span><span class="val">${H} m</span></div><div class="stat-chip"><span class="lbl">Daya Tarik Bumi (g)</span><span class="val">9,8 m/s²</span></div></div>`;
  buildRuler(H);
  setFooter({ backVisible:true, primaryLabel:'Akses Rumus Khusus', onPrimary:()=> wizardGoStep(1) });
}
function l3Form(body){
  const { H } = app.params[3];
  body.innerHTML = `<span class="eyebrow-pill">Adaptasi Rumus</span><h2>Substitusi Simbol Simetris</h2><p class="step-text">Secara fundamental ini adalah turunan absolut dari formula jarak (${texi(String.raw`s = \frac{1}{2}at^2`)}). Kita mensubstitusi jarak horizontal (${texi(String.raw`s`)}) menjadi Ketinggian Vertikal <b>(${texi(String.raw`h`)})</b>, dan daya mesin (${texi(String.raw`a`)}) menjadi Daya Tarik <b>(${texi(String.raw`g`)})</b>.</p>
  <div class="formula-box">${tex(String.raw`h = \dfrac{1}{2} g t^2`)}</div>
  <div class="symbol-row"><div class="sym" style="color:var(--lvl3);">h</div><div class="meaning">Parameter ketinggian vertikal, yaitu <b>${H} m</b>.</div></div>
  <div class="symbol-row"><div class="sym" style="color:var(--lvl3);">g</div><div class="meaning">Konstanta tarikan bumi <b>9,8 m/s²</b>.</div></div>
  <div class="symbol-row"><div class="sym" style="background:var(--surface-c-high);">t</div><div class="meaning">Durasi waktu jatuh udara (Target kita).</div></div>`;
  setFooter({ backVisible:true, primaryLabel:'Lanjut Pahami Mekanisme', onPrimary:()=> wizardGoStep(1) });
}
function l3Con(body){
  body.innerHTML = `<span class="eyebrow-pill">Konsep Matematika</span><h2>Mekanisme Akar Kuadrat</h2><p class="step-text">Karena eksistensi pangkat dua pada (${texi(String.raw`t^2`)}), sistem mengharuskan penggunaan <b>Akar Kuadrat</b> (<span style="font-size:1.5em; display:inline-flex; vertical-align:middle; color:var(--primary); font-weight:800;">${texi(String.raw`\sqrt{\phantom{x}}`)}</span>) untuk mereduksi efeknya ke tingkat dasar.</p>
  <div class="sqrt-demo-box">
    <svg id="sqrtGrid" width="132" height="132" viewBox="0 0 132 132"></svg>
    <div class="sqrt-readout">
      <div class="sqrt-readout-item"><span class="lbl">Luas Awal</span><span class="val" id="sqrtArea">16</span></div>
      <div class="sqrt-arrow">${texi(String.raw`\sqrt{\phantom{x}}`)}</div>
      <div class="sqrt-readout-item"><span class="lbl">Panjang Sisi</span><span class="val" id="sqrtSide" style="color:var(--primary);">?</span></div>
    </div>
    <div style="font-size:14px;color:var(--on-surface-var);text-align:center;line-height:1.6;">Setiap sel grid mewakili 1 satuan luas. Akar kuadrat menyusun ulang 16 sel itu menjadi satu baris untuk menemukan panjang rusuknya: <b style="color:var(--on-surface);">4</b>.</div>
    <button class="btn btn-ghost ripple-host btn-sm" id="btnSqrtReplay">Putar Ulang Animasi</button>
  </div>`;
  initSqrtDemo();
  setFooter({ backVisible:true, primaryLabel:'Bedah Formulasi Ini', onPrimary:()=> wizardGoStep(1) });
}
function initSqrtDemo(){
  const svg=document.getElementById('sqrtGrid'), sideEl=document.getElementById('sqrtSide'), areaEl=document.getElementById('sqrtArea'), btn=document.getElementById('btnSqrtReplay');
  const n=4, cell=26, gap=4, x0=6, y0=6;
  const svgNS='http://www.w3.org/2000/svg';
  function build(){
    svg.innerHTML='';
    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        const rect=document.createElementNS(svgNS,'rect');
        rect.setAttribute('x', x0+c*(cell+gap)); rect.setAttribute('y', y0+r*(cell+gap));
        rect.setAttribute('width', cell); rect.setAttribute('height', cell); rect.setAttribute('rx', 6);
        rect.setAttribute('fill','var(--lvl3-c)'); rect.setAttribute('stroke','var(--lvl3)'); rect.setAttribute('stroke-width','2');
        rect.dataset.row=r;
        svg.appendChild(rect);
      }
    }
  }
  function play(){
    build();
    sideEl.textContent='?'; areaEl.textContent='16';
    const cells=Array.from(svg.querySelectorAll('rect'));
    const keep=cells.filter(c=>+c.dataset.row===0), drop=cells.filter(c=>+c.dataset.row!==0);
    gsap.set(cells,{opacity:0, scale:0, transformOrigin:'center'});
    const tl=gsap.timeline();
    tl.to(cells,{opacity:1, scale:1, duration:.35, stagger:{each:.02, from:'start'}, ease:'back.out(2)'});
    tl.to({},{duration:.5});
    tl.to(drop,{opacity:0, scale:0, duration:.4, stagger:.015, ease:'power1.in'});
    tl.to(keep,{scale:1.15, duration:.25, yoyo:true, repeat:1, ease:'power1.inOut', stagger:.03},'<');
    tl.call(()=>{ sideEl.textContent='4'; });
  }
  play();
  btn.onclick=play;
}
function l3Alg(body){
  const { H } = app.params[3];
  buildAlgebraWidget(body, {
    title: 'Isolasi Variabel Durasi (t)',
    terms: {
      h: `<i>h</i>`, eq: `=`, h1: `1`, hl: `<div style="height:3px; background:currentColor; width:100%;"></div>`, h2: `2`, g: `<i>g</i>`, t2: `<i>t</i><sup>2</sup>`, ll: `<div style="height:3px; background:currentColor; width:100%;"></div>`, t: `<i>t</i>`,
      root: `<svg viewBox="0 0 160 70" preserveAspectRatio="none" style="width:100%;height:100%; display:block;"><path d="M0,45 L15,45 L32,65 L50,5 L160,5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      mul1: `<span style="opacity:.4;">&times;</span>`, mul2: `<span style="opacity:.4;">&times;</span>`,
      hNum: `<b style="color:var(--lvl3);">${H}</b>`, gNum: `<b style="color:var(--lvl3);">9,8</b>`
    },
    states: [
      { h: {x:80, y:60}, eq: {x:120, y:60}, h1: {x:170, y:42}, hl: {x:170, y:60, w:20}, h2: {x:170, y:78}, mul1: {x:200, y:60, o:1}, g: {x:230, y:60}, mul2: {x:260, y:60, o:1}, t2: {x:295, y:60}, ll: {x:120, y:60, o:0, w:10}, root: {x:120, y:60, o:0, w:10, h:10}, t: {x:295, y:60, o:0}, hNum: {x:80, y:60, o:0}, gNum: {x:230, y:60, o:0} },
      { h2: {x:50, y:60, color:'var(--lvl3)'}, mul1: {x:80, y:60, o:1, color:'var(--lvl3)'}, h: {x:115, y:60}, eq: {x:155, y:60}, g: {x:195, y:60}, mul2: {x:225, y:60, o:1}, t2: {x:260, y:60}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, ll: {x:120, y:60, o:0, w:10}, root: {x:120, y:60, o:0, w:10, h:10}, t: {x:260, y:60, o:0}, hNum: {x:115, y:60, o:0}, gNum: {x:195, y:60, o:0} },
      { h2: {x:90, y:42, color:'inherit'}, mul1: {x:120, y:42, color:'inherit', o:1}, h: {x:150, y:42}, ll: {x:120, y:60, o:1, w:95}, g: {x:120, y:79, color:'var(--lvl2)'}, eq: {x:190, y:60}, t2: {x:235, y:60}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, mul2: {x:225, y:60, o:0}, root: {x:120, y:60, o:0, w:10, h:10}, t: {x:225, y:60, o:0}, hNum: {x:150, y:42, o:0}, gNum: {x:120, y:79, o:0} },
      { root: {x:140, y:60, o:1, w:150, h:105, color:'var(--lvl3)'}, h2: {x:117, y:45, color:'inherit'}, mul1: {x:147, y:45, color:'inherit', o:1}, h: {x:177, y:45}, ll: {x:147, y:62, o:1, w:85}, g: {x:147, y:81, color:'inherit'}, eq: {x:235, y:60}, t: {x:275, y:60, o:1, color:'var(--primary)'}, t2: {x:270, y:60, o:0}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, mul2: {x:225, y:60, o:0}, hNum: {x:177, y:45, o:0}, gNum: {x:147, y:81, o:0} },
      { t: {x:60, y:60, o:1, color:'var(--primary)'}, eq: {x:100, y:60}, root: {x:195, y:60, o:1, w:150, h:105, color:'inherit'}, h2: {x:172, y:45}, mul1: {x:202, y:45, o:1}, h: {x:232, y:45, o:1}, ll: {x:202, y:62, o:1, w:85}, g: {x:202, y:81, o:1}, t2: {x:270, y:60, o:0}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, mul2: {x:225, y:60, o:0}, hNum: {x:232, y:45, o:0}, gNum: {x:202, y:81, o:0} },
      { t: {x:60, y:60, o:1, color:'var(--primary)'}, eq: {x:100, y:60}, root: {x:195, y:60, o:1, w:150, h:105, color:'inherit'}, h2: {x:172, y:45}, mul1: {x:202, y:45, o:1}, ll: {x:202, y:62, o:1, w:85}, h: {x:232, y:45, o:0}, g: {x:202, y:81, o:0}, hNum: {x:232, y:45, o:1}, gNum: {x:202, y:81, o:1}, t2: {x:270, y:60, o:0}, h1: {x:160, y:42, o:0}, hl: {x:160, y:60, o:0, w:20}, mul2: {x:225, y:60, o:0} }
    ],
    ops: [ null, 'Pindahkan angka 2 silang', 'Pindahkan Gravitasi (g)', 'Aplikasi Akar Kuadrat', 'Balik Formasi Persamaan', 'Substitusi Nilai Aktual' ],
    descriptions: [
      `Rumus aslinya merepresentasikan: Ketinggian (${texi(String.raw`h`)}) = setengah <b>kali</b> gravitasi (${texi(String.raw`g`)}) <b>kali</b> durasi kuadrat (${texi(String.raw`t^2`)}). Mari kita isolasi <b>t</b>.`,
      `Translokasi angka <b>2</b> (pembagi) menyeberang. Ia otomatis berevolusi menjadi <b>pengali</b> bagi Ketinggian.`,
      `Turunkan simbol gravitasi <b>g</b> menyeberang. Ia akan menempati posisi bawah sebagai <b>pembagi sentral</b>.`,
      `Tembakkan fungsi <b>Akar Kuadrat</b> pada blok kiri guna menghapus status pangkat pada variabel waktu.`,
      `Rotasi struktur agar lebih rapi. Formulasi final penentu durasi jatuh telah siap.`,
      `Injeksi parameter fisikanya: elevasi (<b>h</b>) = <b>${H}</b>, dan konstanta gravitasi (<b>g</b>) = <b>9,8</b>. Mari kita hitung.`
    ]
  });
}
function l3Op1(body){
  const { H } = app.params[3];
  renderOperationStep(body, {
    tag:'Kalkulasi Tahap 1 / 3', stageIndex:0, stageTotal:3, title:'Penggandaan Elevasi', explainHtml:`Elevasi awal bernilai <b>${H} meter</b>. Karena rumusnya bersumber dari pecahan (1/2), kita wajib mengalikannya dengan 2.`,
    masterBefore:String.raw`t = \sqrt{\dfrac{\underbrace{\textcolor{#FFB871}{2 \times ${H}}}_{\textcolor{#FFB871}{\text{eksekusi ini}}}}{9{,}8}}`, masterAfter:(r)=> String.raw`t = \sqrt{\dfrac{\textcolor{#82DBA3}{${fmt(r,2)}}}{9{,}8}}`,
    computeLabel:`Eksekusi 2 × ${H}`, doCompute:()=> 2*H,
    whyAfterHtml:(r)=> `Hasil akumulasi blok atas adalah <b>${fmt(r,2)}</b>.`, nextLabel:'Lanjut ke Tahap 2', onNext:(r)=>{ app.calcChain[3].twoH = r; wizardGoStep(1); }
  });
}
function l3Op2(body){
  const c = app.calcChain[3]; if(c.twoH===undefined) return wizardGoStep(-1);
  renderOperationStep(body, {
    tag:'Kalkulasi Tahap 2 / 3', stageIndex:1, stageTotal:3, title:'Pembagian Gravitasional', explainHtml:`Mari distribusikan nilai <b>${fmt(c.twoH,2)}</b> ini dengan angka gravitasi universal (<b>9,8</b>).`,
    masterBefore:String.raw`t = \sqrt{\underbrace{\textcolor{#FFB871}{\dfrac{${fmt(c.twoH,2)}}{9{,}8}}}_{\textcolor{#FFB871}{\text{eksekusi ini}}}}`, masterAfter:(r)=> String.raw`t = \sqrt{\textcolor{#82DBA3}{${fmt(r,2)}}}`,
    computeLabel:`Eksekusi ${fmt(c.twoH,2)} : 9,8`, doCompute:()=> c.twoH/9.8,
    whyAfterHtml:(r)=> `Rasio yang tercetak adalah <b>${fmt(r,2)}</b>. Tahap terakhir tersisa.`, nextLabel:'Lanjut ke Tahap 3', onNext:(r)=>{ app.calcChain[3].in = r; wizardGoStep(1); }
  });
}
function l3Op3(body){
  const c = app.calcChain[3]; if(c.in===undefined) return wizardGoStep(-1);
  renderOperationStep(body, {
    tag:'Kalkulasi Tahap 3 / 3', stageIndex:2, stageTotal:3, title:'Eksekusi Akar Kuadrat', explainHtml:`Jalankan fungsi Akar Kuadrat pada angka <b>${fmt(c.in,2)}</b> guna mereduksi efek durasi ganda yang tersembunyi.`,
    masterBefore:String.raw`t = \underbrace{\textcolor{#FFB871}{\sqrt{${fmt(c.in,2)}}}}_{\textcolor{#FFB871}{\text{eksekusi ini}}}`, masterAfter:(r)=> String.raw`t = \textcolor{#82DBA3}{${fmt(r,2)}}\text{ detik}`,
    computeLabel:`Hitung √${fmt(c.in,2)}`, doCompute:()=> Math.sqrt(c.in),
    whyAfterHtml:(r)=> `Selesai! Benda tersebut diprediksi akan terhantam tanah tepat di durasi <b>${fmt(r,2)} detik</b>.`, nextLabel:'Pahami Laporan', onNext:(r)=>{ app.calc[3]=r; wizardGoStep(1); }
  });
}
function l3Sum(body){
  const { H } = app.params[3]; const t = app.calc[3]; if(t===undefined) return wizardGoStep(-1);
  body.innerHTML = `<span class="eyebrow-pill">Laporan Akhir</span><h2>Rekapitulasi Kalkulasi</h2><div class="formula-box">${tex(String.raw`t = \sqrt{\dfrac{2 \times ${H}}{9{,}8}} = ${fmt(t,2)}\text{ dtk}`)}</div><p class="step-text">Data durasi <b>${fmt(t,2)}</b> detik ini adalah parameter vital yang akan disetel pada sistem sensor waktu simulasi udara.</p>`;
  setFooter({ backVisible:true, primaryLabel:'Akses Panel Sensor', onPrimary:()=> wizardGoStep(1) });
}
function l3Setel(body){
  const tgt=app.calc[3], mX=app.params[3].ctrlMax; if(tgt===undefined) return wizardGoStep(-2);
  body.innerHTML = `<span class="eyebrow-pill">Fase Pengaturan Hardware</span><h2>Kalibrasi Sensor Pengukur Waktu</h2>
    <div class="match-row"><div class="match-card"><span class="lbl">Hitungan Sistem</span><div class="val">${fmt(tgt,2)}</div></div><div class="match-card" style="background:var(--surface-c);"><span class="lbl">Kalibrasi Sensor</span><div class="val" id="curVal" style="color:var(--lvl3)">0.00</div></div></div>
    
    <div class="stepper-row" style="margin:32px 0;">
       <button class="stepper-btn ripple-host" id="bMin" style="color:var(--on-surface-var);">–</button>
       <div class="formula-box" id="lcd" style="flex:1;margin:0;padding:24px;font-size:32px; font-family:var(--font-mono); letter-spacing:2px; font-weight:900; background:linear-gradient(135deg, #1A2166, #0A0D2E); box-shadow:inset 0 4px 10px rgba(0,0,0,0.8); border:2px solid #2C3580; color:#ffffff;">0.00 s</div>
       <button class="stepper-btn ripple-host" id="bPls" style="color:var(--lvl3);">+</button>
    </div>
    
    <div class="m3-slider-wrap"><input type="range" class="m3-slider" id="cSl" min="0" max="${mX}" step="0.01" value="0" style="filter:hue-rotate(240deg);"></div>
    <div class="match-status no" id="mSt">Modifikasi sensor menggunakan panel interaktif di atas</div>
    <button class="btn btn-ghost btn-block ripple-host btn-sm" id="bSn">Auto-Kalibrasi</button>`;
  const sl=document.getElementById('cSl'), cv=document.getElementById('curVal'), lcd=document.getElementById('lcd'), st=document.getElementById('mSt');
  function ref(){ 
    const v=parseFloat(sl.value); cv.textContent=fmt(v,2); 
    lcd.textContent=fmt(v,2)+' s'; 
    sl.style.setProperty('--pct', (v/mX*100)+'%'); 
    const mat=Math.abs(v-tgt)<=0.03; 
    st.textContent=mat?'Sirkuit Sinkron. Siap dijatuhkan!':`Deviasi sistem: ±${fmt(Math.abs(v-tgt),2)} dtk`; 
    st.className='match-status '+(mat?'yes':'no'); 
    setFooter({ backVisible:true, primaryLabel:'Kunci & Lanjut', primaryDisabled:!mat, onPrimary:()=>{ app.locked[3]=v; wizardGoStep(1); } }); 
  }
  sl.oninput=ref; document.getElementById('bMin').onclick=()=>{sl.value=clamp(parseFloat(sl.value)-0.01,0,mX).toFixed(2); ref();}; document.getElementById('bPls').onclick=()=>{sl.value=clamp(parseFloat(sl.value)+0.01,0,mX).toFixed(2); ref();}; document.getElementById('bSn').onclick=()=>{sl.value=tgt.toFixed(2); ref();}; ref();
}

function l3Run(body){
  const { H } = app.params[3], t = app.locked[3]; if(t===undefined) return wizardGoStep(-1);
  body.innerHTML = `<div class="sim-layout">${buildFallStageHTML(H)}<div class="sim-side-panel"><span class="panel-label">Sensor Durasi Aktif</span><div style="font-family:var(--font-mono);font-weight:900;font-size:36px;color:var(--lvl3); text-shadow:0 2px 8px rgba(183,192,255,0.4);">${fmt(t,2)} <span style="font-size:16px;color:var(--on-surface-var);">dtk</span></div><span class="panel-label">Trajektori Ketinggian vs Waktu</span><canvas class="mini-graph" id="graphCanvas"></canvas><div class="graph-legend"><span><i style="background:#B7C0FF"></i>Dinamika Ketinggian</span><span><i style="background:#FFB4AB;opacity:.8"></i>Prediksi Sistem</span></div></div></div>`;
  buildRuler(H);
  setFooter({ backVisible:true, primaryLabel:'Inisiasi Jatuh Bebas', onPrimary:()=> runL3(t, H) });
}

function runL3(pred, H){
  if(app.running) return; app.running=true; setFooter({ backVisible:false, primaryLabel:'Bola Dijatuhkan...', primaryDisabled:true });
  
  const g0=9.8, cT=Math.sqrt(2*H/g0), stg=document.getElementById('fallStage'), b=document.getElementById('ball'), tail=document.getElementById('mbTail'), tm=document.getElementById('stgTimer'), hud=document.getElementById('stgHud'), gr=graphCtx(document.getElementById('graphCanvas'));
  
  const aPts=[], tPts=[]; 
  const fY = stg.clientHeight - 20; 
  const fSpan = fY - 36 - 36; 
  
  gsap.set(b, { y: 0, scaleX: 1, scaleY: 1, top: 36 });
  gsap.set(tail, {opacity:0, height:0});
  
  const dur = cT; let lH=0;
  
  gsap.to(b, {scaleX:1.1, scaleY:0.9, duration:0.1, yoyo:true, repeat:1});

  gsap.to(b, {
    y: fSpan,
    duration: dur,
    ease: "power2.in",
    onUpdate: function() {
      const t = this.progress() * dur; 
      tm.textContent = fmt(t, 2) + ' dtk'; 
      
      const pF = this.progress() * this.progress() * H; 
      aPts.push({x: t, y: pF}); 
      tPts.push({x: t, y: Math.min(0.5 * g0 * t * t, H)}); 
      
      const prog = this.progress();
      if(prog > 0.2) { 
          gsap.set(tail, {opacity: prog*0.8, height: prog*80, bottom: 'auto', top: 36 + (fSpan*prog) - (prog*80)}); 
      }

      gr.ctx.clearRect(0,0,gr.w,gr.h); drawAxes(gr.ctx,gr.w,gr.h); 
      const xM = Math.max(cT, Math.max(pred, t)) * 1.15; 
      drawSeries(gr.ctx,gr.w,gr.h,tPts,xM,H*1.05,'#FFB4AB',true); 
      drawSeries(gr.ctx,gr.w,gr.h,aPts,xM,H*1.05,'#B7C0FF',false); 
      
      if(t-lH>0.15){ lH=t; hud.classList.add('show'); hud.innerHTML=texi(String.raw`h = \tfrac{1}{2} g t^2 = \tfrac{1}{2} \times 9{,}8 \times ${fmt(t,1)}^2 = ${fmt(pF,1)}\text{ m}`); } 
    },
    onComplete: function() {
      tm.textContent = fmt(cT, 2) + ' dtk'; 
      gsap.set(tail, {opacity:0});
      explodeSplash(stg, stg.clientWidth/2, 20, 'var(--lvl3)');

      const bounceTl = gsap.timeline();
      bounceTl.to(b, { scaleX: 1.4, scaleY: 0.4, y: fSpan + 10, duration: 0.08, ease: "power2.inOut" })
              .to(b, { scaleX: 0.8, scaleY: 1.2, y: fSpan - 30, duration: 0.15, ease: "power2.out" })
              .to(b, { scaleX: 1, scaleY: 1, duration: 0.1, ease: "power1.in" }, "-=0.05")
              .to(b, { y: fSpan, duration: 0.12, ease: "power2.in" })
              .to(b, { scaleX: 1.1, scaleY: 0.9, y: fSpan + 3, duration: 0.06, ease: "power2.out" })
              .to(b, { scaleX: 1, scaleY: 1, y: fSpan, duration: 0.06, ease: "power2.in" });
      
      setTimeout(() => {
        app.running = false; 
        app.lastResult = {level:3, pred, H, cT, success:Math.abs(pred-cT)<=0.15}; 
        setFooter({backVisible:true, backIcon:'replay', onBack:()=>runL3(pred,H), primaryLabel:'Lihat Laporan Akhir', onPrimary:()=>wizardGoStep(1)}); 
      }, 700);
    }
  });
}

function l3Hasil(body){
  const r=app.lastResult; if(!r||r.level!==3) return wizardGoStep(-1); app.attempts[3]++;
  renderResultStep(body, { level:3, retryStep:6, success:r.success, accuracy:clamp(100-(Math.abs(r.pred-r.cT)/r.cT)*100,0,100), varName:'t', unit:'detik', correctAnswer:fmt(r.cT,2),
    given:[['Elevasi Jatuh (h)', fmt(r.H,1)+' m'],['Intensitas Gravitasi (g)', '9,8 m/s²']], computed:fmt(r.pred,2)+' s', computedLabel:'Tebakan Sensor Durasi', target:fmt(r.cT,2)+' s', targetLabel:'Titik Hantam Aktual', diff:fmt(Math.abs(r.pred-r.cT),2)+' s',
    explainSuccess:`Presisi tingkat dewa! Modifikasi aljabar yang kamu rangkai terbukti absolut mencerminkan hukum alam semesta di dunia nyata.`,
    explainFail:`Benturan terjadi lebih cepat/lambat dari prediksi sensor. Evaluasi ulang pemecahan rumus gravitasional pada modul sebelumnya.`
  });
}

function l3Quiz(body) {
  const miniGraph = (path, color='var(--primary)') => `<svg width="40" height="30" viewBox="-5 -5 50 40" style="display:inline-block; vertical-align:middle; margin-left:8px; border-left:2px solid rgba(255,255,255,0.4); border-bottom:2px solid rgba(255,255,255,0.4); overflow:visible;"><path d="${path}" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
  
  renderQuizStep(body, {
    level: 3,
    visualHtml: `
      <div style="position:relative; width:100%; height:100%; overflow:hidden;">
         <div style="position:absolute; left:50%; top:10px; bottom:10px; width:2px; background:var(--surface-c-high); transform:translateX(-50%);"></div>
         <div style="position:absolute; left:calc(50% + 20px); top:10px; font-family:var(--font-mono); font-size:13px; color:var(--on-surface-var); font-weight:800;">${texi(String.raw`v_0 = 0`)}</div>
         <div style="position:absolute; right:10px; top:50%; transform:translateY(-50%); font-family:var(--font-mono); font-size:13px; color:var(--error); font-weight:800;">${texi(String.raw`g = 10 \text{ m/s}^2`)}</div>
         
         <div id="q3Ball" style="position:absolute; left:50%; top:10px; transform:translateX(-50%); width:24px; height:24px; border-radius:50%; background:var(--lvl3); box-shadow:0 4px 8px rgba(0,0,0,0.5);"></div>
         
         <div id="q3Label" style="position:absolute; left:calc(50% + 20px); top:80px; background:rgba(0,0,0,0.7); border:1px solid rgba(255,255,255,0.1); padding:6px 12px; border-radius:8px; opacity:0; transform:translateY(-10px);">
            <div style="font-family:var(--font-mono); font-size:14px; color:var(--on-surface); font-weight:900;">${texi(String.raw`t = 3 \text{ s}`)}</div>
            <div style="font-family:var(--font-mono); font-size:16px; color:var(--primary); font-weight:900;">${texi(String.raw`v = ?`)}</div>
         </div>
      </div>
    `,
    setupVisual: (box) => {
        const ball = box.querySelector('#q3Ball');
        const label = box.querySelector('#q3Label');
        const tl = gsap.timeline({repeat:-1, repeatDelay:1.5});
        tl.to(ball, {top: '80px', duration: 1.5, ease:'power2.in'})
          .to(label, {opacity:1, y:0, duration:0.3, ease:'back.out(2)'})
          .to({}, {duration: 1.5}); 
    },
    question: `Sebuah bola besi dijatuhkan bebas dari atas gedung pencakar langit tanpa dorongan awal (${texi(String.raw`v_0 = 0`)}). Mengabaikan gaya gesek udara, jika efek gravitasi bumi diasumsikan konstan ${texi(String.raw`g = 10 \text{ m/s}^2`)}, tentukan kecepatan jatuh bola tepat pada detik ke-3 (${texi(String.raw`t = 3 \text{ s}`)}), beserta bentuk grafik Kecepatan vs Waktu (${texi(String.raw`v-t`)})!`,
    options: [
      { html: `<span class="quiz-opt-label">${texi(String.raw`30 \text{ m/s}`)} (Grafik Lurus Diagonal Naik)</span> ${miniGraph("M0,30 L40,0", "var(--lvl3)")}` },
      { html: `<span class="quiz-opt-label">${texi(String.raw`10 \text{ m/s}`)} (Grafik Lurus Mendatar)</span> ${miniGraph("M0,15 L40,15", "var(--error)")}` },
      { html: `<span class="quiz-opt-label">${texi(String.raw`45 \text{ m/s}`)} (Grafik Melengkung ke Atas)</span> ${miniGraph("M0,30 Q30,30 40,0", "var(--lvl2)")}` },
      { html: `<span class="quiz-opt-label">${texi(String.raw`30 \text{ m/s}`)} (Grafik Melengkung ke Atas)</span> ${miniGraph("M0,30 Q30,30 40,0", "var(--error)")}` }
    ],
    correctIdx: 0,
    explainCorrect: `Bingo! Kecepatan jatuh (${texi(String.raw`v`)}) bertambah secara proporsional setiap detiknya akibat gravitasi universal. Kita gunakan rasio:<br>${tex(String.raw`v = v_0 + (g \times t) = 0 + (10 \times 3) = 30 \text{ m/s}`)}<br>Karena percepatannya tetap, laju grafik kecepatannya membetuk garis lurus miring vertikal (linear naik).`,
    explainWrong: `Mari telaah bersama. Pada gerak jatuh bebas murni, kecepatannya bertambah secara proporsional dan akumulatif akibat ditarik gravitasi (${texi(String.raw`v = g \times t`)}). Karena kekuatan tarikannya bersifat konstan (${texi(String.raw`10 \text{ m/s}^2`)}), kecepatannya bertambah stabil (garis lurus menanjak memanjang), bukan eksponensial (melengkung).`
  });
}

