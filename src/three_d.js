/* ================= 3D view (own WebGL renderer, no libraries) ================= */
let V3=false;
const V={ok:false,reg:[],cam:{th:0,ph:.9,dist:1060,tx:0,tz:20},anim:null,ptrs:new Map(),lastKey:'',keys:[],kmode:false,me:0,sel:-1,kb:null,t0:performance.now()};
const hexc=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255]};
const HT={m:9,p:6,d:5,f:5.5,n:4.6};
const CX=400,CZ=397;
const mul=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o};
const persp=(fov,a,n,f)=>{const t=1/Math.tan(fov/2);return new Float32Array([t/a,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0])};
const nrm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]};
const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const lookAt=(e,t,u)=>{const z=nrm([e[0]-t[0],e[1]-t[1],e[2]-t[2]]),x=nrm(crs(u,z)),y=crs(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1])};
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

class B{
 constructor(){this.d=[]}
 v(p,n,c){this.d.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2])}
 tri(a,b,c,n,col){this.v(a,n,col);this.v(b,n,col);this.v(c,n,col)}
 quad(a,b,c,d,n,col){this.tri(a,b,c,n,col);this.tri(a,c,d,n,col)}
 obox(cx,cy,cz,ex,ey,ez,sx,sy,sz,col){
  const ax=[ex,ey,ez],h=[sx/2,sy/2,sz/2];
  for(let a=0;a<3;a++)for(const s of[-1,1]){
   const u=ax[(a+1)%3],w=ax[(a+2)%3],hu=h[(a+1)%3],hw=h[(a+2)%3];
   const n=[ax[a][0]*s,ax[a][1]*s,ax[a][2]*s];
   const c0=[cx+n[0]*h[a],cy+n[1]*h[a],cz+n[2]*h[a]];
   const P=(su,sw)=>[c0[0]+u[0]*hu*su+w[0]*hw*sw,c0[1]+u[1]*hu*su+w[1]*hw*sw,c0[2]+u[2]*hu*su+w[2]*hw*sw];
   this.quad(P(-1,-1),P(1,-1),P(1,1),P(-1,1),n,col)}}
 box(cx,by,cz,sx,sy,sz,rot,col){const c=Math.cos(rot),s=Math.sin(rot);this.obox(cx,by+sy/2,cz,[c,0,-s],[0,1,0],[s,0,c],sx,sy,sz,col)}
 cyl(cx,by,cz,r0,r1,h,seg,col,cap){
  for(let i=0;i<seg;i++){
   const a0=i/seg*6.2832,a1=(i+1)/seg*6.2832,am=(a0+a1)/2;
   const p=(a,r,y)=>[cx+Math.cos(a)*r,by+y,cz+Math.sin(a)*r];
   const sl=(r0-r1)/h;const n=nrm([Math.cos(am),sl,Math.sin(am)]);
   this.quad(p(a0,r0,0),p(a1,r0,0),p(a1,r1,h),p(a0,r1,h),n,col);
   if(cap&&r1>0)this.tri([cx,by+h,cz],p(a0,r1,h),p(a1,r1,h),[0,1,0],col)}}
 dome(cx,by,cz,r,ry,seg,col){
  const rings=4;
  for(let j=0;j<rings;j++){
   const t0=j/rings*1.5708,t1=(j+1)/rings*1.5708;
   for(let i=0;i<seg;i++){
    const a0=i/seg*6.2832,a1=(i+1)/seg*6.2832;
    const p=(a,t)=>[cx+Math.cos(a)*Math.cos(t)*r,by+Math.sin(t)*ry,cz+Math.sin(a)*Math.cos(t)*r];
    const am=(a0+a1)/2,tm=(t0+t1)/2;
    this.quad(p(a0,t0),p(a1,t0),p(a1,t1),p(a0,t1),nrm([Math.cos(am)*Math.cos(tm),Math.sin(tm)*r/ry,Math.sin(am)*Math.cos(tm)]),col)}}}
 gable(cx,by,cz,w,l,h,rot,col){
  const c=Math.cos(rot),s=Math.sin(rot);
  const P=(x,y,z)=>[cx+x*c+z*s,by+y,cz-x*s+z*c];
  const hl=l/2,hw=w/2;
  const nA=nrm([0,hw,-h]),nB=nrm([0,hw,h]);
  const rot3=n=>[n[0]*c+n[2]*s,n[1],-n[0]*s+n[2]*c];
  this.quad(P(-hl,0,-hw),P(hl,0,-hw),P(hl,h,0),P(-hl,h,0),rot3(nA),col);
  this.quad(P(-hl,0,hw),P(hl,0,hw),P(hl,h,0),P(-hl,h,0),rot3(nB),col);
  this.tri(P(-hl,0,-hw),P(-hl,0,hw),P(-hl,h,0),rot3([-1,0,0]),col);
  this.tri(P(hl,0,-hw),P(hl,0,hw),P(hl,h,0),rot3([1,0,0]),col)}
 flat(x1,z1,x2,z2,y,w,col){
  const dx=x2-x1,dz=z2-z1,l=Math.hypot(dx,dz)||1,px=-dz/l*w/2,pz=dx/l*w/2;
  this.quad([x1+px,y,z1+pz],[x2+px,y,z2+pz],[x2-px,y,z2-pz],[x1-px,y,z1-pz],[0,1,0],col)}
}
function parseRings(d){const out=[];for(const seg of d.split('Z')){const m=seg.match(/-?\d+\.?\d*,-?\d+\.?\d*/g);if(!m||m.length<4)continue;out.push(m.map(s=>{const[a,b]=s.split(',');return[+a-CX,+b-CZ]}))}return out}
const area=r=>{let s=0;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];s+=a[0]*b[1]-b[0]*a[1]}return s/2};
function prep(r,max){if(r.length>max){const st=Math.ceil(r.length/max);r=r.filter((_,i)=>i%st===0)}if(area(r)<0)r=r.slice().reverse();return r}
function earclip(P){
 const n=P.length,idx=[...Array(n).keys()],out=[];
 const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const inT=(p,a,b,c)=>{const d1=cr(p,a,b),d2=cr(p,b,c),d3=cr(p,c,a);return!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))};
 let i=0,fail=0;
 while(idx.length>3){
  const m=idx.length;i%=m;
  const ia=idx[(i+m-1)%m],ib=idx[i],ic=idx[(i+1)%m];
  const a=P[ia],b=P[ib],c=P[ic];let ok=cr(a,b,c)>1e-9;
  if(ok)for(let j=0;j<m;j++){const q=idx[j];if(q===ia||q===ib||q===ic)continue;if(inT(P[q],a,b,c)){ok=false;break}}
  if(ok){out.push(ia,ib,ic);idx.splice(i,1);fail=0}
  else{i++;fail++;if(fail>m){out.push(idx[m-1],idx[0],idx[1]);idx.splice(0,1);fail=0}}}
 if(idx.length===3)out.push(idx[0],idx[1],idx[2]);
 return out}
