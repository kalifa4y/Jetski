import fs from 'fs';
import path from 'path';

// Un script pour générer un favicon SVG attrayant et créer des PNGs d'icônes PWA
const publicDir = path.resolve('public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Génération de favicon.svg (SVG moderne avec dégradé vert/bleu, icône de magasin et pièce de monnaie)
const svgIconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Fond arrondi PWA -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />

  <!-- Graphique / Pièce de monnaie -->
  <g filter="url(#shadow)" transform="translate(256, 256)">
    <!-- Forme de magasin / Glaces -->
    <path d="M-100,-60 L100,-60 L120,40 C120,70 90,100 60,100 C30,100 10,70 0,60 C-10,70 -30,100 -60,100 C-90,100 -120,70 -120,40 Z" fill="#ffffff" opacity="0.95" />
    <path d="M-110,-60 L110,-60 L80,-120 L-80,-120 Z" fill="url(#goldGrad)" />
    
    <!-- Симbole Monnaie / Solde -->
    <circle cx="0" cy="40" r="50" fill="url(#goldGrad)" stroke="#ffffff" stroke-width="8" />
    <text x="0" y="58" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#ffffff" text-anchor="middle">$</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIconContent, 'utf-8');
console.log('✓ favicon.svg créé');
