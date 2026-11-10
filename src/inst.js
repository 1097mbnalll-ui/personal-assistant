/* ===== Institutions: department terminals (one view per room/workstation) + computer-run kingdoms ===== */
const INST={
 hq:{tabs:[['brief','غرفة العمليات الوطنية'],['cab','مجلس الوزراء'],['eco','الخزانة والصناعة'],['comm','الاتصالات المؤمّنة']]},
 def:{tabs:[['cmd','مركز القيادة'],['ew','الإنذار المبكر'],['rd','البحث والتطوير'],['arm','التسليح']]},
 intel:{tabs:[['threat','مركز التهديدات'],['dos','ملفات الدول'],['ops','العمليات والتقنية'],['ci','مكافحة التجسس']]},
 foreign:{tabs:[['neg','قاعة المفاوضات'],['world','العلاقات الدولية'],['sanc','العقوبات والأزمات']]}};
function instTab(t){V.minTab=t;showMinistry()}
const dis=c=>c?'':'disabled';
const gauge=(l,v,max,col,txt)=>`<div class="gauge"><span>${l}</span><i><b style="width:${clamp(v/max*100,0,100)}%;background:${col}"></b></i><em>${txt!=null?txt:v}</em></div>`;
const stabCol=v=>v>=65?'#4E9A5B':v>=40?'#C9A227':'#B3372B';
const kcol=q=>K[G.players[q].k].strong;
function tgtSel(pi){const o=others(pi);if(!o.includes(V.mT))V.mT=o[0];return `<select id="mT" class="isel" onchange="V.mT=+this.value;showMinistry()">${o.map(q=>`<option value="${q}" ${q===V.mT?'selected':''}>${G.players[q].name}</option>`).join('')}</select>`}

/* schematic operations display: nodes = regions, edges = borders */
function opsMap(pi,mode){const p=G.players[pi],s=p.s;const xs=R.map(r=>r.lx),ys=R.map(r=>r.ly),x0=Math.min(...xs)-60,y0=Math.min(...ys)-50,w=Math.max(...xs)-x0+60,hh=Math.max(...ys)-y0+60;
 let h=`<svg class="ops" viewBox="${x0} ${y0} ${w} ${hh}" role="img" aria-label="خريطة العمليات">`;
 D.adj.forEach(([a,b])=>{h+=`<line x1="${R[a].lx}" y1="${R[a].ly}" x2="${R[b].lx}" y2="${R[b].ly}" class="oe"/>`});
 if(mode==='ew'&&p.palace!=null){const c=R[p.palace],r=120+detPct(p)*3.2;h+=`<circle cx="${c.lx}" cy="${c.ly}" r="${r}" class="orad"/><circle cx="${c.lx}" cy="${c.ly}" r="${r*.6}" class="orad"/>`;
  s.ew.filter(e=>e.reg!=null&&e.from!=null&&G.players[e.from].palace!=null).slice(0,4).forEach(e=>{const A=R[G.players[e.from].palace],B=R[e.reg];h+=`<path d="M${A.lx},${A.ly} Q${(A.lx+B.lx)/2},${Math.min(A.ly,B.ly)-90} ${B.lx},${B.ly}" class="otrk ${e.k}"/>`})}
 if(mode==='threat')others(pi).forEach(q=>{if(pactWith(pi,q))return;owned(q).forEach(j=>{if(movable(j)<2)return;NB[j].forEach(i=>{if(G.reg[i].owner!==pi)return;const A=R[j],B=R[i];h+=`<line x1="${A.lx}" y1="${A.ly}" x2="${(A.lx+B.lx*2)/3}" y2="${(A.ly+B.ly*2)/3}" stroke="#E0553F" stroke-width="${2+movable(j)}" stroke-linecap="round" opacity=".75"/>`})})});
 R.forEach((r,i)=>{const g=G.reg[i],o=g.owner,mine=o===pi;const rad=r.size==='L'?24:r.size==='M'?20:16;
  let ring='';if(mine&&mode==='cmd')ring=`<circle cx="${r.lx}" cy="${r.ly}" r="${rad+6}" class="${supplyOK(pi,i)?'osup':'onosup'}"/>`;
  if(mine&&isPalace(i))ring+=`<rect x="${r.lx-rad-4}" y="${r.ly-rad-4}" width="${rad*2+8}" height="${rad*2+8}" class="opal"/>`;
  h+=ring+`<circle cx="${r.lx}" cy="${r.ly}" r="${rad}" fill="${o!=null?kcol(o):'#4A5058'}" opacity="${mine?1:.8}" stroke="${mine?'#fff':'#0008'}" stroke-width="${mine?2.5:1}"/><text x="${r.lx}" y="${r.ly+1}" class="ot">${g.troops||''}</text>`+(mine?`<text x="${r.lx}" y="${r.ly+rad+15}" class="on">${r.name}</text>`:'')});
 return h+'</svg>'}

