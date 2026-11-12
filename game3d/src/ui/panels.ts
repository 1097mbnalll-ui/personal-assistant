// HTML for the in-world terminals. Every number shown comes from the simulation state (sim/campaign.ts).
import { BRANCH, Campaign, IntelReport, KINGDOMS, MAP, OPS_PER_ROUND, Range, READY, SOURCE, Strike, TECH, TechId, THREAT, WEATHER } from '../sim/campaign';

const rg = (r: Range, unit = '') => `<bdi dir="ltr">${r.lo === r.hi ? r.lo : r.lo + '–' + r.hi}${unit}</bdi>`;
const threatColor = ['#3e8a4c', '#5e8fb0', '#c9a227', '#d9772b', '#c0392b'];
export const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function statusStrip(c: Campaign) { const p = c.n(0);
  return `<div class="strip"><span>اليوم <b>${c.s.round}/${c.s.maxRound}</b></span><span>الخزينة <b>${p.gold}</b></span><span>العمليات المتاحة <b>${c.opsLeft(0)}/${OPS_PER_ROUND}</b></span><span>الوقود <b>${p.fuel}/8</b></span><span>الجاهزية <b>${READY[p.readiness]}</b></span><span>الاستقرار <b>${p.stability}%</b></span><span>الطقس <b>${WEATHER[c.s.weather]}</b></span></div>`; }

export function reportHtml(c: Campaign, r: IntelReport) { const t = c.n(r.target);
  if (r.failed) return `<div class="doc"><span class="cls">فشل</span>انكشف عملاؤنا عند ${t.name} في اليوم ${r.round}. لا معلومات، والعلاقة تضررت.</div>`;
  if (r.due > c.s.round) return `<div class="doc"><span class="cls">في الطريق</span>العملاء في الميدان. التقرير يوصل اليوم ${r.due}.</div>`;
  const age = c.s.round - r.round;
  const rows: [string, string][] = [['الخزينة (ذهب)', rg(r.gold)], ['القوات (ألوية)', rg(r.troops)], ['صواريخ عادية', rg(r.missiles)], ['صواريخ ثقيلة', rg(r.heavy)], ['بطاريات الدفاع الجوي', rg(r.airDefense)],
    ['مستوى استخباراتهم', rg(r.intel)], ['وضع الجاهزية', r.readiness === null ? 'غير مؤكد' : READY[r.readiness]], ['مخزون الوقود', rg(r.fuel)], ['الاستقرار الداخلي', rg(r.stability, '%')], ['القاعدة الصناعية', rg(r.industry)],
    ['برامج تطوير مشتبه بها', r.programs.length ? r.programs.map(p => `${TECH[p.id].name} (اكتمال متوقع اليوم ${p.eta})`).join('، ') : r.unexplained ? 'نشاط غير مفسّر في مواقع الاختبار' : 'لا مؤشرات'],
    ['تقنيات في الخدمة', r.techs ? (r.techs.map(x => TECH[x].name).join('، ') || 'لا شيء') : 'حوالي ' + rg(r.techCount)], ['معاهدات', r.pacts.map(q => c.n(q).name).join('، ') || 'لا يوجد']];
  return `<div class="doc rep"><span class="cls">سري للغاية</span><b>تقدير موقف: ${t.name}</b><br><span class="mu">المصدر: ${SOURCE[r.source]} · تاريخ الجمع: اليوم ${r.round}${age > 0 ? ` (قديم ${age} ${age === 1 ? 'يوم' : 'أيام'})` : ''} · الثقة: <b>${r.confidence}%</b>${r.verified ? ' · مؤكَّد بمصدر ثانٍ' : ''}</span>
  <table>${rows.map(x => `<tr><td>${x[0]}</td><td>${x[1]}</td></tr>`).join('')}</table>
  <span class="mu">${r.confidence >= 75 ? 'تقدير موثوق؛ الأرقام ضمن هامش ضيق.' : r.confidence >= 55 ? 'تقدير متوسط الثقة؛ الأرقام نطاقات محتملة وليست حقائق.' : 'مصدر واحد غير مؤكد؛ بعض الأرقام قد تكون مضللة.'}</span></div>`; }

