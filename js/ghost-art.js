// Small, original vector illustrations keep the game sharp on phones and avoid
// image downloads in the middle of an investigation.
const svg = (body, viewBox = '0 0 120 120', className = '') => `<svg viewBox="${viewBox}" class="${className}" fill="none" aria-hidden="true" focusable="false">${body}</svg>`;

export function icon(name) {
  const paths = {
    investigate: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',
    mark: '<path d="M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
    trap: '<path d="M3 13h18v8H3zM3 13l4-8m14 8-4-8M7 5l3 6m7-6-3 6M7 17h6m4 0h1"/>',
    scan: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7M12 3v2M3 12h2m7 7v2m7-9h2"/>',
    sound: '<path d="m11 4-6 5H2v6h3l6 5zM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
    muted: '<path d="m11 4-6 5H2v6h3l6 5zM16 9l6 6m0-6-6 6"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
    case: '<path d="M3 7h18v14H3zM8 7V3h8v4M3 12h18m-11-2h4v4h-4z"/>',
    bolt: '<path d="m14 2-10 12h7l-1 8 10-12h-7z"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
    retry: '<path d="M3 10a9 9 0 1 1 1 8M3 3v7h7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5m0 3v.5"/>'
  };
  return svg(`<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.investigate}</g>`, '0 0 24 24', 'ghost-icon');
}

