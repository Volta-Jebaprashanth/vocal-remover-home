// One-off asset prep: tight-crop the logo, make favicons and the 1200x630 OG image.
// Run with: node scripts/make-assets.mjs
import sharp from 'sharp';

const A = 'src/assets';
await sharp(`${A}/logo-light.png`).trim({ threshold: 5 }).toFile(`${A}/logo-trim.png`);
const iconTrim = await sharp(`${A}/icon.png`).trim({ threshold: 5 }).toBuffer();
await sharp(iconTrim).resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('public/favicon-64.png');
await sharp(iconTrim).resize(180, 180, { fit: 'contain', background: '#07070d' }).flatten({ background: '#07070d' }).png().toFile('public/apple-touch-icon.png');

const W = 1200, H = 630;
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="a" cx="15%" cy="10%" r="60%"><stop offset="0" stop-color="#d946ef" stop-opacity=".45"/><stop offset="1" stop-color="#d946ef" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="90%" cy="80%" r="65%"><stop offset="0" stop-color="#3b5bff" stop-opacity=".5"/><stop offset="1" stop-color="#3b5bff" stop-opacity="0"/></radialGradient>
    <linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#d946ef"/><stop offset=".45" stop-color="#7c5cff"/><stop offset=".8" stop-color="#3b5bff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#7c5cff" stroke-opacity=".1"/></pattern>
  </defs>
  <rect width="100%" height="100%" fill="#07070d"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <rect width="100%" height="100%" fill="url(#a)"/>
  <rect width="100%" height="100%" fill="url(#b)"/>
  <text x="440" y="250" font-family="Segoe UI, Arial, sans-serif" font-size="78" font-weight="700" fill="#fff">Vocal Remover</text>
  <text x="440" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="600" fill="url(#g)">Pull any song apart with AI.</text>
  <text x="440" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="27" fill="#b7b9cc">Vocals · Drums · Bass · Piano · Other</text>
  <text x="440" y="440" font-family="Segoe UI, Arial, sans-serif" font-size="27" fill="#b7b9cc">Free for Windows · Runs on your PC</text>
  <text x="440" y="540" font-family="Consolas, monospace" font-size="24" fill="#9b85ff">vocal-remover.voltajeba.com</text>
</svg>`);
const iconOg = await sharp(iconTrim).resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
await sharp(bg).composite([{ input: iconOg, left: 70, top: 145 }]).png().toFile('public/og.png');
console.log('assets done');
