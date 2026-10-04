import { HUNTER, CHARACTERS, COURSES, DIFFICULTIES, HunterModel, loadout, options, HUNTER_STORAGE, loadRecords, remember, recordKey } from './hunter-model.js';
import { HunterScene } from './hunter-scene.js';
import { portrait } from './hunter-art.js';
const root=document.getElementById('gameHunterPanel');
document.getElementById('hunterPreview').innerHTML='<span class="hunter-picker-art"><i></i><b>H×H</b><small>THE LONG WAY THERE</small></span>';
const records=loadRecords(key=>localStorage.getItem(key));
let selection=options({...records.selection,mode:'trial'}), model=new HunterModel(Date.now(),selection), active=false, settingUp=true, frame=0, last=0, accumulator=0, hudTime=0, toast=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
root.innerHTML=`
  <header class="hr-heading"><div><span class="hr-kicker">THE HUNTER TRIAL / 02</span><h4>The long way there.</h4></div><div class="hr-tools"><button id="hunterSound" aria-label="Enable sound">Sound off</button><button id="hunterPause" disabled>Pause</button></div></header>
  <div class="hr-stage"><canvas id="hunterCanvas" width="640" height="360" tabindex="0" aria-label="Hunter runner. Space or up to jump, down to slide, X for your character action."></canvas>
  <div id="hunterHud" class="hr-hud" hidden><span id="hunterHearts" aria-label="3 hearts">♥ ♥ ♥</span><div><strong id="hunterDistance">0 m</strong><small id="hunterBadges">0 badges</small></div></div>
  <div id="hunterProgress" class="hr-progress" hidden><i></i></div>
  <div id="hunterLesson" class="hr-lesson" hidden><span>LET’S TRY IT</span><strong id="hunterLessonTitle"></strong><p id="hunterLessonText"></p><button id="hunterLessonAction">Jump</button></div>
  <div id="hunterOverlay" class="hr-overlay" hidden><span id="hunterResultTag" class="hr-kicker"></span><h5 id="hunterResultTitle"></h5><p id="hunterResultText"></p><button id="hunterContinue" class="hr-primary">Continue</button><button id="hunterChoose" class="hr-link">Choose another run</button></div>
  <div id="hunterToast" class="hr-toast" hidden role="status"></div></div>
  <div id="hunterSetup" class="hr-setup">
    <div class="hr-character-row" role="group" aria-label="Character">${Object.entries(CHARACTERS).map(([id,c])=>`<button data-option="character" data-value="${id}" aria-pressed="false">${portrait(id)}<strong>${c.name}</strong></button>`).join('')}</div>
    <div class="hr-kit"><strong id="hunterKit"></strong><p id="hunterAbilityDescription"></p><small id="hunterEra"></small></div>
    <div class="hr-options"><label>Route<select id="hunterCourse">${Object.entries(COURSES).map(([id,c])=>`<option value="${id}">${c.name}</option>`).join('')}</select></label><label>Difficulty<select id="hunterDifficulty">${Object.entries(DIFFICULTIES).map(([id,d])=>`<option value="${id}">${d.name}</option>`).join('')}</select></label><div class="hr-mode" role="group" aria-label="Mode"><button data-option="mode" data-value="trial" aria-pressed="true">Trial</button><button data-option="mode" data-value="endless" aria-pressed="false">Endless</button></div></div>
    <div class="hr-start-row"><span id="hunterSetupRecord"></span><button id="hunterStart" class="hr-primary">Start the trial →</button></div>
  </div>
  <div id="hunterControls" class="hr-controls" hidden><button data-action="jump"><span>↑</span><strong>Jump</strong><small>Space / ↑</small></button><button data-action="slide"><span>↓</span><strong>Slide</strong><small>↓ / S</small></button><button data-action="power" id="hunterPower"><span id="hunterPowerMeter"><i></i></span><strong id="hunterPowerName"></strong><small id="hunterPowerHint"></small></button></div>
  <div id="hunterAdvice" class="hr-advice">Jump over hurdles and gaps. Slide under striped beams. The first three obstacles wait for you.</div>
  <details id="hunterGuide" class="hr-guide"><summary>Controls & field notes</summary><p>Run automatically. Press Space / ↑ / W to jump and ↓ / S to slide. Press X or 3 for your character’s action. On a phone, use the three buttons or swipe up/down on the game. P pauses. A hit costs one of three hearts; even a missed gap gives you a recovery chance.</p><p>One action per character, with a clear target. The action button lights up only when it can help. Supplies replenish electricity; aura and stamina recover slowly. Badges are optional. No ability is required to finish.</p><p>Trial has a finish line and three scenery chapters. Endless is a separate free-play choice. Character tools follow the selected arc; Endless uses later abilities. The locations, obstacles, and power effects are fan-made arcade adaptations. Kurapika’s Chain Jail is not used against ordinary enemies.</p></details><p id="hunterStatus" class="visually-hidden" aria-live="polite"></p>`;
