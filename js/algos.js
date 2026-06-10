'use strict';
import { S } from './state.js';
import { t, fmt } from './i18n.js';

// ─── Guillotine packer ────────────────────────────────────────────────────────
export class GuillotinePacker {
  constructor(W, H, { split = 'LLAS' } = {}) {
    this.W = W; this.H = H; this.split = split;
    this.freeRects = [{ x:0, y:0, w:W, h:H }];
    this.placements = []; this.usedArea = 0;
  }
  insert(item, allowRot) {
    let best = null, br = false, bi = -1;
    for (let i = 0; i < this.freeRects.length; i++) {
      const r = this.freeRects[i];
      if (item.w <= r.w && item.h <= r.h) {
        if (!best || r.w * r.h < best.w * best.h) { best = r; br = false; bi = i; }
      }
      if (allowRot && item.w !== item.h && item.h <= r.w && item.w <= r.h) {
        if (!best || r.w * r.h < best.w * best.h) { best = r; br = true; bi = i; }
      }
    }
    if (!best) return false;
    const pw = br ? item.h : item.w, ph = br ? item.w : item.h;
    this.placements.push({ x:best.x, y:best.y, w:pw, h:ph, piece:item, rotated:br });
    this.usedArea += pw * ph;
    this.freeRects.splice(bi, 1);
    const rw = best.w - pw, bh = best.h - ph;
    const long = this.split === 'LLAS' ? rw > bh : rw < bh;
    if (long) {
      if (rw > 0) this.freeRects.push({ x:best.x+pw, y:best.y,    w:rw,    h:best.h });
      if (bh > 0) this.freeRects.push({ x:best.x,    y:best.y+ph, w:pw,    h:bh     });
    } else {
      if (bh > 0) this.freeRects.push({ x:best.x,    y:best.y+ph, w:best.w, h:bh    });
      if (rw > 0) this.freeRects.push({ x:best.x+pw, y:best.y,    w:rw,    h:ph     });
    }
    this._prune();
    return true;
  }
  _prune() {
    this.freeRects = this.freeRects.filter((a, i) =>
      !this.freeRects.some((b, j) => i !== j && b.x<=a.x && b.y<=a.y && b.x+b.w>=a.x+a.w && b.y+b.h>=a.y+a.h)
    );
  }
  get efficiency() { return (this.usedArea / (this.W * this.H)) * 100; }
}

// ─── MaxRects packer (BSSF) ───────────────────────────────────────────────────
export class MaxRectsPacker {
  constructor(W, H) {
    this.W = W; this.H = H;
    this.freeRects = [{ x:0, y:0, w:W, h:H }];
    this.placements = []; this.usedArea = 0;
  }
  insert(item, allowRot) {
    let best = null, bs = Infinity, br = false;
    for (const r of this.freeRects) {
      if (item.w <= r.w && item.h <= r.h) {
        const s = Math.min(r.w-item.w, r.h-item.h);
        if (s < bs) { bs = s; best = r; br = false; }
      }
      if (allowRot && item.w !== item.h && item.h <= r.w && item.w <= r.h) {
        const s = Math.min(r.w-item.h, r.h-item.w);
        if (s < bs) { bs = s; best = r; br = true; }
      }
    }
    if (!best) return false;
    const pw = br ? item.h : item.w, ph = br ? item.w : item.h;
    const px = best.x, py = best.y;
    this.placements.push({ x:px, y:py, w:pw, h:ph, piece:item, rotated:br });
    this.usedArea += pw * ph;
    this._split(px, py, pw, ph);
    this._prune();
    return true;
  }
  _split(px, py, pw, ph) {
    const add = [], rem = new Set();
    for (let i = 0; i < this.freeRects.length; i++) {
      const r = this.freeRects[i];
      if (px >= r.x+r.w || px+pw <= r.x || py >= r.y+r.h || py+ph <= r.y) continue;
      rem.add(i);
      if (px > r.x)        add.push({ x:r.x,   y:r.y,   w:px-r.x,         h:r.h         });
      if (px+pw < r.x+r.w) add.push({ x:px+pw, y:r.y,   w:r.x+r.w-px-pw,  h:r.h         });
      if (py > r.y)        add.push({ x:r.x,   y:r.y,   w:r.w,             h:py-r.y      });
      if (py+ph < r.y+r.h) add.push({ x:r.x,   y:py+ph, w:r.w,             h:r.y+r.h-py-ph });
    }
    this.freeRects = this.freeRects.filter((_, i) => !rem.has(i));
    this.freeRects.push(...add);
  }
  _prune() {
    this.freeRects = this.freeRects.filter((a, i) =>
      !this.freeRects.some((b, j) => i !== j && b.x<=a.x && b.y<=a.y && b.x+b.w>=a.x+a.w && b.y+b.h>=a.y+a.h)
    );
  }
  get efficiency() { return (this.usedArea / (this.W * this.H)) * 100; }
}

