"use strict";

const STEP_COUNTS = {1:11, 2:14, 3:14}; // Diperbarui untuk Kuis Tambahan

// ===== Kutipan Tokoh Fisika (asli, diterjemahkan formal ke Bahasa Indonesia) =====
// Ditampilkan bergantian di kartu Home — berganti setiap aplikasi dibuka
// ulang atau setiap kali user naik level (lihat bumpQuoteIndex() di state.js).
const PHYSICS_QUOTES = [
  { text:"Imajinasi lebih penting daripada pengetahuan, sebab pengetahuan itu terbatas, sedangkan imajinasi merangkul seluruh dunia.", by:"Albert Einstein", year:"1929" },
  { text:"Jika aku dapat melihat lebih jauh, itu karena aku berdiri di atas bahu raksasa-raksasa sebelumku.", by:"Isaac Newton", year:"1675" },
  { text:"Aku tidak memiliki bakat khusus. Aku hanya memiliki rasa ingin tahu yang menggebu-gebu.", by:"Albert Einstein", year:"1952" },
  { text:"Dalam hidup ini, tidak ada yang perlu ditakuti, yang ada hanyalah yang perlu dipahami.", by:"Marie Curie", year:"1937" },
  { text:"Tidak ada yang terlalu menakjubkan untuk menjadi kenyataan, selama hal itu sejalan dengan hukum alam.", by:"Michael Faraday", year:"1849" },
  { text:"Masa kini adalah milik mereka, tetapi masa depan yang sesungguhnya kuperjuangkan adalah milikku.", by:"Nikola Tesla", year:"1919" },
  { text:"Sebuah kebenaran ilmiah baru tidak menang dengan meyakinkan para penentangnya, melainkan karena penentangnya pada akhirnya wafat.", by:"Max Planck", year:"1950" },
  { text:"Aku lebih memilih memiliki pertanyaan yang belum terjawab daripada jawaban yang tidak boleh dipertanyakan.", by:"Richard Feynman", year:"1981" },
  { text:"Semua ilmu pengetahuan adalah fisika; selebihnya hanyalah sekadar mengoleksi perangko.", by:"Ernest Rutherford" }
];

// ===== Informasi Aplikasi (ditampilkan di Pengaturan > Tentang Aplikasi) =====
const APP_INFO = {
  purpose: "Phygo dikembangkan untuk memenuhi kebutuhan lomba Pekan Ilmiah, Universitas Negeri Jakarta.",
  team: ["Ilham Danial Saputra", "Dinda Aisyah Erini", "Zahwa Khoirunnisa Ramadanti"],
  repoUrl: "https://github.com/dyunayuna90-bit/Phygo"
};

