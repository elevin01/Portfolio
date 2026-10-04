import test from 'node:test';
import assert from 'node:assert/strict';
import { HunterModel, CHARACTERS, DIFFICULTIES, STAGES, KINDS, RUN, options, loadRecords, remember, recordKey, DISCOVERIES } from '../js/hunter-model.js';
import { buildStage, seededRandom } from '../js/hunter-track.js';
import { pilot } from './hunter-pilot.mjs';

const advance = (model, seconds) => { for (let i = 0; i < Math.round(seconds * 120); i++) model.step(); };
function open(config = {}, seed = 7) { const model = new HunterModel(seed, config); model.begin(); return model; }
// An empty course isolates movement and Nen rules from the authored patterns.
function empty(config = {}) { const model = open(config); model.objects = []; return model; }
function place(model, kind, lane, ahead, extra = {}) {
  const object = { id: `t${model.objects.length}`, z: model.p.z + ahead, lane, kind, cls: KINDS[kind].cls, len: kind === 'mud' ? 4 : 0.8, hidden: false, done: false, ...extra };
  model.objects.push(object);
  return object;
}
const types = events => events.map(event => event.type);

test('the runner starts in the middle lane, moves on its own, and changes lanes one at a time', () => {
  const model = empty();
  assert.equal(model.p.lane, 1);
  advance(model, 1);
  assert.ok(model.distance > 10);
  assert.equal(model.moveLane(1), true);
  advance(model, 0.3);
  assert.equal(model.p.lane, 2);
  assert.equal(model.moveLane(1), false);
  model.moveLane(-1); model.moveLane(-1);
  advance(model, 0.5);
  assert.equal(model.p.lane, 0, 'a queued second change lands in the far lane');
});

test('jumps clear low hazards and gaps; slides clear high hazards; walls and gaps are fatal', () => {
  let model = empty();
  place(model, 'fallen', 1, 6);
  model.jump();
  advance(model, 0.8);
  assert.equal(model.phase, 'playing');
  assert.equal(model.aura, RUN.auraMax);
  model = empty();
  place(model, 'pipe', 1, 6);
  model.slide();
  advance(model, 0.8);
  assert.equal(model.phase, 'playing');
  model = empty();
  place(model, 'mud', 1, 4);
  model.jump();
  advance(model, 1);
  assert.equal(model.phase, 'playing', 'a jump carries across a mud pool');
  model = empty();
  place(model, 'mud', 1, 4);
  advance(model, 1);
  assert.equal(model.phase, 'over');
  assert.match(model.reason, /mud pool/);
  model = empty();
  place(model, 'pillar', 1, 4);
  model.jump();
  advance(model, 1);
  assert.equal(model.phase, 'over', 'jumping never clears a wall');
});

test('a stumble spends aura and slows you; Zetsu makes any hit fatal', () => {
  let model = empty({ character: 'leorio' });
  place(model, 'fallen', 1, 4);
  advance(model, 0.6);
  assert.equal(model.phase, 'playing');
  assert.ok(model.aura < RUN.auraMax - 20);
  assert.ok(model.speed < model.stage.speed * 0.8);
  model = empty();
  place(model, 'fallen', 1, 4);
  model.setZetsu(true);
  advance(model, 0.6);
  assert.equal(model.phase, 'over');
  assert.match(model.reason, /Zetsu/);
});

test('Ten trickles aura back, Zetsu recovers quickly, Gyo drains it and switches off when empty', () => {
  const model = empty({ character: 'leorio' });
  model.aura = 40;
  advance(model, 1);
  assert.ok(model.aura > 43 && model.aura < 45);
  model.setZetsu(true);
  advance(model, 1);
  assert.ok(model.aura > 57);
  model.setGyo(true);
  assert.equal(model.gyo, false, 'Gyo needs aura flow, so Zetsu refuses it');
  model.setZetsu(false);
  model.setGyo(true);
  const before = model.aura;
  advance(model, 1);
  assert.ok(model.aura < before - 4);
  model.aura = 0.5;
  advance(model, 0.5);
  assert.equal(model.gyo, false);
  assert.ok(types(model.drainEvents()).includes('gyo-off'));
});

