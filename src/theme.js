/* ===================== Visual themes: ww2 / modern / future ===================== */
let THEME='modern';
try{const t=localStorage.getItem('wg_theme');if(t)THEME=t}catch(e){}
const TH={
 ww2:{name:'الحرب العالمية',skyT:[.52,.58,.62],skyH:[.86,.82,.70],sea:[.36,.46,.47],shal:[.52,.58,.54],slab:[.78,.74,.60],neutral:[.76,.71,.56],lines:[.30,.24,.18],lineEm:[0,0,0],sun:[.60,.55,.46],amb:[.56,.54,.49],mix:[.70,.64,.46],mixK:.45,dark:.9,dec:[.86,.86,.74],glow:0},
 modern:{name:'حديث',skyT:[.34,.56,.86],skyH:[.82,.90,.96],sea:[.16,.36,.50],shal:[.32,.58,.66],slab:[.86,.84,.78],neutral:[.84,.83,.76],lines:[.98,.98,.98],lineEm:[.18,.18,.18],sun:[.62,.60,.56],amb:[.52,.57,.63],mix:[.8,.8,.8],mixK:.08,dark:1.02,dec:[1,1,1],glow:0},
 future:{name:'مستقبلي',skyT:[.02,.03,.09],skyH:[.13,.09,.26],sea:[.05,.11,.18],shal:[.06,.26,.34],slab:[.14,.15,.20],neutral:[.17,.18,.24],lines:[.1,.1,.1],lineEm:[0,.75,.95],sun:[.42,.46,.70],amb:[.30,.30,.46],mix:[.2,.2,.3],mixK:.55,dark:.42,dec:[.45,.55,.75],glow:.06}};
const T=()=>TH[THEME]||TH.modern;
const mix3=(a,b,k)=>a.map((v,i)=>v*(1-k)+b[i]*k);
const neon=c=>{const m=(c[0]+c[1]+c[2])/3;return c.map(v=>Math.max(.05,(v-m)*3+.55)*2.2)};
function themeTint(i,own){const t=T();if(own){const f=hexc(K[own.k].fill);return mix3(f,t.mix,t.mixK).map(v=>Math.min(1.1,v*t.dark))}
 if(i===MINE)return THEME==='future'?[.55,.45,.12]:hexc('#E8C258');return t.neutral}
function themeEm(i,own){const t=T();if(!t.glow||!own)return[0,0,0];return hexc(K[own.k].strong).map(v=>v*t.glow*2)}
/* generic shapes */
function halfCyl(b,x,y,z,r,len,rot,col,seg=7){const c=Math.cos(rot),s=Math.sin(rot);const ax=[c,0,-s],side=[s,0,c];
 for(let k=0;k<seg;k++){const t0=k/seg*Math.PI,t1=(k+1)/seg*Math.PI,tm=(t0+t1)/2;const n=[side[0]*Math.cos(tm),Math.sin(tm),side[2]*Math.cos(tm)];
  const tg=[-side[0]*Math.sin(tm),Math.cos(tm),-side[2]*Math.sin(tm)];const w=2*r*Math.sin((t1-t0)/2);
  b.obox(x+n[0]*r,y+n[1]*r,z+n[2]*r,ax,n,tg,len,.35,w*1.02,col)}}
function sandbags(b,x,z,r,col){const n=Math.round(r*1.6);for(let i=0;i<n;i++){const a=i/n*6.2832;for(let l=0;l<2;l++)b.box(x+Math.cos(a)*r,l*1.1,z+Math.sin(a)*r,2.2,1.1,1.4,-a+(l?.3:0),l?lighten(col,.08):col)}}
/* ---------------- WW2 ---------------- */
const W2={brick:[.56,.30,.22],slate:[.30,.31,.33],olive:[.38,.41,.27],khaki:[.66,.60,.43],conc:[.62,.60,.55],steel:[.36,.37,.36]};
function w2Barracks(b,x,z,rot,acc){b.box(x,0,z,12,5,7.5,rot,W2.brick);b.box(x,0,z,12.3,.8,7.8,rot,W2.conc);b.gable(x,5,z,8.4,13,3.4,rot,W2.slate);
 const c=Math.cos(rot),s=Math.sin(rot);b.box(x+c*3.5,7,z-s*3.5,1.2,3.4,1.2,rot,W2.brick);
 for(let i=-1;i<=1;i++)b.box(x+c*i*3.8+s*3.8,1.6,z-s*i*3.8+c*3.8,1.8,1.9,.2,rot,[.75,.80,.82])}
