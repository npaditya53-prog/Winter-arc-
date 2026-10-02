import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const publicDir = path.resolve('public');

function renderSvgToPng(svgPath, pngPath, width, height) {
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: width,
    },
    background: 'rgba(0, 0, 0, 0)',
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(pngPath, pngBuffer);
  console.log(`Rendered ${pngPath} (${width}x${height || width})`);
}

// 1. icon-512.png (Transparent background, full crisp emblem)
renderSvgToPng(
  path.join(publicDir, 'icon.svg'),
  path.join(publicDir, 'icon-512.png'),
  512,
  512
);

// 2. icon-192.png (Transparent background, standard notification icon & PWA icon)
renderSvgToPng(
  path.join(publicDir, 'icon.svg'),
  path.join(publicDir, 'icon-192.png'),
  192,
  192
);

// 3. icon-maskable-512.png (Full bleed with safe zone for Android launcher)
renderSvgToPng(
  path.join(publicDir, 'icon-maskable.svg'),
  path.join(publicDir, 'icon-maskable-512.png'),
  512,
  512
);

// 4. icon-maskable-192.png (Safe zone for Android launcher)
renderSvgToPng(
  path.join(publicDir, 'icon-maskable.svg'),
  path.join(publicDir, 'icon-maskable-192.png'),
  192,
  192
);

// 5. apple-touch-icon.png (180x180 with solid brand background for iOS Safari)
renderSvgToPng(
  path.join(publicDir, 'icon-maskable.svg'),
  path.join(publicDir, 'apple-touch-icon.png'),
  180,
  180
);

// 6. icon-badge.png (96x96 monochrome silhouette for Android status bar)
renderSvgToPng(
  path.join(publicDir, 'icon-badge.svg'),
  path.join(publicDir, 'icon-badge.png'),
  96,
  96
);

// 7. notification-icon.png (192x192 dedicated notification asset)
renderSvgToPng(
  path.join(publicDir, 'icon.svg'),
  path.join(publicDir, 'notification-icon.png'),
  192,
  192
);

console.log('All icons generated successfully!');
