import { RUN, STAGES, KINDS, CHARACTERS, DIFFICULTIES, DISCOVERIES, FAMOUS_PLATES, HunterModel, options, HUNTER_STORAGE, loadRecords, remember, recordKey } from './hunter-model.js';
import { HunterScene } from './hunter-scene.js';
import { portrait, hunterIcon as icon, hunterPreview } from './hunter-art.js';

const root = document.getElementById('gameHunterPanel');
document.getElementById('hunterPreview').innerHTML = hunterPreview;
document.querySelector('.game-choice[data-game="hunter"] .game-choice-description').innerHTML = 'Run the Hunter Exam.<br>Four phases. One aura. Hisoka behind you.';

const records = loadRecords(key => localStorage.getItem(key));
let selection = options(records.selection);
let model = new HunterModel(Date.now(), selection);

root.innerHTML = `
  <div class="hn-masthead">
    <div><span class="hn-eyebrow">HUNTER × HUNTER · THE 287TH EXAM</span><h4>Nen run<span>.</span></h4></div>
    <div class="hn-top-tools">
      <div class="hn-score"><strong id="hunterDistance">0</strong><span>m</span></div>
      <button id="hunterSound" class="hn-icon-button" aria-label="Enable sound" aria-pressed="false" title="Sound">${icon('sound')}</button>
      <button id="hunterPause" class="hn-icon-button" aria-label="Pause run" title="Pause · P" disabled>${icon('pause')}</button>
    </div>
  </div>
  <div class="hn-layout">
    <div class="hn-stage">
      <canvas id="hunterCanvas" tabindex="0" aria-label="Hunter Exam runner play area" aria-describedby="hunterInstructions">Arrow keys change lanes, jump, and slide. Hold Z for Zetsu, X for Gyo, press C for your Hatsu.</canvas>
      <div class="hn-hud" aria-hidden="true">
        <div class="hn-hud-stage"><span id="hunterPhase">PHASE 1</span><strong id="hunterStageName">Zaban Tunnel</strong><i class="hn-progress"><b id="hunterProgress"></b></i></div>
        <div class="hn-hud-plates"><strong id="hunterPlates">0</strong><span id="hunterPlatesLabel">plates</span></div>
        <div id="hunterWarning" class="hn-warning" hidden>♠ Hisoka is right behind you</div>
        <div class="hn-hud-aura"><span id="hunterNenState">TEN</span><i><b id="hunterAuraBar"></b></i><span id="hunterAuraValue">100</span></div>
      </div>
      <div id="hunterToast" class="hn-toast" aria-hidden="true"></div>
      <div id="hunterOverlay" class="hn-overlay" data-phase="ready">
        <div class="hn-message">
          <span id="hunterMessageTag" class="hn-eyebrow">HUNTER EXAM · PHASE 1</span>
          <h5 id="hunterMessageTitle">Follow the examiner.</h5>
          <p id="hunterMessageText">Satotz has not said where the finish line is.</p>
          <div id="hunterResultStats" class="hn-result-stats" hidden></div>
          <button id="hunterPlay" class="hn-primary">Start running <span aria-hidden="true">↗</span></button>
          <button id="hunterNewCourse" class="hn-secondary" hidden>New course</button>
          <span id="hunterMessageHint" class="hn-message-hint">Arrows to move · Z Zetsu · X Gyo · C Hatsu</span>
        </div>
      </div>
    </div>
    <div class="hn-console">
      <div id="hunterSetup" class="hn-setup">
        <span class="hn-eyebrow">CHOOSE AN APPLICANT</span>
        <div class="hn-characters" role="group" aria-label="Character">
          ${Object.entries(CHARACTERS).map(([id, hero]) => `<button data-character="${id}" aria-pressed="${id === selection.character}" style="--hero:${hero.color}">${portrait(id)}<strong>${hero.name}</strong><span>#${hero.number} · ${hero.type}</span></button>`).join('')}
        </div>
        <div class="hn-kit"><strong id="hunterKitName"></strong><p id="hunterKitText"></p><small id="hunterKitPassive"></small></div>
        <div class="hn-mode-row">
          <div class="hn-difficulties" role="group" aria-label="Challenge">
            ${Object.entries(DIFFICULTIES).map(([id, d]) => `<button data-difficulty="${id}" aria-pressed="${id === selection.difficulty}"><strong>${d.name}</strong><span>${d.description}</span></button>`).join('')}
          </div>
          <div class="hn-modes" role="group" aria-label="Mode"><button data-mode="exam" aria-pressed="${selection.mode === 'exam'}">The exam</button><button data-mode="endless" aria-pressed="${selection.mode === 'endless'}">Endless</button></div>
        </div>
        <p id="hunterSetupRecord" class="hn-setup-record"></p>
      </div>
      <div id="hunterLive" class="hn-live" hidden>
        <div class="hn-nen" role="group" aria-label="Nen techniques">
          <button class="hn-nen-button" data-nen="zetsu"><span class="hn-nen-top">${icon('zetsu')}<kbd>Z</kbd></span><strong>Zetsu</strong><span>Hold · vanish, recover, no defence</span><i class="hn-nen-state" data-nen-state>Ready</i></button>
          <button class="hn-nen-button" data-nen="gyo"><span class="hn-nen-top">${icon('gyo')}<kbd>X</kbd></span><strong>Gyo</strong><span>Hold · see through In</span><i class="hn-nen-state" data-nen-state>Ready</i></button>
          <button class="hn-nen-button hn-hatsu" data-nen="hatsu" style="--hero:${model.hero.color}"><span class="hn-nen-top">${icon('hatsu')}<kbd>C</kbd></span><strong id="hunterHatsuName">Hatsu</strong><span id="hunterHatsuAction"></span><i class="hn-nen-state" data-nen-state>Ready</i><em class="hn-nen-progress"></em></button>
        </div>
        <div class="hn-run-buttons" role="group" aria-label="Movement">
          <button data-run="left" aria-label="Left lane">${icon('left')}</button><button data-run="jump" aria-label="Jump">${icon('up')}</button><button data-run="slide" aria-label="Slide">${icon('down')}</button><button data-run="right" aria-label="Right lane">${icon('right')}</button>
        </div>
        <p id="hunterInstructions" class="hn-instructions"><span class="hn-keyboard-hint">← → lanes · ↑ jump · ↓ slide · hold Z / X · C Hatsu · P pause</span><span class="hn-touch-hint">Swipe to move. Hold the Nen buttons.</span></p>
        <div class="hn-tip"><span class="hn-eyebrow" id="hunterTipTag">FIELD NOTE</span><p id="hunterTip"></p></div>
      </div>
    </div>
  </div>
  <div class="hn-bottom">
    <details id="hunterGuide" class="hn-guide"><summary>How Nen works here <span aria-hidden="true">+</span></summary>
      <div>
        <p><strong>Run the exam.</strong> Four phases: the Zaban tunnel, the Numere Wetlands, Trick Tower, and Zevil Island. Change lanes around walls and other applicants, jump low hazards and gaps, slide under anything at head height. A wall or a fall ends the run. Anything smaller is a stumble: it costs aura and slows you.</p>
        <p><strong>Ten</strong> is your default state. Aura trickles back and absorbs stumbles. <strong>Zetsu</strong> (hold Z) stops your aura entirely: it recovers fast and Hisoka loses your presence, but a single hit ends the run and you cannot use Gyo or your Hatsu.</p>
        <p><strong>Gyo</strong> (hold X) focuses aura into your eyes. Hazards hidden with In are invisible until the last moment, unless Gyo is up. It drains aura while held. <strong>Hatsu</strong> (C) is your own technique: each applicant has a different one with its own cost and recharge.</p>
        <p><strong>Hisoka.</strong> From the wetlands on, a stumble draws him. While he is behind you, a second stumble is the end. Run clean for a while, or hold Zetsu, and he loses interest.</p>
        <p><strong>Plates.</strong> Collect numbered plates for points. On Zevil Island you need six points to pass; your target’s plate is worth three. Pass all four phases for the license. Endless skips the rest stops and keeps serving faster laps.</p>
        <p><strong>Controls.</strong> Arrow keys or WASD. Swipe on the play area or use the buttons on touch screens. P pauses; switching tabs pauses too.</p>
      </div>
    </details>
    <details id="hunterLog" class="hn-log"><summary><span>${icon('license')} Hunter’s notes</span><span id="hunterLogCount">0 / ${Object.keys(DISCOVERIES).length}</span></summary>
      <div id="hunterDiscoveries" class="hn-discoveries"></div>
      <div class="hn-plates-collected"><span class="hn-eyebrow">FAMOUS PLATES</span><div id="hunterFamous"></div></div>
    </details>
    <button id="hunterChoose" class="hn-mode-switch" hidden>Change applicant</button>
    <button id="hunterRestart" class="hn-restart">${icon('reset')} Restart course</button>
  </div>
  <p id="hunterStatus" class="visually-hidden" role="status" aria-live="polite"></p>`;

const byId = id => document.getElementById(id);
const canvas = byId('hunterCanvas');
const scene = new HunterScene(canvas);
const overlay = byId('hunterOverlay');
const play = byId('hunterPlay');
const pauseButton = byId('hunterPause');
const soundButton = byId('hunterSound');
const guide = byId('hunterGuide');
const log = byId('hunterLog');
const toast = byId('hunterToast');
const status = byId('hunterStatus');
const nenButtons = [...root.querySelectorAll('[data-nen]')];
const runButtons = [...root.querySelectorAll('[data-run]')];
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const save = () => { try { localStorage.setItem(HUNTER_STORAGE, JSON.stringify(records)); } catch { /* Keep records for this visit. */ } };
const rememberRun = () => { remember(records, model); save(); };
const text = (node, value) => { if (node.textContent !== String(value)) node.textContent = value; };

class HunterSound {
  constructor() { this.context = null; this.voices = new Set(); }
  play(type) {
    if (!records.sound || !active || suspended || document.hidden) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      this.context ||= new Audio();
      this.context.resume().catch(() => {});
      const notes = { jump: [300, 520], slide: [260, 160], lane: [420, 480], plate: [760, 1140], stumble: [180, 90], ko: [160, 50], cast: [320, 900], rock: [90, 240], zetsu: [400, 120], gyo: [600, 820], pursuer: [220, 110], escape: [500, 900], clear: [540, 1080], juice: [300, 130], wager: [700, 400], reveal: [880, 1200] }[type];
      if (!notes) return;
      const oscillator = this.context.createOscillator(), gain = this.context.createGain(), now = this.context.currentTime;
      const duration = ['ko', 'clear', 'rock'].includes(type) ? 0.4 : type === 'lane' ? 0.05 : 0.14;
      oscillator.type = ['rock', 'ko', 'pursuer'].includes(type) ? 'sawtooth' : 'triangle';
      oscillator.frequency.setValueAtTime(notes[0], now);
      oscillator.frequency.exponentialRampToValueAtTime(notes[1], now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(type === 'lane' ? 0.02 : 0.045, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain); gain.connect(this.context.destination);
      this.voices.add(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices.delete(oscillator); };
      oscillator.start(now); oscillator.stop(now + duration + 0.02);
    } catch { /* Sound never blocks play. */ }
  }
  stop() {
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
    if (this.context?.state === 'running') this.context.suspend().catch(() => {});
  }
}

const sound = new HunterSound();
let active = false, suspended = false, settingUp = true, frame = 0, previousTime = null, accumulator = 0, hudAt = 0, toastUntil = 0, resultAt = 0, shownPhase = '';
const keys = new Set();
const held = new Map();
let swipe = null;

const TIPS = {
  tunnel: ['Keep up with Satotz. Other applicants are not obstacles if you don’t run into them.', 'Free juice by the tunnel wall? Think about who’s offering.'],
  wetlands: ['The fog hides what In hides. Flash Gyo before each blind stretch.', 'If Hisoka turns up, run clean or stop your aura. Not both.'],
  tower: ['Lippo’s doors read MAJORITY. Take the side they leave open.', 'A trapdoor is a jump, a blade is a slide. Spikes are a jump.'],
  island: ['Six points. Your target’s plate glows gold.', 'Another applicant wants your plate. Keep your distance.']
};

function say(message, color = '') {
  text(toast, message);
  toast.style.setProperty('--toast-color', color || '#efe7d2');
  toastUntil = scene.time + 2.6;
  toast.classList.add('is-visible');
  text(status, message);
}

function events() {
  const pending = model.drainEvents();
  scene.accept(pending, model);
  for (const e of pending) {
    sound.play(e.type);
    if (e.type === 'plate') say(e.target ? `Your target’s plate · +3 points` : e.famous ? `#${e.number} · ${e.famous}’s plate` : `Plate #${e.number}`, e.target ? '#ffd86b' : '');
    else if (e.type === 'stumble') say(`Stumbled on ${KINDS[e.kind].name} · −${e.cost} aura`, '#f0b8a0');
    else if (e.type === 'pursuer') say('Hisoka is behind you. One more stumble and he has you.', '#ff9aa8');
    else if (e.type === 'escape') say(e.zetsu ? 'Zetsu. Hisoka walked past without noticing.' : 'Hisoka lost interest.', '#d7c6ff');
    else if (e.type === 'juice') say(e.immune ? 'Tonpa’s juice. Tastes fine, Killua.' : 'Tonpa’s juice. That was a laxative.', e.immune ? '#bde8ff' : '#b8e39a');
    else if (e.type === 'wager') say(e.won ? 'Leroute’s coin landed your way · +5 points' : 'Leroute’s coin. You lost fifty hours and thirty aura.', e.won ? '#ffd86b' : '#f0b8a0');
    else if (e.type === 'cast') say(model.hero.hatsu, model.hero.color);
    else if (e.type === 'unavailable') say(e.reason, '#ecc5a0');
    else if (e.type === 'reveal' && e.kind === 'lugger') say('Gyo. That applicant is a Noggin Lugger.', '#d7c6ff');
    else if (e.type === 'gyo-off' && e.exhausted) say('Aura exhausted. Gyo dropped.', '#ecc5a0');
    else if (e.type === 'discovery') say(`Hunter’s note · ${e.name}`, '#f6e6a6');
    else if (e.type === 'stage' && model.config.mode === 'endless' && model.phase === 'playing') say(`${model.stage.name} · lap ${model.lap + 1}`);
    else if (e.type === 'begin') say(model.stage.intro);
    else if (e.type === 'resume') say(model.stage.intro);
    else if (e.type === 'ko' || e.type === 'clear') {
      resultAt = scene.time + (motion.matches ? 0 : 0.5);
      rememberRun();
      refreshLog();
      text(status, e.type === 'ko' ? `Run over. ${model.reason}` : `${STAGES.find(s => s.id === e.stage).name} cleared.`);
    }
  }
}

