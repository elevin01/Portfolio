import test from 'node:test';
import assert from 'node:assert/strict';
import { CROSSING, SKILLS, CrossingModel } from '../js/crossing-model.js';

function emptyRoute(seed = 42) {
  const game = new CrossingModel(seed);
  for (const row of game.rows) { row.cars = []; row.obstacles = []; row.pickup = null; }
  game.begin(); game.drainEvents();
  return game;
}
function advance(game, seconds) { for (let i = 0; i < Math.ceil(seconds / CROSSING.step); i++) game.step(); }
function place(game, col, row) {
  Object.assign(game.player, { x: col, y: row, prevX: col, prevY: row, col, row });
  game.furthest = Math.max(game.furthest, row);
}
function car(game, row, x, speed = 0, length = 1.22) {
  game.rows[row].speed = speed;
  game.rows[row].cars.push({ id: `${row}-fixture`, x, prevX: x, length, kind: 'taxi', paint: 0, removed: false });
  return game.rows[row].cars.at(-1);
}

test('seeded routes replay exactly and always provide a safe start, rest islands, and traversable gaps', () => {
  for (let seed = 0; seed < 100; seed++) {
    const game = new CrossingModel(seed);
    assert.deepEqual(game.rows, new CrossingModel(seed).rows);
    for (const index of [0, 1, 20, 40, 60]) {
      assert.notEqual(game.rows[index].type, 'road');
      assert.equal(game.rows[index].obstacles.length, 0);
    }
    let consecutiveRoads = 0;
    for (const row of game.rows) {
      consecutiveRoads = row.type === 'road' ? consecutiveRoads + 1 : 0;
      assert.ok(consecutiveRoads <= 4);
      assert.ok(row.obstacles.length <= 2);
      assert.equal(new Set(row.obstacles.map(item => item.col)).size, row.obstacles.length);
      for (const vehicle of row.cars) assert.ok(row.cycle / row.cars.length - vehicle.length > 2.5);
      if (row.pickup) assert.ok(!row.obstacles.some(item => item.col === row.pickup.col));
    }
  }
  assert.notDeepEqual(new CrossingModel(5).rows, new CrossingModel(6).rows);
});

test('ready and paused states freeze all physics, resources, and skill timers', () => {
  const game = new CrossingModel(10);
  const ready = JSON.stringify(game);
  advance(game, 1); game.hop(0, 1);
  assert.equal(JSON.stringify(game), ready);
  game.begin(); game.cast('raphael'); game.hop(0, 1); advance(game, 0.08);
  game.pause();
  const paused = JSON.stringify(game);
  advance(game, 5); game.hop(1, 0);
  assert.equal(JSON.stringify(game), paused);
  game.resume(); advance(game, 0.12);
  assert.equal(game.player.row, 1);
  assert.ok(game.skills.raphael.active > 4);
});

test('movement is orthogonal, smoothly timed, bounded, and queues at most one next hop', () => {
  const game = emptyRoute();
  assert.equal(game.hop(1, 1), false);
  game.hop(0, 1); advance(game, 0.075);
  assert.ok(game.player.y > 0 && game.player.y < 1);
  game.hop(0, 1); game.hop(1, 0); // The latest intent replaces a single buffered move.
  advance(game, 0.35);
  assert.equal(game.player.row, 1); assert.equal(game.player.col, 4); assert.equal(game.move, null);
  game.rows[2].obstacles.push({ col: 4, kind: 'cart', removed: false });
  assert.equal(game.hop(0, 1), false);
  assert.deepEqual(game.player.facing, { dx: 0, dy: 1 });
  place(game, 0, 0);
  assert.equal(game.hop(-1, 0), false); assert.equal(game.hop(0, -1), false);
});

test('swept collision catches a fast car crossing the player, including during a hop', () => {
  const game = emptyRoute(); place(game, 3, 2);
  car(game, 2, 0, 150);
  game.step(0.05);
  assert.equal(game.phase, 'over');
  const moving = emptyRoute();
  place(moving, 3, 1); car(moving, 2, 3); moving.hop(0, 1); advance(moving, 0.15);
  assert.equal(moving.phase, 'over');
  assert.ok(moving.player.y < 2, 'A hop does not jump over a car.');
  const safe = emptyRoute(); place(safe, 3, 1); car(safe, 2, 3); advance(safe, 2);
  assert.equal(safe.phase, 'playing', 'Adjacent sidewalks remain safe.');
});

test('Beelzebub devours incoming traffic and solid obstacles only in its aimed reach', () => {
  const game = emptyRoute(); place(game, 3, 4);
  const ahead = car(game, 5, 3);
  const behind = car(game, 3, 3);
  const side = car(game, 5, 6);
  game.rows[6].obstacles.push({ col: 3, kind: 'cart', removed: false });
  game.cast('beelzebub');
  assert.equal(ahead.removed, true); assert.equal(behind.removed, false); assert.equal(side.removed, false);
  assert.equal(game.rows[6].obstacles[0].removed, true);
  const incoming = car(game, 5, 1.2, 2);
  advance(game, 0.4);
  assert.equal(incoming.removed, true);
  assert.equal(game.stats.devoured, 3);
  advance(game, 1);
  const late = car(game, 5, 3);
  game.step(); assert.equal(late.removed, false);
});

