/* ===== Online play: every player on their own phone =====
   Host-authoritative. The host's device runs the real game state G; other devices are thin clients that
   render a per-player filtered copy of G and forward their actions. Transports: PeerJS (WebRTC, works on any
   static host) and BroadcastChannel ("local": several tabs on one device, used for testing). */
let ME=0,ACT=null;
const NET={mode:null,tr:null,code:'',seats:[],me:0,tok:'',lastFx:0,pushT:null,lastPhase:'',status:'',onLobby:null,err:''};
const SEATK=['m','p','d','f'];
/* actions a client may ask the host to run; PI_FIRST = first argument is the acting kingdom (forced to the sender) */
const ACTIONS=['skipAttack','buy','autoPlace','endMarketTurn','chooseCard','onRegion','step','confirmAttack','clearAtt','doneMove','ready','defUp','buyMis','launch','intelUp','spyReport','sabotage','proposePact','answerPact','sendAid','breakPact','setReady','setTax','borrow','repay','buildInd','buyFuel','startRD','sanction','liftSanction','envoy'];
const PI_FIRST=new Set(['defUp','buyMis','launch','intelUp','spyReport','sabotage','proposePact','answerPact','sendAid','breakPact','setReady','setTax','borrow','repay','buildInd','buyFuel','startRD','sanction','liftSanction','envoy']);
const isBot=p=>!!p&&(p.ai||(G&&G.net&&p.on===false));
function netOn(){return !!(G&&G.net)}

/* ---------- transports ---------- */
const TR={
 local(){const id=Math.random().toString(36).slice(2,10);let ch=null,hooks={};
  const me={id,
   host(code,h){hooks=h;ch=new BroadcastChannel('wwg-'+code);ch.onmessage=e=>{const m=e.data;if(m.to!=='H')return;if(m.k==='open')hooks.join(m.from);else if(m.k==='close')hooks.leave(m.from);else hooks.msg(m.from,m.d)};setTimeout(()=>hooks.ready&&hooks.ready(),0)},
   join(code,h){hooks=h;ch=new BroadcastChannel('wwg-'+code);ch.onmessage=e=>{const m=e.data;if(m.to===id||m.to==='*')hooks.msg(m.d)};ch.postMessage({to:'H',from:id,k:'open'});setTimeout(()=>hooks.open&&hooks.open(),0);addEventListener('pagehide',()=>{try{ch.postMessage({to:'H',from:id,k:'close'})}catch(e){}})},
   sendTo(cid,d){ch&&ch.postMessage({to:cid,d})},send(d){ch&&ch.postMessage({to:'H',from:id,d})},close(){try{ch.postMessage({to:'H',from:id,k:'close'})}catch(e){}ch&&ch.close();ch=null}};
  return me},
 peer(){let peer=null,conns=new Map(),conn=null,hooks={};const q=new URLSearchParams(location.search);
  const opts=()=>{const o={debug:0};if(q.get('peerhost')){const [h,pt]=q.get('peerhost').split(':');Object.assign(o,{host:h,port:+pt||9000,path:'/',secure:false})}return o};
  const load=()=>window.Peer?Promise.resolve():new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';s.onload=res;s.onerror=()=>rej(new Error('تعذر تحميل مكتبة الاتصال. تأكد من الإنترنت.'));document.head.appendChild(s)});
  const fail=e=>hooks.error&&hooks.error(e&&e.type==='unavailable-id'?'رمز الغرفة مستخدم. جرّب رمز ثاني.':e&&e.type==='peer-unavailable'?'ما لقينا الغرفة. تأكد من الرمز وإن المضيف فاتح اللعبة.':e&&e.type==='network'||e&&e.type==='server-error'?'مشكلة في الاتصال بالخادم.':(e&&e.message)||'خطأ في الاتصال');
  return{
   host(code,h){hooks=h;load().then(()=>{peer=new Peer('wwgame-'+code,opts());peer.on('open',()=>hooks.ready&&hooks.ready());peer.on('error',fail);
    peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
    peer.on('connection',c=>{c.on('open',()=>{conns.set(c.peer,c);hooks.join(c.peer)});c.on('data',d=>hooks.msg(c.peer,d));c.on('close',()=>{conns.delete(c.peer);hooks.leave(c.peer)});c.on('error',()=>{})})}).catch(fail)},
   join(code,h){hooks=h;load().then(()=>{peer=new Peer(opts());peer.on('error',fail);peer.on('open',()=>{conn=peer.connect('wwgame-'+code,{reliable:true});
    conn.on('open',()=>hooks.open&&hooks.open());conn.on('data',d=>hooks.msg(d));conn.on('close',()=>hooks.close&&hooks.close());conn.on('error',fail)})}).catch(fail)},
   sendTo(cid,d){const c=conns.get(cid);if(c&&c.open)try{c.send(d)}catch(e){}},send(d){if(conn&&conn.open)try{conn.send(d)}catch(e){}},
   close(){try{peer&&peer.destroy()}catch(e){}peer=null;conns.clear();conn=null}}}};
