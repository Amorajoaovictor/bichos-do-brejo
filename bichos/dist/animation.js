import { Group,Vector3 } from './vendor/three.module.js';
import { LION_CUB_TIMING,LION_CUB_EVENTS } from './lion-cub-frames.js';
import { ZEBRA_DURATIONS,ZEBRA_IMPACT } from './zebra-png-frames.js';

const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*t;
const headParts=new Set(['head','eyeL','eyeR','earL','earR','muzzle','throat','openMouth','mut_eye','mut_horn','rage','mouth','jaw','fangs']);

// Transform parents carry the face as one unit. Every limb still has its own
// joint, so the eyes cannot drift off the head during a turn or a recoil.
export function bindRig(rig,id){
  const {art,parts}=rig;
  const torso=new Group(),skull=new Group();
  torso.position.set(150,id==='rosnaldo'?280:290,0);art.add(torso);
  skull.position.set(0,(id==='rosnaldo'?190:235)-torso.position.y,0);torso.add(skull);
  for(const [name,p] of Object.entries(parts)){
    const parent=headParts.has(name)?skull:torso;
    const parentX=150,parentY=parent===skull?(id==='rosnaldo'?190:235):torso.position.y;
    parent.add(p);p.position.x-=parentX;p.position.y-=parentY;
  }
  rig.joints={...parts,torso,skull};rig.id=id;rig.facing=1;
  rig.rest=new Map(Object.values(rig.joints).map(p=>[p,{position:p.position.clone(),scale:p.scale.clone(),rotation:p.rotation.clone()}]));
  rig.artOrigin=art.position.clone();rig.artScale=art.scale.clone();
  rig.recoil=null;rig.death=null;rig.air=0;
}

export function resetPose(rig){
  if(rig.pngRig){rig.resetPose();return;}
  for(const [p,rest] of rig.rest){p.position.copy(rest.position);p.scale.copy(rest.scale);p.rotation.copy(rest.rotation);}
  rig.art.position.copy(rig.artOrigin);rig.art.rotation.z=0;rig.art.scale.copy(rig.artScale);
  if(rig.parts.openMouth)rig.parts.openMouth.visible=false;
  if(rig.parts.can)rig.parts.can.visible=true;
  rig.air=0;
}

// Add a pose to the current idle rather than accumulating changes each frame.
function joint(rig,name,{x=0,y=0,r=0,sx=1,sy=1}={},direction=1){
  const p=rig.joints[name];if(!p)return;
  // The pelvis is above its own facing mirror; its translation and lean are
  // therefore in screen space, while its children move in character space.
  if(name==='torso')direction*=rig.facing;
  p.position.x+=x*direction;p.position.y+=y;p.rotation.z+=r*direction;p.scale.x*=sx;p.scale.y*=sy;
}

