// ===== BADGE RANK SYSTEM — flexible tier berdasarkan totalPoin =====
// Ini sistem yang gampang diubah: cukup edit object ini, gaperlu ubah banyak tempat.
const RANK_TIERS = [
  { minPoin: 0, maxPoin: 999, rank: 'NOOB', color: 'var(--on-surface-low)' },
  { minPoin: 1000, maxPoin: 4999, rank: 'LEARNER', color: 'var(--primary)' },
  { minPoin: 5000, maxPoin: 9999, rank: 'MASTER', color: 'var(--secondary)' },
  { minPoin: 10000, maxPoin: Infinity, rank: 'LEGEND', color: 'var(--tertiary)' },
];

function getRankBadge(totalPoin) {
  const tier = RANK_TIERS.find(t => totalPoin >= t.minPoin && totalPoin <= t.maxPoin);
  return tier || RANK_TIERS[0];
}

// ===== PROFIL TAB — tampil data user + poin breakdown =====
async function renderProfileScreen(){
  const holder = document.getElementById('profileScroll');
  if(!holder) return;

  if(window.phygoLog) window.phygoLog('PROFILE RENDER', 'mulai load user profile');
  
  try {
    const userProfile = await getCurrentUserProfile();
    if(!userProfile) {
      if(window.phygoLog) window.phygoLog('PROFILE RENDER', 'user profile null, fallback ke home');
      navigate('home', {}, true);
      return;
    }

    const rank = getRankBadge(userProfile.totalPoin || 0);
    
    // Hitung persentase poin solo vs coop
    const totalPoin = userProfile.totalPoin || 0;
    const poinSolo = userProfile.poinSolo || 0;
    const poinCoop = userProfile.poinCoop || 0;
    const pctSolo = totalPoin > 0 ? Math.round((poinSolo / totalPoin) * 100) : 0;
    const pctCoop = totalPoin > 0 ? Math.round((poinCoop / totalPoin) * 100) : 0;

    // Avatar placeholder (bisa dikembang jadi actual avatar system nanti)
    const avatarInitial = (userProfile.usernameDisplay || '?').charAt(0).toUpperCase();

    holder.innerHTML = `
      <div class="profile-topbar">
        <span class="profile-topbar-title">Profil Saya</span>
        <button class="profile-settings-btn ripple-host" id="profileSettingsBtn" aria-label="Pengaturan">
          ${svgIcon('gear')}
        </button>
      </div>

      <div class="profile-hero">
        <div class="profile-avatar">${avatarInitial}</div>
        <div class="profile-user-info">
          <h1 class="profile-username">${userProfile.usernameDisplay || 'User'}</h1>
          <div class="profile-rank" style="color: ${rank.color};">
            <span class="profile-rank-badge">${rank.rank}</span>
            <span class="profile-rank-poin">${totalPoin.toLocaleString('id-ID')} Poin</span>
          </div>
        </div>
      </div>

      <div class="profile-stats-grid">
        <div class="profile-stat-box">
          <span class="profile-stat-label">Nama</span>
          <span class="profile-stat-value">${userProfile.name || '-'}</span>
        </div>
        <div class="profile-stat-box">
          <span class="profile-stat-label">Gender</span>
          <span class="profile-stat-value">${userProfile.gender || '-'}</span>
        </div>
        <div class="profile-stat-box">
          <span class="profile-stat-label">Umur</span>
          <span class="profile-stat-value">${userProfile.age || '-'} tahun</span>
        </div>
        <div class="profile-stat-box">
          <span class="profile-stat-label">Musim Ini</span>
          <span class="profile-stat-value">${(userProfile.seasonPoin || 0).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div class="profile-section">
        <h3 class="profile-section-title">Breakdown Poin</h3>
        <div class="profile-breakdown">
          <div class="breakdown-row">
            <span class="breakdown-label">Poin Solo</span>
            <span class="breakdown-value">${pctSolo}% (${poinSolo.toLocaleString('id-ID')})</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-bar-fill solo" style="width: ${pctSolo}%; background: var(--primary);"></div>
          </div>
          <div class="breakdown-row" style="margin-top: 16px;">
            <span class="breakdown-label">Poin Koop</span>
            <span class="breakdown-value">${pctCoop}% (${poinCoop.toLocaleString('id-ID')})</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-bar-fill coop" style="width: ${pctCoop}%; background: var(--secondary);"></div>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h3 class="profile-section-title">Quote Terpasang</h3>
        <div class="profile-quote-box">
          <p class="profile-quote-text">${userProfile.quoteEquipped ? userProfile.quoteEquipped : 'Belum ada quote terpasang'}</p>
          <span class="profile-quote-hint" style="display: ${userProfile.quoteEquipped ? 'none' : 'block'};">Buka shop untuk memilih quote favoritmu</span>
        </div>
      </div>

      <div class="profile-section">
        <h3 class="profile-section-title">Komunitas</h3>
        <div class="profile-social-grid">
          <div class="profile-social-box">
            <span class="profile-social-count" id="profileFollowersCount">0</span>
            <span class="profile-social-label">Pengikut</span>
          </div>
          <div class="profile-social-box">
            <span class="profile-social-count" id="profileFollowingCount">0</span>
            <span class="profile-social-label">Mengikuti</span>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    document.getElementById('profileSettingsBtn').addEventListener('click', ()=>{
      navigate('settings', {fromProfile: true}, false);
    });

    if(window.phygoLog) window.phygoLog('PROFILE RENDER', 'selesai, username=' + userProfile.usernameDisplay);

  } catch(err) {
    if(window.phygoLog) window.phygoLog('PROFILE RENDER ERROR', err.message);
    holder.innerHTML = `<div style="padding:24px; text-align:center; color:var(--error);">Gagal memuat profil</div>`;
  }
}

// ===== SETTINGS SCREEN (terpisah dari Profil) — tema + data export/import + privasi =====
async function renderSettingsScreen(){
  const activeTheme = getTheme();
  document.querySelectorAll('#themeGrid .theme-swatch').forEach(el=>{
    el.classList.toggle('active', el.dataset.theme === activeTheme);
  });

  // Load user profile untuk tampil toggle privasi
  try {
    const userProfile = await getCurrentUserProfile();
    if(userProfile) {
      const privacyToggle = document.getElementById('privacyToggle');
      if(privacyToggle) {
        privacyToggle.value = userProfile.privasi === 'privat' ? 'on' : 'off';
        if(window.phygoLog) window.phygoLog('SETTINGS RENDER', 'privacy loaded: ' + userProfile.privasi);
      }
    }
  } catch(err) {
    if(window.phygoLog) window.phygoLog('SETTINGS RENDER ERROR', 'load privacy: ' + err.message);
  }
}

// ===== FUNGSI HELPER: Simpan toggle privasi ke Firestore =====
async function savePrivacySetting(isPrivate){
  const user = fbAuth.currentUser;
  if(!user) {
    Swal.fire({ icon:'error', title:'Gagal Menyimpan', text:'Anda belum login.', background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--error)' });
    return;
  }

  try {
    if(window.phygoLog) window.phygoLog('PRIVACY SAVE', 'saving privasi=' + (isPrivate ? 'privat' : 'publik'));
    await db.collection('users').doc(user.uid).update({
      privasi: isPrivate ? 'privat' : 'publik'
    });
    if(window.phygoLog) window.phygoLog('PRIVACY SAVE', 'success');
    Swal.fire({ icon:'success', title:'Pengaturan Privasi Tersimpan', background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--primary)', timer: 1500 });
  } catch(err) {
    if(window.phygoLog) window.phygoLog('PRIVACY SAVE ERROR', err.message);
    Swal.fire({ icon:'error', title:'Gagal Menyimpan', text:err.message, background:'#1C2426', color:'#E3E3E6', confirmButtonColor:'var(--error)' });
  }
}
