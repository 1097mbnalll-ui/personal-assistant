// Staff of the headquarters. Each NPC is a full animated human; some sit at their desks, some can be spoken to.
import { Scene } from '@babylonjs/core';
import { Assets } from '../engine/assets';
import { Character } from '../engine/player';

export interface NpcDef { id: string; name: string; rank: string; model: string; x: number; z: number; facing: number; pose: string; talkable?: boolean; seatY?: number }

export class Npc {
  readonly body: Character; private baseFacing: number; talking = false; private idleTimer = 4 + Math.random() * 6;
  constructor(scene: Scene, assets: Assets, readonly def: NpcDef) {
    this.body = new Character(scene, assets, 'npc:' + def.id, def.model);
    this.body.teleport(def.x, def.z, def.facing); this.baseFacing = def.facing * Math.PI / 180;
    if (def.seatY) this.body.root.position.y += def.seatY;
    this.body.pose = def.pose; this.body.grounded = true;
  }
  get seated() { return this.def.pose === 'sit' || this.def.pose === 'work'; }
  update(dt: number, px: number, pz: number) {
    const b = this.body, d = Math.hypot(px - b.position.x, pz - b.position.z);
    if (this.talking) { b.faceTowards(px, pz, dt); }
    else if (!this.seated) {
      if (d < 3.2 && this.def.talkable) { b.faceTowards(px, pz, dt); b.pose = 'listen'; }
      else { let diff = this.baseFacing - b.facing; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); b.facing += diff * Math.min(1, dt * 3); b.visual.rotation.y = b.facing;
        this.idleTimer -= dt; if (this.idleTimer < 0) { this.idleTimer = 7 + Math.random() * 9; b.pose = b.pose === this.def.pose ? 'look' : this.def.pose; } if (b.pose === 'listen') b.pose = this.def.pose; }
    }
    b.speed = 0; b.animate(dt);
  }
  say(pose: string | null) { this.talking = pose !== null; this.body.pose = pose ?? this.def.pose; }
}

/** who works where (positions match the furniture in world/hq.ts) */
export const STAFF: NpcDef[] = [
  { id: 'intel_chief', name: 'العقيد سالم الحربي', rank: 'مدير الاستخبارات', model: 'commander', x: -9, z: 18.4, facing: 180, pose: 'idle', talkable: true },
  { id: 'analyst1', name: 'محلّل', rank: 'رقيب أول', model: 'soldier_a', x: -12.5, z: 10.45, facing: 180, pose: 'sit', seatY: -.42 },
  { id: 'analyst2', name: 'محلّلة', rank: 'عريف', model: 'soldier_f', x: -8.5, z: 14.45, facing: 180, pose: 'sit', seatY: -.42 },
  { id: 'ops_chief', name: 'العميد ناصر العتيبي', rank: 'قائد غرفة العمليات', model: 'soldier_b', x: 10.6, z: 13, facing: 90, pose: 'idle2', talkable: true },
  { id: 'ops1', name: 'ضابط مناوب', rank: 'ملازم', model: 'soldier_a', x: 6.0, z: 10, facing: 90, pose: 'sit', seatY: -.42 },
  { id: 'ops2', name: 'ضابط إنذار', rank: 'ملازم', model: 'soldier_b', x: 14.0, z: 16, facing: 90, pose: 'sit', seatY: -.42 },
  { id: 'lab_chief', name: 'المهندس خالد الدوسري', rank: 'رئيس مختبر الأبحاث', model: 'soldier_a', x: 2.2, z: 37.6, facing: 200, pose: 'idle2', talkable: true },
  { id: 'guard', name: 'حارس', rank: 'جندي', model: 'soldier_b', x: 1.45, z: 1.2, facing: 250, pose: 'idle2' },
];
