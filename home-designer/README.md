# Design C - Home Interior Studio

React + TypeScript + Vite + Three.js. The home page preserves Design C from the standalone HTML, which remains untouched in the parent folder.

## Run

Use Node.js 20.19+ (or a current supported LTS).

```sh
npm install
npm run dev
npm run build
npm run lint
npm test
npm run test:e2e
```

Open the localhost URL printed by Vite. `npm run preview` serves the production build after building.

Browser tests use the locally installed Google Chrome and launch/reuse the dev server on port 5173.

## GitHub Pages deployment

The Git repository root must be the parent `home-plan` workspace, **not** this app directory. This keeps `.github/workflows/deploy-pages.yml` and the Copilot instructions at the repository root.

Target repository: `Mukesh10Narayan/home-designer`. Expected site URL after a successful deployment: `https://mukesh10narayan.github.io/home-designer/`.

1. In a separate browser profile or private window, sign into GitHub as **Mukesh10Narayan**. This does not require changing the VS Code/Copilot account.
2. Create an empty **public** repository named `home-designer` under that account. Do not initialize a README, license or gitignore remotely.
3. In repository **Settings > Pages > Build and deployment**, select **GitHub Actions** as the source.
4. Initialize Git in the parent workspace, configure the commit author **locally**, and add the remote `https://Mukesh10Narayan@github.com/Mukesh10Narayan/home-designer.git`. Set repository-local `credential.https://github.com.username` to `Mukesh10Narayan` and `credential.useHttpPath` to `false` so Git Credential Manager can use that account's saved device login. The explicit username selects the account; do not change global credential settings.
5. Commit and push the source to `main`. Complete any Git Credential Manager browser prompt using **Mukesh10Narayan**. Git author name/email and GitHub authentication are separate; setting `user.name` alone does not log into another account. Do not change global identity or clear other accounts' credentials.
6. Monitor **Actions > Deploy home designer to GitHub Pages**. On success, open the Pages URL. Subsequent pushes to `main` deploy automatically.

The workflow installs dependencies from the lockfile, lints, runs unit tests and builds the app with its repository URL prefix before deploying only `home-designer/dist`. Build/test outputs remain ignored by Git.

For a local Pages-path preview in PowerShell, from this app directory:

```powershell
$env:GITHUB_PAGES_BASE = '/home-designer/'
try {
  npm run build
  if ($LASTEXITCODE -eq 0) { npm run preview }
} finally {
  Remove-Item Env:GITHUB_PAGES_BASE
}
```

Open the preview server's `/home-designer/` URL. Normal local development defaults to `/`.

**Privacy:** the public repository exposes the source and house-plan geometry, including the preserved HTML/Excalidraw files if committed. The published app keeps interior edits in each visitor's browser; it does not upload those edits. Local development saves do not automatically transfer to the Pages origin: export JSON locally and import it on the deployed site. Other project sites on the same `github.io` origin can share browser storage; do not treat it as confidential storage.

## Use

