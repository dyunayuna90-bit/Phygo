"use strict";

function showScreen(name, opts){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  if(name==='home') { renderHome(); requestAnimationFrame(()=>animateIn(document.getElementById('homeScroll'))); }
  else if(name==='materi') { renderMateri(opts.level); requestAnimationFrame(()=>animateIn(document.getElementById('materiScroll'))); }
  else if(name==='simulasi'){
    wizard.level = opts.level; wizard.step = opts.step || 0; wizard.previousStep = wizard.step;
    if(wizard.step === 0){ app.calc[opts.level]=undefined; app.locked[opts.level]=undefined; app.calcChain[opts.level]={}; }
    renderWizardStep(true); 
    requestAnimationFrame(()=>{
       gsap.fromTo(els.wizardBody, {opacity:0, y:20}, {opacity:1, y:0, duration:0.5, ease:'back.out(1.2)'});
    });
  }
  document.querySelectorAll('#screen-'+name+' .scroll-pane').forEach(s=> s.scrollTop=0);
}

function navigate(name, opts, replace){ const state = Object.assign({screen:name}, opts||{}); if(replace) history.replaceState(state, '', '#'+name); else history.pushState(state, '', '#'+name); showScreen(name, opts); }
window.addEventListener('popstate', (e)=> showScreen(e.state?e.state.screen:'home', e.state));

