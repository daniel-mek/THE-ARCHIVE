'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { createCameraRoute } from '../lib/camera-route';
import { cinematicEase, damping, travelDuration, type Exploration } from '../lib/camera-motion';

type V3 = [number, number, number];
const UP = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const views: Record<string, { position: V3; look: V3 }> = {
  entrance: { position: [1.8, 2.15, 9.4], look: [0, 1.9, -3] },
  atrium: { position: [.8, 2.15, 7.8], look: [0, 1.8, -3] },
  workbench: { position: [.35, 4.1, 3.3], look: [0, 1.25, -2] },
  jobscout: { position: [-5.5, 2.1, -3.4], look: [-6.2, 1.9, -10] },
  systems: { position: [5.4, 2.1, -3.8], look: [6, 2, -11] },
};

export default function CameraRig({ room, reduced, explore }: {
  room: string; reduced: boolean; explore: React.RefObject<Exploration>;
}) {
  const rig = useMemo(() => ({
    key: '', elapsed: 0, duration: 1, initialized: false,
    base: new THREE.Vector3(), destination: new THREE.Vector3(), target: new THREE.Vector3(),
    forward: new THREE.Vector3(), matrix: new THREE.Matrix4(),
    fromRotation: new THREE.Quaternion(), rotation: new THREE.Quaternion(), toRotation: new THREE.Quaternion(),
    yawRotation: new THREE.Quaternion(), pitchRotation: new THREE.Quaternion(),
    path: null as THREE.CatmullRomCurve3 | null,
    smooth: { yaw: 0, pitch: 0, dolly: 0 }, pointer: new THREE.Vector2(),
  }), []);

  useFrame(({ camera, pointer, size }, elapsed) => {
    const dt = Math.min(elapsed, .05);
    const narrow = size.width < 650;
    const key = `${room}:${narrow}`;
    if (rig.key !== key) {
      const view = views[room] || views.atrium;
      rig.destination.set(...view.position);
      rig.target.set(...view.look);
      if (narrow) rig.destination.z += 3.2;
      rig.matrix.lookAt(rig.destination, rig.target, UP);
      rig.toRotation.setFromRotationMatrix(rig.matrix);
      // Retarget from the visible camera, including drag/dolly, without a position snap.
      rig.base.copy(rig.initialized ? camera.position : rig.destination);
      rig.fromRotation.copy(rig.initialized ? camera.quaternion : rig.toRotation);
      rig.path = createCameraRoute(rig.base, rig.destination);
      rig.duration = travelDuration(rig.path.getLength());
      rig.elapsed = rig.initialized ? 0 : rig.duration;
      rig.smooth.yaw = rig.smooth.pitch = rig.smooth.dolly = 0;
      rig.pointer.set(0, 0);
      explore.current.yaw = explore.current.pitch = explore.current.dolly = 0;
      rig.initialized = true;
      rig.key = key;
    }

    rig.elapsed = reduced ? rig.duration : Math.min(rig.duration, rig.elapsed + dt);
    const progress = cinematicEase(rig.elapsed / rig.duration);
    rig.path!.getPointAt(progress, rig.base);
    rig.rotation.slerpQuaternions(rig.fromRotation, rig.toRotation, progress);

    const response = reduced ? 1 : damping(10, dt);
    for (const axis of ['yaw', 'pitch', 'dolly'] as const) {
      rig.smooth[axis] += (explore.current[axis] - rig.smooth[axis]) * response;
    }
    const resting = rig.elapsed >= rig.duration && !reduced && !explore.current.dragging;
    rig.pointer.x += ((resting ? pointer.x * .006 : 0) - rig.pointer.x) * response;
    rig.pointer.y += ((resting ? pointer.y * .0035 : 0) - rig.pointer.y) * response;
    rig.forward.set(0, 0, -1).applyQuaternion(rig.rotation);
    camera.position.copy(rig.base).addScaledVector(rig.forward, -rig.smooth.dolly);
    rig.yawRotation.setFromAxisAngle(UP, rig.smooth.yaw - rig.pointer.x);
    rig.pitchRotation.setFromAxisAngle(X, rig.smooth.pitch * .1 + rig.pointer.y);
    camera.quaternion.copy(rig.rotation).premultiply(rig.yawRotation).multiply(rig.pitchRotation);
  });
  return null;
}
