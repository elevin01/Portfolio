import { HUNTER, CHARACTERS, COURSES, DIFFICULTIES, HunterModel, options, HUNTER_STORAGE, loadRecords, remember, recordKey } from './hunter-model.js';
import { HunterScene } from './hunter-scene.js';
import { portrait } from './hunter-art.js';
const root=document.getElementById('gameHunterPanel');
document.getElementById('hunterPreview').innerHTML='<span class="hunter-picker-art"><b>H×H</b><small>THE PLATFORM TRIAL</small></span>';
document.querySelector('.game-choice[data-game="hunter"] .game-choice-description').innerHTML='Run. Jump. Beat the clock.<br>Six-room Trial or Endless. Your call.';
const records=loadRecords(key=>localStorage.getItem(key));
let selection=options({...records.selection,mode:'trial'}),model=new HunterModel(Date.now(),selection);
let active=false,settingUp=true,frame=0,last=0,accumulator=0,hudTime=0,toast=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const keys=new Set(),pointers=new Map();
root.innerHTML=`
  <header class="hr-heading"><div><span class="hr-kicker">HUNTER × HUNTER</span><h4>The platform trial.</h4></div><div class="hr-tools"><button id="hunterSound" aria-label="Enable sound">Sound off</button><button id="hunterRetry" hidden>Retry ↻</button><button id="hunterPause" disabled>Pause</button></div></header>
  <div class="hr-stage"><canvas id="hunterCanvas" width="640" height="360" tabindex="0" aria-label="Hunter platformer. Left and right to move. Hold Space or Up to jump. X uses your character action."></canvas>
    <div id="hunterOverlay" class="hr-overlay" hidden><span id="hunterResultTag" class="hr-kicker"></span><h5 id="hunterResultTitle"></h5><p id="hunterResultText"></p><button id="hunterContinue" class="hr-primary">Resume</button><button id="hunterChoose" class="hr-link">Choose another course</button></div>
    <div id="hunterToast" class="hr-toast" hidden role="status"></div>
  </div>
  <div id="hunterSetup" class="hr-setup">
    <div class="hr-character-row" role="group" aria-label="Character">${Object.entries(CHARACTERS).map(([id,c])=>`<button data-option="character" data-value="${id}" aria-pressed="false">${portrait(id)}<strong>${c.name}</strong></button>`).join('')}</div>
    <div class="hr-kit"><strong id="hunterKit"></strong><p id="hunterAbilityDescription"></p><small id="hunterEra"></small></div>
    <div class="hr-options"><label>Course<select id="hunterCourse">${Object.entries(COURSES).map(([id,c])=>`<option value="${id}">${c.name}</option>`).join('')}</select></label><label>Challenge<select id="hunterDifficulty">${Object.entries(DIFFICULTIES).map(([id,d])=>`<option value="${id}">${d.name}</option>`).join('')}</select></label><div class="hr-mode" role="group" aria-label="Mode"><button data-option="mode" data-value="trial" aria-pressed="true">Trial</button><button data-option="mode" data-value="endless" aria-pressed="false">Endless</button></div></div>
    <div class="hr-start-row"><span id="hunterSetupRecord"></span><button id="hunterStart" class="hr-primary">Enter the trial →</button></div>
  </div>
  <div id="hunterControls" class="hr-controls" hidden>
    <div class="hr-directions"><button data-action="left" aria-label="Hold to move left">←</button><button data-action="right" aria-label="Hold to move right">→</button></div>
    <button data-action="power" id="hunterPower"><span id="hunterPowerMeter"><i></i></span><strong id="hunterPowerName"></strong><small id="hunterPowerHint"></small></button>
    <button data-action="jump" class="hr-jump"><strong>JUMP ↑</strong><small>Hold for height</small></button>
  </div>
  <div id="hunterAdvice" class="hr-advice">Move freely. Jump between platforms. Reach all six exits before time runs out.</div>
  <details id="hunterGuide" class="hr-guide"><summary>How to play</summary><p>← / → or A / D moves. Hold Space / ↑ / W for a high jump; release early for a short hop. You can steer in the air. X uses your character action; P pauses; R retries from your checkpoint. On a phone, hold a direction with one thumb and Jump with the other.</p><p>Reach the yellow exit flag. Green flags save your place. Falling or hitting a hazard returns you to your flag and costs a few seconds. Cracked platforms collapse if you linger. Blue platforms move. Upper routes offer optional badges. The timer starts when you first move, and powers are never required.</p><p>Trial has six designed rooms per course. Endless keeps serving rooms and grants 18 seconds at each exit. The art and power interactions are Hunter × Hunter fan-game adaptations. Trial tools follow the selected arc; Endless uses later abilities. Electricity replenishes between rooms; other energy recovers slowly.</p></details>
  <p id="hunterStatus" class="visually-hidden" aria-live="polite"></p>`;
