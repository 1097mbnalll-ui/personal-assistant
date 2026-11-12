/* ===== Game shell: title screen, lobby, HUD, phase banners, online side panel, settings, sound & haptics ===== */
const CFG=(()=>{let c={};try{c=JSON.parse(localStorage.getItem('wwg_cfg')||'{}')}catch(e){}return Object.assign({snd:true,vib:true,q:'auto',name:''},c)})();
function cfgSave(){try{localStorage.setItem('wwg_cfg',JSON.stringify(CFG))}catch(e){}}
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- sound (synthesised, no files) ---------- */
const AU={ctx:null};
function SFX(n){if(!CFG.snd||(typeof V!=='undefined'&&V.instant))return;try{
 const c=AU.ctx||(AU.ctx=new (window.AudioContext||window.webkitAudioContext)());if(c.state==='suspended')c.resume();const t=c.currentTime,o=c.destination;
 const tone=(f,d,type,v,f2,at)=>{const g=c.createGain(),s=c.createOscillator();s.type=type||'sine';s.frequency.setValueAtTime(f,t+(at||0));if(f2)s.frequency.exponentialRampToValueAtTime(f2,t+(at||0)+d);
  g.gain.setValueAtTime(0,t+(at||0));g.gain.linearRampToValueAtTime(v||.15,t+(at||0)+.01);g.gain.exponentialRampToValueAtTime(.0005,t+(at||0)+d);s.connect(g);g.connect(o);s.start(t+(at||0));s.stop(t+(at||0)+d+.05)};
 const noise=(d,v,fq,at)=>{const b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2);
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=fq||900;g.gain.value=v||.5;s.connect(f);f.connect(g);g.connect(o);s.start(t+(at||0))};
 if(n==='click')tone(520,.05,'triangle',.06);
 else if(n==='notify'){tone(660,.12,'sine',.12);tone(990,.18,'sine',.1,0,.1);vib(30)}
 else if(n==='join'){tone(520,.12,'sine',.1,780)}
 else if(n==='leave'){tone(520,.18,'sine',.1,300)}
 else if(n==='phase'){tone(110,1.4,'triangle',.22);tone(165,1.2,'sine',.1);tone(220,.9,'sine',.06)}
 else if(n==='boom'){noise(1.1,.9,700);tone(70,.9,'sine',.35,35);vib([90,40,140])}
 else if(n==='intercept'){noise(.35,.35,2400);tone(1200,.25,'square',.04,600);vib(40)}
 else if(n==='error'){tone(220,.22,'sawtooth',.07,150)}
 else if(n==='win'){[523,659,784,1046].forEach((f,i)=>tone(f,.5,'triangle',.12,0,i*.13));vib([60,40,60])}
 else if(n==='ready')tone(880,.08,'sine',.08)}catch(e){}}
function vib(p){if(CFG.vib&&navigator.vibrate)try{navigator.vibrate(p)}catch(e){}}
addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('button'))SFX('click')},{capture:true});

/* ---------- screens ---------- */
function uiScreen(s){NET.screen=s;document.body.dataset.scr=s;['scrTitle','scrLobby'].forEach(id=>{$(id).style.display='none'});
 if(s==='title'){$('scrTitle').style.display='flex';uiTitle()}else if(s==='lobby'){$('scrLobby').style.display='flex';uiLobby()}
 if(s==='game'&&typeof V!=='undefined'&&V.ok&&V3){try{V.dirty=true}catch(e){}}}
