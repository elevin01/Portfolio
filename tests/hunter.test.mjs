import test from 'node:test';
import assert from 'node:assert/strict';
import { HunterModel, HUNTER, CHARACTERS, COURSES, DIFFICULTIES, loadout, loadRecords, options, remember, recordKey } from '../js/hunter-model.js';
function advance(m, seconds) { for(let i=0;i<seconds*120;i++)m.step(); }
function empty(config) { const m=new HunterModel(17,config);m.begin();m.hazards=[];m.pickups=[];m.next=Infinity;return m; }
function obstacle(m,kind,x=48) { const h={id:9,kind,x:m.travel+x,w:kind==='gap'?60:kind==='beam'?60:34,done:false,removed:false};m.hazards.push(h);return h; }
function pilot(m) {
  if(m.lesson)m.lesson==='slide'?m.duck():m.jump();
  const h=m.hazards.find(h=>!h.done&&!h.removed&&h.x+h.w>m.travel-10);
  if(h&&m.y===0&&m.slide===0){const d=h.x-m.travel;if(d<48&&d>12){if(h.kind==='beam')m.duck();else m.jump();}}
  m.step();m.drainEvents();
}
test('Trial is always the default; malformed selections and records are isolated',()=>{
  assert.equal(options().mode,'trial');assert.equal(options({character:'__proto__'}).character,'killua');assert.equal(loadRecords(()=>'{bad').selection.mode,'trial');
  const r=loadRecords(()=>JSON.stringify({scores:{'killua/exam/rookie/trial':{distance:-1,badges:'bad'},bogus:{distance:20}}}));assert.equal(Object.keys(r.scores).length,1);assert.equal(r.scores['killua/exam/rookie/trial'].distance,0);
});
test('Trials retain era-specific tools and Endless gets later abilities',()=>{
  assert.equal(loadout({character:'killua'}).skill,'board');assert.equal(loadout({character:'killua',course:'yorknew'}).skill,'echo');assert.equal(loadout({character:'killua',course:'greed'}).skill,'palm');assert.equal(loadout({character:'killua',mode:'endless'}).skill,'godspeed');
  assert.equal(loadout({character:'gon',course:'exam'}).skill,'rod');assert.equal(loadout({character:'gon',course:'greed'}).skill,'rock');assert.equal(loadout({character:'kurapika',course:'exam'}).skill,'blades');assert.equal(loadout({character:'kurapika',course:'yorknew'}).skill,'heal');
});
test('Tutorial freezes the course and resources until the correct input',()=>{const m=new HunterModel(1);m.begin();while(!m.lesson)m.step();const d=m.distance,e=m.energy;advance(m,10);assert.equal(m.distance,d);assert.equal(m.energy,e);m.duck();assert.equal(m.lesson,'jump');m.jump();assert.equal(m.lesson,null);advance(m,1);assert.equal(m.hearts,3);});
test('Each obstacle has a useful timing window at every difficulty',()=>{
  for(const difficulty of Object.keys(DIFFICULTIES))for(const kind of ['gap','hurdle','beam','sentry'])for(const offset of [34,42,50]){
    const m=empty({difficulty});obstacle(m,kind,offset);kind==='beam'?m.duck():m.jump();advance(m,1.3);assert.equal(m.hearts,3,`${difficulty}/${kind}/${offset}`);
  }
});
test('All 36 character/course/difficulty Trials can finish without abilities or losing hearts',()=>{
  for(const character of Object.keys(CHARACTERS))for(const course of Object.keys(COURSES))for(const difficulty of Object.keys(DIFFICULTIES)){
    const m=new HunterModel(410,{character,course,difficulty});m.begin();let steps=0;while(m.phase==='playing'&&steps++<40000)pilot(m);
    assert.equal(m.phase,'won',`${character}/${course}/${difficulty}`);assert.equal(m.hearts,3,`${character}/${course}/${difficulty}`);
  }
});
test('Multiple routes and maximum-speed Endless remain fair with bounded generation',()=>{
  for(let seed=0;seed<5;seed++){const m=new HunterModel(seed,{difficulty:'veteran',mode:'endless'});m.begin();let steps=0;while(m.distance<24000&&m.phase==='playing'&&steps++<180000)pilot(m);assert.equal(m.phase,'playing');assert.ok(m.distance>=24000);assert.equal(m.hearts,3);assert.ok(m.hazards.length<10);assert.ok(m.pickups.length<12);assert.ok(m.speed()<=245);}
});
test('Missed obstacles take one heart and gaps recover; three hits end the run',()=>{const m=empty();obstacle(m,'gap',0);advance(m,.1);assert.equal(m.hearts,2);assert.ok(m.y>0);advance(m,2);obstacle(m,'hurdle',0);advance(m,.1);assert.equal(m.hearts,1);advance(m,2);obstacle(m,'sentry',0);advance(m,.1);assert.equal(m.phase,'over');});
test('Pause stops position, timers, and resources',()=>{const m=empty();m.jump();advance(m,.1);m.pause();const values=[m.travel,m.y,m.energy,m.elapsed];advance(m,2);assert.deepEqual([m.travel,m.y,m.energy,m.elapsed],values);m.resume();advance(m,.1);assert.ok(m.travel>values[0]);});
test('Abilities cannot spend energy without their stated target',()=>{
  for(const character of Object.keys(CHARACTERS))for(const course of Object.keys(COURSES)){const m=empty({character,course});assert.equal(m.cast(),false);assert.equal(m.energy,100);}
});
test('Board and Bungee Gum visibly move across their target instead of granting immunity',()=>{
  for(const character of ['killua','hisoka']){const m=empty({character});obstacle(m,'gap',65);assert.equal(m.cast(),true);advance(m,.2);assert.ok(m.y>50);assert.equal(m.invincible,0);advance(m,1.1);assert.equal(m.hearts,3);assert.equal(m.y,0);}
});
test('Fishing rod retrieves a badge; Rock charges before destroying only its hurdle',()=>{
  const g=empty({character:'gon'});g.pickups=[{x:200,y:82,kind:'badge',done:false}];assert.equal(g.cast(),true);assert.equal(g.badges,1);
  const m=empty({character:'gon',course:'greed'}),h=obstacle(m,'hurdle',160);obstacle(m,'gap',280);assert.equal(m.cast(),true);assert.equal(h.removed,false);advance(m,.6);assert.equal(h.removed,true);assert.equal(m.hazards[1].removed,false);
});
test('Holy Chain heals only missing health and never uses Chain Jail',()=>{const m=empty({character:'kurapika',course:'yorknew'});assert.equal(m.cast(),false);m.hearts=2;assert.equal(m.cast(),true);assert.equal(m.hearts,3);assert.equal(m.energy,40);});
test('Killua needs sentries; electricity cannot regenerate by waiting',()=>{
  for(const course of ['yorknew','greed']){const m=empty({character:'killua',course});const h=obstacle(m,'sentry',180);assert.equal(m.cast(),true);assert.equal(h.removed,true);const energy=m.energy;advance(m,3);if(course==='greed')assert.equal(m.energy,energy);}
  const m=empty({character:'killua',mode:'endless'});obstacle(m,'sentry',100);assert.equal(m.cast(),true);advance(m,9);assert.equal(m.energy,60);
});
test('Records separate mode, character, route and difficulty',()=>{const r=loadRecords(()=>null);const m=empty({character:'hisoka'});m.distance=100;m.badges=3;remember(r,m);assert.equal(r.scores[recordKey(m.config)].distance,100);assert.equal(r.scores[recordKey({...m.config,mode:'endless'})],undefined);});
