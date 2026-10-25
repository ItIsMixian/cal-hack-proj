export type CameraMode = 'general' | 'follow';
export type CameraFrame = { x: number; y: number; zoom: number; width: number; height: number };

export function cameraTarget(width: number, height: number, mode: CameraMode, target?: { x: number; y: number }): CameraFrame {
  if (mode === 'follow' && target) return { ...target, zoom: Math.max(1.7, Math.min(3, width / 600)), width, height };
  return { x: 480, y: 336, zoom: Math.min(width / 960, height / 672), width, height };
}

export function screenToTown(x: number, y: number, camera: CameraFrame) {
  return { x: (x - camera.width / 2) / camera.zoom + camera.x, y: (y - camera.height / 2) / camera.zoom + camera.y };
}