export function idlePose(rig,time){
  if(rig.pngRig){rig.idlePose?.(time);return;}
  resetPose(rig);
  const t=time+(rig.phase||0),boss=rig.id==='rosnaldo',frog=rig.id==='frog';
  const breath=Math.sin(t*(boss?1.45:frog?1.8:2.35));
  joint(rig,'body',{sx:1+breath*.018,sy:1-breath*.012});
  joint(rig,'skull',{y:-breath*(boss?1.4:frog?1.1:1.9)});
  const period=boss?6.8:frog?4.1:5.4;
  const heldEffort=rig.id==='rabbit'&&(rig.expression==='strain'||(rig.actionActive&&rig.expression==='panic'));
  for(const [name,delay] of [['eyeL',0],['eyeR',.055],['mut_eye',0]]){
    const cycle=(t+delay)%period,blink=!heldEffort&&cycle<.16?Math.max(.07,Math.abs(cycle-.08)/.08):1;
    joint(rig,name,{sy:blink});
  }
  joint(rig,'mut_tail',{r:Math.sin(t*1.7)*.07});
  if(rig.id==='rabbit'){
    const twitch=Math.pow(Math.max(0,Math.sin(t*.9)),16);
    joint(rig,'earL',{r:Math.sin(t*1.8)*.025+Math.sin(t*24)*twitch*.085});joint(rig,'earR',{r:Math.sin(t*1.7+.8)*.04});
    joint(rig,'tail',{r:Math.sin(t*2.3)*.055});joint(rig,'muzzle',{x:Math.sin(t*8)*.35});
  }else if(rig.id==='rat'){
    joint(rig,'tail',{r:Math.sin(t*1.35)*.1});joint(rig,'earL',{r:Math.sin(t*2)*.035});joint(rig,'earR',{r:Math.sin(t*2+.8)*.045});
    joint(rig,'muzzle',{x:Math.sin(t*17)*Math.pow(Math.max(0,Math.sin(t*.9)),5)*1.6});
    joint(rig,'armL',{r:Math.sin(t*2)*.025});joint(rig,'armR',{r:-Math.sin(t*2)*.025});
  }else if(rig.id==='raccoon'){
    joint(rig,'tail',{r:Math.sin(t*1.5)*.055});
    joint(rig,'earL',{r:Math.sin(t*2.1)*.025});joint(rig,'earR',{r:Math.sin(t*1.7+.6)*.03});
    joint(rig,'armL',{r:breath*.015});joint(rig,'armR',{r:-breath*.015});
  }else if(frog){
    joint(rig,'throat',{sx:1+breath*.105,sy:1+breath*.11,y:breath*1.7});
    joint(rig,'eyeL',{r:Math.sin(t*.7)*.025});joint(rig,'eyeR',{r:Math.sin(t*.9+1)*.025});
    joint(rig,'armL',{r:breath*.012});joint(rig,'armR',{r:-breath*.012});
  }else{
    joint(rig,'maneBack',{r:Math.sin(t*.85)*.018});joint(rig,'bib',{r:Math.sin(t*.85+.55)*.025});
    joint(rig,'tail',{r:Math.sin(t*1.1)*.12});joint(rig,'jaw',{y:Math.pow(Math.max(0,Math.sin(t*.72)),10)*6,r:Math.sin(t*.7)*.018});
    joint(rig,'earL',{r:Math.sin(t*2.4)*.035});joint(rig,'earR',{r:Math.sin(t*1.8+.8)*.04});
  }
  // Mirroring around the pelvis keeps a facing change from moving the feet.
  rig.joints.torso.scale.x*=rig.facing;
}

export const STEP_DURATION={rabbit:.48,rat:.58,raccoon:.62,frog:.6};
export function movementSample(id,progress){
  const p=clamp(progress);
  if(id==='rat'||id==='raccoon')return {travel:p,lift:Math.abs(Math.sin(p*Math.PI*4))*.045};
  // Feet stay planted while the animal crouches, then push off and land.
  const flight=clamp((p-.17)/.65);
  return {travel:smooth(flight),lift:Math.sin(flight*Math.PI)*(id==='frog'?.38:.27)};
}