function refreshLog() {
  text(byId('hunterLogCount'), `${records.discoveries.length} / ${Object.keys(DISCOVERIES).length}`);
  byId('hunterDiscoveries').innerHTML = Object.entries(DISCOVERIES).map(([id, d]) => {
    const found = records.discoveries.includes(id);
    return `<div class="hn-discovery ${found ? 'is-found' : ''}"><strong>${found ? d.name : 'Unknown'}</strong><p>${found ? d.note : 'Something out there is worth noting.'}</p></div>`;
  }).join('');
  byId('hunterFamous').innerHTML = Object.entries(FAMOUS_PLATES).map(([number, name]) => {
    const found = records.plates.includes(Number(number));
    return `<span class="hn-plate ${found ? 'is-found' : ''}">#${number}<small>${found ? name : '???'}</small></span>`;
  }).join('');
}

function refreshSetup() {
  const hero = CHARACTERS[selection.character];
  for (const b of root.querySelectorAll('[data-character]')) b.setAttribute('aria-pressed', String(b.dataset.character === selection.character));
  for (const b of root.querySelectorAll('[data-difficulty]')) b.setAttribute('aria-pressed', String(b.dataset.difficulty === selection.difficulty));
  for (const b of root.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === selection.mode));
  text(byId('hunterKitName'), `${hero.hatsu} · ${hero.cost} aura · ${hero.cooldown}s`);
  text(byId('hunterKitText'), hero.lore);
  text(byId('hunterKitPassive'), hero.passive);
  const best = records.scores[recordKey(selection)];
  text(byId('hunterSetupRecord'), best?.distance ? `Best ${best.distance} m · ${best.points} plates${best.licensed ? ' · Licensed' : ''}` : selection.mode === 'exam' ? 'Four phases. Pass them all for the license.' : 'Endless laps of the exam course. No rest stops.');
}

