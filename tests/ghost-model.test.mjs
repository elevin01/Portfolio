import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES, GhostModel } from '../js/ghost-model.js';

function rng(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function started(caseIndex = 0, seed = 25, first = 14) {
  const game = new GhostModel(caseIndex, rng(seed));
  game.act('investigate', first);
  return game;
}
function unknown(game, ghost) {
  return game.cells.findIndex(cell => cell.ghost === ghost && !cell.open && !cell.confirmed);
}

test('every first room in every case has a safe neighborhood, exact ghost count, and correct clues', () => {
  CASES.forEach((contract, caseIndex) => {
    for (let first = 0; first < contract.rows * contract.cols; first++) {
      for (const seed of [1, 57, 281]) {
        const game = started(caseIndex, seed, first);
        assert.equal(game.phase, 'active');
        assert.equal(game.strikes, 0);
        assert.equal(game.cells.filter(cell => cell.ghost).length, contract.ghosts);
        assert.equal(game.cells[first].adjacent, 0);
        for (const index of [first, ...game.neighbors(first)]) {
          assert.equal(game.cells[index].ghost, false);
          assert.equal(game.cells[index].open, true);
        }
        game.cells.forEach((cell, index) => {
          assert.equal(cell.adjacent, game.neighbors(index).filter(i => game.cells[i].ghost).length);
          assert.equal(cell.open && cell.ghost, false);
        });
      }
    }
  });
});

test('marking toggles without exposing truth and a marked room cannot be investigated accidentally', () => {
  const game = started();
  for (const ghost of [true, false]) {
    const index = unknown(game, ghost);
    assert.ok(index >= 0);
    assert.equal(game.act('mark', index).type, 'marked');
    assert.equal(game.act('investigate', index).type, 'marked-room');
    assert.equal(game.cells[index].confirmed, false);
    assert.equal(game.cells[index].open, false);
    assert.equal(game.act('mark', index).type, 'unmarked');
  }
  assert.equal(game.strikes, 0);
});

test('a scan safely verifies a ghost or clears a room, costs one charge, and never spends twice on known rooms', () => {
  const game = started();
  const ghost = unknown(game, true);
  game.act('mark', ghost);
  assert.equal(game.act('scan', ghost).type, 'signal');
  assert.equal(game.cells[ghost].marked, false);
  assert.equal(game.cells[ghost].confirmed, true);
  assert.equal(game.scans, 1);
  assert.equal(game.act('scan', ghost).type, 'known');
  assert.equal(game.scans, 1);
  const safe = unknown(game, false);
  game.act('mark', safe);
  assert.equal(game.act('scan', safe).type, 'scan-clear');
  assert.equal(game.cells[safe].open, true);
  assert.equal(game.cells[safe].marked, false);
  assert.equal(game.scans, 0);
  const next = unknown(game, true);
  assert.equal(game.act('scan', next).type, 'no-scans');
  assert.equal(game.cells[next].confirmed, false);
  assert.equal(game.strikes, 0);
});

test('capture preserves every clue and can only score each ghost once', () => {
  const game = started();
  const evidence = game.cells.map(cell => cell.adjacent);
  const ghost = unknown(game, true);
  game.act('mark', ghost);
  const outcome = game.act('trap', ghost);
  assert.equal(outcome.type, 'captured');
  assert.ok(outcome.species);
  assert.equal(game.captured, 1);
  assert.equal(game.cells[ghost].marked, false);
  assert.equal(game.act('trap', ghost).type, 'secured');
  assert.equal(game.act('scan', ghost).type, 'secured');
  assert.equal(game.captured, 1);
  assert.deepEqual(game.cells.map(cell => cell.adjacent), evidence);
});

test('disturbing a ghost only strikes once; a revealed ghost can still be captured', () => {
  const game = started();
  const ghost = unknown(game, true);
  assert.equal(game.act('investigate', ghost).type, 'disturbed');
  assert.equal(game.strikes, 1);
  assert.equal(game.act('investigate', ghost).type, 'confirmed');
  assert.equal(game.strikes, 1);
  assert.equal(game.act('trap', ghost).type, 'captured');
  assert.equal(game.strikes, 1);
});

test('empty traps reveal useful evidence but three mistakes end the case', () => {
  const game = started();
  const safe = unknown(game, false);
  assert.equal(game.act('trap', safe).type, 'empty-trap');
  assert.equal(game.cells[safe].open, true);
  assert.equal(game.strikes, 1);
  assert.equal(game.act('trap', safe).type, 'known');
  assert.equal(game.strikes, 1);
  game.act('investigate', unknown(game, true));
  game.act('investigate', unknown(game, true));
  assert.equal(game.phase, 'lost');
  const snapshot = JSON.stringify(game);
  for (const mode of ['mark', 'trap', 'scan', 'investigate']) game.act(mode, unknown(game, true));
  assert.equal(JSON.stringify(game), snapshot);
});

test('win requires every ghost captured, awards stars, and freezes the finished board', () => {
  for (const strikes of [0, 1, 2]) {
    const game = started();
    const ghosts = game.cells.flatMap((cell, index) => cell.ghost ? [index] : []);
    for (const index of ghosts.slice(0, strikes)) game.act('investigate', index);
    for (const index of ghosts.slice(0, -1)) {
      game.act('trap', index);
      assert.equal(game.phase, 'active');
    }
    game.act('trap', ghosts.at(-1));
    assert.equal(game.phase, 'won');
    assert.equal(game.stars, 3 - strikes);
    const snapshot = JSON.stringify(game);
    game.act('investigate', 0); game.act('trap', 1);
    assert.equal(JSON.stringify(game), snapshot);
  }
});

test('a correctly marked clue clears neighbors; incorrect flags retain the risk of disturbing a ghost', () => {
  function fixture(wrong) {
    const game = new GhostModel();
    game.phase = 'active';
    game.cells[0].ghost = true; game.cells[0].species = 'slimer';
    game.cells[2].ghost = true; game.cells[2].species = 'puft';
    game.cells.forEach((cell, i) => { cell.adjacent = game.neighbors(i).filter(n => game.cells[n].ghost).length; });
    game.cells[7].open = true;
    game.cells[0].marked = true;
    game.cells[wrong ? 1 : 2].marked = true;
    return game;
  }
  const correct = fixture(false);
  const result = correct.act('investigate', 7);
  assert.equal(result.type, 'revealed');
  assert.ok(result.changed.length > 0);
  assert.equal(correct.strikes, 0);
  assert.equal(correct.cells[0].marked, true);
  const wrong = fixture(true);
  assert.equal(wrong.act('investigate', 7).type, 'disturbed');
  assert.equal(wrong.strikes, 1);
  assert.equal(wrong.cells[2].confirmed, true);
});

test('reset discards the old case; invalid actions and unseeded tools never mutate it', () => {
  const game = started();
  game.act('scan', unknown(game, true));
  game.reset(2);
  assert.equal(game.phase, 'ready');
  assert.equal(game.cells.length, 48);
  assert.equal(game.captured, 0);
  assert.equal(game.scans, 2);
  assert.equal(game.strikes, 0);
  const snapshot = JSON.stringify(game);
  for (const index of [-1, 48, 1.5, NaN]) assert.equal(game.act('investigate', index).type, 'ignored');
  assert.equal(game.act('dance', 0).type, 'ignored');
  for (const mode of ['scan', 'trap', 'mark']) assert.equal(game.act(mode, 0).type, 'start');
  assert.equal(JSON.stringify(game), snapshot);
});
