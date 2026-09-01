"use strict";

/**
 * HISTORY — Konten Sejarah Fisika untuk Level 1, 2, 3
 * 
 * Struktur: 5 step per level, setiap step berisi:
 *   - heading: judul/beat cerita
 *   - text: penjelasan dalam bahasa sederhana (parafrase, no copy-paste dari sumber)
 *   - img: path file gambar (webp atau jpg), relative ke /assets/history/
 *   - source: nama sumber kredibel
 *   - year: tahun atau range tahun relevan
 */

const HISTORY = {
  1: {
    title: 'Sejarah Kecepatan Konstan (GLB)',
    accent: 'lvl-1',
    steps: [
      {
        heading: 'Misguidance Jaman Kuno: Aristoteles dan Gagasan Salah',
        text: 'Di zaman Yunani Kuno, filsuf besar Aristoteles percaya bahwa benda hanya bisa bergerak jika ada yang terus-menerus mendorong atau menariknya. Menurut dia, begitu dorongan berhenti, benda akan langsung berhenti juga. Pandangan ini domino selama hampir dua ribu tahun dan jadi kebenaran yang diterima semua orang.',
        img: 'assets/history/lvl1-aristoteles-portrait.webp',
        source: 'Liputan6 & PijarBelajar',
        year: '384-322 SM'
      },
      {
        heading: 'Penantang Awal: Philoponus dan Ide "Momentum"',
        text: 'Baru di abad ke-6, seorang pemikir bernama John Philoponus berani membantah Aristoteles. Dia mengamati bahwa benda bisa terus bergerak bahkan setelah gaya dorongnya hilang — seperti panah yang terus terbang meskipun tangan pemanah sudah tidak menyentuhnya lagi. Ini adalah langkah pertama menuju pemahaman yang lebih akurat tentang gerak.',
        img: 'assets/history/lvl1-philoponus-idea.webp',
        source: 'Liputan6 — Pengertian Gerak Lurus',
        year: '~600 M'
      },
      {
        heading: 'Eksperimen Revolusioner: Galileo dan Bidang Miring',
        text: 'Hampir seribu tahun kemudian, saat Renaisans, Galileo Galilei melakukan eksperimen yang mengubah segalanya. Dia mengelindingkan bola di bidang miring yang halus dan mengukur waktu serta jaraknya dengan akurat. Hasilnya mengejutkan: bola bergerak dengan pola yang sangat teratur, seakan mengikuti hukum matematika yang sempurna. Ini membuka mata dunia bahwa gerak bisa dipahami lewat angka dan rumus, bukan sekadar filosofi belaka.',
        img: 'assets/history/lvl1-galileo-incline.webp',
        source: 'NASA Glenn Research Center & Multiple Indonesian Physics Sources',
        year: '1564-1642'
      },
      {
        heading: 'Hukum Inersia Newton: Benda Malas Berubah',
        text: 'Setelah Galileo, Isaac Newton merumuskan "Hukum Pertama Gerak" yang menjadi fondasi fisika modern. Intinya sederhana: benda yang bergerak dengan kecepatan konstan akan tetap bergerak dengan kecepatan itu, dan benda yang diam akan tetap diam — selama tidak ada gaya luar yang mengganggu. Ini adalah konsep GLB dalam bahasa Newton: benda "malas" untuk berubah keadaannya, inilah yang disebut inersia.',
        img: 'assets/history/lvl1-newton-laws.webp',
        source: 'Britannica & Liputan6',
        year: '1643-1727'
      },
      {
        heading: 'GLB di Dunia Nyata: Dari Kereta hingga Mobil Otopilot',
        text: 'Walaupun di alam nyata gerak yang benar-benar konstan langka (ada gesekan, hambatan udara, dll), konsep GLB sangat penting. Hari ini kita lihat di mana-mana: kereta di rel yang lurus dengan kecepatan tetap, pesawat di autopilot, bahkan mobil di tol tanpa menambah gas. Hukum Newton memberi kita kemampuan memprediksi dengan presisi kapan kendaraan akan sampai tujuan. Itulah kekuatan konsep GLB yang sederhana namun fundamental.',
        img: 'assets/history/lvl1-modern-transport.webp',
        source: 'Berbagai sumber fisika & PijarBelajar',
        year: '2000-sekarang'
      }
    ]
  },

  2: {
    title: 'Sejarah Percepatan Konstan (GLBB)',
    accent: 'lvl-2',
    steps: [
      {
        heading: 'Masalah Pertama: Aristoteles Tidak Mengerti Mobil',
        text: 'Sama seperti GLB, GLBB dimulai dengan Aristoteles yang salah paham. Dia pikir yang namanya "gerak" harus ada gaya yang terus-menerus dorong, dan semakin kuat dorongan, semakin cepat benda bergerak. Tapi dia tidak pernah terbayangkan ada gerak yang kecepatannya terus bertambah secara bertahap dengan pola yang bisa diukur. Bayangkan dia hidup sekarang: pasti bingung lihat mobil yang accelerate smooth dan beraturan!',
        img: 'assets/history/lvl2-aristoteles-confusion.webp',
        source: 'Liputan6 & Kumparan',
        year: '384-322 SM'
      },
      {
        heading: 'Penemuan Penting: Bidang Miring dan Kuadrat Waktu',
        text: 'Galileo kembali datang dengan ide cemerlang. Dia tidak langsung menjatuhkan benda (takut rusak atau sulit diukur), melainkan mengelindingkan bola di bidang miring dengan sudut tertentu. Hasilnya: semakin lama bola turun, semakin cepat dia bergerak — dan yang fantastis, jarak yang ditempuh ternyata sebanding dengan KUADRAT waktu. Jika waktu dua kali lipat, jarak malah empat kali lipat! Ini adalah rumus s = ½at² dalam bentuk purest-nya.',
        img: 'assets/history/lvl2-galileo-incline-setup.webp',
        source: 'NASA & Kumparan',
        year: '1600-1642'
      },
      {
        heading: 'Percepatan: Definisi Baru untuk Perubahan Kecepatan',
        text: 'Dari eksperimen bidang miring, Galileo menyadari ada konsep baru yang penting: percepatan. Dia mendefinisikannya sebagai perubahan kecepatan per satuan waktu. Semakin curam bidangnya, semakin besar percepatannya. Dan yang krusial: dalam kondisi tertentu, percepatan ini KONSTAN — tidak berubah-ubah. Inilah inti GLBB: benda bergerak dengan percepatan tetap, maka kecepatannya bertambah linear terhadap waktu.',
        img: 'assets/history/lvl2-acceleration-concept.webp',
        source: 'Multiple Indonesian Physics Sources',
        year: '1600s'
      },
      {
        heading: 'Newton Memberi Rumus: Hukum Kedua Gerak',
        text: 'Newton tidak hanya menerima temuannya Galileo, tapi memperkuat dengan hukum matematika. Hukum Kedua Newton menyatakan: Gaya = Massa × Percepatan (F = ma). Artinya, percepatan yang dihasilkan sebanding dengan gaya yang diberikan dan berbanding terbalik dengan massa benda. Semakin kuat gas yang dinjak, percepatan mobil lebih besar. Itulah mengapa truk (bermassa besar) lebih lambat accelerate dibanding mobil sport (bermassa kecil) dengan mesin yang setara.',
        img: 'assets/history/lvl2-newton-formula.webp',
        source: 'Britannica & Kumparan',
        year: '1687'
      },
      {
        heading: 'GLBB Hari Ini: Dari Mobil hingga Roket',
        text: 'GLBB ada di mana-mana di dunia modern. Mobil yang accelerate dari lampu merah, pesawat yang mempercepat di landasan sebelum takeoff, roket yang meluncur ke luar angkasa — semua itu adalah contoh GLBB. Bahkan teknologi sensor di smartphone tahu kapan kamu menggerakkan HP, karena alat itu mengukur percepatan! Konsep Galileo dan rumus Newton yang berusia ratusan tahun ternyata masih sangat relevan dan menjadi tulang punggung teknologi transportasi modern.',
        img: 'assets/history/lvl2-modern-acceleration.webp',
        source: 'Berbagai sumber fisika',
        year: '1900-sekarang'
      }
    ]
  },

  3: {
    title: 'Sejarah Gerak Jatuh Bebas',
    accent: 'lvl-3',
    steps: [
      {
        heading: 'Kesalahan Klasik: Benda Berat Jatuh Lebih Cepat',
        text: 'Aristoteles lagi. Dia bilang benda yang lebih berat akan jatuh lebih cepat daripada benda ringan. Logikanya sederhana di permukaan: kalau kamu tanya orang awam dan mereka lihat batu sama kertas dijatuhkan, pasti batu yang lebih dulu nyentuh tanah. Kesalahan Aristoteles adalah dia tidak tahu tentang hambatan udara — si kertas punya luas permukaan besar, jadi udara mengganggu jatuhnya. Pandangan ini bertahan ribuan tahun sampai Galileo datang.',
        img: 'assets/history/lvl3-aristoteles-gravity.webp',
        source: 'Artikelnesia & Multiple Sources',
        year: '384-322 SM'
      },
      {
        heading: 'Galileo Merevolusi: Eksperimen Kertas vs Bola',
        text: 'Galileo punya ide brilian untuk buktikan Aristoteles salah. Dia ambil kertas, gulung jadi bola kecil, dan jatuhkan bersamaan dengan bola besi. Kali ini kertas (yang sudah dipadat jadi bola) jatuh hampir bersamaan dengan bola besi! Dia juga pakai logika cerdas: batu berat dijatuhkan dari tinggi 2 meter akan nembus tiang lebih dalam dibanding batu yang sama dari 0.2 meter — berarti batu dari tinggi yang lebih besar jatuh lebih cepat, itu buktiin kecepatan bertambah saat jatuh.',
        img: 'assets/history/lvl3-galileo-paper-ball.webp',
        source: 'NASA Glenn & Artikelnesia',
        year: '1600-1642'
      },
      {
        heading: 'Jarak Kuadrat Waktu: Rumus Gerak Jatuh Bebas',
        text: 'Dari eksperimen bidang miring yang sama sebelumnya, Galileo menemukan pola yang indah: jarak jatuh sebanding dengan KUADRAT waktu — sama seperti GLBB! Ini karena benda jatuh mengalami percepatan konstan yang disebabkan gravitasi bumi. Cuma momentum jatuh yang berubah: tidak ada yang mendorong, hanya tarikan gravitasi. Dengan pola ini, dia bisa prediksi: kalau benda jatuh 1 detik tempuh 5 meter, maka 2 detik akan tempuh 20 meter (4 kali lebih jauh), 3 detik akan tempuh 45 meter (9 kali lebih jauh).',
        img: 'assets/history/lvl3-fall-distance-time.webp',
        source: 'NASA & Departemen Pendidikan',
        year: '1600s'
      },
      {
        heading: 'Newton dan Gravitasi Universal: Apel yang Jatuh',
        text: 'Cerita terkenal: Newton sedang duduk di bawah pohon apel, buah apel jatuh di kepalanya. Dari kejadian sederhana itu, dia tiba-tiba mengerti: tarikan bumi ini adalah gaya yang universal, bukan hanya untuk benda yang jatuh. Gaya yang sama yang membuat apel jatuh juga membuat Bulan tetap mengorbit Bumi! Di buku "Mathematical Principles" tahun 1687, Newton mendefinisikan gravitasi sebagai gaya tarik-menarik antara dua benda yang besarnya sebanding dengan massa dan berbanding terbalik dengan kuadrat jarak. Konstanta gravitasi yang dia definisikan akhirnya diukur menjadi g = 9.8 m/s².',
        img: 'assets/history/lvl3-newton-apple.webp',
        source: 'ResearchGate & Multiple Sources',
        year: '1687'
      },
      {
        heading: 'Gravitasi Newton Masih Berlaku: Dari Pesawat hingga Luar Angkasa',
        text: 'Walaupun Einstein kemudian ngubah pemahaman gravitasi dengan relativitas umum, hukum Newton masih dipakai setiap hari. Pilot mengerti bahwa semua benda — pesawat, penumpang, cargo — mengalami gravitasi sama. Kosmonauts di orbit Internasional station sebenarnya terus jatuh (bersama stasiun mereka), tapi karena terjatuh sambil bergerak ke samping dengan sangat cepat, mereka tetap di orbit — "weightless" tapi tetap ditarik gravitasi. Hukum Newton yang berusia 300+ tahun ini masih menjadi satu-satunya cara yang cukup akurat untuk menghitung lintasan satelit, roket, dan mengapa kita bisa tetap berdiri di Bumi.',
        img: 'assets/history/lvl3-modern-gravity.webp',
        source: 'NASA & Berbagai sumber fisika',
        year: '1900-sekarang'
      }
    ]
  }
};

