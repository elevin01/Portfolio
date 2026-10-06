// Original, inline vector artwork. No remote images, fonts, or asset requests.
const palettes = {
  naruto: ['#f5c43f', '#ed9140', '#273546', '#ffd0a6'],
  hinata: ['#33314e', '#c1b2d8', '#424363', '#f3cfbf'],
  pain: ['#e87538', '#222334', '#bc4e58', '#e8bfa6'],
  sasuke: ['#1c2238', '#b8bbd0', '#363049', '#efd0bc'],
  orochimaru: ['#171b2b', '#d1c5a8', '#846591', '#e4dfc6'],
  sakura: ['#f49cb6', '#b7405f', '#442a42', '#ffd6be'],
  sasori: ['#b44742', '#272536', '#bc4e58', '#eac4ac'],
  kankuro: ['#272536', '#383746', '#514c67', '#e6bb95'],
  kakashi: ['#c6d6df', '#687e67', '#243747', '#e8c6af'],
  zabuza: ['#202c37', '#7c999e', '#2c4451', '#d4bba7']
};
export function shinobi(name, pose = 'stand') {
  const id = name.toLowerCase();
  const [hair, coat, dark, skin] = palettes[id];
  const cloak = ['pain', 'sasori'].includes(id);
  const long = ['hinata', 'orochimaru'].includes(id);
  const captive = pose === 'captive';
  const headband = ['naruto', 'hinata', 'pain', 'kakashi', 'zabuza'].includes(id);
  const hairPath = id === 'naruto' ? 'M27 43 19 29 33 29 29 14 43 20 48 5 56 17 70 8 70 25 85 21 78 36 84 44 70 40 62 28 53 37 44 29 35 43Z' : id === 'kakashi' ? 'M23 43 10 29 26 29 21 15 40 21 48 5 55 19 74 9 70 28 87 24 77 43Z' : id === 'pain' ? 'M25 41 17 30 31 26 28 13 42 20 50 9 59 20 73 11 70 27 84 30 75 44 67 31 56 35 47 29 37 40Z' : id === 'sasuke' ? 'M23 52 15 39 26 36 17 23 34 24 32 12 54 15 70 11 78 26 86 39 76 42 78 69 65 51 61 30 45 38 34 64Z' : id === 'sakura' ? 'M24 63 21 32Q27 9 50 13Q78 7 82 39L77 66 64 46 62 29 52 36 43 28 34 50Z' : long ? 'M22 105 23 36Q22 10 51 12Q79 10 79 38L82 111 68 99 68 42 57 35 31 40 32 99Z' : 'M23 47 22 29Q29 10 52 14Q79 11 80 38L74 53 65 31 38 34 30 56Z';
  return `<g class="sr-person sr-person-${id}" stroke="#15202d" stroke-width="2" stroke-linejoin="round">
    <ellipse cx="51" cy="181" rx="39" ry="6" fill="#000" opacity=".28" stroke="none"/>
    ${long ? `<path d="M22 105 23 36Q22 10 51 12Q79 10 79 38L82 118 64 108 36 114Z" fill="${hair}"/>` : ''}
    <path d="m32 126-6 49 17 3 11-45 9 44 18-2-11-51" fill="${dark}"/>
    <path d="m26 164 18 3-1 11-23 2 1-9Zm37 3 18-3 5 9-1 7-23-2Z" fill="#1a2938"/>
    <path d="m24 173 16 1m26 0 15-1" stroke="#acb5bc" stroke-width="3"/>
    <path d="M34 69 22 79 24 132Q51 143 76 132L78 78 64 69Z" fill="${coat}"/>
    <path d="m32 74-8 30 9 23 20 5 17-7 7-38-15-12" fill="${dark}" opacity=".25" stroke="none"/>
    ${cloak ? `<path d="M33 69 23 72 17 151 82 151 76 72 66 69 63 88 49 92 40 85Z" fill="${coat}"/><path d="m52 91 2 59M34 72l9 23 12-6 10-16" stroke="#d1686f"/><path d="M26 120q-4-10 7-10 3-12 12-4 11-6 13 6 13 4 4 12l-35 1Z" fill="#b74b57" stroke="#dfa2a0" stroke-width="1.4"/>` : `<path d="M50 77v53M28 117h44" stroke="${dark}"/><path d="M34 76 49 84 64 76" fill="none" stroke="#f4eee1" opacity=".6"/>`}
    ${id === 'kakashi' ? '<path d="m29 86 15 1-1 20H28Zm29 1 15-1 1 21H58Z" fill="#899b75"/><path d="M32 92h8m21 0h9M32 100h8m21 0h9" stroke="#4e6559"/>' : ''}
    ${id === 'sasuke' || id === 'orochimaru' ? '<path d="M23 125q27-9 55 0m-53 6q25-9 51 0" fill="none" stroke="#8f71a9" stroke-width="6"/><path d="M53 126q26-13 19 7-12 11-17-4 7 18 2 30" fill="none" stroke="#9f81b9" stroke-width="5"/>' : ''}
    <path d="${captive ? 'M25 79 16 105 22 131M76 79 86 105 80 131' : pose === 'attack' ? 'M25 79 19 102 39 107M76 79 84 94 104 82' : 'M25 79 13 110 17 130M76 79 89 109 85 131'}" fill="none" stroke="${coat}" stroke-width="14"/>
    <path d="${captive ? 'm22 129 1 9m57-9-1 9' : pose === 'attack' ? 'm38 107 8 1m57-26 7-2' : 'm17 128 1 9m67-9-1 9'}" fill="none" stroke="${skin}" stroke-width="9" stroke-linecap="round"/>
    <path d="m43 60-2 16 10 8 13-9-3-15" fill="${skin}"/>
    <path d="M29 36Q29 18 52 19Q75 18 74 41L70 59Q62 74 51 74Q36 69 31 57Z" fill="${skin}"/>
    <path d="m65 41 7 3-4 17-15 12 10-14Z" fill="#aa7774" opacity=".25" stroke="none"/>
    <path d="${hairPath}" fill="${hair}"/>
    ${headband ? `<path d="m27 37 47-1 1 12-47 1Z" fill="${dark}"/><path d="m36 39 30-1v8l-30 1Z" fill="#b2bfc6"/><path d="m46 42 6-2 4 3-5 2-3-3-3 3m-7-3h1m24 0h1" fill="none" stroke="#455469" stroke-width="1.3"/>` : ''}
    ${id === 'kankuro' ? `<path d="M24 38 24 18 37 24 52 16 68 23 79 17 80 43 71 69 66 42 36 41 32 72 23 55Z" fill="${hair}"/><path d="m35 49 8 9-7 4m29-13-8 9 7 4m-20 8h13" stroke="#7753a9" stroke-width="4" fill="none"/>` : ''}
    <path d="m36 52 9-1m12 0 9 1" stroke="#303441" stroke-width="2.5"/>
    <path d="m38 54h5m17 0h4" stroke="${id === 'hinata' ? '#eff0ff' : ['sasuke','kakashi'].includes(id) ? '#dc5a62' : id === 'pain' ? '#b293c7' : '#78a9c1'}" stroke-width="3"/>
    ${id === 'pain' ? '<path d="m49 52 1 8 4 1m-17-1h3m-2 4h3m21-4h3m-4 4h3" stroke="#353242" stroke-width="1.5"/>' : '<path d="m52 55-2 5 3 1" stroke="#b78779" stroke-width="1.2" fill="none"/>'}
    <path d="m46 66 11-1" stroke="#6c5357" stroke-width="1.5"/>
    ${id === 'naruto' ? '<path d="m31 56 9 2m-8 3 8 1m-6 4 7 1m20-9 9-2m-9 6 8-1m-9 6 7-2" stroke="#a47158" stroke-width="1"/>' : ''}
    ${id === 'kakashi' ? '<path d="m30 56 21 3 20-4-2 11-17 10-18-10Z" fill="#293b4e"/><path d="m28 37 24 1-1 14-21-3" fill="#94a8b2"/>' : ''}
    ${id === 'zabuza' ? '<path d="m29 57 42-3-4 15-17 7-17-8Z" fill="#c6d4d5"/><path d="m34 59 30-1m-28 6 28-2m-24 7 20-3" stroke="#789397" stroke-width="1"/><path d="m80 134 21-87 14 4-23 89Z" fill="#aebfc3"/><circle cx="102" cy="61" r="4" fill="#334855"/><path d="m83 135-5 22" stroke="#494b54" stroke-width="7"/>' : ''}
  </g>`;
}
export function portrait(name) { return `<svg viewBox="15 0 75 83" aria-hidden="true" focusable="false">${shinobi(name)}</svg>`; }

