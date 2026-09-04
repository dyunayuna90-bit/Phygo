"use strict";

// =====================================================================
// AUTH-UI.JS — nyambungin form HTML auth screen ke fungsi-fungsi di
// auth.js, dan nentuin layar pertama yang muncul (auth atau dashboard).
//
// PENTING: baris terakhir "showScreen('home')" di app.js HARUS DIHAPUS/
// dikomentari, karena start screen sekarang ditentukan di sini (lewat
// initAuthGate), bukan langsung lompat ke home.
// =====================================================================

let selectedAvatarId = 1;

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

function showAuthForm(which) {
  document.getElementById('authFormLogin').style.display = which === 'login' ? '' : 'none';
  document.getElementById('authFormRegister').style.display = which === 'register' ? '' : 'none';
}

function setAuthError(elId, message) {
  const el = document.getElementById(elId);
  if (el) el.textContent = message || '';
}

function goToDashboardAfterAuth() {
  document.getElementById('screen-auth').classList.remove('active');
  document.getElementById('app').style.display = '';
  history.replaceState({ screen: 'home' }, '', '#home');
  showScreen('home');
}

function initAuthUI() {
  renderAvatarPicker();

  document.getElementById('linkGoToRegister').addEventListener('click', (e) => {
    e.preventDefault(); showAuthForm('register');
  });
  document.getElementById('linkGoToLogin').addEventListener('click', (e) => {
    e.preventDefault(); showAuthForm('login');
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
      const ok = await isUsernameAvailable(val);
      hint.textContent = ok ? 'Username tersedia' : 'Username sudah dipakai';
      hint.className = 'auth-hint ' + (ok ? 'ok' : 'bad');
    }, 400);
  });

  document.getElementById('btnLoginSubmit').addEventListener('click', async () => {
    setAuthError('loginError', '');
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) { setAuthError('loginError', 'Isi username & kata sandi.'); return; }
    try {
      await loginWithUsername(username, password);
      goToDashboardAfterAuth();
    } catch (e) {
      setAuthError('loginError', 'Username atau kata sandi salah.');
    }
  });

  document.getElementById('btnGoogleLogin').addEventListener('click', async () => {
    setAuthError('loginError', '');
    try {
      await loginWithGoogle();
      const uid = fbAuth.currentUser.uid;
      if (await hasNoProfile(uid)) {
        // Pertama kali login via Google — user perlu lengkapi username dkk
        // dulu sebelum masuk dashboard. Pakai form register yang sama,
        // tapi tanpa field password (akun udah ada dari Google).
        showAuthForm('register');
        document.querySelector('#authFormRegister .auth-field:has(#regPassword)').style.display = 'none';
        document.getElementById('btnRegisterSubmit').dataset.googleUid = uid;
      } else {
        goToDashboardAfterAuth();
      }
    } catch (e) {
      setAuthError('loginError', 'Gagal masuk dengan Google.');
    }
  });

  document.getElementById('btnRegisterSubmit').addEventListener('click', async () => {
    setAuthError('registerError', '');
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value.trim();
    const gender = document.getElementById('regGender').value;
    const age = parseInt(document.getElementById('regAge').value, 10) || null;
    const profile = { name, gender, age, avatarId: selectedAvatarId };

    const googleUid = document.getElementById('btnRegisterSubmit').dataset.googleUid;
    try {
      if (googleUid) {
        await completeGoogleProfile(googleUid, username, profile);
      } else {
        if (!password || password.length < 6) throw new Error('Kata sandi minimal 6 karakter.');
        await registerWithUsername(username, password, profile);
      }
      goToDashboardAfterAuth();
    } catch (e) {
      setAuthError('registerError', e.message || 'Gagal mendaftar, coba lagi.');
    }
  });
}

// ===== GATE UTAMA — dipanggil sekali di app.js, GANTIKAN showScreen('home') langsung =====
function initAuthGate() {
  document.getElementById('app').style.display = 'none'; // sembunyikan dashboard dulu
  initAuthUI();

  watchAuthState((user) => {
    if (user) {
      goToDashboardAfterAuth();
    } else {
      document.getElementById('screen-auth').classList.add('active');
      document.getElementById('app').style.display = 'none';
    }
  });
}