function mkTransport(){const q=new URLSearchParams(location.search);return(q.get('net')==='local'?TR.local:TR.peer)()}
function newCode(){const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=a[rnd(a.length)];return s}
function myTok(code){const k='wwg_tok_'+code;let t=null;try{t=sessionStorage.getItem(k)}catch(e){}if(!t){t=Math.random().toString(36).slice(2,12);try{sessionStorage.setItem(k,t)}catch(e){}}return t}

/* ---------- host ---------- */
function hostCreate(name,code){netClose();NET.mode='host';NET.code=code||newCode();NET.err='';NET.status='جاري إنشاء الغرفة…';
 NET.seats=SEATK.map((k,i)=>({k,kind:i===0?'host':'open',name:i===0?(name||''):'',cid:null,tok:null,on:i===0}));NET.me=0;ME=0;
 NET.tr=mkTransport();
 NET.tr.host(NET.code,{ready:()=>{NET.status='';lobbyPush()},join:cid=>{},leave:cid=>hostLeave(cid),msg:(cid,m)=>hostMsg(cid,m),error:e=>{NET.err=e;NET.status='';uiLobby()}});
 uiLobby()}
function seatOf(cid){return NET.seats.findIndex(s=>s.cid===cid)}
function hostMsg(cid,m){if(!m||typeof m!=='object')return;
 if(m.t==='hello'){let si=NET.seats.findIndex(s=>s.tok&&s.tok===m.tok);
  if(si<0){if(G){NET.tr.sendTo(cid,{t:'err',m:'اللعبة بدأت. ما تقدر تدخل كلاعب جديد.'});return}
   si=NET.seats.findIndex(s=>s.kind==='open');if(si<0){NET.tr.sendTo(cid,{t:'err',m:'الغرفة ممتلئة.'});return}
   NET.seats[si].kind='human';NET.seats[si].tok=m.tok}
  const s=NET.seats[si];s.cid=cid;s.on=true;s.name=String(m.name||'').slice(0,18);
  if(G){const pi=seatPi(si);if(pi!=null){G.players[pi].on=true;note(null,G.players[pi].name+' رجع للعبة.','join');netAI()}}
  lobbyPush();if(G)netPush(true);SFX('join');return}
 const si=seatOf(cid);if(si<0)return;const s=NET.seats[si];
 if(m.t==='pick'&&!G){const to=+m.k;if(NET.seats[to]&&NET.seats[to].kind==='open'){NET.seats[to]=Object.assign({},s,{k:SEATK[to]});NET.seats[si]={k:SEATK[si],kind:'open',name:'',cid:null,tok:null,on:false}}lobbyPush();return}
 if(m.t==='name'&&!G){s.name=String(m.name||'').slice(0,18);lobbyPush();return}
 if(m.t==='act'&&G){const pi=seatPi(si);if(pi==null)return;hostAct(pi,m.fn,Array.isArray(m.a)?m.a:[])}}
