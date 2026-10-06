// Generated 2D encounter illustrations are local assets. SVG is used only for
// the live prison, fractures, and attack effects, never to draw characters.
export function portrait(name) {
  return `<span class="sr-portrait-image" style="background-image:url('images/shinobi/${name.toLowerCase()}.webp')" aria-hidden="true"></span>`;
}
export function scene(mission, prefix = 'rescue') {
  return `<svg class="sr-scene-svg" viewBox="0 0 900 450" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${prefix}-shade" x2="0" y2="1"><stop stop-color="#080c18" stop-opacity=".25"/><stop offset=".18" stop-color="#080c18" stop-opacity="0"/><stop offset=".62" stop-color="#080c18" stop-opacity="0"/><stop offset="1" stop-color="#080c18" stop-opacity=".93"/></linearGradient>
      <radialGradient id="${prefix}-aura"><stop stop-color="${mission.energy}" stop-opacity=".5"/><stop offset="1" stop-color="${mission.energy}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${prefix}-veil" x2="0" y2="1"><stop stop-color="#171227" stop-opacity="0"/><stop offset="1" stop-color="#171227" stop-opacity=".9"/></linearGradient>
    </defs>
    <image class="sr-illustration" href="images/shinobi/${mission.id}.webp" width="900" height="600" preserveAspectRatio="xMidYMin meet"/>
    <rect class="sr-captive-veil" x="321" y="78" width="272" height="352" rx="110" fill="url(#${prefix}-veil)" opacity="0"/>
    <g class="sr-prison">
      <ellipse cx="457" cy="244" rx="124" ry="175" fill="${mission.color}" fill-opacity=".025" stroke="${mission.color}" stroke-opacity=".45" stroke-width="1"/>
      <ellipse cx="457" cy="244" rx="131" ry="182" fill="none" stroke="${mission.color}" stroke-opacity=".22" stroke-width=".7" stroke-dasharray="22 5 2 5"/>
      <g class="sr-bindings"></g>
      <g class="sr-cracks" fill="none" stroke="${mission.energy}" stroke-width="2" stroke-linejoin="bevel"></g>
    </g>
    <g class="sr-strike" opacity="0"><ellipse cx="357" cy="271" rx="130" ry="105" fill="url(#${prefix}-aura)"/>
      ${mission.id==='naruto' ? `<g stroke="${mission.energy}" fill="none"><circle cx="306" cy="281" r="29" stroke-width="3"/><ellipse cx="306" cy="281" rx="29" ry="12" transform="rotate(-35 306 281)" stroke-width="2"/><ellipse cx="306" cy="281" rx="12" ry="29" transform="rotate(-35 306 281)" stroke-width="2"/></g>` : mission.id==='sakura' ? `<path d="m302 272 17-41 7 27 29-9-13 27 24 10-36 8-14 25-8-29-24-1Z" fill="${mission.energy}"/>` : `<path d="m260 295 49-35-8 25 39-39-5 39 52-20-32 32 22 18-75-17" stroke="${mission.energy}" stroke-width="3" fill="none"/>`}
    </g>
    <ellipse class="sr-rescue-light" cx="457" cy="244" rx="220" ry="210" fill="url(#${prefix}-aura)" opacity="0"/>
    <g class="sr-shards" fill="${mission.energy}" opacity="0">${Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,x=457+Math.cos(a)*122,y=244+Math.sin(a)*172;return `<path style="--dx:${Math.cos(a)*130}px;--dy:${Math.sin(a)*100}px;--spin:${i%2?70:-70}deg" d="m${x} ${y} 13-12-5 27Z"/>`;}).join('')}</g>
    <path d="M0 0H900V450H0Z" fill="url(#${prefix}-shade)" pointer-events="none"/>
    <g fill="${mission.color}" opacity=".45">${Array.from({length:12},(_,i)=>`<circle class="sr-mote" style="animation-delay:${i*.27}s" cx="${(i*163+35)%900}" cy="${(i*47+88)%380}" r="${i%3===0?1.5:.8}"/>`).join('')}</g>
  </svg>`;
}