function extrude(ring,H,top,side){
 const b=new B(),T=earclip(ring);
 for(let t=0;t<T.length;t+=3)b.tri([ring[T[t]][0],H,ring[T[t]][1]],[ring[T[t+1]][0],H,ring[T[t+1]][1]],[ring[T[t+2]][0],H,ring[T[t+2]][1]],[0,1,0],top);
 for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length];const dx=c[0]-a[0],dz=c[1]-a[1],l=Math.hypot(dx,dz)||1;
  b.quad([a[0],0,a[1]],[c[0],0,c[1]],[c[0],H,c[1]],[a[0],H,a[1]],[dz/l,0,-dx/l],side)}
 return b}
function inPoly(x,z,r){let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function edgeDist(x,z,r){let m=1e9;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];const dx=b[0]-a[0],dz=b[1]-a[1];const l2=dx*dx+dz*dz||1;let t=((x-a[0])*dx+(z-a[1])*dz)/l2;t=Math.max(0,Math.min(1,t));m=Math.min(m,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz))}return m}

/* ---- props ---- */
const C={stone:[.80,.77,.70],wood:[.62,.48,.33],sand:[.89,.78,.58],adobe:[.88,.74,.55],red:[.62,.24,.18],green:[.36,.55,.33],dgreen:[.26,.44,.28],trunk:[.40,.30,.20],gray:[.62,.60,.64],snow:[.96,.96,.98],gold:[.94,.76,.20],dark:[.22,.16,.12],skin:[.88,.72,.56],steel:[.72,.74,.78],tan:[.82,.72,.52],field:[.62,.70,.30],reed:[.46,.56,.36],hill:[.72,.66,.46],dune:[.80,.66,.40]};
const lighten=(c,t)=>c.map(v=>v+(1-v)*t);
function tree(b,x,z,s=1){b.cyl(x,0,z,.9*s,.7*s,3*s,5,C.trunk);b.cyl(x,2.5*s,z,4.2*s,0,9*s,7,C.dgreen,true)}
function palm(b,x,z){b.cyl(x,0,z,.8,.5,9,5,C.trunk);b.cyl(x,8,z,5.5,0,2.6,6,C.green,true)}
function peak(b,x,z,s=1){b.cyl(x,0,z,6.5*s,0,11*s,6,C.gray,true);b.cyl(x,7.5*s,z,2.6*s,0,3.8*s,6,C.snow,true)}
function duneG(b,x,z){b.dome(x,0,z,9,3.2,8,C.dune)}
function field(b,x,z,rot){for(let i=-1;i<=1;i++)b.box(x+i*3*Math.cos(rot+1.5708)*-1,0,z+i*3*Math.sin(rot+1.5708)*-1,2.4,.9,8,rot,i%2?C.field:lighten(C.field,.15))}
function hillG(b,x,z){b.dome(x,0,z,9,4.2,8,C.hill)}
function reeds(b,x,z){for(let i=0;i<5;i++)b.cyl(x+(i-2)*1.6,0,z+((i*7)%3-1)*1.4,.35,.1,4+i%2*1.5,4,C.reed)}
function house(b,x,z,rot,roof,wall){b.box(x,0,z,9,5.5,7.5,rot,wall);b.gable(x,5.5,z,8.6,10,3.8,rot,roof)}
function towerB(b,x,z,roof){b.cyl(x,0,z,4,3.6,12,8,C.stone);b.cyl(x,12,z,5,0,6,8,roof,true)}
function domeH(b,x,z,roof){b.box(x,0,z,8,5,8,0,C.adobe);b.dome(x,5,z,4.8,3.8,8,lighten(roof,.35))}
function barn(b,x,z,rot,roof){b.box(x,0,z,11,6.5,8,rot,C.red);b.gable(x,6.5,z,9,12.5,4.6,rot,roof);b.cyl(x+9*Math.cos(rot+1.2),0,z+9*Math.sin(rot+1.2),2.6,2.3,3.4,7,C.tan,true)}
function harbor(b,x,z,rot,roof){house(b,x,z,rot,roof,C.stone);b.cyl(x+6.5,0,z+5,.35,.3,12,4,C.trunk);b.box(x+6.5+2.2,8.5,z+5,4,2.6,.3,0,roof)}
function castle(b,x,z,roof,flag){
 b.box(x,0,z,19,14,19,0,C.stone);b.box(x,14,z,21,1.4,21,0,lighten(C.stone,.1));
 for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const tx=x+sx*12,tz=z+sz*12;b.cyl(tx,0,tz,4.2,3.8,19,8,lighten(C.stone,.05));b.cyl(tx,19,tz,5.4,0,7.5,8,roof,true)}
 b.box(x,0,z+9.7,6,8,.8,0,C.dark);
 b.cyl(x,15.4,z,.4,.4,13,4,C.trunk);b.box(x+3.4,24.6,z,7,4,.4,0,flag)}
