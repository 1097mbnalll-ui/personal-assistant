/* ===================== Ministries in 3D, walkable interiors, tower view, missile FX ===================== */
V.mode='world';V.fx=[];V.instant=false;V.fp=null;V.int=null;V.tw=null;V.keys={};V.joy={x:0,y:0};V.minOpen=null;V.tex={};V.src={};
const MNAMES={hq:'القيادة الوطنية',def:'وزارة الدفاع',intel:'وزارة الاستخبارات',foreign:'وزارة الخارجية'};
const MSHORT={hq:'القيادة',def:'الدفاع',intel:'الاستخبارات',foreign:'الخارجية'};
B.prototype.aab=function(x0,y0,z0,x1,y1,z1,col){this.obox((x0+x1)/2,(y0+y1)/2,(z0+z1)/2,[1,0,0],[0,1,0],[0,0,1],x1-x0,y1-y0,z1-z0,col)};
B.prototype.seg=function(a,b,w,h,col){const d=nrm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);let s=nrm(crs(d,[0,1,0]));if(!isFinite(s[0])||Math.hypot(...s)<.5)s=[1,0,0];const u=crs(s,d);const l=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);this.obox((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,d,u,s,l,h,w,col)};
class TB{constructor(){this.d=[]}
 q(a,b,c,d,n,u0,v0,u1,v1){const P=(p,u,v)=>this.d.push(p[0],p[1],p[2],n[0],n[1],n[2],u,v);P(a,u0,v0);P(b,u1,v0);P(c,u1,v1);P(a,u0,v0);P(c,u1,v1);P(d,u0,v1)}}

/* ---------- GL helpers ---------- */
function useMain(vp,e,inside){const gl=V.gl,t=T();gl.useProgram(V.pr);gl.uniformMatrix4fv(V.u.uVP,false,vp);gl.uniform3fv(V.u.uCam,e);gl.uniform3fv(V.u.uFog,V.fog);gl.uniform3fv(V.u.uSun,inside?[.40,.40,.38]:t.sun);gl.uniform3fv(V.u.uAmb,inside?[.42,.42,.43]:t.amb);gl.uniform1f(V.u.uFogOn,1)}
function drawS(o,tint,em){const gl=V.gl;if(!o||!o.n)return;gl.uniform3fv(V.u.uTint,tint||[1,1,1]);gl.uniform3fv(V.u.uEm,em||[0,0,0]);gl.bindBuffer(gl.ARRAY_BUFFER,o.buf);const L=V.loc;
 gl.enableVertexAttribArray(L.aP);gl.vertexAttribPointer(L.aP,3,gl.FLOAT,false,36,0);gl.enableVertexAttribArray(L.aN);gl.vertexAttribPointer(L.aN,3,gl.FLOAT,false,36,12);gl.enableVertexAttribArray(L.aC);gl.vertexAttribPointer(L.aC,3,gl.FLOAT,false,36,24);gl.drawArrays(gl.TRIANGLES,0,o.n)}
function initTexProg(){const gl=V.gl;
 const VS2='attribute vec3 aP,aN;attribute vec2 aT;uniform mat4 uVP;varying vec2 vT;varying vec3 vN;void main(){vT=aT;vN=aN;gl_Position=uVP*vec4(aP,1.);}';
 const FS2='precision mediump float;varying vec2 vT;varying vec3 vN;uniform sampler2D uS;uniform float uLit;void main(){vec3 n=normalize(vN);float d=max(dot(n,normalize(vec3(.45,.8,.4))),0.);vec3 c=texture2D(uS,vT).rgb;gl_FragColor=vec4(c*mix(1.,.62+.45*d,uLit),1.);}';
 const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x};
 const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS2));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS2));gl.linkProgram(pr);
 if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error('link2');
 V.pt=pr;V.lt={aP:gl.getAttribLocation(pr,'aP'),aN:gl.getAttribLocation(pr,'aN'),aT:gl.getAttribLocation(pr,'aT'),uVP:gl.getUniformLocation(pr,'uVP'),uS:gl.getUniformLocation(pr,'uS'),uLit:gl.getUniformLocation(pr,'uLit')};
 const one=document.createElement('canvas');one.width=one.height=2;const x=one.getContext('2d');x.fillStyle='#223';x.fillRect(0,0,2,2);
 ['map','status','sign'].forEach(k=>V.tex[k]=texFromCanvas(one));
 V.fbo=makeFBO(1024,512);V.tex.win=V.fbo.tex}
function mkTBuf(tb){const gl=V.gl;const arr=new Float32Array(tb.d);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);return{buf,n:arr.length/8}}
function texParams(gl){gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}
function texFromCanvas(cv,old){const gl=V.gl;const t=old||gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv)}catch(e){}
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);texParams(gl);return t}
function makeFBO(w,h){const gl=V.gl;const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);texParams(gl);
 const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
 const rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);return{fb,tex,w,h}}
function drawT(o,tex,lit,vp){const gl=V.gl;if(!o||!o.n||!tex)return;const L=V.lt;gl.useProgram(V.pt);gl.uniformMatrix4fv(L.uVP,false,vp);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(L.uS,0);gl.uniform1f(L.uLit,lit);
 gl.bindBuffer(gl.ARRAY_BUFFER,o.buf);gl.enableVertexAttribArray(L.aP);gl.vertexAttribPointer(L.aP,3,gl.FLOAT,false,32,0);gl.enableVertexAttribArray(L.aN);gl.vertexAttribPointer(L.aN,3,gl.FLOAT,false,32,12);gl.enableVertexAttribArray(L.aT);gl.vertexAttribPointer(L.aT,2,gl.FLOAT,false,32,24);gl.drawArrays(gl.TRIANGLES,0,o.n)}
function textCanvas(lines,o){const c=document.createElement('canvas');c.width=o.w||1024;c.height=o.h||512;const x=c.getContext('2d');x.fillStyle=o.bg;x.fillRect(0,0,c.width,c.height);
 if(o.border){x.strokeStyle=o.border;x.lineWidth=12;x.strokeRect(8,8,c.width-16,c.height-16)}
 x.direction='rtl';x.textAlign='center';x.textBaseline='middle';const n=lines.length;
 lines.forEach((l,i)=>{const big=i===0;let fs=big?(o.f1||64):(o.f2||44);x.font=(big?'700 ':'600 ')+fs+'px Cairo, sans-serif';while(x.measureText(l).width>c.width-60&&fs>18){fs-=2;x.font=(big?'700 ':'600 ')+fs+'px Cairo, sans-serif'}x.fillStyle=big?(o.c1||o.fg):o.fg;x.fillText(l,c.width/2,(i+.5)*c.height/n)});return c}