// ===== UI COMPONENT: Card Stack (Dashboard History)
// Atur posisi, swipe, dan morph card-card di dashboard history

class HistoryCardStack {
  constructor() {
    this.historyOrder = [1, 2, 3]; // Default order, bisa di-rotate
    this.containerEl = null;
    this.isDragging = false;
    this.dragStartX = 0;
    this.currentX = 0;
  }

  render(container) {
    this.containerEl = container;
    container.innerHTML = '';
    container.classList.add('history-stack');

    // Render sampai 3 card (index 0, 1, 2)
    this.historyOrder.slice(0, 3).forEach((levelId, idx) => {
      const card = this.createCard(levelId, idx);
      container.appendChild(card);
    });

    // Attach events ke card paling depan (index 0)
    const frontCard = container.querySelector('[data-card-index="0"]');
    if (frontCard) {
      this.attachPointerEvents(frontCard);
      this.attachTapEvent(frontCard);
    }
  }

  createCard(levelId, cardIndex) {
    const histData = HISTORY[levelId];
    const card = document.createElement('div');
    card.className = 'history-card';
    card.classList.add(`history-card-lvl${levelId}`);
    card.dataset.cardIndex = cardIndex;
    card.dataset.levelId = levelId;

    // Calculate stacked position
    const offsetY = cardIndex * -14; // -0, -14, -28
    const scale = 1 - cardIndex * 0.04; // 1, 0.96, 0.92
    const opacity = 1 - cardIndex * 0.15; // 1, 0.85, 0.7

    card.style.transform = `translateY(${offsetY}px) scale(${scale})`;
    card.style.opacity = opacity;
    card.style.zIndex = 100 - cardIndex;

    card.innerHTML = `
      <div class="hc-content">
        <div class="hc-header">
          <h3 class="hc-title">${histData.title}</h3>
          <span class="hc-meta">Level ${levelId}</span>
        </div>
        <p class="hc-desc">Jelajahi sejarah perkembangan konsep fisika ini melalui 5 cerita menarik.</p>
      </div>
      <div class="hc-footer">
        <div class="hc-avatar-group">
          <!-- Placeholder avatar grup (3 lingkaran abstrak) -->
          <span class="hc-avatar"></span>
          <span class="hc-avatar"></span>
          <span class="hc-avatar"></span>
        </div>
        <button class="hc-action-btn ripple-host" aria-label="Buka sejarah level ${levelId}">
          <span class="hc-icon-play"></span>
        </button>
      </div>
    `;

    return card;
  }

