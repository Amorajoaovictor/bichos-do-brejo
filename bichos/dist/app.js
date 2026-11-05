import * as THREE from 'three';
import { SVGLoader } from './vendor/SVGLoader.js';
import { creatures, articulatedParts, mutationPart, wrapSVG, ragePart } from './characters.js';
import { buildHabitat } from './habitat.js';
import { createBoss } from './boss.js';
import { createSquirrels } from './squirrel.js';
import { createZebras } from './zebra.js';
import { prepareLionCubFrames } from './lion-cub.js';
import { cellKey } from './grid.js';
import { setupBattle } from './battle.js';
import { bindRig,idlePose,locomotionPose,movementSample,STEP_DURATION,reactionPose } from './animation.js';
import { installViews,faceToward,forEachView } from './facing.js';
import { installRabbitPng } from './rabbit-png.js';
import { createEnvironmentArt } from './environment-art.js';

const $ = id => document.getElementById(id);
const viewport = $('viewport');
const state = {selected:0,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,speed:1,zoom:1,time:0};
const mutationSets = creatures.map(()=>new Set());
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-8,8,4,-4,.1,100);
camera.position.set(8,22,15);camera.lookAt(0,0,0);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewport.prepend(renderer.domElement);
} catch(error) {
  $('loading').textContent='O viveiro precisa de WebGL. Ative a aceleração gráfica do navegador e recarregue.';
  throw error;
}
scene.add(new THREE.AmbientLight(0xffffff,2.3));
const sun = new THREE.DirectionalLight(0xfff0cf,2.5);sun.position.set(-4,10,5);scene.add(sun);
const loader = new SVGLoader();
const interactive = [];
const rigs = [];
const {tiles,selection,hover}=buildHabitat(scene,camera,vectorPart);
interactive.push(...tiles);
function disc(rx,rz,color,x,y,z,opacity=1){
  const item=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false}));
  item.rotation.x=-Math.PI/2;item.scale.set(rx,rz,1);item.position.set(x,y,z);scene.add(item);return item;
}
// SVGLoader serves the scenery and remaining vector allies. Farrapo and the
// enemies load their frame-by-frame PNG artwork separately.
// Shapes belonging to one SVG paint layer share a draw call; this matters for
// the many reeds and ink marks around the board.
function combineGeometries(geometries){
  if(geometries.length===1)return geometries[0];
  const flattened=geometries.map(geometry=>geometry.index?geometry.toNonIndexed():geometry);
  const merged=new THREE.BufferGeometry();
  for(const name of ['position','normal','uv']){
    if(flattened.some(geometry=>!geometry.getAttribute(name)))continue;
    const itemSize=flattened[0].getAttribute(name).itemSize;
    const length=flattened.reduce((sum,geometry)=>sum+geometry.getAttribute(name).array.length,0);
    const array=new Float32Array(length);let offset=0;
    for(const geometry of flattened){const values=geometry.getAttribute(name).array;array.set(values,offset);offset+=values.length;}
    merged.setAttribute(name,new THREE.BufferAttribute(array,itemSize));
  }
  for(const geometry of new Set([...geometries,...flattened]))geometry.dispose();
  return merged;
}
function vectorPart(def,baseOrder) {
  const pivot=new THREE.Group();pivot.position.set(def.pivot[0],def.pivot[1],0);
  const content=new THREE.Group();content.position.set(-def.pivot[0],-def.pivot[1],0);pivot.add(content);
  const paths=loader.parse(wrapSVG(def.svg)).paths;
  let order=0;
  for(const path of paths){
    const style=path.userData.style;
    if(style.fill && style.fill!=='none'){
      const material=new THREE.MeshBasicMaterial({color:path.color,opacity:Number(style.fillOpacity??1)*Number(style.opacity??1),side:THREE.DoubleSide,depthTest:false,depthWrite:false,transparent:true});
      const geometries=SVGLoader.createShapes(path).map(shape=>new THREE.ShapeGeometry(shape,24));
      if(geometries.length){const mesh=new THREE.Mesh(combineGeometries(geometries),material);mesh.renderOrder=baseOrder+order;content.add(mesh);}
    }
    order+=.1;
    if(style.stroke && style.stroke!=='none'){
      const material=new THREE.MeshBasicMaterial({color:new THREE.Color().setStyle(style.stroke),opacity:Number(style.strokeOpacity??1)*Number(style.opacity??1),side:THREE.DoubleSide,depthTest:false,depthWrite:false,transparent:true});
      const geometries=path.subPaths.map(sub=>SVGLoader.pointsToStroke(sub.getPoints(32),style)).filter(Boolean);
      if(geometries.length){const mesh=new THREE.Mesh(combineGeometries(geometries),material);mesh.renderOrder=baseOrder+order;content.add(mesh);}
    }
    order+=.1;
  }
  pivot.userData={baseX:def.pivot[0],baseY:def.pivot[1],expression:def.expression,svg:def.svg};return pivot;
}
function setRigOrder(rig){
  const base = 1000000+Math.round((rig.root.position.z*.88+rig.root.position.x*.47)*100)*1000;
  forEachView(rig,view=>{for(const part of Object.values(view.parts))part.traverse(obj=>{if(obj.isMesh){if(obj.userData.localOrder===undefined)obj.userData.localOrder=obj.renderOrder;obj.renderOrder=base+obj.userData.localOrder;}});});
}
for(const [i,creature] of creatures.entries()){
  const startingPositions=[[1.23,.08,1.23],[2.46,.08,1.23],[2.46,.08,2.46]];
  const root=new THREE.Group();root.position.set(...startingPositions[i]);root.quaternion.copy(camera.quaternion);scene.add(root);
  const art=new THREE.Group();art.scale.set(.0047,-.0047,.0047);art.position.set(-.705,1.551,0);root.add(art);
  const parts={};
  if(creature.id!=='rabbit'){
    for(const [j,def] of articulatedParts(creature).entries()){const p=vectorPart(def,j*10);art.add(p);parts[def.name]=p;}
    for(const [j,id] of ['tail','horn','eye'].entries()){const p=vectorPart(mutationPart(creature,id),id==='tail'?-10:160+j*10);p.visible=false;art.add(p);parts['mut_'+id]=p;}
    parts.rage=vectorPart(ragePart(creature),300);parts.rage.visible=false;art.add(parts.rage);
  }
  const hit=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.6),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));hit.position.y=.75;hit.userData.creature=i;root.add(hit);interactive.push(hit);
  const shadow=disc(.36,.23,'#4d5946',root.position.x,.024,root.position.z,.2);
  const label=document.createElement('div');label.className='creature-label';label.textContent=creature.name;label.dataset.id=creature.id;$('labels').append(label);
  const startingCell=tiles.find(tile=>Math.abs(tile.userData.x-root.position.x)<.01&&Math.abs(tile.userData.z-root.position.z)<.01).userData;
  rigs.push({root,art,parts,shadow,label,cell:startingCell,phase:creature.phase,moving:null,reaction:0});
  if(creature.id==='rabbit')await installRabbitPng(rigs[i]);
  else{bindRig(rigs[i],creature.id);installViews(rigs[i],vectorPart);}
  setRigOrder(rigs[i]);
}
const boss=createBoss(scene,camera,vectorPart,setRigOrder,renderer);
await boss.prepareAllActionFrames();
interactive.push(boss.hit);
if(boss.cells.some(cell=>!tiles.some(tile=>cellKey(tile.userData)===cellKey(cell)&&!tile.userData.blocked)))throw new Error('O boss precisa de quatro casas livres.');
const squirrels=await createSquirrels(scene,camera,tiles,viewport,renderer);
const zebras=await createZebras(scene,camera,tiles,viewport);
await prepareLionCubFrames();
const lionCubs=[];
const environment=await createEnvironmentArt({scene,camera,tiles,viewport});
const battle=setupBattle({scene,camera,viewport,rigs,boss,squirrels,zebras,lionCubs,tiles,selection,mutationSets,vectorPart,setRigOrder,state,showToast,environment});
function showToast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>$('toast').classList.remove('visible'),2700);}
function setPaused(paused){state.paused=paused;document.body.classList.toggle('paused',paused);$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Retomar animações':'Pausar animações');$('pause').title=paused?'Retomar [Espaço]':'Pausar [Espaço]';$('play-state').textContent=paused?'TEMPO SUSPENSO':'EM COMBATE';battle.render();}
$('pause').addEventListener('click',()=>setPaused(!state.paused));
$('speed').addEventListener('change',e=>{state.speed=Number(e.target.value);});
function zoom(amount){state.zoom=THREE.MathUtils.clamp(Math.round((state.zoom+amount)*10)/10,.8,1.3);camera.zoom=state.zoom;camera.updateProjectionMatrix();$('zoom-value').textContent=`${Math.round(state.zoom*100)}%`;}
$('zoom-in').addEventListener('click',()=>zoom(.1));$('zoom-out').addEventListener('click',()=>zoom(-.1));
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{showToast('Use F11 para abrir o brejo em tela cheia.');}});
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||e.target.isContentEditable)return;if(['1','2','3'].includes(e.key)){e.preventDefault();battle.select(Number(e.key)-1);}if(e.code==='Space'&&!e.target.closest('button,a,summary')){e.preventDefault();setPaused(!state.paused);}});
function resize(){
  const w=viewport.clientWidth,h=viewport.clientHeight,aspect=w/h;
  const span=Math.max(12.3,17.6/aspect);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();renderer.setSize(w,h);
}
new ResizeObserver(resize).observe(viewport);resize();
await boss.prepareActionFrames('idle',boss.direction);
boss.showActionFrame('idle',0);
battle.render();setPaused(state.paused);$('loading').hidden=true;

