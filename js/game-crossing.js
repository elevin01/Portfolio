import { CROSSING, SKILLS, CrossingModel, district } from './crossing-model.js';
import { CrossingRenderer } from './crossing-renderer.js';
import { crossingIcon as icon, crossingPreview } from './crossing-art.js';

const root = document.getElementById('gameCrossingPanel');
document.getElementById('crossingPreview').innerHTML = crossingPreview;
root.innerHTML = `
  <div class="crossing-masthead">
    <div><span class="crossing-eyebrow">RIMURU'S UNEXPECTED DETOUR</span><h4>City crossing<span>.</span></h4></div>
    <div class="crossing-top-tools">
      <div class="crossing-score"><strong id="crossingDistance">00</strong><span>/ 60 lanes</span></div>
      <button id="crossingSound" class="crossing-icon-button" aria-label="Enable sound" aria-pressed="false" title="Sound">${icon('sound')}</button>
      <button id="crossingPause" class="crossing-icon-button" aria-label="Pause crossing" title="Pause · P" disabled>${icon('pause')}</button>
    </div>
  </div>
  <div class="crossing-layout">
    <div class="crossing-stage">
      <canvas id="crossingCanvas" tabindex="0" aria-label="Slime NYC Crossing play area" aria-describedby="crossingInstructions">Move with arrow keys or WASD. Press 1 through 4 for your ultimate skills. Reach the portal at lane 60.</canvas>
      <div class="crossing-scene-label" aria-hidden="true"><span><i></i><span id="crossingDistrict">MIDTOWN</span></span><span>NYC · 02:14 AM</span></div>
      <div id="crossingToast" class="crossing-toast" aria-hidden="true"></div>
      <div id="crossingOverlay" class="crossing-overlay" data-phase="ready">
        <div class="crossing-message">
          <span id="crossingMessageTag" class="crossing-eyebrow">TENSURA × NEW YORK</span>
          <h5 id="crossingMessageTitle">Wrong world.<br>Right skill set.</h5>
          <p id="crossingMessageText">Get Rimuru across 60 lanes to the Tempest portal. Read the traffic. Make your opening.</p>
          <div id="crossingResultStats" class="crossing-result-stats" hidden></div>
          <button id="crossingPlay" class="crossing-primary">Make the crossing <span aria-hidden="true">↗</span></button>
          <button id="crossingNewRoute" class="crossing-secondary" hidden>New route</button>
          <span id="crossingMessageHint" class="crossing-message-hint">Four ultimate skills. One magicule reserve.</span>
        </div>
      </div>
    </div>
    <div class="crossing-console">
      <div class="crossing-route">
        <div class="crossing-route-heading"><span class="crossing-eyebrow">THE WAY HOME</span><span id="crossingBest">BEST 00</span></div>
        <div class="crossing-route-track"><i id="crossingRouteProgress"></i><b></b><b></b></div>
        <div class="crossing-stops"><span>Midtown</span><span>Bryant Park</span><span>East River</span></div>
      </div>
      <div class="crossing-energy">
        <div><span>${icon('crystal')} MAGICULES</span><strong id="crossingEnergyValue">100 <small>/ 100</small></strong></div>
        <div id="crossingEnergy" class="crossing-energy-track" role="meter" aria-label="Magicules" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div>
        <p>Advance to recharge. Crystals add +8.</p>
      </div>
      <div class="crossing-skill-heading crossing-eyebrow">ULTIMATE SKILLS <span>1 — 4</span></div>
      <div class="crossing-skills">
        ${Object.entries(SKILLS).map(([key, skill]) => `<button class="crossing-skill" data-skill="${key}" style="--skill-color:${skill.color}" disabled>
          <span class="crossing-skill-top">${icon(key)}<kbd>${skill.key}</kbd></span>
          <strong>${skill.name}</strong><span class="crossing-skill-action">${skill.action}</span>
          <span class="crossing-skill-state" data-skill-state>${skill.cost} magicules</span>
          <i class="crossing-skill-progress"></i>
        </button>`).join('')}
      </div>
      <div class="crossing-navigation">
        <div class="crossing-dpad" role="group" aria-label="Movement controls">
          ${[['left', -1, 0], ['up', 0, 1], ['down', 0, -1], ['right', 1, 0]].map(([name, dx, dy]) => `<button data-move="${name}" data-dx="${dx}" data-dy="${dy}" aria-label="Move ${name}" disabled>${icon('arrow')}</button>`).join('')}
        </div>
        <p id="crossingInstructions"><span class="crossing-keyboard-hint">Arrows / WASD to hop · 1–4 skills · P pause</span><span class="crossing-touch-hint">Swipe to hop. Tap the street to move up.</span></p>
      </div>
      <div class="crossing-tip"><span>FIELD NOTE 01</span><p>Sidewalks are safe. Take a breath, read the lanes, then commit.</p></div>
    </div>
  </div>
  <div class="crossing-bottom">
    <details id="crossingGuide" class="crossing-guide"><summary>How to cross <span aria-hidden="true">+</span></summary>
      <div>
        <p><strong>Reach the portal.</strong> Hop through 60 lanes from Midtown to the East River, then enter the glowing portal in the middle. Traffic ends the run on contact. There’s no time limit; sidewalks and park islands are safe places to plan.</p>
        <p><strong>Beelzebub · 20 magicules.</strong> Devours traffic and street obstacles within two tiles in the direction of your last move for 1.25 seconds. The small arrow by Rimuru shows your aim. Even a blocked move changes your aim.</p>
        <p><strong>Storm Dragon · 55 magicules.</strong> Summon Veldora. His storm clears traffic and obstacles across the next four lanes for 3 seconds, following you as you advance.</p>
        <p><strong>Raphael · 24 magicules.</strong> Accelerated thought makes traffic appear slower for 4.5 seconds while your hops stay quick. Trails show vehicle motion; ✓ and ! estimate whether an immediate hop is clear. Keep checking: a clear window can close.</p>
        <p><strong>Uriel · 28 magicules.</strong> A multilayer barrier repels traffic for 2.8 seconds. It protects Rimuru without clearing obstacles ahead.</p>
        <p><strong>Manage the reserve.</strong> New lanes restore 1.5 magicules; crystals add 8 and district arrivals add 15. Backtracking and waiting don’t refill it. Each skill also has its own cooldown. All four are available from the start.</p>
        <p><strong>Controls.</strong> Arrow keys, WASD, swipes, or the directional buttons move one tile. Tap the street or press Space to hop forward. Use 1–4 or the skill buttons to cast. P pauses. Switching tabs pauses automatically.</p>
      </div>
    </details>
    <button id="crossingRestart" class="crossing-restart">${icon('reset')} Restart route</button>
  </div>
  <p id="crossingStatus" class="visually-hidden" role="status" aria-live="polite"></p>`;