function refresh(focusOverlay = true) {
  const playing = model.phase === 'playing';
  root.dataset.phase = model.phase;
  root.dataset.screen = settingUp ? 'setup' : 'play';
  root.dataset.stage = model.stage.id;
  byId('hunterSetup').hidden = !settingUp;
  byId('hunterLive').hidden = settingUp;
  byId('hunterChoose').hidden = settingUp;
  byId('hunterRestart').hidden = settingUp;
  if (settingUp) refreshSetup();
  const hud = root.querySelector('.hn-hud');
  hud.hidden = settingUp;
  text(byId('hunterDistance'), Math.floor(model.distance));
  text(byId('hunterPhase'), model.config.mode === 'endless' ? `LAP ${model.lap + 1} · ${model.stage.phase}` : model.stage.phase);
  text(byId('hunterStageName'), model.stage.name);
  byId('hunterProgress').style.transform = `scaleX(${model.stageProgress})`;
  const quota = model.stage.quota && model.config.mode === 'exam' && model.lap === 0;
  text(byId('hunterPlates'), quota ? `${model.stagePoints}/${model.stage.quota}` : model.points);
  text(byId('hunterPlatesLabel'), quota ? 'points' : 'plates');
  byId('hunterWarning').hidden = !model.pursuer.active;
  text(byId('hunterNenState'), model.nen === 'zetsu' ? 'ZETSU' : model.gyo ? 'GYO' : model.godspeed > 0 ? 'GODSPEED' : model.chain > 0 ? 'CHAIN' : 'TEN');
  byId('hunterAuraBar').style.transform = `scaleX(${model.aura / RUN.auraMax})`;
  byId('hunterAuraBar').dataset.low = String(model.aura < RUN.stumbleCost);
  text(byId('hunterAuraValue'), Math.floor(model.aura));
  if (scene.time > toastUntil) toast.classList.remove('is-visible');
  pauseButton.disabled = settingUp || !['playing', 'paused'].includes(model.phase);
  pauseButton.setAttribute('aria-label', model.phase === 'paused' ? 'Resume run' : 'Pause run');
  pauseButton.setAttribute('aria-pressed', String(model.phase === 'paused'));
  soundButton.setAttribute('aria-pressed', String(records.sound));
  soundButton.setAttribute('aria-label', records.sound ? 'Mute sound' : 'Enable sound');
  for (const b of runButtons) b.disabled = !playing;
  const hatsu = byId('hunterHatsuName');
  text(hatsu, model.hero.hatsu);
  text(byId('hunterHatsuAction'), model.hero.action);
  root.querySelector('.hn-hatsu').style.setProperty('--hero', model.hero.color);
  for (const b of nenButtons) {
    const key = b.dataset.nen;
    b.disabled = !playing;
    let state, pressed = false;
    if (key === 'zetsu') { pressed = model.nen === 'zetsu'; state = pressed ? 'Aura stopped' : 'Ready'; }
    else if (key === 'gyo') { pressed = model.gyo; state = model.nen === 'zetsu' ? 'Needs aura flow' : pressed ? `Seeing · −${model.hero.key === 'chain' ? RUN.gyoDrain / 2 : RUN.gyoDrain}/s` : 'Ready'; }
    else {
      const unavailable = model.availability();
      state = unavailable || `${model.hero.cost} aura`;
      b.setAttribute('aria-disabled', String(!!unavailable && playing));
      const active = model.godspeed > 0 ? model.godspeed / 3.5 : model.chain > 0 ? model.chain / 7 : 0;
      b.dataset.state = active ? 'active' : model.cooldown > 0 ? 'charging' : unavailable ? 'empty' : 'ready';
      b.style.setProperty('--progress', active ? active : model.cooldown > 0 ? 1 - model.cooldown / model.hero.cooldown : 1);
    }
    b.setAttribute('aria-pressed', String(pressed));
    text(b.querySelector('[data-nen-state]'), state);
  }
  const tips = TIPS[model.stage.id];
  text(byId('hunterTipTag'), `FIELD NOTE · ${model.stage.name.toUpperCase()}`);
  text(byId('hunterTip'), tips[Math.floor(model.stageProgress * 2) % tips.length]);
  const show = settingUp || model.phase === 'paused' || model.phase === 'rest' || (model.phase === 'over' && scene.time >= resultAt);
  overlay.hidden = !show;
  canvas.tabIndex = show ? -1 : 0;
  const state = settingUp ? `setup:${selection.character}:${selection.mode}` : `${model.phase}:${model.stageIndex}:${model.lap}`;
  if (show && shownPhase !== state) {
    shownPhase = state;
    overlay.dataset.phase = settingUp ? 'ready' : model.phase;
    const tag = byId('hunterMessageTag'), title = byId('hunterMessageTitle'), description = byId('hunterMessageText'), hint = byId('hunterMessageHint'), stats = byId('hunterResultStats'), again = byId('hunterNewCourse');
    stats.hidden = true; again.hidden = true;
    if (settingUp) {
      const hero = CHARACTERS[selection.character];
      text(tag, `${hero.name.toUpperCase()} · #${hero.number} · ${DIFFICULTIES[selection.difficulty].name.toUpperCase()}`);
      title.innerHTML = selection.mode === 'exam' ? 'Follow the examiner.' : 'Keep running.';
      text(description, selection.mode === 'exam' ? 'Phase 1 starts in the Zaban tunnel. Nobody has said where it ends.' : 'The whole course, lap after lap, a little faster each time.');
      text(play, selection.mode === 'exam' ? 'Start the exam ↗' : 'Start endless ↗');
      text(hint, 'Arrows to move · hold Z Zetsu · hold X Gyo · C Hatsu');
    } else if (model.phase === 'paused') {
      text(tag, 'AURA ON HOLD'); text(title, 'Take a breath.'); text(description, 'Your run, aura, and Hisoka are all waiting.');
      text(play, 'Continue running →'); text(hint, 'P also resumes.');
      again.hidden = false; text(again, 'Restart course');
    } else if (model.phase === 'rest') {
      const previous = STAGES[(model.stageIndex + STAGES.length - 1) % STAGES.length];
      const licensed = model.licensed && previous.id === 'island';
      text(tag, licensed ? 'EXAM COMPLETE' : `${previous.phase} CLEARED`);
      const [headline, ...rest] = previous.clear.split('. ');
      text(title, licensed ? 'You’re a Hunter.' : `${headline}.`);
      text(description, licensed ? 'The license is yours. The course continues as Endless from here, faster each lap.' : `${rest.join('. ')} Next: ${model.stage.name}. ${model.stage.intro}`);
      stats.hidden = false;
      stats.innerHTML = `<span><strong>${Math.floor(model.distance)}<small>m</small></strong>so far</span><span><strong>${model.points}</strong>plates</span><span><strong>${Math.floor(model.aura)}</strong>aura</span>`;
      text(play, licensed ? 'Keep running ↗' : `Enter ${model.stage.name} ↗`);
      text(hint, licensed ? 'Hunter’s notes updated.' : 'Netero’s airship. Your aura is where you left it.');
    } else {
      text(tag, model.reason.includes('Hisoka') ? 'HISOKA’S VERDICT' : model.reason.includes('points') ? 'PHASE 4 · DISQUALIFIED' : `${model.stage.phase} · ${model.stage.name.toUpperCase()}`);
      text(title, model.reason.includes('Hisoka') ? 'Not ripe yet.' : model.reason.includes('points') ? 'Next year, then.' : 'One more applicant down.');
      text(description, model.reason);
      stats.hidden = false;
      stats.innerHTML = `<span><strong>${Math.floor(model.distance)}<small>m</small></strong>run</span><span><strong>${model.points}</strong>plates</span><span><strong>${model.passed}</strong>passed</span>`;
      text(play, 'Run this course again ↗');
      again.hidden = false; text(again, 'New course');
      const best = records.scores[recordKey(model.config)];
      text(hint, best?.distance ? `Best ${best.distance} m · ${best.points} plates` : 'Same course, same seed. New plan.');
    }
    if (focusOverlay && active && !guide.open && !log.open) play.focus({ preventScroll: true });
  }
  if (playing) shownPhase = '';
}

