'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { damping, type Exploration } from '../lib/camera-motion';
type V3 = [number, number, number];
const UP = new THREE.Vector3(0, 1, 0);
const views: Record<string, { position: V3; look: V3 }> = {
  entrance: { position: [1.8, 2.15, 9.4], look: [0, 1.9, -3] },
  atrium: { position: [.8, 2.15, 7.8], look: [0, 1.8, -3] },
  workbench: { position: [.35, 4.1, 3.3], look: [0, 1.25, -2] },
  jobscout: { position: [-5.5, 2.1, -3.4], look: [-6.2, 1.9, -10] },
  systems: { position: [5.4, 2.1, -3.8], look: [6, 2, -11] },
};
export default function CameraRig({room, reduced, explore}: {
  room: string; reduced: boolean; explore: React.RefObject<Exploration>;
}) {
  const rig = useMemo(() => ({
    base: new THREE.Vector3(...views.entrance.position),
    aim: new THREE.Vector3(...views.entrance.look),
    destination: new THREE.Vector3(), target: new THREE.Vector3(),
    forward: new THREE.Vector3(), position: new THREE.Vector3(),
    look: new THREE.Vector3(), pointer: new THREE.Vector2(),
  }), []);
  const smooth = useRef({yaw: 0, pitch: 0, dolly: 0});
  useFrame(({camera, pointer, size}, elapsed) => {
    // A returning background tab must not jump through the entire transition.
    const dt = Math.min(elapsed, .05);
    const view = views[room] || views.atrium;
    rig.destination.set(...view.position);
    rig.target.set(...view.look);
    if (size.width < 650) rig.destination.z += 3.2;
    const travel = reduced ? 1 : damping(3.5, dt);
    rig.base.lerp(rig.destination, travel);
    rig.aim.lerp(rig.target, travel);
    const response = reduced ? 1 : damping(11, dt);
    for (const axis of ['yaw', 'pitch', 'dolly'] as const) {
      smooth.current[axis] += (explore.current[axis] - smooth.current[axis]) * response;
    }
    rig.forward.copy(rig.aim).sub(rig.base).normalize();
    rig.position.copy(rig.base).addScaledVector(rig.forward, -smooth.current.dolly);
    rig.forward.applyAxisAngle(UP, smooth.current.yaw);
    rig.look.copy(rig.position).addScaledVector(rig.forward, 10);
    rig.look.y += smooth.current.pitch;
    // Parallax yields completely to intentional dragging, avoiding competing inputs.
    const px = !reduced && !explore.current.dragging ? pointer.x * .06 : 0;
    const py = !reduced && !explore.current.dragging ? pointer.y * .035 : 0;
    rig.pointer.x += (px - rig.pointer.x) * response;
    rig.pointer.y += (py - rig.pointer.y) * response;
    rig.look.x += rig.pointer.x;
    rig.look.y += rig.pointer.y;
    camera.position.copy(rig.position);
    camera.lookAt(rig.look);
  });
  return null;
}
