import * as THREE from 'three';

/** Gallery journeys pass through the open atrium, avoiding the partition walls. */
export function createCameraRoute(start: THREE.Vector3, end: THREE.Vector3) {
  const points = [start.clone()];
  const leavingGallery = start.z < -.8 && Math.abs(start.x) > 4;
  const enteringGallery = end.z < -.8 && Math.abs(end.x) > 4;
  if (leavingGallery) points.push(new THREE.Vector3(start.x, Math.min(start.y, 2.6), 1.1));
  if (enteringGallery) points.push(new THREE.Vector3(end.x, end.y, 1.1));
  points.push(end.clone());
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  curve.arcLengthDivisions = 120;
  curve.updateArcLengths();
  return curve;
}

