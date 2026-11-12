// Headless strategic simulation for the 3D game. No rendering, no DOM: the world listens to `SimEvent`s.
// Rules follow docs/GAME_SPEC.md (sections 7 intelligence, 8 economy, 10 diplomacy, 11 readiness, 13 early warning,
// 14 research). Land combat on the 26-region map is not ported yet (milestone 7); territory is tracked per nation only.
// Everything random comes from the seeded RNG in the state, so a seed + the same commands replays exactly.
import mapData from './map.json';

export type TechId = 'radar' | 'ew2' | 'inter' | 'civil' | 'rocket' | 'heavy' | 'guid' | 'train' | 'doctrine' | 'logi' | 'fort' | 'crypto' | 'sigint' | 'sat';
export interface TechDef { name: string; branch: 'air' | 'mis' | 'land' | 'int'; cost: number; rounds: number; req?: TechId[]; ind?: number; intel?: number; test?: boolean; desc: string }
export const TECH: Record<TechId, TechDef> = {
  radar: { name: 'رادار الإنذار المبكر', branch: 'air', cost: 2, rounds: 1, desc: 'يكشف الإطلاقات المعادية مبكراً ويرفع فرصة الاعتراض.' },
  ew2: { name: 'شبكة إنذار متكاملة', branch: 'air', cost: 3, rounds: 1, req: ['radar'], desc: 'كشف أدق، تصنيف مؤكد للتهديد، وتنهي الإنذارات الكاذبة.' },
  inter: { name: 'صواريخ اعتراضية متقدمة', branch: 'air', cost: 3, rounds: 1, req: ['radar'], desc: '+15% لنجاح الاعتراض.' },
  civil: { name: 'الدفاع المدني', branch: 'air', cost: 2, rounds: 1, desc: 'عند الإنذار المبكر تنزل الملاجئ الخسائر.' },
  rocket: { name: 'محركات الصواريخ', branch: 'mis', cost: 2, rounds: 1, test: true, desc: 'يفتح إنتاج الصاروخ العادي.' },
  heavy: { name: 'الرؤوس الثقيلة', branch: 'mis', cost: 4, rounds: 2, req: ['rocket'], ind: 1, test: true, desc: 'يفتح إنتاج الصاروخ الثقيل. يحتاج قاعدة صناعية.' },
  guid: { name: 'التوجيه الدقيق', branch: 'mis', cost: 3, rounds: 1, req: ['rocket'], test: true, desc: 'صواريخك أصعب في الكشف والاعتراض.' },
  train: { name: 'التدريب الاحترافي', branch: 'land', cost: 2, rounds: 1, desc: '+1 دفاع لكل مناطقك.' },
  doctrine: { name: 'عقيدة الهجوم المشترك', branch: 'land', cost: 3, rounds: 2, req: ['train'], desc: '+1 هجوم.' },
  logi: { name: 'سلاح الإمداد', branch: 'land', cost: 2, rounds: 1, desc: 'خطوط إمداد أطول واستهلاك وقود أقل.' },
  fort: { name: 'تحصين العاصمة', branch: 'land', cost: 2, rounds: 1, desc: '+1 دفاع للعاصمة.' },
  crypto: { name: 'التشفير ومكافحة التجسس', branch: 'int', cost: 2, rounds: 1, desc: 'يخفض دقة تقارير الأعداء عنك ويصعّب التخريب.' },
  sigint: { name: 'اعتراض الإشارات', branch: 'int', cost: 3, rounds: 1, intel: 1, desc: 'يرصد مشتريات السلاح وبرامج البحث عند الآخرين.' },
  sat: { name: 'الاستطلاع الفضائي', branch: 'int', cost: 3, rounds: 2, intel: 1, req: ['radar'], desc: 'تقرير تلقائي كل جولة عن كل دولة بثقة أعلى.' },
};
export const BRANCH = { air: 'الدفاع الجوي والإنذار', mis: 'برنامج الصواريخ', land: 'القوات البرية', int: 'تقنيات الاستخبارات' } as const;
export const READY = ['سلم', 'تأهب', 'تعبئة عامة'] as const;
export const THREAT = ['حليف', 'منخفض', 'مرتفع', 'عالٍ', 'حرج'] as const;
export const SOURCE = { hum: 'مصادر بشرية (HUMINT)', sig: 'اعتراض إشارات (SIGINT)', sat: 'استطلاع فضائي (IMINT)' } as const;
export const WEATHER = { clear: 'صحو', rain: 'أمطار غزيرة', storm: 'عاصفة بحرية', snow: 'ثلوج', sand: 'عاصفة رملية', fog: 'ضباب كثيف' } as const;
export type WeatherId = keyof typeof WEATHER;
export const OPS_PER_ROUND = 3;
export const KINGDOMS = [
  { k: 'm', name: 'مملكة الجبال', short: 'الجبال', color: '#5E5385', ability: 'عاصمة محصّنة' },
  { k: 'p', name: 'مملكة الموانئ', short: 'الموانئ', color: '#2F7458', ability: 'تجارة بحرية' },
  { k: 'd', name: 'مملكة الصحراء', short: 'الصحراء', color: '#A06A12', ability: 'تجنيد أرخص' },
  { k: 'f', name: 'مملكة السهول', short: 'السهول', color: '#5A6F1F', ability: 'مناطق أوسع' },
] as const;
export const MAP = mapData as { regions: { name: string; en: string; k: string; size: 'L' | 'M' | 'S'; cap: boolean; coastal: boolean; x: number; y: number }[]; adj: [number, number][] };

