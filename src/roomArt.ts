import scene from './homeScene.json';

export const roomArtUrl = (file: string) => `assets/home/${file.replace(/\.png$/, '.webp')}`;
let pending: Promise<void> | undefined;

// Share decode work across background warm-up, room mounting and return visits.
export function loadRoomArt() {
  if (pending) return pending;
  pending = Promise.all(scene.nodes.map(node => new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.fetchPriority = 'low';
    const timeout = setTimeout(() => reject(new Error('Room artwork timed out')), 20_000);
    image.onload = async () => {
      try { if (image.decode) await image.decode(); clearTimeout(timeout); resolve(); }
      catch (error) { clearTimeout(timeout); reject(error); }
    };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Room artwork unavailable')); };
    image.src = roomArtUrl(node.file);
  }))).then(() => undefined).catch(error => { pending = undefined; throw error; });
  return pending;
}
