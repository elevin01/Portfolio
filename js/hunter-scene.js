// Pseudo-3D behind-view rendering on a 2D canvas. World units are meters; the camera sits a few
// meters behind the runner. Artwork is original and reads at small sizes; nothing here mutates the model.
import { RUN, STAGES } from './hunter-model.js';

const W = 1.9;           // lane width in meters
const CAM_BACK = 8.5;    // camera distance behind the runner in meters
const FAR = 120;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const lerp = (a, b, t) => a + (b - a) * t;
const noise = n => { const v = Math.sin(n * 127.1 + 31.7) * 43758.5453; return v - Math.floor(v); };

const PALETTES = {
  tunnel: { sky: ['#1b1a22', '#2a2730'], ground: '#3b3741', groundFar: '#221f27', lane: '#5e5866', wall: '#2d2932', wallDark: '#1d1a22', accent: '#f0c777', fog: null },
  wetlands: { sky: ['#8ea39a', '#b9c7b6'], ground: '#3d4f44', groundFar: '#9fb09d', lane: '#6b5b45', wall: '#2e3f33', wallDark: '#2a2219', accent: '#c9d8bd', fog: '#aebbac' },
  forest: { sky: ['#9ed3a8', '#e6f2c9'], ground: '#3f6b36', groundFar: '#2f5a2e', lane: '#8a7452', wall: '#2f5a33', wallDark: '#4a3a26', accent: '#fff1b0', fog: null },
  tower: { sky: ['#1a1c24', '#2b2e3b'], ground: '#454857', groundFar: '#23252f', lane: '#70748a', wall: '#363948', wallDark: '#24262f', accent: '#ffb55f', fog: null },
  island: { sky: ['#6fb7e6', '#d6ecf6'], ground: '#6c8f45', groundFar: '#4d7a46', lane: '#a08e62', wall: '#2f5a33', wallDark: '#5a4a30', accent: '#fff1b0', fog: null }
};

