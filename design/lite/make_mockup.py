"""Builds design/lite/mockup.html: the lightweight design board (map + ministries) from the real map data."""
import json, os
B = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(B))
D = json.load(open(os.path.join(ROOT, 'src', 'gamedata.json'), encoding='utf-8'))
R = D['regions']
K = {'m': ('مملكة الجبال', '#8B7FB8', '#4E4377'), 'p': ('مملكة الموانئ', '#5FA88A', '#23604A'),
     'd': ('مملكة الصحراء', '#D4A456', '#8A5A12'), 'f': ('مملكة السهول', '#9DB35A', '#4E6418'), 'n': ('محايدة', '#59626B', '#3A4148')}
troops = [3 if (r.get('cap') or r['size'] == 'L') else 2 if r['k'] != 'n' else 0 for r in R]
# a few moves into the game so the board shows a living situation
troops[22] = 3; owner = [r['k'] for r in R]; owner[22] = 'd'; owner[21] = 'm'; troops[21] = 2; troops[23] = 4; owner[23] = 'f'
SEL = 2   # region shown as selected (الحديد)

def svg_map(sel=True, w='100%'):
    s = [f'<svg viewBox="17 34 778 749" width="{w}" class="map" xmlns="http://www.w3.org/2000/svg">',
         '<defs><radialGradient id="sea" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#16324a"/><stop offset="1" stop-color="#0a1726"/></radialGradient>',
         '<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" stroke-opacity=".06" stroke-width="2"/></pattern>',
         '<filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".6"/></filter></defs>',
         '<rect x="0" y="0" width="800" height="794" fill="url(#sea)"/>']
    for i, r in enumerate(R):
        k = owner[i]; fill = K[k][1]
        s.append(f'<path d="{r["path"]}" fill="{fill}" fill-opacity="{.92 if k != "n" else .7}" stroke="#0d141b" stroke-width="2.2" fill-rule="evenodd"/>')
        s.append(f'<path d="{r["path"]}" fill="url(#hatch)" fill-rule="evenodd"/>')
    # kingdom borders thicker
    if sel:
        s.append(f'<path d="{R[SEL]["path"]}" fill="#fff" fill-opacity=".18" stroke="#ffe08a" stroke-width="4.5" fill-rule="evenodd"/>')
        for j in [b for a, b in D['adj'] if a == SEL] + [a for a, b in D['adj'] if b == SEL]:
            if owner[j] != owner[SEL]:
                s.append(f'<path d="{R[j]["path"]}" fill="none" stroke="#ff6b4a" stroke-width="3" stroke-dasharray="8 6" fill-rule="evenodd"/>')
    for i, r in enumerate(R):
        x, y = r['lx'], r['ly']
        s.append(f'<text x="{x}" y="{y - 22}" class="rn">{r["name"]}</text>')
        if troops[i]:
            c = K[owner[i]][2]
            s.append(f'<g transform="translate({x},{y})" filter="url(#sh)"><rect x="-21" y="-12" width="42" height="24" rx="12" fill="{c}" stroke="#fff" stroke-width="1.6"/>'
                     f'<path d="M-13,4 q0,-9 6,-9 q6,0 6,9 z M-11,-2 h10" fill="#fff" stroke="#fff" stroke-width="1"/><text x="7" y="5" class="tn">{troops[i]}</text></g>')
        if r.get('cap'):
            s.append(f'<g transform="translate({x - 30},{y - 2})"><path d="M-8,5 L-8,-3 L-4,0 L0,-7 L4,0 L8,-3 L8,5 Z" fill="#ffd56a" stroke="#5a3d00" stroke-width="1.2"/></g>')
    # commanders standing on the map: portrait pins at the capitals
    pins = {'m': 'p_leader', 'p': 'p_lab', 'd': 'p_ops', 'f': 'p_guard'}
    for i, r in enumerate(R):
        if r.get('cap'):
            img = pins[r['k']]; x, y = r['lx'] + 36, r['ly'] - 48
            s.append(f'<g filter="url(#sh)"><clipPath id="c{i}"><circle cx="{x}" cy="{y}" r="17"/></clipPath><circle cx="{x}" cy="{y}" r="19" fill="{K[r["k"]][2]}" stroke="#ffd56a" stroke-width="2"/>'
                     f'<image href="img/{img}.webp" x="{x - 17}" y="{y - 24}" width="34" height="43" clip-path="url(#c{i})" preserveAspectRatio="xMidYMin slice"/></g>')
    s.append('</svg>'); return ''.join(s)

