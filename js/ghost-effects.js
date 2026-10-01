import { ghostArt } from './ghost-art.js';

export class GhostEffects {
  constructor(field, reducedMotion) {
    this.field = field;
    this.canvas = field.querySelector('canvas');
    this.layer = field.querySelector('.ghost-actors');
    this.reducedMotion = reducedMotion;
    this.animations = new Set();
    this.frame = 0;
    this.completion = null;
  }

  animate(element, frames, options) {
    if (this.reducedMotion.matches) return;
    const animation = element.animate(frames, options);
    this.animations.add(animation);
    animation.finished.then(() => this.animations.delete(animation), () => this.animations.delete(animation));
    return animation;
  }

  reveal(buttons, origin, cols) {
    buttons.forEach(({ element, index }) => {
      const distance = Math.abs(index % cols - origin % cols) + Math.abs(Math.floor(index / cols) - Math.floor(origin / cols));
      this.animate(element, [
        { opacity: 0.45, transform: 'scale(.88)', boxShadow: 'inset 0 0 20px #9aef9755' },
        { opacity: 1, transform: 'scale(1.04)', boxShadow: 'inset 0 0 15px #9aef9722', offset: 0.55 },
        { opacity: 1, transform: 'scale(1)', boxShadow: 'inset 0 0 0 transparent' }
      ], { duration: 310, delay: Math.min(distance * 25, 200), easing: 'ease-out' });
    });
  }

  pulse(element, kind = 'scan') {
    this.animate(element, kind === 'error' ? [
      { transform: 'translateX(0)', filter: 'brightness(1)' },
      { transform: 'translateX(-4px)', filter: 'brightness(1.5)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-2px)' },
      { transform: 'translateX(0)', filter: 'brightness(1)' }
    ] : [
      { boxShadow: 'inset 0 0 0 2px #cbfba1', filter: 'brightness(1.8)' },
      { boxShadow: 'inset 0 0 0 2px transparent', filter: 'brightness(1)' }
    ], { duration: kind === 'error' ? 360 : 620, easing: 'ease-out' });
  }

  scan(button) {
    this.pulse(button);
    if (this.reducedMotion.matches) return;
    const area = this.field.getBoundingClientRect(), tile = button.getBoundingClientRect();
    for (let i = 0; i < 2; i++) {
      const ring = document.createElement('span');
      ring.className = 'ghost-scan-ring';
      ring.style.left = `${tile.x - area.x + tile.width / 2}px`;
      ring.style.top = `${tile.y - area.y + tile.height / 2}px`;
      this.layer.append(ring);
      const animation = this.animate(ring, [
        { transform: 'translate(-50%,-50%) scale(.15)', opacity: .8 },
        { transform: 'translate(-50%,-50%) scale(2.5)', opacity: 0 }
      ], { duration: 640, delay: i * 110, easing: 'ease-out', fill: 'both' });
      animation.finished.then(() => ring.remove(), () => ring.remove());
    }
  }