const $=id=>document.getElementById(id),canvas=$('hunterCanvas'),scene=new HunterScene(canvas);
const save=()=>{try{localStorage.setItem(HUNTER_STORAGE,JSON.stringify(records));}catch{}};
const record=()=>{remember(records,model);save();};
let audioContext;
function sound(type){
  if(!records.sound)return;
  const tones={jump:[230,480],collect:[680,980],cast:[290,720],smash:[130,60],hit:[120,45],win:[560,1100],checkpoint:[550,820],clear:[520,950]};
  if(!tones[type])return;
  try{audioContext ||= new(window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;o.type='triangle';o.frequency.setValueAtTime(tones[type][0],t);o.frequency.exponentialRampToValueAtTime(tones[type][1],t+.13);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(audioContext.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(t+.21);}catch{}
}
function setText(id,t){if($(id).textContent!==String(t))$(id).textContent=t;}
function message(t){setText('hunterToast',t);$('hunterToast').hidden=false;setText('hunterStatus',t);toast=1.6;}
function clearInput(){keys.clear();pointers.clear();model.clearInput();}
function syncInput(){
  const held=[...pointers.values()];
  model.setInput('left',keys.has('arrowleft')||keys.has('a')||held.includes('left'));
  model.setInput('right',keys.has('arrowright')||keys.has('d')||held.includes('right'));
  model.setInput('jump',keys.has(' ')||keys.has('arrowup')||keys.has('w')||held.includes('jump'));
}
function events(){
  const ev=model.drainEvents();scene.accept(ev,model);
  for(const e of ev){sound(e.type);if(e.type==='cast')message(model.kit.ability);if(e.type==='checkpoint')message('Checkpoint saved');if(e.type==='room'){record();message(model.level.name);}
    if(e.type==='over'||e.type==='win'){clearInput();record();refresh();$('hunterContinue').focus({preventScroll:true});}
  }
}
function refresh(){
  root.dataset.screen=settingUp?'setup':'play';$('hunterSetup').hidden=!settingUp;$('hunterControls').hidden=settingUp;$('hunterRetry').hidden=settingUp;
  const kit=model.kit;
  if(settingUp){
    for(const b of root.querySelectorAll('[data-option]'))b.setAttribute('aria-pressed',String(selection[b.dataset.option]===b.dataset.value));
    $('hunterCourse').value=selection.course;$('hunterDifficulty').value=selection.difficulty;setText('hunterKit',kit.ability);setText('hunterAbilityDescription',kit.description);setText('hunterEra',kit.era);
    setText('hunterStart',selection.mode==='trial'?'Enter the trial →':'Start endless →');
    const best=records.scores[recordKey(selection)];setText('hunterSetupRecord',`${selection.mode==='trial'?'6 rooms':'Endless rooms'} · ${model.rules.seconds} seconds${best?.rooms?` · Best ${best.rooms} rooms`:''}`);
  }
  setText('hunterPowerName',kit.ability);const unavailable=model.availability();setText('hunterPowerHint',unavailable||`X · ${kit.cost} energy`);$('hunterPower').disabled=!!unavailable;$('hunterPowerMeter').firstElementChild.style.width=`${model.energy}%`;
  $('hunterPower').setAttribute('aria-label',`${kit.ability}. ${unavailable||'Ready'}`);
  for(const b of root.querySelectorAll('[data-action]:not(#hunterPower)'))b.disabled=!['playing','transition'].includes(model.phase);
  $('hunterPause').disabled=settingUp||!['playing','paused','transition'].includes(model.phase);$('hunterRetry').disabled=model.phase!=='playing';setText('hunterPause',model.phase==='paused'?'Resume':'Pause');setText('hunterSound',records.sound?'Sound on':'Sound off');$('hunterSound').setAttribute('aria-label',records.sound?'Mute sound':'Enable sound');$('hunterSound').setAttribute('aria-pressed',String(records.sound));
  const overlay=!settingUp&&['paused','over','won'].includes(model.phase);$('hunterOverlay').hidden=!overlay;
  if(overlay){const paused=model.phase==='paused',won=model.phase==='won';setText('hunterResultTag',paused?'PAUSED':won?'EXAM PASSED':'TIME’S UP');setText('hunterResultTitle',paused?'Take your time.':won?'You’re through.':'One more try?');setText('hunterResultText',paused?'Your timer is paused.':`${model.cleared} rooms · ${model.badges} badges · ${model.deaths} retries${won?` · ${model.elapsed.toFixed(1)}s`:''}`);setText('hunterContinue',paused?'Resume':'Restart trial');}
  setText('hunterAdvice',settingUp?'Move freely. Jump between platforms. Reach all six exits before time runs out.':`← → Move · Hold Space to jump · X ${kit.ability} · P Pause`);
}
function draw(dt=0){scene.draw(model,{preview:settingUp,reducedMotion:reduced.matches,dt});}
function stopFrame(){cancelAnimationFrame(frame);frame=0;last=0;accumulator=0;}
function tick(now){
  frame=0;if(!active)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
  if(!settingUp&&['playing','transition'].includes(model.phase)){syncInput();accumulator+=dt;while(accumulator>=HUNTER.step){model.step();accumulator-=HUNTER.step;}events();}
  toast-=dt;if(toast<=0)$('hunterToast').hidden=true;draw(dt);hudTime+=dt;if(hudTime>.06){refresh();hudTime=0;}
  if(active&&(['playing','transition'].includes(model.phase)||settingUp&&!reduced.matches))frame=requestAnimationFrame(tick);
}
function requestFrame(){if(!frame&&active){last=0;frame=requestAnimationFrame(tick);}}
function begin(){
  stopFrame();clearInput();$('hunterGuide').open=false;
  if(settingUp||['over','won'].includes(model.phase)){model=new HunterModel(model.phase==='over'?model.seed:Date.now(),selection);settingUp=false;records.selection={...selection};save();model.begin();}else model.resume();
  scene.particles=[];refresh();root.closest('.game-modal-content').scrollTop=0;canvas.focus({preventScroll:true});requestFrame();
}
function pause(){clearInput();if(!['playing','transition'].includes(model.phase))return;model.pause();stopFrame();refresh();draw();}
function setup(){record();stopFrame();clearInput();settingUp=true;model=new HunterModel(Date.now(),selection);scene.particles=[];refresh();draw();requestFrame();$('hunterStart').focus({preventScroll:true});}
function choose(key,value){if(!settingUp)return;selection=options({...selection,[key]:value});model=new HunterModel(Date.now(),selection);refresh();draw();}
function power(){if(active&&!settingUp){model.cast();events();refresh();requestFrame();}}
root.querySelectorAll('[data-option]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.option,b.dataset.value)));
$('hunterCourse').addEventListener('change',e=>choose('course',e.target.value));$('hunterDifficulty').addEventListener('change',e=>choose('difficulty',e.target.value));
$('hunterStart').addEventListener('click',begin);$('hunterContinue').addEventListener('click',begin);$('hunterChoose').addEventListener('click',setup);$('hunterPause').addEventListener('click',()=>model.phase==='paused'?begin():pause());
$('hunterRetry').addEventListener('click',()=>{if(model.phase==='playing'){model.started=true;model.die('Retrying checkpoint.');events();canvas.focus({preventScroll:true});}});
$('hunterSound').addEventListener('click',()=>{records.sound=!records.sound;save();sound('collect');refresh();});$('hunterGuide').addEventListener('toggle',()=>{if($('hunterGuide').open)pause();});
root.querySelectorAll('[data-action]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{if(e.button!==0||b.disabled||settingUp)return;e.preventDefault();canvas.focus({preventScroll:true});b.setPointerCapture(e.pointerId);if(b.dataset.action==='power')power();else{pointers.set(e.pointerId,b.dataset.action);syncInput();}requestFrame();});
  const release=e=>{pointers.delete(e.pointerId);syncInput();};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
  b.addEventListener('click',e=>{if(e.detail!==0)return;if(b.dataset.action==='power')power();else{const id=-1;pointers.set(id,b.dataset.action);syncInput();setTimeout(()=>{pointers.delete(id);syncInput();},180);}});
});
root.addEventListener('keydown',e=>{
  if(!active||settingUp||e.target.tagName==='SELECT')return;const k=e.key.toLowerCase();if(['button','summary'].includes(e.target.tagName.toLowerCase())&&[' ','enter'].includes(k))return;
  if(['arrowleft','arrowright','arrowup','a','d','w',' '].includes(k)){e.preventDefault();keys.add(k);syncInput();}
  if(e.repeat)return;if(k==='p'){e.preventDefault();model.phase==='paused'?begin():pause();}if(k==='x'||k==='3'){e.preventDefault();power();}if(k==='r'&&model.phase==='playing'){e.preventDefault();model.started=true;model.die('Retrying checkpoint.');}
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());if(active)syncInput();});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();stopFrame();}else if(active&&settingUp)requestFrame();});reduced.addEventListener('change',()=>{if(active){stopFrame();draw();requestFrame();}});
export const hunterRun={start(){active=true;refresh();draw();requestFrame();},stop(){pause();active=false;clearInput();stopFrame();record();audioContext?.suspend().catch(()=>{});}};
refresh();
