'use client';

import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';

type SurfaceKind = 'plaster' | 'limestone' | 'metal' | 'wood';

export type SurfaceMaterialProps = {
  color?: THREE.ColorRepresentation;
  /** Number of texture tiles per world metre. World projection avoids stretched box UVs. */
  scale?: number;
  repeat?: [number, number];
  bumpScale?: number;
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
  vertexColors?: boolean;
};

type TextureSet = {
  map: THREE.DataTexture;
  bump: THREE.DataTexture;
  roughness: THREE.DataTexture;
  users: number;
  disposeTimer?: ReturnType<typeof setTimeout>;
};

const SIZE = 512;
const textures = new Map<SurfaceKind, TextureSet>();
const fract = (n: number) => n - Math.floor(n);
const smooth = (n: number) => n * n * (3 - 2 * n);
const byte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

function hash(x: number, y: number, seed: number) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/** Periodic smooth noise: all octaves meet at tile boundaries, including their slopes. */
function noise(u: number, v: number, nx: number, ny: number, seed: number) {
  const x = fract(u) * nx, y = fract(v) * ny;
  const ix = Math.floor(x), iy = Math.floor(y);
  const tx = smooth(x - ix), ty = smooth(y - iy);
  const a = hash(ix, iy, seed), b = hash((ix + 1) % nx, iy, seed);
  const c = hash(ix, (iy + 1) % ny, seed), d = hash((ix + 1) % nx, (iy + 1) % ny, seed);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

function makeTexture(data: Uint8Array, color = false) {
  const texture = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createTextures(kind: SurfaceKind): TextureSet {
  const albedo = new Uint8Array(SIZE * SIZE * 4);
  const height = new Uint8Array(SIZE * SIZE * 4);
  const roughness = new Uint8Array(SIZE * SIZE * 4);
  const seed = { plaster: 41, limestone: 83, metal: 137, wood: 211 }[kind];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE, v = y / SIZE;
      const cloud = noise(u, v, 4, 4, seed);
      const middle = noise(u, v, 16, 16, seed + 1);
      const grain = noise(u, v, 64, 64, seed + 2);
      const fine = noise(u, v, 192, 192, seed + 3);
      let c: number, h: number, r: number;

      if (kind === 'plaster') {
        // Broad overlapping trowel passes with a much quieter mineral grain.
        const trowel = noise(u + (middle - .5) * .035, v, 9, 7, seed + 4);
        c = 234 + (cloud - .5) * 9 + (trowel - .5) * 7 + (grain - .5) * 5;
        h = 128 + (trowel - .5) * 15 + (grain - .5) * 21 + (fine - .5) * 13;
        r = 232 + (trowel - .5) * 24 + (grain - .5) * 12;
      } else if (kind === 'limestone') {
        const mineral = noise(u + (cloud - .5) * .08, v + (middle - .5) * .025, 28, 28, seed + 4);
        const sediment = noise(u, v, 5, 11, seed + 5);
        c = 233 + (cloud - .5) * 13 + (sediment - .5) * 10 + (mineral - .5) * 13;
        h = 129 + (middle - .5) * 18 + (mineral - .5) * 25 + (fine - .5) * 10;
        r = 211 + (cloud - .5) * 27 + (mineral - .5) * 30;
      } else if (kind === 'metal') {
        // A fine powder coat, without regular brushed-metal stripes.
        c = 240 + (cloud - .5) * 13 + (middle - .5) * 6;
        h = 128 + (grain - .5) * 14 + (fine - .5) * 15;
        r = 220 + (cloud - .5) * 20 + (grain - .5) * 25;
      } else {
        const warp = (noise(u, v, 4, 5, seed + 4) - .5) * .06;
        const fibers = noise(u, v + warp, 7, 144, seed + 5);
        const growth = noise(u, v + warp, 3, 33, seed + 6);
        c = 224 + (cloud - .5) * 16 + (growth - .5) * 35 + (fibers - .5) * 17;
        h = 128 + (growth - .5) * 12 + (fibers - .5) * 27 + (fine - .5) * 5;
        r = 219 + (growth - .5) * 19 + (fibers - .5) * 15;
      }

      const i = (y * SIZE + x) * 4;
      // The neutral warm tint remains deliberately slight; the material colour carries the palette.
      albedo[i] = byte(c + (kind === 'limestone' ? 2 : 0));
      albedo[i + 1] = byte(c);
      albedo[i + 2] = byte(c - (kind === 'limestone' ? 4 : 1));
      height[i] = height[i + 1] = height[i + 2] = byte(h);
      roughness[i] = roughness[i + 1] = roughness[i + 2] = byte(r);
      albedo[i + 3] = height[i + 3] = roughness[i + 3] = 255;
    }
  }

  if (kind === 'limestone' || kind === 'plaster') {
    const count = kind === 'limestone' ? 1450 : 2050;
    for (let pore = 0; pore < count; pore++) {
      const cx = hash(pore, 1, seed) * SIZE, cy = hash(pore, 2, seed) * SIZE;
      const radius = kind === 'limestone' ? .5 + hash(pore, 3, seed) * 1.45 : .35 + hash(pore, 3, seed) * .65;
      for (let py = Math.floor(cy - radius); py <= Math.ceil(cy + radius); py++) {
        for (let px = Math.floor(cx - radius); px <= Math.ceil(cx + radius); px++) {
          const d = Math.hypot(px + .5 - cx, py + .5 - cy) / radius;
          if (d >= 1) continue;
          const amount = smooth(1 - d);
          const i = (((py + SIZE) % SIZE) * SIZE + (px + SIZE) % SIZE) * 4;
          for (let channel = 0; channel < 3; channel++) {
            albedo[i + channel] = byte(albedo[i + channel] - amount * (kind === 'limestone' ? 25 : 10));
            height[i + channel] = byte(height[i + channel] - amount * 74);
            roughness[i + channel] = byte(roughness[i + channel] + amount * 18);
          }
        }
      }
    }
  }

  return { map: makeTexture(albedo, true), bump: makeTexture(height), roughness: makeTexture(roughness), users: 0 };
}

