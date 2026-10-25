// Rendering and boarding route ported from yw/map-assets 1ec3221.
// World membership is controlled by App; this scene only draws a journey.
export type DepartureScene = { replay(): void; skip(): void; depart(name: string): void; dispose(): void };
export function createDepartureScene(canvas: HTMLCanvasElement, callbacks: {
  onReady(): void; onArrival(): void; onCaption(text: string): void; onError(): void;
}): DepartureScene {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  const g = context;
  g.imageSmoothingEnabled = false;
  const art = {} as Record<'house' | 'person' | 'bus', HTMLImageElement>;
  let start = 0, phase = 'boarding', departAt = 0, destination = '', menuShown = false;
  let disposed = false, frame = 0, lastCaption = '', completed = false, skipRequested = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caption = (value: string) => { if (value !== lastCaption) { lastCaption = value; callbacks.onCaption(value); } };
const ease=(t: number)=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3),mix=(a: number,b: number,t: number)=>a+(b-a)*Math.max(0,Math.min(1,t));
function rect(x: number,y: number,w: number,h: number,color: string){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h)}
function text(t: string,x: number,y: number,size=8,col='#536247'){g.fillStyle=col;g.font=`${size}px "Pixelify Sans",monospace`;g.textAlign='center';g.fillText(t,x,y)}
function tree(x: number,y: number,s=1){g.save();g.translate(x,y);g.scale(s,s);rect(-3,0,6,23,'#8c7952');rect(-6,20,13,3,'#9fac77');rect(-17,-19,34,25,'#6c8b5b');rect(-22,-13,44,17,'#6c8b5b');rect(-17,-23,29,23,'#8ba674');rect(-11,-27,22,29,'#8ba674');rect(-15,-19,17,14,'#9fba84');rect(6,-9,12,10,'#789760');rect(-8,-22,6,3,'#b6c993');g.restore()}
function flower(x: number,y: number){rect(x,y,1,4,'#7a9b66');rect(x-1,y-2,3,3,'#fff2cb');rect(x,y-1,1,1,'#d9a75e')}
function scene(t: number){rect(0,0,480,270,'#b6c995');rect(0,0,480,61,'#afc58c');
for(let i=0;i<190;i++){let x=(i*137+31)%480,y=(i*67+19)%270;if(y<197)rect(x,y,1+(i%2),i%3?1:2,['#cad7a6','#a2bb81','#d8dfb5'][i%3]);}
rect(0,200,480,70,'#d9bd8e');rect(0,202,480,3,'#f1d8ab');rect(0,264,480,6,'#c7ae7c');for(let i=0;i<50;i++)rect((i*83)%480,214+(i*17)%43,3,1,'#c9ad7e');
rect(132,141,27,60,'#e9d2a5');for(let i=0;i<18;i++)rect(135+(i*7)%22,146+(i*13)%52,3,1,'#cfbc92');
for(let x=0;x<480;x+=19){if(x>117&&x<169)continue;rect(x,174,5,22,'#a2875e');rect(x-1,174,7,3,'#ccb382');}rect(0,181,124,3,'#b69b6c');rect(170,181,310,3,'#b69b6c');
tree(41,107,1.5);tree(451,100,1.6);tree(338,78,1.25);tree(383,108,.85);tree(20,178,.8);
g.drawImage(art.house,0,0,64,64,76,55,128,128);
// Door opens into a dark, warm interior.
if(t<.8){rect(153,145,14,27,'#66543e');rect(155,147,9,24,'#423f31');rect(166,146,3,25,'#9e8257');}
rect(297,160,41,5,'#9c8156');rect(299,165,3,11,'#846d4b');rect(331,165,3,11,'#846d4b');rect(297,151,41,6,'#c2a16c');rect(299,158,37,2,'#977d53');
rect(451,136,3,63,'#8b7551');rect(433,116,40,25,'#826a48');rect(435,118,36,21,'#f5e7ba');text('BUS',453,133,11);rect(446,195,13,3,'#9da979');
for(let i=0;i<27;i++)flower(13+(i*61)%460,124+(i*31)%49);
// A small personal sign beside the house.
rect(83,166,28,14,'#eadab2');rect(86,180,2,9,'#957e55');rect(105,180,2,9,'#957e55');text('HOME',97,175,7);
}
function drawBus(x: number,t: number,door: boolean,boarded: boolean){const y=155+(t>3.4&&t<3.7?Math.round(Math.sin((t-3.4)*24)):0);rect(x+17,y+101,193,3,'#b39f74');g.drawImage(art.bus,Math.round(x),y,222,111);
if(door){rect(x+152,y+40,26,51,'#715b42');rect(x+156,y+43,18,46,'#394a40');rect(x+153,y+91,25,4,'#d8b17c');rect(x+151,y+96,29,3,'#a68c5c');}
text(phase==='departing'?destination:'MIRRORVILLE',x+139,y+18,6,'#785a39');
if(boarded){g.save();g.beginPath();g.rect(Math.round(x+90),y+40,52,23);g.clip();g.drawImage(art.person,64,41,16,14,Math.round(x+117),y+52,12,10);g.restore();}}
function person(x: number,y: number,t: number,walking=true,facing=32){const frame=walking?Math.floor(t*7)%3:1;g.drawImage(art.person,walking?facing:64,frame*32,16,32,Math.round(x-8),Math.round(y-29),16,32)}
function boardingPose(t: number){
  if(t<.4)return {x:159,y:mix(168,190,t/.4),walking:true,facing:64};
  if(t<1.8)return {x:mix(159,450,(t-.4)/1.4),y:190,walking:true,facing:32};
  if(t<3.8)return {x:450,y:190,walking:false,facing:64};
  if(t<4.65)return {x:450,y:mix(190,264,(t-3.8)/.85),walking:true,facing:64};
  if(t<5.6)return {x:mix(450,375,(t-4.65)/.95),y:264,walking:true,facing:96};
  return {x:375,y:mix(264,243,(t-5.6)/.4),walking:true,facing:0};
}

