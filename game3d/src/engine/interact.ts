// Things the player can use: doors, terminals, people. One prompt at a time, nearest and roughly in view wins.
import { Vector3 } from '@babylonjs/core';

export interface Interactable { id: string; pos: Vector3; radius: number; prompt: () => string | null; use: () => void }

export class Interactions {
  private list: Interactable[] = [];
  current: Interactable | null = null;
  add(i: Interactable) { this.list.push(i); return i; }
  find(id: string) { return this.list.find(i => i.id === id) ?? null; }
  all() { return this.list; }
  update(playerPos: Vector3, camForward: Vector3) {
    let best: Interactable | null = null, bestScore = 1e9;
    for (const i of this.list) {
      const dx = i.pos.x - playerPos.x, dz = i.pos.z - playerPos.z, d = Math.hypot(dx, dz);
      if (d > i.radius || Math.abs(i.pos.y - playerPos.y) > 2.2 || i.prompt() == null) continue;
      const facing = d < .6 ? 1 : (dx * camForward.x + dz * camForward.z) / d;
      if (facing < -.25) continue;
      const score = d - facing * .8;
      if (score < bestScore) { bestScore = score; best = i; }
    }
    this.current = best;
    return best;
  }
}
