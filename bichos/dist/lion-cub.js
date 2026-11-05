import * as THREE from './vendor/three.module.js';
import * as encounters from './encounters.js';
import {LION_CUB_VIEWS,LION_CUB_POSES,LION_CUB_LAYOUT,LION_CUB_TIMING,lionCubFrame,lionCubFrameURL,lionCubProgress,lionCubSummonPose,lionCubAction} from './lion-cub-frames.js';

let sharedFrames,preparing;
// Preload once before calling the synchronous factory. Failed loads can be
// retried, and even a partial failure releases only this attempt's textures.
export function prepareLionCubFrames(){
  if(sharedFrames)return Promise.resolve();
  if(preparing)return preparing;
  preparing=(async()=>{
    const loader=new THREE.TextureLoader(),loaded=new Map();
    const results=await Promise.allSettled(LION_CUB_VIEWS.flatMap(view=>LION_CUB_POSES.map(async(_,pose)=>{
      const texture=await loader.loadAsync(lionCubFrameURL(view,pose));
      texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;
      texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
      loaded.set(`${view}/${pose}`,texture);
    })));
    const failed=results.find(result=>result.status==='rejected');
    if(failed){for(const texture of loaded.values())texture.dispose();throw failed.reason;}
    sharedFrames=loaded;
  })().finally(()=>{preparing=undefined;});
  return preparing;
}

