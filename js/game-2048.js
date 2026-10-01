// 2048 mini game. Tile objects keep their DOM nodes for the lifetime of a tile.
const gameToggle = document.getElementById('gameToggle');
const gameModal = document.getElementById('gameModal');
const gameClose = document.getElementById('gameClose');
const gameGridEl = document.getElementById('gameGrid');
const gameScoreEl = document.getElementById('gameScore');
const gameStatusEl = document.getElementById('gameStatus');
const gameReset = document.getElementById('gameReset');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const moveDuration = parseFloat(getComputedStyle(gameGridEl).getPropertyValue('--game-move-duration'));
const size = 4;
const directions = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', W: 'up', s: 'down', S: 'down',
  a: 'left', A: 'left', d: 'right', D: 'right'
};

let grid = [];
let score = 0;
let gameOpen = false;
let activeMove = null;
let queuedFrame = 0;
const moveQueue = [];
const cells = [];

// The empty board stays in place beneath the independently moving tiles.
for (let i = 0; i < size * size; i++) {
  const cell = document.createElement('div');
  cell.className = 'game-cell';
  cell.setAttribute('role', 'gridcell');
  gameGridEl.appendChild(cell);
  cells.push(cell);
}
const tileLayer = document.createElement('div');
tileLayer.className = 'game-tile-layer';
tileLayer.setAttribute('aria-hidden', 'true');
gameGridEl.appendChild(tileLayer);

function positionTile(tile) {
  tile.el.style.setProperty('--row', tile.row);
  tile.el.style.setProperty('--col', tile.col);
}

function createTile(value, row, col) {
  const el = document.createElement('div');
  el.className = 'game-tile';
  const inner = document.createElement('div');
  inner.className = `game-tile-inner t-${value} new`;
  inner.textContent = value;
  inner.addEventListener('animationend', () => inner.classList.remove('new', 'merged'));
  el.appendChild(inner);
  const tile = { value, row, col, el, inner };
  positionTile(tile);
  tileLayer.appendChild(el);
  return tile;
}

function cancelPendingMoves() {
  cancelAnimationFrame(queuedFrame);
  queuedFrame = 0;
  moveQueue.length = 0;
  if (activeMove) {
    clearTimeout(activeMove.timer);
    activeMove.target.removeEventListener('transitionend', activeMove.onEnd);
    activeMove = null;
  }
}

function openGame() {
  gameModal.classList.add('open');
  gameModal.setAttribute('aria-hidden', 'false');
  gameOpen = true;
  initGame();
}

function closeGame() {
  cancelPendingMoves();
  gameModal.classList.remove('open');
  gameModal.setAttribute('aria-hidden', 'true');
  gameOpen = false;
}

function initGame() {
  cancelPendingMoves();
  tileLayer.replaceChildren();
  grid = Array.from({ length: size }, () => Array(size).fill(null));
  score = 0;
  addRandomTile();
  addRandomTile();
  renderStatus();
}

function addRandomTile() {
  const empty = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col]) empty.push([row, col]);
    }
  }
  if (!empty.length) return;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  grid[row][col] = createTile(Math.random() < 0.9 ? 2 : 4, row, col);
}

// Visit each line starting at the edge toward which the player is moving.
function linePosition(line, offset, direction) {
  if (direction === 'left') return [line, offset];
  if (direction === 'right') return [line, size - 1 - offset];
  if (direction === 'up') return [offset, line];
  return [size - 1 - offset, line];
}

function move(direction) {
  const nextGrid = Array.from({ length: size }, () => Array(size).fill(null));
  const merged = new Set();
  const consumed = [];
  const moving = [];

  for (let line = 0; line < size; line++) {
    let nextOffset = 0;
    let previous = null;
    for (let offset = 0; offset < size; offset++) {
      const [row, col] = linePosition(line, offset, direction);
      const tile = grid[row][col];
      if (!tile) continue;

      let destination;
      if (previous && previous.value === tile.value && !merged.has(previous)) {
        destination = [previous.row, previous.col];
        previous.value *= 2;
        score += previous.value;
        merged.add(previous);
        consumed.push(tile);
      } else {
        destination = linePosition(line, nextOffset++, direction);
        nextGrid[destination[0]][destination[1]] = tile;
        previous = tile;
      }

      if (tile.row !== destination[0] || tile.col !== destination[1]) {
        tile.row = destination[0];
        tile.col = destination[1];
        moving.push(tile);
      }
    }
  }

  if (!moving.length) return false;
  grid = nextGrid;

  const turn = { target: moving[0].el, timer: 0, onEnd: null, finish: null };
  turn.finish = () => {
    if (activeMove !== turn) return;
    clearTimeout(turn.timer);
    turn.target.removeEventListener('transitionend', turn.onEnd);
    activeMove = null;

    // Keep both original faces visible until they meet, then show the merged value.
    consumed.forEach(tile => tile.el.remove());
    merged.forEach(tile => {
      tile.inner.textContent = tile.value;
      tile.inner.className = `game-tile-inner t-${tile.value} merged`;
    });
    addRandomTile();
    renderStatus();
    playQueuedMove();
  };
  turn.onEnd = event => {
    if (event.target === turn.target && event.propertyName === 'transform') turn.finish();
  };
  activeMove = turn;
  turn.target.addEventListener('transitionend', turn.onEnd);
  moving.forEach(positionTile);

  if (reducedMotion.matches) {
    turn.finish();
  } else {
    // Also settle if a transition is interrupted or never starts (e.g. a hidden tab).
    turn.timer = setTimeout(turn.finish, moveDuration + 60);
  }
  return true;
}

function playQueuedMove() {
  if (!gameOpen) return;
  // Paint the spawned tile at its starting cell before the next slide begins.
  queuedFrame = requestAnimationFrame(() => {
    queuedFrame = requestAnimationFrame(() => {
      queuedFrame = 0;
      while (moveQueue.length) {
        if (move(moveQueue.shift())) break;
      }
    });
  });
}

function hasMoves() {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const tile = grid[row][col];
      if (!tile) return true;
      if (col < size - 1 && tile.value === grid[row][col + 1]?.value) return true;
      if (row < size - 1 && tile.value === grid[row + 1][col]?.value) return true;
    }
  }
  return false;
}

function renderStatus() {
  grid.forEach((row, rowIndex) => row.forEach((tile, colIndex) => {
    cells[rowIndex * size + colIndex].setAttribute('aria-label', tile ? `Tile ${tile.value}` : 'Empty');
  }));
  gameScoreEl.textContent = score;
  gameStatusEl.textContent = hasMoves() ? '' : 'Game over! Press reset to play again.';
}

function handleKeydown(event) {
  if (!gameOpen) return;
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  if (activeMove || queuedFrame) {
    // Remember quick turns without building a long, laggy backlog from key repeat.
    if (event.repeat && moveQueue.length) return;
    if (moveQueue.length < 2) moveQueue.push(direction);
    return;
  }
  move(direction);
}

gameToggle.addEventListener('click', openGame);
gameClose.addEventListener('click', closeGame);
gameReset.addEventListener('click', initGame);
window.addEventListener('keydown', handleKeydown);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && activeMove) activeMove.finish();
});
gameModal.addEventListener('click', event => {
  if (event.target === gameModal) closeGame();
});
