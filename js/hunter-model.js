// Simulation only: a three-lane runner through the Hunter Exam, governed by Nen.
// Time is in seconds, distance in meters, lanes are 0–2. No DOM or animation clocks.
import { STAGES, KINDS, FAMOUS_PLATES, buildStage, seededRandom } from './hunter-track.js';
export { STAGES, KINDS, FAMOUS_PLATES };

export const RUN = Object.freeze({
  step: 1 / 120, lanes: 3, jumpTime: 0.64, jumpHeight: 1.3, slideTime: 0.58, laneTime: 0.17, bodyFront: 0.45, bodyBack: 0.35,
  auraMax: 100, tenRegen: 4, zetsuRegen: 14, gyoDrain: 9, stumbleCost: 25, pursuerTime: 9, revealRange: 9
});

export const DIFFICULTIES = Object.freeze({
  rookie: { name: 'Rookie', speed: 0.85, regen: 1.3, description: 'Slower pace, generous aura. Learn the techniques.' },
  applicant: { name: 'Applicant', speed: 1, regen: 1, description: 'The exam as intended. Read the course, ration your aura.' },
  pro: { name: 'Pro Hunter', speed: 1.18, regen: 0.8, description: 'Faster, more In, less recovery. Every stumble matters.' }
});

export const CHARACTERS = Object.freeze({
  gon: { name: 'Gon', number: 405, type: 'Enhancer', target: 44, color: '#8fc96a', hatsu: 'Jajanken: Rock', key: 'rock', cost: 40, cooldown: 6,
    action: 'Charge, then clear every lane ahead', passive: 'Enhancer: aura recovers faster and stumbles cost less.',
    lore: 'Rock beats everything in front of you, but the chant takes a moment. “Saisho wa guu…”' },
  killua: { name: 'Killua', number: 99, type: 'Transmuter', target: 199, color: '#bcd9f6', hatsu: 'Godspeed', key: 'godspeed', cost: 45, cooldown: 10,
    action: 'Whirlwind dodges for you', passive: 'Zoldyck training: poison does nothing. Lane changes are quicker.',
    lore: 'Whirlwind lets the body react before the mind does. For a few seconds, nothing touches you.' },
  kurapika: { name: 'Kurapika', number: 404, type: 'Conjurer', target: 16, color: '#efcf74', hatsu: 'Dowsing Chain', key: 'chain', cost: 30, cooldown: 9,
    action: 'Reveal everything In conceals', passive: 'Conjurer’s discipline: Gyo costs half as much aura.',
    lore: 'The chain answers questions. For a while, nothing in the fog stays hidden.' },
  leorio: { name: 'Leorio', number: 403, type: 'Emitter', target: 301, color: '#8fb4d8', hatsu: 'Remote Punch', key: 'punch', cost: 18, cooldown: 4,
    action: 'Break the next hazard in your lane', passive: 'Emitter: the cheapest Hatsu in the exam, with the shortest recharge.',
    lore: 'The punch is thrown now and lands over there. Nobody expects it from the man with the briefcase.' }
});

export const DISCOVERIES = Object.freeze({
  juice: { name: 'Tonpa’s juice', note: 'Applicant #16 offers free juice to every rookie. It’s a laxative.' },
  zoldyck: { name: 'Zoldyck tolerance', note: 'Killua drank Tonpa’s juice and felt fine. Poison training has its perks.' },
  satotz: { name: 'Satotz’s pace', note: 'Ran the whole tunnel without a single stumble. The examiner noticed.' },
  hisoka: { name: 'Hisoka is watching', note: 'A stumble in the fog and #44 picked up your scent.' },
  vanish: { name: 'Zetsu', note: 'Stopped your aura entirely. Hisoka walked straight past you.' },
  caught: { name: 'Not ripe yet', note: 'Hisoka caught you. He kept your plate as a souvenir.' },
  lugger: { name: 'Noggin Lugger', note: 'Gyo revealed an ape dressed as an applicant. The swamp lies.' },
  wager: { name: 'Leroute’s wager', note: 'Bet your hours on a coin. Sometimes you lose fifty.' },
  target: { name: 'Your target', note: 'Took your target’s plate. Three points, no questions asked.' },
  license: { name: 'Hunter License', note: 'Passed every phase of the 287th exam. The card opens most doors.' },
  rock: { name: 'Jajanken', note: 'Rock. The chant is not optional.' },
  godspeed: { name: 'Godspeed', note: 'Whirlwind moved your body before you decided to.' },
  chain: { name: 'Dowsing Chain', note: 'The chain pointed at every hidden thing on the course.' },
  punch: { name: 'Remote Punch', note: 'Threw a punch that arrived later. It still counted.' }
});

