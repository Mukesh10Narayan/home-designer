# Home-plan workspace instructions

## Active project and preserved originals

- The active application is `home-designer/`: React, TypeScript, Vite and Three.js.
- GitHub Actions configuration belongs at the parent workspace root in `.github/workflows/`. The Pages workflow builds `home-designer/` and deploys only its `dist/` output. Preserve the configurable `GITHUB_PAGES_BASE` so repository-path deployments work without changing the local development URL.
- `house-plan.html` and `3bhk-house-plan.excalidraw` are preserved earlier deliverables. Do not overwrite or regenerate them unless asked.
- Focus on Design C. The earlier A/B concepts were 30 x 60 ft; do not accidentally apply their dimensions to C.

## User-approved layout requirements

- Design C is 27 ft east-west x 53 ft north-south, north up, 1,431 sq ft.
- Indian 3 BHK, three bathrooms, colourful dimensioned 2D plan, generous master and good daylight/ventilation, especially kitchen.
- Entrance on east wall near northeast corner. Kitchen must always remain southeast.
- East wing: living/hall, dining, kitchen. West wing: bedrooms, baths, dressing and other service areas.
- No separate 4 ft passage in the east wing or wall to its right. Former passage width belongs to the open kitchen/eastern rooms.
- No wall between kitchen and dining. Puja is northeast of the kitchen, not at the northeast corner of the house; preserve the 4 ft furniture-free kitchen/puja gap.
- Kitchen is shortened to 13 x 11 ft and has a south-facing exterior exit.
- Master has a separate entrance from the east-side open area and access to dressing. Do NOT add a west exit: the user explicitly undid it.
- Bedroom 2 bath and dressing are on its south side, beside the common bath and lobby.
- Master bedroom: 14 x 16 ft. Master bath and dressing: 7 x 5 ft each (not 6 ft deep).
- Bedroom 2: 14 x 12 ft. Bath 2 and dressing 2: 7 x 4.5 ft each. Common bath: 7 x 4.5 ft.
- Bedroom 3: 14 x 11 ft. Puja: 6 x 6 ft. Living: 13 x 20 ft. Dining: 13 x 12 ft.
- Structural ceiling is 11 ft, including a 1.5 ft false-ceiling drop: 9.5 ft finished height.
- Home page is the Design C plan. Clicking a room enlarges it. Provide floor, individual wall, ceiling and 3D views, with draggable/rotatable cupboards, cabinets, fans, lights and design elements.
- Provide dark/light UI modes, larger room workspaces and fullscreen for room and whole-house views.
- Whole-house 3D opens in a modal. Clicking a wall shows objects on/against it and its read-only current colour. Wall-colour editing is deferred until requested.
- Provide day/night scene modes, independently switchable sunlight and electric lights, yellow illustrative sunlight rays and white ceiling/tube-light rays. Do not equate these guides to a physically accurate lighting simulation.
- Add editable starter furniture plus ceiling and tube lights in all non-circulation rooms. Preserve existing saved layouts; merge defaults only through the explicit Add starter items action.
- Every 3D item has a visibility checkbox in the object list. Hiding must hide geometry AND emitted light/rays, not delete the object. Preserve visibility through undo/redo and save/export/import; older saves without visibility mean visible.

## Engineering rules

- Use `home-designer/src/plan.ts` as the geometry source of truth. Keep zones, walls, doors, windows, captions and schedules consistent. Do not change footprint or room sizes without user direction.
- Coordinates are feet; north is negative Y. Dimensions are nominal wall-line zones, not finished clear dimensions.
- Maintain open-plan edges rather than inventing physical walls. Keep circulation zones empty. Never silently turn a requested clearance into storage.
- Keep types strict; prefer simple React state and explicit validators. Do not use `any` or swallow save/import/3D errors.
- Keep existing localStorage data safe; validate imports before replacing state. Version exported data. Preserve undo/redo and keyboard/pointer accessibility.
- 2D floor/wall/ceiling objects are independent layers. Explain this limitation rather than implying linked BIM objects.
- Clearly mark assumed opening heights and schematic 3D geometry. Do not claim construction, airflow, Vastu, electrical or structural certification.
- Do not add a backend, cloud upload or authentication without direction. Designs currently stay local unless the user exports a file.
- Dispose Three.js resources, event handlers and animation loops on unmount.
- Derive 3D walls and partial edges from approved physical wall segments. Never enclose the open kitchen/dining/circulation zones with invented walls. Use accessible wall-picker controls alongside canvas raycasting.
- Run `npm run build`, `npm run lint`, and relevant tests in `home-designer/`. Browser-check room navigation, drag, rotation, persistence, JSON round-trip and 3D after relevant changes.
