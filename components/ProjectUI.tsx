'use client';
import { useState } from 'react';
const jobRoot='https://raw.githubusercontent.com/daniel-mek/JobScout/2519ea1284dbe8a4245a68c34324c9fabb23eabc/docs/';
export default function ProjectUI({project}:{project:'jobscout'|'music'}) {
 const [screen,setScreen]=useState(0);
 const music=project==='music';
 const labels=music?['Home','Playlists','Login']:['Desktop dashboard','Mobile dashboard','About Scout'];
 const files=music?['home','playlists','login']:['mac-new.png','phone-new.png','phone-about.png'];
 return <section className="project-ui" aria-label={`${music?'THIS IS MUSIC':'JobScout'} actual interface`}>
  <div className="ui-heading"><span>INTERFACE GALLERY</span><strong>{music?'THIS IS MUSIC':'JobScout / Scout dashboard'}</strong></div>
  <div className="ui-tabs" role="group" aria-label="Choose interface screen">{labels.map((label,i)=><button key={label} aria-pressed={screen===i} onClick={()=>setScreen(i)}>{label}</button>)}</div>
  <div className={`ui-viewport ${!music&&screen>0?'portrait':''}`}>
   {music?<iframe key={screen} title={`THIS IS MUSIC — ${labels[screen]} read-only preview`} src={`/exhibits/music/${files[screen]}.html`} sandbox="" loading="lazy"/>:<img key={screen} src={jobRoot+files[screen]} alt={`Actual repository screenshot: Scout ${labels[screen]}`} loading="lazy"/>}
  </div>
  <p className="ui-caption">{music?'Original project HTML and CSS. Read-only preview; sign-in and backend actions are disabled. No live account data.':'Original screenshots supplied in the JobScout repository, showing the legacy Scout dashboard—not the newer ApplyOS interface. Displayed listings and counts belong to the captured sample, not portfolio outcomes.'}</p>
  <a className="text-button" href={music?`/exhibits/music/${files[screen]}.html`:jobRoot+files[screen]} target="_blank" rel="noopener noreferrer">Open full-size screen ↗</a>
 </section>;
}
