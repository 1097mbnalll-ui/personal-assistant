import {
  Color3, Color4, DefaultRenderingPipeline, DirectionalLight, Engine, GlowLayer, HDRCubeTexture, HemisphericLight, ImageProcessingConfiguration,
  Scene, ShadowGenerator, SSAO2RenderingPipeline, Vector3,
} from '@babylonjs/core';
import { Assets } from './engine/assets';
import { Input } from './engine/input';
import { Interactions } from './engine/interact';
import { CHAR_FILES, Character, PlayerController } from './engine/player';
import { HQ, MODELS } from './world/hq';
import { Hud } from './ui/hud';

type Quality = 'low' | 'medium' | 'high';
const params = new URLSearchParams(location.search);
const canvas = document.getElementById('c') as HTMLCanvasElement;
const isTouch = matchMedia('(pointer:coarse)').matches;
let quality: Quality = (params.get('q') as Quality) || (localStorage.getItem('ww3d_q') as Quality) || (isTouch ? 'low' : 'high');

async function boot() {
  const engine = new Engine(canvas, quality !== 'low', { stencil: true, powerPreference: 'high-performance', adaptToDeviceRatio: false });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(.01, .012, .016, 1); scene.collisionsEnabled = true; scene.skipPointerMovePicking = true; scene.autoClear = true;
  const hud = new Hud(); const input = new Input(canvas, document.getElementById('ui')!); const assets = new Assets(scene); const inter = new Interactions();

  // ---- lighting: image-based ambient from an indoor HDRI + a soft overhead key that casts the contact shadows
  const env = new HDRCubeTexture(import.meta.env.BASE_URL + 'assets/env/empty_warehouse_01.hdr', scene, 128, false, true, false, true);
  scene.environmentTexture = env; scene.environmentIntensity = .8;
  const hemi = new HemisphericLight('fill', new Vector3(0, 1, 0), scene); hemi.intensity = .3; hemi.groundColor = new Color3(.9, .88, .84); hemi.specular = Color3.Black();
  const key = new DirectionalLight('key', new Vector3(-.22, -1, .16), scene); key.intensity = 1.1; key.diffuse = new Color3(1, .97, .92);
  key.autoUpdateExtends = false; key.orthoLeft = -22; key.orthoRight = 24; key.orthoBottom = -30; key.orthoTop = 30; key.position.set(4, 30, 16); key.shadowMinZ = 1; key.shadowMaxZ = 60;
  const shadow = new ShadowGenerator(quality === 'high' ? 4096 : quality === 'medium' ? 2048 : 1024, key);
  shadow.usePercentageCloserFiltering = true; shadow.filteringQuality = quality === 'high' ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_LOW;
  shadow.bias = .0012; shadow.normalBias = .012; shadow.darkness = .25;
  assets.shadow = shadow;

  await assets.preload(MODELS, CHAR_FILES, (d, t) => hud.loading(d / t, 'تحميل المقر…'));
  const hq = new HQ(scene, assets, inter); hq.build();
  const body = new Character(scene, assets, 'player', 'officer'); body.teleport(0, -3.4, 0);
  const player = new PlayerController(scene, body, input);

  // ---- post-processing
  const pipe = new DefaultRenderingPipeline('pipe', true, scene, [player.camera]);
  pipe.samples = quality === 'low' ? 1 : 4; pipe.fxaaEnabled = true;
  pipe.bloomEnabled = quality !== 'low'; pipe.bloomThreshold = .82; pipe.bloomWeight = .28; pipe.bloomKernel = 48; pipe.bloomScale = .5;
  pipe.imageProcessing.toneMappingEnabled = true; pipe.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  pipe.imageProcessing.exposure = 1.45; pipe.imageProcessing.contrast = 1.18;
  pipe.imageProcessing.vignetteEnabled = true; pipe.imageProcessing.vignetteWeight = 1.6; pipe.imageProcessing.vignetteColor = new Color4(0, 0, 0, 1);
  pipe.sharpenEnabled = quality === 'high'; pipe.sharpen.edgeAmount = .18;
  if (quality !== 'low' && SSAO2RenderingPipeline.IsSupported) {
    const ssao = new SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: quality === 'high' ? .75 : .5, blurRatio: 1 }, [player.camera]);
    ssao.radius = 1.6; ssao.totalStrength = 1.15; ssao.base = .08; ssao.samples = quality === 'high' ? 16 : 8; ssao.maxZ = 60; ssao.minZAspect = .3; ssao.expensiveBlur = quality === 'high';
  }
  const glow = new GlowLayer('glow', scene, { mainTextureRatio: .5, blurKernelSize: 32 }); glow.intensity = .45; glow.customEmissiveColorSelector = (mesh, _sub, _mat, result) => { const em = (mesh.material as { emissiveColor?: Color3 } | null)?.emissiveColor; if (mesh.metadata?.noGlow || !em) result.set(0, 0, 0, 0); else result.set(em.r, em.g, em.b, 1); };
  engine.setHardwareScalingLevel(quality === 'low' ? Math.max(1, devicePixelRatio > 2 ? 1.6 : 1.25) : 1 / Math.min(devicePixelRatio || 1, quality === 'high' ? 1.5 : 1));

  // ---- a first working terminal: the office laptop shows the facility directory (live data, no placeholders)
  inter.add({ id: 'terminal:office', pos: new Vector3(0, 1, -5.4), radius: 1.5, prompt: () => 'استخدم حاسوب المكتب', use: () => {
    hud.modal('حاسوب القائد · دليل المقر', `<table>${['office', 'corridor', 'intel', 'ops', 'lab'].map(id => { const d = hq.doors.find(q => q.id === id); const r = hq.roomAt(0, 0); void r;
      return `<tr><td>${({ office: 'مكتب القائد', corridor: 'الممر الرئيسي', intel: 'إدارة الاستخبارات', ops: 'غرفة العمليات', lab: 'مختبر الأبحاث' } as Record<string, string>)[id]}</td><td>${d ? (d.locked ? 'LOCKED' : d.open > .5 ? 'OPEN' : 'CLOSED') : '—'}</td></tr>`; }).join('')}</table>
      <p style="color:var(--mu)">حالة الأبواب مباشرة من أنظمة المقر. الإيجاز الاستخباري وغرفة العمليات يتفعّلان في المرحلة الجاية من التطوير.</p>`, [{ label: 'إغلاق', primary: true }]);
  } });

  // ---- wall screens: live facility clock until the simulation feeds them
  const drawScreens = () => { const now = new Date(); const hh = now.toLocaleTimeString('en-GB');
    hq.screens.forEach((t, id) => { const s = t.getSize(), c = t.getContext() as unknown as CanvasRenderingContext2D; c.fillStyle = '#04090e'; c.fillRect(0, 0, s.width, s.height);
      c.strokeStyle = '#123040'; c.lineWidth = 2; for (let x = 0; x < s.width; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, s.height); c.stroke(); } for (let y = 0; y < s.height; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(s.width, y); c.stroke(); }
      c.fillStyle = '#6fd3ff'; c.textAlign = 'center'; c.direction = 'rtl'; c.font = 'bold 54px "Cairo",sans-serif'; c.fillText(({ intelWall: 'إدارة الاستخبارات', opsMain: 'مركز القيادة والسيطرة', opsLeft: 'الإنذار المبكر', opsRight: 'حالة القوات', labWall: 'مختبر الأبحاث' } as Record<string, string>)[id] ?? id, s.width / 2, 90);
      c.fillStyle = '#d9ae55'; c.font = 'bold 120px monospace'; c.direction = 'ltr'; c.fillText(hh, s.width / 2, s.height / 2 + 50);
      c.fillStyle = '#4d6b7c'; c.font = '34px "Cairo",sans-serif'; c.direction = 'rtl'; c.fillText('بانتظار ربط المحاكاة', s.width / 2, s.height - 50); t.update(); }); };
  drawScreens(); setInterval(drawScreens, 1000);

  // ---- loop
  let paused = false, started = params.has('autostart');
  const settings = () => { input.releasePointer(); paused = true; hud.modal('القائمة', `<p>جودة الرسومات (يعاد التحميل عند التغيير):</p>`,
    [...(['low', 'medium', 'high'] as Quality[]).map(q => ({ label: { low: 'موفّرة', medium: 'متوسطة', high: 'عالية' }[q], sel: q === quality, fn: () => { localStorage.setItem('ww3d_q', q); location.search = ''; } })),
      { label: 'رجوع للعبة', primary: true }], () => { paused = false; }); };
  engine.runRenderLoop(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, .05);
    input.enabled = started && !hud.modalOpen;
    input.update();
    if (started && !paused) {
      if (hud.modalOpen) { if (input.hit('back') || input.hit('interact')) hud.closeModal(); input.hit('jump'); input.hit('menu'); }
      else {
        if (input.hit('menu') || input.hit('back')) settings();
        player.frozen = false; player.update(dt);
        const fwd = player.camera.getDirection(Vector3.Forward());
        const cur = inter.update(body.position, fwd);
        hud.prompt(cur ? cur.prompt() : null, input.usingTouch ? '' : input.usingPad ? 'X' : 'E');
        if (cur && input.hit('interact')) cur.use(); else input.hit('interact');
      }
      const p = body.position; hq.doors.forEach(d => d.update(dt, p.x, p.z));
      hq.lights.forEach(l => { const d = Math.hypot(l.pos.x - p.x, l.pos.z - p.z); const k = d < 12 ? 1 : d > 17 ? 0 : (17 - d) / 5; l.light.intensity = l.base * k; l.light.setEnabled(k > 0); });
      hud.location(hq.roomAt(p.x, p.z)?.name ?? 'خارج المقر');
    }
    scene.render();
    hud.fps(engine.getFps());
  });
  addEventListener('resize', () => engine.resize());

  await scene.whenReadyAsync();
  hud.ready(() => { started = true; if (!isTouch) canvas.requestPointerLock?.(); canvas.focus(); });
  if (started) hud.hideLoading();
  (window as unknown as Record<string, unknown>).__game = { engine, scene, player, body, hq, inter, input, hud, pipe, key, shadow, get ready() { return true; } };
}
boot().catch(e => { console.error(e); document.getElementById('loadTxt')!.textContent = 'تعذر تشغيل اللعبة: ' + (e?.message ?? e); });
