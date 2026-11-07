'use client';
import { memo, useMemo } from 'react';
import { ContactShadows, Environment, Lightformer, SoftShadows, Sky } from '@react-three/drei';
import * as THREE from 'three';

/** One sun, cool sky fill, and warm floor bounce give the room a readable light direction. */
function Daylight() {
  const target=useMemo(()=>{const object=new THREE.Object3D();object.position.set(0,0,-5);return object},[]);
  return <>
    <color attach="background" args={['#e5e9e4']}/>
    <Sky distance={450000} sunPosition={[-8,15,8]} turbidity={5} rayleigh={.35} mieCoefficient={.003} mieDirectionalG={.8}/>
    <fog attach="fog" args={['#e5e9e4',32,75]}/>
    <ambientLight intensity={.08}/>
    <hemisphereLight args={['#e3edff','#d9c3a2',.55]}/>
    <Environment resolution={256} frames={1} environmentIntensity={.7}>
      <Lightformer position={[0,12,-5]} rotation={[Math.PI/2,0,0]} scale={[18,14,1]} intensity={1.8} color="#edf4ff"/>
      <Lightformer position={[0,-3,1]} rotation={[-Math.PI/2,0,0]} scale={[15,12,1]} intensity={.45} color="#ead7b8"/>
      <Lightformer position={[-12,4,0]} rotation={[0,Math.PI/2,0]} scale={[7,9,1]} intensity={.6} color="#f8f2e6"/>
      <Lightformer position={[7,4,-3]} rotation={[0,-Math.PI/2,0]} scale={[2,5,1]} intensity={2.2} color="#fff4df"/>
    </Environment>
    <primitive object={target}/>
    <directionalLight position={[-8,15,3]} target={target} intensity={3.5} color="#fff0d5" castShadow
      shadow-mapSize={[4096,4096]} shadow-camera-near={1} shadow-camera-far={45}
      shadow-camera-left={-17} shadow-camera-right={17} shadow-camera-top={16} shadow-camera-bottom={-16}
      shadow-bias={-.00012} shadow-normalBias={.018}/>
    <SoftShadows size={22} samples={16} focus={0}/>
    <ContactShadows position={[0,.018,-3]} opacity={.28} scale={28} far={.9} blur={2.6} resolution={512} frames={1} color="#493f30"/>
  </>;
}

// Keep the one-frame floor occlusion capture stable across gallery navigation.
export default memo(Daylight);