function hostAct(pi,fn,a){if(!ACTIONS.includes(fn)||typeof window[fn]!=='function')return;if(PI_FIRST.has(fn))a[0]=pi;
 try{runAs(pi,()=>window[fn](...a))}catch(e){console.error(e)}netAI();netPush()}
function hostLeave(cid){const si=seatOf(cid);if(si<0)return;const s=NET.seats[si];s.on=false;s.cid=null;
 if(!G){if(s.kind==='human')NET.seats[si]={k:s.k,kind:'open',name:'',cid:null,tok:null,on:false};lobbyPush();return}
 const pi=seatPi(si);if(pi!=null){G.players[pi].on=false;note(null,G.players[pi].name+' انقطع اتصاله. الحاسوب يلعب عنه مؤقتاً.','leave')}lobbyPush();netAI();netPush()}
function seatPi(si){return G&&G.seatPi?G.seatPi[si]:null}
function hostSeatToggle(si){if(G||si===NET.me)return;const s=NET.seats[si];if(s.kind==='open')s.kind='ai';else if(s.kind==='ai')s.kind='open';else if(s.kind==='human'){NET.tr.sendTo(s.cid,{t:'err',m:'المضيف أخرجك من الغرفة.'});NET.seats[si]={k:s.k,kind:'open',name:'',cid:null,tok:null,on:false}}lobbyPush()}
function hostPick(to){if(G||NET.seats[to].kind!=='open')return;const s=NET.seats[NET.me];NET.seats[to]=Object.assign({},s,{k:SEATK[to]});NET.seats[NET.me]={k:SEATK[NET.me],kind:'open',name:'',cid:null,tok:null,on:false};NET.me=to;ME=to;lobbyPush()}
function lobbyState(){return{code:NET.code,started:!!G,seats:NET.seats.map(s=>({k:s.k,kind:s.kind,name:s.name,on:s.on}))}}
function lobbyPush(){const L=lobbyState();NET.seats.forEach((s,i)=>{if(s.cid)NET.tr.sendTo(s.cid,{t:'lobby',L,you:i})});NET.L=L;uiLobby()}
function hostStart(){const used=NET.seats.map((s,i)=>({s,i})).filter(x=>x.s.kind!=='open');if(used.length<2){NET.err='تحتاج لاعبين اثنين على الأقل (أضف الحاسوب لو تبغى).';uiLobby();return}
 const ks=used.map(x=>x.s.k),names=used.map(x=>x.s.name?x.s.name+' ('+K[x.s.k].short+')':''),ais=used.map(x=>x.s.kind==='ai');
 newGame(used.length,names,ais,ks);G.net=true;G.seatPi={};used.forEach((x,pi)=>{G.seatPi[x.i]=pi;G.players[pi].on=x.s.kind==='ai'?true:x.s.on;G.players[pi].seat=x.i});
 ME=G.seatPi[NET.me];ACT=ME;NET.lastFx=0;G.done={};G.selBy={};G.warnBy={};G.fx=[];G.fxN=0;G.offers=[];
 note(null,'بدأت الحرب! حظ موفق يا قادة.','phase');uiScreen('game');lobbyPush();netAI();netPush(true)}
/* run an engine function as kingdom pi (host only): per-player selection/warning, host's own aim kept aside */
function runAs(pi,fn){const prevAct=ACT,aim=G.aim;if(G.selBy){G.selBy[ACT]=G.sel;G.warnBy[ACT]=G.warn}ACT=pi;G.aim=null;G.sel=G.selBy?(G.selBy[pi]??null):null;G.warn=G.warnBy?(G.warnBy[pi]||''):'';
 try{fn()}finally{if(G){if(G.selBy){G.selBy[pi]=G.sel;G.warnBy[pi]=G.warn}ACT=prevAct;G.aim=pi===prevAct?G.aim:aim;if(G.selBy){G.sel=G.selBy[ACT]??null;G.warn=G.warnBy[ACT]||''}}}}
