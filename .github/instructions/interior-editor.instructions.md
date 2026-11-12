---
applyTo: "home-designer/src/**"
---

# Interior editing and geometry

- Read the workspace Copilot instructions and preserve the approved Design C geometry.
- All units are feet. Floor and ceiling coordinates: X east, Y south. Elevations: Y down from the 9.5 ft finished ceiling; horizontal coordinate runs west-to-east on north/south walls and north-to-south on east/west walls. Do not silently mirror saved objects.
- Structural height is 11 ft; false-ceiling drop is 1.5 ft. Keep furniture and dropped ceiling objects within the finished volume.
- Use `size`, `fit`, `extent`, `obstacles`, and `hasWall` rather than duplicating coordinate math or inventing walls between open-plan zones.
- Validate finite positive dimensions, known room/surface/kind, unique IDs, hex colours, rotated bounds and depth before importing. Keep the 4 ft clear zone and circulation unfurnished.
- On the floor, item depth is vertical height; on walls it is projection; on the ceiling it is drop. Never assume a floor object and wall object are the same item. Explain layer independence in UX until linked representations are implemented.
- Pointer placement snaps to 0.25 ft. Preserve capture, touch handling, keyboard equivalents, undo/redo and per-room/per-surface isolation.
- Keep stored design versioning explicit. Do not silently replace invalid stored data or report successful saving after failure.
- Opening positions come from the approved plan. Door height 7 ft and window sill/height 3/4 ft are provisional. Surface collision warnings do not replace a real construction clearance check.
- 3D is a schematic combined preview. Maintain a usable 2D workflow if WebGL fails. Dispose GPU resources and animation loops on unmount.
- Share room and whole-house lighting/inspection controls through `Studio3D`. Theme darkness and scene time-of-day are independent. Sunlight guides are yellow; electric-light guides are white. Switching sources off must remove their illumination and guides.
- Preserve optional `visible`/`label` fields in version-1 imports; omitted visibility means visible. Hiding is reversible, participates in history and saves, and hides fixture-emitted light as well as geometry.
- Built-in defaults use deterministic IDs and live in `defaults.ts`. Merge missing defaults on valid saved-design load, but never replace edited/hidden defaults or corrupt saved data. No manual Add starter items control. Deleted built-in IDs return on reload; hide built-ins for persistent removal.
- Wall inspector colours are currently read-only. Distinguish gold selection highlighting from the actual default wall finish. Floor items near physical walls are listed as against-wall furniture; this is not synchronized elevation modeling.
- Test browser interactions in `home-designer/e2e/` and geometry/import cases in `home-designer/src/design.test.ts` when changing related behavior.