const byId = id => document.getElementById(id);
const canvas = byId('crossingCanvas');
const renderer = new CrossingRenderer(canvas);
const model = new CrossingModel();
const overlay = byId('crossingOverlay');
const play = byId('crossingPlay');
const pauseButton = byId('crossingPause');
const soundButton = byId('crossingSound');
const guide = byId('crossingGuide');
const status = byId('crossingStatus');
const toast = byId('crossingToast');
const skillButtons = [...root.querySelectorAll('[data-skill]')];
const moveButtons = [...root.querySelectorAll('[data-move]')];
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const storageKey = 'portfolio.slime-crossing.v1';
let record = { best: 0, fastest: 0, sound: false };
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved === 'object') record = {
    best: Number.isInteger(saved.best) && saved.best >= 0 && saved.best <= 60 ? saved.best : 0,
    fastest: Number.isFinite(saved.fastest) && saved.fastest > 0 ? saved.fastest : 0,
    sound: saved.sound === true
  };
} catch { /* Storage is optional. A private or restricted browser can still play. */ }
const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch { /* Keep records for this visit. */ } };
const text = (node, value) => { if (node.textContent !== String(value)) node.textContent = value; };
const pad = value => String(value).padStart(2, '0');
const formatTime = seconds => `${Math.floor(seconds / 60)}:${pad(Math.floor(seconds % 60))}`;

class CrossingSound {
  constructor() { this.context = null; this.voices = new Set(); }
  play(type, key) {
    if (!record.sound || !active || suspended || document.hidden) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      this.context ||= new Audio();
      this.context.resume().catch(() => {});
      const notes = type === 'cast' ? { beelzebub: [160, 48], veldora: [70, 160], raphael: [700, 1150], uriel: [480, 760] }[key]
        : { hop: [340, 510], pickup: [720, 1080], crash: [210, 70], win: [600, 1200], barrier: [320, 850], bump: [130, 100] }[type];
      if (!notes) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const now = this.context.currentTime;
      const duration = type === 'cast' ? 0.38 : type === 'hop' ? 0.07 : 0.18;
      oscillator.type = type === 'cast' && key === 'veldora' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(notes[0], now);
      oscillator.frequency.exponentialRampToValueAtTime(notes[1], now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(type === 'hop' ? 0.027 : 0.055, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain); gain.connect(this.context.destination);
      this.voices.add(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices.delete(oscillator); };
      oscillator.start(now); oscillator.stop(now + duration + 0.02);
    } catch { /* Sound must never prevent gameplay. */ }
  }
  stop() {
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
    if (this.context?.state === 'running') this.context.suspend().catch(() => {});
  }
}