  attachPointerEvents(card) {
    card.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.currentX = 0;
      card.style.cursor = 'grabbing';
    });

    document.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      this.currentX = e.clientX - this.dragStartX;
      card.style.transform = `translateX(${this.currentX}px) rotateZ(${this.currentX * 0.05}deg)`;
    });

    document.addEventListener('pointerup', (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      card.style.cursor = 'grab';

      // Threshold untuk trigger swipe
      const threshold = 60; // pixel
      if (Math.abs(this.currentX) > threshold) {
        const direction = this.currentX > 0 ? 1 : -1;
        this.swipeCard(card, direction);
      } else {
        // Snap back
        gsap.to(card, {
          x: 0,
          rotationZ: 0,
          duration: 0.4,
          ease: 'elastic.out(1.2)'
        });
      }
    });
  }

  swipeCard(card, direction) {
    // Animate card out
    const exitX = direction > 0 ? 400 : -400;
    gsap.to(card, {
      x: exitX,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        // Rotate array: card paling depan pindah ke belakang
        this.historyOrder.push(this.historyOrder.shift());
        this.animateStackForward();
      }
    });
  }

  animateStackForward() {
    // Render ulang dengan animasi smooth
    const container = this.containerEl;
    const cards = container.querySelectorAll('.history-card');

    cards.forEach((card, idx) => {
      const newIdx = (idx + 1) % 3;
      if (newIdx < this.historyOrder.length) {
        const newOffsetY = newIdx * -14;
        const newScale = 1 - newIdx * 0.04;
        const newOpacity = 1 - newIdx * 0.15;

        gsap.to(card, {
          y: newOffsetY,
          scale: newScale,
          opacity: newOpacity,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    });

    // Buat card baru di belakang setelah animasi
    setTimeout(() => {
      this.render(container);
    }, 600);
  }

  attachTapEvent(card) {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.hc-action-btn')) {
        const levelId = parseInt(card.dataset.levelId);
        this.morphToWizard(card, levelId);
      }
    });
  }

  morphToWizard(card, levelId) {
    // FLIP morph: dari card ke fullscreen wizard
    // Untuk sekarang, cukup navigate, animasi FLIP nanti dihandle di screens.js
    navigate('history-wizard', { level: levelId });
  }
}