test('Kurapika pays half for Gyo and Gon recovers faster; Killua is immune to Tonpa’s juice', () => {
  const kurapika = empty({ character: 'kurapika' }); kurapika.setGyo(true); kurapika.aura = 50;
  const gon = empty({ character: 'gon' }); gon.setGyo(true); gon.aura = 50;
  advance(kurapika, 1); advance(gon, 1);
  assert.ok(kurapika.aura > gon.aura);
  const killua = empty({ character: 'killua' });
  killua.aura = 60;
  place(killua, 'juice', 1, 3);
  advance(killua, 0.5);
  assert.equal(killua.aura > 60, true);
  assert.ok(killua.discoveries.includes('zoldyck'));
  const leorio = empty({ character: 'leorio' });
  place(leorio, 'juice', 1, 3);
  advance(leorio, 0.5);
  assert.ok(leorio.aura < 90 && leorio.cramp > 0);
  assert.ok(leorio.discoveries.includes('juice'));
});

test('Hisoka follows a stumble in the fog, catches a second one, and loses you in Zetsu', () => {
  const chase = () => {
    const model = empty();
    model.stageIndex = 1; model.stageStart = model.p.z;
    place(model, 'log', 1, 3);
    advance(model, 0.5);
    assert.equal(model.pursuer.active, true);
    assert.ok(model.discoveries.includes('hisoka'));
    return model;
  };
  let model = chase();
  place(model, 'log', 1, 3);
  advance(model, 0.5);
  assert.equal(model.phase, 'over');
  assert.match(model.reason, /Hisoka/);
  model = chase();
  model.setZetsu(true);
  advance(model, 1.3);
  assert.equal(model.pursuer.active, false);
  assert.ok(model.discoveries.includes('vanish'));
  model = chase();
  advance(model, RUN.pursuerTime + 0.1);
  assert.equal(model.pursuer.active, false);
  const tunnel = empty();
  place(tunnel, 'fallen', 1, 3);
  advance(tunnel, 0.5);
  assert.equal(tunnel.pursuer.active, false, 'the tunnel is before Hisoka starts thinning the field');
});

test('each Hatsu costs aura, has a cooldown, and does what the character promises', () => {
  const gon = empty({ character: 'gon' });
  const pillars = [0, 1, 2].map(lane => place(gon, 'pillar', lane, 12));
  assert.equal(gon.cast(), true);
  assert.equal(gon.aura, RUN.auraMax - 40);
  assert.ok(pillars.every(p => !p.done), 'the chant takes a moment');
  advance(gon, 0.55);
  assert.ok(pillars.every(p => p.destroyed));
  assert.equal(gon.cast(), false);
  assert.ok(gon.discoveries.includes('rock'));

  const leorio = empty({ character: 'leorio' });
  const far = place(leorio, 'door', 1, 30);
  place(leorio, 'door', 0, 5);
  assert.equal(leorio.cast(), true);
  advance(leorio, 0.4);
  assert.ok(far.destroyed, 'the punch lands on the nearest hazard in your lane');
  assert.equal(leorio.availability(), `${Math.ceil(leorio.cooldown)}s`);

  const kurapika = empty({ character: 'kurapika' });
  assert.equal(kurapika.cast(), true);
  assert.equal(kurapika.revealed, true);
  assert.equal(kurapika.gyo, false);
  advance(kurapika, 7.1);
  assert.equal(kurapika.revealed, false);

  const killua = empty({ character: 'killua' });
  place(killua, 'boulder', 1, 14);
  assert.equal(killua.cast(), true);
  assert.equal(killua.moveLane(1), false, 'Whirlwind drives the body');
  advance(killua, 1.5);
  assert.equal(killua.phase, 'playing');
  assert.notEqual(killua.p.lane, 1);
});

