import * as T from './vendor/three.module.min.js';
import { CHARACTERS, chapter, random } from './hunter-model.js';

const geometry = {
  box: new T.BoxGeometry(1, 1, 1), ball: new T.SphereGeometry(1, 10, 8),
  rock: new T.IcosahedronGeometry(1, 0), cylinder: new T.CylinderGeometry(1, 1, 1, 9),
  cone: new T.ConeGeometry(1, 1, 7), ring: new T.TorusGeometry(1, 0.055, 4, 20),
  arch: new T.TorusGeometry(1, 0.018, 4, 24, Math.PI)
};
const heart = new T.Shape();
heart.moveTo(0, -0.13); heart.bezierCurveTo(-0.2, 0.01, -0.15, 0.16, -0.055, 0.13);
heart.quadraticCurveTo(0, 0.12, 0, 0.065); heart.quadraticCurveTo(0, 0.12, 0.055, 0.13);
heart.bezierCurveTo(0.15, 0.16, 0.2, 0.01, 0, -0.13); geometry.heart = new T.ShapeGeometry(heart);
const materials = new Map();
function material(color, flat = true) {
  const key = `${color}/${flat}`;
  if (!materials.has(key)) materials.set(key, new T.MeshLambertMaterial({ color, flatShading: flat }));
  return materials.get(key);
}
function mesh(group, kind, color, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const item = new T.Mesh(geometry[kind], material(color));
  item.position.set(...position); item.scale.set(...scale); item.rotation.set(...rotation); group.add(item); return item;
}
function limb(parent, position, upper, lower, width, length) {
  const pivot = new T.Group(); pivot.position.set(...position); parent.add(pivot);
  mesh(pivot, 'cylinder', upper, [0, -length * 0.24, 0], [width, length * 0.48, width]);
  const joint = new T.Group(); joint.position.y = -length * 0.48; pivot.add(joint);
  mesh(joint, 'cylinder', lower, [0, -length * 0.25, 0], [width * 0.88, length * 0.5, width * 0.88]);
  return { pivot, joint, length };
}
function buildCharacter(id) {
  const root = new T.Group(), body = new T.Group(); root.add(body);
  const eyes = [], blades = []; let rod;
  const skin = id === 'hisoka' ? '#edddd9' : '#efc8a9';
  const ink = '#152a2e', colors = {
    killua: { top: '#e8e3f1', under: '#333e86', shorts: '#777797', shoe: '#6b426c', hair: '#e6e6f4' },
    gon: { top: '#4d9544', under: '#4d9544', shorts: '#4d9544', shoe: '#447632', hair: '#152b25' },
    kurapika: { top: '#315eac', under: '#f0ece5', shorts: '#e6e2d7', shoe: '#3b5690', hair: '#edd255' },
    hisoka: { top: '#b3dcec', under: skin, shorts: '#b3dcec', shoe: '#293964', hair: '#c53665' }
  }[id];
  const tall = id === 'hisoka' ? 1.2 : id === 'kurapika' ? 1.07 : 1;
  root.scale.setScalar(tall);
  mesh(body, 'box', colors.top, [0, 1.7, 0], [0.67, 0.7, 0.38]);
  mesh(body, 'cylinder', colors.under, [0, 2.09, 0], [0.16, 0.21, 0.16]);
  mesh(body, 'box', colors.shorts, [0, 1.2, 0], [0.65, 0.43, 0.38]);
  const legs = [-1, 1].map(side => {
    const leg = limb(body, [side * 0.18, 1.26, 0], colors.shorts, id === 'gon' || id === 'killua' ? skin : colors.shorts, 0.135, 1.02);
    mesh(leg.joint, 'box', colors.shoe, [0, -0.52, 0.06], [0.25, id === 'gon' ? 0.49 : 0.24, 0.4]);
    mesh(leg.joint, 'box', id === 'gon' ? '#adc48a' : '#b4adce', [0, -0.64, 0.08], [0.26, 0.06, 0.41]);
    if (id === 'gon') mesh(leg.joint, 'box', '#d1dfb1', [0, -0.44, 0.269], [0.07, 0.32, 0.015]);
    return leg;
  });
  const arms = [-1, 1].map(side => {
    const arm = limb(body, [side * 0.43, 1.98, 0], colors.top, colors.under, 0.11, 0.77);
    mesh(arm.joint, 'ball', skin, [0, -0.42, 0], [0.1, 0.13, 0.09]);
    if (id === 'kurapika') {
      const blade = new T.Group(); arm.joint.add(blade); blade.position.set(0, -0.42, 0.06);
      mesh(blade, 'box', '#756d56', [0, 0, 0], [0.07, 0.07, 0.24]);
      mesh(blade, 'cone', '#d5dcd8', [0, 0, 0.37], [0.09, 0.59, 0.06], [Math.PI / 2, 0, 0]); blades.push(blade);
    }
    return arm;
  });
  const head = new T.Group(); head.position.set(0, 2.38, 0); body.add(head);
  mesh(head, 'ball', skin, [0, 0, 0], [0.35, 0.39, 0.32]);
  [-1, 1].forEach(side => {
    mesh(head, 'ball', skin, [side * 0.34, -0.03, 0], [0.065, 0.12, 0.065]);
    mesh(head, 'ball', '#faf4e7', [side * 0.145, 0.025, 0.274], [0.083, 0.091, 0.025]);
    eyes.push(mesh(head, 'ball', id === 'killua' ? '#4e82bd' : '#554631', [side * 0.145, 0.022, 0.297], [0.043, 0.068, 0.014]));
    mesh(head, 'ball', ink, [side * 0.145, 0.018, 0.309], [0.021, 0.048, 0.01]);
    mesh(head, 'box', ink, [side * 0.145, 0.11, 0.28], [0.16, 0.028, 0.018], [0, 0, side * -0.15]);
  });
  mesh(head, 'box', '#b48278', [0, -0.19, 0.29], [0.07, 0.014, 0.01]);
  mesh(head, 'ball', colors.hair, [0, 0.17, -0.065], [0.39, 0.31, 0.34]);
  const hair = new T.Group(); head.add(hair);
  if (id === 'kurapika') {
    for (let i = 0; i < 13; i++) {
      const a = i / 13 * Math.PI * 2;
      mesh(hair, 'cone', colors.hair, [Math.sin(a) * 0.3, -0.015, Math.cos(a) * 0.25], [0.15, 0.64, 0.15], [0.12 * Math.cos(a), 0, Math.PI + 0.12 * Math.sin(a)]);
    }
    mesh(body, 'box', colors.top, [0, 1.16, -0.045], [0.77, 1.02, 0.5]);
    const trim = '#c75b67';
    [-1, 1].forEach(s => { mesh(body, 'box', trim, [s * 0.34, 1.3, 0.21], [0.055, 1.03, 0.015]); mesh(body, 'box', trim, [s * 0.34, 1.3, -0.303], [0.055, 1.03, 0.02]); });
    mesh(body, 'box', trim, [0, 1.67, -0.302], [0.7, 0.055, 0.02]);
    mesh(body, 'ring', trim, [0, 1.34, -0.316], [0.13, 0.13, 0.13]);
    mesh(body, 'box', trim, [0, 0.67, -0.304], [0.73, 0.055, 0.02]);
  } else {
    const count = id === 'killua' ? 21 : 15;
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2, length = id === 'gon' ? 0.65 + (i % 3) * 0.14 : id === 'hisoka' ? 0.63 : 0.39;
      const p = id === 'killua' ? 0.3 : 0.22;
      mesh(hair, 'cone', colors.hair, [Math.sin(a) * p, 0.29 + (i % 3) * 0.025, Math.cos(a) * p], [0.13, length, 0.12], [Math.cos(a) * (id === 'killua' ? 0.95 : 0.4), 0, -Math.sin(a) * 0.65]);
    }
    if (id === 'gon') {
      const trim = '#d77945';
      mesh(body, 'box', trim, [0, 1.72, 0.2], [0.055, 0.69, 0.025]);
      mesh(body, 'box', trim, [0, 1.38, 0], [0.69, 0.05, 0.41]);
      [-1, 1].forEach(s => mesh(body, 'box', trim, [s * 0.26, 1.65, 0.202], [0.13, 0.045, 0.025], [0, 0, s * 0.4]));
      // Fishing rod, carried diagonally across his back.
      rod = mesh(body, 'cylinder', '#705445', [0.3, 1.74, -0.3], [0.025, 1.6, 0.025], [0, 0, -0.37]);
    }
    if (id === 'hisoka') {
      mesh(body, 'box', '#d885a3', [0, 1.38, 0], [0.67, 0.24, 0.41]);
      mesh(body, 'box', '#ecd167', [0, 1.2, 0], [0.77, 0.19, 0.45]);
      for (const z of [-0.212, 0.21]) {
        mesh(body, 'box', '#473761', [-0.19, 1.78, z], [0.17, 0.17, 0.025], [0, 0, Math.PI / 4]);
        mesh(body, 'heart', '#b3416c', [0.19, 1.78, z], [0.9, 0.9, 1], [0, z < 0 ? Math.PI : 0, 0]);
      }
      mesh(head, 'cone', '#ab457f', [-0.22, -0.105, 0.284], [0.045, 0.1, 0.025]);
      mesh(head, 'ball', '#3c927d', [0.22, -0.12, 0.282], [0.031, 0.068, 0.02]);
    }
  }
  const board = new T.Group(); root.add(board); board.visible = false;
  mesh(board, 'box', '#bed792', [0, 0.08, 0], [0.65, 0.08, 1.25]);
  for (const x of [-0.3, 0.3]) for (const z of [-0.42, 0.42]) mesh(board, 'cylinder', '#a45247', [x, 0, z], [0.08, 0.12, 0.08], [0, 0, Math.PI / 2]);
  return { root, body, head, legs, arms, board, eyes, blades, rod, id };
}