export function intelHtml(c: Campaign, target: number) { const p = c.n(0), list = p.dossier[target] ?? [];
  const threats = c.others(0).map(q => { const x = p.threat[q]; if (!x) return ''; return `<div class="doc"><span class="cls" style="background:${threatColor[x.level]};color:#fff;border-color:transparent">${THREAT[x.level]}</span><b>${c.n(q).name}</b>: قوات على حدودنا ≈ <bdi dir="ltr">${x.est}</bdi>${x.mob ? ' · رُصدت مؤشرات «' + READY[x.mob] + '»' : ''}<br><span class="mu">مراقبة الحدود · اليوم ${x.round} · ثقة ${x.conf}% · هامش ±${Math.max(0, 2 - p.intel)}</span></div>`; }).join('');
  return `${statusStrip(c)}<h3>تقدير التهديد</h3>${threats}<h3>ملف: ${c.n(target).name}</h3>
  <div class="tabs">${c.others(0).map(q => `<button data-act="dossier:${q}" class="${q === target ? 'sel' : ''}">${c.n(q).name}</button>`).join('')}</div>
  <button data-act="order:${target}" class="wide" ${c.opsLeft(0) > 0 && p.gold >= 1 ? '' : 'disabled'}>تكليف بجمع معلومات عن ${c.n(target).name}<small>1 ذهب · عملية واحدة · تقرير بمصدر مختلف يرفع الثقة</small></button>
  ${list.map(r => reportHtml(c, r)).join('') || '<p class="mu">الملف فارغ. ما نعرف عن هذي الدولة إلا تقدير الحدود.</p>'}`; }

/** schematic world map for screens and the tactical table (drawn on a 2D canvas) */
export function drawMap(g: CanvasRenderingContext2D, w: number, h: number, c: Campaign, opts: { track?: { from: number; to: number; t: number; hit: boolean | null } } = {}) {
  const xs = MAP.regions.map(r => r.x), ys = MAP.regions.map(r => r.y), x0 = Math.min(...xs) - 50, y0 = Math.min(...ys) - 50, sw = Math.max(...xs) - x0 + 50, sh = Math.max(...ys) - y0 + 50;
  const k = Math.min(w / sw, h / sh), ox = (w - sw * k) / 2, oy = (h - sh * k) / 2, X = (v: number) => ox + (v - x0) * k, Y = (v: number) => oy + (v - y0) * k;
  g.fillStyle = '#050b10'; g.fillRect(0, 0, w, h); g.strokeStyle = '#0f2a38'; g.lineWidth = 1;
  for (let i = 0; i < w; i += 48) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } for (let j = 0; j < h; j += 48) { g.beginPath(); g.moveTo(0, j); g.lineTo(w, j); g.stroke(); }
  g.strokeStyle = '#2a4656'; g.lineWidth = 1.5; MAP.adj.forEach(([a, b]) => { g.beginPath(); g.moveTo(X(MAP.regions[a].x), Y(MAP.regions[a].y)); g.lineTo(X(MAP.regions[b].x), Y(MAP.regions[b].y)); g.stroke(); });
  const owner = new Map<number, number>(); c.nations.forEach((n, i) => n.regions.forEach(r => owner.set(r, i)));
  MAP.regions.forEach((r, i) => { const o = owner.get(i), rad = (r.size === 'L' ? 15 : r.size === 'M' ? 12 : 9) * k * 1.5;
    g.beginPath(); g.arc(X(r.x), Y(r.y), rad, 0, 6.3); g.fillStyle = o === undefined ? '#39434c' : KINGDOMS[o].color; g.globalAlpha = o === 0 ? 1 : .85; g.fill(); g.globalAlpha = 1;
    if (o !== undefined && c.n(o).capital === i) { g.strokeStyle = '#f3d58c'; g.lineWidth = 3; g.strokeRect(X(r.x) - rad - 3, Y(r.y) - rad - 3, rad * 2 + 6, rad * 2 + 6); }
    if (o !== undefined && c.n(o).damaged[i]) { g.strokeStyle = '#ff5a3c'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(r.x) - rad, Y(r.y) - rad); g.lineTo(X(r.x) + rad, Y(r.y) + rad); g.moveTo(X(r.x) + rad, Y(r.y) - rad); g.lineTo(X(r.x) - rad, Y(r.y) + rad); g.stroke(); } });
  g.font = `bold ${Math.round(15 * k * 1.5)}px "Cairo",sans-serif`; g.textAlign = 'center'; g.direction = 'rtl';
  c.nations.forEach((n, i) => { const cap = MAP.regions[n.capital]; g.fillStyle = '#e6ecf0'; g.fillText(KINGDOMS[i].short, X(cap.x), Y(cap.y) - 26 * k * 1.5); });
  if (opts.track) { const a = MAP.regions[c.n(opts.track.from).capital], b = MAP.regions[opts.track.to]; const ax = X(a.x), ay = Y(a.y), bx = X(b.x), by = Y(b.y), mx = (ax + bx) / 2, my = Math.min(ay, by) - 120 * k;
    const pt = (u: number) => [(1 - u) * (1 - u) * ax + 2 * u * (1 - u) * mx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by];
    const end = opts.track.hit === false ? Math.min(opts.track.t, .72) : opts.track.t;
    g.strokeStyle = '#ff5a3c'; g.lineWidth = 4; g.setLineDash([12, 8]); g.beginPath(); for (let u = 0; u <= end + 1e-6; u += .02) { const [px, py] = pt(u); if (u === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); g.setLineDash([]);
    const [hx, hy] = pt(end); g.fillStyle = opts.track.t >= 1 && opts.track.hit ? '#ff5a3c' : opts.track.hit === false && opts.track.t > .72 ? '#5ec27a' : '#fff'; g.beginPath(); g.arc(hx, hy, opts.track.t >= .72 && opts.track.hit !== null ? 16 : 7, 0, 6.3); g.fill(); }
}