function mapTexUpdate(){try{const svg=$('map');const s=new XMLSerializer().serializeToString(svg);const img=new Image();
 img.onload=()=>{try{const c=document.createElement('canvas');c.width=1024;c.height=1024;const x=c.getContext('2d');x.fillStyle='#A9C8D6';x.fillRect(0,0,1024,1024);x.drawImage(img,0,4,1024,1016);V.tex.map=texFromCanvas(c,V.tex.map);V.src.map=c;RRI.scrDirty=true}catch(e){}};
 img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s.includes('xmlns=')?s:s.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'))}catch(e){}}

/* ---------- camera basis + picking ---------- */
function setBasis(e,t,fov,asp){const f=nrm([t[0]-e[0],t[1]-e[1],t[2]-e[2]]);const r=nrm(crs(f,[0,1,0]));const u=crs(r,f);V.basis={e,f,r,u,th:Math.tan(fov/2),asp}}
function pickRay(cx,cy){const B0=V.basis;if(!B0)return{i:-1};const rc=V.cv.getBoundingClientRect();const nx=(cx-rc.left)/rc.width*2-1,ny=1-(cy-rc.top)/rc.height*2;
 const {e,f,r,u,th,asp}=B0;const d=nrm([f[0]+nx*th*asp*r[0]+ny*th*u[0],f[1]+nx*th*asp*r[1]+ny*th*u[1],f[2]+nx*th*asp*r[2]+ny*th*u[2]]);
 for(const y of[6,8,4.5]){if(Math.abs(d[1])<1e-6)break;const t=(y-e[1])/d[1];if(t<0)continue;const x=e[0]+t*d[0],z=e[2]+t*d[2];
  for(let i=0;i<V.reg.length;i++)if(Math.abs(V.reg[i].H-y)<4.8&&inPoly(x,z,V.reg[i].ring))return{i,x,z}}
 return{i:-1}}
function infoText(i){if(i<0)return'';if(!G)return R[i].name;const r=R[i],g=G.reg[i];let s=r.name+' · '+SZ[r.size].label+' · '+(g.owner!=null?G.players[g.owner].name+' · '+g.troops+'/'+cap(i)+' جنود':'محايدة');if(g.dmg>0)s+=' · معطلة '+g.dmg+' ج';return s}

/* ---------- ministry buildings in the world ---------- */
function minSpots(i){const rg=V.reg[i];if(rg.ms)return rg.ms;const want=[['def',-40,8],['intel',40,8],['foreign',0,-46]];const out={},used=[];
 want.forEach(([m,dx,dz])=>{let best=null,bd=1e9;
  for(let a=0;a<36;a++)for(let r=0;r<=44;r+=4){const ang=a/36*6.2832;const x=rg.px+dx+Math.cos(ang)*r,z=rg.pz+dz+Math.sin(ang)*r;
   const d=Math.hypot(x-rg.px-dx,z-rg.pz-dz);if(d>=bd)continue;
   if(!inPoly(x,z,rg.ring)||edgeDist(x,z,rg.ring)<11)continue;if(Math.hypot(x-rg.px,z-(rg.pz-6))<31)continue;
   if(Math.abs(x-rg.px)<27&&z>rg.pz+16&&z<rg.pz+50)continue;if(used.some(u=>Math.hypot(x-u.x,z-u.z)<25))continue;bd=d;best={x,z}}
  out[m]=best||{x:rg.px+dx,z:rg.pz+dz};used.push(out[m])});
 rg.ms=out;return out}
function defBld(b,x,z,col){const ol=[.42,.47,.36];b.box(x,0,z,18,6,13,0,ol);b.box(x,6,z,19,.8,14,0,lighten(ol,.12));b.box(x,0,z+6.6,5,4,.4,0,C.dark);
 b.cyl(x-5,6.8,z-3,.5,.5,6,5,C.steel);b.dome(x-5,12.8,z-3,4.2,-1.6,8,lighten(C.steel,.2));
 b.box(x+4,6.8,z-1,6,1.4,5,0,C.dark);for(const o of[-1.3,1.3])b.seg([x+4+o,8,z+1.2],[x+4+o,14,z-3.4],1.1,1.1,[.92,.92,.9]);
 b.cyl(x+7.5,6.8,z+4.5,.3,.3,7,4,C.trunk);b.box(x+9.5,11.8,z+4.5,4,2.4,.3,0,col)}
function intelBld(b,x,z,col){const nv=[.22,.27,.40];b.box(x,0,z,10,26,10,0,nv);for(let y=3;y<25;y+=3.2)b.box(x,y,z,10.2,.9,10.2,0,[.55,.75,.92]);
 b.box(x,26,z,11,.8,11,0,lighten(nv,.15));b.cyl(x+2,26.8,z+2,.35,.2,12,4,C.steel);b.cyl(x-2.5,26.8,z-2,.6,.6,3,5,C.steel);b.dome(x-2.5,29.8,z-2,3.4,-1.4,8,lighten(C.steel,.25));
 b.box(x,0,z+5.2,3,4,.4,0,C.dark);b.box(x+3,22,z+5.3,3,1.6,.3,0,col)}
function forBld(b,x,z,col){const wh=[.93,.91,.86];b.box(x,0,z,20,1.2,14,0,lighten(wh,-.1).map(v=>v*.92));b.box(x,1.2,z-1,18,8,10,0,wh);
 for(let i=-3;i<=3;i++)if(i)b.cyl(x+i*2.6,1.2,z+5.2,.75,.75,8,7,wh);b.box(x,9.2,z+1,20,1.2,12,0,lighten(wh,.03));b.dome(x,10.4,z-1,5,5,10,[.85,.68,.25]);
 b.box(x,1.2,z+4.1,3,5,.3,0,C.dark);for(const s of[-1,1]){b.cyl(x+s*8.5,1.2,z+6.4,.3,.3,10,4,C.trunk);b.box(x+s*8.5+1.6,8.6,z+6.4,3.2,2,.25,0,col)}}
function ruins(b,x,z){b.box(x,0,z,9,1.4,7,.4,[.45,.43,.42]);b.box(x+2,1.4,z-1,4,1.6,3,.9,[.32,.30,.29]);b.box(x-2.6,0,z+2,2.4,3.4,1.6,.2,[.38,.36,.35]);for(let i=0;i<4;i++)b.box(x+1,4+i*3.2,z,2.6-i*.4,2.6-i*.4,2.6-i*.4,i,[.30,.30,.32].map(v=>v+i*.08))}

/* ---------- missile FX ---------- */
function bez(A,Bp,C2,u){const a=(1-u)*(1-u),b=2*u*(1-u),c=u*u;return[A[0]*a+C2[0]*b+Bp[0]*c,A[1]*a+C2[1]*b+Bp[1]*c,A[2]*a+C2[2]*b+Bp[2]*c]}
function palacePos(pi){const p=G.players[pi];if(p.palace==null)return[0,40,0];const ms=minSpots(p.palace),rg=V.reg[p.palace];return[ms.def.x,rg.H+16,ms.def.z]}
function playMissile(pi,i,t,ic,done){const now=performance.now();const A=palacePos(pi);const rg=V.reg[i];const Bp=[rg.px,rg.H+4,rg.pz];
 const dist=Math.hypot(Bp[0]-A[0],Bp[2]-A[2]);const C2=[(A[0]+Bp[0])/2,Math.max(A[1],Bp[1])+dist*.42+50,(A[2]+Bp[2])/2];
 const col=hexc(K[G.players[pi].k].strong),T=2.4;const heavy=t==='h';
 V.fx.push({k:'mis',A,B:Bp,C:C2,t0:now,T,end:ic?.75:1,col,heavy});
 let endT;
 if(ic){const di=G.reg[i].owner;const D=palacePos(di);const meet=bez(A,Bp,C2,.75);const C3=[(D[0]+meet[0])/2,Math.max(D[1],meet[1])+30,(D[2]+meet[2])/2];
  V.fx.push({k:'mis',A:D,B:meet,C:C3,t0:now+1000,T:.8,end:1,col:hexc(K[G.players[di].k].strong),heavy:false,small:true});
  V.fx.push({k:'boom',P:meet,t0:now+1800,T:.9,size:14});endT=1800}
 else{V.fx.push({k:'boom',P:Bp,t0:now+T*1000,T:1.1,size:heavy?34:22});endT=T*1000}
 if(V.mode==='world'){focus3D((A[0]+Bp[0])/2,(A[2]+Bp[2])/2,Math.min(1150,Math.max(620,dist*1.6+300)),V.cam.th,.85)}
 setTimeout(done,endT+350)}
function fxBuild(now){if(!V.fx.length)return null;const b=new B();
 V.fx.forEach(f=>{const u=(now-f.t0)/(f.T*1000);if(u<0)return;
  if(f.k==='mis'){if(u>f.end)return;const p=bez(f.A,f.B,f.C,u),q=bez(f.A,f.B,f.C,Math.min(1,u+.01));const d=nrm([q[0]-p[0],q[1]-p[1],q[2]-p[2]]);
   const s=f.small?.7:f.heavy?1.5:1;const tail=[p[0]-d[0]*5*s,p[1]-d[1]*5*s,p[2]-d[2]*5*s];
   b.seg(tail,[p[0]+d[0]*4*s,p[1]+d[1]*4*s,p[2]+d[2]*4*s],1.8*s,1.8*s,[.95,.95,.93]);b.seg(tail,[tail[0]+d[0]*2*s,tail[1]+d[1]*2*s,tail[2]+d[2]*2*s],2.2*s,2.2*s,f.col);
   b.seg([tail[0]-d[0]*3*s,tail[1]-d[1]*3*s,tail[2]-d[2]*3*s],tail,1.4*s,1.4*s,[1,.62,.15]);
   for(let k=1;k<=10;k++){const uu=u-k*.022;if(uu<0)break;const sp=bez(f.A,f.B,f.C,uu);const r=(1.2+k*.35)*s;b.box(sp[0],sp[1]-r/2,sp[2],r,r,r,k,[.78-k*.02,.78-k*.02,.8-k*.02])}}
  else if(f.k==='boom'){if(u>1)return;const g=u<.55?u/.55:1-(u-.55)/.45;const r=f.size*(.25+.75*Math.min(1,u/.55))*(u<.55?1:Math.max(.05,g));
   const c=u<.3?[1,.92,.4]:u<.6?[1,.55,.15]:[.35,.33,.32];b.dome(f.P[0],f.P[1],f.P[2],r,r,10,c);b.dome(f.P[0],f.P[1],f.P[2],r,-r*.6,10,c);
   if(u<.8)b.cyl(f.P[0],Math.max(0,f.P[1]-3),f.P[2],r*1.6,r*1.6,.4,16,[.4,.38,.36],false)}});
 return b}
function fxDraw(now){const b=fxBuild(now);if(!b||!b.d.length)return;if(V.fxBuf)freeBuf(V.gl,V.fxBuf);V.fxBuf=mkBuf(V.gl,b);drawS(V.fxBuf)}
function fxPrune(now){V.fx=V.fx.filter(f=>now<f.t0+f.T*1000+200)}

/* ---------- world draw ---------- */
function hlSets(){const hl=new Set(),aim=new Set();let src=-1,tg=-1;const pi=G&&G.queue?G.queue[G.qi]:null;
 if(G&&G.aim)missileTargets(G.aim.pi).forEach(i=>aim.add(i));
 else if(G&&pi!=null){
  if(G.phase==='market'){const p=G.players[pi];if(p.placing==='camp')owned(pi).filter(i=>!G.reg[i].camp).forEach(i=>hl.add(i));else if(p.reserve>0)placeTargets(pi).forEach(i=>hl.add(i))}
  if(G.phase==='move'){if(G.sel==null)owned(pi).filter(i=>movable(i)>0).forEach(i=>hl.add(i));else{src=G.sel;owned(pi).filter(i=>i!==G.sel&&G.reg[i].troops<cap(i)).forEach(i=>hl.add(i))}}
  if(G.phase==='attack'){const p=G.players[pi];if(p.att){tg=p.att.target;Object.keys(p.att.from).forEach(j=>hl.add(+j))}else attackTargets(pi).forEach(i=>hl.add(i))}}
 return{hl,aim,src,tg}}
function worldDraw(vp,e,now){useMain(vp,e);const t=(now-V.t0)/1000,pulse=.5+.5*Math.sin(t*4),th=T();
 {const gl=V.gl;gl.uniform1f(V.u.uFogOn,0);gl.uniform3fv(V.u.uSun,[0,0,0]);gl.uniform3fv(V.u.uAmb,[1,1,1]);gl.depthMask(false);drawS(V.sky);gl.depthMask(true);useMain(vp,e)}
 drawS(V.sea,th.sea.map(v=>v/.68*1.25));drawS(V.shal,th.shal.map(v=>v/.8*1.25));drawS(V.slab,th.slab.map(v=>v/.9));
 const {hl,aim,src,tg}=hlSets();const meI=V.kmode&&G?V.me:-1;
 V.reg.forEach((rg,i)=>{let em=[0,0,0];if(hl.has(i)){const q=.10+.16*pulse;em=[q*1.1,q*.7,0]}if(aim.has(i))em=[.10+.22*pulse,0,0];if(src===i)em=[0,.12,.26];if(tg===i)em=[.12+.2*pulse,0,0];
  if(V.hover===i&&!hl.has(i)&&!aim.has(i))em=[.05,.05,.05];if(V.sel===i&&!hl.has(i)&&!aim.has(i)&&src!==i&&tg!==i)em=[.05,.07,.12];
  const dim=meI>=0&&G.reg[i].owner!==meI?.86:1;let tint=rg.tint;if(G&&G.reg[i].dmg>0)tint=tint.map(v=>v*.78);
  drawS(rg.mesh,tint.map(v=>v*dim),em.map((v,q)=>v+(rg.em?rg.em[q]:0)))});
 drawS(V.lines,th.lines.map(v=>v/.36),th.lineEm);drawS(V.dec,th.dec);V.reg.forEach(rg=>drawS(rg.props));drawS(V.arrows);fxDraw(now)}
function labelsUpdate(vp,show){const labs=$('labs');labs.style.display=show?'':'none';if(!show)return;
 const rc=V.cv.getBoundingClientRect(),W=rc.width,Hh=rc.height;labs.classList.toggle('compact',W<600&&V.mode==='world'&&V.cam.dist>620);
 const proj=(p,l)=>{const x=vp[0]*p[0]+vp[4]*p[1]+vp[8]*p[2]+vp[12],y=vp[1]*p[0]+vp[5]*p[1]+vp[9]*p[2]+vp[13],wv=vp[3]*p[0]+vp[7]*p[1]+vp[11]*p[2]+vp[15];
  if(wv<=0){l.style.display='none';return}l.style.display='';l.style.transform='translate('+((x/wv+1)/2*W).toFixed(1)+'px,'+((1-y/wv)/2*Hh).toFixed(1)+'px) translate(-50%,-100%)'};
 V.reg.forEach((rg,i)=>{const r=R[i];proj([rg.px,rg.H+(r.cap?32:20),rg.pz-(r.cap?6:0)],rg.lab)});
 const showM=G&&V.kmode&&V.mode==='world'&&G.players[V.me]&&G.players[V.me].palace!=null;
 ['hq','def','intel','foreign'].forEach(m=>{const l=V.mlab[m];if(!showM){l.style.display='none';return}const pal=G.players[V.me].palace,rg=V.reg[pal],ms=m==='hq'?{x:rg.px,z:rg.pz-6}:minSpots(pal)[m];proj(m==='hq'?[rg.px+4,rg.H+4,rg.pz+16]:[ms.x,rg.H+(m==='intel'?34:20),ms.z],l)})}

/* ---------- main loop ---------- */
function loop3D(now){
 if(!V3){V.raf=0;return}
 V.raf=requestAnimationFrame(loop3D);
 if(!V.ok)return;
 const gl=V.gl,cv=V.cv,w=cv.width,h=cv.height;if(!w||!h)return;
 const dt=Math.min(.05,Math.max(0,(now-(V.lastT||now))/1000));V.lastT=now;
 fxPrune(now);RRI.vis(V.mode==='interior'&&RRI.active);
 if(V.mode==='interior'){interiorFrame(dt,now);return}
 const cam=V.cam;let e,tgt,fov=.7,near=30;
 if(V.mode==='tower'){const tw=V.tw;e=tw.e;const f=[Math.sin(tw.yaw)*Math.cos(tw.pitch),Math.sin(tw.pitch),-Math.cos(tw.yaw)*Math.cos(tw.pitch)];tgt=[e[0]+f[0],e[1]+f[1],e[2]+f[2]];fov=tw.fov;near=2}
 else{
  if(V.anim){const a=V.anim,k=.1;cam.tx+=(a.tx-cam.tx)*k;cam.tz+=(a.tz-cam.tz)*k;cam.dist+=(a.dist-cam.dist)*k;cam.th+=(a.th-cam.th)*k;cam.ph+=(a.ph-cam.ph)*k;if(Math.abs(a.tx-cam.tx)+Math.abs(a.tz-cam.tz)+Math.abs(a.dist-cam.dist)<1)V.anim=null}
  e=[cam.tx+cam.dist*Math.sin(cam.ph)*Math.sin(cam.th),cam.dist*Math.cos(cam.ph),cam.tz+cam.dist*Math.sin(cam.ph)*Math.cos(cam.th)];tgt=[cam.tx,0,cam.tz]}
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.clearColor(V.fog[0],V.fog[1],V.fog[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const vp=mul(persp(fov,w/h,near,9000),lookAt(e,tgt,[0,1,0]));V.vp=vp;V.eye=e;setBasis(e,tgt,fov,w/h);
 worldDraw(vp,e,now);labelsUpdate(vp,true)}

/* ---------- interior construction (units: meters) ---------- */
const IC={marble:[.87,.85,.81],marble2:[.76,.74,.70],wall:[.93,.90,.84],trim:[.36,.26,.18],wood:[.52,.35,.21],dwood:[.33,.22,.14],ceil:[.95,.94,.91],par1:[.63,.45,.29],par2:[.57,.40,.25],frame:[.24,.24,.26],metal:[.58,.60,.63],scr:[.10,.11,.13],white:[.95,.95,.94],fabric:[.38,.42,.48],grass:[.45,.60,.35],terra:[.70,.40,.26],leaf:[.30,.52,.30],book:[[.55,.18,.16],[.18,.32,.52],[.22,.45,.28],[.75,.62,.28],[.4,.3,.5]]};
function buildInterior(m,k){
 const S=new B(),Lt=new B(),T={win:new TB(),map:new TB(),status:new TB(),sign:new TB()};
 const acc=hexc(K[k].strong),mc={hq:[.36,.27,.14],def:[.38,.44,.32],intel:[.20,.26,.44],foreign:[.50,.16,.18]}[m];
 const col=[[],[]],hs=[];const W=9,Dp=6,F=3.4,TOP=6.8,t=.25;
 const aab=(...a)=>S.aab(...a);
 /* ground & floors */
 S.quad([-200,-.21,-200],[200,-.21,-200],[200,-.21,200],[-200,-.21,200],[0,1,0],IC.grass);
 aab(-W,-.2,-Dp,W,0,Dp,IC.marble2);
 for(let i=-6;i<6;i++)for(let j=-4;j<4;j++)if((i+j+20)%2===0)S.quad([i*1.5,.004,j*1.5],[i*1.5+1.5,.004,j*1.5],[i*1.5+1.5,.004,j*1.5+1.5],[i*1.5,.004,j*1.5+1.5],[0,1,0],IC.marble);
 const areas=[[-W,-3.95,W,Dp],[-W,-Dp,-7,-3.95],[-1.5,-Dp,W,-3.95]];
 areas.forEach(a=>{aab(a[0],F-.22,a[1],a[2],F,a[3],IC.ceil);let n=0;for(let x=a[0];x<a[2]-1e-6;x+=.6,n++){const x1=Math.min(a[2],x+.6);S.quad([x,F+.004,a[1]],[x1,F+.004,a[1]],[x1,F+.004,a[3]],[x,F+.004,a[3]],[0,1,0],n%2?IC.par1:IC.par2)}});
 aab(-W,TOP,-Dp,W,TOP+.25,Dp,IC.ceil);
 /* walls with openings: [a0,a1,y0,y1] */
 const wallX=(z,y0,y1,ops)=>{let x=-W-t/2;ops.slice().sort((a,b)=>a[0]-b[0]).forEach(o=>{if(o[0]>x)aab(x,y0,z-t/2,o[0],y1,z+t/2,IC.wall);if(o[2]>y0)aab(o[0],y0,z-t/2,o[1],o[2],z+t/2,IC.wall);if(o[3]<y1)aab(o[0],o[3],z-t/2,o[1],y1,z+t/2,IC.wall);x=o[1]});if(x<W+t/2)aab(x,y0,z-t/2,W+t/2,y1,z+t/2,IC.wall)};
 const wallZ=(x,y0,y1,ops)=>{let z=-Dp;ops.slice().sort((a,b)=>a[0]-b[0]).forEach(o=>{if(o[0]>z)aab(x-t/2,y0,z,x+t/2,y1,o[0],IC.wall);if(o[2]>y0)aab(x-t/2,y0,o[0],x+t/2,o[2],o[1],IC.wall);if(o[3]<y1)aab(x-t/2,o[3],o[0],x+t/2,y1,o[1],IC.wall);z=o[1]});if(z<Dp)aab(x-t/2,y0,z,x+t/2,y1,Dp,IC.wall)};
 const uvFor=(w,h)=>{const a=w/h;if(a<2){const us=a/2;return[.5-us/2,0,.5+us/2,1]}const vs=2/a;return[0,.56-vs/2,1,.56+vs/2]};
 const frameX=(z,a0,a1,y0,y1,mull)=>{aab(a0-.06,y0-.08,z-.16,a1+.06,y0,z+.16,IC.frame);aab(a0-.06,y1,z-.16,a1+.06,y1+.07,z+.16,IC.frame);aab(a0-.06,y0,z-.14,a0,y1,z+.14,IC.frame);aab(a1,y0,z-.14,a1+.06,y1,z+.14,IC.frame);
  const n=Math.max(1,Math.round((a1-a0)/(mull||1.6)));for(let i=1;i<n;i++){const x=a0+(a1-a0)*i/n;aab(x-.03,y0,z-.1,x+.03,y1,z+.1,IC.frame)}};
 const frameZ=(x,a0,a1,y0,y1)=>{aab(x-.16,y0-.08,a0-.06,x+.16,y0,a1+.06,IC.frame);aab(x-.16,y1,a0-.06,x+.16,y1+.07,a1+.06,IC.frame);aab(x-.14,y0,a0-.06,x+.14,y1,a0,IC.frame);aab(x-.14,y0,a1,x+.14,y1,a1+.06,IC.frame)};
 const glassX=(z,a0,a1,y0,y1,south)=>{const uv=uvFor(a1-a0,y1-y0);if(south)T.win.q([a1,y0,z],[a0,y0,z],[a0,y1,z],[a1,y1,z],[0,0,-1],...uv);else T.win.q([a0,y0,z],[a1,y0,z],[a1,y1,z],[a0,y1,z],[0,0,1],...uv);frameX(z,a0,a1,y0,y1)};
 const glassZ=(x,a0,a1,y0,y1,east)=>{const uv=uvFor(a1-a0,y1-y0);if(east)T.win.q([x,y0,a0],[x,y0,a1],[x,y1,a1],[x,y1,a0],[-1,0,0],...uv);else T.win.q([x,y0,a1],[x,y0,a0],[x,y1,a0],[x,y1,a1],[1,0,0],...uv);frameZ(x,a0,a1,y0,y1)};
 const scrX=(slot,z,a0,a1,y0,y1,south,uv)=>{uv=uv||[0,0,1,1];const zz=south?z-.075:z+.075;if(south)T[slot].q([a1,y0,zz],[a0,y0,zz],[a0,y1,zz],[a1,y1,zz],[0,0,-1],...uv);else T[slot].q([a0,y0,zz],[a1,y0,zz],[a1,y1,zz],[a0,y1,zz],[0,0,1],...uv);aab(a0-.08,y0-.08,z-(south?.06:-.0),a1+.08,y1+.08,z+(south?0:.06),IC.scr)};
 const scrZ=(slot,x,a0,a1,y0,y1,east,uv)=>{uv=uv||[0,0,1,1];const xx=east?x-.075:x+.075;if(east)T[slot].q([xx,y0,a0],[xx,y0,a1],[xx,y1,a1],[xx,y1,a0],[-1,0,0],...uv);else T[slot].q([xx,y0,a1],[xx,y0,a0],[xx,y1,a0],[xx,y1,a1],[1,0,0],...uv);aab(x-(east?.06:0),y0-.08,a0-.08,x+(east?0:.06),y1+.08,a1+.08,IC.scr)};
 /* exterior walls: ground */
 wallX(-Dp,0,F,[[6.2,8,1,2.6]]);glassX(-Dp,6.2,8,1,2.6,false);
 wallX(Dp,0,F,[[-6.5,-3.5,1,2.6],[-1.1,1.1,0,2.7],[3.5,6.5,1,2.6]]);glassX(Dp,-6.5,-3.5,1,2.6,true);glassX(Dp,3.5,6.5,1,2.6,true);
 aab(-1.25,0,Dp-.2,-1.1,2.85,Dp+.2,IC.dwood);aab(1.1,0,Dp-.2,1.25,2.85,Dp+.2,IC.dwood);aab(-1.25,2.7,Dp-.2,1.25,2.85,Dp+.2,IC.dwood);
 wallZ(W,0,F,[[2,4.5,1,2.6]]);glassZ(W,2,4.5,1,2.6,true);
 wallZ(-W,0,F,[[0,3,1,2.6]]);glassZ(-W,0,3,1,2.6,false);
 /* upper */
 wallX(-Dp,F,TOP,[[-5.5,-2.5,4.3,5.9]]);glassX(-Dp,-5.5,-2.5,4.3,5.9,false);
 wallX(Dp,F,TOP,[[-7,7,3.9,6.3]]);glassX(Dp,-7,7,3.9,6.3,true);
 wallZ(W,F,TOP,[[3,5,4.3,5.9]]);glassZ(W,3,5,4.3,5.9,true);
 wallZ(-W,F,TOP,[[-1,2,4.3,5.9]]);glassZ(-W,-1,2,4.3,5.9,false);
 /* baseboards */
 for(const y of[0,F]){aab(-W+.12,y,-Dp+.12,W-.12,y+.12,-Dp+.16,IC.trim);aab(-W+.12,y,Dp-.16,-1.2,y+.12,Dp-.12,IC.trim);aab(1.2,y,Dp-.16,W-.12,y+.12,Dp-.12,IC.trim);aab(W-.16,y,-Dp+.12,W-.12,y+.12,Dp-.12,IC.trim);aab(-W+.12,y,-Dp+.12,-W+.16,y+.12,Dp-.12,IC.trim)}
 /* stairs */
 for(let s=0;s<10;s++){const x0=-7+s*.55,y=(s+1)*.34;aab(x0,0,-5.85,x0+.55,y,-3.95,IC.dwood);aab(x0,y,-5.85,x0+.55,y+.02,-3.95,IC.wood)}
 for(let s=0;s<=10;s++){const x=-7+s*.55,y=Math.min(F,s*.34)+.34;S.cyl(x,y,-3.97,.025,.025,.95,5,IC.metal)}
 S.seg([-7,1.3,-3.97],[-1.5,F+.95+.34,-3.97],.07,.07,IC.dwood);
 for(let x=-7;x<=-1.5;x+=.92)S.cyl(x,F,-3.92,.025,.025,1,5,IC.metal);aab(-7,F+1,-3.97,-1.5,F+1.06,-3.87,IC.dwood);
 /* lights */
 for(const [x,z] of[[-5,2],[0,2],[5,2],[-5,-2],[5,-2],[0,-1.5]])Lt.aab(x-.6,F-.27,z-.6,x+.6,F-.22,z+.6,[1,1,.96]);
 for(const [x,z] of[[-5,2],[0,2],[5,2],[-5,-2],[5,-2],[0,-2]])Lt.aab(x-.6,TOP-.05,z-.6,x+.6,TOP,z+.6,[1,1,.96]);
 /* furniture helpers */
 const desk=(x,z,y,w,d)=>{aab(x-w/2,y+.72,z-d/2,x+w/2,y+.78,z+d/2,IC.dwood);aab(x-w/2+.04,y,z-d/2+.04,x-w/2+.48,y+.72,z+d/2-.04,IC.wood);aab(x+w/2-.48,y,z-d/2+.04,x+w/2-.04,y+.72,z+d/2-.04,IC.wood)};
 const chair=(x,z,y,a,c)=>{c=c||[.18,.18,.2];const ex=[Math.cos(a),0,Math.sin(a)],ez=[-Math.sin(a),0,Math.cos(a)];S.obox(x,y+.48,z,ex,[0,1,0],ez,.52,.08,.52,c);
  S.obox(x+ez[0]*.25,y+.82,z+ez[2]*.25,ex,[0,1,0],ez,.52,.62,.06,c);S.cyl(x,y+.08,z,.04,.04,.4,5,IC.metal);S.cyl(x,y,z,.28,.28,.08,6,IC.metal,true)};
 const monitor=(x,z,y,south,slot)=>{S.cyl(x,y+.78,z,.12,.05,.2,5,IC.scr,true);const zz=south?z+.02:z-.02;aab(x-.32,y+.98,z-.03,x+.32,y+1.38,z+.03,IC.scr);
  if(slot){if(south)T[slot].q([x-.29,y+1.0,z+.035],[x+.29,y+1.0,z+.035],[x+.29,y+1.36,z+.035],[x-.29,y+1.36,z+.035],[0,0,1],0,0,1,1);else T[slot].q([x+.29,y+1.0,z-.035],[x-.29,y+1.0,z-.035],[x-.29,y+1.36,z-.035],[x+.29,y+1.36,z-.035],[0,0,-1],0,0,1,1)}};
 const shelf=(x0,x1,z,y,h)=>{aab(x0,y,z-.2,x1,y+h,z-.17,IC.dwood);aab(x0,y,z-.2,x0+.05,y+h,z+.2,IC.dwood);aab(x1-.05,y,z-.2,x1,y+h,z+.2,IC.dwood);
  for(let s=0;s<5;s++){const yy=y+.1+s*h/5;aab(x0,yy,z-.2,x1,yy+.04,z+.2,IC.dwood);let x=x0+.08,n=0;while(x<x1-.12&&s<4){const w=.05+((n*37)%5)*.012,hh=.24+((n*13)%4)*.04;aab(x,yy+.04,z-.14,x+w,yy+.04+hh,z+.12,IC.book[n%5]);x+=w+.01;n++}}};
 const flag=(x,z,y,c)=>{S.cyl(x,y,z,.18,.18,.06,6,IC.metal,true);S.cyl(x,y,z,.025,.025,2.3,5,IC.metal);aab(x+.03,y+1.55,z-.01,x+1.0,y+2.2,z+.01,c)};
 const plant=(x,z,y)=>{S.cyl(x,y,z,.24,.18,.45,8,IC.terra,true);S.dome(x,y+.45,z,.42,.75,8,IC.leaf)};
 const sofa=(x,z,y,c)=>{aab(x-.45,y,z-1.1,x+.45,y+.45,z+1.1,c);aab(x-.45,y,z-1.1,x-.25,y+.95,z+1.1,c);aab(x-.45,y,z-1.25,x+.45,y+.65,z-1.1,c);aab(x-.45,y,z+1.1,x+.45,y+.65,z+1.25,c)};
 const carpet=(x0,z0,x1,z1,y,c)=>aab(x0,y,z0,x1,y+.02,z1,c);
 /* ground floor common */
 carpet(-1,1.7,1,5.9,0,mc);
 aab(-2.2,0,.65,2.2,1.05,1.45,IC.wood);aab(-2.3,1.05,.6,2.3,1.11,1.5,IC.dwood);chair(0,.15,0,0);
 plant(-2.2,5.3,0);plant(2.2,5.3,0);
 scrX('sign',-Dp+.13,.8,5.6,2.42,3.12,false);
 col[0].push([-W-.2,-Dp-.2,W+.2,-Dp+.13],[-W-.2,Dp-.13,-1.1,Dp+.2],[1.1,Dp-.13,W+.2,Dp+.2],[-W-.2,-Dp,-W+.13,Dp],[W-.13,-Dp,W+.2,Dp],[-5.5,-4.05,-1.5,-3.85],[-1.6,-5.85,-1.4,-3.95],[-2.3,.6,2.3,1.5],[-2.5,5.05,-1.9,5.6],[1.9,5.05,2.5,5.6]);
 col[1].push([-W-.2,-Dp-.2,W+.2,-Dp+.13],[-W-.2,Dp-.13,W+.2,Dp+.2],[-W-.2,-Dp,-W+.13,Dp],[W-.13,-Dp,W+.2,Dp],[-7,-4.05,-1.5,-3.85]);
 /* ministry specific ground */
 if(m==='def'){
  S.aab(-5.1,0,1.6,-3.9,.3,2.8,IC.metal);S.cyl(-4.5,.3,2.2,.34,.34,2.6,10,IC.white,true);S.cyl(-4.5,2.9,2.2,.34,0,.8,10,[.7,.15,.12],true);S.cyl(-4.5,1.6,2.2,.36,.36,.25,10,acc,true);
  for(const [dx,dz] of[[.5,0],[-.5,0],[0,.5],[0,-.5]])S.aab(-4.5+dx*(dx?1:0)-(dx?0:.03),.3,2.2+dz-(dz?0:.03),-4.5+dx+(dx?0:.03),.95,2.2+dz+(dz?0:.03),acc);
  aab(3.1,0,.8,6.1,.82,2.8,IC.dwood);T.map.q([3.15,.83,2.75],[6.05,.83,2.75],[6.05,.83,.85],[3.15,.83,.85],[0,1,0],.05,.05,.95,.95);
  aab(7.5,0,-4.3,8.6,.78,-.7,IC.metal);aab(7.45,.78,-4.35,8.65,.84,-.65,IC.scr);
  scrZ('status',W-.13,-4.1,-2.5,1.25,2.55,true);scrZ('map',W-.13,-2.3,-.8,1.25,2.55,true,[.05,.05,.95,.95]);chair(6.95,-2.5,0,Math.PI/2);
  col[0].push([-5.2,1.5,-3.8,2.9],[3.0,.7,6.2,2.9],[7.4,-4.4,W,-.6]);
  hs.push({id:'ops',tab:'ew',label:'اجلس على كونسول الإنذار المبكر',x:6.5,z:-2.5,l:0,mk:[7.9,1.6,-2.5],yaw:Math.PI/2},{id:'cmd',tab:'cmd',label:'قف على طاولة العمليات',x:4.6,z:3.35,l:0,mk:[4.6,1.5,1.8],yaw:0},{id:'rd',tab:'rd',label:'افحص برنامج الصواريخ والبحث',x:-4.5,z:3.5,l:0,mk:[-3.6,1.7,2.2],yaw:0},{id:'arm',tab:'arm',label:'راجع مكتب التسليح',x:0,z:2.1,l:0,mk:[0,1.6,1.05],yaw:0})}
 if(m==='intel'){
  scrX('map',-Dp+.13,1,4.4,.95,2.25,false,[.05,.05,.95,.95]);scrX('status',-Dp+.13,4.6,8.4,.95,2.25,false);
  for(const [x,z] of[[3,-2.6],[6.2,-2.6],[3,.9],[6.2,.9]]){desk(x,z,0,2.2,.8);monitor(x-.5,z-.1,0,true,'status');monitor(x+.5,z-.1,0,true,'map');chair(x,z+.75,0,0)}
  for(let i=0;i<4;i++){const z=1.2+i*.95;aab(7.9,0,z,8.7,2.1,z+.8,[.13,.14,.17]);for(let y=.3;y<2;y+=.25)Lt.aab(7.86,y,z+.12,7.9,y+.04,z+.2,[.3,1,.45])}
  col[0].push([1.85,-3.05,4.15,-2.15],[5.05,-3.05,7.35,-2.15],[1.85,.45,4.15,1.35],[5.05,.45,7.35,1.35],[7.8,1.1,W,5.1]);
  hs.push({id:'ops',tab:'threat',label:'افتح شاشات مركز التهديدات',x:4.6,z:-4.3,l:0,mk:[4.6,1.6,-5.4],yaw:0},{id:'dos',tab:'dos',label:'افتح ملفات الدول على مكتب التحليل',x:3,z:1.95,l:0,mk:[3,1.75,.9],yaw:0},{id:'ci',tab:'ci',label:'افحص الأرشيف المؤمّن',x:7.2,z:3.1,l:0,mk:[7.7,1.6,3.1],yaw:Math.PI/2},{id:'iops',tab:'ops',label:'راجع مكتب العمليات',x:0,z:2.1,l:0,mk:[0,1.6,1.05],yaw:0})}
 if(m==='foreign'){
  S.cyl(3.8,0,.6,.35,.35,.72,8,IC.dwood,true);S.cyl(3.8,.72,.6,1.55,1.55,.07,20,IC.wood,true);
  for(let i=0;i<6;i++){const a=i/6*6.2832;const x=3.8+Math.sin(a)*2.05,z=.6-Math.cos(a)*2.05;chair(x,z,0,a+Math.PI,[.45,.16,.16])}
  scrX('map',-Dp+.13,1.2,5.6,.95,2.25,false,[.05,.05,.95,.95]);scrZ('status',W-.13,-2,1,1.2,2.6,true);
  G.players.forEach((q,qi)=>flag(8.3,2.2+qi*.85,0,hexc(K[q.k].strong)));
  S.cyl(-4.5,0,2.2,.25,.15,.9,6,IC.dwood,true);S.dome(-4.5,1.45,2.2,.55,.55,10,[.25,.45,.7]);S.dome(-4.5,1.45,2.2,.55,-.55,10,[.3,.55,.35]);
  col[0].push([1.6,-1.6,6.0,2.8],[8.1,2,W,5.6],[-4.9,1.8,-4.1,2.6]);
  hs.push({id:'ops',tab:'neg',label:'اجلس على طاولة المفاوضات',x:3.8,z:-1.9,l:0,mk:[3.8,1.5,.6],yaw:Math.PI},{id:'world',tab:'world',label:'تفحّص مجسّم العالم',x:-4.5,z:3.3,l:0,mk:[-4.5,2.35,2.2],yaw:0},{id:'sanc',tab:'sanc',label:'ملف العقوبات والأزمات',x:7.3,z:3.4,l:0,mk:[7.9,1.6,3.4],yaw:Math.PI/2})}
 if(m==='hq'){
  aab(3.1,0,.8,6.1,.82,2.8,IC.dwood);T.map.q([3.15,.83,2.75],[6.05,.83,2.75],[6.05,.83,.85],[3.15,.83,.85],[0,1,0],.05,.05,.95,.95);
  scrZ('status',W-.13,-4.1,-2.5,1.25,2.55,true);scrZ('map',W-.13,-2.3,-.8,1.25,2.55,true,[.05,.05,.95,.95]);
  aab(-5.25,.72,-.1,-3.95,.8,3.3,IC.dwood);for(const z of[.5,1.6,2.7]){chair(-5.65,z,0,Math.PI/2,[.3,.14,.1]);chair(-3.55,z,0,-Math.PI/2,[.3,.14,.1])}
  desk(4.2,-2.8,0,2.2,.8);monitor(4.2,-2.9,0,true,'status');chair(4.2,-2.05,0,0);
  aab(-.3,0,-5.7,.7,1.15,-5.2,IC.metal);aab(-.2,1.15,-5.65,.6,1.3,-5.3,IC.scr);
  G.players.forEach((q,qi)=>flag(8.3,2.2+qi*.85,0,hexc(K[q.k].strong)));
  col[0].push([3.0,.7,6.2,2.9],[-5.95,-.3,-3.25,3.5],[3.05,-3.25,5.35,-2.35],[-.4,-5.8,.8,-5.1],[8.1,2,W,5.6]);
  hs.push({id:'ops',tab:'brief',label:'قف على خريطة غرفة العمليات',x:4.6,z:3.35,l:0,mk:[4.6,1.5,1.8],yaw:0},{id:'cab',tab:'cab',label:'اعقد مجلس الوزراء',x:-2.9,z:1.6,l:0,mk:[-4.6,1.6,1.6],yaw:-Math.PI/2},{id:'eco',tab:'eco',label:'راجع مكتب الخزانة',x:4.2,z:-1.75,l:0,mk:[4.2,1.8,-2.8],yaw:0},{id:'comm',tab:'comm',label:'ارفع سماعة الخط المؤمّن',x:.2,z:-4.5,l:0,mk:[.2,1.75,-5.45],yaw:0})}
 /* upper floor: minister office */
 const y=F;
 carpet(2,-4.6,6.4,-.4,y,mc);
 desk(4,-2.5,y,2.3,1.0);monitor(4,-2.3,y,false,'status');S.cyl(4.9,y+.78,-2.8,.08,.08,.35,5,IC.metal);S.cyl(4.9,y+1.13,-2.8,.15,.05,.12,6,[.95,.85,.5],true);
 chair(4,-3.45,y,Math.PI,[.22,.12,.08]);chair(3.4,-1.35,y,0,[.35,.3,.25]);chair(4.6,-1.35,y,0,[.35,.3,.25]);
 shelf(1,8,-5.62,y,2.4);flag(6.6,-4.5,y,acc);flag(7.3,-4.5,y,mc);
 sofa(-8.2,1.5,y,IC.fabric);aab(-7,y,.8,-5.9,y+.42,2.2,IC.dwood);plant(-8.3,5.2,y);plant(8.3,5.2,y);plant(8.3,-.5,y);
 scrZ('map',W-.13,-1.7,1.7,3.95,6.3,true,[.08,.04,.92,.96]);
 col[1].push([2.8,-3.05,5.2,-1.95],[1,-5.9,8,-5.35],[-8.7,.3,-7.7,2.7],[-7.05,.75,-5.85,2.25],[6.4,-4.7,7.6,-4.3],[8.0,4.9,W,5.5],[-8.6,4.9,-8,5.5],[8.0,-.8,W,-.2]);
 hs.push({id:'desk',label:'اجلس على المكتب',x:4,z:-3.45,l:1,mk:[4,y+1.9,-2.5],yaw:Math.PI,sit:true});
 hs.push({id:'window',label:'اطل من النافذة',x:0,z:4.9,l:1,mk:[0,y+1.6,5.6],yaw:Math.PI});
 hs.push({id:'up',label:'اطلع الدرج',x:-7.8,z:-4.9,l:0,mk:[-7.6,1.4,-4.9],yaw:Math.PI/2});
 hs.push({id:'down',label:'انزل الدرج',x:-.8,z:-4.9,l:1,mk:[-1.2,y+1.4,-4.9],yaw:-Math.PI/2});
 hs.push({id:'exit',label:'اخرج من المبنى',x:0,z:5.3,l:0,mk:[0,2.2,5.95],yaw:Math.PI});
 const Mk=new B();hs.forEach(h=>{const [x,yy,z]=h.mk;Mk.obox(x,yy,z,[.7071,0,.7071],[0,1,0],[-.7071,0,.7071],.16,.16,.16,[1,.8,.2]);Mk.cyl(x,yy-.25,z,0,.08,.17,4,[1,.8,.2],false)});
 const gl=V.gl;const out={solid:mkBuf(gl,S),lights:mkBuf(gl,Lt),marks:mkBuf(gl,Mk),tb:{},col,hs};
 for(const s in T)if(T[s].d.length)out.tb[s]=mkTBuf(T[s]);
 return out}
function freeInterior(){const I=V.int;RRI.leave();if(!I)return;const gl=V.gl;[I.solid,I.lights,I.marks,...Object.values(I.tb)].forEach(o=>freeBuf(gl,o));V.int=null}

/* ---------- interior textures ---------- */
function statusTex(){if(!V.int||!G)return;const m=V.int.m,pi=V.int.pi,p=G.players[pi];let L;
 const s=p.s;if(m==='hq')L=['القيادة الوطنية · '+p.name,'الاستقرار: '+s.stab+'%   ·   الجاهزية: '+READY[s.ready],'الخزينة: '+p.gold+'   ·   الدين: '+s.debt+'   ·   الوقود: '+s.fuel,'الطقس: '+G.wx.t+'   ·   الجولة '+G.round+' من '+G.maxRound];
 else if(m==='def')L=['غرفة العمليات · '+p.name,'صواريخ عادية: '+p.mis.n+'   ·   ثقيلة: '+p.mis.h,'الدفاع الجوي: '+(p.def?'مستوى '+p.def:'غير مفعّل')+'   ·   الكشف: '+detPct(p)+'%','الجاهزية: '+READY[s.ready]+'   ·   الوقود: '+s.fuel+'   ·   الجنود: '+owned(pi).reduce((s,i)=>s+G.reg[i].troops,0)];
 else if(m==='intel'){const r=p.report;L=['الاستخبارات · مستوى '+p.intel,...others(pi).slice(0,2).map(q=>s.threat[q]?'التهديد من '+K[G.players[q].k].short+': '+THREAT[s.threat[q].lvl]+' (ثقة '+s.threat[q].conf+'%)':''),'الجولة '+G.round+' من '+G.maxRound]}
 else{const ps=G.pacts.filter(x=>x.until>=G.round&&(x.a===pi||x.b===pi));L=['الخارجية · '+p.name,...(ps.length?ps.slice(0,3).map(x=>'معاهدة مع '+G.players[x.a===pi?x.b:x.a].name+' حتى الجولة '+x.until):['لا توجد معاهدات نشطة'])]}
 const sc=textCanvas(L,{bg:'#0E1C26',fg:'#A8E6FF',c1:'#FFFFFF',f1:58,f2:42,border:'#2B4A5C'});V.src.status=sc;V.tex.status=texFromCanvas(sc,V.tex.status);RRI.scrDirty=true}
function signTex(m,p){const sc=textCanvas([MNAMES[m],p.name],{w:1024,h:160,bg:'#3A2A1A',fg:'#F2D58A',c1:'#F7E3A8',f1:74,f2:40,border:'#C9A55A'});V.src.sign=sc;V.tex.sign=texFromCanvas(sc,V.tex.sign);RRI.scrDirty=true}
function renderWinTex(now){if(!V.int)return;const gl=V.gl,sp=V.int.spot;const e=[sp.x,sp.H+34,sp.z];const yaw=Math.atan2(-sp.x,sp.z)||0,pitch=-.3;
 const f=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
 gl.bindFramebuffer(gl.FRAMEBUFFER,V.fbo.fb);gl.viewport(0,0,V.fbo.w,V.fbo.h);gl.clearColor(.72,.85,.93,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const vp=mul(persp(.85,2,2,9000),lookAt(e,[e[0]+f[0],e[1]+f[1],e[2]+f[2]],[0,1,0]));worldDraw(vp,e,now);gl.bindFramebuffer(gl.FRAMEBUFFER,null)}

/* ---------- first-person movement ---------- */
function floorAt(x,z,l){if(x>=-7&&x<=-1.5&&z>=-5.85&&z<=-3.95){const y=Math.max(0,Math.min(3.4,(x+7)/5.5*3.4));return{y,l:y>1.7?1:0}}return{y:l*3.4,l}}
function blocked(x,z,l){const r=.3;for(const a of V.int.col[l])if(x>a[0]-r&&x<a[2]+r&&z>a[1]-r&&z<a[3]+r)return true;return false}
function fpGo(h,then){const fp=V.fp;const to=floorAt(h.x,h.z,h.l);fp.anim={fx:fp.x,fz:fp.z,fy:fp.y,fyaw:fp.yaw,fp:fp.pitch,tx:h.x,tz:h.z,ty:h.l*3.4,tyaw:h.yaw,tp:h.sit?-.28:-.08,tl:h.l,t:0,dur:.7,then,sit:!!h.sit}}
function fpStep(dt){const fp=V.fp;if(!fp)return;
 if(fp.anim){const a=fp.anim;a.t+=dt/a.dur;const u=Math.min(1,a.t),s=u*u*(3-2*u);let dy=a.tyaw-a.fyaw;while(dy>Math.PI)dy-=6.2832;while(dy<-Math.PI)dy+=6.2832;
  fp.x=a.fx+(a.tx-a.fx)*s;fp.z=a.fz+(a.tz-a.fz)*s;fp.y=a.fy+(a.ty-a.fy)*s;fp.yaw=a.fyaw+dy*s;fp.pitch=a.fp+(a.tp-a.fp)*s;fp.sit=a.sit&&u>.5;
  if(u>=1){fp.level=a.tl;fp.anim=null;if(a.then)a.then()}return}
 if(fp.sit)return;
 const k=V.keys;let fw=(k.w||k.arrowup?1:0)-(k.s||k.arrowdown?1:0)-V.joy.y,rt=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0)+V.joy.x;
 const mag=Math.hypot(fw,rt);if(mag>1){fw/=mag;rt/=mag}
 if(mag>.05){const sp=3.2*dt,c=Math.cos(fp.yaw),s=Math.sin(fp.yaw);const mx=(s*fw+c*rt)*sp,mz=(-c*fw+s*rt)*sp;
  const lx=floorAt(fp.x+mx,fp.z,fp.level).l;if(!blocked(fp.x+mx,fp.z,lx))fp.x+=mx;
  const lz=floorAt(fp.x,fp.z+mz,fp.level).l;if(!blocked(fp.x,fp.z+mz,lz))fp.z+=mz}
 const f=floorAt(fp.x,fp.z,fp.level);fp.y+=(f.y-fp.y)*Math.min(1,dt*14);fp.level=f.l;
 if(fp.level===0&&fp.z>6.3)exitBuilding()}
function nearestHS(){const fp=V.fp;if(!fp||!V.int||fp.anim)return null;let best=null,bd=1.9;V.int.hs.forEach(h=>{if(h.l!==fp.level)return;const d=Math.hypot(h.x-fp.x,h.z-fp.z);if(d<bd){bd=d;best=h}});return best}
function actHS(h){if(!h)return;const m=V.int.m;
 if(h.id==='exit'){exitBuilding();return}
 if(h.id==='up'){fpGo({x:-.8,z:-4.9,l:1,yaw:Math.PI/2});return}
 if(h.id==='down'){fpGo({x:-7.8,z:-4.9,l:0,yaw:-Math.PI/2});return}
 if(h.id==='desk'){fpGo(h,()=>openMinistry(m,V.int.pi,true));return}
 if(h.id==='window'){fpGo(h,()=>toTower());return}
 if(h.tab){fpGo(h,()=>openMinistry(m,V.int.pi,false,h.tab));return}}
function goTo(id){if(!V.int)return;const h=V.int.hs.find(x=>x.id===id);if(!h)return;
 if(id==='up'){V.fp.level=1;V.fp.y=3.4;fpGo({x:2,z:0,l:1,yaw:0});return}
 if(id==='down'){V.fp.level=0;V.fp.y=0;fpGo({x:0,z:3.6,l:0,yaw:0});return}
 if(h.l!==V.fp.level){V.fp.level=h.l;V.fp.y=h.l*3.4}
 actHS(h)}
function interiorFrame(dt,now){const gl=V.gl,cv=V.cv,w=cv.width,h=cv.height;
 if(V.winDirty||now-(V.winT||0)>2500){renderWinTex(now);V.winT=now;V.winDirty=false;if(RRI.active)RRI.winSync()}
 if(V.texDirty){statusTex();mapTexUpdate();V.texDirty=false}
 fpStep(dt);if(V.mode!=='interior')return;
 const fp=V.fp,I=V.int;const e=[fp.x,fp.y+(fp.sit?1.22:1.65),fp.z];
 const f=[Math.sin(fp.yaw)*Math.cos(fp.pitch),Math.sin(fp.pitch),-Math.cos(fp.yaw)*Math.cos(fp.pitch)];
 if(RRI.active){RRI.draw(e,[e[0]+f[0],e[1]+f[1],e[2]+f[2]],now,dt);V.ivp=RRI.R.vp;const hs2=nearestHS();const ab2=$('actBtn');if(hs2&&!fp.sit){ab2.textContent=hs2.label;ab2.style.display='';V.near=hs2}else{ab2.style.display='none';V.near=null}labelsUpdate(V.ivp,false);return}
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.clearColor(.78,.88,.95,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const vp=mul(persp(1.15,w/h,.05,400),lookAt(e,[e[0]+f[0],e[1]+f[1],e[2]+f[2]],[0,1,0]));V.ivp=vp;
 const pulse=.5+.5*Math.sin((now-V.t0)/250);
 useMain(vp,e,true);drawS(I.solid,[1.08,1.08,1.08],[.07,.07,.065]);drawS(I.lights,[1,1,1],[.55,.55,.5]);drawS(I.marks,[1,1,1],[.25+.35*pulse,.18+.25*pulse,0]);
 for(const s in I.tb)drawT(I.tb[s],V.tex[s],s==='sign'?.5:0,vp);
 const hs=nearestHS();const ab=$('actBtn');if(hs&&!fp.sit){ab.textContent=hs.label;ab.style.display='';V.near=hs}else{ab.style.display='none';V.near=null}
 labelsUpdate(vp,false)}

/* ---------- mode transitions ---------- */
function enterBuilding(m){if(!G||!V.ok)return;const pi=V.me,p=G.players[pi];if(!p||p.palace==null)return;
 if(V.mode==='world'&&!V3)return;freeInterior();
 V.int=buildInterior(m,p.k);V.int.m=m;V.int.pi=pi;const ms=minSpots(p.palace),prg=V.reg[p.palace];V.int.spot=ms[m]?{x:ms[m].x,z:ms[m].z,H:prg.H}:{x:prg.px,z:prg.pz-6,H:prg.H};RRI.enter(m,p);
 V.fp={x:0,z:4.7,y:0,level:0,yaw:0,pitch:-.04,sit:false,anim:null};V.joy={x:0,y:0};
 V.mode='interior';V.texDirty=true;V.winDirty=true;signTex(m,p);$('v3').classList.add('fp');
 $('hud').style.display='block';$('twHud').style.display='none';$('hint3').style.display='none';$('tip3').style.display='none';
 $('bName').textContent=MNAMES[m]+' · '+p.name;renderKingdom()}
function exitBuilding(){if(V.mode==='world')return;V.mode='world';$('v3').classList.remove('fp');V.joy={x:0,y:0};resetKnob();
 $('hud').style.display='none';$('twHud').style.display='none';$('hint3').style.display='';
 if(V.minOpen)closeDlg();freeInterior();if(!V.kmode)enterK(true);else kFocus();render()}
function toTower(){if(!V.int)return;const sp=V.int.spot;V.tw={e:[sp.x,sp.H+34,sp.z],yaw:Math.atan2(-sp.x,sp.z)||0,pitch:-.3,fov:.95};V.mode='tower';
 $('hud').style.display='none';$('twHud').style.display='flex';$('hint3').style.display='none'}
function backFromTower(){if(!V.int){V.mode='world';$('twHud').style.display='none';return}V.mode='interior';$('twHud').style.display='none';$('hud').style.display='block';
 const fp=V.fp;fp.x=0;fp.z=4.6;fp.level=1;fp.y=3.4;fp.yaw=Math.PI;fp.pitch=-.05;fp.sit=false;fp.anim=null}
function onAimStart(){if(!V3||!V.ok)return;if(V.mode==='interior'){V.mode='world';$('hud').style.display='none';$('hint3').style.display='';$('v3').classList.remove('fp');freeInterior()}
 if(V.mode==='world'){if(V.kmode){V.kmode=false;V.kb=null;$('kBtn').textContent='ادخل مملكتك';$('kBtn').classList.remove('sel');renderKingdom()}focus3D(0,20,V.cv.clientWidth<600?980:1060,0,.9)}}
function onMinClose(){if(V.fp&&V.fp.sit&&V.mode==='interior'){const fp=V.fp;fp.anim={fx:fp.x,fz:fp.z,fy:fp.y,fyaw:fp.yaw,fp:fp.pitch,tx:fp.x,tz:fp.z+.9,ty:fp.y,tyaw:fp.yaw,tp:-.05,tl:fp.level,t:0,dur:.5,sit:false}}}

/* ---------- input ---------- */
function resetKnob(){const k=$('knob');if(k)k.style.transform=''}
function busyClick(){if(!G)return true;if(G.aim)return true;if(G.phase==='move'||G.phase==='attack')return true;if(G.phase==='market'){const p=P();if(p&&(p.placing||p.reserve>0))return true}return false}
function initInput(cv){
 const tip=$('tip3');const cam=V.cam;
 cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);V.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),b:e.button,sh:e.shiftKey});if(V.mode==='world')V.anim=null;V.pd=0});
 cv.addEventListener('pointermove',e=>{const p=V.ptrs.get(e.pointerId);
  if(!p){if(V.mode==='interior')return;const r=pickRay(e.clientX,e.clientY);tip.textContent=infoText(r.i);tip.style.display=r.i<0?'none':'block';V.hover=r.i;return}
  const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(V.mode==='interior'){const fp=V.fp;if(!fp||fp.anim)return;fp.yaw+=dx*.005;fp.pitch=Math.max(-1.2,Math.min(1.2,fp.pitch-dy*.005));return}
  if(V.mode==='tower'){const tw=V.tw;tw.yaw-=dx*.004;tw.pitch=Math.max(-1.3,Math.min(.4,tw.pitch+dy*.004));return}
  if(V.ptrs.size===1){
   if(p.b===2||p.b===1||p.sh){const k=cam.dist*.0017,c=Math.cos(cam.th),s=Math.sin(cam.th);cam.tx+=-dx*k*c-dy*k*s;cam.tz+=dx*k*s-dy*k*c}
   else{cam.th-=dx*.006;cam.ph=Math.max(.25,Math.min(1.38,cam.ph-dy*.005))}}
  else if(V.ptrs.size===2){const q=[...V.ptrs.values()];const nd=Math.hypot(q[0].x-q[1].x,q[0].y-q[1].y);if(V.pd&&nd>0)cam.dist=Math.max(200,Math.min(1500,cam.dist*V.pd/nd));V.pd=nd}
  V.clampCam()});
 const up=e=>{const p=V.ptrs.get(e.pointerId);V.ptrs.delete(e.pointerId);V.pd=0;if(!p)return;
  const click=e.type==='pointerup'&&p.b===0&&!p.sh&&Math.hypot(e.clientX-p.sx,e.clientY-p.sy)<7&&performance.now()-p.t<600;if(!click)return;
  if(V.mode==='interior'){interiorTap(e.clientX,e.clientY);return}
  const r=pickRay(e.clientX,e.clientY);if(r.i<0)return;
  if(V.mode==='world'&&V.kmode&&G&&!busyClick()&&G.players[V.me].palace===r.i){const ms=minSpots(r.i);for(const m in ms)if(Math.hypot(r.x-ms[m].x,r.z-ms[m].z)<15){enterBuilding(m);return}const prg=V.reg[r.i];if(Math.hypot(r.x-prg.px,r.z-(prg.pz-6))<17){enterBuilding('hq');return}}
  onRegion(r.i);V.sel=r.i;tip.textContent=infoText(r.i);tip.style.display='block'};
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 cv.addEventListener('pointerleave',()=>{if(V.mode==='interior')return;if(V.sel>=0){tip.textContent=infoText(V.sel);tip.style.display='block'}else tip.style.display='none'});
 cv.addEventListener('wheel',e=>{e.preventDefault();if(V.mode==='tower'){V.tw.fov=Math.max(.35,Math.min(1.2,V.tw.fov*Math.exp(e.deltaY*.001)));return}if(V.mode!=='world')return;cam.dist=Math.max(200,Math.min(1500,cam.dist*Math.exp(e.deltaY*.0012)));V.anim=null;V.clampCam()},{passive:false});
 /* joystick */
 const joy=$('joy'),knob=$('knob');let jid=null;
 const jset=e=>{const r=joy.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}V.joy={x,y};knob.style.transform='translate('+(x*35)+'px,'+(y*35)+'px)'};
 joy.addEventListener('pointerdown',e=>{e.stopPropagation();jid=e.pointerId;joy.setPointerCapture(jid);jset(e)});
 joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)jset(e)});
 const jend=e=>{if(e.pointerId!==jid)return;jid=null;V.joy={x:0,y:0};resetKnob()};joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
 $('actBtn').onclick=()=>actHS(V.near);
 document.querySelectorAll('#hudTop [data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go;if(g==='exit')exitBuilding();else if(g==='ops'){const h=V.int&&V.int.hs.find(x=>x.id==='ops');if(h){if(V.fp.level!==0){V.fp.level=0;V.fp.y=0}actHS(h)}}else goTo(g)});
 $('twBack').onclick=backFromTower;
 const typing=e=>/input|select|textarea/i.test(e.target.tagName);
 window.addEventListener('keydown',e=>{if(V.mode!=='interior'||typing(e))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){V.keys[k]=true;e.preventDefault()}if(k==='e'||k==='enter'){if(V.near)actHS(V.near)}});
 window.addEventListener('keyup',e=>{V.keys[e.key.toLowerCase()]=false});
 window.addEventListener('blur',()=>{V.keys={}})}
function interiorTap(cx,cy){const vp=V.ivp;if(!vp||!V.int||V.fp.anim)return;const rc=V.cv.getBoundingClientRect();let best=null,bd=70;
 V.int.hs.forEach(h=>{if(h.l!==V.fp.level)return;const p=h.mk;const x=vp[0]*p[0]+vp[4]*p[1]+vp[8]*p[2]+vp[12],y=vp[1]*p[0]+vp[5]*p[1]+vp[9]*p[2]+vp[13],w=vp[3]*p[0]+vp[7]*p[1]+vp[11]*p[2]+vp[15];if(w<=0)return;
  const sx=rc.left+(x/w+1)/2*rc.width,sy=rc.top+(1-y/w)/2*rc.height;const d=Math.hypot(sx-cx,sy-cy);if(d<bd){bd=d;best=h}});
 if(best)actHS(best)}
function initExtra(){initTexProg();initInput(V.cv);
 V.mlab={};['hq','def','intel','foreign'].forEach(m=>{const d=document.createElement('div');d.className='lab3 mlab';d.innerHTML='<b>'+MNAMES[m]+'</b><span>اضغط للدخول</span>';d.style.display='none';$('labs').appendChild(d);V.mlab[m]=d})}
