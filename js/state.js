'use strict';

export const S = {
  pieces: [],
  nextId: 1,
  customSizes: JSON.parse(localStorage.getItem('dcb_sizes') || '[]'),
  results: {},
  activeAlgo: 'maxrects',
  showOffcuts: true,
  cachedPanel: { w: 2440, h: 1220, kerf: 3 },
  lang: 'fr',
  xDrag: null,
};

export const CM = 8; // canvas border margin (px)

export const PAL = [
  '#e94560','#4fc3f7','#81c784','#ffb74d','#ce93d8','#4dd0e1',
  '#f06292','#aed581','#ff8a65','#90caf9','#80cbc4','#ffe082',
  '#ef9a9a','#b39ddb','#ffcc80','#80deea','#c5e1a5','#ffab91',
];

export const BUILTIN = [
  { label:'2440×1220', w:2440, h:1220 },
  { label:'2500×1250', w:2500, h:1250 },
  { label:'3050×1525', w:3050, h:1525 },
  { label:'2800×2070', w:2800, h:2070 },
  { label:'2440×610',  w:2440, h:610  },
];

export function dl(content, filename, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function saveCustomSizes() {
  localStorage.setItem('dcb_sizes', JSON.stringify(S.customSizes));
}
