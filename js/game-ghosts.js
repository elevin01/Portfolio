import { CASES, ENTITIES, GhostModel } from './ghost-model.js';
import { icon, ghostArt, badgeArt, trapArt, cityArt } from './ghost-art.js';
import { GhostEffects, GhostAudio } from './ghost-effects.js';

const root = document.getElementById('gameGhostPanel');
const storageKey = 'portfolio.ghostbusters.v1';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const model = new GhostModel();
const audio = new GhostAudio();
let active = false, busy = false, selectedCase = 0, mode = 'investigate', focusedRoom = 0;
let longPress = 0, pointer = null, suppressedClick = null;
let records = { entities: {}, cases: {}, sound: false };

try {
  const stored = JSON.parse(localStorage.getItem(storageKey));
  for (const key of Object.keys(ENTITIES)) {
    const count = stored?.entities?.[key];
    if (Number.isSafeInteger(count) && count > 0) records.entities[key] = Math.min(count, 99999);
  }
  for (const contract of CASES) {
    const stars = stored?.cases?.[contract.id];
    if (Number.isInteger(stars) && stars > 0 && stars <= 3) records.cases[contract.id] = stars;
  }
  records.sound = stored?.sound === true;
} catch { /* Progress stays available for this visit if storage is disabled. */ }
audio.enabled = records.sound;