function uiTitle(menu){const el=$('ttMenu');const q=new URLSearchParams(location.search);const room=q.get('room');menu=menu||(room?'join':'main');
 const sv=savedHost();const nm=esc(CFG.name);
 if(menu==='main')el.innerHTML=`
  <button class="mbtn big" onclick="uiTitle('host')"><b>العب أونلاين</b><span>كل لاعب بجواله · أنشئ غرفة وشارك الرابط</span></button>
  <button class="mbtn" onclick="uiTitle('join')"><b>انضم لغرفة</b><span>عندك رمز من صاحبك؟</span></button>
  <button class="mbtn" onclick="quickAI()"><b>ضد الحاسوب</b><span>أنت ضد 3 ممالك يديرها الذكاء الاصطناعي</span></button>
  <button class="mbtn" onclick="uiLocal()"><b>جهاز واحد</b><span>تمرير الجهاز بين اللاعبين</span></button>
  ${sv?`<button class="mbtn gold" onclick="hostResume()"><b>استئناف غرفتك ${esc(sv.code)}</b><span>الجولة ${sv.G.round} · لعبة محفوظة على هذا الجهاز</span></button>`:''}
  <div class="trow"><button onclick="uiSettings()">الإعدادات</button><button onclick="uiHowTo()">طريقة اللعب</button></div>`;
 else if(menu==='host')el.innerHTML=`<h3>إنشاء غرفة</h3><label for="tName">اسمك</label><input id="tName" maxlength="18" value="${nm}" placeholder="مثلاً: أبو فهد" autocomplete="nickname">
  <button class="mbtn big" onclick="CFG.name=$('tName').value.trim();cfgSave();hostCreate(CFG.name)"><b>أنشئ الغرفة</b><span>جهازك يصير المضيف. خلّه مفتوح طول اللعبة.</span></button><button class="back" onclick="uiTitle('main')">رجوع</button>`;
 else if(menu==='join')el.innerHTML=`<h3>الانضمام لغرفة</h3><label for="tName">اسمك</label><input id="tName" maxlength="18" value="${nm}" placeholder="اسمك في اللعبة" autocomplete="nickname">
  <label for="tCode">رمز الغرفة</label><input id="tCode" class="code" maxlength="6" value="${esc(room||'')}" placeholder="ABCDE" autocapitalize="characters" autocomplete="off" dir="ltr">
  <button class="mbtn big" onclick="CFG.name=$('tName').value.trim();cfgSave();clientJoin($('tCode').value,CFG.name)"><b>ادخل</b><span>تحتاج نفس الرابط اللي أرسله المضيف</span></button><button class="back" onclick="uiTitle('main')">رجوع</button>`;
 const f=$(room&&menu==='join'?'tName':'tName');if(f&&menu!=='main')setTimeout(()=>f.focus(),50)}
function quickAI(){netClose();uiScreen('game');newGame(4,[CFG.name?CFG.name+' (الجبال)':''],[false,true,true,true]);if(V.ok&&!V3)setView(true)}
function uiLocal(){netClose();G=null;uiScreen('game');render()}
function shareLink(){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('room',NET.code);const q=new URLSearchParams(location.search);['net','peerhost'].forEach(k=>{if(q.get(k))u.searchParams.set(k,q.get(k))});return u.toString()}
async function uiShare(){const url=shareLink(),txt='تعال نلعب «الحرب العالمية»! رمز الغرفة: '+NET.code;
 if(navigator.share){try{await navigator.share({title:'الحرب العالمية',text:txt,url});return}catch(e){}}
 try{await navigator.clipboard.writeText(txt+'\n'+url);toast('نسخت الرابط. أرسله لأصحابك.')}catch(e){prompt('انسخ الرابط وأرسله:',url)}}
function uiLobby(){if(NET.screen!=='lobby'&&!(NET.mode&&!G)){return}if(NET.mode&&!G&&NET.screen!=='lobby'){uiScreen('lobby');return}
 const el=$('lbBody');if(!el)return;const host=NET.mode==='host',L=host?lobbyState():NET.L;
 let h=`<div class="lbTop"><div><div class="muted">رمز الغرفة</div><div class="lcode" dir="ltr">${esc(NET.code)}</div></div><button class="primary" onclick="uiShare()">شارك الرابط</button></div>`;
 if(NET.status)h+=`<p class="lstat"><span class="spin"></span>${esc(NET.status)}</p>`;if(NET.err)h+=`<p class="warn">${esc(NET.err)}</p>`;
 if(L){h+='<div class="seats">'+L.seats.map((s,i)=>{const k=K[s.k],mine=i===NET.me;
   const who=s.kind==='open'?'<span class="muted">مقعد فاضي</span>':s.kind==='ai'?'🤖 الحاسوب':esc(s.name||'لاعب')+(s.kind==='host'?' <span class="tg run">المضيف</span>':'')+(s.on?'':' <span class="tg lock">غير متصل</span>');
   const btn=host&&!mine&&!L.started?`<button onclick="hostSeatToggle(${i})">${s.kind==='open'?'أضف الحاسوب':s.kind==='ai'?'افتح المقعد':'أخرج اللاعب'}</button>`:'';
   const pick=s.kind==='open'&&!L.started?`<button class="primary" onclick="${host?`hostPick(${i})`:`NET.tr.send({t:'pick',k:${i}})`}">اختر هذي المملكة</button>`:'';
   return `<div class="seat${mine?' me':''}" style="--kc:${k.strong};--kf:${k.fill}"><div class="sk">${k.name}${mine?' · <b>أنت</b>':''}</div><div class="sa muted">${k.ab}</div><div class="sw2">${who}</div><div class="row">${pick}${btn}</div></div>`}).join('')+'</div>';
  if(host)h+=`<button class="mbtn big gold" onclick="hostStart()" ${L.started?'disabled':''}><b>ابدأ الحرب</b><span>${L.seats.filter(s=>s.kind!=='open').length} ممالك جاهزة · المقاعد الفاضية ما تدخل اللعبة</span></button>`;
  else h+=`<p class="lstat"><span class="spin"></span>بانتظار المضيف يبدأ اللعبة…</p>`}
 h+=`<button class="back" onclick="netLeave()">اطلع من الغرفة</button>`;el.innerHTML=h}