export function locomotionPose(rig,progress,direction=1){
  if(rig.pngRig){rig.locomotionPose?.(progress);return;}
  const p=clamp(progress),id=rig.id;
  const vertical=rig.direction==='up'||rig.direction==='down',forward=rig.direction==='up'?-1:1;
  const {lift}=movementSample(id,p);rig.air=lift;
  if(id==='rat'||id==='raccoon'){
    const stride=Math.sin(p*Math.PI*4),weight=Math.cos(p*Math.PI*8),blend=Math.min(1,p/.12,(1-p)/.12);
    for(const [name,offset] of [['legL',0],['legR',.5]]){
      const phase=(p*2+offset)%1,planted=phase<.5;
      // Four small footfalls per tile. During support, the paw moves backward
      // at the board's forward speed; the returning paw lifts off the ground.
      const footX=(planted?mix(33,-33,phase*2):mix(-33,33,smooth((phase-.5)*2)))*blend;
      const lift=planted?0:Math.sin((phase-.5)*2*Math.PI)*18*blend;
      joint(rig,name,vertical?{r:-footX/180,y:footX*.55*forward-lift,x:0}:{r:-footX/75,y:-lift,x:footX*.7},direction);
    }
    joint(rig,'armL',{r:-stride*.48},direction);joint(rig,'armR',{r:stride*.48},direction);
    joint(rig,'torso',{r:vertical?0:-.08*Math.sin(p*Math.PI),y:weight*2},direction);
    joint(rig,'skull',{r:stride*.035,y:-weight*1.5},direction);
    joint(rig,'tail',{r:stride*.23},direction);joint(rig,'earL',{r:-stride*.1},direction);joint(rig,'earR',{r:stride*.1},direction);
  }else{
    const crouch=p<.17?Math.sin(p/.17*Math.PI/2):p>.82?Math.sin((1-p)/.18*Math.PI):0;
    const flight=clamp((p-.17)/.65),spring=Math.sin(flight*Math.PI),push=Math.sin(clamp((p-.17)/.3)*Math.PI);
    joint(rig,'torso',{y:crouch*11,sy:1-crouch*.12+spring*.06,sx:1+crouch*.06-spring*.025,r:vertical?0:-spring*.08},direction);
    joint(rig,'legL',{r:-crouch*.3+push*.55-spring*.38,y:-spring*9,sx:1+push*.08});
    joint(rig,'legR',{r:crouch*.3-push*.55+spring*.38,y:-spring*9,sx:1+push*.08});
    joint(rig,'armL',{r:spring*(id==='frog'?.55:.42),y:-spring*6});joint(rig,'armR',{r:-spring*(id==='frog'?.55:.42),y:-spring*6});
    joint(rig,'skull',{y:-crouch*3,r:spring*.06},direction);
    joint(rig,'earL',{r:spring*.28-crouch*.1},direction);joint(rig,'earR',{r:spring*.32},direction);joint(rig,'tail',{r:-spring*.3},direction);
    if(id==='frog')joint(rig,'throat',{sy:1-spring*.1});
  }
  if(vertical){
    const stride=Math.sin(p*Math.PI);
    joint(rig,'skull',{y:forward*stride*4,r:0});
    joint(rig,'armL',{y:forward*stride*5});joint(rig,'armR',{y:forward*stride*5});
  }
}

