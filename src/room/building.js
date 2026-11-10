/* Realistic WWII-style ministry building: two floors, shared by 3 ministries */
if(!RR.THEMES)RR.THEMES={};
RR.THEMES.bld={atlas:{wood:[146,90,52],dwood:[70,40,24],lwood:[170,120,76],rugA:[104,26,24],rugB:[214,188,138],rugC:[26,32,60],carpet:[90,40,35],leather:[74,40,24],fabric:[118,30,28],metal:[118,112,96],panel:[90,95,85],concrete:[176,170,160],mapStyle:'paper',sky:['#9fb6c4','#d9d4c2','#e8d7ae'],view:'town',scrBg:'#111',scrFg:'#9f9',over:{screen:'paint'}},
 L:{sunD:[1,.55,.42],sunC:[6.4,4.7,3.0],sky:[.30,.27,.22],gnd:[.19,.13,.09],spP:[4,6.25,-2.5],spD:[0,-1,0],spC:[2.6,1.9,1.15],spAng:.95,
  pl:[[0,2.7,0],[0,2.7,0],[0,2.7,0],[0,2.7,0]],pc:[[1,.68,.36],[1,.68,.36],[1,.68,.36],[1,.68,.36]],exp:1.1,bloom:.9,grade:[1.06,1.0,.9],sunR:15,sunT:[0,3.4,0]}};