const sound = new CrossingSound();
let active = false;
let suspended = false;
let frame = 0;
let previousTime = null;
let accumulator = 0;
let hudAt = 0;
let toastUntil = 0;
let resultAt = 0;
let pointer = null;
let shownPhase = '';

function say(message, color = '') {
  text(toast, message);
  toast.style.setProperty('--toast-color', color || '#ceebf2');
  toastUntil = renderer.time + 2.7;
  toast.classList.add('is-visible');
  text(status, message);
}

function events() {
  const pending = model.drainEvents();
  renderer.accept(pending, motion.matches);
  for (const event of pending) {
    if (['hop', 'pickup', 'crash', 'win', 'cast', 'bump'].includes(event.type)) sound.play(event.type, event.key);
    if (event.type === 'cast') {
      const copy = { beelzebub: 'Beelzebub · Devouring ahead', veldora: 'Veldora summoned · Make your opening', raphael: 'Raphael · Thought acceleration', uriel: 'Uriel · Multilayer barrier raised' };
      say(copy[event.key], SKILLS[event.key].color);
    } else if (event.type === 'unavailable') say(event.reason, '#ecc5a0');
    else if (event.type === 'pickup') say('+8 magicules · Reserve replenished');
    else if (event.type === 'district') say(`${event.name} · +15 magicules`, '#b1efc9');
    else if (event.type === 'begin') say('Sidewalks are safe. Your first crystal is straight ahead.');
    else if (event.type === 'bump') say('Path blocked. Step around it, or devour it.', '#ead1a9');
    else if (event.type === 'win' || event.type === 'crash') {
      resultAt = renderer.time + (motion.matches ? 0 : event.type === 'win' ? 0.75 : 0.35);
      if (model.furthest > record.best) record.best = model.furthest;
      if (event.type === 'win' && (!record.fastest || model.elapsed < record.fastest)) record.fastest = model.elapsed;
      save();
      text(status, event.type === 'win' ? `Portal reached in ${formatTime(model.elapsed)}. Welcome home, Rimuru.` : `Crossing ended at lane ${model.furthest}. Try the same route again, or generate a new route.`);
    }
  }
}

