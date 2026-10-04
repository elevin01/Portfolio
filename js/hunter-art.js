// Original vector art for the Hunter runner's selector, picker card, and icons.
export function portrait(id) {
  const skin = '#ecc0a3';
  const style = {
    gon: ['#8fc96a', '#1c2a26', '#3f8f5a'], killua: ['#bcd9f6', '#f1f3f7', '#5b5f9a'],
    kurapika: ['#efcf74', '#f0cd6a', '#2f63b8'], leorio: ['#8fb4d8', '#1b1b22', '#2c3a72']
  }[id];
  const hair = id === 'gon' ? '<path d="m33 45-3-30 12 10L48 2l9 20L69 7l2 23 15-11-8 30Z"/>'
    : id === 'killua' ? '<path d="m29 48-9-12 15 0-9-11 15 1-1-13 14 9 9-13 8 15 16-2-7 12 14 5-12 12-8-12-8 5-11-9-8 11-9-4Z"/>'
    : id === 'kurapika' ? '<path d="M30 61V33c2-25 50-29 53 1v29l-11-5-5-30-10 14-8-10-8 29Z"/>'
    : '<path d="M33 44c-2-22 10-30 24-30s26 8 24 30l-8-4-6-10-10 6-10-6-6 10Z"/>';
  const extra = id === 'killua' ? '<path d="m44 81-9 22m35-22 8 22" stroke="#ebe7ed" stroke-width="12"/>'
    : id === 'gon' ? '<path d="M56 80v30m-24-29 12 4m35-4-11 4" stroke="#d7ae53" stroke-width="3"/>'
    : id === 'kurapika' ? '<path d="m29 81 18 5v24m35-29-18 5v24" stroke="#c75b67" stroke-width="3"/>'
    : '<path d="M44 78h24v30H44z" fill="#5c3b22"/><path d="M50 78v-4h12v4" stroke="#3a2515" stroke-width="2" fill="none"/><path d="m40 50 8 1m16-1 8 0" stroke="#2a2a2a" stroke-width="2.5"/><circle cx="46" cy="52" r="6" stroke="#2a2a2a" fill="none"/><circle cx="66" cy="52" r="6" stroke="#2a2a2a" fill="none"/>';
  return `<svg viewBox="0 0 112 106" fill="none" aria-hidden="true"><path d="M0 0h112v106H0z" fill="${style[0]}" opacity=".08"/><circle cx="57" cy="43" r="35" stroke="${style[0]}" stroke-opacity=".2"/><path d="M17 111 26 77l23-13h15l24 13 9 34" fill="${style[2]}"/><path d="m46 61 1 13 10 8 10-8-1-14" fill="${skin}"/><path d="M35 35q21-18 42 0v18q-3 20-21 22-21-6-21-22Z" fill="${skin}"/><g fill="${style[1]}">${hair}</g><path d="m41 48 9 1m12 0 9-2" stroke="#232a37" stroke-width="2.3"/><path d="m52 63 9 0" stroke="#b07470" stroke-width="1.5"/>${extra}</svg>`;
}

const paths = {
  zetsu: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" opacity=".4"/><path d="M5 5l14 14"/>',
  gyo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  hatsu: '<path d="m13 2-8 11h6l-2 9 8-12h-6l2-8Z"/>',
  sound: '<path d="m3 9 4 0 5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="m9 5 7 7-7 7"/>', up: '<path d="M12 19V5m-6 6 6-6 6 6"/>', down: '<path d="M12 5v14m-6-6 6 6 6-6"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 7M4 3v7h7"/>',
  plate: '<rect x="4" y="7" width="16" height="10" rx="2"/><path d="M8 12h8"/>',
  license: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h5M7 14h10"/><circle cx="16" cy="10" r="1.5"/>'
};
export function hunterIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.hatsu}</svg>`;
}

export const hunterPreview = `<svg viewBox="0 0 260 148" fill="none" aria-hidden="true">
  <defs><linearGradient id="hunterSky" x2="0" y2="1"><stop stop-color="#1b1a22"/><stop offset="1" stop-color="#3b3741"/></linearGradient><radialGradient id="hunterLamp"><stop stop-color="#f0c777" stop-opacity=".5"/><stop offset="1" stop-color="#f0c777" stop-opacity="0"/></radialGradient></defs>
  <path fill="url(#hunterSky)" d="M0 0h260v148H0z"/>
  <path d="M0 148 95 52h70l95 96Z" fill="#55505c"/><path d="M130 52 60 148h20l50-96Zm0 0 70 96h-20l-50-96Z" fill="#3b3741" opacity=".7"/>
  <path d="M0 148 95 52 0 40Zm260 0L165 52l95-12Z" fill="#2d2932"/>
  <path d="M40 60h28v88H40zM192 60h28v88h-28z" fill="#1d1a22"/><circle cx="52" cy="70" r="22" fill="url(#hunterLamp)"/><circle cx="208" cy="70" r="22" fill="url(#hunterLamp)"/>
  <rect x="48" y="66" width="7" height="5" fill="#f0c777"/><rect x="204" y="66" width="7" height="5" fill="#f0c777"/>
  <g transform="translate(150 86)"><rect x="-8" y="-22" width="16" height="16" rx="3" fill="#6c7a8a"/><circle cy="-26" r="5" fill="#e5bb9a"/><rect x="-5" y="-19" width="10" height="7" rx="1" fill="#f1ecdf"/><text x="0" y="-13.5" font-size="5" font-family="monospace" text-anchor="middle" fill="#2a2d36">16</text><rect x="-7" y="-6" width="5" height="9" rx="1" fill="#2b2f3a"/><rect x="2" y="-6" width="5" height="9" rx="1" fill="#2b2f3a"/></g>
  <g transform="translate(118 120)"><ellipse cy="4" rx="16" ry="4" fill="#00000055"/><rect x="-11" y="-32" width="22" height="22" rx="4" fill="#3f8f5a"/><rect x="-10" y="-11" width="7" height="14" rx="2" fill="#1f3a33"/><rect x="4" y="-14" width="7" height="14" rx="2" fill="#1f3a33"/><circle cy="-39" r="9" fill="#e5bb9a"/><path d="m-10-40 2-14 4 9 4-14 4 12 4-9 2 16Z" fill="#1c2a26"/><circle cy="-39" r="9" fill="none" stroke="#8fc96a" stroke-opacity=".6"/><path d="M8-20 -6-52" stroke="#c9a45a" stroke-width="1.5"/></g>
  <g transform="translate(92 102)" opacity=".9"><rect x="-6" y="-14" width="12" height="7" rx="1.5" fill="#f5cf5c"/><rect x="-5" y="-13" width="10" height="5" rx="1" fill="#fff0b0"/><text x="0" y="-9.2" font-size="4" font-family="monospace" text-anchor="middle" fill="#2a2d36">44</text></g>
  <text x="14" y="18" font-size="7" font-family="monospace" fill="#c7bfa8" letter-spacing="1">PHASE 1 · ZABAN TUNNEL</text>
  <text x="246" y="18" font-size="7" font-family="monospace" fill="#f0c777" text-anchor="end">AURA 100</text>
</svg>`;
