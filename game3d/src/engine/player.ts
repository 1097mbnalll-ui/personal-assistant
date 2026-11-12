// Third-person character: camera-relative movement with acceleration, sprint, jump, animation blending and a
// spring-arm camera that never clips through walls.
import { AbstractMesh, AnimationGroup, FreeCamera, Mesh, MeshBuilder, PBRMaterial, Ray, Scalar, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { Assets } from './assets';
import { Input } from './input';

const WALK = 1.35, JOG = 3.4, SPRINT = 6.0, ACCEL = 26, DECEL = 30, AIR_CONTROL = .35, GRAVITY = -19, JUMP = 5.7, TURN = 13;
const RADIUS = .34, HEIGHT = 1.8;
const FACE_OFFSET = 0;   // the avatar's forward axis relative to +Z after the glTF handedness flip

export const CLIPS = ['idle', 'idle2', 'look', 'walk', 'jog', 'run', 'talk', 'talk2', 'present', 'listen', 'nod', 'sit', 'work', 'docs'];
export const MODELS_CHAR = ['officer', 'soldier_a', 'soldier_b', 'commander', 'soldier_f'];
export const CHAR_FILES = [...MODELS_CHAR, ...CLIPS.map(c => 'anim_' + c)];
/** metres per second each locomotion clip was authored at; measured from its root motion on first use */
const CLIP_SPEED: Record<string, number> = { walk: 1.5, jog: 3.4, run: 5.6 };

export class Character {
  readonly root: Mesh;                     // collision capsule (ellipsoid), centre at HEIGHT/2 above the feet
  readonly visual: TransformNode;
  private clips: Record<string, AnimationGroup> = {};
  private weights: Record<string, number> = {};
  velocity = new Vector3(); grounded = true; private airTime = 0; facing = 0; speed = 0;
  /** when set, this clip plays instead of the locomotion blend (e.g. 'talk', 'sit') */
  pose: string | null = null;
  constructor(readonly scene: Scene, assets: Assets, readonly name: string, model = 'officer') {
    this.root = MeshBuilder.CreateBox('char:' + name, { size: .1 }, scene);
    this.root.isVisible = false; this.root.isPickable = false;
    this.root.ellipsoid = new Vector3(RADIUS, HEIGHT / 2, RADIUS); this.root.checkCollisions = false;
    this.visual = new TransformNode('vis:' + name, scene); this.visual.parent = this.root; this.visual.position.y = -HEIGHT / 2;
    const inst = assets.container(model).instantiateModelsToScene(n => n, false, { doNotInstantiate: true });
    inst.rootNodes.forEach(r => { r.parent = this.visual; });
    const nodes = new Map<string, TransformNode>();
    this.visual.getChildTransformNodes(false).forEach(n => nodes.set(n.name, n));
    // skinned meshes report unreliable bounds, so measure the skeleton: lowest joint to highest joint (~93% of body height)
    let lo = 1e9, hi = -1e9;
    nodes.forEach(n => { n.computeWorldMatrix(true); const y = n.getAbsolutePosition().y; lo = Math.min(lo, y); hi = Math.max(hi, y); });
    const holder = inst.rootNodes[0] as TransformNode; const k = hi - lo > 1e-4 ? HEIGHT * .93 / (hi - lo) : 1;
    this.visual.computeWorldMatrix(true); holder.scaling.scaleInPlace(k); holder.position.y -= (lo - this.visual.getAbsolutePosition().y) * k;
    this.visual.getChildMeshes(false).forEach(m => { m.isPickable = false; m.alwaysSelectAsActiveMesh = true; m.receiveShadows = true; m.metadata = { noGlow: true }; if (assets.shadow) assets.shadow.addShadowCaster(m, false);
      const mat = m.material as PBRMaterial | null; if (mat) { mat.maxSimultaneousLights = 8; mat.environmentIntensity = .9; } });
    // attach the shared clips to this body by joint name; root motion is removed (the controller owns the position)
    const bip = nodes.get('Bip01'); bip?.computeWorldMatrix(true);
    const unit = bip?.parent ? (bip.parent as TransformNode).absoluteScaling.x : 1;
    for (const key of CLIPS) {
      if (!assets.has('anim_' + key)) continue;
      const src = assets.container('anim_' + key).animationGroups[0]; if (!src) continue;
      const g = new AnimationGroup(name + ':' + key, scene);
      for (const ta of src.targetedAnimations) {
        const target = nodes.get((ta.target as TransformNode).name); if (!target) continue;
        let anim = ta.animation;
        if (target.name === 'Bip01' && anim.targetProperty === 'position') {
          anim = anim.clone(); const keys = anim.getKeys(); const f0 = keys[0].frame, span = keys[keys.length - 1].frame - f0 || 1;
          const drift = (keys[keys.length - 1].value as Vector3).subtract(keys[0].value as Vector3);
          if (CLIP_SPEED[key] !== undefined && drift.length() * unit > .3) CLIP_SPEED[key] = drift.length() * unit / ((src.to - src.from) / (anim.framePerSecond || 60));
          keys.forEach(kf => { kf.value = (kf.value as Vector3).subtract(drift.scale((kf.frame - f0) / span)); }); anim.setKeys(keys);
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
    const s = this.speed; const t: Record<string, number> = {}; const air = !this.grounded && this.airTime > .12;
    if (this.pose && this.clips[this.pose]) t[this.pose] = 1;
    else if (air) t.jog = 1;                                   // no jump clip in the library: hold a slowed stride in the air
    else if (s < .12) t.idle = 1;
    else if (s < CLIP_SPEED.walk) { t.walk = Math.max(s / CLIP_SPEED.walk, .6); t.idle = 1 - t.walk; }
    else if (s < CLIP_SPEED.jog) { const k = (s - CLIP_SPEED.walk) / (CLIP_SPEED.jog - CLIP_SPEED.walk); t.jog = k; t.walk = 1 - k; }
    else { const k = Scalar.Clamp((s - CLIP_SPEED.jog) / Math.max(.1, CLIP_SPEED.run - CLIP_SPEED.jog), 0, 1); t.run = k; t.jog = 1 - k; }
    for (const n in this.clips) {
      const w = this.weights[n] = Scalar.Lerp(this.weights[n], t[n] ?? 0, Math.min(1, dt * 9));
      this.clips[n].setWeightForAllAnimatables(w < .002 ? 0 : w);
    }
    for (const n of ['walk', 'jog', 'run']) if (this.clips[n]) this.clips[n].speedRatio = air ? .3 : Scalar.Clamp(s / CLIP_SPEED[n], .7, 1.4);
  }
  clipSpeeds() { return { ...CLIP_SPEED }; }
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