const own = (object, key, fallback) => Object.hasOwn(object, key) ? key : fallback;
export function options(value = {}) {
  value ||= {};
  return { character: own(CHARACTERS, value.character, 'gon'), difficulty: own(DIFFICULTIES, value.difficulty, 'applicant'), mode: value.mode === 'endless' ? 'endless' : 'exam' };
}

export const HUNTER_STORAGE = 'portfolio.hunter-nen-run.v4';
export const recordKey = config => { const o = options(config); return `${o.character}/${o.difficulty}/${o.mode}`; };

export function loadRecords(read) {
  let saved = null;
  try { saved = JSON.parse(read(HUNTER_STORAGE)); } catch { /* Fresh records. */ }
  if (!saved || typeof saved !== 'object') saved = {};
  const records = { selection: options(saved.selection), sound: saved.sound === true, scores: {}, discoveries: [], plates: [] };
  for (const [key, value] of Object.entries(saved.scores || {})) {
    const [character, difficulty, mode] = key.split('/');
    if (!value || recordKey({ character, difficulty, mode }) !== key) continue;
    records.scores[key] = {
      distance: Number.isFinite(value.distance) && value.distance >= 0 ? Math.round(value.distance) : 0,
      points: Number.isInteger(value.points) && value.points >= 0 ? value.points : 0,
      licensed: value.licensed === true
    };
  }
  if (Array.isArray(saved.discoveries)) records.discoveries = saved.discoveries.filter(id => Object.hasOwn(DISCOVERIES, id));
  if (Array.isArray(saved.plates)) records.plates = saved.plates.filter(n => Object.hasOwn(FAMOUS_PLATES, n)).map(Number);
  return records;
}

export function remember(records, model) {
  const key = recordKey(model.config);
  const old = records.scores[key] || { distance: 0, points: 0, licensed: false };
  records.scores[key] = { distance: Math.max(old.distance, Math.round(model.distance)), points: Math.max(old.points, model.points), licensed: old.licensed || model.licensed };
  for (const id of model.discoveries) if (!records.discoveries.includes(id)) records.discoveries.push(id);
  for (const n of model.famousPlates) if (!records.plates.includes(n)) records.plates.push(n);
}

export class HunterModel {
  constructor(seed = Date.now(), config) { this.reset(seed, config); }

  reset(seed = this.seed, config = this.config) {
    this.seed = seed >>> 0;
    this.config = options(config);
    this.hero = CHARACTERS[this.config.character];
    this.rules = DIFFICULTIES[this.config.difficulty];
    this.random = seededRandom(this.seed);
    this.phase = 'ready';
    this.elapsed = 0;
    this.distance = 0;
    this.points = 0;
    this.stagePoints = 0;
    this.passed = 0;
    this.aura = RUN.auraMax;
    this.nen = 'ten';
    this.gyo = false;
    this.lap = 0;
    this.stageIndex = -1;
    this.stageStart = 0;
    this.stageStumbles = 0;
    this.licensed = false;
    this.reason = '';
    this.discoveries = [];
    this.famousPlates = [];
    this.events = [];
    this.objects = [];
    this.p = { lane: 1, x: 1, targetLane: 1, y: 0, vy: 0, jump: 0, slide: 0, z: 0, speedScale: 1 };
    this.queuedLane = null;
    this.jumpBuffer = 0;
    this.stumble = 0;
    this.cramp = 0;
    this.cooldown = 0;
    this.charge = 0;
    this.godspeed = 0;
    this.chain = 0;
    this.punch = null;
    this.pursuer = { active: false, timer: 0, zetsuTime: 0 };
    this.gyoSeen = new Set();
    this.nextStage();
  }