// actor.cell may contain just col/row: world coordinates come from the board.
// LION_CUB_STATS is supplied by encounters.js; actor fields override defaults.
export function createLionCub(scene,camera,tiles,viewport,actor){
  if(!sharedFrames)throw new Error('Aguarde prepareLionCubFrames() antes de criar o leãozinho.');
  if(!actor?.id||!actor.cell)throw new Error('O leãozinho precisa de id e casa.');
  const tile=tiles.find(tile=>tile.userData.col===actor.cell.col&&tile.userData.row===actor.cell.row);
  const cell=tile?.userData;
  if(!cell||cell.blocked||!Number.isFinite(cell.x)||!Number.isFinite(cell.z))throw new Error('O leãozinho precisa de uma casa livre no tabuleiro.');
  const stats={...encounters.LION_CUB_STATS,...actor};
  if(!Number.isFinite(stats.maxHp)||stats.maxHp<=0)throw new Error('Defina maxHp em LION_CUB_STATS ou no ator.');
  const labels=document.getElementById('labels');
  if(!labels)throw new Error('Contêiner de rótulos #labels não encontrado.');
  const id=actor.id,name=actor.name??stats.name??'Leãozinho';
  const root=new THREE.Group();root.position.set(cell.x,.08,cell.z);root.quaternion.copy(camera.quaternion);
  const art=new THREE.Group();root.add(art);
  const {size,ground,spriteSize}=LION_CUB_LAYOUT;
  const centerY=(ground/size-.5)*spriteSize;
  const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthTest:false,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(spriteSize,spriteSize),material);
  plane.position.y=centerY;art.add(plane);
  const rage=new THREE.Group();rage.visible=false;art.add(rage);
  const hit=new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.2),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));
  hit.position.y=.6;hit.userData.enemy=id;root.add(hit);
  const floor=new THREE.Mesh(new THREE.RingGeometry(.48,.53,4),new THREE.MeshBasicMaterial({color:'#b66d4d',transparent:true,opacity:.4,depthWrite:false}));
  floor.rotation.x=-Math.PI/2;floor.rotation.z=Math.PI/4;floor.position.set(cell.x,.029,cell.z);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({color:'#3d4938',opacity:0,transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.scale.set(.32,.2,1);shadow.position.set(cell.x,.025,cell.z);
  scene.add(root,floor,shadow);
  const label=document.createElement('div');label.className='creature-label enemy-label';label.textContent=name;labels.append(label);
  const projected=new THREE.Vector3();let disposed=false,focused=false,clock=0;
  const rig={
    id,kind:'lion-cub',pngRig:true,
    definition:{...stats,id,name,kind:'lion-cub',health:stats.maxHp,portraitPath:actor.portraitPath??stats.portraitPath??lionCubFrameURL('down',0)},
    root,art,parts:{sprite:plane,rage},hit,floor,shadow,label,
    cell:{...cell},cells:[{...cell}],direction:LION_CUB_VIEWS.includes(actor.direction)?actor.direction:'down',
    artOrigin:art.position.clone(),artScale:art.scale.clone(),facing:1,phase:0,air:0,
    recoil:null,bleedTick:null,death:null,moving:null,actionActive:false,
    spawn:{elapsed:0,duration:LION_CUB_TIMING.summon},frameIndex:0,frameKind:'summon',
  };
  function showPose(pose){
    const texture=sharedFrames.get(`${rig.direction}/${pose}`);
    if(material.map!==texture){const first=!material.map;material.map=texture;if(first)material.needsUpdate=true;}
    rig.frameIndex=pose;
  }
  function applyAppearance(){
    const appearance=rig.spawn?lionCubSummonPose(rig.spawn.elapsed/rig.spawn.duration):lionCubSummonPose(1);
    art.scale.copy(rig.artScale).multiplyScalar(appearance.scale);
    art.position.y+=appearance.rise;
    material.opacity=appearance.opacity;
    shadow.material.opacity=.18*appearance.opacity;
    shadow.scale.set(.32*appearance.scale,.2*appearance.scale,1);
    label.style.opacity=String(appearance.opacity);
  }
  rig.resetPose=()=>{
    if(disposed)return;
    art.position.copy(rig.artOrigin);art.rotation.set(0,0,0);art.scale.copy(rig.artScale);rig.air=0;
    applyAppearance();
  };
  rig.setDirection=view=>{
    if(!LION_CUB_VIEWS.includes(view))throw new Error(`Direção inválida: ${view}`);
    rig.direction=view;rig.facing=view==='left'?-1:1;
    if(!disposed)showPose(rig.frameIndex); // Turning never resets an attack or a corpse.
  };
  rig.showActionFrame=(kind,progress)=>{
    if(disposed)return false;
    const action=lionCubAction(kind);
    // A completed corpse cannot be overwritten by idle/clear calls.
    if(rig.death&&action!=='death')return true;
    rig.frameKind=action;showPose(lionCubFrame(action,progress));return true;
  };
  rig.clearActionFrame=()=>{
    rig.actionActive=false;rig.resetPose();
    rig.showActionFrame(rig.death?'death':rig.spawn?'summon':'idle',rig.death?rig.death.elapsed/LION_CUB_TIMING.death:0);
  };
  rig.focus=value=>{
    focused=Boolean(value);floor.material.color.set(focused?'#f1ca78':'#b66d4d');floor.material.opacity=focused?.9:.4;
  };
  rig.socketPosition=(socket,target=new THREE.Vector3())=>{
    const side=rig.direction==='right'?1:rig.direction==='left'?-1:0;
    if(socket==='tail')target.set(side?-side*.38:rig.direction==='down'?-.25:.25,.24,0);
    else if(socket==='body')target.set(0,.4,0);
    else if(socket==='armR'||socket==='legR')target.set(side*.26,.12,0);
    else target.set(side*.39,rig.direction==='up'?.52:.49,0);
    root.updateMatrixWorld(true);return art.localToWorld(target);
  };
  // Pass the simulation's dt in seconds (0 while paused, already speed-scaled).
  // Wall time is deliberately ignored, so spawn and idle also freeze on pause.
  rig.update=(_time,dt=0)=>{
    if(disposed)return;
    const step=Number.isFinite(dt)?Math.max(0,dt):0;clock+=step;
    if(rig.death)rig.spawn=null;
    else if(rig.spawn){rig.spawn.elapsed=Math.min(rig.spawn.duration,rig.spawn.elapsed+step);if(rig.spawn.elapsed>=rig.spawn.duration)rig.spawn=null;}
    rig.resetPose();
    if(rig.death){
      rig.death.elapsed+=rig.death.ready===false?0:step;
      rig.showActionFrame('death',rig.death.elapsed/LION_CUB_TIMING.death);
    }else if(rig.recoil||rig.bleedTick){
      const key=rig.recoil?'recoil':'bleedTick',reaction=rig[key];
      reaction.elapsed+=reaction.ready===false?0:step;
      const duration=reaction.duration??LION_CUB_TIMING[key==='recoil'?'hit':'bleed'];
      rig.showActionFrame(key==='recoil'?'hit':'bleed',reaction.elapsed/duration);
      if(reaction.elapsed>=duration)rig[key]=null;
    }else if(!rig.actionActive){
      const kind=rig.spawn?'summon':rig.moving?'walk':'idle';
      rig.showActionFrame(kind,lionCubProgress(kind,rig.spawn?rig.spawn.elapsed:clock+rig.phase));
    }
    root.quaternion.copy(camera.quaternion);
    plane.renderOrder=1000000+Math.round((root.position.z*.88+root.position.x*.47)*100)*1000;
    floor.position.set(root.position.x,.029,root.position.z);shadow.position.set(root.position.x,.025,root.position.z);
    floor.visible=shadow.visible=root.visible;
    projected.copy(root.position).project(camera);label.hidden=!root.visible;
    label.style.left=`${(projected.x*.5+.5)*viewport.clientWidth}px`;
    label.style.top=`${(-projected.y*.5+.5)*viewport.clientHeight+9}px`;
  };
  rig.dispose=()=>{
    if(disposed)return;
    disposed=true;root.removeFromParent();floor.removeFromParent();shadow.removeFromParent();label.remove();
    // Materials belong to this instance; maps belong to the preload cache.
    for(const object of [plane,hit,floor,shadow]){object.geometry.dispose();object.material.dispose();}
    root.clear();art.clear();
  };
  rig.setDirection(rig.direction);rig.showActionFrame('summon',0);rig.update(0,0);
  return rig;
}
