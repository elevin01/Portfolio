// Stage data and track generation for the Nen runner. Distances are in meters.
// Patterns are hand-authored so every stretch is passable with lanes, jumps, and slides;
// hazards marked hidden are concealed with In and only readable through Gyo.

export const STAGES = Object.freeze([
  { id: 'tunnel', name: 'Zaban Tunnel', phase: 'PHASE 1', examiner: 'Satotz', length: 450, speed: 13.5, fog: 0, hidden: 0, pursuer: false, applicants: [404, 371],
    intro: 'Follow the examiner. The finish line is not announced.', clear: 'The tunnel ends at a staircase. Satotz has not broken his stride once.' },
  { id: 'wetlands', name: 'Numere Wetlands', phase: 'PHASE 1 · SWINDLERS SWAMP', examiner: 'Satotz', length: 500, speed: 14.5, fog: 1, hidden: 0.4, pursuer: true, applicants: [371, 148],
    intro: 'Fog. Creatures that imitate applicants. Use Gyo to see what the mist conceals.', clear: 'Out of the fog. The applicants are fewer, and Hisoka is smiling.' },
  { id: 'forest', name: 'Visca Forest', phase: 'PHASE 2', examiner: 'Buhara & Menchi', length: 320, speed: 15, fog: 0, hidden: 0.1, pursuer: true, applicants: [148, 42],
    intro: 'Buhara wants a whole roast pig. The pigs disagree. Then Menchi wants an egg from the ravine.', clear: 'Jumped into the ravine, caught a Spider Eagle egg, rode the updraft back up. Menchi approved.' },
  { id: 'tower', name: 'Trick Tower', phase: 'PHASE 3', examiner: 'Lippo', length: 500, speed: 15.5, fog: 0, hidden: 0.22, pursuer: true, applicants: [42, 25],
    intro: 'Seventy-two hours to reach the bottom. Hidden floors. Majority rules.', clear: 'The tower doors open with hours to spare.' },
  { id: 'island', name: 'Zevil Island', phase: 'PHASE 4', examiner: 'Khara', length: 550, speed: 16.5, fog: 0, hidden: 0.28, pursuer: true, quota: 6, applicants: [25, 9],
    intro: 'Six points of plates. Your target’s plate is worth three. Someone is hunting yours.', clear: 'Six points. The boat is waiting.' }
]);

// Obstacle classes: low → jump, high → slide, gap → jump across, wall → change lane,
// soft → a stumble (costs aura, attracts Hisoka), pickup → collect.
export const KINDS = Object.freeze({
  applicant: { cls: 'soft', name: 'another applicant' }, fallen: { cls: 'low', name: 'a collapsed applicant' },
  luggage: { cls: 'low', name: 'dropped luggage' }, pipe: { cls: 'high', name: 'a low pipe' }, pillar: { cls: 'wall', name: 'a tunnel pillar' },
  log: { cls: 'low', name: 'a rotten log' }, vine: { cls: 'high', name: 'hanging vines' }, tree: { cls: 'wall', name: 'a swamp tree' },
  mud: { cls: 'gap', name: 'a mud pool' }, hippo: { cls: 'wall', name: 'a hippo’s jaws' }, lugger: { cls: 'soft', name: 'a Noggin Lugger' },
  spikes: { cls: 'low', name: 'a spike row' }, blade: { cls: 'high', name: 'a swinging blade' }, door: { cls: 'wall', name: 'a tower door' },
  trapdoor: { cls: 'gap', name: 'a trapdoor' }, trunk: { cls: 'low', name: 'a fallen trunk' }, bees: { cls: 'high', name: 'Ponzu’s bees' },
  branch: { cls: 'high', name: 'a low branch' }, boulder: { cls: 'wall', name: 'a boulder' }, ravine: { cls: 'gap', name: 'a ravine' },
  hunter: { cls: 'soft', name: 'the applicant hunting you' },
  pig: { cls: 'soft', name: 'a charging Great Stamp' }, stump: { cls: 'low', name: 'a tree stump' }, web: { cls: 'high', name: 'a Spider Eagle web' },
  cliff: { cls: 'gap', name: 'the ravine at Split Mountain' }, egg: { cls: 'pickup', name: 'a Spider Eagle egg' },
  plate: { cls: 'pickup', name: 'a plate' }, target: { cls: 'pickup', name: 'your target’s plate' }, juice: { cls: 'pickup', name: 'Tonpa’s juice' },
  wager: { cls: 'pickup', name: 'Leroute’s wager' }
});

export const FAMOUS_PLATES = Object.freeze({
  405: 'Gon', 99: 'Killua', 404: 'Kurapika', 403: 'Leorio', 44: 'Hisoka', 16: 'Tonpa', 294: 'Hanzo', 301: 'Gittarackur', 53: 'Pokkle', 246: 'Ponzu', 118: 'Geretta', 191: 'Bodoro'
});

