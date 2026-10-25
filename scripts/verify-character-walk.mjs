import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { PNG } = createRequire(import.meta.url)('pngjs');
const names = ['rust', 'sage', 'honey', 'coral'];
for (const name of names) {
  const image = PNG.sync.read(readFileSync(new URL(`../public/assets/characters/mirrorville-${name}.png`, import.meta.url)));
  assert.equal(image.width, 128); assert.equal(image.height, 96);
  const pixel = (x, y) => image.data.subarray((y * image.width + x) * 4, (y * image.width + x + 1) * 4);
  for (const column of [0, 32, 64, 96]) {
    for (const row of [0, 1, 2]) {
      let visible = 0;
      for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
        if (pixel(column + x, row * 32 + y)[3]) { visible++; assert.ok(y >= 8 && y <= 30, 'Sprite must remain in frame'); }
      }
      assert.ok(visible > 100);
    }
    for (const row of [0, 2]) for (let y = 0; y < 22; y++) for (let x = 0; x < 16; x++) {
      assert.deepEqual(pixel(column + x, row * 32 + y), pixel(column + x, 32 + y + 1), 'Approved head must only bob one pixel');
    }
    let bodyChanges = 0, legChanges = 0;
    for (let y = 22; y < 31; y++) for (let x = 0; x < 16; x++) {
      if (!pixel(column + x, y).equals(pixel(column + x, y + 64))) {
        if (y < 27) bodyChanges++; else legChanges++;
      }
    }
    assert.ok(bodyChanges > 0, `${name}: upper body/arms must change between strides`);
    assert.ok(legChanges > 0, `${name}: legs must change between strides`);
  }
  process.stdout.write(`${name}: 12 grounded frames; locked heads; distinct arm/body and leg poses\n`);
}
