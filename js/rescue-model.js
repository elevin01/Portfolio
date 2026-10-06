// Original fan encounters; techniques are adapted for a word-rescue game.
export const MISSIONS = [
  { id: 'naruto', hero: 'Naruto', enemy: 'Pain', captive: 'Hinata', title: 'Break the gravity seal.', location: 'LEAF VILLAGE · CRATER', jutsu: 'Gravity seal', attack: 'Rasengan', color: '#ffba69', energy: '#80e8ff', intro: 'Pain has pinned Hinata inside a gravity seal. Break its inscription before the pressure takes over.', threat: ['The gravity field takes hold.', 'A receiver anchors the field.', 'The ground buckles beneath Hinata.', 'The pressure forces her lower.', 'Another receiver locks into place.', 'The seal is almost complete.', 'The gravity seal closes.'], words: [
    ['CHAKRA', 'The energy a shinobi channels into a technique.'], ['RAMEN', 'Naruto’s favorite bowl of comfort food.'], ['SHADOW', 'Naruto’s signature clones take their name from this.'], ['VILLAGE', 'A shinobi’s home, hidden among the leaves.'], ['COURAGE', 'Acting even when you are afraid.'], ['PROMISE', 'A commitment you refuse to break.'], ['HOKAGE', 'The title of the Hidden Leaf’s leader.'], ['RASENGAN', 'A spinning sphere of chakra in Naruto’s palm.'], ['SAGE', 'A wise master; also the name of Naruto’s nature-energy mode.'], ['KUNAI', 'A short, pointed ninja blade.'], ['SUMMON', 'Call an ally to your side with a technique.'], ['BONDS', 'The connections that keep friends together.'] ] },
  { id: 'sasuke', hero: 'Sasuke', enemy: 'Orochimaru', captive: 'Sakura', title: 'Unravel the serpent seal.', location: 'HIDDEN HIDEOUT · BELOW GROUND', jutsu: 'Serpent seal', attack: 'Chidori', color: '#c5a3ff', energy: '#aaceff', intro: 'Orochimaru’s serpents are closing around Sakura. Cut through the inscription before the coils tighten.', threat: ['A serpent circles the seal.', 'The first coil closes.', 'A second serpent takes hold.', 'The coils climb higher.', 'The seal binds her arms.', 'Only one opening remains.', 'The serpent seal closes.'], words: [
    ['LIGHTNING', 'The element crackling through Sasuke’s Chidori.'], ['SERPENT', 'Another name for a snake.'], ['CHIDORI', 'Sasuke’s lightning technique, named for a thousand birds.'], ['SHARINGAN', 'The Uchiha clan’s distinctive red eye ability.'], ['SWORD', 'A long blade carried in a sheath.'], ['ESCAPE', 'Find a way out of captivity.'], ['BROTHER', 'Itachi’s family relationship to Sasuke.'], ['UCHIHA', 'Sasuke and Itachi’s clan.'], ['PURPLE', 'The color between red and blue.'], ['SILENCE', 'The absence of sound.'], ['STRIKE', 'Deliver a sudden, precise attack.'], ['RESOLVE', 'A firm determination to see something through.'] ] },
  { id: 'sakura', hero: 'Sakura', enemy: 'Sasori', captive: 'Kankuro', title: 'Sever the puppet strings.', location: 'SAND HIDEOUT · PUPPET CHAMBER', jutsu: 'Puppet binding', attack: 'Chakra strike', color: '#ff9dae', energy: '#a6ffd4', intro: 'Sasori is pulling Kankuro into a puppet frame. Shatter its inscription before the last thread attaches.', threat: ['The puppet frame opens.', 'A thread catches his wrist.', 'The frame pulls him closer.', 'More strings take hold.', 'The wooden cage closes in.', 'The final thread descends.', 'The puppet binding is complete.'], words: [
    ['PUPPET', 'A figure controlled by strings or a puppeteer.'], ['THREAD', 'A thin strand connecting a puppet to its controller.'], ['POISON', 'A harmful substance a medic may need to counter.'], ['ANTIDOTE', 'A treatment that counteracts a poison.'], ['HEAL', 'Help an injury recover.'], ['STRENGTH', 'The power behind Sakura’s devastating punches.'], ['MEDIC', 'A teammate trained to treat the wounded.'], ['BLOSSOM', 'A flower opening; part of Sakura’s cherry-flower namesake.'], ['SAND', 'Fine grains covering a desert.'], ['SHATTER', 'Break something into many small pieces.'], ['SHIELD', 'A barrier used to protect someone.'], ['PRECISION', 'The accuracy needed to hit exactly the right spot.'] ] },
  { id: 'kakashi', hero: 'Kakashi', enemy: 'Zabuza', captive: 'Naruto', title: 'Split the water prison.', location: 'LAND OF WAVES · RIVER CROSSING', jutsu: 'Water prison', attack: 'Lightning blade', color: '#8fdbed', energy: '#e0faff', intro: 'Zabuza has Naruto trapped in a water prison. Fracture its inscription before the water closes in.', threat: ['Water gathers around Naruto.', 'The current starts to circle.', 'The prison grows denser.', 'The water rises around him.', 'The current pulls inward.', 'He is almost out of air.', 'The water prison seals.'], words: [
    ['WATER', 'The element forming Zabuza’s prison.'], ['MIST', 'Tiny droplets that make distant objects hard to see.'], ['BRIDGE', 'A structure that carries a path across a river.'], ['TEAMWORK', 'Working together to achieve a shared goal.'], ['COPY', 'To reproduce something; part of Kakashi’s nickname.'], ['MASK', 'A covering that hides part of a face.'], ['HOUNDS', 'Dogs that can help track a scent.'], ['BELLS', 'The small ringing objects used in Kakashi’s team test.'], ['CURRENT', 'The movement of water in a river.'], ['TRACK', 'Follow the trail left by someone.'], ['SENSEI', 'The Japanese title students use for their teacher.'], ['RESCUE', 'Save someone from danger.'] ] }
];

export const MAX_MISSES = 6;
export class RescueModel {
  constructor() { this.phase = 'ready'; this.guessed = new Set(); this.misses = 0; }
  start(mission, word) {
    if (!MISSIONS.some(m => m.id === mission) || !word || !/^[A-Z]+$/.test(word[0]) || !word[1]) throw new Error('Invalid rescue mission');
    this.mission = mission; this.answer = word[0]; this.clue = word[1];
    this.guessed = new Set(); this.misses = 0; this.phase = 'playing';
  }
  guess(input) {
    if (this.phase !== 'playing' || typeof input !== 'string' || !/^[a-z]$/i.test(input)) return 'ignored';
    const letter = input.toUpperCase();
    if (this.guessed.has(letter)) return 'ignored';
    this.guessed.add(letter);
    const correct = this.answer.includes(letter);
    if (!correct) this.misses++;
    if ([...this.answer].every(c => this.guessed.has(c))) this.phase = 'won';
    else if (this.misses >= MAX_MISSES) this.phase = 'lost';
    return correct ? 'hit' : 'miss';
  }
  get progress() {
    if (!this.answer) return 0;
    const letters = [...new Set(this.answer)];
    return letters.filter(c => this.guessed.has(c)).length / letters.length;
  }
}

// One shuffled bag per encounter. No repeats until all twelve clues are played.
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
