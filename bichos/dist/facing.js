import { Group } from './vendor/three.module.js';
import { bindRig } from './animation.js';
import { directionalParts,viewSockets } from './directional-art.js';

export const DIRECTIONS=['up','right','down','left'];
const bankFields=['art','parts','joints','rest','artOrigin','artScale','sockets','facing'];

// Board directions are stable under zoom and independent of camera tilt.
// A diagonal target uses its dominant board axis; ties preserve the last axis.
export function directionFromDelta(dx,dz,previous='down'){
  if(Math.abs(dx)+Math.abs(dz)<1e-6)return previous;
  if(Math.abs(Math.abs(dx)-Math.abs(dz))<1e-6){
    if((previous==='left'&&dx<0)||(previous==='right'&&dx>0)||(previous==='up'&&dz<0)||(previous==='down'&&dz>0))return previous;
  }
  return Math.abs(dx)>Math.abs(dz)?(dx>0?'right':'left'):(dz>0?'down':'up');
}

export function installViews(rig,vectorPart){
  const banks={down:Object.fromEntries(bankFields.map(key=>[key,rig[key]]))};banks.down.sockets=viewSockets(rig.id,'down');
  for(const direction of ['up','right','left']){
    const art=new Group();art.position.copy(rig.artOrigin);art.scale.copy(rig.artScale);rig.root.add(art);art.visible=false;
    const parts={};directionalParts(rig.id,direction).forEach((def,i)=>{const p=vectorPart(def,i*10);if(def.expression)p.userData.expression={...def.expression};art.add(p);parts[def.name]=p;if(def.name.startsWith('mut_')||def.name==='rage')p.visible=false;});
    const bank={root:rig.root,art,parts};bindRig(bank,rig.id);bank.facing=direction==='left'&&rig.id!=='rosnaldo'?-1:1;bank.sockets=viewSockets(rig.id,direction);
    banks[direction]=Object.fromEntries(bankFields.map(key=>[key,bank[key]]));
  }
  rig.views=banks;rig.direction='down';rig.sockets=banks.down.sockets;
}

export function setDirection(rig,direction){
  if(rig.pngRig){if(direction!==rig.direction)rig.setDirection(direction);return;}
  if(!rig.views||direction===rig.direction)return;
  if(!rig.views[direction])throw new Error(`Direção inválida: ${direction}`);
  const visibility=Object.fromEntries(['mut_tail','mut_horn','mut_eye','tail','rage'].filter(name=>rig.parts[name]).map(name=>[name,rig.parts[name].visible]));
  rig.art.visible=false;
  for(const key of bankFields)rig[key]=rig.views[direction][key];
  rig.direction=direction;rig.art.visible=!rig.frameArt?.visible;
  rig.prepareActionFrames?.('idle',direction).catch(console.error);
  for(const [name,visible] of Object.entries(visibility))if(rig.parts[name])rig.parts[name].visible=visible;
}

export function faceToward(rig,target){
  setDirection(rig,directionFromDelta(target.x-rig.root.position.x,target.z-rig.root.position.z,rig.direction));
  return rig.direction;
}

export function forEachView(rig,visit){
  if(rig.views)Object.values(rig.views).forEach(visit);else visit(rig);
}