const $=id=>document.getElementById(id),canvas=$('hunterCanvas'),scene=new HunterScene(canvas);
const save=()=>{try{localStorage.setItem(HUNTER_STORAGE,JSON.stringify(records));}catch{}};
const record=()=>{remember(records,model);save();};
let audioContext;
function sound(type){if(!records.sound)return;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime;const tones={jump:[240,490],slide:[140,70],collect:[660,990],cast:[300,740],smash:[110,55],hit:[120,40],win:[550,1100]};if(!tones[type])return;o.type='triangle';o.frequency.setValueAtTime(tones[type][0],t);o.frequency.exponentialRampToValueAtTime(tones[type][1],t+.14);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(audioContext.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(t+.21);}catch{}}
function message(t){$('hunterToast').textContent=t;$('hunterToast').hidden=false;$('hunterStatus').textContent=t;toast=2.5;}
function events(){const ev=model.drainEvents();scene.accept(ev,model);for(const e of ev){sound(e.type);if(e.type==='cast')message(model.kit.ability);if(e.type==='hit')message(model.reason);if(e.type==='chapter')message(e.text);if(e.type==='collect'&&e.kind==='supply')message('+35 energy');if(e.type==='over'||e.type==='win'){record();refresh();$('hunterContinue').focus({preventScroll:true});}}}
function setText(id,text){if($(id).textContent!==String(text))$(id).textContent=text;}
function refresh(){
  root.dataset.screen=settingUp?'setup':'play';$('hunterSetup').hidden=!settingUp;$('hunterControls').hidden=settingUp;$('hunterHud').hidden=settingUp;$('hunterProgress').hidden=settingUp||model.config.mode==='endless';
  const kit=model.kit;
  if(settingUp){for(const b of root.querySelectorAll('[data-option]'))b.setAttribute('aria-pressed',String(selection[b.dataset.option]===b.dataset.value));$('hunterCourse').value=selection.course;$('hunterDifficulty').value=selection.difficulty;setText('hunterKit',kit.ability);setText('hunterAbilityDescription',kit.description);setText('hunterEra',kit.era);setText('hunterStart',selection.mode==='trial'?'Start the trial →':'Start endless →');const best=records.scores[recordKey(selection)]?.distance||0;setText('hunterSetupRecord',`${selection.mode==='trial'?`${model.rules.finish.toLocaleString()} m · Three chapters`:'No finish line'}${best?` · Best ${best.toLocaleString()} m`:''}`);}
  setText('hunterDistance',`${Math.floor(model.distance).toLocaleString()} m`);setText('hunterBadges',`${model.badges} badges`);setText('hunterHearts','♥ '.repeat(model.hearts)+'♡ '.repeat(3-model.hearts));$('hunterHearts').setAttribute('aria-label',`${model.hearts} hearts`);$('hunterProgress').firstElementChild.style.width=`${model.distance/model.finish*100}%`;
  setText('hunterPowerName',kit.ability);const unavailable=model.availability();setText('hunterPowerHint',unavailable||`X · ${kit.cost} ${kit.electric?'charge':kit.nen?'aura':'stamina'}`);$('hunterPower').disabled=!!unavailable;$('hunterPowerMeter').firstElementChild.style.width=`${model.energy}%`;
  $('hunterPower').setAttribute('aria-label',`${kit.ability}. ${Math.floor(model.energy)} energy. ${unavailable||'Ready'}`);
  for(const b of root.querySelectorAll('[data-action]:not(#hunterPower)'))b.disabled=model.phase!=='playing';
  $('hunterPause').disabled=settingUp||!['playing','paused'].includes(model.phase);setText('hunterPause',model.phase==='paused'?'Resume':'Pause');setText('hunterSound',records.sound?'Sound on':'Sound off');$('hunterSound').setAttribute('aria-label',records.sound?'Mute sound':'Enable sound');$('hunterSound').setAttribute('aria-pressed',String(records.sound));
  const lesson=model.lesson;$('hunterLesson').hidden=!lesson||model.phase!=='playing';
  if(lesson){setText('hunterLessonTitle',lesson==='slide'?'Stay low.':'Up and over.');setText('hunterLessonText',lesson==='slide'?'Slide beneath the striped beam.':'Jump over the obstacle.');setText('hunterLessonAction',lesson==='slide'?'↓ Slide':'↑ Jump');}
  const overlay=!settingUp&&['paused','over','won'].includes(model.phase);$('hunterOverlay').hidden=!overlay;
  if(overlay){const paused=model.phase==='paused',won=model.phase==='won';setText('hunterResultTag',paused?'TAKE A BREATHER':won?'TRIAL COMPLETE':'ANOTHER TRY?');setText('hunterResultTitle',paused?'Your route can wait.':won?'You made it.':'Keep going, Hunter.');setText('hunterResultText',paused?'Resume whenever you’re ready.':`${Math.floor(model.distance).toLocaleString()} metres · ${model.badges} badges. ${won?'Next stop: a harder route.':model.reason}`);setText('hunterContinue',paused?'Resume run':'Try again');}
  setText('hunterAdvice',settingUp?'Jump over hurdles and gaps. Slide under striped beams. The first three obstacles wait for you.':kit.description);
}
function draw(dt=0){scene.draw(model,{preview:settingUp,reducedMotion:reduced.matches,dt});}
function stopFrame(){cancelAnimationFrame(frame);frame=0;last=0;accumulator=0;}
function tick(now){frame=0;if(!active)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!settingUp&&model.phase==='playing'){accumulator+=dt;while(accumulator>=HUNTER.step){model.step();accumulator-=HUNTER.step;}events();}toast-=dt;if(toast<=0)$('hunterToast').hidden=true;draw(dt);hudTime+=dt;if(hudTime>.06){refresh();hudTime=0;}if(active&&(model.phase==='playing'||settingUp&&!reduced.matches))frame=requestAnimationFrame(tick);}
function requestFrame(){if(!frame&&active){last=0;frame=requestAnimationFrame(tick);}}
function begin(){stopFrame();$('hunterGuide').open=false;if(settingUp||['over','won'].includes(model.phase)){const seed=model.phase==='over'?model.seed:Date.now();model=new HunterModel(seed,selection);settingUp=false;records.selection={...selection};save();model.begin();}else model.resume();refresh();canvas.focus({preventScroll:true});requestFrame();}
function pause(){pointer=null;if(model.phase!=='playing')return;model.pause();stopFrame();refresh();draw();}
function setup(){record();stopFrame();settingUp=true;model=new HunterModel(Date.now(),selection);scene.particles=[];refresh();draw();requestFrame();$('hunterStart').focus({preventScroll:true});}
function action(name){if(!active||settingUp||model.phase!=='playing')return;if(name==='jump')model.jump();else if(name==='slide')model.duck();else model.cast();events();refresh();draw();requestFrame();}
function choose(key,value){if(!settingUp)return;selection=options({...selection,[key]:value});model=new HunterModel(Date.now(),selection);refresh();draw();}
root.querySelectorAll('[data-option]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.option,b.dataset.value)));
$('hunterCourse').addEventListener('change',e=>choose('course',e.target.value));$('hunterDifficulty').addEventListener('change',e=>choose('difficulty',e.target.value));
$('hunterStart').addEventListener('click',begin);$('hunterContinue').addEventListener('click',begin);$('hunterChoose').addEventListener('click',setup);
$('hunterPause').addEventListener('click',()=>model.phase==='paused'?begin():pause());
$('hunterSound').addEventListener('click',()=>{records.sound=!records.sound;save();sound('collect');refresh();});
$('hunterGuide').addEventListener('toggle',()=>{if($('hunterGuide').open)pause();});
$('hunterLessonAction').addEventListener('click',()=>action(model.lesson));
root.querySelectorAll('[data-action]').forEach(b=>{b.addEventListener('pointerdown',e=>{if(e.button!==0||b.disabled)return;e.preventDefault();action(b.dataset.action);});b.addEventListener('click',e=>{if(e.detail===0)action(b.dataset.action);});});
let pointer;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||settingUp)return;e.preventDefault();pointer={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dy=e.clientY-pointer.y;pointer=null;action(dy>24?'slide':'jump');});
canvas.addEventListener('pointercancel',()=>{pointer=null;});
root.addEventListener('keydown',e=>{if(!active||settingUp||e.repeat||e.target.tagName==='SELECT')return;const k=e.key.toLowerCase();if(['button','summary'].includes(e.target.tagName.toLowerCase())&&[' ','enter'].includes(k))return;if(k==='p'){e.preventDefault();model.phase==='paused'?begin():pause();return;}const name={' ':'jump',arrowup:'jump',w:'jump',arrowdown:'slide',s:'slide',x:'power','3':'power'}[k];if(name){e.preventDefault();action(name);}});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();stopFrame();}else if(active&&settingUp)requestFrame();});
reduced.addEventListener('change',()=>{if(active){stopFrame();draw();requestFrame();}});
export const hunterRun={start(){active=true;refresh();draw();requestFrame();},stop(){pause();active=false;pointer=null;stopFrame();record();audioContext?.suspend().catch(()=>{});}};
refresh();