export interface Research { id: TechId; left: number; total: number; retest?: boolean }
export interface Range { lo: number; hi: number }
export interface IntelReport {
  target: number; round: number; due: number; source: keyof typeof SOURCE; confidence: number; verified: boolean; failed: boolean;
  gold: Range; troops: Range; missiles: Range; heavy: Range; airDefense: Range; intel: Range; fuel: Range; stability: Range; industry: Range;
  readiness: number | null; techs: TechId[] | null; techCount: Range; programs: { id: TechId; eta: number }[]; unexplained: boolean; pacts: number[];
}
export interface Threat { est: number; mob: number; conf: number; level: number; round: number }
export interface Warning { round: number; kind: 'intercepted' | 'hit' | 'false'; from: number | null; region: number | null; stage: 'early' | 'late' | 'miss' }
export interface Nation {
  k: string; name: string; ai: boolean; alive: boolean;
  gold: number; troops: number; regions: number[]; capital: number;
  airDefense: number; interceptorsUsed: number; intel: number; missiles: number; heavy: number; launched: boolean;
  stability: number; readiness: number; readinessRound: number; debt: number; industry: number; fuel: number;
  tech: Partial<Record<TechId, number>>; research: Research[]; dossier: Record<number, IntelReport[]>; threat: Record<number, Threat>;
  warnings: Warning[]; ops: number; repAdj: number; damaged: Record<number, number>;
}
export interface Strike { round: number; from: number; to: number; region: number; heavy: boolean; stage: 'early' | 'late' | 'miss'; unsure: boolean; tried: boolean; intercepted: boolean; casualties: number; civil: boolean }
export interface State {
  seed: number; rng: number; round: number; maxRound: number; weather: WeatherId; over: boolean;
  nations: Nation[]; opinion: number[][]; pacts: { a: number; b: number; until: number }[]; sanctions: { by: number; target: number; until: number }[];
  crises: { a: number; b: number; round: number }[]; strikes: Strike[]; log: { round: number; text: string; to?: number }[];
}
export type SimEvent =
  | { type: 'roundStarted'; round: number; weather: WeatherId }
  | { type: 'researchStarted' | 'researchCompleted' | 'researchTestFailed'; nation: number; tech: TechId }
  | { type: 'intelReport'; nation: number; report: IntelReport }
  | { type: 'spyCaught'; nation: number; by: number }
  | { type: 'missileLaunched' | 'missileResolved'; strike: Strike }
  | { type: 'falseAlarm'; nation: number }
  | { type: 'readinessChanged'; nation: number; level: number }
  | { type: 'sanction' | 'envoy' | 'crisisStarted' | 'crisisEnded' | 'pactSigned' | 'pactRejected'; a: number; b: number }
  | { type: 'threat'; nation: number; about: number; level: number }
  | { type: 'income'; nation: number; net: number }
  | { type: 'gameOver'; winner: number };
