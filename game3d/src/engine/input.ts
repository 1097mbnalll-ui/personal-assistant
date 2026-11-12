// One input state for keyboard + mouse, gamepad and touch. Gameplay code only reads `Input`.
export class Input {
  moveX = 0; moveY = 0;          // -1..1, camera relative (x right, y forward)
  lookDX = 0; lookDY = 0;        // accumulated look delta in radians, consumed each frame
  sprint = false; walk = false;
  private pressed = new Set<string>(); private once = new Set<string>();
  private keys = new Set<string>();
  private padPrev: boolean[] = [];
  private touchMove = { id: -1, x0: 0, y0: 0, x: 0, y: 0 }; private touchLook = { id: -1, x: 0, y: 0 };
  private sprintToggle = false;
  locked = false; usingTouch = false; usingPad = false; enabled = true;
  sensitivity = 1;

  constructor(private canvas: HTMLCanvasElement, private ui: HTMLElement) {
    addEventListener('keydown', e => {
      if (e.target instanceof HTMLInputElement) return;
      if (!this.keys.has(e.code)) this.once.add(e.code);
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('click', () => { if (!this.usingTouch && this.enabled && !this.locked) canvas.requestPointerLock?.(); });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; });
    document.addEventListener('mousemove', e => { if (this.locked && this.enabled) { this.lookDX += e.movementX * .0023 * this.sensitivity; this.lookDY += e.movementY * .0023 * this.sensitivity; } });
    this.initTouch();
  }
  /** true once per press (keyboard code, or virtual name: jump / interact / menu / back) */
  hit(name: string) { const h = this.once.has(name); this.once.delete(name); return h; }
  press(name: string) { this.once.add(name); }
  releasePointer() { if (document.pointerLockElement) document.exitPointerLock(); }

  update() {
    const k = this.keys; let x = 0, y = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1; if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1; if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    let sprint = k.has('ShiftLeft') || k.has('ShiftRight'); let walk = k.has('ControlLeft') || k.has('AltLeft');
    if (this.once.has('Space')) { this.once.delete('Space'); this.once.add('jump'); }
    if (this.once.has('KeyE') || this.once.has('Enter')) { this.once.delete('KeyE'); this.once.delete('Enter'); this.once.add('interact'); }
    if (this.once.has('Escape')) { this.once.delete('Escape'); this.once.add('back'); }
    if (this.once.has('Tab') || this.once.has('KeyM')) { this.once.delete('Tab'); this.once.delete('KeyM'); this.once.add('menu'); }
    // gamepad (standard mapping): left stick move, right stick look, A jump, X interact, L3 / RB sprint, B back, Start menu
    const pad = [...(navigator.getGamepads?.() ?? [])].find(p => p && p.connected && p.mapping === 'standard');
    if (pad) {
      const dz = (v: number) => Math.abs(v) < .16 ? 0 : (v - Math.sign(v) * .16) / .84;
      const lx = dz(pad.axes[0]), ly = dz(pad.axes[1]), rx = dz(pad.axes[2]), ry = dz(pad.axes[3]);
      if (lx || ly || rx || ry || pad.buttons.some(b => b.pressed)) this.usingPad = true;
      if (lx || ly) { x = lx; y = -ly; }
      this.lookDX += rx * Math.abs(rx) * .055 * this.sensitivity; this.lookDY += ry * Math.abs(ry) * .04 * this.sensitivity;
      const b = pad.buttons.map(q => q.pressed), edge = (i: number) => b[i] && !this.padPrev[i];
      if (edge(0)) this.once.add('jump'); if (edge(2)) this.once.add('interact'); if (edge(1)) this.once.add('back'); if (edge(9)) this.once.add('menu');
      if (edge(10)) this.sprintToggle = !this.sprintToggle;
      sprint = sprint || b[5] || this.sprintToggle; this.padPrev = b;
      if (!lx && !ly) this.sprintToggle = false;
    }
    // touch stick
    if (this.touchMove.id >= 0) {
      const dx = this.touchMove.x - this.touchMove.x0, dy = this.touchMove.y - this.touchMove.y0, r = 56, m = Math.hypot(dx, dy);
      const s = Math.min(1, m / r); if (m > 6) { x = dx / m * s; y = -dy / m * s; }
      sprint = sprint || s > .96 && this.sprintToggle;
    }
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    if (!this.enabled) { x = 0; y = 0; this.lookDX = 0; this.lookDY = 0; }
    this.moveX = x; this.moveY = y; this.sprint = sprint; this.walk = walk;
  }

  private initTouch() {
    const stick = this.ui.querySelector<HTMLElement>('#stick')!, knob = this.ui.querySelector<HTMLElement>('#knob')!;
    const place = () => { const t = this.touchMove; stick.style.display = t.id >= 0 ? 'block' : 'none'; stick.style.left = t.x0 - 60 + 'px'; stick.style.top = t.y0 - 60 + 'px';
      const dx = t.x - t.x0, dy = t.y - t.y0, mm = Math.hypot(dx, dy) || 1, s = Math.min(56, mm); knob.style.transform = `translate(${dx / mm * s}px,${dy / mm * s}px)`; };
    this.canvas.addEventListener('touchstart', e => {
      this.usingTouch = true; document.body.classList.add('touch');
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < innerWidth * .45 && this.touchMove.id < 0) { Object.assign(this.touchMove, { id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY }); place(); }
        else if (this.touchLook.id < 0) Object.assign(this.touchLook, { id: t.identifier, x: t.clientX, y: t.clientY });
      }
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchmove', e => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.touchMove.id) { this.touchMove.x = t.clientX; this.touchMove.y = t.clientY; place(); }
        else if (t.identifier === this.touchLook.id) { if (this.enabled) { this.lookDX += (t.clientX - this.touchLook.x) * .0055 * this.sensitivity; this.lookDY += (t.clientY - this.touchLook.y) * .0055 * this.sensitivity; } this.touchLook.x = t.clientX; this.touchLook.y = t.clientY; }
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e: TouchEvent) => { for (const t of Array.from(e.changedTouches)) { if (t.identifier === this.touchMove.id) { this.touchMove.id = -1; place(); } if (t.identifier === this.touchLook.id) this.touchLook.id = -1; } };
    this.canvas.addEventListener('touchend', end); this.canvas.addEventListener('touchcancel', end);
    this.ui.querySelectorAll<HTMLElement>('[data-btn]').forEach(b => {
      const n = b.dataset.btn!;
      b.addEventListener('touchstart', e => { e.preventDefault(); if (n === 'sprint') { this.sprintToggle = !this.sprintToggle; b.classList.toggle('on', this.sprintToggle); } else this.once.add(n); }, { passive: false });
      b.addEventListener('click', () => { if (n !== 'sprint') this.once.add(n); });
    });
  }
}