function tent(b,x,z,flag){b.cyl(x,0,z,6.4,.4,8.4,6,C.tan,true);b.cyl(x,8.4,z,.3,.3,5,4,C.trunk);b.box(x+2,11.6,z,4,2.4,.3,0,flag)}
function goldPile(b,x,z){const g=C.gold;b.box(x,0,z,9,2,6,0,g);b.box(x,2,z,6.4,2,4.4,0,lighten(g,.12));b.box(x,4,z,3.6,2,2.6,0,lighten(g,.24));b.cyl(x+8,0,z+1,2.6,2.6,.9,8,lighten(g,.1),true);b.cyl(x+8,.9,z+1,2.6,2.6,.9,8,g,true)}
function ministerTower(b,x,z,lvl,onKeep){
 if(onKeep){const col=lvl>=3?[.45,.86,.96]:lvl===2?[.80,.82,.88]:[.80,.50,.22];const y=15.4;if(lvl>=3){b.cyl(x,y,z,0,2.6,2.4,6,col,true);b.cyl(x,y+2.4,z,2.6,0,3.4,6,col,true)}else b.cyl(x,y,z,2.2+lvl*.4,0,3.4+lvl,6,col,true);return}
 const col=lvl>=3?[.45,.86,.96]:lvl===2?[.80,.82,.88]:[.80,.50,.22];
 b.cyl(x,0,z,4.4,3.6,11+lvl*2,8,C.stone);b.cyl(x,11+lvl*2,z,5.2,5.2,1.2,8,lighten(C.stone,.1),true);
 const t=12.2+lvl*2;
 if(lvl>=3){b.cyl(x,t,z,0,3.6,3.4,6,col,true);b.cyl(x,t+3.4,z,3.6,0,4.6,6,col,true)}
 else if(lvl===2){b.cyl(x,t,z,3.2,0,6,6,col,true)}
 else{b.cyl(x,t,z,2.6,0,4.5,6,col,true)}
 for(let i=0;i<lvl;i++)b.box(x+5.4,6+i*3,z,.8,2,3.2,0,col)}
