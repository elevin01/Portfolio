import { createLevel, LEVELS } from './hunter-levels.js';
export const HUNTER=Object.freeze({step:1/120,width:640,height:360,gravity:1500,jumpSpeed:560,speed:240,halfWidth:11,bodyHeight:40});
export const COURSES=Object.freeze({exam:{name:'Hunter Exam',places:['Exam tunnels','The ascent','Numere Wetlands']},yorknew:{name:'Yorknew City',places:['Auction district','Rooftops','Backstreets']},greed:{name:'Greed Island',places:['Open country','Training grounds','Masadora']}});
export const DIFFICULTIES=Object.freeze({rookie:{name:'Rookie',seconds:120,penalty:2,recharge:5},hunter:{name:'Hunter',seconds:95,penalty:3,recharge:3.5},veteran:{name:'Veteran',seconds:75,penalty:4,recharge:2.5}});
export const CHARACTERS=Object.freeze({killua:{name:'Killua',color:'#b4d9ff'},gon:{name:'Gon',color:'#c0df88'},kurapika:{name:'Kurapika',color:'#edc779'},hisoka:{name:'Hisoka',color:'#e9a4ce'}});
const own=(o,k,f)=>Object.hasOwn(o,k)?k:f;
export function options(v={}){v ||= {};return{character:own(CHARACTERS,v.character,'killua'),course:own(COURSES,v.course,'exam'),difficulty:own(DIFFICULTIES,v.difficulty,'rookie'),mode:v.mode==='endless'?'endless':'trial'};}
const KITS={
  board:['Skateboard','A short ground dash. You still steer and jump.',25,'Ground dash'],
  echo:['Rhythm Echo','A quick dash with afterimages. Hazards still hurt.',25,'Ground dash'],
  palm:['Lightning Palm','Stun a nearby sentry with electricity.',30,'Sentry nearby'],
  godspeed:['Godspeed','Dash with electrical afterimages; deflect one sentry hit.',40,'Ground dash'],
  rod:['Fishing rod','Pull a nearby badge to you from either direction.',25,'Badge nearby'],
  rock:['Jajanken: Rock','Charge a punch to break a nearby wooden crate.',30,'Crate nearby'],
  blades:['Twin blades','Cut through a nearby wooden crate.',25,'Crate nearby'],
  chain:['Dowsing Chain','Hold off a nearby sentry with your chain.',30,'Sentry nearby'],
  gum:['Bungee Gum','Pull toward a visible pink anchor. Steer the landing.',35,'Anchor nearby']
};
export function loadout(value){const o=options(value);let skill;if(o.character==='killua')skill=o.mode==='endless'?'godspeed':{exam:'board',yorknew:'echo',greed:'palm'}[o.course];if(o.character==='gon')skill=o.mode==='endless'||o.course==='greed'?'rock':'rod';if(o.character==='kurapika')skill=o.mode==='trial'&&o.course==='exam'?'blades':'chain';if(o.character==='hisoka')skill='gum';const[ability,description,cost,target]=KITS[skill];return{...CHARACTERS[o.character],skill,ability,description,cost,target,electric:['palm','godspeed'].includes(skill),nen:!['board','echo','rod','blades'].includes(skill),era:o.mode==='endless'?'Later abilities · free play':`${COURSES[o.course].name} kit`};}
export const HUNTER_STORAGE='portfolio.hunter-platformer.v3';
export const recordKey=c=>{const o=options(c);return`${o.character}/${o.course}/${o.difficulty}/${o.mode}`;};
export function loadRecords(read){let s;try{s=JSON.parse(read(HUNTER_STORAGE));}catch{}const r={selection:options(s?.selection),sound:s?.sound===true,scores:{}};for(const[k,v]of Object.entries(s?.scores||{})){const[character,course,difficulty,mode]=k.split('/');if(!v||recordKey({character,course,difficulty,mode})!==k)continue;r.scores[k]={rooms:Number.isFinite(v.rooms)&&v.rooms>=0?v.rooms:0,badges:Number.isFinite(v.badges)&&v.badges>=0?v.badges:0,bestTime:Number.isFinite(v.bestTime)&&v.bestTime>0?v.bestTime:0};}return r;}
export function remember(r,m){const k=recordKey(m.config),old=r.scores[k]||{};r.scores[k]={rooms:Math.max(old.rooms||0,m.cleared),badges:Math.max(old.badges||0,m.badges),bestTime:m.phase==='won'&&(!old.bestTime||m.elapsed<old.bestTime)?m.elapsed:old.bestTime||0};}
const approach=(v,target,amount)=>v<target?Math.min(v+amount,target):Math.max(v-amount,target);
export class HunterModel{
  constructor(seed=Date.now(),config){this.reset(seed,config);}
  reset(seed=this.seed,config=this.config){this.seed=seed>>>0;this.config=options(config);this.kit=loadout(this.config);this.rules=DIFFICULTIES[this.config.difficulty];this.phase='ready';this.elapsed=0;this.clock=0;this.remaining=this.rules.seconds;this.started=false;this.cleared=0;this.deaths=0;this.badges=0;this.energy=100;this.events=[];this.input={left:false,right:false,jump:false};this.jumpBuffer=0;this.coyote=0;this.cooldown=0;this.effect=0;this.charge=0;this.dash=0;this.guardReady=false;this.target=null;this.reason='';this.transition=0;this.respawn=0;this.loadRoom(0);}
  loadRoom(index){this.roomIndex=index;const template=this.config.mode==='endless'?(index+Math.floor(index/6)+(this.seed%3)*6)%6:index;this.level=createLevel(this.config.course,template);this.p={...this.level.spawn,vx:0,vy:0,grounded:true,facing:1,support:0};this.spawn={...this.level.spawn};this.camera=0;this.walk=0;this.jumpBuffer=0;this.coyote=.1;this.dash=0;this.charge=0;this.target=null;this.effect=0;this.energy=Math.min(100,this.energy+(this.kit.electric?30:15));this.clock=0;}
  emit(type,extra={}){this.events.push({type,...extra});}
  drainEvents(){return this.events.splice(0);}
  begin(){this.phase='playing';}
  clearInput(){this.input={left:false,right:false,jump:false};this.jumpBuffer=0;}
  pause(){if(['playing','transition'].includes(this.phase)){this.beforePause=this.phase;this.phase='paused';this.clearInput();}}
  resume(){if(this.phase==='paused')this.phase=this.beforePause||'playing';}
  setInput(key,down){if(!Object.hasOwn(this.input,key))return;if(this.phase!=='playing'){if(!down)this.input[key]=false;return;}if(down&&!this.input[key]&&key==='jump')this.jumpBuffer=.13;this.input[key]=down;if(down)this.started=true;if(!down&&key==='jump'&&this.p.vy< -210)this.p.vy=-210;}
  jump(){this.setInput('jump',true);}
  releaseJump(){this.setInput('jump',false);}
  abilityTarget(){const p=this.p,k=this.kit.skill,near=(x,y,range)=>Math.hypot(x-p.x,y-(p.y-20))<range;
    if(['board','echo','godspeed'].includes(k))return p.grounded?p:null;
    if(k==='rod')return this.level.gems.find(g=>!g.taken&&near(g.x,g.y,190));
    if(['rock','blades'].includes(k))return this.level.platforms.find(b=>b.kind==='crate'&&!b.removed&&near(b.x+16,b.y+16,90));
    if(k==='gum')return this.level.anchors.filter(a=>a.y<p.y-25&&near(a.x,a.y,195)&&(a.x-p.x)*p.facing>5).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    const g=this.level.guard;return g&&g.stun<=0&&near(g.x,g.y-20,130)?g:null;
  }
  availability(){if(this.phase!=='playing'||this.respawn>0)return'Start a room';if(this.cooldown>0)return`${Math.ceil(this.cooldown)}s`;if(this.energy<this.kit.cost)return`Need ${this.kit.cost} energy`;if(!this.abilityTarget())return this.kit.target;return'';}
  cast(){if(this.availability())return false;this.started=true;this.energy-=this.kit.cost;this.cooldown=5;this.effect=.6;this.target=this.abilityTarget();const p=this.p,k=this.kit.skill;
    if(['board','echo','godspeed'].includes(k)){this.dash=.45;p.vx=p.facing*390;this.guardReady=k==='godspeed';}
    else if(k==='rod'){this.target.taken=true;this.badges++;this.emit('collect');}
    else if(k==='rock'){this.charge=.35;}
    else if(k==='blades'){this.target.removed=true;this.emit('smash');}
    else if(k==='gum'){p.vy=-570;p.vx=p.facing*285;p.grounded=false;this.coyote=0;this.effect=.75;}
    else this.target.stun=3.5;
    this.emit('cast');return true;
  }
  die(reason='Missed the landing.'){
    if(this.respawn>0)return;this.deaths++;this.remaining=Math.max(0,this.remaining-this.rules.penalty);this.reason=reason;this.respawn=.35;this.p.vx=0;this.p.vy=0;this.dash=0;this.effect=0;this.charge=0;this.jumpBuffer=0;this.emit('hit');
  }
  restartCheckpoint(){this.p={...this.spawn,vx:0,vy:0,grounded:true,facing:1,support:null};this.coyote=.1;this.jumpBuffer=0;for(const b of this.level.platforms)if(b.kind==='crumble'){b.crumble=-1;b.broken=0;}this.emit('respawn');}
  step(dt=HUNTER.step){
    if(this.phase==='transition'){this.transition-=dt;if(this.transition<=0){this.loadRoom(this.roomIndex+1);this.phase='playing';this.emit('room');}return;}
    if(this.phase!=='playing')return;
    if(this.started){this.remaining=Math.max(0,this.remaining-dt);this.elapsed+=dt;}
    if(this.remaining<=0){this.phase='over';this.reason='Time’s up. Try a cleaner route.';this.clearInput();this.emit('over');return;}
    if(this.respawn>0){this.respawn=Math.max(0,this.respawn-dt);if(this.respawn===0)this.restartCheckpoint();return;}
    const p=this.p;this.clock+=dt;
    for(const key of ['cooldown','effect','dash','jumpBuffer','coyote'])this[key]=Math.max(0,this[key]-dt);
    if(this.charge>0){this.charge-=dt;if(this.charge<=0&&this.target){this.target.removed=true;this.emit('smash');}}
    if(!this.kit.electric)this.energy=Math.min(100,this.energy+this.rules.recharge*dt);
    for(const b of this.level.platforms){b.previousX=b.x;if(b.kind==='moving')b.x=b.baseX+Math.sin(this.clock*1.4+b.id)*28;if(b.broken>0){b.broken=Math.max(0,b.broken-dt);if(b.broken===0)b.crumble=-1;}else if(b.crumble>=0){b.crumble+=dt;if(b.crumble>.65)b.broken=2.5;}}
    const support=this.level.platforms.find(b=>b.id===p.support);
    if(p.grounded&&support?.kind==='moving')p.x+=support.x-support.previousX;
    if(p.grounded)this.coyote=.1;
    if(this.jumpBuffer>0&&this.coyote>0){p.vy=-HUNTER.jumpSpeed;p.grounded=false;this.coyote=0;this.jumpBuffer=0;this.emit('jump');}
    const dir=Number(this.input.right)-Number(this.input.left);if(dir)p.facing=dir;
    if(this.charge>0)p.vx=approach(p.vx,0,2400*dt);
    else if(this.dash>0)p.vx=p.facing*390;
    else p.vx=approach(p.vx,dir*HUNTER.speed,(dir?2100:2800)*dt);
    const oldX=p.x;p.x=Math.max(11,Math.min(this.level.width-11,p.x+p.vx*dt));
    const solid=this.level.platforms.filter(b=>!b.removed&&!b.broken);
    for(const b of solid)if(b.h>24&&p.y>b.y+.5&&p.y-HUNTER.bodyHeight<b.y+b.h-.5&&p.x+11>b.x&&p.x-11<b.x+b.w){if(oldX+11<=b.x+.1&&p.vx>0){p.x=b.x-11;p.vx=0;}else if(oldX-11>=b.x+b.w-.1&&p.vx<0){p.x=b.x+b.w+11;p.vx=0;}}
    const oldY=p.y;p.vy=Math.min(850,p.vy+HUNTER.gravity*dt);p.y+=p.vy*dt;p.grounded=false;p.support=null;
    for(const b of solid)if(p.x+10>b.x&&p.x-10<b.x+b.w){
      if(p.vy>=0&&oldY<=b.y+.5&&p.y>=b.y){p.y=b.y;p.vy=0;p.grounded=true;p.support=b.id;if(b.kind==='crumble'&&b.crumble<0)b.crumble=0;}
      else if(b.h>24&&p.vy<0&&oldY-HUNTER.bodyHeight>=b.y+b.h-.5&&p.y-HUNTER.bodyHeight<b.y+b.h){p.y=b.y+b.h+HUNTER.bodyHeight;p.vy=0;}
    }
    this.walk+=Math.abs(p.x-oldX);
    const cp=this.level.checkpoint;if(!cp.active&&p.grounded&&Math.abs(p.x-cp.x)<27&&Math.abs(p.y-cp.y)<8){cp.active=true;this.spawn={x:cp.x,y:cp.y};this.emit('checkpoint');}
    for(const g of this.level.gems)if(!g.taken&&Math.hypot(g.x-p.x,g.y-(p.y-20))<26){g.taken=true;this.badges++;this.emit('collect');}
    for(const h of this.level.hazards)if(p.x+8>h.x+3&&p.x-8<h.x+h.w-3&&p.y>h.y-11&&p.y-HUNTER.bodyHeight<h.y)this.die('Spikes! Jump a little earlier.');
    const g=this.level.guard;if(g){g.stun=Math.max(0,g.stun-dt);if(!g.stun)g.x=g.baseX+Math.sin(this.clock*1.8)*g.range;if(g.stun===0&&Math.abs(p.x-g.x)<23&&p.y>g.y-34&&p.y-HUNTER.bodyHeight<g.y){if(this.guardReady&&this.effect>0){g.stun=3;this.guardReady=false;this.emit('deflect');}else this.die('Jump over the sentry.');}}
    if(p.y>430)this.die();
    const targetCamera=Math.max(0,Math.min(this.level.width-640,p.x-230));this.camera=approach(this.camera,targetCamera,700*dt);
    if(this.respawn===0&&p.x>=this.level.goal.x-18&&p.y>=this.level.goal.y-70&&p.y<=this.level.goal.y+8){this.cleared++;this.emit('clear');if(this.config.mode==='trial'&&this.cleared===LEVELS[this.config.course].length){this.phase='won';this.clearInput();this.emit('win');}else{if(this.config.mode==='endless')this.remaining=Math.min(this.rules.seconds,this.remaining+18);this.transition=.45;this.phase='transition';}}
  }
}
