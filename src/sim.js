/* ===== National simulation layer: economy, readiness, research, intelligence, early warning, diplomacy =====
   One shared state for every institution. Per-kingdom state lives in player.s, world state in G (wx, rel, sanc, crises, reps). */
const TECH={
 radar:{n:'رادار الإنذار المبكر',br:'air',c:2,t:1,d:'يكشف الإطلاقات المعادية مبكراً ويرفع فرصة الاعتراض.'},
 ew2:{n:'شبكة إنذار متكاملة',br:'air',c:3,t:1,req:['radar'],d:'كشف أدق، تصنيف مؤكد للتهديد، وتنهي الإنذارات الكاذبة.'},
 inter:{n:'صواريخ اعتراضية متقدمة',br:'air',c:3,t:1,req:['radar'],d:'+15% لنجاح الاعتراض.'},
 civil:{n:'الدفاع المدني',br:'air',c:2,t:1,d:'عند الإنذار المبكر تنزل الملاجئ الخسائر بجندي.'},
 rocket:{n:'محركات الصواريخ',br:'mis',c:2,t:1,test:1,d:'يفتح إنتاج الصاروخ العادي.'},
 heavy:{n:'الرؤوس الثقيلة',br:'mis',c:4,t:2,req:['rocket'],ind:1,test:1,d:'يفتح إنتاج الصاروخ الثقيل. يحتاج قاعدة صناعية.'},
 guid:{n:'التوجيه الدقيق',br:'mis',c:3,t:1,req:['rocket'],test:1,d:'صواريخك أصعب في الكشف والاعتراض.'},
 train:{n:'التدريب الاحترافي',br:'land',c:2,t:1,d:'+1 دفاع لكل مناطقك.'},
 doctrine:{n:'عقيدة الهجوم المشترك',br:'land',c:3,t:2,req:['train'],d:'+1 هجوم.'},
 logi:{n:'سلاح الإمداد',br:'land',c:2,t:1,d:'خطوط إمداد أطول واستهلاك وقود أقل.'},
 fort:{n:'تحصين العاصمة',br:'land',c:2,t:1,d:'+1 دفاع للقصر.'},
 crypto:{n:'التشفير ومكافحة التجسس',br:'int',c:2,t:1,d:'يخفض دقة تقارير الأعداء عنك ويصعّب التخريب.'},
 sigint:{n:'اعتراض الإشارات',br:'int',c:3,t:1,intel:1,d:'يرصد مشتريات السلاح وبرامج البحث عند الآخرين.'},
 sat:{n:'الاستطلاع الفضائي',br:'int',c:3,t:2,intel:1,req:['radar'],d:'تقرير تلقائي كل جولة عن كل مملكة بثقة أعلى.'}};
const BRANCH={air:'الدفاع الجوي والإنذار',mis:'برنامج الصواريخ',land:'القوات البرية',int:'تقنيات الاستخبارات'};
const STAGES=['التصميم','النموذج الأولي','الاختبارات','جاهز للإنتاج'];
const READY=['سلم','تأهب','تعبئة عامة'];
const TAX=['منخفضة','عادية','مرتفعة'];
const WX={clear:{t:'صحو',d:'لا تأثير على العمليات.'},rain:{t:'أمطار غزيرة',d:'الوحل يعيق كل الهجمات (−1).'},storm:{t:'عاصفة بحرية',d:'الهجوم على المناطق الساحلية −1، والتجارة البحرية متوقفة.'},
 snow:{t:'ثلوج',d:'الهجوم على مناطق الجبال −1.'},sand:{t:'عاصفة رملية',d:'الهجوم على مناطق الصحراء −1، والرادار أضعف.'},fog:{t:'ضباب كثيف',d:'الرادار والاستطلاع أضعف.'}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function simNew(){return{stab:70,ready:0,readyR:0,tax:1,debt:0,infl:0,ind:0,fuel:3,tech:{},rd:[],dos:{},threat:{},brief:[],ew:[],cables:[],sig:[],ci:[],repAdj:0}}
function simInit(){const n=G.players.length;G.rel=G.players.map(()=>new Array(n).fill(0));G.sanc=[];G.crises=[];G.reps=[];G.wx=Object.assign({id:'clear'},WX.clear);
 /* history: one inherited rivalry and one old friendship, so the world does not start symmetric */
 G.hist=[];const pr=[];for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)pr.push([a,b]);shuffle(pr);
 if(n>2){const [a,b]=pr[0];G.rel[a][b]=G.rel[b][a]=-25;G.hist.push({a,b,riv:1});const [c,d]=pr[1];G.rel[c][d]=G.rel[d][c]=20;G.hist.push({a:c,b:d})}}