export type Result = 'ok' | 'noOps' | 'noGold' | 'requirement' | 'invalid' | 'limit' | 'over';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class Campaign {
  s!: State;
  listener: ((e: SimEvent) => void) | null = null;
  readonly me = 0;

  constructor(seed = 1) { this.newGame(seed); }

  // ---------- deterministic RNG (mulberry32) ----------
  private rand(): number { let t = (this.s.rng += 0x6D2B79F5) | 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  private below(n: number) { return Math.floor(this.rand() * n); }
  private emit(e: SimEvent) { this.listener?.(e); }
  private log(text: string, to?: number) { this.s.log.unshift({ round: this.s.round, text, to }); if (this.s.log.length > 80) this.s.log.length = 80; }

  // ---------- setup: the opening situation of the campaign ----------
  newGame(seed: number) {
    const nations: Nation[] = KINGDOMS.map((kd, i) => {
      const regions = MAP.regions.map((r, ri) => r.k === kd.k ? ri : -1).filter(v => v >= 0);
      return { k: kd.k, name: kd.name, ai: i !== 0, alive: true, gold: 3, troops: 12, regions, capital: regions.find(r => MAP.regions[r].cap)!, airDefense: 0, interceptorsUsed: 0, intel: 0,
        missiles: 0, heavy: 0, launched: false, stability: 70, readiness: 0, readinessRound: 0, debt: 0, industry: 0, fuel: 3, tech: {}, research: [], dossier: {}, threat: {}, warnings: [], ops: 0, repAdj: 0, damaged: {} };
    });
    this.s = { seed, rng: seed >>> 0, round: 1, maxRound: 12, weather: 'clear', over: false, nations, opinion: nations.map(() => nations.map(() => 0)), pacts: [], sanctions: [], crises: [], strikes: [], log: [] };
    // inherited history (GAME_SPEC §10): an old border dispute with the Desert kingdom, an old friendship with the Ports
    this.s.opinion[0][2] = this.s.opinion[2][0] = -25; this.s.opinion[0][1] = this.s.opinion[1][0] = 20;
    // the player's kingdom already fielded a first rocket battery; the Desert kingdom is racing to catch up and is on alert
    const me = nations[0], desert = nations[2];
    me.tech.rocket = 1; me.missiles = 1; me.gold = 6; me.intel = 1;
    desert.research.push({ id: 'rocket', left: 1, total: 1 }); desert.readiness = 1; desert.gold = 5; desert.troops = 15; desert.airDefense = 1;
    this.intelCycle();
    this.log('بدأت الأزمة: نزاع حدودي قديم مع مملكة الصحراء يتصاعد.');
  }

  // ---------- queries ----------
  get nations() { return this.s.nations; }
  n(i: number) { return this.s.nations[i]; }
  others(i: number) { return this.s.nations.map((_, q) => q).filter(q => q !== i && this.s.nations[q].alive); }
  has(i: number, t: TechId) { return this.s.nations[i].tech[t] !== undefined; }
  pact(a: number, b: number) { return this.s.pacts.some(p => ((p.a === a && p.b === b) || (p.a === b && p.b === a)) && p.until >= this.s.round); }
  inCrisis(a: number, b: number) { return this.s.crises.some(c => (c.a === a && c.b === b) || (c.a === b && c.b === a)); }
  sanctionsOn(i: number) { return this.s.sanctions.filter(x => x.target === i && x.until >= this.s.round).length; }
  reputation(i: number) { const o = this.others(i); const a = o.length ? o.reduce((sum, q) => sum + this.s.opinion[q][i], 0) / o.length : 0; return Math.round(clamp(a + this.n(i).repAdj, -100, 100)); }
  opsLeft(i: number) { return OPS_PER_ROUND - this.n(i).ops; }
  inflated(_i: number) { return 0; }
  costResearch(i: number, t: TechId) { return TECH[t].cost + this.inflated(i); }
  costMissile(i: number, heavy: boolean) { return Math.max(1, (heavy ? 6 : 3) - (this.n(i).industry >= 2 ? 1 : 0)); }
  costAirDefense(i: number) { return this.n(i).airDefense === 0 ? 4 : 6; }
  costIntel(i: number) { return this.n(i).intel === 0 ? 3 : 5; }
  costIndustry(i: number) { return this.n(i).industry ? 6 : 4; }
  costFuel(i: number) { return this.sanctionsOn(i) ? 2 : 1; }
  researchSlots(i: number) { return this.n(i).industry >= 1 ? 2 : 1; }
  /** '' = can start now, 'done' / 'running', otherwise the unmet requirement in words */
  researchBlock(i: number, t: TechId): string {
    const p = this.n(i), T = TECH[t];
    if (p.tech[t] !== undefined) return 'done'; if (p.research.some(r => r.id === t)) return 'running';
    const miss = (T.req ?? []).filter(r => p.tech[r] === undefined); if (miss.length) return 'يحتاج: ' + miss.map(r => TECH[r].name).join('، ');
    if (T.ind && p.industry < T.ind) return 'يحتاج قاعدة صناعية مستوى ' + T.ind; if (T.intel && p.intel < T.intel) return 'يحتاج استخبارات مستوى ' + T.intel;
    return '';
  }
  detectionChance(def: number, att: number | null) { const d = this.n(def); const w = this.s.weather;
    return clamp((d.airDefense ? 30 + d.airDefense * 10 : 20) + (this.has(def, 'radar') ? 25 : 0) + (this.has(def, 'ew2') ? 20 : 0) + d.readiness * 8 - (w === 'sand' || w === 'fog' ? 15 : 0) - (att !== null && this.has(att, 'guid') ? 10 : 0), 5, 97); }
  interceptChance(def: number, att: number | null, early: boolean) { return clamp((early ? 70 : 40) + (this.has(def, 'inter') ? 15 : 0) + this.n(def).readiness * 5 - (att !== null && this.has(att, 'guid') ? 15 : 0), 5, 95); }
  missileTargets(i: number) { return this.others(i).filter(q => !this.pact(i, q)); }
  latestReport(i: number, target: number) { return (this.n(i).dossier[target] ?? []).find(r => !r.failed && r.due <= this.s.round) ?? null; }
  income(i: number) { const p = this.n(i); const storm = this.s.weather === 'storm';
    const lines = { regions: 2, industry: p.industry, trade: !storm && this.reputation(i) > -20 ? 1 : 0, productivity: p.stability >= 80 ? 1 : 0,
      upkeep: -(p.troops > 16 ? 2 : p.troops > 10 ? 1 : 0), readiness: -p.readiness, interest: -Math.ceil(p.debt / 5), sanctions: 0, unrest: p.stability < 25 ? -1 : 0 };
    lines.sanctions = -Math.min(this.sanctionsOn(i), lines.industry + lines.trade);
    return { lines, net: Object.values(lines).reduce((a, b) => a + b, 0) }; }
  score(i: number) { const p = this.n(i); return p.regions.length + Math.floor(p.gold / 3) + (p.stability >= 75 ? 1 : 0) - Math.floor(p.debt / 5) + Object.keys(p.tech).length; }

  // ---------- commands (one operation each unless noted) ----------
  private gate(i: number, cost: number, needsOp = true): Result { const p = this.n(i); if (this.s.over) return 'over'; if (needsOp && p.ops >= OPS_PER_ROUND) return 'noOps'; if (p.gold < cost) return 'noGold'; return 'ok'; }
  private addOpinion(a: number, b: number, d: number) { if (a !== b) this.s.opinion[a][b] = clamp(this.s.opinion[a][b] + d, -100, 100); }
  private stab(i: number, d: number) { this.n(i).stability = clamp(this.n(i).stability + d, 0, 100); }

  startResearch(i: number, t: TechId): Result { const p = this.n(i), c = this.costResearch(i, t), g = this.gate(i, c); if (g !== 'ok') return g;
    if (this.researchBlock(i, t) !== '') return 'requirement'; if (p.research.length >= this.researchSlots(i)) return 'limit';
    p.gold -= c; p.ops++; p.research.push({ id: t, left: TECH[t].rounds, total: TECH[t].rounds }); this.emit({ type: 'researchStarted', nation: i, tech: t }); this.signal(i); return 'ok'; }
  buildMissile(i: number, heavy = false): Result { const p = this.n(i), c = this.costMissile(i, heavy), g = this.gate(i, c); if (g !== 'ok') return g;
    if (!this.has(i, heavy ? 'heavy' : 'rocket')) return 'requirement'; p.gold -= c; p.ops++; if (heavy) p.heavy++; else p.missiles++; return 'ok'; }
  deployAirDefense(i: number): Result { const p = this.n(i), c = this.costAirDefense(i), g = this.gate(i, c); if (g !== 'ok') return g; if (p.airDefense >= 2) return 'limit'; p.gold -= c; p.ops++; p.airDefense++; return 'ok'; }
  upgradeIntel(i: number): Result { const p = this.n(i), c = this.costIntel(i), g = this.gate(i, c); if (g !== 'ok') return g; if (p.intel >= 2) return 'limit'; p.gold -= c; p.ops++; p.intel++; return 'ok'; }
  buildIndustry(i: number): Result { const p = this.n(i), c = this.costIndustry(i), g = this.gate(i, c); if (g !== 'ok') return g; if (p.industry >= 2) return 'limit'; p.gold -= c; p.ops++; p.industry++; return 'ok'; }
  buyFuel(i: number): Result { const p = this.n(i), c = this.costFuel(i), g = this.gate(i, c); if (g !== 'ok') return g; if (p.fuel >= 8) return 'limit'; p.gold -= c; p.ops++; p.fuel = Math.min(8, p.fuel + 2); return 'ok'; }
  setReadiness(i: number, level: number): Result { const p = this.n(i), g = this.gate(i, 0); if (g !== 'ok') return g; if (level === p.readiness || level < 0 || level > 2) return 'invalid'; if (p.readinessRound === this.s.round) return 'limit';
    const up = level > p.readiness; p.readiness = level; p.readinessRound = this.s.round; p.ops++; if (up) this.others(i).forEach(q => this.addOpinion(q, i, -3 * level));
    this.emit({ type: 'readinessChanged', nation: i, level }); return 'ok'; }
  sanction(i: number, t: number): Result { const g = this.gate(i, 0); if (g !== 'ok') return g; if (t === i || !this.n(t)?.alive || this.pact(i, t) || this.s.sanctions.some(x => x.by === i && x.target === t)) return 'invalid';
    this.s.sanctions.push({ by: i, target: t, until: Math.min(this.s.maxRound, this.s.round + 2) }); this.n(i).ops++; this.addOpinion(t, i, -20); this.emit({ type: 'sanction', a: i, b: t });
    this.log(this.n(i).name + ' فرضت عقوبات اقتصادية على ' + this.n(t).name); return 'ok'; }
  envoy(i: number, t: number): Result { const g = this.gate(i, 1); if (g !== 'ok') return g; if (t === i || !this.n(t)?.alive) return 'invalid'; const p = this.n(i); p.gold--; p.ops++; this.addOpinion(t, i, 12); this.addOpinion(i, t, 8);
    this.emit({ type: 'envoy', a: i, b: t }); this.log(p.name + ' أوفدت مبعوثاً إلى ' + this.n(t).name); return 'ok'; }
  proposePact(i: number, t: number): Result { const g = this.gate(i, 0); if (g !== 'ok') return g; if (t === i || !this.n(t)?.alive || this.pact(i, t)) return 'invalid'; this.n(i).ops++;
    const r = this.s.opinion[t][i]; const yes = !this.inCrisis(t, i) && r >= -15 && (r >= 10 || this.foe(t) !== i);
    if (yes) { this.s.pacts.push({ a: i, b: t, until: this.s.round + 2 }); this.addOpinion(i, t, 20); this.addOpinion(t, i, 20); this.emit({ type: 'pactSigned', a: i, b: t }); this.log('معاهدة عدم اعتداء بين ' + this.n(i).name + ' و' + this.n(t).name); }
    else { this.addOpinion(i, t, -5); this.emit({ type: 'pactRejected', a: i, b: t }); } return 'ok'; }
  orderIntel(i: number, t: number): Result { const p = this.n(i), g = this.gate(i, 1); if (g !== 'ok') return g; const q = this.n(t); if (t === i || !q?.alive) return 'invalid'; p.gold--; p.ops++;
    if (q.intel > p.intel || (this.has(t, 'crypto') && this.rand() < .35)) {
      (p.dossier[t] ??= []).unshift({ ...this.blankReport(t), failed: true }); this.addOpinion(t, i, -10); this.emit({ type: 'spyCaught', nation: i, by: t }); this.log('كُشف عملاء ' + p.name + ' عند ' + q.name, i); return 'ok'; }
    const r = this.makeReport(i, t, this.has(i, 'sigint') ? 'sig' : 'hum'); this.emit({ type: 'intelReport', nation: i, report: r }); return 'ok'; }
  launchMissile(i: number, t: number, heavy = false, region?: number): Result { const p = this.n(i); if (this.s.over) return 'over'; if (p.ops >= OPS_PER_ROUND) return 'noOps';
    if (p.launched) return 'limit'; if ((heavy ? p.heavy : p.missiles) < 1 || p.fuel < 1) return 'requirement'; if (!this.missileTargets(i).includes(t)) return 'invalid';
    const d = this.n(t); const reg = region !== undefined && d.regions.includes(region) ? region : d.capital;
    if (heavy) p.heavy--; else p.missiles--; p.launched = true; p.ops++; p.fuel--;
    const det = this.detectionChance(t, i), roll = this.rand() * 100; const stage = roll < det * .6 ? 'early' : roll < det ? 'late' : 'miss';
    const unsure = stage !== 'miss' && !this.has(t, 'ew2') && this.rand() < .3;
    let tried = false, intercepted = false; if (stage !== 'miss' && d.airDefense - d.interceptorsUsed > 0) { tried = true; d.interceptorsUsed++; intercepted = this.rand() * 100 < this.interceptChance(t, i, stage === 'early'); }
    const civil = !intercepted && this.has(t, 'civil') && (stage === 'early' || (stage === 'late' && this.has(t, 'ew2')));
    let casualties = 0; if (!intercepted) { casualties = Math.max(0, Math.min(d.troops - 1, (heavy ? 1 : 2) - (civil ? 1 : 0))); d.troops -= casualties; if (heavy) d.damaged[reg] = 2; this.stab(t, -5); }
    const strike: Strike = { round: this.s.round, from: i, to: t, region: reg, heavy, stage, unsure, tried, intercepted, casualties, civil };
    this.s.strikes.unshift(strike); if (this.s.strikes.length > 20) this.s.strikes.length = 20;
    d.warnings.unshift({ round: this.s.round, kind: intercepted ? 'intercepted' : 'hit', from: stage === 'miss' ? null : i, region: reg, stage }); if (d.warnings.length > 8) d.warnings.length = 8;
    this.addOpinion(t, i, intercepted ? -18 : -30); this.others(i).forEach(q => { if (q !== t) this.addOpinion(q, i, -4); });
    this.log(p.name + ' أطلقت صاروخاً على ' + MAP.regions[reg].name + ' (' + d.name + '): ' + (intercepted ? 'اعتُرض' : 'أصاب الهدف'));
    this.emit({ type: 'missileLaunched', strike }); this.emit({ type: 'missileResolved', strike }); return 'ok'; }

  // ---------- intelligence ----------
  private blankReport(t: number): IntelReport { const z = { lo: 0, hi: 0 }; return { target: t, round: this.s.round, due: this.s.round, source: 'hum', confidence: 0, verified: false, failed: false,
    gold: z, troops: z, missiles: z, heavy: z, airDefense: z, intel: z, fuel: z, stability: z, industry: z, readiness: null, techs: null, techCount: z, programs: [], unexplained: false, pacts: [] }; }
  makeReport(i: number, t: number, source: keyof typeof SOURCE): IntelReport {
    const p = this.n(i), q = this.n(t); const list = (p.dossier[t] ??= []);
    let conf = 45 + 15 * p.intel + (source === 'sat' ? 15 : source === 'sig' ? 8 : 0) - (this.has(t, 'crypto') ? 15 : 0) - (this.s.weather === 'fog' && source === 'sat' ? 10 : 0);
    const verified = list.some(r => !r.failed && this.s.round - r.round <= 1 && r.source !== source); if (verified) conf += 12; conf = clamp(conf, 20, 95);
    const est = (v: number, k = 1): Range => { const e = Math.round((100 - conf) / 100 * (v * .5 + 2 * k)); let lo = v - this.below(e + 1), hi = lo + e;
      if (this.rand() * 100 > conf + 25) { const sh = (e + 1) * (this.rand() < .5 ? -1 : 1); lo += sh; hi += sh; } lo = Math.max(0, lo); return { lo, hi: Math.max(lo, hi) }; };
    const lvl = (v: number): Range => conf >= 65 ? { lo: v, hi: v } : { lo: Math.max(0, v - this.below(2)), hi: v + this.below(2) };
    const techs = Object.keys(q.tech) as TechId[];
    const r: IntelReport = { target: t, round: this.s.round, due: source === 'hum' && p.intel < 1 ? this.s.round + 1 : this.s.round, source, confidence: conf, verified, failed: false,
      gold: est(q.gold), troops: est(q.troops), missiles: est(q.missiles), heavy: est(q.heavy), airDefense: lvl(q.airDefense), intel: lvl(q.intel), fuel: est(q.fuel), stability: est(q.stability, 5), industry: lvl(q.industry),
      readiness: this.rand() * 100 < conf ? q.readiness : null, techs: conf >= 55 ? techs : null, techCount: est(techs.length),
      programs: q.research.filter(() => this.rand() * 100 < conf).map(x => ({ id: x.id, eta: this.s.round + x.left })), unexplained: false,
      pacts: this.others(t).filter(o => this.pact(t, o)) };
    r.unexplained = r.programs.length === 0 && q.research.length > 0 && conf < 60;
    list.unshift(r); if (list.length > 5) list.length = 5; return r; }
  private signal(_actor: number) { /* SIGINT feed: reserved for the signals room (milestone 3+) */ }
  private borderForce(i: number, q: number) { const mine = new Set(this.n(i).regions), theirs = new Set(this.n(q).regions); let touching = 0;
    MAP.adj.forEach(([a, b]) => { if ((mine.has(a) && theirs.has(b)) || (mine.has(b) && theirs.has(a))) touching++; });
    return Math.round(this.n(q).troops * Math.min(1, .25 + touching * .12) + (this.inCrisis(i, q) ? 2 : 0) + (this.s.opinion[q][i] <= -20 ? 2 : 0)); }
  private intelCycle() { this.s.nations.forEach((p, i) => { if (!p.alive) return;
    this.others(i).forEach(qi => { const q = this.n(qi); const noise = Math.max(0, 2 - p.intel); const est = Math.max(0, this.borderForce(i, qi) + this.below(noise * 2 + 1) - noise);
      const mob = q.readiness > 0 && this.rand() * 100 < 40 + 20 * p.intel ? q.readiness : 0;
      const conf = clamp(50 + 15 * p.intel + (this.has(i, 'sat') ? 10 : 0) - (this.s.weather === 'fog' ? 10 : 0) - (this.has(qi, 'crypto') ? 10 : 0), 20, 95);
      let sc = est + mob * 2 + (this.inCrisis(i, qi) ? 2 : 0) - (this.s.opinion[qi][i] >= 30 ? 2 : 0); const pact = this.pact(i, qi); if (pact) sc = 0;
      const level = pact ? 0 : sc < 4 ? 1 : sc < 7 ? 2 : sc < 10 ? 3 : 4; p.threat[qi] = { est, mob, conf, level, round: this.s.round };
      if (i === this.me) this.emit({ type: 'threat', nation: i, about: qi, level });
      if (this.has(i, 'sat') && this.s.round > 1) this.makeReport(i, qi, 'sat'); }); }); }

  // ---------- end of round: computer kingdoms act, the world moves on ----------
  private foe(i: number): number | null { const c = this.others(i).filter(q => !this.pact(i, q)); if (!c.length) return null; return c.sort((a, b) => this.s.opinion[i][a] - this.s.opinion[i][b] || a - b)[0]; }
  private aiTurn(i: number) { const p = this.n(i); if (!p.alive) return; const foe = this.foe(i); const mx = Math.max(0, ...this.others(i).map(q => p.threat[q]?.level ?? 0));
    const want = mx >= 4 ? 2 : mx >= 3 ? 1 : 0; if (want !== p.readiness && (want < p.readiness || p.gold >= want + 2)) this.setReadiness(i, want);
    if (p.fuel <= 1) this.buyFuel(i);
    const order: Record<string, TechId[]> = { p: ['radar', 'rocket', 'crypto', 'train', 'guid', 'ew2', 'heavy', 'civil'], d: ['rocket', 'train', 'doctrine', 'logi', 'guid', 'heavy', 'radar'], f: ['train', 'logi', 'radar', 'rocket', 'doctrine', 'fort', 'civil'], m: ['train', 'radar'] };
    const pick = (order[p.k] ?? []).find(t => this.researchBlock(i, t) === ''); if (pick && p.research.length < this.researchSlots(i) && p.gold >= this.costResearch(i, pick) + 1) this.startResearch(i, pick);
    if (foe !== null && this.has(i, 'rocket') && p.missiles < 2 && p.gold >= this.costMissile(i, false) + 1 && this.s.opinion[i][foe] <= -15) this.buildMissile(i);
    if (foe !== null && p.missiles + p.heavy > 0 && !p.launched && p.fuel >= 2 && this.s.opinion[i][foe] <= -36) this.launchMissile(i, foe, p.heavy > 0);
    if (foe !== null && this.s.opinion[i][foe] <= -45 && this.rand() < .5) this.sanction(i, foe);
    if (p.industry < 1 && this.s.round <= 5 && p.gold >= this.costIndustry(i) + 2) this.buildIndustry(i);
    if (p.airDefense < 1 && mx >= 3 && p.gold >= this.costAirDefense(i) + 1) this.deployAirDefense(i); }

  endRound(): void { const s = this.s; if (s.over) return;
    s.nations.forEach((p, i) => { if (p.ai) this.aiTurn(i); });
    // income and domestic stability
    s.nations.forEach((p, i) => { if (!p.alive) return; const inc = this.income(i); p.gold += inc.net; if (p.gold < 0) { p.debt += -p.gold; p.gold = 0; this.stab(i, -5); }
      let d = (p.readiness === 2 ? -4 : 0) + (p.debt > 5 ? -3 : 0) + (this.reputation(i) >= 15 ? 2 : 0) + (p.stability < 65 ? 2 : p.stability > 65 ? -1 : 0);
      s.crises.forEach(c => { if (c.a === i || c.b === i) d -= 1; }); this.stab(i, d); if (i === this.me) this.emit({ type: 'income', nation: i, net: inc.net }); });
    if (s.round >= s.maxRound) { s.over = true; const w = s.nations.map((_, i) => i).sort((a, b) => this.score(b) - this.score(a))[0]; this.emit({ type: 'gameOver', winner: w }); return; }
    // ----- next round -----
    s.round++; const ids: WeatherId[] = ['clear', 'clear', 'clear', 'rain', 'storm', 'snow', 'sand', 'fog']; s.weather = ids[this.below(ids.length)];
    s.pacts = s.pacts.filter(x => x.until >= s.round); s.sanctions = s.sanctions.filter(x => x.until >= s.round);
    s.nations.forEach((p, i) => { if (!p.alive) return; p.ops = 0; p.launched = false; p.interceptorsUsed = 0;
      for (const r in p.damaged) { if (--p.damaged[r] <= 0) delete p.damaged[r]; }
      p.research = p.research.filter(pr => { pr.left--; if (pr.left > 0) return true;
        if (TECH[pr.id].test && !pr.retest && this.rand() < (p.industry ? .12 : .25)) { pr.left = 1; pr.retest = true; this.emit({ type: 'researchTestFailed', nation: i, tech: pr.id }); return true; }
        p.tech[pr.id] = s.round; this.emit({ type: 'researchCompleted', nation: i, tech: pr.id }); return false; });
      p.fuel = clamp(p.fuel + 1 + p.industry - (p.readiness === 2 ? 1 : 0), 0, 8);
      if ((p.airDefense > 0 || this.has(i, 'radar')) && !this.has(i, 'ew2') && this.rand() < .14) { this.stab(i, -2); if (p.readiness > 0 && p.airDefense > 0) p.interceptorsUsed = 1;
        p.warnings.unshift({ round: s.round, kind: 'false', from: null, region: null, stage: 'early' }); if (p.warnings.length > 8) p.warnings.length = 8; this.emit({ type: 'falseAlarm', nation: i }); } });
    const al = s.nations.map((_, i) => i).filter(i => s.nations[i].alive);
    // arms race: rivals who keep forces on alert drift further apart every round unless someone de-escalates
    for (let x = 0; x < al.length; x++) for (let y = x + 1; y < al.length; y++) { const a = al[x], b = al[y];
      if (Math.min(s.opinion[a][b], s.opinion[b][a]) <= -20 && !this.pact(a, b) && (s.nations[a].readiness > 0 || s.nations[b].readiness > 0)) { this.addOpinion(a, b, -4); this.addOpinion(b, a, -4); } }
    for (let x = 0; x < al.length; x++) for (let y = x + 1; y < al.length; y++) { const a = al[x], b = al[y], lo = Math.min(s.opinion[a][b], s.opinion[b][a]);
      if (lo <= -50 && !this.inCrisis(a, b) && !this.pact(a, b)) { s.crises.push({ a, b, round: s.round }); this.stab(a, -3); this.stab(b, -3); this.emit({ type: 'crisisStarted', a, b }); this.log('أزمة دبلوماسية بين ' + this.n(a).name + ' و' + this.n(b).name); } }
    s.crises = s.crises.filter(c => { const keep = Math.min(s.opinion[c.a][c.b], s.opinion[c.b][c.a]) <= -30; if (!keep) this.emit({ type: 'crisisEnded', a: c.a, b: c.b }); return keep; });
    this.intelCycle(); this.emit({ type: 'roundStarted', round: s.round, weather: s.weather }); }

  // ---------- persistence ----------
  save(): string { return JSON.stringify(this.s); }
  load(data: string): boolean { try { const s = JSON.parse(data) as State; if (!s || !Array.isArray(s.nations) || typeof s.rng !== 'number' || s.nations.length !== KINGDOMS.length) return false; this.s = s; return true; } catch { return false; } }
}