function rdTree(pi,p,act,brs){const s=p.s;let h=`<p class="muted">مسارات البحث المتاحة: ${s.rd.length}/${rdSlots(p)}${s.ind<1?' (القاعدة الصناعية تفتح مساراً ثانياً)':''}</p>`;
 if(s.rd.length)h+=s.rd.map(pr=>{const T=TECH[pr.id],done=pr.total-pr.left;return `<div class="doc"><b>${T.n}</b> · المرحلة: ${rdStage(pr)} · الاكتمال المتوقع: الجولة ${G.round+pr.left}${gauge('التقدم',done+.5,pr.total+.5,'#C9A227',Math.round((done+.5)/(pr.total+.5)*100)+'%')}</div>`}).join('');
 brs.forEach(br=>{h+=`<h3>${BRANCH[br]}</h3><div class="tree">`;Object.keys(TECH).filter(id=>TECH[id].br===br).forEach(id=>{const T=TECH[id],w=rdWhy(p,id),c=rdCost(p,id);
  const st=w==='done'?'<span class="tg ok">في الخدمة</span>':w==='run'?'<span class="tg run">قيد التطوير</span>':w?`<span class="tg lock">${w}</span>`:`<button onclick="startRD(${pi},'${id}')" ${dis(act&&p.gold>=c&&s.rd.length<rdSlots(p))}>موّل · ${c} ذهب · ${T.t} ${T.t>1?'جولات':'جولة'}</button>`;
  h+=`<div class="node ${w==='done'?'done':w&&w!=='run'?'locked':''}"><b>${T.n}</b><span class="muted">${T.d}${T.test?' يمر بمرحلة اختبار قد تفشل.':''}</span>${st}</div>`});h+='</div>'});
 return h}

