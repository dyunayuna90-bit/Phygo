"use strict";

// =====================================================================
// AUTH-UI.JS — nyambungin form HTML auth screen ke fungsi-fungsi di
// auth.js, dan nentuin layar pertama yang muncul (auth atau dashboard).
//
// PENTING: baris terakhir "showScreen('home')" di app.js HARUS DIHAPUS/
// dikomentari, karena start screen sekarang ditentukan di sini (lewat
// initAuthGate), bukan langsung lompat ke home.
//
// FIX (lihat catatan tanggal terbaru): sebelumnya tombol Daftar/Masuk
// bisa dipencet berkali-kali sebelum request Firebase sebelumnya selesai
// (ga ada loading state), jadi klik ke-2 sempat "nyelonong" duluan dan
// bikin state jadi aneh (nyoba daftar 2x, dsb). Sekarang setiap tombol
// auth: (1) langsung disable + ganti teks jadi "Memproses..." begitu
// dipencet, (2) selalu di-re-enable di blok finally, (3) semua error asli
// dari Firebase di-console.error dulu (biar gampang dilacak lewat
// `adb logcat` / remote debug pas APK-nya nyangkut), baru ditampilkan versi
// Indonesianya ke user. Navigasi ke dashboard SEKARANG hanya dipicu oleh
// watchAuthState() (satu-satunya sumber kebenaran soal "udah login apa
// belum"), bukan dipanggil manual lagi di tiap handler — ini ngilangin
// race condition antara handler tombol vs listener auth state.
// =====================================================================

let selectedAvatarId = 1;
let authBusy = false; // guard anti double-submit global utk semua tombol auth

// =====================================================================
// FIX BUG "LOGIN SCREEN NGEDIP": sebelumnya loader awal (#appLoader) di
// app.js cuma nunggu delay tetap (400ms) + font siap, TIDAK nunggu status
// login (fbAuth.onAuthStateChanged) beneran selesai dicek. Di WebView
// Android, pengecekan sesi login (baca dari penyimpanan lokal) itu ASYNC
// dan kadang makan waktu lebih dari 400ms — jadi begitu loader ilang,
// yang kelihatan sesaat adalah layar login/daftar (state default #screen-auth
// yang "active" dari HTML), baru sepersekian detik kemudian
// goToDashboardAfterAuth() jalan dan baru pindah ke dashboard. Efeknya:
// "ngedip" nampilin form login walau user sebenarnya sudah login.
//
// PERBAIKAN: app.js sekarang HARUS ikut nunggu promise `authGateReady`
// ini sebelum loader di-fade-out. Promise-nya baru resolve begitu
// listener onAuthStateChanged pertama kali dapat jawaban PASTI (login
// atau tidak), jadi begitu loader ilang, layar yang benar (dashboard ATAU
// form login) sudah langsung tampil — tanpa jeda/ngedip sama sekali.
// Ada juga batas waktu 5 detik sebagai jaring pengaman kalau-kalau event
// itu nggak pernah nyala (misal WebView yang aneh) — biar app tetap bisa
// dipakai (fallback ke layar login) daripada nyangkut selamanya di loader.
// =====================================================================
let _resolveAuthGateReady;
window.authGateReady = new Promise((res) => { _resolveAuthGateReady = res; });
let _authGateSettled = false;
function _settleAuthGate() {
  if (_authGateSettled) return;
  _authGateSettled = true;
  _resolveAuthGateReady();
}
setTimeout(_settleAuthGate, 5000); // jaring pengaman, lihat catatan di atas

function renderAvatarPicker() {
  const picker = document.getElementById('avatarPicker');
  if (!picker) return;
  picker.innerHTML = '';
  [1, 2, 3].forEach((id) => {
    const opt = document.createElement('div');
    opt.className = 'avatar-option ripple-host' + (id === selectedAvatarId ? ' selected' : '');
    opt.innerHTML = avatarSvg(id);
    opt.addEventListener('click', () => {
      selectedAvatarId = id;
      document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
      opt.classList.add('selected');
    });
    picker.appendChild(opt);
  });
}