function soldier(b,x,z,col){
 const l=lighten(col,.12);
 b.box(x-1.1,0,z,1.5,3.2,2.2,0,C.dark);b.box(x+1.1,0,z,1.5,3.2,2.2,0,C.dark);
 b.cyl(x,3,z,2.8,2.4,6,7,l,true);b.cyl(x,8.6,z,2,1.7,3.4,7,C.skin,true);b.cyl(x,11.6,z,2.5,1.4,1.8,7,C.steel,true);
 b.cyl(x+3.6,0,z,.35,.35,15,4,C.trunk);b.cyl(x+3.6,15,z,.9,0,2.4,4,C.steel,true)}

/* ---- gl ---- */
const VS='attribute vec3 aP,aN,aC;uniform mat4 uVP;varying vec3 vN,vC,vW;void main(){vN=aN;vC=aC;vW=aP;gl_Position=uVP*vec4(aP,1.);}';
const FS='precision mediump float;varying vec3 vN,vC,vW;uniform vec3 uTint,uEm,uCam,uFog,uSun,uAmb;uniform float uFogOn;void main(){vec3 n=normalize(vN);vec3 L=normalize(vec3(.45,.8,.4));float d=max(dot(n,L),0.);float h=.5+.5*n.y;float bk=max(dot(n,normalize(vec3(-.5,.3,-.6))),0.);vec3 c=vC*uTint*(uAmb*(.62+.38*h)+uSun*d+uAmb*.12*bk)+uEm;float f=uFogOn*clamp((distance(vW,uCam)-1500.)/2400.,0.,1.);gl_FragColor=vec4(mix(c,uFog,f),1.);}';
function mkBuf(gl,b){const arr=new Float32Array(b.d);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);return{buf,n:arr.length/9}}
function freeBuf(gl,o){if(o&&o.buf)gl.deleteBuffer(o.buf)}

