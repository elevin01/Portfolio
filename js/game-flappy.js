import { FLAPPY, FlappyModel } from './flappy-model.js';

const canvas = document.getElementById('flappyCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('flappyScore');
const bestEl = document.getElementById('flappyBest');
const overlay = document.getElementById('flappyOverlay');
const messageTitle = document.getElementById('flappyMessageTitle');
const messageText = document.getElementById('flappyMessageText');
const playButton = document.getElementById('flappyPlay');
const pauseButton = document.getElementById('flappyPause');
const resetButton = document.getElementById('flappyReset');
const status = document.getElementById('flappyStatus');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const storageKey = 'portfolio.flappy.best';
const model = new FlappyModel();
let active = false;
let frameId = 0;
let lastTime = null;
let accumulator = 0;
let displayedScore = -1;
let best = 0;
let sky;

try {
  const stored = Number(localStorage.getItem(storageKey));
  if (Number.isSafeInteger(stored) && stored > 0) best = stored;
} catch { /* The game also works when browser storage is unavailable. */ }

function updateScore() {
  if (model.score === displayedScore) return;
  displayedScore = model.score;
  scoreEl.textContent = model.score;
  if (model.score > best) {
    best = model.score;
    try { localStorage.setItem(storageKey, String(best)); } catch { /* Keep the in-memory best. */ }
  }
  bestEl.textContent = best;
  if (model.score > 0) status.textContent = `Score ${model.score}.`;
}

function updateOverlay() {
  const phase = model.phase;
  overlay.hidden = phase === 'playing';
  pauseButton.disabled = phase === 'ready' || phase === 'over';
  pauseButton.textContent = phase === 'paused' ? 'Resume' : 'Pause';
  if (phase === 'ready') {
    messageTitle.textContent = 'Ready to fly?';
    messageText.textContent = 'Stay in the gaps. One flap at a time.';
    playButton.textContent = 'Start flying →';
    status.textContent = 'Ready. Press Space, the up arrow, or tap the game to start.';
  } else if (phase === 'paused') {
    messageTitle.textContent = 'Take your time.';
    messageText.textContent = 'Your flight is paused.';
    playButton.textContent = 'Keep flying →';
    status.textContent = 'Game paused. Press Space or Resume to continue.';
  } else if (phase === 'over') {
    messageTitle.textContent = 'One more try?';
    messageText.textContent = `${model.score} ${model.score === 1 ? 'pipe' : 'pipes'} cleared. Best: ${best}.`;
    playButton.textContent = 'Play again →';
    status.textContent = `Game over. Score ${model.score}. Best ${best}. Press Space or Play again to restart.`;
  }
}

function fitCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = FLAPPY.width * ratio;
  canvas.height = FLAPPY.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  sky = ctx.createLinearGradient(0, 0, 0, FLAPPY.ground);
  sky.addColorStop(0, '#14273f');
  sky.addColorStop(0.65, '#25475e');
  sky.addColorStop(1, '#477681');
  draw();
}

function drawPipe(x, center) {
  const top = center - FLAPPY.gap / 2;
  const bottom = center + FLAPPY.gap / 2;
  const width = FLAPPY.pipeWidth;
  ctx.fillStyle = '#245c5a';
  ctx.fillRect(x + 4, 0, width - 8, top);
  ctx.fillRect(x + 4, bottom, width - 8, FLAPPY.ground - bottom);
  ctx.fillStyle = '#51ad9d';
  ctx.fillRect(x + 6, 0, width - 14, top);
  ctx.fillRect(x + 6, bottom, width - 14, FLAPPY.ground - bottom);
  ctx.fillStyle = '#82d2b5';
  ctx.fillRect(x + 11, 0, 7, top);
  ctx.fillRect(x + 11, bottom, 7, FLAPPY.ground - bottom);
  for (const y of [top - 20, bottom]) {
    ctx.fillStyle = '#245c5a';
    ctx.fillRect(x, y, width, 20);
    ctx.fillStyle = '#82d2b5';
    ctx.fillRect(x + 2, y + 2, width - 4, 5);
    ctx.fillStyle = '#61b9a3';
    ctx.fillRect(x + 2, y + 7, width - 4, 10);
  }
}

