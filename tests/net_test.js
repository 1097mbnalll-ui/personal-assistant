/* Online multiplayer end-to-end test: 1 host + 2 phone clients (+1 computer kingdom) in separate tabs, talking
   over the BroadcastChannel transport (?net=local). Every tab plays through its own UI-level functions (client calls
   are forwarded to the host). Checks: game reaches the end, all tabs agree, secrets stay hidden, no page errors.
   Run: python3 build.py && node tests/net_test.js   (needs Playwright + Chromium) */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'});r.end(d)})});
const BOT=`window.__bot=function(){if(!G)return 'nog';const me=ME,p=G.players[me];if(!p)return 'nop';const ph=G.phase;if(ph==='end')return 'end';
 if(G.offers&&G.offers.some(o=>o.b===me)){const o=G.offers.find(o=>o.b===me);answerPact(me,o.id,Math.random()<.5);return 'offer'}
 if(['event','reveal','resolve','income'].includes(ph)){const r=G.rdy&&G.rdy.k===ph+'|'+G.round?G.rdy.s:{};if(!r[me])ready();return 'ready'}
 if(!G.queue.includes(me)||G.done[me]||!p.alive)return 'wait';
 const o=others(me),pick=a=>a[Math.floor(Math.random()*a.length)];
 if(ph==='market'){if(window.__mk===G.round)return 'mk-wait';window.__mk=G.round;
  const ops=[()=>buy('troops'),()=>startRD(me,pick(Object.keys(TECH))),()=>spyReport(me,pick(o)),()=>setReady(me,Math.floor(Math.random()*3)),()=>proposePact(me,pick(o)),()=>buyFuel(me),()=>sanction(me,pick(o)),()=>envoy(me,pick(o)),()=>defUp(me),()=>buyMis(me,'n')];
  for(let k=0;k<3;k++)pick(ops)();
  if(p.mis&&p.mis.n>0&&!p.launched){const ts=missileTargets(me);if(ts.length)launch(me,'n',pick(ts))}
  setTimeout(()=>{autoPlace();endMarketTurn()},120);return 'market'}
 if(ph==='cards'){chooseCard(pick(['attack','attack','move','peace']));return 'card'}
 if(ph==='move'){doneMove();return 'move'}
 if(ph==='attack'){if(!p.att){const ts=[...attackTargets(me)];if(ts.length)onRegion(pick(ts));else skipAttack();return 'aim'}
  const j=Object.keys(p.att.from).find(j=>p.att.from[j]<movable(+j));if(j!=null&&Math.random()<.8){step(+j,1);return 'step'}
  if(Object.values(p.att.from).some(v=>v>0))confirmAttack();else skipAttack();return 'confirm'}
 return 'idle'};`;
(async()=>{await new Promise(r=>srv.listen(0,r));const port=srv.address().port;const url=`http://127.0.0.1:${port}/dist/index.html?net=local#play`;
 const b=await chromium.launch();const ctx=await b.newContext();const errs=[];const pages=[];
 for(let i=0;i<3;i++){const p=await ctx.newPage();p.on('pageerror',e=>errs.push('tab'+i+': '+e.message));await p.route(/googleapis|gstatic|unpkg/,r=>r.abort());
  await p.goto(url);await p.waitForFunction(()=>typeof hostCreate==='function'&&typeof V!=='undefined');await p.evaluate(()=>{V.instant=true;if(V3)setView(false)});await p.evaluate(BOT);pages.push(p)}
 const [H,C1,C2]=pages;
 await H.evaluate(()=>hostCreate('Host','TEST1'));await H.waitForTimeout(200);
 await C1.evaluate(()=>clientJoin('TEST1','Ali'));await C2.evaluate(()=>clientJoin('TEST1','Saad'));
 try{await H.waitForFunction(()=>NET.seats.filter(s=>s.kind==="human").length===2,null,{timeout:10000})}catch(e){console.log("JOINFAIL",JSON.stringify(await H.evaluate(()=>({seats:NET.seats,status:NET.status,err:NET.err,mode:NET.mode}))),JSON.stringify(await C1.evaluate(()=>({status:NET.status,err:NET.err,mode:NET.mode,scr:NET.screen}))),errs);process.exit(3)}
 await H.evaluate(()=>{hostSeatToggle(3);hostStart()});
 await C1.waitForFunction(()=>G&&G.net,null,{timeout:10000});await C2.waitForFunction(()=>G&&G.net,null,{timeout:10000});
 const t0=Date.now();let hidden=[],steps=0;
 while(Date.now()-t0<240000){const st=await Promise.all(pages.map(p=>p.evaluate(()=>window.__bot())));steps++;
  if(steps%25===0){const h=await C1.evaluate(()=>{const me=ME;return G.phase==='end'?null:G.players.filter((p,q)=>q!==me).map(p=>[p.gold,p.mis.n,p.s.fuel,p.s.ready,Object.keys(p.s.tech).length])});if(h)hidden.push(...h.flat().filter(v=>v!==null&&v!==0))}
  if(st.every(s=>s==='end'))break;await H.waitForTimeout(40)}
 const fin=await Promise.all(pages.map(p=>p.evaluate(()=>({phase:G&&G.phase,round:G&&G.round,score:G?G.players.map((x,q)=>score(q).total).join('/'):'',me:ME,priv:G?[...document.querySelectorAll('#log li')].length&&G.log.filter(l=>l.v&&!l.v.includes(ME)).filter(l=>document.getElementById('log').textContent.includes(l.t)).length:-1,logs:G?G.log.length:0}))));
 const hostTruth=await H.evaluate(()=>({bad:G.reg.some((r,i)=>r.troops<0||r.troops>cap(i)+2)||G.players.some(p=>p.gold<0)}));
 const ok=fin.every(f=>f.phase==='end')&&new Set(fin.map(f=>f.score)).size===1&&hidden.length===0&&errs.length===0&&fin.every(f=>f.priv===0)&&!hostTruth.bad;
 console.log(JSON.stringify({ok,fin,leakedValues:hidden.length,errs:errs.slice(0,5),steps,secs:Math.round((Date.now()-t0)/1000)}));
 await b.close();srv.close();process.exit(ok?0:1)})().catch(e=>{console.error(e);process.exit(2)});