const LEVELS = {
  1:{
    eyebrow:'Level 1 — Stabil', title:'Kecepatan Konstan (GLB)', accent:'lvl-1', icon:'speed',
    materi:[
      `Sebuah benda dikatakan bergerak lurus beraturan (GLB) jika kecepatannya selalu tetap. Tidak melesat tiba-tiba, dan tidak mengerem mendadak.`,
      `Secara sederhana: Jarak yang kamu tempuh adalah seberapa cepat kamu berjalan dikali berapa lama kamu berjalan.`
    ],
    analogy:`Bayangkan berjalan kaki dengan tempo yang teratur. Jaraknya hanya bergantung pada seberapa lama kamu berjalan.`,
    formula:'v = \\dfrac{s}{t}',
    formulaNote:`${texi(String.raw`v`)} = kecepatan, ${texi(String.raw`s`)} = jarak, ${texi(String.raw`t`)} = waktu`,
    genParams(){ const T=Math.round(rand(6,10)), S=roundTo(rand(70,150),5); return {S,T,correct:S/T,ctrlMax:Math.ceil(Math.max(S/T*1.6,20)/5)*5}; }
  },
  2:{
    eyebrow:'Level 2 — Terus Meningkat', title:'Percepatan Konstan (GLBB)', accent:'lvl-2', icon:'accel',
    materi:[
      `Mobil tidak langsung melaju di kecepatan tertinggi. Mesin memberikan dorongan secara perlahan dan terus menerusinilah percepatan. Kecepatan akan terus bertambah setiap detiknya.`,
      `Karena semakin lama semakin cepat, jarak yang ditempuh juga akan semakin besar, tidak cuma bertambah secara merata.`
    ],
    analogy:`Ini seperti kamu berlari dengan semakin cepat, sampai akhirnya kamu menyusul temanmu yang larinya santai.`,
    formula:'s = v_0 t + \\dfrac{1}{2} a t^2',
    formulaNote:`${texi(String.raw`s`)} = jarak target, ${texi(String.raw`v_0`)} = kec. awal (nol), ${texi(String.raw`a`)} = percepatan, ${texi(String.raw`t`)} = batas waktu`,
    genParams(){ const T=Math.round(rand(5,8)), S=roundTo(rand(50,110),5); return {S,T,correct:(2*S)/(T*T),ctrlMax:Math.ceil(Math.max((2*S)/(T*T)*1.6,8)/2)*2}; }
  },
  3:{
    eyebrow:'Level 3 — Gravitasi', title:'Gerak Jatuh Bebas', accent:'lvl-3', icon:'drop',
    materi:[
      `Ini adalah bentuk percepatan dari alam. Benda dilepaskan tanpa dorongan tambahan. Hanya ditarik oleh gravitasi bumi yang stabil (9,8 m/s²).`,
      `Karena tarikan bumi selalu konstan, kita bisa menebak kapan benda menyentuh tanah hanya dengan mengetahui ketinggiannya.`
    ],
    analogy:`Batu atau kapas, jika udara diabaikan, bumi akan menariknya dengan kekuatan yang sama.`,
    formula:'h = \\dfrac{1}{2} g t^2',
    formulaNote:`${texi(String.raw`h`)} = tinggi jatuh, ${texi(String.raw`g`)} = gravitasi (9,8 m/s²), ${texi(String.raw`t`)} = waktu jatuh`,
    genParams(){ const H=Math.round(rand(13,27)); return {H,correct:Math.sqrt(2*H/9.8),ctrlMax:Math.ceil(Math.max(Math.sqrt(2*H/9.8)*1.6,3)*2)/2}; }
  }
};

