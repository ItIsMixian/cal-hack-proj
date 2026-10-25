import { LANDMARKS } from '../spacetimedb/src/world';

// Camera only: retain every Godot node's position, scale, rotation and layer order.
// The park extends beyond the floor sprite, so frame the complete town, not just the floor.
const CAMERA_X = 440;
const CAMERA_Y = 310;
type SpriteLayer = { type: 'sprite'; name: string; texture: string; position: number[]; scale: number[]; rotation: number; skew: number };
type TileLayer = { type: 'tiles'; name: string; cells: { x: number; y: number; texture: string; ax: number; ay: number }[] };
type Scene = { tileSize: number; nodes: (SpriteLayer | TileLayer)[] };

export async function loadAuthoredTown(g: CanvasRenderingContext2D) {
  const response = await fetch('assets/town/scene.json', { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Town manifest: ${response.status}`);
  const scene = await response.json() as Scene;
  const files = new Set(scene.nodes.flatMap(n => n.type === 'sprite' ? [n.texture] : n.cells.map(c => c.texture)));
  const images = new Map(await Promise.all([...files].map(file => new Promise<[string, HTMLImageElement]>((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => reject(new Error(`Town texture timed out: ${file}`)), 20_000);
    image.onload = () => { clearTimeout(timeout); resolve([file, image]); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error(`Town texture: ${file}`)); };
    // Keep filename commas literal so Vite's static-path decoding finds the asset.
    image.src = `assets/town/${encodeURI(file.replace(/\.png$/, '.webp'))}`;
  }))));
  // Commit to the cache only when all layers are ready; the UI offers retry on load errors.
  g.save();
  g.clearRect(0, 0, 960, 672);
  g.translate(CAMERA_X, CAMERA_Y);
  g.imageSmoothingEnabled = false;
  for (const node of scene.nodes) {
    if (node.type === 'sprite') {
      const image = images.get(node.texture)!;
      const [sx, sy] = node.scale;
      const rotation = node.rotation;
      // Godot's Transform2D uses rotation + skew for its second basis vector.
      g.save();
      g.transform(Math.cos(rotation) * sx, Math.sin(rotation) * sx,
        -Math.sin(rotation + node.skew) * sy, Math.cos(rotation + node.skew) * sy,
        node.position[0], node.position[1]);
      g.drawImage(image, -image.width / 2, -image.height / 2);
      g.restore();
    } else {
      const t = scene.tileSize;
      for (const cell of node.cells) g.drawImage(images.get(cell.texture)!, cell.ax * t, cell.ay * t, t, t, cell.x * t, cell.y * t, t, t);
    }
  }
  g.restore();
}

// The simulation still has its original six regions. Project those coordinates onto
// the authored scene's forecourts without migrating or rewriting any stored positions.
// Smooth weights keep travel continuous, including when the server changes `place`.
const COURTS: Record<string, [number, number]> = {
  gym: [511, 307], cafe: [286, 385], food: [721, 424],
  workshop: [153, 574], lounge: [220, 237], park: [799, 484],
};
export function projectTownPosition(x: number, y: number): { x: number; y: number } {
  let total = 0, px = 0, py = 0;
  for (const region of LANDMARKS) {
    const dx = x - (region.x + region.w / 2);
    const dy = y - (region.y + region.h / 2);
    const distance = Math.hypot(dx / (region.w / 2), dy / (region.h / 2));
    const weight = 1 / (0.001 + distance ** 8);
    const court = COURTS[region.key];
    px += weight * (court[0] + Math.max(-55, Math.min(55, dx * 9)));
    py += weight * (court[1] + Math.max(-18, Math.min(18, dy * 4)));
    total += weight;
  }
  return { x: px / total / 24, y: py / total / 24 };
}