  capture(button, species, complete) {
    this.cancel();
    if (this.reducedMotion.matches) { complete(); return; }
    const area = this.field.getBoundingClientRect();
    const tile = button.getBoundingClientRect();
    const dock = this.field.querySelector('.ghost-trap-dock').getBoundingClientRect();
    const from = { x: tile.x - area.x + tile.width / 2, y: tile.y - area.y + tile.height / 2 };
    const to = { x: dock.x - area.x + dock.width / 2, y: dock.y - area.y + dock.height * .64 };
    const actor = document.createElement('div');
    actor.className = 'ghost-capture-actor';
    actor.innerHTML = ghostArt(species);
    actor.style.left = `${from.x}px`;
    actor.style.top = `${from.y}px`;
    this.layer.append(actor);
    this.field.classList.add('is-capturing');
    const dx = to.x - from.x, dy = to.y - from.y;
    this.animate(actor, [
      { transform: 'translate(-50%,-50%) scale(.45)', opacity: 0 },
      { transform: 'translate(-50%,calc(-50% - 16px)) scale(1.12)', opacity: 1, offset: .16 },
      { transform: 'translate(calc(-50% - 8px),calc(-50% - 25px)) rotate(-12deg) scale(1.05)', offset: .38 },
      { transform: 'translate(calc(-50% + 7px),calc(-50% - 16px)) rotate(12deg) scale(1.08)', offset: .54 },
      { transform: `translate(calc(-50% + ${dx * .6}px),calc(-50% + ${dy * .5}px)) rotate(-20deg) scale(.7,1.25)`, opacity: 1, offset: .76 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(15deg) scale(.08,.3)`, opacity: 0, offset: .9 },
      { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
    ], { duration: 1050, easing: 'linear', fill: 'forwards' });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(area.width * dpr);
    this.canvas.height = Math.round(area.height * dpr);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) { this.cancel(); complete(); return; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.completion = complete;
    const start = performance.now();
    const frame = time => {
      const p = Math.min(1, (time - start) / 1050);
      ctx.clearRect(0, 0, area.width, area.height);
      if (p > .14 && p < .91) {
        const pull = Math.max(0, (p - .54) / .37);
        const target = { x: from.x + dx * pull, y: from.y - 20 + (dy + 20) * pull };
        // Three separately phased arcs give the stream a restless, electrical
        // outline. Their motion never consumes the board's random source.
        for (let strand = 0; strand < 3; strand++) {
          ctx.beginPath();
          for (let step = 0; step <= 18; step++) {
            const f = step / 18;
            const wobble = Math.sin(step * 2.2 + time * .04 + strand * 2) * 8 * Math.sin(f * Math.PI);
            const x = to.x + (target.x - to.x) * f + wobble;
            const y = to.y + (target.y - to.y) * f + Math.cos(step + time * .025) * wobble * .45;
            if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = ['#f2a45a', '#86cce5', '#fff0c1'][strand];
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 9;
          ctx.lineWidth = [4, 2, 1.3][strand];
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        for (let n = 0; n < 14; n++) {
          const angle = n * 2.4 + p * 12, radius = 25 * (1 - pull);
          ctx.fillStyle = n % 2 ? '#d3f5a0' : '#ffe2a2';
          ctx.globalAlpha = .3 + Math.abs(Math.sin(time / 90 + n)) * .6;
          ctx.fillRect(target.x + Math.cos(angle) * radius, target.y + Math.sin(angle) * radius, 2, 2);
        }
        ctx.globalAlpha = 1;
      }
      if (p < 1) this.frame = requestAnimationFrame(frame);
      else this.finish();
    };
    this.frame = requestAnimationFrame(frame);
  }

  finish() {
    const complete = this.completion;
    this.cancel();
    complete?.();
  }

  cancel() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.completion = null;
    this.animations.forEach(animation => animation.cancel());
    this.animations.clear();
    this.layer.replaceChildren();
    this.field.classList.remove('is-capturing');
    const ctx = this.canvas.getContext('2d');
    if (ctx) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); ctx.restore(); }
  }
}

export class GhostAudio {
  constructor() { this.enabled = false; this.context = null; this.nodes = new Set(); }
  play(kind) {
    if (!this.enabled) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      this.context ||= new Audio();
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      const patterns = {
        reveal: [[350, 0, .07], [540, .04, .09]],
        mark: [[260, 0, .08]],
        scan: [[300, 0, .1], [500, .09, .12], [800, .19, .14]],
        capture: [[110, 0, .26], [170, .2, .3], [360, .55, .15], [540, .72, .14], [810, .85, .22]],
        error: [[130, 0, .16], [85, .16, .2]],
        win: [[440, 0, .15], [550, .12, .15], [660, .24, .2], [880, .39, .3]]
      };
      (patterns[kind] || patterns.mark).forEach(([frequency, offset, duration]) => {
        const oscillator = this.context.createOscillator(), gain = this.context.createGain();
        const now = this.context.currentTime + offset;
        oscillator.type = kind === 'error' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(.045, now + .012);
        gain.gain.exponentialRampToValueAtTime(.001, now + duration);
        oscillator.connect(gain); gain.connect(this.context.destination);
        this.nodes.add(oscillator);
        oscillator.onended = () => { this.nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now); oscillator.stop(now + duration + .03);
      });
    } catch { /* Sound is optional; browser audio restrictions never block play. */ }
  }
  stop() {
    this.nodes.forEach(node => { try { node.stop(); } catch { /* Already ended. */ } });
    this.nodes.clear();
    this.context?.suspend().catch(() => {});
  }
}
