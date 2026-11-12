// Third-person character: camera-relative movement with acceleration, sprint, jump, animation blending and a
// spring-arm camera that never clips through walls.
import { AbstractMesh, AnimationGroup, Color3, FreeCamera, Mesh, MeshBuilder, PBRMaterial, Ray, Scalar, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { Assets } from './assets';
import { Input } from './input';

const WALK = 1.7, JOG = 3.9, SPRINT = 6.3, ACCEL = 26, DECEL = 30, AIR_CONTROL = .35, GRAVITY = -19, JUMP = 5.7, TURN = 13;
const RADIUS = .34, HEIGHT = 1.8;
const FACE_OFFSET = 0;   // the avatar's forward axis relative to +Z after the glTF handedness flip

export const CHAR_FILES = ['human', 'anim_idle', 'anim_idle2', 'anim_walk', 'anim_jog', 'anim_run', 'anim_jump', 'anim_fall', 'anim_talk', 'anim_talk2'];
const CLIP_SPEED: Record<string, number> = { walk: 1.67, jog: 3.6, run: 5.6 };   // metres per second the mocap was recorded at
export interface Look { top?: Color3; bottom?: Color3; shoes?: Color3; skin?: Color3; hair?: Color3; cap?: Color3; hat?: boolean }

export class Character {
  readonly root: Mesh;                     // collision capsule (ellipsoid), centre at HEIGHT/2 above the feet
  readonly visual: TransformNode;
  private clips: Record<string, AnimationGroup> = {};
  private weights: Record<string, number> = {};
  velocity = new Vector3(); grounded = true; private airTime = 0; facing = 0; speed = 0;
  /** when set, this clip plays instead of the locomotion blend (e.g. 'talk') */
  pose: string | null = null;
  constructor(readonly scene: Scene, assets: Assets, name: string, look: Look = {}) {
    this.root = MeshBuilder.CreateBox('char:' + name, { size: .1 }, scene);
    this.root.isVisible = false; this.root.isPickable = false;
    this.root.ellipsoid = new Vector3(RADIUS, HEIGHT / 2, RADIUS); this.root.checkCollisions = false;
    this.visual = new TransformNode('vis:' + name, scene); this.visual.parent = this.root; this.visual.position.y = -HEIGHT / 2;
    const inst = assets.container('human').instantiateModelsToScene(n => n, true, { doNotInstantiate: true });
    inst.rootNodes.forEach(r => { r.parent = this.visual; });
    const nodes = new Map<string, TransformNode>();
    this.visual.getChildTransformNodes(false).forEach(n => nodes.set(n.name, n));
    // skinned meshes report unreliable bounds, so measure the skeleton: lowest joint to highest joint
    let lo = 1e9, hi = -1e9;
    nodes.forEach(n => { n.computeWorldMatrix(true); const y = n.getAbsolutePosition().y; lo = Math.min(lo, y); hi = Math.max(hi, y); });
    const holder = inst.rootNodes[0] as TransformNode; const k = hi - lo > 1e-4 ? HEIGHT / (hi - lo) : 1;
    this.visual.computeWorldMatrix(true); holder.scaling.scaleInPlace(k); holder.position.y -= (lo - this.visual.getAbsolutePosition().y) * k;
    const meshes = this.visual.getChildMeshes(false);
    meshes.forEach(m => { m.isPickable = false; m.alwaysSelectAsActiveMesh = true; m.receiveShadows = true; m.metadata = { noGlow: true }; if (assets.shadow) assets.shadow.addShadowCaster(m, false);
      const mat = m.material as PBRMaterial | null; if (!mat) return; mat.maxSimultaneousLights = 8;
      const tint = mat.name.includes('Outfit_Top') ? look.top : mat.name.includes('Outfit_Bottom') ? look.bottom : mat.name.includes('Footwear') ? look.shoes : /Skin|Body/.test(mat.name) ? look.skin : /Beard|Hair/.test(mat.name) ? look.hair : mat.name.includes('Headwear') ? look.cap : undefined;
      // uniform: drop the civilian cloth print and keep only the fabric folds (normal map) under a plain service colour
      if (tint) { if (/Outfit|Footwear/.test(mat.name)) { mat.albedoTexture = null; mat.roughness = .82; mat.metallic = 0; mat.metallicTexture = null; } mat.albedoColor = tint; } });
    // retarget the mocap clips onto this body by joint name; drop root motion (the controller owns the position)
    for (const key of ['idle', 'idle2', 'walk', 'jog', 'run', 'jump', 'fall', 'talk', 'talk2']) {
      if (!assets.has('anim_' + key)) continue;
      const src = assets.container('anim_' + key).animationGroups[0]; if (!src) continue;
      const g = new AnimationGroup(name + ':' + key, scene);
      for (const ta of src.targetedAnimations) {
        const target = nodes.get((ta.target as TransformNode).name); if (!target) continue;
        let anim = ta.animation;
        if (target.name === 'Hips' && anim.targetProperty === 'position') {
          anim = anim.clone(); const keys = anim.getKeys(); const x0 = keys[0].value.x, z0 = keys[0].value.z;
          keys.forEach(kf => { kf.value = new Vector3(x0, kf.value.y, z0); }); anim.setKeys(keys);
        }
        g.addTargetedAnimation(anim, target);
      }
      g.normalize(src.from, src.to); this.clips[key] = g; this.weights[key] = key === 'idle' ? 1 : 0;
      g.start(true); g.setWeightForAllAnimatables(this.weights[key]);
    }
  }
  get position() { return this.root.position; }
  teleport(x: number, z: number, facingDeg = 0) { this.root.position.set(x, HEIGHT / 2 + .02, z); this.facing = facingDeg * Math.PI / 180; this.visual.rotation.y = this.facing + FACE_OFFSET; this.velocity.setAll(0); }

  /** wishX/Z: desired horizontal direction (length 0..1) in world space. Moves with collisions. */
  step(dt: number, wishX: number, wishZ: number, maxSpeed: number, jump: boolean) {
    const v = this.velocity, wl = Math.hypot(wishX, wishZ);
    const tx = wishX * maxSpeed, tz = wishZ * maxSpeed;
    const rate = (wl > .01 ? ACCEL : DECEL) * (this.grounded ? 1 : AIR_CONTROL) * dt;
    const dx = tx - v.x, dz = tz - v.z, dl = Math.hypot(dx, dz);
    if (dl <= rate) { v.x = tx; v.z = tz; } else { v.x += dx / dl * rate; v.z += dz / dl * rate; }
    if (this.grounded) { this.airTime = 0; if (v.y < 0) v.y = -2; } else this.airTime += dt;
    if (jump && this.airTime < .12) { v.y = JUMP; this.grounded = false; this.airTime = 1; }
    v.y += GRAVITY * dt;
    const before = this.root.position.y, bx = this.root.position.x, bz = this.root.position.z;
    this.root.moveWithCollisions(v.scale(dt));
    const movedY = this.root.position.y - before;
    // walking into a wall: keep only the velocity that actually moved us, so the legs stop instead of running on the spot
    if (dt > 0) { const ax = (this.root.position.x - bx) / dt, az = (this.root.position.z - bz) / dt; if (Math.hypot(ax, az) < Math.hypot(v.x, v.z) * .6) { v.x = ax; v.z = az; } }
    this.grounded = v.y <= 0 && movedY > v.y * dt + 1e-4;
    if (this.grounded) v.y = 0;
    if (this.root.position.y < -20) this.teleport(0, -5);
    this.speed = Math.hypot(v.x, v.z);
    if (wl > .05) { const target = Math.atan2(wishX, wishZ); let d = target - this.facing; d = Math.atan2(Math.sin(d), Math.cos(d)); this.facing += d * Math.min(1, TURN * dt); }
    this.visual.rotation.y = this.facing + FACE_OFFSET;
    this.animate(dt);
  }
  /** turn smoothly towards a world point (used by NPCs and conversations) */
  faceTowards(x: number, z: number, dt: number) { const t = Math.atan2(x - this.position.x, z - this.position.z); let d = t - this.facing; d = Math.atan2(Math.sin(d), Math.cos(d)); this.facing += d * Math.min(1, 6 * dt); this.visual.rotation.y = this.facing + FACE_OFFSET; }
  animate(dt: number) {
    const s = this.speed; const t: Record<string, number> = {};
    if (this.pose && this.clips[this.pose]) t[this.pose] = 1;
    else if (!this.grounded && this.airTime > .12) t[this.velocity.y > 1 && this.clips.jump ? 'jump' : 'fall'] = 1;
    else if (s < .12) t.idle = 1;
    else if (s < CLIP_SPEED.walk) { const k = s / CLIP_SPEED.walk; t.walk = Math.max(k, .6); t.idle = 1 - t.walk; }
    else if (s < CLIP_SPEED.jog) { const k = (s - CLIP_SPEED.walk) / (CLIP_SPEED.jog - CLIP_SPEED.walk); t.jog = k; t.walk = 1 - k; }
    else { const k = Scalar.Clamp((s - CLIP_SPEED.jog) / (CLIP_SPEED.run - CLIP_SPEED.jog), 0, 1); t.run = k; t.jog = 1 - k; }
    for (const n in this.clips) {
      const w = this.weights[n] = Scalar.Lerp(this.weights[n], t[n] ?? 0, Math.min(1, dt * (n === 'jump' || n === 'fall' ? 14 : 9)));
      this.clips[n].setWeightForAllAnimatables(w < .002 ? 0 : w);
    }
    for (const n of ['walk', 'jog', 'run']) if (this.clips[n]) this.clips[n].speedRatio = Scalar.Clamp(s / CLIP_SPEED[n], .75, 1.35);
  }
}

export class PlayerController {
  yaw = 0; pitch = .16; private dist = 3.3; private wantDist = 3.3;
  readonly camera: FreeCamera;
  private ray = new Ray(Vector3.Zero(), Vector3.Forward(), 1);
  frozen = false;
  constructor(readonly scene: Scene, readonly body: Character, readonly input: Input) {
    this.camera = new FreeCamera('cam', new Vector3(0, 2, -4), scene);
    this.camera.minZ = .08; this.camera.maxZ = 400; this.camera.fov = 1.02; this.camera.inputs.clear();
    scene.activeCamera = this.camera;
  }
  update(dt: number) {
    const i = this.input;
    this.yaw += i.lookDX; this.pitch = Scalar.Clamp(this.pitch + i.lookDY, -.55, 1.15); i.lookDX = 0; i.lookDY = 0;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = 0, wz = 0, max = 0;
    if (!this.frozen) {
      wx = i.moveX * cos + i.moveY * sin; wz = -i.moveX * sin + i.moveY * cos;
      const mag = Math.hypot(i.moveX, i.moveY);
      max = i.walk || mag < .55 ? WALK : i.sprint ? SPRINT : JOG;
      if (mag > 0 && mag < .55) { wx /= mag; wz /= mag; }      // gentle stick tilt = full walk speed
    }
    this.body.step(dt, wx, wz, max, !this.frozen && i.hit('jump'));
    this.updateCamera(dt);
  }
  private updateCamera(dt: number) {
    const p = this.body.position, cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const fwd = new Vector3(Math.sin(this.yaw) * cp, -sp, Math.cos(this.yaw) * cp);
    const right = new Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const pivot = new Vector3(p.x, p.y + .62, p.z).addInPlace(right.scale(.42));
    // keep the shoulder offset from poking through a wall
    this.ray.origin.set(p.x, p.y + .62, p.z); this.ray.direction.copyFrom(right); this.ray.length = .62;
    const side = this.scene.pickWithRay(this.ray, blocks);
    if (side?.hit) pivot.copyFrom(this.ray.origin).addInPlace(right.scale(Math.max(0, side.distance - .2)));
    this.wantDist = this.body.speed > 5 ? 3.7 : 3.3;
    this.ray.origin.copyFrom(pivot); this.ray.direction.copyFrom(fwd).scaleInPlace(-1); this.ray.length = this.wantDist + .25;
    const hit = this.scene.pickWithRay(this.ray, blocks);
    const allowed = hit?.hit ? Math.max(.35, hit.distance - .22) : this.wantDist;
    this.dist = allowed < this.dist ? allowed : Scalar.Lerp(this.dist, allowed, Math.min(1, dt * 6));   // snap in, ease out
    this.camera.position.copyFrom(pivot).addInPlace(fwd.scale(-this.dist));
    this.camera.setTarget(pivot.add(fwd.scale(4)));
    this.camera.fov = Scalar.Lerp(this.camera.fov, this.body.speed > 5 ? 1.12 : 1.02, Math.min(1, dt * 4));
  }
}
const blocks = (m: AbstractMesh) => m.checkCollisions && m.isEnabled() && (m.metadata?.cameraBlock ?? true);