export function tacticalHtml(c: Campaign, target: number) { const p = c.n(0), t = c.n(target), rep = c.latestReport(0, target), ops = c.opsLeft(0) > 0, th = p.threat[target];
  const btn = (act: string, label: string, sub: string, ok: boolean, cls = '') => `<button data-act="${act}" class="${cls}" ${ok ? '' : 'disabled'}>${label}<small>${sub}</small></button>`;
  const canLaunch = ops && !p.launched && p.missiles > 0 && p.fuel >= 1 && c.missileTargets(0).includes(target);
  return `${statusStrip(c)}<canvas id="tacMap" width="900" height="420" class="map"></canvas>
  <div class="tabs">${c.others(0).map(q => `<button data-act="target:${q}" class="${q === target ? 'sel' : ''}">${c.n(q).name}</button>`).join('')}</div>
  <div class="doc"><b>${t.name}</b> · نظرتهم لنا: <bdi dir="ltr">${c.s.opinion[target][0]}</bdi>${c.pact(0, target) ? ' · معاهدة سارية' : ''}${c.inCrisis(0, target) ? ' · <b style="color:#ff8a73">أزمة دبلوماسية</b>' : ''}${th ? ` · التهديد: <b>${THREAT[th.level]}</b>` : ''}<br>
  <span class="mu">${rep ? `آخر تقرير (اليوم ${rep.round}، ثقة ${rep.confidence}%): دفاع جوي ${rg(rep.airDefense)} · صواريخ ${rg(rep.missiles)} · جاهزية ${rep.readiness === null ? 'غير مؤكدة' : READY[rep.readiness]}` : 'لا يوجد تقرير استخباري عن دفاعاتهم. القرار على عمى.'}</span></div>
  <h3>الخيارات العسكرية</h3><div class="grid">
  ${btn('launch:' + target, 'ضربة صاروخية على العاصمة', p.missiles > 0 ? `صاروخ عادي (${p.missiles}) · وحدة وقود · تهدم العلاقة مع الجميع` : 'لا توجد صواريخ جاهزة', canLaunch, 'danger')}
  ${btn('ready:' + (p.readiness === 0 ? 1 : p.readiness === 1 ? 2 : 0), p.readiness === 0 ? 'ارفع الجاهزية إلى «تأهب»' : p.readiness === 1 ? 'أعلن «التعبئة العامة»' : 'ارجع إلى وضع «السلم»', p.readiness === 0 ? 'اعتراض أفضل · 1 ذهب كل يوم · الجيران يلاحظون' : p.readiness === 1 ? '2 ذهب كل يوم · يأكل الاستقرار' : 'يوقف التكلفة', ops && p.readinessRound !== c.s.round)}
  ${btn('build', 'إنتاج صاروخ عادي', `${c.costMissile(0, false)} ذهب`, ops && p.gold >= c.costMissile(0, false) && c.has(0, 'rocket'))}
  ${btn('airdef', p.airDefense >= 2 ? 'الدفاع الجوي بأعلى مستوى' : 'نشر بطارية دفاع جوي', p.airDefense >= 2 ? '—' : `${c.costAirDefense(0)} ذهب · صاروخ اعتراضي كل يوم`, ops && p.airDefense < 2 && p.gold >= c.costAirDefense(0))}
  ${btn('fuel', 'استيراد وقود (+2)', `${c.costFuel(0)} ذهب`, ops && p.gold >= c.costFuel(0) && p.fuel < 8)}</div>
  <h3>الخيارات الدبلوماسية</h3><div class="grid">
  ${btn('sanction:' + target, 'عقوبات اقتصادية', '3 أيام · تخنق تجارتهم وتسمّم العلاقة', ops && !c.pact(0, target) && !c.s.sanctions.some(x => x.by === 0 && x.target === target))}
  ${btn('envoy:' + target, 'إيفاد مبعوث للتهدئة', '1 ذهب · يحسّن العلاقة', ops && p.gold >= 1)}
  ${btn('pact:' + target, 'عرض معاهدة عدم اعتداء', '3 أيام · قد يرفضون', ops && !c.pact(0, target))}</div>
  <button data-act="endday" class="wide primary">نفّذ الأوامر وأنهِ اليوم ${c.s.round}<small>الدول الأخرى تتحرك، والأبحاث تتقدم</small></button>`; }

