'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PlasterMaterial } from './SurfaceMaterials';

type V3 = [number, number, number];
type LeafStyle = 'broad' | 'oval';

const goldenAngle = 2.399963;
const planters: { position: V3; scale: number; rotation: number; style: LeafStyle; ceramic: string; seed: number }[] = [
  { position: [-4.65, 0, -2.35], scale: 1, rotation: .25, style: 'broad', ceramic: '#c5b89f', seed: 1 },
  { position: [4.65, 0, -2.35], scale: .92, rotation: -1.1, style: 'oval', ceramic: '#77806b', seed: 3 },
  { position: [-2.6, 0, -11.8], scale: .78, rotation: 1.4, style: 'oval', ceramic: '#a3977f', seed: 4 },
  { position: [2.6, 0, -11.8], scale: .82, rotation: -.6, style: 'broad', ceramic: '#a3977f', seed: 2 },
];

/** Veins follow the blade's UVs, while colour comes from each leaf's age. */
function createLeafTextures() {
  const width = 256, height = 512;
  const color = new Uint8Array(width * height * 4);
  const relief = new Uint8Array(color.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const t = y / (height - 1), across = x / (width - 1) * 2 - 1;
    const edge = Math.abs(across);
    const midrib = Math.exp(-across * across * 1700);
    let vein = 0;
    for (let rib = 0; rib < 11; rib++) {
      const line = .08 + rib * .071 + .13 * Math.pow(edge, .8);
      vein = Math.max(vein, Math.exp(-Math.pow((t - line) / .004, 2)) * (1 - edge * .7));
    }
    const random = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    const grain = (random - Math.floor(random) - .5) * 5;
    const value = 227 + midrib * 17 + vein * 9 - edge * edge * 12 + grain;
    const i = (y * width + x) * 4;
    color[i] = Math.min(255, value); color[i + 1] = Math.min(255, value + 3); color[i + 2] = value - 5; color[i + 3] = 255;
    relief[i] = relief[i + 1] = relief[i + 2] = 118 + midrib * 40 + vein * 15 + grain;
    relief[i + 3] = 255;
  }
  function texture(data: Uint8Array, srgb = false) {
    const result = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    result.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    result.minFilter = THREE.LinearMipmapLinearFilter;
    result.magFilter = THREE.LinearFilter;
    result.generateMipmaps = true;
    result.anisotropy = 4;
    result.needsUpdate = true;
    return result;
  }
  return { map: texture(color, true), bump: texture(relief) };
}