const VIEW={
hq:{
 brief(pi,p){const s=p.s;const th=others(pi).map(q=>s.threat[q]?s.threat[q].lvl:0);const mx=Math.max(0,...th);
  return `<div class="grow">${gauge('الاستقرار',s.stab,100,stabCol(s.stab),s.stab+'%')}${gauge('أعلى تهديد',mx,4,mx>=3?'#B3372B':'#C9A227',THREAT[mx])}</div>
  ${opsMap(pi,'threat')}<p class="muted">الأسهم الحمراء: حشود معادية قادرة على الهجوم على حدودك. الطقس: <b>${G.wx.t}</b> — ${G.wx.d}</p>
  <h3>الإيجاز اليومي · الجولة ${G.round}</h3>${s.brief.map(b=>`<div class="doc"><span class="cls">${b.cls}</span>${b.t}</div>`).join('')||'<p class="muted">لا جديد.</p>'}
  <h3>توصيات المستشارين</h3>${advisors(pi).map(a=>`<div class="adv"><div><b>${a.w}:</b> ${a.t}</div>${a.b?`<button onclick="${a.f}" ${dis(canAct(pi)||a.f.startsWith('open'))}>${a.b}</button>`:''}</div>`).join('')}`},
 cab(pi,p,act){const s=p.s,T=troopsOf(pi),o=owned(pi),cut=o.filter(i=>G.reg[i].troops>0&&!supplyOK(pi,i)).length,inc=calcIncome(pi,fewest(),false);
  const th=others(pi).map(q=>({q,...s.threat[q]})).sort((a,b)=>(b.lvl||0)-(a.lvl||0))[0];const lock=s.readyR===G.round;
  return `<h3>تقارير الوزراء</h3>
  <div class="doc"><span class="cls">الدفاع</span>${T} جندي في ${o.length} مناطق${cut?'، '+cut+' منها خارج خطوط الإمداد':''}. الصواريخ: ${p.mis.n} عادي و${p.mis.h} ثقيل. الوقود ${s.fuel}/8.</div>
  <div class="doc"><span class="cls">المالية</span>صافي الدخل المتوقع ${inc.total>=0?'+':''}${inc.total} ذهب. الدين ${s.debt}، التضخم ${s.infl}%${s.infl>=15?' (الأسعار +1)':''}.</div>
  <div class="doc"><span class="cls">الاستخبارات</span>${th&&th.lvl!=null?'أخطر جار: '+G.players[th.q].name+' بمستوى '+THREAT[th.lvl]+' (ثقة '+th.conf+'%).':'لا تقديرات بعد.'}</div>
  <div class="doc"><span class="cls">الخارجية</span>سمعتنا الدولية ${rep(pi)} (${relWord(rep(pi))}). عقوبات علينا: ${sancOn(pi).length}. أزمات: ${G.crises.filter(c=>c.a===pi||c.b===pi).length}.</div>
  <div class="doc"><span class="cls">الداخلية</span>الاستقرار ${s.stab}%${s.stab<40?' — المعنويات متدنية والجيش يقاتل بـ −1':s.stab>=80?' — إنتاجية عالية (+1 ذهب)':''}${s.stab<25?' — اضطرابات وفرار جنود':''}.</div>
  <h3>وضع الجاهزية العسكرية</h3><p class="muted">تأهب: +1 دفاع واعتراض أفضل (1 ذهب/جولة). تعبئة عامة: +1 هجوم و+1 دفاع (2 ذهب/جولة، −4 استقرار، وقود وتضخم). الجيران يلاحظون التصعيد. ${lock?'<b>غُيّر الوضع هذي الجولة.</b>':''}</p>
  <div class="btns3">${READY.map((n,v)=>`<button class="${s.ready===v?'sel':''}" onclick="setReady(${pi},${v})" ${dis(act&&!lock&&s.ready!==v)}>${n}</button>`).join('')}</div>
  <h3>السياسة الضريبية</h3><p class="muted">منخفضة: −1 ذهب و+5 استقرار. مرتفعة: +2 ذهب و−7 استقرار كل جولة.</p>
  <div class="btns3">${TAX.map((n,v)=>`<button class="${s.tax===v?'sel':''}" onclick="setTax(${pi},${v})" ${dis(act&&s.tax!==v)}>${n}</button>`).join('')}</div>`},
 eco(pi,p,act){const s=p.s,inc=calcIncome(pi,fewest(),false),ic=indCost(p),fc=fuelCost(pi);
  return `<div class="grow">${gauge('الخزينة',p.gold,15,'#C9A227',p.gold+' ذهب')}${gauge('الدين',s.debt,10,'#B3372B',s.debt+'/10')}${gauge('التضخم',s.infl,30,s.infl>=15?'#B3372B':'#C9A227',s.infl+'%')}${gauge('الوقود',s.fuel,8,'#5E8FB0',s.fuel+'/8')}</div>
  <h3>الميزانية المتوقعة لهذي الجولة</h3><table>${Object.keys(inc).filter(k=>k!=='total'&&inc[k]).map(k=>`<tr><td>${INC_L[k]}</td><td style="color:${inc[k]>0?'#3E8A4C':'#C0392B'}"><b>${inc[k]>0?'+':'−'}${Math.abs(inc[k])}</b></td></tr>`).join('')}<tr><td><b>الصافي</b></td><td><b>${inc.total>=0?'+':''}${inc.total}</b></td></tr></table>
  <p class="muted">العجز يتحول تلقائياً لدين اضطراري (تضخم +5، استقرار −5). كل 5 ديون = فائدة ذهبة بالجولة و−1 نقطة بالنهاية.</p>
  <div class="btns">
  <button onclick="buildInd(${pi})" ${dis(act&&s.ind<2&&p.gold>=ic)}>${s.ind>=2?'الصناعة بأعلى مستوى':'توسعة القاعدة الصناعية → '+(s.ind+1)}<br><span class="muted">${s.ind>=2?'—':ic+' ذهب · +1 دخل'+(s.ind?' · صواريخ أرخص':' · مسار بحث ثاني')}</span></button>
  <button onclick="buyFuel(${pi})" ${dis(act&&p.gold>=fc&&s.fuel<8)}>استيراد وقود (+2)<br><span class="muted">${fc} ذهب${fc>1?' · السعر مضاعف بسبب العقوبات':''}</span></button>
  <button onclick="borrow(${pi})" ${dis(act&&s.debt<10)}>قرض دولي (+4 ذهب)<br><span class="muted">دين +5 · تضخم +6</span></button>
  <button onclick="repay(${pi})" ${dis(act&&s.debt>0&&p.gold>=Math.min(5,s.debt))}>سداد الدين<br><span class="muted">${Math.min(5,s.debt)||5} ذهب</span></button></div>`},
 comm(pi,p,act){const s=p.s;
  return `<h3>الخط الساخن</h3>${others(pi).map(q=>{const t=G.players[q];return `<div class="adv"><div>${sw(t)}<b>${t.name}</b> · نظرتهم لنا: ${relWord(G.rel[q][pi])} (${G.rel[q][pi]})${pactWith(pi,q)?' · <span class="tg ok">معاهدة</span>':''}${inCrisis(pi,q)?' · <span class="tg lock">أزمة</span>':''}</div><button onclick="envoy(${pi},${q})" ${dis(act&&p.gold>=1)}>أوفد مبعوثاً · 1 ذهب</button></div>`}).join('')}
  <h3>البرقيات الواردة</h3>${s.cables.map(c=>`<div class="doc"><span class="cls">ج${c.r}</span>${c.t}</div>`).join('')||'<p class="muted">لا برقيات.</p>'}`}},
def:{
 cmd(pi,p){const s=p.s;const o=owned(pi);
  const rows=o.map(i=>{const g=G.reg[i];let en=0;NB[i].forEach(j=>{const q=G.reg[j].owner;if(q!=null&&q!==pi&&!pactWith(pi,q))en+=Math.max(0,movable(j))});const sup=supplyOK(pi,i);
   return `<tr><td>${R[i].name}${isPalace(i)?' <span class="tg ok">قصر</span>':''}${g.camp?' <span class="tg run">معسكر</span>':''}</td><td>${g.troops}/${cap(i)}</td><td>${sup?'متصل':'<span style="color:#E0553F">منقطع</span>'}</td><td>${en?(en>g.troops?'<span style="color:#E0553F">'+en+' ⚠</span>':en):'—'}</td></tr>`}).join('');
  const ops=[];attackTargets(pi).forEach(t=>{let A=0,sup=true;NB[t].forEach(j=>{if(G.reg[j].owner===pi){const n=Math.max(0,movable(j)-(isPalace(j)?0:1));if(n>0){A+=n;if(!supplyOK(pi,j))sup=false}}});if(!A)return;
   const Ae=A+sumM(atkMods(pi,t,{sup,noFuel:s.fuel<1})),De=G.reg[t].troops+(G.reg[t].troops>0&&R[t].size==='S'?1:0);ops.push({t,A,Ae,De,m:Ae-De})});ops.sort((a,b)=>b.m-a.m);
  const reps=G.reps.filter(r=>r.ai===pi||r.di===pi).slice(0,4);
  return `${opsMap(pi,'cmd')}<p class="muted">حلقة خضراء: المنطقة متصلة بخط إمداد (قصر أو معسكر قريب). حمراء متقطعة: منقطعة، والهجوم منها −1. الطقس: <b>${G.wx.t}</b> — ${G.wx.d}</p>
  <div class="grow">${gauge('الوقود',s.fuel,8,'#5E8FB0',s.fuel+'/8')}${gauge('المعنويات',s.stab,100,stabCol(s.stab),s.stab<40?'متدنية':'جيدة')}</div>
  <h3>حالة الوحدات</h3><table><thead><tr><th>المنطقة</th><th>القوة</th><th>الإمداد</th><th>عدو مجاور</th></tr></thead>${rows}</table>
  <h3>تقدير الموقف (رئيس الأركان)</h3>${ops.slice(0,3).map(x=>`<div class="doc"><span class="cls">${x.m>0?'فرصة':x.m===0?'متكافئ':'مجازفة'}</span>${R[x.t].name}: قوتنا الفعلية ${x.Ae} (${x.A} جندي مع العوامل) مقابل دفاع مقدّر ${x.De}+ <span class="muted">— التقدير ما يشمل تدريب العدو وجاهزيته؛ اسأل الاستخبارات.</span></div>`).join('')||'<p class="muted">لا أهداف في المدى.</p>'}
  <h3>تقارير المعارك</h3>${reps.map(r=>`<div class="doc"><span class="cls">ج${r.r} · ${r.res==='win'?(r.ai===pi?'نصر':'خسارة'):r.res==='tie'?'تعادل':(r.ai===pi?'صُدّ هجومنا':'صمود')}</span>${G.players[r.ai].name} ← ${R[r.t].name}: ${r.A} جندي → قوة ${r.Ae} ضد ${r.D} → ${r.De}.<br><span class="muted">${r.am.map(x=>x[0]+' '+(x[1]>0?'+':'')+x[1]).join('، ')}${r.dm.length?' | المدافع: '+r.dm.map(x=>x[0]+' '+(x[1]>0?'+':'')+x[1]).join('، '):''}</span></div>`).join('')||'<p class="muted">لا معارك بعد.</p>'}`},
 ew(pi,p,act){const s=p.s,d=detPct(p),left=Math.max(0,p.def-p.adUsed);
  return `<div class="grow">${gauge('احتمال الكشف',d,100,'#5EC27A',d+'%')}${gauge('اعتراض (كشف مبكر)',intPct(p,null,true),100,'#5EC27A',intPct(p,null,true)+'%')}${gauge('اعتراض (كشف متأخر)',intPct(p,null,false),100,'#C9A227',intPct(p,null,false)+'%')}${gauge('صواريخ اعتراضية جاهزة',left,2,'#5E8FB0',left+'/'+p.def)}</div>
  ${opsMap(pi,'ew')}<p class="muted">الدوائر: تغطية الرادار. المسارات: آخر الإطلاقات المرصودة (أحمر أصاب، أخضر اعتُرض). الكشف يتأثر بالرادار والجاهزية والطقس وتقنية العدو.</p>
  <button onclick="defUp(${pi})" ${dis(act&&p.def<2&&p.gold>=(p.def?6:4))}>${p.def>=2?'بطاريات الدفاع بأعلى مستوى':'نشر بطارية دفاع جوي → مستوى '+(p.def+1)}<br><span class="muted">${p.def>=2?'—':(p.def?6:4)+' ذهب · صاروخ اعتراضي إضافي كل جولة'}</span></button>
  <h3>سجل الإنذارات</h3>${s.ew.map(e=>`<div class="doc"><span class="cls">ج${e.r} · ${e.k==='ok'?'اعتراض':e.k==='false'?'كاذب':'إصابة'}</span>${e.t}</div>`).join('')||'<p class="muted">الأجواء هادئة. لا إنذارات.</p>'}`},
 rd(pi,p,act){return rdTree(pi,p,act,['air','mis','land'])},
 arm(pi,p,act){const s=p.s,tg=missileTargets(pi).length,cn=misCost(p,'n'),ch=misCost(p,'h');
  return `<div class="grow">${gauge('صواريخ عادية',p.mis.n,4,'#C9A227',p.mis.n)}${gauge('صواريخ ثقيلة',p.mis.h,4,'#B3372B',p.mis.h)}${gauge('الوقود',s.fuel,8,'#5E8FB0',s.fuel+'/8')}</div>
  <p class="muted">إطلاق واحد كل جولة، ويستهلك وحدة وقود. ${p.launched?'<b>تم الإطلاق هذي الجولة.</b>':''}</p>
  <div class="btns">
  <button onclick="buyMis(${pi},'n')" ${dis(act&&p.gold>=cn&&has(p,'rocket'))}>إنتاج صاروخ عادي<br><span class="muted">${has(p,'rocket')?cn+' ذهب · يقتل جنديين':'يحتاج برنامج «محركات الصواريخ»'}</span></button>
  <button onclick="buyMis(${pi},'h')" ${dis(act&&p.gold>=ch&&has(p,'heavy'))}>إنتاج صاروخ ثقيل<br><span class="muted">${has(p,'heavy')?ch+' ذهب · يدمر المباني':'يحتاج برنامج «الرؤوس الثقيلة»'}</span></button>
  <button class="primary" onclick="startAim(${pi},'n')" ${dis(act&&p.mis.n>0&&!p.launched&&tg&&s.fuel>=1)}>أطلق صاروخ عادي</button>
  <button class="primary" onclick="startAim(${pi},'h')" ${dis(act&&p.mis.h>0&&!p.launched&&tg&&s.fuel>=1)}>أطلق صاروخ ثقيل</button></div>`}},
intel:{
 threat(pi,p){const s=p.s;
  return `${opsMap(pi,'threat')}<h3>تقدير التهديد</h3>${others(pi).map(q=>{const t=G.players[q],x=s.threat[q];if(!x)return'';return `<div class="doc"><span class="cls" style="background:${['#3E8A4C','#5E8FB0','#C9A227','#D9772B','#B3372B'][x.lvl]};color:#fff">${THREAT[x.lvl]}</span>${sw(t)}<b>${t.name}</b>: قوات على حدودنا ≈ ${x.est}${x.mob?' · مؤشرات '+READY[x.mob]:''}${x.pact?' · معاهدة سارية':''}<br><span class="muted">المصدر: مراقبة الحدود · جُمع ج${x.r} · ثقة ${x.conf}% · هامش ±${Math.max(0,2-p.intel)}</span></div>`}).join('')}
  <h3>رصد الإشارات</h3>${has(p,'sigint')?(s.sig.map(g=>`<div class="doc"><span class="cls">ج${g.r} · SIGINT</span>${g.t}</div>`).join('')||'<p class="muted">لا إشارات ملتقطة.</p>'):'<p class="muted">يحتاج برنامج «اعتراض الإشارات».</p>'}`},
 dos(pi,p,act){const s=p.s,sel=tgtSel(pi),ti=V.mT,list=s.dos[ti]||[];
  return `<label for="mT">الدولة:</label> ${sel}
  <button onclick="spyReport(${pi},${ti})" ${dis(act&&p.gold>=1)}>تكليف بجمع معلومات · 1 ذهب<br><span class="muted">${p.intel<1?'بلا شبكة محلّلين: التقرير يتأخر جولة':'التقرير يوصل فوراً'} · تقرير ثانٍ بمصدر مختلف يرفع الثقة</span></button>
  ${list.map(r=>r.fail?`<div class="doc"><span class="cls">ج${r.r} · فشل</span>انكشف عملاؤنا. لا معلومات.</div>`:r.due>G.round?`<div class="doc"><span class="cls">ج${r.r} · في الطريق</span>العملاء في الميدان. التقرير يوصل الجولة ${r.due}.</div>`:
   `<div class="doc rep"><span class="cls">سري للغاية</span><b>تقرير عن ${G.players[r.ti].name}</b><br><span class="muted">المصدر: ${SRC[r.src]} · تاريخ الجمع: الجولة ${r.r}${G.round>r.r?' (قديم '+(G.round-r.r)+' ج)':''} · الثقة: ${r.conf}%${r.ver?' · مؤكَّد بمصدر ثانٍ':''}</span>
   <table>${r.it.map(x=>`<tr><td>${x[0]}</td><td><b>${x[1]}</b></td></tr>`).join('')}</table><span class="muted">${r.unc}</span></div>`).join('')||'<p class="muted">الملف فارغ. ما نعرف عن هذي الدولة إلا اللي نشوفه على الخريطة.</p>'}`},
 ops(pi,p,act){const sel=tgtSel(pi);
  return `<div class="grow">${gauge('قدرة التحليل',p.intel,2,'#5EC2D6','مستوى '+p.intel)}</div>
  <div class="btns"><button onclick="intelUp(${pi})" ${dis(act&&p.intel<2&&p.gold>=(p.intel?5:3))}>${p.intel>=2?'أعلى مستوى':'توظيف وتدريب محلّلين → '+(p.intel+1)}<br><span class="muted">${p.intel>=2?'—':(p.intel?5:3)+' ذهب · ثقة أعلى وتقارير أسرع'}</span></button>
  <span>${sel}<button style="width:100%;margin-top:6px" onclick="sabotage(${pi},V.mT)" ${dis(act&&p.gold>=2&&p.intel>=1)}>عملية تخريب<br><span class="muted">2 ذهب · ${p.intel>=1?'تسرق حتى 3 ذهب':'يحتاج مستوى 1'}</span></button></span></div>`+rdTree(pi,p,act,['int'])},
 ci(pi,p){const s=p.s;const n=Object.values(s.dos).reduce((a,l)=>a+l.length,0);
  return `<div class="doc"><span class="cls">الحماية</span>${has(p,'crypto')?'التشفير مفعّل: تقارير الأعداء عنا أقل دقة (−15% ثقة)، وعملاؤهم ينكشفون أكثر.':'اتصالاتنا غير مشفّرة. برنامج «التشفير ومكافحة التجسس» يسد الثغرة.'}</div>
  <h3>حوادث مكافحة التجسس</h3>${s.ci.map(c=>`<div class="doc"><span class="cls">ج${c.r}</span>${c.t}</div>`).join('')||'<p class="muted">لا حوادث مسجلة. (غياب الحوادث ما يعني غياب التجسس.)</p>'}
  <h3>الأرشيف</h3><p class="muted">${n} تقرير محفوظ في ${Object.keys(s.dos).length} ملف. تُحفظ آخر 5 تقارير لكل دولة.</p>`}},
foreign:{
 neg(pi,p,act){const ps=G.pacts.filter(x=>x.until>=G.round&&(x.a===pi||x.b===pi)),sel=tgtSel(pi),ti=V.mT;
  return `<h3>المعاهدات السارية</h3>${ps.map(x=>`<div class="doc"><span class="cls">حتى ج${x.until}</span>عدم اعتداء مع ${G.players[x.a===pi?x.b:x.a].name}</div>`).join('')||'<p class="muted">لا يوجد.</p>'}
  <label for="mT">المملكة:</label> ${sel} <span class="muted">نظرتهم لنا: ${relWord(G.rel[ti][pi])} (${G.rel[ti][pi]})</span>
  <div class="btns">
  <button onclick="proposePact(${pi},${ti})" ${dis(act&&!pactWith(pi,ti))}>اقتراح معاهدة<br><span class="muted">عدم اعتداء 3 جولات</span></button>
  <button onclick="breakPact(${pi},${ti})" ${dis(act&&pactWith(pi,ti))}>نقض المعاهدة<br><span class="muted">ذهبتين وضربة لسمعتك عند الكل</span></button>
  <div class="row"><label for="aidN">ذهب:</label><input id="aidN" type="number" min="1" max="5" value="2" class="isel" style="width:56px"></div>
  <button onclick="sendAid(${pi},${ti},$('aidN').value)" ${dis(act&&p.gold>=1)}>إرسال مساعدات<br><span class="muted">حتى 5 ذهب · يحسّن العلاقة</span></button>
  <button onclick="envoy(${pi},${ti})" ${dis(act&&p.gold>=1)}>إيفاد مبعوث<br><span class="muted">1 ذهب · تهدئة</span></button></div>`},
 world(pi,p){const al=alive();
  return `<div class="grow">${gauge('سمعتنا الدولية',rep(pi)+100,200,rep(pi)>=0?'#4E9A5B':'#B3372B',rep(pi)+' · '+relWord(rep(pi)))}</div>
  <p class="muted">السمعة ≥ 15: +2 استقرار كل جولة. السمعة ≤ −20: تنقطع التجارة الخارجية. الهجوم والصواريخ ونقض المعاهدات تهدمها، والمساعدات تبنيها.</p>
  <h3>كيف ترى كل مملكة غيرها</h3><table><thead><tr><th>نظرة ↓ إلى ←</th>${al.map(q=>`<th>${K[G.players[q].k].short}</th>`).join('')}</tr></thead>${al.map(a=>`<tr><td>${sw(G.players[a])}${K[G.players[a].k].short}</td>${al.map(b=>a===b?'<td>—</td>':`<td style="color:${G.rel[a][b]>=15?'#3E8A4C':G.rel[a][b]<=-15?'#C0392B':'inherit'}">${G.rel[a][b]}</td>`).join('')}</tr>`).join('')}</table>`},
 sanc(pi,p,act){const sel=tgtSel(pi),ti=V.mT,mine=G.sanc.filter(x=>x.a===pi),on=sancOn(pi);
  return `<h3>عقوبات مفروضة علينا</h3>${on.map(x=>`<div class="doc"><span class="cls">حتى ج${x.until}</span>من ${G.players[x.a].name}: −1 من دخل التجارة/الصناعة، والوقود بسعر مضاعف.</div>`).join('')||'<p class="muted">لا يوجد.</p>'}
  <h3>عقوباتنا</h3>${mine.map(x=>`<div class="adv"><div>على ${G.players[x.b].name} حتى ج${x.until}</div><button onclick="liftSanction(${pi},${x.b})" ${dis(canAct(pi))}>ارفعها</button></div>`).join('')||'<p class="muted">لا يوجد.</p>'}
  <label for="mT">المملكة:</label> ${sel}
  <button onclick="sanction(${pi},${ti})" ${dis(act&&!pactWith(pi,ti)&&!mine.some(x=>x.b===ti))}>فرض عقوبات اقتصادية<br><span class="muted">3 جولات · تخنق تجارتهم وتسمّم العلاقة</span></button>
  <h3>الأزمات الدبلوماسية</h3>${G.crises.map(c=>`<div class="doc"><span class="cls">منذ ج${c.r}</span>${G.players[c.a].name} × ${G.players[c.b].name}: السفراء مسحوبون، −1 استقرار للطرفين كل جولة حتى تتحسن العلاقة فوق −30.</div>`).join('')||'<p class="muted">لا أزمات قائمة.</p>'}`}}};

