// The headquarters level: architecture from tiled PBR surfaces, dressed with scanned props (Poly Haven, CC0).
import { Color3, DynamicTexture, Mesh, MeshBuilder, PBRMaterial, PointLight, Scene, Vector3 } from '@babylonjs/core';
import { Assets, tiledBox } from '../engine/assets';
import { Interactions } from '../engine/interact';

export interface Room { id: string; name: string; x0: number; x1: number; z0: number; z1: number; h: number }
export interface Door { id: string; open: number; target: number; locked: boolean; update(dt: number, px: number, pz: number): void }
interface Opening { at: number; w: number; h?: number }

export const ROOMS: Room[] = [
  { id: 'office', name: 'مكتب القائد', x0: -6, x1: 6, z0: -10, z1: 0, h: 3.2 },
  { id: 'corridor', name: 'الممر الرئيسي', x0: -2, x1: 2, z0: 0, z1: 30, h: 3.2 },
  { id: 'intel', name: 'إدارة الاستخبارات', x0: -16, x1: -2, z0: 6, z1: 20, h: 3.2 },
  { id: 'ops', name: 'غرفة العمليات', x0: 2, x1: 18, z0: 4, z1: 22, h: 4.6 },
  { id: 'lab', name: 'مختبر الأبحاث', x0: -9, x1: 9, z0: 30, z1: 42, h: 3.6 },
];
export const MODELS = ['metal_office_desk', 'classic_laptop', 'modern_arm_chair_01', 'drawer_cabinet', 'steel_frame_shelves_03', 'old_military_crate',
  'wooden_military_crate', 'ammo_box', 'vintage_radio_transceiver', 'mounted_fluorescent_lights', 'security_camera_01', 'korean_fire_extinguisher_01',
  'metal_tool_chest', 'portable_generator', 'wall_clock', 'fire_alarm', 'utility_box_01', 'power_box_01', 'office_notepads', 'binder_notebook',
  'desk_lamp_arm_01', 'sofa_02', 'industrial_coffee_table', 'metal_stool_01', 'clipboard', 'stationery_supplies', 'potted_plant_01',
  'book_encyclopedia_set_01', 'industrial_storage_cart', 'retro_multimeter', 'circuit_board', 'metal_jerrycan_green', 'binoculars', 'standing_chalkboard_01'];

export class HQ {
  doors: Door[] = []; lights: { light: PointLight; base: number; pos: Vector3 }[] = [];
  screens = new Map<string, DynamicTexture>();
  private T = .24;
  constructor(readonly scene: Scene, readonly A: Assets, readonly I: Interactions) {}

  roomAt(x: number, z: number): Room | null { return ROOMS.find(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) ?? null; }

