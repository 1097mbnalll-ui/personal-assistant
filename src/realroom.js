/* ===== Realistic WWII-style interior: glue between the game and the RR renderer (separate canvas) ===== */
const RRI={active:false,ok:null,R:null,cv:null,sc:null,scrDirty:true,tier:0,fr:[],last:0,sz:'',scrCv:null,px:null,err:null};
RRI.mcol={def:[.38,.44,.32],intel:[.20,.26,.44],foreign:[.50,.16,.18]};
RRI.init=function(){if(RRI.ok!==null)return RRI.ok;
 try{const cv=document.createElement('canvas');cv.id='rr';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;display:none;pointer-events:none';
  $('v3').insertBefore(cv,$('labs'));RRI.cv=cv;
  const big=Math.min(screen.width,innerWidth)>=900;RR.setK(big?2:1);
  const dp=Math.min(window.devicePixelRatio||1,2);RRI.R=RR.create(cv,{ss:dp<1.5&&big?1.5:1,sm:big?4096:2048});if(!big)RRI.R.q.ao=false;
  RRI.R.setAtlas(RR.atlas(RR.THEMES.bld.atlas));RRI.ok=true}
 catch(e){RRI.ok=false;RRI.err=e&&e.message}
 return RRI.ok};
RRI.vis=function(on){if(RRI.cv&&RRI.vOn!==on){RRI.cv.style.display=on?'block':'none';RRI.vOn=on}};
RRI.size=function(){const v=$('v3'),w=v.clientWidth,h=v.clientHeight;if(!w||!h)return;const dp=Math.min(window.devicePixelRatio||1,2)*(RRI.tier>=2?.7:1);const W=Math.round(w*dp),H=Math.round(h*dp);const key=W+'x'+H+'/'+RRI.tier;if(key===RRI.sz)return;RRI.sz=key;
 const ss=RRI.tier>=1?1:(dp<1.5&&Math.min(screen.width,innerWidth)>=900?1.5:1);RRI.R.resize(W,H,ss)};
RRI.enter=function(m,p){RRI.leave();if(!RRI.init())return false;
 try{const R=RRI.R,gl=R.gl;const flags=G.players.map(q=>hexc(K[q.k].strong));
  const o=RR.building(m,{acc:hexc(K[p.k].strong),mc:RRI.mcol[m],flags,hs:V.int.hs});const sc=o.scene;sc.cast=R.buf(o.A);sc.nc=R.buf(o.N);
  const mkb=a=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,a,gl.STATIC_DRAW);return{b,n:a.length/4}};
  sc.rays=mkb(sc.rayArr);sc.dust=mkb(sc.dustArr);RRI.sc=sc;RRI.sz='';RRI.scrDirty=true;RRI.fr=[];RRI.last=0;RRI.winStamp=-1;RRI.active=true;RRI.size();return true}
 catch(e){RRI.active=false;RRI.err=e&&e.message;return false}};
RRI.leave=function(){if(RRI.sc&&RRI.R){const gl=RRI.R.gl;for(const k of['cast','nc','rays','dust'])if(RRI.sc[k])gl.deleteBuffer(RRI.sc[k].b);}RRI.sc=null;RRI.active=false;RRI.vis(false)};
RRI.winSync=function(){try{const gl=V.gl,f=V.fbo;if(!f)return;const n=f.w*f.h*4;if(!RRI.px||RRI.px.length!==n)RRI.px=new Uint8Array(n);gl.bindFramebuffer(gl.FRAMEBUFFER,f.fb);gl.readPixels(0,0,f.w,f.h,gl.RGBA,gl.UNSIGNED_BYTE,RRI.px);gl.bindFramebuffer(gl.FRAMEBUFFER,null);RRI.R.setWin(f.w,f.h,RRI.px)}catch(e){}};
RRI.scrCompose=function(){const c=RRI.scrCv||(RRI.scrCv=document.createElement('canvas'));c.width=c.height=2048;const x=c.getContext('2d');x.fillStyle='#10202a';x.fillRect(0,0,2048,2048);
 const S=RR.SCRSLOT;for(const k of['status','sign','map'])if(V.src[k])x.drawImage(V.src[k],S[k].x,S[k].y,S[k].w,S[k].h);RRI.R.setScr(c);RRI.scrDirty=false};
RRI.tune=function(){RRI.tier++;const R=RRI.R;if(RRI.tier>=1){R.q.refl=false;R.q.ao=false}RRI.sz=''};
RRI.draw=function(e,t,now,dt){const R=RRI.R;if(!R||!RRI.sc)return;RRI.vis(true);RRI.size();if(RRI.scrDirty)RRI.scrCompose();
 R.render(RRI.sc,{e,t,fov:1.15,near:.06});
 if(RRI.last){const d=now-RRI.last;RRI.fr.push(d);if(RRI.fr.length>50)RRI.fr.shift();if(RRI.fr.length>=40&&RRI.tier<3){const a=RRI.fr.reduce((s,v)=>s+v,0)/RRI.fr.length;if(a>42){RRI.fr=[];if(RRI.tier===0){R.q.ao=false}else if(RRI.tier===1){R.q.refl=false}RRI.tier++;RRI.sz=''}}}
 RRI.last=now};