// ===== Wizard Render: Baca Sejarah Step-by-Step
function renderHistoryWizard(level) {
  if (!HISTORY[level]) return;

  const histData = HISTORY[level];
  const wizard = window.historyWizard || (window.historyWizard = { level, step: 0 });
  wizard.level = level;
  wizard.step = Math.min(wizard.step, histData.steps.length - 1);

  const currentStep = histData.steps[wizard.step];
  const wizardBody = document.getElementById('historyWizardBody');
  const wizPrimary = document.getElementById('historyWizPrimary');
  const wizBack = document.getElementById('historyWizBack');
  const wizProgress = document.getElementById('historyWizProgress');
  const wizExit = document.getElementById('historyWizExit');

  if (!wizardBody) return; // Element belum exist
  
  // Setup exit button (first time only)
  if (wizExit && !wizExit.dataset.attached) {
    wizExit.dataset.attached = 'true';
    wizExit.onclick = () => navigate('history', {}, false);
  }

  // Update progress (wizProgress adalah element fill, bukan track)
  const progressPercent = ((wizard.step + 1) / histData.steps.length) * 100;
  if (wizProgress) {
    gsap.to(wizProgress, { width: progressPercent + '%', duration: 0.4, ease: 'power2.out' });
  }

  // Render step content dengan smooth transition
  wizardBody.innerHTML = `
    <div class="hw-step-container">
      <div class="hw-image-wrapper">
        <img class="hw-image" src="${currentStep.img}" alt="${currentStep.heading}" 
             onerror="this.parentElement.classList.add('hw-image-error')">
        <div class="hw-image-fallback">
          <svg class="hw-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <path d="M9 11l3 3L22 4"></path>
          </svg>
        </div>
      </div>
      <div class="hw-text-content">
        <h2 class="hw-heading">${currentStep.heading}</h2>
        <p class="hw-text">${currentStep.text}</p>
        <div class="hw-meta">
          <span class="hw-source">Sumber: ${currentStep.source}</span>
          <span class="hw-year">${currentStep.year}</span>
        </div>
      </div>
    </div>
  `;

  // Update button text
  const isLastStep = wizard.step === histData.steps.length - 1;
  if (wizPrimary) {
    wizPrimary.textContent = isLastStep ? 'Selesai' : 'Lanjut';
    wizPrimary.disabled = false;
    wizPrimary.onclick = () => {
      if (isLastStep) {
        navigate('history', {}, false);
      } else {
        wizard.step++;
        renderHistoryWizard(level);
      }
    };
  }

  // Update back button
  if (wizBack) {
    wizBack.disabled = wizard.step === 0;
    wizBack.onclick = () => {
      if (wizard.step > 0) {
        wizard.step--;
        renderHistoryWizard(level);
      }
    };
  }

  // Animate in
  gsap.fromTo(wizardBody, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
}

