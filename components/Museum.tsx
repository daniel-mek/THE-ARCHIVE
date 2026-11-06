'use client';
import { Canvas } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import CameraRig from './CameraRig';
import Workbench from './Workbench';
import { StudioLight, ArchiveWall, DisplayArt, AcrylicWings } from './MuseumDetails';
import { clamp, dragOffset, wheelDistance, type Exploration } from '../lib/camera-motion';

type Props = { room:string; reduced:boolean; onNavigate:(room:string)=>void; onInspect:()=>void; onProject:()=>void; onCapstone:()=>void; onDirectory:()=>void; onAbout:()=>void; onFail:()=>void };
type V3=[number,number,number];
const blue='#168be8', stone='#e4e9ef';
function Box({at,size,color=stone,rotation=[0,0,0]}:{at:V3;size:V3;color?:string;rotation?:V3}) {return <mesh position={at} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.68}/></mesh>}
function useStone(){const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;let seed=341;for(let y=0;y<256;y++)for(let x=0;x<256;x++){seed=(seed*16807)%2147483647;const n=226+seed%5;ctx.fillStyle=`rgb(${n-2},${n},${n+2})`;ctx.fillRect(x,y,1,1)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(16,16);t.anisotropy=8;t.colorSpace=THREE.SRGBColorSpace;return t},[]);useEffect(()=>()=>texture.dispose(),[texture]);return texture}
function Sign({at,children,onClick,kind='small',rotation=[0,0,0]}:{at:V3;children:React.ReactNode;onClick:()=>void;kind?:string;rotation?:V3}){const [ready,setReady]=useState(false);useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame)},[]);if(!ready)return null;return <Html position={at} rotation={rotation} transform scale={kind==='welcome'?.65:kind==='plaque'?.5:kind==='screen'?.52:kind==='door'?.75:.65} distanceFactor={5} zIndexRange={[50,0]}><button className={`spatial-sign ${kind}`} onClick={e=>{e.stopPropagation();onClick()}}>{children}</button></Html>}
function Lamp({at,lit}:{at:V3;lit:boolean}) {
  const target=useMemo(()=>{const o=new THREE.Object3D();o.position.set(0,-5,0);return o},[]);
  return <group position={at}>
    <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.14,.28,16]}/><meshStandardMaterial color="#8e9eb2" metalness={.65} roughness={.3}/></mesh>
    <mesh position={[0,0,.145]}><circleGeometry args={[.1,16]}/><meshStandardMaterial color="#f3f7ff" emissive="#f3f7ff" emissiveIntensity={1.5}/></mesh>
    {lit&&<><primitive object={target}/><spotLight position={[0,-.2,0]} target={target} angle={.7} penumbra={1} intensity={24} distance={11} color="#f3f7ff"/></>}
  </group>;
}
function Bench({at,rotation=0}:{at:V3;rotation?:number}){return <group position={at} rotation={[0,rotation,0]}><RoundedBox args={[3,.2,.8]} radius={.06} position={[0,.65,0]} castShadow receiveShadow><meshStandardMaterial color="#c4d1e2" roughness={.8}/></RoundedBox>{[-1.1,1.1].map(x=><Box key={x} at={[x,.3,0]} size={[.12,.6,.6]} color="#a9b8cc"/>)}{[-.22,0,.22].map(z=><Box key={z} at={[0,.76,z]} size={[2.9,.015,.012]} color="#acbbcf"/>)}</group>}
function Gallery({side,p}:{side:-1|1;p:Props}){const x=side*6;const isJob=side===-1;return <group><Box at={[x-2.2,3,-9]} size={[.35,6,11]}/><Box at={[x+2.2,3,-9]} size={[.35,6,11]}/><Box at={[x,3,-14]} size={[4.7,6,.4]} color="#d1ddeb"/><Box at={[x,5.6,-9]} size={[4.6,.3,10]}/><Box at={[x,4.7,-4.5]} size={[4.5,.7,.5]} color="#dae4ef"/><Box at={[x,4.24,-4.2]} size={[4.2,.04,.06]} color={blue}/><Sign at={[x,3.6,-4.18]} onClick={()=>p.onNavigate(isJob?'jobscout':'systems')} kind="door"><small>{isJob?'01 · Software & product':'02 · Systems & experiments'}</small><strong>{isJob?'JobScout':'Capstone'} <span>↗</span></strong></Sign>{isJob?<group position={[x,1.3,-9.7]} onClick={e=>{if(e.delta<6)p.onProject()}}><Box at={[0,-.8,0]} size={[2.8,.9,1.4]} color="#e3ebf4"/><Box at={[0,.75,0]} size={[3.2,2.1,.15]} color="#56657a"/><Box at={[0,-.2,.25]} size={[.2,.5,.3]} color="#a7b5c8"/><Sign at={[0,.75,.1]} onClick={p.onProject} kind="screen"><small>J / JOBSCOUT</small><strong>Your next chapter,<br/>a little clearer.</strong><span>Saved opportunities <b>03</b></span><span>Applications in motion <b>02</b></span><em>Inspect project ↗</em></Sign></group>:<group position={[x,1.6,-10]}><mesh rotation={[.4,.4,.2]}><icosahedronGeometry args={[1.1,0]}/><meshStandardMaterial color={blue} wireframe emissive={blue} emissiveIntensity={.4}/></mesh><Box at={[0,-1.1,0]} size={[2,.5,2]} color="#dde7f1"/><Sign at={[0,-.3,1.2]} onClick={p.onCapstone}><small>EXHIBIT 002 / TEAM PROJECT</small><strong>Capstone — Group 03 ↗</strong></Sign></group>}<pointLight position={[x,3,-10]} intensity={15} color={isJob?'#d8efff':'#c0c8ff'} distance={9}/><Bench at={[x,0,-6.5]}/><Sign at={[x-1.15,.9,-8]} onClick={()=>p.onNavigate('atrium')} kind="return"><span>← Return to atrium</span></Sign></group>}
function Scene(p:Props&{explore:React.RefObject<Exploration>}){const texture=useStone();return <><color attach="background" args={['#e7eff9']}/><fog attach="fog" args={['#e8eef8',25,58]}/><ambientLight intensity={.5}/><hemisphereLight args={['#e8efff','#a6b8cf',.8]}/><StudioLight/><ArchiveWall/><AcrylicWings/><DisplayArt side={-1}/><DisplayArt side={1}/><directionalLight position={[-5,11,5]} intensity={1.9} color="#f5f8ff" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-bias={-.0003} shadow-normalBias={.035} shadow-radius={4}/><CameraRig room={p.room} reduced={p.reduced} explore={p.explore}/><mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[34,45]}/><meshStandardMaterial color="#ffffff" map={texture} roughness={.3} metalness={.12}/></mesh>{Array.from({length:13},(_,i)=>i*2-12).map(n=><group key={n}><Box at={[n,.008,-2]} size={[.014,.01,36]} color="#cfd8e2"/><Box at={[0,.008,n]} size={[26,.01,.014]} color="#cfd8e2"/></group>)}<Box at={[-10,3,-3]} size={[.5,6,28]}/><Box at={[10,3,-3]} size={[.5,6,28]}/><Box at={[0,3,-15]} size={[20,6,.5]}/>{[-9,-3.4,3.4,9].map(x=><group key={x}><mesh position={[x,3,-2]} castShadow receiveShadow><boxGeometry args={[.6,6,.75]}/><meshStandardMaterial map={texture} roughness={.9}/></mesh><Box at={[x,5.7,-2]} size={[.75,.25,1]} color="#bac8d8"/></group>)}<Box at={[0,6,-1]} size={[20,.35,3]}/><Box at={[0,6,-12]} size={[20,.35,4]}/>{[-8,-6,-4,-2,0,2,4,6,8].map(x=><group key={x}><Box at={[x,6.15,-5]} size={[.12,.25,11]} color="#a3b2c4"/><Box at={[x,6.32,-5]} size={[.04,.08,11]} color="#f1f5fb"/></group>)}<mesh position={[0,6.4,-5]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[18,10]}/><meshStandardMaterial color="#d4e5e5" transparent opacity={.19} side={THREE.DoubleSide} roughness={.2}/></mesh><Workbench reduced={p.reduced} active={p.room==='workbench'} onApproach={()=>p.onNavigate('workbench')} onProject={()=>{p.onNavigate('workbench');p.onProject()}} onSystems={()=>{p.onNavigate('workbench');p.onCapstone()}} onExperiments={p.onInspect}/><Gallery side={-1} p={p}/><Gallery side={1} p={p}/><Bench at={[-3.6,0,2.5]} rotation={Math.PI/2}/><Bench at={[4.8,0,2.8]}/>
{/* Suspended halo, mezzanine rails and gallery track lighting. */}
<mesh position={[0,4.9,-2]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.55,.025,6,80]}/><meshStandardMaterial color="#eff6ff" emissive="#e0eeff" emissiveIntensity={2}/></mesh>{[-2.1,2.1].map(x=><Box key={x} at={[x,5.5,-2]} size={[.018,1.2,.018]} color="#a2b3c8"/>)}{[-8.8,8.8].map(x=><group key={x}><Box at={[x,3.8,-7]} size={[1.6,.2,15]} color="#c0cddd"/><Box at={[x,4.7,-7]} size={[.035,.035,15]} color="#9fadc0"/>{[-13,-10,-7,-4,-1].map(z=><Box key={z} at={[x,4.25,z]} size={[.035,.9,.035]} color="#9fadc0"/>)}</group>)}{[-6,0,6].map(x=><group key={x}><Box at={[x,5.5,-6]} size={[.06,.08,12]} color="#a1b3c9"/>{[-10,-5,0].map(z=><Lamp key={z} at={[x,5.35,z]} lit={z===-5}/>)}</group>)}
{/* In-world information stands, not a screen-space menu. */}
<group position={[3.4,0,3.5]} rotation={[0,-.25,0]}><Box at={[0,.6,0]} size={[.65,1.2,.65]} color="#bcccdc"/><Box at={[0,1.25,0]} size={[1.45,.12,.7]} color="#f0f5fb"/><Sign at={[0,1.55,.08]} onClick={p.onDirectory} kind="plaque"><small>Visitor services</small><strong>Find your way ↗</strong><span>Directory · Direct access · Motion</span></Sign></group><group position={[-3.5,0,3]} rotation={[0,.25,0]}><Box at={[0,.7,0]} size={[.8,1.4,.65]} color="#bcccdc"/><Sign at={[0,1.4,.35]} onClick={p.onAbout} kind="plaque"><small>Behind the collection</small><strong>Daniel Mekhail ↗</strong><span>Software / Systems / Curiosity</span></Sign></group>{p.room==='entrance'&&<Sign at={[0,2.5,3.8]} onClick={()=>p.onNavigate('atrium')} kind="welcome"><small>Daniel Mekhail · Digital museum</small><strong>The Archive<span className="welcome-period">.</span></strong><p>Step inside. Follow your curiosity.</p><em>Enter the collection ↗</em><span className="instructions">Drag to look around · Scroll to move closer</span></Sign>}{(p.room==='atrium'||p.room==='workbench')&&<Sign at={[-1,.8,4]} onClick={()=>p.onNavigate('entrance')} kind="return"><span>← Entrance</span></Sign>}
{/* Blue navigation inlays lead from the atrium into each actual gallery. */}
{[-1,1].map(side=><group key={side}><Box at={[side*4,.025,-3.5]} size={[3,.02,.035]} color={blue}/><Box at={[side*5.5,.025,-5.5]} size={[.035,.02,4]} color={blue}/></group>)}<pointLight position={[0,3.5,-2]} intensity={8} distance={8} color="#a5d7ff"/>
</>}
export default function Museum(p:Props) {
  const explore=useRef<Exploration>({yaw:0,pitch:0,dolly:0,dragging:false});
  const drag=useRef<{x:number;y:number;id:number}|null>(null);
  const [dragging,setDragging]=useState(false);
  useEffect(()=>{explore.current={yaw:0,pitch:0,dolly:0,dragging:false};drag.current=null;setDragging(false)},[p.room]);
  useEffect(()=>()=>{document.body.style.cursor='auto'},[]);
  const endDrag=()=>{drag.current=null;explore.current.dragging=false;setDragging(false)};
  return <div className={`museum-canvas ${dragging?'dragging':''}`}
    onPointerDown={e=>{
      if((e.target as HTMLElement).tagName!=='CANVAS'||!e.isPrimary||e.button!==0)return;
      drag.current={x:e.clientX,y:e.clientY,id:e.pointerId};
      explore.current.dragging=true;e.currentTarget.setPointerCapture(e.pointerId);setDragging(true);
    }}
    onPointerMove={e=>{
      if(!drag.current||e.pointerId!==drag.current.id)return;
      const rect=e.currentTarget.getBoundingClientRect();
      const delta=dragOffset(e.clientX-drag.current.x,e.clientY-drag.current.y,rect.width,rect.height);
      explore.current.yaw=clamp(explore.current.yaw+delta.yaw,-.65,.65);
      explore.current.pitch=clamp(explore.current.pitch+delta.pitch,-1.2,1.2);
      drag.current.x=e.clientX;drag.current.y=e.clientY;
    }}
    onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);endDrag()}}
    onPointerCancel={endDrag} onLostPointerCapture={endDrag}
    onWheel={e=>{explore.current.dolly=clamp(explore.current.dolly+wheelDistance(e.deltaY,e.deltaMode,e.currentTarget.clientHeight),-2.2,2.5)}}>
    <Canvas shadows={{type:THREE.PCFSoftShadowMap}} dpr={[1,1.5]} camera={{position:[1.8,2.15,9.4],fov:58}}
      gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.05}}
      onCreated={({gl})=>{gl.domElement.addEventListener('webglcontextlost',p.onFail,{once:true})}}>
      <Scene {...p} explore={explore}/>
    </Canvas>
  </div>;
}
