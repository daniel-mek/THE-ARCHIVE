# The Archive — Daniel Mekhail

A working digital museum portfolio prototype using Next.js App Router, TypeScript, React Three Fiber, Three.js and Drei. All architecture and exhibit geometry is generated locally; no model downloads required.

## Run

Requires Node.js 20.9+ and pnpm (or npm).

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. `pnpm build` creates a production build; `pnpm start` serves it. `pnpm typecheck` checks TypeScript.

## Immersive controls

Drag empty space to look around; scroll to move closer or farther. Click physical signs and objects to move between camera stations or inspect the work. Camera transitions and ambient motion respect reduced-motion settings. Rooms include procedural stone surfaces, an overhead skylight, gallery lighting, benches, mezzanine rails, and real corridor depth.

## Visitor paths

- Entrance → click the welcome plinth → atrium → click gallery doorways or exhibits. Museum view has no persistent menus.
- ApplyOS → Inspect exhibit → Read the case study.
- Click the physical visitor-information plinth to open the directory. Tab reveals an accessible directory shortcut. Direct access skips the 3D experience.
- `/?view=direct` opens the recruiter index; `/?project=jobscout` opens the case study directly.
- Native dialogs support Escape, focus trapping and focus return. Motion follows the operating system setting and can be disabled through the visitor-information directory.
- Canvas failures switch to the readable portfolio index. The index works at narrow widths and exposes the same project content.

## Edit the collection

`lib/content.ts` holds the source-backed ApplyOS overview. Public UI captures are in `public/exhibits/applyos`; authenticated workflows and outcomes remain unverified. About text is in `components/Archive.tsx`.

`components/Museum.tsx` contains gallery interactions. `ArchitecturalShell.tsx` builds beveled stone slabs, columns, and skylight structure; `SurfaceMaterials.tsx` supplies shared physically based plaster, limestone, and metal finishes; `SceneFinish.tsx` adds restrained contact depth with ambient occlusion. `Daylight.tsx` controls the sun and sky; `BotanicalPlanters.tsx` builds the foliage; `Workbench.tsx` contains the interactive artifacts and oak furniture. `app/globals.css` defines the palette and responsive layouts.

## Prototype scope

The Systems gallery presents THIS IS MUSIC using original read-only templates. ApplyOS images are captures of its public sign-in and account-creation screens. Google Fonts are optional; system fonts work offline. This is a local prototype, not a published production website.

## Visual and camera refinement

Camera travel follows arc-length-normalized curves through the open atrium, with timed quintic easing and quaternion rotation. Journeys start and stop gently, retarget from the visible camera, and respect reduced motion. Direct exploration uses separate frame-rate-independent damping. Wheel input is normalized across pixel, line, and page devices; background-tab time deltas are capped. Drag sensitivity follows viewport size, and pointer capture is released on completion or cancellation. Lighting uses one directional sun, a procedural sky, soft distance-dependent shadows, and a cached near-floor contact-shadow pass. The skylight geometry casts real glazing shadows. Plants use merged curved leaf geometry, leaf vein textures, varied crowns, and ceramic pots. The workbench has actual rounded oak staves, a stone edge, and a matte linoleum inset. Materials use seamless world-projected albedo, bump, and roughness maps. Two dimensional wall studies, Continuum and Counterform, are defined in `GalleryArt.tsx`. The multisampled finish lowers offscreen resolution after sustained slow frames and adds subtle ambient occlusion on screens at least 650px wide; invisible interaction meshes and glass are excluded from occlusion. No external models, textures, or HDR assets are needed. Run `pnpm test` with Node.js 22.18+ to validate camera response invariants.
