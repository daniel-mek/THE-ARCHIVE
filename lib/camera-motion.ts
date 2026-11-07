export type Exploration = { yaw: number; pitch: number; dolly: number; dragging: boolean };
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
// Exponential damping has the same response at 30, 60 and 120 Hz.
export const damping = (speed: number, seconds: number) => 1 - Math.exp(-speed * Math.max(0, seconds));
// Zero velocity and acceleration at both ends prevent abrupt launch or a long settling tail.
export function cinematicEase(progress: number) {
  const t = clamp(progress, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export const travelDuration = (distance: number) => clamp(1.1 + distance * .065, 1.25, 2.25);
export function wheelDistance(delta: number, mode: number, viewportHeight: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? viewportHeight : 1);
  return clamp(pixels, -180, 180) * 0.0035;
}
export function dragOffset(x: number, y: number, width: number, height: number) {
  return { yaw: -x / Math.max(width, 320) * 1.7, pitch: y / Math.max(height, 320) * 2.4 };
}
