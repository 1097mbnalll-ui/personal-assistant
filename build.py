"""Build dist/index.html from src/. Run: python3 build.py"""
import os
B=os.path.dirname(os.path.abspath(__file__));S=lambda p:open(os.path.join(B,'src',p),encoding='utf-8').read()
js="\n".join(S(p) for p in['three_d.js','theme.js','room/room.js','room/building.js','realroom.js','interior.js'])
h=S('template.html').replace('__3D__',js).replace('__DATA__',S('gamedata.json'))
os.makedirs(os.path.join(B,'dist'),exist_ok=True);open(os.path.join(B,'dist','index.html'),'w',encoding='utf-8').write(h);print('built dist/index.html',len(h))