function refresh() {
  const playing = model.phase === 'playing';
  root.dataset.phase = model.phase;
  text(byId('crossingDistance'), pad(model.furthest));
  text(byId('crossingBest'), `BEST ${pad(Math.max(record.best, model.furthest))}`);
  text(byId('crossingDistrict'), district(model.player.row).toUpperCase());
  byId('crossingRouteProgress').style.transform = `scaleX(${model.furthest / 60})`;
  byId('crossingEnergyValue').firstChild.textContent = `${Math.floor(model.energy)} `;
  byId('crossingEnergy').setAttribute('aria-valuenow', Math.floor(model.energy));
  byId('crossingEnergy').firstElementChild.style.transform = `scaleX(${model.energy / 100})`;
  if (renderer.time > toastUntil) toast.classList.remove('is-visible');
  pauseButton.disabled = !['playing', 'paused'].includes(model.phase);
  pauseButton.setAttribute('aria-label', model.phase === 'paused' ? 'Resume crossing' : 'Pause crossing');
  pauseButton.setAttribute('aria-pressed', String(model.phase === 'paused'));
  soundButton.setAttribute('aria-pressed', String(record.sound));
  soundButton.setAttribute('aria-label', record.sound ? 'Mute sound' : 'Enable sound');
  for (const button of moveButtons) button.disabled = !playing;
  for (const button of skillButtons) {
    const key = button.dataset.skill, skill = SKILLS[key], state = model.skills[key];
    const available = !model.availability(key);
    button.disabled = !playing;
    button.setAttribute('aria-disabled', String(!available));
    button.dataset.state = state.active > 0 ? 'active' : state.cooldown > 0 ? 'charging' : model.energy < skill.cost ? 'empty' : 'ready';
    const label = state.active > 0 ? `Active · ${state.active.toFixed(1)}s` : state.cooldown > 0 ? `${Math.ceil(state.cooldown)}s recharge` : `${skill.cost} magicules`;
    text(button.querySelector('[data-skill-state]'), label);
    button.setAttribute('aria-label', `${skill.name}. ${skill.action}. Costs ${skill.cost} magicules. ${label}. Key ${skill.key}.`);
    button.style.setProperty('--skill-progress', state.active > 0 ? state.active / skill.duration : state.cooldown > 0 ? 1 - state.cooldown / skill.cooldown : 1);
  }
  const show = !playing && (model.phase === 'ready' || model.phase === 'paused' || renderer.time >= resultAt);
  overlay.hidden = !show;
  canvas.tabIndex = show ? -1 : 0;
  if (show && shownPhase !== model.phase) {
    shownPhase = model.phase;
    overlay.dataset.phase = model.phase;
    const tag = byId('crossingMessageTag'), title = byId('crossingMessageTitle'), description = byId('crossingMessageText');
    const hint = byId('crossingMessageHint'), stats = byId('crossingResultStats');
    const retry = byId('crossingNewRoute');
    stats.hidden = !['won', 'over'].includes(model.phase);
    retry.hidden = !['won', 'over', 'paused'].includes(model.phase);
    retry.textContent = model.phase === 'paused' ? 'Restart this route' : 'New route';
    if (model.phase === 'ready') {
      text(tag, 'TENSURA × NEW YORK'); title.innerHTML = 'Wrong world.<br>Right skill set.';
      text(description, 'Get Rimuru across 60 lanes to the Tempest portal. Read the traffic. Make your opening.');
      text(play, 'Make the crossing ↗');
      text(hint, 'Four ultimate skills. One magicule reserve.');
    } else if (model.phase === 'paused') {
      text(tag, 'THOUGHTS ON HOLD'); text(title, 'Take your time.');
      text(description, 'Your crossing, magicules, and skill timers are paused.');
      text(play, 'Continue crossing →'); text(hint, 'P also resumes your crossing.');
    } else {
      const won = model.phase === 'won';
      text(tag, won ? 'CONNECTION TO TEMPEST RESTORED' : `RAPHAEL'S REPORT · LANE ${model.furthest}`);
      text(title, won ? 'Welcome home.' : 'Another way through.');
      text(description, won ? 'Sixty lanes, one very unexpected detour. New York will remember this slime.' : 'Even a Demon Lord needs a crossing strategy. Try a new opening, or let an ultimate skill make one.');
      stats.innerHTML = `<span><strong>${model.furthest}<small>/60</small></strong>lanes crossed</span><span><strong>${formatTime(model.elapsed)}</strong>crossing time</span><span><strong>${model.stats.casts}</strong>skills used</span>`;
      text(play, won ? 'Cross a new route ↗' : 'Try this route again ↗');
      retry.hidden = won;
      text(hint, won ? `Fastest crossing · ${formatTime(record.fastest)}` : 'Same streets. Same opening traffic. New plan.');
    }
    if (active && !guide.open) play.focus({ preventScroll: true });
  }
  if (playing) shownPhase = '';
}

function draw(alpha = 1, dt = 0) { renderer.draw(model, { alpha, dt, reducedMotion: motion.matches }); }
function animate() {
  return active && !suspended && !document.hidden && (model.phase === 'playing' || (model.phase === 'ready' && !motion.matches) || (model.phase !== 'paused' && renderer.hasEffects()));
}
function requestFrame() { if (!frame && animate()) frame = requestAnimationFrame(tick); }
function stopFrame() { cancelAnimationFrame(frame); frame = 0; previousTime = null; accumulator = 0; }
function tick(now) {
  frame = 0;
  if (!active || suspended || document.hidden) return;
  const dt = previousTime === null ? 0 : Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  if (model.phase === 'playing') {
    accumulator += dt;
    while (accumulator >= CROSSING.step) {
      model.step(); accumulator -= CROSSING.step;
      if (model.phase !== 'playing') { accumulator = 0; break; }
    }
  } else accumulator = 0;
  events();
  draw(model.phase === 'playing' ? accumulator / CROSSING.step : 1, dt);
  if (now - hudAt > 75 || model.phase !== 'playing') { refresh(); hudAt = now; }
  requestFrame();
}

function begin(newSeed = false) {
  if (!active) return;
  guide.open = false;
  stopFrame();
  if (newSeed || !['ready', 'paused'].includes(model.phase)) {
    model.reset(newSeed ? (Math.random() * 0xffffffff) >>> 0 : model.seed);
    renderer.reset();
  }
  if (model.phase === 'paused') model.resume(); else model.begin();
  shownPhase = ''; pointer = null; suspended = false;
  events(); refresh(); draw(); requestFrame(); canvas.focus({ preventScroll: true });
}