function scenery(mission) {
  const common = `<path d="M0 267 100 233 220 271 310 248 402 260 510 238 630 259 750 223 900 249V450H0Z" fill="#101a27"/><path d="M0 353 125 326 230 347 410 312 567 338 734 316 900 343V450H0Z" fill="#172431"/>`;
  if (mission.id === 'naruto') return `<circle cx="658" cy="90" r="72" fill="#d88046" opacity=".2"/><path d="M0 204 79 184 146 208 208 164 269 195 343 139 401 163 470 137 553 169 623 149 716 203 805 166 900 186V344H0Z" fill="#414044"/><path d="M0 255h83V177l20-10 23 13v75h61v-51h38v37h37v-80h55v76h23v-31h65v69h29v-59h46v51h52v-83h24v-32h38v115h44v-55h31v-28h35v83h26v-83h61v68h47v-53h58v85h59v-71h29v96H0Z" fill="#282d37"/><g stroke="#565054" stroke-width="4" opacity=".65"><path d="M281 166v54m-11-38h33m-33 17h33m-97 37h16m438-40h34m-34 16h34"/></g>${common}<path d="m113 385 75-33 124 12 74-29 134 14 92-11 141 44-112 44-204-10-150 15Z" fill="#302d32"/><path d="m105 440 75-45-8-24 48-29m476 98-31-35 14-34 87-20m-470 66 40-48-19-20" stroke="#776152" stroke-width="3" fill="none"/><path d="m27 349 47-32 49 21-22 39-59 4Zm753-18 48-20 33 34-11 44-79-9Z" fill="#393b40"/>`;
  if (mission.id === 'sasuke') return `<path d="M0 0H900V160L838 122 802 197 744 83 677 144 615 64 552 122 465 59 383 155 296 83 227 148 155 63 92 147 0 124Z" fill="#272439"/><path d="M0 93 86 169 56 450H0Zm900-16-91 100 13 273h78Z" fill="#393149"/><path d="M130 112h39v227h-56Zm600 0h41l16 227h-54Z" fill="#39314a"/><path d="M118 108h65v15h-65Zm600 0h66v15h-66Z" fill="#574160"/>${common}<path d="M191 450 290 284m420 166L610 284m-452 77h590M93 416h720" stroke="#4a3656" stroke-width="2"/><g fill="none" stroke="#796194" opacity=".5" stroke-width="10"><path d="M31 291q140-156 107-37T60 334m802-43q-140-156-107-37t78 80"/></g><g fill="#c995fc"><path d="m137 190-10 31 15 13 11-17Z"/><path d="m751 189-12 29 14 16 12-17Z"/></g>`;
  if (mission.id === 'sakura') return `<path d="M0 0H900V330H0Z" fill="#31282e"/><path d="M0 71h900M0 224h900M85 0v329M281 0v329M623 0v329M819 0v329" stroke="#63404a" stroke-width="12"/><g fill="#171d28" stroke="#79505a" stroke-width="3">${[155,337,564,746].map((x,i)=>`<path d="M${x} 0v${50+i*15}"/><ellipse cx="${x}" cy="${86+i*15}" rx="23" ry="30"/><path d="m${x-17} ${107+i*15}-15 95 67 2-18-94Z"/><path d="m${x-9} ${88+i*15}h4m11 0h4" stroke="#d2968d"/>`).join('')}</g>${common}<path d="M80 390 450 298 820 390 450 447Z" fill="#422e36" stroke="#9d6570" stroke-width="2"/><path d="m172 390 278-69 278 69-278 40Z" fill="none" stroke="#78535e"/>`;
  return `<circle cx="660" cy="84" r="45" fill="#b5d2d8" opacity=".45"/><path d="M0 234 144 171 258 233 363 181 456 216 595 158 741 206 900 139V399H0Z" fill="#2f4654"/><path d="M0 291 135 245 312 287 498 245 679 283 900 210V450H0Z" fill="#263f4e"/><path d="M0 322h900v128H0Z" fill="#345463"/><g stroke="#7599a5" stroke-width="2" opacity=".45">${[0,1,2,3,4].map(i=>`<path d="M${i*91} ${336+i*23}h${280+i*25}m45 0h170"/>`).join('')}</g><path d="M0 344 210 306 686 306 900 346V385L678 343H213L0 388Z" fill="#3c5059"/><path d="M0 296 225 265h463l212 31M210 268v78m475-78v78" stroke="#6c8389" stroke-width="10"/><path d="M0 197q150-25 313 0t350 0 237-15M0 265q150-25 313 0t350 0 237-15" stroke="#a5c9ce" stroke-width="24" opacity=".1" fill="none"/>`;
}