function syncHeld() {
  if (model.phase !== 'playing') return;
  const values = [...held.values()];
  model.setZetsu(keys.has('z') || keys.has('1') || values.includes('zetsu'));
  model.setGyo(keys.has('x') || keys.has('2') || values.includes('gyo'));
}

function draw(dt = 0) { scene.draw(model, { dt, reducedMotion: motion.matches, preview: settingUp }); }
function animate() { return active && !suspended && !document.hidden && (model.phase === 'playing' || scene.hasEffects() || (model.phase === 'over' && scene.time < resultAt)); }
function requestFrame() { if (!frame && animate()) frame = requestAnimationFrame(tick); }
function stopFrame() { cancelAnimationFrame(frame); frame = 0; previousTime = null; accumulator = 0; }
function tick(now) {
  frame = 0;
  if (!active || suspended || document.hidden) return;
  const dt = previousTime === null ? 0 : Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  if (model.phase === 'playing') {
    syncHeld();
    accumulator += dt;
    while (accumulator >= RUN.step) {
      model.step(); accumulator -= RUN.step;
      if (model.phase !== 'playing') { accumulator = 0; break; }
    }
  } else accumulator = 0;
  events();
  draw(dt);
  if (now - hudAt > 70 || model.phase !== 'playing') { refresh(); hudAt = now; }
  requestFrame();
}

