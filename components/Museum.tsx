'use client';
import { Canvas } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import CameraRig from './CameraRig';
import Workbench from './Workbench';
import Daylight from './Daylight';
import ArchitecturalShell from './ArchitecturalShell';
import SceneFinish from './SceneFinish';
import { PlasterMaterial } from './SurfaceMaterials';
import BotanicalPlanters from './BotanicalPlanters';
import { ArchiveWall, DisplayArt } from './MuseumDetails';
import { clamp, dragOffset, wheelDistance, type Exploration } from '../lib/camera-motion';

type Props = { room:string; reduced:boolean; onNavigate:(room:string)=>void; onInspect:()=>void; onProject:()=>void; onCapstone:()=>void; onDirectory:()=>void; onAbout:()=>void; onFail:()=>void };
type V3=[number,number,number];
const blue='#168be8', stone='#dedbcf';
function Box({at,size,color=stone,rotation=[0,0,0]}:{at:V3;size:V3;color?:string;rotation?:V3}) {return <mesh position={at} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/>{[stone,'#a7bc9b','#c7bda5'].includes(color)?<PlasterMaterial color={color}/>:<meshStandardMaterial color={color} roughness={.46} metalness={.12}/>}</mesh>}
function Sign({at,children,onClick,kind='small',rotation=[0,0,0]}:{at:V3;children:React.ReactNode;onClick:()=>void;kind?:string;rotation?:V3}){const [ready,setReady]=useState(false);useEffect(()=>{const frame=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(frame)},[]);if(!ready)return null;return <Html position={at} rotation={rotation} transform scale={kind==='welcome'?.65:kind==='plaque'?.5:kind==='screen'?.52:kind.startsWith('door')?.75:.65} distanceFactor={5} zIndexRange={[50,0]}><button className={`spatial-sign ${kind}`} onClick={e=>{e.stopPropagation();onClick()}}>{children}</button></Html>}
function Lamp({at,lit}:{at:V3;lit:boolean}) {
  const target=useMemo(()=>{const o=new THREE.Object3D();o.position.set(0,-5,0);return o},[]);
  return <group position={at}>
    <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.14,.28,16]}/><meshStandardMaterial color="#8e9eb2" metalness={.65} roughness={.3}/></mesh>
    <mesh position={[0,0,.145]}><circleGeometry args={[.1,16]}/><meshStandardMaterial color="#ffe2a5" emissive="#ffe2a5" emissiveIntensity={1.5}/></mesh>
    {lit&&<><primitive object={target}/><spotLight position={[0,-.2,0]} target={target} angle={.7} penumbra={1} intensity={3} distance={11} color="#ffe2a5"/></>}
  </group>;
}
function Bench({at,rotation=0}:{at:V3;rotation?:number}){return <group position={at} rotation={[0,rotation,0]}><RoundedBox args={[3,.2,.8]} radius={.06} position={[0,.65,0]} castShadow receiveShadow><meshStandardMaterial color="#476d66" roughness={.8}/></RoundedBox>{[-1.1,1.1].map(x=><Box key={x} at={[x,.3,0]} size={[.12,.6,.6]} color="#424d43"/>)}{[-.22,0,.22].map(z=><Box key={z} at={[0,.76,z]} size={[2.9,.015,.012]} color="#31504a"/>)}</group>}
function Gallery({side,p}:{side:-1|1;p:Props}){const x=side*6;const isJob=side===-1;return <group><Box at={[x-2.2,3,-9]} size={[.35,6,11]}/><Box at={[x+2.2,3,-9]} size={[.35,6,11]}/><Box at={[x,3,-14]} size={[4.7,6,.4]} color={isJob?'#a7bc9b':'#c7bda5'}/><Box at={[x,5.6,-9]} size={[4.6,.3,10]}/><Box at={[x,4.7,-4.5]} size={[4.5,.7,.5]} color="#586558"/><Box at={[x,4.24,-4.2]} size={[4.2,.04,.06]} color={isJob?'#45ac8b':'#9a73df'}/><Sign at={[x,3.6,-4.18]} onClick={()=>p.onNavigate(isJob?'jobscout':'systems')} kind={isJob?'door applyos-door':'door music-door'}><small>{isJob?'01 · Software & product':'02 · Systems & experiments'}</small><strong>{isJob?'ApplyOS':'THIS IS MUSIC'} <span>↗</span></strong></Sign>{isJob?<group position={[x,1.3,-9.7]} onClick={e=>{if(e.delta<6)p.onProject()}}><Box at={[0,-.8,0]} size={[2.8,.9,1.4]} color="#e3ebf4"/><Box at={[0,.75,0]} size={[3.2,2.1,.15]} color="#56657a"/><Box at={[0,-.2,.25]} size={[.2,.5,.3]} color="#a7b5c8"/><Sign at={[0,.75,.1]} onClick={p.onProject} kind="screen"><img className="exhibit-ui-thumb" src="/exhibits/applyos/login.png" alt="ApplyOS sign-in interface"/><em>ApplyOS · View actual interface ↗</em></Sign></group>:<group position={[x,1.6,-10]}><mesh rotation={[.4,.4,.2]}><icosahedronGeometry args={[1.1,0]}/><meshStandardMaterial color={blue} wireframe emissive={blue} emissiveIntensity={.4}/></mesh><Box at={[0,-1.1,0]} size={[2,.5,2]} color="#dde7f1"/><Sign at={[0,-.3,1.2]} onClick={p.onCapstone}><small>EXHIBIT 002 / TEAM PROJECT</small><strong>THIS IS MUSIC ↗</strong><span>View original interface</span></Sign></group>}<pointLight position={[x,3,-10]} intensity={3} color={isJob?'#b9f0d9':'#d7c1ff'} distance={9}/><Bench at={[x,0,-6.5]}/><Sign at={[x-1.15,.9,-8]} onClick={()=>p.onNavigate('atrium')} kind="return"><span>← Return to atrium</span></Sign></group>}
function Scene(p:Props&{explore:React.RefObject<Exploration>}){return <><Daylight/><ArchitecturalShell/><ArchiveWall/><BotanicalPlanters/><DisplayArt side={-1}/><DisplayArt side={1}/><CameraRig room={p.room} reduced={p.reduced} explore={p.explore}/><Workbench reduced={p.reduced} active={p.room==='workbench'} onApproach={()=>p.onNavigate('workbench')} onProject={()=>{p.onNavigate('workbench');p.onProject()}} onSystems={()=>{p.onNavigate('workbench');p.onCapstone()}} onExperiments={p.onInspect}/><Gallery side={-1} p={p}/><Gallery side={1} p={p}/><Bench at={[-3.6,0,2.5]} rotation={Math.PI/2}/><Bench at={[4.8,0,2.8]}/>
{/* Suspended halo, mezzanine rails and gallery track lighting. */}
<group position={[0,4.9,-2]}><mesh rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[2.55,.045,12,128]}/><meshStandardMaterial color="#77694f" metalness={.75} roughness={.3}/></mesh><mesh position={[0,-.035,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.55,.012,8,128]}/><meshStandardMaterial color="#fff0d1" emissive="#ffdfac" emissiveIntensity={1.2}/></mesh></group>{[-2.1,2.1].map(x=><Box key={x} at={[x,5.5,-2]} size={[.018,1.2,.018]} color="#a2b3c8"/>)}{[-8.8,8.8].map(x=><group key={x}><Box at={[x,3.8,-7]} size={[1.6,.2,15]} color="#a9a99b"/><Box at={[x,4.7,-7]} size={[.035,.035,15]} color="#48554c"/>{[-13,-10,-7,-4,-1].map(z=><Box key={z} at={[x,4.25,z]} size={[.035,.9,.035]} color="#48554c"/>)}</group>)}{[-6,0,6].map(x=><group key={x}><Box at={[x,5.5,-6]} size={[.06,.08,12]} color="#39443f"/>{[-10,-5,0].map(z=><Lamp key={z} at={[x,5.35,z]} lit={z===-5}/>)}</group>)}
{/* In-world information stands, not a screen-space menu. */}
<group position={[3.4,0,3.5]} rotation={[0,-.25,0]}><Box at={[0,.6,0]} size={[.65,1.2,.65]} color="#b4a482"/><Box at={[0,1.25,0]} size={[1.45,.12,.7]} color="#dfcba7"/><Sign at={[0,1.55,.08]} onClick={p.onDirectory} kind="plaque"><small>Visitor services</small><strong>Find your way ↗</strong><span>Directory · Direct access · Motion</span></Sign></group><group position={[-3.5,0,3]} rotation={[0,.25,0]}><Box at={[0,.7,0]} size={[.8,1.4,.65]} color="#b4a482"/><Sign at={[0,1.4,.35]} onClick={p.onAbout} kind="plaque"><small>Behind the collection</small><strong>Daniel Mekhail ↗</strong><span>Software / Systems / Curiosity</span></Sign></group>{p.room==='entrance'&&<Sign at={[0,2.5,3.8]} onClick={()=>p.onNavigate('atrium')} kind="welcome"><small>Daniel Mekhail · Digital museum</small><strong>The Archive<span className="welcome-period">.</span></strong><p>Step inside. Follow your curiosity.</p><em>Enter the collection ↗</em><span className="instructions">Drag to look around · Scroll to move closer</span></Sign>}{(p.room==='atrium'||p.room==='workbench')&&<Sign at={[-1,.8,4]} onClick={()=>p.onNavigate('entrance')} kind="return"><span>← Entrance</span></Sign>}
{/* Warm metal inlays lead from the atrium into each gallery. */}
{[-1,1].map(side=><group key={side}><Box at={[side*4,.025,-3.5]} size={[3,.012,.025]} color="#a49b76"/><Box at={[side*5.5,.025,-5.5]} size={[.025,.012,4]} color="#a49b76"/></group>)}
<SceneFinish/></>}
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
      gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:.95}}
      onCreated={({gl})=>{gl.domElement.addEventListener('webglcontextlost',p.onFail,{once:true})}}>
      <Scene {...p} explore={explore}/>
    </Canvas>
  </div>;
}
