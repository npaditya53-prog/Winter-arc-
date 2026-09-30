import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create clean SVG icon for desktop/browser
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#0f1013" rx="100"/>
  <path d="M256 64 L400 128 L400 272 C400 376 256 448 256 448 C256 448 112 376 112 272 L112 128 Z" fill="#15171c" stroke="#2563eb" stroke-width="20" stroke-linejoin="round"/>
  <path d="M256 160 C256 160 192 240 192 296 C192 331.3 220.7 360 256 360 C291.3 360 320 331.3 320 296 C320 240 256 160 256 160 Z" fill="#3b82f6"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// Helper function to create an uncompressed RGBA PNG
function createPng(width, height, r, g, b, a = 255) {
  // Simple PNG encoder
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC-32 implementation
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (crc ^ byte) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return crc ^ -1;
  }

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = chunk('IHDR', ihdrData);

  // Raw image data: scanlines with filter byte 0
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Draw dark background with blue shield/droplet in center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.35;

      if (dist < radius) {
        // Inner droplet blue
        rawData[pixelOffset] = 59; // R
        rawData[pixelOffset + 1] = 130; // G
        rawData[pixelOffset + 2] = 246; // B
        rawData[pixelOffset + 3] = 255;
      } else {
        // Background charcoal
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = a;
      }
    }
  }

  const idat = chunk('IDAT', zlib.deflateSync(rawData));
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const png192 = createPng(192, 192, 15, 16, 19);
const png512 = createPng(512, 512, 15, 16, 19);
const png180 = createPng(180, 180, 15, 16, 19);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);

console.log('Generated icons in public/ successfully.');
