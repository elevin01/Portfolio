// Simulation only: time is in seconds, distance in tiles. No DOM or animation clocks.
export const CROSSING = Object.freeze({ columns: 7, finish: 60, hop: 0.18, step: 1 / 120, radius: 0.23 });

export const SKILLS = Object.freeze({
  beelzebub: { name: 'Beelzebub', title: 'Lord of Gluttony', cost: 20, duration: 1.25, cooldown: 4, color: '#c6a1ff', action: 'Devour ahead', key: '1' },
  veldora: { name: 'Storm Dragon', title: 'Veldora · Summon', cost: 55, duration: 3, cooldown: 16, color: '#a4efba', action: 'Clear a corridor', key: '2' },
  raphael: { name: 'Raphael', title: 'Lord of Wisdom', cost: 24, duration: 4.5, cooldown: 10, color: '#7ee6f5', action: 'Accelerate thought', key: '3' },
  uriel: { name: 'Uriel', title: 'Lord of Vows', cost: 28, duration: 2.8, cooldown: 9, color: '#ffcf83', action: 'Raise a barrier', key: '4' }
});

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let n = Math.imul(value ^ value >>> 15, 1 | value);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

export function district(row) {
  return row < 20 ? 'Midtown' : row < 40 ? 'Bryant Park' : 'East River';
}

// Relative swept collision catches a car crossing the slime between physics ticks.
function sweptHit(ax, ay, bx, by, halfWidth, halfHeight) {
  let enter = 0;
  let leave = 1;
  for (const [a, b, half] of [[ax, bx, halfWidth], [ay, by, halfHeight]]) {
    const delta = b - a;
    if (Math.abs(delta) < 1e-9) {
      if (Math.abs(a) > half) return false;
    } else {
      let t0 = (-half - a) / delta;
      let t1 = (half - a) / delta;
      if (t0 > t1) [t0, t1] = [t1, t0];
      enter = Math.max(enter, t0);
      leave = Math.min(leave, t1);
      if (enter > leave) return false;
    }
  }
  return true;
}

function makeRoute(seed) {
  const random = seededRandom(seed);
  return Array.from({ length: CROSSING.finish + 1 }, (_, index) => {
    const chapter = Math.min(2, Math.floor(index / 20));
    const local = index % 20;
    const safe = index === 60 || local < 2 || (chapter === 0 ? local % 4 === 0 : local % 5 === 0);
    const row = { index, type: safe ? (chapter === 1 ? 'park' : 'pavement') : 'road', chapter, obstacles: [], cars: [], pickup: null };
    if (safe) {
      if (local > 1 && index < 60) {
        const columns = [0, 1, 2, 3, 4, 5, 6];
        for (let n = 0; n < 2; n++) {
          const slot = Math.floor(random() * columns.length);
          row.obstacles.push({ col: columns.splice(slot, 1)[0], kind: chapter === 1 ? 'tree' : (n ? 'planter' : 'cart'), removed: false });
        }
      }
      if (index > 0 && index < 60) {
        const free = Array.from({ length: 7 }, (_, i) => i).filter(col => !row.obstacles.some(obstacle => obstacle.col === col));
        row.pickup = { col: index === 1 ? 3 : free[Math.floor(random() * free.length)], taken: false };
      }
    } else {
      row.direction = index % 2 ? -1 : 1;
      row.speed = (1.05 + chapter * 0.36 + random() * 0.6) * row.direction;
      row.cycle = 20;
      const offset = random() * 5;
      for (let n = 0; n < 4; n++) {
        const kind = random() < 0.22 ? (chapter === 2 ? 'truck' : 'bus') : random() < 0.58 ? 'taxi' : 'car';
        const length = kind === 'bus' ? 2.05 : kind === 'truck' ? 2.3 : 1.22;
        const x = n * 5 + offset - 7;
        row.cars.push({ id: `${index}-${n}`, x, prevX: x, length, kind, paint: Math.floor(random() * 3), removed: false });
      }
    }
    return row;
  });
}

export class CrossingModel {
  constructor(seed = Date.now()) { this.reset(seed); }

