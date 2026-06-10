'use strict';
import { S } from './state.js';
import { t, fmt, setLang, applyLang } from './i18n.js';
import { ALGOS, runAlgo } from './algos.js';
import { renderPresets, addCustomSize, deleteCustomSize, applyPreset, updateArea,
         addPiece, removePiece, clearPieces, loadExample, syncPieces, renderPiecesTable,
         renderTabs, renderAlgoResult, toggleOffcuts,
         addEmptySheet, removeLastEmptySheet, showErr } from './ui.js';
import { openTxtModal, saveTxtModal, closeTxtModal, refreshMatDescBtn, refreshCommentsBtn } from './modal.js';
import { exportCSV, importCSVClick, onCSVFile } from './csv.js';
import { importDXFClick, onDXFFiles } from './dxf.js';
import { saveProject, loadProjectClick, onProjectFile, scheduleAutosave, autoload } from './project.js';
import { exportBonDebit } from './bon.js';

// ─── Calculate ────────────────────────────────────────────────────────────────
function calculate() {
  const hasEdits = Object.values(S.results).some(r => r.sheets?.some(s => s._edited));
  const hasExtra = Object.values(S.results).some(r => r.sheets?.some(s => s.placements.length === 0));
  if ((hasEdits || hasExtra) && Object.keys(S.results).length) {
    const msg = S.lang === 'fr'
      ? 'Recalculer va effacer vos modifications manuelles. Continuer ?'
      : 'Recalculating will erase your manual changes. Continue?';
    if (!confirm(msg)) return;
  }

  syncPieces();
  document.getElementById('calc-err').style.display = 'none';
  const panelW   = +document.getElementById('pW').value;
  const panelH   = +document.getElementById('pH').value;
  const kerf     = +document.getElementById('kerf').value || 0;
  const allowRot = !document.getElementById('noRotate').checked;

  if (!panelW || !panelH) { showErr('calc-err', t('errPanel')); return; }
  const valid = S.pieces.filter(p => p.w > 0 && p.h > 0 && p.qty > 0);
  if (!valid.length) { showErr('calc-err', t('errNoPieces')); return; }

  S.cachedPanel = { w:panelW, h:panelH, kerf };
  S.results = {};
  let firstErr = null;
  for (const k of Object.keys(ALGOS)) {
    const r = runAlgo(valid, panelW, panelH, kerf, allowRot, k);
    if (r.error && !firstErr) firstErr = r.error;
    S.results[k] = r;
  }
  if (firstErr && Object.values(S.results).every(r => r.error)) { showErr('calc-err', firstErr); return; }

  document.getElementById('empty-state').style.display = 'none';
  const ra = document.getElementById('results-area');
  ra.style.display = 'flex'; ra.style.flexDirection = 'column';
  document.getElementById('h-export').style.display = '';
  renderTabs(panelW, panelH, kerf);
  renderAlgoResult(S.activeAlgo, panelW, panelH, kerf);
  scheduleAutosave();
}

// ─── Language switcher (with re-render) ──────────────────────────────────────
function switchLang(l) {
  setLang(l);
  refreshMatDescBtn(); refreshCommentsBtn();
  if (Object.keys(S.results).length) {
    const { w, h, kerf } = S.cachedPanel;
    renderTabs(w, h, kerf);
    renderAlgoResult(S.activeAlgo, w, h, kerf);
  }
}

// ─── Auto-save triggers ───────────────────────────────────────────────────────
function watchAutosave() {
  document.querySelector('.sidebar').addEventListener('input', scheduleAutosave);
  document.getElementById('noRotate').addEventListener('change', scheduleAutosave);
  document.addEventListener('dcb:changed', scheduleAutosave);
}

// ─── Keyboard shortcuts for modal ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (document.getElementById('txt-modal').style.display !== 'none') {
    if (e.key === 'Escape') closeTxtModal();
    if (e.key === 'Enter' && e.ctrlKey) saveTxtModal();
  }
});

// ─── Expose to window for inline HTML handlers ────────────────────────────────
Object.assign(window, {
  setLang: switchLang, calculate,
  saveProject, loadProjectClick, onProjectFile,
  exportBonDebit, exportCSV, importCSVClick, onCSVFile, importDXFClick, onDXFFiles,
  addPiece, removePiece, clearPieces, loadExample,
  addCustomSize, deleteCustomSize, applyPreset,
  toggleOffcuts, addEmptySheet, removeLastEmptySheet,
  openTxtModal, saveTxtModal, closeTxtModal, refreshMatDescBtn, refreshCommentsBtn,
});

// ─── Init ─────────────────────────────────────────────────────────────────────
renderPresets();
updateArea();
document.getElementById('pW').addEventListener('input', updateArea);
document.getElementById('pH').addEventListener('input', updateArea);
watchAutosave();

// Restore previous session or load example
autoload() || loadExample();

refreshMatDescBtn();
refreshCommentsBtn();
applyLang();