test('Veldora clears four lanes across the street and follows an advancing player', () => {
  const game = emptyRoute(); place(game, 3, 10);
  const wide = car(game, 14, 6);
  const far = car(game, 15, 3);
  game.rows[12].obstacles.push({ col: 0, kind: 'tree', removed: false });
  game.cast('veldora');
  assert.equal(wide.removed, true); assert.equal(far.removed, false);
  assert.equal(game.rows[12].obstacles[0].removed, true);
  game.hop(0, 1); advance(game, 0.2);
  assert.equal(far.removed, true);
  assert.equal(game.energy, 46.5, 'Only new distance, not cleared cars, refills the reserve.');
});

test('Raphael slows perceived traffic, keeps hops responsive, and uses unscaled skill timers', () => {
  const game = emptyRoute(); const vehicle = car(game, 9, 0, 2);
  game.cast('raphael'); game.hop(0, 1); advance(game, 0.2);
  assert.equal(game.player.row, 1);
  assert.ok(Math.abs(vehicle.x - 0.12) < 0.001);
  assert.ok(Math.abs(game.skills.raphael.active - (SKILLS.raphael.duration - 0.2)) < 0.001);
  assert.ok(Math.abs(game.skills.raphael.cooldown - (SKILLS.raphael.cooldown - 0.2)) < 0.001);
});

test('Raphael forecasts actual immediate-hop collision windows and blocked destinations', () => {
  const game = emptyRoute(); place(game, 3, 1);
  const vehicle = car(game, 2, 3);
  assert.equal(game.forecast(0, 1), 'danger');
  vehicle.x = 6; vehicle.prevX = 6;
  assert.equal(game.forecast(0, 1), 'clear');
  game.hop(0, 1); advance(game, 0.2);
  assert.equal(game.phase, 'playing'); assert.equal(game.player.row, 2);
  game.rows[3].obstacles.push({ col: 3, kind: 'tree', removed: false });
  assert.equal(game.forecast(0, 1), 'blocked');
});

test('Uriel repels traffic for its duration, leaves street obstacles intact, and expires', () => {
  const game = emptyRoute(); place(game, 3, 2);
  game.rows[3].obstacles.push({ col: 3, kind: 'cart', removed: false });
  game.cast('uriel');
  const hit = car(game, 2, 3); game.step();
  assert.equal(game.phase, 'playing'); assert.equal(hit.removed, true); assert.equal(game.stats.blocked, 1);
  assert.equal(game.hop(0, 1), false); assert.equal(game.rows[3].obstacles[0].removed, false);
  advance(game, 3);
  car(game, 2, 3); game.step();
  assert.equal(game.phase, 'over');
});

test('magicules and cooldowns cannot be bypassed by waiting, repeated casts, or backtracking', () => {
  const game = emptyRoute(); game.energy = 45;
  game.rows[1].pickup = { col: 3, taken: false };
  game.cast('beelzebub'); assert.equal(game.energy, 25);
  assert.equal(game.cast('beelzebub'), false); assert.equal(game.energy, 25);
  assert.equal(game.cast('veldora'), false); assert.equal(game.energy, 25);
  advance(game, 5); assert.equal(game.energy, 25);
  game.hop(0, 1); advance(game, 0.2); assert.equal(game.energy, 34.5);
  game.hop(0, -1); advance(game, 0.2); game.hop(0, 1); advance(game, 0.2);
  assert.equal(game.energy, 34.5); assert.equal(game.stats.collected, 1);
  game.furthest = 19; place(game, 3, 19); game.hop(0, 1); advance(game, 0.2);
  assert.equal(game.energy, 51);
  game.hop(0, -1); advance(game, 0.2); game.hop(0, 1); advance(game, 0.2);
  assert.equal(game.energy, 51);
});

test('the portal requires its center tile; winning and losing stop further movement and scoring', () => {
  const game = emptyRoute(); place(game, 2, 59); game.furthest = 59;
  game.hop(0, 1); advance(game, 0.2); assert.equal(game.phase, 'playing');
  game.hop(1, 0); advance(game, 0.2); assert.equal(game.phase, 'won');
  const done = JSON.stringify(game);
  game.hop(0, -1); advance(game, 1); assert.equal(JSON.stringify(game), done);
  game.reset();
  assert.equal(game.phase, 'ready'); assert.equal(game.furthest, 0); assert.equal(game.energy, 100);
  assert.equal(game.skills.uriel.active, 0); assert.equal(game.stats.casts, 0);
  assert.deepEqual(game.rows, new CrossingModel(game.seed).rows);
});

test('removed vehicles recycle offscreen without sweeping a collision across the entire road', () => {
  const game = emptyRoute(); place(game, 3, 2);
  const vehicle = car(game, 2, 12.99, 2);
  vehicle.removed = true;
  advance(game, 0.02);
  assert.equal(game.phase, 'playing');
  assert.ok(vehicle.x < -6); assert.equal(vehicle.removed, false);
});
