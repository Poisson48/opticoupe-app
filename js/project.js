'use strict';
import { S, PAL, dl } from './state.js';
import { renderPiecesTable, renderTabs, renderAlgoResult, addPiece, clearPieces, updateArea, syncPieces } from './ui.js';
import { refreshMatDescBtn, refreshCommentsBtn } from './modal.js';
import { setLang } from './i18n.js';

const AUTOSAVE_KEY = 'dcb_autosave';
let _autosaveTimer = null;

export function scheduleAutosave() {
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(autosave, 800);
}

function gatherProjectData() {
  return {
    version: '1.3',
    project: {
      name:     document.getElementById('proj-name').value,
      client:   document.getElementById('proj-client').value,
      material: document.getElementById('proj-mat').value,
      thickness:+document.getElementById('proj-thick').value,
      finish:   document.getElementById('proj-finish').value,
      matDesc:  document.getElementById('proj-mat-desc').value,
      matUrl:   document.getElementById('proj-mat-url').value,
      comments: document.getElementById('proj-comments').value,
    },
    panel: {
      w:       +document.getElementById('pW').value,
      h:       +document.getElementById('pH').value,
      kerf:    +document.getElementById('kerf').value,
      noRotate: document.getElementById('noRotate').checked,
    },
    pieces: S.pieces.map(({ name, w, h, qty, color }) => ({ name, w, h, qty, color })),
    activeAlgo: S.activeAlgo,
    results: serializeResults(S.results),
    lang: S.lang,
  };
}

function autosave() {
  try { syncPieces(); localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(gatherProjectData())); } catch {}
}

export function autoload() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) { restoreProjectData(JSON.parse(raw)); return true; }
  } catch {}
  return false;
}

export function saveProject() {
  const data = gatherProjectData();
  const name = document.getElementById('proj-name').value || 'decoupe';
  dl(JSON.stringify(data, null, 2), `${name.replace(/\s+/g,'_')}.json`, 'application/json');
}

export function loadProjectClick() {
  document.getElementById('proj-input').click();
}

export function onProjectFile(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const raw = ev.target.result;
      if (!raw?.trim()) throw new Error('Fichier vide');
      const d = JSON.parse(raw);
      if (!d.pieces && !d.panel) throw new Error('Format non reconnu');
      restoreProjectData(d);
      document.getElementById('calc-err').style.display = 'none';
    } catch(err) {
      const el = document.getElementById('calc-err');
      el.textContent = `Erreur import : ${err.message}`; el.style.display = 'block';
    }
    e.target.value = '';
  };
  r.readAsText(f);
}

function restoreProjectData(d) {
  if (d.project) {
    document.getElementById('proj-name').value    = d.project.name     || '';
    document.getElementById('proj-client').value  = d.project.client   || '';
    document.getElementById('proj-thick').value   = d.project.thickness || 18;
    document.getElementById('proj-finish').value  = d.project.finish   || '';
    document.getElementById('proj-mat-desc').value= d.project.matDesc  || '';
    document.getElementById('proj-mat-url').value = d.project.matUrl   || '';
    document.getElementById('proj-comments').value= d.project.comments || '';
    const sel = document.getElementById('proj-mat');
    const mat = d.project.material || 'Mélaminé';
    sel.value = [...sel.options].find(o => o.value === mat || o.text === mat) ? mat : 'Mélaminé';
    refreshMatDescBtn(); refreshCommentsBtn();
  }
  if (d.panel) {
    document.getElementById('pW').value      = d.panel.w    || 2440;
    document.getElementById('pH').value      = d.panel.h    || 1220;
    document.getElementById('kerf').value    = d.panel.kerf ?? 3;
    document.getElementById('noRotate').checked = !!d.panel.noRotate;
    updateArea();
  }
  clearPieces();
  (d.pieces || []).forEach(p => addPiece(p.name||'', +p.w||0, +p.h||0, +p.qty||1, p.color));

  if (d.results && Object.keys(d.results).length) {
    S.results = deserializeResults(d.results);
    const pw = +document.getElementById('pW').value;
    const ph = +document.getElementById('pH').value;
    const kf = +document.getElementById('kerf').value || 0;
    S.cachedPanel = { w:pw, h:ph, kerf:kf };
    if (d.activeAlgo && S.results[d.activeAlgo]) S.activeAlgo = d.activeAlgo;
    document.getElementById('empty-state').style.display = 'none';
    const ra = document.getElementById('results-area');
    ra.style.display = 'flex'; ra.style.flexDirection = 'column';
    document.getElementById('h-export').style.display = '';
    renderTabs(pw, ph, kf);
    renderAlgoResult(S.activeAlgo, pw, ph, kf);
  }

  if (d.lang === 'fr' || d.lang === 'en') setLang(d.lang);
}

// ─── Serialization ────────────────────────────────────────────────────────────
export function serializeResults(res) {
  const out = {};
  for (const [key, r] of Object.entries(res)) {
    if (!r || r.error || !r.sheets) continue;
    out[key] = {
      sheets: r.sheets.map(sh => {
        let frs = []; try { frs = [...(sh.freeRects || [])]; } catch {}
        return {
          W: sh.W, H: sh.H, usedArea: sh.usedArea || 0, _edited: sh._edited || false,
          freeRects: frs,
          placements: sh.placements.map(pl => ({
            x:pl.x, y:pl.y, w:pl.w, h:pl.h, rotated:!!pl.rotated,
            piece: { id:pl.piece.id, name:pl.piece.name, color:pl.piece.color, origW:pl.piece.origW, origH:pl.piece.origH },
          })),
        };
      }),
    };
  }
  return out;
}

export function deserializeResults(saved) {
  if (!saved) return {};
  const out = {};
  for (const [key, r] of Object.entries(saved)) {
    if (!r?.sheets) continue;
    out[key] = {
      sheets: r.sheets.map(sh => ({
        W: sh.W, H: sh.H, usedArea: sh.usedArea || 0, _edited: sh._edited || false,
        freeRects: sh.freeRects || [],
        placements: (sh.placements || []).map(pl => ({ ...pl, piece: { ...pl.piece } })),
        get efficiency() { return this.W && this.H ? (this.usedArea / (this.W * this.H)) * 100 : 0; },
      })),
    };
  }
  return out;
}