// ─── Shelf packer ─────────────────────────────────────────────────────────────
export class ShelfPacker {
  constructor(W, H) {
    this.W = W; this.H = H; this._shelves = []; this.placements = []; this.usedArea = 0;
  }
  insert(item, allowRot) {
    const try_ = (pw, ph) => {
      for (const s of this._shelves) {
        if (pw <= this.W - s.usedW && ph <= s.h) {
          this.placements.push({ x:s.usedW, y:s.y, w:pw, h:ph, piece:item, rotated:pw!==item.w });
          this.usedArea += pw * ph; s.usedW += pw; return true;
        }
      }
      const ny = this._shelves.length ? this._shelves.at(-1).y + this._shelves.at(-1).h : 0;
      if (ny + ph > this.H || pw > this.W) return false;
      this._shelves.push({ y:ny, h:ph, usedW:pw });
      this.placements.push({ x:0, y:ny, w:pw, h:ph, piece:item, rotated:pw!==item.w });
      this.usedArea += pw * ph; return true;
    };
    return try_(item.w, item.h) || (allowRot && item.w !== item.h && try_(item.h, item.w));
  }
  get freeRects() {
    const rects = [];
    for (const s of this._shelves)
      if (s.usedW < this.W) rects.push({ x:s.usedW, y:s.y, w:this.W-s.usedW, h:s.h });
    const uh = this._shelves.length ? this._shelves.at(-1).y + this._shelves.at(-1).h : 0;
    if (uh < this.H) rects.push({ x:0, y:uh, w:this.W, h:this.H-uh });
    return rects;
  }
  get efficiency() { return (this.usedArea / (this.W * this.H)) * 100; }
}

// ─── Algorithm registry ───────────────────────────────────────────────────────
export const ALGOS = {
  maxrects: { lk:'a_maxrects', dk:'a_maxrects_d', Class:MaxRectsPacker, opts:{},            sort:'area'   },
  llas:     { lk:'a_llas',     dk:'a_llas_d',     Class:GuillotinePacker, opts:{split:'LLAS'}, sort:'area' },
  shelf:    { lk:'a_shelf',    dk:'a_shelf_d',    Class:ShelfPacker,     opts:{},            sort:'height' },
  slas:     { lk:'a_slas',     dk:'a_slas_d',     Class:GuillotinePacker, opts:{split:'SLAS'}, sort:'area' },
};

// ─── Packing runner ───────────────────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function runOnce(items, panelW, panelH, kerf, allowRot, key) {
  const { Class, opts } = ALGOS[key];
  const PW = panelW + kerf, PH = panelH + kerf;
  const sheets = [];
  for (const item of items) {
    let placed = false;
    for (const s of sheets) if (s.insert(item, allowRot)) { placed = true; break; }
    if (!placed) {
      const s = new Class(PW, PH, opts);
      if (!s.insert(item, allowRot)) return null;
      sheets.push(s);
    }
  }
  return sheets;
}

export function runAlgo(pieces, panelW, panelH, kerf, allowRot, key) {
  const { sort } = ALGOS[key];
  const base = pieces.flatMap(p =>
    Array.from({ length: p.qty }, () => ({ ...p, origW:p.w, origH:p.h, w:p.w+kerf, h:p.h+kerf }))
  );
  if (!base.length) return { error: t('errNoPieces') };

  const score = sheets => sheets
    ? sheets.length * 1e9 - sheets.reduce((s, sh) => s + sh.usedArea, 0)
    : Infinity;

  const sorted = [...base];
  if (sort === 'height') sorted.sort((a, b) => b.h - a.h || (b.w*b.h) - (a.w*a.h));
  else                   sorted.sort((a, b) => (b.w*b.h) - (a.w*a.h));

  let best = runOnce(sorted, panelW, panelH, kerf, allowRot, key);
  let bestScore = score(best);

  if (sort !== 'height') {
    for (let i = 0; i < 12; i++) {
      const sh = runOnce(shuffle([...base]), panelW, panelH, kerf, allowRot, key);
      const sc = score(sh);
      if (sc < bestScore) { bestScore = sc; best = sh; }
    }
  }

  if (!best) {
    const p = base[0];
    return { error: fmt('errBig', { n:p.name||'?', w:p.origW, h:p.origH }) };
  }
  return { sheets: best };
}

export function calcStats(sheets, panelW, panelH, kerf) {
  const pA = (panelW * panelH) / 1e6;
  const usedM2 = sheets.reduce((s, sh) => s + sh.usedArea, 0) / 1e6;
  const totalM2 = sheets.length * pA;
  let bigW = 0, bigH = 0;
  sheets.forEach(sh => (sh.freeRects || []).forEach(r => {
    const rw = r.w - kerf, rh = r.h - kerf;
    if (rw > 0 && rh > 0 && rw*rh > bigW*bigH) { bigW = rw; bigH = rh; }
  }));
  return {
    panels: sheets.length,
    usedM2: usedM2.toFixed(3),
    totalM2: totalM2.toFixed(3),
    waste: (totalM2 - usedM2).toFixed(3),
    eff: (usedM2 / totalM2 * 100).toFixed(1),
    bigW: Math.round(bigW),
    bigH: Math.round(bigH),
  };
}
