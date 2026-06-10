'use strict';
import { S, PAL, BUILTIN, CM, saveCustomSizes } from './state.js';
import { t } from './i18n.js';
import { ALGOS, calcStats } from './algos.js';
import { drawPanel, panelScale } from './canvas.js';
import { setupDrag } from './drag.js';

// ─── Panel size presets ───────────────────────────────────────────────────────
export function renderPresets() {
  const c = document.getElementById('presets-wrap');
  c.innerHTML = '';
  [...BUILTIN, ...S.customSizes.map((s,i) => ({ ...s, custom:true, idx:i }))].forEach(p => {
    const b = document.createElement('button');
    b.className = 'preset';
    b.onclick = () => applyPreset(p.w, p.h);
    b.innerHTML = p.custom
      ? `${p.label}<span class="x" onclick="event.stopPropagation();window.deleteCustomSize(${p.idx})">✕</span>`
      : p.label;
    c.appendChild(b);
  });
}

export function addCustomSize() {
  const label = document.getElementById('cs-label').value.trim();
  const w = parseInt(document.getElementById('cs-w').value);
  const h = parseInt(document.getElementById('cs-h').value);
  if (!w || !h || w < 100 || h < 100) return;
  S.customSizes.push({ label: label || `${w}×${h}`, w, h });
  saveCustomSizes(); renderPresets();
  ['cs-label','cs-w','cs-h'].forEach(id => document.getElementById(id).value = '');
}

export function deleteCustomSize(i) {
  S.customSizes.splice(i, 1); saveCustomSizes(); renderPresets();
}

export function applyPreset(w, h) {
  document.getElementById('pW').value = w;
  document.getElementById('pH').value = h;
  updateArea();
}

export function updateArea() {
  const w = +document.getElementById('pW').value || 0;
  const h = +document.getElementById('pH').value || 0;
  document.getElementById('pArea').value = ((w*h)/1e6).toFixed(3);
}

// ─── Pieces ───────────────────────────────────────────────────────────────────
export function addPiece(name='', w='', h='', qty=1, color=null, paths=null) {
  const p = { id: S.nextId++, name, w, h, qty, color: color || PAL[S.pieces.length % PAL.length] };
  if (paths) p.paths = paths;
  S.pieces.push(p);
  renderPiecesTable();
}

export function removePiece(id) {
  S.pieces = S.pieces.filter(p => p.id !== id); renderPiecesTable();
}

export function clearPieces() {
  S.pieces = []; S.nextId = 1; renderPiecesTable();
}

export function loadExample() {
  clearPieces();
  [['Fond',800,400,2],['Côté',400,600,4],['Tablette',780,300,3],
   ['Dos',800,600,1],['Façade',820,180,3],['Étagère',600,250,2]
  ].forEach(([n,w,h,q]) => addPiece(n,w,h,q));
}

export function syncPieces() {
  S.pieces.forEach(p => {
    p.name = document.getElementById(`pn${p.id}`)?.value ?? p.name;
    p.w    = parseFloat(document.getElementById(`pw${p.id}`)?.value) || 0;
    p.h    = parseFloat(document.getElementById(`ph${p.id}`)?.value) || 0;
    p.qty  = parseInt(document.getElementById(`pq${p.id}`)?.value)   || 1;
  });
}

export function renderPiecesTable() {
  document.getElementById('pt-body').innerHTML = S.pieces.map(p => `
    <tr>
      <td><span class="dot" style="background:${p.color}${p.paths?';outline:2px solid #4fc3f7;outline-offset:1px':''}"></span></td>
      <td><input id="pn${p.id}" value="${esc(p.name)}" placeholder="${t('thName')}" style="width:68px"></td>
      <td><input id="pw${p.id}" type="number" value="${p.w}" min="1"></td>
      <td><input id="ph${p.id}" type="number" value="${p.h}" min="1"></td>
      <td><input id="pq${p.id}" type="number" value="${p.qty}" min="1" max="999" style="width:38px"></td>
      <td><button class="btn btn-danger btn-sm" onclick="window.removePiece(${p.id})">✕</button></td>
    </tr>`).join('');
}

export const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

// ─── Results tabs + panels ────────────────────────────────────────────────────
export function showErr(id, msg) {
  const el = document.getElementById(id); el.textContent = msg; el.style.display = 'block';
}

export function renderTabs(panelW, panelH, kerf) {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  for (const [k, a] of Object.entries(ALGOS)) {
    const r = S.results[k];
    const btn = document.createElement('div');
    btn.className = 'tab' + (k === S.activeAlgo ? ' active' : '');
    if (r && !r.error) {
      const st = calcStats(r.sheets, panelW, panelH, kerf);
      btn.innerHTML = `<span>${t(a.lk)}</span><span class="td">${t(a.dk)}</span><span class="tb">${st.panels} ${t('panels')} · ${st.eff}%</span>`;
    } else {
      btn.innerHTML = `<span>${t(a.lk)}</span><span class="td">${r?.error ? 'Erreur' : t(a.dk)}</span>`;
    }
    btn.onclick = () => {
      S.activeAlgo = k;
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      renderAlgoResult(k, panelW, panelH, kerf);
    };
    tabs.appendChild(btn);
  }
}

