"use strict";

// =====================================================================
// SOCIAL.JS — Sistem Pertemanan Phygo
//
// KONSEP: "Teman" = saling follow (mutual). Kalau A follow B tapi B belum
// follow balik, itu baru "menunggu" dari sisi A dan jadi "undangan
// pertemanan" yang muncul di kotak pesan (inbox) milik B. Begitu B follow
// balik (atau tekan "Terima" di inbox), otomatis jadi Teman di kedua sisi.
//
// STRUKTUR DATA FIRESTORE (subkoleksi di bawah tiap dokumen users/{uid}):
//   users/{uid}/following/{otherUid}  -> { uid, usernameDisplay, avatarId, since }
//   users/{uid}/followers/{otherUid}  -> { uid, usernameDisplay, avatarId, since }
//
// "Teman" dan "Undangan Pertemanan" TIDAK disimpan sebagai koleksi terpisah
// (biar tidak ada resiko datanya "nyasar"/desync) — keduanya cukup dihitung
// di device dari 2 listener realtime di atas:
//   - Teman            = ada di following DAN followers (irisan)
//   - Undangan masuk   = ada di followers TAPI TIDAK ada di following
//     (orang itu sudah follow kamu, kamu belum follow balik)
//
// PENTING — ATURAN KEAMANAN FIRESTORE (Security Rules) yang WAJIB dipasang
// di Firebase Console supaya fitur ini aman & bisa jalan (lihat pesan
// terpisah dari saya berisi kode rules-nya). Tanpa rules yang tepat, semua
// operasi follow/unfollow/terima/tolak di bawah ini akan ditolak Firestore.
// =====================================================================

const socialState = {
  myUid: null,
  following: new Map(), // otherUid -> data
  followers: new Map(), // otherUid -> data
  unsubFollowing: null,
  unsubFollowers: null,
  searchBusy: false,
  searchToken: 0,
};

// Dibuka/ditutupnya modal sosial dicatat di sini supaya tombol back HP bisa
// menutup modal yang sedang aktif (lihat handleSocialModalHistoryPop di
// bawah, dipanggil dari router.js).
window.socialModalOpen = null; // null | 'addFriend' | 'inbox' | 'editProfile' | 'viewProfile'