function showMinistry(){const m=V.minOpen,pi=V.minFor,p=G.players[pi],I=INST[m];if(!I.tabs.some(t=>t[0]===V.minTab))V.minTab=I.tabs[0][0];
 const act=canAct(pi)&&hasOp(p),s=p.s;
 const note=canAct(pi)?(hasOp(p)?'':'<p class="warn">خلصت عملياتك لهذا الدور. تقدر تطّلع فقط.</p>'):'<p class="warn">القرارات متاحة في دورك بمرحلة الإدارة فقط. تقدر تطّلع على المعلومات الحين.</p>';
 const h=`<div class="itabs" role="tablist">${I.tabs.map(([id,n])=>`<button role="tab" class="${id===V.minTab?'sel':''}" onclick="instTab('${id}')">${n}</button>`).join('')}</div>
 <div class="istat"><span>الذهب <b>${p.gold}</b></span><span>العمليات <b>${p.buys}/${OPS}</b></span><span>الجاهزية <b>${READY[s.ready]}</b></span><span>الجولة <b>${G.round}/${G.maxRound}</b></span></div>${note}
 <div class="ibody">${VIEW[m][V.minTab](pi,p,act)}</div>`;
 dlg(MNAMES[m]+' · '+p.name,h,[{label:V.minSit?'قم من المكتب':'إغلاق',fn:()=>closeDlg()}],'inst i-'+m)}

