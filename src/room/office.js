/* Minister's office: 10 x 8 x 3.4 m. Window wall at x=+5 (sun from +x). */
RR.THEMES={
 ww2:{atlas:{wood:[150,95,55],dwood:[78,46,28],lwood:[176,128,82],rugA:[110,28,26],rugB:[214,190,140],rugC:[28,34,64],carpet:[90,40,35],leather:[96,52,32],fabric:[96,32,30],metal:[110,115,100],panel:[90,95,85],concrete:[150,145,135],mapStyle:'paper',sky:['#bcd0d8','#e8dcc0','#e6d2a8'],view:'town',scrBg:'#111',scrFg:'#9f9',},
  wallC:[.93,.86,.72],ceilC:[.95,.92,.85],
  L:{sunD:[1,.62,.38],sunC:[5.2,4.0,2.8],sky:[.30,.27,.22],gnd:[.16,.12,.09],spP:[.4,3.25,-2.0],spD:[0,-1,0],spC:[5,3.6,2.2],spAng:.9,pl:[[-3,2.9,1.5],[2,2.9,1.5],[-.2,1.4,-2.25],[-4,.9,-3.5]],pc:[[1.2,.8,.45],[1.0,.7,.4],[.7,.6,.3],[0,0,0]],exp:1.15}},
 modern:{atlas:{wood:[196,160,118],dwood:[120,92,66],lwood:[214,186,148],rugA:[140,140,138],rugB:[170,170,168],rugC:[120,120,118],carpet:[128,128,126],leather:[40,40,42],fabric:[118,122,128],metal:[175,178,182],panel:[200,200,198],concrete:[160,160,158],mapStyle:'screen',sky:['#5d93d6','#a9cdee','#dfeaf4'],view:'city',scrBg:'#0f1c28',scrFg:'#5ec8ff'},
  wallC:[.97,.97,.96],ceilC:[.98,.98,.98],
  L:{sunD:[1,.7,.25],sunC:[5.5,5.1,4.6],sky:[.42,.46,.52],gnd:[.22,.21,.20],spP:[.4,3.3,-2.0],spD:[0,-1,0],spC:[3.5,3.5,3.4],spAng:1.0,pl:[[-3,3.1,1.5],[2,3.1,1.5],[-3,3.1,-2],[2.5,3.1,2.8]],pc:[[1.1,1.1,1.05],[1.1,1.1,1.05],[.9,.9,.9],[.6,.6,.6]],exp:1.0}},
 future:{atlas:{wood:[60,62,70],dwood:[40,42,50],lwood:[200,205,215],rugA:[20,24,34],rugB:[0,200,230],rugC:[40,44,60],carpet:[26,28,36],leather:[230,232,236],fabric:[60,64,80],metal:[120,125,140],panel:[52,56,68],concrete:[36,38,46],mapStyle:'holo',sky:['#05060f','#1a1036','#3a1850'],view:'neon',scrBg:'#020a12',scrFg:'#00e5ff'},
  wallC:[1,1,1],ceilC:[.5,.52,.6],
  L:{sunD:[1,.5,.3],sunC:[.25,.28,.55],sky:[.10,.10,.18],gnd:[.04,.04,.07],spP:[.4,3.25,-2.0],spD:[0,-1,0],spC:[1.6,2.8,3.4],spAng:.95,pl:[[-4.6,1.6,0],[4.4,1.4,-3.6],[-1.5,1.3,1.5],[2,3,2.5]],pc:[[0,1.3,1.7],[1.6,.3,1.3],[0,1.6,2.0],[.6,.5,1.2]],exp:1.25}}};