test('plates score points, your target is worth three, and famous plates are remembered', () => {
  const model = empty({ character: 'gon' });
  place(model, 'plate', 1, 3, { number: 99 });
  place(model, 'target', 1, 6, { number: 44 });
  advance(model, 0.8);
  assert.equal(model.points, 4);
  assert.deepEqual(model.famousPlates, [99]);
  assert.ok(model.discoveries.includes('target'));
  const wager = empty();
  place(wager, 'wager', 1, 3);
  advance(wager, 0.5);
  assert.ok(wager.points === 5 || wager.aura <= 70);
  assert.ok(wager.discoveries.includes('wager'));
});

test('the exam rests between phases, demands six points on Zevil Island, and grants the license', () => {
  const model = open();
  model.p.z = model.stageStart + STAGES[0].length - 1; model.objects = [];
  advance(model, 0.2);
  assert.equal(model.phase, 'rest');
  assert.equal(model.stage.id, 'wetlands');
  assert.ok(model.discoveries.includes('satotz'));
  model.continue();
  assert.equal(model.phase, 'playing');
  model.stageIndex = 4; model.stageStart = model.p.z; model.objects = []; model.stagePoints = 5;
  model.p.z = model.stageStart + STAGES[4].length - 1;
  advance(model, 0.2);
  assert.equal(model.phase, 'over');
  assert.match(model.reason, /6 points/);
  const pass = open();
  pass.stageIndex = 4; pass.stageStart = pass.p.z; pass.objects = []; pass.stagePoints = 6;
  pass.p.z = pass.stageStart + STAGES[4].length - 1;
  advance(pass, 0.2);
  assert.equal(pass.licensed, true);
  assert.equal(pass.lap, 1);
  assert.equal(pass.phase, 'rest');
  const endless = open({ mode: 'endless' });
  endless.stageIndex = 4; endless.stageStart = endless.p.z; endless.objects = [];
  endless.p.z = endless.stageStart + STAGES[4].length - 1;
  advance(endless, 0.2);
  assert.equal(endless.phase, 'playing', 'Endless never stops for rest cards or quotas');
});

test('Great Stamps lunge once you are close; the ravine needs an egg lane and the updraft', () => {
  const forest = empty();
  forest.stageIndex = 2; forest.stageStart = forest.p.z;
  const pig = place(forest, 'pig', 1, 40, { vz: -7, zMin: forest.p.z + 32 });
  advance(forest, 0.5);
  assert.equal(pig.z, forest.p.z + 40 - forest.speed * 0.5, 'a distant pig holds its ground');
  forest.p.z = pig.z - 20;
  advance(forest, 0.5);
  assert.ok(pig.z < forest.p.z + 20 - forest.speed * 0.5 + 0.1, 'a close pig charges');
  assert.ok(pig.z >= pig.zMin);
  forest.moveLane(1); advance(forest, 2);
  assert.equal(forest.phase, 'playing');
  assert.ok(forest.discoveries.includes('stamp'));
  const leap = empty();
  leap.stageIndex = 2; leap.stageStart = leap.p.z;
  place(leap, 'cliff', 1, 3, { len: 9.5 });
  place(leap, 'egg', 1, 6);
  leap.jump();
  advance(leap, 1.6);
  assert.equal(leap.phase, 'playing', 'the egg restarts the jump across the ravine');
  assert.ok(leap.discoveries.includes('egg'));
  const fall = empty();
  fall.stageIndex = 2; fall.stageStart = fall.p.z;
  place(fall, 'cliff', 1, 3, { len: 9.5 });
  fall.jump();
  advance(fall, 1.6);
  assert.equal(fall.phase, 'over');
  assert.match(fall.reason, /Split Mountain/);
  const built = buildStage(STAGES[2], 0, seededRandom(5), {});
  assert.equal(built.filter(o => o.kind === 'cliff').length, 3);
  assert.equal(built.filter(o => o.kind === 'egg').length, 2);
  assert.ok(built.some(o => o.kind === 'pig' && o.vz < 0));
});