function w2Quonset(b,x,z,rot){halfCyl(b,x,0,z,4.2,13,rot,W2.olive);const c=Math.cos(rot),s=Math.sin(rot);for(const e of[-1,1])b.box(x+c*6.5*e,0,z-s*6.5*e,.3,3.8,7.6,rot,lighten(W2.olive,-.1))}
function w2Tower(b,x,z,acc){for(const[dx,dz]of[[-2.2,-2.2],[2.2,-2.2],[-2.2,2.2],[2.2,2.2]])b.seg([x+dx,0,z+dz],[x+dx*.6,12,z+dz*.6],.6,.6,[.42,.32,.22]);
 b.box(x,12,z,5.4,3.2,5.4,0,[.50,.40,.28]);b.gable(x,15.2,z,6.4,6.4,2,0,W2.slate);b.cyl(x+2.7,13.6,z,.6,.3,1,5,[.95,.9,.6],true)}
function w2Tank(b,x,z,rot,acc){const c=Math.cos(rot),s=Math.sin(rot);b.box(x,0,z,9,2.2,5.4,rot,[.22,.22,.2]);b.box(x,1.6,z,8,1.8,4.6,rot,W2.olive);
 b.cyl(x,3.4,z,2,1.8,1.6,8,lighten(W2.olive,.06),true);b.seg([x+c*1.5,4.2,z-s*1.5],[x+c*7,4.4,z-s*7],.5,.5,W2.steel);b.box(x-c*1,3.6,z+s*1,1.2,.8,.15,rot,acc)}
function w2AA(b,x,z){sandbags(b,x,z,4,W2.khaki);b.cyl(x,0,z,1,1,1.6,6,W2.steel,true);for(const o of[-.5,.5])b.seg([x+o,1.8,z],[x+o+.4,7,z-3],.35,.35,W2.steel)}
function w2HQ(b,x,z,acc){const st=[.80,.77,.68];b.box(x,0,z,24,1.4,18,0,W2.conc);b.box(x,1.4,z-1,22,10,13,0,st);b.box(x,11.4,z-1,23,1,14,0,lighten(st,.06));
 for(let i=-3;i<=3;i++)b.cyl(x+i*3.1,1.4,z+6.4,.8,.8,10,8,lighten(st,.08));b.box(x,11.4,z+5.8,22,1.4,2,0,lighten(st,.04));b.gable(x,12.4,z-1,14,22,3.4,Math.PI/2,W2.slate);
 b.box(x,1.4,z+5.4,4,6,.3,0,[.25,.18,.12]);b.cyl(x,15.8,z-1,.35,.35,12,5,[.3,.3,.3]);b.box(x+3.2,24.6,z-1,6.4,3.6,.3,0,acc);
 w2AA(b,x-16,z+12);w2AA(b,x+16,z+12);sandbags(b,x,z+14,3,W2.khaki)}
function w2Soldier(b,x,z,acc){const ol=W2.olive;b.box(x-1,0,z,1.4,3.2,2,0,[.25,.22,.18]);b.box(x+1,0,z,1.4,3.2,2,0,[.25,.22,.18]);
 b.cyl(x,3,z,2.6,2.2,5.8,7,ol,true);b.box(x,6,z,5.4,.6,2.6,0,[.3,.27,.2]);b.cyl(x,8.4,z,1.6,1.5,2.8,7,C.skin,true);b.dome(x,10.6,z,2.6,1.6,8,lighten(ol,-.04));
 b.seg([x+3,2,z+1],[x+3.4,13,z-1],.5,.5,[.32,.24,.16]);b.box(x-2.6,5,z,.5,2,.5,0,acc)}
function w2Bunker(b,x,z,acc){b.box(x,0,z,16,4,12,0,W2.conc);b.box(x,4,z,17,1,13,0,lighten(W2.conc,-.06));b.box(x,1.8,z+6.05,10,1,.3,0,[.12,.12,.12]);sandbags(b,x,z+10,3.2,W2.khaki);b.cyl(x+6,5,z-3,.3,.3,7,4,C.trunk);b.box(x+8,10,z-3,4,2.4,.3,0,acc)}
function w2Radio(b,x,z,acc){b.box(x,0,z,10,7,9,0,W2.brick);b.gable(x,7,z,9.6,11,2.6,0,W2.slate);for(let y=0;y<26;y+=3){b.seg([x-1.5,y,z-1.5],[x+1.5,y+3,z+1.5],.25,.25,[.2,.2,.2]);b.seg([x+1.5,y,z-1.5],[x-1.5,y+3,z+1.5],.25,.25,[.2,.2,.2])}
 for(const[dx,dz]of[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]])b.seg([x+dx,0,z+dz+0],[x+dx*.2,28,z+dz*.2],.35,.35,[.2,.2,.2]);b.cyl(x,28,z,.6,.6,.6,6,[1,.2,.2],true)}