function begin(newSeed = false) {
  if (!active) return;
  guide.open = false; log.open = false;
  stopFrame();
  if (settingUp) {
    model = new HunterModel((Math.random() * 0xffffffff) >>> 0, selection);
    scene.reset();
    settingUp = false;
    records.selection = { ...selection }; save();
  } else if (newSeed || model.phase === 'over') {
    rememberRun();
    model = new HunterModel(newSeed ? (Math.random() * 0xffffffff) >>> 0 : model.seed, selection);
    scene.reset();
  }
  if (model.phase === 'paused') model.resume();
  else if (model.phase === 'rest') model.continue();
  else model.begin();
  shownPhase = ''; swipe = null; suspended = false; held.clear(); keys.clear();
  events(); refresh(); draw(); requestFrame();
  root.closest('.game-modal-content').scrollTop = 0;
  canvas.focus({ preventScroll: true });
}

function pause() {
  if (!active || model.phase !== 'playing') return;
  model.pause(); swipe = null; held.clear(); keys.clear(); stopFrame(); sound.stop();
  refresh(); draw();
  text(status, 'Run paused.');
}

function setup() {
  rememberRun(); stopFrame(); held.clear(); keys.clear();
  model.pause();
  settingUp = true;
  model = new HunterModel(Date.now(), selection);
  scene.reset();
  shownPhase = '';
  refreshLog(); refresh(); draw();
  root.closest('.game-modal-content').scrollTop = 0;
  byId('hunterSetup').querySelector(`[data-character="${selection.character}"]`).focus({ preventScroll: true });
}

