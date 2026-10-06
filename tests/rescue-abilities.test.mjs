import test from 'node:test';
import assert from 'node:assert/strict';
import { RescueModel, MISSIONS } from '../js/rescue-model.js';
import { WORDS, ABILITIES } from '../js/rescue-words.js';
import { SKETCHES, scoutSketch } from '../js/rescue-sketches.js';
import { STORIES } from '../js/rescue-story.js';

const start = (hero, word = WORDS[0]) => { const m = new RescueModel(); m.start(hero, word); return m; };
test('all heroes use the same 64-word pool, with complete distinct clue types', () => {
  assert.equal(WORDS.length, 64);
  assert.equal(new Set(WORDS.map(w => w[0])).size, 64);
  assert.equal(new Set(Object.values(ABILITIES).map(a => a.kind)).size, 4);
  for (const mission of MISSIONS) {
    assert.equal(mission.words, WORDS);
    assert.ok(STORIES[mission.id].hint.length > 15);
  }
  for (const [word, clue, association, sketch] of WORDS) {
    assert.match(word, /^[A-Z]{3,10}$/);
    assert.notEqual(clue, association);
    assert.ok(!association.toUpperCase().includes(word));
    assert.ok(SKETCHES[sketch]);
    assert.match(scoutSketch(sketch), /role="img" aria-label="[^"]+"/);
  }
});
test('requesting a hint reveals it once without spending a mistake or ability', () => {
  const m = start('naruto');
  assert.equal(m.hintUsed, false);
  assert.equal(m.requestHint(), WORDS[0][1]);
  assert.equal(m.requestHint(), null);
  assert.equal(m.guessed.size, 0); assert.equal(m.misses, 0); assert.equal(m.abilityUsed, false);
});
test('Naruto reveals an unguessed letter and all occurrences without a miss', () => {
  const m = start('naruto'); m.guess('A');
  const help = m.useAbility(() => 0);
  assert.equal(help.letter, 'P'); assert.equal(m.guessed.has('P'), true);
  assert.equal([...m.answer].filter(c => m.guessed.has(c)).length, 3);
  assert.equal(m.misses, 0); assert.equal(m.hintUsed, false);
  assert.equal(m.useAbility(), null); assert.equal(m.guessed.size, 2);
});
test('Naruto can complete the last letter at five misses and locks the result', () => {
  const m = start('naruto');
  for (const c of 'BCDFGAPL') m.guess(c);
  assert.equal(m.misses, 5); assert.equal(m.phase, 'playing');
  assert.equal(m.useAbility().letter, 'E'); assert.equal(m.phase, 'won');
  assert.equal(m.useAbility(), null); assert.equal(m.requestHint(), null); assert.equal(m.guess('Z'), 'ignored');
});
test('Sharingan excludes three new wrong letters and ignores attempts to type them', () => {
  for (const word of WORDS) {
    const m = start('sasuke', word);
    const wrong = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].find(c => !m.answer.includes(c)); m.guess(wrong);
    const before = m.guessed.size, misses = m.misses;
    const help = m.useAbility(() => .5);
    assert.equal(help.letters.length, 3); assert.equal(new Set(help.letters).size, 3);
    for (const c of help.letters) {
      assert.ok(!m.answer.includes(c)); assert.notEqual(c, wrong);
      assert.equal(m.guess(c.toLowerCase()), 'ignored');
    }
    assert.equal(m.guessed.size, before); assert.equal(m.misses, misses); assert.equal(m.progress, 0);
    assert.equal(m.useAbility(), null);
  }
});
test('Sakura and Kakashi supply different information without revealing the clue or letters', () => {
  for (const word of WORDS) for (const hero of ['sakura', 'kakashi']) {
    const m = start(hero, word), help = m.useAbility();
    if (hero === 'sakura') assert.equal(help.text, word[2]);
    else assert.equal(help.sketch, word[3]);
    assert.equal(m.guessed.size, 0); assert.equal(m.misses, 0); assert.equal(m.hintUsed, false);
    assert.equal(m.useAbility(), null);
    assert.equal(m.requestHint(), word[1]);
  }
});
test('new rescues reset help, while completed rounds reject both help actions', () => {
  for (const hero of Object.keys(ABILITIES)) {
    const m = start(hero); m.useAbility(); m.requestHint();
    m.start(hero, WORDS[1]);
    assert.equal(m.hintUsed, false); assert.equal(m.abilityUsed, false); assert.equal(m.abilityResult, null); assert.equal(m.excluded.size, 0);
    for (const c of [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(c => !m.answer.includes(c)).slice(0,6)) m.guess(c);
    assert.equal(m.phase, 'lost'); assert.equal(m.useAbility(), null); assert.equal(m.requestHint(), null);
  }
  const ready = new RescueModel(); assert.equal(ready.useAbility(), null); assert.equal(ready.requestHint(), null);
});