function uiSettings(){const th=typeof THEME!=='undefined'?THEME:'ww2';
 dlg('الإعدادات',`<div class="setg"><label><input type="checkbox" id="sSnd" ${CFG.snd?'checked':''}> المؤثرات الصوتية</label>
 <label><input type="checkbox" id="sVib" ${CFG.vib?'checked':''}> الاهتزاز (الجوال)</label>
 <div>جودة الرسومات داخل المباني</div><div class="btns3">${[['auto','تلقائي'],['high','عالية'],['low','موفّرة للجوال']].map(([v,n])=>`<button class="${CFG.q===v?'sel':''}" onclick="CFG.q='${v}';cfgSave();applyQ();uiSettings()">${n}</button>`).join('')}</div>
 <div>شكل الخريطة</div><div class="btns3">${[['ww2','كلاسيكي'],['modern','حديث'],['future','مستقبلي']].map(([v,n])=>`<button class="${th===v?'sel':''}" onclick="setTheme('${v}');uiSettings()">${n}</button>`).join('')}</div>
 ${V.ok?`<div>العرض</div><div class="btns3"><button class="${V3?'sel':''}" onclick="setView(true);uiSettings()">ثلاثي الأبعاد</button><button class="${V3?'':'sel'}" onclick="setView(false);uiSettings()">خريطة مسطحة</button></div>`:''}
 </div>`,[{label:'حفظ',primary:true,fn:()=>{CFG.snd=$('sSnd').checked;CFG.vib=$('sVib').checked;cfgSave();closeDlg()}},
 ...(NET.screen==='game'?[{label:'القائمة الرئيسية',fn:()=>{closeDlg();if(confirm(NET.mode==='host'?'لو طلعت تتوقف اللعبة عند الكل (تقدر تستأنفها بعدين). متأكد؟':'متأكد تبغى تطلع؟'))netLeave()}}]:[])],'inst')}
function applyQ(){if(typeof RRI==='undefined'||!RRI.R)return;if(CFG.q==='low'){RRI.tier=Math.max(RRI.tier,2);RRI.R.q.ao=false;RRI.R.q.refl=false;RRI.sz=''}else if(CFG.q==='high'){RRI.tier=0;RRI.R.q.ao=true;RRI.R.q.refl=true;RRI.sz=''}}
function uiHowTo(){dlg('طريقة اللعب',`<div class="howto">
 <p><b>الهدف:</b> بعد 7 جولات، أكثر مملكة نقاط تفوز. النقاط من المناطق والذهب والقصر واستقرار دولتك.</p>
 <p><b>كل جولة:</b> حدث عالمي ← الإدارة (3 عمليات: شراء، بحث، استخبارات، دبلوماسية…) ← كرت سري (هجوم / تحريك / سلام) ← التحريك ← الهجوم ← الدخل.</p>
 <p><b>أونلاين:</b> الكل يلعب بنفس الوقت من جواله. لما تخلص اضغط «انتهيت» وانتظر الباقين. أسرارك (ذهبك، صواريخك، أبحاثك) ما يشوفها غيرك، وتعرف عنهم بس عن طريق الاستخبارات.</p>
 <p><b>المؤسسات:</b> القيادة الوطنية (الإيجاز والمستشارين والميزانية)، الدفاع (القيادة، الإنذار المبكر، البحث والتطوير، التسليح)، الاستخبارات (التهديدات وملفات الدول)، الخارجية (المعاهدات والعقوبات). في العرض ثلاثي الأبعاد تقدر تدخل المباني وتمشي فيها.</p>
 <p><b>المعركة:</b> الجنود + الوزير + الأرض + الجاهزية + الإمداد + الوقود + المعنويات + الطقس. افتح «مركز القيادة» عشان تشوف تقدير رئيس الأركان قبل الهجوم.</p></div>`,null,'inst')}