// Tiap modal sosial punya 2 elemen terpisah di HTML: backdrop (id ...Backdrop)
// dan dialog-nya sendiri. Helper ini nyalain/matiin keduanya bareng supaya
// gak pernah "backdrop doang nyala tapi dialognya nggak" atau sebaliknya.
function _setModalVisible(modalId, backdropId, visible) {
  const m = document.getElementById(modalId);
  const b = document.getElementById(backdropId);
  if (m) m.classList.toggle('show', visible);
  if (b) b.classList.toggle('show', visible);
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ===== LISTENER REALTIME — dinyalakan tiap kali user login (lihat auth-ui.js) =====
function initSocialListeners() {
  const user = fbAuth.currentUser;
  if (!user) return;
  teardownSocialListeners();
  socialState.myUid = user.uid;

  socialState.unsubFollowing = db.collection('users').doc(user.uid).collection('following')
    .onSnapshot((snap) => {
      const m = new Map();
      snap.forEach((d) => m.set(d.id, d.data()));
      socialState.following = m;
      onSocialDataChanged();
    }, (err) => { console.error('[Phygo] listener following gagal:', err); });

  socialState.unsubFollowers = db.collection('users').doc(user.uid).collection('followers')
    .onSnapshot((snap) => {
      const m = new Map();
      snap.forEach((d) => m.set(d.id, d.data()));
      socialState.followers = m;
      onSocialDataChanged();
    }, (err) => { console.error('[Phygo] listener followers gagal:', err); });
}

function teardownSocialListeners() {
  if (socialState.unsubFollowing) socialState.unsubFollowing();
  if (socialState.unsubFollowers) socialState.unsubFollowers();
  socialState.unsubFollowing = null;
  socialState.unsubFollowers = null;
  socialState.myUid = null;
  socialState.following = new Map();
  socialState.followers = new Map();
}

// Dipanggil tiap kali data following/followers berubah (realtime) — jaga
// semua bagian UI yang lagi tampil tetap sinkron tanpa perlu refresh manual.
function onSocialDataChanged() {
  updateSocialBadge();
  if (document.getElementById('screen-social') && document.getElementById('screen-social').classList.contains('active')) {
    renderFriendsListUI(document.getElementById('socialSearchInput') ? document.getElementById('socialSearchInput').value : '');
  }
  if (window.socialModalOpen === 'inbox') renderInboxList();
  if (window.socialModalOpen === 'addFriend') refreshAddFriendResultsStatus();
}

// ===== TURUNAN DATA (dihitung, bukan disimpan) =====
function getFriendsList() {
  const arr = [];
  socialState.following.forEach((data, uid) => {
    if (socialState.followers.has(uid)) arr.push(Object.assign({ uid }, data));
  });
  arr.sort((a, b) => (a.usernameDisplay || '').localeCompare(b.usernameDisplay || ''));
  return arr;
}

function getPendingRequests() {
  const arr = [];
  socialState.followers.forEach((data, uid) => {
    if (!socialState.following.has(uid)) arr.push(Object.assign({ uid }, data));
  });
  arr.sort((a, b) => {
    const ta = (a.since && a.since.toMillis) ? a.since.toMillis() : 0;
    const tb = (b.since && b.since.toMillis) ? b.since.toMillis() : 0;
    return tb - ta;
  });
  return arr;
}

// 'friend' | 'pending-out' (aku follow, belum di-follow balik) |
// 'pending-in' (dia follow aku, aku belum follow balik) | 'none' | 'me'
function getRelationStatus(uid) {
  if (uid === socialState.myUid) return 'me';
  const f1 = socialState.following.has(uid);
  const f2 = socialState.followers.has(uid);
  if (f1 && f2) return 'friend';
  if (f1) return 'pending-out';
  if (f2) return 'pending-in';
  return 'none';
}

function updateSocialBadge() {
  const count = getPendingRequests().length;
  document.querySelectorAll('.social-req-badge').forEach((el) => {
    if (count > 0) { el.textContent = count > 9 ? '9+' : String(count); el.style.display = ''; }
    else { el.style.display = 'none'; }
  });
}

// ===== MUTASI FIRESTORE: follow / unfollow / tolak =====
async function followUser(targetUid, targetInfo) {
  const me = fbAuth.currentUser;
  if (!me) throw new Error('Anda belum login.');
  if (targetUid === me.uid) throw new Error('Tidak bisa berteman dengan diri sendiri.');
  const myProfile = await getCurrentUserProfile();
  const batch = db.batch();
  batch.set(db.collection('users').doc(me.uid).collection('following').doc(targetUid), {
    uid: targetUid,
    usernameDisplay: targetInfo.usernameDisplay || targetInfo.username || 'User',
    avatarId: targetInfo.avatarId || 1,
    since: firebase.firestore.FieldValue.serverTimestamp(),
  });
  batch.set(db.collection('users').doc(targetUid).collection('followers').doc(me.uid), {
    uid: me.uid,
    usernameDisplay: (myProfile && myProfile.usernameDisplay) || 'User',
    avatarId: (myProfile && myProfile.avatarId) || 1,
    since: firebase.firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();
}

async function unfollowUser(targetUid) {
  const me = fbAuth.currentUser;
  if (!me) throw new Error('Anda belum login.');
  const batch = db.batch();
  batch.delete(db.collection('users').doc(me.uid).collection('following').doc(targetUid));
  batch.delete(db.collection('users').doc(targetUid).collection('followers').doc(me.uid));
  await batch.commit();
}

// Tolak undangan: hapus "dia follow aku" dari kedua sisi (tanpa aku ikut follow dia).
async function declineRequest(fromUid) {
  const me = fbAuth.currentUser;
  if (!me) throw new Error('Anda belum login.');
  const batch = db.batch();
  batch.delete(db.collection('users').doc(me.uid).collection('followers').doc(fromUid));
  batch.delete(db.collection('users').doc(fromUid).collection('following').doc(me.uid));
  await batch.commit();
}

// ===== PENCARIAN USER (by username, prefix match, huruf kecil) =====
async function searchUsersByUsername(rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase();
  if (!q) return [];
  const snap = await db.collection('users')
    .where('username', '>=', q)
    .where('username', '<=', q + '\uf8ff')
    .limit(20)
    .get();
  const me = fbAuth.currentUser ? fbAuth.currentUser.uid : null;
  return snap.docs
    .map((d) => Object.assign({ uid: d.id }, d.data()))
    .filter((u) => u.uid !== me);
}

// =====================================================================
// LAYAR SOSIAL — daftar teman + search lokal + tombol Undangan & Tambah Teman
// =====================================================================
function renderSocialScreen() {
  const holder = document.getElementById('socialScroll');
  if (!holder) return;
  holder.innerHTML = `
    <div class="social-topbar">
      <button class="social-back-btn ripple-host" id="socialBackBtn" aria-label="Kembali">${svgIcon('arrowBack')}</button>
      <span class="social-topbar-title">Sosial</span>
      <div class="social-topbar-actions">
        <div class="badge-anchor">
          <button class="social-icon-btn ripple-host" id="socialInboxBtn" aria-label="Undangan Pertemanan">
            ${svgIcon('mail')}
          </button>
          <span class="social-req-badge" id="socialReqBadgeInScreen" style="display:none;">0</span>
        </div>
        <button class="social-icon-btn ripple-host" id="socialAddFriendBtn" aria-label="Tambah Teman">${svgIcon('personAdd')}</button>
      </div>
    </div>

    <div class="social-search-bar">
      ${svgIcon('search')}
      <input type="text" id="socialSearchInput" placeholder="Cari nama teman kamu...">
    </div>

    <div id="socialFriendsList" class="social-friends-list"></div>
  `;

  document.getElementById('socialBackBtn').addEventListener('click', () => navigate('profile', {}, false));
  document.getElementById('socialInboxBtn').addEventListener('click', openInboxModal);
  document.getElementById('socialAddFriendBtn').addEventListener('click', openAddFriendModal);
  document.getElementById('socialSearchInput').addEventListener('input', (e) => {
    renderFriendsListUI(e.target.value);
  });

  renderFriendsListUI('');
  updateSocialBadge();
}

function renderFriendsListUI(filterText) {
  const holder = document.getElementById('socialFriendsList');
  if (!holder) return;
  const q = String(filterText || '').trim().toLowerCase();
  let list = getFriendsList();
  if (q) {
    list = list.filter((f) => (f.usernameDisplay || '').toLowerCase().includes(q));
  }

  if (list.length === 0) {
    holder.innerHTML = `
      <div class="social-empty-state">
        <div class="social-empty-icon">${svgIcon('users')}</div>
        <h3>${q ? 'Teman tidak ditemukan' : 'Belum ada teman'}</h3>
        <p>${q ? 'Coba kata kunci lain.' : 'Tekan tombol tambah teman di pojok kanan atas untuk mulai cari & berteman.'}</p>
      </div>
    `;
    return;
  }

  holder.innerHTML = list.map((f) => `
    <button class="social-friend-row ripple-host" data-uid="${escapeHtml(f.uid)}" data-username="${escapeHtml(f.usernameDisplay || '')}" data-avatar="${f.avatarId || 1}">
      <span class="social-friend-avatar">${avatarSvg(f.avatarId)}</span>
      <span class="social-friend-name">${escapeHtml(f.usernameDisplay || 'User')}</span>
      <span class="social-friend-chevron">${svgIcon('chevronRight')}</span>
    </button>
  `).join('');

  holder.querySelectorAll('.social-friend-row').forEach((btn) => {
    btn.addEventListener('click', () => openProfileViewModal(btn.dataset.uid, {
      usernameDisplay: btn.dataset.username,
      avatarId: parseInt(btn.dataset.avatar, 10) || 1,
    }));
  });
}

// =====================================================================
// MODAL: TAMBAH TEMAN (search global by username + aksi follow/terima)
// =====================================================================
function openAddFriendModal() {
  document.getElementById('addFriendSearchInput').value = '';
  document.getElementById('addFriendResults').innerHTML = `
    <div class="social-empty-state social-empty-state-sm">
      <p>Ketik username teman kamu untuk mulai cari.</p>
    </div>
  `;
  _setModalVisible('modalAddFriend', 'modalAddFriendBackdrop', true);
  window.socialModalOpen = 'addFriend';
  history.pushState({ socialModal: 'addFriend' }, '', location.hash || '#social');
  setTimeout(() => document.getElementById('addFriendSearchInput').focus(), 200);
}

// FIX BUG "MODAL SOSIAL BIKIN LAYAR DI BELAKANGNYA IKUT ANIMASI ULANG":
// dulu window.socialModalOpen di-null-in DI SINI, SEBELUM history.back()
// dipanggil. Padahal event popstate yang muncul abis history.back() BUTUH
// status ini masih keisi buat tahu "oh ini nutup modal, jangan render ulang
// layar di belakangnya" (lihat cek `window.socialModalOpen` di router.js).
// Karena sudah ke-null-in duluan, popstate-nya nganggep ini navigasi biasa.
// FIX: null-in status SEKARANG hanya terjadi di dalam handleSocialModalHistoryPop
// (dipanggil oleh popstate), BUKAN di sini sebelum history.back() dipanggil.
function closeAddFriendModal(fromHistoryPop) {
  _setModalVisible('modalAddFriend', 'modalAddFriendBackdrop', false);
  if (!fromHistoryPop) history.back();
}

let _addFriendDebounce;
function initAddFriendModalOnce() {
  const input = document.getElementById('addFriendSearchInput');
  if (!input || input.dataset.wired) return;
  input.dataset.wired = '1';
  input.addEventListener('input', (e) => {
    clearTimeout(_addFriendDebounce);
    const val = e.target.value;
    _addFriendDebounce = setTimeout(() => runAddFriendSearch(val), 350);
  });
  document.getElementById('addFriendCloseBtn').addEventListener('click', () => closeAddFriendModal(false));
  document.getElementById('modalAddFriendBackdrop').addEventListener('click', () => closeAddFriendModal(false));
}

async function runAddFriendSearch(rawVal) {
  const resultsHolder = document.getElementById('addFriendResults');
  const val = String(rawVal || '').trim();
  if (!val) {
    resultsHolder.innerHTML = `<div class="social-empty-state social-empty-state-sm"><p>Ketik username teman kamu untuk mulai cari.</p></div>`;
    return;
  }
  const myToken = ++socialState.searchToken;
  resultsHolder.innerHTML = `<div class="social-search-loading">Mencari...</div>`;
  try {
    const results = await searchUsersByUsername(val);
    if (myToken !== socialState.searchToken) return; // hasil basi (query berikutnya sudah jalan)
    renderAddFriendResults(results);
  } catch (e) {
    console.error('[Phygo] Gagal mencari user:', e);
    if (myToken !== socialState.searchToken) return;
    resultsHolder.innerHTML = `<div class="social-empty-state social-empty-state-sm"><p>Gagal mencari. Cek koneksi internet kamu.</p></div>`;
  }
}

function renderAddFriendResults(results) {
  const holder = document.getElementById('addFriendResults');
  if (!results.length) {
    holder.innerHTML = `<div class="social-empty-state social-empty-state-sm"><p>Tidak ada username yang cocok.</p></div>`;
    return;
  }
  holder.innerHTML = results.map((u) => renderResultRowHtml(u)).join('');
  wireAddFriendResultButtons();
}

function renderResultRowHtml(u) {
  const status = getRelationStatus(u.uid);
  return `
    <div class="social-result-row" data-uid="${escapeHtml(u.uid)}" data-username="${escapeHtml(u.usernameDisplay || '')}" data-avatar="${u.avatarId || 1}">
      <button class="social-result-profile ripple-host" data-action="view" data-uid="${escapeHtml(u.uid)}">
        <span class="social-friend-avatar">${avatarSvg(u.avatarId)}</span>
        <span class="social-result-name">${escapeHtml(u.usernameDisplay || 'User')}</span>
      </button>
      <span class="social-result-action">${renderRelationButtonHtml(status)}</span>
    </div>
  `;
}

function renderRelationButtonHtml(status) {
  if (status === 'friend') return `<span class="social-status-chip friend">${svgIcon('checkSm')} Teman</span>`;
  if (status === 'pending-out') return `<span class="social-status-chip waiting">Menunggu</span>`;
  if (status === 'pending-in') return `<button class="btn-chip btn-chip-primary ripple-host" data-action="accept">Terima</button>`;
  return `<button class="btn-chip btn-chip-outline ripple-host" data-action="follow">Tambah</button>`;
}

function wireAddFriendResultButtons() {
  document.querySelectorAll('#addFriendResults .social-result-row').forEach((row) => {
    const uid = row.dataset.uid;
    const info = { uid, usernameDisplay: row.dataset.username, avatarId: parseInt(row.dataset.avatar, 10) || 1 };
    const viewBtn = row.querySelector('[data-action="view"]');
    if (viewBtn) viewBtn.addEventListener('click', () => openProfileViewModal(uid, info));
    const actionBtn = row.querySelector('[data-action="follow"], [data-action="accept"]');
    if (actionBtn) {
      actionBtn.addEventListener('click', async () => {
        actionBtn.disabled = true;
        actionBtn.textContent = '...';
        try {
          await followUser(uid, info);
          row.querySelector('.social-result-action').innerHTML = renderRelationButtonHtml(getRelationStatus(uid));
        } catch (e) {
          console.error('[Phygo] Gagal menambah teman:', e);
          Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' });
          actionBtn.disabled = false;
          actionBtn.textContent = 'Tambah';
        }
      });
    }
  });
}

// Dipanggil onSocialDataChanged() supaya status tombol (Menunggu/Teman/dst)
// di hasil pencarian yang masih tampil ikut ter-update realtime.
function refreshAddFriendResultsStatus() {
  document.querySelectorAll('#addFriendResults .social-result-row').forEach((row) => {
    const uid = row.dataset.uid;
    const actionSlot = row.querySelector('.social-result-action');
    if (!actionSlot) return;
    actionSlot.innerHTML = renderRelationButtonHtml(getRelationStatus(uid));
    const actionBtn = actionSlot.querySelector('[data-action="follow"], [data-action="accept"]');
    if (actionBtn) {
      const info = { uid, usernameDisplay: row.dataset.username, avatarId: parseInt(row.dataset.avatar, 10) || 1 };
      actionBtn.addEventListener('click', async () => {
        actionBtn.disabled = true;
        try { await followUser(uid, info); } catch (e) {
          Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' });
        }
      });
    }
  });
}

// =====================================================================
// MODAL: UNDANGAN PERTEMANAN (kotak pesan) — terima/tolak
// =====================================================================
function openInboxModal() {
  renderInboxList();
  _setModalVisible('modalInbox', 'modalInboxBackdrop', true);
  window.socialModalOpen = 'inbox';
  history.pushState({ socialModal: 'inbox' }, '', location.hash || '#social');
}

function closeInboxModal(fromHistoryPop) {
  _setModalVisible('modalInbox', 'modalInboxBackdrop', false);
  if (!fromHistoryPop) history.back();
}

function initInboxModalOnce() {
  const btn = document.getElementById('inboxCloseBtn');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', () => closeInboxModal(false));
  document.getElementById('modalInboxBackdrop').addEventListener('click', () => closeInboxModal(false));
}

function renderInboxList() {
  const holder = document.getElementById('inboxList');
  if (!holder) return;
  const pending = getPendingRequests();
  if (!pending.length) {
    holder.innerHTML = `
      <div class="social-empty-state social-empty-state-sm">
        <div class="social-empty-icon">${svgIcon('mail')}</div>
        <p>Belum ada undangan pertemanan.</p>
      </div>
    `;
    return;
  }
  holder.innerHTML = pending.map((p) => `
    <div class="social-inbox-row" data-uid="${escapeHtml(p.uid)}" data-username="${escapeHtml(p.usernameDisplay || '')}" data-avatar="${p.avatarId || 1}">
      <button class="social-result-profile ripple-host" data-action="view" data-uid="${escapeHtml(p.uid)}">
        <span class="social-friend-avatar">${avatarSvg(p.avatarId)}</span>
        <span class="social-result-name">${escapeHtml(p.usernameDisplay || 'User')}</span>
      </button>
      <div class="social-inbox-actions">
        <button class="btn-chip btn-chip-primary ripple-host" data-action="accept">Terima</button>
        <button class="btn-chip btn-chip-outline ripple-host" data-action="decline">Tolak</button>
      </div>
    </div>
  `).join('');

  holder.querySelectorAll('.social-inbox-row').forEach((row) => {
    const uid = row.dataset.uid;
    row.querySelector('[data-action="view"]').addEventListener('click', () => openProfileViewModal(uid, {
      usernameDisplay: row.dataset.username,
      avatarId: parseInt(row.dataset.avatar, 10) || 1,
    }));
    row.querySelector('[data-action="accept"]').addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try {
        await followUser(uid, { uid, usernameDisplay: row.dataset.username, avatarId: parseInt(row.dataset.avatar, 10) || 1 });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' });
        e.currentTarget.disabled = false;
      }
    });
    row.querySelector('[data-action="decline"]').addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try {
        await declineRequest(uid);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' });
        e.currentTarget.disabled = false;
      }
    });
  });
}

