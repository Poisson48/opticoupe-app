'use strict';
import { S } from './state.js';
import { t } from './i18n.js';
import { ALGOS, calcStats } from './algos.js';
import { syncPieces } from './ui.js';

export function exportBonDebit() {
  const r = S.results[S.activeAlgo];
  if (!r || r.error) return;
  const { w:panelW, h:panelH, kerf } = S.cachedPanel;

  syncPieces();
  const proj = {
    name:      document.getElementById('proj-name').value || '—',
    client:    document.getElementById('proj-client').value || '—',
    material:  document.getElementById('proj-mat').value,
    thickness: document.getElementById('proj-thick').value,
    finish:    document.getElementById('proj-finish').value,
    matDesc:   document.getElementById('proj-mat-desc').value,
    matUrl:    document.getElementById('proj-mat-url').value,
    comments:  document.getElementById('proj-comments').value,
  };

  const st    = calcStats(r.sheets, panelW, panelH, kerf);
  const date  = new Date().toLocaleDateString(S.lang === 'fr' ? 'fr-FR' : 'en-GB');
  const ref   = Date.now().toString(36).toUpperCase().slice(-6);
  const algo  = t(ALGOS[S.activeAlgo].lk);

  // Capture current canvas images
  const imgs  = [...document.querySelectorAll('#panels-grid canvas')].map(c => c.toDataURL('image/png'));

  // One row per individual cut piece
  let rowNum = 0;
  const pieceRows = r.sheets.flatMap((sh, si) =>
    sh.placements.map(pl => {
      rowNum++;
      const cutW = pl.rotated ? pl.piece.origH : pl.piece.origW;
      const cutH = pl.rotated ? pl.piece.origW : pl.piece.origH;
      return `<tr>
        <td>${rowNum}</td>
        <td><span class="color-dot" style="background:${pl.piece.color}"></span>${pl.piece.name||'—'}</td>
        <td>${cutW}</td><td>${cutH}</td>
        <td>${proj.thickness}</td>
        <td>${t('bonPanelLabel')} ${si+1}</td>
        <td>${pl.rotated ? '↺ '+t('bonRotated') : '—'}</td>
        <td></td>
      </tr>`;
    })
  ).join('');

  // Per-panel piece breakdown
  const panelBreakdown = r.sheets.map((sh, si) => ({
    si, eff: sh.efficiency.toFixed(1),
    rows: sh.placements.map((pl, pi) => `<tr>
        <td>${si+1}.${pi+1}</td>
        <td>${pl.piece.name||'—'}</td>
        <td>${pl.rotated?pl.piece.origH:pl.piece.origW}</td>
        <td>${pl.rotated?pl.piece.origW:pl.piece.origH}</td>
        <td>${proj.thickness}</td><td>1</td>
        <td>${pl.rotated?'↺':''}</td><td></td>
      </tr>`).join(''),
  }));

  const html = `<!DOCTYPE html>
<html lang="${S.lang}">
<head><meta charset="UTF-8"><title>${t('bonTitle')} — ${proj.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:14mm 12mm}
  body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#111}
  .page{max-width:180mm}
  h1{font-size:16pt;font-weight:900;letter-spacing:1px;color:#c0392b}
  h2{font-size:10pt;font-weight:700;margin:14pt 0 6pt;border-bottom:1.5px solid #c0392b;padding-bottom:3pt;color:#c0392b;text-transform:uppercase}
  h3{font-size:9pt;font-weight:700;margin:10pt 0 4pt}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #c0392b;padding-bottom:10pt;margin-bottom:12pt}
  .header-right{text-align:right;font-size:8.5pt;color:#555}
  .header-right b{color:#111}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8pt;margin-bottom:12pt}
  .info-box{border:1px solid #ddd;border-radius:4pt;padding:8pt}
  .info-box .lbl{font-size:7.5pt;color:#888;text-transform:uppercase;margin-bottom:4pt}
  .info-row{display:flex;justify-content:space-between;font-size:8.5pt;padding:2pt 0;border-bottom:1px solid #f0f0f0}
  .info-row:last-child{border:none}
  .info-row .k{color:#555} .info-row .v{font-weight:700}
  table{width:100%;border-collapse:collapse;font-size:8pt;margin-bottom:10pt}
  th{background:#c0392b;color:#fff;padding:4pt 5pt;text-align:left;font-size:7.5pt;font-weight:700}
  td{padding:3pt 5pt;border-bottom:1px solid #eee;vertical-align:top}
  tr:nth-child(even) td{background:#fafafa}
  .panel-section{page-break-before:always;padding-top:10pt}
  .panel-section:first-child{page-break-before:avoid}
  .panel-img{text-align:center;margin:8pt 0}
  .panel-img img{max-width:100%;border:1px solid #ddd;border-radius:4pt}
  .stat-row{display:flex;gap:12pt;margin-bottom:10pt;flex-wrap:wrap}
  .stat-box{border:1px solid #ddd;border-radius:4pt;padding:6pt 10pt;flex:1;min-width:70pt}
  .stat-box .sv{font-size:13pt;font-weight:900;color:#c0392b}
  .stat-box .sl{font-size:7pt;color:#888;text-transform:uppercase}
  .badge{display:inline-block;background:#c0392b;color:#fff;border-radius:3pt;padding:1pt 5pt;font-size:7.5pt;font-weight:700}
  .note{background:#fff8e1;border:1px solid #ffe082;border-radius:4pt;padding:7pt 10pt;font-size:8pt;margin-bottom:10pt}
  .footer{margin-top:16pt;padding-top:8pt;border-top:1px solid #ddd;font-size:7.5pt;color:#888;display:flex;justify-content:space-between}
  .color-dot{display:inline-block;width:8pt;height:8pt;border-radius:50%;vertical-align:middle;margin-right:3pt}
  @media print{.no-print{display:none}}
</style></head>
<body><div class="page">

<div class="header">
  <div>
    <h1>${t('bonTitle')}</h1>
    <div style="font-size:8.5pt;color:#555;margin-top:4pt">${t('bonScierie')}</div>
  </div>
  <div class="header-right">
    <div>${t('bonRef')} <b>${ref}</b></div>
    <div>${t('bonDate')} <b>${date}</b></div>
    <div style="margin-top:4pt;font-size:7.5pt;background:#f5f5f5;border-radius:3pt;padding:2pt 6pt">${algo}</div>
  </div>
</div>

<div class="info-grid">
  <div class="info-box">
    <div class="lbl">${t('projet')}</div>
    <div class="info-row"><span class="k">${t('projname')}</span><span class="v">${proj.name}</span></div>
    <div class="info-row"><span class="k">${t('client')}</span><span class="v">${proj.client}</span></div>
    <div class="info-row"><span class="k">${t('mat')}</span><span class="v">${proj.material}${proj.finish?' — '+proj.finish:''}</span></div>
    ${proj.matDesc ? `<div class="info-row"><span class="k">Description</span><span class="v">${proj.matDesc}</span></div>` : ''}
    ${proj.matUrl  ? `<div class="info-row"><span class="k">Référence</span><span class="v"><a href="${proj.matUrl}" style="color:#c0392b;word-break:break-all">${proj.matUrl}</a></span></div>` : ''}
    <div class="info-row"><span class="k">${t('thick')}</span><span class="v">${proj.thickness} mm</span></div>
  </div>
  <div class="info-box">
    <div class="lbl">${t('panel')}</div>
    <div class="info-row"><span class="k">${t('bonPanel')}</span><span class="v">${panelW} × ${panelH} mm</span></div>
    <div class="info-row"><span class="k">${t('bonQtyPanels')}</span><span class="v">${st.panels}</span></div>
    <div class="info-row"><span class="k">${t('bonKerf')}</span><span class="v">${kerf} mm</span></div>
    <div class="info-row"><span class="k">${t('bonEff')}</span><span class="v">${st.eff}%</span></div>
    <div class="info-row"><span class="k">${t('statBig')}</span><span class="v">${st.bigW > 0 ? st.bigW+'×'+st.bigH+' mm' : '—'}</span></div>
  </div>
</div>

<div class="stat-row">
  <div class="stat-box"><div class="sv">${st.panels}</div><div class="sl">${t('statPanels')}</div></div>
  <div class="stat-box"><div class="sv">${st.eff}%</div><div class="sl">${t('statEff')}</div></div>
  <div class="stat-box"><div class="sv">${st.usedM2} m²</div><div class="sl">${t('statUsed')}</div></div>
  <div class="stat-box"><div class="sv">${st.waste} m²</div><div class="sl">${t('statWaste')}</div></div>
</div>

${proj.comments ? `<div class="note"><b>${t('bonComments')} :</b><br><span style="white-space:pre-wrap">${proj.comments.replace(/</g,'&lt;')}</span></div>` : ''}

<h2>${t('bonListTitle')}</h2>
<table>
  <thead><tr>
    <th>${t('bonNum')}</th><th>${t('bonName')}</th>
    <th>${t('bonL')} (mm)</th><th>${t('bonW')} (mm)</th>
    <th>${t('bonThk')} (mm)</th><th>${t('bonPanelLabel')}</th>
    <th>Rotation</th><th>${t('bonObs')}</th>
  </tr></thead>
  <tbody>${pieceRows}</tbody>
</table>

<h2>${t('bonPlanTitle')}</h2>
${panelBreakdown.map(({ si, rows, eff }, i) => `
<div class="${i === 0 ? '' : 'panel-section'}">
  <h3>${t('bonPanelLabel')} ${si+1} / ${r.sheets.length} <span class="badge">${eff}% ${t('used')}</span></h3>
  ${imgs[si] ? `<div class="panel-img"><img src="${imgs[si]}" style="max-height:120mm"></div>` : ''}
  <table>
    <thead><tr>
      <th>${t('bonNum')}</th><th>${t('bonName')}</th>
      <th>${t('bonL')} (mm)</th><th>${t('bonW')} (mm)</th>
      <th>${t('bonThk')} (mm)</th><th>${t('bonQty')}</th>
      <th>Rotation</th><th>${t('bonObs')}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`).join('')}

<div class="footer">
  <span>${t('bonFooter')}</span>
  <span>${ref} · ${date}</span>
</div>
</div></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);

  const fr = document.createElement('iframe');
  fr.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px';
  fr.src = url;
  document.body.appendChild(fr);
  fr.addEventListener('load', () => {
    fr.contentWindow.print();
    setTimeout(() => { document.body.removeChild(fr); URL.revokeObjectURL(url); }, 1000);
  });
}