  build() {
    const A = this.A;
    const wallPaint = A.mat('plastered_wall_02', new Color3(.93, .93, .9)), wallOps = A.mat('concrete_wall_008', new Color3(.5, .56, .62));
    const wallOffice = A.mat('beige_wall_001', new Color3(.95, .93, .88)), wallLab = A.mat('white_plaster_02', new Color3(.95, .96, .97));
    const dado = A.mat('plastered_wall_02', new Color3(.33, .4, .36)), dadoOffice = A.mat('wood_table_001', new Color3(.9, .85, .8), { rough: .8 }), dadoOps = A.mat('concrete_wall_008', new Color3(.2, .24, .29));
    const dadoLab = A.mat('white_plaster_02', new Color3(.42, .5, .58));
    // ---- floors & ceilings
    this.floor('office', A.mat('laminate_floor_02', new Color3(.78, .7, .62), { rough: .85 }), 2.4);
    this.floor('corridor', A.mat('granite_tile', new Color3(.8, .8, .8), { rough: .75 }), 2.4);
    this.floor('intel', A.mat('dirty_carpet', new Color3(1.5, 1.75, 2.3)), 2.2);
    this.floor('ops', A.mat('rubber_tiles', new Color3(1.5, 1.6, 1.75)), 2);
    this.floor('lab', A.mat('concrete_floor_worn_001', new Color3(.95, .95, .95), { rough: .8 }), 3);
    const ceil = A.mat('ceiling_interior', new Color3(1.5, 1.5, 1.46), { bump: .35 });
    ROOMS.forEach(r => { const c = tiledBox(this.scene, 'ceil:' + r.id, r.x1 - r.x0, .2, r.z1 - r.z0, 2.4); c.position.set((r.x0 + r.x1) / 2, r.h + .1, (r.z0 + r.z1) / 2); c.material = ceil; c.checkCollisions = true; c.receiveShadows = false; c.freezeWorldMatrix(); });
    // ---- walls (x0,z0)-(x1,z1) with door openings
    this.wall(-6, -10, 6, -10, 3.2, wallOffice, [], dadoOffice); this.wall(-6, -10, -6, 0, 3.2, wallOffice, [], dadoOffice); this.wall(6, -10, 6, 0, 3.2, wallOffice, [], dadoOffice);
    this.wall(-6, 0, 6, 0, 3.2, wallOffice, [{ at: 6, w: 1.5 }], dadoOffice);
    this.wall(-2, 0, -2, 30, 3.2, wallPaint, [{ at: 13, w: 1.5 }], dado);
    this.wall(2, 0, 2, 30, 4.6, wallPaint, [{ at: 13, w: 2.3 }], dado);
    this.wall(-16, 6, -2, 6, 3.2, wallPaint, [], dado); this.wall(-16, 20, -2, 20, 3.2, wallPaint, [], dado); this.wall(-16, 6, -16, 20, 3.2, wallPaint, [], dado);
    this.wall(2, 4, 18, 4, 4.6, wallOps, [], dadoOps); this.wall(2, 22, 18, 22, 4.6, wallOps, [], dadoOps); this.wall(18, 4, 18, 22, 4.6, wallOps, [], dadoOps);
    this.wall(-9, 30, 9, 30, 3.6, wallLab, [{ at: 9, w: 1.8 }], dadoLab); this.wall(-9, 42, 9, 42, 3.6, wallLab, [], dadoLab); this.wall(-9, 30, -9, 42, 3.6, wallLab, [], dadoLab); this.wall(9, 30, 9, 42, 3.6, wallLab, [], dadoLab);
    // ---- doors
    this.door('office', 0, 0, 'x', 1.5, 'مكتب القائد');
    this.door('intel', -2, 13, 'z', 1.5, 'إدارة الاستخبارات');
    this.door('ops', 2, 13, 'z', 2.3, 'غرفة العمليات');
    this.door('lab', 0, 30, 'x', 1.8, 'مختبر الأبحاث');
    this.dress();
  }

