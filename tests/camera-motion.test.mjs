import test from 'node:test';
import assert from 'node:assert/strict';
import { damping, dragOffset, wheelDistance } from '../lib/camera-motion.ts';
test('camera settling is consistent across refresh rates', () => {
  const simulate = hz => { let x = 0; for(let i=0;i<hz;i++) x += (1-x)*damping(11,1/hz); return x; };
  assert.ok(Math.abs(simulate(30)-simulate(120))<1e-10);
});
test('wheel devices normalize to equivalent distances and limit extreme events', () => {
  assert.equal(wheelDistance(16,0,800),wheelDistance(1,1,800));
  assert.equal(wheelDistance(80,0,800),wheelDistance(.1,2,800));
  assert.equal(wheelDistance(9999,0,800),.63);
});
test('drag sensitivity follows the fraction of the viewport traversed', () => {
  assert.deepEqual(dragOffset(100,80,1000,800),dragOffset(200,160,2000,1600));
});