RR.SCRSLOT={status:{x:0,y:0,w:1024,h:512},sign:{x:1024,y:0,w:1024,h:160},map:{x:0,y:512,w:1024,h:1024}};
RR.building=function(m,o){o=o||{};const T=RR.THEMES.bld,mt=RR.mt;const A=new RR.GB(),N=new RR.GB();
 const W=9,D=6,F=3.4,TOP=6.8,t=.25;const acc=o.acc||[.7,.2,.2],mc=o.mc||[.4,.4,.4];
 const M={floor:mt('parquet',.95,.55),marble:mt('marble',.8,.74),wall:mt('plaster',.55,.03),ceil:mt('plaster',.45,0),wood:mt('wood',1.3,.5),dwood:mt('wood',1.6,.6),leather:mt('leather',2.4,.42),fabric:mt('fabric',2.2,.05),
  brass:mt('metal',2.4,.92),iron:mt('metal',1.5,.55),rug:mt('rug',.25,0),paper:mt('plaster',3,.05),book:mt('leather',3,.3),glass:mt('marble',3,.95),conc:mt('concrete',2,.3),carpet:mt('carpet',2.4,.06),map:mt('map',.8,.1)};
 const WIN=[0,0,-1,.9],SCR=[0,0,-2,.55];
 const WC=[.95,.89,.76],TRIM=[.97,.94,.86],BR=[1,.82,.5];
 const lights=[];const rayArr=[],dust=[];
 /* ---------- helpers ---------- */
 const uvf=(slot,u0,v0,u1,v1)=>{const s=RR.SCRSLOT[slot];const su=s.x/2048,sv=1-(s.y+s.h)/2048,sw=s.w/2048,sh=s.h/2048;return[[su+u0*sw,sv+v0*sh],[su+u1*sw,sv+v0*sh],[su+u1*sw,sv+v1*sh],[su+u0*sw,sv+v1*sh]]};
 const wq=(axis,w,dir,u0,u1,y0,y1,mat,uv,e,off)=>{off=off||0;const Lf=axis==='x'?(dir>0?u0:u1):(dir<0?u0:u1),Rr=Lf===u0?u1:u0;const P=(u,y)=>axis==='x'?[u,y,w+dir*off]:[w+dir*off,y,u];const n=axis==='x'?[0,0,dir]:[dir,0,0];
  N.q(P(Lf,y0),P(Rr,y0),P(Rr,y1),P(Lf,y1),n,[1,1,1],mat,e,uv)};
 const bx=(G,axis,w,dir,u,y,d,su,sy,sd,r,Mt,col,e)=>axis==='x'?G.cb(u,y,w+dir*d,su,sy,sd,0,r,Mt,col,e):G.cb(w+dir*d,y,u,sd,sy,su,0,r,Mt,col,e);
 const tubeL=(axis,w,dir,u0,y0,d0,u1,y1,d1,r,seg,Mt,col)=>{const a=axis==='x'?[u0,y0,w+dir*d0]:[w+dir*d0,y0,u0],b=axis==='x'?[u1,y1,w+dir*d1]:[w+dir*d1,y1,u1];A.tube(a,b,r,seg,Mt,col)};
 const iw={n:-D+t/2,s:D-t/2,e:W-t/2,w:-W+t/2};
 /* ---------- floors, ceilings ---------- */
 for(let i=-6;i<6;i++)for(let j=-4;j<4;j++)A.box(i*1.5,-.2,j*1.5,i*1.5+1.5,0,j*1.5+1.5,M.marble,(i+j+20)%2?[.96,.94,.9]:[.30,.31,.36]);
 const areas=[[-W,-3.95,W,D],[-W,-D,-7,-3.95],[-1.5,-D,W,-3.95]];
 areas.forEach(a=>{A.box(a[0],F-.22,a[1],a[2],F-.02,a[3],M.ceil,[.97,.94,.87]);A.box(a[0],F-.02,a[1],a[2],F,a[3],M.floor,[.92,.84,.74])});
 A.box(-W,TOP,-D,W,TOP+.25,D,M.ceil,[.97,.94,.87]);
 /* ---------- walls ---------- */
 const WM=(x0,y0,z0,x1,y1,z1)=>A.box(x0,y0,z0,x1,y1,z1,M.wall,WC);
 const wallX=(z,y0,y1,ops)=>{let x=-W-t/2;ops.slice().sort((a,b)=>a[0]-b[0]).forEach(q=>{if(q[0]>x)WM(x,y0,z-t/2,q[0],y1,z+t/2);if(q[2]>y0)WM(q[0],y0,z-t/2,q[1],q[2],z+t/2);if(q[3]<y1)WM(q[0],q[3],z-t/2,q[1],y1,z+t/2);x=q[1]});if(x<W+t/2)WM(x,y0,z-t/2,W+t/2,y1,z+t/2)};
 const wallZ=(x,y0,y1,ops)=>{let z=-D;ops.slice().sort((a,b)=>a[0]-b[0]).forEach(q=>{if(q[0]>z)WM(x-t/2,y0,z,x+t/2,y1,q[0]);if(q[2]>y0)WM(x-t/2,y0,q[0],x+t/2,q[2],q[1]);if(q[3]<y1)WM(x-t/2,q[3],q[0],x+t/2,y1,q[1]);z=q[1]});if(z<D)WM(x-t/2,y0,z,x+t/2,y1,D)};
 wallX(-D,0,F,[[6.2,8,1,2.6]]);wallX(D,0,F,[[-6.5,-3.5,1,2.6],[-1.1,1.1,0,2.7],[3.5,6.5,1,2.6]]);wallZ(W,0,F,[[2,4.5,1,2.6]]);wallZ(-W,0,F,[[0,3,1,2.6]]);
 wallX(-D,F,TOP,[[-5.5,-2.5,4.3,5.9]]);wallX(D,F,TOP,[[-7,7,3.9,6.3]]);wallZ(W,F,TOP,[[3,5,4.3,5.9]]);wallZ(-W,F,TOP,[[-1,2,4.3,5.9]]);
 /* ---------- windows ---------- */
 const winUV=(w,h)=>{const a=w/h;if(a<2){const us=a/2;return[[.5-us/2,0],[.5+us/2,0],[.5+us/2,1],[.5-us/2,1]]}const vs=2/a;return[[0,.56-vs/2],[1,.56-vs/2],[1,.56+vs/2],[0,.56+vs/2]]};
 const fm=mt('plaster',2,.5),fcol=[.92,.9,.84];
 const win=(axis,w,dir,a0,a1,y0,y1,fy,curt)=>{const c=(a0+a1)/2,len=a1-a0,h=y1-y0;
  wq(axis,w,dir,a0,a1,y0,y1,WIN,winUV(len,h),.5,0);
  bx(A,axis,w,dir,c,y1+.03,.08,len+.12,.08,.2,.012,fm,fcol);bx(A,axis,w,dir,c,y0-.03,.08,len+.12,.08,.2,.012,fm,fcol);bx(A,axis,w,dir,a0-.03,(y0+y1)/2,.08,.08,h,.2,.012,fm,fcol);bx(A,axis,w,dir,a1+.03,(y0+y1)/2,.08,.08,h,.2,.012,fm,fcol);
  const nm=Math.max(1,Math.round(len/1.6));for(let i=1;i<nm;i++)bx(A,axis,w,dir,a0+len*i/nm,(y0+y1)/2,.05,.06,h,.1,.006,fm,fcol);
  for(const q of[.38,.7])bx(A,axis,w,dir,c,y0+h*q,.05,len,.05,.1,.006,fm,fcol);
  bx(A,axis,w,dir,c,y0-.075,.2,len+.34,.06,.36,.015,M.marble,[.92,.9,.86]);
  if(curt){const yr=y1+.3;tubeL(axis,w,dir,a0-.6,yr,.34,a1+.6,yr,.34,.018,10,M.brass,BR);for(const u of[a0-.62,a1+.62]){const p=axis==='x'?[u,yr,w+dir*.34]:[w+dir*.34,yr,u];A.sph(p[0],p[1],p[2],.04,.04,.04,M.brass,BR)}
   const fx=w+dir*.3;const yb=fy+.12,yt=yr-.04;A.drape2(axis==='x'?'x':'z',fx,a0-.55,a0+.08,yb,yt,4,.045,M.fabric,[1,1,1],dir);A.drape2(axis==='x'?'x':'z',fx,a1-.08,a1+.55,yb,yt,4,.045,M.fabric,[1,1,1],dir);
   A.drape2(axis==='x'?'x':'z',w+dir*.27,a0+.1,a1-.1,y1+.0,yt,Math.max(3,Math.round(len/.5)),.02,M.fabric,[1.05,.98,.85],dir)}
  /* radiator under sill */
  if(y0<1.5&&fy===0||fy===F){const rn=Math.max(4,Math.round((len-.4)/.2));for(let k=0;k<rn;k++){const u=a0+.2+k*(len-.4)/(rn-1);bx(A,axis,w,dir,u,fy+.42,.22,.06,.56,.14,.025,M.iron,[.72,.70,.62])}tubeL(axis,w,dir,a0+.18,fy+.16,.22,a1-.18,fy+.16,.22,.025,8,M.iron,[.7,.68,.6]);tubeL(axis,w,dir,a0+.18,fy+.7,.22,a1-.18,fy+.7,.22,.025,8,M.iron,[.7,.68,.6])}
  return{c,len}};
 const sd=RR.m.nrm(T.L.sunD);
 const beam=(w,a,b,y0,y1,floorY)=>{const C=[[w+.1,y0,a],[w+.1,y0,b],[w+.1,y1,b],[w+.1,y1,a]];const Fc=C.map(c=>{const k=(c[1]-floorY)/sd[1];return[c[0]-sd[0]*k,floorY+.002,c[2]-sd[2]*k]});
  for(let i=0;i<4;i++){const j=(i+1)%4;rayArr.push(...C[i],.05,...C[j],.05,...Fc[j],.011,...C[i],.05,...Fc[j],.011,...Fc[i],.011)}
  let q=7+a*100|0;const fr=()=>{q=(q*16807)%2147483647;return q/2147483647};
  for(let i=0;i<650;i++){const y=y0+fr()*(y1-y0),zz=a+fr()*(b-a),tt=fr()*.95;const k=tt*((y-floorY)/sd[1]);dust.push(w+.1-sd[0]*k,y-sd[1]*k,zz-sd[2]*k,.5+fr()*1.6)}};
 /* ground floor windows */
 win('x',-D,1,6.2,8,1,2.6,0,true);win('x',D,-1,-6.5,-3.5,1,2.6,0,true);win('x',D,-1,3.5,6.5,1,2.6,0,true);win('z',W,-1,2,4.5,1,2.6,0,true);win('z',-W,1,0,3,1,2.6,0,true);
 win('x',-D,1,-5.5,-2.5,F+.9,F+2.5,F,true);win('x',D,-1,-7,7,F+.5,F+2.9,F,true);win('z',W,-1,3,5,F+.9,F+2.5,F,true);win('z',-W,1,-1,2,F+.9,F+2.5,F,true);
 beam(W,2,4.5,1,2.6,0);beam(W,3,5,F+.9,F+2.5,F);
 /* entrance: frame, open leaves, daylight beyond */
 A.box(-1.25,0,D-.22,-1.1,2.85,D+.22,M.dwood);A.box(1.1,0,D-.22,1.25,2.85,D+.22,M.dwood);A.box(-1.25,2.7,D-.22,1.25,2.85,D+.22,M.dwood);
 for(const s of[-1,1]){A.cb(s*1.14,1.1,D-.62,.06,2.2,1.0,0,.01,M.dwood);for(const y of[.6,1.65])A.cb(s*1.12,y,D-.62,.03,.7,.7,0,.008,M.wood);A.sph(s*1.14,1.05,D-.2,.032,.032,.032,M.brass,BR)}
 N.q([1.1,0,D+.6],[-1.1,0,D+.6],[-1.1,2.7,D+.6],[1.1,2.7,D+.6],[0,0,-1],[.82,.9,.96],M.paper,1.7);
 /* wainscot (dado) with raised panels */
 const dado=(axis,w,dir,from,to,yb)=>{const c=(from+to)/2,len=to-from;bx(A,axis,w,dir,c,yb+.52,.03,len,1.04,.06,.008,M.wood);bx(A,axis,w,dir,c,yb+1.08,.06,len,.07,.1,.012,M.wood);bx(A,axis,w,dir,c,yb+.09,.05,len,.18,.08,.01,M.wood);
  for(let u=from+.2;u<to-.5;u+=.8){const ww=Math.min(.6,to-.2-u);bx(A,axis,w,dir,u+ww/2,yb+.66,.065,ww,.04,.02,.004,M.wood);bx(A,axis,w,dir,u+ww/2,yb+.38,.065,ww,.04,.02,.004,M.wood);bx(A,axis,w,dir,u+.02,yb+.52,.065,.04,.3,.02,.004,M.wood);bx(A,axis,w,dir,u+ww-.02,yb+.52,.065,.04,.3,.02,.004,M.wood)}};
 for(const yb of[0,F]){dado('x',iw.n,1,-W+t/2,W-t/2,yb);dado('z',iw.e,-1,-D+t/2,D-t/2,yb);dado('z',iw.w,1,-D+t/2,D-t/2,yb);
  if(yb===0){dado('x',iw.s,-1,-W+t/2,-1.25,yb);dado('x',iw.s,-1,1.25,W-t/2,yb)}else dado('x',iw.s,-1,-W+t/2,W-t/2,yb)}
 /* crown mouldings */
 for(const yc of[F-.22,TOP]){const y=yc-.09;A.cb(0,y,iw.n+.08,2*W-.25,.18,.16,0,.04,M.wall,TRIM);A.cb(0,y,iw.s-.08,2*W-.25,.18,.16,0,.04,M.wall,TRIM);A.cb(iw.e-.08,y,0,.16,.18,2*D-.25,0,.04,M.wall,TRIM);A.cb(iw.w+.08,y,0,.16,.18,2*D-.25,0,.04,M.wall,TRIM)}
 /* chandeliers */
 const chand=(x,yc,z)=>{A.tube([x,yc,z],[x,yc-.55,z],.012,8,M.brass,BR);A.sph(x,yc-.61,z,.07,.09,.07,M.brass,BR);A.cyl(x,yc-.71,z,.05,.11,.1,16,M.brass,BR,0,true);A.cyl(x,yc-.02,z,.38,.28,.03,20,M.wall,TRIM,0,true);
  for(let k=0;k<6;k++){const a=k/6*6.2832,ex=x+Math.cos(a)*.34,ez=z+Math.sin(a)*.34;A.tube([x,yc-.65,z],[ex,yc-.67,ez],.012,6,M.brass,BR);A.cyl(ex,yc-.69,ez,.04,.035,.03,10,M.brass,BR,0,true);A.cyl(ex,yc-.66,ez,.014,.014,.09,8,M.paper,[1,.98,.94]);N.sph(ex,yc-.53,ez,.032,.05,.032,M.paper,[1,.86,.6],3.2)}
  lights.push({p:[x,yc-1.2,z],c:[.78,.53,.29]})};
 for(const [x,z] of[[-5,2],[0,2],[5,2],[-5,-2],[5,-2],[0,-1.5]])chand(x,F-.22,z);
 for(const [x,z] of[[-5,2],[0,2],[5,2],[-5,-2],[5,-2],[0,-2]])chand(x,TOP,z);
 /* ---------- stairs ---------- */
 for(let s=0;s<10;s++){const x0=-7+s*.55,y=(s+1)*.34;A.box(x0,0,-5.85,x0+.55,y-.04,-3.95,M.dwood);A.cb(x0+.3,y-.02,-4.9,.62,.05,1.96,0,.015,M.wood)}
 for(let s=0;s<=10;s++){const x=-7+s*.55,y=Math.min(F,s*.34)+.34;A.tube([x,y,-3.97],[x,y+.95,-3.97],.022,6,M.brass,BR)}
 A.tube([-7,1.3,-3.97],[-1.5,F+.95+.34,-3.97],.04,10,M.dwood);
 for(let x=-7;x<=-1.5;x+=.92)A.tube([x,F,-3.92],[x,F+1,-3.92],.022,6,M.brass,BR);A.tube([-7,F+1,-3.97],[-1.5,F+1,-3.97],.04,10,M.dwood);
 /* ---------- reusable furniture ---------- */
 const chester=(x,zc,ry,s)=>{const C=Math.cos(ry),Sn=Math.sin(ry);const L=(u,v,w)=>[x+u*C+w*Sn,v,zc-u*Sn+w*C];s=s||1;const y0=o.yy||0;
  A.sb(x,y0+.25*s,zc,.86*s,.3*s,.82*s,ry,.1,M.leather);const sc=L(0,.43*s,.06*s);A.sb(sc[0],y0+sc[1],sc[2],.62*s,.12*s,.66*s,ry,.1,M.leather);
  const b=L(0,.72*s,-.33*s);A.sb(b[0],y0+b[1],b[2],.86*s,.82*s,.18*s,ry,.11,M.leather);
  for(const sd2 of[-1,1]){const a=L(sd2*.36*s,.48*s,.0);A.sb(a[0],y0+a[1],a[2],.15*s,.36*s,.82*s,ry,.1,M.leather);const p1=L(sd2*.36*s,.67*s,-.38*s),p2=L(sd2*.36*s,.67*s,.41*s);A.tube([p1[0],y0+p1[1],p1[2]],[p2[0],y0+p2[1],p2[2]],.095*s,14,M.leather)}
  for(let i=0;i<4;i++)for(let j=0;j<3;j++){const p=L((-.27+i*.18)*s,(.55+j*.17)*s,-.235*s);A.sph(p[0],y0+p[1],p[2],.018,.018,.018,M.leather,[.5,.5,.5])}
  for(let i=0;i<10;i++){const p=L((-.4+i*.09)*s,.42*s,.415*s);A.sph(p[0],y0+p[1],p[2],.012,.012,.012,M.brass,BR)}
  for(const u of[-.34,.34])for(const w of[-.32,.32]){const p=L(u*s,0,w*s);A.cyl(p[0],y0,p[2],.03,.04,.1,10,M.dwood,[1,1,1],0,true)}};
 const chesterY=(x,zc,ry,y,s)=>{o.yy=y;chester(x,zc,ry,s);o.yy=0};
 const chair=(x,z,y,a,col)=>{col=col||[.2,.2,.22];const ry=-a;const C=Math.cos(ry),Sn=Math.sin(ry);const L=(u,v,w)=>[x+u*C+w*Sn,y+v,z-u*Sn+w*C];
  const s0=L(0,.48,0);A.sb(s0[0],s0[1],s0[2],.5,.09,.5,ry,.04,M.leather,col);const b0=L(0,.82,.24);A.sb(b0[0],b0[1],b0[2],.5,.6,.07,ry,.04,M.leather,col);
  A.cyl(x,y+.1,z,.035,.035,.38,8,M.iron,[.3,.3,.3],0,true);for(let k=0;k<5;k++){const a2=k/5*6.28;A.tube([x,y+.1,z],[x+Math.cos(a2)*.28,y+.04,z+Math.sin(a2)*.28],.018,6,M.iron,[.3,.3,.3])}};
 const diner=(x,z,y,a,col)=>{col=col||[.5,.18,.16];const ry=-a;const C=Math.cos(ry),Sn=Math.sin(ry);const L=(u,v,w)=>[x+u*C+w*Sn,y+v,z-u*Sn+w*C];
  const s0=L(0,.46,0);A.sb(s0[0],s0[1],s0[2],.5,.08,.5,ry,.03,M.leather,col);const b0=L(0,.86,.24);A.sb(b0[0],b0[1],b0[2],.46,.7,.06,ry,.03,M.wood,[.8,.6,.45]);
  for(const u of[-.21,.21])for(const w of[-.21,.21]){const p=L(u,0,w);A.cyl(p[0],y,p[2],.02,.028,.44,8,M.dwood,[1,1,1],0,true)}};
 const desk=(x,z,y,w,d)=>{A.cb(x,y+.75,z,w,.05,d,0,.02,M.dwood);A.cb(x,y+.705,z,w-.08,.05,d-.06,0,.01,M.wood);
  for(const s of[-1,1]){const px=x+s*(w/2-.36);A.cb(px,y+.36,z,.66,.68,d-.08,0,.02,M.dwood);for(let k=0;k<3;k++){const yy=y+.15+k*.2;A.cb(px,yy,z+d/2-.045,.56,.17,.02,0,.006,M.wood);A.tube([px-.08,yy,z+d/2-.02],[px+.08,yy,z+d/2-.02],.008,6,M.brass,BR)}}
  A.cb(x,y+.6,z-d/2+.03,w-1.4,.5,.03,0,.008,M.wood)};
 const monitor=(x,z,y,south,slot,uvr)=>{const zz=south?z+.04:z-.04;const S2=south?1:-1;A.cb(x,y+1.18,z,.72,.5,.08,0,.02,M.iron,[.12,.13,.12]);A.cyl(x,y+.78,z,.12,.05,.2,10,M.iron,[.12,.13,.12],0,true);
  const a=[x-.3,y+.95,z+S2*.05],b=[x+.3,y+.95,z+S2*.05],c=[x+.3,y+1.41,z+S2*.05],d=[x-.3,y+1.41,z+S2*.05];const uv=uvf(slot,...(uvr||[0,0,1,1]));
  if(south)N.q(a,b,c,d,[0,0,1],[1,1,1],SCR,.3,uv);else N.q(b,a,d,c,[0,0,-1],[1,1,1],SCR,.45,[uv[0],uv[1],uv[2],uv[3]].map((q,i)=>uv[[1,0,3,2][i]]))};
 const screen=(axis,w,dir,u0,u1,y0,y1,slot,uvr)=>{const c=(u0+u1)/2,len=u1-u0,h=y1-y0,e=.06;
  bx(A,axis,w,dir,c,y1+e/2,.045,len+2*e,e,.09,.012,M.dwood,[.4,.3,.22]);bx(A,axis,w,dir,c,y0-e/2,.045,len+2*e,e,.09,.012,M.dwood,[.4,.3,.22]);bx(A,axis,w,dir,u0-e/2,(y0+y1)/2,.045,e,h,.09,.012,M.dwood,[.4,.3,.22]);bx(A,axis,w,dir,u1+e/2,(y0+y1)/2,.045,e,h,.09,.012,M.dwood,[.4,.3,.22]);
  wq(axis,w,dir,u0,u1,y0,y1,SCR,uvf(slot,...(uvr||[0,0,1,1])),slot==='map'?.1:slot==='sign'?.2:.3,.04)};
 const flag=(x,zc,y,col)=>{A.cyl(x,y,zc,.17,.14,.06,16,M.brass,BR,0,true);A.tube([x,y+.05,zc],[x,y+2.45,zc],.016,8,M.brass,BR);A.sph(x,y+2.5,zc,.045,.07,.045,M.brass,BR);A.drape(x+.02,zc+.03,zc+.85,y+1.35,y+2.38,3,.04,M.fabric,col,1);A.drape(x,zc+.03,zc+.85,y+1.35,y+2.38,3,.04,M.fabric,col,-1)};
 const palm=(x,zc,y)=>{A.cyl(x,y,zc,.2,.25,.48,18,M.conc,[.62,.35,.22],0,true);A.cyl(x,y+.45,zc,.22,.22,.04,18,M.conc,[.55,.3,.2],0,true);A.tube([x,y+.45,zc],[x+.02,y+1.1,zc],.025,8,M.wood,[.6,.5,.4]);
  let s=Math.floor(x*13+zc*7+11)|0;if(s<=0)s=11;const rr=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<110;i++){const a=rr()*6.283,h=.65+rr()*.9,rad=(.12+rr()*.32)*(1-Math.abs(h-1.1)*.6);const g=.75+rr()*.5;A.sph(x+Math.cos(a)*rad,y+h,zc+Math.sin(a)*rad,.07,.025,.045,mt('plaster',3,.35),[.20*g,.40*g,.16*g],0,false,4,6)}};
 const sofa=(x,zc,y)=>{A.sb(x,y+.24,zc,.9,.3,2.1,0,.1,M.leather);A.sb(x-.33,y+.68,zc,.22,.6,2.1,0,.1,M.leather);for(const s of[-1,1]){A.sb(x,y+.5,zc+s*1.0,.9,.3,.2,0,.09,M.leather);A.tube([x-.42,y+.66,zc+s*1.0],[x+.45,y+.66,zc+s*1.0],.11,14,M.leather)}
  for(let k=0;k<3;k++)A.sb(x+.07,y+.43,zc-.62+k*.62,.66,.12,.6,0,.05,M.leather);for(let i=0;i<9;i++)for(let j=0;j<2;j++)A.sph(x-.215,y+.58+j*.18,zc-.9+i*.225,.016,.016,.016,M.leather,[.5,.5,.5])};
 const bookcase=(bx0,bx1,bz,y,hgt)=>{const sm=M.dwood;A.box(bx0,y,bz,bx1,y+hgt,bz+.02,sm,[.7,.7,.7]);A.cb((bx0+bx1)/2,y+hgt,bz+.22,bx1-bx0+.12,.1,.46,0,.02,sm);A.cb((bx0+bx1)/2,y+.06,bz+.22,bx1-bx0+.06,.12,.44,0,.01,sm);
  const ns=Math.round(bx1-bx0);const secW=(bx1-bx0)/ns;for(let i=0;i<=ns;i++)A.cb(bx0+i*secW,y+hgt/2,bz+.21,.05,hgt-.08,.42,0,.01,sm);
  let q=7+Math.floor(bx0*10);const r=()=>{q=(q*16807)%2147483647;return q/2147483647};const cols=[[.42,.10,.08],[.12,.18,.32],[.13,.27,.15],[.45,.33,.12],[.25,.12,.22],[.3,.2,.12],[.55,.5,.4],[.1,.1,.12]];
  for(let yy=y+.12;yy<y+hgt-.05;yy+=.5){A.cb((bx0+bx1)/2,yy,bz+.22,bx1-bx0,.03,.42,0,.008,sm);if(yy>y+hgt-.6)break;
   for(let sec=0;sec<ns;sec++){let x=bx0+sec*secW+.04;const xe=x+secW-.08;while(x<xe-.03){const w=.025+r()*.035,h=.22+r()*.14,d=.17+r()*.07;if(x+w>xe)break;const c=cols[(r()*cols.length)|0].map(v=>v*(.8+r()*.4));
     if(r()<.06&&x+w+.12<xe){A.rbox(x+.1,yy+.015+h/2*.75,bz+.04+d/2,w,h,d,0,M.book,c);x+=.16;continue}
     A.cb(x+w/2,yy+.015+h/2,bz+.04+d/2,w,h,d,0,.004,M.book,c);if(r()<.5)A.box(x+.003,yy+.015+h*.82,bz+.04+d,x+w-.003,yy+.015+h*.84,bz+.04+d+.002,M.brass,BR);x+=w+.002}}}};
 /* ---------- common ground floor ---------- */
 A.box(-1,.0,1.7,1,.012,5.9,M.rug,[mc[0]*1.4,mc[1]*1.4,mc[2]*1.4]);A.q([-1,.013,5.9],[1,.013,5.9],[1,.013,1.7],[-1,.013,1.7],[0,1,0],mc.map(v=>Math.min(1.2,v*1.8)),M.rug,0,[[0,0],[1,0],[1,1],[0,1]]);
 A.cb(0,.52,1.05,4.4,1.04,.8,0,.03,M.dwood);A.cb(0,1.07,1.05,4.6,.07,.9,0,.02,M.wood,[.8,.7,.62]);for(let k=0;k<4;k++)A.cb(-1.6+k*1.07,.52,1.45,.9,.8,.02,0,.01,M.wood);
 A.cyl(.8,1.08,1.0,.07,.07,.02,12,M.brass,BR,0,true);A.tube([.8,1.1,1.0],[.8,1.4,1.0],.012,8,M.brass,BR);N.tube([.65,1.42,1.0],[.95,1.42,1.0],.05,14,mt('marble',3,.95),[.16,.52,.24],.22);
 A.cb(-.6,1.09,.95,.35,.03,.25,.2,.008,M.paper,[.98,.95,.86]);
 diner(0,.15,0,Math.PI);palm(-2.2,5.3,0);palm(2.2,5.3,0);
 screen('x',iw.n,1,.8,5.6,2.42,3.12,'sign');
 /* ---------- ministry-specific ---------- */
 if(m==='def'){
  A.box(-5.1,0,1.6,-3.9,.3,2.8,M.iron,[.3,.3,.32]);A.cyl(-4.5,.3,2.2,.34,.34,2.2,20,M.iron,[.9,.9,.88],0,true);A.cyl(-4.5,2.5,2.2,.34,.0,.9,20,M.iron,[.62,.12,.1],0,true);A.cyl(-4.5,1.5,2.2,.36,.36,.25,20,M.iron,acc,0,true);
  for(let k=0;k<4;k++){const a=k*Math.PI/2;A.rbox(-4.5+Math.cos(a)*.5,.7,2.2+Math.sin(a)*.5,.5,.8,.04,-a,M.iron,[.7,.7,.68])}
  for(const [dx,dz] of[[.5,0],[-.5,0],[0,.5],[0,-.5]])A.cb(-4.5+dx*1.05,.62,2.2+dz*1.05,.1,.6,.1,0,.02,M.iron,acc);
  for(let k=0;k<3;k++)A.tube([-4.2+k*.0,.35,1.9],[-4.2,.35,1.9],.01,4,M.iron);
  /* war table with kingdom map */
  A.cb(4.6,.78,1.8,3.1,.07,2.1,0,.025,M.dwood);for(const sx of[-1,1])for(const sz of[-1,1])A.cb(4.6+sx*1.4,.38,1.8+sz*.9,.14,.76,.14,0,.02,M.dwood);
  N.q([3.15,.82,2.75],[6.05,.82,2.75],[6.05,.82,.85],[3.15,.82,.85],[0,1,0],[1,1,1],SCR,.1,uvf('map',.05,.05,.95,.95).map((q,i,a)=>a[[0,1,2,3][i]]));
  for(let k=0;k<5;k++)A.cyl(3.6+k*.45,.83,1.2+((k*37)%9)*.12,.03,.03,.1,10,M.brass,k%2?[.8,.2,.2]:[.2,.3,.8],0,true);
  /* console desk + wall screens */
  A.cb(8.05,.4,-2.5,1.1,.8,3.6,0,.03,M.iron,[.2,.22,.2]);A.cb(8.05,.82,-2.5,1.2,.06,3.7,0,.02,M.iron,[.12,.13,.12]);N.q([7.55,.855,-.8],[7.55,.855,-4.2],[8.45,.855,-4.2],[8.45,.855,-.8],[0,1,0],[1,1,1],SCR,.25,uvf('status',.05,.05,.95,.95));
  screen('z',iw.e,-1,-4.1,-2.5,1.25,2.55,'status');screen('z',iw.e,-1,-2.3,-.8,1.25,2.55,'map',[.05,.05,.95,.95]);diner(6.95,-2.5,0,Math.PI/2,[.2,.2,.22]);
  for(let k=0;k<3;k++)A.cb(7.4,.9,-.9-k*1.2,.18,.06,.14,0,.01,M.iron,[.1,.1,.1])}
 if(m==='intel'){
  screen('x',iw.n,1,1,4.4,.95,2.25,'map',[.05,.05,.95,.95]);screen('x',iw.n,1,4.6,8.4,.95,2.25,'status');
  for(const [x,z] of[[3,-2.6],[6.2,-2.6],[3,.9],[6.2,.9]]){desk(x,z,0,2.2,.8);monitor(x-.5,z-.1,0,true,'status');monitor(x+.5,z-.1,0,true,'map');chair(x,z+.75,0,0,[.2,.18,.16])}
  for(let i=0;i<4;i++){const z=1.2+i*.95;A.cb(8.3,1.05,z+.4,.8,2.1,.8,0,.03,M.iron,[.16,.18,.2]);for(let y=.3;y<2;y+=.25)N.box(7.9,y,z+.12,7.905,y+.035,z+.7,M.paper,[.3,1,.45],2.2)}}
 if(m==='foreign'){
  A.cyl(3.8,0,.6,.35,.5,.72,14,M.dwood,[1,1,1],0,true);A.cyl(3.8,.72,.6,1.55,1.55,.07,32,M.wood,[1,1,1],0,true);A.cyl(3.8,.79,.6,1.5,1.5,.008,32,mt('leather',2,.3),[.18,.30,.22],0,true);
  for(let i=0;i<6;i++){const a=i/6*6.2832;diner(3.8+Math.sin(a)*2.05,.6-Math.cos(a)*2.05,0,a+Math.PI)}
  for(let i=0;i<6;i++){const a=i/6*6.2832+.5;A.cb(3.8+Math.sin(a)*1.1,.82,.6-Math.cos(a)*1.1,.28,.03,.2,-a,.008,M.paper,[.98,.95,.86])}
  screen('x',iw.n,1,1.2,5.6,.95,2.25,'map',[.05,.05,.95,.95]);screen('z',iw.e,-1,-2,1,1.2,2.6,'status');
  (o.flags||[]).forEach((c,qi)=>flag(8.3,2.2+qi*.85,0,c));
  A.cyl(-4.5,0,2.2,.25,.15,.9,12,M.dwood,[1,1,1],0,true);A.sph(-4.5,1.45,2.2,.55,.55,.55,mt('map',1.1,.4),[1.05,1,.9]);for(let i=0;i<24;i++){const a0=i/24*6.2832,a1=(i+1)/24*6.2832;A.tube([-4.5+Math.cos(a0)*.6,1.45+Math.sin(a0)*.6,2.2],[-4.5+Math.cos(a1)*.6,1.45+Math.sin(a1)*.6,2.2],.012,6,M.brass,BR)}}
 if(m==='hq'){
  /* situation table with the strategic map + wall displays */
  A.cb(4.6,.78,1.8,3.1,.07,2.1,0,.025,M.dwood);for(const sx of[-1,1])for(const sz of[-1,1])A.cb(4.6+sx*1.4,.38,1.8+sz*.9,.14,.76,.14,0,.02,M.dwood);
  N.q([3.15,.82,2.75],[6.05,.82,2.75],[6.05,.82,.85],[3.15,.82,.85],[0,1,0],[1,1,1],SCR,.1,uvf('map',.05,.05,.95,.95));
  for(let k=0;k<6;k++)A.cyl(3.5+k*.45,.83,1.1+((k*37)%9)*.14,.03,.03,.1,10,M.brass,k%2?[.8,.2,.2]:[.2,.3,.8],0,true);
  screen('z',iw.e,-1,-4.1,-2.5,1.25,2.55,'status');screen('z',iw.e,-1,-2.3,-.8,1.25,2.55,'map',[.05,.05,.95,.95]);
  /* cabinet table */
  A.cb(-4.6,.76,1.6,1.3,.07,3.4,0,.03,M.dwood);A.cb(-4.6,.8,1.6,1.1,.008,3.2,0,.004,mt('leather',2,.3),[.2,.32,.24]);for(const sz of[-1,1])A.cb(-4.6,.37,1.6+sz*1.3,.5,.74,.3,0,.03,M.dwood);
  for(const z of[.5,1.6,2.7]){diner(-5.65,z,0,Math.PI/2,[.3,.14,.1]);diner(-3.55,z,0,-Math.PI/2,[.3,.14,.1]);for(const sx of[-1,1])A.cb(-4.6+sx*.33,.82,z,.2,.012,.28,sx*.12,.004,M.paper,[.98,.95,.86])}
  A.cyl(-4.6,.8,1.6,.09,.07,.16,14,M.brass,BR,0,true);
  /* treasury desk */
  desk(4.2,-2.8,0,2.2,.8);monitor(4.2,-2.9,0,true,'status');chair(4.2,-2.05,0,0,[.2,.18,.16]);
  for(let k=0;k<5;k++)A.cb(3.5,.8+k*.035,-2.7,.22,.03,.3,.1*k,.004,M.book,[.3+.08*k,.16,.1]);
  /* secure communications console */
  A.cb(.2,.58,-5.45,1.0,1.15,.5,0,.03,M.iron,[.2,.22,.2]);A.cb(.2,1.2,-5.4,.9,.1,.4,0,.02,M.iron,[.1,.1,.1]);A.cb(-.05,1.3,-5.4,.24,.07,.18,0,.02,M.iron,[.08,.08,.08]);A.cb(-.05,1.37,-5.4,.26,.04,.07,0,.02,M.iron,[.08,.08,.08]);
  for(let k=0;k<4;k++)N.box(.25+k*.1,1.26,-5.3,.31+k*.1,1.29,-5.24,M.paper,k%2?[1,.3,.2]:[.3,1,.45],2.2);
  (o.flags||[]).forEach((c,qi)=>flag(8.3,2.2+qi*.85,0,c))}
 /* ---------- upper floor: minister's office ---------- */
 const y=F;
 A.box(2,y,-4.6,6.4,y+.012,-.4,M.rug,[.5,.4,.3]);A.q([2,y+.013,-.4],[6.4,y+.013,-.4],[6.4,y+.013,-4.6],[2,y+.013,-4.6],[0,1,0],[1,1,1],M.rug,0,[[0,0],[1,0],[1,1],[0,1]]);
 {const dx=4,dz=-2.5;desk(dx,dz,y,2.3,1.0);const top=y+.78;
  A.box(dx-.85,top-.002,dz-.4,dx+.85,top+.002,dz+.36,M.leather,[.35,.55,.36]);
  /* status board (teleprinter display) */
  A.cb(dx,top+.17,dz-.28,.62,.3,.1,0,.03,M.iron,[.1,.12,.1]);N.q([dx+.26,top+.05,dz-.335],[dx-.26,top+.05,dz-.335],[dx-.26,top+.28,dz-.335],[dx+.26,top+.28,dz-.335],[0,0,-1],[1,1,1],SCR,.3,uvf('status',0,0,1,1));
  {const lx=dx+.8,lz=dz-.3;A.cyl(lx,top,lz,.08,.07,.02,16,M.brass,BR,0,true);A.tube([lx,top+.02,lz],[lx,top+.32,lz],.012,8,M.brass,BR);A.tube([lx-.15,top+.32,lz],[lx+.15,top+.32,lz],.01,8,M.brass,BR);A.cb(lx,top+.39,lz,.38,.03,.14,0,.01,mt('marble',3,.95),[.15,.42,.2]);N.tube([lx-.17,top+.34,lz],[lx+.17,top+.34,lz],.055,16,mt('marble',3,.95),[.16,.52,.24],.22)}
  {const tx=dx-.62,tz=dz+.1;A.cb(tx,top+.03,tz,.24,.06,.18,.15,.02,M.iron,[.1,.1,.1]);A.cyl(tx+.02,top+.06,tz+.02,.065,.065,.012,18,M.iron,[.9,.88,.8],0,true);A.cb(tx,top+.13,tz-.02,.24,.04,.06,.15,.02,M.iron,[.1,.1,.1]);A.tube([tx+.12,top+.03,tz],[tx+.35,top,tz+.12],.006,6,M.iron,[.1,.1,.1])}
  for(let k=0;k<6;k++)A.rbox(dx+.5+k*.006,top+.002+k*.003,dz+.25-k*.004,.21,.0025,.297,.25-k*.12,M.paper,[.98,.95,.86]);
  A.cyl(dx-.95,top,dz+.1,.05,.04,.06,14,mt('marble',3,.95),[.1,.12,.1],0,true);A.cyl(dx+.98,top,dz+.3,.08,.07,.025,16,mt('marble',3,.95),[.55,.5,.42],0,true);
  chesterY(dx,-3.45,0,y);chesterY(3.4,-1.35,Math.PI,y,.94);chesterY(4.6,-1.35,Math.PI,y,.94)}

 bookcase(1,8,-D+t/2,y,2.4);flag(6.6,-4.5,y,acc);flag(7.3,-4.5,y,mc);
 sofa(-8.2,1.5,y);A.cb(-6.45,y+.42,1.5,1.2,.04,1.4,0,.015,M.dwood);for(const s of[-1,1])for(const q of[-1,1])A.cyl(-6.45+s*.5,y,1.5+q*.6,.025,.03,.4,10,M.dwood,[1,1,1],0,true);A.cb(-6.45,y+.12,1.5,1.1,.02,1.3,0,.01,M.dwood);
 palm(-8.3,5.2,y);palm(8.3,5.2,y);palm(8.3,-.5,y);
 screen('z',iw.e,-1,-1.7,1.7,y+.55,y+2.9,'map',[.08,.04,.92,.96]);
 /* hotspot markers */
 (o.hs||[]).forEach(h=>{const [x,yy,z]=h.mk;N.cb(x,yy,z,.2,.2,.2,Math.PI/4,.03,M.paper,[1,.8,.2],2.6);N.cyl(x,yy-.24,z,0,.08,.17,4,M.paper,[1,.8,.2],2.2,false)});
 const spotP=[4,y+2.85,-2.5];
 const scene={rmin:[-W,0,-D],rmax:[W,TOP,D],L:Object.assign({},T.L,{spP:spotP}),lights,rayArr:new Float32Array(rayArr),dustArr:new Float32Array(dust),rayCol:[1.0,.82,.55],dustCol:[1,.86,.6],dustSize:.02,cacheSh:true};
 return{A,N,scene}};
