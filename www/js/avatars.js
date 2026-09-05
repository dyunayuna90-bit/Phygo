"use strict";

// =====================================================================
// AVATARS.JS — Sistem Foto Profil (PFP) berbasis GAMBAR (Tugas 7)
//
// CATATAN PENTING BUAT YANG NAMBAHIN FILE GAMBARNYA:
// Taruh 4 file gambar avatar di folder  www/assets/avatars/  dengan:
//   - Nama file  : avatar-1.png, avatar-2.png, avatar-3.png, avatar-4.png
//   - Ukuran     : 512x512 px
//   - Rasio      : 1:1 (persegi, WAJIB — dipotong otomatis jadi bulat/kotak
//                  membulat oleh CSS lewat object-fit:cover, jadi kalau
//                  rasionya bukan 1:1 gambarnya bakal ke-crop gak simetris)
//   - Format     : PNG (boleh transparan atau tidak, keduanya aman)
//
// Kalau nanti mau nambah lebih dari 4 pilihan, TINGGAL:
//   1. Naikkan AVATAR_COUNT di bawah ini.
//   2. Tambah file avatar-5.png, avatar-6.png, dst di folder yang sama.
// Semua tempat yang manggil avatarSvg(id) otomatis ikut nambah pilihan
// (avatar picker registrasi & avatar picker ganti PFP di tab Profil sama2
// baca dari AVATAR_COUNT ini, gak perlu diubah manual satu-satu).
//
// SEMUA pemanggil di seluruh app (social.js, screens.js, duel.js,
// auth-ui.js, dll) manggil fungsi avatarSvg(avatarId) dan langsung
// nge-insert hasilnya (string HTML) sebagai innerHTML sebuah kontainer
// bulat/kotak-membulat berukuran tetap — makanya cukup return <img> yang
// mengisi penuh (width/height 100% diatur lewat class .avatar-img di
// style.css, BUKAN di sini) supaya otomatis pas di container manapun.
// =====================================================================

const AVATAR_COUNT = 4;
const AVATAR_BASE_PATH = 'assets/avatars/';

// Dipakai auth-ui.js (avatar picker saat Daftar) & social.js (avatar
// picker saat ganti PFP di tab Profil) buat tau ada berapa pilihan avatar
// yang harus di-render, tanpa hardcode angka di 2 tempat berbeda.
function getAvatarIds() {
  const ids = [];
  for (let i = 1; i <= AVATAR_COUNT; i++) ids.push(i);
  return ids;
}

// avatarId dari Firestore bisa aja null/undefined/di luar rentang (misal
// data lama sebelum fitur ini ada) — selalu di-clamp ke rentang valid
// biar gak pernah nampilin gambar yang gak ada (broken image icon).
function normalizeAvatarId(avatarId) {
  const n = parseInt(avatarId, 10);
  if (!n || n < 1 || n > AVATAR_COUNT) return 1;
  return n;
}

function avatarSvg(avatarId) {
  const id = normalizeAvatarId(avatarId);
  return `<img src="${AVATAR_BASE_PATH}avatar-${id}.png" alt="Avatar ${id}" class="avatar-img" draggable="false" loading="lazy">`;
}
