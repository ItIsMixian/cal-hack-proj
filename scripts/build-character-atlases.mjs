// Mechanical preparation of approved ImageGen art; no redesign or new painted pixels.
// Requires pngjs (available in the bundled workspace Node dependencies via NODE_PATH).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const { PNG } = createRequire(import.meta.url)('pngjs');
const root = new URL('../', import.meta.url);
const front = PNG.sync.read(readFileSync(new URL('art/characters/approved-fronts.png', root)));
const directions = PNG.sync.read(readFileSync(new URL('art/characters/directions.png', root)));
if (front.width !== 2171 || front.height !== 724 || directions.width !== 1086 || directions.height !== 1448) {
  throw new Error('Source sizes changed: verify cell gutters before regenerating.');
}
function crop(image, columns, column, top, bottom) {
  let x0 = image.width, y0 = image.height, x1 = 0, y1 = 0;
  for (let y = top; y < bottom; y++) for (let x = Math.round(column * image.width / columns); x < Math.round((column + 1) * image.width / columns); x++) {
    if (image.data[(y * image.width + x) * 4 + 3] < 128) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x0 > x1 || y0 > y1) throw new Error('Empty source cell');
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
const boundaries = [0, 380, 725, 1085, 1448];
const names = ['rust', 'sage', 'honey', 'coral'];
function walkingRows(image) {
  const runs = [];
  for (let y = 0; y < image.height; y++) {
    let count = 0;
    for (let x = 0; x < image.width; x++) if (image.data[(y * image.width + x) * 4 + 3] >= 128) count++;
    if (count < Math.max(3, Math.floor(image.width * .005))) continue;
    const last = runs.at(-1);
    if (!last || y > last.end + 2) runs.push({ start: y, end: y });
    else last.end = y;
  }
  const rows = runs.filter(row => row.end - row.start > image.height * .1);
  if (rows.length !== 3) throw new Error(`Expected 3 animation rows, found ${rows.length}`);
  return [0, Math.round((rows[0].end + rows[1].start) / 2), Math.round((rows[1].end + rows[2].start) / 2), image.height];
}

function sample(source, box, height) {
  const width = Math.min(16, Math.round(box.width / box.height * height));
  const left = Math.floor((16 - width) / 2), top = 31 - height;
  const pixels = Buffer.alloc(16 * 32 * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = box.x + Math.min(box.width - 1, Math.floor((x + .5) * box.width / width));
    const sy = box.y + Math.min(box.height - 1, Math.floor((y + .5) * box.height / height));
    const offset = (sy * source.width + sx) * 4;
    if (source.data[offset + 3] < 128) continue;
    const out = ((y + top) * 16 + x + left) * 4;
    source.data.copy(pixels, out, offset, offset + 3); pixels[out + 3] = 255;
  }
  return pixels;
}

for (let character = 0; character < 4; character++) {
  const walk = PNG.sync.read(readFileSync(new URL(`art/characters/walk/${names[character]}.png`, root)));
  const walkRows = walkingRows(walk);
  const atlas = new PNG({ width: 128, height: 96 });
  const poses = [
    [64, front, crop(front, 4, character, 0, front.height)],
    ...[32, 0, 96].map((x, column) => [x, directions, crop(directions, 3, column, boundaries[character], boundaries[character + 1])]),
  ];
  for (const [atlasX, source, box] of poses) {
    const width = Math.min(15, Math.round(box.width / box.height * 21));
    const left = Math.floor((16 - width) / 2);
    const idle = Buffer.alloc(16 * 32 * 4);
    for (let y = 0; y < 21; y++) for (let x = 0; x < width; x++) {
      const sx = box.x + Math.min(box.width - 1, Math.floor((x + .5) * box.width / width));
      const sy = box.y + Math.min(box.height - 1, Math.floor((y + .5) * box.height / 21));
      const offset = (sy * source.width + sx) * 4;
      if (source.data[offset + 3] < 128) continue;
      const out = ((y + 10) * 16 + x + left) * 4;
      source.data.copy(idle, out, offset, offset + 3); idle[out + 3] = 255;
    }
    const column = { 0: 0, 32: 1, 64: 2, 96: 3 }[atlasX];
    for (const row of [0, 1, 2]) {
      const pixels = row === 1 ? idle : sample(walk, crop(walk, 4, column, walkRows[row], walkRows[row + 1]), 22);
      if (row !== 1) {
        // Lock the approved hair/face to its exact idle pixels, lifted one pixel as
        // in the original atlas. New painted body/arm/leg poses remain below it.
        pixels.fill(0, 0, 22 * 16 * 4);
        idle.copy(pixels, 0, 16 * 4, 23 * 16 * 4);
      }
      for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
        const target = ((row * 32 + y) * atlas.width + atlasX + x) * 4;
        pixels.copy(atlas.data, target, (y * 16 + x) * 4, (y * 16 + x + 1) * 4);
      }
    }
  }
  const png = PNG.sync.write(atlas);
  writeFileSync(new URL(`public/assets/characters/mirrorville-${names[character]}.png`, root), png);
  process.stdout.write(`${character + 1}: ${names[character]} — ${png.length} bytes\n`);
}
