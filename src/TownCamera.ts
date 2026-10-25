export type CameraMode = 'general' | 'follow';
export type CameraFrame = { x: number; y: number; zoom: number; width: number; height: number };

const TOWN_WIDTH = 960;
const TOWN_HEIGHT = 672;

export function cameraTarget(width: number, height: number, mode: CameraMode, target?: { x: number; y: number }): CameraFrame {
  if (mode === 'follow' && target) return { ...target, zoom: Math.max(1.7, Math.min(3, width / 600)), width, height };
  return { x: TOWN_WIDTH / 2, y: TOWN_HEIGHT / 2, zoom: Math.max(width / TOWN_WIDTH, height / TOWN_HEIGHT), width, height };
}

export function clampGeneralCamera(frame: CameraFrame): CameraFrame {
  const minimum = cameraTarget(frame.width, frame.height, 'general').zoom;
  const zoom = Math.max(minimum, Math.min(minimum * 4, frame.zoom));
  const halfWidth = frame.width / zoom / 2;
  const halfHeight = frame.height / zoom / 2;
  return { ...frame, zoom,
    x: Math.max(halfWidth, Math.min(TOWN_WIDTH - halfWidth, frame.x)),
    y: Math.max(halfHeight, Math.min(TOWN_HEIGHT - halfHeight, frame.y)) };
}

// Keep the town point under the cursor fixed unless a map edge limits the pan.
export function zoomGeneralCamera(frame: CameraFrame, zoom: number, screenX: number, screenY: number): CameraFrame {
  const point = screenToTown(screenX, screenY, frame);
  const boundedZoom = clampGeneralCamera({ ...frame, zoom }).zoom;
  return clampGeneralCamera({ ...frame, zoom: boundedZoom,
    x: point.x - (screenX - frame.width / 2) / boundedZoom,
    y: point.y - (screenY - frame.height / 2) / boundedZoom });
}

export function screenToTown(x: number, y: number, camera: CameraFrame) {
  return { x: (x - camera.width / 2) / camera.zoom + camera.x, y: (y - camera.height / 2) / camera.zoom + camera.y };
}
