import {barragePulse,barrageFlush} from '/animation.js';

export const VIEWS=['right','left','down','up'];
export const SLOTS=['head','body','armR','armL','legR','legL','tail','fur'];
export const LABELS={head:'Cabeça',body:'Tronco',armR:'Braço direito',armL:'Braço esquerdo',legR:'Perna direita',legL:'Perna esquerda',tail:'Cauda',fur:'Pelagem'};
export const MUTATIONS={head:'Chifre',body:'Carapaça',armR:'Garras',armL:'Garras',legR:'Pata robusta',legL:'Pata robusta',tail:'Cauda espinhosa',fur:'Pelo de musgo'};
export const DURATIONS={idle:1.92,walk:.48,rabbit:1.05,barrage:4.1,hit:.52,bleed:.7,death:1.15};
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const lerp=(a,b,t)=>a+(b-a)*t;

export async function loadArt(){
  const manifest=await fetch('./manifest.json').then(r=>{if(!r.ok)throw new Error('Não foi possível ler as peças.');return r.json();});
  const assets={};
  await Promise.all(Object.entries(manifest.assets).map(async([key,value])=>{
    const img=new Image();img.src=new URL(value.url,location.href);await img.decode();assets[key]=img;
  }));
  return {manifest,assets};
}

// Each anatomical limb has its own joint. Side changes select independent PNGs;
// no view is made by mirroring the rabbit's asymmetrical head.
export function anatomy(view){
  const side=view==='right'||view==='left',sign=view==='left'?-1:1;
  const out={
    head:{x:256,y:365,w:side?292:310,h:330,ax:.5,ay:1,r:0},
    body:{x:256,y:396,w:side?146:170,h:142,ax:.5,ay:.5,r:0},
    armR:{x:side?259:298,y:370,w:side?49:50,h:105,ax:.5,ay:.08,r:0},
    armL:{x:side?279:214,y:370,w:side?45:50,h:105,ax:.5,ay:.08,r:0},
    legR:{x:side?238:306,y:423,w:side?81:65,h:62,ax:.5,ay:.1,r:0},
    legL:{x:side?269:206,y:423,w:side?75:65,h:62,ax:.5,ay:.1,r:0},
    tail:{x:side?188:158,y:421,w:64,h:68,ax:.5,ay:.5,r:0},
    horn:{x:side?321:256,y:212,w:48,h:85,ax:.5,ay:.92,r:side?.30:0}
  };
  if(view==='left')for(const p of Object.values(out)){p.x=512-p.x;p.r*=-1;}
  if(view==='up'){
    out.tail={x:256,y:423,w:76,h:77,ax:.5,ay:.5,r:0};
    out.horn={x:256,y:197,w:42,h:72,ax:.5,ay:.92,r:0};
  }
  for(const p of Object.values(out)){p.sx=1;p.sy=1;}
  return {parts:out,side,sign,root:{x:0,y:0,r:0,sx:1,sy:1},expression:'neutral',flush:0};
}