  reset(seed = this.seed) {
    this.seed = seed >>> 0;
    this.rows = makeRoute(this.seed);
    this.phase = 'ready';
    this.player = { x: 3, y: 0, prevX: 3, prevY: 0, col: 3, row: 0, facing: { dx: 0, dy: 1 } };
    this.move = null;
    this.queued = null;
    this.furthest = 0;
    this.energy = 100;
    this.elapsed = 0;
    this.worldTime = 0;
    this.skills = Object.fromEntries(Object.keys(SKILLS).map(key => [key, { active: 0, cooldown: 0 }]));
    this.beelFacing = { dx: 0, dy: 1 };
    this.stats = { devoured: 0, cleared: 0, blocked: 0, collected: 0, casts: 0 };
    this.events = [];
  }

  emit(type, detail = {}) { this.events.push({ type, ...detail }); }
  drainEvents() { return this.events.splice(0); }
  begin() { if (this.phase === 'ready') { this.phase = 'playing'; this.emit('begin'); } }
  pause() { if (this.phase === 'playing') { this.phase = 'paused'; this.queued = null; } }
  resume() { if (this.phase === 'paused') this.phase = 'playing'; }

  obstacleAt(col, row) { return this.rows[row]?.obstacles.find(item => item.col === col && !item.removed); }

  hop(dx, dy) {
    if (this.phase !== 'playing' || !Number.isInteger(dx) || !Number.isInteger(dy) || Math.abs(dx) + Math.abs(dy) !== 1) return false;
    if (this.move) { this.queued = { dx, dy }; return true; }
    this.player.facing = { dx, dy };
    const col = this.player.col + dx;
    const row = this.player.row + dy;
    if (col < 0 || col >= CROSSING.columns || row < 0 || row > CROSSING.finish || this.obstacleAt(col, row)) {
      this.emit('bump', { col, row });
      return false;
    }
    this.move = { fromX: this.player.x, fromY: this.player.y, col, row, elapsed: 0 };
    this.emit('hop');
    return true;
  }

  availability(key) {
    if (!SKILLS[key]) return 'Unknown skill';
    if (this.phase !== 'playing') return 'Start or resume your crossing';
    if (this.skills[key].cooldown > 0) return `Recharging · ${Math.ceil(this.skills[key].cooldown)}s`;
    if (this.energy < SKILLS[key].cost) return `Needs ${SKILLS[key].cost} magicules`;
    return '';
  }

  cast(key) {
    const reason = this.availability(key);
    if (reason) { this.emit('unavailable', { key, reason }); return false; }
    const skill = SKILLS[key];
    this.energy -= skill.cost;
    this.skills[key] = { active: skill.duration, cooldown: skill.cooldown };
    if (key === 'beelzebub') this.beelFacing = { ...this.player.facing };
    this.stats.casts++;
    this.emit('cast', { key, x: this.player.x, y: this.player.y });
    // Emergency casts take effect on the input frame, before another collision tick.
    this.applyPowers();
    return true;
  }

  inDevour(x, y, halfWidth = 0) {
    const dx = x - this.player.x;
    const dy = y - this.player.y;
    const facing = this.beelFacing;
    if (facing.dy) return Math.abs(dx) <= 0.7 + halfWidth && dy * facing.dy >= -0.5 && dy * facing.dy <= 2.35;
    return Math.abs(dy) <= 0.6 && dx * facing.dx + halfWidth >= -0.5 && dx * facing.dx - halfWidth <= 2.35;
  }

  removeCar(row, car, effect) {
    car.removed = true;
    this.stats[effect === 'devour' ? 'devoured' : effect === 'barrier' ? 'blocked' : 'cleared']++;
    this.emit(effect, { x: car.x, y: row.index, length: car.length, kind: car.kind, paint: car.paint, direction: row.direction });
  }

  applyPowers() {
    const beel = this.skills.beelzebub.active > 0;
    const storm = this.skills.veldora.active > 0;
    if (!beel && !storm) return;
    for (const row of this.rows) {
      if (Math.abs(row.index - this.player.y) > 4.5) continue;
      const inStorm = storm && row.index >= this.player.y - 0.55 && row.index <= this.player.y + 4.1;
      for (const car of row.cars) {
        if (car.removed || car.x < -2 || car.x > 8) continue;
        if (beel && this.inDevour(car.x, row.index, car.length / 2)) this.removeCar(row, car, 'devour');
        else if (inStorm) this.removeCar(row, car, 'storm');
      }
      for (const obstacle of row.obstacles) {
        if (obstacle.removed) continue;
        const devour = beel && this.inDevour(obstacle.col, row.index, 0.35);
        if (devour || inStorm) {
          obstacle.removed = true;
          this.stats[devour ? 'devoured' : 'cleared']++;
          this.emit(devour ? 'devour' : 'storm', { x: obstacle.col, y: row.index, kind: obstacle.kind, length: 0.7 });
        }
      }
    }
  }