NAV = [('hq', 'القيادة', '♛'), ('def', 'الدفاع', '⚔'), ('intel', 'الاستخبارات', '◉'), ('foreign', 'الخارجية', '✉'), ('map', 'الخريطة', '▦')]
def nav(active):
    return '<nav>' + ''.join(f'<a class="{"on" if k == active else ""}"><i>{ic}</i>{t}</a>' for k, t, ic in NAV) + '</nav>'
def top(phase='الإدارة', ops='2/3'):
    return f'''<header><div class="king"><span class="dot" style="background:{K["m"][1]}"></span><b>مملكة الجبال</b><small>أنت</small></div>
<div class="res"><span>◉ <b>5</b></span><span>⚙ <b>{ops}</b></span><span>👥 <b>14</b></span></div>
<div class="round">الجولة <b>3</b>/7 · {phase}</div></header>'''

phone_map = f'''<div class="phone">{top()}<div class="mapwrap">{svg_map()}</div>
<div class="sheet"><div class="grab"></div><div class="rg"><div><b>الحديد</b> <small>منطقة متوسطة · سعة 4</small></div><span class="pill m">مملكة الجبال</span></div>
<div class="units"><span class="u">👥 <b>2</b> جنود</span><span class="u">القائد: <b>النقيب فهد</b></span><span class="u warn">جار معادٍ: الصحراء 3</span></div>
<div class="acts"><button>تحريك جنود</button><button class="red">هجوم</button><button>تعزيز</button></div></div>{nav("map")}</div>'''

def ministry(room, portrait, name, role, line, cards, active, tabs_on):
    tabs = ''.join(f'<span class="{"on" if t == tabs_on else ""}">{t}</span>' for t in ['القيادة', 'الدفاع', 'الاستخبارات', 'الخارجية'])
    return f'''<div class="phone">{top()}<div class="room" style="background-image:url(img/{room}.webp)"><div class="tabs">{tabs}</div>
<div class="minister"><img src="img/{portrait}.webp"><div class="who"><b>{name}</b><small>{role}</small></div></div>
</div><div class="say">«{line}»</div><div class="cards">{cards}</div>{nav(active)}</div>'''
def card(t, sub, cost, cls=''):
    return f'<div class="card {cls}"><div><b>{t}</b><small>{sub}</small></div><span class="cost">{cost}</span></div>'

phone_def = ministry('r_ops', 'p_ops', 'اللواء ناصر', 'وزير الدفاع', 'الصحراء حشدت 3 جنود عند المفترق. أنصح بتعزيز الحديد.',
    card('تجنيد جنديين', 'يوصلون للعاصمة أو المعسكر', '2 ذهب') + card('بناء معسكر', 'نقطة تجميع جديدة، سعة +2', '5 ذهب') +
    card('دفاع جوي', 'يعترض صاروخ كل جولة', '4 ذهب') + card('صاروخ', 'يضرب منطقة معادية، يقتل جنديين', '3 ذهب', 'red'), 'def', 'الدفاع')
report = '''<div class="report"><div class="rh"><span class="tag">سري</span><b>تقرير: مملكة الصحراء</b><small>ثقة 65% · جُمع الجولة 3</small></div>
<div class="rr"><span>الذهب</span><b>4 – 7</b></div><div class="rr"><span>الجنود</span><b>13 – 16</b></div><div class="rr"><span>صواريخ</span><b>0 – 1</b></div>
<div class="rr"><span>نيتهم</span><b class="hot">هجوم محتمل على الحديد</b></div></div>'''
phone_intel = ministry('r_intel', 'p_intel', 'العقيد سالم', 'مدير الاستخبارات', 'ما نعرف عنهم إلا اللي نجمعه. التقرير تقدير، مو حقيقة.',
    report + card('تقرير جديد', 'عن أي مملكة', '1 ذهب') + card('عملية تخريب', 'تسرق حتى 3 ذهب', '2 ذهب'), 'intel', 'الاستخبارات')