  private floor(id: string, mat: PBRMaterial, tile: number) {
    const r = ROOMS.find(q => q.id === id)!; const f = tiledBox(this.scene, 'floor:' + id, r.x1 - r.x0, .3, r.z1 - r.z0, tile);
    f.position.set((r.x0 + r.x1) / 2, -.15, (r.z0 + r.z1) / 2); f.material = mat; f.checkCollisions = true; f.receiveShadows = true; f.freezeWorldMatrix();
  }
  private wall(x0: number, z0: number, x1: number, z1: number, h: number, mat: PBRMaterial, openings: Opening[] = [], dado?: PBRMaterial) {
    const alongX = z0 === z1, len = alongX ? x1 - x0 : z1 - z0, T = this.T;
    const trim = this.A.flat('trim', new Color3(.09, .1, .11), .5, .2);
    const seg = (a: number, b: number, y0: number, y1: number, base: boolean, m2: PBRMaterial = mat): void => {
      if (b - a < .01 || y1 - y0 < .01) return;
      if (base && dado && m2 === mat) {   // two-tone wall: painted dado below a rail, lighter finish above
        seg(a, b, 0, 1.05, true, dado); seg(a, b, 1.05, y1, false);
        const r = MeshBuilder.CreateBox('rail', { width: alongX ? b - a : T + .05, height: .06, depth: alongX ? T + .05 : b - a }, this.scene);
        r.position.set(alongX ? x0 + (a + b) / 2 : x0, 1.05, alongX ? z0 : z0 + (a + b) / 2); r.material = trim; r.isPickable = false; r.freezeWorldMatrix(); return;
      }
      const m = tiledBox(this.scene, 'wall', alongX ? b - a : T, y1 - y0, alongX ? T : b - a, 2.6);
      const c = (a + b) / 2; m.position.set(alongX ? x0 + c : x0, (y0 + y1) / 2, alongX ? z0 : z0 + c);
      m.material = m2; m.checkCollisions = true; m.receiveShadows = true; m.freezeWorldMatrix();
      if (base) { const s = MeshBuilder.CreateBox('skirt', { width: alongX ? b - a : T + .04, height: .12, depth: alongX ? T + .04 : b - a }, this.scene); s.position.set(m.position.x, .06, m.position.z); s.material = trim; s.isPickable = false; s.freezeWorldMatrix(); }
    };
    let cur = 0;
    [...openings].sort((p, q) => p.at - q.at).forEach(o => { const oh = o.h ?? 2.3; seg(cur, o.at - o.w / 2, 0, h, true); seg(o.at - o.w / 2, o.at + o.w / 2, oh, h, false); cur = o.at + o.w / 2; });
    seg(cur, len, 0, h, true);
  }

