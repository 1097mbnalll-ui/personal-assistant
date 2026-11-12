// The director connects the player in the 3D headquarters to the simulation: objectives, conversations, terminals,
// the launch cinematic, incoming-strike alarms, visible research upgrades and save/load.
import { DynamicTexture, Scene, Vector3 } from '@babylonjs/core';
import { Audio } from '../engine/audio';
import { Interactions } from '../engine/interact';
import { PlayerController } from '../engine/player';
import { Campaign, KINGDOMS, READY, SimEvent, Strike, TECH, TechId, THREAT, WEATHER } from '../sim/campaign';
import { debriefHtml, drawMap, intelHtml, reportHtml, researchHtml, statusStrip, strikeHtml, tacticalHtml } from '../ui/panels';
import { Hud } from '../ui/hud';
import { LaunchSite, Upgrades } from '../world/extras';
import { HQ } from '../world/hq';
import { Npc } from '../world/npc';

const SAVE_KEY = 'ww3d_save_v1';
interface Flags { briefed: boolean; reportRead: boolean; dayEnded: boolean; researchStarted: boolean; upgradeSeen: boolean; intro: boolean }
interface DayLog { strikes: Strike[]; completed: TechId[]; failed: TechId[]; income: number; before: number[]; falseAlarm: boolean; crises: string[]; lines: string[] }

export class Director {
  sim = new Campaign(1); flags: Flags = { briefed: false, reportRead: false, dayEnded: false, researchStarted: false, upgradeSeen: false, intro: false };
  target = 2; private day: DayLog = this.newDay(); private track: { from: number; to: number; t: number; hit: boolean | null; after?: () => void } | null = null;
  private alarmT = 0; private screenT = 0; busy = false; private sweep = 0;
  constructor(private scene: Scene, private hud: Hud, private audio: Audio, private hq: HQ, private inter: Interactions, private player: PlayerController,
    private npcs: Map<string, Npc>, private site: LaunchSite, private upgrades: Upgrades) {
    this.wire(); this.registerInteractions();
  }
  private newDay(): DayLog { return { strikes: [], completed: [], failed: [], income: 0, before: this.sim.s.opinion.map(r => r[0]), falseAlarm: false, crises: [], lines: [] }; }
  private wire() { this.sim.listener = (e: SimEvent) => { const d = this.day;
    if (e.type === 'missileResolved') { if (e.strike.from !== 0) d.strikes.push(e.strike); if (e.strike.from !== 0 && e.strike.to !== 0) d.lines.push(`${this.sim.n(e.strike.from).name} أطلقت صاروخاً على ${this.sim.n(e.strike.to).name}.`); }
    else if (e.type === 'researchCompleted' && e.nation === 0) d.completed.push(e.tech); else if (e.type === 'researchTestFailed' && e.nation === 0) d.failed.push(e.tech);
    else if (e.type === 'income') d.income = e.net; else if (e.type === 'falseAlarm' && e.nation === 0) d.falseAlarm = true;
    else if (e.type === 'crisisStarted' && (e.a === 0 || e.b === 0)) d.crises.push(`أزمة دبلوماسية مع ${this.sim.n(e.a === 0 ? e.b : e.a).name}: استُدعي السفراء.`);
    else if (e.type === 'crisisEnded' && (e.a === 0 || e.b === 0)) d.crises.push(`انفراج الأزمة مع ${this.sim.n(e.a === 0 ? e.b : e.a).name}.`);
    else if (e.type === 'sanction' && e.b === 0) d.lines.push(`${this.sim.n(e.a).name} فرضت علينا عقوبات اقتصادية.`);
    else if (e.type === 'sanction' && e.a !== 0) d.lines.push(`${this.sim.n(e.a).name} فرضت عقوبات على ${this.sim.n(e.b).name}.`);
    else if (e.type === 'readinessChanged' && e.nation !== 0 && e.level > 0 && this.sim.n(0).threat[e.nation]?.mob) d.lines.push(`رُصد تحرك عسكري عند ${this.sim.n(e.nation).name}: «${READY[e.level]}».`); }; }

