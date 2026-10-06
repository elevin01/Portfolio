import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, MAX_MISSES, RescueModel, WordDeck } from '../js/rescue-model.js';

const started = (answer='RAMEN') => { const m = new RescueModel(); m.start('naruto', [answer, 'Test clue']); return m; };
test('correct letters reveal every occurrence; invalid and repeated guesses are free', () => {
  const m = started('CHAKRA');
  assert.equal(m.guess('a'), 'hit');
  assert.equal(m.progress, 1/5);
  assert.equal([...m.answer].filter(c=>m.guessed.has(c)).length, 2);
  assert.equal(m.guess('A'), 'ignored');
  for (const invalid of ['', 'ab', '1', ' ', 'é', null, undefined, {}]) assert.equal(m.guess(invalid), 'ignored');
  assert.equal(m.guessed.size, 1); assert.equal(m.misses, 0);
  assert.equal(m.guess('z'), 'miss'); assert.equal(m.guess('Z'), 'ignored'); assert.equal(m.misses, 1);
});
test('six distinct misses seal the prison and lock all further guesses', () => {
  const m = started();
  for (const letter of 'BCDFGH') m.guess(letter);
  assert.equal(m.misses, MAX_MISSES); assert.equal(m.phase, 'lost');
  for (const letter of 'RAMENI') assert.equal(m.guess(letter), 'ignored');
  assert.equal(m.guessed.size, 6); assert.equal(m.progress, 0);
});
test('a last-chance rescue wins and cannot turn into a loss or count twice', () => {
  const m = started();
  for (const letter of 'BCDFG') m.guess(letter);
  for (const letter of 'RAMEN') m.guess(letter);
  assert.equal(m.phase, 'won'); assert.equal(m.misses, 5); assert.equal(m.progress, 1);
  assert.equal(m.guess('Z'), 'ignored'); assert.equal(m.guess('N'), 'ignored'); assert.equal(m.phase, 'won');
});
test('starting another encounter clears the previous word and guesses', () => {
  const m = started(); m.guess('Z'); m.guess('A');
  m.start('sasuke', ['SWORD','A long blade.']);
  assert.equal(m.mission,'sasuke'); assert.equal(m.answer,'SWORD'); assert.equal(m.phase,'playing');
  assert.equal(m.misses,0); assert.equal(m.guessed.size,0); assert.equal(m.progress,0);
  assert.throws(()=>m.start('missing',['A','clue']));
  assert.throws(()=>m.start('naruto',['bad word','clue']));
});
test('every encounter has distinct roles, seven restraint descriptions, and playable clues', () => {
  const pairs = new Set();
  for (const mission of MISSIONS) {
    assert.equal(new Set([mission.hero,mission.enemy,mission.captive]).size,3);
    pairs.add(`${mission.enemy}/${mission.captive}`);
    assert.equal(mission.threat.length,MAX_MISSES+1);
    assert.equal(new Set(mission.words.map(w=>w[0])).size,mission.words.length);
    for (const word of mission.words) {
      assert.match(word[0],/^[A-Z]{3,10}$/); assert.ok(word[1].length>10);
      const m = new RescueModel(); m.start(mission.id,word);
      for (const c of new Set(word[0])) m.guess(c);
      assert.equal(m.phase,'won'); assert.equal(m.misses,0);
    }
  }
  assert.equal(pairs.size,MISSIONS.length);
});
test('word bags do not repeat within a cycle, at cycle boundaries, or interfere with another mission', () => {
  let seed=42; const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  const deck = new WordDeck(random);
  for (const mission of MISSIONS) {
    let previous;
    for (let cycle=0;cycle<5;cycle++) {
      const words=[];
      for (let i=0;i<mission.words.length;i++) {
        const word=deck.next(mission)[0]; assert.notEqual(word,previous); previous=word; words.push(word);
      }
      assert.equal(new Set(words).size,mission.words.length);
    }
  }
});
