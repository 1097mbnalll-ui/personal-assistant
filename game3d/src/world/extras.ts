// Set pieces driven by the simulation: the tactical table, the missile launch site + cinematic, and the research
// upgrades that appear in the lab. Architecture and machines here are built from PBR-textured parts; scanned props dress them.
import { Color3, Color4, DynamicTexture, FreeCamera, Mesh, MeshBuilder, ParticleSystem, PBRMaterial, PointLight, Scene, Texture, TransformNode, Vector3 } from '@babylonjs/core';
import { Assets, tiledBox } from '../engine/assets';
import { Character } from '../engine/player';
import { HQ } from './hq';
import type { TechId } from '../sim/campaign';

const lin = (hex: string) => Color3.FromHexString(hex).toLinearSpace();

/** a missile body: tube, nose cone, band and four fins. length in metres. */
export function buildMissile(scene: Scene, A: Assets, name: string, length: number, radius: number, nose: Color3): TransformNode {
  const root = new TransformNode(name, scene); const body = A.flat('mslBody', lin('#c9ccc6'), .42, .55), dark = A.flat('mslDark', lin('#23272b'), .5, .6);
  const noseM = new PBRMaterial(name + ':nose', scene); noseM.albedoColor = nose; noseM.roughness = .4; noseM.metallic = .3; noseM.maxSimultaneousLights = 8;
  const add = (m: Mesh, y: number, mat: PBRMaterial) => { m.parent = root; m.position.y = y; m.material = mat; m.isPickable = false; m.receiveShadows = true; if (A.shadow) A.shadow.addShadowCaster(m); return m; };
  add(MeshBuilder.CreateCylinder(name + ':tube', { height: length * .78, diameter: radius * 2, tessellation: 32 }, scene), length * .39, body);
  add(MeshBuilder.CreateCylinder(name + ':nose', { height: length * .22, diameterBottom: radius * 2, diameterTop: radius * .12, tessellation: 32 }, scene), length * .89, noseM);
  add(MeshBuilder.CreateCylinder(name + ':band', { height: length * .035, diameter: radius * 2.03, tessellation: 32 }, scene), length * .7, dark);
  add(MeshBuilder.CreateCylinder(name + ':nozzle', { height: length * .05, diameterTop: radius * 1.3, diameterBottom: radius * 1.75, tessellation: 24 }, scene), -length * .02, dark);
  for (let k = 0; k < 4; k++) { const f = add(MeshBuilder.CreateBox(name + ':fin', { width: radius * 2.2, height: length * .16, depth: radius * .1 }, scene), length * .09, dark); f.rotation.y = k * Math.PI / 2; f.position.x = Math.cos(k * Math.PI / 2) * radius * 1.5; f.position.z = -Math.sin(k * Math.PI / 2) * radius * 1.5; }
  return root;
}

/** horizontal map display in the middle of the operations room */
export function buildTacticalTable(scene: Scene, A: Assets, hq: HQ, x: number, z: number) {
  const w = 3.2, d = 1.9, base = tiledBox(scene, 'tacBase', w - .5, .82, d - .5, 1.4); base.position.set(x, .41, z); base.material = A.mat('blue_metal_plate', new Color3(.5, .55, .6), { rough: .8 }); base.checkCollisions = true; base.receiveShadows = true;
  const top = MeshBuilder.CreateBox('tacTop', { width: w, height: .1, depth: d }, scene); top.position.set(x, .87, z); top.material = A.flat('bezel', new Color3(.02, .02, .025), .35, .6); top.checkCollisions = true;
  [base, top].forEach(m => { if (A.shadow) A.shadow.addShadowCaster(m); m.freezeWorldMatrix(); });
  const t = new DynamicTexture('scr:table', { width: 1024, height: 608 }, scene, true); const m = new PBRMaterial('scrM:table', scene); m.albedoColor = Color3.Black(); m.emissiveTexture = t; m.emissiveColor = new Color3(1.05, 1.05, 1.05); m.roughness = .2;
  const p = MeshBuilder.CreatePlane('screen:table', { width: w - .12, height: d - .12 }, scene); p.rotation.x = Math.PI / 2; p.position.set(x, .925, z); p.material = m; p.isPickable = false; p.freezeWorldMatrix();
  const l = new PointLight('tacGlow', new Vector3(x, 1.5, z), scene); l.diffuse = new Color3(.35, .7, 1); l.intensity = 5; l.range = 6; hq.lights.push({ light: l, base: 5, pos: l.position.clone() });
  hq.screens.set('table', t);
}

