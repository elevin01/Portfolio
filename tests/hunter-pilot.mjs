// A greedy pilot for solvability checks: it reuses the model's own dodging reflexes
// and additionally steers toward plates when the lane ahead is clear.
export function pilot(model) {
  if (model.phase === 'rest') model.continue();
  if (model.phase !== 'playing') return;
  const p = model.p;
  model.autopilot();
  if (p.lane === p.targetLane && model.godspeed <= 0) {
    const ahead = model.objects.filter(o => !o.done && o.z + o.len > p.z - 1 && o.z < p.z + 24);
    const hazardNear = ahead.some(o => o.cls !== 'pickup' && o.z < p.z + 16);
    const plate = ahead.find(o => (o.kind === 'plate' || o.kind === 'target') && Math.abs(o.lane - p.lane) === 1);
    if (!hazardNear && plate && !ahead.some(o => o.cls !== 'pickup' && o.lane === plate.lane)) model.moveLane(plate.lane - p.lane);
  }
  model.step();
}