  get stage() { return STAGES[this.stageIndex]; }
  get stageProgress() { return Math.max(0, Math.min(1, (this.p.z - this.stageStart) / this.stage.length)); }
  // Canon head counts: 404 applicants start, 371 finish the tunnel, 148 leave the swamp, 25 leave the tower, 9 reach the final.
  get applicantsLeft() {
    if (this.lap > 0 || this.config.mode !== 'exam') return null;
    const [from, to] = this.stage.applicants;
    return Math.round(from + (to - from) * this.stageProgress);
  }
  get speed() {
    const base = this.stage.speed * this.rules.speed * (1 + this.lap * 0.06);
    return base * (1 - 0.45 * this.stumble) * (this.cramp > 0 ? 0.78 : 1) * (this.godspeed > 0 ? 1.12 : 1);
  }
  get revealed() { return this.gyo || this.chain > 0; }

  emit(type, detail = {}) { this.events.push({ type, ...detail }); }
  drainEvents() { return this.events.splice(0); }
  discover(id) {
    if (!Object.hasOwn(DISCOVERIES, id) || this.discoveries.includes(id)) return;
    this.discoveries.push(id);
    this.emit('discovery', { id, ...DISCOVERIES[id] });
  }

  nextStage() {
    this.stageIndex++;
    if (this.stageIndex >= STAGES.length) { this.stageIndex = 0; this.lap++; }
    this.stageStart = this.p.z;
    this.stageStumbles = 0;
    this.stagePoints = 0;
    this.objects = this.objects.filter(o => !o.done && o.z > this.p.z - 10);
    const stage = this.stage;
    const built = buildStage(stage, this.stageStart, this.random, { lap: this.lap, target: this.hero.target, difficulty: this.rules.speed });
    this.objects.push(...built);
    this.emit('stage', { stage: stage.id, lap: this.lap });
  }

  begin() { if (this.phase === 'ready') { this.phase = 'playing'; this.emit('begin'); } }
  pause() { if (this.phase === 'playing') { this.phase = 'paused'; this.gyo = false; this.nen = 'ten'; } }
  resume() { if (this.phase === 'paused') this.phase = 'playing'; }
  // Rest cards sit between exam phases; the run continues on request.
  continue() {
    if (this.phase !== 'rest') return;
    this.phase = 'playing';
    this.emit('resume');
  }

  // Inputs
  moveLane(direction) {
    if (this.phase !== 'playing' || this.godspeed > 0 || !direction) return false;
    return this.shiftLane(Math.sign(direction));
  }
  shiftLane(direction, queueAnother = false) {
    const p = this.p;
    if (p.targetLane !== p.lane) { this.queuedLane = direction; return true; }
    const next = p.targetLane + direction;
    if (next < 0 || next >= RUN.lanes) { this.emit('bump'); return false; }
    p.targetLane = next;
    if (queueAnother) this.queuedLane = direction;
    this.emit('lane');
    return true;
  }
  jump() {
    if (this.phase !== 'playing' || this.godspeed > 0) return false;
    if (this.p.y > 0 || this.p.jump > 0) { this.jumpBuffer = 0.12; return false; }
    return this.launch();
  }
  launch() {
    const p = this.p;
    p.jump = RUN.jumpTime; p.slide = 0; this.jumpBuffer = 0;
    this.emit('jump');
    return true;
  }
  slide() {
    if (this.phase !== 'playing' || this.godspeed > 0) return false;
    const p = this.p;
    if (p.jump > 0) { p.jump = Math.min(p.jump, 0.08); p.slide = RUN.slideTime; this.emit('drop'); return true; }
    p.slide = RUN.slideTime;
    this.emit('slide');
    return true;
  }
  setZetsu(on) {
    if (this.phase !== 'playing') return;
    const next = on ? 'zetsu' : 'ten';
    if (next === this.nen) return;
    this.nen = next;
    if (on) this.gyo = false;
    this.emit(on ? 'zetsu' : 'ten');
  }
  setGyo(on) {
    if (this.phase !== 'playing') return;
    const next = !!on && this.nen !== 'zetsu' && this.aura > 0;
    if (next === this.gyo) return;
    this.gyo = next;
    this.emit(next ? 'gyo' : 'gyo-off');
  }