  // ---------- objectives ----------
  objective(): string { const f = this.flags, s = this.sim;
    if (s.s.over) return 'انتهت الأزمة. راجع النتيجة من حاسوب مكتبك.';
    if (!f.briefed) return 'توجّه إلى إدارة الاستخبارات وقابل العقيد سالم.';
    if (!f.reportRead) return 'راجع تقرير الاستخبارات عن مملكة الصحراء.';
    if (!f.dayEnded) return 'توجّه إلى غرفة العمليات، واتخذ قرارك على الطاولة التكتيكية، ثم أنهِ اليوم.';
    if (!f.researchStarted) return 'توجّه إلى مختبر الأبحاث وموّل برنامج تطوير.';
    if (!f.upgradeSeen) return 'أنهِ الأيام حتى يكتمل البرنامج، ثم شاهد المعدات الجديدة في المختبر.';
    return `اليوم ${s.s.round} من ${s.s.maxRound} — أدر الأزمة: استخبارات، عمليات، أبحاث.`; }

  // ---------- conversations ----------
  private talk(id: string, lines: string[], choices: string[], done: (c: number) => void) { const n = this.npcs.get(id)!; this.busy = true; n.say(id === 'intel_chief' ? 'present' : 'talk');
    const p = this.player.body; p.facing = Math.atan2(n.body.position.x - p.position.x, n.body.position.z - p.position.z); p.visual.rotation.y = p.facing;
    this.player.yaw = p.facing + .62; this.player.pitch = .06;   // over-the-shoulder two-shot
    this.hud.dialogue(lines.map(text => ({ who: `${n.def.name} · ${n.def.rank}`, text })), c => { n.say(null); this.busy = false; done(c); }, choices); this.audio.talk(); }
  private talkIntel() { const s = this.sim, th = s.n(0).threat[2], d = s.n(2);
    if (!this.flags.briefed) {
      this.talk('intel_chief', [`سيدي القائد. تقدير الليلة: مستوى التهديد من ${d.name} «${THREAT[th.level]}».`,
        `مراقبة الحدود ترصد حوالي ${th.est} ألوية قريبة من حدودنا${th.mob ? `، مع مؤشرات «${READY[th.mob]}» عندهم` : ''}. نسبة الثقة ${th.conf}%.`,
        'عندنا إشارات عن نشاط في مواقع اختباراتهم، لكن ما أقدر أأكد شي بدون عملية جمع ميدانية. تكلّف ذهبة وحدة وعملية من عمليات اليوم.'],
      ['اعتمد عملية الجمع', 'ليس الآن'], c => { this.flags.briefed = true; if (c === 0) this.orderReport(2); else this.hud.toast('تقدر تطلب التقرير لاحقاً من مكتب التحليل.'); this.save(); });
    } else this.talk('intel_chief', [`التهديد من ${d.name} الحين «${THREAT[th.level]}» بثقة ${th.conf}%. ملفات الدول كلها على مكتب التحليل.`], ['افتح الملفات', 'شكراً'], c => { if (c === 0) this.openIntel(); }); }
  private orderReport(t: number) { const r = this.sim.orderIntel(0, t);
    if (r !== 'ok') { this.hud.toast(r === 'noGold' ? 'الخزينة ما تكفي.' : r === 'noOps' ? 'خلصت عمليات اليوم.' : 'تعذر تنفيذ العملية.'); this.audio.denied(); return; }
    const rep = (this.sim.n(0).dossier[t] ?? [])[0]; this.audio.notify();
    this.hud.modal('تقرير استخباري', statusStrip(this.sim) + reportHtml(this.sim, rep), [{ label: 'تم الاطلاع', primary: true }], () => { if (!rep.failed) this.flags.reportRead = true; this.save(); }); }
  private talkOps() { const s = this.sim, p = s.n(0), th = Math.max(...s.others(0).map(q => p.threat[q]?.level ?? 0)); const rec = th >= 3 && p.readiness === 0 ? 'التهديد عالٍ وقواتنا في وضع السلم. أنصح برفع الجاهزية إلى «تأهب».'
      : p.fuel <= 1 ? 'مخزون الوقود حرج. بدون وقود ما نقدر نطلق ولا نتحرك.' : p.missiles === 0 && s.has(0, 'rocket') ? 'ما عندنا صواريخ جاهزة. خط الإنتاج ينتظر أمرك.' : 'القوات جاهزة حسب أوامرك.';
    this.talk('ops_chief', [`سيدي. ${rec}`, 'الطاولة التكتيكية قدامك: الخيارات العسكرية والدبلوماسية كلها عليها، والقرار قرارك.'], ['افتح الطاولة التكتيكية', 'لاحقاً'], c => { if (c === 0) this.openTactical(); }); }
  private talkLab() { const s = this.sim, p = s.n(0); const rec = !s.has(0, 'radar') ? 'أولويتي رادار الإنذار المبكر: بدونه أي صاروخ معادٍ يوصلنا قبل ما ندري.' : !s.has(0, 'inter') ? 'الرادار شغّال. الخطوة الجاية صواريخ اعتراضية متقدمة.' : 'البرامج ماشية حسب الخطة.';
    this.talk('lab_chief', [`${p.research.length ? `عندنا ${p.research.length} برنامج قيد التطوير. ` : ''}${rec}`], ['افتح برامج البحث', 'لاحقاً'], c => { if (c === 0) this.openResearch(); }); }

