"use strict";

// ===== Konfigurasi Firebase (project: phygo-online) =====
// Config ini AMAN buat nempel di kode frontend — bukan rahasia/API secret,
// keamanan sebenarnya diatur lewat Firestore Security Rules & Auth, bukan
// dengan menyembunyikan angka-angka ini.
const firebaseConfig = {
  apiKey: "AIzaSyDKRNnOz_S2wBZyHsVNapERuKzF1a9x2lY",
  authDomain: "phygo-online.firebaseapp.com",
  projectId: "phygo-online",
  storageBucket: "phygo-online.firebasestorage.app",
  messagingSenderId: "694258853070",
  appId: "1:694258853070:web:1da8bbc1f925391ad75c9f"
};

firebase.initializeApp(firebaseConfig);
if (window.phygoLog) window.phygoLog('FIREBASE', 'initializeApp OK, projectId=' + firebaseConfig.projectId);

// Dipakai di seluruh app.js/auth.js/dst — satu instance global, bukan
// di-import ulang tiap file (biar konsisten sama pola project ini yang
// pakai plain <script> tag, bukan ES module).
const fbAuth = firebase.auth();
const db = firebase.firestore();

// Biar app tetap kepake pas offline sebentar (misal sinyal lemot) —
// Firestore otomatis nge-cache & sync ulang begitu online lagi.
db.enablePersistence({ synchronizeTabs: true }).then(() => {
  if (window.phygoLog) window.phygoLog('FIREBASE', 'Firestore persistence AKTIF');
}).catch((err) => {
  // Gagal enable persistence itu ga fatal (misal browser lama / private
  // mode) — app tetap jalan, cuma ga ada cache offline.
  console.warn("Firestore persistence gagal diaktifkan:", err.code);
  if (window.phygoLog) window.phygoLog('FIREBASE', 'Firestore persistence GAGAL: ' + err.code);
});
