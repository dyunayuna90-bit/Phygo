"use strict";

function tex(str){ try{ return katex.renderToString(str, { throwOnError:false, displayMode:true }); } catch(e){ return str; } }
function texi(str){ try{ return katex.renderToString(str, { throwOnError:false, displayMode:false }); } catch(e){ return str; } }
function fmt(n, d){ return Number(n).toFixed(d===undefined?2:d); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function rand(a,b){ return a + Math.random()*(b-a); }
function roundTo(v, step){ return Math.round(v/step)*step; }

// ===== Tema Tampilan =====
const THEME_KEY = 'phygo_theme';
const THEME_LIST = ['cyan', 'pink', 'coklat'];
function getTheme(){ try{ const t = localStorage.getItem(THEME_KEY); return THEME_LIST.includes(t) ? t : 'cyan'; }catch(e){ return 'cyan'; } }
function setTheme(t){
  if(!THEME_LIST.includes(t)) t = 'cyan';
  try{ localStorage.setItem(THEME_KEY, t); }catch(e){}
  document.documentElement.setAttribute('data-theme', t);
}

function svgIcon(name){
  const icons = {
    speed: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M12 12L16 8"/><path d="M12 7v1"/></svg>',
    accel: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M6 19V13"/><path d="M12 19V9"/><path d="M18 19V5"/></svg>',
    drop: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v9"/><path d="M8 8l4 4 4-4"/><path d="M5 19h14"/></svg>',
    checkSm: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    check: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    cross: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    arrowBack: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    doorExit: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    replay: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    swap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h13l-4-4"/><path d="M17 17H4l4 4"/></svg>',
    lock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="3" ry="3"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    unlock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="3" ry="3"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
    heart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/></svg>',
    mapRoute: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M6 8.2V12a4 4 0 0 0 4 4h1a4 4 0 0 1 4 4v-.2"/></svg>',
    gear: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.5H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    fire: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"><path d="M12 2c1 3-2.5 4.2-2.5 7.3A3.5 3.5 0 0 0 13 12.8c2 0 3.5-1.5 3.5-3.5 1.6 1.6 2.5 3.6 2.5 5.7 0 4-3.6 7-7 7s-7-2.7-7-6.5C4.2 10.3 8 7.6 8 4.8c1.3 1 2 2.3 2 2.3C10.3 4.8 10.8 3 12 2Z"/></svg>',
    trophy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H4.5a1 1 0 0 0-1 1.1c.3 2.6 1.8 4.4 4.5 4.8"/><path d="M16 5h3.5a1 1 0 0 1 1 1.1c-.3 2.6-1.8 4.4-4.5 4.8"/><path d="M12 13v3"/><path d="M8.5 20h7"/><path d="M9.5 16.5 8.5 20"/><path d="M14.5 16.5l1 3.5"/></svg>',
    quote: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M9.5 6C6 6.8 4 9.6 4 13.3c0 2.5 1.5 4.2 3.6 4.2 1.8 0 3.1-1.3 3.1-3 0-1.6-1.1-2.8-2.6-2.9.3-1.8 1.6-3.1 3.4-3.6L9.5 6Zm9 0c-3.5.8-5.5 3.6-5.5 7.3 0 2.5 1.5 4.2 3.6 4.2 1.8 0 3.1-1.3 3.1-3 0-1.6-1.1-2.8-2.6-2.9.3-1.8 1.6-3.1 3.4-3.6L18.5 6Z"/></svg>',
    palette: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 0-18c4.6 0 8.5 3.3 9 7.7.3 2.6-1.6 4.3-3.8 4.3h-2a2 2 0 0 0-1.4 3.4c.5.5.3 1.4-.4 1.6-.4.1-.9.2-1.4.2Z"/><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    trash: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    download: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19.5h16"/></svg>',
    upload: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M4 19.5h16"/></svg>',
    info: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r="0.2" fill="currentColor"/></svg>',
    chevronRight: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    bell: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>',
    playCircle: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10.5 9l4.5 3-4.5 3V9Z" fill="currentColor" stroke="none"/></svg>',
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4.5c0-.98 1.08-1.58 1.9-1.06l11.4 7.5a1.25 1.25 0 0 1 0 2.12l-11.4 7.5c-.82.52-1.9-.08-1.9-1.06V4.5Z"/></svg>',
    code: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l-6-6 6-6"/><path d="M15 6l6 6-6 6"/></svg>',
    users: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    history: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v13"/><path d="M4 6a2 2 0 0 1 2-2h6v15H6a2 2 0 0 1-2-2V6Z"/><path d="M20 6a2 2 0 0 0-2-2h-6v15h6a2 2 0 0 1 2 2V6Z"/></svg>',
    undo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    image: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
  };
  return icons[name] || '';
}

document.addEventListener('pointerdown', (e)=>{
  const host = e.target.closest('.ripple-host');
  if(!host || host.disabled) return;
  const rect = host.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.width = r.style.height = size+'px';
  r.style.left = (e.clientX - rect.left - size/2)+'px';
  r.style.top = (e.clientY - rect.top - size/2)+'px';
  host.appendChild(r);
  setTimeout(()=> r.remove(), 600);
});
