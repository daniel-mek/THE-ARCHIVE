'use client';

import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LimestoneMaterial, MetalMaterial, PlasterMaterial } from './SurfaceMaterials';

type V3 = [number, number, number];

/** Individual honed slabs: a shallow bevel catches light above the recessed joint. */
function StoneFloor() {
  const geometry = useMemo(() => {
    const slabs: THREE.BufferGeometry[] = [];
    for (let row = 0; row < 17; row++) {
      for (let col = 0; col < 13; col++) {
        const slab = new RoundedBoxGeometry(2.39, .09, 2.79, 1, .006);
        slab.translate((col - 6) * 2.4 + (row % 2) * 1.2, -.052, (row - 8) * 2.8);
        const tint = .95 + ((row * 17 + col * 7) % 13) * .004;
        const colors = new Float32Array(slab.getAttribute('position').count * 3);
        for (let i = 0; i < colors.length; i += 3) {
          colors[i] = tint;
          colors[i + 1] = tint * .994;
          colors[i + 2] = tint * .982;
        }
        slab.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        slabs.push(slab);
      }
    }
    const merged = mergeGeometries(slabs)!;
    slabs.forEach(slab => slab.dispose());
    return merged;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.075, 0]} receiveShadow>
      <planeGeometry args={[34, 49]} />
      <meshStandardMaterial color="#b7ae9c" roughness={1} />
    </mesh>
    <mesh geometry={geometry} receiveShadow>
      <LimestoneMaterial color="#ddd3bd" scale={.42} bumpScale={.025} roughness={.48} vertexColors />
    </mesh>
  </>;
}

function Steel({ at, size, brass = false }: { at: V3; size: V3; brass?: boolean }) {
  return <mesh position={at} castShadow receiveShadow>
    <boxGeometry args={size} />
    <MetalMaterial color={brass ? '#a78c59' : '#343e38'} roughness={brass ? .34 : .46} metalness={.65} />
  </mesh>;
}

export default function ArchitecturalShell() {
  return <>
    <StoneFloor />
    {[-10, 10].map(x => <RoundedBox key={x} args={[.5, 6, 28]} radius={.035} smoothness={2} position={[x, 3, -3]} castShadow receiveShadow>
      <PlasterMaterial color="#d5cdbb" />
    </RoundedBox>)}
    <mesh position={[0, 3, -15]} receiveShadow castShadow>
      <boxGeometry args={[20, 6, .5]} />
      <PlasterMaterial color="#c8c0ad" />
    </mesh>

    {/* A framed stone wall gives the far end of the atrium a material focal point. */}
    <mesh position={[0, 2.95, -14.7]} receiveShadow>
      <boxGeometry args={[6.4, 5.9, .12]} />
      <meshStandardMaterial color="#85755c" roughness={.8} />
    </mesh>
    {[0, 1, 2, 3].map(row => <RoundedBox key={row} args={[6.24, 1.37, .13]} radius={.016} smoothness={2} position={[0, .85 + row * 1.4, -14.59]} castShadow receiveShadow>
      <LimestoneMaterial color="#d5c3a1" scale={.32} bumpScale={.032} roughness={.65} />
    </RoundedBox>)}

    {[-9, -3.4, 3.4, 9].map(x => <group key={x}>
      <RoundedBox args={[.6, 5.82, .75]} radius={.035} smoothness={3} position={[x, 3.08, -2]} castShadow receiveShadow>
        <PlasterMaterial color="#e1d8c5" bumpScale={.025} />
      </RoundedBox>
      <RoundedBox args={[.68, .18, .83]} radius={.018} smoothness={2} position={[x, .095, -2]} castShadow receiveShadow>
        <LimestoneMaterial color="#afa38a" roughness={.5} />
      </RoundedBox>
      <Steel at={[x, 5.7, -2]} size={[.75, .25, 1]} />
      <Steel at={[x, .2, -2]} size={[.63, .02, .78]} brass />
    </group>)}

    <mesh position={[0, 6, 1.2]} castShadow receiveShadow>
      <boxGeometry args={[20, .24, .8]} /><PlasterMaterial color="#d8ceba" />
    </mesh>
    <mesh position={[0, 6, -12]} castShadow receiveShadow>
      <boxGeometry args={[20, .35, 4]} /><PlasterMaterial color="#d8ceba" />
    </mesh>
    {[-8, -6, -4, -2, 0, 2, 4, 6, 8].map(x => <group key={x}>
      <Steel at={[x, 6.15, -4.7]} size={[.09, .18, 12]} />
      <Steel at={[x, 6.27, -4.7]} size={[.025, .04, 12]} brass />
    </group>)}
    {[-3.5, -6.5, -9.5].map(z => <Steel key={z} at={[0, 6.18, z]} size={[18, .13, .09]} />)}
    <mesh position={[0, 6.4, -4.7]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 12]} />
      <meshPhysicalMaterial color="#dbe8f0" transparent opacity={.06} side={THREE.DoubleSide} roughness={.12} metalness={.12} depthWrite={false} />
    </mesh>
    {[-9.72, 9.72].map(x => <Steel key={x} at={[x, .07, -3]} size={[.035, .14, 27.8]} />)}
  </>;
}
