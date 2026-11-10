import numpy as np, json
from scipy import ndimage as nd
from contourpy import contour_generator
rng=np.random.default_rng(7)
W,H=800,794; C=2; gw,gh=W//C,H//C
yy,xx=np.mgrid[0:gh,0:gw].astype(float)
def noise(scale,seed):
    r=np.random.default_rng(seed)
    g=r.random((int(gh/scale)+3,int(gw/scale)+3))
    z=nd.zoom(g,scale,order=3)[:gh,:gw]
    return (z-z.mean())/z.std()
def fbm(seed,base=40):
    return sum(noise(base/2**o,seed+o)*0.5**o for o in range(4))
# land
cx,cy=370/C,400/C; rx,ry=322/C,342/C
r=(np.abs((xx-cx)/rx)**3.2+np.abs((yy-cy)/ry)**3.2)**(1/3.2)
land=(r+0.032*fbm(1,30)+0.015*fbm(5,10))<1.0
land=nd.binary_fill_holes(land)
lb0,n0=nd.label(land); sz0=nd.sum(land,lb0,range(1,n0+1)); land=lb0==(np.argmax(sz0)+1)
ix,iy=750/C,405/C
isl=nd.binary_fill_holes((np.hypot((xx-ix)/16,(yy-iy)/28)+0.06*fbm(9,10))<1.0)&~nd.binary_dilation(land,iterations=8)
land=land|isl
lab,n=nd.label(land); sizes=nd.sum(land,lab,range(1,n+1))
keep=[i+1 for i,s in enumerate(sizes) if s>300]
land=np.isin(lab,keep)
# seeds: name, kingdom, size, x,y, capital
K={'m':'الجبال','p':'الموانئ','d':'الصحراء','f':'السهول','n':'محايد'}
S=[
("الحصن","m","M",130,200,1),("قمم الثلج","m","L",250,125,0),("الحديد","m","M",105,315,0),("الممر","m","S",250,235,0),("الوادي","m","S",190,330,0),
("الأسطول","p","M",610,200,1),("الخليج","p","L",490,125,0),("اللؤلؤ","p","M",635,315,0),("المنارة","p","S",490,235,0),("الشعاب","p","S",550,330,0),
("الواحة","d","M",130,600,1),("الكثبان","d","L",250,680,0),("القوافل","d","M",105,485,0),("السراب","d","S",250,565,0),("النخيل","d","S",190,470,0),
("المخزن","f","M",610,600,1),("السهول","f","L",490,680,0),("الأنهار","f","M",635,485,0),("الطاحونة","f","S",490,565,0),("الحقول","f","S",550,470,0),
("منجم الذهب","n","S",370,400,0),("الجسر","n","M",370,215,0),("المفترق","n","M",370,590,0),("التلال","n","L",215,400,0),("المستنقع","n","L",525,400,0),
("جزيرة الكنز","n","M",750,405,0),
]
tgt={'L':3.0,'M':1.9,'S':1.0}
P=np.array([[s[3]/C,s[4]/C] for s in S])
wx=fbm(21,25)*5; wy=fbm(33,25)*5
X=xx+wx; Y=yy+wy
D=np.stack([np.hypot(X-p[0],Y-p[1]) for p in P])
isl_idx=[i for i,s in enumerate(S) if s[0]=="جزيرة الكنز"][0]
islmask=isl&land
w=np.zeros(len(S))
D[isl_idx]=1e9
mainland=land&~islmask
for it in range(300):
    L=np.argmin(D-w[:,None,None],axis=0)
    L[islmask]=isl_idx
    L2=L.copy(); L2[~land]=-1
    L2[mainland & (L==isl_idx)]=-2
    area=np.array([(L2==i).sum() for i in range(len(S))],float)
    t=np.array([tgt[s[2]] for s in S]); 
    mi=[i for i in range(len(S)) if i!=isl_idx]
    t_scaled=t[mi]/t[mi].sum()*mainland.sum()
    w[mi]+=0.3*(np.sqrt(t_scaled)-np.sqrt(np.maximum(area[mi],1)))
    w[isl_idx]=-1e4
L=np.argmin(D-w[:,None,None],axis=0); L[islmask]=isl_idx; L[~land]=-1
# connectivity cleanup
for i in range(len(S)):
    m=L==i; lb,k=nd.label(m)
    if k>1:
        sz=nd.sum(m,lb,range(1,k+1)); big=np.argmax(sz)+1
        for j in range(1,k+1):
            if j!=big: L[lb==j]=-3