const has=(p,id)=>!!p.s.tech[id];
function relAdd(a,b,v){if(a===b||a==null||b==null)return;G.rel[a][b]=clamp(G.rel[a][b]+v,-100,100)}
function rep(pi){const o=G.players.map((p,i)=>i).filter(i=>i!==pi&&G.players[i].alive);const a=o.length?o.reduce((s,i)=>s+G.rel[i][pi],0)/o.length:0;return Math.round(clamp(a+G.players[pi].s.repAdj,-100,100))}
function relWord(v){return v>=40?'ودّية':v>=15?'جيدة':v>-15?'محايدة':v>-40?'متوترة':'عدائية'}
function brief(pi,cls,t){G.players[pi].s.brief.push({cls,t})}
function cable(pi,t){const s=G.players[pi].s;s.cables.unshift({r:G.round,t});if(s.cables.length>14)s.cables.pop()}
function sancOn(ti){return G.sanc.filter(x=>x.b===ti&&x.until>=G.round)}
function troopsOf(pi){return owned(pi).reduce((s,i)=>s+G.reg[i].troops,0)}
function inCrisis(a,b){return G.crises.some(c=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a))}

/* ---------- round cycle ---------- */
function simRoundStart(){
 if(G.round>1){const ids=['clear','clear','clear','rain','storm','snow','sand','fog'];const id=ids[rnd(ids.length)];G.wx=Object.assign({id},WX[id])}
 G.sanc.filter(x=>x.until===G.round-1).forEach(x=>{log('انتهت عقوبات '+G.players[x.a].name+' على '+G.players[x.b].name);cable(x.b,'رُفعت عقوبات '+G.players[x.a].name+' عنكم.')});
 G.sanc=G.sanc.filter(x=>x.until>=G.round&&G.players[x.a].alive&&G.players[x.b].alive);
 alive().forEach(pi=>{const p=G.players[pi],s=p.s;s.brief=[];
  brief(pi,'أرصاد','حالة الطقس: '+G.wx.t+' — '+G.wx.d);
  if(G.round===1)G.hist.forEach(x=>{if(x.a===pi||x.b===pi){const o=G.players[x.a===pi?x.b:x.a].name;brief(pi,'خارجية',x.riv?'نزاع حدودي قديم مع '+o+'. العلاقات متوترة من البداية.':'صداقة تاريخية مع '+o+'. أرضية جاهزة لمعاهدة.')}});
  if(G.round>1){
   s.rd=s.rd.filter(pr=>{pr.left--;if(pr.left>0)return true;const T=TECH[pr.id];
    if(T.test&&!pr.retest&&Math.random()<(s.ind?.12:.25)){pr.left=1;pr.retest=1;brief(pi,'بحث وتطوير','فشل اختبار «'+T.n+'». الفريق يعيد التجربة، التأخير جولة واحدة.');return true}
    s.tech[pr.id]=G.round;brief(pi,'بحث وتطوير','اكتمل برنامج «'+T.n+'» ودخل الخدمة.');return false});
   s.fuel=clamp(s.fuel+1+s.ind-(s.ready===2?1:0),0,8);
   if(s.fuel<=1)brief(pi,'إمداد','مخزون الوقود حرج ('+s.fuel+'). الهجوم بلا وقود يخسر نقطتين.')}
  /* false alarm: only with basic detection and no integrated network */
  s.alarm=false;
  if(G.round>1&&(p.def>0||has(p,'radar'))&&!has(p,'ew2')&&Math.random()<.14){s.alarm=true;s.stab=clamp(s.stab-2,0,100);
   const waste=s.ready>0&&p.def>0;if(waste)p.adUsed=1;
   s.ew.unshift({r:G.round,k:'false',t:'إنذار كاذب: هدف غير معرّف على الرادار تبيّن أنه خلل في القراءة.'+(waste?' أُطلق صاروخ اعتراضي بلا داعٍ.':'')});
   brief(pi,'إنذار مبكر','إنذار كاذب أربك الدفاع الجوي'+(waste?' واستهلك صاروخاً اعتراضياً هذي الجولة.':'.')+' شبكة الإنذار المتكاملة تمنع تكراره.')}
 });
 /* diplomatic crises */
 const al=alive();
 for(let x=0;x<al.length;x++)for(let y=x+1;y<al.length;y++){const a=al[x],b=al[y];const lo=Math.min(G.rel[a][b],G.rel[b][a]);
  if(lo<=-50&&!inCrisis(a,b)&&!pactWith(a,b)){G.crises.push({a,b,r:G.round});log('أزمة دبلوماسية بين '+G.players[a].name+' و'+G.players[b].name+': استُدعي السفراء.');
   [a,b].forEach(q=>{G.players[q].s.stab=clamp(G.players[q].s.stab-3,0,100);brief(q,'خارجية','أزمة دبلوماسية مع '+G.players[q===a?b:a].name+'. مبعوث أو مساعدات ممكن تهدّي الوضع.');cable(q,'أزمة دبلوماسية مع '+G.players[q===a?b:a].name+'.')})}}
 G.crises=G.crises.filter(c=>{const ok=G.players[c.a].alive&&G.players[c.b].alive&&Math.min(G.rel[c.a][c.b],G.rel[c.b][c.a])<=-30;if(!ok&&G.players[c.a].alive&&G.players[c.b].alive)log('انفراج الأزمة بين '+G.players[c.a].name+' و'+G.players[c.b].name);return ok});
 al.forEach(pi=>simIntelCycle(pi));
}