// Each pattern: items [dz, lanes, kind] plus the pattern's total length. `tier` gates harder sets.
const PATTERNS = {
  tunnel: [
    { tier: 0, len: 10, items: [[0, [1], 'applicant']] },
    { tier: 0, len: 12, items: [[0, [0], 'applicant'], [0, [2], 'applicant']] },
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'fallen']] },
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'pipe']] },
    { tier: 0, len: 14, items: [[0, [1], 'pillar']] },
    { tier: 1, len: 18, items: [[0, [0], 'pillar'], [0, [1], 'luggage'], [12, [2], 'applicant']] },
    { tier: 1, len: 20, items: [[0, [0, 1], 'pipe'], [0, [2], 'applicant'], [14, [1, 2], 'fallen']] },
    { tier: 1, len: 32, items: [[0, [1], 'applicant'], [20, [0], 'pillar'], [20, [2], 'pillar']] },
    { tier: 2, len: 26, items: [[0, [0, 1, 2], 'pipe'], [12, [0, 1], 'pillar'], [24, [1, 2], 'fallen']] },
    { tier: 2, len: 24, items: [[0, [0], 'applicant'], [0, [2], 'applicant'], [11, [0, 1, 2], 'fallen'], [22, [1], 'pillar']] }
  ],
  wetlands: [
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'log']] },
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'vine']] },
    { tier: 0, len: 12, items: [[0, [1], 'tree']] },
    { tier: 0, len: 12, items: [[0, [0, 1, 2], 'mud']] },
    { tier: 0, len: 14, items: [[0, [0], 'lugger'], [0, [2], 'tree']] },
    { tier: 1, len: 18, items: [[0, [0, 1], 'tree'], [12, [1, 2], 'log']] },
    { tier: 1, len: 20, items: [[0, [1], 'hippo'], [12, [0, 1, 2], 'vine']] },
    { tier: 1, len: 20, items: [[0, [0], 'lugger'], [0, [1], 'lugger'], [12, [0, 1, 2], 'mud']] },
    { tier: 2, len: 26, items: [[0, [0, 1, 2], 'log'], [12, [0], 'hippo'], [12, [2], 'tree'], [24, [0, 1, 2], 'vine']] },
    { tier: 2, len: 26, items: [[0, [1, 2], 'hippo'], [13, [0, 1, 2], 'mud'], [25, [0], 'tree']] }
  ],
  forest: [
    { tier: 0, len: 12, items: [[0, [1], 'pig']] },
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'stump']] },
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'web']] },
    { tier: 0, len: 12, items: [[0, [0], 'pig'], [0, [2], 'pig']] },
    { tier: 1, len: 24, items: [[0, [1], 'pig'], [14, [0, 1, 2], 'web']] },
    { tier: 1, len: 24, items: [[0, [0], 'pig'], [14, [0, 1, 2], 'stump']] },
    { tier: 1, len: 26, items: [[0, [0, 1], 'pig'], [16, [2], 'pig']] },
    { tier: 2, len: 30, items: [[0, [0], 'pig'], [0, [2], 'pig'], [14, [0, 1, 2], 'stump'], [26, [0, 1, 2], 'web']] }
  ],
  tower: [
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'spikes']] },
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'blade']] },
    { tier: 0, len: 12, items: [[0, [0, 1, 2], 'trapdoor']] },
    { tier: 0, len: 14, items: [[0, [0, 1], 'door']] },
    { tier: 0, len: 14, items: [[0, [1, 2], 'door']] },
    { tier: 1, len: 20, items: [[0, [0], 'door'], [0, [2], 'door'], [12, [0, 1, 2], 'spikes']] },
    { tier: 1, len: 20, items: [[0, [0, 1, 2], 'blade'], [12, [1], 'door'], [12, [0], 'spikes']] },
    { tier: 1, len: 22, items: [[0, [0, 1, 2], 'trapdoor'], [12, [0, 1], 'door']] },
    { tier: 2, len: 28, items: [[0, [1, 2], 'door'], [12, [0, 1, 2], 'blade'], [24, [0, 1, 2], 'trapdoor']] },
    { tier: 2, len: 28, items: [[0, [0, 1, 2], 'spikes'], [11, [0], 'door'], [11, [1], 'door'], [23, [0, 1, 2], 'blade']] }
  ],
  island: [
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'trunk']] },
    { tier: 0, len: 10, items: [[0, [0, 1, 2], 'branch']] },
    { tier: 0, len: 12, items: [[0, [1], 'boulder'], [0, [2], 'hunter']] },
    { tier: 0, len: 12, items: [[0, [0, 1, 2], 'ravine']] },
    { tier: 1, len: 18, items: [[0, [0, 1, 2], 'bees'], [12, [0], 'boulder'], [12, [2], 'boulder']] },
    { tier: 1, len: 20, items: [[0, [1], 'hunter'], [11, [0, 1, 2], 'trunk']] },
    { tier: 1, len: 22, items: [[0, [0, 1], 'boulder'], [12, [0, 1, 2], 'ravine']] },
    { tier: 2, len: 28, items: [[0, [0, 1, 2], 'branch'], [12, [0], 'boulder'], [12, [1], 'hunter'], [24, [0, 1, 2], 'ravine']] },
    { tier: 2, len: 28, items: [[0, [1, 2], 'boulder'], [12, [0, 1, 2], 'bees'], [24, [0], 'boulder'], [24, [2], 'trunk']] }
  ]
};

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let n = Math.imul(value ^ value >>> 15, 1 | value);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