export function ghostArt(species = 'slimer') {
  if (species === 'librarian') return svg(`
    <g class="ghost-body">
      <path d="M41 35C21 43 27 62 17 83c12-3 12 5 22 1 7 9 10 20 15 13 7 7 11-9 18-6 12 5 13-7 25-2-7-14 0-31-12-45" fill="#9186cc"/>
      <path d="M36 52c-9 14-5 31-13 35l21-8 11 14 13-13 23 5c-5-12-2-28-11-34" fill="#c6bfff"/>
      <path d="M42 18c-19 5-14 19-15 27-9 13 1 20 10 21l5-14 40 2 9 9c12-3 12-17 3-24 3-19-11-26-24-24" fill="#647090"/>
      <path d="M38 33c0-23 46-26 48 2l-4 18c-10 18-38 17-43-2Z" fill="#e9e3fc"/>
      <path d="M37 35c-2-17 9-19 16-21 0-13 28-14 29 1 14 6 12 16 5 21-3-10-14-15-18-16-9 13-19 6-32 15Z" fill="#a8acc9"/>
      <path d="M49 9c4-6 20-6 26 0M37 26c9 0 15-2 19-6" stroke="#e0e3f6" stroke-width="3" stroke-linecap="round"/>
      <g class="ghost-eyes"><ellipse cx="48" cy="39" rx="9" ry="7" stroke="#695e95" stroke-width="2"/><ellipse cx="73" cy="39" rx="9" ry="7" stroke="#695e95" stroke-width="2"/><path d="M57 38h7" stroke="#695e95" stroke-width="2"/><circle cx="50" cy="39" r="2" fill="#313451"/><circle cx="71" cy="39" r="2" fill="#313451"/></g>
      <ellipse cx="61" cy="55" rx="4" ry="5" fill="#797291"/>
      <path d="m32 68 28 7 28-7-1 25-27 7-27-7Z" fill="#365a62" stroke="#9abfba" stroke-width="2"/><path d="M60 76v22M38 75l16 4m-16 4 16 4m13-8 15-4m-15 12 15-4" stroke="#d4d9ba" stroke-width="2"/>
      <path d="m32 67-9 7 10 9m55-16 9 7-10 9" stroke="#e9e3fc" stroke-width="8" stroke-linecap="round"/>
    </g>`, '0 0 120 120', 'ghost-portrait ghost-librarian');
  if (species === 'puft') return svg(`
    <g class="ghost-body">
      <path d="M38 72c-14-14-25 1-18 14 6 8 16 4 23-1m40-13c15-14 25 1 18 14-6 8-16 4-23-1" fill="#e6e3d9" stroke="#aab7bc" stroke-width="2"/>
      <ellipse cx="46" cy="101" rx="14" ry="10" fill="#faf3e2"/><ellipse cx="76" cy="101" rx="14" ry="10" fill="#faf3e2"/>
      <ellipse cx="61" cy="78" rx="29" ry="25" fill="#f4f1e7" stroke="#aab7bc" stroke-width="2"/>
      <path d="m35 59 7 18 18-8 18 8 9-18" fill="#467189"/><path d="m39 64 6 7 15-7 17 8 6-9" stroke="#e6f0ed" stroke-width="2"/>
      <path d="m58 66-5 23 10-4 6 5-5-24" fill="#d15a4a"/><ellipse cx="61" cy="43" rx="30" ry="26" fill="#fff8e8" stroke="#c2cbcb" stroke-width="2"/>
      <path d="M36 31c-9-6-5-18 4-17 3-13 40-12 44 1 11 0 13 13 3 18" fill="#faf7eb" stroke="#c2cbcb" stroke-width="2"/>
      <path d="M36 29c16-5 34-4 51 0l-1 6c-15-4-32-4-49 1Z" fill="#355c78"/><path d="m81 20 15-6-3 11 8 5-15 2" fill="#587c8f"/>
      <path d="M48 31h25" stroke="#e8e5cc" stroke-width="2"/>
      <g class="ghost-eyes" fill="#364653"><ellipse cx="48" cy="44" rx="3" ry="4"/><ellipse cx="73" cy="44" rx="3" ry="4"/></g>
      <path d="M49 55q12 12 23-1" stroke="#536475" stroke-width="3" stroke-linecap="round"/><ellipse cx="39" cy="53" rx="5" ry="3" fill="#ecae9c"/><ellipse cx="81" cy="53" rx="5" ry="3" fill="#ecae9c"/>
    </g>`, '0 0 120 120', 'ghost-portrait ghost-puft');
  return svg(`
    <g class="ghost-body">
      <path class="ghost-arm ghost-arm-left" d="M36 57C19 51 24 36 14 41c-7 7-1 27 19 32" fill="#62ae47" stroke="#3d713b" stroke-width="2"/>
      <path class="ghost-arm ghost-arm-right" d="M83 56c14-7 13-20 20-15 8 8 0 27-18 33" fill="#75bf49" stroke="#3d713b" stroke-width="2"/>
      <path d="M33 40C24 59 35 67 26 83c-5 13 6 22 15 15 8 14 14 4 22 6 9 10 17-4 23-4 20 1 18-13 10-22-11-12 3-23-8-42C77 13 45 15 33 40Z" fill="#65b447" stroke="#3d713b" stroke-width="2"/>
      <path d="M37 41C27 62 42 77 34 86c-6 14 8 10 15 7 8 8 13 4 17 3 12 9 11-6 24-4 9-1-8-16-5-28 7-32-21-47-40-32" fill="#96d951"/>
      <path d="M46 29c-11 4-13 13-12 20m18-24 9-1" stroke="#d6f591" stroke-width="5" stroke-linecap="round"/>
      <path d="M39 59c0 29 42 35 45-2-16 7-29 3-45 2Z" fill="#223b2c" stroke="#518943" stroke-width="2"/>
      <path d="m42 62 5 8 6-7 6 8 7-8 6 7 7-10" fill="#edf2b6"/>
      <path d="M49 82c5-10 22-7 27 1-10 7-19 5-27-1" fill="#bc7581"/>
      <path d="M50 42c-7-6-13-2-13 5 0 12 16 11 16 2m16-6c4-7 14-7 16 2 4 13-13 13-16 5" fill="#f4edbc"/>
      <g class="ghost-eyes" fill="#263b30"><ellipse cx="47" cy="47" rx="3" ry="4"/><ellipse cx="73" cy="47" rx="3" ry="4"/></g>
      <path d="m53 53 6-8 7 9" fill="#77bd4b"/><path d="M33 78c-2 3-3 6-2 8m60-5 2 7" stroke="#c1ed74" stroke-width="3" stroke-linecap="round"/>
    </g><g class="ghost-droplets" fill="#96d951" opacity=".6"><circle cx="39" cy="112" r="3"/><circle cx="86" cy="108" r="2"/></g>`, '0 0 120 120', 'ghost-portrait ghost-slimer');
}

export function badgeArt() {
  return svg('<path d="M40 76c-8-10-6-28 2-34-6-29 42-31 41-3 14 3 15 18 7 26l-10-8-3 26-17-6-13 8 2-16-9 7Z" fill="#f1efe1"/><path d="m38 44-19-5 8 14 14 3m39-9 19-11-3 17-12 5" fill="#f1efe1"/><ellipse cx="55" cy="37" rx="3" ry="5" fill="#193138"/><ellipse cx="69" cy="37" rx="3" ry="5" fill="#193138"/><ellipse cx="63" cy="54" rx="7" ry="9" fill="#193138"/><circle cx="60" cy="60" r="46" stroke="#e65a49" stroke-width="11"/><path d="m28 28 64 64" stroke="#e65a49" stroke-width="11"/>', '0 0 120 120', 'ghost-badge');
}

