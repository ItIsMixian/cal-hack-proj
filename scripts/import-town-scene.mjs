// Reproduce the teammate's authored Godot layout without running Godot in the browser.
// PNGs are copied byte-for-byte; the runtime manifest preserves node order and transforms.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ref = process.argv[2] ?? '329e7e8';
const root = 'mirrorvile/';
const output = 'public/assets/town';
const read = path => execFileSync('git', ['show', `${ref}:${root}${path}`], { maxBuffer: 20 * 1024 * 1024 });
mkdirSync(output, { recursive: true });
const scene = read('Town map.tscn').toString('utf8');
const names = {
  '34f63188-9482-4b62-9970-ed569433db65': 'ground',
  '3b848336-3266-43bb-94e3-6eb33408d09e': 'cafe',
  'a6700190-48c9-4943-808e-8fb1e7e77a42': 'gym',
  '3b2809d8-648a-453a-aa42-74e40e0cc645': 'restaurant',
  'e6c00022-4e61-4eb5-9fa6-d0eb9d98a0bf': 'park',
  'ba605885-c30f-4767-9afb-3bef137d62ae': 'clock-hall',
  '5d1c95af-64d0-446d-b477-b9815811be79': 'cloud',
  '8b0c1bea-4a60-4ad9-bb97-4f3d229ee3a9': 'farm',
};
const textures = new Map([...scene.matchAll(/\[ext_resource[^\n]*path="res:\/\/([^"\n]+)" id="([^"]+)"\]/g)].map(m => [m[2], m[1]]));
const blocks = [...scene.matchAll(/\[sub_resource type="TileSetAtlasSource" id="([^"]+)"\]([^]*?)(?=\n\[|$)/g)];
const atlases = new Map(blocks.map(m => [m[1], /texture = ExtResource\("([^"]+)"\)/.exec(m[2])[1]]));
const sources = new Map([...scene.matchAll(/sources\/(\d+) = SubResource\("([^"]+)"\)/g)].map(m => [+m[1], atlases.get(m[2])]));
const copied = new Map();
const provenance = [];
function texture(id) {
  if (copied.has(id)) return copied.get(id);
  const path = textures.get(id);
  const basename = path.split('/').at(-1).replace('.png', '');
  const file = `${names[basename] ?? basename}.png`;
  const bytes = read(path);
  writeFileSync(`${output}/${file}`, bytes);
  provenance.push({ file, source: `${root}${path}`, sha256: createHash('sha256').update(bytes).digest('hex') });
  copied.set(id, file);
  return file;
}
const nodes = [];
for (const match of scene.matchAll(/\[node name="([^"]+)" type="([^"]+)"[^\n]*\]([^]*?)(?=\n\[|$)/g)) {
  const [, name, type, body] = match;
  const vector = (key, fallback) => {
    const m = new RegExp(`${key} = Vector2\\(([^)]+)\\)`).exec(body);
    return m ? m[1].split(',').map(Number) : fallback;
  };
  if (type === 'Sprite2D') {
    nodes.push({ name, type: 'sprite', texture: texture(/texture = ExtResource\("([^"]+)"\)/.exec(body)[1]),
      position: vector('position', [0, 0]), scale: vector('scale', [1, 1]),
      rotation: Number(/rotation = ([^\n]+)/.exec(body)?.[1] ?? 0),
      skew: Number(/skew = ([^\n]+)/.exec(body)?.[1] ?? 0) });
  } else if (type === 'TileMapLayer') {
    const data = Buffer.from(/PackedByteArray\("([^"]+)"\)/.exec(body)[1], 'base64');
    if (data.readUInt16LE(0) !== 0 || (data.length - 2) % 12) throw new Error('Unsupported Godot cell format');
    const cells = [];
    for (let offset = 2; offset < data.length; offset += 12) {
      const source = data.readUInt16LE(offset + 4);
      const alternative = data.readUInt16LE(offset + 10);
      if (alternative) throw new Error('Alternative tiles require an explicit transform adapter');
      cells.push({ x: data.readInt16LE(offset), y: data.readInt16LE(offset + 2),
        texture: texture(sources.get(source)), ax: data.readUInt16LE(offset + 6), ay: data.readUInt16LE(offset + 8) });
    }
    nodes.push({ name, type: 'tiles', cells });
  }
}
writeFileSync(`${output}/scene.json`, JSON.stringify({ source: `${ref}:${root}Town map.tscn`, tileSize: 16, nodes }, null, 2) + '\n');
writeFileSync(`${output}/Town-map.tscn`, scene);
writeFileSync(`${output}/sources.json`, JSON.stringify({ commit: execFileSync('git', ['rev-parse', ref]).toString().trim(), scene: `${root}Town map.tscn`, textures: provenance }, null, 2) + '\n');
console.log(`Imported ${nodes.length} ordered layers, ${copied.size} original textures, ${nodes.reduce((n, layer) => n + (layer.cells?.length ?? 0), 0)} tiles.`);