/* ---------- intelligence ---------- */
function borderForce(pi,qi){let n=0;const seen=new Set();owned(pi).forEach(i=>NB[i].forEach(j=>{if(G.reg[j].owner===qi&&!seen.has(j)){seen.add(j);n+=Math.max(0,movable(j))}}));return n}
function simIntelCycle(pi){const p=G.players[pi],s=p.s;
 Object.keys(s.dos).forEach(ti=>s.dos[ti].forEach(r=>{if(r.due===G.round&&r.late){r.late=0;brief(pi,'استخبارات','وصل تقرير الميدان عن '+G.players[r.ti].name+' (جُمع في الجولة '+r.r+').')}}));
 others(pi).forEach(qi=>{const q=G.players[qi];const tr=borderForce(pi,qi);const noise=Math.max(0,2-p.intel);const est=Math.max(0,tr+rnd(noise*2+1)-noise);
  const mob=(q.s.ready>0&&Math.random()*100<40+20*p.intel)?q.s.ready:0;const conf=clamp(50+15*p.intel+(has(p,'sat')?10:0)-(G.wx.id==='fog'?10:0)-(has(q,'crypto')?10:0),20,95);
  const pact=pactWith(pi,qi);let sc=est+q.minister+mob*2+(inCrisis(pi,qi)?2:0)-(G.rel[qi][pi]>=30?2:0);if(pact)sc=0;
  const lvl=pact?0:sc<4?1:sc<7?2:sc<10?3:4;
  s.threat[qi]={est,mob,conf,lvl,pact,r:G.round};
  if(lvl>=3)brief(pi,'تقدير تهديد','مستوى التهديد من '+q.name+' '+THREAT[lvl]+': حوالي '+est+' جنود على حدودنا'+(mob?' مع مؤشرات '+READY[mob]:'')+' (ثقة '+conf+'%).');
  else if(mob)brief(pi,'استخبارات','رُصدت مؤشرات «'+READY[mob]+'» عند '+q.name+' (ثقة '+conf+'%).');
  if(has(p,'sat')&&G.round>1)mkReport(pi,qi,'sat')});
 if(has(p,'sat')&&G.round>1)brief(pi,'استطلاع فضائي','حُدّثت ملفات كل الممالك من صور المدار.');
}
const THREAT=['حليف','منخفض','مرتفع','عالٍ','حرج'];
const SRC={hum:'مصادر بشرية (HUMINT)',sig:'اعتراض إشارات (SIGINT)',sat:'استطلاع فضائي (IMINT)'};
function mkReport(pi,ti,src){const p=G.players[pi],t=G.players[ti],s=p.s;
 let conf=45+15*p.intel+(src==='sat'?15:0)+(src==='sig'?8:0)-(has(t,'crypto')?15:0)-(G.wx.id==='fog'&&src==='sat'?10:0);
 const list=s.dos[ti]||(s.dos[ti]=[]);const prev=list.find(r=>!r.fail&&G.round-r.r<=1&&r.src!==src);const ver=!!prev;if(ver)conf+=12;
 conf=clamp(conf,20,95);
 const est=(v,k)=>{k=k||1;const e=Math.round((100-conf)/100*(v*.5+2*k));let lo=v-rnd(e+1),hi=lo+e;if(Math.random()*100>conf+25){const sh=(e+1)*(Math.random()<.5?-1:1);lo+=sh;hi+=sh}lo=Math.max(0,lo);hi=Math.max(lo,hi);return lo===hi?''+lo:lo+'–'+hi};
 const lv=v=>{if(conf>=65)return''+v;const a=Math.max(0,v-rnd(2)),b=v+rnd(2);return a===b?''+a:a+'–'+b};
 const it=[['الخزينة (ذهب)',est(t.gold)],['القوات (جنود)',est(troopsOf(ti))],['صواريخ عادية',est(t.mis.n)],['صواريخ ثقيلة',est(t.mis.h)],['بطاريات الدفاع الجوي',lv(t.def)],['مستوى استخباراتهم',lv(t.intel)],
  ['وضع الجاهزية',Math.random()*100<conf?READY[t.s.ready]:'غير مؤكد'],['مخزون الوقود',est(t.s.fuel)],['الاستقرار الداخلي',est(t.s.stab,5)+'%'],['القاعدة الصناعية',lv(t.s.ind)]];
 const prog=t.s.rd.filter(()=>Math.random()*100<conf).map(pr=>TECH[pr.id].n+' (اكتمال متوقع ج'+(G.round+pr.left)+')');
 it.push(['برامج تطوير مشتبه بها',prog.length?prog.join('، '):(t.s.rd.length&&conf<60?'نشاط غير مفسّر':'لا مؤشرات')]);
 it.push(['تقنيات في الخدمة',conf>=55?(Object.keys(t.s.tech).map(k=>TECH[k].n).join('، ')||'لا شيء'):'حوالي '+est(Object.keys(t.s.tech).length)]);
 it.push(['معاهدات',G.pacts.filter(x=>x.until>=G.round&&(x.a===ti||x.b===ti)).map(x=>G.players[x.a===ti?x.b:x.a].name).join('، ')||'لا يوجد']);
 const late=src==='hum'&&p.intel<1;
 const r={r:G.round,due:late?G.round+1:G.round,late:late?1:0,src,conf,ver,ti,it,unc:conf>=75?'تقدير موثوق؛ الأرقام ضمن هامش ضيق.':conf>=55?'تقدير متوسط الثقة؛ الأرقام نطاقات محتملة.':'مصدر واحد غير مؤكد؛ قد تكون بعض الأرقام مضللة.'};
 list.unshift(r);if(list.length>5)list.pop();
 p.report={ti,round:G.round,gold:t.gold,n:t.mis.n,h:t.mis.h,def:t.def,intel:t.intel,pacts:[],conf};
 return r}
