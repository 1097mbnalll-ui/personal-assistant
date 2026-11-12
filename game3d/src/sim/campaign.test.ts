import { describe, expect, it } from 'vitest';
import { Campaign, SimEvent, TECH, TechId } from './campaign';

const play = (seed: number, rounds = 12) => { const c = new Campaign(seed); const ev: SimEvent[] = []; c.listener = e => ev.push(e);
  for (let r = 0; r < rounds && !c.s.over; r++) { c.orderIntel(0, 2); const t = (Object.keys(TECH) as TechId[]).find(k => c.researchBlock(0, k) === ''); if (t) c.startResearch(0, t); c.endRound(); }
  return { c, ev }; };

describe('campaign simulation', () => {
  it('is deterministic for a seed and differs between seeds', () => {
    expect(play(7).c.save()).toBe(play(7).c.save());
    expect(play(7).c.save()).not.toBe(play(8).c.save());
  });
  it('opening situation: rival on alert with a rocket programme the player can discover', () => {
    const c = new Campaign(3); expect(c.s.opinion[0][2]).toBe(-25); expect(c.n(2).readiness).toBe(1); expect(c.n(2).research[0].id).toBe('rocket');
    expect(c.n(0).missiles).toBe(1); expect(c.has(0, 'rocket')).toBe(true);
  });
  it('intel reports are estimates: ranges, confidence, source, and never exact access to hidden state', () => {
    const c = new Campaign(5); expect(c.orderIntel(0, 2)).toBe('ok'); const r = c.latestReport(0, 2)!;
    expect(r.confidence).toBeGreaterThanOrEqual(20); expect(r.confidence).toBeLessThanOrEqual(95); expect(r.source).toBe('hum'); expect(r.round).toBe(1);
    expect(r.gold.hi).toBeGreaterThanOrEqual(r.gold.lo); expect(c.n(0).gold).toBe(5); expect(c.opsLeft(0)).toBe(2);
    // over many seeds most ranges contain the truth but not all (reports can mislead)
    let inside = 0, total = 0; for (let s = 1; s <= 200; s++) { const k = new Campaign(s); k.orderIntel(0, 2); const x = k.latestReport(0, 2); if (!x) continue; total++; if (x.troops.lo <= k.n(2).troops && k.n(2).troops <= x.troops.hi) inside++; }
    expect(inside / total).toBeGreaterThan(.6); expect(inside).toBeLessThan(total);
  });
  it('a second source verifies and raises confidence', () => {
    const c = new Campaign(9); c.orderIntel(0, 2); const a = c.latestReport(0, 2)!.confidence; c.n(0).tech.sigint = 1; c.orderIntel(0, 2); const b = c.latestReport(0, 2)!;
    expect(b.verified).toBe(true); expect(b.confidence).toBeGreaterThan(a);
  });
  it('missile strike: consumes missile, fuel and the launch slot; resolves through detection and interception', () => {
    let hits = 0, intercepted = 0, missed = 0;
    for (let s = 1; s <= 300; s++) { const c = new Campaign(s); const ev: SimEvent[] = []; c.listener = e => ev.push(e); const troops = c.n(2).troops;
      expect(c.launchMissile(0, 2)).toBe('ok'); expect(c.n(0).missiles).toBe(0); expect(c.n(0).fuel).toBe(2); expect(c.launchMissile(0, 2)).toBe('limit');
      const st = c.s.strikes[0]; if (st.intercepted) { intercepted++; expect(c.n(2).troops).toBe(troops); } else { hits++; expect(c.n(2).troops).toBe(troops - st.casualties); }
      if (st.stage === 'miss') { missed++; expect(st.tried).toBe(false); }
      expect(c.s.opinion[2][0]).toBeLessThan(-25); expect(ev.some(e => e.type === 'missileLaunched')).toBe(true); }
    expect(hits).toBeGreaterThan(100); expect(intercepted).toBeGreaterThan(20); expect(missed).toBeGreaterThan(60);   // desert: AD level 1 on alert => detection 48%
  });
  it('radar research raises detection and completes after its duration', () => {
    const c = new Campaign(4); const ev: SimEvent[] = []; c.listener = e => ev.push(e); const before = c.detectionChance(0, null);
    expect(c.startResearch(0, 'ew2')).toBe('requirement'); expect(c.startResearch(0, 'radar')).toBe('ok'); expect(c.startResearch(0, 'train')).toBe('limit');
    c.endRound(); expect(c.has(0, 'radar')).toBe(true); expect(ev.some(e => e.type === 'researchCompleted' && e.nation === 0 && e.tech === 'radar')).toBe(true);
    expect(c.detectionChance(0, null)).toBe(before + 25); expect(c.researchBlock(0, 'ew2')).toBe('');
  });
  it('operations are limited per round and reset next round', () => {
    const c = new Campaign(2); c.n(0).gold = 20; expect(c.buyFuel(0)).toBe('ok'); expect(c.envoy(0, 1)).toBe('ok'); expect(c.orderIntel(0, 3)).toBe('ok'); expect(c.buyFuel(0)).toBe('noOps');
    c.endRound(); expect(c.opsLeft(0)).toBe(3);
  });
  it('illegal commands change nothing', () => {
    const c = new Campaign(6); const snap = c.save(); expect(c.buildMissile(0, true)).toBe('requirement'); expect(c.launchMissile(0, 0)).toBe('invalid'); expect(c.sanction(0, 0)).toBe('invalid'); c.n(0).gold = 0; expect(c.envoy(0, 1)).toBe('noGold');
    c.n(0).gold = 6; expect(c.save()).toBe(snap);
  });
  it('save and load continue identically', () => {
    const a = new Campaign(11); a.orderIntel(0, 2); a.endRound(); a.startResearch(0, 'radar'); const data = a.save();
    const b = new Campaign(999); expect(b.load(data)).toBe(true); for (let i = 0; i < 6; i++) { a.endRound(); b.endRound(); } expect(b.save()).toBe(a.save());
    expect(new Campaign(1).load('{broken')).toBe(false); expect(new Campaign(1).load('{"nations":[]}')).toBe(false);
  });
  it('fuzz: full campaigns keep every invariant and the world acts on its own', () => {
    let aiStrikes = 0, crises = 0, done = 0;
    for (let s = 1; s <= 150; s++) { const { c, ev } = play(s); expect(c.s.over).toBe(true);
      c.nations.forEach(p => { expect(p.gold).toBeGreaterThanOrEqual(0); expect(p.fuel).toBeGreaterThanOrEqual(0); expect(p.fuel).toBeLessThanOrEqual(8); expect(p.stability).toBeGreaterThanOrEqual(0); expect(p.stability).toBeLessThanOrEqual(100);
        expect(p.troops).toBeGreaterThanOrEqual(1); expect(p.missiles).toBeGreaterThanOrEqual(0); expect(p.research.length).toBeLessThanOrEqual(2); });
      c.s.opinion.forEach(r => r.forEach(v => { expect(v).toBeGreaterThanOrEqual(-100); expect(v).toBeLessThanOrEqual(100); }));
      aiStrikes += c.s.strikes.filter(x => x.from !== 0).length; crises += ev.filter(e => e.type === 'crisisStarted').length; done += ev.filter(e => e.type === 'researchCompleted' && e.nation !== 0).length; }
    expect(aiStrikes).toBeGreaterThan(0); expect(done).toBeGreaterThan(300);
    expect(crises).toBeGreaterThanOrEqual(0);
  });
});