function useTextures(kind: SurfaceKind) {
  const set = useMemo(() => {
    const cached = textures.get(kind);
    if (cached) return cached;
    const created = createTextures(kind);
    textures.set(kind, created);
    return created;
  }, [kind]);

  useEffect(() => {
    if (set.disposeTimer) clearTimeout(set.disposeTimer);
    set.users++;
    return () => {
      set.users--;
      // Defer disposal through Strict Mode's setup/cleanup/setup cycle and route handoffs.
      set.disposeTimer = setTimeout(() => {
        if (set.users !== 0) return;
        set.map.dispose();
        set.bump.dispose();
        set.roughness.dispose();
        if (textures.get(kind) === set) textures.delete(kind);
      }, 250);
    };
  }, [kind, set]);
  return set;
}

const projectionShader = `
varying vec3 vArchiveSurfacePosition;
varying vec3 vArchiveSurfaceNormal;
uniform float archiveSurfaceScale;
uniform vec2 archiveSurfaceRepeat;

vec4 archiveSurfaceSample(sampler2D surfaceMap) {
  vec3 weight = pow(abs(normalize(vArchiveSurfaceNormal)), vec3(5.0));
  weight /= max(dot(weight, vec3(1.0)), 0.0001);
  vec3 p = vArchiveSurfacePosition * archiveSurfaceScale;
  // Most architectural pixels are axis-aligned: avoid six redundant texture reads there.
  if (weight.x > .995) return texture2D(surfaceMap, p.yz * archiveSurfaceRepeat);
  if (weight.y > .995) return texture2D(surfaceMap, p.xz * archiveSurfaceRepeat);
  if (weight.z > .995) return texture2D(surfaceMap, p.xy * archiveSurfaceRepeat);
  return texture2D(surfaceMap, p.yz * archiveSurfaceRepeat) * weight.x
       + texture2D(surfaceMap, p.xz * archiveSurfaceRepeat) * weight.y
       + texture2D(surfaceMap, p.xy * archiveSurfaceRepeat) * weight.z;
}
`;