  /** Sliding steel door in a wall opening. axis 'x' = wall runs along X. */
  private door(id: string, x: number, z: number, axis: 'x' | 'z', w: number, label: string) {
    const A = this.A, H = 2.3, steel = A.mat('blue_metal_plate', new Color3(.62, .68, .72), { rough: .85 }), frameM = A.flat('frame', new Color3(.12, .13, .15), .45, .7);
    const lamp = new PBRMaterial('doorLamp:' + id, this.scene); lamp.albedoColor = Color3.Black(); lamp.emissiveColor = new Color3(.9, .15, .1); lamp.roughness = .4;
    const mk = (ww: number, hh: number, dd: number, m: PBRMaterial, px: number, py: number, pz: number, col = false) => {
      const b = MeshBuilder.CreateBox('door:' + id, axis === 'x' ? { width: ww, height: hh, depth: dd } : { width: dd, height: hh, depth: ww }, this.scene);
      b.position.set(axis === 'x' ? x + px : x + pz, py, axis === 'x' ? z + pz : z + px); b.material = m; b.checkCollisions = col; b.receiveShadows = true; return b;
    };
    mk(.1, H + .1, .34, frameM, -w / 2 - .05, (H + .1) / 2, 0).freezeWorldMatrix(); mk(.1, H + .1, .34, frameM, w / 2 + .05, (H + .1) / 2, 0).freezeWorldMatrix(); mk(w + .2, .12, .34, frameM, 0, H + .06, 0).freezeWorldMatrix();
    const leaves = w > 2 ? 2 : 1, lw = w / leaves;
    const panels = Array.from({ length: leaves }, (_, k) => { const p = tiledBox(this.scene, 'doorPanel:' + id, axis === 'x' ? lw : .07, H, axis === 'x' ? .07 : lw, 1.4);
      p.material = steel; p.checkCollisions = true; p.receiveShadows = true; return p; });
    const strips = [-1, 1].map(s => mk(w * .5, .05, .02, lamp, 0, H + .22, s * .14));
    strips.forEach(s => s.freezeWorldMatrix());
    this.sign(label, x, H + .62, z, axis);
    const door: Door = { id, open: 0, target: 0, locked: false, update: (dt, px, pz) => {
      const d = Math.hypot(px - x, pz - z);
      if (door.target === 1 && d > 3.4) door.target = 0;
      door.open += Math.sign(door.target - door.open) * Math.min(Math.abs(door.target - door.open), dt * 2.2);
      const e = door.open * door.open * (3 - 2 * door.open);
      panels.forEach((p, k) => { const dir = leaves === 2 ? (k === 0 ? -1 : 1) : 1; const c = leaves === 2 ? (k === 0 ? -lw / 2 : lw / 2) : 0; const off = c + dir * e * (lw - .06);
        p.position.set(axis === 'x' ? x + off : x, H / 2, axis === 'x' ? z : z + off); p.checkCollisions = door.open < .75; });
      lamp.emissiveColor.set(door.locked ? .9 : door.open > .05 ? .1 : .9, door.locked ? .1 : door.open > .05 ? .9 : .55, .1);
    } };
    door.update(0, 99, 99);
    this.doors.push(door);
    this.I.add({ id: 'door:' + id, pos: new Vector3(x, 1, z), radius: 2.4, prompt: () => door.locked ? 'الباب مقفل' : door.target === 0 ? 'افتح الباب' : null, use: () => { if (!door.locked) door.target = 1; } });
  }
  private sign(text: string, x: number, y: number, z: number, axis: 'x' | 'z') {
    for (const s of [-1, 1]) {
      const t = new DynamicTexture('sign', { width: 512, height: 96 }, this.scene, true); const c = t.getContext() as unknown as CanvasRenderingContext2D;
      c.fillStyle = '#10161c'; c.fillRect(0, 0, 512, 96); c.strokeStyle = '#c9a44e'; c.lineWidth = 4; c.strokeRect(4, 4, 504, 88);
      c.fillStyle = '#e9d9a8'; c.font = 'bold 50px "Cairo","Noto Sans Arabic",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl'; c.fillText(text, 256, 52); t.update();
      const m = new PBRMaterial('signM', this.scene); m.albedoTexture = t; m.emissiveTexture = t; m.emissiveColor = new Color3(.55, .55, .55); m.roughness = .5;
      const p = MeshBuilder.CreatePlane('sign', { width: 1.5, height: .28 }, this.scene); p.material = m; p.isPickable = false;
      if (axis === 'x') { p.position.set(x, y, z - s * .14); p.rotation.y = s > 0 ? 0 : Math.PI; } else { p.position.set(x - s * .14, y, z); p.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; }
      p.freezeWorldMatrix();
    }
  }
  /** ceiling light: scanned fixture + a point light below it */
  private lamp(x: number, z: number, h: number, intensity = 1) {
    this.A.prop('mounted_fluorescent_lights', x, z, { y: h - .005, collide: false, shadow: false, scale: 1.35 });
    const glow = MeshBuilder.CreatePlane('lampGlow', { width: 1.05, height: .7 }, this.scene); glow.rotation.x = -Math.PI / 2; glow.position.set(x, h - .065, z);
    glow.material = this.A.flat('lampGlow', Color3.Black(), 1, 0, new Color3(1.6, 1.55, 1.4)); glow.isPickable = false; glow.freezeWorldMatrix();
    const l = new PointLight('lamp', new Vector3(x, h - .35, z), this.scene); l.diffuse = new Color3(1, .96, .88); l.specular = new Color3(.6, .58, .52);
    l.intensity = 34 * intensity; l.range = 14; l.shadowEnabled = false;
    this.lights.push({ light: l, base: l.intensity, pos: l.position.clone() });
  }
  /** wall-mounted flat display that game systems can draw on */
  screen(id: string, x: number, y: number, z: number, rotY: number, w: number, h: number) {
    const t = new DynamicTexture('scr:' + id, { width: 1024, height: Math.round(1024 * h / w) }, this.scene, true);
    const m = new PBRMaterial('scrM:' + id, this.scene); m.albedoColor = Color3.Black(); m.emissiveTexture = t; m.emissiveColor = new Color3(1.1, 1.1, 1.1); m.roughness = .25;
    const bez = MeshBuilder.CreateBox('bezel', { width: w + .08, height: h + .08, depth: .06 }, this.scene); bez.material = this.A.flat('bezel', new Color3(.02, .02, .025), .35, .6);
    const p = MeshBuilder.CreatePlane('screen:' + id, { width: w, height: h }, this.scene); p.material = m; p.parent = bez; p.position.z = -.032; p.isPickable = false;
    bez.position.set(x, y, z); bez.rotation.y = rotY * Math.PI / 180; bez.isPickable = false;
    this.screens.set(id, t); return t;
  }

