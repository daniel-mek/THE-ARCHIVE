'use client';
import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

type Props = { reduced:boolean; active:boolean; onApproach:()=>void; onProject:()=>void; onSystems:()=>void; onExperiments:()=>void };
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
        <RoundedBox args={[1.15,.77,.09]} radius={.055} position={[0,.57,0]} castShadow><meshStandardMaterial color="#697d96" metalness={.65} roughness={.26}/></RoundedBox>
        <mesh position={[0,.57,.05]}><planeGeometry args={[1.04,.65]}/><meshStandardMaterial color="#ecf6ff" emissive="#c5e6ff" emissiveIntensity={.18}/></mesh>
        {[0,1,2].map(i=><RoundedBox key={i} args={[.27,.32,.015]} radius={.015} position={[(i-1)*.32,.53,.066]}><meshStandardMaterial color={['#168be8','#bdd7f0','#cfdcf0'][i]}/></RoundedBox>)}
        <RoundedBox args={[.72,.035,.44]} radius={.015} position={[0,.02,.06]}><meshStandardMaterial color="#9eb2c9" metalness={.7} roughness={.3}/></RoundedBox>
        <mesh position={[0,.18,-.05]}><boxGeometry args={[.08,.33,.06]}/><meshStandardMaterial color="#9eb2c9" metalness={.7} roughness={.3}/></mesh>
      </group>:kind===1?<group rotation={[0,-.2,0]}>
        {[[0,.16,0],[-.31,.48,0],[.31,.48,0],[0,.8,0]].map((v,i)=><RoundedBox key={i} position={v as [number,number,number]} args={[.27,.27,.27]} radius={.04} castShadow><meshPhysicalMaterial color={i===3?'#168be8':'#a9c7e7'} metalness={.25} roughness={.25} clearcoat={1}/></RoundedBox>)}
        <mesh position={[0,.48,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.022,.022,.65,12]}/><meshStandardMaterial color="#6c8cae"/></mesh>
        <mesh position={[0,.48,0]}><cylinderGeometry args={[.022,.022,.65,12]}/><meshStandardMaterial color="#6c8cae"/></mesh>
      </group>:<group ref={rotor} position={[0,.48,0]}>
        {[0,1,2].map(i=><mesh key={i} rotation={[i*.9,i*.5,.4]} castShadow><torusGeometry args={[.34,.038,12,48]}/><meshPhysicalMaterial color={i===1?'#168be8':'#b8c2e8'} metalness={.4} roughness={.23} clearcoat={1}/></mesh>)}
        <mesh><sphereGeometry args={[.11,20,16]}/><meshStandardMaterial color="#e7f3ff" emissive="#8ec7ff" emissiveIntensity={.5}/></mesh>
      </group>}
    </group>
    {ready&&<Html position={[0,.04,.65]} transform rotation={[-.35,0,0]} scale={.38} distanceFactor={5} zIndexRange={[50,0]}>
      <button className="workbench-label" onFocus={()=>setHover(true)} onBlur={()=>setHover(false)} onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)} onClick={onSelect}><small>0{kind+1} / {kind===0?'Project study':kind===1?'Team project':'Future collection'}</small><strong>{label} <span>↗</span></strong></button>
    </Html>}
  </group>;
}
export default function Workbench(p:Props){
  const [ready,setReady]=useState(false);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame)},[]);
  return <group position={[0,0,-2]}>
  <mesh position={[0,.55,0]} castShadow receiveShadow><cylinderGeometry args={[1.45,1.65,1.1,80]}/><meshStandardMaterial color="#d7e0ec" roughness={.55}/></mesh>
  <mesh position={[0,.12,0]}><cylinderGeometry args={[1.66,1.66,.08,80]}/><meshStandardMaterial color="#859bb4" metalness={.7} roughness={.3}/></mesh>
  <mesh position={[0,1.16,0]} castShadow receiveShadow onClick={e=>{if(e.delta<6)p.onApproach()}}><cylinderGeometry args={[2.35,2.35,.18,96]}/><meshPhysicalMaterial color="#f2f5fb" roughness={.36} clearcoat={.35}/></mesh>
  <mesh position={[0,1.258,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[2.12,96]}/><meshPhysicalMaterial color="#c5def5" metalness={.2} roughness={.27} clearcoat={1}/></mesh>
  <mesh position={[0,1.265,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.13,2.155,96]}/><meshStandardMaterial color="#c7e8ff" emissive="#4ca9ee" emissiveIntensity={.6}/></mesh>
  <Artifact kind={0} at={[-1.15,1.28,-.1]} label="JobScout" reduced={p.reduced} onSelect={p.onProject}/>
  <Artifact kind={1} at={[0,1.28,-.55]} label="THIS IS MUSIC" reduced={p.reduced} onSelect={p.onSystems}/>
  <Artifact kind={2} at={[1.15,1.28,-.1]} label="Experiments" reduced={p.reduced} onSelect={p.onExperiments}/>
  {ready&&<Html position={[0,.86,2.28]} transform scale={.5} distanceFactor={5} zIndexRange={[50,0]}><button className="workbench-label workbench-title" onClick={p.onApproach}><small>00 / The workbench</small><strong>{p.active?'Explore an object above':'Ideas taking shape'} <span>↗</span></strong></button></Html>}
</group>}
