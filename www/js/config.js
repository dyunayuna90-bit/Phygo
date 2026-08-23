"use strict";

const STEP_COUNTS = {1:11, 2:14, 3:14}; // Diperbarui untuk Kuis Tambahan

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
      `Mobil tidak langsung melaju di kecepatan tertinggi. Mesin memberikan dorongan secara perlahan dan terus menerus—inilah percepatan. Kecepatan akan terus bertambah setiap detiknya.`,
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

