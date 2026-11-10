import json
d=json.load(open('map.json')); a=json.load(open('adj.json'))
bg=[]
for i,rp in enumerate(d['ripples'][::-1]):
    bg.append(f'<path d="{rp}" fill="none" stroke="#5F8DA6" stroke-width="0.8" stroke-opacity="{0.25+0.2*i:.2f}" fill-rule="evenodd"/>')
bg.append(f'<path d="{d["coast"]}" fill="#EADFC4" stroke="#3F5563" stroke-width="3" stroke-opacity="0.35" fill-rule="evenodd"/>')
G={
'mount':'<path d="M-9,5 L-3,-6 L0,-2 L4,-7 L10,5 Z" fill="#9C94AE" fill-opacity=".55" stroke="#4D4560" stroke-opacity=".6" stroke-width="1"/>',
'tree':'<path d="M0,6 L0,1" stroke="#5B4A33" stroke-opacity=".6" stroke-width="1.2"/><circle cx="0" cy="-2" r="4.2" fill="#6E9478" fill-opacity=".55" stroke="#3E5E47" stroke-opacity=".6" stroke-width="0.9"/>',
'dune':'<path d="M-10,3 Q-4,-4 2,3 M-2,5 Q4,-1 10,5" fill="none" stroke="#9C7436" stroke-opacity=".6" stroke-width="1.3" stroke-linecap="round"/>',
'grass':'<path d="M-5,4 L-3,-3 M0,4 L0,-5 M5,4 L3,-3 M-9,5 L9,5" fill="none" stroke="#66783A" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>',
'hill':'<path d="M-10,4 Q-4,-5 2,4 M0,4 Q5,-2 10,4" fill="none" stroke="#7D6A47" stroke-opacity=".6" stroke-width="1.1"/>',
'marsh':'<path d="M-9,3 L9,3 M-6,0 L6,0 M-3,-3 L-3,3 M3,-4 L3,3" fill="none" stroke="#5F7F6E" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"/>',
'palm':'<path d="M0,6 Q1,0 0,-3 M0,-3 Q-5,-5 -8,-1 M0,-3 Q5,-5 8,-1 M0,-3 Q-2,-7 -5,-8 M0,-3 Q2,-7 5,-8" fill="none" stroke="#4F7A50" stroke-opacity=".65" stroke-width="1.3" stroke-linecap="round"/>',
}
def gl(k,name):
    if k=='m': return 'mount'
    if k=='p': return 'tree'
    if k=='d': return 'palm' if name in('الواحة','النخيل') else 'dune'
    if k=='f': return 'grass'
    return {'التلال':'hill','المستنقع':'marsh','جزيرة الكنز':'palm','منجم الذهب':None}.get(name,'tree')
names=[r['name'] for r in d['regions']]
glyph=[]
for k,n,x,y in d['glyphs']:
    g=gl(k,n)
    # keep glyphs away from label stack
    r=d['regions'][names.index(n)]
    if g and not (abs(x-r['lx'])<34 and -34<y-r['ly']<40): glyph.append(f'<g transform="translate({x:.0f},{y:.0f})">{G[g]}</g>')
regions=[dict(name=r['name'],k=r['k'],size=r['size'],cap=r['cap'],path=r['path'],lx=r['lx'],ly=r['ly'],coastal=a['coastal'][i]) for i,r in enumerate(d['regions'])]
data=dict(coast=d['coast'],gl=d['glyphs'],regions=regions,adj=a['adj'],bg=''.join(bg),glyphs=''.join(glyph),route='M722,400 Q704,392 684,398')
open('gamedata.json','w').write(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print(len(json.dumps(data)))