function pause() {
  if (!active || model.phase !== 'playing') return;
  model.pause(); pointer = null; stopFrame(); sound.stop();
  refresh(); draw();
  text(status, 'Crossing paused.');
}

function move(dx, dy) {
  if (!active || model.phase !== 'playing') return;
  model.hop(dx, dy); events(); requestFrame();
}
function cast(key) {
  if (!active || model.phase !== 'playing') return;
  model.cast(key); events(); refresh(); draw(); requestFrame();
}

play.addEventListener('click', () => begin(model.phase === 'won'));
byId('crossingNewRoute').addEventListener('click', () => {
  if (model.phase === 'paused') { model.reset(); renderer.reset(); begin(); }
  else begin(true);
});
byId('crossingRestart').addEventListener('click', () => { model.reset(); renderer.reset(); begin(); });
pauseButton.addEventListener('click', () => model.phase === 'paused' ? begin() : pause());
soundButton.addEventListener('click', () => {
  record.sound = !record.sound; save();
  if (record.sound) sound.play('pickup'); else sound.stop();
  refresh();
});
// Game controls act on contact, without waiting for a synthesized click after a swipe.
// Keyboard and assistive-technology activation still use the native click path.
function immediateControl(button, action) {
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || button.disabled) return;
    event.preventDefault();
    action();
  });
  button.addEventListener('click', event => { if (event.detail === 0 && !button.disabled) action(); });
}
for (const button of skillButtons) immediateControl(button, () => cast(button.dataset.skill));
for (const button of moveButtons) immediateControl(button, () => move(Number(button.dataset.dx), Number(button.dataset.dy)));
guide.addEventListener('toggle', () => { if (guide.open) pause(); });

canvas.addEventListener('pointerdown', event => {
  if (!active || model.phase !== 'playing' || event.button !== 0 || pointer) return;
  event.preventDefault(); canvas.focus({ preventScroll: true });
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointerup', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
  pointer = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) move(0, 1);
  else if (Math.abs(dx) > Math.abs(dy)) move(Math.sign(dx), 0);
  else move(0, -Math.sign(dy));
});
for (const type of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => { pointer = null; });
canvas.addEventListener('contextmenu', event => event.preventDefault());

window.addEventListener('keydown', event => {
  if (!active || suspended || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, summary')) return;
  const key = event.key.toLowerCase();
  if (key === 'p' && !event.repeat && ['playing', 'paused'].includes(model.phase)) {
    event.preventDefault(); model.phase === 'playing' ? pause() : begin(); return;
  }
  if (model.phase !== 'playing') return;
  const directions = { arrowup: [0, 1], w: [0, 1], arrowdown: [0, -1], s: [0, -1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
  if (directions[key] || (key === ' ' && event.target === canvas)) {
    event.preventDefault(); if (!event.repeat) move(...(directions[key] || [0, 1]));
  } else if (['1', '2', '3', '4'].includes(key)) {
    event.preventDefault(); if (!event.repeat) cast(Object.keys(SKILLS)[Number(key) - 1]);
  }
});

function suspend() { if (!active) return; pause(); suspended = true; pointer = null; stopFrame(); sound.stop(); }
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) suspend();
  else if (active) { suspended = false; previousTime = null; requestFrame(); }
});
window.addEventListener('focus', () => { if (active && !document.hidden) { suspended = false; previousTime = null; requestFrame(); } });
const resize = new ResizeObserver(() => { if (active) { renderer.resize(); draw(); } });
resize.observe(canvas);
motion.addEventListener('change', () => {
  if (!active) return;
  if (motion.matches) { renderer.effects = []; resultAt = 0; }
  stopFrame(); refresh(); draw(); requestFrame();
});

export const slimeCrossing = {
  start() {
    active = true; suspended = false; shownPhase = ''; previousTime = null;
    if (['won', 'over'].includes(model.phase)) resultAt = 0;
    renderer.resize(); refresh(); draw(); requestFrame();
    (model.phase === 'playing' ? canvas : play).focus({ preventScroll: true });
  },
  stop() {
    model.pause(); active = false; suspended = false; pointer = null;
    stopFrame(); sound.stop(); renderer.effects = [];
    if (['won', 'over'].includes(model.phase)) resultAt = 0;
    if (model.furthest > record.best) { record.best = model.furthest; save(); }
  }
};