// ===== Halaman "Sejarah" — Arsip sejarah fisika per level, gaya wizard =====
// Gambar diambil dari folder assets/history/levelN/ (lihat catatan struktur
// asset di jawaban chat). Kalau file gambar belum ada / gagal dimuat, tampilan
// otomatis beralih ke ikon placeholder (lihat renderHistoryWizardStep + CSS
// .img-missing di style.css) sehingga aplikasi tidak pernah pecah tampilannya
// walau asetnya belum lengkap.
const HISTORY_LEVELS = {
  1:{
    eyebrow:'Arsip Level 1', title:'Jejak Gerak Lurus Beraturan (GLB)', icon:'speed',
    summary:'Bagaimana manusia butuh hampir dua ribu tahun untuk sadar bahwa benda bisa terus bergerak stabil tanpa perlu terus-menerus didorong.',
    arsip:[
      {
        tag:'Sekitar Abad ke-4 SM',
        title:'Dugaan Kuno: Gerak Butuh Dorongan Terus-Menerus',
        image:'assets/history/level1/level1-01-aristoteles.webp',
        imageAlt:'Ilustrasi Aristoteles, filsuf Yunani Kuno',
        figure:{ name:'Aristoteles', years:'384–322 SM', role:'Filsuf Yunani Kuno' },
        body:[
          `Ribuan tahun lalu, filsuf Yunani <b>Aristoteles</b> mengamati bahwa kereta akan berhenti begitu kudanya berhenti menarik. Dari situ ia menyimpulkan: benda hanya bisa bergerak selama ada sesuatu yang terus mendorongnya.`,
          `Kesimpulan ini terdengar masuk akal di kehidupan sehari-hari (karena gesekan selalu ada), sehingga pandangan ini dipercaya nyaris tanpa bantahan selama lebih dari 1.800 tahun.`
        ]
      },
      {
        tag:'Awal Abad ke-17',
        title:'Galileo dan Bidang Miring yang Licin',
        image:'assets/history/level1/level1-02-galileo.webp',
        imageAlt:'Ilustrasi eksperimen bidang miring Galileo Galilei',
        figure:{ name:'Galileo Galilei', years:'1564–1642', role:'Astronom & Fisikawan Italia' },
        body:[
          `Galileo Galilei mencoba sesuatu yang sederhana namun radikal: menggelindingkan bola di bidang miring yang dipoles sehalus mungkin untuk mengurangi gesekan.`,
          `Ia mendapati, semakin licin permukaannya, semakin lama bola itu <b>mempertahankan kecepatannya</b> tanpa melambat. Dari sana muncul gagasan baru: gerak dengan kecepatan tetap sebenarnya adalah keadaan "alami" suatu benda bukan sesuatu yang butuh dorongan terus-menerus seperti kata Aristoteles.`
        ]
      },
      {
        tag:'1687',
        title:'Newton Meresmikan Hukum Kelembaman',
        image:'assets/history/level1/level1-03-newton.webp',
        imageAlt:'Ilustrasi Isaac Newton dan buku Principia Mathematica',
        figure:{ name:'Isaac Newton', years:'1642–1727', role:'Fisikawan & Matematikawan Inggris' },
        body:[
          `Dalam bukunya <i>Philosophiæ Naturalis Principia Mathematica</i> (1687), Isaac Newton merumuskan gagasan Galileo secara matematis lewat <b>Hukum I Newton</b>: benda akan tetap diam, atau bergerak lurus dengan kecepatan tetap, selama tidak ada gaya total yang bekerja padanya.`,
          `Sejak saat itu, pandangan Aristoteles yang bertahan ribuan tahun resmi digantikan dan gerak lurus beraturan (GLB) diakui sebagai konsep dasar fisika gerak.`
        ]
      },
      {
        tag:'Masa Kini',
        title:'GLB dalam Kehidupan Sehari-hari',
        image:'assets/history/level1/level1-04-modern.webp',
        imageAlt:'Ilustrasi kereta cepat melaju stabil di rel',
        body:[
          `Rumus sederhana yang lahir dari eksperimen bidang miring itu kini dipakai di mana-mana: menghitung jadwal kereta, kecepatan jelajah pesawat, hingga estimasi waktu tempuh di aplikasi peta.`
        ],
        formula:'v = \\dfrac{s}{t}',
        formulaNote:`${texi(String.raw`v`)} = kecepatan, ${texi(String.raw`s`)} = jarak, ${texi(String.raw`t`)} = waktu`
      }
    ]
  },
  2:{
    eyebrow:'Arsip Level 2', title:'Jejak Percepatan Konstan (GLBB)', icon:'accel',
    summary:'Kisah bagaimana Galileo pertama kali berhasil "mengukur" sesuatu yang terus berubah kecepatan yang makin lama makin cepat.',
    arsip:[
      {
        tag:'Sebelum Abad ke-17',
        title:'Masalah Lama: Gerak yang Terus Berubah',
        image:'assets/history/level2/level2-01-masalah.webp',
        imageAlt:'Ilustrasi batu menggelinding turun dari bukit',
        body:[
          `Menjelaskan benda yang bergerak dengan kecepatan tetap saja sudah sulit apalagi benda yang kecepatannya terus bertambah, seperti batu yang menggelinding turun dari bukit atau buah yang jatuh dari pohon.`,
          `Sebelum ada alat ukur waktu yang presisi, para pemikir kesulitan membuktikan pola apa pun di balik gerak jenis ini.`
        ]
      },
      {
        tag:'Sekitar 1604–1609',
        title:'Eksperimen Bidang Miring Galileo',
        image:'assets/history/level2/level2-02-eksperimen.webp',
        imageAlt:'Ilustrasi Galileo mengukur waktu dengan jam air',
        figure:{ name:'Galileo Galilei', years:'1564–1642', role:'Astronom & Fisikawan Italia' },
        body:[
          `Galileo memperlambat efek gravitasi dengan bidang miring, lalu mengukur waktu tempuh bola menggunakan jam air (karena jam mekanik presisi belum ada). Ia mengulang eksperimen ini berkali-kali dengan sangat teliti.`,
          `Hasilnya mengejutkan: jarak yang ditempuh ternyata berbanding lurus dengan <b>kuadrat waktu</b> tempuhnya. Inilah bukti eksperimen pertama dari apa yang sekarang kita sebut gerak lurus berubah beraturan (GLBB).`
        ]
      },
      {
        tag:'1638',
        title:'Diterbitkan dalam "Dua Ilmu Baru"',
        image:'assets/history/level2/level2-03-buku.webp',
        imageAlt:'Ilustrasi buku Discorsi e Dimostrazioni Matematiche karya Galileo',
        body:[
          `Galileo membukukan hasil riset seumur hidupnya dalam <i>Discorsi e Dimostrazioni Matematiche, intorno a due nuove scienze</i> ("Dua Ilmu Baru"), 1638 memuat penjelasan matematis pertama tentang gerak dipercepat beraturan.`,
          `Buku ini ditulis di masa-masa akhir hidupnya, saat ia berada dalam tahanan rumah, namun tetap menjadi salah satu fondasi terpenting fisika modern.`
        ]
      },
      {
        tag:'Masa Kini',
        title:'GLBB dalam Rekayasa Modern',
        image:'assets/history/level2/level2-04-modern.webp',
        imageAlt:'Ilustrasi mobil berakselerasi di lintasan uji',
        body:[
          `Rumus GLBB kini menjadi dasar perhitungan akselerasi mobil, landasan pacu pesawat, hingga desain roller coaster yang aman dinaiki.`
        ],
        formula:'s = v_0 t + \\dfrac{1}{2} a t^2',
        formulaNote:`${texi(String.raw`s`)} = jarak, ${texi(String.raw`v_0`)} = kec. awal, ${texi(String.raw`a`)} = percepatan, ${texi(String.raw`t`)} = waktu`
      }
    ]
  },
  3:{
    eyebrow:'Arsip Level 3', title:'Jejak Gerak Jatuh Bebas', icon:'drop',
    summary:'Dari kepercayaan keliru yang bertahan dua milenium, sampai dibuktikan langsung di permukaan Bulan.',
    arsip:[
      {
        tag:'Sekitar Abad ke-4 SM',
        title:'"Benda Berat Jatuh Lebih Cepat"',
        image:'assets/history/level3/level3-01-aristoteles.webp',
        imageAlt:'Ilustrasi dua benda berbeda berat dijatuhkan bersamaan',
        figure:{ name:'Aristoteles', years:'384–322 SM', role:'Filsuf Yunani Kuno' },
        body:[
          `Aristoteles berpendapat, benda yang lebih berat akan jatuh lebih cepat ke tanah dibanding benda yang lebih ringan. Klaim ini diterima nyaris tanpa bantahan selama hampir dua ribu tahun.`
        ]
      },
      {
        tag:'Awal Abad ke-17',
        title:'Galileo Menantang Aristoteles',
        image:'assets/history/level3/level3-02-galileo.webp',
        imageAlt:'Ilustrasi Galileo dengan bola-bola berbeda berat',
        figure:{ name:'Galileo Galilei', years:'1564–1642', role:'Astronom & Fisikawan Italia' },
        body:[
          `Lewat penalaran logis dan eksperimen bidang miringnya, Galileo menunjukkan bahwa <b>tanpa hambatan udara</b>, semua benda sebenarnya jatuh dengan percepatan yang sama besar tidak peduli seberapa berat bendanya.`,
          `Kisah ia menjatuhkan bola dari Menara Pisa memang populer, tapi para sejarawan meyakini pembuktian sesungguhnya lebih banyak berasal dari eksperimen bidang miring yang lebih presisi dan bisa diulang berkali-kali.`
        ]
      },
      {
        tag:'1687',
        title:'Hukum Gravitasi Universal Newton',
        image:'assets/history/level3/level3-03-newton.webp',
        imageAlt:'Ilustrasi Isaac Newton merumuskan hukum gravitasi',
        figure:{ name:'Isaac Newton', years:'1642–1727', role:'Fisikawan & Matematikawan Inggris' },
        body:[
          `Newton menyempurnakan gagasan Galileo lewat hukum gravitasi universal: setiap benda ditarik ke bumi dengan percepatan gravitasi yang nyaris konstan, sekitar 9,8 m/s².`
        ],
        formula:'h = \\dfrac{1}{2} g t^2',
        formulaNote:`${texi(String.raw`h`)} = tinggi jatuh, ${texi(String.raw`g`)} = gravitasi (9,8 m/s²), ${texi(String.raw`t`)} = waktu`
      },
      {
        tag:'2 Agustus 1971',
        title:'Dibuktikan Langsung di Permukaan Bulan',
        image:'assets/history/level3/level3-04-apollo15.webp',
        imageAlt:'Ilustrasi astronot Apollo 15 menjatuhkan palu dan bulu di Bulan',
        figure:{ name:'David Scott', years:'Misi Apollo 15', role:'Astronot NASA' },
        body:[
          `Astronot David Scott menjatuhkan sebuah palu dan bulu burung secara bersamaan di permukaan Bulan yang hampa udara, disiarkan langsung ke seluruh dunia.`,
          `Karena tidak ada hambatan udara sama sekali, keduanya menyentuh permukaan Bulan <b>pada saat yang sama persis</b> membuktikan gagasan Galileo secara nyata, hampir 350 tahun setelah pertama kali diajukan.`
        ]
      }
    ]
  }
};