function run(action) {
  if (!active || model.phase !== 'playing') return;
  if (action === 'left') model.moveLane(-1);
  else if (action === 'right') model.moveLane(1);
  else if (action === 'jump') model.jump();
  else if (action === 'slide') model.slide();
  else if (action === 'hatsu') { model.cast(); refresh(); }
  events(); requestFrame();
}

play.addEventListener('click', () => begin(false));
byId('hunterNewCourse').addEventListener('click', () => { if (model.phase === 'paused') { rememberRun(); model = new HunterModel(model.seed, selection); scene.reset(); } begin(model.phase !== 'ready'); });
byId('hunterRestart').addEventListener('click', () => { rememberRun(); model = new HunterModel(model.seed, selection); scene.reset(); begin(false); });
byId('hunterChoose').addEventListener('click', setup);
pauseButton.addEventListener('click', () => model.phase === 'paused' ? begin() : pause());
soundButton.addEventListener('click', () => { records.sound = !records.sound; save(); if (records.sound) sound.play('plate'); else sound.stop(); refresh(); });
for (const b of root.querySelectorAll('[data-character]')) b.addEventListener('click', () => { if (!settingUp) return; selection = options({ ...selection, character: b.dataset.character }); model = new HunterModel(Date.now(), selection); refresh(false); draw(); text(status, `${CHARACTERS[selection.character].name}. ${CHARACTERS[selection.character].passive}`); });
for (const b of root.querySelectorAll('[data-difficulty]')) b.addEventListener('click', () => { if (!settingUp) return; selection = options({ ...selection, difficulty: b.dataset.difficulty }); model = new HunterModel(Date.now(), selection); refresh(false); });
for (const b of root.querySelectorAll('[data-mode]')) b.addEventListener('click', () => { if (!settingUp) return; selection = options({ ...selection, mode: b.dataset.mode }); model = new HunterModel(Date.now(), selection); refresh(false); });

