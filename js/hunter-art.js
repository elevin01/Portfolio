// Original vector portraits and interface marks, drawn for this arcade.
export function hunterIcon(name) {
  const paths = {
    arrow: '<path d="m5 12 14 0m-6-6 6 6-6 6"/>', pause: '<path d="M8 5v14M16 5v14"/>', sound: '<path d="m4 10 4 0 5-5v14l-5-5H4zM17 8q6 4 0 8"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    zetsu: '<path d="M8 3a9 9 0 1 0 13 12A9 9 0 0 1 8 3Z"/>', power: '<path d="m13 2-8 12h6l-1 8 9-13h-7z"/>',
    chain: '<path d="m10 8 3-3a4 4 0 0 1 6 6l-3 3M14 16l-3 3a4 4 0 0 1-6-6l3-3m0 6 8-8"/>',
    star: '<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/>',
    reset: '<path d="M4 8a9 9 0 1 1-1 7M4 3v6h6"/>', seal: '<path d="M6 3h12v18l-6-3-6 3zM9 8h6M9 12h6"/>',
    hand: '<path d="M7 12V5a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9c0 9-10 10-14 3l-2-4q0-3 3-2l3 3"/>',
    infinity: '<path d="M12 12c-8-12-16 4-8 5 7 1 9-10 14-10 8 0 6 15-2 9Z"/>', check: '<path d="m5 12 4 5L20 6"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.power}</svg>`;
}
export function portrait(id) {
  const skin = '#ecc0a3';
  const style = { killua: ['#b8d6f5', '#e1e5ed', '#303461'], gon: ['#b7d36e', '#132b28', '#3f7742'], kurapika: ['#e6c572', '#e9c675', '#355d9b'], hisoka: ['#dca4c4', '#b44061', '#afd2e4'] }[id];
  let hair = id === 'gon' ? '<path d="m33 45-3-30 12 10L48 2l9 20L69 7l2 23 15-11-8 30Z"/>' : id === 'killua' ? '<path d="m29 48-9-12 15 0-9-11 15 1-1-13 14 9 9-13 8 15 16-2-7 12 14 5-12 12-8-12-8 5-11-9-8 11-9-4Z"/>' : id === 'kurapika' ? '<path d="M30 61V33c2-25 50-29 53 1v29l-11-5-5-30-10 14-8-10-8 29Z"/>' : '<path d="M32 43c-11-27 10-25 5-38 31 2 46 20 45 37l-13-11-15 4-12-5Z"/>';
  return `<svg viewBox="0 0 112 106" fill="none" aria-hidden="true"><path d="M0 0h112v106H0z" fill="${style[0]}" opacity=".06"/><circle cx="57" cy="43" r="35" stroke="${style[0]}" stroke-opacity=".16"/><path d="M17 111 26 77l23-13h15l24 13 9 34" fill="${style[2]}"/><path d="m46 61 1 13 10 8 10-8-1-14" fill="${skin}"/><path d="M35 35q21-18 42 0v18q-3 20-21 22-21-6-21-22Z" fill="${skin}"/><g fill="${style[1]}">${hair}</g><path d="m41 48 9 1m12 0 9-2" stroke="#232a37" stroke-width="2.3"/><path d="m52 63 9 0" stroke="#b07470" stroke-width="1.5"/>${id === 'killua' ? '<path d="m44 81-9 22m35-22 8 22" stroke="#ebe7ed" stroke-width="12"/>' : id === 'gon' ? '<path d="M56 80v30m-24-29 12 4m35-4-11 4" stroke="#d7ae53" stroke-width="3"/>' : id === 'kurapika' ? '<path d="m29 81 18 5v24m35-29-18 5v24" stroke="#c75b67" stroke-width="3"/>' : '<path d="m39 53 2-6 2 6 6 1-5 3 1 5-4-3-4 3 1-5-4-3Z" fill="#966aac"/><path d="m72 52-4 8q6 3 6-2z" fill="#6f927e"/><path d="m54 87 6 5-6 7-6-7z" fill="#ac5479"/>'}</svg>`;
}
export const hunterPreview = `<svg viewBox="0 0 250 145" aria-hidden="true"><defs><linearGradient id="hunterSky" x2="0" y2="1"><stop stop-color="#263945"/><stop offset="1" stop-color="#9da78c"/></linearGradient></defs><path fill="url(#hunterSky)" d="M0 0h250v145H0z"/><path fill="#304a46" d="M0 0h24l7 91L5 145H0zm38 0h12l-1 76-12 26zm190 0h22v145h-15l-21-70zM179 0h13l8 96-14-16z"/><path fill="#6c7567" d="m112 50-88 95h204l-92-95z"/><path d="m121 58-43 87m51-87 44 87" stroke="#c9c8a178"/><g fill="#1c3836"><ellipse cx="35" cy="4" rx="70" ry="35"/><ellipse cx="223" cy="8" rx="70" ry="36"/></g><path fill="#c7d7e8" d="m111 83-4-11 9 3 4-10 8 7 11-2-3 13-8 8z"/><path fill="#e6e8e7" d="m118 88-9 23 11 4 12-6 0-17z"/><path d="m118 111-8 18m15-18 10 10" stroke="#393f68" stroke-width="7"/><path d="m115 94-12 9m27-9 9 6" stroke="#e1bda7" stroke-width="5"/><path d="m106 78-4 18 7 7-10 22m42-46 3 18-7 5 10 20" fill="none" stroke="#b7e7f4" stroke-width="2"/></svg>`;
