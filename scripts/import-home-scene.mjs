// Preserve the teammate's complete Home.tscn composition and original PNG bytes.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ref = process.argv[2] ?? '1f404a9';
const output = 'public/assets/home';
const read = path => execFileSync('git', ['show', `${ref}:mirrorvile/${path}`], { maxBuffer: 20 * 1024 * 1024 });
const scene = read('Home.tscn').toString('utf8');
const textures = new Map([...scene.matchAll(/path="res:\/\/([^"]+)" id="([^"]+)"/g)].map(m => [m[2], m[1]]));
mkdirSync(output, { recursive: true });
const nodes = [];
for (const m of scene.matchAll(/\[node name="([^"]+)" type="Sprite2D"[^\n]*\]([^]*?)(?=\n\[|$)/g)) {
  const [, name, body] = m;
  const source = textures.get(/texture = ExtResource\("([^"]+)"\)/.exec(body)[1]);
  const bytes = read(source);
  const file = `${name.toLowerCase()}.png`;
  writeFileSync(`${output}/${file}`, bytes);
  const vector = key => new RegExp(`${key} = Vector2\\(([^)]+)\\)`).exec(body)[1].split(',').map(Number);
  nodes.push({ name, file, position: vector('position'), scale: vector('scale'),
    size: [bytes.readUInt32BE(16), bytes.readUInt32BE(20)], source: `mirrorvile/${source}`,
    sha256: createHash('sha256').update(bytes).digest('hex') });
}
writeFileSync(`${output}/scene.json`, JSON.stringify({ commit: execFileSync('git', ['rev-parse', ref]).toString().trim(), source: 'mirrorvile/Home.tscn', nodes }, null, 2) + '\n');
writeFileSync(`${output}/Home.tscn`, scene);
writeFileSync('src/homeScene.json', JSON.stringify({ nodes: nodes.map(({ name, file, position, scale, size }) => ({ name, file, position, scale, size })) }, null, 2) + '\n');
console.log(nodes.map(n => `${n.name}: ${n.size.join('×')}`).join('\n'));