/* ---------------- Modern ---------------- */
const MD={conc:[.80,.80,.78],white:[.94,.94,.93],glass:[.40,.62,.80],glass2:[.30,.48,.66],dark:[.20,.22,.25],tan:[.70,.63,.47]};
function mdTower(b,x,z,h,acc){b.box(x,0,z,9,h,9,0,MD.conc);for(let y=1.5;y<h-1;y+=2.4){b.box(x,y,z,9.15,1.5,9.15,0,(y|0)%2?MD.glass:MD.glass2)}b.box(x,h,z,9.6,.8,9.6,0,MD.white);b.box(x,h+.8,z,3,1.6,3,0,MD.conc);b.box(x,h-.6,z+4.7,6,.6,.2,0,acc)}
function mdHouse(b,x,z,rot,acc){b.box(x,0,z,10,4.4,8,rot,MD.white);b.box(x,4.4,z,10.6,.5,8.6,rot,MD.dark);const c=Math.cos(rot),s=Math.sin(rot);
 b.box(x+s*4.05,1.2,z+c*4.05,7,2.2,.15,rot,MD.glass);b.box(x-c*3,4.9,z+s*3,3.4,2.6,5,rot,acc.map(v=>v*.9+.1));b.box(x-c*3,7.5,z+s*3,3.8,.35,5.4,rot,MD.dark)}
function mdTurbine(b,x,z,ph){b.cyl(x,0,z,.9,.45,24,7,MD.white);b.box(x,23.4,z+.6,1.6,1.4,3,0,MD.white);for(let k=0;k<3;k++){const a=ph+k*2.094;b.seg([x,24.1,z-1.2],[x+Math.cos(a)*11,24.1+Math.sin(a)*11,z-1.2],.7,.25,MD.white)}}
function mdHeli(b,x,z){b.cyl(x,0,z,6,6,.35,12,MD.dark,true);b.box(x-1.6,.36,z,.6,.05,4,0,[.95,.95,.95]);b.box(x+1.6,.36,z,.6,.05,4,0,[.95,.95,.95]);b.box(x,.36,z,2.6,.05,.6,0,[.95,.95,.95]);b.cyl(x,.36,z,5,5,.04,16,[.95,.8,.2],false)}
function mdVehicle(b,x,z,rot){const c=Math.cos(rot),s=Math.sin(rot);b.box(x,1.2,z,8.4,3,4.2,rot,MD.tan);b.box(x+c*1,4.2,z-s*1,3.4,1.4,3,rot,lighten(MD.tan,-.08));
 for(const e of[-2.8,0,2.8])for(const q of[-2.2,2.2])b.cyl(x+c*e+s*q,0,z-s*e+c*q,1.2,1.2,.6,8,[.15,.15,.15],true);b.seg([x+c*2,5,z-s*2],[x+c*6,5.4,z-s*6],.3,.3,[.2,.2,.2])}
function mdHQ(b,x,z,acc){b.box(x,0,z,26,1,18,0,[.70,.70,.68]);b.box(x,1,z-1,24,7,12,0,MD.glass2);b.box(x,1,z+5.1,24.4,7.4,.5,0,MD.white);for(let i=-4;i<=4;i++)b.box(x+i*2.8,1,z+5.4,.5,7.4,.6,0,MD.white);
 b.box(x,8,z-1,24.6,1,12.6,0,MD.white);mdTower(b,x-6,z-4,22,acc);b.cyl(x+9,9,z-3,.25,.25,9,5,MD.conc);b.box(x+11,15.6,z-3,4.2,2.6,.25,0,acc);mdHeli(b,x+7,z-3+0.01)}
function mdSoldier(b,x,z,acc){const cam=[.55,.50,.38];b.box(x-1,0,z,1.4,3.2,2,0,[.30,.27,.22]);b.box(x+1,0,z,1.4,3.2,2,0,[.30,.27,.22]);b.cyl(x,3,z,2.6,2.3,5.8,7,cam,true);
 b.box(x,4.4,z,5.4,3.4,3.6,0,[.30,.30,.26]);b.cyl(x,8.4,z,1.6,1.5,2.6,7,C.skin,true);b.dome(x,10.4,z,2.3,2,8,cam);b.box(x,10,z+1.9,2.6,.7,.4,0,[.1,.1,.12]);b.seg([x+2.6,5,z+1.6],[x+2.8,6,z+5],.6,.8,[.12,.12,.12]);b.box(x-2.6,6,z,.5,1.8,.5,0,acc)}
