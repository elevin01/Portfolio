import { HUNTER, COURSES, DIFFICULTIES, CHARACTERS, HunterModel, loadout, options, chapter, recordKey, HUNTER_STORAGE, loadRecords, remember } from './hunter-model.js';
import { hunterIcon as icon, hunterPreview, portrait } from './hunter-art.js';

const root = document.getElementById('gameHunterPanel');
document.getElementById('hunterPreview').innerHTML = hunterPreview;
const records = loadRecords(key => localStorage.getItem(key));
// Trial is always the initial mode. Character, course, and difficulty are remembered.
let selection = options({ ...records.selection, mode: 'trial' });
let model = new HunterModel(Date.now(), selection), previewModel = new HunterModel(model.seed, selection);
let scene, loading, active = false, settingUp = true, suspended = false, frame = 0, previous = null, accumulator = 0, hudAt = 0;
let pointer = null, ready = false, overlayPhase = '', toastTime = 0, effectsTime = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const save = () => { try { localStorage.setItem(HUNTER_STORAGE, JSON.stringify(records)); } catch { /* Records remain available for this visit. */ } };
const rememberRun = () => { remember(records, model); save(); };
const text = (id, value) => { const el = document.getElementById(id); if (el.textContent !== String(value)) el.textContent = value; };
const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
root.innerHTML = `
  <div class="hunter-masthead">
    <div><span class="hunter-eyebrow">HUNTER × HUNTER</span><h4>The Hunter Trial<span>.</span></h4></div>
    <div class="hunter-top-tools"><button id="hunterSound" class="hunter-icon" aria-label="Enable sound" aria-pressed="false">${icon('sound')}</button><button id="hunterPause" class="hunter-icon" aria-label="Pause run" disabled>${icon('pause')}</button></div>
  </div>
  <div class="hunter-layout">
    <div class="hunter-stage">
      <canvas id="hunterCanvas" tabindex="-1" aria-label="Hunter runner play area" aria-describedby="hunterInstructions">Swipe or use arrows to change lanes, jump, and slide. Follow the turn signs.</canvas>
      <div class="hunter-vignette" aria-hidden="true"></div>
      <div class="hunter-location"><span id="hunterLocation">HUNTER EXAM</span><span id="hunterStageMode">TRIAL / ROOKIE</span></div>
      <div id="hunterPoster" class="hunter-poster"><div class="hunter-poster-top"><span>YOUR NEXT<br>GREAT DETOUR.</span><i>01—04</i></div><div class="hunter-poster-name"><span id="hunterPosterRole"></span><strong id="hunterPosterName">Killua<span>Zoldyck</span></strong><p id="hunterPosterNote"></p></div></div>
      <div id="hunterRunHud" class="hunter-run-hud" hidden><div><strong id="hunterDistance">0</strong><span id="hunterGoal">/ 4,000 m</span></div><span id="hunterChapter"></span><div class="hunter-distance-track"><i id="hunterProgress"></i></div></div>
      <div id="hunterTurn" class="hunter-turn" hidden aria-live="polite"></div>
      <div id="hunterToast" class="hunter-toast" aria-hidden="true"></div>
      <div id="hunterLoading" class="hunter-loading"><i></i><strong>Opening the route</strong><span>Preparing the world and your runner.</span><button id="hunterRetryLoad" hidden>Try again</button></div>
      <div id="hunterOverlay" class="hunter-overlay" hidden><div><span id="hunterResultTag" class="hunter-eyebrow"></span><h5 id="hunterResultTitle"></h5><p id="hunterResultText"></p><div id="hunterResultStats" class="hunter-result-stats"></div><button id="hunterContinue" class="hunter-primary">Continue run ${icon('arrow')}</button><button id="hunterResultSetup" class="hunter-secondary">Choose your next run</button></div></div>
    </div>
    <div id="hunterSetup" class="hunter-aside hunter-setup">
      <div class="hunter-section-label"><span>01</span> CHOOSE YOUR HUNTER</div>
      <div class="hunter-characters" role="group" aria-label="Character">${Object.entries(CHARACTERS).map(([id, c]) => `<button data-option="character" data-value="${id}" style="--hunter-color:${c.color}" aria-pressed="false">${portrait(id)}<strong>${c.name}</strong></button>`).join('')}</div>
      <div class="hunter-loadout"><strong id="hunterKit"></strong><span id="hunterEra"></span><p id="hunterAbilityDescription"></p></div>
      <div class="hunter-section-label"><span>02</span> PICK YOUR ROUTE</div>
      <div class="hunter-courses" role="group" aria-label="Course">${Object.entries(COURSES).map(([id, c], i) => `<button data-option="course" data-value="${id}" aria-pressed="false"><i class="hunter-course-art" data-course="${id}"><b></b><b></b><b></b></i><span><strong>${c.name}</strong><small>${['Tunnel → wetlands', 'Streets → rooftops', 'The road to Masadora'][i]}</small></span></button>`).join('')}</div>
      <div class="hunter-section-label"><span>03</span> MAKE IT YOURS</div>
      <div class="hunter-mode-options" role="group" aria-label="Run mode"><button data-option="mode" data-value="trial" aria-pressed="true"><strong>Trial</strong><span>A finish line to reach</span></button><button data-option="mode" data-value="endless" aria-pressed="false"><strong>Endless ${icon('infinity')}</strong><span>How far can you go?</span></button></div>
      <div class="hunter-difficulty" role="group" aria-label="Difficulty">${Object.entries(DIFFICULTIES).map(([id, d]) => `<button data-option="difficulty" data-value="${id}" aria-pressed="false">${d.name}</button>`).join('')}</div>
      <p id="hunterSetupRecord" class="hunter-record"></p>
      <button id="hunterStart" class="hunter-primary" disabled>Start the trial ${icon('arrow')}</button>
      <button id="hunterKeep" class="hunter-secondary" hidden>Keep my run</button>
    </div>
    <div id="hunterConsole" class="hunter-aside hunter-console" hidden>
      <div class="hunter-live-identity"><span id="hunterLivePortrait"></span><div><strong id="hunterLiveName"></strong><small id="hunterLiveEra"></small></div></div>
      <div class="hunter-vitals"><div class="hunter-reserve"><span id="hunterReserveLabel">AURA</span><strong id="hunterAura">100</strong><div class="hunter-meter" role="meter" aria-label="Aura" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="hunterAuraMeter"><i></i></div></div><div id="hunterElectricReserve" class="hunter-reserve"><span>ELECTRICITY</span><strong id="hunterElectric">100</strong><div class="hunter-meter hunter-electric" role="meter" aria-label="Electricity" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="hunterElectricMeter"><i></i></div></div><div class="hunter-composure"><span>COMPOSURE</span><strong id="hunterComposure"></strong></div></div>
      <div class="hunter-section-label hunter-tech-label"><span>念</span> TECHNIQUES</div>
      <div class="hunter-techniques">${[['gyo', 'eye', 'Gyo', 'Reveal concealed aura'], ['zetsu', 'zetsu', 'Zetsu', 'Conceal and recover'], ['power', 'power', 'Signature', 'Your signature technique'], ['extra', 'chain', 'Secondary', 'Your secondary technique']].map(([key, symbol, label, description], i) => `<button data-technique="${key}" disabled><span class="hunter-tech-top">${icon(symbol)}<kbd>${i + 1}</kbd></span><strong>${label}</strong><small>${description}</small><span class="hunter-tech-cost"></span><i></i></button>`).join('')}</div>
      <div class="hunter-movement" role="group" aria-label="Movement"><button data-action="left" aria-label="Move left">←</button><button data-action="jump" aria-label="Jump">↑<span>Jump</span></button><button data-action="slide" aria-label="Slide">↓<span>Slide</span></button><button data-action="right" aria-label="Move right">→</button></div>
      <p id="hunterInstructions"><span class="hunter-keyboard-instructions">Arrows / WASD · 1–4 techniques · P pause</span><span class="hunter-touch-instructions">Swipe to move, jump, or slide. Tap to jump.</span></p>
      <div class="hunter-field-note"><span class="hunter-eyebrow">A LITTLE ADVICE</span><p id="hunterFieldNote"></p><span id="hunterLiveBest" class="hunter-record"></span></div>
    </div>
  </div>
  <div class="hunter-bottom"><details id="hunterGuide"><summary>Field guide <span>+</span></summary><div>
    <p><strong>Follow the route.</strong> Run automatically. Left/right changes lanes; up jumps; down slides. At a signed junction, swipe or press the indicated direction within 35 metres of the arch. The turn banner confirms your choice. Gates and boulders need a lane change; low obstacles and gaps need a jump; hanging beams need a slide.</p>
    <p><strong>Choose your challenge.</strong> Trial is the default and has a finish line. Endless keeps generating terrain, with a capped top speed and increasing combinations. Route markers add points. A missed landing, a blocked route, or repeated stumbles ends the challenge. Thirty-five clean seconds restore one composure point.</p>
    <p><strong>Respect the era.</strong> Trial uses an arc-appropriate ability set. Gon, Killua, and Kurapika have no trained Nen in the Exam course. Killua gains electricity on Greed Island and uses Godspeed in Endless. Gon uses his fishing rod before learning Jajanken. The courses are arcade interpretations of the settings, not recreations of story events.</p>
    <p><strong>Ten, Gyo, Zetsu.</strong> Ten is the normal state. Gyo costs 14 aura and reveals concealed Nen threads for 4.5 seconds. It does not predict physical hazards. Zetsu suppresses aura and restores it more quickly, but leaves you vulnerable. Enter it before a Nen projectile locks on; it cannot cancel an attack already aimed at you. An enemy can still see or hear you.</p>
    <p><strong>Killua.</strong> Godspeed costs 16 aura and 65 electricity, lasts 3.5 seconds, and can evade one incoming Nen projectile. You still navigate terrain. Electricity never regenerates by waiting or using Zetsu: collect electrical supplies. Early versions use a skateboard, Rhythm Echo, or electricity according to their training.</p>
    <p><strong>Gon.</strong> Use 4 to choose Rock, Scissors, or Paper before charging with 3. The 0.85-second wind-up slows you and commits your lane. The forms have different reaches and targets. His earlier fishing rod retrieves a nearby route marker.</p>
    <p><strong>Kurapika.</strong> Dowsing Chain intercepts one incoming Nen projectile while active. Holy Chain costs 36 aura to restore one lost composure point. Chain Jail is restricted to the Phantom Troupe and is not part of this general-purpose kit.</p>
    <p><strong>Hisoka.</strong> Bungee Gum needs a visible pink anchor 12–45m ahead. It attaches, stretches, and retracts to pull you towards that lane. Watch for overhead beams during the pull. It provides no general invulnerability.</p>
    <p><strong>Your run stays yours.</strong> Closing the arcade or changing tabs pauses the run. Records are stored on this browser for each character, course, mode, and difficulty. Sound is optional. Movement remains available with the on-screen buttons.</p>
  </div></details><button id="hunterChange" class="hunter-text-button" hidden>Change run</button><span class="hunter-adaptation">A fan-made arcade expedition</span></div>
  <p id="hunterStatus" class="visually-hidden" role="status" aria-live="polite"></p>`;