function simSignal(pi,txt){others(pi).forEach(qi=>{const q=G.players[qi];if(has(q,'sigint')&&Math.random()<.75){q.s.sig.unshift({r:G.round,t:G.players[pi].name+': '+txt});if(q.s.sig.length>10)q.s.sig.pop()}})}

/* ---------- early warning & air defense ---------- */
function detPct(d,a){const s=d.s;let v=(d.def?30+d.def*10:20)+(has(d,'radar')?25:0)+(has(d,'ew2')?20:0)+s.ready*8-(G.wx.id==='sand'||G.wx.id==='fog'?15:0)-(a&&has(a,'guid')?10:0);return clamp(v,5,97)}
function intPct(d,a,early){let v=(early?70:40)+(has(d,'inter')?15:0)+d.s.ready*5-(a&&has(a,'guid')?15:0);return clamp(v,5,95)}
function simIntercept(pi,di,t,i){const a=G.players[pi],d=G.players[di];const det=detPct(d,a),r=Math.random()*100;
 const stage=r<det*.6?'early':r<det?'late':'miss';const unsure=stage!=='miss'&&!has(d,'ew2')&&Math.random()<.3;
 let ic=false,tried=false;if(stage!=='miss'&&d.def-d.adUsed>0){tried=true;d.adUsed++;ic=Math.random()*100<intPct(d,a,stage==='early')}
 const civ=!ic&&has(d,'civil')&&(stage==='early'||(stage==='late'&&has(d,'ew2')))?1:0;
 const txt=(stage==='early'?'كشف مبكر':stage==='late'?'كشف متأخر':'لم يُكشف الإطلاق')+(unsure?' · تصنيف غير مؤكد':'')+' · '+(ic?'اعتراض ناجح':tried?'فشل الاعتراض':stage==='miss'?'لا إنذار':'لا صواريخ اعتراضية متاحة')+(civ?' · أُطلقت صافرات الإنذار المدني':'');
 d.s.ew.unshift({r:G.round,k:ic?'ok':'hit',from:stage==='miss'?null:pi,reg:i,t:(stage==='miss'?'ضربة مفاجئة':'إطلاق من '+a.name)+' باتجاه '+R[i].name+': '+txt});if(d.s.ew.length>8)d.s.ew.pop();
 return{ic,civ,stage,txt}}
