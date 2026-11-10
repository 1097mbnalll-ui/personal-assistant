/* Realistic room renderer: triplanar procedural textures, shadow-mapped sun + spot, point lights, ACES */
const RR={};
(function(){
const S=512,AT=2048;let K=2;RR.setK=v=>{K=v};
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function wrapRect(x,px,py,w,h){for(const dx of[-S,0,S])for(const dy of[-S,0,S])x.fillRect(px+dx,py+dy,w,h)}
function speck(x,r,n,size,cols,alpha){for(let i=0;i<n;i++){const c=cols[Math.floor(r()*cols.length)];x.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${alpha*(0.3+r()*.7)})`;const s=size*(0.4+r());wrapRect(x,r()*S,r()*S,s,s)}}
function blurTile(x,px){const P=S*K;const t=document.createElement('canvas');t.width=t.height=P*3;const y=t.getContext('2d');for(let i=0;i<3;i++)for(let j=0;j<3;j++)y.drawImage(x.canvas,0,0,P,P,i*P,j*P,P,P);
 const u=document.createElement('canvas');u.width=u.height=P*3;const z=u.getContext('2d');z.filter=`blur(${px*K}px)`;z.drawImage(t,0,0);x.save();x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,P,P);x.drawImage(u,P,P,P,P,0,0,P,P);x.restore()}
function tileCanvas(){const c=document.createElement('canvas');c.width=c.height=S*K;const g=c.getContext('2d');g.scale(K,K);return g}
function grain(x,r,base,dark,light,lines,wav){x.fillStyle=base;x.fillRect(0,0,S,S);
 x.globalAlpha=1;for(let i=0;i<lines;i++){const y0=r()*S,amp=2+r()*wav,ph=r()*6.28,fr=(1+Math.floor(r()*3))*2*Math.PI/S;x.strokeStyle=r()<.5?dark:light;x.globalAlpha=.06+r()*.16;x.lineWidth=.6+r()*1.6;x.beginPath();
  for(let X=0;X<=S;X+=8){const Y=y0+Math.sin(X*fr+ph)*amp;X?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();x.save();x.translate(0,y0<S/2?S:-S);x.stroke();x.restore()}x.globalAlpha=1}
const TILES={};
TILES.parquet=(x,r,o)=>{const pw=64,pl=256;for(let row=0;row<S/pw;row++){const off=(row%2)*pl/2;for(let k=-1;k<S/pl+1;k++){const px=k*pl+off,t=r();
   const c=o.wood.map(v=>Math.round(v*(0.82+t*.32)));x.fillStyle=`rgb(${c})`;x.fillRect(px,row*pw,pl,pw);
   for(let g=0;g<7;g++){x.strokeStyle=`rgba(${c.map(v=>v*.7|0)},.35)`;x.lineWidth=1+r()*1.5;x.beginPath();const yy=row*pw+r()*pw;x.moveTo(px,yy);x.bezierCurveTo(px+pl*.3,yy+(r()-.5)*10,px+pl*.6,yy+(r()-.5)*10,px+pl,yy+(r()-.5)*6);x.stroke()}
   x.fillStyle='rgba(30,18,10,.55)';x.fillRect(px,row*pw,2,pw);x.fillRect(px,row*pw,pl,2)}}speck(x,r,900,2,[[0,0,0],[255,255,255]],.05)};
TILES.wood=(x,r,o)=>{grain(x,r,`rgb(${o.dwood})`,'rgba(20,10,5,1)','rgba(255,220,180,1)',70,6);speck(x,r,500,2,[[0,0,0]],.06)};
TILES.lwood=(x,r,o)=>{grain(x,r,`rgb(${o.lwood})`,'rgba(110,70,40,1)','rgba(255,240,215,1)',60,4)};
TILES.marble=(x,r)=>{x.fillStyle='#ECEAE5';x.fillRect(0,0,S,S);speck(x,r,2500,6,[[200,198,195],[255,255,255]],.25);blurTile(x,3);
 for(let i=0;i<14;i++){x.strokeStyle=`rgba(120,115,110,${.12+r()*.25})`;x.lineWidth=.5+r()*2;x.beginPath();let px=r()*S,py=r()*S;x.moveTo(px,py);for(let k=0;k<12;k++){px+=(r()-.3)*60;py+=(r()-.5)*60;x.lineTo(px,py)}x.stroke()}};
TILES.plaster=(x,r)=>{x.fillStyle='#E8E4DC';x.fillRect(0,0,S,S);speck(x,r,6000,5,[[200,195,188],[255,255,255]],.18);blurTile(x,2.2);speck(x,r,3000,1.5,[[180,175,168]],.08)};
TILES.rug=(x,r,o)=>{const a=`rgb(${o.rugA})`,b=`rgb(${o.rugB})`,c=`rgb(${o.rugC})`;x.fillStyle=a;x.fillRect(0,0,S,S);
 const band=(m,w,col)=>{x.strokeStyle=col;x.lineWidth=w;x.strokeRect(m,m,S-2*m,S-2*m)};band(8,10,c);band(24,4,b);band(40,22,c);band(40,2,b);band(62,2,b);band(70,3,b);
 for(let i=0;i<4;i++){x.save();x.translate(S/2,S/2);x.rotate(i*Math.PI/2);for(let k=-6;k<=6;k++){x.fillStyle=k%2?b:a;x.beginPath();x.arc(k*30,-(S/2-51),6,0,6.29);x.fill()}x.restore()}
 x.save();x.translate(S/2,S/2);for(let rr=150;rr>10;rr-=18){x.fillStyle=(rr/18|0)%2?c:a;x.beginPath();for(let k=0;k<=16;k++){const ang=k/16*6.283,q=rr*(k%2?.82:1);x.lineTo(Math.cos(ang)*q,Math.sin(ang)*q*.8)}x.fill();x.strokeStyle=b;x.lineWidth=1.5;x.stroke()}x.restore();
 for(let k=0;k<160;k++){const px=90+r()*(S-180),py=90+r()*(S-180);if(Math.hypot(px-S/2,(py-S/2)/.8)<160)continue;x.fillStyle=r()<.5?b:c;x.globalAlpha=.7;x.beginPath();x.ellipse(px,py,4+r()*6,2+r()*3,r()*3,0,6.29);x.fill()}x.globalAlpha=1;
 speck(x,r,30000,1.6,[[0,0,0],[255,255,255]],.12);blurTile(x,.6);speck(x,r,8000,1,[[0,0,0]],.10)};
TILES.carpet=(x,r,o)=>{x.fillStyle=`rgb(${o.carpet})`;x.fillRect(0,0,S,S);speck(x,r,20000,2,[[0,0,0],[255,255,255]],.10);blurTile(x,.7);speck(x,r,8000,1.2,[[0,0,0]],.08)};
TILES.leather=(x,r,o)=>{x.fillStyle=`rgb(${o.leather})`;x.fillRect(0,0,S,S);speck(x,r,9000,4,[[0,0,0],[255,230,210]],.045);blurTile(x,2);
 for(let i=0;i<60;i++){x.strokeStyle=`rgba(0,0,0,${.06+r()*.1})`;x.lineWidth=1;x.beginPath();const px=r()*S,py=r()*S;x.moveTo(px,py);x.quadraticCurveTo(px+r()*30,py+r()*20,px+r()*50,py+(r()-.5)*30);x.stroke()}};
TILES.fabric=(x,r,o)=>{x.fillStyle=`rgb(${o.fabric})`;x.fillRect(0,0,S,S);for(let i=0;i<S;i+=4){x.fillStyle=`rgba(0,0,0,${.05+r()*.05})`;x.fillRect(i,0,2,S);x.fillStyle=`rgba(255,255,255,${.03+r()*.04})`;x.fillRect(0,i,S,2)}speck(x,r,4000,3,[[0,0,0],[255,255,255]],.06)};
TILES.metal=(x,r,o)=>{x.fillStyle=`rgb(${o.metal})`;x.fillRect(0,0,S,S);for(let i=0;i<1600;i++){x.fillStyle=`rgba(${r()<.5?'0,0,0':'255,255,255'},${.03+r()*.06})`;wrapRect(x,r()*S,r()*S,40+r()*200,1)}};
TILES.panel=(x,r,o)=>{x.fillStyle=`rgb(${o.panel})`;x.fillRect(0,0,S,S);speck(x,r,3000,4,[[0,0,0],[255,255,255]],.05);blurTile(x,1.5);
 x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=4;x.strokeRect(2,2,S-4,S/2-4);x.strokeRect(2,S/2+2,S/2-4,S/2-4);x.strokeRect(S/2+2,S/2+2,S/2-4,S/2-4);x.strokeStyle='rgba(255,255,255,.12)';x.lineWidth=2;x.strokeRect(6,6,S-12,S/2-12);
 x.fillStyle='rgba(0,0,0,.5)';for(const[a,b]of[[20,20],[S-20,20],[20,S/2-20],[S-20,S/2-20]]){x.beginPath();x.arc(a,b,5,0,6.29);x.fill()}};
TILES.concrete=(x,r,o)=>{x.fillStyle=`rgb(${o.concrete})`;x.fillRect(0,0,S,S);speck(x,r,9000,6,[[0,0,0],[255,255,255]],.10);blurTile(x,2);speck(x,r,500,3,[[40,40,40]],.25)};
TILES.books=(x,r)=>{x.fillStyle='#2a1c12';x.fillRect(0,0,S,S);let X=0;const cols=[[120,30,25],[30,55,95],[40,80,45],[150,120,50],[80,50,90],[60,40,30],[170,160,140],[25,25,30]];
 while(X<S){const w=10+r()*22,h=S*(.75+r()*.25);const c=cols[Math.floor(r()*cols.length)].map(v=>v*(.75+r()*.45)|0);x.fillStyle=`rgb(${c})`;x.fillRect(X,S-h,w-1,h);
  x.fillStyle='rgba(230,200,120,.6)';x.fillRect(X+2,S-h+20,w-5,3);x.fillRect(X+2,S-30,w-5,3);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(X+w-3,S-h,2,h);X+=w}};
TILES.map=(x,r,o)=>{if(o.mapStyle==='paper'){x.fillStyle='#DCCB9F';x.fillRect(0,0,S,S);speck(x,r,3000,8,[[160,130,80],[255,250,230]],.15);blurTile(x,4)}else{x.fillStyle=o.mapStyle==='holo'?'#03121c':'#0f1d2a';x.fillRect(0,0,S,S)}
 const ln=o.mapStyle==='paper'?'rgba(70,50,30,.8)':o.mapStyle==='holo'?'rgba(0,240,255,.9)':'rgba(140,220,255,.85)';
 x.strokeStyle=ln;x.lineWidth=3;x.beginPath();for(let k=0;k<40;k++){const a=k/40*6.283,rr=180+Math.sin(k*1.7)*30+r()*25;const px=S/2+Math.cos(a)*rr,py=S/2+Math.sin(a)*rr*.9;k?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();
 if(o.mapStyle==='paper'){x.fillStyle='rgba(170,150,100,.4)';x.fill()}x.stroke();x.lineWidth=1.5;
 for(let k=0;k<9;k++){x.beginPath();x.moveTo(S/2,S/2);x.lineTo(S/2+Math.cos(k)*200,S/2+Math.sin(k*1.3)*170);x.stroke()}
 x.globalAlpha=.35;for(let g=0;g<S;g+=32){x.beginPath();x.moveTo(g,0);x.lineTo(g,S);x.moveTo(0,g);x.lineTo(S,g);x.stroke()}x.globalAlpha=1;
 const pin=o.mapStyle==='paper'?['#B3261E','#1F3A6B']:['#ff3b6b','#ffd34d'];for(let k=0;k<14;k++){x.fillStyle=pin[k%2];x.beginPath();x.arc(80+r()*350,80+r()*350,7,0,6.29);x.fill()}};
TILES.paint=(x,r)=>{const g=x.createLinearGradient(0,0,0,S);g.addColorStop(0,'#8fa6b8');g.addColorStop(.55,'#e2c89a');g.addColorStop(1,'#5d6b3c');x.fillStyle=g;x.fillRect(0,0,S,S);
 x.fillStyle='#3c4a2c';x.beginPath();x.moveTo(0,S*.62);for(let X=0;X<=S;X+=16)x.lineTo(X,S*.58-Math.sin(X*.02)*30-r()*12);x.lineTo(S,S);x.lineTo(0,S);x.fill();speck(x,r,4000,6,[[0,0,0],[255,255,255]],.08);blurTile(x,1.2)};
TILES.view=(x,r,o)=>{const g=x.createLinearGradient(0,0,0,S);o.sky.forEach((c,i)=>g.addColorStop(i/(o.sky.length-1),c));x.fillStyle=g;x.fillRect(0,0,S,S);
 if(o.view==='town'){const hz=S*.58;for(let l=0;l<3;l++){x.fillStyle=['rgba(150,160,150,.55)','rgba(120,135,110,.75)','rgba(95,110,80,.95)'][l];x.beginPath();x.moveTo(0,S);for(let X=0;X<=S;X+=6)x.lineTo(X,hz-30+l*18-Math.sin(X*.011+l*2)*18-Math.sin(X*.037+l)*7);x.lineTo(S,S);x.fill()}
  for(let k=0;k<70;k++){const w=12+r()*26,h=10+r()*22,px=r()*S,py=hz+10+r()*60;const wall=[[205,190,165],[190,170,140],[215,205,185],[175,150,120]][k%4];x.fillStyle=`rgb(${wall})`;x.fillRect(px,py-h,w,h);
   x.fillStyle=['#7a3b2a','#6a3324','#5a5050','#84452e'][k%4];x.beginPath();x.moveTo(px-2,py-h);x.lineTo(px+w*.5,py-h-8-r()*6);x.lineTo(px+w+2,py-h);x.fill();x.fillStyle='rgba(40,40,50,.6)';for(let q=0;q<2;q++)x.fillRect(px+3+q*w*.45,py-h*.6,3,4)}
  x.fillStyle='#b8b0a0';x.fillRect(S*.62,hz-60,10,52);x.beginPath();x.moveTo(S*.62-2,hz-60);x.lineTo(S*.62+5,hz-85);x.lineTo(S*.62+12,hz-60);x.fill();
  for(let k=0;k<40;k++){x.fillStyle=`rgba(${50+r()*30|0},${80+r()*30|0},${40+r()*20|0},.9)`;x.beginPath();x.arc(r()*S,hz+60+r()*120,6+r()*10,0,6.29);x.fill()}
  x.fillStyle='#6d7a4c';x.fillRect(0,hz+150,S,S);x.fillStyle='rgba(255,250,235,.5)';for(let k=0;k<5;k++){x.beginPath();x.ellipse(r()*S,40+r()*120,50+r()*60,10+r()*8,0,0,6.29);x.fill()}blurTile(x,.8)}
 if(o.view==='city'){for(let k=0;k<40;k++){const w=18+r()*36,h=40+r()*260,px=r()*S;const t=150+r()*60|0;x.fillStyle=`rgb(${t-20},${t-5},${t+10})`;x.fillRect(px,S*.75-h,w,h);
   x.fillStyle='rgba(255,255,255,.35)';for(let yy=S*.75-h+6;yy<S*.75;yy+=8)x.fillRect(px+2,yy,w-4,3)}x.fillStyle='#7f8f98';x.fillRect(0,S*.75,S,S)}
 if(o.view==='neon'){for(let k=0;k<45;k++){const w=14+r()*34,h=60+r()*320,px=r()*S;x.fillStyle=`rgb(${10+r()*20|0},${12+r()*20|0},${30+r()*30|0})`;x.fillRect(px,S*.8-h,w,h);
   for(let yy=S*.8-h+5;yy<S*.8;yy+=7)if(r()<.5){x.fillStyle=r()<.5?'rgba(0,240,255,.8)':'rgba(255,60,200,.7)';x.fillRect(px+2+r()*(w-8),yy,4,2)}}
  x.fillStyle='#05060c';x.fillRect(0,S*.8,S,S);x.fillStyle='rgba(255,255,255,.9)';for(let k=0;k<80;k++)x.fillRect(r()*S,r()*S*.35,1.5,1.5)}};
TILES.screen=(x,r,o)=>{x.fillStyle=o.scrBg;x.fillRect(0,0,S,S);x.fillStyle=o.scrFg;x.globalAlpha=.9;x.fillRect(20,20,S-40,40);x.globalAlpha=.6;
 for(let k=0;k<6;k++){const h=40+r()*160;x.fillRect(40+k*70,S-60-h,40,h)}x.strokeStyle=o.scrFg;x.lineWidth=3;x.beginPath();for(let X=30;X<S-30;X+=20){const Y=150+Math.sin(X*.03)*40+r()*20;X>30?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();x.globalAlpha=1};
TILES.brass=(x,r)=>{x.fillStyle='#B48A3C';x.fillRect(0,0,S,S);speck(x,r,3000,8,[[90,60,20],[255,230,150]],.15);blurTile(x,4)};
const ORDER=['parquet','wood','lwood','marble','plaster','rug','carpet','leather','fabric','metal','panel','concrete','books','map','view','screen'];
function fine(x,r,dark,light,n,lw){for(let i=0;i<n;i++){const y0=r()*S,amp=1+r()*3,ph=r()*6.28,fr=(1+Math.floor(r()*4))*2*Math.PI/S;x.strokeStyle=r()<.55?dark:light;x.globalAlpha=.03+r()*.07;x.lineWidth=lw*(.5+r());x.beginPath();
  for(let X=0;X<=S;X+=6){const Y=y0+Math.sin(X*fr+ph)*amp;X?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();x.save();x.translate(0,y0<S/2?S:-S);x.stroke();x.restore()}x.globalAlpha=1}
const DETAIL={
 parquet:(x,r)=>{fine(x,r,'rgba(25,12,5,1)','rgba(255,225,185,1)',700,.4);speck(x,r,60000,.6,[[0,0,0],[255,240,210]],.06);
  for(let i=0;i<40;i++){x.strokeStyle='rgba(255,235,200,.10)';x.lineWidth=.4;x.beginPath();const px=r()*S,py=r()*S;x.moveTo(px,py);x.lineTo(px+(r()-.5)*90,py+(r()-.5)*90);x.stroke()}},
 wood:(x,r)=>{fine(x,r,'rgba(20,8,3,1)','rgba(255,220,180,1)',800,.4);speck(x,r,50000,.6,[[0,0,0],[255,235,205]],.05)},
 lwood:(x,r)=>{fine(x,r,'rgba(100,60,30,1)','rgba(255,245,225,1)',700,.4);speck(x,r,40000,.6,[[0,0,0]],.04)},
 plaster:(x,r)=>{speck(x,r,90000,.6,[[150,145,138],[255,255,255]],.08)},
 leather:(x,r)=>{speck(x,r,70000,.6,[[0,0,0],[255,225,200]],.07);
  for(let i=0;i<420;i++){x.strokeStyle='rgba(0,0,0,.10)';x.lineWidth=.35;x.beginPath();const px=r()*S,py=r()*S;x.moveTo(px,py);x.lineTo(px+(r()-.5)*14,py+(r()-.5)*14);x.lineTo(px+(r()-.5)*14,py+(r()-.5)*14);x.stroke()}},
 fabric:(x,r)=>{for(let i=0;i<S;i+=2){x.fillStyle=`rgba(0,0,0,${.03+r()*.05})`;x.fillRect(i,0,1,S);x.fillStyle=`rgba(255,255,255,${.02+r()*.04})`;x.fillRect(0,i,S,1)}speck(x,r,40000,.6,[[0,0,0],[255,255,255]],.06)},
 rug:(x,r)=>{for(let i=0;i<S;i+=1.5){x.fillStyle=`rgba(0,0,0,${.03+r()*.05})`;x.fillRect(i,0,.7,S)}speck(x,r,80000,.6,[[0,0,0],[255,255,255]],.08)},
 carpet:(x,r)=>{speck(x,r,80000,.6,[[0,0,0],[255,255,255]],.08)},
 metal:(x,r)=>{for(let i=0;i<2600;i++){x.fillStyle=`rgba(${r()<.5?'0,0,0':'255,255,255'},${.03+r()*.06})`;wrapRect(x,r()*S,r()*S,10+r()*120,.5)}speck(x,r,2000,1.4,[[40,30,15],[255,240,200]],.10)},
 concrete:(x,r)=>{speck(x,r,70000,.6,[[0,0,0],[255,255,255]],.09)},
 marble:(x,r)=>{speck(x,r,40000,.6,[[150,148,145],[255,255,255]],.08)},
 panel:(x,r)=>{speck(x,r,40000,.6,[[0,0,0],[255,255,255]],.06)}
};
function atlas(o){const c=document.createElement('canvas');c.width=c.height=AT*K;const x=c.getContext('2d');
 ORDER.forEach((k,i)=>{const t=tileCanvas();const kk=(o.over&&o.over[k])||k;TILES[kk](t,rng(100+i),o);if(DETAIL[kk])DETAIL[kk](t,rng(900+i));x.drawImage(t.canvas,(i%4)*S*K,Math.floor(i/4)*S*K)});return c}
const MT={};ORDER.forEach((k,i)=>MT[k]=[i%4,Math.floor(i/4)]);
RR.atlas=atlas;RR.MT=MT;
/* ---------- geometry ---------- */
class GB{constructor(){this.d=[]}
 v(p,n,c,m,e,uv){this.d.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],m[0],m[1],m[2],m[3],e,uv?uv[0]:-1,uv?uv[1]:0)}
 q(a,b,c,d,n,col,m,e,uvs){this.v(a,n,col,m,e,uvs&&uvs[0]);this.v(b,n,col,m,e,uvs&&uvs[1]);this.v(c,n,col,m,e,uvs&&uvs[2]);this.v(a,n,col,m,e,uvs&&uvs[0]);this.v(c,n,col,m,e,uvs&&uvs[2]);this.v(d,n,col,m,e,uvs&&uvs[3])}
 box(x0,y0,z0,x1,y1,z1,M,col,e){const m=M,c=col||[1,1,1];e=e||0;
  this.q([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],c,m,e);this.q([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],c,m,e);
  this.q([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],c,m,e);this.q([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],c,m,e);
  this.q([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],c,m,e);this.q([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],c,m,e)}
 rbox(cx,cy,cz,sx,sy,sz,ry,M,col,e){const C=Math.cos(ry),Sn=Math.sin(ry);const R=(x,y,z)=>[cx+x*C+z*Sn,cy+y,cz-x*Sn+z*C];const Rn=(x,y,z)=>[x*C+z*Sn,y,-x*Sn+z*C];const h=[sx/2,sy/2,sz/2],c=col||[1,1,1];e=e||0;
  const F=(n,u,w)=>{const P=(a,b)=>R(n[0]*h[0]+u[0]*a+w[0]*b,n[1]*h[1]+u[1]*a+w[1]*b,n[2]*h[2]+u[2]*a+w[2]*b);const hu=Math.abs(u[0])*h[0]+Math.abs(u[1])*h[1]+Math.abs(u[2])*h[2],hw=Math.abs(w[0])*h[0]+Math.abs(w[1])*h[1]+Math.abs(w[2])*h[2];
   this.q(P(-hu,-hw),P(hu,-hw),P(hu,hw),P(-hu,hw),Rn(...n),c,M,e)};
  F([0,0,1],[1,0,0],[0,1,0]);F([0,0,-1],[-1,0,0],[0,1,0]);F([1,0,0],[0,0,-1],[0,1,0]);F([-1,0,0],[0,0,1],[0,1,0]);F([0,1,0],[1,0,0],[0,0,-1]);F([0,-1,0],[1,0,0],[0,0,1])}
 cyl(cx,y0,cz,r0,r1,h,seg,M,col,e,caps){const c=col||[1,1,1];e=e||0;for(let i=0;i<seg;i++){const a0=i/seg*6.2832,a1=(i+1)/seg*6.2832;
  const p=(a,r,y)=>[cx+Math.cos(a)*r,y0+y,cz+Math.sin(a)*r];const sl=(r0-r1)/h;const n0=[Math.cos(a0),sl,Math.sin(a0)],n1=[Math.cos(a1),sl,Math.sin(a1)];const nn=v=>{const l=Math.hypot(...v);return v.map(q=>q/l)};
  const A=p(a0,r0,0),B=p(a1,r0,0),Cc=p(a1,r1,h),D=p(a0,r1,h);this.v(A,nn(n0),c,M,e);this.v(B,nn(n1),c,M,e);this.v(Cc,nn(n1),c,M,e);this.v(A,nn(n0),c,M,e);this.v(Cc,nn(n1),c,M,e);this.v(D,nn(n0),c,M,e);
  if(caps){if(r1>0){this.v([cx,y0+h,cz],[0,1,0],c,M,e);this.v(D,[0,1,0],c,M,e);this.v(Cc,[0,1,0],c,M,e)}if(r0>0){this.v([cx,y0,cz],[0,-1,0],c,M,e);this.v(B,[0,-1,0],c,M,e);this.v(A,[0,-1,0],c,M,e)}}}}
 cb(cx,cy,cz,sx,sy,sz,ry,c,M,col,e){col=col||[1,1,1];e=e||0;const C=Math.cos(ry),Sn=Math.sin(ry);const h=[sx/2,sy/2,sz/2];c=Math.min(c,h[0]*.9,h[1]*.9,h[2]*.9);
  const P=v=>[cx+v[0]*C+v[2]*Sn,cy+v[1],cz-v[0]*Sn+v[2]*C];const Nn=v=>{const l=Math.hypot(...v);const u=v.map(q=>q/l);return[u[0]*C+u[2]*Sn,u[1],-u[0]*Sn+u[2]*C]};
  const pt=(s,inset)=>s.map((q,i)=>q*(h[i]-(inset[i]?c:0)));
  const tri=(a,b,d,n)=>{const A=P(a),B=P(b),D=P(d);const nn=Nn(n);const e1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],e2=[D[0]-A[0],D[1]-A[1],D[2]-A[2]];const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
   if(cr[0]*nn[0]+cr[1]*nn[1]+cr[2]*nn[2]<0){this.v(A,nn,col,M,e);this.v(D,nn,col,M,e);this.v(B,nn,col,M,e)}else{this.v(A,nn,col,M,e);this.v(B,nn,col,M,e);this.v(D,nn,col,M,e)}};
  const qd=(a,b,d,f,n)=>{tri(a,b,d,n);tri(a,d,f,n)};
  for(let ax=0;ax<3;ax++)for(const s of[-1,1]){const u=(ax+1)%3,w=(ax+2)%3;const v=(su,sw)=>{const q=[0,0,0];q[ax]=s*h[ax];q[u]=su*(h[u]-c);q[w]=sw*(h[w]-c);return q};const n=[0,0,0];n[ax]=s;qd(v(-1,-1),v(1,-1),v(1,1),v(-1,1),n)}
  for(let ax=0;ax<3;ax++){const a=(ax+1)%3,b=(ax+2)%3;for(const sa of[-1,1])for(const sb of[-1,1]){const v=(sx2,fa)=>{const q=[0,0,0];q[ax]=sx2*(h[ax]-c);q[a]=sa*(h[a]-(fa?0:c));q[b]=sb*(h[b]-(fa?c:0));return q};const n=[0,0,0];n[a]=sa;n[b]=sb;qd(v(-1,1),v(1,1),v(1,0),v(-1,0),n)}}
  for(const s0 of[-1,1])for(const s1 of[-1,1])for(const s2 of[-1,1]){const s=[s0,s1,s2];tri(pt(s,[0,1,1]),pt(s,[1,0,1]),pt(s,[1,1,0]),s)}}
 sb(cx,cy,cz,sx,sy,sz,ry,r,M,col,e){col=col||[1,1,1];e=e||0;const C=Math.cos(ry),Sn=Math.sin(ry);const h=[sx/2,sy/2,sz/2];r=Math.min(r,h[0]*.98,h[1]*.98,h[2]*.98);
  const P=v=>[cx+v[0]*C+v[2]*Sn,cy+v[1],cz-v[0]*Sn+v[2]*C];const Nn=v=>[v[0]*C+v[2]*Sn,v[1],-v[0]*Sn+v[2]*C];
  const stops=hh=>{const a=[0,.3,.65,1].map(q=>q*r),o=[];for(const q of a)o.push(-hh+q);for(const q of a.slice().reverse())o.push(hh-q);return o};
  const st=h.map(stops);
  for(let ax=0;ax<3;ax++)for(const s of[-1,1]){const u=(ax+1)%3,w=(ax+2)%3;
   const V=(i,j)=>{const q=[0,0,0];q[ax]=s*h[ax];q[u]=st[u][i];q[w]=st[w][j];const inn=q.map((v,k)=>Math.max(-(h[k]-r),Math.min(h[k]-r,v)));const d=q.map((v,k)=>v-inn[k]);const l=Math.hypot(...d)||1;const n=d.map(v=>v/l);return{p:P(inn.map((v,k)=>v+n[k]*r)),n:Nn(n)}};
   for(let i=0;i<7;i++)for(let j=0;j<7;j++){const a=V(i,j),b=V(i+1,j),c=V(i+1,j+1),d=V(i,j+1);
    const e1=[b.p[0]-a.p[0],b.p[1]-a.p[1],b.p[2]-a.p[2]],e2=[c.p[0]-a.p[0],c.p[1]-a.p[1],c.p[2]-a.p[2]];const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
    const flip=cr[0]*(a.n[0]+c.n[0])+cr[1]*(a.n[1]+c.n[1])+cr[2]*(a.n[2]+c.n[2])<0;const T=(p,q,t)=>{this.v(p.p,p.n,col,M,e);this.v(q.p,q.n,col,M,e);this.v(t.p,t.n,col,M,e)};
    if(flip){T(a,c,b);T(a,d,c)}else{T(a,b,c);T(a,c,d)}}}}
 tube(a,b,r,seg,M,col,e){col=col||[1,1,1];e=e||0;const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];const l=Math.hypot(...d);const z=d.map(q=>q/l);let x=Math.abs(z[1])<.9?[z[2],0,-z[0]]:[1,0,0];const xl=Math.hypot(...x);x=x.map(q=>q/xl);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  for(let i=0;i<seg;i++){const t0=i/seg*6.2832,t1=(i+1)/seg*6.2832;const N=t=>[x[0]*Math.cos(t)+y[0]*Math.sin(t),x[1]*Math.cos(t)+y[1]*Math.sin(t),x[2]*Math.cos(t)+y[2]*Math.sin(t)];const n0=N(t0),n1=N(t1);
   const P=(o,n)=>[o[0]+n[0]*r,o[1]+n[1]*r,o[2]+n[2]*r];this.v(P(a,n0),n0,col,M,e);this.v(P(b,n0),n0,col,M,e);this.v(P(b,n1),n1,col,M,e);this.v(P(a,n0),n0,col,M,e);this.v(P(b,n1),n1,col,M,e);this.v(P(a,n1),n1,col,M,e)}
  for(const [o,s] of[[a,-1],[b,1]])for(let i=0;i<seg;i++){const t0=i/seg*6.2832,t1=(i+1)/seg*6.2832;const N=t=>[o[0]+(x[0]*Math.cos(t)+y[0]*Math.sin(t))*r,o[1]+(x[1]*Math.cos(t)+y[1]*Math.sin(t))*r,o[2]+(x[2]*Math.cos(t)+y[2]*Math.sin(t))*r];const n=z.map(q=>q*s);if(s>0){this.v(o,n,col,M,e);this.v(N(t0),n,col,M,e);this.v(N(t1),n,col,M,e)}else{this.v(o,n,col,M,e);this.v(N(t1),n,col,M,e);this.v(N(t0),n,col,M,e)}}}
 drape(x,z0,z1,y0,y1,folds,depth,M,col,face){col=col||[1,1,1];const n=folds*8;for(let i=0;i<n;i++){const u0=i/n,u1=(i+1)/n;const f=u=>Math.sin(u*folds*6.2832)*depth;const zz=u=>z0+(z1-z0)*u;
   const nx=u=>{const d=Math.cos(u*folds*6.2832)*depth*folds*6.2832/(z1-z0);const l=Math.hypot(1,d);return[face/l,0,-d*face/l]};
   const A=[x+f(u0),y0,zz(u0)],B=[x+f(u1),y0,zz(u1)],Cc=[x+f(u1),y1,zz(u1)],D=[x+f(u0),y1,zz(u0)];this.v(A,nx(u0),col,M,0);this.v(B,nx(u1),col,M,0);this.v(Cc,nx(u1),col,M,0);this.v(A,nx(u0),col,M,0);this.v(Cc,nx(u1),col,M,0);this.v(D,nx(u0),col,M,0)}}
 drape2(axis,fx,u0,u1,y0,y1,folds,depth,M,col,face){col=col||[1,1,1];const n=folds*8;const f=u=>Math.sin(u*folds*6.2832)*depth;const uu=u=>u0+(u1-u0)*u;
  const nx=u=>{const d=Math.cos(u*folds*6.2832)*depth*folds*6.2832/(u1-u0);const l=Math.hypot(1,d);return axis==='z'?[face/l,0,-d*face/l]:[-d*face/l,0,face/l]};
  const pos=(u,y)=>axis==='z'?[fx+f(u),y,uu(u)]:[uu(u),y,fx+f(u)];
  for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n;const A=pos(a,y0),B=pos(b,y0),C=pos(b,y1),D=pos(a,y1);this.v(A,nx(a),col,M,0);this.v(B,nx(b),col,M,0);this.v(C,nx(b),col,M,0);this.v(A,nx(a),col,M,0);this.v(C,nx(b),col,M,0);this.v(D,nx(a),col,M,0)}}
 sph(cx,cy,cz,rx,ry,rz,M,col,e,half,st0,sl0){const c=col||[1,1,1];e=e||0;const sm=Math.max(rx,ry,rz)<.06;const st=st0||(sm?6:12),sl=sl0||(sm?8:16);for(let j=(half?st/2:0);j<st;j++)for(let i=0;i<sl;i++){
  const P=(jj,ii)=>{const t=jj/st*Math.PI-Math.PI/2,a=ii/sl*6.2832;return[[cx+Math.cos(t)*Math.cos(a)*rx,cy+Math.sin(t)*ry,cz+Math.cos(t)*Math.sin(a)*rz],[Math.cos(t)*Math.cos(a),Math.sin(t),Math.cos(t)*Math.sin(a)]]};
  const A=P(j,i),B=P(j,i+1),Cc=P(j+1,i+1),D=P(j+1,i);this.v(A[0],A[1],c,M,e);this.v(D[0],D[1],c,M,e);this.v(Cc[0],Cc[1],c,M,e);this.v(A[0],A[1],c,M,e);this.v(Cc[0],Cc[1],c,M,e);this.v(B[0],B[1],c,M,e)}}
}
RR.GB=GB;
const mt=(name,scale,gloss)=>[MT[name][0],MT[name][1],scale,gloss];RR.mt=mt;
/* ---------- GL ---------- */
const VS=`attribute vec3 aP,aN,aC;attribute vec4 aM;attribute float aE;attribute vec2 aU;uniform mat4 uVP,uMir;varying vec3 vW,vN,vC;varying vec4 vM;varying float vE;varying vec2 vU;
void main(){vW=aP;vN=aN;vC=aC;vM=aM;vE=aE;vU=aU;gl_Position=uVP*uMir*vec4(aP,1.);}`;
const FS=`#extension GL_OES_standard_derivatives : enable
#extension GL_EXT_shader_texture_lod : enable
precision highp float;varying vec3 vW,vN,vC;varying vec4 vM;varying float vE;varying vec2 vU;
uniform sampler2D uA,uA2,uSS,uSP;uniform vec3 uCam,uSunD,uSunC,uSpP,uSpD,uSpC,uSky,uGnd,uRmin,uRmax;uniform mat4 uLS,uLP;uniform vec3 uPL[4];uniform vec3 uPC[4];uniform float uExp,uSpCos,uRefPass;uniform sampler2D uRef;uniform vec2 uRes;uniform sampler2D uWin,uScr;uniform float uQr,uQa;uniform sampler2D uDp;uniform vec3 uK[24];uniform mat4 uView;uniform vec2 uPP;
float unp(vec4 c){return dot(c,vec4(1.,1./255.,1./65025.,1./16581375.));}
float sh(sampler2D m,mat4 L,float b,float rad){vec4 l=L*vec4(vW+normalize(vN)*.06,1.);vec3 p=l.xyz/l.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;float s=0.;
 for(int i=-2;i<=2;i++)for(int j=-2;j<=2;j++){vec2 o=vec2(float(i)+.5*float(j),float(j)-.3*float(i))*rad/2048.;s+=step(p.z-b,unp(texture2D(m,p.xy+o)));}return s/25.;}
uniform float uTS;float lodOf(vec2 q){vec2 dx=dFdx(q*uTS),dy=dFdy(q*uTS);float a=length(dx),b=length(dy);return clamp(log2(max(max(min(a,b),max(a,b)/8.),1.)),0.,4.);}
vec3 tile(vec2 q,float lod){return texture2DLodEXT(uA2,(vM.xy+.004+fract(q)*.992)*.25,lod).rgb;}
float lum(vec2 q,float lod){return dot(tile(q,lod),vec3(.3,.59,.11));}
float unD(vec2 uv){return unp(texture2D(uDp,uv))*40.;}
float ssao(vec3 nW){vec2 uv=gl_FragCoord.xy/uRes;float d=unD(uv);if(d>=39.)return 1.;vec3 P=vec3((uv*2.-1.)*uPP*d,-d);vec3 nv=normalize((uView*vec4(nW,0.)).xyz);
 float a=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)*6.2832;vec3 rv=vec3(cos(a),sin(a),.0);vec3 t=rv-nv*dot(rv,nv);if(dot(t,t)<1e-4)t=vec3(1.,0.,0.)-nv*nv.x;t=normalize(t);vec3 bt=cross(nv,t);mat3 tb=mat3(t,bt,nv);
 float occ=0.;for(int i=0;i<24;i++){vec3 s=P+tb*uK[i]*.42;vec2 q=s.xy/(-s.z)/uPP*.5+.5;float sd=unD(q);float rc=smoothstep(0.,1.,.42/max(abs(d-sd),1e-4));occ+=(sd<-s.z-.025?1.:0.)*rc;}
 return 1.-occ/24.;}
void main(){if(uRefPass>.5&&vW.y<.03)discard;vec3 n=normalize(vN);vec3 al;
 if(vM.z<-.5){al=vM.z<-1.5?texture2D(uScr,vU).rgb:texture2D(uWin,vU).rgb;}
 else if(vU.x>=0.)al=texture2D(uA2,(vM.xy+.004+clamp(vec2(vU.x,1.-vU.y),0.,1.)*.992)*.25).rgb;
 else{vec3 w=pow(abs(n),vec3(4.));w/=w.x+w.y+w.z;vec3 p=vW*vM.z;al=tile(p.zy,lodOf(p.zy))*w.x+tile(p.xz,lodOf(p.xz))*w.y+tile(p.xy,lodOf(p.xy))*w.z;
 vec2 bu;vec3 t1,t2;if(w.x>w.y&&w.x>w.z){bu=p.zy;t1=vec3(0.,0.,1.);t2=vec3(0.,1.,0.);}else if(w.y>w.z){bu=p.xz;t1=vec3(1.,0.,0.);t2=vec3(0.,0.,1.);}else{bu=p.xy;t1=vec3(1.,0.,0.);t2=vec3(0.,1.,0.);}
 float lb=lodOf(bu),e=1.2/uTS,h0=lum(bu,lb),hx=lum(bu+vec2(e,0.),lb),hy=lum(bu+vec2(0.,e),lb);n=normalize(n-(t1*(hx-h0)+t2*(hy-h0))*3.4);}
 al=pow(al,vec3(2.2))*vC;
 vec3 V=normalize(uCam-vW);
 vec3 dmin=vW-uRmin,dmax=uRmax-vW;float dw=min(min(dmin.x,dmax.x),min(dmin.z,dmax.z));float ao=mix(.45,1.,smoothstep(0.,.9,dw))*mix(.55,1.,smoothstep(0.,.6,min(dmin.y,dmax.y)));
 ao=mix(1.,ao,step(-1.,uRmin.y));
 float so=(uRefPass<.5&&uQa>.5)?ssao(normalize(vN)):1.;vec3 amb=mix(uGnd,uSky,n.y*.5+.5)*ao*so;
 float gl=vM.w;float sp=mix(8.,160.,gl);
 vec3 c=al*amb;
 float sd=max(dot(n,uSunD),0.);if(sd>0.){float s=sh(uSS,uLS,.004,1.6);vec3 H=normalize(uSunD+V);c+=mix(1.,so,.3)*uSunC*s*(al*sd+gl*.7*pow(max(dot(n,H),0.),sp)*sd);}
 vec3 L=uSpP-vW;float dl=length(L);L/=dl;float cone=smoothstep(uSpCos,uSpCos+.25,dot(-L,uSpD));float d2=max(dot(n,L),0.);
 if(d2>0.&&cone>0.){float s=sh(uSP,uLP,.0004,2.5);vec3 H=normalize(L+V);c+=uSpC*s*cone/(1.+.12*dl*dl)*(al*d2+gl*.7*pow(max(dot(n,H),0.),sp)*d2);}
 for(int i=0;i<4;i++){vec3 L2=uPL[i]-vW;float d=length(L2);L2/=d;float k=max(dot(n,L2),0.)/(1.+.35*d*d);vec3 H=normalize(L2+V);c+=uPC[i]*k*(al+gl*.6*pow(max(dot(n,H),0.),sp))*mix(.6,1.,ao)*mix(.35,1.,so);}
 float fr=pow(1.-max(dot(n,V),0.),5.);c+=uSky*gl*(.04+.5*fr)*ao*so;
 if(uRefPass<.5&&uQr>.5&&vW.y<.03&&n.y>.8&&gl>.2){vec2 su=gl_FragCoord.xy/uRes+(n.xz)*.01;vec3 rc=pow(texture2D(uRef,su).rgb,vec3(2.2))/max(uExp,.01);float k=gl*(.18+.6*fr);c=mix(c,rc*1.3+c*.4,k*.32);}
 c+=al*vE*4.;
 c*=uExp;c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);c=pow(clamp(c,0.,1.),vec3(1./2.2));gl_FragColor=vec4(c,1.);}`;
const DVS=`attribute vec3 aP;uniform mat4 uL;varying float vD;void main(){vec4 p=uL*vec4(aP,1.);vD=p.z/p.w*.5+.5;gl_Position=p;}`;
const DFS=`precision highp float;varying float vD;void main(){vec4 e=fract(vD*vec4(1.,255.,65025.,16581375.));e-=e.yzww*vec4(1./255.,1./255.,1./255.,0.);gl_FragColor=e;}`;
function mat(){return new Float32Array(16)}
function mul(a,b){const o=mat();for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}
function persp(f,a,n,fa){const t=1/Math.tan(f/2),o=mat();o[0]=t/a;o[5]=t;o[10]=(fa+n)/(n-fa);o[11]=-1;o[14]=2*fa*n/(n-fa);return o}
function ortho(l,r,b,t,n,f){const o=mat();o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o}
const nrm=v=>{const l=Math.hypot(...v)||1;return v.map(q=>q/l)};const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function look(e,t,u){const z=nrm([e[0]-t[0],e[1]-t[1],e[2]-t[2]]),x=nrm(crs(u,z)),y=crs(z,x);const o=mat();o.set([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1]);return o}
RR.m={mul,persp,look,nrm};
RR.create=function(cv,opt){opt=opt||{};let ss=opt.ss||1;const SM=opt.sm||4096;const gl=cv.getContext('webgl',{antialias:true});const R={gl,cv};gl.getExtension('OES_standard_derivatives');R.lodExt=!!gl.getExtension('EXT_shader_texture_lod');
 const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x};
 const prog=(v,f)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p};
 R.p=prog(VS,FS);R.dp=prog(DVS,DFS);R.pD=prog('attribute vec3 aP;uniform mat4 uVP;varying float vD;void main(){vec4 p=uVP*vec4(aP,1.);vD=p.w/40.;gl_Position=p;}',DFS);
 R.pP=prog('attribute vec3 aP;attribute float aA;uniform mat4 uVP;uniform float uPS;varying float vA;void main(){vec4 p=uVP*vec4(aP,1.);gl_Position=p;gl_PointSize=uPS/p.w;vA=aA;}','precision mediump float;varying float vA;uniform vec3 uCol;void main(){vec2 d=gl_PointCoord-.5;float f=exp(-dot(d,d)*20.);gl_FragColor=vec4(uCol*vA*f,1.);}');
 const KR=(()=>{let a=5;return()=>{a=(a*16807)%2147483647;return a/2147483647}})();R.kern=new Float32Array(72);for(let i=0;i<24;i++){let x=KR()*2-1,y=KR()*2-1,z=KR()*.95+.05;const l=Math.hypot(x,y,z);const sc=.12+.88*Math.pow(i/24,2);R.kern[i*3]=x/l*sc;R.kern[i*3+1]=y/l*sc;R.kern[i*3+2]=z/l*sc}
 const fbo=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,SM,SM,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);const rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,SM,SM);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return{f,t}};
 R.ss=fbo();R.sp=fbo();
 R.setAtlas=c=>{R.ts=c.width/4;const t=R.at||gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);R.at=t;const t2=R.at2||gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t2);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);{const an=gl.getExtension('EXT_texture_filter_anisotropic');if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,8)}gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);R.at2=t2};
 R.buf=gb=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);const a=new Float32Array(gb.d);gl.bufferData(gl.ARRAY_BUFFER,a,gl.STATIC_DRAW);return{b,n:a.length/16}};
 const attrs=(p,list)=>{list.forEach(([nm,sz,off])=>{const l=gl.getAttribLocation(p,nm);if(l<0)return;gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,sz,gl.FLOAT,false,64,off*4)})};
 const tgt=(w,h,depth,near)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  const FL=near?gl.NEAREST:gl.LINEAR;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,FL);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,FL);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  let rb=null;const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);if(depth){rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_STENCIL,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_STENCIL_ATTACHMENT,gl.RENDERBUFFER,rb)}gl.bindFramebuffer(gl.FRAMEBUFFER,null);return{f,t,w,h,rb}};
  let W0=cv.width,H0=cv.height;R.q={refl:true,ao:true};
 const freeT=o=>{if(!o)return;gl.deleteTexture(o.t);gl.deleteFramebuffer(o.f);if(o.rb)gl.deleteRenderbuffer(o.rb)};
 R.resize=(w,h,s2)=>{if(s2)ss=s2;[R.main,R.ref,R.dep,R.b1,R.b2].forEach(freeT);cv.width=w;cv.height=h;W0=w;H0=h;R.main=tgt(W0*ss|0,H0*ss|0,true);R.ref=tgt(W0*ss|0,H0*ss|0,true);R.dep=tgt(W0*ss|0,H0*ss|0,true,true);R.b1=tgt(W0/4|0,H0/4|0);R.b2=tgt(W0/4|0,H0/4|0)};
 R.ss=()=>ss;
 const mk1=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([40,60,90,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t};
 R.win=mk1();R.scr=mk1();
 R.setWin=(w,h,px)=>{gl.bindTexture(gl.TEXTURE_2D,R.win);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,px);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false)};
 R.setScr=c=>{gl.bindTexture(gl.TEXTURE_2D,R.scr);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false)};
 R.resize(cv.width,cv.height,ss);
 const QV='attribute vec2 aQ;varying vec2 vQ;void main(){vQ=aQ*.5+.5;gl_Position=vec4(aQ,0.,1.);}';
 R.pB=prog(QV,'precision mediump float;varying vec2 vQ;uniform sampler2D uT;uniform vec2 uD;uniform float uTh;void main(){vec3 s=vec3(0.);float w[5];w[0]=.227;w[1]=.195;w[2]=.122;w[3]=.054;w[4]=.016;s+=texture2D(uT,vQ).rgb*w[0];for(int i=1;i<5;i++){s+=texture2D(uT,vQ+uD*float(i)).rgb*w[i];s+=texture2D(uT,vQ-uD*float(i)).rgb*w[i];}if(uTh>0.)s=max(s-uTh,0.)/(1.-uTh);gl_FragColor=vec4(s,1.);}');
 R.pC=prog(QV,'precision mediump float;varying vec2 vQ;uniform sampler2D uT,uBl;uniform float uBs,uSeed;uniform vec3 uGrade;void main(){vec3 c=texture2D(uT,vQ).rgb;vec3 bl=texture2D(uBl,vQ).rgb;c+=bl*uBs;vec2 d=vQ-.5;c*=1.-dot(d,d)*.85;c=mix(c,c*uGrade,.5);float g=fract(sin(dot(vQ*1000.+uSeed,vec2(12.9898,78.233)))*43758.5453);c+=(g-.5)*.035;c=mix(vec3(dot(c,vec3(.3,.59,.11))),c,.92);gl_FragColor=vec4(c,1.);}');
 R.pR=prog('attribute vec3 aP;attribute float aA;uniform mat4 uVP;varying float vA;void main(){vA=aA;gl_Position=uVP*vec4(aP,1.);}','precision mediump float;varying float vA;uniform vec3 uCol;void main(){gl_FragColor=vec4(uCol*vA,1.);}');
 const qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
 const quad=(p,T,uni)=>{gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,qb);const l=gl.getAttribLocation(p,'aQ');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,8,0);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,T);gl.uniform1i(gl.getUniformLocation(p,'uT'),0);uni&&uni(n=>gl.getUniformLocation(p,n));gl.drawArrays(gl.TRIANGLES,0,6)};
 const I=mat();I[0]=I[5]=I[10]=I[15]=1;const MIR=mat();MIR[0]=1;MIR[5]=-1;MIR[10]=1;MIR[15]=1;
 R.render=(scene,cam)=>{const L=scene.L;gl.enable(gl.DEPTH_TEST);
  const SR=L.sunR||9,ST=L.sunT||[0,1.2,0];const sunPos=L.sunR?[ST[0]+nrm(L.sunD)[0]*35,ST[1]+nrm(L.sunD)[1]*35,ST[2]+nrm(L.sunD)[2]*35]:[L.sunD[0]*20,L.sunD[1]*20,L.sunD[2]*20];const LS=mul(ortho(-SR,SR,-SR,SR,1,L.sunR?75:45),look(sunPos,ST,[0,1,0]));
  const LP=mul(persp(L.spAng*2,1,.3,20),look(L.spP,[L.spP[0]+L.spD[0],L.spP[1]+L.spD[1],L.spP[2]+L.spD[2]],Math.abs(L.spD[1])>.9?[0,0,1]:[0,1,0]));
  if(!scene.shDone){gl.useProgram(R.dp);for(const [F,M] of[[R.ss,LS],[R.sp,LP]]){gl.bindFramebuffer(gl.FRAMEBUFFER,F.f);gl.viewport(0,0,SM,SM);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniformMatrix4fv(gl.getUniformLocation(R.dp,'uL'),false,M);gl.bindBuffer(gl.ARRAY_BUFFER,scene.cast.b);attrs(R.dp,[['aP',3,0]]);gl.drawArrays(gl.TRIANGLES,0,scene.cast.n)}if(scene.cacheSh)scene.shDone=true}
  let PL=L.pl,PC=L.pc;if(scene.lights){const sc=scene.lights.map(q=>({q,d:Math.hypot(q.p[0]-cam.e[0],(q.p[1]-cam.e[1])*2.2,q.p[2]-cam.e[2])})).sort((a,b)=>a.d-b.d).slice(0,4);PL=sc.map(x=>x.q.p);PC=sc.map(x=>x.q.c);while(PL.length<4){PL.push([0,-9,0]);PC.push([0,0,0])}}
  const p=R.p;const U=n=>gl.getUniformLocation(p,n);
  const VW=look(cam.e,cam.t,[0,1,0]);const VP=mul(persp(cam.fov,W0/H0,cam.near||.12,60),VW);R.vp=VP;const tH=Math.tan(cam.fov/2);
  gl.bindFramebuffer(gl.FRAMEBUFFER,R.dep.f);gl.viewport(0,0,R.dep.w,R.dep.h);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(R.q.ao){gl.useProgram(R.pD);gl.uniformMatrix4fv(gl.getUniformLocation(R.pD,'uVP'),false,VP);
  for(const o of[scene.cast,scene.nc]){gl.bindBuffer(gl.ARRAY_BUFFER,o.b);attrs(R.pD,[['aP',3,0]]);gl.drawArrays(gl.TRIANGLES,0,o.n)}}
  const pass=(fb,mir)=>{gl.bindFramebuffer(gl.FRAMEBUFFER,fb.f);gl.viewport(0,0,fb.w,fb.h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(p);
   gl.uniformMatrix4fv(U('uVP'),false,VP);gl.uniformMatrix4fv(U('uMir'),false,mir?MIR:I);gl.uniform1f(U('uRefPass'),mir?1:0);gl.uniform2f(U('uRes'),fb.w,fb.h);
   gl.uniformMatrix4fv(U('uLS'),false,LS);gl.uniformMatrix4fv(U('uLP'),false,LP);
   gl.uniform3fv(U('uCam'),cam.e);gl.uniform3fv(U('uSunD'),nrm(L.sunD));gl.uniform3fv(U('uSunC'),L.sunC);gl.uniform3fv(U('uSpP'),L.spP);gl.uniform3fv(U('uSpD'),nrm(L.spD));gl.uniform3fv(U('uSpC'),L.spC);gl.uniform1f(U('uSpCos'),Math.cos(L.spAng));
   gl.uniform3fv(U('uSky'),L.sky);gl.uniform3fv(U('uGnd'),L.gnd);gl.uniform3fv(U('uRmin'),scene.rmin);gl.uniform3fv(U('uRmax'),scene.rmax);gl.uniform1f(U('uExp'),L.exp);gl.uniformMatrix4fv(U('uView'),false,VW);gl.uniform2f(U('uPP'),tH*W0/H0,tH);gl.uniform3fv(U('uK'),R.kern);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,R.dep.t);gl.uniform1i(U('uDp'),5);
   gl.uniform3fv(U('uPL'),new Float32Array(PL.flat()));gl.uniform3fv(U('uPC'),new Float32Array(PC.flat()));gl.uniform1f(U('uTS'),R.ts||1024);gl.uniform1f(U('uQr'),R.q.refl?1:0);gl.uniform1f(U('uQa'),R.q.ao?1:0);gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,R.win);gl.uniform1i(U('uWin'),6);gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,R.scr);gl.uniform1i(U('uScr'),7);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,R.at);gl.uniform1i(U('uA'),0);gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,R.at2);gl.uniform1i(U('uA2'),4);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,R.ss.t);gl.uniform1i(U('uSS'),1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,R.sp.t);gl.uniform1i(U('uSP'),2);
   gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,mir?null:R.ref.t);gl.uniform1i(U('uRef'),3);
   for(const o of[scene.cast,scene.nc]){gl.bindBuffer(gl.ARRAY_BUFFER,o.b);attrs(p,[['aP',3,0],['aN',3,3],['aC',3,6],['aM',4,9],['aE',1,13],['aU',2,14]]);gl.drawArrays(gl.TRIANGLES,0,o.n)}};
  if(R.q.refl)pass(R.ref,true);pass(R.main,false);
  if(scene.rays){gl.bindFramebuffer(gl.FRAMEBUFFER,R.main.f);gl.viewport(0,0,W0,H0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.useProgram(R.pR);
   gl.uniformMatrix4fv(gl.getUniformLocation(R.pR,'uVP'),false,VP);gl.uniform3fv(gl.getUniformLocation(R.pR,'uCol'),scene.rayCol);gl.bindBuffer(gl.ARRAY_BUFFER,scene.rays.b);
   const la=gl.getAttribLocation(R.pR,'aP'),lb=gl.getAttribLocation(R.pR,'aA');gl.enableVertexAttribArray(la);gl.vertexAttribPointer(la,3,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(lb);gl.vertexAttribPointer(lb,1,gl.FLOAT,false,16,12);
   gl.drawArrays(gl.TRIANGLES,0,scene.rays.n);
   if(scene.dust){gl.useProgram(R.pP);gl.uniformMatrix4fv(gl.getUniformLocation(R.pP,'uVP'),false,VP);gl.uniform3fv(gl.getUniformLocation(R.pP,'uCol'),scene.dustCol||[1,.9,.7]);gl.uniform1f(gl.getUniformLocation(R.pP,'uPS'),(scene.dustSize||.012)*R.main.h/(2*tH));gl.bindBuffer(gl.ARRAY_BUFFER,scene.dust.b);
    const la2=gl.getAttribLocation(R.pP,'aP'),lb2=gl.getAttribLocation(R.pP,'aA');gl.enableVertexAttribArray(la2);gl.vertexAttribPointer(la2,3,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(lb2);gl.vertexAttribPointer(lb2,1,gl.FLOAT,false,16,12);gl.drawArrays(gl.POINTS,0,scene.dust.n)}
   gl.disable(gl.BLEND);gl.depthMask(true)}
  gl.disable(gl.DEPTH_TEST);const bw=R.b1.w,bh=R.b1.h;
  gl.bindFramebuffer(gl.FRAMEBUFFER,R.b1.f);gl.viewport(0,0,bw,bh);quad(R.pB,R.main.t,u=>{gl.uniform2f(u('uD'),1/W0,0);gl.uniform1f(u('uTh'),.72)});
  for(let k=0;k<2;k++){gl.bindFramebuffer(gl.FRAMEBUFFER,R.b2.f);quad(R.pB,R.b1.t,u=>{gl.uniform2f(u('uD'),0,(1.6+k)/bh);gl.uniform1f(u('uTh'),0)});gl.bindFramebuffer(gl.FRAMEBUFFER,R.b1.f);quad(R.pB,R.b2.t,u=>{gl.uniform2f(u('uD'),(1.6+k)/bw,0);gl.uniform1f(u('uTh'),0)})}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,W0,H0);quad(R.pC,R.main.t,u=>{gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,R.b1.t);gl.uniform1i(u('uBl'),1);gl.uniform1f(u('uBs'),L.bloom||.8);gl.uniform1f(u('uSeed'),1.7);gl.uniform3fv(u('uGrade'),L.grade||[1,1,1])});
  gl.enable(gl.DEPTH_TEST)};
 return R};
})();