/* ---------- computer-run kingdoms ---------- */
const AI_RD={m:['train','radar','fort','rocket','inter','doctrine','ew2','logi'],p:['radar','rocket','crypto','train','guid','ew2','heavy','civil'],d:['rocket','train','doctrine','logi','guid','heavy','radar'],f:['train','logi','radar','rocket','doctrine','fort','civil']};
function aiFoe(pi){const c=others(pi).filter(q=>!pactWith(pi,q));if(!c.length)return null;return c.sort((a,b)=>(G.rel[pi][a]-4*borderForce(pi,a))-(G.rel[pi][b]-4*borderForce(pi,b)))[0]}
function aiPactOK(ti,pi){const r=G.rel[ti][pi];if(inCrisis(ti,pi)||r<-15)return false;return r>=10||(aiFoe(ti)!==pi&&troopsOf(pi)>=troopsOf(ti)+2)}
function aiBest(pi){const p=G.players[pi];let best=null;attackTargets(pi).forEach(t=>{let A=0,sup=true;NB[t].forEach(j=>{if(G.reg[j].owner===pi){const n=Math.max(0,movable(j)-(isPalace(j)?0:1));if(n>0){A+=n;if(!supplyOK(pi,j))sup=false}}});if(!A)return;
  const Dr=G.reg[t].troops,o=G.reg[t].owner;const Ae=A+sumM(atkMods(pi,t,{sup,noFuel:p.s.fuel<1}));const De=Dr+(Dr>0&&R[t].size==='S'?1:0)+(Dr>0&&o!=null?1:0);
  const val=(R[t].size==='L'?3:R[t].size==='M'?2:1)+(o!=null&&G.players[o].palace===t?2:0)+(o!=null&&G.rel[pi][o]<-20?1:0);const sc=(Ae-De)*2+val+Math.random()*4;if(Ae>De&&(!best||sc>best.sc))best={t,sc}});return best}