// which: 'login' | 'register'. pushHistory: true kalau ini aksi user yang
// harus bisa "di-undo" pakai tombol back HP (misal pencet link "Daftar").
// false dipakai pas popstate (back-nya sendiri yang manggil ini, jangan
// nge-push history baru lagi — nanti malah dobel/loop).
function showAuthForm(which, pushHistory) {
  document.getElementById('authFormLogin').style.display = which === 'login' ? '' : 'none';
  document.getElementById('authFormRegister').style.display = which === 'register' ? '' : 'none';
  setAuthError('loginError', '');
  setAuthError('registerError', '');
  if (pushHistory) {
    history.pushState({ authForm: which }, '', which === 'register' ? '#daftar' : '#masuk');
  }
}

function setAuthError(elId, message) {
  const el = document.getElementById(elId);
  if (el) el.textContent = message || '';
}

// Dipakai router.js saat menangani tombol back HP di layar auth.
// Dipanggil dari popstate handler global (lihat router.js).
function handleAuthHistoryPop(state) {
  showAuthForm(state && state.authForm === 'register' ? 'register' : 'login', false);
}

// Firebase Auth ngelempar error dalam bahasa Inggris + kode teknis
// (misal "Firebase: Error (auth/network-request-failed)."). Kalau errornya
// dari Firebase (punya `.code`), terjemahin ke pesan yang enak dibaca user.
// Kalau bukan (error custom kita sendiri di auth.js, misal "Username sudah
// dipakai..."), pesannya udah Indonesia dari sono, tinggal dipakai apa adanya.
function friendlyAuthError(e) {
  const map = {
    'auth/network-request-failed': 'Gagal terhubung ke server. Cek koneksi internet kamu.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
    'auth/weak-password': 'Kata sandi terlalu lemah, minimal 6 karakter.',
    'auth/invalid-email': 'Username tidak valid.',
    'auth/user-disabled': 'Akun ini dinonaktifkan. Hubungi admin.',
    'auth/user-not-found': 'Username atau kata sandi salah.',
    'auth/wrong-password': 'Username atau kata sandi salah.',
    'auth/email-already-in-use': 'Username sudah dipakai orang lain, coba yang lain.',
  };
  if (e && e.code && map[e.code]) return map[e.code];
  if (e && e.message) return e.message;
  return 'Terjadi kesalahan, coba lagi.';
}

// FIX BARU: kalau kamu cuma modal HP (ga selalu pegang PC buat remote-debug
// console lewat chrome://inspect), error yang cuma nyangkut di console.error
// gak kebaca sama sekali. Jadi sekarang kode error teknis-nya (misal
// "auth/network-request-failed") IKUT ditulis di pesan errornya, dalam
// kurung — biar kalau masih nyangkut, kamu tinggal screenshot pesannya
// dan kasih ke saya, ga perlu alat tambahan.
function withErrorCode(msg, e) {
  if (e && e.code) return `${msg} (${e.code})`;
  return msg;
}

// FIX BARU: sebelumnya kalau request Firebase-nya hang/gantung tanpa
// pernah resolve ATAU reject (bisa kejadian kalau koneksi jelek/aneh di
// WebView), tombol "Memproses..." bisa nyangkut SELAMANYA — ga ada error,
// ga ada dashboard, buntu. Sekarang tiap request auth dikasih batas waktu
// 15 detik; kalau lewat, otomatis dianggap gagal & tombolnya balik normal
// + errornya ditampilin, jadi minimal ga nyangkut diem2 kayak sebelumnya.
function withTimeout(promise, ms, timeoutMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => {
      const err = new Error(timeoutMessage);
      err.code = 'auth/timeout-15s';
      reject(err);
    }, ms)),
  ]);
}

function setAuthBusy(btnId, busy, busyLabel, idleLabel) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = busy;
  btn.textContent = busy ? busyLabel : idleLabel;
}

