"""Generates tests/t4.html: plays 2 full random games (one entering buildings). Open in Chrome; body gets data-ok or data-err."""
import os
B=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(os.path.join(B,'dist','index.html'),encoding='utf-8').read()
H="render();setView(V.ok&&!location.hash.includes('2d'));"
assert H in s
game='''window.onerror=(m,u,l,c,er)=>{document.body.setAttribute('data-err',m+' @'+l+' '+(er&&er.stack||'').slice(0,300))};
const pick=a=>a[rnd(a.length)];
function mgmt(pi){const p=G.players[pi];
 for(let k=0;k<6;k++){const r=rnd(12);
  if(r===0&&p.gold>=price('troops',p))buy('troops');
  if(r===1)defUp(pi);if(r===2)buyMis(pi,'n');if(r===3)buyMis(pi,'h');
  if(r===4||r===5){const t=p.mis.h?'h':'n';startAim(pi,t);if(G.aim){const ts=missileTargets(pi);aimClick(pick(ts));const b=document.querySelector('#dlgBtns .primary');if(b)b.click()}}
  if(r===6)intelUp(pi);if(r===7&&others(pi).length)spyReport(pi,pick(others(pi)));if(r===8&&others(pi).length)sabotage(pi,pick(others(pi)));
  if(r===9&&others(pi).length){proposePact(pi,pick(others(pi)));const bs=document.querySelectorAll('#dlgBtns button');if(bs.length)pick([...bs]).click()}
  if(r===10&&others(pi).length)sendAid(pi,pick(others(pi)),1+rnd(3));
  if(r===11&&others(pi).length)breakPact(pi,pick(others(pi)));
 }
 openMinistry(pick(['def','intel','foreign']),pi,false);closeDlg();
 autoPlace();}
function runGame(withInterior){newGame(4,[]);V.instant=true;let launches=0;
for(let r=0;r<7&&G.phase!=='end';r++){
 applyEvent();
 while(G.phase==='market'){const pi=PI();
  if(withInterior&&V.ok){enterK(true);enterBuilding(pick(['def','intel','foreign']));interiorFrame(.016,performance.now());goTo('desk');for(let f=0;f<50;f++){V.fp&&fpStep(.03)}closeDlg();goTo('window');for(let f=0;f<50;f++){V.fp&&fpStep(.03)}if(V.mode==='tower'){backFromTower()}exitBuilding()}
  const before=G.players[pi].mis.n+G.players[pi].mis.h;mgmt(pi);if(G.players[pi].launched)launches++;endMarketTurn()}
 while(G.phase==='cards'){chooseCard(['attack','move','peace'][rnd(3)])}
 startMove();
 while(G.phase==='move'){const pi=PI();const o=owned(pi).filter(i=>movable(i)>0);if(o.length){onRegion(o[0]);const d=owned(pi).find(i=>i!==o[0]&&G.reg[i].troops<cap(i));if(d!=null)onRegion(d)}next(startAttack)}
 while(G.phase==='attack'){const pi=PI();const ts=[...attackTargets(pi)];if(!ts.length){P().att={target:0,from:{}};}else{onRegion(ts[rnd(ts.length)]);const a=P().att;for(const j in a.from)a.from[j]=movable(+j)}hideCurtain();next(resolve)}
 income();endRound();
}
let bad=[];G.reg.forEach((r,i)=>{if(r.troops<0||r.troops>cap(i)+2||(r.owner==null&&r.troops>0))bad.push(R[i].name+':'+r.troops+'/'+cap(i))});
G.players.forEach(p=>{if(p.gold<0||p.mis.n<0||p.mis.h<0)bad.push('neg '+p.name+' g='+p.gold+' n='+p.mis.n+' h='+p.mis.h)});
return {phase:G.phase,bad,launches,pacts:G.log.filter(l=>l.t.includes('معاهدة')).length,mis:G.log.filter(l=>l.t.includes('صاروخ')).length,spy:G.log.filter(l=>l.t.includes('استخبار')||l.t.includes('تخريب')).length}}
try{const r1=runGame(false);const r2=runGame(true);document.body.setAttribute('data-ok',JSON.stringify([r1,r2]))}catch(e){document.body.setAttribute('data-err',e.message+' '+(e.stack||'').slice(0,400))}
'''
open(os.path.join(B,'tests','t4.html'),'w',encoding='utf-8').write(s.replace(H,"render();setView(V.ok);\n"+game))
