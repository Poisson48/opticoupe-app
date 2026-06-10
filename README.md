# OptiCoupe — Optimisation de découpe de panneaux bois

<div align="center">

## 🌐 [poisson48.github.io/opticoupe-app](https://poisson48.github.io/opticoupe-app/)

*Application web — aucune installation requise / No install required*

</div>

---

## 🇫🇷 Français

**OptiCoupe** est un logiciel web d'optimisation de découpe de panneaux bois. Il calcule comment placer un maximum de pièces dans un minimum de panneaux standards, en minimisant les chutes.

### Fonctionnalités

- **4 algorithmes comparés en onglets**
  - 🎯 *Densité max* (MaxRects) — minimum de pertes
  - 📏 *Chutes longues* (Guillotine LLAS) — génère des bandes longues réutilisables
  - ▬ *Chutes larges* (par rangées) — grandes chutes horizontales en bas
  - ⚖️ *Équilibré* (Guillotine SLAS) — bon compromis
- **Optimisation par relances aléatoires** — 12 permutations testées pour trouver la meilleure disposition
- **Rotation automatique** des pièces pour améliorer le rendement (désactivable)
- **Rotation manuelle** — bouton ↻ au survol ou clic droit sur une pièce
- **Glisser-déposer** des pièces pour ajustement manuel, avec **magnétisme** (accrochage aux bords du panneau et aux autres pièces)
- **Déplacement entre panneaux** — une pièce peut être glissée d'un panneau vers un autre
- **Ajout / suppression de panneaux vides** pour organiser manuellement la répartition
- **Affichage des chutes** avec dimensions, hachures et tooltip au survol
- **Tailles de panneaux personnalisées** sauvegardées localement
- **Import / Export CSV** de la liste des pièces (le CSV inclut les dimensions du panneau)
- **Sauvegarde automatique** — la session est restaurée au rechargement de la page
- **Sauvegarde / Chargement** du projet complet en JSON
- **Description matériau** étendue (champ texte libre) et lien produit URL
- **Commentaires** ajoutables au bon de débit
- **Export Bon de débit** — ouvre directement la boîte d'impression, document A4 avec liste individuelle de chaque coupe, plans visuels par panneau, commentaires et référence matériau
- **Interface FR / EN**

### Utilisation

1. Renseigner les dimensions du panneau standard (ex : 2440 × 1220 mm)
2. Ajouter les pièces à découper (nom, largeur, hauteur, quantité)
3. Cliquer sur **Optimiser la découpe**
4. Comparer les 4 stratégies, ajuster manuellement (glisser, faire pivoter, déplacer entre panneaux)
5. Cliquer sur **Bon de débit** pour lancer directement l'impression / export PDF

### Lancer en local

```bash
git clone https://github.com/Poisson48/opticoupe-app.git
cd opticoupe-app
python3 -m http.server 8080
# → http://localhost:8080
```

---

## 🇬🇧 English

**OptiCoupe** is a web-based wood panel cutting optimizer. It calculates how to fit the maximum number of pieces into the minimum number of standard panels, minimizing waste.

### Features

- **4 algorithms compared side by side**
  - 🎯 *Max density* (MaxRects) — minimum waste
  - 📏 *Long offcuts* (Guillotine LLAS) — generates long reusable strips
  - ▬ *Wide offcuts* (row-based) — large horizontal offcuts at the bottom
  - ⚖️ *Balanced* (Guillotine SLAS) — good all-round compromise
- **Randomized restart optimization** — 12 permutations tested to find the best layout
- **Automatic rotation** of pieces to improve efficiency (can be disabled)
- **Manual rotation** — ↻ button on hover or right-click on any piece
- **Drag & drop** pieces for manual fine-tuning, with **snapping** to panel edges and other pieces
- **Cross-panel dragging** — move a piece from one panel to another by dragging
- **Add / remove empty panels** to manually control piece distribution
- **Offcut display** with dimensions, hatching and hover tooltip
- **Custom panel sizes** saved locally in the browser
- **CSV import / export** of the piece list (panel dimensions are included in the CSV)
- **Auto-save** — the session is restored when the page is reloaded
- **Project save / load** as JSON
- **Extended material description** (free text field) and product URL
- **Comments** that appear in the cutting order export
- **Cutting order export** — opens the system print dialog directly, A4 document with individual cut list, per-panel visual layouts, comments, and material reference
- **FR / EN interface**

### Usage

1. Set your standard panel dimensions (e.g. 2440 × 1220 mm)
2. Add pieces to cut (name, width, height, quantity)
3. Click **Optimize cutting**
4. Compare the 4 strategies, adjust manually (drag, rotate, move between panels)
5. Click **Cutting order** to open the print / PDF dialog immediately

### Run locally

```bash
git clone https://github.com/Poisson48/opticoupe-app.git
cd opticoupe-app
python3 -m http.server 8080
# → http://localhost:8080
```

---

## Algorithmes / Algorithms

| Algorithme | Stratégie | Idéal pour |
|---|---|---|
| MaxRects BSSF | Rectangles maximaux libres | Rendement maximum |
| Guillotine LLAS | Coupe guillotine, axe long | Chutes en bandes longues |
| Guillotine SLAS | Coupe guillotine, axe court | Usage général |
| Shelf (rangées) | Empilement par rangées | Chutes larges propres |

Le problème de bin packing 2D est NP-difficile — ces algorithmes sont des heuristiques état de l'art complétées par des relances aléatoires (*random restarts*).

---

<div align="center">
Fait pour l'aménagement intérieur, compatible <a href="https://www.gedibois.fr">Gedibois Alès</a> et scieries françaises.
</div>
