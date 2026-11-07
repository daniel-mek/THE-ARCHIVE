import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { createCameraRoute } from '../lib/camera-route.ts';
import { cinematicEase, damping, dragOffset, travelDuration, wheelDistance } from '../lib/camera-motion.ts';
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
test('cinematic travel starts and stops without a velocity step or overshoot', () => {
  assert.equal(cinematicEase(-1), 0);
  assert.equal(cinematicEase(2), 1);
  const step = .0001;
  assert.ok(cinematicEase(step) / step < .00001);
  assert.ok((1 - cinematicEase(1 - step)) / step < .00001);
  let previous = 0;
  for (let i = 0; i <= 100; i++) {
    const next = cinematicEase(i / 100);
    assert.ok(next >= previous && next <= 1);
    previous = next;
  }
});
test('travel durations are bounded and longer journeys get more time', () => {
  assert.equal(travelDuration(0), 1.25);
  assert.ok(travelDuration(10) > travelDuration(3));
  assert.equal(travelDuration(100), 2.25);
});

test('gallery routes stay clear of atrium columns and partition walls', () => {
  const stops = [[.8,2.15,7.8],[.35,4.1,3.3],[-5.5,2.1,-3.4],[5.4,2.1,-3.8]];
  for (const from of stops) for (const to of stops) {
    const route = createCameraRoute(new Vector3(...from),new Vector3(...to));
    assert.ok(route.getPointAt(0).distanceTo(new Vector3(...from)) < 1e-8);
    assert.ok(route.getPointAt(1).distanceTo(new Vector3(...to)) < 1e-8);
    for (let i=0;i<=150;i++) {
      const point=route.getPointAt(i/150);
      assert.ok(point.toArray().every(Number.isFinite));
      for (const sign of [-1,1]) {
        assert.ok(!(Math.abs(point.x-sign*3.4)<.48 && Math.abs(point.z+2)<.55), 'route intersects a front column');
        assert.ok(!(Math.abs(point.x-sign*3.8)<.35 && point.z < -3.3), 'route intersects a gallery partition');
      }
    }
  }
});