// Sparse key poses, interpolated by joint. Release/impact times are shared with
// combat so a projectile leaves the hand/mouth and damage lands on contact.
export const ACTIONS={
  zebraKick:{duration:ZEBRA_DURATIONS.zebraKick,release:.48,impact:ZEBRA_IMPACT,frames:[[0,{}],[1,{}]]},
  throw:{duration:.95,release:.5,impact:.78,frames:[[0,{}],[1,{}]]},
  cubBite:{duration:LION_CUB_TIMING.cubBite,release:.42,impact:LION_CUB_EVENTS.cubBite.impact,frames:[[0,{}],[1,{}]]},
  raccoon:{duration:1.2,release:.5,impact:.76,frames:[
    [0,{}],
    [.1,{armR:{r:-.45},skull:{r:-.015}}],
    [.28,{torso:{x:-3,y:3,r:-.035},skull:{r:.035},armR:{r:-3.58},armL:{r:.12},tail:{r:-.1}}],
    [.39,{torso:{x:-4,y:3,r:-.045},skull:{r:.045},armR:{r:-3.4},tail:{r:-.13}}],
    [.5,{torso:{x:5,r:.045},skull:{r:-.045},armR:{r:-2.03},armL:{r:-.1},tail:{r:.1}}],
    [.64,{torso:{x:6,y:2,r:.05},skull:{r:-.05},armR:{r:-1.1},tail:{r:.15}}],
    [.82,{torso:{x:2,y:1,r:.015},skull:{r:-.015},armR:{r:-.3},tail:{r:.05}}],
    [1,{}]]},
  barrage:{duration:2.3,release:.18,impact:.84,frames:[
    [0,{}],
    [.10,{torso:{y:3,r:.025,sy:.98},skull:{r:-.005,y:1},armL:{r:.04},armR:{r:-.04},earL:{r:-.035}}],
    [.18,{torso:{y:5,r:.055,sy:.96},skull:{r:.015,y:3},tail:{r:-.28,y:-2},armL:{r:.06},armR:{r:-.055},earL:{r:-.06},earR:{r:-.025}}],
    [.73,{torso:{y:5,r:.055,sy:.96},skull:{r:.015,y:3},tail:{r:-.28,y:-2},armL:{r:.06},armR:{r:-.055},earL:{r:-.06},earR:{r:-.025}}],
    [.86,{torso:{y:3,r:.035,sy:.98},skull:{r:-.005,y:1},tail:{r:-.15},armL:{r:.025},armR:{r:-.025},earL:{r:-.025}}],
    [1,{}]]},
  urine:{duration:1.3,release:.43,impact:.72,frames:[
    [0,{}],
    [.3,{torso:{y:5,r:-.13},skull:{r:.12,y:-4},legR:{r:-.75,y:-13},armL:{r:.4},armR:{r:-.45}}],
    [.46,{torso:{r:.14,x:7},skull:{r:-.14},legR:{r:-.9,y:-16},armL:{r:.6},armR:{r:-.6}}],
    [.76,{torso:{r:.14,x:4},skull:{r:-.14},legR:{r:-.9,y:-16},armL:{r:.6},armR:{r:-.6}}],
    [1,{}]]},
  rabbit:{duration:1.05,release:.43,impact:.48,frames:[
    [0,{}],
    [.25,{torso:{x:-7,y:9,r:-.16,sy:.9},skull:{r:.18},legR:{r:.8,y:-15},armL:{r:.5},armR:{r:-.45},earL:{r:-.28},earR:{r:-.22}}],
    [.43,{torso:{x:24,y:-7,r:.2,sy:1.04},skull:{r:-.22,x:-8},legR:{r:-1.3,sy:1.9,y:-5},legL:{r:.18},armL:{r:.7},armR:{r:-.75},earL:{r:.4},earR:{r:.34}}],
    [.53,{torso:{x:27,y:-6,r:.22},skull:{r:-.24},legR:{r:-1.4,sy:1.85,y:-5},armL:{r:.65},armR:{r:-.7}}],
    [.74,{torso:{x:5,y:8,r:-.08,sy:.94},legR:{r:.5,y:-8},skull:{r:.1},earL:{r:-.2},earR:{r:-.25}}],
    [1,{}]]},
  rat:{duration:1.12,release:.42,impact:.68,frames:[
    [0,{}],
    [.28,{torso:{x:-6,y:5,r:-.18},skull:{r:.13,x:-3},armR:{r:-2.7,x:14,y:-4,sy:2},armL:{r:.65},legL:{r:.2},legR:{r:-.25},tail:{r:-.35},earL:{r:-.2},earR:{r:-.15}}],
    [.42,{torso:{x:10,y:-4,r:.2},skull:{r:-.16,x:7},armR:{r:-1.35,x:12,y:-10,sy:1.3},armL:{r:-.7},legL:{r:-.3},legR:{r:.25},tail:{r:.3}}],
    [.55,{torso:{x:12,y:2,r:.25},skull:{r:-.16},armR:{r:-.55,x:8},armL:{r:-.3},tail:{r:.4},earL:{r:.17},earR:{r:.2}}],
    [.8,{torso:{r:-.06,y:3},armR:{r:.25},tail:{r:-.16}}],
    [1,{}]]},
  frog:{duration:1.3,release:.48,impact:.72,frames:[
    [0,{}],
    [.31,{torso:{y:10,sy:.88,sx:1.08},skull:{x:-5,r:-.12},throat:{sx:1.48,sy:1.5},armL:{r:-.24},armR:{r:.24},legL:{r:-.24},legR:{r:.24}}],
    [.46,{torso:{y:6,sy:.94},skull:{x:-7,y:-3,r:-.16},throat:{sx:1.6,sy:1.6},openMouth:{sy:.3}}],
    [.51,{torso:{x:12,y:-4,r:.12,sy:1.04},skull:{x:16,y:2,r:.09},throat:{sx:.85,sy:.72},openMouth:{sy:1},armL:{r:.4},armR:{r:-.4},legL:{r:.15},legR:{r:-.15}}],
    [.64,{torso:{x:-8,y:7,r:-.1,sy:.94},skull:{x:-5,r:-.12},throat:{sx:.9,sy:.85},openMouth:{sy:.65},armL:{r:.18},armR:{r:-.18}}],
    [.82,{torso:{y:3},throat:{sx:1.08,sy:1.08}}],
    [1,{}]]},
  bite:{duration:1.2,release:.46,impact:.55,frames:[
    [0,{}],
    [.3,{torso:{x:-7,y:8,r:-.09,sy:.94},skull:{x:-8,y:-5,r:-.12},jaw:{y:19,r:.14},mouth:{sy:1.3},maneBack:{r:-.08},bib:{r:-.12},armL:{r:.2},armR:{r:-.2}}],
    [.48,{torso:{x:14,y:-4,r:.12},skull:{x:18,y:6,r:.18},jaw:{y:26,r:.12},mouth:{sy:1.35},armL:{r:-.5,y:-6},armR:{r:-.2,y:-3},maneBack:{r:.1},bib:{r:.13}}],
    [.57,{torso:{x:18,r:.14},skull:{x:20,y:8,r:.15},jaw:{y:-5,r:-.08},mouth:{sy:.75},armL:{r:-.4},maneBack:{r:.12}}],
    [.76,{torso:{x:3,y:6,sy:.96},skull:{r:-.06},jaw:{y:5},bib:{r:-.08}}],
    [1,{}]]},
  roar:{duration:1.8,release:.47,impact:.55,frames:[
    [0,{}],
    [.1,{torso:{x:-3,y:5,sy:.97},skull:{x:4,y:5,r:.05},eyeL:{sy:.8},jaw:{y:-2},tail:{r:-.12}}],
    [.2,{torso:{x:-7,y:11,sy:.92,sx:1.035},skull:{x:10,y:12,r:.11},eyeL:{sy:.62},jaw:{y:-3},maneBack:{x:-4,r:.035,sx:1.04},bib:{r:.08},armL:{r:.16},armR:{r:-.16},tail:{r:-.24}}],
    [.32,{torso:{x:-9,y:17,sy:.86,sx:1.07},skull:{x:19,y:19,r:.16},eyeL:{sy:.52},jaw:{y:-4},mouth:{sy:.6},maneBack:{x:-9,r:.065,sx:1.07},bib:{y:5,r:.13},armL:{r:.25},armR:{r:-.23},earL:{r:.12},earR:{r:.14},tail:{r:-.32}}],
    [.41,{torso:{x:-5,y:11,sy:.92,sx:1.08},skull:{x:13,y:10,r:.05},jaw:{y:12},mouth:{sy:1.3},eyeL:{sy:.58},maneBack:{x:-5,r:.025,sx:1.08},bib:{r:.05},armL:{r:.16},armR:{r:-.15},tail:{r:-.13}}],
    [.49,{torso:{x:6,y:-6,sy:1.04,sx:1.04},skull:{x:5,y:-17,r:-.2},jaw:{y:37,r:.13,sy:1.15},mouth:{y:9,sx:1.12,sy:2.05},muzzle:{y:-4,r:-.08},fangs:{y:-3,r:-.06},eyeL:{sy:.62},maneBack:{x:-10,y:-5,r:-.075,sx:1.09,sy:1.045},bib:{x:-4,y:-3,r:-.13,sy:1.1},armL:{r:-.15},armR:{r:.12},earL:{r:-.23},earR:{r:-.18},tail:{r:.28}}],
    [.59,{torso:{x:7,y:-9,sy:1.065,sx:1.03},skull:{x:3,y:-23,r:-.25},jaw:{y:43,r:.16,sy:1.18},mouth:{y:12,sx:1.15,sy:2.35},muzzle:{y:-6,r:-.1},fangs:{y:-5,r:-.08},eyeL:{sy:.5},maneBack:{x:-13,y:-7,r:-.09,sx:1.11,sy:1.055},bib:{x:-6,y:-5,r:-.18,sy:1.12},armL:{r:-.17},armR:{r:.14},earL:{r:-.27},earR:{r:-.22},tail:{r:.35}}],
    [.69,{torso:{x:4,y:-6,sy:1.04},skull:{x:5,y:-16,r:-.18},jaw:{y:37,r:.12,sy:1.12},mouth:{y:9,sx:1.1,sy:2.05},muzzle:{y:-3,r:-.06},fangs:{y:-3},eyeL:{sy:.58},maneBack:{x:-8,y:-3,r:-.055,sx:1.075},bib:{x:-3,r:-.1,sy:1.07},tail:{r:.25}}],
    [.8,{torso:{x:1,y:2,sy:.985},skull:{x:10,y:2,r:.06},jaw:{y:17,r:.06},mouth:{y:3,sy:1.45},eyeL:{sy:.7},maneBack:{x:3,r:.035,sx:1.025},bib:{r:.055},tail:{r:-.14}}],
    [.91,{torso:{y:4,sy:.98},skull:{x:4,y:4,r:.045},jaw:{y:4},mouth:{sy:1.08},maneBack:{r:.016},tail:{r:-.06}}],
    [1,{}]]},
};