export function scene(mission, prefix = 'rescue') {
  const sky = { naruto: '#69443e', sasuke: '#312546', sakura: '#482a35', kakashi: '#304d62' }[mission.id];
  return `<svg class="sr-scene-svg" viewBox="0 0 900 450" aria-hidden="true" focusable="false">
    <defs><linearGradient id="${prefix}-sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="#101825"/></linearGradient><radialGradient id="${prefix}-aura"><stop stop-color="${mission.energy}" stop-opacity=".32"/><stop offset="1" stop-color="${mission.energy}" stop-opacity="0"/></radialGradient><linearGradient id="${prefix}-shade" x2="0" y2="1"><stop stop-color="#090f1900" offset=".55"/><stop stop-color="#090f19" offset="1"/></linearGradient></defs>
    <path d="M0 0H900V450H0Z" fill="url(#${prefix}-sky)"/>
    ${scenery(mission)}
    <ellipse cx="457" cy="329" rx="141" ry="37" fill="none" stroke="${mission.color}" opacity=".22" stroke-width="2"/>
    <ellipse cx="457" cy="329" rx="115" ry="28" fill="none" stroke="${mission.color}" opacity=".36" stroke-dasharray="18 7 3 7" stroke-width="3"/>
    <g class="sr-enemy" transform="translate(815 121) scale(-1.12 1.12)">${shinobi(mission.enemy, 'attack')}</g>
    <g class="sr-captive-position" transform="translate(387 135) scale(1.35)"><g class="sr-captive">${shinobi(mission.captive, 'captive')}</g></g>
    <g class="sr-prison"><ellipse cx="457" cy="235" rx="106" ry="139" fill="${mission.color}" fill-opacity=".055" stroke="${mission.color}" stroke-opacity=".5" stroke-width="2"/>
      <g class="sr-bindings"></g><g class="sr-cracks" fill="none" stroke="${mission.energy}" stroke-width="3" stroke-linejoin="bevel"></g>
    </g>
    <g class="sr-hero-position" transform="translate(114 174) scale(1.33)"><g class="sr-hero">${shinobi(mission.hero, 'attack')}</g></g>
    <g class="sr-strike" opacity="0"><ellipse cx="327" cy="276" rx="82" ry="61" fill="url(#${prefix}-aura)"/>${mission.id === 'naruto' ? `<g stroke="${mission.energy}" fill="none"><circle cx="306" cy="281" r="29" stroke-width="4"/><ellipse cx="306" cy="281" rx="29" ry="12" transform="rotate(-35 306 281)" stroke-width="3"/><ellipse cx="306" cy="281" rx="12" ry="29" transform="rotate(-35 306 281)" stroke-width="2"/></g>` : mission.id === 'sakura' ? `<path d="m302 272 17-41 7 27 29-9-13 27 24 10-36 8-14 25-8-29-24-1Z" fill="${mission.energy}"/>` : `<path d="m270 279 35-26-6 24 49-31-24 39 48-8-37 25 9 15-63-22" fill="none" stroke="${mission.energy}" stroke-width="4"/>`}</g>
    <g class="sr-shards" fill="${mission.energy}" opacity="0">${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,x=457+Math.cos(a)*118,y=235+Math.sin(a)*142;return `<path style="--dx:${Math.cos(a)*115}px;--dy:${Math.sin(a)*90}px;--spin:${i%2?70:-70}deg" d="m${x} ${y} 16-13-5 31Z"/>`;}).join('')}</g>
    <path d="M0 0H900V450H0Z" fill="url(#${prefix}-shade)" pointer-events="none"/>
    <g fill="${mission.color}" opacity=".5">${Array.from({length:16},(_,i)=>`<circle class="sr-mote" style="animation-delay:${i*.27}s" cx="${(i*163+35)%900}" cy="${(i*47+88)%310}" r="${i%3===0?2:1}"/>`).join('')}</g>
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
