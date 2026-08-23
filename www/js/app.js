"use strict";

// Init tombol exit wizard (butuh els dari state.js + svgIcon dari helpers.js + goToDashboard dari screens.js)
if(els.wizExit){ els.wizExit.innerHTML = svgIcon('doorExit'); els.wizExit.onclick = goToDashboard; }

// Entry point — dijalankan setelah semua module lain ke-load
history.replaceState({screen:'home'}, '', '#home'); showScreen('home');
