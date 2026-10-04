// Renderer-independent rules. Distances are metres; clocks are seconds.
export const HUNTER = Object.freeze({ step: 1 / 120, jump: 0.96, slide: 0.86, laneTime: 0.15, view: 170 });
export const COURSES = Object.freeze({
  exam: { name: 'Hunter Exam', subtitle: 'The long way to the starting line.', places: ['Underground marathon', 'The endless staircase', 'Numere Wetlands'], color: '#bdd499' },
  yorknew: { name: 'Yorknew City', subtitle: 'A different kind of night life.', places: ['Auction district', 'Above the city', 'Backstreet pursuit'], color: '#e8b47f' },
  greed: { name: 'Greed Island', subtitle: 'The road to Masadora.', places: ['Open country', 'Training grounds', 'Masadora outskirts'], color: '#a9d5bd' }
});
export const DIFFICULTIES = Object.freeze({
  rookie: { name: 'Rookie', speed: 10.5, finish: 2800, spacing: 30, recovery: 4, charge: 30, damage: 3 },
  hunter: { name: 'Hunter', speed: 13, finish: 4000, spacing: 26, recovery: 2.8, charge: 23, damage: 2 },
  veteran: { name: 'Veteran', speed: 15.5, finish: 4800, spacing: 23, recovery: 1.8, charge: 17, damage: 2 }
});
export const CHARACTERS = Object.freeze({
  killua: { name: 'Killua', family: 'Zoldyck', color: '#b4d9ff', role: 'Precision / electricity', note: 'Short bursts. Fast decisions.', era: 'Chimera Ant arc', skill: 'godspeed', ability: 'Godspeed', cost: 16, cooldown: 18 },
  gon: { name: 'Gon', family: 'Freecss', color: '#c0df88', role: 'Commitment / power', note: 'Read the opening. Commit to it.', era: 'Greed Island training', skill: 'jajanken', ability: 'Jajanken', cost: 34, cooldown: 11 },
  kurapika: { name: 'Kurapika', family: 'Kurta', color: '#edc779', role: 'Defense / recovery', note: 'A steady hand. A measured response.', era: 'Yorknew arc', skill: 'chain', ability: 'Dowsing Chain', cost: 27, cooldown: 12 },
  hisoka: { name: 'Hisoka', family: 'Morow', color: '#e9a4ce', role: 'Elasticity / timing', note: 'Make the course work for you.', era: 'Heavens Arena / Yorknew', skill: 'gum', ability: 'Bungee Gum', cost: 28, cooldown: 10 }
});
const own = (object, key, fallback) => Object.hasOwn(object, key) ? key : fallback;
export function options(value = {}) {
  if (!value || typeof value !== 'object') value = {};
  return { character: own(CHARACTERS, value.character, 'killua'), course: own(COURSES, value.course, 'exam'),
    difficulty: own(DIFFICULTIES, value.difficulty, 'hunter'), mode: value.mode === 'endless' ? 'endless' : 'trial' };
}
export function loadout(value) {
  const o = options(value), base = { ...CHARACTERS[o.character], nen: true };
  if (o.mode === 'endless') return base;
  if (o.course === 'exam' && o.character !== 'hisoka') {
    const early = { killua: ['board', 'Skateboard', 20, 13], gon: ['rod', 'Fishing rod', 18, 9], kurapika: ['blades', 'Twin blades', 25, 10] }[o.character];
    return { ...base, nen: false, era: 'Hunter Exam · before Nen training', skill: early[0], ability: early[1], cost: early[2], cooldown: early[3] };
  }
  if (o.character === 'killua') return { ...base, era: o.course === 'greed' ? 'Greed Island arc' : 'Yorknew arc',
    skill: o.course === 'greed' ? 'palm' : 'echo', ability: o.course === 'greed' ? 'Lightning Palm' : 'Rhythm Echo', cost: 25, cooldown: 13 };
  if (o.character === 'gon' && o.course === 'yorknew') return { ...base, era: 'Yorknew · before Jajanken', skill: 'rod', ability: 'Fishing rod', cost: 18, cooldown: 9 };
  return base;
}
export function random(seed) {
  let n = seed >>> 0;
  return () => { n += 0x6d2b79f5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function chapter(distance, config) {
  const o = options(config), length = DIFFICULTIES[o.difficulty].finish;
  return o.mode === 'endless' ? Math.floor(distance / 650) % 3 : Math.min(2, Math.floor(distance / (length / 3)));
}
export const recordKey = config => { const o = options(config); return `${o.character}/${o.course}/${o.difficulty}/${o.mode}`; };
export const HUNTER_STORAGE = 'portfolio.hunter-run.v1';
export function loadRecords(read) {
  let saved; try { saved = JSON.parse(read(HUNTER_STORAGE)); } catch { /* No storage is also playable. */ }
  const record = { selection: options(saved?.selection), sound: saved?.sound === true, scores: {} };
  for (const [key, value] of Object.entries(saved?.scores || {})) {
    const [character, course, difficulty, mode] = key.split('/');
    if (recordKey({ character, course, difficulty, mode }) !== key || !value || typeof value !== 'object') continue;
    record.scores[key] = { distance: Number.isFinite(value.distance) && value.distance >= 0 ? value.distance : 0,
      score: Number.isFinite(value.score) && value.score >= 0 ? value.score : 0,
      time: Number.isFinite(value.time) && value.time > 0 ? value.time : 0 };
  }
  return record;
}
export function remember(record, game) {
  const key = recordKey(game.config), previous = record.scores[key] || { distance: 0, score: 0, time: 0 };
  record.scores[key] = { distance: Math.max(previous.distance, Math.floor(game.distance)), score: Math.max(previous.score, game.score),
    time: game.phase === 'won' && (!previous.time || game.elapsed < previous.time) ? game.elapsed : previous.time };
}

export class HunterModel {
  constructor(seed = Date.now(), config) { this.reset(seed, config); }
  reset(seed = this.seed, config = this.config) {
    this.seed = seed >>> 0; this.config = options(config); this.kit = loadout(this.config);
    this.rules = DIFFICULTIES[this.config.difficulty]; this.finish = this.config.mode === 'trial' ? this.rules.finish : Infinity;
    this.phase = 'ready'; this.distance = 0; this.previousDistance = 0; this.elapsed = 0; this.score = 0; this.seals = 0;
    this.x = 0; this.previousX = 0; this.lane = 0; this.y = 0; this.previousY = 0;
    this.jump = 0; this.slide = 0; this.stumble = 0; this.grace = 0; this.strikes = 0; this.clean = 0;
    this.aura = 100; this.electric = 100; this.state = 'ten'; this.gyo = 0; this.gyoWait = 0;
    this.power = 0; this.powerWait = 0; this.healWait = 0; this.windup = 0; this.form = 'Rock'; this.lockedForm = null;
    this.gumTarget = null; this.usedEvade = false; this.reason = ''; this.events = []; this.casts = 0; this.turns = 0;
    this.obstacles = []; this.pickups = []; this.anchors = []; this.nextWave = 0; this.nextZ = 55;
    this.lastChapter = 0; this.generate();
  }
  emit(type, detail = {}) { this.events.push({ type, ...detail }); }
  drainEvents() { return this.events.splice(0); }
  begin() { if (this.phase === 'ready') { this.phase = 'playing'; this.emit('begin'); } }
  pause() { if (this.phase === 'playing') this.phase = 'paused'; }
  resume() { if (this.phase === 'paused') this.phase = 'playing'; }
  fail(reason) { this.phase = 'over'; this.reason = reason; this.emit('over', { reason }); }
  nextTurn() { return this.obstacles.find(h => h.kind === 'turn' && !h.done && h.z >= this.distance - 1 && h.z - this.distance < 60); }
  move(direction) {
    if (this.phase !== 'playing' || ![-1, 1].includes(direction)) return false;
    if (this.windup > 0) { this.emit('notice', { text: 'Jajanken is charging. Commit to your opening.' }); return false; }
    const turn = this.nextTurn();
    if (turn && turn.z - this.distance < 35) { turn.choice = direction; this.emit('turnAim', { direction }); }
    this.lane = Math.max(-1, Math.min(1, this.lane + direction)); return true;
  }
  leap() {
    if (this.phase !== 'playing' || this.jump > 0 || this.windup > 0 || this.gumTarget) return false;
    this.slide = 0; this.jump = HUNTER.jump; this.emit('jump'); return true;
  }
  duck() {
    if (this.phase !== 'playing' || this.windup > 0 || this.gumTarget) return false;
    this.jump = 0; this.slide = HUNTER.slide; this.emit('slide'); return true;
  }
  availability(key) {
    if (this.phase !== 'playing') return 'Start or resume the run';
    if (key === 'gyo' || key === 'zetsu') {
      if (!this.kit.nen) return 'This version has not learned Nen yet';
      if (key === 'zetsu') return this.power > 0 || this.windup > 0 ? 'Finish your technique first' : '';
      if (this.gyoWait > 0) return `Gyo · ${Math.ceil(this.gyoWait)}s`;
      return this.aura < 14 ? 'Gyo needs 14 aura' : '';
    }
    if (key === 'extra') {
      if (this.kit.skill === 'jajanken') return this.windup > 0 ? 'Finish charging first' : '';
      if (this.config.character !== 'kurapika' || !this.kit.nen) return 'No secondary technique in this loadout';
      if (!this.strikes) return 'No injury to heal';
      if (this.healWait > 0) return `Holy Chain · ${Math.ceil(this.healWait)}s`;
      return this.aura < 36 ? 'Holy Chain needs 36 aura' : '';
    }
    if (key !== 'power') return 'Unknown technique';
    if (this.powerWait > 0) return `${Math.ceil(this.powerWait)}s recovery`;
    if (this.aura < this.kit.cost) return `Needs ${this.kit.cost} ${this.kit.nen ? 'aura' : 'stamina'}`;
    if (['godspeed', 'palm'].includes(this.kit.skill) && this.electric < (this.kit.skill === 'godspeed' ? 65 : 35)) return 'Find an electrical supply';
    if (this.kit.skill === 'gum' && !this.findAnchor()) return 'An anchor must be 12–45m ahead';
    if (this.kit.skill === 'rod' && !this.pickups.some(p => !p.taken && p.z > this.distance && p.z < this.distance + 32)) return 'A route marker must be within 32m';
    return '';
  }
  findAnchor() { return this.anchors.find(a => !a.used && a.z - this.distance > 12 && a.z - this.distance < 45); }
  cast(key) {
    const reason = this.availability(key);
    if (reason) { this.emit('notice', { text: reason }); return false; }
    if (key === 'zetsu') {
      this.state = this.state === 'zetsu' ? 'ten' : 'zetsu'; this.gyo = 0;
      this.emit('state', { state: this.state }); return true;
    }
    this.state = 'ten';
    if (key === 'gyo') { this.aura -= 14; this.gyo = 4.5; this.gyoWait = 9; this.emit('gyo'); return true; }
    if (key === 'extra') {
      if (this.kit.skill === 'jajanken') { this.form = { Rock: 'Scissors', Scissors: 'Paper', Paper: 'Rock' }[this.form]; this.emit('form', { form: this.form }); }
      else { this.aura -= 36; this.strikes--; this.healWait = 26; this.grace = 1; this.emit('heal'); this.casts++; }
      return true;
    }
    this.aura -= this.kit.cost; this.powerWait = this.kit.cooldown; this.casts++; this.usedEvade = false;
    const skill = this.kit.skill;
    if (skill === 'godspeed') { this.electric -= 65; this.power = 3.5; }
    else if (skill === 'palm') { this.electric -= 35; this.power = 1.1; this.clearAhead(6, ['projectile']); }
    else if (skill === 'jajanken') { this.windup = 0.85; this.lockedForm = this.form; this.slide = 0; }
    else if (skill === 'gum') {
      this.gumTarget = this.findAnchor(); this.gumTarget.used = true;
      this.gumTarget.start = this.distance; this.gumTarget.startY = this.y;
      this.lane = this.gumTarget.lane; this.power = (this.gumTarget.z - this.distance) / this.speed() + 0.1;
    }
    else if (skill === 'rod') {
      const marker = this.pickups.find(p => !p.taken && p.z > this.distance && p.z < this.distance + 32);
      this.collect(marker); this.power = 0.65;
    } else if (skill === 'blades') { this.power = 0.6; this.clearAhead(12); }
    else this.power = skill === 'board' ? 3.5 : 2.5;
    this.emit('cast', { skill }); return true;
  }
  clearAhead(reach, kinds = ['hurdle', 'wire', 'projectile']) {
    for (const hazard of this.obstacles) {
      if (hazard.done || hazard.z < this.distance - 1 || hazard.z > this.distance + reach || Math.abs(hazard.lane - this.x) > 0.6) continue;
      if (!kinds.includes(hazard.kind)) continue;
      hazard.done = true; hazard.cleared = true; this.emit('break', { hazard: { ...hazard } });
    }
  }
  collect(pickup) {
    if (!pickup || pickup.taken) return;
    pickup.taken = true;
    if (pickup.kind === 'electric') this.electric = Math.min(100, this.electric + this.rules.charge);
    else { this.seals++; this.score += 100; }
    this.emit('collect', { kind: pickup.kind, lane: pickup.lane });
  }
  speed() {
    const base = this.rules.speed + Math.min(3.5, this.distance / 1600);
    return base * (this.stumble > 0 ? 0.72 : 1) * (this.windup > 0 ? 0.55 : 1) * (this.power > 0 && ['godspeed', 'board'].includes(this.kit.skill) ? 1.35 : this.gumTarget ? 1.4 : 1);
  }
  generate() {
    while (this.nextZ < this.distance + HUNTER.view + 40 && this.nextZ < this.finish - 35) {
      const n = this.nextWave++, z = this.nextZ, r = random(this.seed ^ Math.imul(n + 1, 2654435761));
      const ch = chapter(z, this.config), pressure = Math.min(1, z / 2200);
      const spacing = this.rules.spacing - pressure * 4;
      const turn = n > 0 && n % 18 === 0;
      const rest = n % 18 === 17 || n % 18 === 1 || n % 9 === 8;
      const open = Math.floor(r() * 3) - 1;
      if (turn) {
        this.obstacles.push({ id: `${n}-turn`, z, lane: 0, kind: 'turn', side: r() < 0.5 ? -1 : 1, choice: 0, done: false });
      } else if (!rest && n > 4 && n % 14 === 6) {
        // A legible full-width rhythm beat requires jumping or sliding. These
        // never mix incompatible actions, and normal wave spacing leaves time
        // to recover. Other waves retain an unobstructed lane.
        const kind = ['hurdle', 'beam', 'gap'][Math.floor(n / 14) % 3];
        for (const lane of [-1, 0, 1]) this.obstacles.push({ id: `${n}-${lane}`, z, lane, kind, done: false, locked: null });
      } else if (!rest) {
        const lanes = [-1, 0, 1].filter(lane => lane !== open);
        const count = n < 3 || r() > 0.5 + pressure * 0.35 ? 1 : 2;
        for (const lane of lanes.slice(0, count)) {
          const kinds = ['hurdle', 'beam', 'wall', 'gap'];
          if (n > 5 && this.config.course !== 'exam') kinds.push('projectile', 'wire');
          const kind = kinds[Math.floor(r() * kinds.length)];
          this.obstacles.push({ id: `${n}-${lane}`, z, lane, kind, done: false, locked: null });
        }
      }
      if (!turn) {
        const lane = n < 2 ? 0 : Math.floor(r() * 3) - 1;
        this.pickups.push({ id: `${n}-seal`, z: z + spacing * 0.48, lane, kind: 'seal', taken: false });
        if (n % 10 === 7 && ['godspeed', 'palm'].includes(this.kit.skill)) this.pickups.push({ id: `${n}-charge`, z: z + spacing * 0.65, lane: open, kind: 'electric', taken: false });
        if (n % 3 === 2) this.anchors.push({ id: `${n}-anchor`, z: z + 8, lane: open, used: false });
      }
      this.nextZ += turn || rest ? spacing * 1.45 : spacing;
    }
    this.obstacles = this.obstacles.filter(h => h.z > this.distance - 18);
    this.pickups = this.pickups.filter(p => p.z > this.distance - 18);
    this.anchors = this.anchors.filter(a => a.z > this.distance - 18 || a === this.gumTarget);
  }
  impact(hazard) {
    const fatal = ['gap', 'wall'].includes(hazard.kind);
    if (!fatal && this.grace > 0) return;
    if (hazard.kind === 'projectile' && this.power > 0 && ['chain', 'echo', 'godspeed', 'palm'].includes(this.kit.skill) && !this.usedEvade) {
      this.usedEvade = true; hazard.cleared = true; this.emit('deflect'); return;
    }
    if (fatal) { this.fail(hazard.kind === 'gap' ? 'The landing was out of reach.' : 'The route was blocked. Change lanes earlier.'); return; }
    this.strikes += this.state === 'zetsu' && hazard.kind === 'projectile' ? 2 : 1;
    this.state = 'ten'; this.stumble = 1.1; this.grace = 1.3; this.clean = 0;
    this.emit('hit');
    if (this.strikes >= this.rules.damage) this.fail('Too much ground lost. The pursuit caught up.');
  }
  step(dt = HUNTER.step) {
    if (this.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.05);
    this.elapsed += dt; this.clean += dt; this.previousDistance = this.distance; this.previousX = this.x; this.previousY = this.y;
    this.distance = Math.min(this.finish, this.distance + this.speed() * dt);
    this.score += Math.floor(this.distance) - Math.floor(this.previousDistance);
    this.x += Math.sign(this.lane - this.x) * Math.min(Math.abs(this.lane - this.x), dt / HUNTER.laneTime);
    this.jump = Math.max(0, this.jump - dt); this.slide = Math.max(0, this.slide - dt);
    this.y = this.jump > 0 ? Math.sin(Math.PI * (1 - this.jump / HUNTER.jump)) * 2.15 : 0;
    if (this.gumTarget) {
      const progress = Math.min(1, (this.distance - this.gumTarget.start) / (this.gumTarget.z - this.gumTarget.start));
      this.y = Math.max(this.y, this.gumTarget.startY * (1 - progress) + Math.sin(progress * Math.PI) * 2.8);
      if (this.distance >= this.gumTarget.z || this.power <= dt) { this.gumTarget = null; this.jump = 0; this.y = 0; this.emit('land'); }
    }
    if (this.windup > 0) {
      this.windup = Math.max(0, this.windup - dt);
      if (!this.windup) {
        this.power = 0.65;
        const targets = { Rock: ['hurdle', 'wall', 'projectile'], Scissors: ['hurdle', 'beam', 'wire'], Paper: ['hurdle', 'projectile'] };
        this.clearAhead({ Rock: 11, Scissors: 17, Paper: 32 }[this.lockedForm], targets[this.lockedForm]);
        this.emit('release', { form: this.lockedForm });
      }
    }
    this.aura = Math.min(100, this.aura + dt * (this.state === 'zetsu' ? this.rules.recovery : this.kit.nen ? 0.12 : 0.8));
    for (const key of ['gyo', 'gyoWait', 'power', 'powerWait', 'healWait', 'stumble', 'grace']) this[key] = Math.max(0, this[key] - dt);
    if (this.clean >= 35 && this.strikes > 0) { this.strikes--; this.clean = 0; this.emit('recover'); }
    for (const h of this.obstacles) {
      if (h.done) continue;
      if (h.kind === 'projectile' && h.locked === null && h.z - this.distance < 22) h.locked = this.state !== 'zetsu';
      if (h.kind === 'turn') {
        if (this.distance >= h.z) { h.done = true; if (h.choice !== h.side) this.fail(`Missed the ${h.side < 0 ? 'left' : 'right'} turn. Follow the sign at the junction.`); else { this.turns++; this.emit('turn', { side: h.side }); } }
        continue;
      }
      const depth = h.kind === 'gap' ? 1.15 : 0.6;
      if (this.previousDistance > h.z + depth) { h.done = true; continue; }
      if (this.distance < h.z - depth || this.previousDistance > h.z + depth) continue;
      if (Math.min(Math.abs(this.previousX - h.lane), Math.abs(this.x - h.lane)) > 0.39) continue;
      if (h.kind === 'projectile' && h.locked === false) continue;
      const height = Math.min(this.previousY, this.y);
      if (['hurdle', 'wire', 'gap'].includes(h.kind) && height > (h.kind === 'gap' ? 0.7 : 0.9)) continue;
      if (h.kind === 'beam' && this.slide > 0 && height < 0.3) continue;
      h.done = true; this.impact(h);
      if (this.phase !== 'playing') break;
    }
    if (this.phase !== 'playing') return;
    for (const p of this.pickups) if (!p.taken && p.z >= this.previousDistance - 0.8 && p.z <= this.distance + 0.8 && Math.abs(this.x - p.lane) < 0.4) this.collect(p);
    const ch = chapter(this.distance, this.config);
    if (ch !== this.lastChapter) { this.lastChapter = ch; this.emit('chapter', { name: COURSES[this.config.course].places[ch] }); }
    if (this.distance >= this.finish) { this.phase = 'won'; this.emit('win'); }
    this.generate();
  }
}
