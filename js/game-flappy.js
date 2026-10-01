import { FLAPPY, FlappyModel } from './flappy-model.js';
import { FlappyRenderer } from './flappy-renderer.js';

const canvas = document.getElementById('flappyCanvas');
const renderer = new FlappyRenderer(canvas);
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
let visualTime = 0;
let suspended = false;

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
  overlay.dataset.phase = phase;
  overlay.hidden = phase === 'playing';
  pauseButton.disabled = phase === 'ready' || phase === 'over';
  pauseButton.textContent = phase === 'paused' ? 'Resume' : 'Pause';
  if (phase === 'ready') {
    messageTitle.textContent = 'Ready to fly?';
    messageText.textContent = 'A little flight over the city.';
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
  renderer.resize(window.devicePixelRatio || 1);
  draw();
}

function draw(alpha = 1) {
  renderer.draw(model, { alpha, time: visualTime, reducedMotion: reducedMotion.matches });
}

function shouldAnimate() {
  return active && !suspended && !document.hidden
    && (model.phase === 'playing' || (model.phase === 'ready' && !reducedMotion.matches));
}

function ensureLoop() {
  if (shouldAnimate() && !frameId) frameId = requestAnimationFrame(frame);
}

function stopLoop() {
  cancelAnimationFrame(frameId);
  frameId = 0;
  lastTime = null;
  accumulator = 0;
}

function frame(time) {
  frameId = 0;
  if (!shouldAnimate()) return;
  const elapsed = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (!reducedMotion.matches) visualTime += elapsed;
  if (model.phase === 'playing') {
    accumulator += elapsed;
    // Visual effects have their own clock; physics still advances at a fixed 120 Hz.
    while (accumulator >= FLAPPY.step && model.phase === 'playing') {
      model.step();
      accumulator -= FLAPPY.step;
    }
  }
  draw(model.phase === 'playing' ? accumulator / FLAPPY.step : 1);
  updateScore();
  if (model.phase === 'over') {
    stopLoop();
    updateOverlay();
    return;
  }
  ensureLoop();
}

function activate() {
  if (!active || document.hidden) return;
  suspended = false;
  const previousPhase = model.phase;
  if (model.phase === 'over') {
    model.reset();
    renderer.resetMotion();
  }
  if (model.phase === 'paused') model.resume();
  model.flap();
  renderer.flap(visualTime);
  updateScore();
  if (previousPhase !== 'playing') {
    lastTime = null;
    accumulator = 0;
    updateOverlay();
    status.textContent = `Flying. Score ${model.score}.`;
  }
  canvas.focus({ preventScroll: true });
  ensureLoop();
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
  visualTime = 0;
  renderer.resetMotion();
  updateScore();
  updateOverlay();
  draw();
  ensureLoop();
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
function suspend() {
  if (!active) return;
  suspended = true;
  pause();
  stopLoop();
}

window.addEventListener('blur', suspend);
window.addEventListener('focus', () => {
  suspended = false;
  // A live round stays paused until the player explicitly resumes it.
  ensureLoop();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) suspend();
  else {
    suspended = !document.hasFocus();
    ensureLoop();
  }
});
reducedMotion.addEventListener('change', () => {
  if (!active) return;
  if (!shouldAnimate()) stopLoop();
  draw();
  ensureLoop();
});
window.addEventListener('resize', () => { if (active) fitCanvas(); });

export const flappyBird = {
  start() {
    active = true;
    suspended = document.hidden;
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