  arrive() {
    const { col, row } = this.move;
    this.player.col = col;
    this.player.row = row;
    this.player.x = col;
    this.player.y = row;
    this.move = null;
    if (row > this.furthest) {
      this.energy = Math.min(100, this.energy + (row - this.furthest) * 1.5);
      this.furthest = row;
      if (row === 20 || row === 40) {
        this.energy = Math.min(100, this.energy + 15);
        this.emit('district', { name: district(row) });
      }
    }
    const pickup = this.rows[row].pickup;
    if (pickup && !pickup.taken && pickup.col === col) {
      pickup.taken = true;
      this.energy = Math.min(100, this.energy + 8);
      this.stats.collected++;
      this.emit('pickup', { x: col, y: row });
    }
    this.emit('land', { x: col, y: row });
    if (row === CROSSING.finish && col === 3) {
      this.phase = 'won';
      this.queued = null;
      this.emit('win');
      return;
    }
    if (this.queued) {
      const { dx, dy } = this.queued;
      this.queued = null;
      this.hop(dx, dy);
    }
  }

  step(dt = CROSSING.step) {
    if (this.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.05);
    const worldDt = dt * (this.skills.raphael.active > 0 ? 0.3 : 1);
    this.elapsed += dt;
    this.worldTime += worldDt;
    const player = this.player;
    player.prevX = player.x;
    player.prevY = player.y;
    if (this.move) {
      this.move.elapsed = Math.min(CROSSING.hop, this.move.elapsed + dt);
      const t = this.move.elapsed / CROSSING.hop;
      player.x = this.move.fromX + (this.move.col - this.move.fromX) * t;
      player.y = this.move.fromY + (this.move.row - this.move.fromY) * t;
    }
    for (const row of this.rows) {
      for (const car of row.cars) {
        car.prevX = car.x;
        car.x += row.speed * worldDt;
        if (car.x > 13 || car.x < -7) {
          car.x += car.x > 13 ? -row.cycle : row.cycle;
          car.prevX = car.x;
          car.removed = false;
        }
      }
    }
    this.applyPowers();
    for (const row of this.rows) {
      if (Math.abs(row.index - player.y) > 1.6) continue;
      for (const car of row.cars) {
        if (car.removed) continue;
        const hit = sweptHit(player.prevX - car.prevX, player.prevY - row.index,
          player.x - car.x, player.y - row.index, car.length / 2 + CROSSING.radius, 0.28 + CROSSING.radius);
        if (!hit) continue;
        if (this.skills.uriel.active > 0) this.removeCar(row, car, 'barrier');
        else {
          this.phase = 'over';
          this.queued = null;
          this.emit('crash', { x: player.x, y: player.y, kind: car.kind });
          return;
        }
      }
    }
    if (this.move?.elapsed >= CROSSING.hop) this.arrive();
    for (const state of Object.values(this.skills)) {
      state.active = Math.max(0, state.active - dt);
      state.cooldown = Math.max(0, state.cooldown - dt);
    }
  }

  // A landing-window forecast, not an invulnerability promise or automatic movement.
  forecast(dx, dy) {
    if (this.move) return 'busy';
    const col = this.player.col + dx;
    const target = this.player.row + dy;
    if (col < 0 || col > 6 || target < 0 || target > 60 || this.obstacleAt(col, target)) return 'blocked';
    const speedScale = this.skills.raphael.active > 0 ? 0.3 : 1;
    for (const row of this.rows) {
      if (Math.abs(row.index - this.player.row) > 2) continue;
      for (const car of row.cars) {
        if (car.removed) continue;
        if (sweptHit(this.player.x - car.x, this.player.y - row.index,
          col - car.x - row.speed * CROSSING.hop * speedScale, target - row.index,
          car.length / 2 + CROSSING.radius + 0.06, 0.28 + CROSSING.radius + 0.03)) return 'danger';
      }
    }
    return 'clear';
  }
}
