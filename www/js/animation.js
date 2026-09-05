"use strict";

function apply3DTilt(element, defaultRotateX = 0, defaultRotateY = 0) {
  element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const dampen = 10;
    gsap.to(element, {
      rotateY: defaultRotateY + (x / rect.width) * dampen,
      rotateX: defaultRotateX - (y / rect.height) * dampen,
      duration: 0.3, ease: 'power2.out', overwrite: 'auto'
    });
  });
  element.addEventListener('mouseleave', () => {
    gsap.to(element, { rotateX: defaultRotateX, rotateY: defaultRotateY, duration: 1, ease: 'elastic.out(1, 0.4)' });
  });
}

function animateIn(root){
  if(!root || !root.children || !root.children.length) return;
  gsap.fromTo(root.children, {opacity:0, y:20}, {opacity:1, y:0, duration:0.6, stagger:0.08, ease:'back.out(1.2)', clearProps:'transform,opacity'});
}

function smoothUpdate(container, updateCallback) {
  const oldHeight = container.offsetHeight;
  updateCallback();
  const newHeight = container.offsetHeight;
  
  if (oldHeight > 0 && Math.abs(oldHeight - newHeight) > 2) {
    gsap.fromTo(container, 
      { height: oldHeight }, 
      { height: newHeight, duration: 0.5, ease: 'power3.out', clearProps: 'height' }
    );
  }
}


function spawnSpeedLine(stage) {
    const line = document.createElement('div');
    line.style.cssText = `position:absolute; top:${Math.random()*60 + 10}px; left:100%; width:${Math.random()*150 + 50}px; height:3px; border-radius:2px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent); z-index:5; pointer-events:none;`;
    stage.appendChild(line);
    gsap.to(line, {
        x: - (stage.clientWidth + 300),
        duration: 0.15 + Math.random() * 0.15,
        ease: 'none',
        onComplete: () => line.remove()
    });
}
function spawnExhaust(stage, x, color) {
    const p = document.createElement('div');
    p.className = 'exhaust-fire';
    p.style.cssText = `left:${x}px; bottom:${40 + Math.random()*5}px; width:${6+Math.random()*6}px; height:${6+Math.random()*6}px;`;
    stage.appendChild(p);
    gsap.to(p, {
        x: -20 - Math.random() * 40,
        y: Math.random() * 20 - 10,
        scale: Math.random() * 3 + 1,
        opacity: 0,
        duration: 0.4 + Math.random() * 0.4,
        ease: 'power1.out',
        onComplete: () => p.remove()
    });
}
function spawnDustAdv(stage, x) {
    const p = document.createElement('div');
    p.className = 'dust';
    p.style.cssText = `left:${x}px; bottom:${35 + Math.random()*5}px; width:${10+Math.random()*15}px; height:${10+Math.random()*15}px;`;
    stage.appendChild(p);
    gsap.to(p, {
        x: -30 - Math.random() * 50,
        y: Math.random() * 30 - 10,
        scale: Math.random() * 3 + 2,
        opacity: 0,
        duration: 0.6 + Math.random() * 0.6,
        ease: 'power2.out',
        onComplete: () => p.remove()
    });
}
// ===== POPUP SKOR (Survival & Duel) — nampilin "+100"/"+80" (atau "+0"
// kalau salah/waktu habis) yang muncul, naik, lalu memudar di atas angka
// skor. `elId` = id elemen skor (harus punya CSS position:relative, lihat
// .score-popup-anchor di style.css) supaya popup-nya nempel pas di
// posisinya, bukan ketarik ke pojok kiri atas layar.
function spawnScorePopup(elId, delta){
  const anchor = document.getElementById(elId);
  if(!anchor) return;
  const isPositive = delta > 0;
  const pop = document.createElement('span');
  pop.className = 'score-popup' + (isPositive ? ' positive' : ' zero');
  pop.textContent = (isPositive ? '+' : '') + delta;
  anchor.appendChild(pop);
  gsap.fromTo(pop,
    { opacity: 0, y: 6, scale: 0.7 },
    {
      opacity: 1, y: -8, scale: 1.15, duration: 0.28, ease: 'back.out(2.5)',
      onComplete: () => {
        gsap.to(pop, {
          opacity: 0, y: -34, duration: 0.55, delay: 0.35, ease: 'power1.in',
          onComplete: () => pop.remove()
        });
      }
    }
  );
}

function explodeSplash(stage, x, y, color) {
    for(let i=0; i<15; i++) {
        const p = document.createElement('div');
        p.style.cssText = `position:absolute; left:${x}px; bottom:${y}px; width:6px; height:6px; border-radius:50%; background:${color}; z-index:5;`;
        stage.appendChild(p);
        const ang = Math.random() * Math.PI; 
        const vel = 30 + Math.random() * 80;
        gsap.to(p, {
            x: Math.cos(ang) * vel,
            y: -(Math.sin(ang) * vel) - 20,
            opacity: 0,
            scale: Math.random() * 2,
            duration: 0.5 + Math.random() * 0.5,
            ease: 'power2.out',
            onComplete: () => p.remove()
        });
    }
}