  // ---------- terminals ----------
  openIntel() { this.audio.ui(); this.hud.panel('مكتب التحليل · ملفات الدول', () => intelHtml(this.sim, this.target), act => { const [k, v] = act.split(':');
    if (k === 'dossier') this.target = +v; else if (k === 'order') { const r = this.sim.orderIntel(0, +v); if (r === 'ok') { this.audio.notify(); const rep = (this.sim.n(0).dossier[+v] ?? [])[0]; if (!rep.failed && +v === 2) this.flags.reportRead = true; this.flags.briefed = true; this.save(); } else this.audio.denied(); } }); }
  openTactical() { this.audio.ui(); const draw = () => { const cv = document.getElementById('tacMap') as HTMLCanvasElement | null; if (cv) drawMap(cv.getContext('2d')!, cv.width, cv.height, this.sim); };
    this.hud.panel('الطاولة التكتيكية · غرفة العمليات', () => tacticalHtml(this.sim, this.target), act => { const [k, v] = act.split(':'); const s = this.sim; let r = 'ok';
      if (k === 'target') this.target = +v; else if (k === 'launch') { this.hud.closeModal(); this.launch(+v); return; } else if (k === 'ready') r = s.setReadiness(0, +v); else if (k === 'build') r = s.buildMissile(0);
      else if (k === 'airdef') r = s.deployAirDefense(0); else if (k === 'fuel') r = s.buyFuel(0); else if (k === 'sanction') r = s.sanction(0, +v); else if (k === 'envoy') r = s.envoy(0, +v);
      else if (k === 'pact') { const before = s.pact(0, +v); r = s.proposePact(0, +v); if (r === 'ok') this.hud.toast(s.pact(0, +v) && !before ? `${s.n(+v).name} وقّعت المعاهدة.` : `${s.n(+v).name} رفضت المعاهدة.`); }
      else if (k === 'endday') { this.hud.closeModal(); this.endDay(); return; }
      if (r === 'ok') { if (k !== 'target') this.audio.confirm(); this.save(); } else this.audio.denied(); }, undefined, draw); }
  openResearch() { this.audio.ui(); this.hud.panel('مختبر الأبحاث · برامج التطوير', () => researchHtml(this.sim), act => { const [k, v] = act.split(':'); const r = k === 'rd' ? this.sim.startResearch(0, v as TechId) : this.sim.buildIndustry(0);
    if (r === 'ok') { this.audio.confirm(); if (k === 'rd') { this.flags.researchStarted = true; this.hud.toast(`بدأ برنامج «${TECH[v as TechId].name}».`); } this.save(); } else this.audio.denied(); }); }
  openOffice() { this.audio.ui(); const s = this.sim, p = s.n(0), inc = s.income(0);
    const html = () => `${statusStrip(s)}<div class="doc"><span class="cls">المهمة</span>${this.objective()}</div>
      <h3>ميزانية اليوم</h3><table>${Object.entries(inc.lines).filter(([, v]) => v).map(([k, v]) => `<tr><td>${({ regions: 'المناطق', industry: 'الصناعة', trade: 'التجارة الخارجية', productivity: 'الإنتاجية', upkeep: 'رواتب الجيش', readiness: 'تكلفة الجاهزية', interest: 'فوائد الدين', sanctions: 'خسائر العقوبات', unrest: 'اضطرابات' } as Record<string, string>)[k]}</td><td><bdi dir="ltr">${v > 0 ? '+' : ''}${v}</bdi></td></tr>`).join('')}<tr><td><b>الصافي</b></td><td><b><bdi dir="ltr">${inc.net >= 0 ? '+' : ''}${inc.net}</bdi></b></td></tr></table>
      <p class="mu">السمعة الدولية: <bdi dir="ltr">${s.reputation(0)}</bdi> · الدفاع الجوي: مستوى ${p.airDefense} · احتمال كشف صاروخ معادٍ: ${s.detectionChance(0, null)}% · التقنيات في الخدمة: ${Object.keys(p.tech).map(t => TECH[t as TechId].name).join('، ') || 'لا شيء'}.</p>
      ${s.s.over ? `<div class="doc"><span class="cls">النتيجة</span>${s.nations.map((n, i) => `${n.name}: ${s.score(i)}`).join(' · ')}</div>` : `<button data-act="endday" class="wide primary">أنهِ اليوم ${s.s.round}<small>الدول الأخرى تتحرك، والأبحاث تتقدم</small></button>`}
      <div class="grid" style="margin-top:10px"><button data-act="save">حفظ اللعبة<small>تُحفظ تلقائياً بعد كل قرار</small></button><button data-act="new">لعبة جديدة<small>تبدأ الأزمة من أولها</small></button></div>`;
    this.hud.panel('حاسوب القائد', html, act => { if (act === 'endday') { this.hud.closeModal(); this.endDay(); } else if (act === 'save') { this.save(); this.hud.toast('تم الحفظ.'); } else if (act === 'new') { if (confirm('تبدأ لعبة جديدة وتمسح الحفظ الحالي؟')) { localStorage.removeItem(SAVE_KEY); location.reload(); } } }); }

