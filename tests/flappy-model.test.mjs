import test from 'node:test';
import assert from 'node:assert/strict';
import { FLAPPY, FlappyModel } from '../js/flappy-model.js';

const newGame = () => new FlappyModel(() => 0.5);

test('only starting a round begins physics; a flap gives upward velocity', () => {
  const game = newGame();
  game.step();
  assert.equal(game.phase, 'ready');
  assert.equal(game.distance, 0);
  assert.equal(game.pipes.length, 0);
  const initialY = game.y;
  game.flap();
  game.step();
  assert.equal(game.phase, 'playing');
  assert.equal(game.pipes.length, 1);
  assert.ok(game.y < initialY);
  assert.ok(game.velocity < 0);
});

test('gravity accelerates a fall and another flap reverses it', () => {
  const game = newGame();
  game.flap();
  for (let i = 0; i < 40; i++) game.step();
  assert.ok(game.velocity > 0);
  const fallingY = game.y;
  game.flap();
  game.step();
  assert.ok(game.y < fallingY);
});

test('pause freezes the exact round, and reset clears its state', () => {
  const game = newGame();
  game.flap();
  game.step();
  game.pause();
  const paused = JSON.stringify(game);
  for (let i = 0; i < 120; i++) game.step();
  game.flap();
  assert.equal(JSON.stringify(game), paused);
  game.resume();
  game.step();
  assert.notEqual(JSON.stringify(game), paused);
  game.reset();
  assert.equal(game.phase, 'ready');
  assert.equal(game.score, 0);
  assert.equal(game.distance, 0);
  assert.equal(game.velocity, 0);
  assert.deepEqual(game.pipes, []);
});

test('ceiling and ground collisions end the round and stop scoring', () => {
  for (const y of [FLAPPY.radius - 1, FLAPPY.ground - FLAPPY.radius + 1]) {
    const game = newGame();
    game.flap(); game.y = y; game.velocity = 0;
    game.step();
    assert.equal(game.phase, 'over');
    const stopped = JSON.stringify(game);
    for (let i = 0; i < 120; i++) game.step();
    game.flap();
    assert.equal(JSON.stringify(game), stopped);
  }
});

test('both pipe edges collide, while the center of the gap is passable', () => {
  for (const offset of [-FLAPPY.gap / 2, 0, FLAPPY.gap / 2]) {
    const game = newGame();
    game.flap();
    game.pipes[0].x = FLAPPY.birdX - 10;
    game.y = game.pipes[0].center + offset;
    game.velocity = 0;
    game.step();
    assert.equal(game.phase, offset === 0 ? 'playing' : 'over');
    assert.equal(game.score, 0);
  }
});

test('a cleared pipe scores exactly once, after the entire bird passes it', () => {
  const game = newGame();
  game.flap();
  const pipe = game.pipes[0];
  game.y = pipe.center; game.velocity = 0;
  pipe.x = FLAPPY.birdX - FLAPPY.radius - FLAPPY.pipeWidth + 2;
  game.step();
  assert.equal(game.score, 0);
  game.step();
  assert.equal(game.score, 1);
  for (let i = 0; i < 10; i++) game.step();
  assert.equal(game.score, 1);
});

test('pipe openings have safe margins and limited changes in height', () => {
  const game = new FlappyModel(() => 0);
  game.flap();
  for (let i = 0; i < 20; i++) {
    game.random = () => i % 2;
    const previous = game.pipes.at(-1);
    game.addPipe(previous.x + FLAPPY.spacing);
    const pipe = game.pipes.at(-1);
    assert.ok(pipe.center - FLAPPY.gap / 2 >= 58);
    assert.ok(pipe.center + FLAPPY.gap / 2 <= FLAPPY.ground - 58);
    assert.ok(Math.abs(pipe.center - previous.center) <= 105);
    assert.equal(pipe.x - previous.x, FLAPPY.spacing);
  }
});

test('sustained play scores, spawns pipes, and discards offscreen obstacles', () => {
  const game = newGame();
  game.flap();
  for (let tick = 0; tick < 120 * 60; tick++) {
    const pipe = game.pipes.find(p => p.x + FLAPPY.pipeWidth >= FLAPPY.birdX - FLAPPY.radius);
    if (game.y > pipe.center + 20 && game.velocity > 0) game.flap();
    game.step();
    assert.equal(game.phase, 'playing');
    assert.ok(game.pipes.length <= 4);
  }
  assert.ok(game.score > 30);
  assert.ok(Math.abs(game.distance - FLAPPY.speed * 60) < 0.001);
});
