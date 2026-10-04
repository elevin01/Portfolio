import { HUNTER, COURSES, chapter } from './hunter-model.js';
const G = HUNTER.ground;
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
    for (const e of events) if (['hit','collect','smash','cast','win'].includes(e.type)) {
      const origin = e.type === 'smash' && m.target ? Math.min(620,128+m.target.x-m.travel) : 128;
      for(let i=0;i<12;i++) this.particles.push({x:origin,y:G-m.y-30,vx:Math.sin(i*2.4)*70,vy:-30-Math.cos(i)*55,life:.6,color:e.type==='hit'?'#ed927e':e.type==='cast'?'#c2e7f1':'#f4dc8d'});
    }
    this.particles=this.particles.slice(-80);
  }
  background(m, preview, reduced) {
    const stage = chapter(m.distance,m.config), course = m.config.course;
    const type = course === 'exam' ? stage < 2 ? 'tunnel' : 'wetlands' : course === 'yorknew' ? 'city' : 'field';
    const p=PALETTES[type], c=this.c, scroll = reduced && preview ? 0 : m.travel;
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
      this.rect(0,248,640,34,'#273c43');this.rect(0,258,640,2,'#738478');
      for(let i=0;i<19;i++)this.rect(i*40-(scroll*.4%40),265,24,3,'#172a34');
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
    // Continuous ground plane with a strong, consistent collision edge.
    this.rect(0,G,640,78,type==='city'?'#29283b':'#263b3c');
    this.rect(0,G,640,5,p[3]);this.rect(0,G+5,640,5,type==='field'?'#658360':'#566961');
    for(let i=-1;i<24;i++){const x=i*34-(scroll%34);this.rect(x,G+16,24,2,type==='city'?'#514657':'#43524b');this.rect(x+12,G+38,3,3,'#758074');}
    this.rect(0,334,640,26,'#15262d');this.rect(0,333,640,1,'#52665c');
  }
  sprite(m, x, y, scale=1) {
    const c=this.c, id=m.config.character, slide=m.slide>0&&m.y<1, jumping=m.y>0;
    const skin='#e6b494', outline='#192632';
    const clothes={killua:['#e2e9dd','#647999','#e6eff0'],gon:['#4d9b61','#376b4c','#233d32'],kurapika:['#477db2','#284b85','#e5bf60'],hisoka:['#e7d5b9','#975b7b','#c75c69']}[id];
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
    const r=(a,b,w,h,col)=>this.rect(a,b,w,h,col);
    if(m.invincible>0&&Math.floor(m.invincible*12)%2)c.globalAlpha=.45;
    if(slide){r(-21,-19,40,15,outline);r(-15,-19,20,10,clothes[0]);r(4,-22,12,12,skin);r(2,-25,13,6,clothes[2]);r(-22,-8,33,6,clothes[1]);r(10,-8,12,7,outline);c.restore();return;}
    const phase = m.phase==='playing'?m.travel*.075:this.clock*7;
    const leg=jumping?5:Math.round(Math.sin(phase)*7), arm=jumping?-5:-leg;
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
  hazard(h, m) {
    if(h.removed)return;
    const x=128+h.x-m.travel, w=h.w, c=this.c;
    if(x<-120||x>680)return;
    if(h.kind==='gap'){
      this.rect(x,G,w,51,'#0c1824');this.rect(x+5,G+14,w-10,36,'#122533');
      this.rect(x-4,G,4,8,'#ebcc89');this.rect(x+w,G,4,8,'#ebcc89');
      for(let i=0;i<4;i++){this.rect(x+3,G+13+i*9,3,3,'#52665c');this.rect(x+w-6,G+13+i*9,3,3,'#52665c');}
    } else if(h.kind==='beam') {
      this.rect(x-5,G-123,5,124,'#506269');this.rect(x+w,G-123,5,124,'#506269');
      this.rect(x-7,G-126,w+14,7,'#89917e');this.rect(x,G-87,w,53,'#20343a');
      this.rect(x,G-40,w,8,'#dfbb76');
      for(let i=0;i<w;i+=16)this.poly([[x+i,G-40],[x+i+7,G-40],[x+i+14,G-32],[x+i+7,G-32]],'#4d5148');
      this.label('SLIDE',x+w/2,G-58,'#d9d0a3',9,'center');
    } else if(h.kind==='sentry') {
      const bob=Math.sin(this.clock*4+h.id)*2;
      this.rect(x,G-44+bob,w,34,'#242b3b');this.rect(x+4,G-47+bob,w-8,8,'#a06867');
      this.rect(x+3,G-31+bob,w-6,7,'#dfb884');this.rect(x+7,G-30+bob,4,4,'#332940');
      this.rect(x-4,G-25,5,15,'#bd8675');this.rect(x+2,G-11,9,11,'#152632');this.rect(x+w-10,G-11,9,11,'#152632');
    } else {
      this.rect(x,G-34,w,34,'#523f37');this.rect(x+3,G-31,w-6,27,'#ab8054');this.rect(x+6,G-28,w-12,21,'#805b44');
      this.line([[x+5,G-28],[x+w-5,G-5]],'#c79c65',4);this.line([[x+5,G-5],[x+w-5,G-28]],'#c79c65',4);
      this.rect(x,G-35,w,4,'#e1bf83');
    }
    if(m.kit.skill==='gum'&&['gap','hurdle'].includes(h.kind)&&!h.done){
      const ax=x+w/2;this.line([[ax,G-155],[ax,G-124]],'#6b7d77',2);this.poly([[ax,G-127],[ax+7,G-120],[ax,G-113],[ax-7,G-120]],'#efa6c4');
    }
    if(m.phase==='playing'&&!h.done&&x>155&&x<610){
      if(h.kind!=='beam'){this.poly([[x+w/2-5,G-57],[x+w/2,G-64],[x+w/2+5,G-57]],'#e6d3a3');}
    }
  }
  draw(m,{preview=false,reducedMotion=false,dt=0}={}) {
    const c=this.c;c.imageSmoothingEnabled=false;if(!reducedMotion)this.clock+=dt;
    this.background(m,preview,reducedMotion);
    if(!preview){
      for(const h of m.hazards)this.hazard(h,m);
      for(const p of m.pickups)if(!p.done){const x=128+p.x-m.travel,y=G-p.y;if(x<0||x>650)continue;
        if(p.kind==='badge'){this.poly([[x,y-7],[x+6,y],[x,y+7],[x-6,y]],'#edce86');this.rect(x-1,y-3,2,6,'#fff0bd');}
        else {this.rect(x-10,y-9,20,18,'#a5cfc9');this.rect(x-6,y-13,12,4,'#466c70');this.poly([[x+2,y-7],[x-5,y+1],[x,y+1],[x-2,y+7],[x+6,y-1],[x+1,y-1]],'#264c59');}
      }
      if(Number.isFinite(m.finish)){const x=128+m.finish*10-m.travel;if(x<680){this.rect(x,G-142,7,142,'#d1d8b4');this.rect(x+95,G-142,7,142,'#d1d8b4');this.rect(x,G-142,102,29,'#3b675b');this.label('FINISH',x+51,G-123,'#f5e6b3',13,'center');}}
    }
    const px=preview?162:128, py=G-m.y;
    c.fillStyle='#0a202a55';c.beginPath();c.ellipse(px,G+4,19,4,0,0,Math.PI*2);c.fill();
    if(m.effect>0&&!reducedMotion&&['echo','godspeed'].includes(m.kit.skill))for(let i=3;i>0;i--){c.globalAlpha=.12;this.sprite(m,px-i*25,py);c.globalAlpha=1;}
    this.sprite(m,px,py,1);
    if(m.effect>0&&m.target){
      const tx=m.target===m?px:Math.max(px,Math.min(640,128+m.target.x-m.travel));
      if(['gum','rod'].includes(m.kit.skill))this.line([[px+15,py-33],[tx,G-(m.kit.skill==='gum'?120:m.target.y)]],m.kit.skill==='gum'?'#eda0c4':'#e5d6a0',m.kit.skill==='gum'?3:1);
      if(['palm','godspeed'].includes(m.kit.skill))this.line([[px+10,py-35],[px+29,py-53],[px+22,py-25],[tx,G-38]],'#c0ecf4',3);
      if(m.kit.skill==='heal'){c.strokeStyle='#eddaa2';c.lineWidth=2;c.strokeRect(px-22,py-75,45,76);this.label('+1',px,py-86,'#f9e5a0',14,'center');}
      if(['rock','blades'].includes(m.kit.skill)&&m.charge<=0)this.line([[px+14,py-36],[tx+12,G-22]],'#f4d98e',5);
    }
    if(!reducedMotion)for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;this.rect(p.x,p.y,3,3,p.color);}this.particles=this.particles.filter(p=>p.life>0);
    if(preview){
      this.label('HUNTER × HUNTER',35,66,'#e4d9ad',11);this.label('THE LONG',34,103,'#f4efd8',28);this.label('WAY THERE.',34,135,'#f4efd8',28);
      this.label('A SIDE-SCROLLING EXPEDITION',36,158,'#a8bfb5',9);
      this.hazard({kind:'hurdle',x:265,w:34,id:90},m);this.hazard({kind:'beam',x:420,w:60,id:91},m);
      this.label('JUMP',410,227,'#f1dfad',10,'center');
    }
    this.label(preview?'01 / CHOOSE YOUR HUNTER':COURSES[m.config.course].places[chapter(m.distance,m.config)].toUpperCase(),16,350,'#b8c9b7',9);
    this.label(preview?'2D ARCADE':`${m.config.mode.toUpperCase()} / ${m.rules.name.toUpperCase()}`,623,350,'#9bacaa',9,'right');
  }
}
