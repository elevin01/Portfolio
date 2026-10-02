import { CROSSING, SKILLS } from './crossing-model.js';

const CELL = 52;
const ROW = 46;
const LEFT = 58;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const noise = n => { const value = Math.sin(n * 127.1 + 31.7) * 43758.5453; return value - Math.floor(value); };

export class CrossingRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 480;
    this.height = 530;
    this.camera = 0;
    this.effects = [];
    this.time = 0;
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 480;
    this.height = 480 * bounds.height / bounds.width;
    this.canvas.width = Math.round(bounds.width * dpr);
    this.canvas.height = Math.round(bounds.height * dpr);
    this.scale = this.canvas.width / 480;
  }

  reset() { this.camera = 0; this.effects = []; this.time = 0; }
  point(x, y) { return { x: LEFT + CELL * (x + 0.5), y: this.height * 0.76 - (y - this.camera) * ROW }; }

  accept(events, reducedMotion) {
    if (reducedMotion) return;
    const lifetimes = { devour: 0.55, storm: 0.65, barrier: 0.45, pickup: 0.75, land: 0.28, crash: 0.85, win: 1.3, cast: 0.6 };
    for (const event of events) {
      if (lifetimes[event.type]) this.effects.push({ ...event, age: 0, life: lifetimes[event.type] });
    }
    // A summon may clear many cars at once. Keep both rendering work and memory bounded.
    if (this.effects.length > 70) this.effects.splice(0, this.effects.length - 70);
  }

  hasEffects() { return this.effects.length > 0; }

  rect(x, y, width, height, radius, fill, stroke) {
    const c = this.ctx;
    c.beginPath(); c.roundRect(x, y, width, height, radius);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.stroke(); }
  }

  ellipse(x, y, rx, ry, fill) {
    const c = this.ctx;
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  }

  line(points, color, width = 1) {
    const c = this.ctx;
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.strokeStyle = color; c.lineWidth = width; c.stroke(); c.lineWidth = 1;
  }

  text(text, x, y, size, color, align = 'left') {
    const c = this.ctx;
    c.font = `600 ${size}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    c.textAlign = align; c.fillStyle = color; c.fillText(text, x, y);
  }

  road(row, y) {
    const c = this.ctx;
    const park = row.type === 'park';
    const safe = row.type !== 'road';
    c.fillStyle = safe ? (park ? '#25413f' : '#39495b') : (row.index % 2 ? '#192a3e' : '#1d2d42');
    c.fillRect(0, y - ROW / 2, this.width, ROW + 0.5);
    if (safe) {
      c.fillStyle = park ? '#203c36' : '#344354';
      c.fillRect(LEFT, y - ROW / 2 + 4, 364, ROW - 8);
      this.line([[0, y - 22], [480, y - 22]], park ? '#5f817064' : '#70849780', 2);
      this.line([[0, y + 21], [480, y + 21]], '#091929', 3);
      for (let col = 0; col <= 7; col++) this.line([[LEFT + col * CELL, y - 19], [LEFT + col * CELL, y + 19]], park ? '#486a4c38' : '#8ea8ba20');
      if (park) for (let n = 0; n < 10; n++) {
        const x = noise(row.index * 30 + n) * 480;
        this.line([[x, y + 5], [x - 1, y + 1], [x + 2, y + 3]], '#7ba47e66');
      }
      if (row.index === 0) {
        this.text('42 ST', 120, y + 5, 10, '#a9c1d2');
        this.text('↑ TEMPEST', 303, y + 5, 8, '#a9c1d2');
      }
    } else {
      c.save(); c.setLineDash([19, 19]);
      this.line([[0, y + 22], [480, y + 22]], '#b0c0cf33'); c.restore();
      // Worn crosswalk paint and wet reflections stay below all moving objects.
      for (let n = 0; n < 3; n++) {
        c.fillStyle = '#bdc8c21c'; c.fillRect(229, y - 18 + n * 14, 23, 8);
      }
      this.ellipse(110 + noise(row.index) * 290, y + 11, 35, 4, row.chapter === 1 ? '#6ba3b30b' : '#7fa9cf0d');
      const x = row.direction > 0 ? 24 : 456;
      this.line([[x - row.direction * 7, y], [x + row.direction * 6, y], [x + row.direction * 1, y - 4]], '#879ca580', 1.4);
      this.line([[x + row.direction * 6, y], [x + row.direction * 1, y + 4]], '#879ca580', 1.4);
      if (row.cars.some(car => car.kind === 'bus')) this.text('BUS', 350, y + 14, 8, '#a8c1ca33');
    }
    this.line([[LEFT - 7, y - 23], [LEFT - 7, y + 23]], '#82a8bd20');
    this.line([[LEFT + 371, y - 23], [LEFT + 371, y + 23]], '#82a8bd20');
  }

  building(x, y, seed, right = false) {
    const c = this.ctx;
    const tall = 52 + noise(seed) * 33;
    c.save(); c.translate(x, y);
    this.rect(-18, -tall, 37, tall + 13, 1, '#142234');
    this.rect(right ? -18 : 10, -tall + 6, 9, tall + 7, 0, '#0c1a2a');
    this.rect(-21, -tall - 5, 43, 8, 1, seed % 3 ? '#435369' : '#594d60');
    this.line([[-19, -tall - 5], [20, -tall - 5]], '#738598', 1.2);
    for (let r = 0; r < 4; r++) for (let col = 0; col < 3; col++) {
      const lit = noise(seed * 9 + r * 3 + col) > 0.42;
      this.rect(-12 + col * 10, -tall + 13 + r * 14, 4, 7, 0, lit ? '#d9b97a88' : '#4c6d8340');
    }
    if (seed % 3 === 0) {
      this.line([[-9, -tall - 5], [-8, -tall - 15], [8, -tall - 15], [9, -tall - 5]], '#8092a1');
      this.rect(-11, -tall - 33, 23, 21, 3, '#34475a', '#62798b');
      c.beginPath(); c.moveTo(-13, -tall - 32); c.lineTo(0, -tall - 42); c.lineTo(14, -tall - 32); c.fillStyle = '#566778'; c.fill();
    }
    if (seed % 4 === 0) {
      this.rect(-17, -19, 33, 13, 1, '#634771', '#a788b677');
      this.text('DELI', 0, -10, 6, '#e9c8e8', 'center');
    }
    c.restore();
  }

  scenery(row, y) {
    if (row.type === 'road') return;
    const c = this.ctx;
    if (row.chapter === 2) {
      for (const x of [17, 464]) {
        this.line([[x, y + 20], [x, y - 80]], '#788a9a', 3);
        this.line([[x - 16, y - 54], [x + 16, y - 54]], '#536878', 2);
        this.line([[x - 16, y - 50], [x, y - 77], [x + 16, y - 50]], '#90a3b48c');
        this.line([[x, y - 54], [x + (x < 100 ? 35 : -35), y + 20]], '#6d91a666');
      }
    } else if (row.chapter === 1) {
      this.obstacle(23, y, 'tree', 0.9);
      this.obstacle(457, y - 10, 'tree', 1.1);
    } else {
      this.building(16, y, row.index);
      this.building(466, y, row.index + 5, true);
    }
    if (row.index % 4 === 0 || row.index === 20 || row.index === 40) {
      const x = 47;
      this.line([[x, y + 8], [x, y - 46], [x + 13, y - 46]], '#7995a7', 2);
      this.ellipse(x + 13, y - 44, 4, 2, '#f7dfb0');
      const glow = c.createRadialGradient(x + 13, y - 41, 1, x + 13, y - 41, 27);
      glow.addColorStop(0, '#ffe0a927'); glow.addColorStop(1, '#ffe0a900');
      c.fillStyle = glow; c.fillRect(x - 16, y - 69, 58, 58);
      this.rect(18, y - 31, 40, 9, 1, '#25504e', '#70a39488');
      this.text(row.chapter === 0 ? `${42 + Math.floor(row.index / 4)} ST` : row.chapter === 1 ? 'BRYANT' : 'FDR DR', 38, y - 24, 5.5, '#d1e1d9', 'center');
    }
  }

  vehicle(x, y, car, direction = 1, alpha = 1, scale = 1, rotation = 0) {
    const c = this.ctx;
    const length = car.length * CELL * 0.96;
    const bus = car.kind === 'bus';
    const truck = car.kind === 'truck';
    const color = car.kind === 'taxi' ? '#efb54f' : bus ? '#93baca' : truck ? '#a398bc' : ['#b17083', '#659ba5', '#8c9aaa'][car.paint || 0];
    c.save(); c.translate(x, y); c.rotate(rotation); c.scale(scale * direction, scale); c.globalAlpha = alpha;
    this.ellipse(1, 8, length * 0.55, 11, '#07101b88');
    // Soft headlights, rather than large glow blurs, keep the traffic easy to read.
    c.beginPath(); c.moveTo(length / 2 - 2, -6); c.lineTo(length / 2 + 31, -13); c.lineTo(length / 2 + 31, 12); c.lineTo(length / 2 - 2, 4); c.fillStyle = '#fee8b607'; c.fill();
    for (const px of [-length * 0.29, length * 0.3]) {
      this.rect(px - 5, -14, 10, 27, 3, '#080f1b');
      this.rect(px - 2, 7, 4, 5, 1, '#778799');
    }
    this.rect(-length / 2, -13, length, 25, 5, color);
    this.rect(-length / 2, 3, length, 9, [0, 0, 4, 4], '#152b3d44');
    this.rect(-length / 2 + 3, -17, length - 6, 20, 4, color);
    this.line([[-length / 2 + 7, -17], [length / 2 - 8, -17]], '#ffffff55');
    if (truck) {
      this.rect(-length / 2 + 2, -21, length - 30, 24, 2, '#a5a1b7', '#c2c0d15c');
      for (let i = 0; i < 5; i++) this.line([[-length / 2 + 9 + i * 12, -19], [-length / 2 + 9 + i * 12, 0]], '#63698266');
      this.rect(length / 2 - 23, -14, 10, 13, 2, '#213c51');
    } else if (bus) {
      this.rect(-length / 2 + 13, -13, length - 26, 12, 2, '#264859');
      for (let i = 0; i < 5; i++) this.line([[-length / 2 + 22 + i * 13, -12], [-length / 2 + 22 + i * 13, 0]], '#99c9d3', 2);
      this.rect(-length / 2 + 3, 4, length - 6, 3, 0, '#407da6');
      this.rect(length / 2 - 16, -20, 11, 6, 1, '#e1c984');
    } else {
      this.rect(-length * 0.23, -17, length * 0.51, 19, 4, '#233e55');
      this.rect(-length * 0.15, -18, length * 0.26, 19, 2, color);
      this.line([[length * 0.23, -14], [length * 0.26, -6]], '#a3d2dcaa');
      if (car.kind === 'taxi') {
        this.rect(-5, -22, 12, 5, 1, '#fff2be');
        this.rect(-2, 4, 8, 4, 1, '#735b30');
      }
    }
    this.rect(length / 2 - 3, -8, 4, 5, 1, '#fff2ce');
    this.rect(length / 2 - 3, 3, 4, 4, 1, '#fff2ce');
    this.rect(-length / 2 - 1, 0, 3, 5, 1, '#fa8590');
    c.restore();
  }

  obstacle(x, y, kind, scale = 1) {
    const c = this.ctx;
    c.save(); c.translate(x, y); c.scale(scale, scale);
    this.ellipse(0, 7, 20, 8, '#081b2580');
    if (kind === 'tree') {
      this.rect(-3, -25, 6, 31, 1, '#7f7261');
      this.ellipse(-7, -31, 15, 19, '#294f48');
      this.ellipse(7, -38, 14, 20, '#356558');
      this.ellipse(-3, -47, 13, 14, '#477968');
      this.line([[-8, -46], [-2, -51], [5, -51]], '#95b89150');
    } else if (kind === 'cart') {
      this.rect(-17, -12, 34, 18, 2, '#768d9c', '#acc3c8');
      this.rect(-14, -16, 28, 5, 2, '#c4b792');
      this.line([[0, -14], [0, -40]], '#b4c1be', 2);
      c.beginPath(); c.moveTo(-24, -28); c.quadraticCurveTo(0, -57, 24, -28); c.closePath(); c.fillStyle = '#d29267'; c.fill();
      c.beginPath(); c.moveTo(-7, -28); c.quadraticCurveTo(0, -55, 7, -28); c.closePath(); c.fillStyle = '#ecd59b'; c.fill();
      this.ellipse(-12, 8, 3, 4, '#152333'); this.ellipse(12, 8, 3, 4, '#152333');
      this.text('NY', 0, -2, 6, '#edf0d5', 'center');
    } else {
      this.rect(-18, -10, 36, 20, 3, '#657d80', '#8a9e9b');
      this.ellipse(0, -9, 17, 7, '#4c6155');
      for (let i = 0; i < 5; i++) this.ellipse(-12 + i * 6, -16 - i % 2 * 4, 6, 10, i % 2 ? '#649876' : '#477d67');
    }
    c.restore();
  }

  crystal(x, y, time, taken = false) {
    if (taken) return;
    const c = this.ctx;
    const bob = this.reducedMotion ? 0 : Math.sin(time * 2.5 + x) * 3;
    this.ellipse(x, y + 6, 10, 4, '#92eafd1b');
    c.save(); c.translate(x, y - 10 + bob);
    c.beginPath(); c.moveTo(0, -10); c.lineTo(6, 0); c.lineTo(0, 10); c.lineTo(-6, 0); c.closePath();
    c.fillStyle = '#8adeef'; c.fill(); c.strokeStyle = '#d3f8ff'; c.stroke();
    this.line([[0, -10], [0, 10]], '#efffff');
    c.restore();
  }

  portal(x, y, time) {
    const c = this.ctx;
    c.save(); c.translate(x, y - 22);
    const gradient = c.createRadialGradient(0, 0, 3, 0, 0, 49);
    gradient.addColorStop(0, '#164f78'); gradient.addColorStop(0.7, '#76dcee66'); gradient.addColorStop(1, '#77dcf200');
    this.ellipse(0, 0, 43, 49, gradient);
    for (let n = 0; n < 3; n++) {
      c.beginPath(); c.ellipse(0, 0, 24 + n * 7, 33 + n * 5, Math.sin(time * 0.5) * 0.1, time * 0.3 + n * 2, time * 0.3 + n * 2 + 5);
      c.strokeStyle = ['#d2f6ff', '#89cfec88', '#badfff44'][n]; c.lineWidth = n ? 1 : 2; c.stroke();
    }
    this.text('TEMPEST', 0, -56, 9, '#d4f9ff', 'center');
    c.restore();
  }

  slime(x, y, model, time) {
    const c = this.ctx;
    const progress = model.move ? model.move.elapsed / CROSSING.hop : 0;
    const jump = this.reducedMotion ? 0 : Math.sin(progress * Math.PI);
    const idle = this.reducedMotion || model.phase !== 'ready' ? 0 : Math.sin(time * 2.2) * 0.025;
    this.ellipse(x, y + 6, 18 - jump * 3, 7 - jump, '#02152588');
    c.save(); c.translate(x, y - jump * 12 - 4);
    c.scale(1 - jump * 0.1 + idle, 1 + jump * 0.14 - idle);
    const gel = c.createRadialGradient(-8, -17, 1, 0, -9, 31);
    gel.addColorStop(0, '#c4f6ff'); gel.addColorStop(0.44, '#84d7f9'); gel.addColorStop(0.8, '#479bdb'); gel.addColorStop(1, '#3478b0');
    c.beginPath(); c.moveTo(-20, 1); c.bezierCurveTo(-22, -13, -11, -28, 0, -28); c.bezierCurveTo(14, -28, 24, -12, 20, 2); c.bezierCurveTo(17, 13, -17, 13, -20, 1);
    c.fillStyle = gel; c.fill(); c.strokeStyle = '#b0eafa'; c.lineWidth = 1.1; c.stroke();
    c.beginPath(); c.moveTo(-14, -13); c.quadraticCurveTo(-11, -21, -4, -22); c.strokeStyle = '#f3ffffa8'; c.lineWidth = 3.4; c.lineCap = 'round'; c.stroke();
    this.ellipse(10, 3, 5, 2, '#c9f6ff50');
    if (model.phase === 'over') {
      this.line([[-10, -7], [-5, -2], [-10, -2], [-5, -7]], '#23466c', 1.5);
      this.line([[5, -7], [10, -2], [5, -2], [10, -7]], '#23466c', 1.5);
    } else {
      this.line([[-11, -6], [-5, -4]], '#24476c', 1.8);
      this.line([[5, -4], [11, -6]], '#24476c', 1.8);
    }
    c.restore();
    if (model.skills.uriel.active > 0) {
      c.save(); c.translate(x, y - 12);
      const rotation = this.reducedMotion ? 0 : time * 0.23;
      for (let shell = 0; shell < 2; shell++) {
        const r = 32 + shell * 7;
        c.beginPath();
        for (let i = 0; i <= 6; i++) {
          const angle = i * Math.PI / 3 + rotation * (shell ? -1 : 1);
          const px = Math.cos(angle) * r, py = Math.sin(angle) * r;
          i ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.fillStyle = '#f9c9770b'; c.fill(); c.strokeStyle = shell ? '#ffd99a66' : '#ffdc9ecc'; c.lineWidth = 1.5; c.stroke();
      }
      c.restore();
    }
  }

  dragon(x, y, time, remaining) {
    const c = this.ctx;
    const flap = this.reducedMotion ? 0 : Math.sin(time * 4.2) * 12;
    c.save(); c.translate(x, y); c.globalAlpha = Math.min(1, remaining * 2) * 0.88;
    const glow = c.createRadialGradient(0, 6, 5, 0, 6, 110);
    glow.addColorStop(0, '#9be9c32b'); glow.addColorStop(1, '#9be9c300');
    this.ellipse(0, 6, 110, 90, glow);
    for (const side of [-1, 1]) {
      c.save(); c.scale(side, 1);
      c.beginPath(); c.moveTo(9, -8); c.bezierCurveTo(27, -32, 48, -33, 90, -52 + flap);
      c.lineTo(77, -10 + flap); c.quadraticCurveTo(55, -29, 53, 14 + flap * 0.6);
      c.quadraticCurveTo(37, -7, 29, 26); c.lineTo(9, 5); c.closePath(); c.fillStyle = '#203d44'; c.fill(); c.strokeStyle = '#6eae9f'; c.lineWidth = 1.4; c.stroke();
      this.line([[9, -8], [90, -52 + flap], [53, 14 + flap * 0.6]], '#95bc9977');
      this.line([[9, -8], [77, -10 + flap]], '#80b09966');
      c.restore();
    }
    c.beginPath(); c.moveTo(-7, 13); c.bezierCurveTo(-22, 35, 20, 48, 37, 30); c.bezierCurveTo(7, 69, -40, 29, -11, 4); c.fillStyle = '#31505a'; c.fill(); c.strokeStyle = '#7aa798'; c.stroke();
    this.ellipse(0, 1, 13, 25, '#355159');
    for (let i = 0; i < 5; i++) this.line([[-6, -8 + i * 6], [0, -5 + i * 6], [6, -8 + i * 6]], '#a0b99599', 1.5);
    c.beginPath(); c.moveTo(-10, -15); c.lineTo(-15, -31); c.lineTo(-9, -45); c.lineTo(0, -35); c.lineTo(9, -45); c.lineTo(15, -31); c.lineTo(10, -15); c.lineTo(0, -10); c.closePath(); c.fillStyle = '#466068'; c.fill(); c.strokeStyle = '#9db9a0'; c.stroke();
    this.line([[-10, -32], [-19, -51], [-12, -47]], '#d0c493', 3);
    this.line([[10, -32], [19, -51], [12, -47]], '#d0c493', 3);
    this.line([[-9, -26], [-3, -24]], '#c5ffd2', 2);
    this.line([[3, -24], [9, -26]], '#c5ffd2', 2);
    c.restore();
  }

  powerGround(model, time) {
    const c = this.ctx;
    const player = this.point(model.player.x, model.player.y);
    if (model.skills.veldora.active > 0) {
      const top = this.point(0, model.player.y + 4.4).y;
      const glow = c.createLinearGradient(0, top, 0, player.y + 20);
      glow.addColorStop(0, '#94efb503'); glow.addColorStop(0.7, '#94efb521'); glow.addColorStop(1, '#94efb507');
      c.fillStyle = glow; c.fillRect(LEFT - 5, top, 374, player.y - top + 20);
      for (let n = 0; n < 5; n++) {
        const x = LEFT + 24 + n * 75;
        const bend = this.reducedMotion ? 5 : Math.sin(time * 8 + n) * 8;
        this.line([[x, top], [x + bend - 13, top + 45], [x + bend + 7, top + 62], [x - 8, player.y - 10]], '#a8f3c538', 1.5);
      }
    }
    if (model.skills.beelzebub.active > 0) {
      const { dx, dy } = model.beelFacing;
      const end = this.point(model.player.x + dx * 2.35, model.player.y + dy * 2.35);
      c.save();
      c.beginPath();
      if (dy) { c.moveTo(player.x - 32, player.y + dy * 18); c.lineTo(end.x - 37, end.y); c.lineTo(end.x + 37, end.y); c.lineTo(player.x + 32, player.y + dy * 18); }
      else { c.moveTo(player.x - dx * 18, player.y - 27); c.lineTo(end.x, end.y - 27); c.lineTo(end.x, end.y + 27); c.lineTo(player.x - dx * 18, player.y + 27); }
      c.closePath(); c.fillStyle = '#bb92e919'; c.fill(); c.strokeStyle = '#cb9ffa55'; c.setLineDash([4, 6]); c.stroke(); c.restore();
    }
    if (model.skills.raphael.active > 0 && !model.move) {
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const prediction = model.forecast(dx, dy);
        if (prediction === 'blocked') continue;
        const p = this.point(model.player.col + dx, model.player.row + dy);
        const clear = prediction === 'clear';
        this.rect(p.x - 21, p.y - 18, 42, 36, 6, clear ? '#77e1dc1c' : '#fb969c1c', clear ? '#8ce6e27a' : '#fb969c88');
        this.text(clear ? '✓' : '!', p.x, p.y + 5, 13, clear ? '#b5f5ed' : '#ffb8bd', 'center');
      }
    }
  }

  drawEffects(model, dt) {
    const c = this.ctx;
    const player = this.point(model.player.x, model.player.y);
    this.effects = this.effects.filter(effect => effect.age < effect.life);
    for (const fx of this.effects) {
      fx.age += dt;
      const t = clamp(fx.age / fx.life, 0, 1);
      const p = this.point(fx.x ?? model.player.x, fx.y ?? model.player.y);
      if (['devour', 'storm', 'barrier'].includes(fx.type)) {
        const devour = fx.type === 'devour';
        const x = devour ? lerp(p.x, player.x, t * t) + Math.sin(t * 7) * 14 * t : p.x + (p.x > player.x ? 1 : -1) * t * 55;
        const y = devour ? lerp(p.y, player.y - 12, t) : p.y - t * (fx.type === 'storm' ? 80 : 20);
        if (['bus', 'car', 'truck', 'taxi'].includes(fx.kind)) this.vehicle(x, y, fx, fx.direction, 1 - t, 1 - t * 0.8, t * (devour ? 2.3 : 0.3));
        else {
          c.save(); c.globalAlpha = 1 - t; this.obstacle(x, y, fx.kind, 1 - t * 0.8); c.restore();
        }
      } else if (fx.type === 'land') {
        c.save(); c.globalAlpha = (1 - t) * 0.4;
        c.beginPath(); c.ellipse(p.x, p.y + 5, 12 + t * 19, 4 + t * 7, 0, 0, Math.PI * 2); c.strokeStyle = '#a4eaf9'; c.stroke(); c.restore();
      } else {
        const color = fx.type === 'cast' ? SKILLS[fx.key].color : fx.type === 'crash' ? '#a4dcf8' : '#b4f6ed';
        const count = fx.type === 'crash' || fx.type === 'win' ? 24 : 10;
        c.save(); c.globalAlpha = 1 - t;
        for (let i = 0; i < count; i++) {
          const angle = i / count * Math.PI * 2;
          const radius = (fx.type === 'win' ? 180 : 45) * t;
          const x = p.x + Math.cos(angle) * radius;
          const y = p.y - 10 + Math.sin(angle) * radius * 0.7 - t * 20;
          this.ellipse(x, y, 2 * (1 - t) + 0.5, 2 * (1 - t) + 0.5, color);
        }
        c.restore();
      }
    }
  }

  draw(model, { alpha = 1, dt = 0, reducedMotion = false } = {}) {
    if (!this.scale) this.resize();
    if (!this.scale) return;
    const c = this.ctx;
    this.reducedMotion = reducedMotion;
    this.time += dt;
    const time = reducedMotion ? 0 : this.time;
    const px = lerp(model.player.prevX, model.player.x, alpha);
    const py = lerp(model.player.prevY, model.player.y, alpha);
    const targetCamera = Math.max(0, py - 0.3);
    this.camera = reducedMotion || !dt ? targetCamera : lerp(this.camera, targetCamera, 1 - Math.exp(-dt * 13));
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.lineWidth = 1;
    c.fillStyle = '#112536'; c.fillRect(0, 0, this.width, this.height);
    // The arrival plaza continues below the first playable sidewalk.
    for (let row = -4; row < 0; row++) {
      const y = this.point(0, row).y;
      if (y < this.height + ROW) this.road({ type: 'pavement', index: row }, y);
    }
    const visible = model.rows.filter(row => { const y = this.point(0, row.index).y; return y > -90 && y < this.height + 100; });
    for (const row of visible) this.road(row, this.point(0, row.index).y);
    if (model.player.y > 39) {
      for (const x of [0, 436]) {
        c.fillStyle = '#214258'; c.fillRect(x, 0, 44, this.height);
        for (let n = 0; n < 18; n++) this.line([[x + 3, n * 36 + Math.sin(time + n) * 4], [x + 28, n * 36 + Math.sin(time + n) * 4]], '#78a1af1f');
      }
    }
    this.powerGround(model, time);
    // Painter's order keeps the slime and cars correctly in front of earlier lanes.
    const objects = [];
    for (const row of visible) {
      objects.push({ y: row.index, order: -2, draw: () => this.scenery(row, this.point(0, row.index).y) });
      if (row.index === 60) objects.push({ y: 60, order: -1, draw: () => { const p = this.point(3, 60); this.portal(p.x, p.y, time); } });
      if (row.pickup && !row.pickup.taken) objects.push({ y: row.index, order: -1, draw: () => { const p = this.point(row.pickup.col, row.index); this.crystal(p.x, p.y, time); } });
      for (const obstacle of row.obstacles) if (!obstacle.removed) objects.push({ y: row.index, order: 0, draw: () => { const p = this.point(obstacle.col, row.index); this.obstacle(p.x, p.y, obstacle.kind); } });
      for (const car of row.cars) {
        if (car.removed || car.x < -2 || car.x > 8) continue;
        objects.push({ y: row.index, order: 0, draw: () => {
          const p = this.point(lerp(car.prevX, car.x, alpha), row.index);
          if (model.skills.raphael.active > 0) {
            const future = this.point(car.x + row.speed * 0.45 * 0.3, row.index);
            c.save(); c.setLineDash([3, 4]);
            this.rect(future.x - car.length * CELL / 2, future.y - 14, car.length * CELL, 26, 4, '#80deee0a', '#9feeff88'); c.restore();
            this.line([[p.x, p.y], [future.x, future.y]], '#b1effe88');
          }
          this.vehicle(p.x, p.y, car, row.direction);
        } });
      }
    }
    objects.push({ y: py - 0.1, order: 1, draw: () => {
      const p = this.point(px, py);
      if (model.phase !== 'over' && model.phase !== 'won') {
        const facing = model.player.facing;
        const a = this.point(px + facing.dx * 0.55, py + facing.dy * 0.58);
        const rotation = facing.dx ? Math.PI / 2 * facing.dx : facing.dy < 0 ? Math.PI : 0;
        c.save(); c.translate(a.x, a.y); c.rotate(rotation);
        this.line([[-4, 2], [0, -3], [4, 2]], '#ceeffcab', 1.5); c.restore();
      }
      this.slime(p.x, p.y, model, time);
    } });
    objects.sort((a, b) => b.y - a.y || a.order - b.order);
    for (const object of objects) object.draw();
    this.drawEffects(model, dt);
    const player = this.point(px, py);
    if (model.skills.beelzebub.active > 0) {
      const facing = model.beelFacing;
      const vortex = this.point(px + facing.dx * 0.37, py + facing.dy * 0.37);
      this.ellipse(vortex.x, vortex.y - 8, 14, 12, '#130e27ef');
      for (let n = 0; n < 3; n++) {
        c.beginPath(); c.ellipse(vortex.x, vortex.y - 8, 15 + n * 3, 12 + n * 3, time * 2, n * 2 + time * 6, n * 2 + time * 6 + 2.3);
        c.strokeStyle = ['#e1caff', '#b493df', '#9267bc88'][n]; c.lineWidth = 1.5; c.stroke();
      }
    }
    if (model.skills.veldora.active > 0) this.dragon(player.x, Math.max(65, player.y - 155), time, model.skills.veldora.active);
    const shade = c.createLinearGradient(0, 0, 0, this.height);
    shade.addColorStop(0, '#0716286b'); shade.addColorStop(0.2, '#091b2800'); shade.addColorStop(0.87, '#091b2800'); shade.addColorStop(1, '#07162699');
    c.fillStyle = shade; c.fillRect(0, 0, this.width, this.height);
    if (!reducedMotion && model.phase !== 'paused') {
      for (let n = 0; n < 24; n++) {
        const x = noise(n + 100) * 480;
        const y = (noise(n + 20) * this.height + time * 30) % (this.height + 20) - 10;
        this.line([[x, y], [x - 1, y + 6]], '#b0d4df0c');
      }
    }
    c.lineWidth = 1;
  }
}
