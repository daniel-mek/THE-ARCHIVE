export type Exploration = { yaw: number; pitch: number; dolly: number; dragging: boolean };
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
// Exponential damping has the same response at 30, 60 and 120 Hz.
export const damping = (speed: number, seconds: number) => 1 - Math.exp(-speed * Math.max(0, seconds));
export function wheelDistance(delta: number, mode: number, viewportHeight: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? viewportHeight : 1);
  return clamp(pixels, -180, 180) * 0.0035;
}
export function dragOffset(x: number, y: number, width: number, height: number) {
  return { yaw: -x / Math.max(width, 320) * 1.7, pitch: y / Math.max(height, 320) * 2.4 };
}