RR.office=function(th){const T=RR.THEMES[th],mt=RR.mt;const A=new RR.GB(),N=new RR.GB();
 const W=5,D=4,H=3.4,t=.2;
 const M={floor:th==='ww2'?mt('parquet',.9,.35):th==='modern'?mt('parquet',.6,.3):mt('concrete',.6,.85),
  wall:th==='future'?mt('panel',.42,.35):mt('plaster',.5,.02),ceil:mt('plaster',.4,0),
  wood:mt('wood',1.2,.45),lwood:mt('lwood',1,.3),leather:mt('leather',1.2,.45),fabric:mt('fabric',2,.05),metal:mt('metal',1,.75),
  rug:mt('rug',.25,0),carpet:mt('carpet',.6,0),books:mt('books',1.4,.1),brass:mt('metal',2,.9),marble:mt('marble',.6,.6),white:mt('plaster',1,.4),panel:mt('panel',.6,.5)};
 const wc=T.wallC;
 // floor & ceiling
 A.box(-W,-.1,-D,W,0,D,M.floor,th==='future'?[.9,.9,1]:[1,1,1]);A.box(-W,H,-D,W,H+.1,D,M.ceil,T.ceilC);
 // walls (window wall x=+W has two windows)
 A.box(-W-t,0,-D-t,W+t,H,-D,M.wall,wc);A.box(-W-t,0,D,W+t,H,D+t,M.wall,wc);A.box(-W-t,0,-D,-W,H,D,M.wall,wc);
 const win=[[-3.2,-1.2],[.6,2.6]],wy0=.75,wy1=2.95;
 let z=-D;win.forEach(([a,b])=>{A.box(W,0,z,W+t,H,a,M.wall,wc);A.box(W,0,a,W+t,wy0,b,M.wall,wc);A.box(W,wy1,a,W+t,H,b,M.wall,wc);z=b});A.box(W,0,z,W+t,H,D,M.wall,wc);
 // window glass (view) + frames
 win.forEach(([a,b])=>{N.q([W+.12,wy0,b],[W+.12,wy0,a],[W+.12,wy1,a],[W+.12,wy1,b],[-1,0,0],[1,1,1],RR.mt('view',1,0),th==='future'?.3:.2,[[0,0],[1,0],[1,1],[0,1]]);
  const fc=th==='ww2'?[.45,.30,.18]:th==='modern'?[.2,.2,.21]:[.3,.32,.38],fm=th==='ww2'?M.wood:M.metal;
  A.box(W-.06,wy0-.05,a-.06,W+.1,wy0+.03,b+.06,fm,fc);A.box(W-.06,wy1-.03,a-.06,W+.1,wy1+.05,b+.06,fm,fc);A.box(W-.06,wy0,a-.06,W+.1,wy1,a,fm,fc);A.box(W-.06,wy0,b,W+.1,wy1,b+.06,fm,fc);
  const mid=(a+b)/2;A.box(W-.04,wy0,mid-.025,W+.08,wy1,mid+.025,fm,fc);if(th==='ww2')for(const yy of[1.48,2.2])A.box(W-.04,yy-.02,a,W+.08,yy+.02,b,fm,fc);
  A.box(W-.25,wy0-.08,a-.1,W+.02,wy0-.02,b+.1,th==='ww2'?M.wood:M.white,th==='ww2'?[.8,.7,.6]:[1,1,1]);
  if(th==='ww2'){for(const s of[a-.35,b+.05])A.box(W-.18,.3,s,W-.06,H-.15,s+.3,M.fabric,[.95,.5,.45]);A.box(W-.15,H-.2,a-.4,W-.1,H-.15,b+.4,M.brass,[1,.85,.55])}
  if(th==='ww2'||th==='modern'){const rx=W-.3;A.box(rx-.1,.15,a+.2,rx,.6,b-.2,M.metal,th==='ww2'?[.8,.78,.72]:[1,1,1])}});
 // door (front wall)
 A.box(-3.9,0,D-.06,-2.8,2.25,D,M.wood,th==='future'?[.5,.5,.6]:[1,1,1]);A.box(-3.98,2.25,D-.08,-2.72,2.33,D,M.wood);
 // theme wall treatments
 if(th==='ww2'){const pw=M.wood;A.box(-W,0,-D,W-.01,1.15,-D+.05,pw);A.box(-W,0,D-.05,W-.01,1.15,D,pw);A.box(-W,0,-D,-W+.05,1.15,D,pw);
  for(let x=-4.5;x<4.9;x+=.75)A.box(x,.15,-D+.05,x+.6,1.0,-D+.07,pw,[.85,.85,.85]);
  A.box(-W,1.15,-D,W,1.2,-D+.08,pw);A.box(-W,1.15,D-.08,W,1.2,D,pw);A.box(-W,1.15,-D,-W+.08,1.2,D,pw);
  A.box(-W,H-.18,-D,W,H,-D+.14,M.white,[.96,.93,.86]);A.box(-W,H-.18,D-.14,W,H,D,M.white,[.96,.93,.86]);A.box(-W,H-.18,-D,-W+.14,H,D,M.white,[.96,.93,.86])}
 else{A.box(-W,0,-D,W,.1,-D+.02,th==='future'?M.metal:M.white,th==='future'?[.4,.4,.5]:[1,1,1]);A.box(-W,0,D-.02,W,.1,D,M.white);A.box(-W,0,-D,-W+.02,.1,D,M.white)}
 if(th==='modern'){A.box(-W,0,-D,-W+.04,H,D,mt('concrete',.5,.1),[1.15,1.15,1.12])}
 if(th==='future'){for(const z of[-D+.02,D-.03])N.box(-W,.14,z,W,.18,z+.01,M.metal,[0,.9,1],1.2);N.box(-W+.02,.14,-D,-W+.03,.18,D,M.metal,[0,.9,1],1.2);
  for(let x=-4;x<=4;x+=2)N.box(x-.08,H-.02,-3.5,x+.08,H-.01,3.5,M.white,[.4,.85,1],.6)}
 // ceiling lights
 if(th==='ww2'){for(const p of[[-3,1.5],[2,1.5]]){A.cyl(p[0],H-.6,p[1],.02,.02,.6,6,M.brass,[1,.85,.5]);A.cyl(p[0],H-.75,p[1],.35,.12,.18,14,M.brass,[1,.85,.5],0,true);for(let k=0;k<5;k++){const a=k/5*6.283;N.sph(p[0]+Math.cos(a)*.32,H-.62,p[1]+Math.sin(a)*.32,.07,.1,.07,M.white,[1,.85,.6],2.5)}}}
 if(th==='modern'){for(const p of[[-3,1.5],[2,1.5],[-3,-2],[2.5,2.8]])N.box(p[0]-.6,H-.015,p[1]-.6,p[0]+.6,H,p[1]+.6,M.white,[1,1,1],2.2)}
 // rug
 const rugM=th==='ww2'?M.rug:th==='modern'?M.carpet:mt('rug',.25,.2);A.box(-2.2,0,-3.2,3.1,.012,.9,rugM);if(th!=='modern')A.q([-2.2,.0125,.9],[3.1,.0125,.9],[3.1,.0125,-3.2],[-2.2,.0125,-3.2],[0,1,0],[1,1,1],rugM,0,[[0,0],[1,0],[1,1],[0,1]]);
 // desk
 const dx=.4,dz=-2.2;
 if(th==='ww2'){A.box(dx-1.2,0,dz-.55,dx-.55,.74,dz+.5,M.wood);A.box(dx+.55,0,dz-.55,dx+1.2,.74,dz+.5,M.wood);A.box(dx-1.25,.74,dz-.6,dx+1.25,.79,dz+.55,M.wood);A.box(dx-.9,.79,dz-.4,dx+.9,.795,dz+.35,M.leather,[.35,.55,.35]);
  A.box(dx-.55,.45,dz+.45,dx+.55,.74,dz+.5,M.wood,[.8,.8,.8]);for(const y of[.2,.45])for(const s of[-.87,.87])A.box(dx+s-.05,y,dz+.5,dx+s+.05,y+.03,dz+.52,M.brass,[1,.85,.5]);
  // banker lamp
  A.box(dx+.55,.795,dz-.2,dx+.75,.82,dz-.05,M.brass,[1,.85,.5]);A.cyl(dx+.65,.82,dz-.12,.012,.012,.32,6,M.brass,[1,.85,.5]);N.cyl(dx+.65,1.1,dz-.12,.16,.06,.1,14,M.white,[.2,.7,.3],.6,true);N.sph(dx+.65,1.1,dz-.12,.04,.03,.04,M.white,[1,.9,.6],3);
  // phone, typewriter, papers
  A.box(dx-.75,.795,dz-.15,dx-.5,.86,dz+.05,M.metal,[.12,.12,.12]);A.cyl(dx-.625,.86,dz-.05,.07,.07,.02,12,M.metal,[.9,.9,.9],0,true);A.box(dx-.72,.88,dz-.2,dx-.53,.92,dz-.16,M.metal,[.12,.12,.12]);
  A.box(dx-.2,.795,dz-.1,dx+.25,.9,dz+.2,M.metal,[.16,.18,.16]);A.box(dx-.15,.9,dz-.1,dx+.2,.98,dz-.02,M.metal,[.16,.18,.16]);A.box(dx-.1,.9,dz-.05,dx+.15,1.04,dz-.04,M.white,[1,1,.95]);
  for(let k=0;k<4;k++)A.rbox(dx+.25+k*.02,.80+k*.004,dz+.15,.21,.003,.29,.2-k*.15,M.white,[.97,.95,.88])}
 else if(th==='modern'){A.box(dx-1.3,.72,dz-.6,dx+1.3,.76,dz+.55,M.lwood);for(const s of[-1.2,1.15])A.box(dx+s,0,dz-.5,dx+s+.05,.72,dz+.45,M.metal,[.25,.25,.27]);
  for(const s of[-.42,.42]){A.cyl(dx+s,.76,dz-.25,.08,.03,.25,8,M.metal,[.2,.2,.2]);A.rbox(dx+s,1.18,dz-.25,.72,.42,.03,s*-.35,M.metal,[.08,.08,.09]);
   const C=Math.cos(s*-.35),Sn=Math.sin(s*-.35);const cx=dx+s,cz=dz-.25+.018;const P=(u,v)=>[cx+u*C,1.18+v,cz-u*Sn];N.q(P(-.34,-.19),P(.34,-.19),P(.34,.19),P(-.34,.19),[Sn,0,C],[1,1,1],RR.mt('screen',1,.6),.5,[[0,0],[1,0],[1,1],[0,1]])}
  A.box(dx-.3,.76,dz+.1,dx+.15,.78,dz+.25,M.metal,[.85,.85,.85]);A.cyl(dx+.6,.76,dz+.2,.04,.04,.1,10,M.white,[.9,.9,.9],0,true)}
 else{A.box(dx-1.4,.7,dz-.6,dx+1.4,.76,dz+.5,M.metal,[.85,.88,.95]);A.box(dx-1.2,0,dz-.4,dx+1.2,.7,dz+.2,M.panel,[.7,.7,.8]);N.box(dx-1.42,.72,dz+.5,dx+1.42,.74,dz+.52,M.white,[0,.9,1],2);
  for(const[s,r]of[[-.7,.35],[0,0],[.7,-.35]]){const C=Math.cos(r),Sn=Math.sin(r);const cx=dx+s,cz=dz-.3,cy=1.3;const P=(u,v)=>[cx+u*C,cy+v,cz-u*Sn];N.q(P(-.36,-.22),P(.36,-.22),P(.36,.22),P(-.36,.22),[Sn,0,C],[1,1,1],RR.mt('map',1,0),.7,[[0,0],[1,0],[1,1],[0,1]])}}
 // chairs
 const chair=(x,z,ry,kind)=>{if(kind==='ww2'){A.rbox(x,.42,z,.62,.14,.6,ry,M.leather);const C=Math.cos(ry),Sn=Math.sin(ry);A.rbox(x-Sn*.28,.85,z-C*.28,.62,.75,.14,ry,M.leather);A.rbox(x+C*.33,.6,z-Sn*.33,.1,.3,.55,ry,M.leather);A.rbox(x-C*.33,.6,z+Sn*.33,.1,.3,.55,ry,M.leather);
   for(const[a,b]of[[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]])A.cyl(x+a*C+b*Sn,0,z-a*Sn+b*C,.03,.03,.36,6,M.wood)}
  else if(kind==='modern'){A.rbox(x,.47,z,.55,.08,.52,ry,M.fabric,[.25,.25,.27]);const C=Math.cos(ry),Sn=Math.sin(ry);A.rbox(x-Sn*.26,.95,z-C*.26,.5,.75,.06,ry,M.fabric,[.25,.25,.27]);A.cyl(x,.08,z,.03,.03,.38,8,M.metal);for(let k=0;k<5;k++){const a=k/5*6.283;A.rbox(x+Math.cos(a)*.15,.05,z+Math.sin(a)*.15,.3,.04,.05,-a,M.metal,[.2,.2,.2])}}
  else{A.rbox(x,.46,z,.6,.12,.58,ry,M.leather);const C=Math.cos(ry),Sn=Math.sin(ry);A.rbox(x-Sn*.27,.95,z-C*.27,.56,.85,.1,ry,M.leather);N.rbox(x-Sn*.33,.95,z-C*.33,.04,.7,.02,ry,M.white,[0,.9,1],1.5);A.cyl(x,0,z,.25,.06,.4,12,M.metal,[.6,.62,.7],0,true)}};
 chair(dx,dz-1.0,Math.PI,th);chair(dx-.7,dz+1.25,0,th);chair(dx+.7,dz+1.25,0,th);
 // bookshelf on back wall left
 const bx0=-4.6,bx1=-1.6,bz=-D;
 if(th!=='future'){const sm=th==='ww2'?M.wood:M.lwood;A.box(bx0,0,bz,bx1,2.6,bz+.03,sm,[.75,.75,.75]);A.box(bx0,2.55,bz,bx1,2.6,bz+.4,sm);for(let y=.05;y<2.6;y+=.5){A.box(bx0,y,bz,bx1,y+.04,bz+.4,sm);if(y<2.4)A.box(bx0+.05,y+.04,bz+.04,bx1-.05,y+.42,bz+.32,M.books)}A.box(bx0,0,bz,bx0+.05,2.6,bz+.4,sm);A.box(bx1-.05,0,bz,bx1,2.6,bz+.4,sm)}
 else{for(let y=.4;y<2.6;y+=.55){A.box(bx0,y,bz,bx1,y+.05,bz+.35,M.metal,[.6,.62,.7]);N.box(bx0,y-.01,bz+.33,bx1,y,bz+.35,M.white,[0,.9,1],1.2);for(let k=0;k<5;k++)A.box(bx0+.2+k*.55,y+.05,bz+.1,bx0+.4+k*.55,y+.05+.15+k%3*.08,bz+.25,M.white,[.85,.9,1])}}
 // left wall: map / painting / screen
 const mw=-W+.02;
 if(th==='ww2'){A.box(mw,1.25,-1.2,mw+.04,2.75,1.6,M.wood);N.q([mw+.05,1.32,1.53],[mw+.05,1.32,-1.13],[mw+.05,2.68,-1.13],[mw+.05,2.68,1.53],[1,0,0],[1,1,1],RR.mt('map',1,0),.08,[[0,0],[1,0],[1,1],[0,1]])}
 else if(th==='modern'){A.box(mw,1.1,-1.3,mw+.06,2.6,1.4,M.metal,[.08,.08,.09]);N.q([mw+.07,1.15,1.35],[mw+.07,1.15,-1.25],[mw+.07,2.55,-1.25],[mw+.07,2.55,1.35],[1,0,0],[1,1,1],RR.mt('map',1,0),.6,[[0,0],[1,0],[1,1],[0,1]])}
 // sofa / lounge (front-left)
 if(th==='future'){A.cyl(-2.6,0,1.9,.6,.5,.75,20,M.metal,[.5,.52,.6],0,true);N.cyl(-2.6,.75,1.9,.5,.5,.02,20,M.white,[0,.9,1],1.5,true);
  const P=(u,v)=>[-2.6+u,1.5+v,1.9];N.q(P(-.6,-.35),P(.6,-.35),P(.6,.35),P(-.6,.35),[0,0,1],[1,1,1],RR.mt('map',1,0),.9,[[0,0],[1,0],[1,1],[0,1]]);N.q(P(.6,-.35),P(-.6,-.35),P(-.6,.35),P(.6,.35),[0,0,-1],[1,1,1],RR.mt('map',1,0),.9,[[1,0],[0,0],[0,1],[1,1]])}
 else{const sf=th==='ww2'?M.leather:M.fabric,sc=th==='ww2'?[1,1,1]:[.8,.82,.86];A.box(-4.9,0,.9,-4.0,.42,3.1,sf,sc);A.box(-4.9,.42,.9,-4.65,.95,3.1,sf,sc);A.box(-4.9,.42,.75,-4.05,.7,1.0,sf,sc);A.box(-4.9,.42,3.0,-4.05,.7,3.25,sf,sc);
  A.box(-3.6,0,1.4,-2.7,.42,2.6,th==='ww2'?M.wood:M.lwood);if(th==='modern')A.box(-3.6,.42,1.4,-2.7,.44,2.6,M.marble)}
 // plants / globe / flag / filing cabinet
 const plant=(x,z)=>{A.cyl(x,0,z,.22,.17,.45,14,th==='ww2'?mt('concrete',1.5,.2):M.white,th==='ww2'?[.8,.5,.35]:[1,1,1],0,true);for(let k=0;k<9;k++){const a=k*2.4,r=.12+(k%3)*.08;A.rbox(x+Math.cos(a)*r,.6+k*.06,z+Math.sin(a)*r,.08,.5,.28,a,mt('fabric',3,.2),[.25,.55,.25])}};
 if(th!=='future'){plant(4.5,3.5);plant(-1.2,-3.6)}
 if(th==='ww2'){A.cyl(3.6,0,-3.3,.18,.12,.8,10,M.wood,[1,1,1],0,true);A.sph(3.6,1.05,-3.3,.28,.28,.28,mt('map',.8,.3),[1,1,1]);
  A.box(4.2,0,-3.9,4.85,1.35,-3.35,M.metal,[.55,.6,.48]);for(let y=.25;y<1.3;y+=.33)A.box(4.45,y,-3.36,4.6,y+.03,-3.33,M.brass,[1,.85,.5])}
 const flag=(x,z,col)=>{A.cyl(x,0,z,.16,.16,.05,10,M.brass,[1,.85,.5],0,true);A.cyl(x,0,z,.02,.02,2.4,6,M.brass,[1,.85,.5]);A.sph(x,2.42,z,.05,.05,.05,M.brass,[1,.85,.5]);
  for(let k=0;k<6;k++){const z0=z+.04+k*.12;A.box(x+Math.sin(k)*.03,1.4,z0,x+Math.sin(k)*.03+.02,2.3,z0+.12,M.fabric,col)}};
 flag(-.9,-3.6,th==='future'?[.2,.25,.5]:[.36,.32,.55]);flag(1.7,-3.6,th==='ww2'?[.6,.15,.12]:[.15,.35,.25]);
 const scene={rmin:[-W,0,-D],rmax:[W,H,D],L:T.L};return{A,N,scene}};
RR.CAMS=[{e:[-1.4,1.62,3.7],t:[.7,1.0,-2.6],fov:1.12},{e:[-2.4,1.5,0.4],t:[4.8,1.15,-.8],fov:1.12}];
