// Render the actual runtime atlases at their original cadence for visual acceptance.
// pngjs and sharp are available in the bundled workspace dependencies via NODE_PATH.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');
const sharp = require('sharp');
const root = new URL('../', import.meta.url);
const names = ['cup-nooble-character', 'mirrorville-rust', 'mirrorville-sage', 'mirrorville-honey', 'mirrorville-coral'];
const images = names.map(name => PNG.sync.read(readFileSync(new URL(`public/assets/characters/${name}.png`, root))));
const width = 120, pageHeight = 128, zoom = 4;
const frames = [0, 1, 2, 1];
const outWidth = width * zoom, outHeight = pageHeight * zoom;
const pixels = Buffer.alloc(outWidth * outHeight * frames.length * 4);
for (let f = 0; f < frames.length; f++) {
  const frame = new PNG({ width, height: pageHeight });
  for (let p = 0; p < frame.data.length; p += 4) { frame.data[p] = 246; frame.data[p + 1] = 237; frame.data[p + 2] = 207; frame.data[p + 3] = 255; }
  for (let character = 0; character < images.length; character++) for (let direction = 0; direction < 4; direction++) {
    const source = images[character], sx = [64, 32, 0, 96][direction];
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
      const src = ((frames[f] * 32 + y) * source.width + sx + x) * 4;
      if (source.data[src + 3] < 128) continue;
      const target = ((direction * 32 + y) * width + character * 24 + 4 + x) * 4;
      source.data.copy(frame.data, target, src, src + 4);
    }
  }
  for (let y = 0; y < outHeight; y++) for (let x = 0; x < outWidth; x++) {
    const src = (Math.floor(y / zoom) * width + Math.floor(x / zoom)) * 4;
    const target = ((f * outHeight + y) * outWidth + x) * 4;
    frame.data.copy(pixels, target, src, src + 4);
  }
}
const destination = new URL('docs/validation/character-wardrobe/full-walk.gif', root);
mkdirSync(new URL('docs/validation/character-wardrobe/', root), { recursive: true });
await sharp(pixels, { raw: { width: outWidth, height: outHeight * frames.length, channels: 4, pageHeight: outHeight } })
  .gif({ loop: 0, delay: frames.map(() => 200), effort: 7 }).toFile(fileURLToPath(destination));
process.stdout.write('Wrote original + four new characters, four directions, 5fps\n');
