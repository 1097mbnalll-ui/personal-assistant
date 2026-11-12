# الحرب العالمية — 3D (Babylon.js)

Third-person 3D version of the game. Runs in a browser; meant to be wrapped as an Android APK later (Capacitor).
The classic turn-based browser game in `src/` + `dist/` stays untouched as the rules reference (`docs/GAME_SPEC.md`).

```
cd game3d
npm install
python3 ../tools/fetch_assets.py   # downloads the human character + mocap clips (not committed, see ASSETS.md)
npm run dev                        # http://localhost:5173
npm run build                      # static site in game3d/dist
```

Controls: WASD move · mouse look (click to capture) · Shift sprint · Ctrl walk · Space jump · E interact · Tab menu.
Gamepad: left stick move, right stick look, A jump, X interact, RB/L3 sprint. Touch: left half = stick, right half = look, on-screen buttons.

## Layout
- `src/engine/assets.ts` — GLB loading, prop placement with colliders, tiling PBR materials.
- `src/engine/input.ts` — one input state for keyboard/mouse, gamepad and touch.
- `src/engine/player.ts` — `Character` (capsule movement with collisions, mocap blending idle/walk/jog/run/jump/fall,
  retargeted by joint name) and `PlayerController` (camera-relative control, spring-arm camera with wall avoidance).
- `src/engine/interact.ts` — interactables (doors, terminals, later people) and the single on-screen prompt.
- `src/world/hq.ts` — the headquarters: rooms, two-tone walls, sliding doors, lamps, wall screens, set dressing.
- `src/ui/hud.ts` + `index.html` — Arabic RTL HUD, loading screen, modal panels, touch controls.
- `src/main.ts` — boot, lighting (HDRI + shadowed key + room lamps), post-processing (SSAO, bloom, ACES), game loop.
- Quality tiers `?q=low|medium|high` (also in the Tab menu); touch devices default to low.

## Milestones
1. **Done** — project, third-person movement, first HQ shell (5 rooms), doors, one working terminal.
2. HQ interactions: NPC staff with idle/talk, conversation UI, more terminals, ambient audio.
3. Intelligence briefing: officer NPC, report built from the simulation (confidence, source, date).
4. Port the rules (`docs/GAME_SPEC.md`) to a headless TypeScript module with tests; drive the wall screens from it.
5. Missile operation: tactical table UI, launch cinematic, consequences fed back into the world.
6. Research upgrade that visibly changes the lab / equipment. Save and load.
7. Short action mission. 8. Polish, performance on phones, Android APK.

## Known defects / honest status (M1)
- The only human model reachable from the build environment is one Ready Player Me avatar (a civilian suit recoloured
  olive). It is a stand-in: a proper uniformed character with its own clips is needed for the target look.
- Jump uses one mocap clip without a landing blend. Walk/jog/run cycles are not phase-synchronised.
- Lighting is HDRI + one shadowed key + unshadowed lamps; no baked GI. Ceilings read flat.
- Desk computers are a 1990s CRT model; wall screens only show a clock until the simulation is connected.
- Tested by scripted headless runs (software renderer). Not yet tested on a real GPU, phone or gamepad.
