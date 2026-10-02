import { CROSSING_MODES, crossingMode } from './crossing-model.js';

export const CROSSING_STORAGE_KEY = 'portfolio.slime-crossing.v2';
const LEGACY_KEY = 'portfolio.slime-crossing.v1';

function decode(value) {
  try {
    const result = JSON.parse(value);
    return result && typeof result === 'object' && !Array.isArray(result) ? result : null;
  } catch { return null; }
}

// Storage access is injected so restricted browsers and legacy records are testable.
export function loadCrossingRecords(read) {
  let saved = null, legacy = null;
  try { saved = decode(read(CROSSING_STORAGE_KEY)); if (!saved) legacy = decode(read(LEGACY_KEY)); } catch { /* Use fresh records. */ }
  const record = { selectedMode: crossingMode(saved?.selectedMode).id, sound: (saved || legacy)?.sound === true, modes: {} };
  for (const mode of Object.values(CROSSING_MODES)) {
    const old = saved?.modes?.[mode.id] || (mode.id === 'easy' ? legacy : null);
    const best = Number.isInteger(old?.best) && old.best >= 0 && old.best <= mode.finish ? old.best : 0;
    const fastest = best === mode.finish && Number.isFinite(old?.fastest) && old.fastest > 0 ? old.fastest : 0;
    record.modes[mode.id] = { best, fastest };
  }
  return record;
}

export function recordCrossing(record, game) {
  const previous = record.modes[game.mode.id];
  const best = Math.max(previous.best, game.furthest);
  const fastest = game.phase === 'won' && (!previous.fastest || game.elapsed < previous.fastest) ? game.elapsed : previous.fastest;
  if (best === previous.best && fastest === previous.fastest) return false;
  record.modes[game.mode.id] = { best, fastest };
  return true;
}
