// Game rules stay independent of the DOM, animation clocks, and browser storage.
export const CASES = Object.freeze([
  { id: 'hotel', name: 'The Sedgewick', district: 'MIDTOWN', description: 'A quiet floor. Six very uninvited guests.', rows: 6, cols: 6, ghosts: 6, label: 'First call', species: ['slimer', 'puft'] },
  { id: 'library', name: 'After Hours', district: 'PUBLIC LIBRARY', description: 'The books are moving. Please keep your voice down.', rows: 7, cols: 6, ghosts: 8, label: 'Unusual activity', species: ['librarian', 'slimer', 'puft'] },
  { id: 'subway', name: 'Last Train', district: 'CITY HALL', description: 'Eleven signals below the city. Watch your step.', rows: 8, cols: 6, ghosts: 11, label: 'Heavy haunting', species: ['librarian', 'puft', 'slimer'] }
]);

export const ENTITIES = Object.freeze({
  slimer: { name: 'Slimer', type: 'CLASS V · FULL-ROAMING VAPOR', note: 'An appetite for trouble. And absolutely everything else.' },
  librarian: { name: 'Library ghost', type: 'CLASS IV · RESIDENT APPARITION', note: 'Still enforcing the quiet policy. Even after closing.' },
  puft: { name: 'Mini-Puft', type: 'CLASS V · MARSHMALLOW MENACE', note: 'Small, sweet, and an impressive property-damage risk.' }
});

export class GhostModel {
  constructor(caseIndex = 0, random = Math.random) {
    this.random = random;
    this.reset(caseIndex);
  }

  reset(caseIndex = this.caseIndex) {
    this.caseIndex = Number.isInteger(caseIndex) && CASES[caseIndex] ? caseIndex : 0;
    this.contract = CASES[this.caseIndex];
    this.phase = 'ready';
    this.strikes = 0;
    this.scans = 2;
    this.captured = 0;
    this.cells = Array.from({ length: this.contract.rows * this.contract.cols }, () => ({
      ghost: false, species: null, adjacent: 0, open: false,
      marked: false, confirmed: false, captured: false
    }));
  }

  neighbors(index) {
    const { rows, cols } = this.contract;
    const row = Math.floor(index / cols), col = index % cols;
    const result = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const y = row + dy, x = col + dx;
        if ((dx || dy) && x >= 0 && x < cols && y >= 0 && y < rows) result.push(y * cols + x);
      }
    }
    return result;
  }

  seed(first) {
    const safe = new Set([first, ...this.neighbors(first)]);
    const available = this.cells.map((_, i) => i).filter(i => !safe.has(i));
    // Fisher-Yates gives each eligible room an equal chance; the entire first
    // room's neighborhood is safe, so the first click opens useful evidence.
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.max(0, Math.floor(this.random() * (i + 1))));
      [available[i], available[j]] = [available[j], available[i]];
    }
    available.slice(0, this.contract.ghosts).forEach((index, n) => {
      this.cells[index].ghost = true;
      this.cells[index].species = this.contract.species[n % this.contract.species.length];
    });
    this.cells.forEach((cell, index) => {
      cell.adjacent = this.neighbors(index).filter(i => this.cells[i].ghost).length;
    });
    this.phase = 'active';
  }

  revealSafe(index) {
    const changed = [], queue = [index], visited = new Set();
    while (queue.length) {
      const next = queue.pop();
      if (visited.has(next)) continue;
      visited.add(next);
      const cell = this.cells[next];
      if (cell.open || cell.ghost || cell.marked) continue;
      cell.open = true;
      changed.push(next);
      if (cell.adjacent === 0) queue.push(...this.neighbors(next));
    }
    return changed;
  }

  disturb() {
    this.strikes++;
    if (this.strikes >= 3) this.phase = 'lost';
  }

  act(mode, index) {
    const cell = this.cells[index];
    if (!Number.isInteger(index) || !cell || !['investigate', 'mark', 'trap', 'scan'].includes(mode)
      || this.phase === 'won' || this.phase === 'lost') return { type: 'ignored', changed: [] };
    if (this.phase === 'ready') {
      if (mode !== 'investigate') return { type: 'start', changed: [] };
      this.seed(index);
    }

    if (cell.captured) return { type: 'secured', changed: [] };
    if (mode === 'mark') {
      if (cell.open || cell.confirmed) return { type: 'known', changed: [] };
      cell.marked = !cell.marked;
      return { type: cell.marked ? 'marked' : 'unmarked', changed: [index] };
    }
    if (mode === 'investigate') {
      if (cell.confirmed) return { type: 'confirmed', changed: [] };
      if (cell.marked) return { type: 'marked-room', changed: [] };
      if (cell.open) return this.chord(index);
      if (cell.ghost) {
        cell.confirmed = true;
        this.disturb();
        return { type: 'disturbed', changed: [index] };
      }
      return { type: 'revealed', changed: this.revealSafe(index) };
    }
    if (mode === 'scan') {
      if (cell.open || cell.confirmed) return { type: 'known', changed: [] };
      if (this.scans <= 0) return { type: 'no-scans', changed: [] };
      this.scans--;
      cell.marked = false;
      if (cell.ghost) {
        cell.confirmed = true;
        return { type: 'signal', changed: [index] };
      }
      return { type: 'scan-clear', changed: this.revealSafe(index) };
    }
    if (cell.open) return { type: 'known', changed: [] };
    cell.marked = false;
    if (cell.ghost) {
      cell.captured = cell.confirmed = true;
      this.captured++;
      if (this.captured === this.contract.ghosts) this.phase = 'won';
      // Capturing never alters ghost placement or counts. Numbers are the
      // investigation's original evidence, including already-contained sites.
      return { type: 'captured', changed: [index], species: cell.species };
    }
    this.disturb();
    return { type: 'empty-trap', changed: this.revealSafe(index) };
  }

  chord(index) {
    const neighbors = this.neighbors(index);
    const marked = neighbors.filter(i => this.cells[i].marked || this.cells[i].confirmed).length;
    const closed = neighbors.filter(i => !this.cells[i].open && !this.cells[i].marked && !this.cells[i].confirmed);
    if (!closed.length) return { type: 'known', changed: [] };
    if (marked !== this.cells[index].adjacent) return { type: 'clue', changed: [], remaining: Math.max(0, this.cells[index].adjacent - marked) };
    const changed = new Set();
    let disturbed = false;
    for (const next of closed) {
      if (this.phase !== 'active') break;
      const result = this.act('investigate', next);
      result.changed.forEach(i => changed.add(i));
      if (result.type === 'disturbed') disturbed = true;
    }
    return { type: disturbed ? 'disturbed' : 'revealed', changed: [...changed] };
  }

  get stars() { return this.phase === 'won' ? 3 - this.strikes : 0; }
}