function buildPlant(style: LeafStyle, seed: number) {
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const stems: THREE.BufferGeometry[] = [];
  const veins: THREE.BufferGeometry[] = [];
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const vertex = new THREE.Vector3();
  const leafColor = new THREE.Color();
  const leafRows = 24;
  const leafColumns = 12;

  function addStem(points: THREE.Vector3[], radius: number, vein = false) {
    const curve = new THREE.CatmullRomCurve3(points);
    (vein ? veins : stems).push(new THREE.TubeGeometry(curve, vein ? 10 : 12, radius, vein ? 3 : 5, false));
  }

  function addLeaf(base: THREE.Vector3, angle: number, lean: number, length: number, width: number, variation: number) {
    rotation.setFromEuler(euler.set(lean, angle, Math.sin(variation * 2.1) * .24, 'YXZ'));
    matrix.compose(base, rotation, new THREE.Vector3(1, 1, 1));
    const start = positions.length / 3;
    const midrib: THREE.Vector3[] = [];

    for (let row = 0; row <= leafRows; row++) {
      const t = row / leafRows;
      // A raised midrib, cupped edges, and a falling tip keep the silhouette organic.
      const profile = Math.pow(Math.sin(Math.PI * t), style === 'broad' ? .62 : .7);
      const centerZ = .08 * Math.sin(t * Math.PI) + .34 * t * t * t;
      const y = length * (t - .15 * t * t * t * t);
      midrib.push(new THREE.Vector3(0, y, centerZ * length - .002).applyMatrix4(matrix));
      for (let column = 0; column <= leafColumns; column++) {
        const across = column / leafColumns * 2 - 1;
        const edge = Math.abs(across);
        const asymmetry = 1 + .09 * Math.sin(t * 8 + variation) * across;
        // Slightly interrupted margins and a slow twist break up repeated silhouettes.
        const split = style === 'broad' ? 1 - .16 * Math.exp(-Math.pow((t - .66 - .045 * Math.sin(variation)) / .017, 2)) * (across > 0 ? 1 : .3) : 1;
        const x = across * width * profile * asymmetry * split;
        const cupping = .06 * edge * edge * Math.sin(t * Math.PI);
        const ripple = Math.sin(t * 17 + variation) * .007 * edge * edge + across * Math.sin(t * 4 + variation) * .035;
        vertex.set(x, y, centerZ * length + cupping + ripple).applyMatrix4(matrix);
        positions.push(vertex.x, vertex.y, vertex.z);
        leafColor.set(style === 'broad' ? '#5b864e' : '#62804a');
        leafColor.offsetHSL(Math.sin(variation) * .018, Math.cos(variation * 1.7) * .06, .025 * Math.sin(t * Math.PI) - edge * .018 + Math.sin(variation * 2.8) * .045);
        colors.push(leafColor.r, leafColor.g, leafColor.b);
        uvs.push(column / leafColumns, t);
        if (row < leafRows && column < leafColumns) {
          const a = start + row * (leafColumns + 1) + column;
          const b = a + leafColumns + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    addStem(midrib, .0017, true);
  }

  if (style === 'broad') {
    for (let i = 0; i < 14; i++) {
      const angle = i * goldenAngle + seed * .4;
      const height = 1.18 + (i % 5) * .24 + Math.sin(i * 3.1) * .08;
      const reach = .16 + (i % 3) * .12;
      const origin = new THREE.Vector3(Math.cos(angle) * .1, .72, Math.sin(angle) * .1);
      const base = new THREE.Vector3(Math.sin(angle) * reach, height, Math.cos(angle) * reach);
      addStem([origin, new THREE.Vector3(base.x * .28, height * .68, base.z * .28), base], .012 - (i % 3) * .001);
      addLeaf(base, angle, .24 + (i % 5) * .19, .92 + (i % 4) * .1, .24 + (i % 3) * .032, i + seed);
    }
    // New growth remains upright and slightly narrower in the center of the crown.
    const shoot = new THREE.Vector3(.05, 2.35, -.04);
    addStem([new THREE.Vector3(0, .72, 0), new THREE.Vector3(.02, 1.5, -.02), shoot], .011);
    addLeaf(shoot, .4, .3, .68, .1, 2);
  } else {
    for (let branch = 0; branch < 7; branch++) {
      const angle = branch * goldenAngle + seed;
      const height = 1.65 + (branch % 4) * .25;
      const reach = .26 + branch * .055;
      const root = new THREE.Vector3(Math.sin(angle) * .08, .72, Math.cos(angle) * .08);
      const tip = new THREE.Vector3(Math.sin(angle) * reach, height, Math.cos(angle) * reach);
      addStem([root, new THREE.Vector3(tip.x * .4, 1.3, tip.z * .4), tip], .018);
      for (let leaf = 0; leaf < 6; leaf++) {
        const t = .32 + leaf * .13;
        const leafAngle = angle + (leaf % 2 ? .95 : -.95);
        const branchPoint = root.clone().lerp(tip, t);
        const base = branchPoint.clone().add(new THREE.Vector3(Math.sin(leafAngle) * .13, .045, Math.cos(leafAngle) * .13));
        addStem([branchPoint, branchPoint.clone().lerp(base, .5).add(new THREE.Vector3(0, .015, 0)), base], .006);
        addLeaf(base, leafAngle, 1.05 + Math.sin(leaf + branch) * .32, .42 + (leaf % 3) * .065, .145 + (leaf % 3) * .015, branch * 3 + leaf + seed);
      }
      addLeaf(tip, angle, .55, .5, .15, branch + seed);
    }
  }

  const foliage = new THREE.BufferGeometry();
  foliage.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  foliage.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  foliage.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  foliage.setIndex(indices);
  foliage.computeVertexNormals();
  const branches = mergeGeometries(stems)!;
  const midribs = mergeGeometries(veins)!;
  stems.forEach(geometry => geometry.dispose());
  veins.forEach(geometry => geometry.dispose());
  return { foliage, branches, midribs };
}

function Planter({ position, scale, rotation, style, ceramic, seed, leafTextures }: typeof planters[number] & { leafTextures: ReturnType<typeof createLeafTextures> }) {
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
      <PlasterMaterial color={ceramic} scale={2.4} roughness={.8} bumpScale={.012} />
    </mesh>
    <mesh position={[0, .035, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[.345, .345, .065, 32]} />
      <meshStandardMaterial color="#716650" roughness={1} />
    </mesh>
    <mesh position={[0, .715, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[.41, 32]} />
      <meshStandardMaterial color="#44392a" roughness={1} />
    </mesh>
    <mesh geometry={geometries.branches} castShadow receiveShadow>
      <meshStandardMaterial color={style === 'broad' ? '#627248' : '#686142'} roughness={.83} />
    </mesh>
    <mesh geometry={geometries.foliage} castShadow receiveShadow>
      <meshPhysicalMaterial map={leafTextures.map} bumpMap={leafTextures.bump} bumpScale={.003} vertexColors side={THREE.DoubleSide} roughness={.5} clearcoat={.24} clearcoatRoughness={.38} sheen={.15} sheenColor="#a0b881" sheenRoughness={.8} />
    </mesh>
    <mesh geometry={geometries.midribs}>
      <meshStandardMaterial color="#6b8d56" roughness={.78} />
    </mesh>
  </group>;
}

export default function BotanicalPlanters() {
  const leafTextures = useMemo(createLeafTextures, []);
  useEffect(() => () => { leafTextures.map.dispose(); leafTextures.bump.dispose(); }, [leafTextures]);
  return <group>{planters.map(planter => <Planter key={planter.seed} {...planter} leafTextures={leafTextures} />)}</group>;
}