function simStrikeFx(pi,di,ic){relAdd(di,pi,ic?-18:-30);others(pi).forEach(q=>{if(q!==di)relAdd(q,pi,-4)});if(!ic)G.players[di].s.stab=clamp(G.players[di].s.stab-5,0,100);
 cable(di,(ic?'اعتُرض صاروخ أطلقته ':'ضربة صاروخية من ')+G.players[pi].name+'.')}

/* ---------- land combat factors ---------- */
function supplyOK(pi,j){const p=G.players[pi];const max=has(p,'logi')?3:2;const seen=new Set([j]);let fr=[j];
 for(let d=0;d<=max;d++){for(const x of fr)if(x===p.palace||G.reg[x].camp)return true;const nx=[];fr.forEach(x=>NB[x].forEach(y=>{if(!seen.has(y)&&G.reg[y].owner===pi){seen.add(y);nx.push(y)}}));fr=nx}return false}
function wxPen(t){const w=G.wx.id;return w==='rain'||(w==='storm'&&R[t].coastal)||(w==='snow'&&R[t].k==='m')||(w==='sand'&&R[t].k==='d')}
function atkMods(ai,t,a){const p=G.players[ai],m=[['كفاءة القيادة',p.minister]];
 if(R[t].size==='L')m.push(['أرض مفتوحة',1]);if(has(p,'doctrine'))m.push(['عقيدة هجومية',1]);if(p.s.ready===2)m.push(['تعبئة عامة',1]);
 if(a&&a.sup===false)m.push(['إمداد منقطع',-1]);if(a&&a.noFuel)m.push(['نقص وقود',-2]);if(p.s.stab<40)m.push(['معنويات متدنية',-1]);if(wxPen(t))m.push([G.wx.t,-1]);return m}
function defMods(di,t,Dr){const m=[];if(Dr<=0||di==null)return m;const d=G.players[di];
 if(R[t].size==='S')m.push(['أرض وعرة',1]);if(d.card==='peace')m.push(['تحصّن',1]);if(has(d,'train'))m.push(['تدريب احترافي',1]);if(d.s.ready>=1)m.push(['جاهزية مرتفعة',1]);
 if(d.palace===t&&has(d,'fort'))m.push(['تحصين العاصمة',1]);if(d.s.stab<40)m.push(['معنويات متدنية',-1]);return m}
const sumM=m=>m.reduce((s,x)=>s+x[1],0);
function simCommit(pi,a){const p=G.players[pi],s=p.s;a.sup=Object.keys(a.from).every(j=>a.from[j]<=0||supplyOK(pi,+j));
 const tot=Object.values(a.from).reduce((x,y)=>x+y,0);if(tot<=0)return;const need=1+(tot>=5&&!has(p,'logi')?1:0);a.noFuel=s.fuel<need;s.fuel=Math.max(0,s.fuel-need)}