export function samplePose(view,action,elapsed){
  const pose=anatomy(view),p=pose.parts,root=pose.root;
  const duration=DURATIONS[action];
  if(action==='death')elapsed=Math.min(duration,Math.max(0,elapsed));
  const t=clamp(elapsed/duration),s=pose.sign;
  const breathe=Math.sin(elapsed/1.92*Math.PI*2);
  p.body.sx=1+breathe*.012;p.body.sy=1-breathe*.008;
  p.head.y-=breathe*1.3;p.tail.r=Math.sin(elapsed*3)*.045;
  if(action==='walk'){
    const phase=elapsed/.48%1;
    const air=Math.sin(clamp((phase-.15)/.68)*Math.PI);
    const crouch=phase<.15?Math.sin(phase/.15*Math.PI):phase>.83?Math.sin((phase-.83)/.17*Math.PI):0;
    root.y=-air*47+crouch*9;
    p.body.sy=1-crouch*.08;
    p.head.y+=crouch*6;
    p.armR.r=-s*air*.32;p.armL.r=-s*air*.28;
    p.legR.r=s*air*.65;p.legL.r=s*air*.48;
    p.tail.r=-s*air*.24;
  }else if(action==='rabbit'){
    const prep=smooth(t/.35),strike=smooth((t-.35)/.11),retract=smooth((t-.6)/.32),kick=strike*(1-retract);
    p.head.r=-s*(prep-strike)*.045;p.head.y+=prep*(1-retract)*4;
    p.body.r=-s*kick*.08;
    const leg=pose.side?p.legR:p.legL;
    if(kick>.05)pose.kickingLeg=pose.side?'legR':'legL';
    leg.r=-s*kick*1.22;leg.y-=kick*24;leg.x+=s*kick*22;leg.sx=1+kick*.08;
    p.armR.r=s*kick*.25;p.armL.r=s*kick*.15;
    root.x=-s*kick*7;
  }else if(action==='barrage'){
    const progress=clamp(elapsed/2.3),pulse=elapsed<2.3?barragePulse(progress):0;
    pose.expression=elapsed>=2.3?'relief':progress<.18?'panic':'strain';
    pose.flush=elapsed<2.3?barrageFlush(progress):0;
    p.body.sy=1-pulse*.048;p.body.sx=1+pulse*.035;
    p.head.y+=pulse*5;p.head.r=s*pulse*.015;
    p.tail.r=s*pulse*.12;
    p.armR.r=-pulse*.04;p.armL.r=pulse*.04;
  }else if(action==='hit'||action==='bleed'){
    const recoil=Math.sin(t*Math.PI)*(1-t);
    root.x=-s*recoil*(action==='bleed'?5:18);p.body.r=-s*recoil*.13;
    p.head.r=-s*recoil*.13;p.head.y+=recoil*4;
    p.armR.r=-s*recoil*.20;p.armL.r=-s*recoil*.12;pose.expression='panic';
  }else if(action==='death'){
    const fall=smooth((t-.1)/.72);
    root.r=s*fall*1.36;root.x=-s*fall*125;root.y=-fall*50;root.pivotY=lerp(468,400,fall);
    p.head.r=s*fall*.08;p.armR.r=-s*fall*.42;p.armL.r=s*fall*.23;
    p.legR.r=-s*fall*.35;p.legL.r=s*fall*.14;p.tail.r=s*fall*.15;
    pose.expression='defeat';
  }
  // The horn is a child of the head, so it follows tilt, squash and recoil.
  return pose;
}

const tintCache=new WeakMap();
const eyeMaskCache=new WeakMap();
function eyeMask(image,pixels,view){
  if(eyeMaskCache.has(image))return eyeMaskCache.get(image);
  const w=image.width,h=image.height,mask=new Uint8Array(w*h);
  const seeds=view==='down'?[[.36,.73],[.70,.77]]:view==='right'?[[.69,.75]]:view==='left'?[[.31,.75]]:[];
  for(const [u,v] of seeds){
    const cx=Math.round(u*w),cy=Math.round(v*h);let seed=-1;
    for(let radius=0;radius<25&&seed<0;radius++)for(let dy=-radius;dy<=radius&&seed<0;dy++)for(let dx=-radius;dx<=radius;dx++){
      const x=cx+dx,y=cy+dy,o=(y*w+x)*4;
      if(x>=0&&y>=0&&x<w&&y<h&&pixels[o]>190&&pixels[o+1]>180&&pixels[o+2]>145&&pixels[o+3]>128){seed=y*w+x;break;}
    }
    if(seed<0)continue;
    const seen=new Uint8Array(w*h),stack=[seed],group=[];seen[seed]=1;
    while(stack.length){
      const at=stack.pop();group.push(at);const x=at%w;
      for(const next of [at-1,at+1,at-w,at+w]){
        const o=next*4;
        if(next>=0&&next<w*h&&Math.abs(next%w-x)<=1&&!seen[next]&&pixels[o+3]>64&&Math.min(pixels[o],pixels[o+1],pixels[o+2])>75){seen[next]=1;stack.push(next);}
      }
    }
    // Closed ink outlines bound the eye whites. Reject an accidental outside seed.
    if(group.length<w*h*.18)for(const at of group)mask[at]=1;
  }
  eyeMaskCache.set(image,mask);return mask;
}
function tint(image,fur,flush,eyeView=''){
  const level=Math.round(flush*12),key=`${fur}:${level}:${eyeView}`;
  let cache=tintCache.get(image);if(!cache){cache=new Map();tintCache.set(image,cache);}
  if(cache.has(key))return cache.get(key);
  if(!fur&&!level)return image;
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
  const protectedEyes=eyeView?eyeMask(image,d,eyeView):null;
  for(let i=0;i<d.length;i+=4){
    const [r,g,b]=[d[i],d[i+1],d[i+2]];
    // Only cream/grey fur pixels: preserve ink, whites of eyes, teeth and pink ears.
    let cream=smooth((Math.min(r,g)-65)/35)*smooth((g-b-2)/12)*smooth((r-g-4)/11)*smooth((60-(r-g))/10);
    if(protectedEyes?.[i/4])cream=0;
    if(cream&&fur){d[i]=lerp(r,r*.65,cream);d[i+1]=lerp(g,g*.83,cream);d[i+2]=lerp(b,b*.63,cream);}
    if(cream&&level){const f=level/12*.30*cream;d[i]=lerp(d[i],207,f);d[i+1]=lerp(d[i+1],80,f);d[i+2]=lerp(d[i+2],74,f);}
  }
  ctx.putImageData(pixels,0,0);cache.set(key,canvas);return canvas;
}

