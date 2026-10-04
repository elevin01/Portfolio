// Hand-authored rooms. Rectangles are [x, top, width, height, material].
// Each main route is reachable with the shared jump; upper routes are optional.
const floor = (x,y,w,kind='stone') => [x,y,w,Math.max(24,400-y),kind];
const ledge = (x,y,w,kind='stone') => [x,y,w,22,kind];
const room = (name, platforms, checkpoint, extras = {}) => ({ name, width:1120, platforms, checkpoint, ...extras });
export const LEVELS = {
  exam: [
    room('The entrance', [floor(0,310,270),floor(350,310,200),floor(610,255,140),floor(820,310,300)], [460,310], { hint:'← → to move. Hold jump to go higher.', signs:[[145,280,'JUMP →']], spikes:[[1000,310,36]], gems:[[400,265],[660,210],[940,255]] }),
    room('The long staircase', [floor(0,310,230),floor(270,252,135),floor(450,195,145),floor(650,248,145),floor(860,310,260)], [520,195], { gems:[[325,209],[505,151],[710,205]], signs:[[95,280,'KEEP CLIMBING']] }),
    room('Broken passage', [floor(0,285,210),ledge(255,260,110,'crumble'),ledge(410,228,150),ledge(625,260,120,'crumble'),floor(815,285,305)], [485,228], { gems:[[310,213],[480,181],[682,214]], signs:[[105,252,'DON’T LINGER']], spikes:[[945,285,42]] }),
    room('A higher path', [floor(0,310,355),floor(435,310,685),ledge(220,245,130),ledge(410,188,125),ledge(615,188,125),ledge(810,244,135)], [770,310], { spikes:[[520,310,45],[925,310,40]], gems:[[280,201],[470,144],[675,144],[865,200]], crates:[[650,278]], signs:[[110,280,'TWO WAYS THROUGH']] }),
    room('Over the wetlands', [floor(0,310,225),ledge(290,266,120,'moving'),ledge(475,220,165),ledge(705,262,135,'moving'),floor(900,310,220)], [550,220], { gems:[[535,176],[780,214]], signs:[[110,280,'WAIT. THEN LEAP.']] }),
    room('Follow the examiner', [floor(0,310,210),ledge(260,252,140),ledge(445,198,135),floor(645,253,155),floor(870,310,250)], [710,253], { gems:[[325,209],[510,154],[711,209]], guard:[1050,310,12], signs:[[90,280,'ONE LAST CLIMB']] })
  ],
  yorknew: [
    room('Auction district', [floor(0,310,290),floor(350,260,165),floor(575,310,325),floor(980,275,140)], [670,310], { spikes:[[720,310,36]], gems:[[415,215],[635,265],[940,230]], signs:[[100,275,'THE ROOFTOPS →']] }),
    room('Fire escape', [floor(0,310,210),floor(250,252,130),floor(420,194,140),ledge(625,165,140),floor(830,250,290)], [490,194], { gems:[[310,208],[485,150],[690,121],[920,206]], signs:[[85,278,'UP AND OVER']] }),
    room('Old rooftops', [floor(0,270,230),ledge(285,270,120,'crumble'),floor(475,220,175),ledge(720,255,115,'crumble'),floor(900,285,220)], [555,220], { spikes:[[1050,285,32]], gems:[[345,226],[545,176],[770,211]], signs:[[90,238,'WATCH YOUR FOOTING']] }),
    room('Across the avenue', [floor(0,310,310),floor(390,310,730),ledge(225,248,130),ledge(405,190,130),ledge(610,190,150),ledge(815,249,130)], [730,310], { spikes:[[480,310,40],[970,310,38]], crates:[[635,278]], gems:[[280,204],[470,146],[685,146],[875,205]], signs:[[100,278,'HIGH ROAD / LOW ROAD']] }),
    room('Service lifts', [floor(0,310,230),ledge(290,268,120,'moving'),floor(480,225,170),ledge(710,265,130,'moving'),floor(910,300,210)], [560,225], { gems:[[540,181],[775,221]], signs:[[85,276,'CATCH THE LIFT']] }),
    room('Backstreet exit', [floor(0,300,245),floor(310,245,150),ledge(520,200,140),floor(725,255,150),floor(940,300,180)], [590,200], { gems:[[370,201],[590,156],[785,211]], guard:[1085,300,8], signs:[[95,268,'THE EXIT IS CLOSE']] })
  ],
  greed: [
    room('Out of the village', [floor(0,310,260),floor(325,270,190),floor(580,310,310),floor(960,260,160)], [695,310], { spikes:[[715,310,36]], gems:[[385,226],[640,266],[955,216]], signs:[[90,278,'MASADORA →']] }),
    room('Rocky ascent', [floor(0,310,230),floor(275,255,130),floor(450,200,145),floor(660,245,150),floor(880,300,240)], [520,200], { gems:[[335,211],[515,156],[725,201]], signs:[[100,278,'CLIMB THE RIDGE']] }),
    room('Fragile stepping stones', [floor(0,280,215),ledge(265,255,115,'crumble'),ledge(430,218,170),ledge(670,258,115,'crumble'),floor(860,290,260)], [510,218], { gems:[[325,211],[510,174],[725,214]], signs:[[90,248,'LIGHT ON YOUR FEET']] }),
    room('The shortcut', [floor(0,310,340),floor(420,310,700),ledge(210,248,145),ledge(410,190,135),ledge(625,190,130),ledge(810,245,140)], [770,310], { spikes:[[520,310,45],[970,310,38]], crates:[[660,278]], gems:[[280,204],[475,146],[690,146],[875,201]], signs:[[90,278,'TAKE THE HIGH ROAD?']] }),
    room('Drifting stone', [floor(0,310,230),ledge(300,265,115,'moving'),floor(480,222,175),ledge(720,264,125,'moving'),floor(920,310,200)], [565,222], { gems:[[548,178],[780,220]], signs:[[95,278,'FIND THE RHYTHM']] }),
    room('Road to Masadora', [floor(0,310,235),floor(285,255,155),ledge(505,200,150),floor(720,255,150),floor(940,310,180)], [580,200], { gems:[[355,211],[575,156],[785,211]], guard:[1085,310,8], signs:[[90,278,'LAST STOP: MASADORA']] })
  ]
};
export function createLevel(course,index) {
  const source=LEVELS[course][index%6];
  const platforms=source.platforms.map(([x,y,w,h,kind],id)=>({id,x,y,w,h,kind,baseX:x,previousX:x,broken:0,crumble:-1}));
  for(const [x,y] of source.crates||[])platforms.push({id:platforms.length,x,y,w:32,h:32,baseX:x,kind:'crate',removed:false});
  const last=platforms.find(p=>p.x<=1065&&p.x+p.w>=1065);
  return {name:source.name,width:source.width,platforms,spawn:{x:65,y:source.platforms[0][1]},goal:{x:1065,y:last.y},checkpoint:{x:source.checkpoint[0],y:source.checkpoint[1],active:false},
    hazards:(source.spikes||[]).map(([x,y,w])=>({kind:'spike',x,y,w,h:14})),
    gems:(source.gems||[]).map(([x,y],id)=>({id,x,y,taken:false})),
    anchors:platforms.filter(p=>p.kind!=='crate'&&p.x>200).map(p=>({x:p.x+p.w/2,y:Math.max(70,p.y-100)})),
    guard:source.guard?{baseX:source.guard[0],x:source.guard[0],y:source.guard[1],range:source.guard[2],stun:0}:null,
    signs:source.signs||[],hint:source.hint||'Reach the gate. Green flags save your position.'};
}
