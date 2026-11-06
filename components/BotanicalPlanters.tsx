'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type V3 = [number, number, number];
type LeafStyle = 'broad' | 'oval';

const goldenAngle = 2.399963;
const planters: { position: V3; scale: number; rotation: number; style: LeafStyle; ceramic: string; seed: number }[] = [
  { position: [-4.65, 0, -2.35], scale: 1, rotation: .25, style: 'broad', ceramic: '#c5b89f', seed: 1 },
  { position: [4.65, 0, -2.35], scale: .92, rotation: -1.1, style: 'oval', ceramic: '#77806b', seed: 3 },
  { position: [-2.6, 0, -11.8], scale: .78, rotation: 1.4, style: 'oval', ceramic: '#a3977f', seed: 4 },
  { position: [2.6, 0, -11.8], scale: .82, rotation: -.6, style: 'broad', ceramic: '#a3977f', seed: 2 },
];

function buildPlant(style: LeafStyle, seed: number) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const stems: THREE.BufferGeometry[] = [];
  const veins: THREE.BufferGeometry[] = [];
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const vertex = new THREE.Vector3();
  const leafColor = new THREE.Color();
  const leafRows = 16;
  const leafColumns = 8;

  function addStem(points: THREE.Vector3[], radius: number, vein = false) {
    const curve = new THREE.CatmullRomCurve3(points);
    (vein ? veins : stems).push(new THREE.TubeGeometry(curve, vein ? 10 : 12, radius, vein ? 3 : 5, false));
  }

  function addLeaf(base: THREE.Vector3, angle: number, lean: number, length: number, width: number, variation: number) {
    rotation.setFromEuler(euler.set(lean, angle, Math.sin(variation * 2.1) * .12, 'YXZ'));
    matrix.compose(base, rotation, new THREE.Vector3(1, 1, 1));
    const start = positions.length / 3;
    const midrib: THREE.Vector3[] = [];

    for (let row = 0; row <= leafRows; row++) {
      const t = row / leafRows;
      // A raised midrib, cupped edges, and a falling tip keep the silhouette organic.
      const profile = Math.pow(Math.sin(Math.PI * t), style === 'broad' ? .67 : .88);
      const centerZ = .18 * Math.sin(t * Math.PI) - .34 * t * t;
      const y = length * (t - .12 * t * t * t);
      midrib.push(new THREE.Vector3(0, y, centerZ * length + .005).applyMatrix4(matrix));
      for (let column = 0; column <= leafColumns; column++) {
        const across = column / leafColumns * 2 - 1;
        const edge = Math.abs(across);
        const asymmetry = 1 + .065 * Math.sin(t * 11 + variation) * across;
        const x = across * width * profile * asymmetry;
        const cupping = -.075 * edge * edge * Math.sin(t * Math.PI);
        const ripple = Math.sin(t * 24 + variation) * .012 * edge * edge;
        vertex.set(x, y, centerZ * length + cupping + ripple).applyMatrix4(matrix);
        positions.push(vertex.x, vertex.y, vertex.z);
        leafColor.set(style === 'broad' ? '#4d7447' : '#597a42');
        leafColor.offsetHSL((variation % 3 - 1) * .012, -.04, .035 * Math.sin(t * Math.PI) - edge * .025 + variation * .002);
        colors.push(leafColor.r, leafColor.g, leafColor.b);
        if (row < leafRows && column < leafColumns) {
          const a = start + row * (leafColumns + 1) + column;
          const b = a + leafColumns + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    addStem(midrib, .0035, true);
  }

  if (style === 'broad') {
    for (let i = 0; i < 11; i++) {
      const angle = i * goldenAngle + seed * .4;
      const height = 1.15 + (i % 4) * .34;
      const reach = .2 + (i % 3) * .17;
      const origin = new THREE.Vector3(Math.cos(angle) * .1, .72, Math.sin(angle) * .1);
      const base = new THREE.Vector3(Math.sin(angle) * reach, height, Math.cos(angle) * reach);
      addStem([origin, new THREE.Vector3(base.x * .28, height * .68, base.z * .28), base], .012 - (i % 3) * .001);
      addLeaf(base, angle, .42 + (i % 3) * .28, .88 + (i % 4) * .1, .23 + (i % 3) * .035, i + seed);
    }
    // New growth remains upright and slightly narrower in the center of the crown.
    const shoot = new THREE.Vector3(.05, 2.35, -.04);
    addStem([new THREE.Vector3(0, .72, 0), new THREE.Vector3(.02, 1.5, -.02), shoot], .011);
    addLeaf(shoot, .4, .12, .68, .115, 2);
  } else {
    for (let branch = 0; branch < 5; branch++) {
      const angle = branch * goldenAngle + seed;
      const height = 1.75 + (branch % 3) * .31;
      const reach = .31 + branch * .045;
      const root = new THREE.Vector3(Math.sin(angle) * .08, .72, Math.cos(angle) * .08);
      const tip = new THREE.Vector3(Math.sin(angle) * reach, height, Math.cos(angle) * reach);
      addStem([root, new THREE.Vector3(tip.x * .4, 1.3, tip.z * .4), tip], .018);
      for (let leaf = 0; leaf < 5; leaf++) {
        const t = .34 + leaf * .155;
        const leafAngle = angle + (leaf % 2 ? .95 : -.95);
        const branchPoint = root.clone().lerp(tip, t);
        const base = branchPoint.clone().add(new THREE.Vector3(Math.sin(leafAngle) * .13, .045, Math.cos(leafAngle) * .13));
        addStem([branchPoint, branchPoint.clone().lerp(base, .5).add(new THREE.Vector3(0, .015, 0)), base], .006);
        addLeaf(base, leafAngle, .6 + leaf * .05, .56 + (leaf % 2) * .11, .19 + (leaf % 3) * .018, branch + leaf + seed);
      }
      addLeaf(tip, angle, .27, .65, .2, branch + seed);
    }
  }

  const foliage = new THREE.BufferGeometry();
  foliage.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  foliage.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  foliage.setIndex(indices);
  foliage.computeVertexNormals();
  const branches = mergeGeometries(stems)!;
  const midribs = mergeGeometries(veins)!;
  stems.forEach(geometry => geometry.dispose());
  veins.forEach(geometry => geometry.dispose());
  return { foliage, branches, midribs };
}

function Planter({ position, scale, rotation, style, ceramic, seed }: typeof planters[number]) {
  const geometries = useMemo(() => {
    const profile = [
      [.33, .045], [.37, .055], [.39, .09], [.445, .65], [.46, .73],
      [.455, .765], [.438, .78], [.417, .77], [.412, .735], [.408, .69],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return { ...buildPlant(style, seed), ceramic: new THREE.LatheGeometry(profile, 48) };
  }, [style, seed]);

  useEffect(() => () => Object.values(geometries).forEach(geometry => geometry.dispose()), [geometries]);

  return <group position={position} scale={scale} rotation={[0, rotation, 0]}>
    <mesh geometry={geometries.ceramic} castShadow receiveShadow>
      <meshStandardMaterial color={ceramic} roughness={.86} />
    </mesh>
    <mesh position={[0, .035, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[.345, .345, .065, 32]} />
      <meshStandardMaterial color="#716650" roughness={1} />
    </mesh>
    <mesh position={[0, .715, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[.41, 32]} />
      <meshStandardMaterial color="#44392a" roughness={1} />
    </mesh>
    <mesh geometry={geometries.branches} castShadow>
      <meshStandardMaterial color={style === 'broad' ? '#627248' : '#686142'} roughness={.83} />
    </mesh>
    <mesh geometry={geometries.foliage} castShadow receiveShadow>
      <meshPhysicalMaterial vertexColors side={THREE.DoubleSide} roughness={.65} clearcoat={.14} clearcoatRoughness={.55} />
    </mesh>
    <mesh geometry={geometries.midribs}>
      <meshStandardMaterial color="#8b9b64" roughness={.85} />
    </mesh>
  </group>;
}

export default function BotanicalPlanters() {
  return <group>{planters.map(planter => <Planter key={planter.seed} {...planter} />)}</group>;
}
