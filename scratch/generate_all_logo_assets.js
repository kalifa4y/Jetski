import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');

// Vectorisation SVG exacte du logo utilisateur
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <rect width="500" height="500" fill="none" />
  <!-- Portion Jaune Dorée (du haut 12h à la gauche 9h dans le sens horaire) -->
  <path d="
    M 250,30
    A 220,220 0 1,1 30,250
    L 140,250
    A 110,110 0 1,0 250,140
    Z
  " fill="#F3A800" />

  <!-- Portion Verte (quart haut-gauche avec l'encoche courbe) -->
  <path d="
    M 30,250
    A 220,220 0 0,1 250,30
    L 250,140
    A 150,150 0 0,0 30,250
    Z
  " fill="#008744" />
</svg>`;

// Fichiers SVG
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

// Générateur PNG avec zlib
function createLogoPngBuffer(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13, 0);
  const ihdrType = Buffer.from('IHDR');
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  function crc32(buf) {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(Buffer.concat([ihdrType, ihdrData])), 0);
  const ihdrChunk = Buffer.concat([ihdrLength, ihdrType, ihdrData, ihdrCrc]);

  // Rendu géométrique RGBA pixel par pixel du logo
  const rawPixels = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.44;
  const innerR = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawPixels[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 0, g = 0, b = 0, a = 0;

      if (dist >= innerR && dist <= outerR) {
        // En haut à gauche (dx <= 0 et dy <= 0)
        if (dx <= 0 && dy <= 0) {
          // Encoche verte
          const distFromCutout = Math.sqrt((dx - 0) * (dx - 0) + (dy - 0) * (dy - 0));
          if (distFromCutout >= innerR) {
            r = 0; g = 135; b = 68; a = 255; // Vert #008744
          }
        } else {
          // Anneau jaune
          r = 243; g = 168; b = 0; a = 255; // Jaune #F3A800
        }
      }

      rawPixels[pxOffset] = r;
      rawPixels[pxOffset + 1] = g;
      rawPixels[pxOffset + 2] = b;
      rawPixels[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawPixels);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length, 0);
  const idatType = Buffer.from('IDAT');
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(Buffer.concat([idatType, compressed])), 0);
  const idatChunk = Buffer.concat([idatLength, idatType, compressed, idatCrc]);

  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0, 0);
  const iendType = Buffer.from('IEND');
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendType), 0);
  const iendChunk = Buffer.concat([iendLength, iendType, iendCrc]);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const png192 = createLogoPngBuffer(192, 192);
const png512 = createLogoPngBuffer(512, 512);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);

console.log('✓ Tous les assets de logo (SVG et PNG 192x192 & 512x512) générés avec succès !');