laptop = f'''<div class="laptop">{top()}<div class="split"><div class="mapwrap big">{svg_map()}</div>
<aside><div class="room small" style="background-image:url(img/r_ops.webp)"><div class="tabs">{''.join(f'<span class="{"on" if t == "الدفاع" else ""}">{t}</span>' for t in ['القيادة', 'الدفاع', 'الاستخبارات', 'الخارجية'])}</div>
<div class="minister"><img src="img/p_ops.webp"><div class="who"><b>اللواء ناصر</b><small>وزير الدفاع</small></div></div></div>
<div class="say dark">«الصحراء حشدت 3 جنود عند المفترق. أنصح بتعزيز الحديد.»</div>
{card('تجنيد جنديين', 'يوصلون للعاصمة أو المعسكر', '2 ذهب')}{card('بناء معسكر', 'نقطة تجميع جديدة، سعة +2', '5 ذهب')}{card('صاروخ', 'يضرب منطقة معادية', '3 ذهب', 'red')}
<div class="gens"><b>قادتك</b><div>{''.join(f'<span><img src="img/{p}.webp"><i>{n}</i><em>{r}</em></span>' for p, n, r in [('p_leader', 'أنت', 'الملك'), ('p_ops', 'ناصر', 'الدفاع'), ('p_intel', 'سالم', 'الاستخبارات'), ('p_guard', 'فهد', 'قائد جيش')])}</div></div>
<button class="end">انتهيت من دوري ←</button></aside></div></div>'''