const defaults = {
  plaster: { color: '#e7decf', scale: .32, roughness: .94, bumpScale: .04, metalness: 0 },
  limestone: { color: '#e1d4bc', scale: .48, roughness: .63, bumpScale: .045, metalness: 0 },
  metal: { color: '#3e4743', scale: 1.6, roughness: .49, bumpScale: .009, metalness: .72 },
  wood: { color: '#bda17b', scale: .65, roughness: .65, bumpScale: .025, metalness: 0 },
} as const;

function SurfaceMaterial({ kind, color, scale, repeat, bumpScale, roughness, metalness, envMapIntensity = 1, vertexColors = false }: SurfaceMaterialProps & { kind: SurfaceKind }) {
  const maps = useTextures(kind);
  const values = defaults[kind];
  const uniforms = useMemo(() => ({
    archiveSurfaceScale: { value: values.scale as number },
    archiveSurfaceRepeat: { value: new THREE.Vector2(1, 1) },
  }), [values.scale]);
  const repeatX = repeat?.[0] ?? 1, repeatY = repeat?.[1] ?? 1;

  useEffect(() => {
    uniforms.archiveSurfaceScale.value = scale ?? values.scale;
    uniforms.archiveSurfaceRepeat.value.set(repeatX, repeatY);
  }, [uniforms, scale, values.scale, repeatX, repeatY]);

  const compile = useCallback<THREE.MeshStandardMaterial['onBeforeCompile']>((shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `varying vec3 vArchiveSurfacePosition;\nvarying vec3 vArchiveSurfaceNormal;\n${shader.vertexShader}`
      .replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
        vArchiveSurfaceNormal = inverseTransformDirection(transformedNormal, viewMatrix);`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 archivePosition = vec4(transformed, 1.0);
        #ifdef USE_BATCHING
          archivePosition = batchingMatrix * archivePosition;
        #endif
        #ifdef USE_INSTANCING
          archivePosition = instanceMatrix * archivePosition;
        #endif
        vArchiveSurfacePosition = (modelMatrix * archivePosition).xyz;`);
    shader.fragmentShader = `${projectionShader}\n${shader.fragmentShader}`
      .replace('#include <map_fragment>', 'diffuseColor *= archiveSurfaceSample(map);')
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * archiveSurfaceSample(roughnessMap).g;')
      .replace('#include <normal_fragment_maps>', `
        float archiveHeight = archiveSurfaceSample(bumpMap).r;
        vec2 archiveHeightGradient = vec2(dFdx(archiveHeight), dFdy(archiveHeight)) * bumpScale;
        normal = perturbNormalArb(-vViewPosition, normal, archiveHeightGradient, faceDirection);`);
  }, [uniforms]);

  const programKey = useCallback(() => `archive-triplanar-v2-${kind}`, [kind]);

  return <meshStandardMaterial
    color={color ?? values.color}
    map={maps.map}
    bumpMap={maps.bump}
    roughnessMap={maps.roughness}
    bumpScale={bumpScale ?? values.bumpScale}
    roughness={roughness ?? values.roughness}
    metalness={metalness ?? values.metalness}
    envMapIntensity={envMapIntensity}
    vertexColors={vertexColors}
    onBeforeCompile={compile}
    customProgramCacheKey={programKey}
  />;
}

export function PlasterMaterial(props: SurfaceMaterialProps) { return <SurfaceMaterial kind="plaster" {...props}/>; }
export function LimestoneMaterial(props: SurfaceMaterialProps) { return <SurfaceMaterial kind="limestone" {...props}/>; }
export function MetalMaterial(props: SurfaceMaterialProps) { return <SurfaceMaterial kind="metal" {...props}/>; }
export function WoodMaterial(props: SurfaceMaterialProps) { return <SurfaceMaterial kind="wood" {...props}/>; }