/* computer players (and humans who dropped) act on the host */
function netAI(){if(!netOn()||netAI.busy)return;netAI.busy=true;try{for(let guard=0;guard<40;guard++){const ph=G.phase;let did=false;
  if(['market','cards','move','attack'].includes(ph)){for(const q of G.queue){if(G.done[q]||!isBot(G.players[q]))continue;const key=G.phase+G.round+':'+q;runAs(q,()=>aiAct(q));did=true;break}}
  else if(['event','reveal','resolve','income'].includes(ph)){if(readyAll()){readyGo();did=true}}
  if(!did)break}}finally{netAI.busy=false}}
function phaseKey(){return G.phase+'|'+G.round}
function humansWaiting(){return alive().filter(q=>!isBot(G.players[q]))}
function readyAll(){const r=G.rdy&&G.rdy.k===phaseKey()?G.rdy.s:{};return humansWaiting().every(q=>r[q])}
function readyGo(){const ph=G.phase;G.rdy={k:'',s:{}};G.done={};
 if(ph==='event')applyEvent();else if(ph==='reveal')startMove();else if(ph==='resolve')income();else if(ph==='income')endRound()}
function ready(){if(!netOn())return;if(!G.rdy||G.rdy.k!==phaseKey())G.rdy={k:phaseKey(),s:{}};G.rdy.s[PI()]=1;if(readyAll())readyGo();else render()}
function clearAtt(){const p=P();if(p)p.att=null;render()}
function doneMove(){next(startAttack)}
function skipAttack(){const p=P();p.att=null;hideCurtain();next(resolve)}
/* notifications that reach only the right player (or everyone when to==null) */
function note(to,s,snd,extra){if(!G)return;if(!G.net){if(to==null||!(G.players[to]&&G.players[to].ai)){if(s)toast(s);if(snd)SFX(snd)}return}
 G.fx.push(Object.assign({id:++G.fxN,to,s,snd},extra||{}));if(G.fx.length>40)G.fx.splice(0,G.fx.length-40)}
/* the per-player copy of the state: other kingdoms' secrets removed */
function viewFor(me){const g=JSON.parse(JSON.stringify(G));const open=['reveal','move','attack','resolve','income','end'].includes(g.phase);
 g.players.forEach((p,q)=>{if(q===me||g.phase==='end')return;p.gold=null;p.mis={n:null,h:null};p.def=null;p.intel=null;p.report=null;p.reserve=0;p.placing=null;p.inc=null;p.buys=null;
  if(!open)p.card=p.card?'?':null;if(g.phase!=='resolve')p.att=null;
  const s=p.s;p.s=Object.assign(simNew(),{stab:null,ready:null,tax:null,debt:null,infl:null,ind:null,fuel:null,repAdj:s.repAdj,hidden:true})});
 g.sel=G.selBy?(G.selBy[me]??null):null;g.warn=G.warnBy?(G.warnBy[me]||''):'';g.aim=null;
 g.log=g.log.filter(l=>!l.v||l.v.includes(me)).slice(0,70);g.fx=g.fx.filter(f=>f.to==null||f.to===me);
 delete g.selBy;delete g.warnBy;return g}
function netPush(now){if(NET.mode!=='host'||!G)return;if(!now){if(NET.pushT)return;NET.pushT=setTimeout(()=>{NET.pushT=null;netPush(true)},25);return}
 if(NET.pushT){clearTimeout(NET.pushT);NET.pushT=null}
 if(G.phase!==NET.lastPhase){NET.lastPhase=G.phase;if(G.selBy){G.selBy={};G.warnBy={};G.sel=null}}
 NET.seats.forEach((s,si)=>{const pi=seatPi(si);if(s.cid&&pi!=null)NET.tr.sendTo(s.cid,{t:'state',g:viewFor(pi),me:pi})});
 fxPlay(G.fx.filter(f=>f.to==null||f.to===ME));saveHost()}
