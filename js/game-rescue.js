import { MISSIONS, MAX_MISSES, RescueModel, WordDeck } from './rescue-model.js';
import { portrait, scene, bindingArt, crackArt } from './rescue-art.js';

const root = document.getElementById('gameRescuePanel');
const preview = document.getElementById('rescuePreview');
const model = new RescueModel();
const deck = new WordDeck();
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let showDesktopKeys = false;
let selected = MISSIONS[0], active = false, screen = 'choose', effectTimer = 0, finishTimer = 0;
root.dataset.active = 'false';
let records = {};
try {
  const saved = JSON.parse(localStorage.getItem('portfolio.shinobi-rescue.v1'));
  for (const mission of MISSIONS) records[mission.id] = Number.isSafeInteger(saved?.[mission.id]) && saved[mission.id] > 0 ? Math.min(99999, saved[mission.id]) : 0;
} catch { /* Rescue counts remain available in this visit without storage. */ }
if (preview) preview.innerHTML = scene(MISSIONS[0], 'rescue-preview');

root.innerHTML = `
  <div class="sr-heading"><div><span class="sr-eyebrow">NARUTO · A HANGMAN RESCUE</span><h4>Break the jutsu.</h4></div><button type="button" class="sr-text-button" id="srChoose" hidden>Change shinobi</button></div>
  <div id="srCharacters" class="sr-characters" role="group" aria-label="Choose your shinobi">
    ${MISSIONS.map((m,i)=>`<button type="button" class="sr-character" data-shinobi="${m.id}" aria-pressed="${i===0}" style="--card-accent:${m.color}"><span class="sr-portrait">${portrait(m.hero)}</span><span class="sr-character-copy"><strong>${m.hero}</strong><small>vs. ${m.enemy}</small></span><span class="sr-selected-mark" aria-hidden="true">↗</span></button>`).join('')}
  </div>
  <div class="sr-stage" id="srStage" role="img" aria-label="">
    <div id="srArt"></div>
    <div class="sr-scene-top"><span id="srLocation"></span><span class="sr-signal"><i></i><span id="srSignal">RESCUE MISSION</span></span></div>
    <div class="sr-nameplates"><span><small>YOU</small><b id="srHeroName"></b></span><span><small id="srCaptiveState">TRAPPED</small><b id="srCaptiveName"></b></span><span><small>OPPONENT</small><b id="srEnemyName"></b></span></div>
    <div class="sr-impact-label" id="srImpact" aria-hidden="true"></div>
  </div>
  <div id="srBriefing" class="sr-briefing">
    <div><span class="sr-eyebrow" id="srMissionLabel"></span><h5 id="srMissionTitle"></h5><p id="srIntro"></p><p class="sr-rule">Correct letters crack the seal. Six wrong guesses complete it.</p></div>
    <div class="sr-deploy"><button type="button" class="sr-primary" id="srBegin">Begin rescue <span aria-hidden="true">↗</span></button><button type="button" class="sr-text-button" id="srResume" hidden>Resume current rescue</button><span id="srRecord"></span></div>
  </div>
  <div id="srPlay" class="sr-play" hidden>
    <div class="sr-pressure"><div><span id="srJutsu"></span><strong id="srRemaining"></strong></div><div class="sr-pressure-track" aria-hidden="true">${Array.from({length:MAX_MISSES},()=>'<i></i>').join('')}</div></div>
    <div class="sr-puzzle-layout"><div class="sr-puzzle"><span class="sr-eyebrow">BREAK THE INSCRIPTION</span><p id="srClue"></p><div id="srWord" class="sr-word" role="group" tabindex="0" aria-label="Hidden word" aria-describedby="srClue srTypeHint"></div><span id="srWordReader" class="sr-reader"></span></div>
      <div class="sr-desktop-input"><p id="srTypeHint">Type a letter on your keyboard.</p><p class="sr-missed-label">MISSED LETTERS</p><p id="srMissed" class="sr-missed">None yet</p><span>No timer. Take your time.</span></div><div class="sr-input"><div id="srKeyboard" class="sr-keyboard" role="group" aria-label="Guess a letter">${['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map(row=>`<div class="sr-key-row">${[...row].map(c=>`<button type="button" data-letter="${c}" aria-label="Guess ${c}">${c}</button>`).join('')}</div>`).join('')}</div><p class="sr-key-help">Type a letter or tap a key. No timer.</p></div>
    </div>
    <p id="srStatus" class="sr-status" aria-hidden="true"></p><p id="srAnnouncement" class="sr-reader" role="status" aria-live="polite" aria-atomic="true"></p>
    <div id="srResult" class="sr-result" hidden><div><span class="sr-eyebrow" id="srResultTag"></span><h5 id="srResultTitle"></h5><p id="srResultText"></p></div><button type="button" class="sr-primary" id="srNext">Next rescue <span aria-hidden="true">↗</span></button></div>
  </div>
  <div class="sr-footer"><span>Original fan encounters · Techniques adapted for play</span><details><summary>How to play</summary><p>Use the clue to guess the hidden word, one letter at a time. Every matching letter is revealed together. Correct guesses fracture the prison; each wrong guess advances the restraint. Save your teammate before six mistakes. Repeated letters cost nothing. Escape closes the arcade. Changing missions starts a new word; you can resume before starting another rescue.</p><button type="button" id="srToggleKeys" class="sr-text-button" aria-pressed="false">Show letter keys on desktop</button></details></div>
`;
const $ = selector => root.querySelector(selector);
function usesLetterKeys() { return !desktopPointer.matches || showDesktopKeys; }
function focusGuessInput() {
  const target = usesLetterKeys() ? $('#srKeyboard button:not(:disabled)') : $('#srWord');
  target?.focus({preventScroll:true});
}
function syncInputMode() {
  root.dataset.keyboard = usesLetterKeys() ? 'touch' : 'physical';
  $('#srToggleKeys').hidden = !desktopPointer.matches;
  $('#srToggleKeys').setAttribute('aria-pressed', String(showDesktopKeys));
  $('#srToggleKeys').textContent = showDesktopKeys ? 'Hide letter keys on desktop' : 'Show letter keys on desktop';
  if (active && screen === 'play' && model.phase === 'playing' &&
      (document.activeElement === $('#srWord') || document.activeElement?.matches('[data-letter]'))) focusGuessInput();
}
desktopPointer.addEventListener('change', syncInputMode);
$('#srToggleKeys').addEventListener('click', () => { showDesktopKeys = !showDesktopKeys; syncInputMode(); });

