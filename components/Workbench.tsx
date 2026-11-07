'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
      const grain = Math.sin((x + warp) * .19) * 4.2
        + Math.sin((x + warp * .6) * .73) * 2.3
        + Math.sin((x + warp * .4) * 1.63) * .85;
      const pores = Math.pow(Math.max(0, Math.sin(x * 2.61 + Math.sin(y * .021))), 18) * 5;
      const noise = Math.sin(x * 127.1 + y * 311.7) * .65;
      const value = grain - pores + noise;
      const offset = (y * 512 + x) * 4;
      image.data[offset] = 187 + value;
      image.data[offset + 1] = 151 + value;
      image.data[offset + 2] = 108 + value;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.anisotropy = 4;
  return texture;
}

function makeSurfaceTexture(kind:'stone'|'linoleum') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(512,512);
  const base = kind==='stone' ? [220,213,197] : [144,162,134];
  for(let y=0;y<512;y++)for(let x=0;x<512;x++) {
    const random = Math.sin(x*127.1+y*311.7)*43758.5453;
    const fine = (random-Math.floor(random)-.5)*(kind==='stone'?9:5);
    const cloud = Math.sin(x*.031+Math.sin(y*.019)*2)*Math.sin(y*.024+x*.008)*(kind==='stone'?3:1.4);
    const pore = kind==='stone'&&random-Math.floor(random)>.991 ? -20 : 0;
    const offset=(y*512+x)*4;
    for(let channel=0;channel<3;channel++) image.data[offset+channel]=base[channel]+fine+cloud+pore;
    image.data[offset+3]=255;
  }
  context.putImageData(image,0,0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(kind==='stone'?3:2,kind==='stone'?1:2);
  texture.anisotropy=4;
  return texture;
}

function makeOakStaves() {
  const parts:THREE.BufferGeometry[]=[];
  const up=new THREE.Vector3(0,1,0);
  // Individual rounded staves catch light along their sides and leave real shadowed joints.
  for(let i=0;i<96;i++) {
    const angle=i/96*Math.PI*2;
    const bottom=new THREE.Vector3(Math.sin(angle)*1.555,.18,Math.cos(angle)*1.555);
    const top=new THREE.Vector3(Math.sin(angle)*1.405,1.055,Math.cos(angle)*1.405);
    const direction=top.clone().sub(bottom);
    const stave=new THREE.CylinderGeometry(.040,.045,direction.length(),12,1);
    const shade=.91+(Math.sin(i*7.13)*.5+.5)*.09;
    const colors=new Float32Array(stave.attributes.position.count*3);
    colors.fill(shade);
    stave.setAttribute('color',new THREE.BufferAttribute(colors,3));
    stave.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,direction.normalize()));
    stave.translate(...bottom.add(top).multiplyScalar(.5).toArray());
    parts.push(stave);
  }
  const geometry=mergeGeometries(parts)!;
  parts.forEach(part=>part.dispose());
  return geometry;
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
  const stone = useMemo(()=>makeSurfaceTexture('stone'), []);
  const linoleum = useMemo(()=>makeSurfaceTexture('linoleum'), []);
  const staves = useMemo(makeOakStaves, []);
  const tableEdge = useMemo(() => new THREE.LatheGeometry([
    [0,-.09], [2.30,-.09], [2.33,-.082], [2.346,-.066], [2.35,-.04],
    [2.35,.04], [2.346,.066], [2.33,.082], [2.30,.09], [0,.09],
  ].map(([radius,height]) => new THREE.Vector2(radius,height)), 128), []);
  const pedestal = useMemo(() => new THREE.LatheGeometry([
    [0,.12], [1.515,.12], [1.515,.18], [1.365,1.055], [0,1.055],
  ].map(([radius,height]) => new THREE.Vector2(radius,height)), 96), []);
  useEffect(() => () => { oak.dispose(); stone.dispose(); linoleum.dispose(); staves.dispose(); tableEdge.dispose(); pedestal.dispose(); }, [oak,stone,linoleum,staves,tableEdge,pedestal]);
  useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame)},[]);
  return <group position={[0,0,-2]}>
  <mesh geometry={pedestal} castShadow receiveShadow><meshStandardMaterial color="#67513d" roughness={.85}/></mesh>
  <mesh geometry={staves} castShadow receiveShadow><meshStandardMaterial map={oak} bumpMap={oak} bumpScale={.006} vertexColors roughness={.64}/></mesh>
  <mesh position={[0,.07,0]} castShadow receiveShadow><cylinderGeometry args={[1.50,1.50,.11,96]}/><meshStandardMaterial color="#444940" metalness={.48} roughness={.52}/></mesh>
  <mesh position={[0,1.065,0]} castShadow receiveShadow><cylinderGeometry args={[1.98,1.98,.026,128]}/><meshStandardMaterial color="#494b40" metalness={.4} roughness={.46}/></mesh>
  <mesh geometry={tableEdge} position={[0,1.16,0]} castShadow receiveShadow onClick={e=>{if(e.delta<6)p.onApproach()}}><meshStandardMaterial map={stone} bumpMap={stone} bumpScale={.012} roughness={.69}/></mesh>
  <mesh position={[0,1.253,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[2.115,128]}/><meshStandardMaterial map={linoleum} bumpMap={linoleum} bumpScale={.008} roughness={.77}/></mesh>
  <mesh position={[0,1.254,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><ringGeometry args={[2.115,2.125,128]}/><meshStandardMaterial color="#5d6250" roughness={.8}/></mesh>
  <mesh position={[0,1.255,0]} rotation={[Math.PI/2,0,0]} receiveShadow><torusGeometry args={[2.132,.009,8,128]}/><meshStandardMaterial color="#ad9062" metalness={.78} roughness={.34}/></mesh>
  <Artifact kind={0} at={[-1.15,1.28,-.1]} label="ApplyOS" reduced={p.reduced} onSelect={p.onProject}/>
  <Artifact kind={1} at={[0,1.28,-.55]} label="THIS IS MUSIC" reduced={p.reduced} onSelect={p.onSystems}/>
  <Artifact kind={2} at={[1.15,1.28,-.1]} label="Experiments" reduced={p.reduced} onSelect={p.onExperiments}/>
  {ready&&<Html position={[0,.86,2.28]} transform scale={.5} distanceFactor={5} zIndexRange={[50,0]}><button className="workbench-label workbench-title" onClick={p.onApproach}><small>00 / The workbench</small><strong>{p.active?'Explore an object above':'Ideas taking shape'} <span>↗</span></strong></button></Html>}
</group>}