  availability() {
    if (this.phase !== 'playing') return 'Start running';
    if (this.nen === 'zetsu') return 'No aura in Zetsu';
    if (this.godspeed > 0 || this.charge > 0 || this.chain > 0 || this.punch) return 'Active';
    if (this.cooldown > 0) return `${Math.ceil(this.cooldown)}s`;
    if (this.aura < this.hero.cost) return `Need ${this.hero.cost} aura`;
    if (this.hero.key === 'punch' && !this.punchTarget()) return 'Nothing to hit';
    return '';
  }
  punchTarget() {
    return this.objects.filter(o => !o.done && o.cls !== 'pickup' && o.cls !== 'gap' && o.lane === this.p.targetLane && o.z > this.p.z + 1 && o.z < this.p.z + 42)
      .sort((a, b) => a.z - b.z)[0] || null;
  }
  cast() {
    if (this.availability()) { this.emit('unavailable', { reason: this.availability() }); return false; }
    this.aura -= this.hero.cost;
    this.cooldown = this.hero.cooldown;
    const key = this.hero.key;
    if (key === 'rock') this.charge = 0.5;
    else if (key === 'godspeed') { this.godspeed = 3.5; this.queuedLane = null; }
    else if (key === 'chain') this.chain = 7;
    else if (key === 'punch') this.punch = { timer: 0.35, target: this.punchTarget() };
    this.discover(key);
    this.emit('cast', { key });
    return true;
  }

  destroy(object, by) {
    if (object.done) return;
    object.done = true;
    object.destroyed = true;
    this.emit('destroy', { id: object.id, kind: object.kind, lane: object.lane, z: object.z, by });
  }

  // The same reflexes drive Killua's Godspeed and the solvability pilot in the tests.
  autopilot() {
    const p = this.p;
    const lane = p.targetLane;
    const speed = this.speed;
    const react = Math.max(10, speed * 0.75);
    const threats = this.objects.filter(o => !o.done && o.cls !== 'pickup' && o.z + o.len > p.z - 0.2 && o.z < p.z + react + 20).sort((a, b) => a.z - b.z);
    const nearest = threats.find(o => o.lane === lane && o.z > p.z - 0.3);
    if (!nearest || nearest.z - p.z > react) return;
    const dist = nearest.z - p.z;
    const blocked = (l, from, to, walls) => threats.some(o => o.lane === l && o.z + o.len > from && o.z < to && (!walls || o.cls === 'wall' || o.cls === 'soft'));
    // Crossing the middle lane is safe when nothing solid sits in it for the crossing's duration.
    const crossable = l => !threats.some(o => o.lane === l && o.z > p.z - 0.3 && o.z < p.z + speed * 0.45 && o.cls !== 'high');
    if (nearest.cls === 'wall' || nearest.cls === 'soft') {
      if (p.lane !== p.targetLane) return;
      const range = [p.z - 1, nearest.z + 10];
      // Reachable lanes: a neighbour, or the far lane when the middle is clear long enough to cross it.
      const candidates = [lane - 1, lane + 1, lane - 2, lane + 2].filter(l => l >= 0 && l < RUN.lanes)
        .filter(l => Math.abs(l - lane) === 1 || crossable((l + lane) / 2));
      const choice = candidates.find(l => !blocked(l, ...range, false)) ?? candidates.find(l => !blocked(l, ...range, true));
      if (choice !== undefined) { this.shiftLane(Math.sign(choice - lane), Math.abs(choice - lane) === 2); return; }
      if (nearest.cls === 'wall' && dist < speed * 0.3 && p.y <= 0) this.launch();
      return;
    }
    if (nearest.cls === 'gap' || nearest.cls === 'low') { if (dist < speed * (nearest.cls === 'gap' ? 0.26 : 0.3) && p.y <= 0 && p.jump <= 0) this.launch(); return; }
    if (nearest.cls === 'high' && dist < speed * 0.3 && p.slide < 0.1) { if (p.jump > 0) p.jump = Math.min(p.jump, 0.05); p.slide = RUN.slideTime; this.emit('slide'); }
  }