function aiMarket(pi){const p=G.players[pi],s=p.s;
 if(p.aiM!==G.round){p.aiM=G.round;const foe=aiFoe(pi);const mx=Math.max(0,...others(pi).map(q=>s.threat[q]?s.threat[q].lvl:0));
  const want=mx>=4?2:mx>=3?1:0;if(want!==s.ready&&(want<s.ready||p.gold>=want+2))setReady(pi,want);
  if(s.stab<40&&s.tax!==0)setTax(pi,0);else if(s.stab>78&&s.tax===0)setTax(pi,1);
  if(s.fuel<=1&&p.gold>=fuelCost(pi))buyFuel(pi);
  if(s.debt>0&&p.gold>=s.debt+4)repay(pi);
  const id=AI_RD[p.k].find(x=>!rdWhy(p,x));if(id&&s.rd.length<rdSlots(p)&&p.gold>=rdCost(p,id)+1)startRD(pi,id);
  if(foe!=null&&p.mis.n+p.mis.h>0&&!p.launched&&s.fuel>=2&&G.rel[pi][foe]<=-20&&hasOp(p)){const ts=missileTargets(pi).filter(i=>G.reg[i].owner===foe).sort((a,b)=>G.reg[b].troops-G.reg[a].troops);if(ts.length)launch(pi,p.mis.h?'h':'n',ts[0])}
  if(mx>=2&&p.gold>=price('troops',p)&&placeTargets(pi).length)buy('troops');
  if(s.ind<1&&G.round<=4&&p.gold>=indCost(p)+2)buildInd(pi);
  if(has(p,'rocket')&&p.mis.n<2&&p.gold>=misCost(p,'n')+1&&foe!=null&&G.rel[pi][foe]<=-15)buyMis(pi,'n');
  if(p.gold>=price('troops',p)+1&&placeTargets(pi).length)buy('troops');
  if(p.minister<3&&p.gold>=price(p.minister===1?'silver':'diamond',p)+3)buy(p.minister===1?'silver':'diamond');
  if(foe!=null&&G.rel[pi][foe]<=-45&&Math.random()<.5)sanction(pi,foe);
  if(foe!=null&&p.gold>=3&&Math.random()<.5)spyReport(pi,foe);
  const strong=others(pi).filter(q=>!pactWith(pi,q)&&q!==foe&&G.rel[pi][q]>=-10&&troopsOf(q)>troopsOf(pi)).sort((a,b)=>troopsOf(b)-troopsOf(a))[0];
  if(strong!=null&&mx>=2&&hasOp(p)&&Math.random()<.4)proposePact(pi,strong)}
 if(G.wait)return;
 autoPlace();endMarketTurn()}