// =====================================================================
// MODAL: LIHAT PROFIL TEMAN (read-only, dibuka dari daftar teman/pencarian/inbox)
// =====================================================================
async function openProfileViewModal(uid, fallbackInfo) {
  const body = document.getElementById('profileViewBody');
  body.innerHTML = `<div class="social-search-loading">Memuat profil...</div>`;
  _setModalVisible('modalProfileView', 'modalProfileViewBackdrop', true);
  window.socialModalOpen = 'viewProfile';
  history.pushState({ socialModal: 'viewProfile' }, '', location.hash || '#social');

  try {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      body.innerHTML = `<div class="social-empty-state social-empty-state-sm"><p>Profil tidak ditemukan.</p></div>`;
      return;
    }
    const u = Object.assign({ uid }, doc.data());
    const status = getRelationStatus(uid);
    const isPrivate = u.privasi === 'privat' && status !== 'friend' && status !== 'me';

    if (isPrivate) {
      body.innerHTML = `
        <div class="profile-view-hero">
          <span class="profile-view-avatar">${avatarSvg(u.avatarId)}</span>
          <h2>${escapeHtml(u.usernameDisplay || 'User')}</h2>
        </div>
        <div class="social-empty-state social-empty-state-sm">
          <div class="social-empty-icon">${svgIcon('lock')}</div>
          <p>Profil ini bersifat privat. Berteman dulu untuk melihat statistiknya.</p>
        </div>
        <div class="profile-view-actions" id="profileViewActions"></div>
      `;
    } else {
      const rankSolo = getRankBadge(u.poinSolo || 0);
      const rankDuel = getRankBadge(u.poinDuel || 0);
      body.innerHTML = `
        <div class="profile-view-hero">
          <span class="profile-view-avatar">${avatarSvg(u.avatarId)}</span>
          <h2>${escapeHtml(u.usernameDisplay || 'User')}</h2>
          <div class="profile-view-ranks">
            <div class="profile-view-rank-item">
              <span class="profile-view-rank-label">Solo</span>
              <div class="profile-rank-badge" style="background:color-mix(in srgb, ${rankSolo.color} 22%, var(--surface-c)); color:${rankSolo.color};">${rankSolo.rank}</div>
            </div>
            <div class="profile-view-rank-item">
              <span class="profile-view-rank-label">Duel</span>
              <div class="profile-rank-badge" style="background:color-mix(in srgb, ${rankDuel.color} 22%, var(--surface-c)); color:${rankDuel.color};">${rankDuel.rank}</div>
            </div>
          </div>
        </div>
        <div class="profile-stats-grid" style="padding:0 0 20px;">
          <div class="profile-stat-box">
            <span class="profile-stat-label">Nama</span>
            <span class="profile-stat-value">${escapeHtml(u.name || '-')}</span>
          </div>
          <div class="profile-stat-box">
            <span class="profile-stat-label">Gender</span>
            <span class="profile-stat-value">${escapeHtml(u.gender || '-')}</span>
          </div>
          <div class="profile-stat-box">
            <span class="profile-stat-label">Umur</span>
            <span class="profile-stat-value">${u.age || '-'} tahun</span>
          </div>
          <div class="profile-stat-box">
            <span class="profile-stat-label">Musim Ini</span>
            <span class="profile-stat-value">${(u.seasonPoin || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div class="profile-section" style="padding:0 0 20px;">
          <h3 class="profile-section-title">Quote Terpasang</h3>
          <div class="profile-quote-box">
            <p class="profile-quote-text">${u.quoteEquipped ? escapeHtml(u.quoteEquipped) : 'Belum ada quote terpasang'}</p>
          </div>
        </div>
        <div class="profile-view-actions" id="profileViewActions"></div>
      `;
    }

    renderProfileViewActions(uid, { uid, usernameDisplay: u.usernameDisplay, avatarId: u.avatarId }, status);
  } catch (e) {
    console.error('[Phygo] Gagal memuat profil teman:', e);
    // Aturan keamanan Firestore memang SENGAJA menolak (permission-denied)
    // kalau ini profil privat orang lain yang belum berteman denganku —
    // itu bukan error jaringan, jadi tampilkan pesan "privat" yang jelas
    // (pakai info dasar yang sudah kita punya dari daftar/hasil pencarian),
    // bukan pesan error generik yang bikin bingung.
    if (e && e.code === 'permission-denied') {
      const info = fallbackInfo || {};
      const status = getRelationStatus(uid);
      body.innerHTML = `
        <div class="profile-view-hero">
          <span class="profile-view-avatar">${avatarSvg(info.avatarId)}</span>
          <h2>${escapeHtml(info.usernameDisplay || 'User')}</h2>
        </div>
        <div class="social-empty-state social-empty-state-sm">
          <div class="social-empty-icon">${svgIcon('lock')}</div>
          <p>Profil ini bersifat privat. Berteman dulu untuk melihat statistiknya.</p>
        </div>
        <div class="profile-view-actions" id="profileViewActions"></div>
      `;
      renderProfileViewActions(uid, { uid, usernameDisplay: info.usernameDisplay, avatarId: info.avatarId }, status);
    } else {
      body.innerHTML = `<div class="social-empty-state social-empty-state-sm"><p>Gagal memuat profil. Cek koneksi internet kamu.</p></div>`;
    }
  }
}