// Scenery is instanced per geometry, including per-instance color. A chunk needs
// only a handful of draw calls, irrespective of its windows, foliage, or bricks.
const instanceMaterial = new T.MeshLambertMaterial({ color: '#ffffff', flatShading: true });
function batch(items) {
  const group = new T.Group(), kinds = new Map();
  for (const item of items) { if (!kinds.has(item.kind)) kinds.set(item.kind, []); kinds.get(item.kind).push(item); }
  const dummy = new T.Object3D(), color = new T.Color();
  for (const [kind, entries] of kinds) {
    const object = new T.InstancedMesh(geometry[kind], instanceMaterial, entries.length);
    for (const [index, item] of entries.entries()) {
      dummy.position.set(...item.p); dummy.scale.set(...item.s); dummy.rotation.set(...(item.r || [0, 0, 0])); dummy.updateMatrix();
      object.setMatrixAt(index, dummy.matrix); object.setColorAt(index, color.set(item.c));
    }
    object.instanceMatrix.needsUpdate = true; group.add(object);
  }
  return group;
}
function landscape(course, ch, index, seed) {
  const r = random(seed ^ Math.imul(index + 999, 374761393)), items = [];
  const add = (kind, c, p, s, rotation) => items.push({ kind, c, p, s, r: rotation });
  const box = (c, p, s, rotation) => add('box', c, p, s, rotation);
  const tree = (x, z, lush = false) => {
    const h = 5 + r() * 6;
    add('cylinder', lush ? '#755e42' : '#465b4e', [x, h / 2, z], [0.25 + r() * 0.22, h, 0.32]);
    for (let n = 0; n < 3; n++) add('rock', lush ? ['#83a975', '#769a68', '#9eb77f'][n] : ['#496b5c', '#587460', '#365a4f'][n], [x + (r() - 0.5) * 2, h - n * 0.6, z], [2.4 + r(), 1.9, 2.8]);
    add('rock', '#384d3f', [x, 0.05, z], [1, 0.13, 0.75]);
  };
  if (course === 'exam' && ch < 2) {
    box('#4b615b', [0, -0.3, 0], [14, 0.5, 24.1]);
    for (const side of [-1, 1]) {
      box('#52695f', [side * 7.4, 2.5, 0], [1, 5, 24]);
      box('#2c4743', [side * 6.85, 0.8, 0], [0.12, 0.5, 24]);
      for (const z of [-10, 1, 11]) {
        box('#243f3d', [side * 6.55, 4.4, z], [0.7, 0.42, 1.4]);
        box('#e6d6a7', [side * 6.35, 4.25, z], [0.25, 0.08, 1.1]);
        box('#334c48', [side * 6.7, 1.6, z], [0.1, 0.1, 10.5]);
      }
    }
    for (const z of [-12, 0, 12]) add('arch', '#77897b', [0, 0, z], [7, 7, 1]);
    if (ch === 1) for (let n = -11; n < 12; n += 1.4) box('#879484', [0, -0.02, n], [12.8, 0.09, 0.22]);
    else for (const x of [-2.35, 2.35]) box('#9ba184', [x, -0.032, 0], [0.035, 0.025, 24]);
  } else if (course === 'exam') {
    box('#3f5950', [0, -0.35, 0], [50, 0.4, 24]); box('#7a8270', [0, -0.1, 0], [7.3, 0.22, 24.1]);
    for (let n = 0; n < 10; n++) {
      const side = n % 2 ? 1 : -1, x = side * (5.3 + r() * 16), z = (r() - 0.5) * 24;
      tree(x, z); add('cone', '#7d9572', [side * (4 + r() * 2), 0.4, z], [0.3, 0.8, 0.3]);
      if (n < 3) add('rock', '#78857a', [side * 4.5, 0.2, z], [0.7, 0.5, 0.5]);
    }
    // A distant, watchful wetland creature; kept off the playable path.
    if (index % 3 === 0) { add('ball', '#596c58', [5.1, 0.9, 3], [0.8, 0.8, 1.15]); for (const x of [4.8, 5.3]) add('ball', '#d6c888', [x, 1.25, 3.9], [0.11, 0.08, 0.04]); }
  } else if (course === 'yorknew') {
    const rooftop = ch === 1;
    box(rooftop ? '#69717a' : '#46505a', [0, -0.15, 0], [8.2, 0.3, 24.1]);
    for (const side of [-1, 1]) {
      box('#879191', [side * 4.15, rooftop ? 0.28 : 0, 0], [0.3, rooftop ? 0.65 : 0.16, 24]);
      const height = 10 + r() * 13, x = side * (9 + r() * 2);
      box(['#546071', '#716c6c', '#52606b'][index % 3], [x, height / 2 - (rooftop ? 8 : 0), 0], [7, height, 21.5]);
      for (let y = 1; y < height - 1; y += 2.2) for (let z = -8; z <= 8; z += 2.5) {
        box(r() < 0.44 ? '#d9bb85' : '#374654', [x - side * 3.51, y - (rooftop ? 8 : 0), z], [0.025, 1.15, 0.85]);
      }
      for (let y = 0; y < height; y += 4.4) box('#89918f', [x - side * 3.55, y - (rooftop ? 8 : 0), 0], [0.18, 0.12, 21.7]);
      if (!rooftop) {
        box('#344958', [side * 4.3, 2.6, 1], [0.12, 5.2, 0.12]);
        box('#e7c58c', [side * 4.3, 5.25, 1], [0.5, 0.5, 0.5]);
        box('#835951', [side * 5.55, 1.4, -5], [1.1, 2.8, 2.8]);
      } else { add('cylinder', '#605963', [side * 8, 1.5, 5], [1.6, 2.6, 1.6]); add('cone', '#414753', [side * 8, 3.3, 5], [1.8, 1.1, 1.8]); }
    }
    if (!rooftop && index % 3 === 0) for (const z of [-9, -8, -7, -6, -5]) box('#b8b6a0', [0, 0.015, z], [7.9, 0.02, 0.46]);
  } else {
    box('#8da775', [0, -0.3, 0], [64, 0.4, 24]); box('#c6b88d', [0, -0.065, 0], [7.5, 0.12, 24.1]);
    for (const side of [-1, 1]) {
      if (ch === 2) {
        const x = side * (7.5 + r() * 2), h = 4 + r() * 3;
        box('#e5d2a7', [x, h / 2, 0], [4.5, h, 6]);
        add('cone', '#647b82', [x, h + 1.6, 0], [4.2, 3.2, 4.2], [0, Math.PI / 4, 0]);
        box('#6c826b', [x - side * 2.28, 1.3, 0], [0.03, 2.6, 1.1]);
        for (const z of [-1.7, 1.7]) box('#657d86', [x - side * 2.27, h - 1.25, z], [0.025, 0.95, 0.8]);
        box('#b59a6b', [side * 4.5, 0.35, 4], [0.7, 0.7, 1.4]);
      } else for (let n = 0; n < (ch === 1 ? 5 : 2); n++) tree(side * (5.2 + r() * 14), (r() - 0.5) * 24, true);
      for (let n = 0; n < 5; n++) {
        const x = side * (4.2 + r() * 9), z = (r() - 0.5) * 24;
        add('rock', '#9ab17e', [x, 0.1, z], [0.5, 0.35, 0.4]);
        if (n < 3) add('ball', '#e7d8a0', [x, 0.37, z], [0.12, 0.12, 0.12]);
      }
    }
  }
  return batch(items);
}

