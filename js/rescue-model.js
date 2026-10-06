import { WORDS, ABILITIES } from './rescue-words.js';

// Original fan encounters; techniques are adapted for a word-rescue game.
export const MISSIONS = [
  { id: 'naruto', hero: 'Naruto', enemy: 'Pain', captive: 'Hinata', title: 'Break the gravity seal.', location: 'LEAF VILLAGE · CRATER', jutsu: 'Gravity seal', attack: 'Rasengan', color: '#ffba69', energy: '#80e8ff', intro: 'Pain has pinned Hinata inside a gravity seal. Break its inscription before the pressure takes over.', threat: ['The gravity field takes hold.', 'A receiver anchors the field.', 'The ground buckles beneath Hinata.', 'The pressure forces her lower.', 'Another receiver locks into place.', 'The seal is almost complete.', 'The gravity seal closes.'], words: WORDS },
  { id: 'sasuke', hero: 'Sasuke', enemy: 'Orochimaru', captive: 'Sakura', title: 'Unravel the serpent seal.', location: 'HIDDEN HIDEOUT · BELOW GROUND', jutsu: 'Serpent seal', attack: 'Chidori', color: '#c5a3ff', energy: '#aaceff', intro: 'Orochimaru’s serpents are closing around Sakura. Cut through the inscription before the coils tighten.', threat: ['A serpent circles the seal.', 'The first coil closes.', 'A second serpent takes hold.', 'The coils climb higher.', 'The seal binds her arms.', 'Only one opening remains.', 'The serpent seal closes.'], words: WORDS },
  { id: 'sakura', hero: 'Sakura', enemy: 'Sasori', captive: 'Kankuro', title: 'Sever the puppet strings.', location: 'SAND HIDEOUT · PUPPET CHAMBER', jutsu: 'Puppet binding', attack: 'Chakra strike', color: '#ff9dae', energy: '#a6ffd4', intro: 'Sasori is pulling Kankuro into a puppet frame. Shatter its inscription before the last thread attaches.', threat: ['The puppet frame opens.', 'A thread catches his wrist.', 'The frame pulls him closer.', 'More strings take hold.', 'The wooden cage closes in.', 'The final thread descends.', 'The puppet binding is complete.'], words: WORDS },
  { id: 'kakashi', hero: 'Kakashi', enemy: 'Zabuza', captive: 'Naruto', title: 'Split the water prison.', location: 'LAND OF WAVES · RIVER CROSSING', jutsu: 'Water prison', attack: 'Lightning blade', color: '#8fdbed', energy: '#e0faff', intro: 'Zabuza has Naruto trapped in a water prison. Fracture its inscription before the water closes in.', threat: ['Water gathers around Naruto.', 'The current starts to circle.', 'The prison grows denser.', 'The water rises around him.', 'The current pulls inward.', 'He is almost out of air.', 'The water prison seals.'], words: WORDS }
];

export const MAX_MISSES = 6;
export class RescueModel {
  constructor() { this.excluded = new Set(); this.phase = 'ready'; this.guessed = new Set(); this.misses = 0; }
  start(mission, word) {
    if (!MISSIONS.some(m => m.id === mission) || !word || !/^[A-Z]+$/.test(word[0]) || !word[1]) throw new Error('Invalid rescue mission');
    this.mission = mission; this.answer = word[0]; this.clue = word[1];
    this.association = word[2]; this.sketch = word[3];
    this.hintUsed = false; this.abilityUsed = false; this.abilityResult = null; this.excluded = new Set();
    this.guessed = new Set(); this.misses = 0; this.phase = 'playing';
  }
  guess(input) {
    if (this.phase !== 'playing' || typeof input !== 'string' || !/^[a-z]$/i.test(input)) return 'ignored';
    const letter = input.toUpperCase();
    if (this.guessed.has(letter) || this.excluded.has(letter)) return 'ignored';
    this.guessed.add(letter);
    const correct = this.answer.includes(letter);
    if (!correct) this.misses++;
    if ([...this.answer].every(c => this.guessed.has(c))) this.phase = 'won';
    else if (this.misses >= MAX_MISSES) this.phase = 'lost';
    return correct ? 'hit' : 'miss';
  }
  requestHint() {
    if (this.phase !== 'playing' || this.hintUsed) return null;
    this.hintUsed = true;
    return this.clue;
  }
  useAbility(random = Math.random) {
    if (this.phase !== 'playing' || this.abilityUsed) return null;
    const { kind } = ABILITIES[this.mission];
    let result;
    if (kind === 'letter') {
      const missing = [...new Set(this.answer)].filter(c => !this.guessed.has(c));
      const letter = missing[Math.floor(random() * missing.length)];
      this.guess(letter);
      result = { kind, letter };
    } else if (kind === 'eliminate') {
      const candidates = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(c => !this.answer.includes(c) && !this.guessed.has(c));
      const letters = [];
      while (letters.length < 3 && candidates.length) letters.push(...candidates.splice(Math.floor(random() * candidates.length), 1));
      letters.forEach(c => this.excluded.add(c));
      result = { kind, letters };
    } else if (kind === 'association') result = { kind, text: this.association };
    else result = { kind, sketch: this.sketch };
    this.abilityUsed = true; this.abilityResult = result;
    return result;
  }
  get progress() {
    if (!this.answer) return 0;
    const letters = [...new Set(this.answer)];
    return letters.filter(c => this.guessed.has(c)).length / letters.length;
  }
}

// One shuffled bag per encounter. All heroes use the same mixed pool; no repeats within a bag.
export class WordDeck {
  constructor(random = Math.random) { this.random = random; this.bags = new Map(); this.last = new Map(); }
  next(mission) {
    let bag = this.bags.get(mission.id);
    if (!bag?.length) {
      bag = [...mission.words];
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag.at(-1)?.[0] === this.last.get(mission.id)) [bag[0], bag[bag.length - 1]] = [bag.at(-1), bag[0]];
      this.bags.set(mission.id, bag);
    }
    const word = bag.pop(); this.last.set(mission.id, word[0]); return word;
  }
}