const cracks = [
  'M360 217 394 229 410 211 433 224 457 202 471 213M410 211 408 182 397 169',
  'M464 99 454 142 475 161 457 202M454 142 429 153 418 140',
  'M557 228 522 215 501 237 477 229 457 250 433 224M501 237 514 259 506 282',
  'M454 373 468 334 450 311 457 278 457 250M450 311 424 314 411 338',
  'M384 331 401 298 426 281 411 257 433 224M401 298 380 278',
  'M533 136 506 173 478 174 457 202M506 173 515 190 539 192',
  'M550 307 525 302 506 282 477 288 457 278M477 288 488 324'
];
export function crackArt(progress) { return cracks.slice(0, Math.ceil(progress * cracks.length)).map(d=>`<path d="${d}"/>`).join(''); }
export function bindingArt(mission, misses) {
  const n = misses + 1;
  if (mission.id === 'naruto') return `<g stroke="#191525" stroke-width="9" stroke-linecap="round">${Array.from({length:n},(_,i)=>{const a=i*2.399,x=457+Math.cos(a)*106,y=325+Math.sin(a)*24;return `<path d="M${x} ${y}l${Math.cos(a)*18} -${55+i*6}"/><path d="M${x-5} ${y+3}h10" stroke="${mission.color}" stroke-width="2"/>`;}).join('')}</g><g fill="none" stroke="${mission.color}">${Array.from({length:n},(_,i)=>`<ellipse cx="457" cy="${322-i*29}" rx="${96-i*3}" ry="17" opacity="${.28+i*.05}" stroke-width="${2+i*.4}"/>`).join('')}</g>`;
  if (mission.id === 'sasuke') return `<g fill="none" stroke-linecap="round">${Array.from({length:n},(_,i)=>`<path d="M${i%2?367:547} ${332-i*27}C${i%2?555:359} ${342-i*27} ${i%2?560:350} ${294-i*27} ${i%2?379:535} ${299-i*27}" stroke="#3e3c58" stroke-width="14"/><path d="M${i%2?367:547} ${332-i*27}C${i%2?555:359} ${342-i*27} ${i%2?560:350} ${294-i*27} ${i%2?379:535} ${299-i*27}" stroke="#a799bd" stroke-width="7"/><circle cx="${i%2?379:535}" cy="${299-i*27}" r="4" fill="#f6d889"/>`).join('')}</g>`;
  if (mission.id === 'sakura') return `<g stroke="#a1786c" fill="#553d3c" stroke-width="3"><path d="M369 351V123h176v228h-13V137H382v214Z"/>${Array.from({length:n},(_,i)=>`<path d="M${382+i*24} 137v${175+i*3}" fill="none" stroke="#a6e0d4" stroke-width="1.5"/><circle cx="${382+i*24}" cy="${312+i*3}" r="4"/><path d="M374 ${335-i*29}h164" stroke-width="${3+i}"/>`).join('')}</g>`;
  return `<ellipse cx="457" cy="235" rx="102" ry="135" fill="#6acbe5" opacity="${.08+misses*.055}"/><g fill="none" stroke="#a2e3ed">${Array.from({length:n},(_,i)=>`<ellipse cx="457" cy="${327-i*29}" rx="${56+Math.sin((i+1)/8*Math.PI)*44}" ry="${12+i*2}" stroke-width="${2+i*.3}" opacity=".7" transform="rotate(${i%2?10:-10} 457 ${327-i*29})"/>`).join('')}</g>${Array.from({length:n*2},(_,i)=>`<circle cx="${393+(i*37)%127}" cy="${128+(i*41)%193}" r="${2+i%4}" fill="#c3f2fa" opacity=".6"/>`).join('')}`;
}
