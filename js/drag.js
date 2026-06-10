'use strict';
import { S, CM } from './state.js';
import { t } from './i18n.js';
import { drawPanel, isOverRotBtn } from './canvas.js';

const tip = () => document.getElementById('tip');
export const showTip = (msg, x, y) => {
  const el = tip(); el.textContent = msg;
  el.style.left = (x+14)+'px'; el.style.top = (y+12)+'px'; el.style.display = 'block';
};
export const hideTip = () => { tip().style.display = 'none'; };

// Convert client (cx,cy) to panel-space coordinates on canvas c
export function toPanelCoords(c, cx, cy) {
  const r = c.getBoundingClientRect();
  return { px: (cx - r.left - CM) / c._sc, py: (cy - r.top - CM) / c._sc };
}

// Return the panel canvas (has ._key set) under the given client coordinates
function panelCanvasAt(cx, cy) {
  const el = document.elementFromPoint(cx, cy);
  return (el && el.tagName === 'CANVAS' && el._key !== undefined) ? el : null;
}

// Snap (nx,ny) to panel edges and adjacent piece edges.  sc = canvas._sc
function snapPos(nx, ny, pw, ph, sheet, excludeIdx, sc) {
  const SNAP = 8 / sc;
  let sx = nx, sy = ny, dx = SNAP+1, dy = SNAP+1;
  const tryX = v => { const d = Math.abs(nx-v); if (d < dx) { dx = d; sx = v; } };
  const tryY = v => { const d = Math.abs(ny-v); if (d < dy) { dy = d; sy = v; } };
  tryX(0); tryX(sheet.W - pw);
  tryY(0); tryY(sheet.H - ph);
  sheet.placements.forEach((o, i) => {
    if (i === excludeIdx) return;
    tryX(o.x); tryX(o.x+o.w); tryX(o.x-pw); tryX(o.x+o.w-pw);
    tryY(o.y); tryY(o.y+o.h); tryY(o.y-ph); tryY(o.y+o.h-ph);
  });
  return {
    sx: Math.max(0, Math.min(sheet.W-pw, sx)),
    sy: Math.max(0, Math.min(sheet.H-ph, sy)),
  };
}

// True if piece (pw×ph) at (nx,ny) fits inside sheet without overlap
function fitsOk(pw, ph, nx, ny, sheet, excludeIdx) {
  if (nx < 0 || ny < 0 || nx+pw > sheet.W || ny+ph > sheet.H) return false;
  return !sheet.placements.some((o, i) =>
    i !== excludeIdx && nx < o.x+o.w && nx+pw > o.x && ny < o.y+o.h && ny+ph > o.y
  );
}

// ─── Document-level drag handlers (active while xDrag is set) ─────────────────
function _docMove(e) {
  if (!S.xDrag) return;
  const { srcCanvas: srcC } = S.xDrag;
  const srcSheet = srcC._sheet;
  const pl = srcSheet.placements[S.xDrag.plIdx];
  const pw = pl.w, ph = pl.h;

  const tgtC = panelCanvasAt(e.clientX, e.clientY);
  const sameSrc = !tgtC || tgtC === srcC;

  if (sameSrc) {
    const { px, py } = toPanelCoords(srcC, e.clientX, e.clientY);
    const { sx, sy } = snapPos(Math.round(px - S.xDrag.offX), Math.round(py - S.xDrag.offY), pw, ph, srcSheet, S.xDrag.plIdx, srcC._sc);
    pl.x = sx; pl.y = sy;
    S.xDrag.valid = fitsOk(pw, ph, sx, sy, srcSheet, S.xDrag.plIdx);
    S.xDrag.dropCanvas = srcC; S.xDrag.dropX = sx; S.xDrag.dropY = sy;
    _clearLastGhost(srcC);
    S.xDrag.lastTgt = srcC;
    drawPanel(srcC, srcSheet, srcC._panelW, srcC._panelH, srcC._kerf, { idx: S.xDrag.plIdx, valid: S.xDrag.valid }, -1);
  } else {
    const tgtSheet = tgtC._sheet;
    const { px, py } = toPanelCoords(tgtC, e.clientX, e.clientY);
    const { sx, sy } = snapPos(Math.round(px - S.xDrag.offX), Math.round(py - S.xDrag.offY), pw, ph, tgtSheet, -1, tgtC._sc);
    const valid = fitsOk(pw, ph, sx, sy, tgtSheet, -1);
    S.xDrag.dropCanvas = tgtC; S.xDrag.dropX = sx; S.xDrag.dropY = sy; S.xDrag.valid = valid;
    // Show ghost on source, preview on destination
    drawPanel(srcC, srcSheet, srcC._panelW, srcC._panelH, srcC._kerf, { idx: S.xDrag.plIdx, valid:true, ghost:true }, -1);
    _clearLastGhost(tgtC);
    S.xDrag.lastTgt = tgtC;
    drawPanel(tgtC, tgtSheet, tgtC._panelW, tgtC._panelH, tgtC._kerf, null, -1, -1,
      { x:sx, y:sy, w:pw, h:ph, piece:pl.piece, rotated:pl.rotated, valid });
  }
}