  stumbleOn(object) {
    const cost = this.hero.key === 'rock' ? RUN.stumbleCost - 5 : RUN.stumbleCost;
    if (this.nen === 'zetsu') return this.knockout(`Hit ${KINDS[object.kind].name} with no aura up. Zetsu leaves you defenseless.`, object);
    if (this.pursuer.active) {
      this.discover('caught');
      return this.knockout('A second stumble. Hisoka caught up and took your plate.', object, 'hisoka');
    }
    if (this.aura < cost) return this.knockout(`Hit ${KINDS[object.kind].name} with your aura exhausted.`, object);
    this.aura -= cost;
    this.stumble = 1;
    this.stageStumbles++;
    object.done = true;
    if (this.stage.pursuer) {
      this.pursuer.active = true;
      this.pursuer.timer = RUN.pursuerTime;
      this.discover('hisoka');
      this.emit('pursuer');
    }
    this.emit('stumble', { kind: object.kind, lane: object.lane, cost });
  }

  knockout(reason, object = null, by = 'hazard') {
    this.phase = 'over';
    this.reason = reason;
    this.gyo = false;
    this.emit('ko', { kind: object?.kind, by });
  }

  collect(object) {
    object.done = true;
    if (object.kind === 'plate') {
      this.points++; this.stagePoints++;
      const famous = FAMOUS_PLATES[object.number];
      if (famous && !this.famousPlates.includes(object.number)) this.famousPlates.push(object.number);
      this.emit('plate', { number: object.number, famous, lane: object.lane, z: object.z });
    } else if (object.kind === 'target') {
      this.points += 3; this.stagePoints += 3;
      this.discover('target');
      this.emit('plate', { number: object.number, famous: 'your target', target: true, lane: object.lane, z: object.z, value: 3 });
    } else if (object.kind === 'juice') {
      if (this.hero.key === 'godspeed') { this.aura = Math.min(RUN.auraMax, this.aura + 10); this.discover('zoldyck'); this.emit('juice', { immune: true, lane: object.lane, z: object.z }); }
      else { this.aura = Math.max(0, this.aura - 15); this.cramp = 2.2; this.discover('juice'); this.emit('juice', { immune: false, lane: object.lane, z: object.z }); }
    } else if (object.kind === 'wager') {
      const won = this.random() < 0.5;
      this.discover('wager');
      if (won) { this.points += 5; this.stagePoints += 5; } else this.aura = Math.max(0, this.aura - 30);
      this.emit('wager', { won, lane: object.lane, z: object.z });
    }
  }