function goToDashboardAfterAuth() {
  phygoLog('DASHBOARD', 'goToDashboardAfterAuth() dipanggil');
  try {
    document.getElementById('screen-auth').classList.remove('active');
    document.getElementById('app').style.display = '';
    history.replaceState({ screen: 'home' }, '', '#home');
    showScreen('home');
    // Nyalakan listener realtime sistem pertemanan (following/followers) —
    // lihat social.js. Aman dipanggil berkali-kali (di-reset di dalamnya).
    if (typeof initSocialListeners === 'function') initSocialListeners();
    // Nyalakan listener realtime undangan Duel (lihat duel.js) — supaya
    // banner "Diajak Duel" bisa muncul kapan saja selama app kebuka.
    if (typeof initDuelInviteListener === 'function') initDuelInviteListener();
    phygoLog('DASHBOARD', 'showScreen(home) selesai tanpa error');
  } catch (e) {
    // Kalau sampai render dashboard-nya error, jangan biarkan user
    // "nyangkut" di layar putih tanpa penjelasan — catat ke console biar
    // kelacak, dan minimal dashboard-nya tetap kebuka (user bisa lapor).
    console.error('[Phygo] Gagal render dashboard setelah login:', e);
    phygoLog('DASHBOARD', 'ERROR pas showScreen(home): ' + (e && e.message));
  }
}

// Dipanggil saat user logout ATAU saat pertama buka app dan ternyata belum
// pernah login. Membersihkan semua layar dashboard yang mungkin masih
// "nempel" (misal user logout dari tengah-tengah layar Pengaturan/Sosial),
// jadi begitu login lagi, app selalu mulai bersih dari Home — bukan
// nyangkut di layar sebelumnya.
function resetToAuthScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-auth').classList.add('active');
  document.getElementById('app').style.display = 'none';
  showAuthForm('login', false);
  history.replaceState({ authForm: 'login' }, '', '#masuk');
  const lu = document.getElementById('loginUsername'); if (lu) lu.value = '';
  const lp = document.getElementById('loginPassword'); if (lp) lp.value = '';
  if (typeof teardownSocialListeners === 'function') teardownSocialListeners();
  if (typeof closeAllSocialModals === 'function') closeAllSocialModals();
  if (typeof teardownDuelInviteListener === 'function') teardownDuelInviteListener();
}