/* ---------- in-game HUD ---------- */
function uiRender(){const on=!!G;document.body.classList.toggle('ingame',on);const r=$('hRes');if(!r)return;
 if(!G){r.innerHTML='';return}
 const me=G.net?ME:(['market','cards','move','attack'].includes(G.phase)&&G.queue&&G.queue[G.qi]!=null?PI():(typeof V!=='undefined'?V.me:0));const p=G.players[me];
 if(p&&p.gold!=null){const s=p.s;r.innerHTML=`<span class="res" title="الذهب"><i>◉</i>${p.gold}</span><span class="res" title="العمليات">⚙ ${G.phase==='market'?(p.buys||0)+'/'+OPS:'—'}</span><span class="res ${s.stab<40?'bad':''}" title="الاستقرار">♥ ${s.stab}%</span><span class="res" title="الوقود">⛽ ${s.fuel}</span><span class="res" title="الجاهزية">${['☮','⚠','⚔'][s.ready]} ${READY[s.ready]}</span>`}
 const key=G.phase+'|'+G.round;if(key!==uiRender.k){const first=!uiRender.k;uiRender.k=key;if(!first||G.round===1)uiBanner()}
 if(G.phase==='end'&&!uiRender.won){uiRender.won=1;SFX('win')}if(G.phase!=='end')uiRender.won=0}
function uiBanner(){if(typeof V!=='undefined'&&V.instant)return;const b=$('banner');const ph=G.phase;
 b.innerHTML=`<small>${ph==='end'?'نهاية الحرب':'الجولة '+G.round+' من '+G.maxRound}</small><b>${PHASE[ph]}</b>${ph==='event'&&G.ev?`<span>${esc(G.ev.t)}</span>`:ph==='market'&&G.wx?`<span>الطقس: ${esc(G.wx.t)}</span>`:''}`;
 b.classList.remove('show');void b.offsetWidth;b.classList.add('show');if(['event','market','attack','end'].includes(ph))SFX('phase')}
function chips(state){return '<div class="chips">'+alive().map(q=>{const p=G.players[q],st=state(q);return `<span class="chip ${st[0]}" style="--kc:${K[p.k].strong}">${esc(p.name)}${q===ME?' (أنت)':''}<i>${st[1]}</i></span>`}).join('')+'</div>'}
function offersHtml(pi){if(!G||!G.net||!G.offers)return'';const o=G.offers.filter(x=>x.b===pi);if(!o.length)return'';
 return o.map(x=>`<div class="offer"><div><b>${esc(G.players[x.a].name)}</b> تعرض عليك معاهدة عدم اعتداء لـ 3 جولات (لا هجوم ولا صواريخ بينكم).</div><div class="row"><button onclick="answerPact(${pi},'${x.id}',false)">ارفض</button><button class="primary" onclick="answerPact(${pi},'${x.id}',true)">وقّع المعاهدة</button></div></div>`).join('')}