  step(dt = RUN.step) {
    if (this.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.05);
    const p = this.p;
    this.elapsed += dt;
    for (const key of ['stumble', 'cramp', 'cooldown', 'godspeed', 'chain', 'jumpBuffer']) this[key] = Math.max(0, this[key] - dt);
    if (this.charge > 0) {
      this.charge = Math.max(0, this.charge - dt);
      if (this.charge === 0) {
        for (const o of this.objects) if (!o.done && o.cls !== 'pickup' && o.cls !== 'gap' && o.z > p.z - 1 && o.z < p.z + 26) this.destroy(o, 'rock');
        this.emit('rock');
      }
    }
    if (this.punch) {
      this.punch.timer -= dt;
      if (this.punch.timer <= 0) { if (this.punch.target && !this.punch.target.done) this.destroy(this.punch.target, 'punch'); this.punch = null; }
    }
    // Aura: Ten trickles, Zetsu rests, Gyo spends.
    const regen = (this.nen === 'zetsu' ? RUN.zetsuRegen : RUN.tenRegen * (this.hero.key === 'rock' ? 1.3 : 1)) * this.rules.regen;
    this.aura = Math.min(RUN.auraMax, this.aura + regen * dt);
    if (this.gyo) {
      this.aura -= RUN.gyoDrain * (this.hero.key === 'chain' ? 0.5 : 1) * dt;
      if (this.aura <= 0) { this.aura = 0; this.gyo = false; this.emit('gyo-off', { exhausted: true }); }
    }
    if (this.godspeed > 0) this.autopilot();
    // Lanes
    if (p.lane !== p.targetLane) {
      const rate = (this.hero.key === 'godspeed' ? 1.25 : 1) / RUN.laneTime;
      p.x += Math.sign(p.targetLane - p.x) * rate * dt;
      if (Math.abs(p.x - p.targetLane) < rate * dt) { p.x = p.targetLane; p.lane = p.targetLane; if (this.queuedLane) { const q = this.queuedLane; this.queuedLane = null; this.shiftLane(q); } }
    }
    // Jump and slide
    if (p.jump > 0) {
      p.jump = Math.max(0, p.jump - dt);
      const t = 1 - p.jump / RUN.jumpTime;
      p.y = Math.sin(Math.PI * Math.min(1, t)) * RUN.jumpHeight;
      if (p.jump === 0) { p.y = 0; this.emit('land'); if (this.jumpBuffer > 0) this.launch(); }
    } else p.y = 0;
    if (p.slide > 0 && p.jump === 0) p.slide = Math.max(0, p.slide - dt);
    // Forward motion
    const speed = this.speed;
    p.z += speed * dt;
    this.distance = p.z;
    for (const o of this.objects) if (o.vz && !o.done && o.z < o.zMax) o.z = Math.min(o.zMax, o.z + o.vz * dt);
    // Gyo discoveries: the first concealed thing seen in the fog.
    if (this.revealed) for (const o of this.objects) {
      if (o.hidden && !o.done && !this.gyoSeen.has(o.id) && o.z > p.z && o.z < p.z + 40) { this.gyoSeen.add(o.id); this.emit('reveal', { kind: o.kind, lane: o.lane, z: o.z }); if (o.kind === 'lugger') this.discover('lugger'); }
    }
    // Pursuer
    if (this.pursuer.active) {
      if (this.nen === 'zetsu') { this.pursuer.zetsuTime += dt; if (this.pursuer.zetsuTime >= 1.2) { this.pursuer.active = false; this.pursuer.zetsuTime = 0; this.discover('vanish'); this.emit('escape', { zetsu: true }); } }
      else { this.pursuer.zetsuTime = 0; this.pursuer.timer -= dt; if (this.pursuer.timer <= 0) { this.pursuer.active = false; this.emit('escape', { zetsu: false }); } }
    }
    // Collisions, nearest first
    const front = p.z + RUN.bodyFront, back = p.z - RUN.bodyBack;
    for (const o of this.objects) {
      if (o.done) continue;
      if (o.z + o.len < back) { o.done = true; if ((o.kind === 'applicant' || o.kind === 'hunter') && o.lane !== p.lane) this.passed++; continue; }
      if (o.z > front) continue;
      if (Math.abs(p.x - o.lane) > 0.5) continue;
      if (o.cls === 'pickup') { this.collect(o); continue; }
      if (o.cls === 'gap') { if (p.y <= 0) return this.knockout(`Fell into ${KINDS[o.kind].name}.`, o); continue; }
      if (o.cls === 'low' && p.y > 0.42) continue;
      if (o.cls === 'high' && p.slide > 0 && p.y <= 0.05) continue;
      if (o.cls === 'wall') return this.knockout(`Ran straight into ${KINDS[o.kind].name}.`, o);
      this.stumbleOn(o);
      if (this.phase !== 'playing') return;
    }
    // Stage progression
    if (p.z - this.stageStart >= this.stage.length) {
      const stage = this.stage;
      const exam = this.config.mode === 'exam' && this.lap === 0;
      if (stage.id === 'tunnel' && this.stageStumbles === 0) this.discover('satotz');
      if (stage.quota && exam && this.stagePoints < stage.quota) {
        this.reason = `Phase 4 needs ${stage.quota} points of plates. You reached the boat with ${this.stagePoints}.`;
        this.phase = 'over';
        this.emit('ko', { by: 'quota' });
        return;
      }
      if (stage.id === 'island' && exam) { this.licensed = true; this.discover('license'); }
      this.emit('clear', { stage: stage.id, lap: this.lap, points: this.stagePoints, licensed: this.licensed && stage.id === 'island' && exam });
      this.pursuer.active = false;
      this.nextStage();
      if (exam) { this.phase = 'rest'; this.gyo = false; this.nen = 'ten'; }
    }
  }
}
