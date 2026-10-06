// Raster illustrations carry both the characters and every binding state.
// No circles, paths, or procedural restraints are drawn over the art.
export function portrait(name) {
  return `<span class="sr-portrait-image" style="background-image:url('images/shinobi/${name.toLowerCase()}.webp')" aria-hidden="true"></span>`;
}
export function scene(mission, mode = 'opening') {
  if (mode !== 'focus') return `<img class="sr-opening-art" src="images/shinobi/${mission.id}.webp" alt="" width="1280" height="853" decoding="async">`;
  const sheet = new URL(`images/shinobi/${mission.id}-states.webp`, document.baseURI).href;
  return `<div class="sr-vn-composition" style="--sr-sheet:url('${sheet}');--frame-x:0%;--frame-y:0%">
    <div class="sr-vn-backdrop" aria-hidden="true"></div>
    <div class="sr-victim-art" aria-hidden="true"></div>
    <div class="sr-vn-shade" aria-hidden="true"></div>
  </div>`;
}
export function setFrame(element, frame) {
  element.style.setProperty('--frame-x', `${(frame % 4) * 100 / 3}%`);
  element.style.setProperty('--frame-y', `${Math.floor(frame / 4) * 50}%`);
  element.dataset.frame = String(frame);
}
const sheets = new Map();
export function preloadSheet(id) {
  if (!sheets.has(id)) {
    const image = new Image(); image.src = `images/shinobi/${id}-states.webp`;
    const pending = image.decode().catch(error => { sheets.delete(id); throw error; });
    sheets.set(id, pending);
  }
  return sheets.get(id);
}