let previous=performance.now();const projected=new THREE.Vector3();
function animate(now){
  requestAnimationFrame(animate);
  const delta=Math.min((now-previous)/1000,.05);previous=now;
  const realDt=state.paused?0:delta*state.speed,dt=battle.hitPause>0?0:realDt;state.time+=dt;
  rigs.forEach((rig,i)=>{
    idlePose(rig,state.time);
    if(rig.moving){
      const move=rig.moving;move.progress=Math.min(1,move.progress+dt/STEP_DURATION[rig.id]);
      faceToward(rig,move.to);idlePose(rig,state.time);
      const sample=movementSample(rig.id,move.progress);
      rig.root.position.lerpVectors(move.from,move.to,sample.travel);rig.root.position.y=.08+sample.lift;
      locomotionPose(rig,move.progress);
      if(move.progress===1){rig.root.position.copy(move.to);rig.cell=move.path[move.step];move.step++;if(move.step===move.path.length)rig.moving=null;else{move.from.copy(rig.root.position);move.to.set(move.path[move.step].x,.08,move.path[move.step].z);move.progress=0;}}
      setRigOrder(rig);
    }
    reactionPose(rig,dt);
    rig.shadow.position.set(rig.root.position.x,.024,rig.root.position.z);rig.shadow.scale.set(.36-rig.air*.23,.23-rig.air*.14,1);rig.shadow.material.opacity=.2-rig.air*.22;
    projected.copy(rig.root.position);projected.y=.03;projected.project(camera);
    rig.label.style.left=`${(projected.x*.5+.5)*viewport.clientWidth}px`;rig.label.style.top=`${(-projected.y*.5+.5)*viewport.clientHeight+8}px`;
  });
  selection.position.x=rigs[state.selected].root.position.x;selection.position.z=rigs[state.selected].root.position.z;
  if(boss.root.visible)boss.update(state.time,dt);
  for(const squirrel of squirrels)squirrel.update(state.time,dt);
  for(const zebra of zebras)zebra.update(state.time,dt);
  for(const cub of lionCubs)cub.update(state.time,dt);
  battle.tick(dt,realDt);
  for(const rig of rigs)rig.syncPortraits?.();
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
// Read-only diagnostics for local verification and future iteration.
window.brejo={engine:'Three.js',revision:THREE.REVISION,scene,camera,renderer,rigs,state,mutationSets,boss,squirrels,zebras,lionCubs,battle,environment};
