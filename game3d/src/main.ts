import {
  Color3, Color4, CubeTexture, DefaultRenderingPipeline, DirectionalLight, Engine, GlowLayer, HemisphericLight, ImageProcessingConfiguration,
  MeshBuilder, Scene, ShadowGenerator, SSAO2RenderingPipeline, Vector3,
} from '@babylonjs/core';
import { Assets } from './engine/assets';
import { Audio } from './engine/audio';
import { Input } from './engine/input';
import { Interactions } from './engine/interact';
import { CHAR_FILES, Character, PlayerController } from './engine/player';
import { Director } from './game/director';
import { Hud } from './ui/hud';
import { buildTacticalTable, LaunchSite, Upgrades } from './world/extras';
import { HQ, MODELS } from './world/hq';
import { Npc, STAFF } from './world/npc';

type Quality = 'low' | 'medium' | 'high';
const params = new URLSearchParams(location.search);
const canvas = document.getElementById('c') as HTMLCanvasElement;
const isTouch = matchMedia('(pointer:coarse)').matches;
/** pick a safe default from the GPU: phones and integrated / software GPUs start on the light tiers */
function detectQuality(): Quality {
  if (isTouch) return 'low';
  try { const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl'); if (!gl) return 'low';
    const ext = gl.getExtension('WEBGL_debug_renderer_info'); const r = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    if (/swiftshader|llvmpipe|software|basic render|mali|adreno|powervr/i.test(r)) return 'low';
    if (/intel|uhd|iris|apple m\d|radeon\(tm\) graphics|vega \d+ graphics/i.test(r)) return 'medium';
    return 'high'; } catch { return 'low'; }
}
const safe = (q: string | null): Quality | null => q === 'low' || q === 'medium' || q === 'high' ? q : null;
let quality: Quality = safe(params.get('q')) ?? safe(localStorage.getItem('ww3d_q')) ?? detectQuality();
// a previous visit crashed the GPU before the game finished starting: step down one tier automatically
if (!params.get('q') && localStorage.getItem('ww3d_booting') === '1') { quality = quality === 'high' ? 'medium' : 'low'; localStorage.setItem('ww3d_q', quality); }
localStorage.setItem('ww3d_booting', '1');
function fatal(msg: string) { const l = document.getElementById('load')!; l.style.display = 'flex'; l.style.opacity = '1';
  document.getElementById('loadTxt')!.textContent = msg; const b = document.getElementById('start')!; b.style.display = 'block'; b.textContent = 'أعد التشغيل بجودة أخف';
  b.onclick = () => { localStorage.setItem('ww3d_q', 'low'); localStorage.removeItem('ww3d_booting'); location.search = ''; }; }
addEventListener('error', e => { if (!(window as unknown as { __game?: unknown }).__game) fatal('تعذر تشغيل اللعبة: ' + (e.message || 'خطأ غير معروف')); });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fatal('كرت الشاشة توقف عن الرسم (الذاكرة ما كفت). شغّلها بجودة أخف.'); });