function init3D(){
 const cv=$('gl');const gl=cv.getContext('webgl',{antialias:true,alpha:false});
 if(!gl)throw new Error('no webgl');
 V.gl=gl;V.cv=cv;
 const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x};
 const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
 if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error('link');
 gl.useProgram(pr);V.pr=pr;
 V.loc={aP:gl.getAttribLocation(pr,'aP'),aN:gl.getAttribLocation(pr,'aN'),aC:gl.getAttribLocation(pr,'aC')};
 V.u={};['uVP','uTint','uEm','uCam','uFog','uSun','uAmb','uFogOn'].forEach(n=>V.u[n]=gl.getUniformLocation(pr,n));
 gl.enable(gl.DEPTH_TEST);
 V.fog=[.80,.89,.93];
 /* static world */
 const sea=new B();sea.quad([-9000,1.3,-9000],[9000,1.3,-9000],[9000,1.3,9000],[-9000,1.3,9000],[0,1,0],[.46,.68,.78]);
 V.sea=mkBuf(gl,sea);
 const coast=parseRings(D.coast).filter(r=>Math.abs(area(r))>500).map(r=>prep(r,300));
 const slab=new B(),shal=new B();
 coast.forEach(r=>{const e=extrude(r,3,[.92,.87,.74],[.74,.68,.55]);slab.d.push(...e.d);
  let cx=0,cz=0;r.forEach(p=>{cx+=p[0];cz+=p[1]});cx/=r.length;cz/=r.length;
  const big=r.map(p=>[cx+(p[0]-cx)*1.06+0,cz+(p[1]-cz)*1.06]);const T=earclip(big);
  for(let t=0;t<T.length;t+=3)shal.tri([big[T[t]][0],1.45,big[T[t]][1]],[big[T[t+1]][0],1.45,big[T[t+1]][1]],[big[T[t+2]][0],1.45,big[T[t+2]][1]],[0,1,0],[.62,.82,.86])});
 V.shal=mkBuf(gl,shal);V.slab=mkBuf(gl,slab);
 const dec=new B(),lines=new B();
 R.forEach((r,i)=>{
  const rings=parseRings(r.path).sort((a,b)=>Math.abs(area(b))-Math.abs(area(a)));
  const ring=prep(rings[0],260);
  const H=HT[r.name==='منجم الذهب'?'n':(r.k==='n'?'n':r.k)]+(i%5)*.12;
  const e=extrude(ring,H,[1,1,1],[.82,.78,.72]);
  const rg={ring,H,mesh:mkBuf(gl,e),px:r.lx-CX,pz:r.ly-CZ,slots:[],props:null,key:'',tint:[.93,.89,.78]};
  V.reg.push(rg);
  for(let k=0;k<ring.length;k++){const a=ring[k],c=ring[(k+1)%ring.length];lines.flat(a[0],a[1],c[0],c[1],H+.18,1.5,[.36,.28,.20])}
 });
 /* decor from glyph positions */
 const rr=rng(5);
 const NEU={'التلال':'hill','المستنقع':'reed','جزيرة الكنز':'palm','منجم الذهب':null};
 const dk=(k,n)=>k==='m'?'peak':k==='p'?'tree':k==='d'?(n==='الواحة'||n==='النخيل'?'palm':'dune'):k==='f'?'field':(n in NEU?NEU[n]:'tree');
 D.gl.forEach(([k,n,x,y])=>{const i=R.findIndex(r=>r.name===n),rg=V.reg[i];const wx=x-CX,wz=y-CZ;
  if(!inPoly(wx,wz,rg.ring)||edgeDist(wx,wz,rg.ring)<7)return;
  if(Math.hypot(wx-rg.px,wz-rg.pz)<40)return;
  const t=dk(k,n);if(!t)return;const y0=rg.H;
  const sub=new B();({peak:()=>peak(sub,0,0,.8+rr()*.5),tree:()=>tree(sub,0,0,.8+rr()*.5),palm:()=>palm(sub,0,0),dune:()=>duneG(sub,0,0),field:()=>field(sub,0,0,rr()*3),hill:()=>hillG(sub,0,0),reed:()=>reeds(sub,0,0)})[t]();
  for(let q=0;q<sub.d.length;q+=9)dec.d.push(sub.d[q]+wx,sub.d[q+1]+y0,sub.d[q+2]+wz,...sub.d.slice(q+3,q+9))});
 V.dec=mkBuf(gl,dec);V.lines=mkBuf(gl,lines);
 /* building slots */
 V.reg.forEach((rg,i)=>{const r=R[i],rd=rng(100+i*17);const want=r.size==='L'?7:r.size==='M'?5:3;
  const xs=rg.ring.map(p=>p[0]),zs=rg.ring.map(p=>p[1]);const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);
  const avoid=[];if(r.cap)avoid.push([rg.px,rg.pz-6,34],[rg.px,rg.pz+26,24]);else avoid.push([rg.px,rg.pz+12,20]);
  D.gl.filter(g=>g[1]===r.name).forEach(g=>avoid.push([g[2]-CX,g[3]-CZ,9]));
  for(let tries=0;tries<500&&rg.slots.length<want+1;tries++){
   const x=x0+rd()*(x1-x0),z=z0+rd()*(z1-z0);
   if(!inPoly(x,z,rg.ring)||edgeDist(x,z,rg.ring)<11)continue;
   if(avoid.some(a=>Math.hypot(x-a[0],z-a[1])<a[2]))continue;
   if(rg.slots.some(s=>Math.hypot(x-s.x,z-s.z)<19))continue;
   rg.slots.push({x,z,rot:Math.floor(rd()*4)*1.5708+(rd()-.5)*.4})}
  if(!rg.slots.length)rg.slots.push({x:rg.px+22,z:rg.pz-4,rot:0})});
 /* labels */
 const labs=$('labs');labs.innerHTML='';
 R.forEach((r,i)=>{const d=document.createElement('div');d.className='lab3';d.innerHTML='<b></b><span></span>';labs.appendChild(d);V.reg[i].lab=d;d.firstChild.textContent=r.name});
 V.info=infoText;V.pick=(x,y)=>pickRay(x,y).i;
 V.clampCam=()=>{
  if(V.kmode&&V.kb){const b=V.kb,cl=(v,a,c)=>Math.max(a,Math.min(c,v));cam.tx=cl(cam.tx,b.cx-b.hx*1.1,b.cx+b.hx*1.1);cam.tz=cl(cam.tz,b.cz-b.hz*1.1,b.cz+b.hz*1.1);cam.dist=cl(cam.dist,170,b.dist*1.3)}
  else{cam.tx=Math.max(-420,Math.min(420,cam.tx));cam.tz=Math.max(-420,Math.min(420,cam.tz))}};
 new ResizeObserver(size3D).observe($('v3'));size3D();
 if(cv.clientWidth<600){V.cam.dist=980}
 initExtra();V.ok=true;setTheme(THEME);
 V.ok=true}