export function renderRig(ctx,art,{view='down',action='idle',elapsed=0,mutations={},mode='assembled',isolate='head',guides=false}={}){
  const pose=samplePose(view,action,elapsed),p=pose.parts,{root}=pose,drawn=[];
  const exploded=mode==='exploded',only=mode==='isolate';
  const pivotY=root.pivotY??468;
  ctx.save();ctx.translate(256+root.x,pivotY+root.y);ctx.rotate(root.r);ctx.scale(root.sx,root.sy);ctx.translate(-256,-pivotY);
  let order;
  if(view==='up')order=['legR','legL','armR','armL','body','head','tail'];
  else if(view==='right')order=['armL','legL','tail','legR','body','armR','head'];
  else if(view==='left')order=['armR','legR','tail','legL','body','armL','head'];
  else order=['tail','legR','legL','body','armR','armL','head'];
  if(pose.kickingLeg){order=order.filter(part=>part!==pose.kickingLeg);order.splice(order.indexOf('head'),0,pose.kickingLeg);}

  function draw(part,slot=part){
    if(only&&slot!==isolate&&isolate!=='fur')return;
    const mutant=!!mutations[part]&&part!=='head';
    const type=mutant?'mutation':'base';
    let key=`${type}-${view}-${part}`;
    if(part==='head'&&pose.expression!=='neutral')key=`expressions-${view}-${pose.expression}`;
    const image=art.assets[key]||art.assets[`base-${view}-${part}`];
    if(!image)throw new Error(`Peça ausente: ${key}`);
    const at=p[part],q={...at};
    if(mutant){
      if(part.startsWith('arm')){q.w*=1.13;q.h*=1.04;}
      if(part.startsWith('leg')){q.w*=1.24;q.h*=1.05;}
      if(part==='tail'){q.w*=1.6;q.h*=1.15;}
      if(part==='body')q.w*=1.06;
    }
    if(exploded){
      const offsets={head:[0,-36],body:[0,20],armR:[view==='left'?-105:105,4],armL:[view==='left'?105:-105,4],legR:[75,48],legL:[-75,48],tail:[view==='up'?125:pose.sign*-105,0]};
      q.x+=offsets[part][0];q.y+=offsets[part][1];
    }
    ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.r);ctx.scale(q.sx,q.sy);
    const eyes=part==='head'&&['neutral','panic'].includes(pose.expression)?view:'';
    ctx.drawImage(tint(image,mutations.fur,part==='head'?pose.flush:0,eyes),-q.w*q.ax,-q.h*q.ay,q.w,q.h);
    if(guides){ctx.strokeStyle='#e8bb65';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.strokeRect(-q.w*q.ax,-q.h*q.ay,q.w,q.h);ctx.setLineDash([]);ctx.fillStyle='#f4cf87';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();}
    ctx.restore();drawn.push({part,slot,key,x:q.x,y:q.y,rotation:q.r,mutant});
    if(part==='head'&&mutations.head){
      const horn=art.assets[`mutation-${view}-horn`];
      if(horn){
        const h=p.horn;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.r);ctx.scale(q.sx,q.sy);ctx.translate(h.x-at.x,h.y-at.y);ctx.rotate(h.r);ctx.drawImage(horn,-h.w*h.ax,-h.h*h.ay,h.w,h.h);ctx.restore();
        drawn.push({part:'horn',slot:'head',key:`mutation-${view}-horn`,parent:'head'});
      }
    }
  }
  for(const part of order)draw(part);
  ctx.restore();return {pose,drawn};
}

export function originalFrame(action,elapsed){
  const p=clamp(elapsed/(action==='barrage'?2.3:DURATIONS[action]));
  if(action==='barrage')return elapsed>=2.3?15:p<.18?12:barragePulse(p)>.48?14:13;
  if(action==='walk')return p<.17?4:p<.36?5:p<.82?6:p<.96?7:0;
  if(action==='rabbit')return p<.12?0:p<.38?8:p<.45?9:p<.60?10:p<.9?11:0;
  if(action==='death')return p<.2?20:p<.47?21:p<.78?22:23;
  if(action==='hit'||action==='bleed')return 16+Math.min(3,Math.floor(p*4));
  return p<.18?0:p<.42?1:p<.76?3:p<.81?2:0;
}