function obstacleObject(h, course) {
  const root = new T.Group(), forest = course !== 'yorknew', stone = forest ? '#71846b' : '#75818b';
  if (h.kind === 'hurdle') {
    if (forest) { mesh(root, 'cylinder', '#806548', [0, 0.5, 0], [0.4, 1.8, 0.4], [0, 0, Math.PI / 2]); mesh(root, 'cylinder', '#b39b6f', [0.91, 0.5, 0], [0.31, 0.02, 0.31], [0, 0, Math.PI / 2]); }
    else { mesh(root, 'box', '#bd915f', [0, 0.48, 0], [1.8, 0.95, 0.7]); for (const x of [-0.7, 0.7]) mesh(root, 'box', '#574b40', [x, 0.48, 0.37], [0.09, 0.95, 0.06]); }
  } else if (h.kind === 'beam') {
    mesh(root, 'box', stone, [0, 2.25, 0], [2.12, 2.4, 0.7]);
    for (const x of [-1, 1]) mesh(root, 'cylinder', '#6e6751', [x, 1.4, 0], [0.11, 2.8, 0.11]);
    mesh(root, 'box', '#d6c488', [0, 1.1, 0.37], [1.8, 0.09, 0.04]);
  } else if (h.kind === 'wall') {
    if (forest) mesh(root, 'rock', stone, [0, 1.85, 0], [1.1, 2.1, 0.9]);
    else { mesh(root, 'box', '#617079', [0, 1.85, 0], [2.05, 3.7, 1.4]); for (let y = 0.4; y < 3.4; y += 0.7) mesh(root, 'box', '#a4aca0', [0, y, 0.72], [1.7, 0.04, 0.02]); }
  } else if (h.kind === 'gap') {
    mesh(root, 'box', '#152b2b', [0, 0.015, 0], [2.32, 0.05, 2.7]);
    for (const z of [-1.4, 1.4]) mesh(root, 'box', '#9b936f', [0, 0.09, z], [2.35, 0.15, 0.14]);
    for (const x of [-0.9, 0.8]) mesh(root, 'box', '#b6ac88', [x, 0.06, -1.1], [0.18, 0.12, 0.9], [0, x * 0.2, 0]);
  } else if (h.kind === 'wire') {
    for (const x of [-1, 1]) mesh(root, 'cylinder', '#696874', [x, 0.6, 0], [0.045, 1.2, 0.045]);
    const line = mesh(root, 'box', '#c798df', [0, 0.6, 0], [2.05, 0.045, 0.025]);
    line.material = new T.MeshBasicMaterial({ color: '#d2a6f6', transparent: true, opacity: 0.14 }); root.userData.wire = line;
    mesh(root, 'ring', '#ac9fb0', [0, 0.04, 0], [0.28, 0.28, 0.28], [-Math.PI / 2, 0, 0]);
  } else if (h.kind === 'projectile') {
    mesh(root, 'cone', '#b78baa', [0, 1.2, 0], [0.26, 1.05, 0.26], [Math.PI / 2, 0, 0]);
    mesh(root, 'ring', '#e8bed9', [0, 1.2, -0.45], [0.3, 0.3, 0.3]);
  } else if (h.kind === 'turn' || h.kind === 'finish') {
    for (const x of [-4, 4]) mesh(root, 'box', stone, [x, 2.5, 0], [0.55, 5, 0.55]);
    mesh(root, 'box', '#415647', [0, 4.8, 0], [8.6, 0.65, 0.55]);
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 80;
    const c = canvas.getContext('2d'); c.fillStyle = '#e5dcc1'; c.fillRect(0, 0, 256, 80); c.fillStyle = '#233e34'; c.font = 'bold 48px sans-serif'; c.textAlign = 'center'; c.fillText(h.kind === 'finish' ? 'FINISH' : h.side < 0 ? '← LEFT' : 'RIGHT →', 128, 57);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const sign = new T.Mesh(new T.PlaneGeometry(3.3, 1.03), new T.MeshBasicMaterial({ map: texture })); sign.position.set(0, 3.6, 0.31); root.add(sign); root.userData.unique = sign;
  }
  return root;
}

