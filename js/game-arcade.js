import { game2048 } from './game-2048.js';
import { flappyBird } from './game-flappy.js';

const toggle = document.getElementById('gameToggle');
const modal = document.getElementById('gameModal');
const close = document.getElementById('gameClose');
const back = document.getElementById('gameBack');
const title = document.getElementById('gameTitle');
const picker = document.getElementById('gamePicker');
const games = {
  '2048': { title: '2048', panel: document.getElementById('game2048Panel'), controller: game2048 },
  flappy: { title: 'Flappy Bird', panel: document.getElementById('gameFlappyPanel'), controller: flappyBird }
};
let activeGame = null;
let isOpen = false;
let previousFocus = null;
let previousOverflow = '';
const background = [...document.querySelectorAll('body > aside, body > main, #gameToggle')];
let previousInert = [];

function stopGame() {
  if (!activeGame) return;
  games[activeGame].controller.stop();
  games[activeGame].panel.hidden = true;
  activeGame = null;
}

function showPicker() {
  const lastGame = activeGame;
  stopGame();
  picker.hidden = false;
  back.hidden = true;
  title.textContent = 'Mini games';
  const choice = lastGame ? picker.querySelector(`[data-game="${lastGame}"]`) : picker.querySelector('[data-game]');
  choice.focus({ preventScroll: true });
}

function openArcade() {
  if (isOpen) return;
  previousFocus = document.activeElement;
  previousOverflow = document.body.style.overflow;
  previousInert = background.map(element => element.inert);
  background.forEach(element => { element.inert = true; });
  document.body.style.overflow = 'hidden';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  isOpen = true;
  showPicker();
}

function closeArcade() {
  if (!isOpen) return;
  stopGame();
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = previousOverflow;
  background.forEach((element, index) => { element.inert = previousInert[index]; });
  isOpen = false;
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
}

picker.addEventListener('click', event => {
  const choice = event.target.closest('[data-game]');
  if (!choice || !games[choice.dataset.game]) return;
  stopGame();
  activeGame = choice.dataset.game;
  const game = games[activeGame];
  picker.hidden = true;
  back.hidden = false;
  title.textContent = game.title;
  game.panel.hidden = false;
  game.controller.start();
});
toggle.addEventListener('click', openArcade);
close.addEventListener('click', closeArcade);
back.addEventListener('click', showPicker);
modal.addEventListener('click', event => {
  if (event.target === modal) closeArcade();
});
modal.addEventListener('keydown', event => {
  if (!isOpen) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeArcade();
  } else if (event.key === 'Tab') {
    const focusable = [...modal.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
      .filter(element => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
