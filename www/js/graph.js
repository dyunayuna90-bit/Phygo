"use strict";

function graphCtx(canvas){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, rect.width*dpr);
  canvas.height = Math.max(1, rect.height*dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return { ctx, w: rect.width, h: rect.height };
}
function drawAxes(ctx, w, h){
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(15,h-15); ctx.lineTo(w-15,h-15); ctx.moveTo(15,15); ctx.lineTo(15,h-15); ctx.stroke();
}
function drawSeries(ctx, w, h, points, xMax, yMax, color, dashed){
  if(points.length < 2) return;
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.setLineDash(dashed ? [6,6] : []);
  ctx.shadowColor = color; ctx.shadowBlur = dashed ? 0 : 8;
  points.forEach((p,i)=>{
    const px = 15 + clamp(p.x/xMax,0,1)*(w-30);
    const py = (h-15) - clamp(p.y/yMax,0,1)*(h-30);
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  });
  ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
}

