'use strict';
import { S, dl } from './state.js';
import { addPiece, clearPieces, updateArea } from './ui.js';

export function exportCSV() {
  const panelLine = `PANEL,${document.getElementById('pW').value},${document.getElementById('pH').value},${document.getElementById('kerf').value}`;
  const hdr = S.lang === 'fr' ? 'Nom,Largeur (mm),Hauteur (mm),Quantité' : 'Name,Width (mm),Height (mm),Quantity';
  const rows = [panelLine, hdr, ...S.pieces.map(p => `"${p.name}",${p.w},${p.h},${p.qty}`)];
  dl(rows.join('\n'), 'pieces_decoupe.csv', 'text/csv');
}

export function importCSVClick() {
  document.getElementById('csv-input').click();
}

export function onCSVFile(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    const lines = ev.target.result.trim().split('\n');
    let headerIdx = 0;
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const m = lines[i].match(/^PANEL\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+(?:\.\d+)?))?/i);
      if (m) {
        document.getElementById('pW').value = m[1];
        document.getElementById('pH').value = m[2];
        if (m[3] != null) document.getElementById('kerf').value = m[3];
        updateArea(); headerIdx = i+1; break;
      }
    }
    clearPieces();
    lines.slice(headerIdx+1).forEach(line => {
      const cols = line.split(',').map(c => c.replace(/^"|"$/g,'').trim());
      if (cols.length >= 3 && cols[0]) addPiece(cols[0], parseFloat(cols[1])||0, parseFloat(cols[2])||0, parseInt(cols[3])||1);
    });
    e.target.value = '';
  };
  r.readAsText(f);
}
