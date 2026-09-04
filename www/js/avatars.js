"use strict";

// 3 avatar preset — bentuk geometris sederhana pakai var(--primary) tema aktif,
// jadi otomatis ganti warna kalau user ganti tema di Pengaturan.
const AVATAR_PRESETS = {
  1: `<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="var(--primary-container)"/><circle cx="32" cy="26" r="12" fill="var(--primary)"/><path d="M12 58c0-12 9-18 20-18s20 6 20 18" fill="var(--primary)"/></svg>`,
  2: `<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="var(--primary-container)"/><rect x="16" y="14" width="32" height="32" rx="10" fill="var(--primary)" transform="rotate(45 32 32)"/></svg>`,
  3: `<svg viewBox="0 0 64 64"><rect width="64" height="64" fill="var(--primary-container)"/><polygon points="32,12 52,48 12,48" fill="var(--primary)"/></svg>`,
};

function avatarSvg(avatarId) {
  return AVATAR_PRESETS[avatarId] || AVATAR_PRESETS[1];
}
