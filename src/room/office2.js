/* Highly detailed WWII-era minister's office */
RR.THEMES.ww2r={atlas:{wood:[146,90,52],dwood:[70,40,24],lwood:[170,120,76],rugA:[104,26,24],rugB:[214,188,138],rugC:[26,32,60],carpet:[90,40,35],leather:[74,40,24],fabric:[118,30,28],metal:[118,112,96],panel:[90,95,85],concrete:[176,170,160],mapStyle:'paper',sky:['#9fb6c4','#d9d4c2','#e8d7ae'],view:'town',scrBg:'#111',scrFg:'#9f9',over:{screen:'paint'}},
 L:{sunD:[1,.55,.42],sunC:[6.4,4.7,3.0],sky:[.26,.23,.19],gnd:[.17,.11,.07],spP:[.4,3.2,-1.9],spD:[0,-1,0],spC:[3.2,2.3,1.4],spAng:.95,
  pl:[[-3,2.75,1.6],[2.1,2.75,1.6],[.92,1.05,-2.2],[-3.9,.55,-.1]],pc:[[1.0,.68,.36],[.9,.6,.32],[.55,.46,.25],[1.15,.5,.17]],exp:1.1,bloom:.95,grade:[1.06,1.0,.9]}};
RR.office2=function(){const T=RR.THEMES.ww2r,mt=RR.mt;const A=new RR.GB(),N=new RR.GB();
 const W=5,D=4,H=3.4,t=.22;
 const M={floor:mt('parquet',.95,.55),wall:mt('plaster',.55,.03),ceil:mt('plaster',.45,0),wood:mt('wood',1.3,.5),dwood:mt('wood',1.6,.6),leather:mt('leather',2.4,.42),fabric:mt('fabric',2.2,.05),
  brass:mt('metal',2.4,.92),iron:mt('metal',1.5,.55),rug:mt('rug',.25,0),marble:mt('marble',.9,.7),paper:mt('plaster',3,.05),book:mt('leather',3,.3),glass:mt('marble',3,.95)};
 const WC=[.95,.89,.76],TRIM=[.97,.94,.86],BR=[1,.82,.5];
 /* shell */
 A.box(-W,-.1,-D,W,0,D,M.floor);A.box(-W,H,-D,W,H+.1,D,M.ceil,[.97,.94,.87]);
 A.box(-W-t,0,-D-t,W+t,H,-D,M.wall,WC);A.box(-W-t,0,D,W+t,H,D+t,M.wall,WC);A.box(-W-t,0,-D,-W,H,D,M.wall,WC);
 const win=[[-3.2,-1.2],[.6,2.6]],wy0=.8,wy1=2.95;let z=-D;
 win.forEach(([a,b])=>{A.box(W,0,z,W+t,H,a,M.wall,WC);A.box(W,0,a,W+t,wy0,b,M.wall,WC);A.box(W,wy1,a,W+t,H,b,M.wall,WC);z=b});A.box(W,0,z,W+t,H,D,M.wall,WC);
 /* window reveals, frames, sashes, glass */
 win.forEach(([a,b])=>{A.box(W,wy0,a-.02,W+t,wy1,a,M.wall,WC);A.box(W,wy0,b,W+t,wy1,b+.02,M.wall,WC);
  N.q([W+.2,wy0,b],[W+.2,wy0,a],[W+.2,wy1,a],[W+.2,wy1,b],[-1,0,0],[1,1,1],mt('view',1,0),.3,[[0,0],[1,0],[1,1],[0,1]]);
  const fc=[.92,.9,.84],fm=mt('plaster',2,.5);const X0=W+.08,X1=W+.15;
  A.cb(X0+.035,wy0+.03,(a+b)/2,.09,.06,b-a,0,.01,fm,fc);A.cb(X0+.035,wy1-.03,(a+b)/2,.09,.06,b-a,0,.01,fm,fc);A.cb(X0+.035,(wy0+wy1)/2,a+.03,.09,wy1-wy0,.06,0,.01,fm,fc);A.cb(X0+.035,(wy0+wy1)/2,b-.03,.09,wy1-wy0,.06,0,.01,fm,fc);
  A.cb(X0+.035,(wy0+wy1)/2,(a+b)/2,.09,wy1-wy0,.07,0,.01,fm,fc);A.cb(X0+.035,1.95,(a+b)/2,.09,.07,b-a,0,.01,fm,fc);
  for(const zz of[a+(b-a)*.25,a+(b-a)*.75])A.cb(X0+.05,(wy0+wy1)/2,zz,.04,wy1-wy0,.025,0,.006,fm,fc);for(const yy of[1.35,2.45])A.cb(X0+.05,yy,(a+b)/2,.04,.025,b-a,0,.006,fm,fc);
  A.cb(W-.08,wy0-.04,(a+b)/2,.34,.06,b-a+.3,0,.015,M.marble,[.92,.9,.86]);
  /* radiator */
  for(let k=0;k<14;k++){const zz=a+.25+k*(b-a-.5)/13;A.cb(W-.2,.42,zz,.14,.56,.06,0,.025,M.iron,[.72,.70,.62])}A.tube([W-.2,.16,a+.2],[W-.2,.16,b-.2],.025,8,M.iron,[.7,.68,.6]);A.tube([W-.2,.7,a+.2],[W-.2,.7,b-.2],.025,8,M.iron,[.7,.68,.6]);
  /* curtains & rod */
  A.tube([W-.14,3.1,a-.55],[W-.14,3.1,b+.55],.018,10,M.brass,BR);for(const zz of[a-.57,b+.57])A.sph(W-.14,3.1,zz,.04,.04,.04,M.brass,BR);
  A.drape(W-.18,a-.5,a+.05,.25,3.05,4,.045,M.fabric,[1,1,1],-1);A.drape(W-.18,b-.05,b+.5,.25,3.05,4,.045,M.fabric,[1,1,1],-1);
  A.drape(W-.22,a+.08,b-.08,2.6,3.05,9,.02,mt('fabric',2.2,.05),[1.05,.98,.85],-1)});
 /* wainscot panelling on 3 walls */
 const panelWall=(axis,pos,from,to,dir)=>{const P=(u,y,d,su,sy,sd)=>axis==='z'?A.cb(u,y,pos+dir*d,su,sy,sd,0,.008,M.wood):A.cb(pos+dir*d,y,u,sd,sy,su,0,.008,M.wood);
  P((from+to)/2,.6,.012,to-from,1.2,.024);P((from+to)/2,1.2,.04,to-from,.07,.08);P((from+to)/2,.09,.03,to-from,.18,.06);
  for(let u=from+.15;u<to-.6;u+=.82){const w=Math.min(.68,to-.15-u);P(u+w/2,.66,.03,w,.04,.02);P(u+w/2,.3,.03,w,.04,.02);P(u+.02,.48,.03,.04,.4,.02);P(u+w-.02,.48,.03,.04,.4,.02);P(u+w/2,1.0,.03,w,.04,.02);P(u+w/2,.78,.03,w,.04,.02)}};
 panelWall('z',-D,-W,W,1);panelWall('z',D,-W,W,-1);panelWall('x',-W,-D,D,1);
 /* crown moulding & ceiling medallions */
 const crown=(x0,z0,x1,z1)=>{A.cb((x0+x1)/2,H-.09,(z0+z1)/2,Math.abs(x1-x0)||.16,.18,Math.abs(z1-z0)||.16,0,.04,M.wall,TRIM);A.cb((x0+x1)/2,H-.22,(z0+z1)/2,Math.abs(x1-x0)||.07,.05,Math.abs(z1-z0)||.07,0,.015,M.wall,TRIM)};
 crown(-W,-D+.08,W,-D+.08);crown(-W,D-.08,W,D-.08);crown(-W+.08,-D,-W+.08,D);crown(W-.08,-D,W-.08,D);
 for(const p of[[-3,1.6],[2.1,1.6]]){A.cyl(p[0],H-.03,p[1],.42,.3,.03,24,M.wall,TRIM,0,true);A.cyl(p[0],H-.06,p[1],.18,.12,.04,18,M.wall,TRIM,0,true)}
 /* chandeliers */
 for(const p of[[-3,1.6],[2.1,1.6]]){const[x,zc]=p;A.tube([x,H-.06,zc],[x,H-.62,zc],.012,8,M.brass,BR);A.sph(x,H-.68,zc,.07,.09,.07,M.brass,BR);A.cyl(x,H-.78,zc,.05,.11,.1,16,M.brass,BR,0,true);
  for(let k=0;k<6;k++){const a=k/6*6.2832,ex=x+Math.cos(a)*.34,ez=zc+Math.sin(a)*.34;A.tube([x,H-.72,zc],[ex,H-.74,ez],.012,6,M.brass,BR);A.cyl(ex,H-.76,ez,.04,.035,.03,10,M.brass,BR,0,true);A.cyl(ex,H-.73,ez,.014,.014,.09,8,M.paper,[1,.98,.94]);N.sph(ex,H-.6,ez,.032,.05,.032,M.paper,[1,.86,.6],3.2)}}
 /* fireplace on left wall */
 {const fx=-W,fz=-.1;A.cb(fx+.2,.55,fz,.4,1.1,1.9,0,.02,M.marble,[.95,.93,.9]);A.box(fx+.25,.05,fz-.45,fx+.41,.82,fz+.45,M.iron,[.05,.04,.04]);A.cb(fx+.28,1.18,fz,.56,.08,2.15,0,.03,M.marble,[.95,.93,.9]);A.cb(fx+.3,1.24,fz,.6,.04,2.25,0,.015,M.marble,[.95,.93,.9]);
  A.cb(fx+.45,.02,fz,.5,.04,2.0,0,.01,M.marble,[.4,.38,.36]);for(let k=0;k<4;k++)A.rbox(fx+.5,.1+k*.0,fz-.3+k*.2,.1,.1,.55,1.5+.2*k,M.wood,[.35,.22,.14]);
  {let q=3;const fr=()=>{q=(q*16807)%2147483647;return q/2147483647};
   for(let k=0;k<16;k++){const z=fz-.32+fr()*.64,x=fx+.46+fr()*.05,h=.14+fr()*.32*(1-Math.abs(z-fz)/.5),r=.035+fr()*.04;const lean=(fr()-.5)*.03;
    N.cyl(x,.1,z,r,.004,h,8,M.paper,[1,.28+fr()*.2,.05],1.0,false);N.cyl(x+lean,.1,z,r*.6,.003,h*.72,8,M.paper,[1,.62+fr()*.2,.14],1.1,false);N.cyl(x,.1,z,r*.3,.002,h*.45,6,M.paper,[1,.9,.55],1.3,false)}
   for(let k=0;k<26;k++)N.sph(fx+.46+fr()*.08,.1+fr()*.03,fz-.4+fr()*.8,.018,.012,.018,M.paper,[1,.2+fr()*.2,.04],1.4)}
  for(let k=0;k<7;k++)A.tube([fx+.43,.05,fz-.38+k*.13],[fx+.43,.6,fz-.38+k*.13],.008,6,M.iron,[.2,.2,.2]);A.tube([fx+.43,.6,fz-.42],[fx+.43,.6,fz+.42],.01,6,M.brass,BR);
  /* mantel clock & candlesticks */
  A.cb(fx+.28,1.4,fz,.16,.28,.36,0,.03,M.dwood);A.cyl(fx+.28,1.43,fz+.0,.0,.0,.0,4,M.brass);N.q([fx+.365,1.36,fz+.11],[fx+.365,1.36,fz-.11],[fx+.365,1.52,fz-.11],[fx+.365,1.52,fz+.11],[1,0,0],[1,1,1],mt('marble',4,.4),.05);
  for(const s of[-.7,.7]){A.cyl(fx+.28,1.26,fz+s,.05,.03,.02,10,M.brass,BR,0,true);A.cyl(fx+.28,1.28,fz+s,.015,.015,.22,8,M.brass,BR);A.cyl(fx+.28,1.5,fz+s,.014,.014,.12,8,M.paper,[1,.98,.94],0,true)}
  /* painting above mantel */
  A.cb(fx+.04,2.15,fz,.06,.95,1.25,0,.03,M.brass,BR);N.q([fx+.075,1.74,fz+.55],[fx+.075,1.74,fz-.55],[fx+.075,2.56,fz-.55],[fx+.075,2.56,fz+.55],[1,0,0],[1,1,1],mt('screen',1,.25),.0,[[0,0],[1,0],[1,1],[0,1]])}
 /* rug (two layers for thickness) */
 A.box(-2.25,0,-3.25,3.15,.012,.95,M.rug,[.5,.4,.3]);A.q([-2.25,.013,.95],[3.15,.013,.95],[3.15,.013,-3.25],[-2.25,.013,-3.25],[0,1,0],[1,1,1],M.rug,0,[[0,0],[1,0],[1,1],[0,1]]);
 /* desk: partner's pedestal desk */
 const dx=.4,dz=-2.2;
 for(const s of[-1,1]){const px=dx+s*.88;A.cb(px,.36,dz,.66,.68,.96,0,.02,M.dwood);A.cb(px,.02,dz,.72,.04,1.02,0,.015,M.dwood);
  for(let k=0;k<3;k++){const y=.15+k*.2;A.cb(px,y,dz+.485,.58,.17,.02,0,.006,M.wood);A.cyl(px,y-.0,dz+.5,.02,.02,.0,8,M.brass);A.tube([px-.08,y,dz+.51],[px+.08,y,dz+.51],.008,6,M.brass,BR);A.cyl(px-.08,y-.01,dz+.497,.012,.012,.02,6,M.brass,BR,0,true)}}
 A.cb(dx,.75,dz,2.5,.05,1.12,0,.02,M.dwood);A.cb(dx,.705,dz,2.42,.05,1.06,0,.01,M.wood);A.cb(dx,.6,dz+.47,1.08,.16,.03,0,.008,M.wood);A.tube([dx-.08,.6,dz+.5],[dx+.08,.6,dz+.5],.008,6,M.brass,BR);
 A.box(dx-.85,.776,dz-.4,dx+.85,.779,dz+.36,M.leather,[.35,.55,.36]);
 A.box(dx-1.2,.35,dz-.53,dx+1.2,.7,dz-.5,M.dwood);
 /* desk props */
 const top=.78;
 {const lx=dx+.72,lz=dz-.25;A.cyl(lx,top,lz,.08,.07,.02,16,M.brass,BR,0,true);A.tube([lx,top+.02,lz],[lx,top+.32,lz],.012,8,M.brass,BR);A.tube([lx-.15,top+.32,lz],[lx+.15,top+.32,lz],.01,8,M.brass,BR);
  for(let i=0;i<14;i++){const a0=i/14*Math.PI,a1=(i+1)/14*Math.PI;const P=(a,r,y)=>[lx+Math.cos(a)*.2,top+.32+Math.sin(a)*r+y,lz];}
  A.cb(lx,top+.39,lz,.38,.03,.14,0,.01,mt('marble',3,.95),[.15,.42,.2]);N.tube([lx-.17,top+.34,lz],[lx+.17,top+.34,lz],.055,16,mt('marble',3,.95),[.16,.52,.24],.22);N.tube([lx-.12,top+.33,lz],[lx+.12,top+.33,lz],.02,8,M.paper,[1,.9,.65],2.5)}
 {const tx=dx-.62,tz=dz-.12;A.cb(tx,top+.03,tz,.24,.06,.18,.15,.02,M.iron,[.1,.1,.1]);A.cyl(tx+.02,top+.06,tz+.02,.065,.065,.012,18,M.iron,[.9,.88,.8],0,true);A.cb(tx,top+.13,tz-.02,.24,.04,.06,.15,.02,M.iron,[.1,.1,.1]);A.sph(tx-.1,top+.13,tz-.03,.035,.03,.035,M.iron,[.1,.1,.1]);A.sph(tx+.1,top+.13,tz,.035,.03,.035,M.iron,[.1,.1,.1]);
  A.tube([tx+.12,top+.03,tz],[tx+.35,top,tz+.12],.006,6,M.iron,[.1,.1,.1])}
 {const wx=dx+.05,wz=dz+.02;A.cb(wx,top+.05,wz,.42,.1,.3,-.08,.03,M.iron,[.13,.15,.13]);A.cb(wx,top+.13,wz-.07,.4,.08,.12,-.08,.03,M.iron,[.13,.15,.13]);A.tube([wx-.22,top+.17,wz-.08],[wx+.22,top+.17,wz-.05],.035,12,M.iron,[.08,.08,.08]);
  A.box(wx-.14,top+.17,wz-.12,wx+.14,top+.33,wz-.115,M.paper,[1,.98,.92]);for(let k=0;k<4;k++)for(let j=0;j<10;j++)A.cyl(wx-.15+j*.033,top+.08+k*.0,wz+.06+k*.03,.011,.011,.015+k*.004,8,M.iron,[.85,.83,.78],0,true)}
 for(let k=0;k<6;k++)A.rbox(dx+.42+k*.006,top+.002+k*.003,dz+.15-k*.004,.21,.0025,.297,.25-k*.12,M.paper,[.98,.95,.86]);
 A.rbox(dx-.25,top+.003,dz+.2,.42,.003,.3,-.05,mt('map',.8,.1),[1,1,1]);
 A.cyl(dx-.92,top,dz+.25,.05,.04,.06,14,mt('marble',3,.95),[.1,.12,.1],0,true);A.tube([dx-.92,top+.07,dz+.25],[dx-.86,top+.2,dz+.22],.005,6,M.brass,BR);
 A.cyl(dx+.98,top,dz+.25,.08,.07,.025,16,mt('marble',3,.95),[.55,.5,.42],0,true);A.tube([dx+.95,top+.03,dz+.25],[dx+1.08,top+.04,dz+.28],.009,8,mt('leather',4,.1),[.5,.32,.18]);
 /* chairs */
 const chester=(x,zc,ry,s)=>{const C=Math.cos(ry),Sn=Math.sin(ry);const L=(u,v,w)=>[x+u*C+w*Sn,v,zc-u*Sn+w*C];s=s||1;
  A.sb(x,.25*s,zc,.86*s,.3*s,.82*s,ry,.1,M.leather);const sc=L(0,.43*s,.06*s);A.sb(sc[0],sc[1],sc[2],.62*s,.12*s,.66*s,ry,.1,M.leather);
  const b=L(0,.72*s,-.33*s);A.sb(b[0],b[1],b[2],.86*s,.82*s,.18*s,ry,.11,M.leather);
  for(const sd of[-1,1]){const a=L(sd*.36*s,.48*s,.0);A.sb(a[0],a[1],a[2],.15*s,.36*s,.82*s,ry,.1,M.leather);A.tube(L(sd*.36*s,.67*s,-.38*s),L(sd*.36*s,.67*s,.41*s),.095*s,14,M.leather)}
  for(let i=0;i<4;i++)for(let j=0;j<3;j++){const p=L((-.27+i*.18)*s,(.55+j*.17)*s,-.235*s);A.sph(p[0],p[1],p[2],.018,.018,.018,M.leather,[.5,.5,.5])}
  for(let i=0;i<10;i++){const p=L((-.4+i*.09)*s,.42*s,.415*s);A.sph(p[0],p[1],p[2],.012,.012,.012,M.brass,BR)}
  for(const u of[-.34,.34])for(const w of[-.32,.32]){const p=L(u*s,0,w*s);A.cyl(p[0],0,p[2],.03,.04,.1,10,M.dwood,[1,1,1],0,true)}};
 chester(dx,dz-.95,Math.PI);chester(dx-.75,dz+1.35,.12,.94);chester(dx+.8,dz+1.35,-.12,.94);
 /* bookcase with real books */
 {const bx0=-4.6,bx1=-1.6,bz=-D;const sm=M.dwood;A.box(bx0,0,bz,bx1,2.7,bz+.02,sm,[.7,.7,.7]);A.cb((bx0+bx1)/2,2.7,bz+.22,bx1-bx0+.12,.1,.46,0,.02,sm);A.cb((bx0+bx1)/2,.06,bz+.22,bx1-bx0+.06,.12,.44,0,.01,sm);
  for(const x of[bx0,bx0+1.0,bx0+2.0,bx1])A.cb(x,1.35,bz+.21,.05,2.62,.42,0,.01,sm);
  const r=(()=>{let a=7;return()=>{a=(a*16807)%2147483647;return a/2147483647}})();const cols=[[.42,.10,.08],[.12,.18,.32],[.13,.27,.15],[.45,.33,.12],[.25,.12,.22],[.3,.2,.12],[.55,.5,.4],[.1,.1,.12]];
  for(let y=.12;y<2.6;y+=.5){A.cb((bx0+bx1)/2,y,bz+.22,bx1-bx0,.03,.42,0,.008,sm);if(y>2.55)break;
   for(let sec=0;sec<3;sec++){let x=bx0+sec*1.0+.04;const xe=x+.92;while(x<xe-.03){const w=.025+r()*.035,h=.22+r()*.14,d=.17+r()*.07;if(x+w>xe)break;const c=cols[(r()*cols.length)|0].map(v=>v*(.8+r()*.4));
     if(r()<.06&&x+w+.12<xe){A.rbox(x+.1,y+.015+h/2*.75,bz+.04+d/2,w,h,d,0,M.book,c);x+=.16;continue}
     A.cb(x+w/2,y+.015+h/2,bz+.04+d/2,w,h,d,0,.004,M.book,c);if(r()<.7){A.box(x+.003,y+.015+h*.82,bz+.04+d,x+w-.003,y+.015+h*.84,bz+.04+d+.002,M.brass,BR);A.box(x+.003,y+.015+h*.15,bz+.04+d,x+w-.003,y+.015+h*.17,bz+.04+d+.002,M.brass,BR)}x+=w+.002}
    if(r()<.4)A.cb(xe-.06,y+.1,bz+.25,.05,.17,.12,0,.005,M.brass,BR)}}}
 /* war map on left wall over sofa */
 A.cb(-W+.03,1.95,2.15,.04,1.2,1.75,0,.015,M.dwood);A.q([-W+.055,1.4,3.0],[-W+.055,1.4,1.3],[-W+.055,2.5,1.3],[-W+.055,2.5,3.0],[1,0,0],[1,1,1],mt('map',1,.05),0,[[0,0],[1,0],[1,1],[0,1]]);
 /* chesterfield sofa + coffee table */
 {const x=-4.45,zc=2.15;A.sb(x,.24,zc,.9,.3,2.1,0,.1,M.leather);A.sb(x-.33,.68,zc,.22,.6,2.1,0,.11,M.leather);for(const s of[-1,1]){A.sb(x,.5,zc+s*1.0,.9,.3,.2,0,.1,M.leather);A.tube([x-.42,.66,zc+s*1.0],[x+.45,.66,zc+s*1.0],.11,14,M.leather)}
  for(let k=0;k<3;k++)A.sb(x+.07,.43,zc-.62+k*.62,.66,.12,.6,0,.1,M.leather);for(let i=0;i<9;i++)for(let j=0;j<2;j++)A.sph(x-.215,.58+j*.18,zc-.9+i*.225,.016,.016,.016,M.leather,[.5,.5,.5]);
  A.cb(-3.35,.42,2.15,.7,.04,1.2,0,.015,M.dwood);for(const s of[-1,1])for(const q of[-1,1])A.cyl(-3.35+s*.3,0,2.15+q*.54,.025,.03,.4,10,M.dwood,[1,1,1],0,true);A.cb(-3.35,.12,2.15,.6,.02,1.1,0,.01,M.dwood);
  A.rbox(-3.35,.45,2.0,.3,.02,.22,.2,mt('map',1.2,.1),[1,1,1]);A.cyl(-3.3,.44,2.45,.07,.05,.04,14,mt('marble',3,.95),[.7,.75,.72],0,true)}
 /* globe on stand, filing cabinet, flags, coat stand */
 {const gx=3.55,gz=-3.25;for(let k=0;k<3;k++){const a=k/3*6.2832;A.tube([gx,.55,gz],[gx+Math.cos(a)*.25,0,gz+Math.sin(a)*.25],.018,8,M.dwood)}A.cyl(gx,.5,gz,.06,.05,.2,10,M.dwood,[1,1,1],0,true);
  A.sph(gx,.98,gz,.27,.27,.27,mt('map',1.1,.4),[1.05,1,.9]);for(let i=0;i<24;i++){const a0=i/24*6.2832,a1=(i+1)/24*6.2832;A.tube([gx+Math.cos(a0)*.3,.98+Math.sin(a0)*.3,gz],[gx+Math.cos(a1)*.3,.98+Math.sin(a1)*.3,gz],.01,6,M.brass,BR)}}
 {A.cb(4.55,.68,-3.65,.62,1.36,.55,0,.02,M.iron,[.42,.47,.36]);for(let k=0;k<4;k++){const y=.2+k*.33;A.cb(4.55,y,-3.37,.54,.29,.015,0,.005,M.iron,[.46,.51,.4]);A.tube([4.48,y+.06,-3.35],[4.62,y+.06,-3.35],.008,6,M.brass,BR);A.box(4.5,y+.1,-3.365,4.6,y+.14,-3.36,M.paper,[.95,.92,.82])}}
 const flag=(x,zc,col)=>{A.cyl(x,0,zc,.17,.14,.06,16,M.brass,BR,0,true);A.tube([x,.05,zc],[x,2.45,zc],.016,8,M.brass,BR);A.sph(x,2.5,zc,.045,.07,.045,M.brass,BR);
  const fb=new RR.GB();A.drape(x+.02,zc+.03,zc+.85,1.35,2.38,3,.04,M.fabric,col,1);A.drape(x+.0,zc+.03,zc+.85,1.35,2.38,3,.04,M.fabric,col,-1)};
 flag(-.95,-3.65,[.32,.3,.55]);flag(1.75,-3.65,[.75,.18,.14]);
 /* portrait behind desk */
 A.cb(.4,2.15,-D+.03,1.0,1.25,.06,0,.03,M.brass,BR);N.q([-.05,1.6,-D+.065],[.85,1.6,-D+.065],[.85,2.7,-D+.065],[-.05,2.7,-D+.065],[0,0,1],[1,1,1],mt('screen',1,.25),0,[[0,0],[1,0],[1,1],[0,1]]);
 /* wall sconces */
 for(const zz of[-2.3,1.0]){A.cb(-W+.05,1.75,zz,.04,.18,.1,0,.01,M.brass,BR);A.tube([-W+.06,1.72,zz],[-W+.22,1.82,zz],.012,6,M.brass,BR);N.cyl(-W+.22,1.84,zz,.06,.09,.13,14,M.paper,[1,.85,.62],1.2,true)}
 /* plants (palm in pot) */
 const palm=(x,zc)=>{A.cyl(x,0,zc,.2,.25,.48,18,mt('concrete',2,.3),[.62,.35,.22],0,true);A.cyl(x,.45,zc,.22,.22,.04,18,mt('concrete',2,.3),[.55,.3,.2],0,true);A.tube([x,.45,zc],[x+.02,1.1,zc],.025,8,M.wood,[.6,.5,.4]);
  let s=11;const rr=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<150;i++){const a=rr()*6.283,h=.65+rr()*.9,rad=(.12+rr()*.32)*(1-Math.abs(h-1.1)*.6);const g=.75+rr()*.5;
   A.sph(x+Math.cos(a)*rad,h,zc+Math.sin(a)*rad,.07,.025,.045,mt('plaster',3,.35),[.20*g,.40*g,.16*g])}};
 palm(4.5,3.4);palm(-1.15,-3.55);
 /* door */
 {A.cb(-3.35,1.12,D-.04,1.1,2.24,.06,0,.01,M.dwood);for(const y of[.55,1.6])A.cb(-3.35,y,D-.075,.8,.75,.02,0,.01,M.wood);A.cb(-3.35,2.29,D-.06,1.3,.12,.1,0,.02,M.wood);A.sph(-3.0,1.05,D-.1,.035,.035,.035,M.brass,BR)}
 /* sun rays */
 const sd=RR.m.nrm(T.L.sunD);const ray=[];const push=(p,a)=>ray.push(p[0],p[1],p[2],a);
 win.forEach(([a,b])=>{const C=[[W+.1,wy0,a],[W+.1,wy0,b],[W+.1,wy1,b],[W+.1,wy1,a]];const F=C.map(c=>{const k=c[1]/sd[1];return[c[0]-sd[0]*k,0.002,c[2]-sd[2]*k]});
  for(let i=0;i<4;i++){const j=(i+1)%4;const a0=.06,a1=.012;push(C[i],a0);push(C[j],a0);push(F[j],a1);push(C[i],a0);push(F[j],a1);push(F[i],a1)}});
 const dust=[];{let q=9;const fr=()=>{q=(q*16807)%2147483647;return q/2147483647};
 win.forEach(([a,b])=>{for(let i=0;i<650;i++){const y=wy0+fr()*(wy1-wy0),zz=a+fr()*(b-a),t=fr()*.95;const k=t*(y/sd[1]);dust.push(W+.1-sd[0]*k,y-sd[1]*k,zz-sd[2]*k,.5+fr()*1.6)}})}
 const scene={dustArr:new Float32Array(dust),dustCol:[1,.86,.6],dustSize:.02,rmin:[-W,0,-D],rmax:[W,H,D],L:T.L,rayArr:new Float32Array(ray),rayCol:[1.0,.82,.55]};return{A,N,scene}};
RR.CAMS2=[{e:[-1.5,1.6,3.75],t:[.6,1.05,-2.6],fov:1.12},{e:[-2.6,1.45,0.6],t:[4.9,1.25,-1.0],fov:1.1},{e:[2.35,1.45,-.75],t:[.2,.82,-2.45],fov:.95},{e:[1.0,1.55,1.2],t:[-4.9,1.2,.6],fov:1.12}];