- Select a room on the whole-home plan or room schedule.
- Choose floor, a compass wall, ceiling, or 3D preview.
- Add cupboards, cabinets, shelves, beds, sofas, ceiling panels, fans or lights as appropriate to the view.
- Drag with mouse/touch (3-inch position snap). Select an item to edit its dimensions, centre coordinates, colour and angle. `R` rotates 15 degrees; arrows move 3 inches; Shift + arrows move 1 ft.
- Undo/redo tracks design edits. Positions and rotated bounds stay within their surface.
- In 3D, drag to orbit, scroll/pinch to zoom and right-drag to pan. Editing happens in 2D. Transparent walls and an omitted roof expose all objects.
- Dark mode is enabled initially; use **Light mode / Dark mode** in the header to switch the interface. Theme and scene day/night are separate.
- Room workspaces use the available screen width with a taller drawing area. **Fullscreen** expands the room workspace (including its tools) or whole-house dialog; Escape exits browser fullscreen.
- **Whole house 3D** opens an orbitable model of the entire approved plan in a modal. Click a wall to highlight it and inspect its room, current default finish and objects on/against it. The compass wall buttons provide a keyboard-accessible alternative. **Open wall editor** opens the selected elevation. Wall finish editing is deliberately deferred; the displayed swatch is read-only.
- In room or house 3D, **Day / Night** set ambient lighting and sunlight. Night turns the sun off; Day restores it. **Sunlight** and **Ceiling / tube lights** independently control the light sources. **Show rays** controls only the visual beam guides, not source illumination. Yellow beams indicate exterior-window sunlight; white beams indicate electric lights. These are illustrative guides, not ray-traced daylight, shadows or a lux/solar study.
- The 3D object list includes visibility checkboxes for furniture, fans, lights and every other item. Unchecking hides the object's geometry and any light/rays it emits; it does not delete the item. Visibility participates in undo/redo, autosave and JSON export/import, and is shared with the 2D room list. Wall inspection includes wall-mounted items plus floor furniture within 0.35 ft of the selected physical wall.
- A new unsaved design starts with room-scale furniture, fans where appropriate, and a ceiling light plus tube light in every non-circulation room. Existing saves are not automatically furnished or overwritten. Use **Add starter items** to merge missing defaults into an existing save; existing default IDs and their edits/visibility are preserved. Deleted starter items are restored only when explicitly adding defaults again. Starter locations are suggestions, not certified clearances.
- Changes save to localStorage on this browser/origin. Export JSON for portable backups and import on another browser. History is session-only. Invalid imports are rejected without replacing the current design. A corrupt local save is protected until explicitly replaced or a valid file is imported.

All coordinates and dimensions are in feet. Wall and ceiling views are independent design layers, not synchronized representations of a single furniture object; do not model a cabinet on both the floor and wall unless you want two objects in 3D. On the floor, width/length describe the footprint and depth describes vertical height. On a wall, width/height describe the elevation and depth is projection. On the ceiling, width/length describe the plan and depth is the drop.

## Plan constraints

27 ft east-west x 53 ft north-south, 1,431 sq ft. North is up. Living/dining/kitchen are east; bedrooms/bathrooms are west. Entry is on the east wall near the northeast corner. Kitchen stays southeast with a south exit. No west master exit (that request was undone).

Master: 14 x 16 ft; its bath and dressing: 7 x 5 ft each. Bedroom 2: 14 x 12 ft with bath and dressing on its south side next to the common bath/lobby, each 7 x 4.5 ft. Bedroom 3: 14 x 11 ft. Common bath: 7 x 4.5 ft. Kitchen: 13 x 11 ft. Puja: 6 x 6 ft, northeast of kitchen, separated by a 4 ft clear zone. No wall between kitchen and dining; no separate 4 ft east passage. Master has its own east-side entrance.

Structural height is 11 ft. False-ceiling drop is 1.5 ft; the finished ceiling is 9.5 ft. Window sill/height (3/4 ft) and door height (7 ft) are **assumptions**, not surveyed dimensions. Wall overlays warn about selected objects overlapping openings; floor clearance, inter-object clashes, structural feasibility and electrical safety are not certified. Open zones cannot be furnished by this editor.

## Source map

- `src/plan.ts`: single source of room geometry, wall lines, openings and heights.
- `src/design.ts`: typed objects, palettes, rotated bounds and import validation.
- `src/HousePlan.tsx`: accessible clickable whole-home SVG.
- `src/App.tsx`: 2D editing, persistence, import/export and history.
- `src/Room3D.tsx`: on-demand Three.js preview and resource cleanup.
- `src/Studio3D.tsx`: shared room/house lighting, wall inspector and visibility controls.
- `src/defaults.ts`: deterministic starter furniture and lights, with non-destructive merging.
- `src/scene.ts`: typed scene lighting and wall selection.

This is a nominal-wall-line concept, not a sanctioned or construction drawing. Ask a local architect/engineer to verify clearances, setbacks, structure, ventilation, plumbing, false-ceiling supports and fan/light mounting before execution. No Vastu certification, parking, stairs or setbacks are allocated.