export function renderAlgoResult(key, panelW, panelH, kerf) {
  const wrap = document.getElementById('results-wrap');
  const r = S.results[key];
  if (!r || r.error) { wrap.innerHTML = `<div class="alert alert-err">${r?.error||'Erreur'}</div>`; return; }

  const st = calcStats(r.sheets, panelW, panelH, kerf);
  const ec = st.eff >= 75 ? 'green' : st.eff >= 50 ? 'orange' : 'red';
  const big = st.bigW > 0 ? `${st.bigW}×${st.bigH}mm` : '—';
  const emptyCount = r.sheets.filter(s => s.placements.length === 0).length;

  wrap.innerHTML = `
    <div class="stats">
      <div class="stat red">  <div class="v">${st.panels}</div>    <div class="l">${t('statPanels')}</div></div>
      <div class="stat ${ec}"><div class="v">${st.eff}%</div>      <div class="l">${t('statEff')}</div></div>
      <div class="stat blue"> <div class="v">${st.usedM2} m²</div> <div class="l">${t('statUsed')}</div></div>
      <div class="stat orange"><div class="v">${st.waste} m²</div> <div class="l">${t('statWaste')}</div></div>
      <div class="stat green"><div class="v">${big}</div>           <div class="l">${t('statBig')}</div></div>
    </div>
    <div class="ctrl-bar">
      <span class="lbl">${t('showOffcuts')}</span>
      <button class="btn btn-sm ${S.showOffcuts?'btn-primary':'btn-sec'}" onclick="window.toggleOffcuts('${key}',${panelW},${panelH},${kerf})">
        ${S.showOffcuts ? t('hideOffcuts') : t('shownOffcuts')}
      </button>
      <span class="lbl" style="margin-left:10px">${t('statPanels')} :</span>
      <button class="btn btn-sec btn-sm" onclick="window.addEmptySheet('${key}',${panelW},${panelH},${kerf})">+ ${t('statPanels').replace(/s$/,'')}</button>
      ${emptyCount > 0 ? `<button class="btn btn-danger btn-sm" onclick="window.removeLastEmptySheet('${key}',${panelW},${panelH},${kerf})">− ${t('statPanels').replace(/s$/,'')}</button>` : ''}
      <span class="lbl" style="margin-left:auto;font-size:.63rem">${t('dragHint')}</span>
    </div>
    <div class="legend">${
      [...new Map(r.sheets.flatMap(s => s.placements.map(pl => [pl.piece.id, pl.piece]))).values()]
        .map(p => `<div class="leg-item"><span class="dot" style="background:${p.color}"></span>${p.name||'—'} ${p.origW}×${p.origH}mm</div>`)
        .join('')
    }</div>
    <div class="panels" id="panels-grid"></div>`;

  r.sheets.forEach((sheet, i) => {
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `<div class="ph"><span>${t('statPanels')} ${i+1}/${r.sheets.length}</span><span>${sheet.efficiency.toFixed(1)}% · ${sheet.placements.length} ${t('pcs')}</span></div>`;
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    document.getElementById('panels-grid').appendChild(card);
    drawPanel(canvas, sheet, panelW, panelH, kerf, null, -1);
    setupDrag(canvas, sheet, panelW, panelH, kerf, key, i);
  });
}

export function toggleOffcuts(key, panelW, panelH, kerf) {
  S.showOffcuts = !S.showOffcuts;
  renderAlgoResult(key, panelW, panelH, kerf);
}

// ─── Empty / extra sheets ─────────────────────────────────────────────────────
export function makeEmptySheet(panelW, panelH, kerf) {
  const W = panelW + kerf, H = panelH + kerf;
  return {
    W, H, placements: [], freeRects: [{ x:0, y:0, w:W, h:H }],
    usedArea: 0, _edited: false,
    get efficiency() { return 0; },
  };
}

export function addEmptySheet(key, panelW, panelH, kerf) {
  S.results[key].sheets.push(makeEmptySheet(panelW, panelH, kerf));
  renderAlgoResult(key, panelW, panelH, kerf);
}

export function removeLastEmptySheet(key, panelW, panelH, kerf) {
  const sheets = S.results[key].sheets;
  for (let i = sheets.length-1; i >= 0; i--) {
    if (sheets[i].placements.length === 0) { sheets.splice(i, 1); break; }
  }
  renderAlgoResult(key, panelW, panelH, kerf);
}