export class HunterScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.c = canvas.getContext('2d', { alpha: false });
    this.scale = 0;
    this.time = 0;
    this.effects = [];
    this.shake = 0;
    this.camX = 0;
    this.reduced = false;
    this.land = 0;
    this.ink = null; this.inkW = 1;
    this.H = 360; this.horizon = 112; this.F = 430; this.camH = 2.4;
  }

  // The logical width is always 640; a taller canvas (phones in portrait) gets a longer focal
  // length and a higher camera so the runner stays near the lower third with more road ahead.
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(bounds.width * dpr);
    this.canvas.height = Math.round(bounds.height * dpr);
    this.scale = this.canvas.width / 640;
    this.H = 640 * bounds.height / bounds.width;
    this.horizon = Math.round(this.H * 0.31);
    this.F = this.H > 500 ? 560 : 430;
    this.camH = clamp((this.H * 0.64 - this.horizon) * CAM_BACK / this.F, 2.2, 6);
  }

  reset() { this.effects = []; this.shake = 0; this.time = 0; }

  accept(events, model) {
    for (const e of events) {
      if (this.reduced && !['ko', 'stumble'].includes(e.type)) continue;
      const lane = e.lane ?? model.p.lane, z = e.z ?? model.p.z;
      if (e.type === 'plate') this.burst(lane, z, e.target ? '#ffd86b' : '#f3e6b0', e.target ? 18 : 8, 0.7);
      else if (e.type === 'stumble') { this.shake = 0.35; this.burst(lane, z, '#c8c2b8', 10, 0.5); }
      else if (e.type === 'ko') this.shake = 0.6;
      else if (e.type === 'destroy') this.burst(e.lane, e.z, e.by === 'punch' ? '#9fc5ea' : '#ffd27a', 14, 0.7);
      else if (e.type === 'cast') this.effects.push({ type: 'ring', lane: model.p.lane, z: model.p.z, color: model.hero.color, age: 0, life: 0.6 });
      else if (e.type === 'rock') this.effects.push({ type: 'wave', z: model.p.z, age: 0, life: 0.5 });
      else if (e.type === 'juice') this.burst(lane, z, e.immune ? '#bde8ff' : '#9fd37a', 10, 0.6);
      else if (e.type === 'wager') this.burst(lane, z, e.won ? '#ffd86b' : '#d08f8f', 14, 0.8);
      else if (e.type === 'reveal') this.effects.push({ type: 'reveal', lane: e.lane, z: e.z, age: 0, life: 0.5 });
      else if (e.type === 'pursuer') this.effects.push({ type: 'cards', lane: model.p.lane, z: model.p.z - 2, age: 0, life: 1 });
      else if (e.type === 'escape') this.burst(model.p.lane, model.p.z - 3, '#e8d7ff', 12, 0.7);
      else if (e.type === 'land') { this.land = 1; this.burst(model.p.lane, model.p.z, '#d9d2c4', 6, 0.35, 0.05); }
    }
    if (this.effects.length > 80) this.effects.splice(0, this.effects.length - 80);
  }

  burst(lane, z, color, count, life, height = 0.6) {
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + noise(i) * 0.5;
      this.effects.push({ type: 'spark', lane, z, x: (lane - 1) * W, y: height, vx: Math.cos(angle) * 1.6, vy: 1 + Math.sin(angle) * 1.4, color, age: 0, life: life * (0.6 + noise(i + 3) * 0.6) });
    }
  }

  hasEffects() { return this.effects.length > 0 || this.shake > 0; }

  // Projection helpers
  project(x, y, z) {
    const d = Math.max(0.6, z - this.camZ);
    const s = this.F / d;
    return { x: 320 + (x - this.camX) * s, y: this.horizon + (this.camH - y) * s, s, d };
  }

  // While `ink` is set, filled shapes get an outline: the cel-shaded look of the characters and hazards.
  inked() { const c = this.c; if (!this.ink) return; c.strokeStyle = this.ink; c.lineWidth = this.inkW; c.lineJoin = 'round'; c.stroke(); }
  fill(points, color, plain = false) { const c = this.c; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = color; c.fill(); if (!plain) this.inked(); }
  stroke(points, color, width = 1, close = false) { const c = this.c; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (close) c.closePath(); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
  rect(x, y, w, h, color, radius = 0, plain = false) { const c = this.c; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fillStyle = color; c.fill(); if (!plain) this.inked(); }
  ellipse(x, y, rx, ry, color, plain = false) { const c = this.c; c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); c.fillStyle = color; c.fill(); if (!plain) this.inked(); }
  text(t, x, y, size, color, align = 'center', weight = 700) { const c = this.c; c.font = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(t, x, y); }

  // A lane-wide quad on the ground between two depths.
  groundQuad(lane, z0, z1, color, inset = 0) {
    const a = this.project((lane - 1.5) * W + inset, 0, z0), b = this.project((lane - 0.5) * W - inset, 0, z0);
    const cc = this.project((lane - 0.5) * W - inset, 0, z1), d = this.project((lane - 1.5) * W + inset, 0, z1);
    this.fill([[a.x, a.y], [b.x, b.y], [cc.x, cc.y], [d.x, d.y]], color);
  }

  backdrop(model, pal) {
    const c = this.c, stage = model.stage.id, H = this.H, horizon = this.horizon;
    const sky = c.createLinearGradient(0, 0, 0, horizon + 40);
    sky.addColorStop(0, pal.sky[0]); sky.addColorStop(1, pal.sky[1]);
    c.fillStyle = sky; c.fillRect(0, 0, 640, H);
    if (stage === 'island') {
      this.ellipse(500, horizon - 60, 24, 24, '#fff6cf');
      // The sea sits behind the hills: Zevil Island is reached and left by boat.
      c.fillStyle = '#3f87bd'; c.fillRect(0, horizon - 14, 640, 18);
      for (let i = 0; i < 6; i++) this.stroke([[i * 120 - this.camX * 4, horizon - 9 + (i % 3) * 3], [i * 120 + 50 - this.camX * 4, horizon - 9 + (i % 3) * 3]], '#9fd2f0aa', 1);
      for (let i = 0; i < 7; i++) { const x = ((i * 97 + 20) - this.camX * 6) % 700 - 30; this.fill([[x - 70, horizon + 6], [x, horizon - 42 + noise(i) * 20], [x + 80, horizon + 6]], i % 2 ? '#4d8c6a' : '#5f9f74'); }
    } else if (stage === 'forest') {
      this.ellipse(140, horizon - 70, 30, 30, '#fff8d6');
      for (let i = 0; i < 12; i++) { const x = (i * 60 - this.camX * 5) % 700 - 30; this.ellipse(x, horizon - 4 + noise(i) * 8, 42, 26 + noise(i + 2) * 16, i % 2 ? '#4f8f5a' : '#3f7a4c'); }
    } else if (stage === 'wetlands') {
      for (let i = 0; i < 10; i++) { const x = (i * 71 - this.camX * 5) % 680 - 20; this.fill([[x - 30, horizon + 10], [x - 6, horizon - 52 + noise(i) * 30], [x + 4, horizon - 58 + noise(i + 1) * 26], [x + 34, horizon + 10]], '#7f948a'); }
    }
    const ground = c.createLinearGradient(0, horizon, 0, H);
    ground.addColorStop(0, pal.groundFar); ground.addColorStop(1, pal.ground);
    c.fillStyle = ground; c.fillRect(0, horizon, 640, H - horizon);
  }

  road(model, pal) {
    const c = this.c, p = model.p;
    const near = this.camZ + 0.8, far = this.camZ + FAR;
    const edge = 1.5 * W;
    const nl = this.project(-edge, 0, near), nr = this.project(edge, 0, near), fl = this.project(-edge, 0, far), fr = this.project(edge, 0, far);
    this.fill([[nl.x, nl.y], [nr.x, nr.y], [fr.x, fr.y], [fl.x, fl.y]], pal.lane);
    // Cross stripes anchored to world distance make the speed legible.
    const first = Math.floor(near / 4) * 4;
    for (let z = first; z < far; z += 4) {
      const a = this.project(-edge, 0, z), b = this.project(edge, 0, z);
      if (a.y < this.horizon + 1) continue;
      c.globalAlpha = clamp((FAR - (z - this.camZ)) / FAR, 0, 1) * 0.35;
      this.stroke([[a.x, a.y], [b.x, b.y]], pal.groundFar, 2);
    }
    const stage = model.stage.id;
    // Floor character per stage: lamp pools and tile joints in the tunnel, planks over the swamp,
    // flagstones in the tower, trodden earth with grass in the forest and on the island.
    if (stage === 'tunnel' || stage === 'tower') {
      const pool = stage === 'tunnel' ? 18 : 20;
      for (let z = Math.floor(near / pool) * pool; z < far; z += pool) {
        for (const side of [-1, 1]) {
          const g = this.project(side * 1.5 * W, 0, z);
          if (g.y < this.horizon + 2) continue;
          const light = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, 2.4 * g.s);
          light.addColorStop(0, pal.accent + '33'); light.addColorStop(1, pal.accent + '00');
          c.fillStyle = light; c.beginPath(); c.ellipse(g.x, g.y, 2.4 * g.s, 0.8 * g.s, 0, 0, Math.PI * 2); c.fill();
        }
      }
      for (let z = Math.floor(near / 2) * 2; z < far; z += 2) {
        const lane = Math.round(z / 2) % 2 ? -0.5 : 0.5;
        const a = this.project(lane * W, 0, z), b = this.project(lane * W, 0, z + 2);
        if (a.y < this.horizon + 2) continue;
        c.globalAlpha = clamp((70 - (z - this.camZ)) / 70, 0, 1) * 0.3; this.stroke([[a.x, a.y], [b.x, b.y]], pal.groundFar, 1.2);
      }
      c.globalAlpha = 1;
    } else if (stage === 'wetlands') {
      for (let z = Math.floor(near / 0.9) * 0.9; z < Math.min(far, this.camZ + 60); z += 0.9) {
        const a = this.project(-edge, 0, z), b = this.project(edge, 0, z);
        if (a.y < this.horizon + 2) continue;
        c.globalAlpha = clamp((60 - (z - this.camZ)) / 60, 0, 1) * 0.5; this.stroke([[a.x, a.y], [b.x, b.y]], '#4a3d2e', 1.2);
      }
      c.globalAlpha = 1;
      for (let z = Math.floor(near / 6) * 6; z < far; z += 6) for (const side of [-1, 1]) {
        const g = this.project(side * (1.5 * W + 1.6 + noise(z + side) * 1.5), 0, z);
        if (g.y > this.horizon + 2) this.ellipse(g.x, g.y, 0.8 * g.s, 0.12 * g.s, '#c4d4c655', true);
      }
    } else {
      for (let z = Math.floor(near / 3) * 3; z < Math.min(far, this.camZ + 70); z += 3) for (let i = 0; i < 3; i++) {
        const g = this.project(-edge + noise(z * 3 + i) * 2 * edge, 0, z + noise(z + i) * 3);
        if (g.y > this.horizon + 2) this.ellipse(g.x, g.y, 0.12 * g.s, 0.07 * g.s, stage === 'island' ? '#7d6c45' : '#5f4f36', true);
      }
      for (let z = Math.floor(near / 2.5) * 2.5; z < Math.min(far, this.camZ + 80); z += 2.5) for (const side of [-1, 1]) {
        const g = this.project(side * (1.5 * W + 0.35), 0, z + noise(z * 7 + side) * 2);
        if (g.y < this.horizon + 2) continue;
        for (let k = -1; k <= 1; k++) this.stroke([[g.x + k * 0.08 * g.s, g.y], [g.x + k * 0.16 * g.s, g.y - 0.3 * g.s]], stage === 'island' ? '#6fa150' : '#5c9a4a', 0.05 * g.s);
      }
    }
    // Phase 1 ends on the long staircase out of the tunnel.
    if (model.stage.id === 'tunnel') {
      const stairs = model.stageStart + model.stage.length * 0.78, end = model.stageStart + model.stage.length;
      for (let z = Math.max(stairs, Math.floor(near / 0.8) * 0.8); z < Math.min(end, far); z += 0.8) {
        const a = this.project(-edge, 0, z), b = this.project(edge, 0, z);
        if (a.y < this.horizon + 1) continue;
        c.globalAlpha = clamp((60 - (z - this.camZ)) / 60, 0, 1) * 0.6;
        this.stroke([[a.x, a.y], [b.x, b.y]], pal.accent, 1.2);
        this.stroke([[a.x, a.y + 1.5], [b.x, b.y + 1.5]], pal.groundFar, 1.2);
      }
    }
    c.globalAlpha = 1;
    c.save(); c.setLineDash([14, 10]); c.lineDashOffset = -(p.z * 10) % 24;
    for (const x of [-0.5 * W, 0.5 * W]) { const a = this.project(x, 0, near), b = this.project(x, 0, far); this.stroke([[a.x, a.y], [b.x, b.y]], pal.accent + '66', 1.5); }
    c.restore();
    this.stroke([[nl.x, nl.y], [fl.x, fl.y]], pal.wallDark, 3);
    this.stroke([[nr.x, nr.y], [fr.x, fr.y]], pal.wallDark, 3);
  }

  // A gate marks every phase boundary with the next stage's name.
  gate(model, pal) {
    const z = model.stageStart + model.stage.length;
    if (z - this.camZ > FAR || z < this.camZ + 1) return;
    const final = model.config.mode === 'exam' && model.lap === 0 && model.stage.id === 'island';
    const next = final ? { phase: 'FINAL PHASE', name: 'Hunter license' } : STAGES[(model.stageIndex + 1) % STAGES.length];
    const h = Math.max(3.2, this.camH + 1);
    const l = this.project(-1.75 * W, 0, z), r = this.project(1.75 * W, 0, z), lt = this.project(-1.75 * W, h, z), rt = this.project(1.75 * W, h, z);
    const s = l.s;
    this.rect(lt.x - 0.18 * s, lt.y, 0.36 * s, l.y - lt.y, pal.wallDark);
    this.rect(rt.x - 0.18 * s, rt.y, 0.36 * s, r.y - rt.y, pal.wallDark);
    this.rect(lt.x - 0.2 * s, lt.y - 0.75 * s, rt.x - lt.x + 0.4 * s, 0.75 * s, '#15131a', 0.05 * s);
    if (s > 5) this.text(`${next.phase.split(' ·')[0]} · ${next.name.toUpperCase()}`, (lt.x + rt.x) / 2, lt.y - 0.37 * s, Math.max(3, 0.3 * s), pal.accent);
  }

  // Side scenery at repeating world positions, drawn far to near together with the walls.
  scenery(model, pal) {
    const c = this.c, stage = model.stage.id;
    const spacing = stage === 'tunnel' ? 9 : stage === 'tower' ? 10 : stage === 'forest' ? 8 : 7;
    const first = Math.floor((this.camZ + FAR) / spacing) * spacing;
    for (let z = first; z > this.camZ - spacing; z -= spacing) {
      const n = Math.round(z / spacing);
      for (const side of [-1, 1]) {
        const x = side * (1.5 * W + 1.1);
        const base = this.project(x, 0, z);
        if (base.d < 0.8) continue;
        const s = base.s;
        const fade = this.fog(base.d, model);
        c.globalAlpha = fade;
        if (stage === 'tunnel' || stage === 'tower') {
          // Wall segment between this post and the next, then the post itself and a lamp.
          const wall = Math.max(3.4, this.camH + 1.6);
          const next = this.project(x, 0, z + spacing), top = this.project(x, wall, z), nextTop = this.project(x, wall, z + spacing);
          const far = this.project(x + side * 2.4, wall, z + spacing), farNear = this.project(x + side * 2.4, wall, z);
          this.fill([[base.x, base.y], [next.x, next.y], [nextTop.x, nextTop.y], [top.x, top.y]], n % 2 ? pal.wall : pal.wallDark);
          this.fill([[top.x, top.y], [nextTop.x, nextTop.y], [far.x, far.y], [farNear.x, farNear.y]], pal.wallDark);
          if (s > 7) {
            // Mortar lines keep the walls reading as stone at every depth.
            for (let h = 0.7; h < wall; h += 0.7) { const a = this.project(x, h, z), b = this.project(x, h, z + spacing); this.stroke([[a.x, a.y], [b.x, b.y]], '#00000033', 1); }
            for (let k = 0.5; k < spacing; k += spacing / 3) { const a = this.project(x, 0, z + k), b = this.project(x, wall, z + k); this.stroke([[a.x, a.y], [b.x, b.y]], '#00000022', 1); }
          }
          this.rect(top.x - 0.2 * s, top.y, 0.4 * s, base.y - top.y, pal.wallDark);
          if (n % 2 === 0) {
            const lamp = this.project(x - side * 0.35, 2.4, z);
            const glow = c.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, 1.6 * s);
            glow.addColorStop(0, pal.accent + '55'); glow.addColorStop(1, pal.accent + '00');
            c.fillStyle = glow; c.fillRect(lamp.x - 1.6 * s, lamp.y - 1.6 * s, 3.2 * s, 3.2 * s);
            this.rect(lamp.x - 0.08 * s, lamp.y - 0.1 * s, 0.16 * s, stage === 'tower' ? 0.5 * s : 0.2 * s, pal.accent);
          }
          if (stage === 'tower' && n % 4 === 1 && side === -1) {
            const sign = this.project(x - side * 0.3, 1.8, z);
            this.rect(sign.x - 0.5 * s, sign.y - 0.3 * s, 1 * s, 0.6 * s, '#15161c');
            this.text(`${Math.max(0, Math.round(72 - model.stageProgress * 70))}h`, sign.x, sign.y, Math.max(4, 0.32 * s), '#ff9d5c');
          }
        } else if (stage === 'wetlands') {
          const lean = side * (noise(n) - 0.5) * 0.8;
          const mid = this.project(x + lean * 0.5, 1.6, z), trunkTop = this.project(x + lean, 3 + noise(n + 2) * 1.2, z);
          this.stroke([[base.x, base.y], [mid.x, mid.y], [trunkTop.x, trunkTop.y]], '#2c3a2f', 0.22 * s);
          this.stroke([[mid.x, mid.y], [mid.x + side * 0.9 * s, mid.y - 0.6 * s]], '#2c3a2f', 0.1 * s);
          for (let k = 0; k < 4; k++) this.ellipse(trunkTop.x + (noise(n * 3 + k) - 0.5) * 0.8 * s, trunkTop.y + (noise(n + k * 5) - 0.6) * 0.4 * s, 0.3 * s, 0.2 * s, k % 2 ? '#33483a' : '#2b3e31');
          if (n % 3 === 0) this.ellipse(this.project(x - side * 0.6, 0, z).x, base.y, 0.5 * s, 0.12 * s, '#8aa49c66');
        } else if (stage === 'forest') {
          // Visca Forest Preserve: broad trunks, layered canopies, ferns at the roots.
          const top = this.project(x + side * 0.3, 4.2 + noise(n) * 1.5, z);
          this.stroke([[base.x, base.y], [top.x, top.y]], '#4a3a26', 0.42 * s);
          this.stroke([[base.x + side * 0.1 * s, base.y], [top.x + side * 0.08 * s, top.y]], '#6b5236', 0.14 * s);
          for (let k = 0; k < 4; k++) this.ellipse(top.x + (noise(n * 5 + k) - 0.5) * 2.2 * s, top.y + (noise(n + k * 3) - 0.7) * 0.9 * s, (0.9 + noise(k + n) * 0.4) * s, 0.55 * s, k % 2 ? '#3f8a46' : '#2f6e3a', true);
          for (let k = -2; k <= 2; k++) this.stroke([[base.x, base.y], [base.x + k * 0.3 * s + side * 0.4 * s, base.y - (0.5 + Math.abs(k) * 0.08) * s]], '#5fae5a', 0.08 * s);
        } else {
          const top = this.project(x + side * 0.4, 3.6 + noise(n) * 1.2, z);
          this.stroke([[base.x, base.y], [top.x, top.y]], '#6b5339', 0.2 * s);
          for (let k = 0; k < 5; k++) {
            const angle = -Math.PI / 2 + (k - 2) * 0.55 + (this.reduced ? 0 : Math.sin(this.time + n + k) * 0.05);
            this.stroke([[top.x, top.y], [top.x + Math.cos(angle) * 1.4 * s, top.y + Math.sin(angle) * 0.7 * s + 0.4 * s]], '#3e8a4a', 0.16 * s);
          }
          if (n % 2) this.ellipse(base.x, base.y, 0.7 * s, 0.25 * s, '#3e7a3b');
        }
        c.globalAlpha = 1;
      }
    }
  }

  fog(d, model) { return model.stage.fog ? clamp((40 - d) / 22, 0.05, 1) : 1; }

  // Obstacle and pickup artwork; `s` is pixels per meter at that depth and `g` the ground point.
  object(o, model, pal) {
    const c = this.c;
    const g = this.project((o.lane - 1) * W, 0, o.z);
    if (g.d < 0.7 || g.d > FAR) return;
    const s = g.s;
    const revealed = model.revealed;
    let alpha = this.fog(g.d, model);
    let ghost = false;
    if (o.hidden && !o.destroyed) {
      if (!revealed) {
        if (g.d > RUN.revealRange) return;
        ghost = true;
        alpha *= 0.16 + (this.reduced ? 0 : Math.sin(this.time * 9) * 0.05);
      }
    }
    c.save();
    c.globalAlpha = alpha;
    if (o.hidden && revealed) {
      // In broken by Gyo: a violet halo around the concealed thing.
      const halo = c.createRadialGradient(g.x, g.y - 0.7 * s, 0, g.x, g.y - 0.7 * s, 1.3 * s);
      halo.addColorStop(0, '#b78bff66'); halo.addColorStop(1, '#b78bff00');
      c.fillStyle = halo; c.fillRect(g.x - 1.4 * s, g.y - 2.2 * s, 2.8 * s, 3 * s);
    }
    const k = o.kind;
    const half = 0.46 * W * s;
    this.ink = o.cls === 'gap' ? null : '#1a1518'; this.inkW = Math.max(0.7, 0.045 * s);
    if (k === 'pig') {
      // A Great Stamp, head on: Buhara's dinner, charging.
      const charging = o.z > o.zMin;
      const bounce = charging && !this.reduced ? Math.abs(Math.sin(this.time * 14)) * 0.08 * s : 0;
      this.ellipse(g.x, g.y - 0.05 * s, half * 1.2, 0.3 * s, '#00000040', true);
      this.ellipse(g.x, g.y - 0.95 * s - bounce, half * 1.15, 0.85 * s, '#b47c6c');
      for (const side of [-1, 1]) { this.ellipse(g.x + side * 0.55 * s, g.y - 0.15 * s - bounce * 0.5, 0.16 * s, 0.14 * s, '#7a5248'); this.fill([[g.x + side * 0.75 * s, g.y - 1.65 * s - bounce], [g.x + side * 0.95 * s, g.y - 2.15 * s - bounce], [g.x + side * 0.45 * s, g.y - 1.75 * s - bounce]], '#9d6a5e'); }
      this.ellipse(g.x, g.y - 1.15 * s - bounce, half * 0.95, 0.7 * s, '#c38c7b');
      this.ellipse(g.x, g.y - 0.85 * s - bounce, 0.42 * s, 0.3 * s, '#e3a39a');
      this.ellipse(g.x - 0.14 * s, g.y - 0.85 * s - bounce, 0.06 * s, 0.09 * s, '#5b3a36', true); this.ellipse(g.x + 0.14 * s, g.y - 0.85 * s - bounce, 0.06 * s, 0.09 * s, '#5b3a36', true);
      for (const side of [-1, 1]) this.fill([[g.x + side * 0.42 * s, g.y - 0.75 * s - bounce], [g.x + side * 0.62 * s, g.y - 0.45 * s - bounce], [g.x + side * 0.3 * s, g.y - 0.65 * s - bounce]], '#f3ead9');
      for (const side of [-1, 1]) { this.ellipse(g.x + side * 0.32 * s, g.y - 1.4 * s - bounce, 0.11 * s, 0.1 * s, '#f6f0e4'); this.ellipse(g.x + side * 0.3 * s, g.y - 1.4 * s - bounce, 0.05 * s, 0.06 * s, '#1a1518', true); this.stroke([[g.x + side * 0.15 * s, g.y - 1.62 * s - bounce], [g.x + side * 0.48 * s, g.y - 1.5 * s - bounce]], '#1a1518', 0.06 * s); }
    } else if (k === 'stump') {
      this.ellipse(g.x, g.y - 0.05 * s, half * 0.9, 0.22 * s, '#00000040', true);
      this.rect(g.x - half * 0.7, g.y - 0.62 * s, half * 1.4, 0.62 * s, '#6e5236', 0.06 * s);
      this.ellipse(g.x, g.y - 0.62 * s, half * 0.7, 0.22 * s, '#c9a876');
      this.ellipse(g.x, g.y - 0.62 * s, half * 0.4, 0.12 * s, '#b0905f', true);
    } else if (k === 'web') {
      const top = g.y - 3.4 * s;
      for (let i = 0; i < 4; i++) { const x = g.x - half * 0.9 + i * half * 0.6; this.stroke([[x, top], [x + (i % 2 ? 0.1 : -0.1) * s, g.y - 1.1 * s]], '#f1f0e6', 0.05 * s); }
      for (let r = 1; r <= 3; r++) this.stroke([[g.x - half * 0.9 + r * 0.12 * s, top + r * 0.3 * s], [g.x, top + r * 0.42 * s], [g.x + half * 0.9 - r * 0.12 * s, top + r * 0.3 * s]], '#f1f0e6', 0.04 * s);
      this.stroke([[g.x - half, g.y - 1.1 * s], [g.x + half, g.y - 1.1 * s]], '#f1f0e6', 0.07 * s);
      this.ellipse(g.x + half * 0.5, g.y - 1.35 * s, 0.12 * s, 0.09 * s, '#2a2a30');
    } else if (k === 'egg') {
      const sway = this.reduced ? 0 : Math.sin(this.time * 2 + o.lane) * 0.06 * s;
      this.stroke([[g.x, g.y - 3.4 * s], [g.x + sway, g.y - 1.45 * s]], '#f1f0e6', 0.05 * s);
      const glow = c.createRadialGradient(g.x + sway, g.y - 1.1 * s, 0, g.x + sway, g.y - 1.1 * s, 0.9 * s);
      glow.addColorStop(0, '#dff3ff77'); glow.addColorStop(1, '#dff3ff00'); c.fillStyle = glow; c.fillRect(g.x - s, g.y - 2.1 * s, 2 * s, 2 * s);
      this.ellipse(g.x + sway, g.y - 1.1 * s, 0.27 * s, 0.36 * s, '#f6f3ea');
      for (let i = 0; i < 4; i++) this.ellipse(g.x + sway + (noise(i + o.lane) - 0.5) * 0.3 * s, g.y - 1.1 * s + (noise(i + 7) - 0.5) * 0.4 * s, 0.04 * s, 0.03 * s, '#8fb4d8', true);
    } else if (k === 'cliff') {
      this.ink = null;
      this.groundQuad(o.lane, o.z, o.z + o.len, '#2a2622', 0.02);
      this.groundQuad(o.lane, o.z + 0.6, o.z + o.len - 0.6, '#14110f', 0.12);
      const rim = this.project((o.lane - 1) * W, 0, o.z), far = this.project((o.lane - 1) * W, 0, o.z + o.len);
      this.stroke([[rim.x - half, rim.y], [rim.x + half, rim.y]], '#b9a680', 0.08 * s);
      this.stroke([[far.x - half * far.s / s, far.y], [far.x + half * far.s / s, far.y]], '#7f7257', 0.06 * far.s);
      const mist = this.project((o.lane - 1) * W, 0, o.z + o.len * 0.5);
      this.ellipse(mist.x, mist.y, half * 0.9 * mist.s / s, 0.2 * mist.s, '#c9d3d088', true);
    } else if (k === 'applicant' || k === 'hunter') this.runner(g.x, g.y, s, { hair: k === 'hunter' ? '#2a2a2a' : ['#4a3a2c', '#7a5b3c', '#1f2528'][o.number % 3], top: k === 'hunter' ? '#5a3e3e' : ['#6c7a8a', '#8a6c5b', '#56705f'][o.number % 3], number: o.number, phase: (this.reduced ? 0 : this.time * 9) + o.number });
    else if (k === 'lugger') {
      // Revealed: the ape behind the applicant's silhouette.
      this.ellipse(g.x, g.y - 0.15 * s, 0.45 * s, 0.2 * s, '#00000033', true);
      this.rect(g.x - 0.42 * s, g.y - 1.25 * s, 0.84 * s, 1.15 * s, '#5b4332', 0.3 * s);
      this.ellipse(g.x, g.y - 1.45 * s, 0.34 * s, 0.3 * s, '#6b4f3a');
      this.ellipse(g.x, g.y - 1.4 * s, 0.22 * s, 0.17 * s, '#c9a98d');
      this.stroke([[g.x - 0.4 * s, g.y - 1 * s], [g.x - 0.75 * s, g.y - 0.1 * s]], '#4b3528', 0.16 * s);
      this.stroke([[g.x + 0.4 * s, g.y - 1 * s], [g.x + 0.75 * s, g.y - 0.1 * s]], '#4b3528', 0.16 * s);
    } else if (k === 'fallen') {
      this.ellipse(g.x, g.y - 0.12 * s, half, 0.2 * s, '#5d6168');
      this.ellipse(g.x + half * 0.7, g.y - 0.18 * s, 0.2 * s, 0.17 * s, '#d9b394');
      this.rect(g.x - half * 0.5, g.y - 0.32 * s, half * 0.8, 0.26 * s, '#7e8894', 0.08 * s);
    } else if (k === 'luggage') {
      this.rect(g.x - 0.45 * s, g.y - 0.58 * s, 0.9 * s, 0.58 * s, '#4a3526', 0.06 * s);
      this.rect(g.x - 0.4 * s, g.y - 0.53 * s, 0.8 * s, 0.48 * s, '#6e4c33', 0.05 * s);
      this.rect(g.x - 0.12 * s, g.y - 0.72 * s, 0.24 * s, 0.14 * s, '#2a2019', 0.05 * s);
    } else if (k === 'pipe' || k === 'branch') {
      const color = k === 'pipe' ? '#8a9199' : '#6b4f33';
      this.rect(g.x - half - 0.15 * s, g.y - 1.35 * s, 0.14 * s, 1.35 * s, k === 'pipe' ? '#6b7178' : '#4f3a26');
      this.rect(g.x + half + 0.02 * s, g.y - 1.35 * s, 0.14 * s, 1.35 * s, k === 'pipe' ? '#6b7178' : '#4f3a26');
      this.rect(g.x - half - 0.2 * s, g.y - 1.45 * s, half * 2 + 0.4 * s, 0.28 * s, color, 0.14 * s);
      if (k === 'branch') for (let i = 0; i < 4; i++) this.ellipse(g.x - half + i * half * 0.66, g.y - 1.5 * s, 0.3 * s, 0.18 * s, '#3f8a46');
    } else if (k === 'pillar' || k === 'door' || k === 'tree' || k === 'boulder') {
      if (k === 'boulder') {
        this.ellipse(g.x, g.y - 0.05 * s, half * 1.05, 0.25 * s, '#00000040', true);
        this.ellipse(g.x, g.y - 0.75 * s, half, 0.8 * s, '#777a74');
        this.ellipse(g.x - 0.2 * s, g.y - 0.95 * s, half * 0.6, 0.45 * s, '#8f928b');
      } else if (k === 'tree') {
        this.rect(g.x - half * 0.6, g.y - 3.6 * s, half * 1.2, 3.6 * s, '#3f3327', 0.1 * s);
        this.stroke([[g.x - half * 0.3, g.y], [g.x - half * 0.6, g.y - 1.6 * s]], '#2e251c', 0.08 * s);
        this.ellipse(g.x, g.y - 3.6 * s, half * 2.2, 0.9 * s, '#2f4a35');
      } else {
        const stone = k === 'door' ? '#4d505f' : '#4a434f';
        this.rect(g.x - half, g.y - 3.4 * s, half * 2, 3.4 * s, stone, 0.08 * s);
        this.rect(g.x - half + 0.1 * s, g.y - 3.3 * s, half * 2 - 0.2 * s, 3.2 * s, k === 'door' ? '#3a3c48' : '#39333d', 0.08 * s);
        if (k === 'door') { this.text('MAJORITY', g.x, g.y - 2.6 * s, Math.max(3, 0.2 * s), '#ffb55f'); this.ellipse(g.x + half * 0.5, g.y - 1.6 * s, 0.08 * s, 0.08 * s, '#ffb55f'); }
        else for (let i = 0; i < 4; i++) this.stroke([[g.x - half + 0.1 * s, g.y - (0.7 + i * 0.75) * s], [g.x + half - 0.1 * s, g.y - (0.7 + i * 0.75) * s]], '#2a252e', 0.05 * s);
      }
    } else if (k === 'log' || k === 'trunk') {
      this.ellipse(g.x, g.y - 0.05 * s, half * 1.1, 0.2 * s, '#00000040', true);
      this.rect(g.x - half * 1.1, g.y - 0.6 * s, half * 2.2, 0.55 * s, k === 'log' ? '#5a4231' : '#8a6a44', 0.25 * s);
      this.ellipse(g.x + half * 1.1, g.y - 0.32 * s, 0.14 * s, 0.26 * s, '#c7a57a');
    } else if (k === 'vine') {
      for (let i = 0; i < 5; i++) {
        const x = g.x - half + i * half * 0.5, sway = this.reduced ? 0 : Math.sin(this.time * 2 + i) * 0.1 * s;
        this.stroke([[x, g.y - 3.4 * s], [x + sway, g.y - 1.15 * s]], '#4f7a3f', 0.09 * s);
        this.ellipse(x + sway, g.y - 1.2 * s, 0.13 * s, 0.2 * s, '#6c9a4a');
      }
    } else if (k === 'mud' || k === 'trapdoor' || k === 'ravine') {
      const color = k === 'mud' ? '#2f2a22' : k === 'trapdoor' ? '#0b0c10' : '#1d1b17';
      this.groundQuad(o.lane, o.z, o.z + o.len, color, 0.08);
      if (k === 'ravine') this.groundQuad(o.lane, o.z + 0.3, o.z + o.len - 0.3, '#0e0d0b', 0.25);
      if (k === 'mud') { const mid = this.project((o.lane - 1) * W, 0, o.z + o.len / 2); this.ellipse(mid.x + 0.3 * s, mid.y, 0.2 * s, 0.07 * s, '#5c5243'); }
    } else if (k === 'hippo') {
      this.ellipse(g.x, g.y - 0.05 * s, half * 1.1, 0.3 * s, '#00000040', true);
      this.ellipse(g.x, g.y - 0.55 * s, half * 1.05, 0.55 * s, '#5c5560');
      this.ellipse(g.x, g.y - 1.1 * s, half * 0.95, 0.5 * s, '#c96f88');
      this.ellipse(g.x, g.y - 1.65 * s, half * 1.05, 0.45 * s, '#6d6471');
      for (let i = 0; i < 4; i++) this.fill([[g.x - half * 0.8 + i * half * 0.53, g.y - 1.3 * s], [g.x - half * 0.65 + i * half * 0.53, g.y - 0.9 * s], [g.x - half * 0.5 + i * half * 0.53, g.y - 1.3 * s]], '#f3ead9');
      this.ellipse(g.x - half * 0.5, g.y - 1.95 * s, 0.1 * s, 0.1 * s, '#1c1a1f'); this.ellipse(g.x + half * 0.5, g.y - 1.95 * s, 0.1 * s, 0.1 * s, '#1c1a1f');
    } else if (k === 'spikes') {
      this.rect(g.x - half, g.y - 0.12 * s, half * 2, 0.12 * s, '#55545e');
      for (let i = 0; i < 5; i++) { const x = g.x - half * 0.8 + i * half * 0.4; this.fill([[x - 0.1 * s, g.y - 0.1 * s], [x, g.y - 0.75 * s], [x + 0.1 * s, g.y - 0.1 * s]], '#b9bcc9'); }
    } else if (k === 'blade') {
      const swing = this.reduced ? 0 : Math.sin(this.time * 3 + o.z) * 0.5;
      const pivot = { x: g.x, y: g.y - 3.4 * s };
      const tip = { x: pivot.x + Math.sin(swing) * 2 * s, y: pivot.y + Math.cos(swing) * 2 * s };
      this.stroke([[pivot.x, pivot.y], [tip.x, tip.y]], '#6b6b74', 0.08 * s);
      c.save(); c.translate(tip.x, tip.y); c.rotate(-swing);
      this.fill([[-0.7 * s, -0.25 * s], [0.7 * s, -0.25 * s], [0.5 * s, 0.25 * s], [-0.5 * s, 0.25 * s]], '#c8cbd6');
      c.restore();
    } else if (k === 'bees') {
      for (let i = 0; i < 12; i++) {
        const t = this.reduced ? 0 : this.time * 5;
        const x = g.x + Math.sin(t + i * 1.7) * half * 0.8, y = g.y - 1.25 * s + Math.cos(t * 1.3 + i) * 0.25 * s;
        this.ellipse(x, y, 0.07 * s, 0.05 * s, i % 2 ? '#f2c94c' : '#2b2b2b');
      }
      this.ellipse(g.x, g.y - 1.25 * s, half, 0.35 * s, '#f2c94c22', true);
    } else if (k === 'plate' || k === 'target') {
      const bob = this.reduced ? 0 : Math.sin(this.time * 3 + o.z) * 0.05 * s;
      const y = g.y - 0.8 * s + bob;
      if (k === 'target') { const glow = c.createRadialGradient(g.x, y, 0, g.x, y, 0.9 * s); glow.addColorStop(0, '#ffd86b66'); glow.addColorStop(1, '#ffd86b00'); c.fillStyle = glow; c.fillRect(g.x - s, y - s, 2 * s, 2 * s); }
      this.ellipse(g.x, g.y - 0.02 * s, 0.22 * s, 0.07 * s, '#00000030', true);
      this.rect(g.x - 0.28 * s, y - 0.22 * s, 0.56 * s, 0.44 * s, k === 'target' ? '#f5cf5c' : '#e6e1d2', 0.08 * s);
      this.rect(g.x - 0.24 * s, y - 0.18 * s, 0.48 * s, 0.36 * s, k === 'target' ? '#fff0b0' : '#f8f5ea', 0.06 * s);
      if (s > 18) this.text(String(o.number), g.x, y, Math.max(4, 0.24 * s), '#2a2d36');
    } else if (k === 'juice') {
      this.rect(g.x - 0.3 * s, g.y - 0.55 * s, 0.6 * s, 0.1 * s, '#7e6a4e');
      this.rect(g.x - 0.14 * s, g.y - 0.95 * s, 0.28 * s, 0.42 * s, '#f0882c', 0.05 * s);
      this.rect(g.x - 0.14 * s, g.y - 0.95 * s, 0.28 * s, 0.1 * s, '#c9c9c9', 0.03 * s);
      this.rect(g.x - 0.42 * s, g.y - 1.45 * s, 0.84 * s, 0.38 * s, '#f5edd6', 0.04 * s);
      if (s > 20) this.text('FREE JUICE', g.x, g.y - 1.26 * s, Math.max(3, 0.16 * s), '#8a4a1c');
    } else if (k === 'wager') {
      const flip = this.reduced ? 1 : Math.abs(Math.cos(this.time * 4));
      this.ellipse(g.x, g.y - 0.9 * s, 0.3 * s * flip, 0.3 * s, '#e9c35a');
      this.ellipse(g.x, g.y - 0.9 * s, 0.2 * s * flip, 0.2 * s, '#f6df9a');
      if (s > 20) this.text('50h', g.x, g.y - 0.9 * s, Math.max(3, 0.18 * s), '#6e4e12');
    }
    if (ghost && !this.reduced) { c.globalAlpha = Math.min(1, alpha * 3); this.stroke([[g.x - half, g.y - 0.1 * s], [g.x + half, g.y - 0.1 * s]], '#c9b3ff', 0.05 * s); }
    if (o.tip && g.d < 45 && s > 9) {
      // First-run coaching: the first hazard of each kind in the tunnel says what to do.
      const bob = this.reduced ? 0 : Math.sin(this.time * 4) * 0.08 * s;
      const y = g.y - (o.cls === 'high' ? 2.3 : o.kind === 'egg' ? 2.1 : 1.9) * s + bob, w = (o.tip.length * 0.19 + 0.5) * s;
      c.globalAlpha = Math.min(1, alpha * 2);
      this.rect(g.x - w / 2, y - 0.26 * s, w, 0.52 * s, '#15131aee', 0.1 * s);
      this.fill([[g.x - 0.12 * s, y + 0.26 * s], [g.x + 0.12 * s, y + 0.26 * s], [g.x, y + 0.45 * s]], '#15131aee');
      this.text(o.tip, g.x, y, Math.max(4, 0.3 * s), pal.accent);
    }
    this.ink = null;
    c.restore();
  }

  seg(ax, ay, bx, by, width, color) {
    const c = this.c; c.lineCap = 'round';
    if (this.ink) { c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.strokeStyle = this.ink; c.lineWidth = width + this.inkW * 2; c.stroke(); }
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.strokeStyle = color; c.lineWidth = width; c.stroke(); c.lineCap = 'butt';
  }

  // A runner seen from behind. `look` sets hair, top, sleeve and pants colours, a plate number and the
  // stride phase; `pose` carries the hero's lift, lean, landing squash and slide. Limbs are two-segment
  // round strokes so the stride reads at every size; decorations are anchored to the head and torso.
  runner(x, y, s, look, pose = {}) {
    const c = this.c;
    const phase = look.phase || 0;
    const lift = pose.y || 0, lean = pose.lean || 0, land = pose.land || 0;
    const skin = look.skin || '#e5bb9a', pants = look.pants || '#2b2f3a', sleeve = look.sleeve || look.top;
    const outerInk = this.ink;
    this.ellipse(x, y - 0.03 * s, 0.34 * s * (1 - lift * 0.3), 0.11 * s, '#00000045', true);
    this.ink = '#1a1518'; this.inkW = Math.max(0.7, 0.05 * s);
    c.save();
    c.translate(x, y - lift * s);
    c.scale(1 + land * 0.12, 1 - land * 0.18);
    if (pose.slide) {
      c.rotate(lean * 0.3);
      this.seg(-0.2 * s, -0.25 * s, -0.55 * s, -0.08 * s, 0.17 * s, pants);
      this.seg(0.2 * s, -0.25 * s, 0.55 * s, -0.1 * s, 0.17 * s, pants);
      this.rect(-0.34 * s, -0.66 * s, 0.68 * s, 0.46 * s, look.top, 0.16 * s);
      this.seg(-0.3 * s, -0.5 * s, -0.5 * s, -0.75 * s, 0.13 * s, sleeve);
      this.seg(0.3 * s, -0.5 * s, 0.5 * s, -0.75 * s, 0.13 * s, sleeve);
      this.ellipse(0, -0.78 * s, 0.24 * s, 0.22 * s, skin);
      this.ellipse(0, -0.86 * s, 0.26 * s, 0.2 * s, look.hair);
      c.restore();
      this.ink = outerInk;
      return;
    }
    c.rotate(lean * 0.22);
    const bob = Math.abs(Math.sin(phase)) * 0.05 * s;
    const hipY = -0.52 * s - bob;
    // Legs: the back leg folds up at the knee, the front leg reaches down.
    for (const side of [-1, 1]) {
      const swing = Math.sin(phase + (side < 0 ? 0 : Math.PI));
      const raise = Math.max(0, swing) * 0.42;
      const hipX = side * 0.12 * s;
      const kneeX = hipX + side * (0.04 + raise * 0.12) * s, kneeY = hipY + (0.26 - raise * 0.18) * s;
      const footY = -(raise * 0.9) * s;
      this.seg(hipX, hipY, kneeX, kneeY, 0.17 * s, pants);
      this.seg(kneeX, kneeY, hipX + side * 0.02 * s, footY - 0.04 * s, 0.15 * s, pants);
      this.ellipse(hipX + side * 0.02 * s, footY - 0.03 * s, 0.1 * s, 0.06 * s, look.shoes || '#1c1b22');
    }
    // Torso and arms, with the light from the left so the right side sits in shadow.
    this.rect(-0.31 * s, hipY - 0.56 * s, 0.62 * s, 0.6 * s, look.top, 0.13 * s);
    this.rect(0.02 * s, hipY - 0.54 * s, 0.27 * s, 0.56 * s, '#0000002a', [0, 0.11 * s, 0.11 * s, 0], true);
    for (const side of [-1, 1]) {
      const swing = Math.sin(phase + (side < 0 ? Math.PI : 0));
      const shoulderX = side * 0.33 * s, shoulderY = hipY - 0.48 * s;
      const elbowX = shoulderX + side * 0.08 * s, elbowY = shoulderY + (0.3 - swing * 0.08) * s;
      const handY = elbowY + (0.1 + swing * 0.18) * s;
      this.seg(shoulderX, shoulderY, elbowX, elbowY, 0.13 * s, sleeve);
      this.seg(elbowX, elbowY, shoulderX + side * 0.02 * s, handY, 0.11 * s, sleeve);
      this.ellipse(shoulderX + side * 0.02 * s, handY + 0.02 * s, 0.06 * s, 0.06 * s, skin);
    }
    const headY = hipY - 0.83 * s;
    this.rect(-0.07 * s, headY + 0.12 * s, 0.14 * s, 0.14 * s, skin);
    this.ellipse(0, headY, 0.24 * s, 0.25 * s, skin);
    if (look.number !== undefined && s > 14) {
      this.rect(-0.17 * s, hipY - 0.46 * s, 0.34 * s, 0.26 * s, '#f1ecdf', 0.04 * s);
      this.text(String(look.number), 0, hipY - 0.33 * s, Math.max(3, 0.17 * s), '#2a2d36');
    }
    const h = look.hero;
    if (h === 'gon') {
      for (let i = 0; i < 5; i++) this.fill([[-0.26 * s + i * 0.13 * s, headY], [-0.2 * s + i * 0.13 * s, headY - (0.55 + (i === 2 ? 0.25 : i % 2 * 0.12)) * s], [-0.12 * s + i * 0.13 * s, headY]], '#1c2a26');
      this.ellipse(0, headY - 0.05 * s, 0.26 * s, 0.21 * s, '#1c2a26');
      this.seg(0.2 * s, hipY - 0.1 * s, -0.3 * s, headY - 0.6 * s, 0.05 * s, '#c9a45a');
    } else if (h === 'killua') {
      this.ellipse(0, headY - 0.06 * s, 0.3 * s, 0.3 * s, '#f1f3f7');
      for (let i = 0; i < 6; i++) this.ellipse(-0.28 * s + i * 0.11 * s, headY - (0.25 + (i % 2) * 0.1) * s, 0.12 * s, 0.13 * s, '#f7f8fb');
      this.rect(-0.22 * s, hipY - 0.52 * s, 0.44 * s, 0.5 * s, '#f0c2a5', 0.1 * s);
      this.rect(-0.28 * s, hipY - 0.54 * s, 0.56 * s, 0.1 * s, '#5b5f9a', 0.03 * s);
    } else if (h === 'kurapika') {
      this.ellipse(0, headY - 0.04 * s, 0.28 * s, 0.27 * s, '#f0cd6a');
      this.rect(-0.28 * s, headY - 0.1 * s, 0.56 * s, 0.3 * s, '#f0cd6a', 0.12 * s);
      this.rect(-0.22 * s, hipY - 0.52 * s, 0.44 * s, 0.6 * s, '#2f63b8', 0.05 * s);
      this.rect(-0.22 * s, hipY - 0.02 * s, 0.44 * s, 0.07 * s, '#e3c25a');
      this.seg(-0.25 * s, hipY - 0.05 * s, 0.2 * s, headY - 0.05 * s, 0.06 * s, '#8a6a3c');
    } else if (h === 'leorio') {
      this.ellipse(0, headY - 0.05 * s, 0.25 * s, 0.23 * s, '#1b1b22');
      this.rect(-0.03 * s, hipY - 0.56 * s, 0.06 * s, 0.56 * s, '#1f2a56');
      const swing = Math.sin(phase);
      this.rect(0.34 * s, hipY - 0.22 * s + swing * 0.12 * s, 0.3 * s, 0.26 * s, '#5c3b22', 0.03 * s);
      this.rect(0.4 * s, hipY - 0.27 * s + swing * 0.12 * s, 0.18 * s, 0.05 * s, '#3a2515');
    } else if (h === 'hisoka') {
      this.ellipse(0, headY - 0.08 * s, 0.28 * s, 0.3 * s, '#d8333c');
      this.fill([[-0.25 * s, headY - 0.03 * s], [-0.05 * s, headY - 0.63 * s], [0.22 * s, headY - 0.08 * s]], '#e2444d');
      this.text('♠', -0.12 * s, hipY - 0.36 * s, Math.max(4, 0.22 * s), '#2b3a6b');
      this.text('♥', 0.14 * s, hipY - 0.18 * s, Math.max(4, 0.22 * s), '#b8323c');
      this.rect(0.32 * s, headY - 0.14 * s, 0.22 * s, 0.32 * s, '#f6f1ea', 0.02 * s);
      this.text('J', 0.43 * s, headY + 0.02 * s, Math.max(3, 0.18 * s), '#c23');
    } else {
      this.ellipse(0, headY - 0.07 * s, 0.26 * s, 0.22 * s, look.hair);
    }
    c.restore();
    this.ink = outerInk;
  }

  hero(model) {
    const c = this.c, p = model.p, hero = model.hero;
    const g = this.project((p.x - 1) * W, 0, p.z);
    const s = g.s;
    const looks = {
      gon: { hair: '#1c2a26', top: '#3f8f5a', sleeve: '#3f8f5a', pants: '#1f3a33' },
      killua: { hair: '#f1f3f7', top: '#5b5f9a', sleeve: '#f0c2a5', pants: '#3a3f6e' },
      kurapika: { hair: '#f0cd6a', top: '#eef0f5', sleeve: '#eef0f5', pants: '#2f63b8' },
      leorio: { hair: '#1b1b22', top: '#2c3a72', sleeve: '#2c3a72', pants: '#1f2a56' }
    };
    const look = { ...looks[model.config.character], hero: model.config.character, phase: p.z * 2.6, number: hero.number };
    const lean = clamp(p.targetLane - p.x, -1, 1);
    const zetsu = model.nen === 'zetsu';
    if (model.godspeed > 0 && !this.reduced) {
      for (let i = 0; i < 5; i++) {
        const x0 = g.x + (noise(i + Math.floor(this.time * 20)) - 0.5) * 1.6 * s, y0 = g.y - 1.6 * s + noise(i * 7) * 0.4 * s;
        this.stroke([[x0, y0], [x0 + (noise(i + 11) - 0.5) * 0.5 * s, y0 + 0.5 * s], [x0 + (noise(i + 5) - 0.5) * 0.7 * s, y0 + 1.1 * s]], '#bfe8ff', 0.05 * s);
      }
    }
    if (!zetsu) {
      const aura = c.createRadialGradient(g.x, g.y - 0.8 * s, 0.2 * s, g.x, g.y - 0.8 * s, (model.gyo ? 1.1 : 0.85) * s);
      const col = model.gyo ? '#b78bff' : hero.color;
      aura.addColorStop(0, col + (model.charge > 0 ? '77' : '33')); aura.addColorStop(1, col + '00');
      c.fillStyle = aura; c.fillRect(g.x - 1.2 * s, g.y - 2.2 * s - p.y * s, 2.4 * s, 2.6 * s);
    }
    if (!zetsu && !this.reduced && model.phase === 'playing') {
      // Ten: a few motes of aura drifting up around the body.
      for (let i = 0; i < 4; i++) {
        const t = (this.time * 0.9 + i * 0.25) % 1;
        const mx = g.x + Math.sin(this.time * 3 + i * 1.7) * 0.42 * s, my = g.y - (0.2 + t * 1.5 + p.y) * s;
        c.globalAlpha = (1 - t) * 0.7; this.ellipse(mx, my, 0.05 * s, 0.05 * s, model.gyo ? '#d9c3ff' : hero.color, true);
      }
      c.globalAlpha = 1;
    }
    if (model.updraft > 0 && !this.reduced) {
      for (let i = 0; i < 8; i++) {
        const t = (this.time * 2.5 + i * 0.13) % 1, ux = g.x + (i - 3.5) * 0.3 * s;
        c.globalAlpha = 0.5 * (1 - t); this.stroke([[ux, g.y + 0.3 * s - t * 2.4 * s], [ux, g.y + 0.3 * s - (t + 0.18) * 2.4 * s]], '#dff3ff', 0.06 * s);
      }
      c.globalAlpha = 1;
    }
    c.save();
    if (zetsu) c.globalAlpha = 0.55;
    this.runner(g.x, g.y, s, look, { slide: p.slide > 0 && p.y <= 0.05, y: p.y, lean: this.reduced ? 0 : lean, land: this.reduced ? 0 : this.land });
    c.restore();
    if (model.gyo && !zetsu) { const eye = g.y - 1.36 * s - p.y * s; this.ellipse(g.x - 0.26 * s, eye, 0.06 * s, 0.05 * s, '#e9d7ff'); this.ellipse(g.x + 0.26 * s, eye, 0.06 * s, 0.05 * s, '#e9d7ff'); }
    if (model.charge > 0 && !this.reduced) {
      const fist = this.project((p.x - 1) * W + 0.5, 1 + p.y, p.z + 0.5);
      const grow = (0.5 - model.charge) / 0.5;
      this.ellipse(fist.x, fist.y, (0.2 + grow * 0.25) * s, (0.2 + grow * 0.25) * s, '#ffe08a');
    }
    if (model.punch?.target && !model.punch.target.done) {
      const t = 1 - model.punch.timer / 0.35, target = model.punch.target;
      const a = this.project((p.x - 1) * W, 1, p.z + 0.5), b = this.project((target.lane - 1) * W, 1, target.z);
      const f = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t) };
      this.ellipse(f.x, f.y, 0.26 * f.s, 0.22 * f.s, '#e5bb9a');
      this.stroke([[f.x - 0.3 * f.s, f.y], [f.x - 0.8 * f.s, f.y + 0.1 * f.s]], '#2c3a72', 0.1 * f.s);
    }
    if (model.chain > 0) {
      for (const o of model.objects) if (o.hidden && !o.done && o.z > p.z && o.z < p.z + 40) {
        const t = this.project((o.lane - 1) * W, 0.6, o.z);
        c.save(); c.setLineDash([3, 4]); this.stroke([[g.x + 0.3 * s, g.y - 0.7 * s], [t.x, t.y]], '#f3e3a3', 1.5); c.restore();
      }
    }
  }

  // Satotz keeps the same distance ahead for the whole of Phase 1, mustache and all.
  examiner(model) {
    const c = this.c, p = model.p;
    const ahead = model.stage.id === 'tunnel' ? 46 : 60;
    const g = this.project(0, 0, p.z + ahead);
    c.save(); c.globalAlpha = this.fog(g.d, model) * 0.95;
    this.runner(g.x, g.y, g.s * 1.25, { hair: '#4a3a5c', top: '#5a4a86', sleeve: '#5a4a86', pants: '#3b2f5a', phase: p.z * 2.1 });
    this.ellipse(g.x, g.y - 1.55 * g.s * 1.25, 0.2 * g.s, 0.06 * g.s, '#2b2338');
    c.restore();
  }

  pursuer(model) {
    if (!model.pursuer.active) return;
    const c = this.c, p = model.p;
    const g = this.project((p.x - 1) * W - 1.25, 0, p.z - 2.4);
    c.save(); c.globalAlpha = 0.9;
    this.runner(g.x, g.y, g.s, { hair: '#d8333c', top: '#f2eee8', sleeve: '#f2eee8', pants: '#5b3f8a', hero: 'hisoka', phase: p.z * 2.2 + 1 });
    c.restore();
  }

  drawEffects(model, dt) {
    const c = this.c;
    this.effects = this.effects.filter(e => e.age < e.life);
    for (const e of this.effects) {
      e.age += dt;
      const t = clamp(e.age / e.life, 0, 1);
      if (e.type === 'spark') {
        e.x += e.vx * dt; e.y += e.vy * dt; e.vy -= 3 * dt;
        const g = this.project(e.x, e.y, e.z);
        c.globalAlpha = 1 - t;
        this.ellipse(g.x, g.y, 0.045 * g.s, 0.045 * g.s, e.color, true);
      } else if (e.type === 'ring') {
        const g = this.project((e.lane - 1) * W, 0.8, e.z);
        c.globalAlpha = 1 - t; c.beginPath(); c.ellipse(g.x, g.y, (0.3 + t * 1.4) * g.s, (0.3 + t * 1.4) * g.s * 0.8, 0, 0, Math.PI * 2); c.strokeStyle = e.color; c.lineWidth = 3; c.stroke();
      } else if (e.type === 'wave') {
        const z = e.z + t * 26, a = this.project(-1.5 * W, 0.2, z), b = this.project(1.5 * W, 0.2, z);
        c.globalAlpha = 1 - t; this.stroke([[a.x, a.y], [b.x, b.y]], '#ffd27a', 6);
      } else if (e.type === 'reveal') {
        const g = this.project((e.lane - 1) * W, 0.7, e.z);
        c.globalAlpha = 1 - t; c.beginPath(); c.ellipse(g.x, g.y, (0.4 + t) * g.s, (0.4 + t) * g.s, 0, 0, Math.PI * 2); c.strokeStyle = '#c9a7ff'; c.lineWidth = 2; c.stroke();
      } else if (e.type === 'cards') {
        for (let i = 0; i < 6; i++) {
          const g = this.project((e.lane - 1) * W + (i - 2.5) * 0.5, 1.4 + t * 1.5 + noise(i) * 0.5, e.z + t * 4);
          c.globalAlpha = 1 - t; this.rect(g.x, g.y, 0.18 * g.s, 0.26 * g.s, i % 2 ? '#f6f1ea' : '#d8333c', 0.03 * g.s);
        }
      }
    }
    c.globalAlpha = 1;
  }

  wisps(model) {
    if (!model.stage.fog) return;
    const c = this.c;
    const spacing = 11, first = Math.floor((this.camZ + 70) / spacing) * spacing;
    for (let z = first; z > this.camZ + 1; z -= spacing) {
      const n = Math.round(z / spacing);
      const drift = this.reduced ? 0 : Math.sin(this.time * 0.6 + n) * 0.8;
      const g = this.project((noise(n) - 0.5) * 4 + drift, 0.35, z);
      c.globalAlpha = this.fog(g.d, model) * 0.2;
      this.ellipse(g.x, g.y, (0.9 + noise(n + 9) * 0.6) * g.s, 0.16 * g.s, '#d9e2d5', true);
    }
    c.globalAlpha = 1;
  }

  speedLines(model) {
    if (this.reduced || !(model.godspeed > 0 || model.speed > model.stage.speed * 1.25)) return;
    const c = this.c, H = this.H;
    c.globalAlpha = 0.28;
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1, t = noise(i + Math.floor(this.time * 25));
      const y = this.horizon - 40 + noise(i * 3) * (H - this.horizon + 60);
      const x0 = 320 + side * (260 + t * 80), x1 = x0 + side * (40 + t * 60);
      this.stroke([[x0, y], [x1, y + (y - this.horizon) * 0.08]], '#ffffff', 1.5);
    }
    c.globalAlpha = 1;
  }

  draw(model, { dt = 0, reducedMotion = false, preview = false } = {}) {
    if (!this.scale) this.resize();
    if (!this.scale) return;
    const c = this.c, H = this.H;
    this.reduced = reducedMotion;
    if (!reducedMotion) this.time += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.land = Math.max(0, this.land - dt * 4);
    const p = model.p;
    const pal = PALETTES[model.stage.id];
    this.camZ = p.z - CAM_BACK;
    const targetX = (p.x - 1) * W * 0.45;
    this.camX = reducedMotion || !dt ? targetX : lerp(this.camX, targetX, 1 - Math.exp(-dt * 10));
    const jitter = this.shake > 0 && !reducedMotion ? (noise(this.time * 60) - 0.5) * 8 * this.shake : 0;
    const bob = reducedMotion || model.phase !== 'playing' ? 0 : Math.sin(p.z * 2.6 * 2) * 1.2;
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.translate(jitter, jitter * 0.6 + bob);
    this.backdrop(model, pal);
    this.road(model, pal);
    // Everything with depth is painted far to near.
    const visible = model.objects.filter(o => !o.done && o.z > this.camZ + 0.5 && o.z < this.camZ + FAR).sort((a, b) => b.z - a.z);
    const gaps = visible.filter(o => o.cls === 'gap');
    for (const o of gaps) this.object(o, model, pal);
    this.scenery(model, pal);
    this.gate(model, pal);
    const behind = visible.filter(o => o.cls !== 'gap' && o.z >= p.z - 0.2), front = visible.filter(o => o.cls !== 'gap' && o.z < p.z - 0.2);
    if (model.stage.id === 'tunnel' || model.stage.id === 'wetlands') this.examiner(model);
    for (const o of behind) this.object(o, model, pal);
    this.hero(model);
    for (const o of front) this.object(o, model, pal);
    this.pursuer(model);
    this.drawEffects(model, dt);
    this.wisps(model);
    if (pal.fog) {
      const fog = c.createLinearGradient(0, this.horizon - 30, 0, this.horizon + 90);
      fog.addColorStop(0, pal.fog + 'ee'); fog.addColorStop(1, pal.fog + '00');
      c.fillStyle = fog; c.fillRect(0, -20, 640, this.horizon + 110);
      c.fillStyle = pal.fog + '22'; c.fillRect(0, -20, 640, H + 40);
    }
    this.speedLines(model);
    if (model.gyo || model.chain > 0) {
      const tint = c.createRadialGradient(320, H / 2, H * 0.33, 320, H / 2, H * 1.15);
      tint.addColorStop(0, '#6b3fb800'); tint.addColorStop(1, '#6b3fb855');
      c.fillStyle = tint; c.fillRect(0, -20, 640, H + 40);
    } else if (model.nen === 'zetsu') {
      c.fillStyle = '#1a243a44'; c.fillRect(0, -20, 640, H + 40);
    }
    const vignette = c.createRadialGradient(320, H / 2, H * 0.45, 320, H / 2, H * 1.15);
    vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#00000066');
    c.fillStyle = vignette; c.fillRect(0, -20, 640, H + 40);
    if (preview) { c.fillStyle = '#0b0e1466'; c.fillRect(0, -20, 640, H + 40); }
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
}