while (L==-3).any():
    bad=L==-3
    idx=nd.distance_transform_edt(np.isin(L,[-3]),return_distances=False,return_indices=True)
    L2=L[idx[0],idx[1]]; L[bad]=L2[bad]
    L[~land]=-1
    if (L==-3).sum()==0: break
area={S[i][0]:int((L==i).sum()) for i in range(len(S))}
def contours(mask,sigma=1.3,level=0.5):
    f=nd.gaussian_filter(mask.astype(float),sigma)
    cg=contour_generator(z=np.pad(f,1),name='serial')
    out=[]
    for ln in cg.lines(level):
        if len(ln)<8: continue
        ln=(ln-1)*C
        out.append("M"+" L".join(f"{x:.1f},{y:.1f}" for x,y in ln[::2])+"Z")
    return " ".join(out)
regions=[]
dist_inside=[]
for i,s in enumerate(S):
    m=L==i
    dt=nd.distance_transform_edt(m)
    cyx=np.unravel_index(np.argmax(dt*(1+0.0*dt)),dt.shape)
    # label point: center of mass nudged to max inset
    com=nd.center_of_mass(m)
    # choose point maximizing dt minus distance from com
    score=dt-0.15*np.hypot(yy-com[0],xx-com[1])
    ly,lx=np.unravel_index(np.argmax(score),score.shape)
    regions.append(dict(name=s[0],k=s[1],size=s[2],cap=s[5],path=contours(m),lx=int(lx*C),ly=int(ly*C),dt=dt))
kpaths={}
for k in K:
    m=np.isin(L,[i for i,s in enumerate(S) if s[1]==k])
    kpaths[k]=contours(m,1.6)
coast=contours(land,1.6)
sea_d=nd.distance_transform_edt(~land)
ripples=[contours(sea_d<d,2.0) for d in (5,10,17)]
# terrain glyphs
glyphs=[]
gr=np.random.default_rng(3)
for i,rg in enumerate(regions):
    m=rg['dt']
    cand=np.argwhere(m>7)
    gr.shuffle(cand)
    placed=[]
    want={'L':7,'M':4,'S':2}[rg['size']]
    for yx in cand:
        y,x=yx*C
        if np.hypot(x-rg['lx'],(y-rg['ly'])*1.6)<46: continue
        if any(np.hypot(x-a,y-b)<26 for a,b in placed): continue
        placed.append((x,y))
        if len(placed)>=want: break
    for x,y in placed: glyphs.append((rg['k'],rg['name'],float(x),float(y)))
json.dump(dict(regions=[{k:v for k,v in r.items() if k!='dt'} for r in regions],kpaths=kpaths,coast=coast,ripples=ripples,glyphs=glyphs,area=area),open('map.json','w'))
print(area)

# adjacency
adj=set()
for a,b in [(L[:,:-1],L[:,1:]),(L[:-1,:],L[1:,:])]:
    m=(a!=b)&(a>=0)&(b>=0)
    for x,y in set(zip(a[m].tolist(),b[m].tolist())):
        if (a[m]==x).sum()>0: adj.add((min(x,y),max(x,y)))
# count shared border length to drop corner touches
from collections import Counter
cnt=Counter()
for a,b in [(L[:,:-1],L[:,1:]),(L[:-1,:],L[1:,:])]:
    m=(a!=b)&(a>=0)&(b>=0)
    for x,y in zip(a[m].tolist(),b[m].tolist()): cnt[(min(x,y),max(x,y))]+=1
adj=[list(k) for k,v in cnt.items() if v>=4]
# island links: mainland regions near route endpoint
px,py=int(684/C),int(398/C)
near=set()
for dy in range(-8,9):
    for dx in range(-8,9):
        v=L[py+dy,px+dx]
        if v>=0 and v!=isl_idx: near.add(int(v))
for v in near: adj.append([min(v,isl_idx),max(v,isl_idx)])
coastal=[bool((nd.binary_dilation(L==i,iterations=2)&~land).any()) for i in range(len(S))]
json.dump(dict(adj=adj,coastal=coastal,near=list(near)),open('adj.json','w'))
print(len(adj),near,[S[i][0] for i in range(len(S)) if coastal[i]])