// ---------------------------------------------------------------------------------------------------------------
export class LaunchSite {
  readonly O = new Vector3(300, 0, 300); active = false; t = 0; private done: (() => void) | null = null;
  private missile!: TransformNode; private flame!: ParticleSystem; private smoke!: ParticleSystem; private glow!: PointLight; private lights: PointLight[] = []; private root: TransformNode; private crew: Character[] = [];
  private onCue: (cue: 'countdown' | 'ignite' | 'fade') => void = () => {}; private cued = new Set<string>(); private shake = 0;
  constructor(private scene: Scene, private A: Assets, private camera: FreeCamera) {
    const O = this.O; this.root = new TransformNode('launchSite', scene);
    const pad = tiledBox(scene, 'pad', 180, .4, 180, 7); pad.position.set(O.x, -.2, O.z); pad.material = A.mat('brushed_concrete', new Color3(.75, .75, .75)); pad.isPickable = false; pad.parent = this.root;
    const steel = A.mat('green_metal_rust', new Color3(.75, .8, .7), { rough: .8 });
    const part = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0) => { const b = tiledBox(scene, 'launcher', w, h, d, 1.5); b.position.set(O.x + x, y, O.z + z); b.rotation.z = rz; b.material = steel; b.isPickable = false; b.parent = this.root; return b; };
    part(5.2, .7, 5.2, 0, .35, 0); part(.5, 8.5, .5, 1.5, 4.9, 1.2); part(.5, 8.5, .5, 1.5, 4.9, -1.2); part(.3, .3, 2.9, 1.5, 9, 0); for (const y of [2.6, 5.2, 7.6]) { part(1.6, .16, .16, .85, y, 1.2); part(1.6, .16, .16, .85, y, -1.2); }
    part(2.4, .25, 1.2, -3.6, .82, 0, .12);
    this.missile = buildMissile(scene, A, 'launchMissile', 8.2, .5, lin('#a03222')); this.missile.parent = this.root;
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + .3; const pr = A.prop('concrete_road_barrier', O.x + Math.cos(a) * 15, O.z + Math.sin(a) * 15, { rotY: -a * 180 / Math.PI + 90, collide: false, shadow: false }); if (pr) pr.node.parent = this.root; }
    for (const [n, x, z, r] of [['portable_generator', -7.5, 5.5, 30], ['wooden_military_crate', -8.6, -4.2, 70], ['old_military_crate', -7.2, -5.6, 20], ['metal_jerrycan_green', -6.4, 6.6, 0], ['industrial_storage_cart', 8.5, -6, 110], ['ammo_box', -8.2, -3.1, 40]] as const) {
      const pr = A.prop(n, O.x + x, O.z + z, { rotY: r, collide: false, shadow: false }); if (pr) pr.node.parent = this.root; }
    for (const [x, z, c] of [[-10, -9, .9], [9, 8, .7], [-3, 11, .6]] as const) { const l = new PointLight('padLight', new Vector3(O.x + x, 6, O.z + z), scene); l.diffuse = new Color3(1, .86 * c + .1, .62 * c + .1); l.intensity = 520; l.range = 60; this.lights.push(l); }
    this.glow = new PointLight('exhaust', new Vector3(O.x, 1, O.z), scene); this.glow.diffuse = new Color3(1, .55, .2); this.glow.intensity = 0; this.glow.range = 120;
    // star field
    const st = new DynamicTexture('stars', { width: 4096, height: 2048 }, scene, false); const g = st.getContext() as unknown as CanvasRenderingContext2D; g.fillStyle = '#02040a'; g.fillRect(0, 0, 4096, 2048);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 2600; i++) { const a = rnd(); g.fillStyle = `rgba(${200 + rnd() * 55 | 0},${210 + rnd() * 45 | 0},255,${.2 + a * .7})`; g.fillRect(rnd() * 4096, rnd() * 1250, a > .93 ? 3 : 2, a > .93 ? 3 : 2); }
    const grad = g.createLinearGradient(0, 1100, 0, 2048); grad.addColorStop(0, 'rgba(14,22,38,0)'); grad.addColorStop(1, 'rgba(30,44,66,1)'); g.fillStyle = grad; g.fillRect(0, 1100, 4096, 948); st.update();
    const sky = MeshBuilder.CreateSphere('sky', { diameter: 700, segments: 16, sideOrientation: Mesh.BACKSIDE }, scene); sky.position.copyFrom(O); const sm = new PBRMaterial('skyM', scene); sm.albedoColor = Color3.Black(); sm.emissiveTexture = st; sm.emissiveColor = new Color3(.55, .55, .6); sm.disableLighting = true; sm.unlit = true; sm.albedoTexture = st;
    sky.material = sm; sky.isPickable = false; sky.parent = this.root; sky.metadata = { noGlow: true };
    // exhaust particles
    const pt = new DynamicTexture('puff', { width: 128, height: 128 }, scene, false); const pg = pt.getContext() as unknown as CanvasRenderingContext2D; const rg = pg.createRadialGradient(64, 64, 2, 64, 64, 62); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.4, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); pg.fillStyle = rg; pg.fillRect(0, 0, 128, 128); pt.update(); pt.hasAlpha = true;
    const nozzle = new TransformNode('nozzle', scene); nozzle.parent = this.missile; nozzle.position.y = -.3;
    const mk = (name: string, cap: number) => { const ps = new ParticleSystem(name, cap, scene); ps.particleTexture = pt as unknown as Texture; ps.emitter = nozzle as unknown as Mesh; ps.minEmitBox = new Vector3(-.25, 0, -.25); ps.maxEmitBox = new Vector3(.25, 0, .25); ps.emitRate = 0; ps.updateSpeed = 1 / 60; return ps; };
    this.flame = mk('flame', 500); this.flame.blendMode = ParticleSystem.BLENDMODE_ADD; this.flame.color1 = new Color4(1, .85, .5, 1); this.flame.color2 = new Color4(1, .5, .15, 1); this.flame.colorDead = new Color4(.6, .1, 0, 0);
    this.flame.minSize = 1.1; this.flame.maxSize = 2.6; this.flame.minLifeTime = .12; this.flame.maxLifeTime = .32; this.flame.direction1 = new Vector3(-.6, -14, -.6); this.flame.direction2 = new Vector3(.6, -22, .6); this.flame.minEmitPower = 1; this.flame.maxEmitPower = 1.4; this.flame.gravity = new Vector3(0, 0, 0);
    this.smoke = mk('smoke', 2600); this.smoke.blendMode = ParticleSystem.BLENDMODE_STANDARD; this.smoke.color1 = new Color4(.82, .8, .78, .5); this.smoke.color2 = new Color4(.62, .6, .58, .42); this.smoke.colorDead = new Color4(.3, .3, .3, 0);
    this.smoke.minSize = 2.5; this.smoke.maxSize = 6; this.smoke.minLifeTime = 2.8; this.smoke.maxLifeTime = 6; this.smoke.direction1 = new Vector3(-7, -3, -7); this.smoke.direction2 = new Vector3(7, .5, 7); this.smoke.minEmitPower = .7; this.smoke.maxEmitPower = 1.5; this.smoke.gravity = new Vector3(0, 1.2, 0);
    this.smoke.addSizeGradient(0, 1); this.smoke.addSizeGradient(1, 3.2); this.smoke.minAngularSpeed = -.5; this.smoke.maxAngularSpeed = .5;
    for (const [mdl, x, z, f, pose] of [['soldier_a', -9.5, 7.5, 125, 'idle2'], ['soldier_b', -10.6, 6.4, 120, 'look']] as const) { const c = new Character(scene, A, 'crew:' + mdl, mdl); c.teleport(O.x + x, O.z + z, f); c.pose = pose; this.crew.push(c); }
    this.setVisible(false);
  }
  private setVisible(v: boolean) { this.root.setEnabled(v); this.lights.forEach(l => l.setEnabled(v)); this.glow.setEnabled(v); this.crew.forEach(c => c.root.setEnabled(v)); if (!v) { this.flame.stop(); this.smoke.stop(); this.flame.reset(); this.smoke.reset(); } }
  play(onCue: (cue: 'countdown' | 'ignite' | 'fade') => void, done: () => void) { this.active = true; this.t = 0; this.done = done; this.onCue = onCue; this.cued.clear(); this.setVisible(true); this.setTime(0); }
  private cue(name: 'countdown' | 'ignite' | 'fade') { if (!this.cued.has(name)) { this.cued.add(name); this.onCue(name); } }
  /** pose everything for cinematic time t (seconds); deterministic so tests can sample any moment */
  setTime(t: number) { const O = this.O, lift = Math.max(0, t - 4.1), y = .75 + (t > 3.1 ? Math.min(.25, (t - 3.1) * .25) : 0) + .5 * 15 * lift * lift;
    this.missile.position.set(O.x, y, O.z); const thrust = t >= 3 ? 1 : 0;
    this.flame.emitRate = thrust * 900; this.smoke.emitRate = thrust * 300;
    // on the pad the exhaust is blasted sideways along the ground; in flight it hangs behind as a column
    const fly = lift > .35; this.smoke.direction1.set(fly ? -.8 : -7, fly ? -2.5 : -3, fly ? -.8 : -7); this.smoke.direction2.set(fly ? .8 : 7, fly ? -.5 : .5, fly ? .8 : 7); this.smoke.minSize = fly ? 3.5 : 2.5; this.smoke.maxSize = fly ? 7.5 : 6; if (thrust) { if (!this.flame.isStarted()) { this.flame.start(); this.smoke.start(); } }
    this.glow.position.set(O.x, y - .5, O.z); this.glow.intensity = thrust ? 2600 + Math.sin(t * 40) * 500 : 0;
    this.shake = t > 3 && t < 6.5 ? .085 * (1 - Math.abs(t - 4.2) / 2.6) : 0;
    const cam = this.camera; let pos: Vector3, look: Vector3;
    if (t < 3) { pos = new Vector3(O.x - 8.5 + t * .35, 1.5, O.z - 11.5 + t * .4); look = new Vector3(O.x, 4.2, O.z); cam.fov = .82; }
    else if (t < 6) { pos = new Vector3(O.x - 7.4, 1.35, O.z - 10.3); look = new Vector3(O.x, Math.min(y + 3, 4.2 + lift * lift * 4.5), O.z); cam.fov = .82 + Math.min(.35, lift * .12); }
    else { pos = new Vector3(O.x - 36, 2.2, O.z - 52); look = new Vector3(O.x, Math.min(y, 150) * .78 + 6, O.z); cam.fov = .95; }
    const s = this.shake; pos.addInPlaceFromFloats((Math.sin(t * 91) + Math.sin(t * 57)) * s, Math.sin(t * 73) * s, 0);
    cam.position.copyFrom(pos); cam.setTarget(look);
  }
  update(dt: number) { if (!this.active) return; this.t += dt; const t = this.t;
    if (t >= 0) this.cue('countdown'); if (t >= 3) this.cue('ignite'); if (t >= 8.6) this.cue('fade');
    this.setTime(t); this.crew.forEach(c => { c.speed = 0; c.animate(dt); });
    if (t >= 9.6) { this.active = false; this.setVisible(false); const d = this.done; this.done = null; d?.(); } }
}