  // ---------- actions with staging ----------
  launch(target: number) { const s = this.sim, r = s.launchMissile(0, target); if (r !== 'ok') { this.audio.denied(); this.hud.toast('تعذر الإطلاق.'); return; }
    const strike = s.s.strikes[0]; this.day.strikes.push(strike); this.busy = true; this.player.frozen = true; this.hud.cinematic(true); this.hud.fade(1);
    setTimeout(() => { this.hud.fade(0); this.hud.caption('موقع الإطلاق · بطارية الصواريخ الأولى');
      this.site.play(cue => { if (cue === 'countdown') { [0, 1, 2].forEach(k => this.audio.countdown(k)); } else if (cue === 'ignite') { this.audio.launch(); this.hud.caption(null); } else this.hud.fade(1); },
        () => { this.hud.cinematic(false); this.player.body.teleport(11.2, 11.4, 60); this.player.yaw = 1.15; this.player.pitch = .02; this.hud.fade(0); this.busy = false; this.player.frozen = false;
          this.track = { from: 0, to: strike.region, t: 0, hit: strike.intercepted ? false : true, after: () => { if (strike.intercepted) this.audio.intercept(); else this.audio.impact();
            this.hud.modal('نتيجة الضربة', statusStrip(s) + strikeHtml(s, strike) + `<p class="mu">العلاقة مع ${s.n(target).name} صارت <bdi dir="ltr">${s.s.opinion[target][0]}</bdi>. بقية الدول شافت الإطلاق وتغيّر موقفها منا.</p>`, [{ label: 'مفهوم', primary: true }]); this.save(); } }; }); }, 950); }
  endDay() { const s = this.sim; if (s.s.over) { this.openOffice(); return; } if (this.busy) return; this.busy = true; this.player.frozen = true; this.hud.fade(1); this.audio.ui();
    const mine = this.day.strikes.filter(x => x.from === 0); this.day = this.newDay(); this.day.strikes.push(...mine);
    setTimeout(() => { s.endRound(); const d = this.day; this.flags.dayEnded = true; this.upgrades.sync(Object.keys(s.n(0).tech) as TechId[], true); this.hud.fade(0); this.player.frozen = false; this.busy = false;
      const incoming = d.strikes.filter(x => x.to === 0); const show = () => { this.hud.modal(s.s.over ? 'نهاية الأزمة' : `إيجاز الصباح · اليوم ${s.s.round}`, debriefHtml(s, d) + (s.s.over ? `<div class="doc"><span class="cls">النتيجة النهائية</span>${s.nations.map((n, i) => `${n.name}: ${s.score(i)}`).join(' · ')}</div>` : ''), [{ label: 'استلمت', primary: true }], () => { this.day = this.newDay(); });
        if (d.completed.length) { this.audio.upgrade(); this.hud.toast(`اكتمل «${TECH[d.completed[0]].name}». المعدات الجديدة في المختبر.`); } else this.audio.notify(); };
      if (incoming.length) { const st = incoming[0]; this.alarmT = 6; this.hud.alarm(true); this.audio.alarm(5); this.hud.toast('إنذار! إطلاق صاروخي معادٍ باتجاهنا.');
        this.track = { from: st.from, to: st.region, t: 0, hit: st.intercepted ? false : true, after: () => { if (st.intercepted) this.audio.intercept(); else this.audio.impact(); show(); } }; } else show();
      this.save(); }, 1000); }