function renderProfileViewActions(uid, info, status) {
  const slot = document.getElementById('profileViewActions');
  if (!slot) return;
  if (status === 'me') { slot.innerHTML = ''; return; }
  if (status === 'friend') {
    slot.innerHTML = `
      <button class="btn btn-primary btn-block ripple-host" id="pvDuelBtn">${svgIcon('swords')} Ajak Duel</button>
      <button class="btn btn-ghost btn-block ripple-host" id="pvActionBtn" style="margin-top:8px;">Berhenti Berteman</button>
    `;
    document.getElementById('pvDuelBtn').addEventListener('click', () => {
      if (typeof sendDuelInvite === 'function') sendDuelInvite(uid, info);
    });
    document.getElementById('pvActionBtn').addEventListener('click', () => {
      Swal.fire({
        icon: 'warning', title: 'Berhenti berteman?', text: `Kamu tidak akan lagi berteman dengan ${info.usernameDisplay || 'user ini'}.`,
        showCancelButton: true, confirmButtonText: 'Ya, Berhenti', cancelButtonText: 'Batal',
        background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)', cancelButtonColor: 'var(--surface-c-high)'
      }).then((res) => {
        if (!res.isConfirmed) return;
        unfollowUser(uid).catch((e) => Swal.fire({ icon: 'error', title: 'Gagal', text: e.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' }));
        renderProfileViewActions(uid, info, 'none');
      });
    });
  } else if (status === 'pending-out') {
    slot.innerHTML = `<button class="btn btn-ghost btn-block ripple-host" disabled>Menunggu Konfirmasi</button>`;
  } else if (status === 'pending-in') {
    slot.innerHTML = `
      <button class="btn btn-primary btn-block ripple-host" id="pvAcceptBtn">Terima Pertemanan</button>
      <button class="btn btn-ghost btn-block ripple-host" id="pvDeclineBtn" style="margin-top:8px;">Tolak</button>
    `;
    document.getElementById('pvAcceptBtn').addEventListener('click', async (e) => {
      e.target.disabled = true;
      try { await followUser(uid, info); } catch (err) { Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' }); e.target.disabled = false; }
    });
    document.getElementById('pvDeclineBtn').addEventListener('click', async () => {
      try { await declineRequest(uid); closeProfileViewModal(false); } catch (err) { Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' }); }
    });
  } else {
    slot.innerHTML = `<button class="btn btn-primary btn-block ripple-host" id="pvFollowBtn">Tambah Teman</button>`;
    document.getElementById('pvFollowBtn').addEventListener('click', async (e) => {
      e.target.disabled = true;
      try { await followUser(uid, info); renderProfileViewActions(uid, info, 'pending-out'); } catch (err) { Swal.fire({ icon: 'error', title: 'Gagal', text: err.message, background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--error)' }); e.target.disabled = false; }
    });
  }
}

function closeProfileViewModal(fromHistoryPop) {
  _setModalVisible('modalProfileView', 'modalProfileViewBackdrop', false);
  if (!fromHistoryPop) history.back();
}

function initProfileViewModalOnce() {
  const btn = document.getElementById('profileViewCloseBtn');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', () => closeProfileViewModal(false));
  document.getElementById('modalProfileViewBackdrop').addEventListener('click', () => closeProfileViewModal(false));
}

// =====================================================================
// MODAL: EDIT PROFIL (nama, gender, umur)
// =====================================================================
async function openEditProfileModal() {
  const err = document.getElementById('editProfileError');
  if (err) err.textContent = '';
  _setModalVisible('modalEditProfile', 'modalEditProfileBackdrop', true);
  window.socialModalOpen = 'editProfile';
  history.pushState({ socialModal: 'editProfile' }, '', location.hash || '#settings');
  try {
    const profile = await getCurrentUserProfile();
    document.getElementById('editProfileName').value = (profile && profile.name) || '';
    document.getElementById('editProfileGender').value = (profile && profile.gender) || '';
    document.getElementById('editProfileAge').value = (profile && profile.age) || '';
  } catch (e) {
    console.error('[Phygo] Gagal memuat profil untuk diedit:', e);
  }
}

function closeEditProfileModal(fromHistoryPop) {
  _setModalVisible('modalEditProfile', 'modalEditProfileBackdrop', false);
  if (!fromHistoryPop) history.back();
}

function initEditProfileModalOnce() {
  const btn = document.getElementById('editProfileCloseBtn');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', () => closeEditProfileModal(false));
  document.getElementById('modalEditProfileBackdrop').addEventListener('click', () => closeEditProfileModal(false));
  document.getElementById('btnSaveEditProfile').addEventListener('click', async () => {
    const name = document.getElementById('editProfileName').value.trim();
    const gender = document.getElementById('editProfileGender').value;
    const ageRaw = document.getElementById('editProfileAge').value;
    const age = ageRaw ? parseInt(ageRaw, 10) : null;
    const errEl = document.getElementById('editProfileError');
    if (age !== null && (isNaN(age) || age < 5 || age > 100)) {
      errEl.textContent = 'Umur harus antara 5-100 tahun.';
      return;
    }
    errEl.textContent = '';
    const saveBtn = document.getElementById('btnSaveEditProfile');
    saveBtn.disabled = true; saveBtn.textContent = 'Menyimpan...';
    try {
      await updateOwnProfile({ name, gender, age });
      closeEditProfileModal(false);
      Swal.fire({ icon: 'success', title: 'Profil Diperbarui', background: '#1C2426', color: '#E3E3E6', confirmButtonColor: 'var(--primary)', timer: 1500 });
      if (document.getElementById('screen-profile').classList.contains('active')) renderProfileScreen();
    } catch (e) {
      console.error('[Phygo] Gagal menyimpan profil:', e);
      errEl.textContent = e.message || 'Gagal menyimpan, coba lagi.';
    } finally {
      saveBtn.disabled = false; saveBtn.textContent = 'Simpan';
    }
  });
}

// ===== Tombol back HP untuk modal sosial yang lagi terbuka (lihat router.js) =====
function handleSocialModalHistoryPop() {
  const which = window.socialModalOpen;
  window.socialModalOpen = null;
  if (which === 'addFriend') closeAddFriendModal(true);
  else if (which === 'inbox') closeInboxModal(true);
  else if (which === 'viewProfile') closeProfileViewModal(true);
  else if (which === 'editProfile') closeEditProfileModal(true);
}

// Dipanggil saat logout — tutup semua modal sosial yang mungkin masih terbuka.
function closeAllSocialModals() {
  ['modalAddFriend', 'modalInbox', 'modalProfileView', 'modalEditProfile'].forEach((id) => {
    const m = document.getElementById(id);
    const b = document.getElementById(id + 'Backdrop');
    if (m) m.classList.remove('show');
    if (b) b.classList.remove('show');
  });
  window.socialModalOpen = null;
}