// ---------------------------------------------------------------------------------------------------------------
/** Research results you can see: each completed programme adds or changes equipment in the lab (and nearby rooms). */
export class Upgrades {
  private built = new Set<TechId>(); private spinners: { node: TransformNode; speed: number }[] = []; private pops: { node: TransformNode; t: number }[] = [];
  constructor(private scene: Scene, private A: Assets, private hq: HQ) {}
  has(t: TechId) { return this.built.has(t); }
  /** build the visuals for every owned tech; `animate` plays the arrival pop for newly completed ones */
  sync(owned: TechId[], animate: boolean) { owned.forEach(t => { if (!this.built.has(t)) { this.built.add(t); const n = this.make(t); if (n && animate) { n.scaling.setAll(.01); this.pops.push({ node: n, t: 0 }); } } }); }
  update(dt: number) { this.spinners.forEach(s => { s.node.rotation.y += s.speed * dt; });
    this.pops = this.pops.filter(p => { p.t += dt * 1.6; const k = Math.min(1, p.t), e = 1 - Math.pow(1 - k, 3); p.node.scaling.setAll(Math.max(.01, e * (1 + .12 * Math.sin(k * Math.PI)))); return k < 1; }); }
  private light(parent: TransformNode, x: number, y: number, z: number, c: Color3) { const b = MeshBuilder.CreateSphere('led', { diameter: .07, segments: 8 }, this.scene); b.parent = parent; b.position.set(x, y, z); const m = new PBRMaterial('ledM', this.scene); m.albedoColor = Color3.Black(); m.emissiveColor = c; b.material = m; b.isPickable = false; }
  private group(name: string, x: number, z: number) { const n = new TransformNode('upg:' + name, this.scene); n.position.set(x, 0, z); return n; }
  private part(parent: TransformNode, m: Mesh, mat: PBRMaterial, x: number, y: number, z: number) { m.parent = parent; m.position.set(x, y, z); m.material = mat; m.isPickable = false; m.receiveShadows = true; if (this.A.shadow) this.A.shadow.addShadowCaster(m); return m; }
  private prop(parent: TransformNode, name: string, x: number, z: number, o: { rotY?: number; y?: number; scale?: number } = {}) { const p = this.A.prop(name, 0, 0, { collide: false, ...o, y: 0 }); if (!p) return; p.meshes.forEach(m => m.unfreezeWorldMatrix()); p.node.parent = parent; p.node.position.set(x, o.y ?? 0, z); }
  private make(t: TechId): TransformNode | null { const s = this.scene, A = this.A, steel = A.flat('upgSteel', lin('#4d5a4a'), .55, .6), dark = A.flat('mslDark', lin('#23272b'), .5, .6), white = A.flat('upgWhite', lin('#d5d8d2'), .4, .3);
    const dish = (g: TransformNode, y: number, dia: number, speed: number) => { const head = new TransformNode('dishHead', s); head.parent = g; head.position.y = y;
      const d = this.part(head, MeshBuilder.CreateSphere('dish', { diameter: dia, slice: .32, segments: 24, sideOrientation: Mesh.DOUBLESIDE }, s), white, 0, 0, 0); d.rotation.x = Math.PI / 2 + .25; d.position.z = dia * .1;
      this.part(head, MeshBuilder.CreateCylinder('feed', { height: dia * .5, diameter: .04 }, s), dark, 0, .02, -dia * .12).rotation.x = Math.PI / 2 + .25; this.spinners.push({ node: head, speed }); };
    if (t === 'radar') { const g = this.group(t, -6.2, 35.6); this.part(g, MeshBuilder.CreateBox('base', { width: 1.1, height: .9, depth: .9 }, s), steel, 0, .45, 0).checkCollisions = true;
      this.part(g, MeshBuilder.CreateCylinder('mast', { height: 1.5, diameter: .12 }, s), dark, 0, 1.65, 0); dish(g, 2.45, 1.3, 1.5); this.light(g, .4, .93, .3, new Color3(.2, 1, .35)); this.light(g, .25, .93, .3, new Color3(1, .6, .1));
      this.prop(g, 'retro_multimeter', -.2, .15, { y: .9, rotY: 200 }); return g; }
    if (t === 'ew2') { const g = this.group(t, -4.6, 35.6); this.part(g, MeshBuilder.CreateBox('rack', { width: .8, height: 1.9, depth: .7 }, s), steel, 0, .95, 0).checkCollisions = true;
      for (let k = 0; k < 6; k++) { this.light(g, -.25 + (k % 3) * .25, 1.2 + Math.floor(k / 3) * .3, -.36, k % 2 ? new Color3(.2, 1, .35) : new Color3(.2, .7, 1)); } this.part(g, MeshBuilder.CreateCylinder('mast', { height: .6, diameter: .08 }, s), dark, 0, 2.2, 0); dish(g, 2.6, .7, -2.4); return g; }
    if (t === 'inter') { const g = this.group(t, 6.9, 40.6); this.part(g, MeshBuilder.CreateBox('rackBase', { width: 2.2, height: .35, depth: 1 }, s), steel, 0, .18, 0).checkCollisions = true;
      for (let k = 0; k < 4; k++) { const c = this.part(g, MeshBuilder.CreateCylinder('can', { height: 2.2, diameter: .36, tessellation: 20 }, s), A.flat('upgOlive', lin('#59633f'), .6, .2), -.78 + k * .52, 1.15, 0); c.rotation.x = -.5; this.part(g, MeshBuilder.CreateCylinder('cap', { height: .05, diameter: .37, tessellation: 20 }, s), dark, -.78 + k * .52, 2.1, -.53).rotation.x = -.5; } return g; }
    if (t === 'rocket' || t === 'heavy') { const heavy = t === 'heavy', g = this.group(t, heavy ? 6.6 : 7.6, heavy ? 34.9 : 33);
      const m = buildMissile(s, A, 'labMissile:' + t, heavy ? 3.6 : 2.9, heavy ? .24 : .17, heavy ? lin('#a03222') : lin('#c9a23a')); m.parent = g; m.rotation.z = Math.PI / 2; m.position.set(heavy ? 1.8 : 1.45, heavy ? 1.05 : 1.56, 0); m.rotation.y = heavy ? 0 : Math.PI / 2;
      if (heavy) { for (const x of [-.9, .9]) this.part(g, MeshBuilder.CreateBox('cradle', { width: .25, height: .8, depth: .7 }, s), steel, x, .4, 0); } return g; }
    if (t === 'guid') { const g = this.group(t, -5.5, 39.5); const scr = MeshBuilder.CreatePlane('guidScr', { width: .5, height: .32 }, s); const m = new PBRMaterial('guidM', s); m.albedoColor = Color3.Black(); m.emissiveColor = new Color3(.1, .8, 1); scr.material = m; scr.parent = g; scr.position.set(.55, 1.12, .1); scr.rotation.y = Math.PI; scr.isPickable = false;
      this.part(g, MeshBuilder.CreateBox('guidCase', { width: .56, height: .4, depth: .3 }, s), dark, .55, 1.0, .27); this.light(g, .35, .85, .1, new Color3(.2, 1, .35)); return g; }
    if (t === 'sat') { const g = this.group(t, 0, 39.6); this.part(g, MeshBuilder.CreateCylinder('stand', { height: .35, diameter: .06 }, s), dark, .75, .97, 0); dish(g, 1.2, .5, .6); return g; }
    if (t === 'sigint') { const g = this.group(t, 8.3, 38); this.prop(g, 'vintage_radio_transceiver', 0, 0, { y: 0, rotY: -90, scale: 1.3 }); this.part(g, MeshBuilder.CreateCylinder('antenna', { height: 2.6, diameter: .03 }, s), dark, .1, 1.8, .2); this.light(g, .1, 3.1, .2, new Color3(1, .2, .1)); return g; }
    return null; }
}