export class HunterScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6)); this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.scene = new T.Scene(); this.scene.fog = new T.Fog('#a8b6a2', 35, 150);
    this.camera = new T.PerspectiveCamera(52, 1, 0.1, 210);
    this.hemi = new T.HemisphereLight('#fff0d1', '#647561', 2.4); this.scene.add(this.hemi);
    this.sun = new T.DirectionalLight('#ffefd8', 2.2); this.sun.position.set(-12, 20, 8); this.scene.add(this.sun);
    this.chunks = new Map(); this.objects = new Map(); this.character = null; this.stamp = ''; this.time = 0; this.distance = 0; this.bend = 0; this.pulse = 0; this.heal = 0;
    const shadowMat = new T.MeshBasicMaterial({ color: '#102e28', transparent: true, opacity: 0.3, depthWrite: false });
    this.shadow = new T.Mesh(new T.CircleGeometry(0.6, 24), shadowMat); this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.025; this.scene.add(this.shadow);
    this.aura = new T.Mesh(new T.SphereGeometry(1, 14, 10), new T.MeshBasicMaterial({ color: '#d1e7f1', transparent: true, opacity: 0.07, depthWrite: false, wireframe: true }));
    this.aura.scale.set(0.7, 1.5, 0.6); this.scene.add(this.aura);
    this.lightning = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({ color: '#cdf0ff', transparent: true, opacity: 0.8 })); this.scene.add(this.lightning);
    this.lightning.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(252), 3).setUsage(T.DynamicDrawUsage)); this.lightning.frustumCulled = false;
    this.tether = new T.Group(); this.scene.add(this.tether);
    const gumMaterial = new T.MeshBasicMaterial({ color: '#efa9d7', transparent: true, opacity: 0.8 });
    for (let i = 0; i < 2; i++) this.tether.add(new T.Mesh(geometry.cylinder, gumMaterial));
    this.tetherPoints = [new T.Vector3(), new T.Vector3(), new T.Vector3()]; this.tetherVector = new T.Vector3(); this.tetherAxis = new T.Vector3(0, 1, 0);
    this.flash = new T.Mesh(new T.TorusGeometry(0.8, 0.04, 5, 32), new T.MeshBasicMaterial({ color: '#fff0b9', transparent: true, opacity: 0, depthWrite: false })); this.scene.add(this.flash);
    this.strike = new T.Mesh(geometry.ball, new T.MeshBasicMaterial({ color: '#f2d47d', transparent: true, opacity: 0.8, depthWrite: false })); this.scene.add(this.strike);
    this.blade = new T.Mesh(geometry.cone, new T.MeshBasicMaterial({ color: '#d6edb9', transparent: true, opacity: 0.8, depthWrite: false })); this.blade.rotation.x = -Math.PI / 2; this.scene.add(this.blade);
    this.chainLinks = new T.InstancedMesh(geometry.ring, material('#c6d1ce'), 24); this.chainLinks.instanceMatrix.setUsage(T.DynamicDrawUsage); this.chainLinks.frustumCulled = false; this.scene.add(this.chainLinks);
    this.effectTransform = new T.Object3D();
    this.debris = new T.InstancedMesh(geometry.rock, instanceMaterial, 48); this.debris.instanceMatrix.setUsage(T.DynamicDrawUsage); this.debris.frustumCulled = false; this.debris.count = 0; this.scene.add(this.debris); this.fragments = [];
    this.effectColor = new T.Color();
    this.afterimages = [];
    for (let i = 0; i < 3; i++) {
      const echo = new T.Mesh(new T.CapsuleGeometry(0.3, 1.3, 3, 6), new T.MeshBasicMaterial({ color: '#aeccec', transparent: true, opacity: 0.07, depthWrite: false })); this.scene.add(echo); this.afterimages.push(echo);
    }
    this.resize();
  }
  resize() {
    const { width, height } = this.canvas.getBoundingClientRect(); if (!width || !height) return;
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }
  disposeObject(object) {
    object.traverse(child => {
      if (child.isInstancedMesh) child.dispose();
      if (child === object.userData.unique) { child.geometry.dispose(); child.material.map.dispose(); child.material.dispose(); }
    });
    if (object.userData.wire) object.userData.wire.material.dispose();
    this.scene.remove(object);
  }
  reset(model) {
    for (const object of [...this.chunks.values(), ...this.objects.values()]) this.disposeObject(object);
    this.chunks.clear(); this.objects.clear();
    if (this.character) this.scene.remove(this.character.root);
    this.character = buildCharacter(model.config.character); this.scene.add(this.character.root);
    this.stamp = `${model.seed}/${model.config.course}/${model.config.character}/${model.config.mode}/${model.config.difficulty}`;
    this.time = 0; this.pulse = 0; this.heal = 0; this.fragments = []; this.turnLean = 0;
  }
  accept(events) {
    if (events.some(e => ['cast', 'release', 'collect', 'deflect'].includes(e.type))) this.pulse = 1;
    if (events.some(e => ['heal', 'recover'].includes(e.type))) this.heal = 1;
    for (const e of events) {
      if (e.type === 'turn') this.turnLean = e.side * 0.05;
      if (e.type === 'break') {
        for (let i = 0; i < 6 && this.fragments.length < 48; i++) this.fragments.push({ x: e.hazard.lane * 2.35, z: e.hazard.z, age: 0, vx: Math.cos(i * 2.4) * 2, vz: Math.sin(i * 2.4) * 2, rise: 2.4 + i * 0.15 });
      }
    }
  }
  point(x, z, ch) {
    const d = z - this.distance, curve = Math.sin(this.distance / 230) * 0.00065;
    return { x: x + d * d * curve, y: this.course === 'exam' && ch === 1 ? d * 0.07 : 0, z: -d, angle: Math.atan(-2 * d * curve) };
  }
  draw(model, { dt = 0, alpha = 1, reducedMotion = false, preview = false } = {}) {
    const stamp = `${model.seed}/${model.config.course}/${model.config.character}/${model.config.mode}/${model.config.difficulty}`;
    if (this.stamp !== stamp) this.reset(model);
    this.time += dt; this.pulse = Math.max(0, this.pulse - dt * 2.5); this.heal = Math.max(0, this.heal - dt);
    this.turnLean *= Math.exp(-dt * 3);
    this.distance = model.previousDistance + (model.distance - model.previousDistance) * alpha; this.course = model.config.course;
    const ch = chapter(this.distance, model.config), time = this.time, early = model.config.course === 'exam' && ch < 2;
    const bg = early ? '#344d47' : model.config.course === 'exam' ? '#a6b5a3' : model.config.course === 'yorknew' ? '#495564' : '#d1dec6';
    if (!this.scene.background) this.scene.background = new T.Color(bg); else this.scene.background.set(bg);
    this.scene.fog.color.set(bg); this.scene.fog.near = early ? 20 : 45; this.scene.fog.far = early ? 125 : 165;
    this.hemi.intensity = early ? 1.45 : model.config.course === 'yorknew' ? 1.5 : 2.5; this.sun.intensity = early ? 1 : 1.8;
    const first = Math.floor(this.distance / 24) - 1, needed = new Set();
    for (let n = first; n <= first + 8; n++) {
      const z = n * 24, section = chapter(Math.max(0, z), model.config), key = `${n}/${section}`; needed.add(key);
      if (!this.chunks.has(key)) { const group = landscape(model.config.course, section, n, model.seed); this.chunks.set(key, group); this.scene.add(group); }
      const group = this.chunks.get(key), p = this.point(0, z, ch); group.position.set(p.x, p.y, p.z); group.rotation.y = p.angle;
    }
    for (const [key, group] of this.chunks) if (!needed.has(key)) { this.disposeObject(group); this.chunks.delete(key); }
    const keys = new Set();
    for (const h of model.obstacles) {
      if (h.z - this.distance > 155 || h.z < this.distance - 12 || h.cleared) continue;
      keys.add(h.id);
      if (!this.objects.has(h.id)) { const obj = obstacleObject(h, model.config.course); this.objects.set(h.id, obj); this.scene.add(obj); }
      const obj = this.objects.get(h.id), p = this.point(h.lane * 2.35, h.z, ch); obj.position.set(p.x, p.y, p.z); obj.rotation.y = p.angle;
      if (obj.userData.wire) obj.userData.wire.material.opacity = model.gyo > 0 ? 1 : 0.13;
      obj.visible = h.kind !== 'projectile' || h.locked !== false;
      if (h.kind === 'projectile') obj.rotation.z = time * 3;
    }
    for (const p of model.pickups) {
      if (p.taken || p.z < this.distance - 6 || p.z - this.distance > 150) continue;
      keys.add(p.id);
      if (!this.objects.has(p.id)) {
        const group = new T.Group();
        if (p.kind === 'electric') { mesh(group, 'box', '#a1c5d6', [0, 0.7, 0], [0.8, 1.4, 0.5]); mesh(group, 'box', '#e6dc92', [0, 1.05, 0.27], [0.3, 0.4, 0.03]); mesh(group, 'ring', '#bce6ed', [0, 0.5, 0.28], [0.18, 0.18, 0.18]); }
        else { mesh(group, 'box', '#ecdb9b', [0, 0, 0], [0.32, 0.47, 0.08]); mesh(group, 'box', '#5e7755', [0, 0.05, 0.046], [0.2, 0.055, 0.01]); mesh(group, 'box', '#5e7755', [0, -0.06, 0.046], [0.2, 0.055, 0.01]); }
        this.objects.set(p.id, group); this.scene.add(group);
      }
      const obj = this.objects.get(p.id), point = this.point(p.lane * 2.35, p.z, ch);
      obj.position.set(point.x, point.y + (p.kind === 'electric' ? 0 : 1 + (reducedMotion ? 0 : Math.sin(time * 2 + p.z) * 0.12)), point.z);
      obj.rotation.y = p.kind === 'seal' && !reducedMotion ? time * 0.6 : point.angle;
    }
    if (model.finish - this.distance < 155) {
      keys.add('finish');
      if (!this.objects.has('finish')) { const gate = obstacleObject({ kind: 'finish' }, model.config.course); this.objects.set('finish', gate); this.scene.add(gate); }
      const p = this.point(0, model.finish, ch), gate = this.objects.get('finish'); gate.position.set(p.x, p.y, p.z); gate.rotation.y = p.angle;
    }
    if (model.config.character === 'hisoka') for (const a of model.anchors) {
      if (a.z < this.distance - 8 || a.z - this.distance > 140) continue;
      keys.add(a.id);
      if (!this.objects.has(a.id)) {
        const group = new T.Group(); mesh(group, 'cylinder', '#736e61', [0, 2.5, 0], [0.09, 5, 0.09]);
        mesh(group, 'ring', '#d999bd', [0, 5, 0], [0.35, 0.35, 0.35]); this.objects.set(a.id, group); this.scene.add(group);
      }
      const p = this.point(a.lane * 2.35 + (a.lane < 0 ? -0.9 : 0.9), a.z, ch); this.objects.get(a.id).position.set(p.x, p.y, p.z);
    }
    for (const [key, obj] of this.objects) if (!keys.has(key)) { this.disposeObject(obj); this.objects.delete(key); }
    const rig = this.character, running = model.phase === 'playing', x = (model.previousX + (model.x - model.previousX) * alpha) * 2.35;
    const y = model.previousY + (model.y - model.previousY) * alpha;
    const god = model.power > 0 && model.kit.skill === 'godspeed', skating = model.power > 0 && model.kit.skill === 'board';
    const cycle = this.distance * 0.92, bob = running && !reducedMotion && !model.jump && !model.slide && !skating ? Math.abs(Math.sin(cycle)) * 0.065 : 0;
    rig.root.position.set(preview ? 0 : x, preview ? 0 : y + bob, preview ? -0.4 : 0);
    rig.root.rotation.y = preview ? 0.3 + (reducedMotion ? 0 : Math.sin(time * 0.3) * 0.15) : Math.PI;
    rig.body.rotation.z = preview || reducedMotion ? 0 : Math.max(-0.17, Math.min(0.17, (model.x - model.lane) * 0.3));
    rig.body.rotation.x = model.slide > 0 ? -0.9 : god ? -0.3 : model.windup > 0 ? -0.2 : running ? -0.1 : 0;
    rig.body.position.y = model.slide > 0 ? -0.72 : model.phase === 'over' ? -0.3 : 0;
    rig.head.rotation.y = preview ? -0.3 : 0;
    rig.board.visible = skating;
    for (const blade of rig.blades) blade.visible = model.kit.skill === 'blades';
    if (rig.rod) { const casting = model.power > 0 && model.kit.skill === 'rod'; rig.rod.position.set(casting ? 0.45 : 0.3, casting ? 1.95 : 1.74, casting ? 0.5 : -0.3); rig.rod.rotation.set(casting ? 1 : 0, 0, casting ? 0 : -0.37); }
    for (const eye of rig.eyes) eye.material = material(this.heal > 0 && rig.id === 'kurapika' ? '#bc3447' : rig.id === 'killua' ? '#4e82bd' : '#554631');
    for (let i = 0; i < 2; i++) {
      const leg = rig.legs[i], arm = rig.arms[i], sign = i ? 1 : -1;
      leg.pivot.rotation.x = running ? Math.sin(cycle + i * Math.PI) * 0.65 : 0;
      leg.joint.rotation.x = running ? Math.max(0, Math.cos(cycle + i * Math.PI)) * 0.75 : 0.05;
      arm.pivot.rotation.x = running ? -Math.sin(cycle + i * Math.PI) * 0.6 : 0;
      arm.pivot.rotation.z = sign * -0.1; arm.joint.rotation.x = -0.4;
      if (model.jump > 0 || model.gumTarget) { leg.pivot.rotation.x = -0.5 + i * 0.9; leg.joint.rotation.x = 0.8; arm.pivot.rotation.x = -1.1; }
      if (model.slide > 0) { leg.pivot.rotation.x = -0.6; leg.joint.rotation.x = 1.2; arm.pivot.rotation.x = -0.8; }
      if (skating) { leg.pivot.rotation.x = i ? 0.1 : -0.15; leg.joint.rotation.x = 0.2; arm.pivot.rotation.z = sign * -0.35; }
      if (model.windup > 0) { arm.pivot.rotation.x = i ? -0.6 : -1.3; arm.joint.rotation.x = -0.9; leg.pivot.rotation.x *= 0.25; }
      if (model.power > 0 && model.kit.skill === 'jajanken') { arm.pivot.rotation.x = i ? -1.5 : -0.25; arm.joint.rotation.x = -0.05; }
      if (model.power > 0 && ['gum', 'chain', 'rod', 'palm', 'blades'].includes(model.kit.skill)) arm.pivot.rotation.x = i ? -1.2 : -0.2;
      if (god) { arm.pivot.rotation.x = 0.6; arm.joint.rotation.x = -0.2; }
      if (model.phase === 'over') { leg.pivot.rotation.x = -0.25; leg.joint.rotation.x = 0.65; arm.pivot.rotation.x = 0.1; }
      if (model.phase === 'won') { arm.pivot.rotation.z = sign * -2.1; arm.joint.rotation.x = -0.6; }
    }
    if (model.stumble > 0 && !reducedMotion) { rig.body.rotation.x += Math.sin(model.stumble * 20) * 0.09; rig.head.rotation.z = Math.sin(model.stumble * 13) * 0.1; } else rig.head.rotation.z = 0;
    this.shadow.position.x = preview ? 0 : x; this.shadow.scale.setScalar(1 - Math.min(0.45, y * 0.15));
    this.aura.position.set(x, y + 1.45, 0); this.aura.visible = !preview && model.kit.nen && model.state !== 'zetsu';
    this.aura.material.color.set(this.heal > 0 ? '#bcf2a6' : model.gyo > 0 ? '#e4cb83' : CHARACTERS[model.config.character].color);
    this.aura.material.opacity = reducedMotion ? 0.025 : 0.045 + (model.gyo > 0 || model.power > 0 ? 0.035 : 0);
    const points = this.lightning.geometry.attributes.position.array; let pointCount = 0;
    const electrical = god || model.power > 0 && model.kit.skill === 'palm';
    if (electrical && !reducedMotion) for (let n = 0; n < 6; n++) for (let k = 0; k < 7; k++) {
      const a = n / 6 * Math.PI * 2, wobble = Math.sin(k * 9 + Math.floor(time * 18) + n) * 0.13;
      points.set([x + Math.sin(a) * (0.5 + wobble), y + k * 0.45, Math.cos(a) * 0.4], pointCount); pointCount += 3;
      points.set([x + Math.sin(a) * (0.5 - wobble), y + (k + 1) * 0.45, Math.cos(a) * 0.4], pointCount); pointCount += 3;
    }
    this.lightning.geometry.attributes.position.needsUpdate = true; this.lightning.geometry.setDrawRange(0, pointCount / 3); this.lightning.visible = electrical && !reducedMotion;
    this.tether.visible = Boolean(model.gumTarget);
    if (this.tether.visible) {
      const anchor = model.gumTarget, p = this.point(anchor.lane * 2.35 + (anchor.lane < 0 ? -0.9 : 0.9), anchor.z, ch);
      this.tetherPoints[0].set(x - 0.4, y + 1.7, 0);
      this.tetherPoints[1].set((x + p.x) / 2, (y + 1.7 + p.y + 5) / 2 - 0.25, p.z / 2);
      this.tetherPoints[2].set(p.x, p.y + 5, p.z);
      this.tether.children.forEach((segment, i) => {
        const a = this.tetherPoints[i], b = this.tetherPoints[i + 1]; this.tetherVector.subVectors(b, a);
        segment.position.copy(a).add(b).multiplyScalar(0.5); segment.scale.set(0.045, this.tetherVector.length(), 0.045);
        segment.quaternion.setFromUnitVectors(this.tetherAxis, this.tetherVector.normalize());
      });
    }
    this.afterimages.forEach((echo, i) => { echo.visible = !reducedMotion && model.power > 0 && ['godspeed', 'echo'].includes(model.kit.skill); echo.position.set(x + Math.sin(time * 4 + i) * 0.15, y + 1.4, (i + 1) * 0.65); });
    this.flash.visible = this.pulse > 0 && !preview && !reducedMotion;
    this.flash.position.set(x, y + 1.5, -0.5); this.flash.scale.setScalar(1 + (1 - this.pulse) * 2); this.flash.material.opacity = this.pulse * 0.5;
    // Shared geometries make these transient techniques inexpensive to animate.
    const releasing = model.kit.skill === 'jajanken' && model.power > 0;
    this.strike.visible = !preview && (model.windup > 0 || releasing && model.lockedForm !== 'Scissors');
    this.blade.visible = !preview && releasing && model.lockedForm === 'Scissors';
    if (this.strike.visible) {
      const charge = model.windup > 0, progress = 1 - model.power / 0.65, paper = model.lockedForm === 'Paper';
      this.strike.position.set(x - 0.38, y + 1.8, charge ? -0.35 : -(paper ? progress * 32 : 1 + progress * 9));
      this.strike.scale.setScalar(charge ? 0.14 + (1 - model.windup / 0.85) * 0.4 : paper ? 0.6 : 0.85 + progress * 0.6);
      this.strike.material.opacity = reducedMotion ? 0.5 : charge ? 0.65 : Math.min(0.8, model.power * 2);
    }
    if (this.blade.visible) { const length = 17 * Math.sin(Math.min(1, (0.65 - model.power) / 0.2) * Math.PI / 2); this.blade.position.set(x - 0.3, y + 1.8, -length / 2); this.blade.scale.set(0.08, length, 0.4); this.blade.material.opacity = Math.min(0.85, model.power * 2); }
    this.chainLinks.visible = !preview && model.power > 0 && model.kit.skill === 'chain';
    if (this.chainLinks.visible) {
      for (let i = 0; i < 24; i++) {
        const t = i / 23, sway = reducedMotion ? 0 : Math.sin(time * 9 - t * 3);
        this.effectTransform.position.set(x - 0.4 + t * sway, y + 1.7 - Math.sin(t * Math.PI) * 0.5, -t * 4.2);
        this.effectTransform.scale.set(0.095, 0.15, 0.095); this.effectTransform.rotation.set(Math.PI / 2, i % 2 * Math.PI / 2, 0); this.effectTransform.updateMatrix();
        this.chainLinks.setMatrixAt(i, this.effectTransform.matrix);
      }
      this.chainLinks.instanceMatrix.needsUpdate = true;
    }
    if (reducedMotion) this.fragments = [];
    this.fragments = this.fragments.filter(f => { f.age += dt; return f.age < 0.65; });
    this.debris.count = this.fragments.length;
    this.fragments.forEach((f, i) => {
      const p = this.point(f.x + f.vx * f.age, f.z + f.vz * f.age, ch);
      this.effectTransform.position.set(p.x, p.y + 0.6 + f.rise * f.age - 4 * f.age * f.age, p.z);
      this.effectTransform.rotation.set(f.age * 5 + i, f.age * 7, 0); this.effectTransform.scale.setScalar(0.2 * (1 - f.age / 0.65)); this.effectTransform.updateMatrix();
      this.debris.setMatrixAt(i, this.effectTransform.matrix); this.debris.setColorAt(i, this.effectColor.set('#b6aa85'));
    });
    if (this.debris.count) { this.debris.instanceMatrix.needsUpdate = true; this.debris.instanceColor.needsUpdate = true; }
    const narrow = this.camera.aspect < 0.8;
    this.camera.position.set(preview ? 0.6 : x * 0.2, preview ? 2.9 : 5.5, preview ? (narrow ? 8.8 : 7) : (narrow ? 10.5 : 9));
    this.camera.lookAt(preview ? 0 : x * 0.12, preview ? 1.55 : 1.3, preview ? 0 : -14);
    if (!preview && !reducedMotion) this.camera.rotation.z += this.turnLean;
    this.renderer.render(this.scene, this.camera);
  }
}
