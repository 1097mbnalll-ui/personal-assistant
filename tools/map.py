import random
random.seed(11)
S=64; O=30
V={}
for i in range(6):
    for j in range(6):
        edge = i in(0,5) or j in(0,5)
        a = 10 if edge else 8
        V[(i,j)]=(O+S*j+random.uniform(-a,a), O+S*i+random.uniform(-a,a))
# (row,col): (ramp, label, kind)
names={
(0,0):("purple","الحصن","p"),(0,1):("purple","الثلج",""),(1,0):("purple","الحديد",""),(1,1):("purple","الممر",""),
(0,3):("teal","الخليج",""),(0,4):("teal","الأسطول","p"),(1,3):("teal","اللؤلؤ",""),(1,4):("teal","الجزر",""),
(4,0):("coral","الواحة","p"),(3,0):("coral","الكثبان",""),(3,1):("coral","القوافل",""),(4,1):("coral","النخيل",""),
(4,4):("pink","المخزن","p"),(4,3):("pink","الحقول",""),(3,3):("pink","المراعي",""),(3,4):("pink","الأنهار",""),
(0,2):("gray","المرفأ",""),(2,0):("gray","الشاطئ",""),(2,4):("gray","الجزيرة",""),(4,2):("gray","المرسى",""),
(1,2):("gray","الجسر",""),(2,1):("gray","الغابة",""),(2,3):("gray","التلال",""),(3,2):("gray","المفترق",""),
(2,2):("amber","","g"),
}
out=[]
for (r,c),(ramp,lab,k) in names.items():
    pts=[V[(r,c)],V[(r,c+1)],V[(r+1,c+1)],V[(r+1,c)]]
    p=" ".join(f"{x:.0f},{y:.0f}" for x,y in pts)
    cx=sum(x for x,y in pts)/4; cy=sum(y for x,y in pts)/4
    sw="2" if k=="p" else "0.5"
    g=f'<g class="c-{ramp}"><polygon points="{p}" stroke-width="{sw}" stroke-linejoin="round"/>'
    if k=="g":
        g+=f'<text class="th" x="{cx:.0f}" y="{cy-8:.0f}" text-anchor="middle" dominant-baseline="central">منجم</text><text class="th" x="{cx:.0f}" y="{cy+8:.0f}" text-anchor="middle" dominant-baseline="central">الذهب</text>'
    else:
        cls="th" if k=="p" else "ts"
        g+=f'<text class="{cls}" x="{cx:.0f}" y="{cy:.0f}" text-anchor="middle" dominant-baseline="central">{lab}</text>'
    g+='</g>'
    out.append(g)
leg=[("purple","مملكة الجبال","حصن أقوى: القصر يسع 9"),("teal","مملكة الموانئ","تجارة: +1 ذهب كل جولتين"),("coral","مملكة الصحراء","مرتزقة: جنودها أرخص"),("pink","مملكة السهول","سكان: سعة المنطقة 6")]
y=402
L=[]
for ramp,n,d in leg:
    L.append(f'<rect class="c-{ramp}" x="30" y="{y-6}" width="12" height="12" rx="2" stroke-width="0.5"/><text class="th" x="50" y="{y}" dominant-baseline="central">{n}</text><text class="ts" x="150" y="{y}" dominant-baseline="central">{d}</text>')
    y+=24
L.append(f'<rect class="c-amber" x="30" y="{y-6}" width="12" height="12" rx="2" stroke-width="0.5"/><text class="th" x="50" y="{y}" dominant-baseline="central">أراضي محايدة</text><text class="ts" x="150" y="{y}" dominant-baseline="central">الوسط: منجم الذهب +1 ذهب</text>')
svg='<svg width="100%" viewBox="0 0 380 520" role="img"><title>خريطة الممالك الأربع</title><desc>خريطة غير منتظمة الحدود: أربع ممالك في الزوايا لكل منها طابع واسم، وأراضي محايدة في الوسط فيها منجم الذهب.</desc>'+'<rect class="c-blue" x="4" y="4" width="372" height="372" rx="14" stroke-width="0.5"/><text class="ts" x="190" y="15" text-anchor="middle" dominant-baseline="central">البحر</text><text class="ts" x="190" y="366" text-anchor="middle" dominant-baseline="central">البحر</text>'+"".join(out)+"".join(L)+'</svg>'
open('/home/claude/gen/map.svg','w').write(svg)
print(svg)