/* ---------------- Future ---------------- */
const FU={metal:[.30,.32,.38],light:[.78,.82,.88],dark:[.10,.11,.15]};
function fuSpire(b,x,z,h,acc){const n=neon(acc);b.cyl(x,0,z,5,1.2,h,8,FU.metal,true);for(let y=4;y<h-2;y+=6){const r=5-3.8*(y/h);b.cyl(x,y,z,r+.35,r+.25,.6,8,n,false)}b.cyl(x,h,z,.7,0,6,6,n,true);b.cyl(x,0,z,6.4,6.4,.4,12,FU.dark,true)}
function fuDome(b,x,z,acc){const n=neon(acc);b.cyl(x,0,z,7.2,7.2,.5,14,FU.dark,true);b.cyl(x,.5,z,7,7,.35,14,n,false);b.dome(x,.85,z,6.6,5.4,10,FU.light);b.box(x,.85,z+6.3,2.4,2.6,.4,0,n)}
function fuPad(b,x,z,acc){const n=neon(acc);b.cyl(x,0,z,6,6,.6,6,FU.dark,true);b.cyl(x,.6,z,5.6,5.6,.12,6,n,false);b.box(x,4,z,6,1.2,3.2,0,FU.light);b.box(x,3.4,z,4,.4,2,0,n)}
function fuHQ(b,x,z,acc){const n=neon(acc);b.cyl(x,0,z,14,12,3,10,FU.metal,true);b.cyl(x,3,z,12.3,12.3,.6,10,n,false);b.cyl(x,3.6,z,7,3.2,34,8,FU.light,true);
 for(const y of[14,24])b.cyl(x,y,z,9.5,9.5,.8,16,n,false);b.cyl(x,37.6,z,.7,.7,30,6,n,true);b.dome(x,3.6,z,10.5,6,12,lighten(FU.metal,.1))}
function fuSoldier(b,x,z,acc){const n=neon(acc);b.box(x-1,0,z,1.4,3.4,2,0,FU.dark);b.box(x+1,0,z,1.4,3.4,2,0,FU.dark);b.cyl(x,3.2,z,2.7,2.3,5.8,7,FU.light,true);
 b.box(x,5,z+1.6,3,.6,.4,0,n);b.box(x,9,z,3.4,3.2,3.2,0,FU.dark);b.box(x,9.8,z+1.65,2.8,.8,.2,0,n);b.seg([x+2.8,4.4,z+1.2],[x+3,5,z+5],.7,.9,FU.metal);b.box(x+3,5.2,z+5.2,.35,.35,.3,0,n)}