export function trapArt() {
  return svg('<path d="m23 36 98-3 22 11-96 9Z" fill="#586566"/><path d="m24 37 23 16v19L24 58Z" fill="#252e35"/><path d="M47 53 143 44v20l-96 8Z" fill="#354149" stroke="#89938b"/><path d="m49 57 7-1v13l-7 1Zm15-1 8-1v13l-8 1Zm17-2 8-1v13l-8 1Zm17-1 8-1v13l-8 1Zm17-2 8-1v13l-8 1Z" fill="#d9b765"/><path d="m44 25 25-2 2 7-25 2Z" fill="#607475"/><path class="ghost-trap-door door-left" d="m24 36 50-3 10 8-37 12Z" fill="#2d383c" stroke="#9ea999"/><path class="ghost-trap-door door-right" d="m74 33 47 0 22 11-59-3Z" fill="#3e4b50" stroke="#9ea999"/><path d="m52 38 63-2m-55 6 36-3" stroke="#d6b965" stroke-width="3"/><circle cx="132" cy="53" r="3" fill="#b9fd86"/><path d="m25 47-12-7-11 2" stroke="#526267" stroke-width="4"/><rect x="107" y="26" width="14" height="7" rx="2" fill="#202e32"/><circle cx="113" cy="29" r="2" fill="#d96751"/>', '0 0 160 78', 'ghost-trap-art');
}

export function cityArt(id = 'ghostCity') {
  const windows = [];
  for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
    const lit = (col * 3 + row * 7) % 5 !== 0;
    windows.push(`<rect x="${355 + col * 25}" y="${59 + row * 23}" width="10" height="13" rx="1" fill="${lit ? '#d8bd82' : '#243836'}" opacity="${lit ? '.45' : '.7'}"/>`);
  }
  return svg(`<defs><linearGradient id="${id}Sky" x2="0" y2="1"><stop stop-color="#0a1720"/><stop offset="1" stop-color="#2f5351"/></linearGradient><radialGradient id="${id}Glow"><stop stop-color="#a7fa82" stop-opacity=".25"/><stop offset="1" stop-color="#a7fa82" stop-opacity="0"/></radialGradient></defs>
    <path fill="url(#${id}Sky)" d="M0 0h600v210H0z"/><circle cx="440" cy="65" r="125" fill="url(#${id}Glow)"/>
    <g fill="#adc6bc" opacity=".5"><circle cx="58" cy="20" r="1"/><circle cx="263" cy="42" r="1"/><circle cx="316" cy="15" r="1"/><circle cx="560" cy="35" r="1"/><circle cx="240" cy="13" r=".6"/></g>
    <path d="M0 180V90h24v-8h28v38h18V71h15V52h5V38h4v14h5v19h17v109h10V112h26V97h29v83h18V70h35v110h20V90h28v-9h20v99h21V55h9V27h5v28h13v125h206V100h24v80h30v30H0Z" fill="#13292f"/>
    <path d="M343 209V46h-8V36h194v10h-8v163" fill="#314543" stroke="#50605a"/><path d="M335 42h194M343 51h177M346 181h172" stroke="#809080" opacity=".35"/>${windows.join('')}
    <path d="M359 36V24h55v12m-49-12V8h43v16" fill="#273d3e" stroke="#4e6360"/><path d="m361 8 26-8 25 8Z" fill="#415554"/>
    <path d="M421 210v-31q14-19 28 0v31" fill="#12282c" stroke="#718479"/><path d="m423 173 26 0" stroke="#a2c486" stroke-width="2"/>
    <rect x="515" y="62" width="29" height="101" rx="3" fill="#122a2b" stroke="#6e8163"/><text x="530" y="80" fill="#c3e5a2" font-family="monospace" font-size="12" text-anchor="middle"><tspan x="530">H</tspan><tspan x="530" dy="17">O</tspan><tspan x="530" dy="17">T</tspan><tspan x="530" dy="17">E</tspan><tspan x="530" dy="17">L</tspan></text>
    <path d="M0 199h600v11H0Z" fill="#12282d"/><path d="M0 204h600" stroke="#92bba6" opacity=".3"/>
    <g class="ghost-city-mist" fill="#aac7b3" opacity=".07"><ellipse cx="120" cy="190" rx="185" ry="18"/><ellipse cx="385" cy="177" rx="130" ry="12"/></g>`, '0 0 600 210', 'ghost-city-art');
}