const HIDEABLE = new Set(['lugger', 'hippo', 'log', 'vine', 'spikes', 'trapdoor', 'branch', 'bees', 'trunk', 'stump', 'web']);
const GAP_LENGTH = { mud: 4, trapdoor: 3.6, ravine: 4.4, cliff: 9.5 };

// Builds one stage's worth of obstacles and pickups starting at `start` meters.
// `lap` raises the difficulty tier in Endless; `target` is the player's Phase 4 target number.
export function buildStage(stage, start, random, { lap = 0, target = 44, difficulty = 1 } = {}) {
  const objects = [];
  const pool = PATTERNS[stage.id];
  let z = start + 42;
  let id = 0;
  const end = start + stage.length;
  const plateNumbers = Object.keys(FAMOUS_PLATES).map(Number);
  let targetPlaced = 0;
  let lastPattern = -1;
  const TIPS = { low: 'JUMP', high: 'SLIDE', wall: 'SWITCH LANES', soft: 'SWITCH LANES' };
  const coached = new Set();
  const add = (zAt, lane, kind, extra = {}) => {
    if (zAt > end - 8) return;
    // The first hazard of each kind in a first tunnel run carries a coaching label.
    const cls = KINDS[kind].cls;
    if (stage.id === 'tunnel' && lap === 0 && TIPS[cls] && !coached.has(TIPS[cls])) { coached.add(TIPS[cls]); extra = { ...extra, tip: TIPS[cls] }; }
    objects.push({ id: `${stage.id}-${start}-${id++}`, z: zAt, lane, kind, cls: KINDS[kind].cls, len: GAP_LENGTH[kind] || 0.8, hidden: false, done: false, ...extra });
  };
  // Phase 2 keeps its last stretch clear for the leap at Split Mountain.
  const stop = stage.id === 'forest' ? end - 72 : end - 30;
  while (z < stop) {
    const progress = (z - start) / stage.length;
    const tier = Math.min(2, Math.floor(progress * 3) + Math.min(lap, 2));
    const candidates = pool.map((p, i) => [p, i]).filter(([p, i]) => p.tier <= tier && i !== lastPattern && (tier === 0 || p.tier >= tier - 1));
    const [pattern, index] = candidates[Math.floor(random() * candidates.length)];
    lastPattern = index;
    for (const [dz, lanes, kind] of pattern.items) {
      const hidden = HIDEABLE.has(kind) && random() < stage.hidden * (lap ? 1.25 : 1);
      for (const lane of lanes) {
        const extra = { hidden };
        if (kind === 'applicant' || kind === 'hunter') { extra.vz = stage.speed * 0.45; extra.zMax = z + dz + 3; extra.number = 1 + Math.floor(random() * 404); }
        // Great Stamps lunge at the runner once it is close, closing eight meters.
        if (kind === 'pig') { extra.vz = -7; extra.zMin = z + dz - 8; }
        add(z + dz, lane, kind, extra);
      }
    }
    z += pattern.len;
    // Breathing room shrinks with difficulty, but always leaves time to read the next set.
    const rest = Math.max(stage.id === 'forest' ? 18 : 9, (tier === 0 ? 16 : tier === 1 ? 13 : 11) / difficulty) + random() * 5;
    const restStart = z + 2;
    z += rest;
    // Pickups live in the rest stretches, away from the authored hazards.
    const roll = random();
    const lane = Math.floor(random() * 3);
    if (stage.id === 'tunnel' && roll < 0.18) add(restStart + rest * 0.5, lane, 'juice');
    else if (stage.id === 'tower' && roll < 0.14) add(restStart + rest * 0.5, lane, 'wager');
    else if (roll < (stage.id === 'island' ? 0.62 : 0.72)) {
      const count = 3 + Math.floor(random() * 3);
      for (let n = 0; n < count && restStart + 1.6 * n < z - 3; n++) {
        const famous = random() < 0.08;
        add(restStart + 1.6 * n, lane, 'plate', { number: famous ? plateNumbers[Math.floor(random() * plateNumbers.length)] : 1 + Math.floor(random() * 404) });
      }
    }
    if (stage.id === 'island' && progress > 0.2 + targetPlaced * 0.3 && targetPlaced < 2) {
      add(restStart + rest * 0.6, (lane + 1) % 3, 'target', { number: target });
      targetPlaced++;
    }
  }
  if (stage.id === 'forest') {
    // Menchi's test: the ravine is too wide for one jump. An egg hangs over two of the lanes;
    // catching one mid-air brings the updraft that carries you to the far side.
    const edge = end - 30;
    const bare = Math.floor(random() * 3);
    for (const lane of [0, 1, 2]) add(edge, lane, 'cliff');
    for (const lane of [0, 1, 2]) if (lane !== bare) add(edge + 3, lane, 'egg', { tip: 'EGG ↑' });
  }
  return objects;
}