function fuDef(b,x,z,acc){const n=neon(acc);b.cyl(x,0,z,9,8,4,8,FU.metal,true);b.cyl(x,4,z,8.2,8.2,.4,8,n,false);for(const o of[-3,3]){b.cyl(x+o,4,z,1.5,1.5,1,8,FU.dark,true);b.cyl(x+o,5,z,.9,.9,8,8,FU.light,true);b.cyl(x+o,13,z,.9,0,2.4,8,n,true)}}
function fuIntel(b,x,z,acc){fuSpire(b,x,z,30,acc);const n=neon(acc);b.dome(x+3,22,z,3.6,-1.4,8,FU.light);b.cyl(x+3,20.6,z,.3,.3,1.4,4,n)}
function fuFor(b,x,z,acc){const n=neon(acc);b.cyl(x,0,z,9,9,5,14,FU.light,true);b.cyl(x,5,z,9.4,9.4,.4,14,n,false);b.cyl(x,5.4,z,4,4,3,10,FU.metal,true);b.cyl(x,10,z,8,8,.5,16,n,false)}
/* ---------------- dispatch ---------------- */
function themeProps(b,i,rg,g,own,isP,ms,dm){const k=own.k,acc=hexc(K[k].strong);
 rg.slots.forEach((s,j)=>{if(j===0)return;if(ms&&Object.values(ms).some(q=>Math.hypot(q.x-s.x,q.z-s.z)<19))return;if(dm){ruins(b,s.x,s.z);return}const v=(j+i)%4;
  if(THEME==='ww2'){if(v===0)w2Barracks(b,s.x,s.z,s.rot,acc);else if(v===1)w2Quonset(b,s.x,s.z,s.rot);else if(v===2)w2Tower(b,s.x,s.z,acc);else w2Tank(b,s.x,s.z,s.rot,acc)}
  else if(THEME==='future'){if(v===0)fuSpire(b,s.x,s.z,16+(j%3)*7,acc);else if(v===1||v===3)fuDome(b,s.x,s.z,acc);else fuPad(b,s.x,s.z,acc)}
  else{if(v===0)mdTower(b,s.x,s.z,12+(j%3)*6,acc);else if(v===1||v===3)mdHouse(b,s.x,s.z,s.rot,acc);else if(i%3===0)mdTurbine(b,s.x,s.z,j);else mdHeli(b,s.x,s.z)}});
 if(isP){const x=rg.px,z=rg.pz-6;
  if(THEME==='ww2'){w2HQ(b,x,z,acc);w2Bunker(b,ms.def.x,ms.def.z,acc);w2Radio(b,ms.intel.x,ms.intel.z,acc);forBld(b,ms.foreign.x,ms.foreign.z,acc)}
  else if(THEME==='future'){fuHQ(b,x,z,acc);fuDef(b,ms.def.x,ms.def.z,acc);fuIntel(b,ms.intel.x,ms.intel.z,acc);fuFor(b,ms.foreign.x,ms.foreign.z,acc)}
  else{mdHQ(b,x,z,acc);defBld(b,ms.def.x,ms.def.z,acc);intelBld(b,ms.intel.x,ms.intel.z,acc);forBld(b,ms.foreign.x,ms.foreign.z,acc)}}
 if(g.camp){const s=rg.slots[0];if(THEME==='ww2'){tent(b,s.x,s.z,acc);w2Tank(b,s.x+9,s.z+3,.4,acc)}else if(THEME==='future')fuPad(b,s.x,s.z,acc);else{tent(b,s.x,s.z,acc);mdVehicle(b,s.x+9,s.z+3,.3)}}
 if(dm&&!isP)ruins(b,rg.px+16,rg.pz-10);
 const n=g.troops,zc=rg.pz+(isP?31:14);const sol=THEME==='ww2'?w2Soldier:THEME==='future'?fuSoldier:mdSoldier;
 for(let t=0;t<n;t++){const row=Math.floor(t/5),inRow=Math.min(5,n-row*5),ci=t%5;sol(b,rg.px+(ci-(inRow-1)/2)*8.5,zc+row*9.5,acc)}}
/* sky dome + theme apply */
function buildSky(){const t=T(),b=new B();const R0=7000,seg=24,rings=8;
 for(let j=0;j<rings;j++){const a0=j/rings*1.5708,a1=(j+1)/rings*1.5708;const c0=mix3(t.skyH,t.skyT,Math.pow(j/rings,.7)),c1=mix3(t.skyH,t.skyT,Math.pow((j+1)/rings,.7));
  for(let i=0;i<seg;i++){const b0=i/seg*6.2832,b1=(i+1)/seg*6.2832;const P=(a,bb)=>[Math.cos(bb)*Math.cos(a)*R0,Math.sin(a)*R0-300,Math.sin(bb)*Math.cos(a)*R0];
   const p00=P(a0,b0),p01=P(a0,b1),p11=P(a1,b1),p10=P(a1,b0);b.v(p00,[0,1,0],c0);b.v(p01,[0,1,0],c0);b.v(p11,[0,1,0],c1);b.v(p00,[0,1,0],c0);b.v(p11,[0,1,0],c1);b.v(p10,[0,1,0],c1)}}
 if(THEME==='future'){const r=rng(9);for(let s=0;s<400;s++){const a=.15+r()*1.3,bb=r()*6.2832;const p=[Math.cos(bb)*Math.cos(a)*6800,Math.sin(a)*6800,Math.sin(bb)*Math.cos(a)*6800];const q=14+r()*16;b.quad([p[0]-q,p[1],p[2]],[p[0]+q,p[1],p[2]],[p[0]+q,p[1]+q*2,p[2]],[p[0]-q,p[1]+q*2,p[2]],[0,1,0],[1.6,1.6,1.8])}}
 if(V.sky)freeBuf(V.gl,V.sky);V.sky=mkBuf(V.gl,b)}
function setTheme(t){if(!TH[t])return;THEME=t;try{localStorage.setItem('wg_theme',t)}catch(e){}
 const th=T();V.fog=th.skyH.slice();if(V.ok){buildSky();V.reg.forEach(rg=>rg.key='');update3D()}
 document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('sel',b.dataset.theme===t));document.body.dataset.theme=t}