function clearEffects() {
  clearTimeout(effectTimer); clearTimeout(finishTimer);
  effectTimer = finishTimer = 0;
  root.classList.remove('sr-hit', 'sr-miss');
}
function setTheme(mission) {
  root.dataset.mission = mission.id;
  root.style.setProperty('--sr-accent', mission.color);
  root.style.setProperty('--sr-energy', mission.energy);
  $('#srArt').innerHTML = scene(mission);
  $('#srLocation').textContent = mission.location;
  $('#srHeroName').textContent = mission.hero;
  $('#srCaptiveName').textContent = mission.captive;
  $('#srCaptiveState').textContent = 'TRAPPED';
  $('#srEnemyName').textContent = mission.enemy;
  $('#srStage').setAttribute('aria-label', `${mission.hero} faces ${mission.enemy}. ${mission.captive} is trapped in a ${mission.jutsu.toLowerCase()}.`);
  $('.sr-bindings').innerHTML = bindingArt(mission, 0);
}
function choose(mission = selected) {
  clearEffects(); selected = mission; screen = 'choose';
  root.dataset.phase = 'ready'; root.dataset.screen = screen;
  $('#srCharacters').hidden = false; $('#srBriefing').hidden = false; $('#srPlay').hidden = true; $('#srChoose').hidden = true;
  root.querySelectorAll('[data-shinobi]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shinobi === mission.id)));
  setTheme(mission);
  $('#srSignal').textContent = 'RESCUE MISSION';
  $('#srMissionLabel').textContent = `SAVE ${mission.captive.toUpperCase()} · ${mission.jutsu.toUpperCase()}`;
  $('#srMissionTitle').textContent = mission.title;
  $('#srIntro').textContent = mission.intro;
  $('#srRecord').textContent = `Successful rescues: ${records[mission.id] || 0}`;
  $('#srBegin').firstChild.textContent = `Save ${mission.captive} `;
  $('#srResume').hidden = model.phase !== 'playing';
  if (model.phase === 'playing') $('#srResume').textContent = `Resume ${MISSIONS.find(m=>m.id===model.mission).hero}’s rescue`;
}
function openPlay() {
  clearEffects(); screen = 'play'; root.dataset.screen = screen;
  $('#srCharacters').hidden = true; $('#srBriefing').hidden = true; $('#srPlay').hidden = false; $('#srChoose').hidden = false;
  $('#srResult').hidden = true; $('#srKeyboard').hidden = false; $('.sr-key-help').hidden = false;
  setTheme(selected); render();
  focusGuessInput();
}
function announce(message, word = '') {
  $('#srStatus').textContent = message;
  $('#srAnnouncement').textContent = message + (word ? ` Word: ${word}.` : '');
}
function begin() {
  model.start(selected.id, deck.next(selected)); openPlay();
  announce(`${selected.captive} is trapped. Solve the inscription before six mistakes.`);
}
function render() {
  root.dataset.phase = model.phase;
  $('#srCaptiveState').textContent = model.phase === 'won' ? 'RESCUED' : 'TRAPPED';
  root.style.setProperty('--sr-pressure', model.misses / MAX_MISSES);
  const remaining = MAX_MISSES - model.misses;
  $('#srSignal').textContent = model.phase === 'won' ? 'RESCUE COMPLETE' : model.phase === 'lost' ? 'SIGNAL LOST' : remaining === 1 ? 'LAST CHANCE' : 'RESCUE IN PROGRESS';
  $('#srJutsu').textContent = selected.jutsu;
  $('#srRemaining').textContent = model.phase === 'won' ? 'SEAL BROKEN' : `${remaining} ${remaining===1?'mistake':'mistakes'} left`;
  root.querySelectorAll('.sr-pressure-track i').forEach((bar,i)=>bar.classList.toggle('is-filled', i<model.misses));
  $('#srClue').textContent = model.clue;
  $('#srWord').innerHTML = [...model.answer].map(c=>`<span class="${model.guessed.has(c)?'is-found':model.phase==='lost'?'is-revealed':''}" aria-hidden="true">${model.guessed.has(c)||model.phase==='lost'?c:'·'}</span>`).join('');
  $('#srWord').setAttribute('aria-label', `${model.answer.length} letters: ${[...model.answer].map(c=>model.guessed.has(c)||model.phase==='lost'?c:'blank').join(', ')}`);
  $('#srWordReader').textContent = `Word: ${[...model.answer].map(c=>model.guessed.has(c)||model.phase==='lost'?c:'blank').join(', ')}.`;
  root.querySelectorAll('[data-letter]').forEach(button=>{
    const c = button.dataset.letter, guessed = model.guessed.has(c), hit = guessed && model.answer.includes(c);
    button.disabled = guessed || model.phase !== 'playing';
    button.classList.toggle('is-hit', hit); button.classList.toggle('is-miss', guessed && !hit);
    button.setAttribute('aria-label', `${c}${guessed?hit?', correct':', incorrect':', unguessed'}`);
  });
  const missed = [...model.guessed].filter(c => !model.answer.includes(c));
  $('#srMissed').textContent = missed.length ? missed.join('  ') : 'None yet';
  $('.sr-bindings').innerHTML = bindingArt(selected, model.misses);
  $('.sr-cracks').innerHTML = crackArt(model.progress);
  $('#srStage').setAttribute('aria-label', model.phase === 'won' ? `${selected.hero} shattered the ${selected.jutsu.toLowerCase()}. ${selected.captive} is safe.` : model.phase === 'lost' ? `${selected.enemy} completed the ${selected.jutsu.toLowerCase()}. ${selected.captive} is still trapped.` : `${selected.captive} is trapped. ${model.misses} of six restraint stages; ${Math.round(model.progress*100)} percent of the inscription solved. ${remaining} mistakes remain.`);
}
function result(focus = true) {
  finishTimer = 0;
  if (screen !== 'play' || model.phase === 'playing') return;
  const won = model.phase === 'won';
  $('#srResult').hidden = false; $('#srKeyboard').hidden = true; $('.sr-key-help').hidden = true;
  $('#srResultTag').textContent = won ? `${selected.attack.toUpperCase()} · SEAL BROKEN` : 'MISSION FAILED';
  $('#srResultTitle').textContent = won ? `${selected.captive} is safe.` : 'The jutsu took hold.';
  $('#srResultText').textContent = won ? `${selected.hero} broke through with ${MAX_MISSES-model.misses} ${MAX_MISSES-model.misses===1?'chance':'chances'} remaining. Rescues: ${records[selected.id]}.` : `The inscription was ${model.answer}. ${selected.captive} is still counting on you.`;
  $('#srNext').firstChild.textContent = won ? 'Next rescue ' : 'Try another word ';
  if (active && focus) $('#srNext').focus({preventScroll:true});
}
function guess(letter) {
  if (!active || screen !== 'play' || document.hidden) return;
  const outcome = model.guess(letter);
  if (outcome === 'ignored') return;
  clearEffects(); render();
  // Restart the short CSS response without an animation loop or blocked input.
  void root.offsetWidth;
  root.classList.add(outcome==='hit'?'sr-hit':'sr-miss');
  $('#srImpact').textContent = outcome==='hit' ? model.phase==='won'?selected.attack:'SEAL FRACTURED' : selected.threat[model.misses];
  const spokenWord = [...model.answer].map(c=>model.guessed.has(c)?c:'blank').join(', ');
  announce(model.phase === 'won' ? `${selected.captive} rescued! The word was ${model.answer}.` : model.phase === 'lost' ? `Rescue failed. The word was ${model.answer}.` : `${letter.toUpperCase()}: ${outcome==='hit'?'correct. The seal cracks.':`incorrect. ${selected.threat[model.misses]}`}`, model.phase === 'playing' ? `${spokenWord}. ${MAX_MISSES-model.misses} mistakes left` : '');
  effectTimer = window.setTimeout(()=>root.classList.remove('sr-hit','sr-miss'), 650);
  if (model.phase !== 'playing') {
    if (model.phase === 'won') {
      records[selected.id] = Math.min(99999, (records[selected.id] || 0) + 1);
      try { localStorage.setItem('portfolio.shinobi-rescue.v1', JSON.stringify(records)); } catch { /* Optional persistence. */ }
    }
    finishTimer = window.setTimeout(()=>result(), motion.matches ? 0 : 1100);
  } else if (document.activeElement?.matches('[data-letter]:disabled')) {
    focusGuessInput();
  }
}
root.addEventListener('click', event=>{
  const button = event.target.closest('button'); if (!button || !active) return;
  if (button.dataset.shinobi) choose(MISSIONS.find(m=>m.id===button.dataset.shinobi));
  else if (button.dataset.letter) guess(button.dataset.letter);
});
$('#srBegin').addEventListener('click', begin);
$('#srNext').addEventListener('click', begin);
$('#srChoose').addEventListener('click', ()=>{ choose(); root.querySelector(`[data-shinobi="${selected.id}"]`).focus({preventScroll:true}); });
$('#srResume').addEventListener('click', ()=>{ selected = MISSIONS.find(m=>m.id===model.mission); openPlay(); announce('Rescue resumed. Your guesses are preserved.'); });
window.addEventListener('keydown', event=>{
  if (!active || screen !== 'play' || model.phase !== 'playing' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.isComposing || event.target.closest('input,textarea,select,summary,[contenteditable="true"]')) return;
  if (/^[a-z]$/i.test(event.key)) { event.preventDefault(); guess(event.key); }
});
export const shinobiRescue = {
  start() {
    active = true; root.dataset.active = 'true';
    if (screen === 'choose') root.querySelector(`[data-shinobi="${selected.id}"]`).focus({preventScroll:true});
    else if (model.phase !== 'playing') result();
    else focusGuessInput();
  },
  stop() {
    active = false; root.dataset.active = 'false'; clearEffects();
    if (screen === 'play' && model.phase !== 'playing') result(false);
  }
};
syncInputMode();
choose();