function initAuthUI() {
  renderAvatarPicker();

  document.getElementById('linkGoToRegister').addEventListener('click', (e) => {
    e.preventDefault(); showAuthForm('register', true);
  });
  document.getElementById('linkGoToLogin').addEventListener('click', (e) => {
    e.preventDefault(); showAuthForm('login', true);
  });

  // Cek ketersediaan username sambil ngetik (debounce ringan)
  let usernameCheckTimer;
  document.getElementById('regUsername').addEventListener('input', (e) => {
    clearTimeout(usernameCheckTimer);
    const val = e.target.value.trim();
    const hint = document.getElementById('regUsernameHint');
    if (!val) { hint.textContent = ''; return; }
    const formatErr = validateUsername(val);
    if (formatErr) { hint.textContent = formatErr; hint.className = 'auth-hint bad'; return; }
    hint.textContent = 'Mengecek...'; hint.className = 'auth-hint';
    usernameCheckTimer = setTimeout(async () => {
      try {
        const ok = await isUsernameAvailable(val);
        hint.textContent = ok ? 'Username tersedia' : 'Username sudah dipakai';
        hint.className = 'auth-hint ' + (ok ? 'ok' : 'bad');
      } catch (e) {
        console.error('[Phygo] Gagal cek username:', e);
        hint.textContent = 'Gagal mengecek, coba lagi.';
        hint.className = 'auth-hint bad';
      }
    }, 400);
  });

  document.getElementById('btnLoginSubmit').addEventListener('click', async () => {
    phygoLog('LOGIN', 'tombol Masuk diklik');
    if (authBusy) { phygoLog('LOGIN', 'diabaikan, masih authBusy=true'); return; }
    setAuthError('loginError', '');
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) { phygoLog('LOGIN', 'username/password kosong'); setAuthError('loginError', 'Isi username & kata sandi.'); return; }

    authBusy = true;
    setAuthBusy('btnLoginSubmit', true, 'Memproses...', 'Masuk');
    phygoLog('LOGIN', 'mulai signInWithEmailAndPassword untuk username=' + username);
    try {
      await withTimeout(loginWithUsername(username, password), 15000, 'Login butuh waktu terlalu lama.');
      phygoLog('LOGIN', 'signIn RESOLVE (sukses) — langsung pindah ke dashboard');
      authBusy = false;
      setAuthBusy('btnLoginSubmit', false, 'Memproses...', 'Masuk');
      // FIX: sebelumnya navigasi 100% ditaruh di watchAuthState() (nunggu
      // event onAuthStateChanged). Ternyata di WebView Android tertentu,
      // event itu KADANG nggak pernah nyala walau signIn-nya sendiri sukses
      // (kelihatan di debug log: "signIn RESOLVE" muncul, tapi "AUTH STATE"
      // nggak pernah nyusul). Makanya sekarang begitu promise loginnya
      // resolve, kita LANGSUNG pindah ke dashboard di sini juga — nggak
      // nunggu event yang mungkin nggak pernah dateng. watchAuthState()
      // tetap dipertahankan sebagai jalur cadangan (misal dipakai pas buka
      // app lagi & sesi lama masih tersimpan).
      goToDashboardAfterAuth();
    } catch (e) {
      console.error('[Phygo] Login gagal:', e);
      phygoLog('LOGIN', 'signIn REJECT: ' + (e && (e.code || e.message)));
      const loginKnownWrongCreds = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email'];
      const msg = (e && loginKnownWrongCreds.includes(e.code)) ? 'Username atau kata sandi salah.' : friendlyAuthError(e);
      setAuthError('loginError', withErrorCode(msg, e));
      authBusy = false;
      setAuthBusy('btnLoginSubmit', false, 'Memproses...', 'Masuk');
    }
  });

  document.getElementById('btnGoogleLogin').addEventListener('click', () => {
    // Login Google lewat WebView bawaan Capacitor/Android BELUM didukung —
    // Google secara aktif memblokir OAuth dari embedded webview ("This
    // browser or app may not be secure"), jadi signInWithPopup/redirect
    // versi Firebase-JS-biasa ga akan pernah berhasil di APK ini walau
    // kodenya "benar". Perlu native Google Sign-In plugin (google-services.json
    // + SHA-1 + setup Firebase Console) — belum ada di project ini.
    // Sementara disembunyikan fungsinya biar ga bikin user bingung "nge-hang".
    Swal.fire({
      icon: 'info',
      title: 'Login Google belum tersedia',
      text: 'Untuk sekarang, daftar/masuk pakai username & kata sandi dulu ya. Login Google butuh setup tambahan yang belum kepasang di APK ini.',
      background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--primary)'
    });
  });

  document.getElementById('btnRegisterSubmit').addEventListener('click', async () => {
    phygoLog('DAFTAR', 'tombol Daftar diklik');
    if (authBusy) { phygoLog('DAFTAR', 'diabaikan, masih authBusy=true'); return; }
    setAuthError('registerError', '');
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value.trim();
    const gender = document.getElementById('regGender').value;
    const age = parseInt(document.getElementById('regAge').value, 10) || null;
    const profile = { name, gender, age, avatarId: selectedAvatarId };

    const googleUid = document.getElementById('btnRegisterSubmit').dataset.googleUid;
    if (!googleUid) {
      if (!password || password.length < 6) {
        phygoLog('DAFTAR', 'password < 6 karakter');
        setAuthError('registerError', 'Kata sandi minimal 6 karakter.');
        return;
      }
    }
    if (!username) {
      phygoLog('DAFTAR', 'username kosong');
      setAuthError('registerError', 'Isi username dulu ya.');
      return;
    }

    authBusy = true;
    setAuthBusy('btnRegisterSubmit', true, 'Memproses...', 'Daftar');
    phygoLog('DAFTAR', 'mulai proses untuk username=' + username);
    try {
      if (googleUid) {
        await withTimeout(completeGoogleProfile(googleUid, username, profile), 15000, 'Daftar butuh waktu terlalu lama.');
      } else {
        await withTimeout(registerWithUsername(username, password, profile), 15000, 'Daftar butuh waktu terlalu lama.');
      }
      phygoLog('DAFTAR', 'RESOLVE (sukses) — langsung pindah ke dashboard');
      authBusy = false;
      setAuthBusy('btnRegisterSubmit', false, 'Memproses...', 'Daftar');
      // Sama seperti login: navigasi langsung dipanggil di sini, nggak
      // nunggu onAuthStateChanged (lihat catatan panjang di handler login).
      goToDashboardAfterAuth();
    } catch (e) {
      console.error('[Phygo] Daftar gagal:', e);
      phygoLog('DAFTAR', 'REJECT: ' + (e && (e.code || e.message)));
      setAuthError('registerError', withErrorCode(friendlyAuthError(e), e));
      authBusy = false;
      setAuthBusy('btnRegisterSubmit', false, 'Memproses...', 'Daftar');
    }
  });
}