function _docUp() {
  if (!S.xDrag) return;
  document.removeEventListener('mousemove', _docMove);
  document.removeEventListener('mouseup', _docUp);

  const { srcCanvas: srcC } = S.xDrag;
  const srcSheet = srcC._sheet;
  _clearLastGhost(srcC);

  const pl = srcSheet.placements[S.xDrag.plIdx];

  if (S.xDrag.dropCanvas && S.xDrag.dropCanvas !== srcC && S.xDrag.valid) {
    // ✅ Cross-canvas successful drop
    const tgtC = S.xDrag.dropCanvas;
    const tgtSheet = tgtC._sheet;
    const [moved] = srcSheet.placements.splice(S.xDrag.plIdx, 1);
    srcSheet.usedArea = srcSheet.placements.reduce((s, p) => s + p.w*p.h, 0);
    srcSheet._edited = true;
    moved.x = S.xDrag.dropX; moved.y = S.xDrag.dropY;
    tgtSheet.placements.push(moved);
    tgtSheet.usedArea = tgtSheet.placements.reduce((s, p) => s + p.w*p.h, 0);
    tgtSheet._edited = true;
    drawPanel(srcC, srcSheet, srcC._panelW, srcC._panelH, srcC._kerf, null, -1);
    drawPanel(tgtC, tgtSheet, tgtC._panelW, tgtC._panelH, tgtC._kerf, null, -1);
  } else {
    // Same-canvas or invalid — commit or revert
    if (!S.xDrag.valid) { pl.x = S.xDrag.origX; pl.y = S.xDrag.origY; }
    else srcSheet._edited = true;
    drawPanel(srcC, srcSheet, srcC._panelW, srcC._panelH, srcC._kerf, null, -1);
  }
  S.xDrag = null;
  hideTip();
}

function _clearLastGhost(exceptCanvas) {
  const lt = S.xDrag?.lastTgt;
  if (lt && lt !== exceptCanvas) drawPanel(lt, lt._sheet, lt._panelW, lt._panelH, lt._kerf, null, -1);
}

// ─── Per-canvas setup ─────────────────────────────────────────────────────────
export function setupDrag(canvas, sheet, panelW, panelH, kerf, key, sheetIdx) {
  // Store metadata for cross-canvas access
  canvas._sheet = sheet; canvas._panelW = panelW; canvas._panelH = panelH;
  canvas._kerf = kerf; canvas._key = key; canvas._sheetIdx = sheetIdx;

  let hoverIdx = -1;

  const hit = (px, py) => {
    for (let i = sheet.placements.length-1; i >= 0; i--) {
      const p = sheet.placements[i];
      if (px >= p.x && px < p.x+p.w && py >= p.y && py < p.y+p.h) return i;
    }
    return -1;
  };

  const rotate = idx => {
    const pl = sheet.placements[idx];
    [pl.w, pl.h] = [pl.h, pl.w]; pl.rotated = !pl.rotated;
    pl.x = Math.max(0, Math.min(sheet.W-pl.w, pl.x));
    pl.y = Math.max(0, Math.min(sheet.H-pl.h, pl.y));
    sheet._edited = true;
    drawPanel(canvas, sheet, panelW, panelH, kerf, null, hoverIdx);
  };

  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const { px, py } = toPanelCoords(canvas, e.clientX, e.clientY);
    const idx = hit(px, py);
    if (idx >= 0) rotate(idx);
  });

  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0 || S.xDrag) return;
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const { px, py } = toPanelCoords(canvas, e.clientX, e.clientY);
    if (hoverIdx >= 0 && isOverRotBtn(mx, my, sheet.placements[hoverIdx], canvas._sc, kerf)) {
      rotate(hoverIdx); e.preventDefault(); return;
    }
    const idx = hit(px, py);
    if (idx < 0) return;
    const pl = sheet.placements[idx];
    S.xDrag = {
      srcCanvas: canvas, plIdx: idx,
      offX: px-pl.x, offY: py-pl.y,
      origX: pl.x, origY: pl.y,
      dropCanvas: canvas, dropX: pl.x, dropY: pl.y,
      valid: true, lastTgt: null,
    };
    canvas.style.cursor = 'grabbing'; e.preventDefault();
    document.addEventListener('mousemove', _docMove);
    document.addEventListener('mouseup', _docUp);
  });

  canvas.addEventListener('mousemove', e => {
    if (S.xDrag) return;
    const { px, py } = toPanelCoords(canvas, e.clientX, e.clientY);
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const newHover = hit(px, py);
    if (newHover !== hoverIdx) {
      hoverIdx = newHover;
      drawPanel(canvas, sheet, panelW, panelH, kerf, null, hoverIdx);
    }
    if      (hoverIdx >= 0 && isOverRotBtn(mx, my, sheet.placements[hoverIdx], canvas._sc, kerf)) canvas.style.cursor = 'pointer';
    else if (hoverIdx >= 0)  canvas.style.cursor = 'grab';
    else                     canvas.style.cursor = 'default';
    // Offcut tooltip
    if (hoverIdx < 0 && S.showOffcuts && !sheet._edited) {
      const frs = sheet.freeRects;
      const fr = (Array.isArray(frs) ? frs : []).find(r => px>=r.x && px<r.x+r.w && py>=r.y && py<r.y+r.h);
      if (fr) showTip(`${t('tipOffcut')} ${Math.round(fr.w-kerf)} × ${Math.round(fr.h-kerf)} mm`, e.clientX, e.clientY);
      else hideTip();
    } else hideTip();
  });

  canvas.addEventListener('mouseleave', () => {
    if (!S.xDrag) { hoverIdx = -1; drawPanel(canvas, sheet, panelW, panelH, kerf, null, -1); hideTip(); }
  });
}
