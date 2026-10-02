const paths = {
  beelzebub: '<path d="M19 8a8 8 0 1 0 1 7M16 5a6 6 0 1 0 3 8M15 9a3.5 3.5 0 1 0 .5 5"/><path d="m18 3 1 5 4-2"/>',
  veldora: '<path d="m12 7-3-4 1 7-6-4-2 9 6-3 4 8 4-8 6 3-2-9-6 4 1-7-3 4Z"/><path d="m10 11 2 2 2-2m-2 2v4"/>',
  raphael: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M1 5l2 2m18-2-2 2"/>',
  uriel: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m12 6 5 3v6l-5 3-5-3V9l5-3Zm0 0v12M7 9l10 6M7 15l10-6"/>',
  sound: '<path d="m3 9 4 0 5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  arrow: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
  crystal: '<path d="m12 2 7 10-7 10-7-10L12 2Zm0 0v20M5 12h14"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 7M4 3v7h7"/>'
};

export function crossingIcon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

export const crossingPreview = `<svg viewBox="0 0 260 148" fill="none" aria-hidden="true">
  <defs><linearGradient id="crossingSky" x2="260" y2="148" gradientUnits="userSpaceOnUse"><stop stop-color="#132340"/><stop offset="1" stop-color="#183c4f"/></linearGradient><radialGradient id="crossingGel" cx=".35" cy=".25" r=".8"><stop stop-color="#c3f9ff"/><stop offset=".55" stop-color="#73d3f6"/><stop offset="1" stop-color="#3289c6"/></radialGradient></defs>
  <path fill="url(#crossingSky)" d="M0 0h260v148H0z"/>
  <g fill="#adc6dd" opacity=".6"><circle cx="25" cy="18" r="1"/><circle cx="181" cy="19" r=".8"/><circle cx="232" cy="32" r="1"/><circle cx="91" cy="9" r=".8"/></g>
  <path d="M0 110V52h23v-9h9v67h12V61h18V44h5V23h3v21h5v17h11v49h15V70h18v40h9V52h10V39l6-11 6 11v13h10v58h19V41h8V17h3v24h8v69h14V60h32v50h16v38H0Z" fill="#0b192d"/>
  <path d="M51 72h9m-9 8h9m-9 8h9m11-27h3m-3 9h3m-3 9h3m65-25h5m-5 9h5m-5 9h5m38-23h6m-6 8h6m-6 8h6m31 4h10m-10 8h10" stroke="#ecc994" stroke-width="2" opacity=".5"/>
  <path d="M0 116 260 94v54H0Z" fill="#263449"/><path d="m-10 139 44-4m19-2 45-4m65-4 52-4m17-2 44-4" stroke="#d8c792" stroke-width="2" opacity=".6"/>
  <g transform="translate(177 105) rotate(-5)"><ellipse cy="14" rx="39" ry="7" fill="#071220" opacity=".7"/><rect x="-34" y="-7" width="70" height="22" rx="6" fill="#d59440"/><path d="m-21-7 8-12h29l12 12Z" fill="#ffc964"/><path d="m-9-16-8 9h36l-7-9Z" fill="#25465b"/><path d="M1-16v9" stroke="#ffd97e" stroke-width="2"/><circle cx="-20" cy="14" r="6" fill="#101a2a"/><circle cx="23" cy="14" r="6" fill="#101a2a"/><rect x="-2" y="-24" width="14" height="6" rx="2" fill="#fff0b0"/><path d="M27 0h9" stroke="#fff6ce" stroke-width="3"/></g>
  <g transform="translate(93 106)"><ellipse cy="15" rx="38" ry="9" fill="#071321"/><path d="M-35 7C-39-12-22-41 0-43 24-44 39-15 35 6 30 24-32 24-35 7Z" fill="url(#crossingGel)" stroke="#a1ebff"/><path d="M-23-17c3-9 12-15 22-16" stroke="#efffff" stroke-width="5" stroke-linecap="round" opacity=".7"/><path d="m-18-1 9 3m16 0 9-3" stroke="#1c456e" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="19" cy="9" rx="5" ry="2" fill="#d8fcff" opacity=".4"/></g>
  <path d="m222 50 5 9-5 9-5-9 5-9Zm-191 31 4 7-4 7-4-7 4-7Z" fill="#92e7f6" opacity=".85"/>
</svg>`;
