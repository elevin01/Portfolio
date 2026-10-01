export const FLAPPY = Object.freeze({
  width: 420,
  height: 520,
  ground: 478,
  birdX: 108,
  radius: 12,
  gravity: 1450,
  flapVelocity: -370,
  maxFallSpeed: 640,
  pipeWidth: 64,
  gap: 158,
  spacing: 235,
  speed: 155,
  step: 1 / 120
});

function touchesRectangle(x, y, radius, left, top, width, height) {
  const closestX = Math.max(left, Math.min(x, left + width));
  const closestY = Math.max(top, Math.min(y, top + height));
  return (x - closestX) ** 2 + (y - closestY) ** 2 <= radius ** 2;
}

// Physics has no DOM or drawing dependencies. The renderer advances it at 120 Hz.
export class FlappyModel {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.phase = 'ready';
    this.y = 225;
    this.previousY = this.y;
    this.velocity = 0;
    this.score = 0;
    this.distance = 0;
    this.previousDistance = 0;
    this.pipes = [];
  }

  addPipe(x) {
    const margin = FLAPPY.gap / 2 + 58;
    const lastCenter = this.pipes.at(-1)?.center ?? this.y;
    const min = Math.max(margin, lastCenter - 105);
    const max = Math.min(FLAPPY.ground - margin, lastCenter + 105);
    this.pipes.push({ x, previousX: x, center: min + this.random() * (max - min), passed: false });
  }

  flap() {
    if (this.phase === 'ready') {
      this.phase = 'playing';
      this.addPipe(FLAPPY.width + 40);
    }
    if (this.phase === 'playing') this.velocity = FLAPPY.flapVelocity;
  }

  pause() {
    if (this.phase === 'playing') this.phase = 'paused';
  }

  resume() {
    if (this.phase === 'paused') this.phase = 'playing';
  }

  step(dt = FLAPPY.step) {
    if (this.phase !== 'playing') return;
    this.previousY = this.y;
    this.previousDistance = this.distance;
    this.velocity = Math.min(this.velocity + FLAPPY.gravity * dt, FLAPPY.maxFallSpeed);
    this.y += this.velocity * dt;
    this.distance += FLAPPY.speed * dt;
    for (const pipe of this.pipes) {
      pipe.previousX = pipe.x;
      pipe.x -= FLAPPY.speed * dt;
    }

    if (this.y - FLAPPY.radius <= 0 || this.y + FLAPPY.radius >= FLAPPY.ground) {
      this.y = Math.max(FLAPPY.radius, Math.min(this.y, FLAPPY.ground - FLAPPY.radius));
      this.phase = 'over';
      return;
    }
    for (const pipe of this.pipes) {
      const gapTop = pipe.center - FLAPPY.gap / 2;
      const gapBottom = pipe.center + FLAPPY.gap / 2;
      if (touchesRectangle(FLAPPY.birdX, this.y, FLAPPY.radius, pipe.x, 0, FLAPPY.pipeWidth, gapTop)
        || touchesRectangle(FLAPPY.birdX, this.y, FLAPPY.radius, pipe.x, gapBottom, FLAPPY.pipeWidth, FLAPPY.ground - gapBottom)) {
        this.phase = 'over';
        return;
      }
      if (!pipe.passed && pipe.x + FLAPPY.pipeWidth < FLAPPY.birdX - FLAPPY.radius) {
        pipe.passed = true;
        this.score++;
      }
    }
    if (this.pipes.at(-1).x <= FLAPPY.width - FLAPPY.spacing) {
      this.addPipe(this.pipes.at(-1).x + FLAPPY.spacing);
    }
    this.pipes = this.pipes.filter(pipe => pipe.x + FLAPPY.pipeWidth >= -8);
  }
}