const stage = (n: string) => { (window as unknown as { __boot: string[] }).__boot = [...((window as unknown as { __boot?: string[] }).__boot ?? []), n + '@' + Math.round(performance.now())]; };
async function boot() {
  stage('boot');
  const engine = new Engine(canvas, quality !== 'low', { stencil: true, powerPreference: 'high-performance', adaptToDeviceRatio: false });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(.01, .012, .016, 1); scene.collisionsEnabled = true; scene.skipPointerMovePicking = true;
  const hud = new Hud(), input = new Input(canvas, document.getElementById('ui')!), assets = new Assets(scene, quality), inter = new Interactions(), audio = new Audio();

  // ---- lighting: image-based ambient from an indoor HDRI + a soft overhead key that casts the contact shadows
  // pre-filtered .env (RGBD in PNG): no float-texture support needed, works on phones; HDR only as a fallback
  const env = CubeTexture.CreateFromPrefilteredData(import.meta.env.BASE_URL + 'assets/env/hq.env', scene);
  scene.environmentTexture = env; scene.environmentIntensity = .8;
  const hemi = new HemisphericLight('fill', new Vector3(0, 1, 0), scene); hemi.intensity = .3; hemi.groundColor = new Color3(.9, .88, .84); hemi.specular = Color3.Black();
  const key = new DirectionalLight('key', new Vector3(-.22, -1, .16), scene); key.intensity = 1.1; key.diffuse = new Color3(1, .97, .92);
  key.autoUpdateExtends = false; key.orthoLeft = -22; key.orthoRight = 24; key.orthoBottom = -30; key.orthoTop = 30; key.position.set(4, 30, 16); key.shadowMinZ = 1; key.shadowMaxZ = 60;
  const shadow = new ShadowGenerator(quality === 'high' ? 4096 : quality === 'medium' ? 2048 : 1024, key);
  shadow.usePercentageCloserFiltering = true; shadow.filteringQuality = quality === 'high' ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_LOW;
  shadow.bias = .0012; shadow.normalBias = .012; shadow.darkness = .25;
  assets.shadow = shadow;

  await assets.preload(MODELS, CHAR_FILES, (d, t) => hud.loading(d / t, 'تحميل المقر…'));
  stage('assets'); const hq = new HQ(scene, assets, inter); hq.build(); buildTacticalTable(scene, assets, hq, 12.5, 13);
  const body = new Character(scene, assets, 'player', 'officer'); body.teleport(0, -3.4, 0);
  const player = new PlayerController(scene, body, input);
  const npcs = new Map<string, Npc>();
  STAFF.forEach(def => { const n = new Npc(scene, assets, def); npcs.set(def.id, n);
    if (!n.seated) { const c = MeshBuilder.CreateBox('npcCol', { width: .55, height: 1.8, depth: .55 }, scene); c.position.set(def.x, .9, def.z); c.isVisible = false; c.checkCollisions = true; c.metadata = { cameraBlock: false }; c.freezeWorldMatrix(); } });
  const site = new LaunchSite(scene, assets, player.camera), upgrades = new Upgrades(scene, assets, hq);
  stage('world'); const director = new Director(scene, hud, audio, hq, inter, player, npcs, site, upgrades);

  // ---- post-processing
  const pipe = new DefaultRenderingPipeline('pipe', true, scene, [player.camera]);
  pipe.samples = quality === 'high' ? 4 : quality === 'medium' ? 2 : 1; pipe.fxaaEnabled = true;
  pipe.bloomEnabled = quality !== 'low'; pipe.bloomThreshold = .82; pipe.bloomWeight = .28; pipe.bloomKernel = 48; pipe.bloomScale = .5;
  pipe.imageProcessing.toneMappingEnabled = true; pipe.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  pipe.imageProcessing.exposure = 1.45; pipe.imageProcessing.contrast = 1.18;
  pipe.imageProcessing.vignetteEnabled = true; pipe.imageProcessing.vignetteWeight = 1.6; pipe.imageProcessing.vignetteColor = new Color4(0, 0, 0, 1);
  pipe.sharpenEnabled = quality === 'high'; pipe.sharpen.edgeAmount = .18;
  if (quality === 'high' && SSAO2RenderingPipeline.IsSupported) {
    const ssao = new SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: quality === 'high' ? .75 : .5, blurRatio: 1 }, [player.camera]);
    ssao.radius = 1.6; ssao.totalStrength = 1.15; ssao.base = .08; ssao.samples = quality === 'high' ? 16 : 8; ssao.maxZ = 60; ssao.minZAspect = .3; ssao.expensiveBlur = quality === 'high';
  }
  const glow = new GlowLayer('glow', scene, { mainTextureRatio: quality === 'low' ? .25 : .5, blurKernelSize: quality === 'low' ? 16 : 32 }); glow.intensity = .45;
  glow.customEmissiveColorSelector = (mesh, _sub, _mat, result) => { const em = (mesh.material as { emissiveColor?: Color3 } | null)?.emissiveColor; if (mesh.metadata?.noGlow || !em) result.set(0, 0, 0, 0); else result.set(em.r, em.g, em.b, 1); };
  engine.setHardwareScalingLevel(quality === 'low' ? Math.max(1, devicePixelRatio > 2 ? 1.6 : 1.25) : 1 / Math.min(devicePixelRatio || 1, quality === 'high' ? 1.5 : 1));

  // ---- loop
  let paused = false, started = params.has('autostart'), stride = 0, wasGrounded = true; const doorTarget = hq.doors.map(() => 0);
  const menu = () => { input.releasePointer(); paused = true; hud.modal('القائمة', `<p>${director.objective()}</p><p class="mu">جودة الرسومات (يعاد التحميل عند التغيير):</p>`,
    [...(['low', 'medium', 'high'] as Quality[]).map(q => ({ label: { low: 'موفّرة', medium: 'متوسطة', high: 'عالية' }[q], sel: q === quality, fn: () => { director.save(); localStorage.setItem('ww3d_q', q); location.search = ''; } })),
      { label: 'حفظ', fn: () => { director.save(); hud.closeModal(); hud.toast('تم الحفظ.'); } }, { label: 'رجوع للعبة', primary: true }], () => { paused = false; }); };
  document.getElementById('dlgBar')!.addEventListener('click', e => { if (!(e.target as HTMLElement).closest('button')) input.press('interact'); });
  const frame = (dt: number) => {
    input.enabled = started && !hud.modalOpen && !hud.dialogueOpen && !site.active;
    input.update();
    if (!started) { /* world below still updates so the first frames match play (lights culled, NPCs posed) */ }
    else if (site.active) { site.update(dt); input.hit('interact'); input.hit('jump'); input.hit('menu'); input.hit('back'); }
    else if (hud.modalOpen) { if (input.hit('back')) hud.closeModal(); input.hit('interact'); input.hit('jump'); input.hit('menu'); }
    else if (hud.dialogueOpen) { hud.prompt(null, ''); if (input.hit('interact') || input.hit('jump')) { hud.advanceDialogue(); audio.talk(); } input.hit('menu'); input.hit('back'); player.frozen = true; player.update(dt); }
    else if (!paused) {
      if (input.hit('menu') || input.hit('back')) menu();
      player.frozen = director.busy; player.update(dt);
      const cur = director.busy ? null : inter.update(body.position, player.camera.getDirection(Vector3.Forward()));
      hud.prompt(cur ? cur.prompt() : null, input.usingTouch ? '' : input.usingPad ? 'X' : 'E');
      if (cur && input.hit('interact')) cur.use(); else input.hit('interact');
      // footsteps follow the distance covered; a thud on touchdown
      if (body.grounded && body.speed > .5) { stride += body.speed * dt; const len = body.speed > 4.5 ? 1.9 : body.speed > 2 ? 1.35 : .8; if (stride > len) { stride = 0; audio.step(body.speed > 3); } }
      if (body.grounded && !wasGrounded) audio.land(); wasGrounded = body.grounded;
    }
    const p = site.active ? player.camera.position : body.position;
    hq.doors.forEach((d, i) => { d.update(dt, body.position.x, body.position.z); if (d.target !== doorTarget[i]) { doorTarget[i] = d.target; audio.door(); } });
    hq.lights.forEach(l => { const d = Math.hypot(l.pos.x - p.x, l.pos.z - p.z); const k = d < 12 ? 1 : d > 17 ? 0 : (17 - d) / 5; l.light.intensity = l.base * k; l.light.setEnabled(k > 0); });
    key.setEnabled(!site.active); hemi.intensity = site.active ? .06 : .3; scene.environmentIntensity = site.active ? .12 : .8;
    npcs.forEach(n => { if (Math.hypot(n.body.position.x - p.x, n.body.position.z - p.z) < 26) n.update(dt, body.position.x, body.position.z); });
    director.update(dt); upgrades.update(dt);
    if (!site.active) { hud.location(hq.roomAt(body.position.x, body.position.z)?.name ?? 'خارج المقر'); hud.objective(hud.modalOpen ? null : director.objective()); }
  };
  engine.runRenderLoop(() => { frame(Math.min(engine.getDeltaTime() / 1000, .05)); scene.render(); hud.fps(engine.getFps()); });
  addEventListener('resize', () => engine.resize());
  addEventListener('beforeunload', () => { if (started) director.save(); });

  stage('loop'); await scene.whenReadyAsync(); stage('ready');
  localStorage.removeItem('ww3d_booting');
  const hasSave = Director.hasSave() && !params.has('new');
  const begin = (load: boolean) => { started = true; audio.unlock(); const ok = load && director.load(); director.start(ok); if (!isTouch && !hud.modalOpen) canvas.requestPointerLock?.(); canvas.focus(); };
  hud.ready(() => begin(hasSave), hasSave ? 'تابع اللعبة' : 'ابدأ الأزمة', hasSave ? () => { localStorage.removeItem('ww3d_save_v1'); begin(false); } : undefined);
  if (started) { hud.hideLoading(); director.start(!params.has('new') && director.load()); }
  (window as unknown as Record<string, unknown>).__game = { engine, scene, player, body, hq, inter, input, hud, pipe, key, shadow, director, site, upgrades, npcs, audio, frame, get ready() { return true; } };
}
boot().catch(e => { console.error(e); document.getElementById('loadTxt')!.textContent = 'تعذر تشغيل اللعبة: ' + (e?.message ?? e); });
