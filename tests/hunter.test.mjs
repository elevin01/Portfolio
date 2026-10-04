import test from 'node:test';
import assert from 'node:assert/strict';
import { HunterModel, options, loadout, COURSES, DIFFICULTIES, CHARACTERS, HUNTER_STORAGE, loadRecords, remember, recordKey } from '../js/hunter-model.js';

function clear(config = {}) {
  const g = new HunterModel(42, { mode: 'endless', ...config }); g.begin();
  g.obstacles = []; g.pickups = []; g.anchors = []; g.nextZ = Infinity;
  return g;
}
function advance(g, seconds) { for (let i = 0; i < Math.round(seconds * 120); i++) g.step(); }
function hazard(kind, z = 7, lane = 0) { return { id: `${kind}-${z}`, kind, z, lane, done: false, locked: null }; }
function navigate(g) {
  const turn = g.nextTurn();
  if (turn && turn.z - g.distance < 34) g.move(turn.side);
  const upcoming = g.obstacles.filter(h => !h.done && h.kind !== 'turn' && h.z >= g.distance - 1.2);
  const first = upcoming[0];
  if (first && first.z - g.distance < 18) {
    const occupied = upcoming.filter(h => h.z === first.z).map(h => h.lane);
    const safe = [-1, 0, 1].find(lane => !occupied.includes(lane));
    if (safe !== undefined && safe !== g.lane) g.move(Math.sign(safe - g.lane));
    else if (safe === undefined && first.z - g.distance < g.speed() * 0.48 && first.z > g.distance) {
      if (first.kind === 'beam') g.duck(); else g.leap();
    }
  }
  g.step(); g.drainEvents();
}

test('Trial is the default; unknown selections cannot access prototype properties', () => {
  assert.equal(options().mode, 'trial');
  assert.deepEqual(options(null), options());
  assert.equal(loadRecords(() => '{"selection":null}').selection.mode, 'trial');
  assert.equal(options({ mode: 'anything', character: 'constructor', course: 'toString', difficulty: '__proto__' }).character, 'killua');
  assert.equal(new HunterModel(0).finish, 4000);
});

test('Trial respects Nen training and Godspeed is reserved for later Killua in Endless', () => {
  for (const id of ['gon', 'killua', 'kurapika']) assert.equal(loadout({ character: id, course: 'exam' }).nen, false);
  assert.equal(loadout({ character: 'hisoka', course: 'exam' }).nen, true);
  assert.equal(loadout({ character: 'killua', course: 'yorknew' }).skill, 'echo');
  assert.equal(loadout({ character: 'killua', course: 'greed' }).skill, 'palm');
  assert.equal(loadout({ character: 'killua', mode: 'endless' }).skill, 'godspeed');
  assert.equal(loadout({ character: 'gon', course: 'yorknew' }).skill, 'rod');
  assert.equal(loadout({ character: 'gon', course: 'greed' }).skill, 'jajanken');
  const early = clear({ mode: 'trial', character: 'gon', course: 'exam' });
  assert.equal(early.cast('gyo'), false); assert.equal(early.cast('zetsu'), false);
  assert.equal(early.aura, 100);
});

test('the same seed and inputs reproduce the same generated route and outcome', () => {
  const a = new HunterModel(817, { mode: 'endless', course: 'yorknew' }), b = new HunterModel(817, a.config);
  assert.deepEqual(a.obstacles, b.obstacles); a.begin(); b.begin();
  for (let i = 0; i < 6000; i++) { navigate(a); navigate(b); }
  assert.deepEqual(a, b);
});

test('all character/course/difficulty Trials can finish using only route inputs, without Nen', () => {
  for (const character of Object.keys(CHARACTERS)) for (const course of Object.keys(COURSES)) for (const difficulty of Object.keys(DIFFICULTIES)) {
    const g = new HunterModel(814, { character, course, difficulty }); g.begin();
    for (let i = 0; i < 65000 && g.phase === 'playing'; i++) navigate(g);
    assert.equal(g.phase, 'won', `${character}/${course}/${difficulty} ended at ${g.distance}: ${g.reason}`);
    assert.equal(g.distance, g.finish); assert.equal(g.casts, 0);
    const distance = g.distance; advance(g, 1); assert.equal(g.distance, distance);
  }
});