const byId = id => document.getElementById(id), canvas = byId('hunterCanvas');
const optionButtons = [...root.querySelectorAll('[data-option]')], techniqueButtons = [...root.querySelectorAll('[data-technique]')];
const descriptions = {
  godspeed: 'A burst of speed, one electrical reaction. Terrain still demands your attention.',
  board: 'A short skateboard sprint. Nen has not been learned in this arc.',
  echo: 'Rhythm Echo confuses an attacker, avoiding one incoming Nen projectile.',
  palm: 'Electrified aura stuns an incoming attacker at close range. Charges are limited.',
  jajanken: 'Charge Rock, Scissors, or Paper. Power rewards a carefully chosen opening.',
  rod: 'Hook a route marker from a neighbouring lane. Save the risky detour.',
  blades: 'Clear a low obstacle with Kurapika’s Exam-era paired blades.',
  chain: 'Intercept an attack with Dowsing Chain; recover with Holy Chain.',
  gum: 'Attach to a visible anchor, then let Bungee Gum pull you through.'
};
class Sound {
  constructor() { this.context = null; this.voices = new Set(); }
  play(type) {
    if (!records.sound || !active || suspended || document.hidden) return;
    const notes = { jump: [230, 360], slide: [160, 100], collect: [680, 1060], cast: [210, 680], release: [100, 440], hit: [120, 45], over: [160, 50], win: [560, 1100], deflect: [600, 320], gyo: [430, 800], heal: [540, 880] }[type];
    if (!notes) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
      this.context ||= new Audio(); this.context.resume().catch(() => {});
      const osc = this.context.createOscillator(), gain = this.context.createGain(), now = this.context.currentTime;
      osc.type = type === 'hit' ? 'triangle' : 'sine'; osc.frequency.setValueAtTime(notes[0], now); osc.frequency.exponentialRampToValueAtTime(notes[1], now + 0.16);
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.connect(gain); gain.connect(this.context.destination); this.voices.add(osc);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); this.voices.delete(osc); }; osc.start(); osc.stop(now + 0.23);
    } catch { /* Sound is optional. */ }
  }
  stop() { for (const voice of this.voices) { try { voice.stop(); } catch {} } this.voices.clear(); this.context?.suspend().catch(() => {}); }
}
const sound = new Sound();
function say(message) { text('hunterToast', message); text('hunterStatus', message); toastTime = 2.8; byId('hunterToast').classList.add('is-visible'); }
function events() {
  const pending = model.drainEvents(); scene?.accept(pending);
  for (const e of pending) {
    sound.play(e.type);
    if (e.type === 'notice') say(e.text);
    if (e.type === 'begin') say('Read the road. Arrows to move, jump, and slide.');
    if (e.type === 'cast') say(`${model.kit.ability}${e.skill === 'jajanken' ? ` · Charging ${model.lockedForm}` : ''}`);
    if (e.type === 'release') say(`${e.form} · Released`);
    if (e.type === 'form') say(`Jajanken · ${e.form} selected`);
    if (e.type === 'gyo') say('Gyo · Concealed aura revealed');
    if (e.type === 'state') say(e.state === 'zetsu' ? 'Zetsu · Recovering aura. Protection lowered.' : 'Ten · Aura restored around the body');
    if (e.type === 'collect' && e.kind === 'electric') say(`Electrical supply · +${model.rules.charge} charge`);
    if (e.type === 'heal' || e.type === 'recover') say('Composure restored');
    if (e.type === 'deflect') say('Attack intercepted');
    if (e.type === 'chapter') say(e.name);
    if (e.type === 'hit') say('Keep your footing. Find a clean stretch.');
    if (e.type === 'turn') say('Turn cleared');
    if (e.type === 'over' || e.type === 'win') { rememberRun(); effectsTime = 0.6; }
  }
}
function refresh() {
  const setup = settingUp, view = setup ? previewModel : model, kit = view.kit, config = view.config;
  root.dataset.screen = setup ? 'setup' : 'play'; root.dataset.state = view.state; root.style.setProperty('--hunter-accent', CHARACTERS[config.character].color);
  byId('hunterSetup').hidden = !setup; byId('hunterConsole').hidden = setup; byId('hunterPoster').hidden = !setup;
  byId('hunterRunHud').hidden = setup; byId('hunterChange').hidden = setup; byId('hunterKeep').hidden = model.phase === 'ready';
  text('hunterKeep', model.phase === 'paused' ? 'Keep my run' : 'Back to result');
  byId('hunterStart').disabled = !ready;
  for (const button of optionButtons) button.setAttribute('aria-pressed', String(config[button.dataset.option] === button.dataset.value));
  text('hunterPosterRole', CHARACTERS[config.character].role); text('hunterPosterNote', CHARACTERS[config.character].note);
  const name = byId('hunterPosterName');
  if (name.dataset.character !== config.character) { name.innerHTML = `${kit.name}<span>${kit.family}</span>`; name.dataset.character = config.character; }
  text('hunterKit', kit.ability); text('hunterEra', kit.era); text('hunterAbilityDescription', descriptions[kit.skill]);
  text('hunterLocation', COURSES[config.course].name.toUpperCase()); text('hunterStageMode', `${config.mode.toUpperCase()} / ${view.rules.name.toUpperCase()}`);
  const previous = records.scores[recordKey(config)] || { distance: 0, score: 0, time: 0 };
  text('hunterSetupRecord', `${config.mode === 'trial' ? `${view.finish.toLocaleString()}m · ` : 'No finish line · '}BEST ${previous.distance.toLocaleString()}m${previous.time ? ` · ${time(previous.time)}` : ''}`);
  byId('hunterStart').firstChild.textContent = config.mode === 'trial' ? 'Start the trial ' : 'Start an endless run ';
  text('hunterDistance', Math.floor(model.distance).toLocaleString()); text('hunterGoal', model.config.mode === 'trial' ? `/ ${model.finish.toLocaleString()} m` : 'METRES / ENDLESS');
  text('hunterChapter', COURSES[model.config.course].places[chapter(model.distance, model.config)]);
  byId('hunterProgress').style.transform = `scaleX(${model.config.mode === 'trial' ? model.distance / model.finish : (model.distance % 650) / 650})`;
  const identity = byId('hunterLivePortrait'); if (identity.dataset.character !== model.config.character) { identity.innerHTML = portrait(model.config.character); identity.dataset.character = model.config.character; }
  text('hunterLiveName', model.kit.name); text('hunterLiveEra', model.kit.era);
  text('hunterReserveLabel', model.kit.nen ? (model.state === 'zetsu' ? 'AURA · ZETSU' : 'AURA') : 'STAMINA');
  for (const [name, value] of [['Aura', model.aura], ['Electric', model.electric]]) {
    text(`hunter${name}`, Math.floor(value)); const meter = byId(`hunter${name}Meter`); meter.setAttribute('aria-valuenow', Math.floor(value)); meter.firstElementChild.style.transform = `scaleX(${value / 100})`;
  }
  byId('hunterAuraMeter').setAttribute('aria-label', model.kit.nen ? 'Aura' : 'Stamina');
  byId('hunterElectricReserve').hidden = !['godspeed', 'palm'].includes(model.kit.skill);
  text('hunterComposure', `${Math.max(0, model.rules.damage - model.strikes)} / ${model.rules.damage}`);
  const playing = model.phase === 'playing' && !setup;
  for (const button of root.querySelectorAll('[data-action]')) button.disabled = !playing;
  byId('hunterPause').disabled = setup || !['playing', 'paused'].includes(model.phase);
  byId('hunterPause').setAttribute('aria-label', model.phase === 'paused' ? 'Resume run' : 'Pause run');
  byId('hunterPause').setAttribute('aria-pressed', String(model.phase === 'paused'));
  byId('hunterSound').setAttribute('aria-pressed', String(records.sound)); byId('hunterSound').setAttribute('aria-label', records.sound ? 'Mute sound' : 'Enable sound');
  for (const button of techniqueButtons) {
    const key = button.dataset.technique, extra = model.kit.skill === 'jajanken' ? 'Choose form' : 'Holy Chain';
    button.hidden = key === 'extra' && model.kit.skill !== 'jajanken' && !(model.config.character === 'kurapika' && model.kit.nen);
    button.disabled = !playing || !model.kit.nen && ['gyo', 'zetsu'].includes(key);
    const reason = model.availability(key); button.setAttribute('aria-disabled', String(Boolean(reason)));
    const wait = key === 'power' ? model.powerWait : key === 'extra' ? model.healWait : key === 'gyo' ? model.gyoWait : 0;
    const enabled = key === 'gyo' ? model.gyo > 0 : key === 'zetsu' ? model.state === 'zetsu' : key === 'power' ? model.power > 0 || model.windup > 0 : false;
    button.dataset.active = String(enabled);
    button.querySelector('strong').textContent = key === 'power' ? model.kit.ability : key === 'extra' ? extra : key === 'gyo' ? 'Gyo' : 'Zetsu';
    button.querySelector('small').textContent = key === 'power' ? { godspeed: 'Speed + one reaction', board: 'A short sprint', echo: 'Confuse an attacker', palm: 'A close-range shock', rod: 'Retrieve a marker', blades: 'Cut a low obstacle', jajanken: 'Commit to an opening', chain: 'Intercept one attack', gum: 'Pull to an anchor' }[model.kit.skill] : key === 'extra' ? model.kit.skill === 'jajanken' ? 'Rock / Scissors / Paper' : 'Restore composure' : key === 'gyo' ? 'Reveal hidden Nen' : 'Recover · vulnerable';
    const cost = !model.kit.nen && ['gyo', 'zetsu'].includes(key) ? 'Not learned' : enabled ? 'ACTIVE' : wait > 0 ? `${Math.ceil(wait)}s recovery` : key === 'power' ? `${model.kit.cost} ${model.kit.nen ? 'aura' : 'stamina'}${model.kit.skill === 'godspeed' ? ' · 65⚡' : model.kit.skill === 'palm' ? ' · 35⚡' : ''}` : key === 'gyo' ? '14 aura' : key === 'zetsu' ? `+${model.rules.recovery}/s` : model.kit.skill === 'jajanken' ? model.form : '36 aura';
    button.querySelector('.hunter-tech-cost').textContent = cost;
    button.setAttribute('aria-label', `${button.querySelector('strong').textContent}. ${cost}. ${reason || 'Ready'}.`);
  }
  const turn = !setup && playing && model.nextTurn();
  byId('hunterTurn').hidden = !turn;
  if (turn) text('hunterTurn', `${turn.side < 0 ? '← LEFT' : 'RIGHT →'} · ${turn.z - model.distance > 35 ? `${Math.ceil(turn.z - model.distance)}m ahead` : turn.choice === turn.side ? 'READY' : 'TURN NOW'}`);
  text('hunterFieldNote', model.kit.nen ? descriptions[model.kit.skill] : 'Before Nen, there was a long road. Read the obstacles and trust your timing.');
  text('hunterLiveBest', `BEST ${Math.max(previous.distance, Math.floor(model.distance)).toLocaleString()}m · ${model.seals} MARKERS`);
  const phase = !setup && ['paused', 'over', 'won'].includes(model.phase) ? model.phase : '';
  byId('hunterOverlay').hidden = !phase; canvas.tabIndex = playing ? 0 : -1;
  if (phase && overlayPhase !== phase) {
    const won = phase === 'won', paused = phase === 'paused';
    text('hunterResultTag', paused ? 'A MOMENT TO BREATHE' : won ? 'TRIAL COMPLETE' : 'THE ROUTE ENDS HERE');
    text('hunterResultTitle', paused ? 'Take your time.' : won ? 'You made it.' : 'One more run?');
    text('hunterResultText', paused ? 'Your route and every technique timer are paused.' : won ? `${model.kit.name} cleared ${COURSES[model.config.course].name}. ${model.strikes === 0 ? 'A steady finish.' : 'Every opening counted.'}` : model.reason);
    byId('hunterResultStats').hidden = paused;
    byId('hunterResultStats').innerHTML = `<span><strong>${Math.floor(model.distance).toLocaleString()}</strong>metres</span><span><strong>${time(model.elapsed)}</strong>run time</span><span><strong>${model.seals}</strong>markers</span>`;
    byId('hunterContinue').firstChild.textContent = paused ? 'Continue run ' : won ? 'Run a new route ' : 'Try this route again ';
    if (active && !byId('hunterGuide').open) byId('hunterContinue').focus({ preventScroll: true });
  }
  overlayPhase = phase;
}
function draw(alpha = 1, dt = 0) { if (scene && active) scene.draw(settingUp ? previewModel : model, { alpha, dt, reducedMotion: reduced.matches, preview: settingUp }); }
function stopFrame() { cancelAnimationFrame(frame); frame = 0; previous = null; accumulator = 0; }
function requestFrame() { if (!frame && active && ready && !suspended && !document.hidden && (settingUp && !reduced.matches || !settingUp && (model.phase === 'playing' || effectsTime > 0))) frame = requestAnimationFrame(tick); }
function tick(now) {
  frame = 0; if (!active || suspended || document.hidden) return;
  const dt = previous === null ? 0 : Math.min(0.05, (now - previous) / 1000); previous = now;
  if (!settingUp && model.phase === 'playing') { accumulator += dt; while (accumulator >= HUNTER.step) { model.step(); accumulator -= HUNTER.step; if (model.phase !== 'playing') { accumulator = 0; break; } } events(); }
  toastTime -= dt; effectsTime -= dt; if (toastTime <= 0) byId('hunterToast').classList.remove('is-visible');
  draw(model.phase === 'playing' && !settingUp ? accumulator / HUNTER.step : 1, dt);
  if (now - hudAt > 90 || model.phase !== 'playing') { refresh(); hudAt = now; }
  requestFrame();
}
async function loadScene() {
  if (scene) { ready = true; return; }
  if (!loading) loading = import('./hunter-scene.js').then(({ HunterScene }) => { scene = new HunterScene(canvas); ready = true; }).catch(error => {
    loading = null; ready = false; text('hunterStatus', 'The 3D view could not open.');
    byId('hunterLoading').querySelector('strong').textContent = 'The 3D view could not open';
    byId('hunterLoading').querySelector('span').textContent = 'Try again, or use a browser with WebGL 2 enabled.'; byId('hunterRetryLoad').hidden = false;
  });
  await loading;
}
async function startView() {
  active = true; suspended = false; overlayPhase = ''; byId('hunterLoading').hidden = ready;
  refresh(); await loadScene(); if (!active) return;
  byId('hunterLoading').hidden = ready;
  if (ready) { scene.resize(); refresh(); draw(); requestFrame(); (settingUp ? byId('hunterStart') : model.phase === 'paused' ? byId('hunterContinue') : canvas).focus({ preventScroll: true }); }
}
function begin(fresh = false) {
  if (!active || !ready) return;
  byId('hunterGuide').open = false; stopFrame(); sound.stop();
  if (settingUp) { rememberRun(); model = new HunterModel((Math.random() * 0xffffffff) >>> 0, selection); records.selection = { ...selection }; save(); settingUp = false; }
  else if (model.phase === 'over' || model.phase === 'won') model.reset(fresh ? (Math.random() * 0xffffffff) >>> 0 : model.seed);
  if (model.phase === 'paused') model.resume(); else model.begin();
  root.closest('.game-modal-content').scrollTop = 0;
  suspended = false; pointer = null; overlayPhase = ''; events(); refresh(); scene.resize(); draw(); requestFrame(); canvas.focus({ preventScroll: true });
}
function pause() { if (model.phase !== 'playing') return; model.pause(); pointer = null; stopFrame(); sound.stop(); refresh(); draw(); }
function setup() {
  pause(); rememberRun(); selection = { ...model.config }; previewModel = new HunterModel(model.seed, selection); settingUp = true; overlayPhase = '';
  byId('hunterGuide').open = false; refresh(); scene?.resize(); draw(); requestFrame(); root.closest('.game-modal-content').scrollTop = 0;
}
function action(name) {
  if (!active || settingUp || suspended || model.phase !== 'playing') return;
  if (name === 'left' || name === 'right') model.move(name === 'left' ? -1 : 1);
  else if (name === 'jump') model.leap(); else if (name === 'slide') model.duck(); else model.cast(name);
  events(); refresh(); draw(); requestFrame();
}
for (const button of optionButtons) button.addEventListener('click', () => {
  if (!settingUp) return;
  selection = options({ ...selection, [button.dataset.option]: button.dataset.value }); previewModel = new HunterModel(model.seed, selection);
  refresh(); draw(); requestFrame(); text('hunterStatus', `${previewModel.kit.name}. ${COURSES[selection.course].name}. ${selection.mode}. ${previewModel.rules.name}. ${previewModel.kit.era}.`);
});
for (const button of root.querySelectorAll('[data-action], [data-technique]')) {
  const run = () => action(button.dataset.action || button.dataset.technique);
  button.addEventListener('pointerdown', e => { if (e.button !== 0 || button.disabled) return; e.preventDefault(); run(); });
  button.addEventListener('click', e => { if (e.detail === 0 && !e.pointerType && !button.disabled) run(); });
}
byId('hunterStart').addEventListener('click', () => begin());
byId('hunterContinue').addEventListener('click', () => begin(model.phase === 'won'));
byId('hunterKeep').addEventListener('click', () => { settingUp = false; selection = { ...model.config }; if (model.phase === 'paused') begin(); else { refresh(); draw(); } });
byId('hunterChange').addEventListener('click', setup); byId('hunterResultSetup').addEventListener('click', setup);
byId('hunterPause').addEventListener('click', () => model.phase === 'paused' ? begin() : pause());
byId('hunterSound').addEventListener('click', () => { records.sound = !records.sound; save(); if (records.sound) sound.play('collect'); else sound.stop(); refresh(); });
byId('hunterGuide').addEventListener('toggle', () => { if (byId('hunterGuide').open) pause(); });
byId('hunterRetryLoad').addEventListener('click', startView);
canvas.addEventListener('pointerdown', e => { if (!active || settingUp || model.phase !== 'playing' || e.button !== 0 || pointer) return; e.preventDefault(); canvas.focus({ preventScroll: true }); pointer = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointerup', e => {
  if (!pointer || pointer.id !== e.pointerId) return; const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y; pointer = null;
  if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) action('jump'); else if (Math.abs(dx) > Math.abs(dy)) action(dx < 0 ? 'left' : 'right'); else action(dy < 0 ? 'jump' : 'slide');
});
for (const name of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(name, () => { pointer = null; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (!active || settingUp || suspended || e.altKey || e.metaKey || e.ctrlKey || e.target.closest('input,select,textarea,summary')) return;
  const key = e.key.toLowerCase();
  if (key === 'p' && !e.repeat && ['playing', 'paused'].includes(model.phase)) { e.preventDefault(); model.phase === 'paused' ? begin() : pause(); return; }
  const directions = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'jump', w: 'jump', arrowdown: 'slide', s: 'slide', '1': 'gyo', '2': 'zetsu', '3': 'power', '4': 'extra' };
  const name = directions[key] || (key === ' ' && e.target === canvas ? 'jump' : null);
  if (name && model.phase === 'playing') { e.preventDefault(); if (!e.repeat) action(name); }
});
function suspend() { if (!active) return; pause(); suspended = true; pointer = null; stopFrame(); sound.stop(); }
window.addEventListener('blur', suspend);
window.addEventListener('focus', () => { if (active && !document.hidden) { suspended = false; previous = null; requestFrame(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); else if (active) { suspended = false; previous = null; requestFrame(); } });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); suspend(); text('hunterStatus', 'Graphics paused. Waiting for the view to recover.'); });
canvas.addEventListener('webglcontextrestored', () => { if (active) { suspended = false; scene?.reset(settingUp ? previewModel : model); refresh(); draw(); requestFrame(); } });
new ResizeObserver(() => { if (active && ready) { scene.resize(); draw(); } }).observe(canvas);
reduced.addEventListener('change', () => { if (active) { stopFrame(); draw(); requestFrame(); } });
export const hunterRun = { start: startView, stop() { model.pause(); active = false; suspended = false; pointer = null; stopFrame(); sound.stop(); rememberRun(); } };