test('every character and difficulty can be piloted through the whole exam, collecting the plates it needs', () => {
  for (const character of Object.keys(CHARACTERS)) for (const difficulty of Object.keys(DIFFICULTIES)) for (const seed of [3, 11, 19]) {
    const model = open({ character, difficulty }, seed);
    let steps = 0;
    while (model.lap < 1 && model.phase !== 'over' && steps++ < 120 * 400) pilot(model);
    assert.equal(model.licensed, true, `${character}/${difficulty}/${seed}: ${model.reason}`);
  }
});

test('Endless keeps serving faster laps that remain passable and its object list stays bounded', () => {
  const model = open({ character: 'killua', mode: 'endless' }, 5);
  let steps = 0;
  while (model.lap < 3 && model.phase !== 'over' && steps++ < 120 * 900) { pilot(model); model.drainEvents(); }
  assert.equal(model.lap, 3, model.reason);
  assert.ok(model.speed > STAGES[0].speed);
  assert.ok(model.objects.length < 400);
});

test('generated stages are deterministic, keep hazards readable, and only hide what Gyo can show', () => {
  const a = buildStage(STAGES[1], 0, seededRandom(9), {});
  const b = buildStage(STAGES[1], 0, seededRandom(9), {});
  assert.deepEqual(a.map(o => [o.z, o.lane, o.kind]), b.map(o => [o.z, o.lane, o.kind]));
  for (const stage of STAGES) {
    const objects = buildStage(stage, 100, seededRandom(4), {});
    assert.ok(objects.every(o => o.z >= 140 && o.z < 100 + stage.length), stage.id);
    assert.ok(objects.every(o => o.lane >= 0 && o.lane < RUN.lanes));
    assert.ok(objects.filter(o => o.hidden).every(o => ['soft', 'low', 'high', 'gap', 'wall'].includes(o.cls) && o.kind !== 'door' && o.kind !== 'pillar' && o.kind !== 'cliff'));
  }
  const tunnel = buildStage(STAGES[0], 0, seededRandom(3), { lap: 0 });
  assert.deepEqual([...new Set(tunnel.filter(o => o.tip).map(o => o.tip))].sort(), ['JUMP', 'SLIDE', 'SWITCH LANES'], 'a first tunnel run coaches each move once');
  assert.equal(buildStage(STAGES[0], 0, seededRandom(3), { lap: 1 }).some(o => o.tip), false);
  const counting = open();
  assert.equal(counting.applicantsLeft, 404);
  counting.p.z = STAGES[0].length;
  assert.equal(counting.applicantsLeft, 371);
  assert.equal(open({ mode: 'endless' }).applicantsLeft, null);
  const island = buildStage(STAGES[4], 0, seededRandom(2), { target: 44 });
  assert.equal(island.filter(o => o.kind === 'target').length, 2);
  assert.ok(island.filter(o => o.kind === 'plate').length >= 6);
  assert.equal(buildStage(STAGES[0], 0, seededRandom(1), {}).some(o => o.kind === 'juice'), true);
});

test('pause freezes the run and clears held Nen; corrupt storage is safe; records are separate', () => {
  const model = open();
  model.setGyo(true);
  advance(model, 0.5);
  model.pause();
  const snapshot = [model.p.z, model.aura, model.elapsed];
  advance(model, 2);
  assert.deepEqual([model.p.z, model.aura, model.elapsed], snapshot);
  assert.equal(model.gyo, false);
  assert.equal(options({ character: '__proto__' }).character, 'gon');
  assert.equal(loadRecords(() => '{').selection.mode, 'exam');
  assert.deepEqual(loadRecords(() => JSON.stringify({ discoveries: ['juice', 'nope'], plates: [99, 7] })).discoveries, ['juice']);
  const records = loadRecords(() => null);
  model.points = 4; model.discover('juice'); model.famousPlates.push(44);
  remember(records, model);
  assert.equal(records.scores[recordKey(model.config)].points, 4);
  assert.equal(records.scores[recordKey({ ...model.config, mode: 'endless' })], undefined);
  assert.deepEqual(records.discoveries, ['juice']);
  assert.deepEqual(records.plates, [44]);
  assert.equal(Object.keys(DISCOVERIES).length, 16);
});