function simBattleFx(ai,di,t,win,rec){const a=G.players[ai];
 if(di!=null&&rec.D>0){a.s.stab=clamp(a.s.stab+(win?3:-3),0,100);const d=G.players[di];d.s.stab=clamp(d.s.stab+(win?-5:2),0,100);relAdd(di,ai,-25);if(G.rel[di][ai]>=20)a.s.repAdj-=5;others(ai).forEach(q=>{if(q!==di)relAdd(q,ai,-3)});
  cable(di,(win?'سقطت ':'صمدت ')+R[t].name+' أمام هجوم '+a.name+'.')}
 G.reps.unshift(rec);if(G.reps.length>12)G.reps.pop()}

/* ---------- economy ---------- */
const INC_L={big:'مناطق كبيرة',mid:'مناطق متوسطة',mine:'المنجم',port:'تجارة الموانئ',peace:'عائد السلام',under:'دعم الأضعف',ind:'الصناعة',trade:'التجارة الخارجية',prod:'إنتاجية (استقرار عالٍ)',tax:'الضرائب',
 upkeep:'رواتب الجيش',ready:'تكلفة الجاهزية',interest:'فوائد الدين',sanc:'خسائر العقوبات',unrest:'اضطرابات'};
function calcIncome(pi,f,final){const p=G.players[pi],s=p.s,o=owned(pi);const L=o.filter(i=>R[i].size==='L'&&!G.reg[i].dmg).length,M=o.filter(i=>R[i].size==='M'&&!G.reg[i].dmg).length;
 const storm=G.wx.id==='storm';
 const inc={big:L,mid:Math.floor(M/2),mine:o.includes(MINE)?1:0,port:(p.k==='p'&&G.round%2===0&&!storm)?1:0,peace:(final&&p.card==='peace'&&!p.attacked)?1:0,under:(f.includes(pi)&&alive().length>1&&f.length<alive().length)?1:0};
 inc.ind=s.ind;inc.trade=(o.some(i=>R[i].coastal)&&!storm&&rep(pi)>-20)?1:0;inc.prod=s.stab>=80?1:0;inc.tax=[-1,0,2][s.tax];
 const T=troopsOf(pi);inc.upkeep=-(T>16?2:T>10?1:0);inc.ready=-s.ready;inc.interest=-Math.ceil(s.debt/5);
 inc.sanc=-Math.min(sancOn(pi).length,inc.ind+inc.trade+inc.port);inc.unrest=s.stab<25?-1:0;
 inc.total=Object.values(inc).reduce((a,b)=>a+b,0);return inc}
function incParts(c){return Object.keys(c).filter(k=>k!=='total'&&c[k]).map(k=>INC_L[k]+' '+(c[k]>0?'+':'−')+Math.abs(c[k]))}
function simSettle(pi){const p=G.players[pi],s=p.s;
 if(p.gold<0){const d=-p.gold;p.gold=0;s.debt+=d;s.infl+=5;s.stab-=5;logp(pi,p.name+' عجزت عن سداد التزاماتها: اقتراض اضطراري '+d+' ذهب.')}
 let d=[5,0,-7][s.tax]+(s.ready===2?-4:0)+(s.debt>5?-3:0)+(s.infl>=15?-3:0)+(rep(pi)>=15?2:0)+(p.card==='peace'&&!p.attacked?2:0)+(s.stab<65?2:s.stab>65?-1:0);
 G.crises.forEach(c=>{if(c.a===pi||c.b===pi)d-=1});
 s.stab=clamp(s.stab+d,0,100);s.infl=Math.max(0,s.infl-3+(s.ready===2?3:0));
 if(s.stab<25){const c=owned(pi).filter(i=>i!==p.palace).sort((a,b)=>G.reg[b].troops-G.reg[a].troops);if(c.length&&regLoss(c[0],1,1))log('اضطرابات داخلية في '+p.name+': فرار جندي من '+R[c[0]].name)}}
function natScore(pi){const s=G.players[pi].s;return(s.stab>=75?1:0)-Math.floor(s.debt/5)}

/* ---------- national decisions (each costs one operation) ---------- */
function setReady(pi,v){const p=G.players[pi],s=p.s;if(!canAct(pi)||!hasOp(p)||v===s.ready||s.readyR===G.round)return;const up=v>s.ready;s.ready=v;s.readyR=G.round;p.buys++;
 log(p.name+' أعلنت وضع «'+READY[v]+'»');if(up)others(pi).forEach(q=>relAdd(q,pi,-3*v));simSignal(pi,'تغيّر وضع الجاهزية إلى '+READY[v]);refresh()}
