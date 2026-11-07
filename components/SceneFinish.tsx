'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

type SceneObject = THREE.Object3D & {
  isMesh?: boolean;
  isPoints?: boolean;
  isLine?: boolean;
  isLine2?: boolean;
  isSky?: boolean;
  material?: THREE.Material | THREE.Material[];
};

function isOpaqueSurface(material: THREE.Material) {
  const surface = material as THREE.MeshPhysicalMaterial;
  return material.visible && material.depthWrite && material.opacity >= .95 &&
    !(surface.transmission > 0) && material.name !== 'SkyShader';
}

/** Keep invisible interaction volumes and glazing out of the depth/normal image. */
class ArchitecturalAO extends SSAOPass {
  private hidden: THREE.Object3D[] = [];
  private clearColor = new THREE.Color();

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    super(scene, camera, 1, 1, 16);
    this.kernelRadius = .85;
    // SSAO compares depth normalized by the camera range, not world-space metres.
    const perspective = camera as THREE.PerspectiveCamera;
    const depthRange = perspective.far - perspective.near;
    this.minDistance = .018 / depthRange;
    this.maxDistance = 1.4 / depthRange;
    this.ssaoMaterial.uniforms.archiveStrength = { value: .64 };
    this.ssaoMaterial.fragmentShader = 'uniform float archiveStrength;\n' +
      this.ssaoMaterial.fragmentShader.replace('1.0 - occlusion', '1.0 - occlusion * archiveStrength');
  }

  // These internal hooks are provided by the pinned Three r180 SSAOPass.
  _overrideVisibility() {
    this.scene.traverse((object: SceneObject) => {
      if (!object.visible) return;
      const materials = object.material
        ? (Array.isArray(object.material) ? object.material : [object.material])
        : [];
      if (object.isPoints || object.isLine || object.isLine2 || object.isSky ||
        object.userData.excludeFromAO ||
        (object.isMesh && materials.length > 0 && !materials.some(isOpaqueSurface))) {
        this.hidden.push(object);
        object.visible = false;
      }
    });
  }

  _restoreVisibility() {
    for (const object of this.hidden) object.visible = true;
    this.hidden.length = 0;
  }

  _renderOverride(
    renderer: THREE.WebGLRenderer,
    material: THREE.Material,
    target: THREE.WebGLRenderTarget,
    clearColor?: THREE.ColorRepresentation,
    clearAlpha?: number,
  ) {
    const override = this.scene.overrideMaterial;
    const previousTarget = renderer.getRenderTarget();
    const autoClear = renderer.autoClear;
    const previousAlpha = renderer.getClearAlpha();
    const shadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const shadowNeedsUpdate = renderer.shadowMap.needsUpdate;
    renderer.getClearColor(this.clearColor);
    try {
      // The beauty render already updates shadows. A normals pass must not overwrite them.
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = false;
      renderer.autoClear = false;
      renderer.setRenderTarget(target);
      if (clearColor !== undefined) {
        renderer.setClearColor(clearColor, clearAlpha ?? 1);
        renderer.clear();
      }
      this.scene.overrideMaterial = material;
      renderer.render(this.scene, this.camera);
    } finally {
      this.scene.overrideMaterial = override;
      renderer.shadowMap.autoUpdate = shadowAutoUpdate;
      renderer.shadowMap.needsUpdate = shadowNeedsUpdate;
      renderer.autoClear = autoClear;
      renderer.setClearColor(this.clearColor, previousAlpha);
      renderer.setRenderTarget(previousTarget);
    }
  }

  override render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean,
  ) {
    try {
      super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    } finally {
      this._restoreVisibility();
    }
  }

  override setSize(width: number, height: number) {
    const scale = Math.min(.65, 1152 / Math.max(width, height));
    super.setSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  }

  override dispose() {
    this._restoreVisibility();
    // r180's own dispose omits these two owned GPU resources.
    this.ssaoMaterial.dispose();
    this.noiseTexture.dispose();
    super.dispose();
  }
}

type Pipeline = { composer: EffectComposer; ao: ArchitecturalAO };

/** Local contact depth without blooms, vignettes, or a second colour grade. */
export default function SceneFinish() {
  const { gl, scene, camera, size } = useThree();
  const pipeline = useRef<Pipeline | null>(null);

  useEffect(() => {
    // A multisampled beauty target preserves the skylight rails and foliage edges.
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: Math.min(4, gl.capabilities.maxSamples),
    });
    const composer = new EffectComposer(gl, target);
    const beauty = new RenderPass(scene, camera);
    const ao = new ArchitecturalAO(scene, camera);
    const output = new OutputPass();
    composer.addPass(beauty);
    composer.addPass(ao);
    composer.addPass(output);
    pipeline.current = { composer, ao };
    return () => {
      pipeline.current = null;
      beauty.dispose();
      ao.dispose();
      output.dispose();
      composer.dispose();
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    const current = pipeline.current;
    if (!current) return;
    const ratio = Math.min(gl.getPixelRatio(), 1.5, 2560 / Math.max(size.width, size.height));
    current.composer.setPixelRatio(ratio);
    current.composer.setSize(size.width, size.height);
    current.ao.enabled = size.width >= 650;
  }, [gl, scene, camera, size.width, size.height]);

  useFrame((state, delta) => {
    if (pipeline.current) pipeline.current.composer.render(delta);
    else state.gl.render(state.scene, state.camera);
  }, 1);

  return null;
}
