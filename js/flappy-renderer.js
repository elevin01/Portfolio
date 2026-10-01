import { FLAPPY } from './flappy-model.js';

const TAU = Math.PI * 2;
const CITY_WIDTH = 1120;
const CITY_TOP = 170;
const WATERLINE = 434;
const mix = (a, b, amount) => a + (b - a) * amount;

// Scenery uses its own repeatable random source, never the game's pipe generator.
function randomSource(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function building(ctx, x, width, height, kind, random) {
  const top = WATERLINE - height;
  const center = x + width / 2;
  let points;
  if (kind === 'empire') {
    points = [[x, WATERLINE], [x, top + 83], [x + 5, top + 83], [x + 5, top + 56],
      [x + 10, top + 56], [x + 10, top + 38], [x + 16, top + 38], [x + 16, top + 22],
      [x + width - 16, top + 22], [x + width - 16, top + 38], [x + width - 10, top + 38],
      [x + width - 10, top + 56], [x + width - 5, top + 56], [x + width - 5, top + 83], [x + width, top + 83], [x + width, WATERLINE]];
  } else if (kind === 'chrysler') {
    points = [[x, WATERLINE], [x, top + 77], [x + 4, top + 77], [x + 4, top + 56],
      [center, top + 16], [x + width - 4, top + 56], [x + width - 4, top + 77], [x + width, top + 77], [x + width, WATERLINE]];
  } else if (kind === 'world-trade') {
    points = [[x, WATERLINE], [x + 10, top + 33], [x + width - 10, top + 33], [x + width, WATERLINE]];
  } else if (kind === 'flatiron') {
    points = [[x, WATERLINE], [x + 10, top], [x + width, top + 17], [x + width, WATERLINE]];
  } else {
    points = [[x, WATERLINE], [x, top + 9], [x + 5, top + 9], [x + 5, top], [x + width - 5, top], [x + width - 5, top + 9], [x + width, top + 9], [x + width, WATERLINE]];
  }
  ctx.save();
  polygon(ctx, points);
  const facade = ctx.createLinearGradient(x, top, x + width, WATERLINE);
  facade.addColorStop(0, '#253751');
  facade.addColorStop(0.35, '#182944');
  facade.addColorStop(1, '#0a172d');
  ctx.fillStyle = facade;
  ctx.fill();
  ctx.strokeStyle = '#6687a53d';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.clip();

  if (kind === 'world-trade') {
    ctx.fillStyle = '#5783a326';
    polygon(ctx, [[x + 10, top + 33], [center, WATERLINE], [x + width, WATERLINE]]);
    ctx.fill();
  }
  // Uneven occupied floors and warm/cool windows keep the city from becoming a grid.
  for (let y = top + 12; y < WATERLINE - 5; y += 7) {
    const occupancy = random() > 0.2 ? 0.6 : 0.13;
    for (let column = x + 5; column < x + width - 3; column += 6) {
      if (random() > occupancy) continue;
      ctx.globalAlpha = 0.3 + random() * 0.55;
      ctx.fillStyle = random() > 0.28 ? '#f4cd8e' : '#94cbe8';
      ctx.fillRect(column, y, kind === 'park' ? 3 : 2, 2.6);
    }
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#91abc326';
  ctx.lineWidth = 0.6;
  for (let column = x + 3; column < x + width; column += 9) {
    ctx.beginPath(); ctx.moveTo(column, top); ctx.lineTo(column, WATERLINE); ctx.stroke();
  }
  if (kind === 'chrysler') {
    ctx.strokeStyle = '#bad6dfb3';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(center, top + 38 + i * 8, 6 + i * 3.2, 10, 0, Math.PI, TAU);
      ctx.stroke();
    }
  }
  if (kind === 'empire') {
    ctx.fillStyle = '#dfcfab';
    for (let i = 0; i < 4; i++) ctx.fillRect(center - 5 - i * 3, top + 26 + i * 10, 10 + i * 6, 1.5);
  }
  ctx.restore();

  if (['empire', 'chrysler', 'world-trade'].includes(kind)) {
    ctx.strokeStyle = kind === 'empire' ? '#e7d4ae' : '#91b5d0';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(center, top); ctx.lineTo(center, top + 36); ctx.stroke();
    ctx.fillStyle = '#ffc392'; ctx.fillRect(center - 0.8, top, 1.6, 1.6);
  } else if (kind === 'water-tower') {
    ctx.fillStyle = '#101b2d';
    ctx.fillRect(center - 5, top - 14, 10, 11);
    polygon(ctx, [[center - 7, top - 14], [center, top - 19], [center + 7, top - 14]]); ctx.fill();
    ctx.fillRect(center - 4, top - 3, 1, 5); ctx.fillRect(center + 3, top - 3, 1, 5);
  }
}

export class FlappyRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ratio = 0;
    this.resetMotion();
    const random = randomSource(20482026);
    this.stars = Array.from({ length: 155 }, () => ({
      x: random() * 460 - 20,
      y: 10 + random() ** 1.25 * 303,
      radius: 0.35 + random() ** 3 * 1.15,
      phase: random() * TAU,
      rate: 0.45 + random() * 1.7,
      brightness: 0.25 + random() * 0.6,
      depth: 0.2 + random() * 0.8,
      warm: random() > 0.76
    }));
  }

  surface(width, height, paint) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * this.ratio);
    canvas.height = Math.round(height * this.ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(this.ratio, this.ratio);
    paint(ctx);
    return canvas;
  }

  resize(pixelRatio) {
    const ratio = Math.min(pixelRatio, 2);
    if (this.ratio === ratio) return;
    this.ratio = ratio;
    this.canvas.width = Math.round(FLAPPY.width * ratio);
    this.canvas.height = Math.round(FLAPPY.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Rasterize the detailed scenery once per pixel ratio, rather than every frame.
    this.sky = this.surface(420, 520, ctx => {
      const sky = ctx.createLinearGradient(0, 0, 0, WATERLINE);
      sky.addColorStop(0, '#070e25'); sky.addColorStop(0.55, '#1b2448');
      sky.addColorStop(0.84, '#414262'); sky.addColorStop(1, '#9a626c');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 420, 520);
      const haze = ctx.createRadialGradient(130, 195, 0, 130, 195, 210);
      haze.addColorStop(0, '#a084ad10'); haze.addColorStop(1, '#a084ad00');
      ctx.fillStyle = haze; ctx.fillRect(0, 0, 420, 430);
      const halo = ctx.createRadialGradient(337, 72, 9, 337, 72, 77);
      halo.addColorStop(0, '#b3d2ff28'); halo.addColorStop(1, '#b3d2ff00');
      ctx.fillStyle = halo; ctx.fillRect(255, 0, 165, 160);
    });
    this.moon = this.surface(90, 90, ctx => {
      const face = ctx.createRadialGradient(37, 37, 1, 45, 45, 22);
      face.addColorStop(0, '#f5f0dc'); face.addColorStop(1, '#b9c9e1');
      ctx.fillStyle = face; ctx.beginPath(); ctx.arc(45, 45, 21, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7d99ba26';
      for (const [x, y, radius] of [[39, 35, 5], [51, 47, 7], [38, 53, 4], [55, 37, 3], [49, 60, 2]]) {
        ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
      }
    });
    this.farCity = this.surface(CITY_WIDTH, 300, ctx => {
      const random = randomSource(555);
      ctx.translate(0, -CITY_TOP);
      for (let x = -10; x < CITY_WIDTH;) {
        const width = 12 + random() * 26, height = 45 + random() * 103;
        ctx.fillStyle = random() > 0.5 ? '#293854' : '#2d3b57';
        ctx.fillRect(x, WATERLINE - height, width, height);
        ctx.fillRect(x + width / 3, WATERLINE - height - 7, width / 3, 8);
        ctx.fillStyle = '#c6abb340';
        for (let y = WATERLINE - height + 10; y < WATERLINE; y += 11) {
          if (random() > 0.5) ctx.fillRect(x + 5, y, width - 10, 1);
        }
        x += width + 4;
      }
    });
    this.city = this.surface(CITY_WIDTH, 300, ctx => {
      const random = randomSource(212);
      ctx.translate(0, -CITY_TOP);
      const blocks = [
        [0, 36, 92, 'water-tower'], [44, 43, 235, 'empire'], [94, 33, 122, 'block'],
        [135, 25, 91, 'block'], [167, 41, 183, 'chrysler'], [216, 29, 95, 'block'],
        [251, 25, 142, 'park'], [286, 55, 253, 'world-trade'], [349, 30, 121, 'water-tower'],
        [386, 39, 95, 'block'], [434, 31, 137, 'block'], [471, 44, 84, 'water-tower'],
        [526, 35, 154, 'flatiron'], [568, 26, 186, 'park'], [602, 49, 105, 'block'],
        [660, 35, 149, 'block'], [704, 38, 108, 'water-tower'], [751, 48, 200, 'chrysler'],
        [809, 41, 123, 'block'], [859, 31, 167, 'park'], [899, 52, 115, 'block'],
        [959, 38, 162, 'flatiron'], [1008, 33, 89, 'water-tower'], [1049, 47, 138, 'block'], [1103, 17, 69, 'block']
      ];
      blocks.forEach(args => building(ctx, ...args, random));
      ctx.fillStyle = '#13213a'; ctx.fillRect(0, WATERLINE - 8, CITY_WIDTH, 8);
      for (let x = 5; x < CITY_WIDTH; x += 17) {
        ctx.fillStyle = x % 3 ? '#e8b87da8' : '#afc8e0'; ctx.fillRect(x, WATERLINE - 4, 2, 1.3);
      }
    });
    this.pipe = this.surface(64, FLAPPY.ground, ctx => {
      const metal = ctx.createLinearGradient(4, 0, 60, 0);
      metal.addColorStop(0, '#183f58'); metal.addColorStop(0.12, '#80c9c1');
      metal.addColorStop(0.28, '#46999f'); metal.addColorStop(0.7, '#286980'); metal.addColorStop(1, '#16344d');
      ctx.fillStyle = metal; ctx.fillRect(4, 0, 56, FLAPPY.ground);
      ctx.fillStyle = '#c7fff33d'; ctx.fillRect(11, 0, 2, FLAPPY.ground);
      ctx.fillStyle = '#0a263c5c'; ctx.fillRect(54, 0, 1, FLAPPY.ground);
    });
    this.pipeCap = this.surface(64, 20, ctx => {
      const rim = ctx.createLinearGradient(0, 0, 64, 0);
      rim.addColorStop(0, '#38778a'); rim.addColorStop(0.2, '#90d9c8'); rim.addColorStop(1, '#23506b');
      ctx.fillStyle = '#0d293f'; ctx.fillRect(0, 0, 64, 20);
      ctx.fillStyle = rim; ctx.fillRect(1, 1, 62, 16);
      ctx.fillStyle = '#cffbe1a1'; ctx.fillRect(2, 1, 60, 2);
      ctx.fillStyle = '#133b527a'; ctx.fillRect(2, 13, 60, 3);
      ctx.fillStyle = '#d6eed3a6'; ctx.fillRect(8, 7, 2, 2); ctx.fillRect(54, 7, 2, 2);
    });
    this.ground = this.surface(96, 42, ctx => {
      ctx.fillStyle = '#172136'; ctx.fillRect(0, 0, 96, 42);
      ctx.fillStyle = '#5d718c'; ctx.fillRect(0, 0, 96, 2);
      ctx.fillStyle = '#2e425b'; ctx.fillRect(0, 2, 96, 6);
      ctx.fillStyle = '#0d1526'; ctx.fillRect(0, 8, 96, 2);
      ctx.strokeStyle = '#34425b7d'; ctx.lineWidth = 0.6;
      for (let y = 13; y < 42; y += 12) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(96, y); ctx.stroke();
        for (let x = (y % 2) * 12; x < 96; x += 24) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 12); ctx.stroke();
        }
      }
    });
  }

  resetMotion() { this.rotation = -0.08; this.lastTime = 0; this.lastFlap = -10; }
  flap(time) { this.lastFlap = time; }

  layer(image, offset) {
    const start = -((offset % CITY_WIDTH + CITY_WIDTH) % CITY_WIDTH);
    for (let x = start; x < FLAPPY.width; x += CITY_WIDTH) this.ctx.drawImage(image, x, CITY_TOP, CITY_WIDTH, 300);
  }

  drawSky(time, distance, reducedMotion) {
    const ctx = this.ctx;
    ctx.drawImage(this.sky, 0, 0, 420, 520);
    for (const star of this.stars) {
      const drift = reducedMotion ? 0 : (distance * 0.013 + time * 0.4) * star.depth;
      const x = ((star.x - drift + 20) % 460 + 460) % 460 - 20;
      const twinkle = reducedMotion ? 0.8 : 0.67 + Math.sin(time * star.rate + star.phase) * 0.33;
      ctx.globalAlpha = star.brightness * twinkle * (1 - star.y / 430);
      ctx.fillStyle = star.warm ? '#ffe0b3' : '#ccddff';
      ctx.beginPath(); ctx.arc(x, star.y, star.radius, 0, TAU); ctx.fill();
      if (star.radius > 1.2) {
        ctx.globalAlpha *= 0.35;
        ctx.fillRect(x - 2.5, star.y - 0.3, 5, 0.6); ctx.fillRect(x - 0.3, star.y - 2.5, 0.6, 5);
      }
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(this.moon, 292, 27, 90, 90);
    const meteor = (time + 10) % 19;
    if (!reducedMotion && meteor < 0.8) {
      const x = 315 - meteor * 190, y = 37 + meteor * 60;
      const trail = ctx.createLinearGradient(x, y, x + 52, y - 16);
      trail.addColorStop(0, '#e4efff'); trail.addColorStop(1, '#d1dfff00');
      ctx.globalAlpha = Math.sin(meteor / 0.8 * Math.PI) * 0.7;
      ctx.strokeStyle = trail; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 52, y - 16); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#c7d0e08c'; ctx.font = '8px Inter, sans-serif';
    ctx.fillText('N E W  Y O R K   /   N I G H T  F L I G H T', 17, 24);
  }

  drawCity(time, distance, reducedMotion) {
    const ctx = this.ctx;
    const drift = reducedMotion ? 0 : distance;
    const cityOffset = drift * 0.14 + (reducedMotion ? 0 : time * 0.45);
    this.layer(this.farCity, drift * 0.065);
    this.layer(this.city, cityOffset);
    ctx.fillStyle = '#14223b'; ctx.fillRect(0, WATERLINE, 420, FLAPPY.ground - WATERLINE);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, WATERLINE, 420, FLAPPY.ground - WATERLINE); ctx.clip();
    ctx.translate(0, WATERLINE * 2); ctx.scale(1, -1); ctx.globalAlpha = 0.32;
    this.layer(this.city, cityOffset);
    ctx.restore();
    for (let i = 0; i < 25; i++) {
      const x = ((i * 89 + Math.sin(time * 0.8 + i) * (reducedMotion ? 0 : 4)) % 430 + 430) % 430;
      const y = WATERLINE + 4 + (i * 17 % 36);
      ctx.fillStyle = i % 3 ? '#bda6ac24' : '#a7c8e437';
      ctx.fillRect(x, y, 5 + (i * 3 % 19), 0.7);
    }
  }

  drawPipe(x, center) {
    const ctx = this.ctx, ratio = this.ratio;
    const top = center - FLAPPY.gap / 2, bottom = center + FLAPPY.gap / 2;
    ctx.drawImage(this.pipe, 0, 0, 64 * ratio, top * ratio, x, 0, 64, top);
    ctx.drawImage(this.pipe, 0, 0, 64 * ratio, (FLAPPY.ground - bottom) * ratio, x, bottom, 64, FLAPPY.ground - bottom);
    ctx.drawImage(this.pipeCap, x, top - 20, 64, 20);
    ctx.drawImage(this.pipeCap, x, bottom, 64, 20);
  }

  wing(swing, far) {
    const ctx = this.ctx;
    ctx.save();
    // A broad feathered wing foreshortens through the middle of each wingbeat.
    ctx.scale(1, swing);
    ctx.beginPath(); ctx.moveTo(-2, -3);
    ctx.bezierCurveTo(-11, -4, -22, 12, -19, 19);
    ctx.quadraticCurveTo(-17, 24, -14, 21);
    ctx.quadraticCurveTo(-13, 27, -9, 22);
    ctx.quadraticCurveTo(-5, 26, -3, 19);
    ctx.bezierCurveTo(-1, 13, 4, 3, -2, -3);
    ctx.fillStyle = far ? '#bc722f' : '#f4b340';
    ctx.strokeStyle = far ? '#9e652e' : '#b57832'; ctx.lineWidth = 1;
    ctx.fill(); ctx.stroke();
    if (!far) {
      ctx.strokeStyle = '#ffe39b'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-5, 1); ctx.quadraticCurveTo(-14, 7, -16, 18); ctx.stroke();
    }
    ctx.restore();
  }

  drawBird(model, y, time, reducedMotion) {
    const ctx = this.ctx;
    const idle = model.phase === 'ready', over = model.phase === 'over';
    const targetRotation = idle ? -0.08 : Math.max(-0.38, Math.min(1.15, model.velocity / 560));
    const dt = Math.min(Math.max(time - this.lastTime, 0), 0.05);
    this.rotation = reducedMotion ? targetRotation : mix(this.rotation, targetRotation, 1 - Math.exp(-dt * 15));
    this.lastTime = time;
    const pulse = reducedMotion ? 0 : Math.max(0, 1 - (time - this.lastFlap) / 0.2);
    const swing = reducedMotion || over ? 0.25 : Math.sin(time * TAU * (idle ? 2.2 : 4.4));
    ctx.save();
    ctx.translate(FLAPPY.birdX, y + (idle && !reducedMotion ? Math.sin(time * 2.4) * 3 : 0));
    ctx.rotate(this.rotation); ctx.scale(1 + pulse * 0.035, 1 - pulse * 0.025);
    ctx.save(); ctx.translate(6, -3); ctx.scale(0.75, 0.9); this.wing(swing, true); ctx.restore();
    ctx.fillStyle = '#ed9e38'; ctx.strokeStyle = '#a46a31'; ctx.lineWidth = 1;
    polygon(ctx, [[-12, -2], [-24, -6], [-20, 0], [-26, 3], [-14, 7]]); ctx.fill(); ctx.stroke();
    const body = ctx.createLinearGradient(0, -14, 0, 13);
    body.addColorStop(0, '#ffe99c'); body.addColorStop(0.42, '#ffd05d'); body.addColorStop(1, '#eea53c');
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.moveTo(-16, 0);
    ctx.bezierCurveTo(-18, -12, -4, -16, 7, -14); ctx.bezierCurveTo(19, -15, 23, -7, 19, 2);
    ctx.bezierCurveTo(17, 13, 0, 15, -10, 10); ctx.quadraticCurveTo(-16, 7, -16, 0);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff0b6'; ctx.beginPath(); ctx.ellipse(4, 7, 10, 5, -0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff8e4'; ctx.beginPath(); ctx.ellipse(12, -6, 6.3, 7.2, 0.12, 0, TAU); ctx.fill();
    const blink = idle && !reducedMotion && time % 5.3 > 5.14;
    ctx.fillStyle = '#17253b';
    if (blink || over) {
      ctx.strokeStyle = '#26354a'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(9, -6); ctx.quadraticCurveTo(12, -3, 16, -6); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(14, -5, 2.8, 3.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(14.5, -6.5, 1, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#fb9c55'; ctx.strokeStyle = '#b86838'; ctx.lineWidth = 0.8;
    polygon(ctx, [[18, -1], [29, 3], [19, 7]]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ad6540'; ctx.beginPath(); ctx.moveTo(20, 3); ctx.lineTo(28, 3); ctx.stroke();
    this.wing(swing * (1 + pulse * 0.15), false);
    ctx.restore();
  }

  draw(model, { alpha = 1, time = 0, reducedMotion = false } = {}) {
    const ctx = this.ctx;
    const distance = mix(model.previousDistance, model.distance, alpha);
    this.drawSky(time, distance, reducedMotion);
    this.drawCity(time, distance, reducedMotion);
    model.pipes.forEach(pipe => this.drawPipe(mix(pipe.previousX, pipe.x, alpha), pipe.center));
    const groundOffset = reducedMotion ? 0 : distance % 96;
    for (let x = -groundOffset; x < 420; x += 96) ctx.drawImage(this.ground, x, FLAPPY.ground, 96, 42);
    this.drawBird(model, mix(model.previousY, model.y, alpha), time, reducedMotion);
  }
}
