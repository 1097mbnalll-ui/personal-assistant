// End-to-end playthrough of the vertical slice in a headless browser, through the real UI and interaction system.
// Run: npm run build && node tests/e2e.cjs      (Playwright + Chromium required; uses the software renderer)
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', 'dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.json': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
const steps = []; const ok = (name, cond, extra = '') => { steps.push({ name, pass: !!cond, extra: String(extra) }); if (!cond) console.log('FAIL', name, extra); };
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = `http://127.0.0.1:${srv.address().port}/index.html?autostart=1&q=low&new=1`;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 640, height: 360 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(url, { waitUntil: 'commit' }); await p.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 240000 });
  // drive the game loop ourselves so the run does not depend on rendering speed
  await p.evaluate(() => { const g = window.__game; g.engine.stopRenderLoop(); window.run = n => { for (let i = 0; i < n; i++) { g.frame(1 / 30); g.scene.meshes.forEach(m => { if (m.name.startsWith('doorPanel')) m.computeWorldMatrix(true); }); g.body.root.computeWorldMatrix(true); } };
    window.use = id => { const it = g.inter.find(id); if (!it || it.prompt() == null) return false; it.use(); return true; }; window.go = (x, z) => { g.body.teleport(x, z, 0); window.run(2); }; window.run(3); });
  const modalTitle = () => p.evaluate(() => document.getElementById('modal').style.display === 'flex' ? document.querySelector('#modal h2').textContent : null);
  const closeModal = () => p.evaluate(() => { window.__game.hud.closeModal(); window.run(2); });
  const S = () => p.evaluate(() => { const g = window.__game, s = g.director.sim, n = s.n(0); return { round: s.s.round, gold: n.gold, ops: s.opsLeft(0), missiles: n.missiles, fuel: n.fuel, tech: Object.keys(n.tech), research: n.research.map(r => r.id), flags: g.director.flags, objective: g.director.objective(), opinion: s.s.opinion[2][0], strikes: s.s.strikes.length, room: (g.hq.roomAt(g.body.position.x, g.body.position.z) || {}).id }; });

  ok('intro situation modal', (await modalTitle()) === 'الموقف'); await closeModal();
  let s = await S(); ok('A starts in the commander office', s.room === 'office', s.room); ok('objective points to intelligence', /الاستخبارات/.test(s.objective), s.objective);
  // B walk: hold W towards the office door, it blocks until opened
  await p.evaluate(() => { const g = window.__game; g.player.yaw = 0; dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' })); window.run(60); });
  ok('B closed door blocks the player', (await p.evaluate(() => window.__game.body.position.z)) < 0);
  ok('B door prompt and open', await p.evaluate(() => { const g = window.__game; const c = g.inter.update(g.body.position, { x: 0, y: 0, z: 1 }); if (!c || c.id !== 'door:office') return false; c.use(); window.run(120); return g.body.position.z > 1; }));
  await p.evaluate(() => { dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' })); window.run(10); });
  // C/D intelligence department, officer briefing
  await p.evaluate(() => window.go(-9, 16.6)); ok('C reached intelligence department', (await S()).room === 'intel');
  ok('D officer can be spoken to', await p.evaluate(() => window.use('npc:intel_chief')));
  const line1 = await p.evaluate(() => document.getElementById('dlgText').textContent); ok('D briefing quotes the threat level from the simulation', /مستوى التهديد/.test(line1), line1);
  await p.evaluate(() => { const g = window.__game; g.hud.advanceDialogue(); g.hud.advanceDialogue(); });
  ok('D briefing offers a decision', await p.evaluate(() => document.querySelectorAll('#dlgChoices button').length === 2));
  await p.click('#dlgChoices button.primary'); await p.evaluate(() => window.run(2));
  // E report
  ok('E intelligence report opens', (await modalTitle()) === 'تقرير استخباري'); const rep = await p.evaluate(() => document.querySelector('#modal .body').textContent);
  ok('E report shows confidence, source and collection date', /الثقة/.test(rep) && /HUMINT/.test(rep) && /تاريخ الجمع/.test(rep)); await closeModal();
  s = await S(); ok('E report cost one gold and one operation', s.gold === 5 && s.ops === 2, JSON.stringify([s.gold, s.ops])); ok('E objective moves to operations', /غرفة العمليات/.test(s.objective), s.objective);
  // F/G operations room, tactical table
  await p.evaluate(() => window.go(12.5, 11.4)); ok('F reached the operations room', (await S()).room === 'ops');
  ok('G tactical table opens', await p.evaluate(() => window.use('terminal:ops')) && (await modalTitle()) === 'الطاولة التكتيكية · غرفة العمليات');
  ok('G map is drawn on the table', await p.evaluate(() => { const c = document.getElementById('tacMap'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n > 10; }));
  await p.click('[data-act="ready:1"]'); s = await S(); ok('G raising readiness is applied', s.ops === 1);
  // H missile launch + cinematic
  await p.click('[data-act="launch:2"]'); await p.waitForTimeout(1200);
  ok('H launch cinematic is playing', await p.evaluate(() => window.__game.site.active)); s = await S(); ok('H missile, fuel and operation consumed', s.missiles === 0 && s.fuel === 2 && s.ops === 0 && s.strikes === 1, JSON.stringify(s));
  const alt = await p.evaluate(() => { const g = window.__game; window.run(150); const m = g.scene.getTransformNodeByName('launchMissile'); const y5 = m.position.y; window.run(150); return [y5, g.site.active]; });
  ok('H missile lifts off during the cinematic', alt[0] > 5, alt[0]); ok('H cinematic ends and control returns', alt[1] === false);
  await p.evaluate(() => window.run(110)); ok('I strike outcome is reported', (await modalTitle()) === 'نتيجة الضربة'); const out = await p.evaluate(() => document.querySelector('#modal .body').textContent);
  ok('I outcome states detection and result', /(كشف|يُكشف)/.test(out) && /(اعتُرض|أصاب)/.test(out)); await closeModal();
  ok('I relations changed as a consequence', (await S()).opinion < -25);
  // end the day -> debrief with updated world information
  await p.evaluate(() => window.__game.director.endDay()); await p.waitForTimeout(1300); await p.evaluate(() => window.run(110));
  let title = await modalTitle(); ok('I morning brief after ending the day', /إيجاز الصباح/.test(title || ''), title); await closeModal(); s = await S(); ok('I day advanced', s.round === 2 && s.ops === 3);
  // J research
  await p.evaluate(() => window.go(0, 38.4)); ok('J research terminal opens', await p.evaluate(() => window.use('terminal:lab')));
  await p.click('[data-act="rd:radar"]'); s = await S(); ok('J research programme funded', s.research.includes('radar') && s.flags.researchStarted, JSON.stringify(s.research)); await closeModal();
  ok('K no radar equipment before completion', await p.evaluate(() => !window.__game.scene.getTransformNodeByName('upg:radar')));
  const det0 = await p.evaluate(() => window.__game.director.sim.detectionChance(0, null));
  await p.evaluate(() => window.__game.director.endDay()); await p.waitForTimeout(1300); await p.evaluate(() => window.run(120)); if (await modalTitle()) await closeModal();
  s = await S(); ok('K research completed in the simulation', s.tech.includes('radar'), s.tech.join());
  ok('K radar equipment now exists in the lab', await p.evaluate(() => { const n = window.__game.scene.getTransformNodeByName('upg:radar'); return !!n && n.getChildMeshes().length >= 3 && Math.abs(n.position.x + 6.2) < .1; }));
  ok('K upgrade changes gameplay (detection chance)', (await p.evaluate(() => window.__game.director.sim.detectionChance(0, null))) === det0 + 25);
  await p.evaluate(() => window.run(30)); ok('K objective chain completed', (await S()).flags.upgradeSeen);
  // L save, exit, reload, continue
  const before = await p.evaluate(() => { const g = window.__game; g.director.save(); return g.director.sim.save(); });
  await p.goto(url.replace('&new=1', ''), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 240000 });
  const after = await p.evaluate(() => { const g = window.__game; return { same: g.director.sim.save(), flags: g.director.flags, radar: !!g.scene.getTransformNodeByName('upg:radar'), room: (g.hq.roomAt(g.body.position.x, g.body.position.z) || {}).id }; });
  ok('L reload restores the exact simulation state', after.same === before); ok('L reload restores progress, upgrades and position', after.flags.upgradeSeen && after.radar && after.room === 'lab', JSON.stringify(after.flags) + after.room);
  ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = steps.filter(x => !x.pass); console.log(`${steps.length - failed.length}/${steps.length} checks passed`); steps.forEach(x => console.log((x.pass ? 'ok   ' : 'FAIL ') + x.name));
  await b.close(); srv.close(); process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
