'use client';
import { useState } from 'react';
const jobRoot='/exhibits/applyos/';
export default function ProjectUI({project}:{project:'jobscout'|'music'}) {
 const [screen,setScreen]=useState(0);
 const music=project==='music';
 const labels=music?['Home','Playlists','Login']:['Sign in','Create account'];
 const files=music?['home','playlists','login']:['login.png','signup.png'];
 return <section className="project-ui" aria-label={`${music?'THIS IS MUSIC':'ApplyOS'} actual interface`}>
  <div className="ui-heading"><span>INTERFACE GALLERY</span><strong>{music?'THIS IS MUSIC':'ApplyOS'}</strong></div>
  <div className="ui-tabs" role="group" aria-label="Choose interface screen">{labels.map((label,i)=><button key={label} aria-pressed={screen===i} onClick={()=>setScreen(i)}>{label}</button>)}</div>
  <div className="ui-viewport">
   {music?<iframe key={screen} title={`THIS IS MUSIC — ${labels[screen]} read-only preview`} src={`/exhibits/music/${files[screen]}.html`} sandbox="" loading="lazy"/>:<img key={screen} src={jobRoot+files[screen]} alt={`Actual ApplyOS screenshot: ${labels[screen]}`} loading="lazy"/>}
  </div>
  <p className="ui-caption">{music?'Original project HTML and CSS. Read-only preview; sign-in and backend actions are disabled. No live account data.':'Captured directly from the live ApplyOS sign-in and account-creation pages on November 6, 2026. Dashboard screens require an authenticated session.'}</p>
  <a className="text-button" href={music?`/exhibits/music/${files[screen]}.html`:jobRoot+files[screen]} target="_blank" rel="noopener noreferrer">Open full-size screen ↗</a>
 </section>;
}
