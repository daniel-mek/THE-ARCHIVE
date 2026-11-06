'use client';
import { useEffect, useMemo } from 'react';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
export function StudioLight() {
  return <Environment resolution={128} frames={1} environmentIntensity={.85}>
    <Lightformer position={[0,8,0]} rotation={[Math.PI/2,0,0]} scale={[12,8,1]} intensity={2.5} color="#fff4da" />
    <Lightformer position={[-8,3,1]} rotation={[0,Math.PI/2,0]} scale={[5,7,1]} intensity={1.5} color="#d6e6c1" />
    <Lightformer position={[8,4,-5]} rotation={[0,-Math.PI/2,0]} scale={[4,5,1]} intensity={1} color="#ffd0a9" />
  </Environment>;
}
export function ArchiveWall() {
  const label = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#eee9dc';ctx.fillRect(0,0,1024,256);
    ctx.fillStyle='#49382c';ctx.font='400 78px Arial';ctx.fillText('The Archive',56,120);
    ctx.font='18px Arial';ctx.fillText('D A N I E L   M E K H A I L    /    S E L E C T E D   W O R K',60,181);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[]);
  useEffect(()=>()=>label.dispose(),[label]);
  return <group position={[0,4.5,-14.65]}>
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

export function AcrylicWings() {
  return <group>
    {[-1,1].map(side=><group key={side} position={[side*3.45,2.6,-2.1]}>
      <RoundedBox args={[.72,4.9,.85]} radius={.1} smoothness={3}>
        <meshPhysicalMaterial color={side===-1?'#a9e5cf':'#cfb7f4'} transparent opacity={.16} roughness={.28} metalness={.05} depthWrite={false}/>
      </RoundedBox>
      <mesh position={[side*.37,0,.47]}><boxGeometry args={[.018,4.4,.018]}/><meshStandardMaterial color="#c9e2ff" emissive="#89bdff" emissiveIntensity={.6}/></mesh>
    </group>)}
    {[-1,1].map(side=><mesh key={'wash'+side} position={[side*6,4,-12]}><sphereGeometry args={[.08,12,12]}/><meshBasicMaterial color="#e6f2ff"/></mesh>)}
  </group>;
}

// Low-poly foliage keeps the conservatory atmosphere lightweight and self-contained.
export function BotanicalPlanters(){return <group>
  {([[-7.7,0,1.5],[7.7,0,1.5],[-2.6,0,-11.8],[2.6,0,-11.8]] as [number,number,number][]).map((position,index)=><group key={index} position={position}>
    <mesh position={[0,.4,0]} castShadow receiveShadow><cylinderGeometry args={[.52,.4,.8,32]}/><meshStandardMaterial color={index<2?'#b6b3a2':'#8b9884'} roughness={.95}/></mesh>
    <mesh position={[0,.79,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.47,32]}/><meshStandardMaterial color="#554c36" roughness={1}/></mesh>
    {[0,1,2,3,4,5,6,7].map(i=>{const angle=i*2.4;const height=1.1+(i%4)*.35;return <group key={i} rotation={[0,angle,0]}>
      <mesh position={[.1,height/2+.7,0]} rotation={[0,0,-.15]} castShadow><cylinderGeometry args={[.013,.025,height,6]}/><meshStandardMaterial color="#647a48"/></mesh>
      <mesh position={[.35,height+.65,0]} rotation={[.3,0,-.65]} scale={[.26,.58,.065]} castShadow><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={i%2?'#66894d':'#456d41'} roughness={.75}/></mesh>
      <mesh position={[-.15,height+.25,0]} rotation={[.2,0,.7]} scale={[.2,.42,.055]} castShadow><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#7c9a58" roughness={.8}/></mesh>
    </group>})}
  </group>)}
</group>}