  // ---------- interactions in the world ----------
  private registerInteractions() { const add = (id: string, x: number, z: number, radius: number, prompt: string, use: () => void) => this.inter.add({ id, pos: new Vector3(x, 1, z), radius, prompt: () => this.busy ? null : prompt, use });
    this.npcs.forEach(n => { if (!n.def.talkable) return; const b = n.body.position; add('npc:' + n.def.id, b.x, b.z, 2.3, `تحدث مع ${n.def.name}`, () => { if (n.def.id === 'intel_chief') this.talkIntel(); else if (n.def.id === 'ops_chief') this.talkOps(); else this.talkLab(); }); });
    add('terminal:office', 0, -5.4, 1.5, 'استخدم حاسوب القائد', () => this.openOffice());
    add('terminal:intel', -8.5, 8.7, 1.5, 'افتح ملفات الدول', () => this.openIntel());
    add('terminal:ops', 12.5, 11.6, 1.6, 'استخدم الطاولة التكتيكية', () => this.openTactical());
    add('terminal:ops2', 12.5, 14.4, 1.6, 'استخدم الطاولة التكتيكية', () => this.openTactical());
    add('terminal:lab', 0, 38.6, 1.5, 'افتح برامج البحث', () => this.openResearch()); }

  // ---------- per-frame ----------
  update(dt: number) { const p = this.player.body.position;
    if (this.flags.researchStarted && !this.flags.upgradeSeen && this.day && Object.keys(this.sim.n(0).tech).length > 1 && this.hq.roomAt(p.x, p.z)?.id === 'lab') { this.flags.upgradeSeen = true; this.hud.toast('المعدات الجديدة دخلت الخدمة.'); this.save(); }
    if (this.alarmT > 0) { this.alarmT -= dt; if (this.alarmT <= 0) this.hud.alarm(false); }
    if (this.track) { this.track.t += dt / 3.2; if (this.track.t >= 1) { const a = this.track.after; this.track.t = 1; this.drawScreens(); this.track = null; a?.(); } }
    this.sweep += dt; this.screenT -= dt; if (this.screenT <= 0 || this.track) { this.screenT = .5; this.drawScreens(); } }