function size3D(){const cv=V.cv,w=cv.clientWidth,h=cv.clientHeight,dp=Math.min(window.devicePixelRatio||1,2);if(!w||!h)return;cv.width=Math.round(w*dp);cv.height=Math.round(h*dp)}
function focus3D(x,z,dist,th,ph){V.anim={tx:x,tz:z,dist,th:th==null?0:th,ph:ph==null?.9:ph}}
function update3D(){
 if(!V.ok)return;
 const gl=V.gl;
 R.forEach((r,i)=>{const rg=V.reg[i],g=G?G.reg[i]:null;
  const own=g&&g.owner!=null?G.players[g.owner]:null;
  rg.tint=themeTint(i,own);rg.em=themeEm(i,own);
  const key=g?(g.owner+'|'+(own?own.k:'')+'|'+g.troops+'|'+g.camp+'|'+(own&&own.palace===i?1:0)+'|'+(own&&own.palace===i?own.minister:0)+'|'+g.dmg+'|'+THEME):'none';
  if(key!==rg.key){rg.key=key;freeBuf(gl,rg.props);const b=new B();
   if(own){const k=own.k,roof=hexc(K[k].strong),isP=own.palace===i;
    const ms=isP?minSpots(i):null,dm=g.dmg>0;
    themeProps(b,i,rg,g,own,isP,ms,dm);
   }else if(i===MINE)goldPile(b,rg.px,rg.pz+4);
   if(g&&own==null&&g.troops>0){}
   const rgH=rg.H;for(let q=0;q<b.d.length;q+=9)b.d[q+1]+=rgH;
   rg.props=mkBuf(gl,b)}
  const lab=rg.lab;lab.lastElementChild.textContent=g&&own?(g.troops+'/'+cap(i)):'';
  lab.style.borderColor=own?K[own.k].strong:'#B9A57F';lab.classList.toggle('own',!!own)});
 /* arrows */
 freeBuf(gl,V.arrows);V.arrows=null;
 if(G&&G.phase==='resolve'&&G.arrows.length){const b=new B();
  G.arrows.forEach(([a,c,p])=>{const A=V.reg[a],Z=V.reg[c],col=hexc(K[G.players[p].k].strong),y=Math.max(A.H,Z.H)+22;
   const dx=Z.px-A.px,dz=Z.pz-A.pz,l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l;
   b.flat(A.px+ux*14,A.pz+uz*14,Z.px-ux*26,Z.pz-uz*26,y,4.5,col);
   const tx=Z.px-ux*12,tz=Z.pz-uz*12,bx=Z.px-ux*28,bz=Z.pz-uz*28;
   b.tri([tx,y,tz],[bx-uz*9,y,bz+ux*9],[bx+uz*9,y,bz-ux*9],[0,1,0],col)});
  V.arrows=mkBuf(gl,b)}
 /* camera focus on turn */
 const key=G?(G.phase+'|'+G.qi+'|'+G.round):'none';
 if(key!==V.lastKey){V.lastKey=key;
  const act=actorNow();if(act!=null&&!G.players[act].ai)V.me=act;
  if(act!=null&&!G.players[act].ai&&V.mode!=='world'&&V.int&&V.int.pi!==act){if(V.mode==='tower')backFromTower();exitBuilding();return}
  if(V.kmode&&G)kFocus();
  else if(G&&['market','cards','move','attack'].includes(G.phase)&&P()&&P().palace!=null){const rg=V.reg[P().palace];focus3D(rg.px,rg.pz+10,560,0)}
  else focus3D(0,20,V.cv.clientWidth<600?980:1060,0)}
 if(V.sel>=0&&V.info&&G){const t=$('tip3');t.textContent=V.info(V.sel);t.style.display='block'}
 V.dirty=true;V.texDirty=true;V.winDirty=true}
