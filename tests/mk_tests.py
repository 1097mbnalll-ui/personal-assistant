"""Generates tests/t4.html: plays 3 full random games (hot-seat, computer-run kingdoms, walking inside buildings) and opens every
institution screen each turn. Open in Chrome; body gets data-ok or data-err. `python3 tests/mk_tests.py fast` skips the slow interior game."""
import sys
import os
B=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(os.path.join(B,'dist','index.html'),encoding='utf-8').read()
H="render();setView(V.ok&&!location.hash.includes('2d'));"
assert H in s
game='''const FAST=__FAST__;
window.onerror=(m,u,l,c,er)=>{document.body.setAttribute('data-err',m+' @'+l+' '+(er&&er.stack||'').slice(0,300))};
const pick=a=>a[rnd(a.length)];
function mgmt(pi){const p=G.players[pi];
 if(pi%2===0&&!has(p,'rocket'))startRD(pi,'rocket');
 for(let k=0;k<6;k++){const r=rnd(12);
  if(r===0&&p.gold>=price('troops',p))buy('troops');
  if(r===1)defUp(pi);if(r===2)buyMis(pi,'n');if(r===3)buyMis(pi,'h');
  if(r===4||r===5){const t=p.mis.h?'h':'n';startAim(pi,t);if(G.aim){const ts=missileTargets(pi);aimClick(pick(ts));const b=document.querySelector('#dlgBtns .primary');if(b)b.click()}}
  if(r===6)intelUp(pi);if(r===7&&others(pi).length)spyReport(pi,pick(others(pi)));if(r===8&&others(pi).length)sabotage(pi,pick(others(pi)));
  if(r===9&&others(pi).length){proposePact(pi,pick(others(pi)));const bs=document.querySelectorAll('#dlgBtns button');if(bs.length)pick([...bs]).click()}
  if(r===10&&others(pi).length)sendAid(pi,pick(others(pi)),1+rnd(3));
  if(r===11&&others(pi).length)breakPact(pi,pick(others(pi)));
 }
 for(let k=0;k<4;k++){const r=rnd(11),o=others(pi);
  if(r===0)setReady(pi,rnd(3));if(r===1)setTax(pi,rnd(3));if(r===2)borrow(pi);if(r===3)repay(pi);if(r===4)buildInd(pi);if(r===5)buyFuel(pi);
  if(r===6||r===7)startRD(pi,pick(Object.keys(TECH)));if(r===8&&o.length)sanction(pi,pick(o));if(r===9&&o.length)envoy(pi,pick(o));if(r===10&&o.length)liftSanction(pi,pick(o))}
 for(const m in INST)for(const t of INST[m].tabs){openMinistry(m,pi,false,t[0]);tabs++;closeDlg()}
 autoPlace();}
let tabs=0;
function runGame(withInterior,ais){newGame(4,[],ais);V.instant=true;let launches=0,guard=0;
for(let r=0;r<7&&G.phase!=='end';r++){
 applyEvent();
 while(G.phase==='market'){const pi=PI();if(++guard>4000)throw new Error('stuck in market');if(P().ai){aiAct();continue}
  if(withInterior&&V.ok){enterK(true);enterBuilding(pick(['hq','def','intel','foreign']));interiorFrame(.016,performance.now());goTo('desk');for(let f=0;f<50;f++){V.fp&&fpStep(.03)}closeDlg();V.int.hs.filter(h=>h.tab).forEach(h=>{goTo(h.id);for(let f=0;f<40;f++){V.fp&&fpStep(.03)}if(!V.minOpen)throw new Error('hotspot '+h.id+' did not open');closeDlg()});goTo('window');for(let f=0;f<50;f++){V.fp&&fpStep(.03)}if(V.mode==='tower'){backFromTower()}exitBuilding()}
  const before=G.players[pi].mis.n+G.players[pi].mis.h;mgmt(pi);if(G.players[pi].launched)launches++;endMarketTurn()}
 while(G.phase==='cards'){if(P().ai){aiAct();continue}chooseCard(['attack','move','peace'][rnd(3)])}
 startMove();
 while(G.phase==='move'){const pi=PI();if(P().ai){aiAct();continue}const o=owned(pi).filter(i=>movable(i)>0);if(o.length){onRegion(o[0]);const d=owned(pi).find(i=>i!==o[0]&&G.reg[i].troops<cap(i));if(d!=null)onRegion(d)}next(startAttack)}
 while(G.phase==='attack'){const pi=PI();if(P().ai){aiAct();continue}const ts=[...attackTargets(pi)];if(!ts.length){P().att={target:0,from:{}};}else{onRegion(ts[rnd(ts.length)]);const a=P().att;for(const j in a.from)a.from[j]=movable(+j)}hideCurtain();next(resolve)}
 income();endRound();
}
let bad=[];G.reg.forEach((r,i)=>{if(r.troops<0||r.troops>cap(i)+2||(r.owner==null&&r.troops>0))bad.push(R[i].name+':'+r.troops+'/'+cap(i))});
G.players.forEach(p=>{const s=p.s;if(p.gold<0||p.mis.n<0||p.mis.h<0)bad.push('neg '+p.name+' g='+p.gold+' n='+p.mis.n+' h='+p.mis.h);if(!(s.stab>=0&&s.stab<=100)||s.fuel<0||s.fuel>8||s.debt<0||s.infl<0||s.rd.length>2)bad.push('sim '+p.name+' '+JSON.stringify([s.stab,s.fuel,s.debt,s.infl,s.rd.length]))});
G.rel.forEach(r=>r.forEach(v=>{if(!(v>=-100&&v<=100))bad.push('rel '+v)}));
return {phase:G.phase,bad,launches,tech:G.players.map(p=>Object.keys(p.s.tech).length).join('/'),stab:G.players.map(p=>p.s.stab).join('/'),score:G.players.map((p,i)=>score(i).total).join('/'),reports:G.players.reduce((n,p)=>n+Object.values(p.s.dos).reduce((a,l)=>a+l.length,0),0),battles:G.reps.length,pacts:G.log.filter(l=>l.t.includes('معاهدة')).length,mis:G.log.filter(l=>l.t.includes('صاروخ')).length,spy:G.log.filter(l=>l.t.includes('استخبار')||l.t.includes('تخريب')).length}}
try{const out=[runGame(false),runGame(false,[false,true,true,true]),runGame(false,[true,true,true,true])];if(!FAST)out.push(runGame(true));out.push({tabs});document.body.setAttribute('data-ok',JSON.stringify(out))}catch(e){document.body.setAttribute('data-err',e.message+' '+(e.stack||'').slice(0,400))}
'''
open(os.path.join(B,'tests','t4.html'),'w',encoding='utf-8').write(s.replace(H,"render();setView(V.ok);\n"+game.replace('__FAST__','true' if 'fast' in sys.argv else 'false')))