ACTIONS.bottle={...ACTIONS.raccoon};

export function sampleAction(kind,progress){
  const frames=ACTIONS[kind].frames,p=clamp(progress);
  let index=1;while(index<frames.length-1&&p>frames[index][0])index++;
  const [t0,a]=frames[index-1],[t1,b]=frames[index],t=smooth((p-t0)/(t1-t0)),pose={};
  for(const name of new Set([...Object.keys(a),...Object.keys(b)])){
    pose[name]={};for(const key of new Set([...Object.keys(a[name]||{}),...Object.keys(b[name]||{})])){
      const fallback=key==='sx'||key==='sy'?1:0;
      pose[name][key]=mix(a[name]?.[key]??fallback,b[name]?.[key]??fallback,t);
    }
  }
  return pose;
}

export function actionPose(rig,kind,progress,direction=1){
  if(rig.pngRig){rig.showActionFrame(kind,progress);return;}
  const raccoonThrow=kind==='raccoon'||kind==='bottle';
  const rootedBarrage=kind==='barrage'&&rig.id==='rabbit'&&progress>0&&progress<1;
  const planted=rootedBarrage||(raccoonThrow&&progress>0&&progress<1)||(kind==='roar'&&rig.views&&!rig.showActionFrame&&progress>0&&progress<1)?pawContacts(rig):null;
  const pose=sampleAction(kind,progress);
  // O leão é desenhado a partir da prancha: a mandíbula e a cabeça são recortes,
  // então o curso do movimento fica menor para o recorte não abrir costura.
  if(rig.id==='rosnaldo'){
    if(pose.jaw)pose.jaw.y=(pose.jaw.y||0)*.55;
    if(pose.skull){pose.skull.x=(pose.skull.x||0)*.7;pose.skull.y=(pose.skull.y||0)*.7;}
  }
  const vertical=rig.direction==='up'||rig.direction==='down',forward=rig.direction==='up'?-1:1;
  // Side poses extend along local X. Front/back poses thrust along local Y,
  // keeping the head upright and the attacking limb on the target's axis.
  for(let [name,transform] of Object.entries(pose)){
    if(vertical){
      transform={...transform};
      if(name==='torso'||name==='skull'){
        transform.y=(transform.y||0)+(transform.x||0)*forward*.55;transform.x=0;transform.r=(transform.r||0)*.12;
      }
      if(kind==='rabbit'&&name==='legR'){
        transform.r=(transform.r||0)*.16;transform.y=(transform.y||0)+Math.max(0,(transform.sy||1)-1)*forward*32;
        transform.sy=1+Math.max(0,(transform.sy||1)-1)*.45;
      }
      if(kind==='rat'&&name==='armR'){
        const throwPhase=progress<=.28||progress>=.58?0:Math.sin((progress-.28)/.3*Math.PI);
        transform.x=0;transform.r=(transform.r||0)*.18;transform.y=(transform.y||0)+forward*throwPhase*38;
      }
      if(raccoonThrow&&name==='armR'){
        const recover=1-smooth((progress-.64)/.36);
        if(progress<.5){
          const thrust=smooth((progress-.39)/.11);
          transform.r=(rig.direction==='up'?-1:1)*mix(Math.min(2.9,Math.abs(transform.r||0)),.18,thrust);
          transform.sy=mix(1,.35,thrust);transform.y=forward*14*thrust;
        }
        else{transform.r=(rig.direction==='up'?-1:1)*.18*recover;transform.sy=1-.65*recover;transform.y=forward*14*recover;}
        transform.x=0;
      }
      joint(rig,name,transform);
    }else{
      // A mirrored profile mirrors the whole skeleton once, including sockets.
      const localDirection=rig.views?(rig.id==='rosnaldo'&&rig.direction==='left'?-1:1):direction*rig.facing;
      if(!rig.views&&kind==='rabbit'&&direction<0){if(name==='legR')name='legL';else if(name==='legL')name='legR';}
      joint(rig,name,transform,localDirection);
    }
  }
  if(kind==='frog')rig.parts.openMouth.visible=progress>.44&&progress<.72;
  if(kind==='raccoon'&&rig.parts.can)rig.parts.can.visible=progress<=.08||progress>=1;
  if(kind==='roar'&&progress>.47&&progress<.72){
    const tremble=Math.sin(progress*150),ripple=Math.sin(progress*95);
    joint(rig,'skull',{x:tremble*1.15,y:Math.abs(tremble)*.7});joint(rig,'maneBack',{r:ripple*.014,x:ripple*1.3});joint(rig,'bib',{r:Math.sin(progress*95-1)*.022});joint(rig,'tail',{r:Math.sin(progress*60)*.035});
  }
  if(rootedBarrage){
    // Ten small contractions follow the ten actual releases. A slight downward
    // nod sells the effort, carrying the face and ears on the skull joint.
    const pulse=barragePulse(progress);
    joint(rig,'torso',vertical?{y:pulse*1.3}:{x:pulse*1.8,y:pulse*.7});
    joint(rig,'skull',{y:pulse*2.6,r:vertical?0:pulse*.015});joint(rig,'tail',{r:-pulse*.06});
  }
  if(planted)plantPaws(rig,planted);
  if(rig.id==='rosnaldo'&&(kind==='bite'||kind==='roar'))rig.showActionFrame?.(kind,progress);
}

