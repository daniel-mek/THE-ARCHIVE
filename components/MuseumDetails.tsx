'use client';
import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
export function ArchiveWall() {
  const label = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#eee9dc';ctx.fillRect(0,0,1024,256);
    ctx.fillStyle='#49382c';ctx.font='400 78px Arial';ctx.fillText('The Archive',56,120);
    ctx.font='18px Arial';ctx.fillText('D A N I E L   M E K H A I L    /    S E L E C T E D   W O R K',60,181);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[]);
  useEffect(()=>()=>label.dispose(),[label]);
  return <group position={[0,4.5,-14.42]}>
    <RoundedBox args={[5.6,1.65,.13]} radius={.04} castShadow><meshStandardMaterial color="#9b9e8a" roughness={.6}/></RoundedBox>
    <mesh position={[0,0,.08]}><planeGeometry args={[5.4,1.35]}/><meshStandardMaterial map={label} roughness={.8}/></mesh>
    {[-2.7,2.7].map(x=><mesh key={x} position={[x,-1.55,.05]}><boxGeometry args={[.02,1,.025]}/><meshStandardMaterial color="#dbab64" emissive="#d69a52" emissiveIntensity={.5}/></mesh>)}
  </group>;
}
export function DisplayArt({side}:{side:-1|1}) {
  return <group position={[side*9.72,2.5,-.2]} rotation={[0,-side*Math.PI/2,0]}>
    <RoundedBox args={[2.3,3.2,.12]} radius={.025} castShadow><meshStandardMaterial color="#4c5b4c" metalness={.4} roughness={.4}/></RoundedBox>
    <mesh position={[0,0,.07]}><planeGeometry args={[2.08,2.98]}/><meshStandardMaterial color={side===-1?'#8bb29b':'#dca77e'} roughness={.95}/></mesh>
    {[0,1,2,3,4].map(i=><mesh key={i} position={[(i-2)*.24,0,.12]} rotation={[0,0,-.4]}><torusGeometry args={[.45+i*.07,.018,6,48,Math.PI*1.7]}/><meshStandardMaterial color={side===-1?(i%2?'#359e82':'#d2a76b'):(i%2?'#9470d2':'#dfae85')} metalness={.4} roughness={.4}/></mesh>)}
  </group>;
}
