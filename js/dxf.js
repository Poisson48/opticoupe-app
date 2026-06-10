'use strict';
import { addPiece } from './ui.js';

export function importDXFClick() {
  document.getElementById('dxf-input').click();
}

export async function onDXFFiles(e) {
  const files = [...e.target.files];
  for (const file of files) {
    const result = parseDxf(await file.text(), file.name);
    if (result) addPiece(result.name, result.w, result.h, 1, null, result.paths);
  }
  e.target.value = '';
}

function parseDxf(text, filename) {
  // Parse group-code/value pairs (one per line, alternating)
  const lines = text.split(/\r?\n/);
  const pairs = [];
  let i = 0;
  while (i < lines.length) {
    const cs = lines[i++].trim();
    if (!cs) continue;
    const code = parseInt(cs, 10);
    if (isNaN(code)) continue;
    while (i < lines.length && !lines[i].trim()) i++;
    if (i < lines.length) pairs.push([code, lines[i++].trim()]);
  }

  // Walk to ENTITIES section and collect entities
  let inEntities = false;
  const entities = [];
  let cur = null;

  for (const [code, val] of pairs) {
    if (code === 0 && val === 'SECTION')  { cur = null; continue; }
    if (code === 2 && val === 'ENTITIES') { inEntities = true; continue; }
    if (code === 0 && val === 'ENDSEC')   {
      if (inEntities) { if (cur) entities.push(cur); break; }
      continue;
    }
    if (!inEntities) continue;
    if (code === 0) {
      if (cur) entities.push(cur);
      cur = { type:val, xs:[], ys:[], x2s:[], y2s:[], rs:[], sa:[], ea:[], flags:0 };
    } else if (cur) {
      if      (code === 10) cur.xs.push(parseFloat(val));
      else if (code === 20) cur.ys.push(parseFloat(val));
      else if (code === 11) cur.x2s.push(parseFloat(val));
      else if (code === 21) cur.y2s.push(parseFloat(val));
      else if (code === 40) cur.rs.push(parseFloat(val));
      else if (code === 50) cur.sa.push(parseFloat(val));
      else if (code === 51) cur.ea.push(parseFloat(val));
      else if (code === 70) cur.flags = parseInt(val, 10);
    }
  }

  // Convert entities to polyline paths, collect all coordinates for bounding box
  const paths = [];
  const allX = [], allY = [];

  for (const e of entities) {
    switch (e.type) {
      case 'LWPOLYLINE':
      case 'POLYLINE': {
        const pts = e.xs.map((x, j) => [x, e.ys[j] ?? 0]);
        if (pts.length > 1) {
          paths.push({ pts, closed: !!(e.flags & 1) });
          pts.forEach(([x, y]) => { allX.push(x); allY.push(y); });
        }
        break;
      }
      case 'LINE':
        for (let j = 0; j < e.xs.length; j++) {
          const pts = [[e.xs[j], e.ys[j]??0], [e.x2s[j]??0, e.y2s[j]??0]];
          paths.push({ pts, closed: false });
          pts.forEach(([x, y]) => { allX.push(x); allY.push(y); });
        }
        break;
      case 'CIRCLE':
        for (let j = 0; j < e.xs.length; j++) {
          const [cx, cy, r] = [e.xs[j], e.ys[j]??0, e.rs[j]??0];
          const pts = Array.from({ length: 45 }, (_, k) => {
            const a = k * 8 * Math.PI / 180;
            return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
          });
          paths.push({ pts, closed: true });
          allX.push(cx-r, cx+r); allY.push(cy-r, cy+r);
        }
        break;
      case 'ARC':
        for (let j = 0; j < e.xs.length; j++) {
          const [cx, cy, r] = [e.xs[j], e.ys[j]??0, e.rs[j]??0];
          let sa = e.sa[j]??0, ea = e.ea[j]??360;
          if (ea <= sa) ea += 360;
          const pts = [];
          for (let a = sa; a <= ea; a += 5)
            pts.push([cx + r*Math.cos(a*Math.PI/180), cy + r*Math.sin(a*Math.PI/180)]);
          paths.push({ pts, closed: false });
          pts.forEach(([x, y]) => { allX.push(x); allY.push(y); });
        }
        break;
      case 'SPLINE':
        if (e.xs.length > 1) {
          const pts = e.xs.map((x, j) => [x, e.ys[j]??0]);
          paths.push({ pts, closed: !!(e.flags & 1) });
          pts.forEach(([x, y]) => { allX.push(x); allY.push(y); });
        }
        break;
    }
  }

  if (!allX.length) return null;

  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const w = Math.round(maxX - minX);
  const h = Math.round(maxY - minY);
  if (w < 1 || h < 1) return null;

  // Normalize to [0,1]×[0,1]; flip Y (DXF Y is up, screen Y is down)
  const normPaths = paths.map(({ pts, closed }) => ({
    pts: pts.map(([x, y]) => [(x - minX) / w, (maxY - y) / h]),
    closed,
  }));

  return { name: filename.replace(/\.dxf$/i, ''), w, h, paths: normPaths };
}
