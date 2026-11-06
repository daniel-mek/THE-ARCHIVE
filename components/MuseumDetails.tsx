'use client';
import { useEffect, useMemo } from 'react';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
export function StudioLight() {
  return <Environment resolution={128} frames={1} environmentIntensity={.85}>
    <Lightformer position={[0,8,0]} rotation={[Math.PI/2,0,0]} scale={[12,8,1]} intensity={2.5} color="#f3f8ff" />
    <Lightformer position={[-8,3,1]} rotation={[0,Math.PI/2,0]} scale={[5,7,1]} intensity={1.5} color="#c6daff" />
    <Lightformer position={[8,4,-5]} rotation={[0,-Math.PI/2,0]} scale={[4,5,1]} intensity={1} color="#dee9ff" />
  </Environment>;
}
export function ArchiveWall() {
  const label = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#f3f6fb';ctx.fillRect(0,0,1024,256);
    ctx.fillStyle='#526782';ctx.font='400 78px Arial';ctx.fillText('The Archive',56,120);
    ctx.font='18px Arial';ctx.fillText('D A N I E L   M E K H A I L    /    S E L E C T E D   W O R K',60,181);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[]);
  useEffect(()=>()=>label.dispose(),[label]);
  return <group position={[0,4.5,-14.65]}>
    <RoundedBox args={[5.6,1.65,.13]} radius={.04} castShadow><meshStandardMaterial color="#e2eaf6" roughness={.6}/></RoundedBox>
    <mesh position={[0,0,.08]}><planeGeometry args={[5.4,1.35]}/><meshStandardMaterial map={label} roughness={.8}/></mesh>
    {[-2.7,2.7].map(x=><mesh key={x} position={[x,-1.55,.05]}><boxGeometry args={[.02,1,.025]}/><meshStandardMaterial color="#3f68ff" emissive="#3256ff" emissiveIntensity={.5}/></mesh>)}
  </group>;
}
export function DisplayArt({side}:{side:-1|1}) {
  return <group position={[side*9.72,2.5,-.2]} rotation={[0,-side*Math.PI/2,0]}>
    <RoundedBox args={[2.3,3.2,.12]} radius={.025} castShadow><meshStandardMaterial color="#b8c9e0" metalness={.4} roughness={.4}/></RoundedBox>
    <mesh position={[0,0,.07]}><planeGeometry args={[2.08,2.98]}/><meshStandardMaterial color="#eef4fc" roughness={.95}/></mesh>
    {[0,1,2,3,4].map(i=><mesh key={i} position={[(i-2)*.24,0,.12]} rotation={[0,0,-.4]}><torusGeometry args={[.45+i*.07,.018,6,48,Math.PI*1.7]}/><meshStandardMaterial color={i%2?'#168be8':'#b1a5ed'} metalness={.4} roughness={.4}/></mesh>)}
  </group>;
}

// Original folded ribbon geometry: soft color and depth without a downloaded model.
export function FluentBloom() {
  const geometry=useMemo(()=>{
    const g=new THREE.BufferGeometry();const positions:number[]=[];const indices:number[]=[];
    const steps=112, rows=12;
    for(let i=0;i<=steps;i++)for(let j=0;j<=rows;j++){
      const u=i/steps*Math.PI*2,v=j/rows-.5;
      const radius=1.5+v*.8+.18*Math.sin(u*3);
      positions.push(radius*Math.cos(u),radius*Math.sin(u),.42*Math.sin(u*2)+v*.55*Math.cos(u*3));
    }
    for(let i=0;i<steps;i++)for(let j=0;j<rows;j++){
      const a=i*(rows+1)+j,b=a+rows+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group position={[0,3,-8.6]} rotation={[.2,-.2,.1]}>
    {['#4bb7f5','#638aef','#b6b3f4'].map((color,i)=><mesh key={color} geometry={geometry} rotation={[i*.43,i*.45,i*.65]} scale={1-i*.13}>
      <meshPhysicalMaterial color={color} metalness={.12} roughness={.29} clearcoat={.8} side={THREE.DoubleSide}/>
    </mesh>)}
  </group>;
}
export function AcrylicWings() {
  return <group>
    {[-1,1].map(side=><group key={side} position={[side*3.45,2.6,-2.1]}>
      <RoundedBox args={[.72,4.9,.85]} radius={.1} smoothness={3}>
        <meshPhysicalMaterial color="#bbd9ff" transparent opacity={.16} roughness={.28} metalness={.05} depthWrite={false}/>
      </RoundedBox>
      <mesh position={[side*.37,0,.47]}><boxGeometry args={[.018,4.4,.018]}/><meshStandardMaterial color="#c9e2ff" emissive="#89bdff" emissiveIntensity={.6}/></mesh>
    </group>)}
    {[-1,1].map(side=><mesh key={'wash'+side} position={[side*6,4,-12]}><sphereGeometry args={[.08,12,12]}/><meshBasicMaterial color="#e6f2ff"/></mesh>)}
  </group>;
}