  private dress() {
    const A = this.A, P = (n: string, x: number, z: number, rotY = 0, o: object = {}) => A.prop(n, x, z, { rotY, ...o });
    // ---------- commander's office
    { const rug = tiledBox(this.scene, 'rug', 5.4, .02, 4.2, 1.6); rug.position.set(0, .011, -6.2); rug.material = A.mat('dirty_carpet', new Color3(1.7, 2.0, 1.7)); rug.receiveShadows = true; rug.isPickable = false; rug.freezeWorldMatrix(); }
    P('metal_office_desk', 0, -6.2, 180); P('modern_arm_chair_01', 0, -7.4, 0);
    P('classic_laptop', -.35, -6.2, 180, { y: .79, collide: false }); P('desk_lamp_arm_01', .78, -6.35, 200, { y: .79, collide: false });
    P('office_notepads', .25, -6.0, 170, { y: .79, collide: false, scale: .45 }); P('stationery_supplies', -.85, -6.0, 0, { y: .86, collide: false }); P('binder_notebook', .45, -6.45, 15, { y: .79, collide: false });
    P('drawer_cabinet', -5.55, -7.5, 90); P('drawer_cabinet', -5.55, -6.3, 90); P('book_encyclopedia_set_01', -5.5, -6.9, 90, { y: 1.88, collide: false });
    P('steel_frame_shelves_03', 4.4, -9.5, 0); P('sofa_02', 5.35, -3.2, -90); P('industrial_coffee_table', 4.1, -3.2, 0);
    P('potted_plant_01', -5.3, -9.3, 30); P('potted_plant_01', 5.3, -.7, 200); P('wall_clock', 0, -9.86, 0, { y: 2.35, collide: false });
    P('modern_arm_chair_01', -1.1, -4.6, 160); P('modern_arm_chair_01', 1.1, -4.6, 200);
    this.lamp(-2.6, -6.5, 3.2); this.lamp(2.6, -6.5, 3.2); this.lamp(0, -2.4, 3.2);
    // ---------- corridor
    for (const z of [3, 9, 15, 21, 27]) this.lamp(0, z, 3.2, .8);
    P('korean_fire_extinguisher_01', -1.7, 4.5, 90); P('fire_alarm', -1.86, 4.5, 90, { y: 1.5, collide: false });
    P('utility_box_01', 1.68, 7.5, -90); P('wooden_military_crate', 1.5, 24.5, 90); P('wooden_military_crate', 1.5, 24.5, 80, { y: .46, scale: .9 }); P('ammo_box', 1.45, 26, 20);
    P('old_military_crate', -1.25, 22.5, 90, { scale: .8 }); P('security_camera_01', 1.75, 11.2, 215, { y: 2.85, collide: false }); P('security_camera_01', -1.75, 29.2, 140, { y: 2.85, collide: false });
    P('power_box_01', -1.86, 17, 90, { y: 1.5, collide: false }); P('potted_plant_01', -1.5, 1, 0);
    // ---------- intelligence department
    for (const [x, z] of [[-12.5, 9.5], [-8.5, 9.5], [-12.5, 13.5], [-8.5, 13.5]] as const) {
      P('metal_office_desk', x, z, 0); P('modern_arm_chair_01', x, z + 1.15, 180); P('classic_laptop', x - .3, z, 0, { y: .79, collide: false });
      P('office_notepads', x + .45, z - .05, 8, { y: .79, collide: false, scale: .4 });
    }
    P('desk_lamp_arm_01', -11.7, 9.4, 30, { y: .79, collide: false }); P('binder_notebook', -8.1, 13.6, 40, { y: .79, collide: false }); P('clipboard', -12.9, 13.4, -20, { y: .79, collide: false });
    P('vintage_radio_transceiver', -15.3, 17.6, 90, { y: .79, collide: false }); P('metal_office_desk', -15.2, 17.2, 90); P('metal_stool_01', -14.1, 17.2, 0); P('binoculars', -15.3, 16.5, 120, { y: .79, collide: false });
    P('drawer_cabinet', -15.55, 8, 90); P('drawer_cabinet', -15.55, 9.2, 90); P('drawer_cabinet', -15.55, 10.4, 90); P('steel_frame_shelves_03', -5.5, 19.5, 0); P('steel_frame_shelves_03', -8.2, 19.5, 0);
    P('standing_chalkboard_01', -3.4, 8, -40); P('potted_plant_01', -2.8, 19.2, 0); P('wall_clock', -9, 6.14, 180, { y: 2.4, collide: false });
    for (const [x, z] of [[-12.5, 10], [-6.5, 10], [-12.5, 16], [-6.5, 16]] as const) this.lamp(x, z, 3.2, .85);
    this.screen('intelWall', -9, 1.75, 19.84, 0, 3.4, 1.5);
    // ---------- command operations room
    for (const [x, z] of [[7, 10], [11, 10], [15, 10], [7, 16], [11, 16], [15, 16]] as const) {
      P('metal_office_desk', x, z, -90); P('modern_arm_chair_01', x - 1.2, z, 90); P('classic_laptop', x, z + .3, -90, { y: .79, collide: false });
    }
    P('vintage_radio_transceiver', 7, 9.3, -90, { y: .79, collide: false }); P('retro_multimeter', 11, 15.4, -60, { y: .79, collide: false });
    P('industrial_storage_cart', 4.2, 20.6, 0); P('metal_tool_chest', 16.8, 21.2, 0); P('portable_generator', 16.9, 5, -30); P('metal_jerrycan_green', 15.9, 4.7, 20);
    P('korean_fire_extinguisher_01', 2.5, 15.2, -90); P('security_camera_01', 2.4, 21.6, 135, { y: 4.1, collide: false });
    for (const [x, z] of [[6, 8], [12, 8], [6, 14], [12, 14], [6, 19], [12, 19]] as const) this.lamp(x, z, 4.6, .7);
    this.screen('opsMain', 17.84, 2.45, 13, 90, 6.4, 2.9); this.screen('opsLeft', 17.84, 2.2, 7.2, 90, 3, 1.7); this.screen('opsRight', 17.84, 2.2, 18.8, 90, 3, 1.7);
    // ---------- research lab
    for (const x of [-5.5, 0, 5.5]) { P('metal_office_desk', x, 39.5, 0); P('metal_stool_01', x, 38.4, 0); }
    P('circuit_board', -5.5, 39.5, 20, { y: .8, collide: false }); P('retro_multimeter', -4.8, 39.6, 160, { y: .79, collide: false }); P('classic_laptop', 0, 39.5, 0, { y: .79, collide: false });
    P('metal_tool_chest', 5.2, 39.5, 0, { y: .79, collide: false, scale: .8 }); P('steel_frame_shelves_03', -8.5, 34, 90); P('steel_frame_shelves_03', -8.5, 37, 90);
    P('industrial_storage_cart', 7.6, 33, 90); P('old_military_crate', 6.5, 36.5, 0); P('wooden_military_crate', -6.5, 31, 0); P('portable_generator', 8.2, 41, 180);
    for (const [x, z] of [[-4.5, 33], [4.5, 33], [-4.5, 38.5], [4.5, 38.5]] as const) this.lamp(x, z, 3.6, .9);
    this.screen('labWall', 0, 1.9, 41.84, 0, 3, 1.5);
  }
}
