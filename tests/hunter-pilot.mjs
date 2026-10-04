export function pilot(m) {
  if(!['playing','transition'].includes(m.phase))return;
  m.setInput('right',true);
  const p=m.p;
  if(p.grounded&&m.respawn===0){
    const b=m.level.platforms.find(b=>b.id===p.support);
    let jump=b&&b.x+b.w-p.x<34;
    if(m.level.platforms.some(b=>!b.removed&&!b.broken&&b.x>p.x+8&&b.x-p.x<53&&b.y<p.y-3&&b.y+b.h>p.y-40))jump=true;
    if(m.level.hazards.some(h=>h.x+h.w>p.x&&h.x-p.x<56&&Math.abs(h.y-p.y)<10))jump=true;
    const g=m.level.guard;if(g&&g.stun===0&&Math.abs(g.x-p.x)<63&&Math.abs(g.y-p.y)<10)jump=true;
    m.setInput('jump',!!jump);
  }
  if(!p.grounded&&p.vy>0)m.setInput('jump',false);
  m.step();m.drainEvents();
}