export function barragePulse(progress){
  const elapsed=progress*ACTIONS.barrage.duration;
  for(let shot=0;shot<10;shot++){
    const phase=(elapsed-(.42+shot*.13))/.1;
    if(phase>=0&&phase<1)return Math.sin(phase*Math.PI)**2;
  }
  return 0;
}

export function barrageEmotion(progress){
  if(progress>=1)return 'relief';
  // Hold the effort through the entire volley. Reopening the eyes between
  // individual shots read as frantic blinking and made the face flash.
  return progress<.18?'panic':'strain';
}

export function barrageFlush(progress){
  return smooth(progress/.35)*(1-smooth((progress-.76)/.24));
}

function pawContacts(rig){
  const side=rig.direction==='left'||rig.direction==='right';
  const points=rig.id==='raccoon'?{legL:[127,331],legR:[195,331]}:rig.id==='rabbit'?(side?
    {legL:[133.5,328],legR:[164.8,327],armL:[145.1,333],armR:[173,333]}:
    rig.direction==='up'?{legL:[100,325],legR:[200,325],armL:[101,329],armR:[199,329]}:
    {legL:[98,327],legR:[211,327],armL:[102,333],armR:[195,333]}):
    side?{legL:[137,322],armL:[224,319],legR:[82,327],armR:[183,332]}:{legL:[100,325],legR:[200,325],armL:[104,330],armR:[196,330]};
  rig.root.updateMatrixWorld(true);
  return Object.entries(points).map(([name,[x,y]])=>{const p=rig.parts[name],local=new Vector3(x-p.userData.baseX,y-p.userData.baseY,0);return {p,local,target:p.localToWorld(local.clone())};});
}
function plantPaws(rig,contacts){
  rig.root.updateMatrixWorld(true);
  for(const {p,local,target} of contacts){
    const desired=p.parent.worldToLocal(target.clone()),actual=p.parent.worldToLocal(p.localToWorld(local.clone()));
    p.position.add(desired.sub(actual));p.updateMatrixWorld(true);
  }
}