root.innerHTML = `
  <div id="ghostBriefing" class="ghost-briefing">
    <div class="ghost-hero">
      ${cityArt('ghostBrief')}
      <div class="ghost-hero-shade"></div>
      <div class="ghost-hero-copy"><span class="ghost-eyebrow">PARANORMAL FIELD DIVISION</span><h4>Night shift.</h4><p>New York has a ghost problem.</p></div>
      <div class="ghost-hero-slimer">${ghostArt('slimer')}</div>
      <div class="ghost-hero-badge">${badgeArt()}</div>
      <span class="ghost-hero-tag"><i></i> DISPATCH ONLINE</span>
    </div>
    <div class="ghost-brief-heading"><div><span class="ghost-eyebrow">MINESWEEPER · GHOSTBUSTERS</span><h4>Take the call.</h4></div><span class="ghost-case-stamp">NYC<br>1984</span></div>
    <div class="ghost-case-options" role="group" aria-label="Choose a case">
      ${CASES.map((c, i) => `<button type="button" class="ghost-case-option" data-case="${i}" aria-pressed="${i === 0}"><span class="ghost-case-number">CASE 0${i + 1}<span data-case-stars="${c.id}"></span></span><strong>${['Hotel', 'Library', 'Subway'][i]}</strong><span>${c.ghosts} ghosts · ${c.rows} × ${c.cols}</span></button>`).join('')}
    </div>
    <p id="ghostCaseDescription" class="ghost-case-description"></p>
    <div class="ghost-brief-steps">
      <div>${icon('investigate')}<strong>Investigate</strong><p>Numbers count ghosts in the 8 surrounding rooms.</p></div>
      <div>${icon('mark')}<strong>Deduce</strong><p>Mark suspects. Use two scans when you need certainty.</p></div>
      <div>${icon('trap')}<strong>Contain</strong><p>Trap every ghost. Three disturbances end the case.</p></div>
    </div>
    <button type="button" id="ghostBegin" class="ghost-primary">Enter the Sedgewick ${icon('arrow')}</button>
    <p class="ghost-first-safe">Your first investigation is always safe. Take your time.</p>
  </div>

  <div id="ghostMission" class="ghost-mission" hidden>
    <div class="ghost-mission-heading"><div><span id="ghostCaseLabel" class="ghost-eyebrow"></span><h4 id="ghostCaseName"></h4></div><button type="button" id="ghostCases" class="ghost-text-button">${icon('case')} Case files</button></div>
    <div class="ghost-instruments">
      <div class="ghost-counter"><span>CONTAINED</span><strong><span id="ghostCount">0</span><small id="ghostTotal"> / 6</small></strong></div>
      <div class="ghost-meter"><span id="ghostPkeLabel">PKE · STANDBY</span><div class="ghost-meter-bars" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i style="--bar:${i}"></i>`).join('')}</div></div>
      <div class="ghost-disturbance"><span>DISTURBANCE</span><div id="ghostStrikes" aria-label="0 of 3 disturbances"><i></i><i></i><i></i></div></div>
    </div>
    <div id="ghostField" class="ghost-field">
      <div class="ghost-floor-label"><span id="ghostFloorLabel">FLOOR PLAN</span><span id="ghostRoomHint">SELECT A ROOM</span></div>
      <div id="ghostBoard" class="ghost-board" role="grid" aria-label="Haunted building floor plan" aria-describedby="ghostHint"></div>
      <div class="ghost-trap-dock">${trapArt()}<span id="ghostDockLabel">CONTAINMENT UNIT READY</span></div>
      <canvas class="ghost-fx" aria-hidden="true"></canvas><div class="ghost-actors" aria-hidden="true"></div>
      <div id="ghostResult" class="ghost-result" hidden>
        <div class="ghost-result-card"><div id="ghostResultArt"></div><span id="ghostResultTag" class="ghost-eyebrow"></span><h4 id="ghostResultTitle"></h4><div id="ghostResultStars" class="ghost-result-stars"></div><p id="ghostResultText"></p><button type="button" id="ghostResultNext" class="ghost-primary"></button><button type="button" id="ghostReplay" class="ghost-text-button">${icon('retry')} Replay this case</button></div>
      </div>
    </div>
    <div class="ghost-controls">
      <div class="ghost-tools" role="group" aria-label="Investigation tools">
        ${[['investigate', 'Investigate', 'I'], ['mark', 'Mark', 'M'], ['trap', 'Trap', 'T'], ['scan', 'Scan', 'S']].map(([id, label, key]) => `<button type="button" data-tool="${id}" aria-pressed="${id === 'investigate'}" aria-keyshortcuts="${key}" title="${label} (${key})">${icon(id)}<span>${label}${id === 'scan' ? ' <b id="ghostScans">2</b>' : ''}</span></button>`).join('')}
      </div>
      <p id="ghostHint" class="ghost-hint" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>
  </div>

  <div class="ghost-footer-tools">
    <details id="ghostGuide" class="ghost-guide"><summary>${icon('help')} Field guide</summary><div>
      <p><strong>Read the numbers.</strong> Each counts haunted sites in the eight surrounding rooms, including captured ghosts. Empty rooms spread open automatically.</p>
      <p><strong>Mark is a guess. Scan is proof.</strong> Mark and unmark freely. A scan safely opens a room or confirms a ghost. You have two per case.</p>
      <p><strong>Trap every ghost to win.</strong> Investigating a ghost or trapping an empty room causes one disturbance. Three end the case. Confirmed ghosts still need a trap.</p>
      <p><strong>Clear faster.</strong> In Investigate mode, tap a number again when its neighboring ghosts are all marked or confirmed. Incorrect marks can trigger ghosts.</p>
      <p><strong>Controls.</strong> Tap a tool, then a room. Right-click or hold a room to mark it. Arrow keys move between rooms; Enter or Space acts. I / M / T / S select tools.</p>
    </div></details>
    <button type="button" id="ghostSound" class="ghost-text-button" aria-pressed="false"></button>
  </div>
  <details id="ghostJournal" class="ghost-journal"><summary><span>${icon('trap')} Containment log</span><span id="ghostJournalCount">0 / 3</span></summary><div id="ghostCollection" class="ghost-collection"></div></details>