test('Endless keeps extending beyond every Trial finish while retaining bounded route data', () => {
  for (const course of Object.keys(COURSES)) {
    const g = new HunterModel(11, { mode: 'endless', course, difficulty: 'veteran' }); g.begin();
    while (g.distance < 24000 && g.phase === 'playing') {
      navigate(g);
      assert.ok(g.obstacles.length < 35 && g.pickups.length < 30 && g.anchors.length < 20);
    }
    assert.equal(g.phase, 'playing', `${course} ${g.distance}: ${g.reason}`);
    assert.ok(g.nextZ > g.distance + 170); assert.equal(g.finish, Infinity); assert.ok(g.speed() <= 19);
  }
});

test('movement interpolates lanes, stays bounded, and cannot accumulate a delayed input queue', () => {
  const g = clear(); g.move(1); g.step(); assert.ok(g.x > 0 && g.x < 1);
  g.move(1); advance(g, 0.2); assert.equal(g.lane, 1); assert.equal(g.x, 1);
  g.move(-1); g.move(-1); advance(g, 0.31); assert.equal(g.x, -1);
  assert.equal(g.move(8), false); assert.equal(g.move(NaN), false);
});

test('jumping clears a low obstacle and a gap, sliding clears a beam, and tall walls require a lane change', () => {
  for (const kind of ['hurdle', 'gap']) {
    const g = clear(); g.obstacles = [hazard(kind)]; g.leap(); advance(g, 0.8); assert.equal(g.phase, 'playing', kind); assert.equal(g.strikes, 0);
  }
  const slide = clear(); slide.obstacles = [hazard('beam')]; slide.duck(); advance(slide, 0.7); assert.equal(slide.strikes, 0);
  const wall = clear(); wall.obstacles = [hazard('wall')]; wall.leap(); advance(wall, 0.7); assert.equal(wall.phase, 'over');
  const gap = clear(); gap.obstacles = [hazard('gap')]; advance(gap, 0.7); assert.equal(gap.phase, 'over');
});

test('missed turns end a run and a correctly timed directional input records the turn', () => {
  for (const correct of [false, true]) {
    const g = clear(); g.obstacles = [{ ...hazard('turn', 10), side: -1, choice: 0 }];
    if (correct) g.move(-1); advance(g, 1);
    assert.equal(g.phase, correct ? 'playing' : 'over'); assert.equal(g.turns, correct ? 1 : 0);
  }
});

test('pausing freezes position, generation, resource recovery, charge, and all technique timers', () => {
  const g = clear(); g.cast('power'); advance(g, 0.3); g.pause();
  const before = structuredClone(g); advance(g, 90); assert.deepEqual(structuredClone(g), before);
  assert.equal(g.leap(), false); assert.equal(g.move(1), false); g.resume(); g.step(); assert.ok(g.distance > before.distance);
});

test('Godspeed spends both resources, keeps collision risk from terrain, and has no passive electricity recovery', () => {
  const g = clear(); assert.equal(g.cast('power'), true); assert.equal(g.electric, 35); assert.equal(g.aura, 84);
  const aura = g.aura; assert.equal(g.cast('power'), false); assert.equal(g.aura, aura);
  advance(g, 20); assert.equal(g.electric, 35); assert.equal(g.cast('power'), false);
  g.cast('zetsu'); advance(g, 60); assert.equal(g.electric, 35); assert.equal(g.aura, 100);
  const wall = clear(); wall.cast('power'); wall.obstacles = [hazard('wall')]; advance(wall, 0.8); assert.equal(wall.phase, 'over');
});

test('Zetsu avoids aura detection before targeting, but cannot erase an attack already aimed at the runner', () => {
  for (const before of [true, false]) {
    const g = clear(); g.obstacles = [hazard('projectile', 12)];
    if (before) g.cast('zetsu'); else { g.step(); assert.equal(g.obstacles[0].locked, true); g.cast('zetsu'); }
    advance(g, 1.2); assert.equal(g.phase, before ? 'playing' : 'over');
  }
  const g = clear(); g.aura = 50; g.cast('zetsu'); advance(g, 1); assert.ok(g.aura > 52);
  g.cast('gyo'); assert.equal(g.state, 'ten'); assert.ok(g.gyo > 0);
});