export function startRecoil(rig,direction,damage){
  const recoil={elapsed:0,duration:.52,direction,strength:Math.min(1.25,.65+damage*.04),ready:!rig.prepareActionFrames};rig.recoil=recoil;
  rig.prepareActionFrames?.('hit',rig.direction).then(()=>{if(rig.recoil===recoil)recoil.ready=true;}).catch(error=>{console.error(error);recoil.ready=true;});
}
// A bleeding tick is not a blow: it is short, rooted and internal. Keeping it
// apart from the recoil lets repeated bleeding read without redrawing the body.
export function startBleedTick(rig,direction=1){
  const tick={elapsed:0,duration:.7,direction,ready:!rig.prepareActionFrames};rig.bleedTick=tick;
  rig.prepareActionFrames?.('bleed',rig.direction).then(()=>{if(rig.bleedTick===tick)tick.ready=true;}).catch(error=>{console.error(error);tick.ready=true;});
}
export function reactionPose(rig,dt){
  if(rig.pngRig){rig.updateReaction?.(dt);return;}
  if(rig.recoil){
    const hit=rig.recoil;hit.elapsed+=hit.ready?dt:0;const p=clamp(hit.elapsed/hit.duration),wave=Math.sin(p*Math.PI)*Math.exp(-p*2)*hit.strength,d=hit.direction*rig.facing;
    joint(rig,'torso',{x:wave*25,r:wave*.24,sy:1-wave*.1},d);
    joint(rig,'skull',{x:-wave*12,r:-wave*.2},d);joint(rig,'armL',{r:-wave*.7,y:-Math.max(0,wave)*8},d);joint(rig,'armR',{r:wave*.7},d);
    joint(rig,'earL',{r:-wave*.6},d);joint(rig,'earR',{r:-wave*.4},d);
    // Mane, ruff, jaw and tail trail the body instead of snapping with it.
    joint(rig,'maneBack',{x:-wave*5,r:-wave*.05},d);joint(rig,'bib',{x:-wave*4,r:-wave*.07},d);
    joint(rig,'tail',{r:wave*.22},d);joint(rig,'jaw',{y:Math.max(0,wave)*6});
    if(p===1)rig.recoil=null;
  }
  if(rig.bleedTick){
    const tick=rig.bleedTick;tick.elapsed+=tick.ready?dt:0;const p=clamp(tick.elapsed/tick.duration);
    const shudder=Math.sin(p*Math.PI*6)*Math.exp(-p*3),dip=Math.sin(p*Math.PI),d=tick.direction*rig.facing;
    joint(rig,'torso',{y:dip*3,r:shudder*.03,sy:1-dip*.035},d);
    joint(rig,'skull',{y:dip*4,r:shudder*.04});
    joint(rig,'maneBack',{y:dip*1.5,r:-shudder*.05});joint(rig,'bib',{r:-shudder*.04});
    joint(rig,'jaw',{y:Math.max(0,shudder)*4});joint(rig,'tail',{r:-shudder*.18});
    if(p===1)rig.bleedTick=null;
  }
  if(rig.reaction>0){rig.reaction=Math.max(0,rig.reaction-dt);joint(rig,'torso',{sy:1+Math.sin(rig.reaction*15)*rig.reaction*.08});}
  if(rig.death){
    rig.death.elapsed+=rig.death.ready===false?0:dt;
    // Buckle, fall and settle. The last pose is held: nothing here brings the
    // body back up, and restart clears rig.death instead of reusing it.
    const p=smooth(clamp(rig.death.elapsed/1.15));
    const buckle=smooth(clamp(p/.45)),fall=smooth(clamp((p-.22)/.5)),settle=smooth(clamp((p-.72)/.28)),d=rig.death.direction*rig.facing;
    joint(rig,'armL',{y:fall*22,r:-buckle*.4},d);
    joint(rig,'armR',{y:fall*20,r:buckle*.32},d);
    joint(rig,'legL',{y:fall*9,r:buckle*.3},d);joint(rig,'legR',{y:fall*9,r:-buckle*.26},d);
    joint(rig,'torso',{y:fall*30,r:fall*.34,sy:1-fall*.1},d);
    joint(rig,'skull',{y:fall*9,r:fall*.46});
    joint(rig,'maneBack',{y:fall*6,r:fall*.1},d);joint(rig,'bib',{y:fall*5,r:fall*.14},d);
    joint(rig,'jaw',{y:fall*11});joint(rig,'tail',{y:fall*12,r:-fall*.3},d);
    rig.art.position.y-=fall*.16+settle*.02;
  }
}
const y0=(rig,name)=>rig.joints[name]?1:0;

// The endpoint is computed after posing and updating world matrices. It follows
// the animated hand or lips, even when facing left or wearing a mutation.
export function socketPosition(rig,name,x,y,target){
  if(rig.socketPosition)return rig.socketPosition(name,target);
  if(rig.sockets?.[name])[x,y]=rig.sockets[name];
  const part=rig.parts[name];rig.root.updateMatrixWorld(true);target.set(x,y,0);
  // Parts use original SVG coordinates relative to their original pivot.
  target.x-=part.userData.baseX;target.y-=part.userData.baseY;
  return part.localToWorld(target);
}
