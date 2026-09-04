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
  try {
    document.getElementById('screen-auth').classList.remove('active');
    document.getElementById('app').style.display = '';
    history.replaceState({ screen: 'home' }, '', '#home');
    showScreen('home');
  } catch (e) {
    // Kalau sampai render dashboard-nya error, jangan biarkan user
    // "nyangkut" di layar putih tanpa penjelasan — catat ke console biar
    // kelacak, dan minimal dashboard-nya tetap kebuka (user bisa lapor).
    console.error('[Phygo] Gagal render dashboard setelah login:', e);
  }
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
    if (authBusy) return; // abaikan klik dobel selagi masih diproses
    setAuthError('loginError', '');
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) { setAuthError('loginError', 'Isi username & kata sandi.'); return; }

    authBusy = true;
    setAuthBusy('btnLoginSubmit', true, 'Memproses...', 'Masuk');
    try {
      await withTimeout(loginWithUsername(username, password), 15000, 'Login butuh waktu terlalu lama.');
      // Navigasi dashboard ditangani otomatis oleh watchAuthState() di
      // initAuthGate() begitu Firebase konfirmasi status login berubah.
      // Tombol sengaja TETAP disabled sampai transisi itu terjadi, biar
      // ga ada klik nyelip di tengah proses pindah layar.
    } catch (e) {
      console.error('[Phygo] Login gagal:', e);
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
    if (authBusy) return; // abaikan klik dobel selagi masih diproses
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
        setAuthError('registerError', 'Kata sandi minimal 6 karakter.');
        return;
      }
    }
    if (!username) {
      setAuthError('registerError', 'Isi username dulu ya.');
      return;
    }

    authBusy = true;
    setAuthBusy('btnRegisterSubmit', true, 'Memproses...', 'Daftar');
    try {
      if (googleUid) {
        await withTimeout(completeGoogleProfile(googleUid, username, profile), 15000, 'Daftar butuh waktu terlalu lama.');
      } else {
        await withTimeout(registerWithUsername(username, password, profile), 15000, 'Daftar butuh waktu terlalu lama.');
      }
      // Sama seperti login: navigasi ditangani watchAuthState().
    } catch (e) {
      console.error('[Phygo] Daftar gagal:', e);
      setAuthError('registerError', withErrorCode(friendlyAuthError(e), e));
      authBusy = false;
      setAuthBusy('btnRegisterSubmit', false, 'Memproses...', 'Daftar');
    }
  });
}

// ===== GATE UTAMA — dipanggil sekali di app.js, GANTIKAN showScreen('home') langsung =====
function initAuthGate() {
  document.getElementById('app').style.display = 'none'; // sembunyikan dashboard dulu
  initAuthUI();

  // Entry history awal buat layar auth, biar tombol back HP di form Daftar
  // punya "tempat" buat balik (lihat handleAuthHistoryPop di router.js).
  history.replaceState({ authForm: 'login' }, '', '#masuk');

  watchAuthState((user) => {
    if (user) {
      authBusy = false;
      setAuthBusy('btnLoginSubmit', false, 'Memproses...', 'Masuk');
      setAuthBusy('btnRegisterSubmit', false, 'Memproses...', 'Daftar');
      goToDashboardAfterAuth();
    } else {
      document.getElementById('screen-auth').classList.add('active');
      document.getElementById('app').style.display = 'none';
    }
  });
}