test('Jajanken commits a charge, locks movement, and gives the three forms distinct target reach', () => {
  const cases = [['Rock', 'wall', 15], ['Scissors', 'beam', 20], ['Paper', 'projectile', 35]];
  for (const [form, kind, z] of cases) {
    const g = clear({ character: 'gon' }); g.form = form; g.obstacles = [hazard(kind, z)];
    g.cast('power'); assert.ok(g.windup > 0); assert.equal(g.move(1), false); assert.equal(g.leap(), false);
    assert.equal(g.cast('extra'), false); advance(g, 0.86); assert.equal(g.obstacles[0].cleared, true, form);
  }
  const paper = clear({ character: 'gon' }); paper.form = 'Paper'; paper.obstacles = [hazard('wall', 25)]; paper.cast('power'); advance(paper, 0.86); assert.equal(paper.obstacles[0].done, false);
});

test('Dowsing Chain intercepts one projectile; Holy Chain spends aura only when an injury can be healed', () => {
  const g = clear({ character: 'kurapika' }); assert.equal(g.cast('extra'), false); assert.equal(g.aura, 100);
  g.obstacles = [hazard('projectile', 7), hazard('projectile', 17)]; g.cast('power'); advance(g, 1.5);
  assert.equal(g.phase, 'playing'); assert.equal(g.strikes, 1); assert.equal(g.usedEvade, true);
  const aura = g.aura; g.cast('extra'); assert.equal(g.strikes, 0); assert.equal(g.aura, aura - 36); assert.ok(g.healWait > 0);
});

test('Bungee Gum requires a real anchor and reaches it through movement instead of teleporting', () => {
  const g = clear({ character: 'hisoka' }); assert.equal(g.cast('power'), false); assert.equal(g.aura, 100);
  g.anchors = [{ id: 'anchor', lane: 1, z: 25, used: false }];
  assert.equal(g.cast('power'), true); assert.equal(g.distance, 0); assert.equal(g.anchors[0].used, true);
  g.step(); assert.ok(g.y > 0 && g.y < 0.1, 'the pull begins continuously from the ground');
  advance(g, 0.5); assert.ok(g.distance > 0 && g.distance < 25); assert.ok(g.y > 1);
  advance(g, 1.3); assert.equal(g.gumTarget, null); assert.ok(g.distance >= 25);
});

test('pickups are collected once and pre-Nen tools remain usable without granting Nen', () => {
  const g = clear({ character: 'gon', course: 'exam', mode: 'trial' });
  g.pickups = [{ id: 'marker', z: 20, lane: 1, kind: 'seal', taken: false }];
  assert.equal(g.cast('power'), true); assert.equal(g.seals, 1); advance(g, 2); assert.equal(g.seals, 1);
  const killua = clear(); killua.electric = 0; killua.pickups = [{ id: 'power', z: 6, lane: 0, kind: 'electric', taken: false }];
  advance(killua, 1); assert.equal(killua.electric, 23); advance(killua, 1); assert.equal(killua.electric, 23);
});

test('records remain independent for character, course, mode, and difficulty; invalid storage is safe', () => {
  const records = loadRecords(() => { throw new Error('denied'); }); assert.deepEqual(records.scores, {});
  for (const character of Object.keys(CHARACTERS)) for (const mode of ['trial', 'endless']) {
    const g = clear({ character, mode }); g.distance = mode === 'trial' ? g.finish : 9000; g.score = g.distance; g.elapsed = 320; g.phase = mode === 'trial' ? 'won' : 'over'; remember(records, g);
  }
  assert.equal(Object.keys(records.scores).length, 8); assert.equal(records.scores['gon/exam/hunter/endless'].time, 0);
  assert.deepEqual(loadRecords(key => key === HUNTER_STORAGE ? JSON.stringify(records) : null), records);
  const invalid = loadRecords(() => JSON.stringify({ selection: { mode: 'weird' }, scores: { 'constructor/exam/hunter/trial': { distance: 100 }, 'gon/exam/hunter/trial': { distance: -100, time: -1 } } }));
  assert.equal(Object.keys(invalid.scores).length, 1); assert.equal(invalid.scores['gon/exam/hunter/trial'].distance, 0);
  assert.equal(recordKey(options()), 'killua/exam/hunter/trial');
});