export function researchHtml(c: Campaign) { const p = c.n(0), slots = c.researchSlots(0);
  let h = `${statusStrip(c)}<p class="mu">مسارات البحث: ${p.research.length}/${slots}${p.industry < 1 ? ' — القاعدة الصناعية تفتح مساراً ثانياً' : ''}</p>`;
  h += p.research.map(r => { const done = r.total - r.left, pc = Math.round((done + .5) / (r.total + .5) * 100); return `<div class="doc"><b>${TECH[r.id].name}</b> · المرحلة: ${r.retest ? 'إعادة الاختبار' : ['التصميم', 'النموذج الأولي', 'الاختبارات'][Math.min(2, Math.floor(done / r.total * 3))]} · الاكتمال المتوقع: اليوم ${c.s.round + r.left}<div class="bar"><i style="width:${pc}%"></i></div></div>`; }).join('');
  (Object.keys(BRANCH) as (keyof typeof BRANCH)[]).forEach(br => { h += `<h3>${BRANCH[br]}</h3><div class="grid">`;
    (Object.keys(TECH) as TechId[]).filter(id => TECH[id].branch === br).forEach(id => { const T = TECH[id], w = c.researchBlock(0, id), cost = c.costResearch(0, id);
      const st = w === 'done' ? '<span class="tg ok">في الخدمة</span>' : w === 'running' ? '<span class="tg run">قيد التطوير</span>' : w ? `<span class="tg lock">${w}</span>`
        : `<button data-act="rd:${id}" ${c.opsLeft(0) > 0 && p.gold >= cost && p.research.length < slots ? '' : 'disabled'}>موّل البرنامج<small>${cost} ذهب · ${T.rounds} ${T.rounds > 1 ? 'أيام' : 'يوم'}</small></button>`;
      h += `<div class="node ${w === 'done' ? 'done' : w && w !== 'running' ? 'locked' : ''}"><b>${T.name}</b><span class="mu">${T.desc}${T.test ? ' يمر باختبار قد يفشل.' : ''}</span>${st}</div>`; }); h += '</div>'; });
  return h + `<button data-act="industry" class="wide" ${c.opsLeft(0) > 0 && p.industry < 2 && p.gold >= c.costIndustry(0) ? '' : 'disabled'}>${p.industry >= 2 ? 'القاعدة الصناعية بأعلى مستوى' : 'توسعة القاعدة الصناعية → ' + (p.industry + 1)}<small>${p.industry >= 2 ? '—' : c.costIndustry(0) + ' ذهب · +1 دخل' + (p.industry ? ' · صواريخ أرخص' : ' · مسار بحث ثانٍ')}</small></button>`; }