// Buttons act on contact; held Nen buttons release on pointer loss. A click that no pointer preceded
// is keyboard or assistive activation (touch also synthesizes a click, which must not act twice).
let lastPointer = 0;
const keyboardClick = (button, action) => button.addEventListener('click', e => { if (button.disabled || performance.now() - lastPointer < 600) return; action(e); });
for (const b of runButtons) {
  b.addEventListener('pointerdown', e => { if (e.button !== 0 || b.disabled) return; e.preventDefault(); lastPointer = performance.now(); run(b.dataset.run); });
  keyboardClick(b, () => run(b.dataset.run));
}
for (const b of nenButtons) {
  const key = b.dataset.nen;
  if (key === 'hatsu') {
    b.addEventListener('pointerdown', e => { if (e.button !== 0 || b.disabled) return; e.preventDefault(); lastPointer = performance.now(); run('hatsu'); });
    keyboardClick(b, () => run('hatsu'));
    continue;
  }
  b.addEventListener('pointerdown', e => {
    if (e.button !== 0 || b.disabled) return;
    e.preventDefault(); lastPointer = performance.now(); b.setPointerCapture(e.pointerId); held.set(e.pointerId, key); syncHeld(); events(); refresh(); requestFrame();
  });
  const release = e => { lastPointer = performance.now(); if (held.delete(e.pointerId)) { syncHeld(); events(); refresh(); } };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(type, release);
  // Keyboard or assistive activation: hold the technique for 1.5 seconds, then release.
  keyboardClick(b, () => {
    const id = `kb-${key}`; held.set(id, key); syncHeld(); events(); refresh(); requestFrame();
    setTimeout(() => { held.delete(id); syncHeld(); events(); refresh(); }, 1500);
  });
}
guide.addEventListener('toggle', () => { if (guide.open) pause(); });
log.addEventListener('toggle', () => { if (log.open) { refreshLog(); pause(); } });