// ===== LOGOUT — dipanggil dari tombol "Keluar" di Pengaturan (lihat app.js) =====
// UI-nya sendiri (pindah ke layar login) TIDAK dipicu manual di sini — cukup
// panggil logoutUser(), dan watchAuthState() di initAuthGate() akan otomatis
// mendeteksi perubahan lalu memanggil resetToAuthScreen(). Ini konsisten
// dengan prinsip "satu sumber kebenaran" yang sudah dipakai untuk login.
function confirmLogout() {
  Swal.fire({
    icon: 'warning',
    title: 'Keluar dari akun?',
    text: 'Kamu perlu memasukkan username & kata sandi lagi untuk masuk kembali.',
    showCancelButton: true,
    confirmButtonText: 'Ya, Keluar',
    cancelButtonText: 'Batal',
    background: '#1C2426', color: '#E3E3E6',
    confirmButtonColor: 'var(--error)',
    cancelButtonColor: 'var(--surface-c-high)'
  }).then((res) => {
    if (!res.isConfirmed) return;
    phygoLog('LOGOUT', 'user konfirmasi logout');
    logoutUser().catch((e) => {
      console.error('[Phygo] Logout gagal:', e);
      phygoLog('LOGOUT', 'ERROR: ' + (e && e.message));
      Swal.fire({ icon: 'error', title: 'Gagal Keluar', text: e.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' });
    });
  });
}

// ===== GATE UTAMA — dipanggil sekali di app.js, GANTIKAN showScreen('home') langsung =====
function initAuthGate() {
  phygoLog('GATE', 'initAuthGate() mulai jalan');
  document.getElementById('app').style.display = 'none'; // sembunyikan dashboard dulu
  initAuthUI();
  phygoLog('GATE', 'initAuthUI() selesai, listener tombol sudah terpasang');

  // Entry history awal buat layar auth, biar tombol back HP di form Daftar
  // punya "tempat" buat balik (lihat handleAuthHistoryPop di router.js).
  history.replaceState({ authForm: 'login' }, '', '#masuk');

  watchAuthState((user) => {
    phygoLog('AUTH STATE', user ? ('user login, uid=' + user.uid) : 'user = null (belum/nggak login)');
    if (user) {
      authBusy = false;
      setAuthBusy('btnLoginSubmit', false, 'Memproses...', 'Masuk');
      setAuthBusy('btnRegisterSubmit', false, 'Memproses...', 'Daftar');
      goToDashboardAfterAuth();
    } else {
      resetToAuthScreen();
    }
    // Baru sekarang loader awal (#appLoader di app.js) boleh menghilang —
    // lihat catatan panjang soal `authGateReady` di atas file ini.
    _settleAuthGate();
  });
}