export function strikeHtml(c: Campaign, s: Strike) { const mine = s.from === 0, a = c.n(s.from), d = c.n(s.to);
  const det = s.stage === 'early' ? 'كشف مبكر' : s.stage === 'late' ? 'كشف متأخر' : 'لم يُكشف الإطلاق';
  const res = s.intercepted ? 'اعتُرض الصاروخ قبل الهدف' : `أصاب ${MAP.regions[s.region].name} · الخسائر: ${s.casualties} ${s.casualties === 1 ? 'لواء' : 'ألوية'}${s.heavy ? ' · دُمّرت المنشآت' : ''}`;
  return `<div class="doc"><span class="cls" style="${s.intercepted ? '' : 'border-color:#ff8a73;color:#ff8a73'}">${mine ? 'ضربتنا' : 'ضربة معادية'}</span><b>${a.name} ← ${d.name}</b><br>${mine ? 'رادارهم' : 'رادارنا'}: ${det}${s.unsure ? ' · تصنيف غير مؤكد' : ''} · ${s.tried ? (s.intercepted ? 'اعتراض ناجح' : 'محاولة اعتراض فاشلة') : s.stage === 'miss' ? 'بلا إنذار' : 'لا صواريخ اعتراضية متاحة'}${s.civil ? ' · صافرات الدفاع المدني' : ''}<br><b>${res}</b></div>`; }

export function debriefHtml(c: Campaign, d: { strikes: Strike[]; completed: TechId[]; failed: TechId[]; income: number; before: number[]; falseAlarm: boolean; crises: string[]; lines: string[] }) {
  const op = c.others(0).map(q => { const now = c.s.opinion[q][0], was = d.before[q], df = now - was; return `<tr><td>${c.n(q).name}</td><td><bdi dir="ltr">${now}</bdi> ${df ? `<span style="color:${df > 0 ? '#6bd48a' : '#ff8a73'}">(<bdi dir="ltr">${df > 0 ? '+' : ''}${df}</bdi>)</span>` : ''}</td><td>${THREAT[c.n(0).threat[q]?.level ?? 1]}</td></tr>`; }).join('');
  return `${statusStrip(c)}${d.strikes.map(s => strikeHtml(c, s)).join('')}
  ${d.completed.map(t => `<div class="doc"><span class="cls">بحث وتطوير</span>اكتمل برنامج «${TECH[t].name}» ودخل الخدمة. توجّه للمختبر عشان تشوف المعدات الجديدة.</div>`).join('')}
  ${d.failed.map(t => `<div class="doc"><span class="cls">بحث وتطوير</span>فشل اختبار «${TECH[t].name}». الفريق يعيد التجربة، التأخير يوم واحد.</div>`).join('')}
  ${d.falseAlarm ? '<div class="doc"><span class="cls">إنذار مبكر</span>إنذار كاذب أربك الدفاع الجوي الليلة. شبكة الإنذار المتكاملة تمنع تكراره.</div>' : ''}
  ${d.crises.map(x => `<div class="doc"><span class="cls">خارجية</span>${x}</div>`).join('')}${d.lines.map(x => `<div class="doc"><span class="cls">العالم</span>${x}</div>`).join('')}
  <h3>الموقف الدولي</h3><table><tr><td class="mu">الدولة</td><td class="mu">نظرتهم لنا</td><td class="mu">التهديد</td></tr>${op}</table>
  <p class="mu">صافي الدخل أمس: <bdi dir="ltr">${d.income >= 0 ? '+' : ''}${d.income}</bdi> ذهب.</p>`; }