canvas.addEventListener('pointerdown', e => {
  if (!active || model.phase !== 'playing' || e.button !== 0 || swipe) return;
  e.preventDefault(); canvas.focus({ preventScroll: true });
  swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', e => {
  if (!swipe || swipe.id !== e.pointerId) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  swipe = null;
  if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) run('jump');
  else if (Math.abs(dx) > Math.abs(dy)) run(dx > 0 ? 'right' : 'left');
  else run(dy < 0 ? 'jump' : 'slide');
});
for (const type of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => { swipe = null; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {
  if (!active || suspended || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select, summary')) return;
  const key = e.key.toLowerCase();
  if (key === 'p' && !settingUp && !e.repeat && ['playing', 'paused'].includes(model.phase)) { e.preventDefault(); model.phase === 'playing' ? pause() : begin(); return; }
  if (model.phase !== 'playing') return;
  const actions = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'jump', w: 'jump', ' ': 'jump', arrowdown: 'slide', s: 'slide', c: 'hatsu', 3: 'hatsu' };
  if (actions[key] && (key !== ' ' || e.target === canvas)) { e.preventDefault(); if (!e.repeat) run(actions[key]); return; }
  if (['z', 'x', '1', '2'].includes(key)) { e.preventDefault(); if (!keys.has(key)) { keys.add(key); syncHeld(); events(); refresh(); requestFrame(); } }
});
window.addEventListener('keyup', e => { const key = e.key.toLowerCase(); if (keys.delete(key) && active) { syncHeld(); events(); refresh(); } });

function suspend() { if (!active) return; pause(); suspended = true; swipe = null; stopFrame(); sound.stop(); }
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); else if (active) { suspended = false; previousTime = null; requestFrame(); } });
window.addEventListener('focus', () => { if (active && !document.hidden) { suspended = false; previousTime = null; requestFrame(); } });
new ResizeObserver(() => { if (active) { scene.resize(); draw(); } }).observe(canvas);
motion.addEventListener('change', () => { if (active) { if (motion.matches) { scene.effects = []; resultAt = 0; } stopFrame(); refresh(); draw(); requestFrame(); } });

export const hunterRun = {
  start() {
    active = true; suspended = false; shownPhase = ''; previousTime = null;
    if (model.phase === 'over') resultAt = 0;
    scene.resize(); refreshLog(); refresh(); draw(); requestFrame();
    (model.phase === 'playing' ? canvas : play).focus({ preventScroll: true });
  },
  stop() {
    model.pause(); active = false; suspended = false; swipe = null; held.clear(); keys.clear();
    stopFrame(); sound.stop(); scene.effects = [];
    if (model.phase === 'over') resultAt = 0;
    rememberRun();
  },
  // Read-only access for browser checks and screenshots.
  inspect() { return { model, scene, begin, refresh, events }; }
};
refreshLog();
refresh();