`;

const $ = selector => root.querySelector(selector);
const board = $('#ghostBoard');
const field = $('#ghostField');
const effects = new GhostEffects(field, reducedMotion);
let rooms = [];

const hints = {
  investigate: 'Tap a room to investigate. Numbers count nearby haunted sites.',
  mark: 'Tap an unknown room to mark a suspect. Tap it again to unmark.',
  trap: 'Tap a suspected or confirmed ghost to contain it. Empty traps cause a disturbance.',
  scan: 'Tap one unknown room for a safe PKE scan. Two charges per case.'
};

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Keep progress in memory. */ }
}

function status(text, tone = '') {
  $('#ghostHint').textContent = text;
  $('#ghostHint').dataset.tone = tone;
}

function updateCollection() {
  $('#ghostJournalCount').textContent = `${Object.keys(records.entities).length} / ${Object.keys(ENTITIES).length}`;
  $('#ghostCollection').innerHTML = Object.entries(ENTITIES).map(([key, entity]) => {
    const caught = records.entities[key] || 0;
    return `<div class="ghost-entry ${caught ? 'is-found' : ''}"><div class="ghost-entry-portrait">${ghostArt(key)}</div><strong>${caught ? entity.name : 'Unidentified'}</strong><span>${caught ? `${caught} contained` : 'Awaiting capture'}</span><p>${caught ? entity.note : 'There is something out there.'}</p></div>`;
  }).join('');
  root.querySelectorAll('[data-case-stars]').forEach(el => {
    const stars = records.cases[el.dataset.caseStars] || 0;
    el.innerHTML = Array.from({ length: stars }, () => icon('star')).join('');
    el.setAttribute('aria-label', `${stars} stars earned`);
  });
}

function updateSound() {
  $('#ghostSound').innerHTML = `${icon(audio.enabled ? 'sound' : 'muted')} Sound ${audio.enabled ? 'on' : 'off'}`;
  $('#ghostSound').setAttribute('aria-pressed', String(audio.enabled));
}

function selectCase(index) {
  if (!CASES[index]) return;
  selectedCase = index;
  root.querySelectorAll('[data-case]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.case) === index)));
  $('#ghostCaseDescription').textContent = CASES[index].description;
  $('#ghostBegin').innerHTML = `${['Enter the Sedgewick', 'Enter the library', 'Enter the station'][index]} ${icon('arrow')}`;
}

function cancelPress() { clearTimeout(longPress); longPress = 0; pointer = null; }

function clearEffects() {
  cancelPress();
  suppressedClick = null;
  effects.cancel();
  audio.stop();
  busy = false;
  board.setAttribute('aria-busy', 'false');
}

function briefing() {
  clearEffects();
  $('#ghostBriefing').hidden = false;
  $('#ghostMission').hidden = true;
  $('#ghostResult').hidden = true;
  $('#ghostGuide').open = false;
  $('#ghostJournal').open = false;
  root.dataset.phase = 'briefing';
  updateCollection();
  selectCase(selectedCase);
  $('#ghostBegin').focus({ preventScroll: true });
}

function roomName(index) {
  return `${String.fromCharCode(65 + Math.floor(index / model.contract.cols))}${index % model.contract.cols + 1}`;
}

function focusRoom(index, focus = true) {
  if (!rooms[index]) return;
  rooms[focusedRoom]?.setAttribute('tabindex', '-1');
  focusedRoom = index;
  rooms[index].tabIndex = 0;
  if (focus) rooms[index].focus({ preventScroll: true });
  $('#ghostRoomHint').textContent = `ROOM ${roomName(index)}`;
}

function buildBoard() {
  board.replaceChildren();
  board.inert = false;
  rooms = [];
  const { rows, cols } = model.contract;
  board.setAttribute('aria-rowcount', String(rows));
  board.setAttribute('aria-colcount', String(cols));
  for (let row = 0; row < rows; row++) {
    const line = document.createElement('div');
    line.className = 'ghost-row';
    line.setAttribute('role', 'row');
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ghost-room';
      button.dataset.room = String(index);
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-rowindex', String(row + 1));
      button.setAttribute('aria-colindex', String(col + 1));
      button.tabIndex = index === 0 ? 0 : -1;
      line.append(button); rooms.push(button);
    }
    board.append(line);
  }
  focusedRoom = 0;
}

function render() {
  const ended = ['won', 'lost'].includes(model.phase);
  root.dataset.phase = model.phase;
  root.dataset.mode = mode;
  rooms.forEach((button, index) => {
    const cell = model.cells[index];
    const exposed = cell.confirmed || (model.phase === 'lost' && cell.ghost);
    const state = cell.captured ? 'captured' : exposed ? 'ghost' : cell.open ? 'open' : cell.marked ? 'marked' : 'closed';
    const key = `${state}:${cell.open ? cell.adjacent : ''}`;
    if (button.dataset.rendered !== key) {
      button.dataset.rendered = key;
      button.dataset.state = state;
      button.dataset.count = cell.open ? String(cell.adjacent) : '';
      const content = state === 'captured' ? icon('trap') : state === 'ghost' ? ghostArt(cell.species) : state === 'marked' ? icon('mark') : cell.open && cell.adjacent ? `<span class="ghost-clue">${cell.adjacent}</span>` : '<span class="ghost-door"></span>';
      button.innerHTML = `<span class="ghost-room-number" aria-hidden="true">${roomName(index)}</span><span class="ghost-room-content" aria-hidden="true">${content}</span>`;
      const label = state === 'captured' ? `${ENTITIES[cell.species].name} contained, haunted site` : state === 'ghost' ? 'confirmed ghost, ready to trap' : cell.open ? `${cell.adjacent} neighboring haunted sites` : cell.marked ? 'marked suspect, unconfirmed' : 'uninvestigated';
      button.setAttribute('aria-label', `Room ${roomName(index)}, ${label}`);
    }
    button.setAttribute('aria-disabled', String(ended || busy));
  });
  $('#ghostCount').textContent = model.captured;
  $('#ghostTotal').textContent = ` / ${model.contract.ghosts}`;
  $('#ghostScans').textContent = model.scans;
  $('#ghostStrikes').setAttribute('aria-label', `${model.strikes} of 3 disturbances`);
  [...$('#ghostStrikes').children].forEach((pip, i) => pip.classList.toggle('is-hit', i < model.strikes));
  root.querySelectorAll('[data-tool]').forEach(button => {
    const tool = button.dataset.tool;
    button.setAttribute('aria-pressed', String(tool === mode));
    button.disabled = busy || ended || (model.phase === 'ready' && tool !== 'investigate') || (tool === 'scan' && model.scans === 0);
  });
}

function startCase(index = selectedCase) {
  clearEffects();
  selectedCase = index;
  model.reset(index);
  root.dataset.case = model.contract.id;
  mode = 'investigate';
  $('#ghostBriefing').hidden = true;
  $('#ghostMission').hidden = false;
  $('#ghostResult').hidden = true;
  $('#ghostJournal').open = false;
  $('#ghostGuide').open = false;
  $('#ghostCaseLabel').textContent = `CASE 0${index + 1} / ${model.contract.district}`;
  $('#ghostCaseName').textContent = model.contract.name;
  $('#ghostFloorLabel').textContent = `${model.contract.rows * model.contract.cols} ROOMS · ${model.contract.ghosts} SIGNALS`;
  $('#ghostPkeLabel').textContent = 'PKE · STANDBY';
  root.style.setProperty('--pke', '0');
  $('#ghostDockLabel').textContent = 'CONTAINMENT UNIT READY';
  buildBoard(); render();
  status('Start in any room. Your first investigation opens a safe area.');
  focusRoom(0);
}

function selectTool(tool) {
  if (!active || busy || !hints[tool] || ['won', 'lost'].includes(model.phase)) return;
  if (model.phase === 'ready' && tool !== 'investigate') { status('Investigate your first room before selecting another tool.'); return; }
  if (tool === 'scan' && !model.scans) { status('Both scanner charges used. Work from the remaining clues.'); return; }
  mode = tool;
  render(); status(hints[tool]);
}

function showResult() {
  if (!active || !['won', 'lost'].includes(model.phase)) return;
  const won = model.phase === 'won';
  $('#ghostResult').hidden = false;
  $('#ghostResult').dataset.outcome = model.phase;
  $('#ghostResultArt').innerHTML = won ? trapArt() : ghostArt('slimer');
  $('#ghostResultTag').textContent = won ? 'ALL ENTITIES ACCOUNTED FOR' : 'DISPATCH · TEAM WITHDRAWN';
  $('#ghostResultTitle').textContent = won ? 'Case closed.' : 'Too much activity.';
  $('#ghostResultStars').innerHTML = won ? [0, 1, 2].map(i => `<span class="${i < model.stars ? 'is-earned' : ''}">${icon('star')}</span>`).join('') : '';
  $('#ghostResultStars').setAttribute('aria-label', won ? `${model.stars} of 3 stars earned` : '');
  $('#ghostResultText').textContent = won ? `${model.captured} ghosts contained. ${model.strikes === 0 ? 'No disturbances. A clean sweep.' : `${model.strikes} disturbance${model.strikes > 1 ? 's' : ''}. The building is secure.`}` : `${model.captured} of ${model.contract.ghosts} contained. Scan uncertain rooms and trap confirmed ghosts.`;
  $('#ghostResultNext').innerHTML = `${won ? (selectedCase < CASES.length - 1 ? 'Take the next call' : 'Back to case files') : 'Try the case again'} ${icon('arrow')}`;
  $('#ghostReplay').hidden = !won;
  status(won ? `Case closed. ${model.stars} stars. All ghosts contained.` : 'Three disturbances. The case has ended.', won ? 'success' : 'error');
  $('#ghostResultNext').focus({ preventScroll: true });
  board.inert = true;
  if (won) audio.play('win');
}

function act(index, action = mode) {
  if (!active || busy || document.hidden) return;
  const outcome = model.act(action, index);
  if (outcome.type === 'ignored') return;
  focusRoom(index, false);
  if (action === 'scan' && ['signal', 'scan-clear'].includes(outcome.type)) mode = 'investigate';
  if (outcome.type === 'captured') busy = true;
  render();
  const cell = model.cells[index];
  if (cell.open) {
    $('#ghostPkeLabel').textContent = `PKE · ${cell.adjacent} NEARBY`;
    root.style.setProperty('--pke', String(cell.adjacent));
  } else if (cell.confirmed) {
    $('#ghostPkeLabel').textContent = outcome.type === 'captured' ? 'PKE · CONTAINING' : 'PKE · ENTITY FOUND';
    root.style.setProperty('--pke', '8');
  }
  const texts = {
    start: 'Investigate a room first. Your opening is always safe.',
    secured: 'Ghost contained. This site still counts toward neighboring clues.',
    known: 'This room has already been investigated.',
    confirmed: 'Ghost confirmed. Select Trap, then tap this room to contain it.',
    'marked-room': 'A marked suspect. Select Trap to capture, or Mark to remove the marker.',
    marked: `Room ${roomName(index)} marked. A suspect, not yet confirmed.`,
    unmarked: `Marker removed from room ${roomName(index)}.`,
    revealed: `${outcome.changed.length} room${outcome.changed.length === 1 ? '' : 's'} cleared. Numbers count all neighboring haunted sites.`,
    disturbed: `Ghost disturbed! ${3 - model.strikes} ${3 - model.strikes === 1 ? 'mistake' : 'mistakes'} left. Confirmed ghosts need a trap.`,
    signal: 'PKE confirms a ghost. Select Trap and capture it safely.',
    'scan-clear': `No ghost here. ${model.scans} scanner charge${model.scans === 1 ? '' : 's'} left.`,
    'no-scans': 'Both scanner charges used. Work from the remaining clues.',
    'empty-trap': `Empty trap. Disturbance increased. ${3 - model.strikes} ${3 - model.strikes === 1 ? 'mistake' : 'mistakes'} left.`,
    clue: outcome.remaining ? `Find ${outcome.remaining} more neighboring haunted ${outcome.remaining === 1 ? 'site' : 'sites'} before clearing around this clue.` : 'Check your marks: they must match this room’s number.'
  };
  if (outcome.type !== 'captured') status(texts[outcome.type] || hints[mode], ['disturbed', 'empty-trap'].includes(outcome.type) ? 'error' : '');
  const changedSafe = outcome.changed.filter(i => model.cells[i].open).map(i => ({ element: rooms[i], index: i }));
  if (changedSafe.length) effects.reveal(changedSafe, index, model.contract.cols);
  if (['signal', 'scan-clear'].includes(outcome.type)) {
    effects.scan(rooms[index]); audio.play('scan');
  } else if (['disturbed', 'empty-trap'].includes(outcome.type)) {
    effects.pulse(field, 'error'); audio.play('error');
  } else if (['marked', 'unmarked'].includes(outcome.type)) {
    effects.pulse(rooms[index]); audio.play('mark');
  } else if (outcome.type === 'revealed') audio.play('reveal');

  if (outcome.type === 'captured') {
    const first = !records.entities[outcome.species];
    records.entities[outcome.species] = Math.min((records.entities[outcome.species] || 0) + 1, 99999);
    if (model.phase === 'won') records.cases[model.contract.id] = Math.max(records.cases[model.contract.id] || 0, model.stars);
    save(); updateCollection();
    const name = ENTITIES[outcome.species].name;
    status(`Containing ${name}…`, 'success');
    $('#ghostDockLabel').textContent = 'PROTON STREAM ENGAGED';
    board.setAttribute('aria-busy', 'true');
    audio.play('capture');
    effects.capture(rooms[index], outcome.species, () => {
      if (!active) return;
      busy = false;
      board.setAttribute('aria-busy', 'false');
      $('#ghostDockLabel').textContent = 'ENTITY SECURED · TRAP READY';
      $('#ghostPkeLabel').textContent = 'PKE · CONTAINED';
      root.style.setProperty('--pke', '0');
      render();
      status(`${name} contained.${first ? ' New entity in your log.' : ''} ${model.contract.ghosts - model.captured} remaining.`, 'success');
      showResult();
    });
  } else showResult();
}

$('#ghostBegin').addEventListener('click', () => { if (active) startCase(); });
$('#ghostCases').addEventListener('click', () => { if (active) briefing(); });
root.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => selectCase(Number(button.dataset.case))));
root.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.tool)));
$('#ghostSound').addEventListener('click', () => {
  audio.enabled = !audio.enabled;
  records.sound = audio.enabled;
  save(); updateSound();
  if (audio.enabled) audio.play('scan'); else audio.stop();
});
$('#ghostResultNext').addEventListener('click', () => {
  if (!active) return;
  if (model.phase === 'lost') startCase();
  else if (selectedCase < CASES.length - 1) startCase(selectedCase + 1);
  else briefing();
});
$('#ghostReplay').addEventListener('click', () => { if (active) startCase(); });

board.addEventListener('click', event => {
  const room = event.target.closest('[data-room]');
  if (!room) return;
  const index = Number(room.dataset.room);
  if (suppressedClick?.index === index && performance.now() - suppressedClick.time < 900) { suppressedClick = null; event.preventDefault(); return; }
  suppressedClick = null;
  act(index);
});
board.addEventListener('contextmenu', event => {
  event.preventDefault();
  const room = event.target.closest('[data-room]');
  const recentHold = suppressedClick && performance.now() - suppressedClick.time < 900;
  if (room && !recentHold) act(Number(room.dataset.room), 'mark');
});
board.addEventListener('focusin', event => {
  const room = event.target.closest('[data-room]');
  if (room) focusRoom(Number(room.dataset.room), false);
});
board.addEventListener('pointerdown', event => {
  const room = event.target.closest('[data-room]');
  if (!room || !event.isPrimary || event.button !== 0 || event.pointerType === 'mouse' || busy) return;
  cancelPress(); suppressedClick = null;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, index: Number(room.dataset.room) };
  longPress = setTimeout(() => {
    if (!pointer || !active) return;
    const index = pointer.index;
    suppressedClick = { index, time: performance.now() };
    act(index, 'mark');
    longPress = 0;
  }, 450);
});
board.addEventListener('pointermove', event => {
  if (pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 10) cancelPress();
});
window.addEventListener('pointerup', cancelPress);
window.addEventListener('pointercancel', cancelPress);
root.addEventListener('keydown', event => {
  if (!active || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if ($('#ghostMission').hidden || !$('#ghostResult').hidden) return;
  const keys = { i: 'investigate', m: 'mark', t: 'trap', s: 'scan' };
  if (keys[event.key.toLowerCase()]) { event.preventDefault(); selectTool(keys[event.key.toLowerCase()]); return; }
  if (!event.target.closest('[data-room]')) return;
  const { cols } = model.contract;
  const col = focusedRoom % cols;
  let next = focusedRoom;
  if (event.key === 'ArrowRight') next += col < cols - 1 ? 1 : 0;
  else if (event.key === 'ArrowLeft') next -= col > 0 ? 1 : 0;
  else if (event.key === 'ArrowDown') next = Math.min(rooms.length - 1, next + cols);
  else if (event.key === 'ArrowUp') next = Math.max(0, next - cols);
  else if (event.key === 'Home') next -= col;
  else if (event.key === 'End') next += cols - col - 1;
  else return;
  event.preventDefault(); focusRoom(next);
});

function suspend() {
  if (!active) return;
  cancelPress();
  root.classList.remove('is-active');
  if (busy) effects.finish(); else effects.cancel();
  audio.stop();
}
window.addEventListener('blur', suspend);
window.addEventListener('focus', () => { if (active && !document.hidden) root.classList.add('is-active'); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) suspend();
  else if (active) root.classList.add('is-active');
});
window.addEventListener('resize', () => { if (active && busy) effects.finish(); });
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { if (busy) effects.finish(); else effects.cancel(); } });

selectCase(0); updateCollection(); updateSound();
const preview = document.getElementById('ghostPreview');
if (preview) preview.innerHTML = `${cityArt('ghostPreviewCity')}<span class="ghost-preview-character">${ghostArt('slimer')}</span><span class="ghost-preview-grid" aria-hidden="true"><i>1</i><i>2</i><i>${icon('trap')}</i><i></i><i>1</i><i></i></span>`;

export const ghostbusters = {
  start() {
    active = true;
    root.classList.toggle('is-active', !document.hidden);
    briefing();
  },
  stop() {
    active = false;
    clearEffects();
    root.classList.remove('is-active');
    board.inert = true;
  }
};
