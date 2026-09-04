"use strict";

// =====================================================================
// AUTH.JS — sistem login/daftar pakai USERNAME (bukan email).
//
// Trik di baliknya: Firebase Auth mewajibkan email+password. Jadi tiap
// username otomatis "dibungkus" jadi email palsu `username@phygo.local`
// di belakang layar — user sendiri ga pernah lihat/tau soal ini.
//
// Konsekuensi (PENTING, dicatat biar ga lupa):
// - Kalau user lupa password, GA ADA fitur "reset via email" otomatis
//   (karena emailnya palsu, ga bisa nerima link). Untuk skala 10-20 user
//   demo lomba, ini oke — reset manual bisa dilakuin lewat Firebase
//   Console (Authentication > Users > pencet user > reset password).
// - Username disimpen lowercase di Firestore biar "Budi" dan "budi"
//   dianggap sama (ga bisa didaftarin dobel).
// =====================================================================

const EMAIL_SUFFIX = "@phygo.local";
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/; // huruf/angka/underscore, 3-16 karakter

function usernameToEmail(username) {
  return username.trim().toLowerCase() + EMAIL_SUFFIX;
}

function validateUsername(username) {
  if (!USERNAME_REGEX.test(username)) {
    return "Username 3-16 karakter, cuma huruf/angka/underscore, tanpa spasi.";
  }
  return null;
}

// Cek ketersediaan username — dipakai buat validasi real-time di form daftar
// (misal pas user selesai ngetik, sebelum submit).
async function isUsernameAvailable(username) {
  const key = username.trim().toLowerCase();
  const doc = await db.collection("usernames").doc(key).get();
  return !doc.exists;
}

// ===== DAFTAR (Register) =====
// profile = { name, gender, age, avatarId }
async function registerWithUsername(username, password, profile) {
  const err = validateUsername(username);
  if (err) throw new Error(err);

  const usernameKey = username.trim().toLowerCase();

  const available = await isUsernameAvailable(usernameKey);
  if (!available) throw new Error("Username sudah dipakai orang lain, coba yang lain.");

  const email = usernameToEmail(usernameKey);
  const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
  const uid = cred.user.uid;

  // Catatan: ada celah kecil race-condition kalau 2 orang daftar username
  // sama persis di detik yang sama — buat 10-20 user demo lomba, resikonya
  // bisa diabaikan. Kalau nanti mau dikeraskan, ini bisa diganti Cloud
  // Function pakai Firestore transaction.
  const batch = db.batch();
  batch.set(db.collection("usernames").doc(usernameKey), { uid });
  batch.set(db.collection("users").doc(uid), {
    username: usernameKey,
    usernameDisplay: username.trim(), // biar tetep tampil sesuai kapitalisasi asli
    name: profile.name || "",
    gender: profile.gender || "",
    age: profile.age || null,
    avatarId: profile.avatarId || 1,
    quoteEquipped: null,
    totalPoin: 0,
    seasonPoin: 0,
    poinSolo: 0,
    poinCoop: 0,
    emas: 0,
    privasi: "publik", // 'publik' | 'privat'
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return uid;
}

// ===== LOGIN pakai username =====
async function loginWithUsername(username, password) {
  const email = usernameToEmail(username);
  if (window.phygoLog) window.phygoLog('AUTH.JS', 'panggil signInWithEmailAndPassword, email=' + email);
  await fbAuth.signInWithEmailAndPassword(email, password);
  if (window.phygoLog) window.phygoLog('AUTH.JS', 'signInWithEmailAndPassword selesai (resolved)');
}

// ===== LOGIN pakai Google =====
// Catatan: user yang login lewat Google BELUM tentu punya dokumen di
// koleksi `users` (kalau ini login pertama kalinya). Setelah manggil ini,
// selalu cek hasNoProfile() dulu — kalau true, arahkan user ke layar
// "Lengkapi Profil" buat isi username+nama+gender+umur+avatar.
async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  await fbAuth.signInWithPopup(provider);
}

// Dipanggil setelah loginWithGoogle() sukses, buat cek apakah user ini
// baru pertama kali login (belum ada profil) atau udah pernah.
async function hasNoProfile(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return !doc.exists;
}

// Melengkapi profil untuk user yang baru pertama kali login via Google
// (mirip registerWithUsername, tapi tanpa bikin akun Auth baru karena
// akunnya udah ada dari Google Sign-In).
async function completeGoogleProfile(uid, username, profile) {
  const err = validateUsername(username);
  if (err) throw new Error(err);

  const usernameKey = username.trim().toLowerCase();
  const available = await isUsernameAvailable(usernameKey);
  if (!available) throw new Error("Username sudah dipakai orang lain, coba yang lain.");

  const batch = db.batch();
  batch.set(db.collection("usernames").doc(usernameKey), { uid });
  batch.set(db.collection("users").doc(uid), {
    username: usernameKey,
    usernameDisplay: username.trim(),
    name: profile.name || "",
    gender: profile.gender || "",
    age: profile.age || null,
    avatarId: profile.avatarId || 1,
    quoteEquipped: null,
    totalPoin: 0,
    seasonPoin: 0,
    poinSolo: 0,
    poinCoop: 0,
    emas: 0,
    privasi: "publik",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();
}

// ===== LOGOUT =====
async function logoutUser() {
  await fbAuth.signOut();
}

// ===== Helper: pantau status login, dipanggil sekali di app.js saat start =====
// callback(user) dipanggil tiap kali status login berubah (login/logout).
// user bakal null kalau belum login.
function watchAuthState(callback) {
  fbAuth.onAuthStateChanged(callback);
}

// Ambil dokumen profil user yang lagi login. Dipakai buat render tab Profil.
async function getCurrentUserProfile() {
  const user = fbAuth.currentUser;
  if (!user) return null;
  const doc = await db.collection("users").doc(user.uid).get();
  return doc.exists ? Object.assign({ uid: user.uid }, doc.data()) : null;
}