function showMenu() { if (menuShown) return; menuShown = true; caption(''); callbacks.onReady(); }
function reset() { start = performance.now(); phase = 'boarding'; menuShown = false; completed = false; skipRequested = false; }
function render(now: number) {
  if (disposed) return;
  let t = (now - start) / 1000;
  if (reduced && phase === 'boarding') t = 6.5;
  g.clearRect(0, 0, 480, 270); scene(t);
  if (phase === 'departing') {
    const d = (now - departAt) / 1000;
    const x = 210 + Math.min(1, d / 1.9) ** 2 * 540;
    drawBus(x, t, false, true); caption(d < 1.8 ? 'Next stop: ' + destination : '');
    if ((reduced || d > 2.1) && !completed) { completed = true; callbacks.onArrival(); return; }
  } else {
    const busX = mix(-240, 210, ease((t - 2) / 1.4)), door = t > 3.65 && t < 6;
    drawBus(busX, t, door, t >= 6);
    if (t < 6) {
      const p = boardingPose(t); g.save();
      if (t >= 5.6) { g.beginPath(); g.rect(0, 245, 480, 25); g.rect(busX + 153, 195, 25, 50); g.clip(); }
      person(p.x, p.y, t, p.walking, p.facing); g.restore();
    }
    if (t < 1.8) caption('A little adventure awaits.');
    else if (t < 3.65) caption('Waiting for the shuttle.');
    else if (t < 6.4) caption('All aboard.');
    if (t >= 6.4) showMenu();
  }
  frame = requestAnimationFrame(render);
}
const files = { house: 'houses.png', person: 'character.png', bus: 'shuttle.png' } as const;
Promise.all(Object.entries(files).map(([key, file]) => new Promise<void>((resolve, reject) => {
  const image = new Image();
  image.onload = () => { art[key as keyof typeof art] = image; resolve(); };
  image.onerror = reject;
  image.src = `${import.meta.env.BASE_URL}assets/departure/${file}`;
}))).then(() => document.fonts.ready).then(() => {
  if (!disposed) {
    if (!start) start = performance.now();
    if (skipRequested) start = performance.now() - 6500;
    if (phase === 'departing') departAt = performance.now();
    frame = requestAnimationFrame(render);
  }
}).catch(() => { if (!disposed) callbacks.onError(); });
return {
  replay() { if (!disposed && phase !== 'departing') reset(); },
  skip() { skipRequested = true; start = performance.now() - 6500; showMenu(); },
  depart(name) { if (phase === 'departing') return; destination = name; phase = 'departing'; departAt = performance.now(); },
  dispose() { disposed = true; cancelAnimationFrame(frame); },
};
}