function setTax(pi,v){const p=G.players[pi],s=p.s;if(!canAct(pi)||!hasOp(p)||v===s.tax)return;s.tax=v;p.buys++;logp(pi,p.name+' عدّلت الضرائب إلى '+TAX[v]);refresh()}
function borrow(pi){const p=G.players[pi],s=p.s;if(!canAct(pi)||!hasOp(p)||s.debt>=10)return;p.gold+=4;s.debt+=5;s.infl+=6;p.buys++;logp(pi,p.name+' اقترضت 4 ذهب من البنك الدولي');refresh()}
function repay(pi){const p=G.players[pi],s=p.s;const n=Math.min(5,s.debt);if(!canAct(pi)||!hasOp(p)||n<=0||p.gold<n)return;p.gold-=n;s.debt-=n;p.buys++;logp(pi,p.name+' سددت '+n+' من ديونها');refresh()}
function indCost(p){return(p.s.ind?6:4)+(p.s.infl>=15?1:0)}
function buildInd(pi){const p=G.players[pi],s=p.s,c=indCost(p);if(!canAct(pi)||!hasOp(p)||s.ind>=2||p.gold<c)return;p.gold-=c;s.ind++;p.buys++;logp(pi,p.name+' وسّعت قاعدتها الصناعية للمستوى '+s.ind);refresh()}
function fuelCost(pi){return sancOn(pi).length?2:1}
function buyFuel(pi){const p=G.players[pi],s=p.s,c=fuelCost(pi);if(!canAct(pi)||!hasOp(p)||p.gold<c||s.fuel>=8)return;p.gold-=c;s.fuel=Math.min(8,s.fuel+2);p.buys++;logp(pi,p.name+' استوردت وقود');refresh()}
function rdSlots(p){return p.s.ind>=1?2:1}
function rdWhy(p,id){const T=TECH[id],s=p.s;if(s.tech[id])return'done';if(s.rd.some(x=>x.id===id))return'run';
 const miss=(T.req||[]).filter(r=>!s.tech[r]);if(miss.length)return'يحتاج: '+miss.map(r=>TECH[r].n).join('، ');
 if(T.ind&&s.ind<T.ind)return'يحتاج قاعدة صناعية مستوى '+T.ind;if(T.intel&&p.intel<T.intel)return'يحتاج استخبارات مستوى '+T.intel;return''}
function rdCost(p,id){return TECH[id].c+(p.s.infl>=15?1:0)}
function startRD(pi,id){const p=G.players[pi],s=p.s,T=TECH[id];if(!T||!canAct(pi)||!hasOp(p)||rdWhy(p,id)||s.rd.length>=rdSlots(p)||p.gold<rdCost(p,id))return;
 p.gold-=rdCost(p,id);s.rd.push({id,left:T.t,total:T.t});p.buys++;logp(pi,p.name+' موّلت برنامج بحث وتطوير');simSignal(pi,'تمويل برنامج «'+T.n+'»');refresh()}
function rdStage(pr){const done=pr.total-pr.left;return pr.retest?STAGES[2]+' (إعادة)':STAGES[Math.min(2,Math.floor(done/pr.total*3))]}
function sanction(pi,ti){const p=G.players[pi],t=G.players[ti];if(!canAct(pi)||!hasOp(p)||!t||pi===ti||pactWith(pi,ti)||G.sanc.some(x=>x.a===pi&&x.b===ti))return;
 const un=Math.min(G.maxRound,G.round+2);G.sanc.push({a:pi,b:ti,until:un});p.buys++;relAdd(ti,pi,-20);log(p.name+' فرضت عقوبات اقتصادية على '+t.name+' حتى الجولة '+un);cable(ti,p.name+' فرضت علينا عقوبات: دخل التجارة والصناعة ينقص والوقود أغلى.');refresh()}
