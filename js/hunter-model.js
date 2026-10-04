// Canvas runner simulation. Coordinates are logical pixels; distance is metres.
export const HUNTER = Object.freeze({ step: 1 / 120, width: 640, height: 360, ground: 282, playerX: 128 });
export const COURSES = Object.freeze({
  exam: { name: 'Hunter Exam', places: ['Underground marathon', 'The ascent', 'Numere Wetlands'], color: '#adcbb1' },
  yorknew: { name: 'Yorknew City', places: ['Auction district', 'Rooftop pursuit', 'Backstreets'], color: '#e4b38b' },
  greed: { name: 'Greed Island', places: ['Open country', 'Training grounds', 'Masadora outskirts'], color: '#bee0a1' }
});
export const DIFFICULTIES = Object.freeze({
  rookie: { name: 'Rookie', speed: 145, finish: 1800, spacing: 400, recharge: 3.5 },
  hunter: { name: 'Hunter', speed: 170, finish: 2600, spacing: 370, recharge: 2.5 },
  veteran: { name: 'Veteran', speed: 200, finish: 3200, spacing: 350, recharge: 1.8 }
});
export const CHARACTERS = Object.freeze({
  killua: { name: 'Killua', color: '#b4d9ff' }, gon: { name: 'Gon', color: '#c0df88' },
  kurapika: { name: 'Kurapika', color: '#edc779' }, hisoka: { name: 'Hisoka', color: '#e9a4ce' }
});
const own = (o, key, fallback) => Object.hasOwn(o, key) ? key : fallback;
export function options(v = {}) { v ||= {}; return { character: own(CHARACTERS, v.character, 'killua'), course: own(COURSES, v.course, 'exam'), difficulty: own(DIFFICULTIES, v.difficulty, 'rookie'), mode: v.mode === 'endless' ? 'endless' : 'trial' }; }
const KITS = {
  board: ['Skateboard', 'Vault the next hurdle or gap with a long board jump.', 30, 'Hurdle or gap ahead'],
  echo: ['Rhythm Echo', 'Leave afterimages and slip past the next sentry.', 30, 'Sentry ahead'],
  palm: ['Lightning Palm', 'Stun the next sentry with an electrical strike.', 35, 'Sentry ahead'],
  godspeed: ['Godspeed', 'Automatically evade the next sentry. Uses stored electricity.', 40, 'Sentry ahead'],
  rod: ['Fishing rod', 'Hook the next trail badge from a safe distance.', 25, 'Badge ahead'],
  rock: ['Jajanken: Rock', 'Charge a punch, then shatter the next hurdle. Gaps still need a jump.', 35, 'Hurdle ahead'],
  blades: ['Twin blades', 'Cut through the next hurdle.', 30, 'Hurdle ahead'],
  heal: ['Holy Chain', 'Restore one heart. Cannot be used at full health.', 60, 'Missing a heart'],
  gum: ['Bungee Gum', 'Attach to a pink anchor and vault its hurdle or gap.', 35, 'Pink anchor ahead']
};
export function loadout(config) {
  const o = options(config); let skill;
  if (o.character === 'killua') skill = o.mode === 'endless' ? 'godspeed' : { exam: 'board', yorknew: 'echo', greed: 'palm' }[o.course];
  if (o.character === 'gon') skill = o.mode === 'endless' || o.course === 'greed' ? 'rock' : 'rod';
  if (o.character === 'kurapika') skill = o.mode === 'trial' && o.course === 'exam' ? 'blades' : 'heal';
  if (o.character === 'hisoka') skill = 'gum';
  const [ability, description, cost, target] = KITS[skill];
  return { ...CHARACTERS[o.character], skill, ability, description, cost, target, electric: ['palm', 'godspeed'].includes(skill), nen: !['board', 'rod', 'blades', 'echo'].includes(skill), era: o.mode === 'endless' ? 'Later abilities · free play' : `${COURSES[o.course].name} · era-specific kit` };
}
export function random(seed) { let n = seed >>> 0; return () => { n += 0x6d2b79f5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function chapter(distance, config) { return config.mode === 'endless' ? Math.floor(distance / 650) % 3 : Math.min(2, Math.floor(distance / (DIFFICULTIES[config.difficulty].finish / 3))); }
export const HUNTER_STORAGE = 'portfolio.hunter-2d.v2';
export const recordKey = config => { const o = options(config); return `${o.character}/${o.course}/${o.difficulty}/${o.mode}`; };
export function loadRecords(read) {
  let saved; try { saved = JSON.parse(read(HUNTER_STORAGE)); } catch {}
  const result = { selection: options(saved?.selection), sound: saved?.sound === true, scores: {} };
  for (const [key, v] of Object.entries(saved?.scores || {})) {
    const [character, course, difficulty, mode] = key.split('/');
    if (!v || recordKey({ character, course, difficulty, mode }) !== key) continue;
    result.scores[key] = { distance: Number.isFinite(v.distance) && v.distance >= 0 ? v.distance : 0, badges: Number.isFinite(v.badges) && v.badges >= 0 ? v.badges : 0 };
  } return result;
}
export function remember(records, game) { const key = recordKey(game.config), old = records.scores[key] || {}; records.scores[key] = { distance: Math.max(old.distance || 0, Math.floor(game.distance)), badges: Math.max(old.badges || 0, game.badges) }; }
export class HunterModel {
  constructor(seed = Date.now(), config) { this.reset(seed, config); }
  reset(seed = this.seed, config = this.config) {
    this.seed = seed >>> 0; this.config = options(config); this.rules = DIFFICULTIES[this.config.difficulty]; this.kit = loadout(this.config);
    this.rng = random(this.seed); this.phase = 'ready'; this.distance = 0; this.travel = 0; this.elapsed = 0;
    this.vault = null; this.y = 0; this.vy = 0; this.slide = 0; this.jumpBuffer = 0; this.hearts = 3; this.energy = 100; this.badges = 0;
    this.invincible = 0; this.cooldown = 0; this.effect = 0; this.charge = 0; this.target = null; this.next = 700; this.count = 0;
    this.hazards = []; this.pickups = []; this.events = []; this.taught = new Set(); this.lesson = null; this.lastChapter = 0; this.reason = '';
    this.finish = this.config.mode === 'trial' ? this.rules.finish : Infinity; this.generate();
  }
  emit(type, extra = {}) { this.events.push({ type, ...extra }); }
  drainEvents() { return this.events.splice(0); }
  begin() { this.phase = 'playing'; }
  pause() { if (this.phase === 'playing') this.phase = 'paused'; }
  resume() { if (this.phase === 'paused') this.phase = 'playing'; }
  speed() { return Math.min(245, this.rules.speed + this.distance / 160); }
  generate() {
    while (this.next < this.travel + 1500) {
      if (this.next > this.finish * 10 - 400) { this.next = Infinity; break; }
      const index = this.count++;
      const kind = index < 3 ? ['hurdle', 'beam', 'gap'][index] : ['hurdle', 'beam', 'gap', 'sentry'][Math.floor(this.rng() * 4)];
      const h = { id: index, kind, x: this.next, w: kind === 'gap' ? 60 : kind === 'beam' ? 60 : 34, done: false, removed: false };
      this.hazards.push(h);
      // Badges follow the safe jump arc; supplies are on the recovery stretch.
      this.pickups.push({ x: h.x + h.w / 2, y: kind === 'beam' ? 15 : 82, kind: 'badge', done: false });
      if (index % 5 === 4) this.pickups.push({ x: h.x + 175, y: 24, kind: 'supply', done: false });
      this.next += this.rules.spacing + this.rng() * 110;
    }
    this.hazards = this.hazards.filter(h => h.x + h.w > this.travel - 120);
    this.pickups = this.pickups.filter(p => p.x > this.travel - 120);
  }
  nearest(kinds, range = 240) { return this.hazards.find(h => !h.done && !h.removed && kinds.includes(h.kind) && h.x - this.travel > 5 && h.x - this.travel < range); }
  abilityTarget() {
    if (this.kit.skill === 'heal') return this.hearts < 3 ? this : null;
    if (this.kit.skill === 'rod') return this.pickups.find(p => !p.done && p.kind === 'badge' && p.x - this.travel > 0 && p.x - this.travel < 300);
    const vault = ['board', 'gum'].includes(this.kit.skill);
    const target = this.nearest(vault ? ['gap', 'hurdle'] : ['rock', 'blades'].includes(this.kit.skill) ? ['hurdle'] : ['sentry'], vault ? 180 : 245);
    const minimum = vault ? 18 : this.kit.skill === 'rock' ? 60 : 5;
    return target && target.x - this.travel > minimum ? target : null;
  }
  availability() {
    if (this.phase === 'paused') return 'Paused';
    if (this.phase !== 'playing') return 'Start a run';
    if (this.lesson) return 'Try the movement first';
    if (this.cooldown > 0) return `${Math.ceil(this.cooldown)}s recovery`;
    if (this.energy < this.kit.cost) return `Need ${this.kit.cost} ${this.kit.electric ? 'charge' : this.kit.nen ? 'aura' : 'stamina'}`;
    if (['board', 'gum'].includes(this.kit.skill) && this.y > 1) return 'Land first';
    if (!this.abilityTarget()) return this.kit.target;
    return '';
  }
  jump() {
    if (this.phase !== 'playing') return;
    if (this.lesson && this.lesson !== 'jump') return;
    if (this.lesson) { this.taught.add(this.lessonId); this.lesson = null; }
    this.jumpBuffer = .14;
    if (this.y <= .1) this.leap();
  }
  leap(power = 620) { this.vy = power; this.slide = 0; this.jumpBuffer = 0; this.emit('jump'); }
  duck() {
    if (this.phase !== 'playing' || this.y > 1) return;
    if (this.lesson && this.lesson !== 'slide') return;
    if (this.lesson) { this.taught.add(this.lessonId); this.lesson = null; }
    this.slide = .9; this.emit('slide');
  }
  cast() {
    const reason = this.availability(); if (reason) return false;
    const target = this.abilityTarget(); this.target = target; this.energy -= this.kit.cost; this.cooldown = 6; this.effect = .7;
    switch (this.kit.skill) {
      case 'heal': this.hearts = Math.min(3, this.hearts + 1); break;
      case 'rod': target.done = true; this.badges++; this.emit('collect'); break;
      case 'board': case 'gum': { const duration = (target.x - this.travel + target.w + 50) / this.speed(); this.vault = { time: 0, duration }; this.slide = 0; this.effect = duration; break; }
      case 'rock': this.charge = .5; this.effect = 1; break;
      default: target.removed = true; target.done = true; break;
    }
    this.emit('cast', { skill: this.kit.skill }); return true;
  }
  hit(h) {
    h.done = true;
    if (this.invincible > 0) return;
    this.hearts--; this.invincible = 1.5; this.emit('hit');
    this.reason = h.kind === 'beam' ? 'Slide under the striped beams.' : h.kind === 'gap' ? 'Jump a little later to clear the gap.' : 'Jump over hurdles and sentries.';
    if (h.kind === 'gap') { this.vy = 360; this.y = 20; }
    if (!this.hearts) { this.phase = 'over'; this.emit('over'); }
  }
  step(dt = HUNTER.step) {
    if (this.phase !== 'playing') return;
    // One guided example of each movement, on every new run. The course waits for input.
    const training = this.hazards.find(h => h.id < 3 && !h.done && !this.taught.has(h.id) && h.x - this.travel < 48);
    if (training && this.y <= .1 && this.slide <= 0) { this.lesson = training.kind === 'beam' ? 'slide' : 'jump'; this.lessonId = training.id; }
    if (this.lesson) return;
    this.elapsed += dt;
    for (const key of ['slide', 'invincible', 'cooldown', 'effect', 'jumpBuffer']) this[key] = Math.max(0, this[key] - dt);
    if (this.charge > 0) { this.charge -= dt; if (this.charge <= 0 && this.target) { this.target.removed = true; this.target.done = true; this.emit('smash'); } }
    const move = this.speed() * dt * (this.charge > 0 ? .35 : 1);
    this.travel += move; this.distance = this.travel / 10;
    if (this.vault) { this.vault.time += dt; const t = Math.min(1, this.vault.time / this.vault.duration); this.y = 4 * 115 * t * (1 - t); if (t === 1) { this.vault = null; this.vy = 0; } }
    else if (this.y > 0 || this.vy > 0) { this.y = Math.max(0, this.y + this.vy * dt); this.vy -= 1450 * dt; if (this.y === 0) { this.vy = 0; if (this.jumpBuffer > 0) this.leap(); } }
    if (!this.kit.electric) this.energy = Math.min(100, this.energy + this.rules.recharge * dt);
    for (const h of this.hazards) {
      if (h.done || h.removed) continue;
      const left = h.x - this.travel, right = left + h.w;
      if (right < -10) { h.done = true; continue; }
      if (left < 10 && right > -10) {
        const collision = h.kind === 'gap' ? this.y < 8 : h.kind === 'beam' ? !(this.slide > 0 && this.y < 1) : this.y < (h.kind === 'sentry' ? 40 : 30);
        if (collision) this.hit(h);
      }
    }
    for (const p of this.pickups) {
      if (!p.done && Math.abs(p.x - this.travel) < 24 && Math.abs(p.y - (this.y + (this.slide > 0 ? 13 : 28))) < 30) {
        p.done = true; if (p.kind === 'supply') this.energy = Math.min(100, this.energy + 35); else this.badges++; this.emit('collect', { kind: p.kind });
      }
    }
    const stage = chapter(this.distance, this.config); if (stage !== this.lastChapter) { this.lastChapter = stage; this.emit('chapter', { text: COURSES[this.config.course].places[stage] }); }
    this.generate();
    if (this.distance >= this.finish && this.phase === 'playing') { this.distance = this.finish; this.phase = 'won'; this.emit('win'); }
  }
}
