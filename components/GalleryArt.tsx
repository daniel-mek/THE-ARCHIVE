'use client';

import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { LimestoneMaterial, PlasterMaterial } from './SurfaceMaterials';

function makeRibbon() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.45, -1.05, .22), new THREE.Vector3(.5, -.7, .38),
    new THREE.Vector3(-.43, -.04, .5), new THREE.Vector3(.44, .58, .29),
    new THREE.Vector3(-.12, 1.08, .22),
  ]);
  const positions: number[] = [], indices: number[] = [];
  const edge: THREE.Vector3[] = [];
  const segments = 120;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPoint(t), tangent = curve.getTangent(t).normalize();
    const across = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    across.applyAxisAngle(tangent, Math.sin(t * Math.PI * 2) * .65);
    const normal = new THREE.Vector3().crossVectors(across, tangent).normalize();
    const width = .18 + Math.sin(t * Math.PI) * .055;
    edge.push(center.clone().addScaledVector(across, width).addScaledVector(normal, .018));
    for (const [side, face] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
      const p = center.clone().addScaledVector(across, side * width).addScaledVector(normal, face * .018);
      positions.push(p.x, p.y, p.z);
    }
    if (i < segments) for (let j = 0; j < 4; j++) {
      const a = i * 4 + j, b = i * 4 + (j + 1) % 4;
      indices.push(a, b, a + 4, b, b + 4, a + 4);
    }
  }
  indices.push(0, 2, 1, 0, 3, 2);
  const end = segments * 4;
  indices.push(end, end + 1, end + 2, end, end + 2, end + 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { ribbon: geometry, edge: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), 120, .005, 5, false) };
}

function Continuum() {
  const geometry = useMemo(makeRibbon, []);
  useEffect(() => () => { geometry.ribbon.dispose(); geometry.edge.dispose(); }, [geometry]);
  return <group>
    <mesh geometry={geometry.ribbon} castShadow receiveShadow>
      <meshPhysicalMaterial color="#285eae" metalness={.64} roughness={.27} clearcoat={.35} clearcoatRoughness={.3} />
    </mesh>
    <mesh geometry={geometry.edge} castShadow><meshStandardMaterial color="#b39a65" metalness={.8} roughness={.32} /></mesh>
    {[-.87, .87].map(x => <mesh key={x} position={[x, 0, .09]}><boxGeometry args={[.008, 2.45, .012]} /><meshStandardMaterial color="#baa98a" metalness={.5} roughness={.5} /></mesh>)}
  </group>;
}

function Counterform() {
  const arches = useMemo(() => {
    return [0, 1, 2].map(i => {
      const outer = .77 - i * .17, inner = outer - .115;
      const shape = new THREE.Shape();
      shape.moveTo(-outer, -.82);
      shape.lineTo(-outer, .3);
      shape.absarc(0, .3, outer, Math.PI, 0, true);
      shape.lineTo(outer, -.26 + i * .18);
      shape.lineTo(inner, -.26 + i * .18);
      shape.lineTo(inner, .3);
      shape.absarc(0, .3, inner, 0, Math.PI, false);
      shape.lineTo(-inner, -.82);
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth: .065 + i * .025, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .012, bevelThickness: .012, curveSegments: 48 });
    });
  }, []);
  useEffect(() => () => arches.forEach(geometry => geometry.dispose()), [arches]);
  return <group rotation={[0, 0, -.08]} position={[-.04, .1, .12]}>
    {arches.map((geometry, i) => <mesh key={i} geometry={geometry} position={[0, 0, i * .035]} castShadow receiveShadow>
      <PlasterMaterial color={['#ad6248', '#c08e68', '#d6bc8d'][i]} scale={3} bumpScale={.008} roughness={.7} />
    </mesh>)}
    <mesh position={[.44, -.79, .23]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[.24, .24, .1, 64]} /><LimestoneMaterial color="#d6c5a4" scale={3} roughness={.55} bumpScale={.01} />
    </mesh>
    <RoundedBox args={[1.57, .035, .045]} radius={.012} position={[0, -1.12, .12]} castShadow>
      <meshStandardMaterial color="#ad8c52" metalness={.8} roughness={.3} />
    </RoundedBox>
  </group>;
}

function ArtworkCaption({ title, number }: { title: string; number: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#e5ddcb'; context.fillRect(0, 0, 768, 128);
    context.fillStyle = '#45473f'; context.font = '28px Arial';
    context.fillText(`${number}   /   ${title}`, 35, 55);
    context.font = '16px Arial'; context.fillStyle = '#797b6c';
    context.fillText('FORM STUDIES    /    THE ARCHIVE', 35, 91);
    const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, [title, number]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, -1.9, .09]} castShadow receiveShadow><boxGeometry args={[1.8, .3, .035]} /><meshStandardMaterial map={texture} roughness={.8} /></mesh>;
}

export default function GalleryArt({ side }: { side: -1 | 1 }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  return <group position={[side * 9.69, 2.8, -.2]} rotation={[0, -side * Math.PI / 2, 0]}>
    <RoundedBox args={[2.45, 3.35, .15]} radius={.035} castShadow receiveShadow>
      <meshStandardMaterial color="#393f37" metalness={.5} roughness={.38} />
    </RoundedBox>
    <RoundedBox args={[2.25, 3.15, .08]} radius={.015} position={[0, 0, .1]} receiveShadow>
      <PlasterMaterial color={side === -1 ? '#ded4bf' : '#bcbbaa'} scale={1.2} bumpScale={.01} roughness={.92} />
    </RoundedBox>
    {side === -1 ? <Continuum /> : <Counterform />}
    <ArtworkCaption title={side === -1 ? 'CONTINUUM' : 'COUNTERFORM'} number={side === -1 ? '01' : '02'} />
    <primitive object={target} />
    <spotLight position={[0, 2.2, 1.3]} target={target} angle={.65} penumbra={.8} intensity={9} distance={5} decay={2} color="#ffefd7" />
  </group>;
}