function saveHost(){try{localStorage.setItem('wwg_host',JSON.stringify({code:NET.code,me:NET.me,seats:NET.seats.map(s=>Object.assign({},s,{cid:null,on:false})),G,t:Date.now()}))}catch(e){}}
function savedHost(){try{const s=JSON.parse(localStorage.getItem('wwg_host')||'null');if(s&&s.G&&s.G.phase!=='end'&&Date.now()-s.t<6*3600e3)return s}catch(e){}return null}
function hostResume(){const s=savedHost();if(!s)return;netClose();NET.mode='host';NET.code=s.code;NET.seats=s.seats;NET.me=s.me;NET.err='';NET.status='جاري فتح الغرفة من جديد…';
 G=s.G;ME=G.seatPi[NET.me];ACT=ME;G.players.forEach(p=>{if(!p.ai)p.on=p.seat===NET.me});NET.lastFx=G.fxN||0;
 NET.tr=mkTransport();NET.tr.host(NET.code,{ready:()=>{NET.status='';lobbyPush();netPush(true)},join:()=>{},leave:cid=>hostLeave(cid),msg:(cid,m)=>hostMsg(cid,m),error:e=>{NET.err=e;uiLobby()}});
 uiScreen('game');render()}

/* ---------- client ---------- */
function clientJoin(code,name){netClose();code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(!code){NET.err='اكتب رمز الغرفة.';uiLobby();return}
 NET.mode='client';NET.code=code;NET.err='';NET.status='جاري الاتصال بالغرفة…';NET.L=null;NET.name=name;NET.tok=myTok(code);uiScreen('lobby');
 NET.tr=mkTransport();
 NET.tr.join(code,{open:()=>{NET.status='متصل. بانتظار المضيف…';NET.tr.send({t:'hello',name,tok:NET.tok});uiLobby()},
  msg:m=>clientMsg(m),close:()=>{NET.status='انقطع الاتصال. جاري إعادة المحاولة…';uiLobby();if(G)toast('انقطع الاتصال بالمضيف… نحاول نرجع');setTimeout(()=>{if(NET.mode==='client')clientJoin(NET.code,NET.name)},2500)},
  error:e=>{NET.err=e;NET.status='';uiLobby()}});uiLobby()}
function clientMsg(m){if(!m||typeof m!=='object')return;
 if(m.t==='lobby'){NET.L=m.L;NET.me=m.you;NET.status='';if(!m.L.started&&G){G=null;NET.lastFx=0;uiScreen('lobby');render()}if(!G)uiLobby();return}
 if(m.t==='err'){NET.err=m.m;NET.status='';uiLobby();return}
 if(m.t==='state'){const first=!G,old=G;ME=m.me;ACT=m.me;G=m.g;
  if(old&&old.aim&&old.phase===G.phase&&old.round===G.round)G.aim=old.aim;
  if(first){NET.lastFx=0;uiScreen('game');if(V.ok)setView(true)}
  V.me=ME;render();if(V.minOpen)showMinistry();fxPlay(G.fx);return}}
function wrapClient(){ACTIONS.forEach(fn=>{const orig=window[fn];if(!orig||orig.__net)return;
 const w=function(...a){if(NET.mode!=='client')return orig.apply(this,a);
  if(fn==='onRegion'&&G&&G.aim)return aimClick(a[0]);NET.tr.send({t:'act',fn,a});SFX('click')};w.__net=true;w.orig=orig;window[fn]=w})}
function fxPlay(list){(list||[]).forEach(f=>{if(f.id<=NET.lastFx)return;NET.lastFx=f.id;if(f.s)toast(f.s);if(f.snd)SFX(f.snd);
 if(f.mis&&V3&&V.ok&&!V.instant&&G.players[f.mis[0]]){try{playMissile(f.mis[0],f.mis[1],f.mis[2],f.mis[3],()=>{})}catch(e){}}})}
function netClose(){if(NET.tr)try{NET.tr.close()}catch(e){}NET.tr=null;NET.mode=null;NET.L=null}
function netLeave(){netClose();G=null;ACT=null;ME=0;uiScreen('title');render()}