function actorNow(){if(G&&G.net)return ME;return G&&['market','cards','move','attack'].includes(G.phase)&&G.queue&&G.queue[G.qi]!=null?G.queue[G.qi]:null}
function kBounds(k){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;R.forEach((r,i)=>{if(r.k!==k)return;V.reg[i].ring.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1])})});
 return{cx:(x0+x1)/2,cz:(z0+z1)/2,hx:(x1-x0)/2,hz:(z1-z0)/2,dist:Math.max(x1-x0,z1-z0)*(V.cv.clientWidth<600?1.7:1.35)+90}}
function kFocus(){const p=G.players[V.me];V.kb=kBounds(p.k);focus3D(V.kb.cx,V.kb.cz+10,V.kb.dist,0,.85)}
function enterK(on){
 if(on&&!G)on=false;
 V.kmode=on;
 if(on){const a=actorNow();if(a!=null&&!G.players[a].ai)V.me=a;kFocus()}
 else{V.kb=null;focus3D(0,20,V.cv.clientWidth<600?980:1060,0,.9)}
 $('kBtn').textContent=on?'اطلع للخريطة الكاملة':'ادخل مملكتك';$('kBtn').classList.toggle('sel',on);
 renderKingdom()}
function renderKingdom(){
 const el=$('kcard');if(!el)return;
 if(!V.kmode||!G){el.style.display='none';return}
 let a=actorNow();if(a!=null&&G.players[a].ai)a=null;if(a!=null)V.me=a;
 const pi=V.me,p=G.players[pi],o=owned(pi).sort((x,y)=>(isPalace(y)-isPalace(x))||(R[y].size>R[x].size?1:-1));
 const troops=o.reduce((s,i)=>s+G.reg[i].troops,0);
 let h='<h3>داخل مملكتك</h3><div class="row" style="margin-bottom:8px">'+G.players.map((q,qi)=>`<button data-p="${qi}" class="${qi===pi?'sel':''}" ${q.ai||(G.net&&qi!==ME)||(a!=null&&qi!==a)?'disabled':''} style="min-height:34px;padding:2px 10px"><span class="sw" style="background:${K[q.k].fill}"></span>${K[q.k].short}</button>`).join('')+'</div>';
 h+=`<div style="font-weight:700;font-size:16px">${sw(p)}${p.name}${p.alive?'':' (خرجت)'}</div><div class="muted">${K[p.k].ab}</div>`;
 h+=`<div class="kstat"><span>الذهب: <b>${p.gold}</b></span><span>الجنود: <b>${troops}</b></span><span>المناطق: <b>${o.length}</b></span><span>الوزير: <b>${MIN_NAMES[p.minister]}</b> (+${p.minister})</span><span>المعسكرات: <b>${o.filter(i=>G.reg[i].camp).length}/2</b></span><span>النقاط الحالية: <b>${score(pi).total}</b></span></div>`;
 h+=`<div class="kstat"><span>صواريخ: <b>${p.mis.n}</b> عادي · <b>${p.mis.h}</b> ثقيل</span><span>الدفاع الجوي: <b>${p.def||'—'}</b></span><span>الاستقرار: <b>${p.s.stab}%</b></span><span>الجاهزية: <b>${READY[p.s.ready]}</b></span><span>الاستخبارات: <b>${p.intel||'—'}</b></span><span>معاهدات: <b>${G.pacts.filter(x=>x.until>=G.round&&(x.a===pi||x.b===pi)).map(x=>K[G.players[x.a===pi?x.b:x.a].k].short).join('، ')||'—'}</b></span></div>`;
 h+='<div class="muted" style="margin-bottom:4px">مؤسسات الدولة (ادخل المبنى وتمشّى فيه):</div><div class="row" style="margin-bottom:10px">'+['hq','def','intel','foreign'].map(m=>`<button data-m="${m}" ${p.palace==null?'disabled':''}>${MNAMES[m]}</button>`).join('')+'</div>';
 h+='<div class="muted" style="margin-bottom:4px">مناطقك (اضغط على منطقة عشان تقرّب لها):</div>';
 h+=o.map(i=>{const g=G.reg[i];return `<div class="krow" data-i="${i}"><span>${R[i].name} <span class="muted">${SZ[R[i].size].label}</span>${isPalace(i)?' <span class="badge">قصر</span>':''}${g.camp?' <span class="badge" style="background:#6B5434">معسكر</span>':''}</span><b>${g.troops}/${cap(i)}</b></div>`}).join('');
 el.style.display='block';el.innerHTML=h;
 el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>enterBuilding(b.dataset.m));
 el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{V.me=+b.dataset.p;kFocus();renderKingdom()});
 el.querySelectorAll('[data-i]').forEach(r=>r.onclick=()=>{const i=+r.dataset.i,rg=V.reg[i];V.sel=i;focus3D(rg.px,rg.pz+6,Math.max(240,Math.min(V.kb?V.kb.dist*.7:360,360)),0,.8);update3D()})}
function setView(v3){
 if(!(v3&&V.ok)&&V.mode&&V.mode!=='world'){if(V.mode==='tower')backFromTower();exitBuilding()}
 V3=v3&&V.ok;if(!V3&&V.kmode)enterK(false);$('kBtn').style.display=V3?'':'none';$('map').style.display=V3?'none':'block';$('v3').style.display=V3?'block':'none';
 $('viewBtn').textContent=V3?'عرض ثنائي الأبعاد':'عرض ثلاثي الأبعاد';
 if(V3){update3D();size3D();if(!V.raf)V.raf=requestAnimationFrame(loop3D)}else renderMap()}
