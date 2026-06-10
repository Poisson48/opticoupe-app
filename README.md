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
- **Glisser-déposer** des pièces pour ajustement manuel
- **Affichage des chutes** avec dimensions, hachures et tooltip au survol
- **Tailles de panneaux personnalisées** sauvegardées localement
- **Import / Export CSV** de la liste des pièces
- **Sauvegarde / Chargement** du projet complet en JSON
- **Export Bon de débit** — document A4 imprimable compatible scieries françaises (Gedibois, etc.) avec plans visuels, liste des pièces et référence matériau avec lien produit
- **Interface FR / EN**

### Utilisation

1. Renseigner les dimensions du panneau standard (ex : 2440 × 1220 mm)
2. Ajouter les pièces à découper (nom, largeur, hauteur, quantité)
3. Cliquer sur **Optimiser la découpe**
4. Comparer les 4 stratégies et ajuster manuellement si besoin
5. Exporter le **Bon de débit** pour votre scierie

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
- **Drag & drop** pieces for manual fine-tuning
- **Offcut display** with dimensions, hatching and hover tooltip
- **Custom panel sizes** saved locally in the browser
- **CSV import / export** of the piece list
- **Project save / load** as JSON
- **Cutting order export** — printable A4 document compatible with panel cutting services, including visual layouts, piece list, and material reference with product link
- **FR / EN interface**

### Usage

1. Set your standard panel dimensions (e.g. 2440 × 1220 mm)
2. Add pieces to cut (name, width, height, quantity)
3. Click **Optimize cutting**
4. Compare the 4 strategies and adjust manually if needed
5. Export the **cutting order** for your supplier

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
