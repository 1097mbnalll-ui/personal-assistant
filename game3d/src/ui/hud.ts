// DOM heads-up display (Arabic, RTL). Kept outside the 3D canvas so text stays crisp on every screen.
const $ = (id: string) => document.getElementById(id)!;
export interface ModalButton { label: string; primary?: boolean; sel?: boolean; fn?: () => void }

export class Hud {
  modalOpen = false; private onClose: (() => void) | null = null; private lastLoc = ''; private lastPrompt: string | null = '';
  loading(f: number, text: string) { ($('bar').firstElementChild as HTMLElement).style.width = Math.round(f * 100) + '%'; $('loadTxt').textContent = text; }
  ready(onStart: () => void) {
    $('loadTxt').textContent = 'جاهز'; const b = $('start'); b.style.display = 'block';
    b.onclick = () => { this.hideLoading(); onStart(); };
  }
  hideLoading() { const l = $('load'); l.style.opacity = '0'; setTimeout(() => { l.style.display = 'none'; }, 650); $('loc').style.display = 'block'; $('hint').style.display = 'block'; }
  location(name: string) { if (name === this.lastLoc) return; this.lastLoc = name; $('loc').querySelector('b')!.textContent = name; }
  objective(text: string | null) { const o = $('obj'); o.style.display = text ? 'block' : 'none'; if (text) o.querySelector('span')!.textContent = text; }
  prompt(text: string | null, key: string) {
    if (text === this.lastPrompt) return; this.lastPrompt = text; const p = $('prompt'); p.style.display = text ? 'flex' : 'none';
    if (text) { p.querySelector('span')!.textContent = text; const k = p.querySelector('kbd') as HTMLElement; k.textContent = key; k.style.display = key ? '' : 'none'; }
  }
  modal(title: string, html: string, buttons: ModalButton[], onClose?: () => void) {
    const m = $('modal'); m.querySelector('h2')!.textContent = title; m.querySelector('.body')!.innerHTML = html; const row = m.querySelector('.row')!; row.innerHTML = '';
    buttons.forEach(b => { const e = document.createElement('button'); e.textContent = b.label; if (b.primary) e.className = 'primary'; if (b.sel) e.classList.add('sel');
      e.onclick = () => { if (b.fn) b.fn(); else this.closeModal(); }; row.appendChild(e); });
    m.style.display = 'flex'; this.modalOpen = true; this.onClose = onClose ?? null; if (document.pointerLockElement) document.exitPointerLock();
  }
  closeModal() { $('modal').style.display = 'none'; this.modalOpen = false; const f = this.onClose; this.onClose = null; if (f) f(); }
  fps(v: number) { if (Math.random() < .05) $('fps').textContent = v.toFixed(0) + ' fps'; }
}
