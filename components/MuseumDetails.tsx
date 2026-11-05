'use client';
import { useEffect, useMemo } from 'react';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
export function StudioLight() {
  return <Environment resolution={128} frames={1} environmentIntensity={.65}>
    <Lightformer position={[0,8,0]} rotation={[Math.PI/2,0,0]} scale={[12,8,1]} intensity={2.5} color="#fff4dd" />
    <Lightformer position={[-8,3,1]} rotation={[0,Math.PI/2,0]} scale={[5,7,1]} intensity={1.5} color="#c6daff" />
    <Lightformer position={[8,4,-5]} rotation={[0,-Math.PI/2,0]} scale={[4,5,1]} intensity={1} color="#fff2db" />
  </Environment>;
}
export function ArchiveWall() {
  const label = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e1ded3';ctx.fillRect(0,0,1024,256);
    ctx.fillStyle='#3d443d';ctx.font='500 78px Arial';ctx.fillText('THE ARCHIVE',56,120);
    ctx.font='18px Arial';ctx.fillText('D A N I E L   M E K H A I L    /    S E L E C T E D   W O R K',60,181);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[]);
  useEffect(()=>()=>label.dispose(),[label]);
  return <group position={[0,3.1,-14.65]}>
    <RoundedBox args={[5.6,1.65,.13]} radius={.04} castShadow><meshStandardMaterial color="#b6b4a9" roughness={.6}/></RoundedBox>
    <mesh position={[0,0,.08]}><planeGeometry args={[5.4,1.35]}/><meshStandardMaterial map={label} roughness={.8}/></mesh>
    {[-2.7,2.7].map(x=><mesh key={x} position={[x,-1.55,.05]}><boxGeometry args={[.02,1,.025]}/><meshStandardMaterial color="#3f68ff" emissive="#3256ff" emissiveIntensity={.5}/></mesh>)}
  </group>;
}
export function DisplayArt({side}:{side:-1|1}) {
  return <group position={[side*9.72,2.5,-.2]} rotation={[0,-side*Math.PI/2,0]}>
    <RoundedBox args={[2.3,3.2,.12]} radius={.025} castShadow><meshStandardMaterial color="#343c36" metalness={.4} roughness={.4}/></RoundedBox>
    <mesh position={[0,0,.07]}><planeGeometry args={[2.08,2.98]}/><meshStandardMaterial color="#d5d2c7" roughness={.95}/></mesh>
    {[0,1,2,3,4].map(i=><mesh key={i} position={[(i-2)*.24,0,.12]} rotation={[0,0,-.4]}><torusGeometry args={[.45+i*.07,.018,6,48,Math.PI*1.7]}/><meshStandardMaterial color={i%2?'#1d46df':'#727b73'} metalness={.4} roughness={.4}/></mesh>)}
  </group>;
}
