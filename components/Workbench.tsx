'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

type Props = { reduced:boolean; active:boolean; onApproach:()=>void; onProject:()=>void; onSystems:()=>void; onExperiments:()=>void };

function makeOakTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(512, 512);
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      // Long, gently wavering grain with quiet pores, rather than repeated stripes.
      const warp = Math.sin(y * .012 + Math.sin(x * .015)) * 2.5;
      const grain = Math.sin((x + warp) * .19) * 2.1
        + Math.sin((x + warp * .6) * .73) * 1.5
        + Math.sin((x + warp * .4) * 1.63) * .65;
      const pores = Math.pow(Math.max(0, Math.sin(x * 2.61 + Math.sin(y * .021))), 18) * 3;
      const noise = Math.sin(x * 127.1 + y * 311.7) * .65;
      const value = grain - pores + noise;
      const offset = (y * 512 + x) * 4;
      image.data[offset] = 199 + value;
      image.data[offset + 1] = 174 + value;
      image.data[offset + 2] = 137 + value;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 1);
  texture.anisotropy = 4;
  return texture;
}

function Artifact({kind,at,label,onSelect,reduced}:{kind:number;at:[number,number,number];label:string;onSelect:()=>void;reduced:boolean}) {
  const group=useRef<THREE.Group>(null), rotor=useRef<THREE.Group>(null);
  const [hover,setHover]=useState(false);
  const [ready,setReady]=useState(false);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame)},[]);
  useFrame((_,dt)=>{
    if(group.current)group.current.position.y=reduced?(hover?.22:0):THREE.MathUtils.damp(group.current.position.y,hover?.22:0,12,Math.min(dt,.05));
    if(rotor.current&&!reduced)rotor.current.rotation.y+=Math.min(dt,.05)*.28;
  });
  return <group position={at}>
    <group ref={group} onPointerOver={e=>{e.stopPropagation();setHover(true)}} onPointerOut={()=>setHover(false)} onClick={e=>{e.stopPropagation();if(e.delta<6)onSelect()}}>
      {/* Broad invisible picking surface keeps small artifacts easy to select. */}
      <mesh position={[0,.38,0]}><boxGeometry args={[1.05,1.05,.8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
      {kind===0?<group rotation={[-.12,0,0]}>
        <RoundedBox args={[1.15,.77,.09]} radius={.055} position={[0,.57,0]} castShadow><meshStandardMaterial color="#85928c" metalness={.55} roughness={.4}/></RoundedBox>
        <mesh position={[0,.57,.05]}><planeGeometry args={[1.04,.65]}/><meshStandardMaterial color="#ecf6ff" emissive="#c5e6ff" emissiveIntensity={.18}/></mesh>
        {[0,1,2].map(i=><RoundedBox key={i} args={[.27,.32,.015]} radius={.015} position={[(i-1)*.32,.53,.066]}><meshStandardMaterial color={['#368f79','#aed9c6','#d8eade'][i]}/></RoundedBox>)}
        <RoundedBox args={[.72,.035,.44]} radius={.015} position={[0,.02,.06]} castShadow><meshStandardMaterial color="#b2b9af" metalness={.6} roughness={.42}/></RoundedBox>
        <mesh position={[0,.18,-.05]} castShadow><boxGeometry args={[.08,.33,.06]}/><meshStandardMaterial color="#b2b9af" metalness={.6} roughness={.42}/></mesh>
      </group>:kind===1?<group rotation={[0,-.2,0]}>
        {[[0,.16,0],[-.31,.48,0],[.31,.48,0],[0,.8,0]].map((v,i)=><RoundedBox key={i} position={v as [number,number,number]} args={[.27,.27,.27]} radius={.04} castShadow><meshPhysicalMaterial color={i===3?'#8663dd':'#c8b9eb'} metalness={.15} roughness={.42} clearcoat={.2}/></RoundedBox>)}
        <mesh position={[0,.48,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.022,.022,.65,12]}/><meshStandardMaterial color="#6c8cae"/></mesh>
        <mesh position={[0,.48,0]}><cylinderGeometry args={[.022,.022,.65,12]}/><meshStandardMaterial color="#6c8cae"/></mesh>
      </group>:<group ref={rotor} position={[0,.48,0]}>
        {[0,1,2].map(i=><mesh key={i} rotation={[i*.9,i*.5,.4]} castShadow><torusGeometry args={[.34,.038,16,64]}/><meshPhysicalMaterial color={i===1?'#c89452':'#dec49a'} metalness={.55} roughness={.36} clearcoat={.2}/></mesh>)}
        <mesh><sphereGeometry args={[.11,20,16]}/><meshStandardMaterial color="#e7f3ff" emissive="#8ec7ff" emissiveIntensity={.5}/></mesh>
      </group>}
    </group>
    {ready&&<Html position={[0,.04,.65]} transform rotation={[-.35,0,0]} scale={.38} distanceFactor={5} zIndexRange={[50,0]}>
      <button className={`workbench-label artifact-${kind}`} onFocus={()=>setHover(true)} onBlur={()=>setHover(false)} onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)} onClick={onSelect}><small>0{kind+1} / {kind===0?'Project study':kind===1?'Team project':'Future collection'}</small><strong>{label} <span>↗</span></strong></button>
    </Html>}
  </group>;
}
export default function Workbench(p:Props){
  const [ready,setReady]=useState(false);
  const oak = useMemo(makeOakTexture, []);
  const tableEdge = useMemo(() => new THREE.LatheGeometry([
    [0,-.09], [2.30,-.09], [2.33,-.082], [2.346,-.066], [2.35,-.04],
    [2.35,.04], [2.346,.066], [2.33,.082], [2.30,.09], [0,.09],
  ].map(([radius,height]) => new THREE.Vector2(radius,height)), 128), []);
  const pedestal = useMemo(() => new THREE.LatheGeometry([
    [0,.07], [1.53,.07], [1.575,.085], [1.59,.12],
    [1.59,.17], [1.43,1.025], [1.415,1.06], [1.385,1.08], [0,1.08],
  ].map(([radius,height]) => new THREE.Vector2(radius,height)), 96), []);
  useEffect(() => () => { oak.dispose(); tableEdge.dispose(); pedestal.dispose(); }, [oak,tableEdge,pedestal]);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame)},[]);
  return <group position={[0,0,-2]}>
  <mesh geometry={pedestal} castShadow receiveShadow><meshStandardMaterial map={oak} bumpMap={oak} bumpScale={.008} roughness={.72}/></mesh>
  <mesh position={[0,.045,0]} castShadow receiveShadow><cylinderGeometry args={[1.52,1.52,.07,96]}/><meshStandardMaterial color="#6b7366" metalness={.35} roughness={.65}/></mesh>
  <mesh geometry={tableEdge} position={[0,1.16,0]} castShadow receiveShadow onClick={e=>{if(e.delta<6)p.onApproach()}}><meshStandardMaterial color="#e7e0cf" roughness={.6}/></mesh>
  <mesh position={[0,1.254,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[2.12,128]}/><meshPhysicalMaterial color="#b9c6b3" metalness={.02} roughness={.48} clearcoat={.28} clearcoatRoughness={.48}/></mesh>
  <mesh position={[0,1.255,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><ringGeometry args={[2.125,2.145,128]}/><meshStandardMaterial color="#b8a783" metalness={.55} roughness={.46}/></mesh>
  <Artifact kind={0} at={[-1.15,1.28,-.1]} label="ApplyOS" reduced={p.reduced} onSelect={p.onProject}/>
  <Artifact kind={1} at={[0,1.28,-.55]} label="THIS IS MUSIC" reduced={p.reduced} onSelect={p.onSystems}/>
  <Artifact kind={2} at={[1.15,1.28,-.1]} label="Experiments" reduced={p.reduced} onSelect={p.onExperiments}/>
  {ready&&<Html position={[0,.86,2.28]} transform scale={.5} distanceFactor={5} zIndexRange={[50,0]}><button className="workbench-label workbench-title" onClick={p.onApproach}><small>00 / The workbench</small><strong>{p.active?'Explore an object above':'Ideas taking shape'} <span>↗</span></strong></button></Html>}
</group>}