function liftSanction(pi,ti){if(!canAct(pi))return;const n=G.sanc.length;G.sanc=G.sanc.filter(x=>!(x.a===pi&&x.b===ti));if(G.sanc.length<n){relAdd(ti,pi,8);log(G.players[pi].name+' رفعت العقوبات عن '+G.players[ti].name);cable(ti,G.players[pi].name+' رفعت عقوباتها عنا.')}refresh()}
function envoy(pi,ti){const p=G.players[pi],t=G.players[ti];if(!canAct(pi)||!hasOp(p)||!t||p.gold<1)return;p.gold--;p.buys++;relAdd(ti,pi,12);relAdd(pi,ti,8);log(p.name+' أوفدت مبعوثاً إلى '+t.name);cable(ti,'وصل مبعوث من '+p.name+' لتهدئة العلاقات.');refresh()}

/* ---------- advisors: recommendations computed from the live state ---------- */
function advisors(pi){const p=G.players[pi],s=p.s,out=[];const th=others(pi).map(q=>({q,...s.threat[q]})).filter(x=>x.lvl!=null).sort((a,b)=>b.lvl-a.lvl)[0];
 if(th&&th.lvl>=3&&s.ready===0)out.push({w:'مستشار الأمن القومي',t:'التهديد من '+G.players[th.q].name+' '+THREAT[th.lvl]+'. أوصي برفع الجاهزية إلى «تأهب».',b:'ارفع الجاهزية',f:`setReady(${pi},1)`});
 if(th&&th.lvl<=1&&s.ready>0)out.push({w:'وزير المالية',t:'لا تهديد جدّي الحين، والجاهزية تكلّفنا '+s.ready+' ذهب كل جولة.',b:'ارجع لوضع السلم',f:`setReady(${pi},0)`});
 if(s.ew.some(e=>e.k==='hit'&&e.r>=G.round-1)&&!has(p,'radar'))out.push({w:'قائد الدفاع الجوي',t:'انضربنا بدون إنذار كافٍ. نحتاج رادار إنذار مبكر.',b:'افتح البحث والتطوير',f:`openMinistry('def',${pi},false,'rd')`});
 if(s.fuel<=1)out.push({w:'رئيس الأركان',t:'الوقود حرج ('+s.fuel+'). أي هجوم بدون وقود يخسر نقطتين.',b:'استورد وقود',f:`buyFuel(${pi})`});
 if(s.stab<45)out.push({w:'وزير الداخلية',t:'الاستقرار '+s.stab+'%. تخفيض الضرائب يهدّي الشارع.',b:'خفّض الضرائب',f:`setTax(${pi},0)`});
 if(s.debt>0&&p.gold>=s.debt+3)out.push({w:'وزير المالية',t:'عندنا فائض. سداد الدين يوقف الفوائد ويحمي نقاطنا.',b:'سدّد',f:`repay(${pi})`});
 if(s.ind===0&&p.gold>=indCost(p)+2)out.push({w:'وزير الصناعة',t:'مصنع واحد يعطي ذهبة كل جولة ومسار بحث ثاني.',b:'ابنِ قاعدة صناعية',f:`buildInd(${pi})`});
 const blind=others(pi).filter(q=>!(s.dos[q]||[]).some(r=>!r.fail&&G.round-r.r<=2)).sort((a,b)=>troopsOf(b)-troopsOf(a))[0];
 if(blind!=null)out.push({w:'مدير الاستخبارات',t:'ما عندنا تقرير حديث عن '+G.players[blind].name+'. نشتغل على عمى.',b:'افتح الملفات',f:`openMinistry('intel',${pi},false,'dos')`});
 const ex=G.pacts.find(x=>x.until===G.round&&(x.a===pi||x.b===pi));if(ex)out.push({w:'وزير الخارجية',t:'معاهدتنا مع '+G.players[ex.a===pi?ex.b:ex.a].name+' تنتهي هذي الجولة.',b:'افتح المفاوضات',f:`openMinistry('foreign',${pi},false,'neg')`});
 const cr=G.crises.find(c=>c.a===pi||c.b===pi);if(cr)out.push({w:'وزير الخارجية',t:'الأزمة مع '+G.players[cr.a===pi?cr.b:cr.a].name+' تنزف استقرارنا. مبعوث يفتح باب التهدئة.',b:'أوفد مبعوثاً',f:`envoy(${pi},${cr.a===pi?cr.b:cr.a})`});
 if(!out.length)out.push({w:'رئيس الديوان',t:'الوضع مستقر. لا توصيات عاجلة.'});
 return out}