  private ctx(id: string): [CanvasRenderingContext2D, number, number, DynamicTexture] | null { const t = this.hq.screens.get(id); if (!t) return null; const s = t.getSize(); return [t.getContext() as unknown as CanvasRenderingContext2D, s.width, s.height, t]; }
  private head(g: CanvasRenderingContext2D, w: number, h: number, title: string) { g.fillStyle = '#04090e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#0f2a38'; g.lineWidth = 1; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#6fd3ff'; g.textAlign = 'center'; g.direction = 'rtl'; g.font = 'bold 46px "Cairo",sans-serif'; g.fillText(title, w / 2, 62); g.textAlign = 'right'; }
  drawScreens() { const s = this.sim, p = s.n(0); const line = (g: CanvasRenderingContext2D, w: number, y: number, a: string, b: string, col = '#e6ecf0') => { g.font = '36px "Cairo",sans-serif'; g.fillStyle = '#8fa1ae'; g.textAlign = 'right'; g.direction = 'rtl'; g.fillText(a, w - 50, y); g.fillStyle = col; g.textAlign = 'left'; g.fillText(b, 50, y); };
    for (const id of ['opsMain', 'table']) { const c = this.ctx(id); if (!c) continue; const [g, w, h, t] = c; drawMap(g, w, h, s, this.track ? { track: this.track } : {});
      g.fillStyle = '#d9ae55'; g.font = 'bold 34px "Cairo",sans-serif'; g.textAlign = 'right'; g.direction = 'rtl'; g.fillText(`اليوم ${s.s.round} · ${WEATHER[s.s.weather]}`, w - 24, 44); t.update(); }
    let c = this.ctx('opsLeft'); if (c) { const [g, w, h, t] = c; this.head(g, w, h, 'الإنذار المبكر'); const det = s.detectionChance(0, null), radar = s.has(0, 'radar'); const cx = w * .3, cy = h * .58, r = h * .34;
      g.strokeStyle = radar ? '#2fae5d' : '#39505c'; g.lineWidth = 3; for (const k of [1, .66, .33]) { g.beginPath(); g.arc(cx, cy, r * k, 0, 6.3); g.stroke(); }
      if (radar) { const a = this.sweep * 2; g.strokeStyle = '#7dffa6'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); }
      line(g, w * .98, h * .36, 'الكشف', det + '%', radar ? '#7dffa6' : '#ffb08a'); line(g, w * .98, h * .5, 'اعتراضية', `${Math.max(0, p.airDefense - p.interceptorsUsed)}/${p.airDefense}`); g.textAlign = 'center'; g.fillStyle = radar ? '#7dffa6' : '#ffb08a'; g.font = '30px "Cairo",sans-serif'; g.fillText(radar ? 'الرادار يعمل' : 'لا يوجد رادار إنذار مبكر', w * .66, h * .86); t.update(); }
    c = this.ctx('opsRight'); if (c) { const [g, w, h, t] = c; this.head(g, w, h, 'حالة القوات'); let y = 150; for (const [a, b] of [['الألوية', '' + p.troops], ['صواريخ جاهزة', '' + p.missiles], ['الوقود', p.fuel + '/8'], ['الجاهزية', READY[p.readiness]], ['العمليات', s.opsLeft(0) + '/3']] as const) { line(g, w, y, a, b, '#d9ae55'); y += 78; } t.update(); }
    c = this.ctx('intelWall'); if (c) { const [g, w, h, t] = c; this.head(g, w, h, 'تقدير التهديد'); let y = 150; s.others(0).forEach(q => { const x = p.threat[q]; if (!x) return; line(g, w, y, KINGDOMS[q].name, `${THREAT[x.level]} · ${x.conf}%`, ['#6bd48a', '#6fd3ff', '#e6c04a', '#ff9a52', '#ff5a3c'][x.level]); y += 86; }); t.update(); }
    c = this.ctx('labWall'); if (c) { const [g, w, h, t] = c; this.head(g, w, h, 'برامج التطوير'); let y = 150; p.research.forEach(r => { line(g, w, y, TECH[r.id].name, `اليوم ${s.s.round + r.left}`, '#e6c04a'); y += 70; });
      (Object.keys(p.tech) as TechId[]).slice(-4).forEach(k => { line(g, w, y, TECH[k].name, 'في الخدمة', '#6bd48a'); y += 70; }); if (y === 150) { g.textAlign = 'center'; g.fillStyle = '#8fa1ae'; g.font = '36px "Cairo",sans-serif'; g.fillText('لا برامج نشطة', w / 2, h / 2); } t.update(); } }

  // ---------- persistence ----------
  save() { try { const b = this.player.body; localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, sim: this.sim.save(), flags: this.flags, target: this.target, pos: [b.position.x, b.position.z, this.player.yaw], t: Date.now() })); } catch { /* storage full or blocked */ } }
  static hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
  /** returns true when a saved game was restored */
  load(): boolean { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; const d = JSON.parse(raw); if (d.v !== 1 || !this.sim.load(d.sim)) return false;
      this.flags = { ...this.flags, ...d.flags }; this.target = d.target ?? 2; this.day = this.newDay(); this.wire();
      if (Array.isArray(d.pos)) { this.player.body.teleport(d.pos[0], d.pos[1], 0); this.player.yaw = d.pos[2] ?? 0; } return true; } catch { return false; } }
  start(loaded: boolean) { this.upgrades.sync(Object.keys(this.sim.n(0).tech) as TechId[], false); this.drawScreens();
    if (!loaded && !this.flags.intro) { this.flags.intro = true; const s = this.sim, th = s.n(0).threat[2];
      this.hud.modal('الموقف', `<p>سيدي القائد، النزاع الحدودي القديم مع <b>${s.n(2).name}</b> يتصاعد. تقدير الليلة يضع التهديد عند «<b>${THREAT[th.level]}</b>».</p>
      <p>عندك ${s.s.maxRound} يوماً لإدارة الأزمة. كل يوم لك ${3} عمليات: استخبارات، قرار عسكري أو دبلوماسي، أو تمويل أبحاث. الدول الأخرى تتحرك كل ليلة.</p>
      <p class="mu">ما تعرفه عن الخصم تقديرات بنسبة ثقة، مو حقائق. ابدأ من إدارة الاستخبارات.</p>`, [{ label: 'إلى العمل', primary: true }]); } }
}
