// DOM heads-up display (Arabic, RTL). Kept outside the 3D canvas so text stays crisp on every screen.
const $ = (id: string) => document.getElementById(id)!;
export interface ModalButton { label: string; primary?: boolean; sel?: boolean; fn?: () => void }

export class Hud {
  modalOpen = false; private onClose: (() => void) | null = null; private lastLoc = ''; private lastPrompt: string | null = '';
  loading(f: number, text: string) { ($('bar').firstElementChild as HTMLElement).style.width = Math.round(f * 100) + '%'; $('loadTxt').textContent = text; }
  ready(onStart: () => void, label = 'ابدأ', onNew?: () => void) {
    $('loadTxt').textContent = 'جاهز'; const b = $('start'); b.style.display = 'block'; b.textContent = label;
    b.onclick = () => { this.hideLoading(); onStart(); };
    const n = $('startNew'); n.style.display = onNew ? 'block' : 'none'; n.onclick = () => { this.hideLoading(); onNew?.(); };
  }
  hideLoading() { const l = $('load'); l.style.opacity = '0'; setTimeout(() => { l.style.display = 'none'; }, 650); $('loc').style.display = 'block'; $('hint').style.display = 'block'; setTimeout(() => { $('hint').style.display = 'none'; }, 14000); }
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
  /** terminal panel: buttons carry data-act="..." and are routed to onAct; the panel stays open and can be refreshed */
  panel(title: string, html: () => string, onAct: (act: string) => void, onClose?: () => void, afterRender?: () => void) {
    const m = $('modal'), body = m.querySelector('.body') as HTMLElement; this.modal(title, html(), [{ label: 'إغلاق', primary: true }], onClose);
    const render = () => { const sc = (m.querySelector('.box') as HTMLElement).scrollTop; body.innerHTML = html(); (m.querySelector('.box') as HTMLElement).scrollTop = sc; afterRender?.(); };
    body.onclick = e => { const b = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null; if (!b || (b as HTMLButtonElement).disabled) return; onAct(b.dataset.act!); if (this.modalOpen && this.panelRender === render) render(); };
    this.panelRender = render; afterRender?.();
  }
  panelRender: (() => void) | null = null;
  refreshPanel() { if (this.modalOpen) this.panelRender?.(); }
  // ---- conversation bar
  dialogueOpen = false; private dlg: { lines: { who: string; text: string }[]; i: number; done: (choice: number) => void; choices: string[] } | null = null;
  dialogue(lines: { who: string; text: string }[], done: (choice: number) => void, choices: string[] = []) { this.dlg = { lines, i: 0, done, choices }; this.dialogueOpen = true; $('hint').style.display = 'none'; $('dlgBar').style.display = 'block'; this.showLine(); if (document.pointerLockElement && choices.length) document.exitPointerLock(); }
  private showLine() { const d = this.dlg!; const l = d.lines[d.i]; $('dlgWho').textContent = l.who; $('dlgText').textContent = l.text; const last = d.i === d.lines.length - 1; const c = $('dlgChoices'); c.innerHTML = '';
    if (last && d.choices.length) { d.choices.forEach((t, k) => { const b = document.createElement('button'); b.textContent = t; if (k === 0) b.className = 'primary'; b.onclick = () => this.endDialogue(k); c.appendChild(b); }); $('dlgNext').style.display = 'none'; if (document.pointerLockElement) document.exitPointerLock(); }
    else $('dlgNext').style.display = ''; }
  /** advance with the interact key; returns true while the conversation consumed the input */
  advanceDialogue(): boolean { const d = this.dlg; if (!d) return false; if (d.i < d.lines.length - 1) { d.i++; this.showLine(); return true; } if (d.choices.length) return true; this.endDialogue(-1); return true; }
  chooseDialogue(k: number) { if (this.dlg && this.dlg.i === this.dlg.lines.length - 1 && k < this.dlg.choices.length) this.endDialogue(k); }
  private endDialogue(choice: number) { const d = this.dlg; this.dlg = null; this.dialogueOpen = false; $('dlgBar').style.display = 'none'; d?.done(choice); }
  toast(text: string) { const t = $('toast'); t.textContent = text; t.style.display = 'block'; t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); clearTimeout(this.toastT); this.toastT = window.setTimeout(() => { t.style.display = 'none'; }, 5200); }
  private toastT = 0;
  fade(o: number) { $('fade').style.opacity = String(o); }
  caption(text: string | null) { const c = $('caption'); c.style.display = text ? 'block' : 'none'; if (text) c.textContent = text; }
  alarm(on: boolean) { document.body.classList.toggle('alarm', on); }
  cinematic(on: boolean) { document.body.classList.toggle('cine', on); }
  fps(v: number) { if (Math.random() < .05) $('fps').textContent = v.toFixed(0) + ' fps'; }
}