function aiCard(pi){const p=G.players[pi];if(G.ev.id!=='friday'&&aiBest(pi))return'attack';
 const mx=Math.max(0,...others(pi).map(q=>p.s.threat[q]?p.s.threat[q].lvl:0));if(mx>=3)return'peace';
 const brd=i=>NB[i].some(j=>G.reg[j].owner!==pi);return owned(pi).some(i=>!brd(i)&&movable(i)-(isPalace(i)?0:1)>0)?'move':'peace'}
function aiMove(pi){const brd=i=>NB[i].some(j=>G.reg[j].owner!=null&&G.reg[j].owner!==pi);const o=owned(pi);
 o.filter(i=>!brd(i)).forEach(src=>{let n=movable(src)-(isPalace(src)?0:1);const dst=o.filter(i=>brd(i)&&G.reg[i].troops<cap(i)).sort((a,b)=>G.reg[a].troops-G.reg[b].troops);
  for(const d of dst){while(n>0&&G.reg[d].troops<cap(d)){G.reg[src].troops--;G.reg[d].troops++;n--}}})}
function aiAttack(pi){const p=G.players[pi],b=aiBest(pi);p.att=null;
 if(b){onRegion(b.t);const a=p.att;if(a){for(const j in a.from)a.from[j]=Math.max(0,movable(+j)-(isPalace(+j)?0:1));if(!Object.values(a.from).some(v=>v>0))p.att=null}}
 hideCurtain();next(resolve)}
function aiAct(){const p=P();if(!G||!p||!p.ai)return;const pi=PI(),ph=G.phase;
 if(ph==='market')aiMarket(pi);else if(ph==='cards')chooseCard(aiCard(pi));else if(ph==='move'){aiMove(pi);next(startAttack)}else if(ph==='attack')aiAttack(pi)}
function aiSchedule(){if(!G||V.instant||aiSchedule.h)return;if(!['market','cards','move','attack'].includes(G.phase))return;const p=P();if(!p||!p.ai||G.aim)return;
 aiSchedule.h=setTimeout(()=>{aiSchedule.h=null;if(!G||G.wait)return;aiAct()},650)}
