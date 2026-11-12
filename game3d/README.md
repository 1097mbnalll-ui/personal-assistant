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

Tests: `npm test` (simulation rules, vitest) · `npm run build && node tests/e2e.cjs` (36-step playthrough of the slice in a
headless browser: walk, door, briefing, report, tactical table, launch cinematic, outcome, research, visible upgrade, save/reload).

## Layout
- `src/sim/campaign.ts` — **headless simulation** (no rendering): nations, intelligence reports as estimates, missile strike
  resolution (detection → interception), readiness, research tree, sanctions/envoys/pacts/crises, computer-run nations,
  deterministic RNG, save/load. Emits `SimEvent`s. Rules from `docs/GAME_SPEC.md`; land combat is not ported yet.
- `src/game/director.ts` — connects the 3D world to the simulation: objectives, conversations, terminals, launch staging,
  incoming-strike alarm, live wall screens, save/load (localStorage `ww3d_save_v1`).
- `src/engine/assets.ts` — GLB loading, prop placement with colliders, tiling PBR materials.
- `src/engine/input.ts` — one input state for keyboard/mouse, gamepad and touch.
- `src/engine/player.ts` — `Character` (capsule movement with collisions, clip blending idle/walk/jog/run + poses) and
  `PlayerController` (camera-relative control, spring-arm camera with wall avoidance).
- `src/engine/interact.ts` — interactables (doors, terminals, people) and the single on-screen prompt.
- `src/engine/audio.ts` — synthesised sound: ambience, footsteps, doors, UI, alarm, launch, impact.
- `src/world/hq.ts` — the headquarters: rooms, two-tone walls, sliding doors, lamps, wall screens, set dressing.
- `src/world/npc.ts` — staff (standing and seated), who is where. `src/world/extras.ts` — tactical table, launch site +
  cinematic timeline (`LaunchSite.setTime`), research upgrades that appear in the lab (`Upgrades`).
- `src/ui/hud.ts`, `src/ui/panels.ts`, `index.html` — Arabic RTL HUD, conversation bar, terminal panels (all values from the sim).
- `src/main.ts` — boot, lighting (HDRI + shadowed key + room lamps), post-processing (SSAO, bloom, ACES), game loop.
- Quality tiers `?q=low|medium|high` (also in the Tab menu). Default is picked from the GPU: phones and software/
  mobile GPUs → low (512 px textures, `models_lo/`, `chars_lo/`, `tex/512/`), Intel/integrated → medium (1k), others → high.
  If a start crashes before the game is ready, the next visit steps down one tier; WebGL context loss shows a message.
  Lighting environment is a pre-filtered `env/hq.env` (no float textures needed). `?new=1` ignores the save.

## Milestones
1. **Done** — project, third-person movement, HQ shell, doors.
2. **Done** — staff NPCs (standing/seated), conversations, terminals, synthesised audio.
3. **Done** — intelligence briefing and report generated from the simulation (confidence, source, date, ranges).
4. **Partly** — rules ported as a headless module with tests (intel, missiles, research, diplomacy, economy lines).
   Not ported: the 26-region land war, cards, world events.
5. **Done (first pass)** — tactical table, missile launch cinematic, outcome and consequences.
6. **Done (first pass)** — research with visible lab equipment (radar, network, interceptors, missiles, guidance, satellite, SIGINT).
   Save / reload.
7. Short action mission. 8. Polish, performance on phones, Android APK.

## Known defects / honest status
- Characters are 2010-era game models (Microsoft Rocketbox): human and uniformed, but low-poly with simple faces; no
  lip-sync or facial animation. The library has no jump clip, so the jump holds a slowed stride.
- The launch pad is built from simple textured parts; missile trail and stars are basic particles. No impact shot yet
  (the strike result is shown on the operations map).
- Lighting is HDRI + one shadowed key + unshadowed lamps; no baked GI. Ceilings read flat.
- Desk computers are a 1990s CRT model. The lab is sparsely dressed.
- Verified only by headless runs on a software renderer (very slow there). Not yet run on a real GPU, a phone or a gamepad,
  so frame rate, touch controls, audio mix and overall feel are unverified.
- Balance of the 12-day campaign is untested with real players.