CSS = '''*{box-sizing:border-box;margin:0}body{background:#05080c;color:#e8edf1;font-family:"Cairo","Noto Sans Arabic",system-ui,sans-serif;padding:28px}
h1{font-size:30px;color:#f3d58c;margin-bottom:4px}h2{font-size:16px;color:#93a4b0;font-weight:400;margin-bottom:22px}
.board{display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start}.lbl{color:#93a4b0;font-size:14px;margin:8px 0 0;text-align:center}
.phone{width:390px;height:844px;border-radius:38px;border:10px solid #1a2028;background:#0b1118;overflow:hidden;display:flex;flex-direction:column;position:relative;box-shadow:0 30px 80px #000}
header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 14px;background:linear-gradient(#111a24,#0c131b);border-bottom:1px solid #22303c;font-size:12.5px;flex-wrap:wrap}
.king{display:flex;align-items:center;gap:6px}.king b{font-size:14px}.king small{color:#93a4b0}.dot{width:12px;height:12px;border-radius:50%}
.res{display:flex;gap:10px}.res span{background:#16222d;border-radius:8px;padding:2px 8px}.res b{color:#f3d58c}.round{color:#93a4b0;width:100%;text-align:center;font-size:12px}.round b{color:#fff}
.mapwrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#0a1726}.map{display:block;width:100%;height:100%}
.rn{fill:#fff;font-size:15px;font-weight:700;text-anchor:middle;paint-order:stroke;stroke:#0a121a;stroke-width:4px}.tn{fill:#fff;font-size:15px;font-weight:800;text-anchor:middle}
.sheet{background:#101922;border-top:1px solid #2a3a48;border-radius:18px 18px 0 0;padding:8px 14px 12px;margin-top:-16px;position:relative}
.grab{width:42px;height:4px;border-radius:2px;background:#3a4b58;margin:0 auto 8px}.rg{display:flex;justify-content:space-between;align-items:center}.rg b{font-size:18px}.rg small{color:#93a4b0}
.pill{font-size:11px;border-radius:999px;padding:2px 9px;color:#fff}.pill.m{background:#4E4377}
.units{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.u{background:#16222d;border-radius:8px;padding:3px 9px;font-size:12.5px}.u.warn{background:#4a1f17;color:#ffb39f}
.acts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}button{font:700 14px inherit;color:#e8edf1;background:#1c2a36;border:1px solid #33475a;border-radius:12px;padding:11px 6px}button.red{background:#6b2418;border-color:#a8402c}
nav{display:flex;justify-content:space-around;background:#0c131b;border-top:1px solid #22303c;padding:6px 0 14px}nav a{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;color:#7f909c}
nav a i{font-style:normal;font-size:19px}nav a.on{color:#f3d58c}
.room{position:relative;height:270px;background-size:cover;background-position:center}.room::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,8,12,.55),rgba(5,8,12,.1) 30%,rgba(5,8,12,.85))}
.room.small{height:250px;border-radius:14px;overflow:hidden}
.tabs{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:6px;z-index:2;justify-content:center}.tabs span{background:rgba(10,16,22,.72);border:1px solid #33475a;border-radius:999px;padding:4px 11px;font-size:12px}
.tabs span.on{background:#f3d58c;color:#1a1205;border-color:#f3d58c;font-weight:700}
.minister{position:absolute;bottom:0;right:14px;z-index:2;display:flex;align-items:flex-end;gap:10px}.minister img{width:120px;height:152px;object-fit:cover;border-radius:12px 12px 0 0;border:2px solid #f3d58c;border-bottom:0}
.who{padding-bottom:12px}.who b{display:block;font-size:17px}.who small{color:#f3d58c}
.say{background:#121c26;border-inline-start:3px solid #f3d58c;margin:10px 14px 4px;padding:8px 12px;font-size:14px;line-height:1.7;border-radius:8px}.say.dark{margin:10px 0}
.cards{flex:1;overflow:hidden;padding:4px 14px;display:flex;flex-direction:column;gap:8px}
.card{display:flex;justify-content:space-between;align-items:center;background:#121c26;border:1px solid #2a3a48;border-radius:12px;padding:10px 12px}.card small{display:block;color:#93a4b0;font-size:12px}
.card .cost{background:#2a2412;color:#f3d58c;border-radius:8px;padding:3px 9px;font-size:13px;font-weight:700;white-space:nowrap}.card.red{border-color:#7a2d1f}.card.red .cost{background:#4a1f17;color:#ffb39f}
.report{background:#0f1923;border:1px solid #2b4a5c;border-radius:12px;padding:10px 12px}.rh{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px}.rh small{color:#93a4b0;width:100%}
.tag{background:#8a2a1c;color:#fff;font-size:11px;border-radius:4px;padding:0 6px}.rr{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1d2c38;font-size:13.5px}.rr b{color:#f3d58c}.rr b.hot{color:#ff9a80}
.laptop{width:1280px;height:760px;border-radius:14px;border:10px solid #1a2028;background:#0b1118;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 80px #000}
.laptop header{flex-wrap:nowrap}.laptop .round{width:auto}.split{flex:1;display:flex;min-height:0}.mapwrap.big{flex:1}
aside{width:430px;padding:12px;display:flex;flex-direction:column;gap:8px;background:#0c131b;border-inline-start:1px solid #22303c}
.gens{background:#121c26;border-radius:12px;padding:8px 10px}.gens>div{display:flex;gap:8px;margin-top:6px}.gens span{display:flex;flex-direction:column;align-items:center;font-size:11px}
.gens img{width:56px;height:70px;object-fit:cover;border-radius:8px;border:1px solid #33475a}.gens i{font-style:normal;font-weight:700}.gens em{font-style:normal;color:#93a4b0}
.end{margin-top:auto;background:linear-gradient(#e7be62,#b98a2e);color:#1a1205;border-color:#f3d58c}'''

html = f'''<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>الحرب العالمية — التصميم الخفيف</title><style>{CSS}</style></head><body>
<h1>الحرب العالمية — التصميم الخفيف</h1><h2>خريطة + وزارات تتنقل بينها بضغطة. صور واقعية مرسومة مسبقاً بدل 3D ثقيل. يشتغل على أي جوال.</h2>
<div class="board"><div>{phone_map}<p class="lbl">١ الخريطة: الدول والمناطق والجنود والقادة</p></div>
<div>{phone_def}<p class="lbl">٢ وزارة الدفاع: الوزير + قراراته</p></div>
<div>{phone_intel}<p class="lbl">٣ الاستخبارات: تقرير تقديري</p></div></div>
<div class="board" style="margin-top:30px"><div>{laptop}<p class="lbl">٤ نفس اللعبة على اللابتوب: الخريطة والوزارة جنب بعض</p></div></div></body></html>'''
open(os.path.join(B, 'mockup.html'), 'w', encoding='utf-8').write(html)
print('ok', len(html))
