# The Archive — Daniel Mekhail

A working digital museum portfolio prototype using Next.js App Router, TypeScript, React Three Fiber, Three.js and Drei. All architecture and exhibit geometry is generated locally; no model downloads required.

## Run

Requires Node.js 20.9+ and pnpm (or npm).

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. `pnpm build` creates a production build; `pnpm start` serves it. `pnpm typecheck` checks TypeScript.

## Visitor paths

- Entrance → click the welcome plinth → atrium → click gallery doorways or exhibits. Museum view has no persistent menus.
- JobScout → Inspect exhibit → Read the case study.
- Click the physical visitor-information plinth to open the directory. Tab reveals an accessible directory shortcut. Direct access skips the 3D experience.
- `/?view=direct` opens the recruiter index; `/?project=jobscout` opens the case study directly.
- Native dialogs support Escape, focus trapping and focus return. Motion follows the operating system setting and can be disabled through the visitor-information directory.
- Canvas failures switch to the readable portfolio index. The index works at narrow widths and exposes the same project content.

## Edit the collection

`lib/content.ts` holds the JobScout editorial placeholders. No verified project stack, role, outcomes, résumé, contact links, or employment details were supplied. Replace these before publication. About text is in `components/Archive.tsx`.

`components/Museum.tsx` contains architecture, lights, kinetic sculpture, camera destinations and exhibit geometry. `app/globals.css` defines the palette and responsive layouts.

## Prototype scope

Systems is intentionally a future-work gallery. JobScout visuals are illustrative, not screenshots of a verified product. Google Fonts are optional; system fonts work offline. This is a local prototype, not a published production website.
