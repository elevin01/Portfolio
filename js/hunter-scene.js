import { HUNTER, COURSES } from './hunter-model.js';
const G = 310;
const PALETTES = {
  tunnel: ['#101e29','#243640','#3e555a','#a9bd9f','#e4c88e'],
  wetlands: ['#193c42','#285457','#48746b','#a6c5a2','#ece2af'],
  city: ['#191e38','#2c3050','#494260','#978494','#f3c58a'],
  field: ['#77a7ae','#597f87','#73958a','#b5c696','#f5e8b0']
};
export class HunterScene {
  constructor(canvas) { this.canvas = canvas; canvas.width = 640; canvas.height = 360; this.c = canvas.getContext('2d', { alpha: false }); this.particles = []; this.clock = 0; }
  rect(x,y,w,h,color) { this.c.fillStyle = color; this.c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h)); }
  line(points, color, width = 2) { const c = this.c; c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y))); c.strokeStyle=color;c.lineWidth=width;c.stroke(); }
  poly(points,color) { const c=this.c;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill(); }
  label(text,x,y,color='#e8edcd',size=10,align='left') { const c=this.c;c.fillStyle=color;c.font=`bold ${size}px ui-monospace, monospace`;c.textAlign=align;c.fillText(text,Math.round(x),Math.round(y)); }
  accept(events, m) {
    for(const e of events) if(['hit','collect','smash','cast','checkpoint'].includes(e.type)) {
      for(let i=0;i<10;i++)this.particles.push({x:m.p.x,y:m.p.y-25,vx:Math.sin(i*2.4)*65,vy:-40-Math.cos(i)*60,life:.5,color:e.type==='hit'?'#ef9686':e.type==='checkpoint'?'#b9e6aa':'#f6db91'});
    }
    this.particles=this.particles.slice(-60);
  }
  background(m, preview, reduced) {
    const stage = Math.floor((m.roomIndex%6)/2), course = m.config.course;
    const type = course === 'exam' ? stage < 2 ? 'tunnel' : 'wetlands' : course === 'yorknew' ? 'city' : 'field';
    const p=PALETTES[type], c=this.c, scroll = reduced && preview ? 0 : m.camera;
    this.rect(0,0,640,360,p[0]);
    if(type==='tunnel') {
      // Repeated stone arches, recessed passageways, rails, and pools of lamplight.
      for(let i=-1;i<6;i++) {
        const x=i*158-(scroll*.18%158);
        this.rect(x,40,146,240,'#1a2b35');
        c.strokeStyle=p[1];c.lineWidth=17;c.beginPath();c.moveTo(x+5,275);c.lineTo(x+5,114);c.bezierCurveTo(x+5,27,x+135,27,x+135,114);c.lineTo(x+135,275);c.stroke();
        this.rect(x+24,128,87,135,'#14242e');
        for(let j=0;j<7;j++)this.rect(x+21,128+j*20,94,2,'#21323b');
        this.rect(x+57,109,21,6,'#e3c896');
        const glow=c.createRadialGradient(x+67,117,1,x+67,117,80);glow.addColorStop(0,'#edca8130');glow.addColorStop(1,'#edca8100');c.fillStyle=glow;c.fillRect(x-13,42,160,160);
        this.poly([[x+59,118],[x+6,260],[x+134,260],[x+77,118]],'#e6d99b07');
      }

      if(stage===1)for(let i=0;i<18;i++){let x=i*48-(scroll*.3%48);this.rect(x,235-(i%5)*8,46,4,'#617371');}
      this.rect(0,35,640,3,'#35494e');this.rect(0,41,640,2,'#0b1722');
      for(let i=0;i<4;i++){let x=i*240-(scroll*.7%240);this.rect(x,26,9,225,'#152a32');this.rect(x-3,67,15,7,'#566967');}
    } else if(type==='city') {
      this.rect(480,49,30,30,'#e3c9a6');this.rect(474,54,42,20,'#e3c9a6');
      for(let i=-1;i<16;i++) {
        const x=i*55-(scroll*.1%55), height=60+((i+20)*37%94);
        this.rect(x,256-height,48,height,p[1]);this.rect(x+18,245-height,9,14,p[1]);
        for(let a=0;a<3;a++)for(let b=0;b<8;b++)if((a+b+i)%3!==0)this.rect(x+8+a*11,268-height+b*15,4,5,'#9b897752');
      }
      for(let i=-1;i<7;i++) {
        const x=i*130-(scroll*.32%130), h=90+((i+10)*31%60);
        this.rect(x,280-h,112,h,p[2]);this.rect(x-4,278-h,120,5,'#685c6c');
        for(let a=0;a<4;a++)for(let b=0;b<4;b++){this.rect(x+12+a*24,294-h+b*25,12,17,'#242b44');this.rect(x+14+a*24,296-h+b*25,8,11,(i+a+b)%3?'#cbaa7f':'#414156');}
        if(stage===1){this.rect(x+35,245-h,35,30,'#493e4c');this.poly([[x+32,245-h],[x+53,232-h],[x+73,245-h]],'#826c73');this.line([[x+37,275-h],[x+33,282-h]],'#a7918c');}
        else {this.rect(x+14,256,86,21,'#24283d');this.rect(x+17,255,80,4,'#cfaa83');}
      }
      if(stage!==1)for(let i=0;i<4;i++){const x=i*210-(scroll*.65%210);this.rect(x,170,4,112,'#111e31');this.line([[x,172],[x+17,162],[x+31,172]],'#86838c');this.rect(x+20,171,17,7,'#edcb8b');}
    } else {
      if(type==='field') { this.rect(472,50,43,36,'#f3dfb0');this.rect(464,59,58,20,'#f3dfb0'); }
      for(let i=-1;i<6;i++){const x=i*180-(scroll*.08%180);this.poly([[x-60,239],[x+62,102+(i%2)*22],[x+185,239]],p[1]);}
      for(let i=-1;i<8;i++){const x=i*120-(scroll*.22%120);this.poly([[x-30,268],[x+60,177+(i%3)*12],[x+149,268]],p[2]);}
      for(let i=-1;i<9;i++){
        const x=i*95-(scroll*.45%95), tall=type==='wetlands'?145:75;
        this.rect(x+30,275-tall,7,tall,'#305957');
        for(let j=0;j<3;j++)this.poly([[x-5+j*5,254-tall+j*22],[x+33,191-tall+j*22],[x+72-j*5,254-tall+j*22]],j===2?'#477266':'#365f5c');
      }
      if(course==='greed'&&stage===2)for(let i=0;i<5;i++) {const x=i*164-(scroll*.3%164);this.rect(x,194,62,73,'#d4ceb1');this.poly([[x-7,194],[x+31,150],[x+69,194]],'#76636a');this.rect(x+25,228,16,39,'#6e776b');this.rect(x+10,208,12,15,'#749690');}
      this.rect(0,269,640,13,p[2]);
      if(type==='wetlands')for(let i=0;i<3;i++){c.fillStyle='#c7d7b50b';c.fillRect(0,125+i*54,640,21);}
    }
    const shade=c.createLinearGradient(0,240,0,360);shade.addColorStop(0,'#0c1f2900');shade.addColorStop(1,'#0c1f29c0');c.fillStyle=shade;c.fillRect(0,240,640,120);
  }
  sprite(m, x, y, scale=1) {
    const c=this.c, id=m.config.character, slide=false, jumping=!m.p.grounded;
    const skin='#e6b494', outline='#192632';
    const clothes={killua:['#e2e9dd','#647999','#e6eff0'],gon:['#4d9b61','#376b4c','#233d32'],kurapika:['#477db2','#284b85','#e5bf60'],hisoka:['#e7d5b9','#975b7b','#c75c69']}[id];
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale*m.p.facing,scale);
    const r=(a,b,w,h,col)=>this.rect(a,b,w,h,col);
    if(m.respawn>0&&Math.floor(m.respawn*30)%2)c.globalAlpha=.45;
    if(slide){r(-21,-19,40,15,outline);r(-15,-19,20,10,clothes[0]);r(4,-22,12,12,skin);r(2,-25,13,6,clothes[2]);r(-22,-8,33,6,clothes[1]);r(10,-8,12,7,outline);c.restore();return;}
    const phase=m.walk*.08;
    const leg=jumping?5:Math.abs(m.p.vx)<5?0:Math.round(Math.sin(phase)*7), arm=jumping?-5:-leg;
    // Articulated chunky sprite: boots, shorts/tunic, sleeves, face, hair silhouette.
    r(-9+leg,-15,8,13,outline);r(3-leg,-15,8,13,outline);
    r(-8+leg,-15,6,10,skin);r(4-leg,-15,6,10,skin);
    r(-12+leg,-5,12,5,clothes[1]);r(2-leg,-5,13,5,clothes[1]);
    r(-10,-28,22,15,outline);r(-8,-27,8,13,clothes[1]);r(2,-27,8,13,clothes[1]);
    r(-12,-44,26,20,outline);r(-10,-42,22,16,clothes[0]);r(-8,-42,3,16,clothes[2]);
    if(id==='kurapika'){r(-11,-27,25,9,clothes[0]);r(-11,-21,25,3,clothes[2]);}
    r(-14+arm,-38,7,17,outline);r(-13+arm,-37,5,14,skin);r(11-arm,-39,7,17,outline);r(12-arm,-38,5,14,skin);
    r(-10,-60,25,20,outline);r(-8,-58,21,16,skin);r(10,-53,6,7,skin);r(9,-53,3,3,outline);r(6,-44,7,2,'#b47472');
    if(id==='killua'){r(-12,-64,24,10,'#dae8ea');r(-16,-60,31,5,'#edf5ef');r(-16,-67,7,10,'#dae8ea');r(-6,-70,7,12,'#edf5ef');r(4,-67,7,10,'#dae8ea');r(-12,-55,6,10,'#adbfcd');}
    if(id==='gon'){r(-11,-64,25,10,'#233d32');r(-12,-70,6,16,'#233d32');r(-4,-76,6,19,'#233d32');r(4,-72,6,17,'#233d32');r(10,-66,6,12,'#233d32');r(-5,-69,3,9,'#4d7150');}
    if(id==='kurapika'){r(-12,-64,27,9,'#e5bf60');r(-14,-59,7,18,'#e5bf60');r(8,-61,7,9,'#e5bf60');r(-7,-64,15,3,'#f7dfa0');}
    if(id==='hisoka'){r(-12,-63,27,8,'#c75c69');r(-10,-69,20,9,'#c75c69');r(-7,-74,12,10,'#c75c69');r(7,-49,3,3,'#c66075');r(-2,-35,6,6,'#c66075');r(-8,-58,8,3,'#97556d');}
    if(m.effect>0&&m.kit.skill==='board'){r(-20,1,45,4,'#cec5a3');r(-15,5,6,5,outline);r(13,5,6,5,outline);}
    if(m.charge>0){r(13,-39,18,15,'#f0cf8d');r(29,-37,5,11,'#fff0b1');}
    c.restore();
  }
  platform(b,m) {
    if(b.removed||b.broken>0)return;
    const x=b.x-m.camera;if(x+b.w<0||x>640)return;
    const city=m.config.course==='yorknew',field=m.config.course==='greed'||m.config.course==='exam'&&m.roomIndex%6>=4;
    const base=city?'#46465c':field?'#526c55':'#3f5860',edge=city?'#d7bbb0':field?'#c5d891':'#b6d0c8';
    if(b.kind==='crate'){
      this.rect(x,b.y,b.w,b.h,'#644c3b');this.rect(x+3,b.y+3,b.w-6,b.h-6,'#b58b58');
      this.line([[x+5,b.y+5],[x+b.w-5,b.y+b.h-5]],'#ead098',4);this.line([[x+b.w-5,b.y+5],[x+5,b.y+b.h-5]],'#ead098',4);return;
    }
    this.rect(x-1,b.y-1,b.w+2,b.h+2,'#142b35');this.rect(x,b.y,b.w,b.h,base);
    this.rect(x,b.y,b.w,5,b.kind==='crumble'?'#e0b87c':b.kind==='moving'?'#9ed6e2':edge);
    this.rect(x+2,b.y+6,b.w-4,4,'#233e45');
    for(let j=0;j<Math.min(b.h,160)/22;j++){
      for(let i=0;i<b.w/36;i++)this.rect(x+i*36+(j%2)*18,b.y+15+j*22,2,13,'#223c4460');
      this.rect(x,b.y+28+j*22,b.w,1,'#1a333b55');
    }
    if(b.kind==='crumble'){
      this.line([[x+25,b.y+4],[x+35,b.y+11],[x+28,b.y+16],[x+41,b.y+22]],'#3f3733',2);
      this.line([[x+b.w-22,b.y+4],[x+b.w-31,b.y+13],[x+b.w-23,b.y+22]],'#3f3733',2);
      if(b.crumble>=0)this.rect(x,b.y-4,b.w*Math.max(0,1-b.crumble/.65),2,'#f0cb8b');
    }
    if(b.kind==='moving'){this.label('←  →',x+b.w/2,b.y+18,'#a7d5de',10,'center');}
    if(field&&b.h>30)for(let i=0;i<b.w;i+=18)this.rect(x+i,b.y-3,3+(i%5),4,'#bdd282');
  }
  flag(flag,m,goal=false) {
    const x=flag.x-m.camera,y=flag.y;
    this.rect(x-2,y-48,4,48,'#21343d');this.rect(x-1,y-47,2,47,'#c5d1af');
    this.poly([[x+2,y-47],[x+29,y-47],[x+22,y-35],[x+2,y-35]],goal?'#efce85':flag.active?'#b9e49b':'#668b78');
    this.rect(x-4,y-51,8,5,goal?'#fae1a0':'#c0ddb0');
    if(goal){this.rect(x-17,y-70,53,14,'#183238');this.label('EXIT →',x+9,y-60,'#ead8a8',8,'center');}
  }
  draw(m,{preview=false,reducedMotion=false,dt=0}={}) {
    const c=this.c;c.imageSmoothingEnabled=false;if(!reducedMotion)this.clock+=dt;
    this.background(m,preview,reducedMotion);
    for(const b of m.level.platforms)this.platform(b,m);
    for(const h of m.level.hazards){const x=h.x-m.camera;this.rect(x,h.y-2,h.w,3,'#704f53');for(let i=0;i<h.w;i+=10)this.poly([[x+i,h.y],[x+i+5,h.y-14],[x+i+10,h.y]],'#f1aba0');}
    for(const g of m.level.gems)if(!g.taken){const x=g.x-m.camera,y=g.y+(reducedMotion?0:Math.sin(this.clock*3+g.id)*2);this.poly([[x,y-8],[x+7,y],[x,y+8],[x-7,y]],'#f3d28b');this.line([[x,y-4],[x,y+4]],'#fff2be',2);}
    this.flag(m.level.checkpoint,m);this.flag(m.level.goal,m,true);
    if(m.kit.skill==='gum')for(const a of m.level.anchors){const x=a.x-m.camera;this.line([[x,a.y-10],[x,a.y-1]],'#74979a');this.poly([[x,a.y-5],[x+6,a.y],[x,a.y+5],[x-6,a.y]],'#f0a7c9');}
    const guard=m.level.guard;
    if(guard){const x=guard.x-m.camera,y=guard.y;c.globalAlpha=guard.stun>0?.45:1;this.rect(x-13,y-33,26,27,'#253143');this.rect(x-14,y-36,28,8,'#a8646b');this.rect(x-9,y-27,19,6,'#e3b789');this.rect(x-10,y-8,7,8,'#192333');this.rect(x+4,y-8,7,8,'#192333');c.globalAlpha=1;if(guard.stun>0)this.label('…',x,y-44,'#efd990',13,'center');}
    if(m.roomIndex===0)for(const [x,y,t]of m.level.signs)this.label(t,x-m.camera,y,'#c6d6bd',9,'center');
    const px=m.p.x-m.camera,py=m.p.y;
    if(m.effect>0&&!reducedMotion&&['echo','godspeed'].includes(m.kit.skill))for(let i=3;i>0;i--){c.globalAlpha=.14;this.sprite(m,px-i*17*m.p.facing,py,.72);c.globalAlpha=1;}
    this.sprite(m,px,py,.72);
    if(m.effect>0&&m.target){const t=m.target,tx=t.x-m.camera,ty=t.y;
      if(['gum','rod','chain'].includes(m.kit.skill))this.line([[px+10*m.p.facing,py-24],[tx,ty]],m.kit.skill==='gum'?'#efa1c4':'#e2d2a5',2);
      if(['palm','godspeed'].includes(m.kit.skill))this.line([[px-13,py],[px-6,py-23],[px-15,py-32],[px+4,py-53],[px-1,py-29],[px+15,py-9]],'#b9ebf2',2);
      if(['blades','rock'].includes(m.kit.skill)&&m.charge<=0)this.line([[px+11*m.p.facing,py-23],[tx+16,ty+16]],'#f9dda0',4);
    }
    if(!reducedMotion)for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;this.rect(p.x-m.camera,p.y,3,3,p.color);}this.particles=this.particles.filter(p=>p.life>0);
    // A compact game HUD, leaving the terrain visible.
    this.rect(0,0,640,38,'#112934e8');this.label(`${String(m.roomIndex+1).padStart(2,'0')} / ${m.config.mode==='trial'?'06':'∞'}   ${m.level.name.toUpperCase()}`,14,16,'#e2dec1',10);
    this.label(`${m.badges} BADGES`,14,29,'#9eb9ad',8);this.label(`${Math.ceil(m.remaining)}s`,624,26,m.remaining<20?'#f2aba0':'#e9dbac',22,'right');
    if(!m.started&&!preview){this.rect(173,53,294,27,'#f0e6ccef');this.label('MOVE ← →    HOLD SPACE TO JUMP',320,71,'#294a45',11,'center');}
    if(m.phase==='transition'){this.rect(173,130,294,63,'#142e38ee');this.label('ROOM CLEAR',320,157,'#e9dda8',19,'center');this.label('KEEP MOVING',320,177,'#aec5ad',9,'center');}
    if(m.respawn>0){this.rect(232,139,176,36,'#183039eb');this.label(`BACK TO FLAG  −${m.rules.penalty}s`,320,162,'#edc799',11,'center');}
  }
}