function netTop(){return offersHtml(ME)}
/* online side panel: returns null when the classic panel should be used (it is my turn to act) */
function netPanel(){const ph=G.phase,p=G.players[ME];const top=netTop();
 if(!p)return'<p class="muted">مشاهد</p>';
 if(['market','cards','move','attack'].includes(ph)&&p.alive&&G.queue.includes(ME)&&!G.done[ME])return null;
 const rd=G.rdy&&G.rdy.k===ph+'|'+G.round?G.rdy.s:{};
 const readyBox=(btn)=>{const me=rd[ME];return `${chips(q=>isBot(G.players[q])?['bot','🤖']:rd[q]?['ok','✓']:['wait','…'])}<button class="primary wide" onclick="ready()" ${me?'disabled':''}>${me?'بانتظار الباقين…':btn}</button>`};
 let h=top;
 if(ph==='event')h+=`<h2>الجولة ${G.round}: حدث عالمي</h2>${evBox()}<p class="muted">الطقس هذي الجولة: <b>${esc(G.wx.t)}</b> — ${esc(G.wx.d)}</p>${readyBox('جاهز، كمّل')}`;
 else if(['market','cards','move','attack'].includes(ph)){const inQ=G.queue.includes(ME);
  h+=`<h2>${PHASE[ph]}</h2><p class="muted">${!p.alive?'مملكتك خرجت من اللعبة. تقدر تتابع.':inQ?'خلصت دورك. بانتظار الباقين…':ph==='move'?'ما اخترت كرت التحريك. بانتظار اللي يحركون جيوشهم…':ph==='attack'?'ما اخترت كرت الهجوم. بانتظار القادة المهاجمين…':'بانتظار الباقين…'}</p>
  ${chips(q=>!G.queue.includes(q)?['off','—']:G.done[q]?['ok','✓']:G.players[q].on===false?['bot','انقطع']:isBot(G.players[q])?['bot','🤖']:['wait','يفكّر…'])}
  <p class="muted" style="margin-top:10px">تقدر خلال الانتظار تدخل مؤسساتك وتراجع التقارير:</p><div class="btns">${['hq','def','intel','foreign'].map(m=>`<button onclick="openMinistry('${m}',${ME},false)">${MNAMES[m]}</button>`).join('')}</div>`}
 else if(ph==='reveal')h+=`<h2>كشف الكروت</h2><table>${alive().map(q=>{const x=G.players[q];return `<tr><td>${sw(x)}${esc(x.name)}</td><td><b>${CARD[x.card]||'—'}</b></td></tr>`}).join('')}</table>${readyBox('ابدأ التحريك')}`;
 else if(ph==='resolve')h+=`<h2>نتائج المعارك</h2><ul class="bl">${G.battles.map(b=>`<li>${b}</li>`).join('')}</ul>${readyBox('احسب الدخل')}`;
 else if(ph==='income'){const c=p.inc;h+=`<h2>دخل الجولة ${G.round}</h2>${c?`<table>${incParts(c).map(x=>`<tr><td>${x}</td></tr>`).join('')}<tr><td><b>الصافي: ${c.total>=0?'+':''}${c.total} ذهب</b></td></tr></table>`:'<p class="muted">مملكتك ما لها دخل.</p>'}${readyBox(G.round>=G.maxRound?'النتيجة النهائية':'الجولة '+(G.round+1))}`}
 else if(ph==='end'){const s=G.players.map((x,q)=>({x,q,...score(q)})).sort((a,b)=>b.total-a.total);
  h+=`<div class="victory"><small>${s[0].q===ME?'انتصار!':'انتهت الحرب'}</small><b>${sw(s[0].x)}${esc(s[0].x.name)}</b><span>تتصدّر بـ ${s[0].total} نقطة</span></div><table><thead><tr><th>المملكة</th><th>مناطق</th><th>ذهب</th><th>قصر</th><th>الدولة</th><th>المجموع</th></tr></thead>${s.map(x=>`<tr${x.q===ME?' class="meRow"':''}><td>${sw(x.x)}${esc(x.x.name)}</td><td>${x.reg}</td><td>${x.gold}</td><td>${x.pal}</td><td>${x.nat}</td><td><b>${x.total}</b></td></tr>`).join('')}</table>
  ${NET.mode==='host'?'<button class="primary wide" onclick="hostRematch()">جولة ثانية بنفس الغرفة</button>':'<p class="muted">المضيف يقدر يبدأ لعبة جديدة بنفس الغرفة.</p>'}<button class="wide" onclick="netLeave()">القائمة الرئيسية</button>`}
 return h}
function hostRematch(){G=null;NET.lastFx=0;try{localStorage.removeItem('wwg_host')}catch(e){}uiScreen('lobby');lobbyPush()}

function uiBoot(){wrapClient();try{$('ttBg').innerHTML=$('map').outerHTML.replace('id="map"','')}catch(e){}
 const q=new URLSearchParams(location.search);if(location.hash.includes('play'))return uiScreen('game');uiScreen('title');if(q.get('room'))uiTitle('join')}