function drawBird(y, distance) {
  ctx.save();
  ctx.translate(FLAPPY.birdX, y);
  ctx.rotate(model.phase === 'ready' ? -0.1 : Math.max(-0.4, Math.min(1.1, model.velocity / 580)));
  ctx.fillStyle = '#e29b49';
  ctx.beginPath();
  ctx.moveTo(-12, -3); ctx.lineTo(-24, 2); ctx.lineTo(-12, 7); ctx.fill();
  ctx.fillStyle = '#ffd477';
  ctx.beginPath(); ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe6a6';
  ctx.beginPath(); ctx.ellipse(2, 6, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
  const wing = reducedMotion.matches || model.phase !== 'playing' ? 0 : Math.sin(distance / 11) * 0.35;
  ctx.fillStyle = '#efaf51';
  ctx.beginPath(); ctx.ellipse(-7, 3, 10, 6, wing, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff7df';
  ctx.beginPath(); ctx.arc(8, -5, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#152941';
  ctx.beginPath(); ctx.arc(10, -5, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f09364';
  ctx.beginPath(); ctx.moveTo(12, 1); ctx.lineTo(26, 5); ctx.lineTo(12, 8); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function draw(alpha = 1) {
  const distance = model.previousDistance + (model.distance - model.previousDistance) * alpha;
  const sceneryDistance = reducedMotion.matches ? 0 : distance;
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FLAPPY.width, FLAPPY.height);
  ctx.fillStyle = '#e1edff';
  ctx.beginPath(); ctx.arc(335, 65, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#849eae';
  for (let i = 0; i < 16; i++) {
    ctx.fillRect((i * 83 + 19) % FLAPPY.width, (i * 47 + 22) % 220, 2, 2);
  }
  ctx.fillStyle = '#688eb225';
  for (let i = 0; i < 4; i++) {
    const x = ((i * 156 + 80 - sceneryDistance * 0.14) % 600 + 600) % 600 - 90;
    const y = 110 + (i % 3) * 77;
    ctx.beginPath(); ctx.ellipse(x, y, 45, 9, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#244555';
  for (let i = 0; i < 12; i++) {
    const x = i * 48 - (sceneryDistance * 0.08 % 48);
    const height = 30 + (i * 31 % 61);
    ctx.fillRect(x, FLAPPY.ground - height, 34, height);
    ctx.fillStyle = '#547887';
    ctx.fillRect(x + 8, FLAPPY.ground - height + 10, 4, 5);
    ctx.fillStyle = '#244555';
  }
  for (const pipe of model.pipes) {
    drawPipe(pipe.previousX + (pipe.x - pipe.previousX) * alpha, pipe.center);
  }
  ctx.fillStyle = '#668d90';
  ctx.fillRect(0, FLAPPY.ground, FLAPPY.width, 6);
  ctx.fillStyle = '#293e49';
  ctx.fillRect(0, FLAPPY.ground + 6, FLAPPY.width, FLAPPY.height - FLAPPY.ground);
  ctx.fillStyle = '#415b65';
  for (let i = -1; i < 24; i++) {
    const x = i * 24 - (sceneryDistance % 24);
    ctx.beginPath(); ctx.moveTo(x, FLAPPY.ground + 6); ctx.lineTo(x + 12, FLAPPY.ground + 6);
    ctx.lineTo(x + 3, FLAPPY.ground + 15); ctx.lineTo(x - 9, FLAPPY.ground + 15); ctx.fill();
  }
  drawBird(model.previousY + (model.y - model.previousY) * alpha, distance);
}

function stopLoop() {
  cancelAnimationFrame(frameId);
  frameId = 0;
  lastTime = null;
  accumulator = 0;
}

function frame(time) {
  frameId = 0;
  if (!active || model.phase !== 'playing') return;
  if (lastTime !== null) accumulator += Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  // Fixed physics steps plus interpolation keep flight consistent across refresh rates.
  while (accumulator >= FLAPPY.step && model.phase === 'playing') {
    model.step();
    accumulator -= FLAPPY.step;
  }
  draw(model.phase === 'playing' ? accumulator / FLAPPY.step : 1);
  updateScore();
  if (model.phase === 'over') {
    stopLoop();
    updateOverlay();
    return;
  }
  frameId = requestAnimationFrame(frame);
}

function activate() {
  if (!active) return;
  const previousPhase = model.phase;
  if (model.phase === 'over') model.reset();
  if (model.phase === 'paused') model.resume();
  model.flap();
  updateScore();
  if (previousPhase !== 'playing') {
    updateOverlay();
    status.textContent = `Flying. Score ${model.score}.`;
  }
  canvas.focus({ preventScroll: true });
  if (!frameId) frameId = requestAnimationFrame(frame);
}

function pause() {
  if (!active || model.phase !== 'playing') return;
  model.pause();
  stopLoop();
  draw();
  updateOverlay();
}

function resetRound() {
  stopLoop();
  model.reset();
  updateScore();
  updateOverlay();
  draw();
}

playButton.addEventListener('click', activate);
canvas.addEventListener('pointerdown', event => {
  if (!active || !event.isPrimary || event.button !== 0) return;
  event.preventDefault();
  activate();
});
pauseButton.addEventListener('click', () => {
  if (model.phase === 'paused') activate();
  else pause();
});
resetButton.addEventListener('click', () => {
  if (!active) return;
  resetRound();
  canvas.focus({ preventScroll: true });
});
window.addEventListener('keydown', event => {
  if (!active || event.altKey || event.ctrlKey || event.metaKey) return;
  if (![' ', 'ArrowUp', 'w', 'W'].includes(event.key)) return;
  if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select')) return;
  event.preventDefault();
  if (!event.repeat) activate();
});
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('resize', () => { if (active) fitCanvas(); });

export const flappyBird = {
  start() {
    active = true;
    fitCanvas();
    resetRound();
    canvas.focus({ preventScroll: true });
  },
  stop() {
    active = false;
    stopLoop();
    model.reset();
  }
};
