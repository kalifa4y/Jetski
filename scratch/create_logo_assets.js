import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}



// Une version SVG ultra-propre et exacte du logo pour l'affichage header et favicon
const exactLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <!-- Anneau Jaune principal -->
  <path d="M 100 10 A 90 90 0 1 1 10 100 L 52 100 A 48 48 0 1 0 100 52 Z" fill="#E6A100" />
  
  <!-- Arc Vert avec l'encoche distinctive -->
  <path d="M 10 100 C 10 40 40 10 100 10 L 100 52 C 60 52 52 60 52 100 Z" fill="#008542" />
  <path d="M 10 100 C 10 40 50 10 100 10 L 100 50 C 65 50 50 65 50 100 Z" fill="#008744" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'logo.svg'), exactLogoSvg, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), exactLogoSvg, 'utf-8');

console.log('✓ logo.svg et favicon.svg créés !');
