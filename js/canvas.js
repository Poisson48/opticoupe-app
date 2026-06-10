'use strict';
import { S, CM } from './state.js';

export function panelScale(panelW, panelH) {
  return Math.min(600 / panelW, 420 / panelH);
}

// Draw a full panel canvas.
// drag    = { idx, valid, ghost? } or null
// ghostPl = floating piece preview from cross-canvas drag or null
export function drawPanel(canvas, sheet, panelW, panelH, kerf, drag, hoverIdx=-1, flashIdx=-1, ghostPl=null) {
  const sc = panelScale(panelW, panelH);
  canvas._sc = sc; canvas._panelW = panelW; canvas._panelH = panelH; canvas._kerf = kerf;
  canvas.width  = Math.round(panelW * sc) + CM * 2;
  canvas.height = Math.round(panelH * sc) + CM * 2;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Wood background
  ctx.fillStyle = '#c8954a'; ctx.strokeStyle = '#7a5520'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(CM, CM, panelW*sc, panelH*sc, 3); ctx.fill(); ctx.stroke();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(CM, CM, panelW*sc, panelH*sc, 3); ctx.clip();
  ctx.strokeStyle = 'rgba(100,60,20,.09)'; ctx.lineWidth = 1;
  for (let y = CM+10; y < canvas.height-CM; y += 12) {
    ctx.beginPath(); ctx.moveTo(CM, y); ctx.lineTo(canvas.width-CM, y); ctx.stroke();
  }
  ctx.restore();

  // Free rects (offcuts)
  if (S.showOffcuts && !sheet._edited) {
    const frs = sheet.freeRects;
    (Array.isArray(frs) ? frs : []).forEach(r => {
      const rx = CM+r.x*sc, ry = CM+r.y*sc;
      const rw = Math.max(0, (r.w-kerf)*sc), rh = Math.max(0, (r.h-kerf)*sc);
      if (rw < 2 || rh < 2) return;
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
      ctx.fillStyle = 'rgba(79,195,247,.1)'; ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = 'rgba(79,195,247,.22)'; ctx.lineWidth = 1;
      for (let i = -rh; i < rw; i += 9) {
        ctx.beginPath(); ctx.moveTo(rx+i, ry); ctx.lineTo(rx+i+rh, ry+rh); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(79,195,247,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.stroke();
      if (rw > 55 && rh > 22) {
        ctx.fillStyle = 'rgba(79,195,247,.85)';
        ctx.font = `${Math.min(10, rh*.38)}px 'Segoe UI',sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(r.w-kerf)}×${Math.round(r.h-kerf)}`, rx+rw/2, ry+rh/2);
      }
      ctx.restore();
    });
  }

  // Placed pieces
  sheet.placements.forEach((pl, i) => {
    const isDrag  = drag && drag.idx === i;
    const isFlash = flashIdx === i;
    const pw = Math.max(0, (pl.w-kerf)*sc), ph = Math.max(0, (pl.h-kerf)*sc);
    const px = CM+pl.x*sc, py = CM+pl.y*sc;
    ctx.save();
    if (isDrag) ctx.globalAlpha = drag.ghost ? 0.22 : (drag.valid ? 0.82 : 0.55);
    ctx.fillStyle  = (isDrag && !drag.valid) || isFlash ? 'rgba(233,69,96,.55)' : pl.piece.color+'bb';
    ctx.strokeStyle= (isDrag && !drag.valid) || isFlash ? '#e94560'              : pl.piece.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 2); ctx.fill(); ctx.stroke();
    const dw = pl.rotated ? pl.piece.origH : pl.piece.origW;
    const dh = pl.rotated ? pl.piece.origW : pl.piece.origH;
    drawPieceLabel(ctx, px, py, pw, ph, pl.piece.name||'', dw, dh, pl.rotated);
    ctx.restore();
  });

  // Ghost piece (cross-canvas drag preview on destination canvas)
  if (ghostPl) {
    const gpw = Math.max(0, (ghostPl.w-kerf)*sc), gph = Math.max(0, (ghostPl.h-kerf)*sc);
    const gpx = CM+ghostPl.x*sc, gpy = CM+ghostPl.y*sc;
    ctx.save();
    ctx.globalAlpha = ghostPl.valid ? 0.65 : 0.35;
    ctx.fillStyle   = ghostPl.piece.color + 'bb';
    ctx.strokeStyle = ghostPl.valid ? ghostPl.piece.color : '#e94560';
    ctx.lineWidth = ghostPl.valid ? 1.5 : 2;
    if (!ghostPl.valid) ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.roundRect(gpx, gpy, gpw, gph, 2); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    const gdw = ghostPl.rotated ? ghostPl.piece.origH : ghostPl.piece.origW;
    const gdh = ghostPl.rotated ? ghostPl.piece.origW : ghostPl.piece.origH;
    drawPieceLabel(ctx, gpx, gpy, gpw, gph, ghostPl.piece.name||'', gdw, gdh, ghostPl.rotated);
    ctx.restore();
  }

  // Rotate button overlay on hovered piece
  if (hoverIdx >= 0 && hoverIdx < sheet.placements.length && !drag) {
    drawRotateBtn(ctx, sheet.placements[hoverIdx], sc, kerf);
  }
}

export function drawRotateBtn(ctx, pl, sc, kerf) {
  const pw = Math.max(0, (pl.w-kerf)*sc), ph = Math.max(0, (pl.h-kerf)*sc);
  if (pw < 36 || ph < 30) return;
  const bx = CM+pl.x*sc+pw-14, by = CM+pl.y*sc+14;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1c28';
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('↻', bx, by+1);
  ctx.restore();
}

export function isOverRotBtn(mx, my, pl, sc, kerf) {
  const pw = Math.max(0, (pl.w-kerf)*sc), ph = Math.max(0, (pl.h-kerf)*sc);
  if (pw < 36 || ph < 30) return false;
  const bx = CM+pl.x*sc+pw-14, by = CM+pl.y*sc+14;
  return (mx-bx)**2 + (my-by)**2 <= 100;
}

function drawPieceLabel(ctx, px, py, pw, ph, name, dw, dh, rotated) {
  if (pw < 14 || ph < 10) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(px+2, py+2, pw-4, ph-4); ctx.clip();
  const fs = Math.min(11, ph*0.28, pw*0.14);
  if (fs < 5.5) { ctx.restore(); return; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = px+pw/2, cy = py+ph/2;
  const dim = `${dw}×${dh}${rotated ? ' ↺' : ''}`;
  if (ph > fs*2.8 && pw > 32) {
    ctx.font = `bold ${fs}px 'Segoe UI',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.fillText(fitText(ctx, name, pw-8), cx, cy-fs*0.75);
    ctx.font = `${Math.max(5.5, fs*0.82)}px 'Segoe UI',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.58)';
    ctx.fillText(fitText(ctx, dim, pw-8), cx, cy+fs*0.85);
  } else {
    ctx.font = `bold ${fs}px 'Segoe UI',sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fillText(fitText(ctx, name, pw-6), cx, cy);
  }
  ctx.restore();
}

function fitText(ctx, text, maxW) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text+'…').width > maxW) text = text.slice(0,-1);
  return text.length > 1 ? text+'…' : text;
}
