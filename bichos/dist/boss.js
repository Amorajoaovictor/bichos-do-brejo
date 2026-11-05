import * as THREE from 'three';
import { TILE_SIZE,COLS,ROWS } from './habitat.js';
import { footprintCells,cellKey } from './grid.js';
import { bindRig,idlePose,reactionPose } from './animation.js';
import { installViews } from './facing.js';
import { bossPngLayout } from './boss-png-layout.js';

const part=(name,x,y,svg)=>({name,pivot:[x,y],svg});
export const bossDefinition={
  id:'rosnaldo',name:'Rosnaldo',title:'O REI DO BREJO',health:120,
  anchor:{col:3,row:2},footprint:{width:2,height:2},
  parts:[],
};

export function createBoss(scene,camera,vectorPart,setRigOrder,renderer){
  const def=bossDefinition,cells=footprintCells(def.anchor,def.footprint.width,def.footprint.height);
  const occupied=new Set(cells.map(cellKey));
  const center={x:(def.anchor.col+.5-(COLS-1)/2)*TILE_SIZE,z:(def.anchor.row+.5-(ROWS-1)/2)*TILE_SIZE};
  const root=new THREE.Group();root.position.set(center.x,.08,center.z);root.quaternion.copy(camera.quaternion);scene.add(root);
  const art=new THREE.Group(),scale=.0082;art.scale.set(scale,-scale,scale);art.position.set(-150*scale,330*scale,0);root.add(art);
  // The shared skeleton supplies effect sockets; Rosnaldo's visible body is a
  // single transparent PNG plane, so his detailed drawings cost one draw call.
  const parts={};
  for(const name of ['body','head','mouth','muzzle','tail','armR']){
    parts[name]=vectorPart(part(name,150,220,''),0);art.add(parts[name]);
  }
  parts.rage=vectorPart(part('rage',150,190,''),300);parts.rage.visible=false;art.add(parts.rage);
  setRigOrder({root,parts});
  const hit=new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.7),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));hit.position.y=1.3;hit.userData.boss=true;root.add(hit);
  const floor=new THREE.Group();floor.position.set(center.x,.028,center.z);scene.add(floor);
  const floorMaterials=[];
  for(const cell of cells){
    const m=new THREE.MeshBasicMaterial({color:'#a87768',opacity:.13,transparent:true,depthWrite:false});floorMaterials.push(m);
    const tile=new THREE.Mesh(new THREE.PlaneGeometry(TILE_SIZE-.035,TILE_SIZE-.035),m);tile.rotation.x=-Math.PI/2;tile.position.set((cell.col-(COLS-1)/2)*TILE_SIZE-center.x,0,(cell.row-(ROWS-1)/2)*TILE_SIZE-center.z);floor.add(tile);
  }
  // An outline and crossing lines make the four reserved cells unambiguous.
  const extent=TILE_SIZE-.035,points=[[-extent,-extent],[extent,-extent],[extent,extent],[-extent,extent],[-extent,-extent]];
  const border=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(([x,z])=>new THREE.Vector3(x,.003,z))),new THREE.LineBasicMaterial({color:'#986c5e',transparent:true,opacity:.72}));floor.add(border);
  for(const axis of [0,1]){
    const p=axis?[[0,.003,-extent],[0,.003,extent]]:[[-extent,.003,0],[extent,.003,0]];
    floor.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p.map(v=>new THREE.Vector3(...v))),new THREE.LineBasicMaterial({color:'#986c5e',transparent:true,opacity:.32})));
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,48),new THREE.MeshBasicMaterial({color:'#3d4938',opacity:.19,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(.94,.64,1);shadow.position.set(center.x,.032,center.z);scene.add(shadow);
  let focused=false;
  function focus(value){focused=value;border.material.color.set(value?'#e0bc87':'#986c5e');floorMaterials.forEach(m=>m.opacity=value?.24:.13);}
  function update(time,dt=0){
    idlePose(rig,time);reactionPose(rig,dt);
    if(rig.death)rig.showActionFrame('death',Math.min(1,rig.death.elapsed/1.15));
    else if(rig.recoil)rig.showActionFrame('hit',Math.min(1,rig.recoil.elapsed/rig.recoil.duration));
    else if(rig.bleedTick)rig.showActionFrame('bleed',Math.min(1,rig.bleedTick.elapsed/rig.bleedTick.duration));
    else if(!rig.actionActive&&!rig.showActionFrame('idle',(time%1.92)/1.92))rig.prepareActionFrames('idle',rig.direction).catch(console.error);
    if(focused)floorMaterials.forEach(m=>m.opacity=.21+Math.sin(time*2)*.035);
  }
  const rig={definition:def,root,art,parts,hit,cells,occupied,center,shadow,floor,focus,update};
  bindRig(rig,def.id);installViews(rig,vectorPart);setRigOrder(rig);
  const frameCache=new Map(),pendingFrames=new Map();
  let activeKey=null;
  const renderBase=1000000+Math.round((root.position.z*.88+root.position.x*.47)*100)*1000;
  // The camera-facing drawing needs a small screen-space drop so its paws sit
  // over the reserved 2 x 2 footprint rather than hovering above its centre.
  const groundOffset=.2;
  const frameArt=new THREE.Group();frameArt.position.copy(rig.artOrigin);frameArt.position.y-=groundOffset;frameArt.scale.copy(rig.artScale);root.add(frameArt);
  rig.frameArt=frameArt;
  const frameMaterial=new THREE.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const framePlane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),frameMaterial);framePlane.renderOrder=renderBase;framePlane.scale.y=-1;frameArt.add(framePlane);frameArt.visible=false;
  const loader=new THREE.TextureLoader();
  rig.prepareActionFrames=(kind,view)=>{
    const key=`${kind}/${view}`;
    if(frameCache.has(key))return Promise.resolve();
    if(pendingFrames.has(key))return pendingFrames.get(key);
    const task=(async()=>{
      const {folder,prefix}=bossPngLayout[kind][view];
      const textures=await Promise.all(Array.from({length:12},(_,i)=>
        loader.loadAsync(`/art/rosnaldo/${folder}/quadros/${prefix}-${String(i+1).padStart(2,'0')}.png`)));
      textures.forEach(texture=>{
        texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
        // Decode and upload before the action starts, rather than uploading a
        // different PNG for the first time on every animation frame.
        renderer?.initTexture(texture);
      });
      frameCache.set(key,textures);
    })().finally(()=>pendingFrames.delete(key));
    pendingFrames.set(key,task);return task;
  };
  // The boss has a fixed, finite set of frames. Retain them through turns and
  // restarts: evicting after three action/view pairs caused repeated loading
  // pauses, and parallel prepares could evict a set before its first display.
  rig.prepareAllActionFrames=async()=>{
    for(const kind of Object.keys(bossPngLayout)){
      await Promise.all(Object.keys(bossPngLayout[kind]).map(view=>rig.prepareActionFrames(kind,view)));
    }
    rig.showActionFrame('idle',0);
  };
  rig.showActionFrame=(kind,progress)=>{
    const key=`${kind}/${rig.direction}`,textures=frameCache.get(key);if(!textures)return false;
    const layout=bossPngLayout[kind][rig.direction];
    activeKey=key;frameArt.visible=true;rig.art.visible=false;
    const index=Math.min(11,Math.floor(Math.max(0,progress)*12));
    const texture=textures[index];if(frameMaterial.map!==texture){const firstMap=!frameMaterial.map;frameMaterial.map=texture;if(firstMap)frameMaterial.needsUpdate=true;}
    framePlane.scale.set(layout.size*layout.k,-layout.size*layout.k,1);
    const [dx,dy]=layout.offsets[index];
    framePlane.position.set(layout.tx+layout.size*layout.k/2+dx,layout.ty+layout.size*layout.k/2+dy,0);
    return true;
  };
  rig.syncActionFrame=()=>{if(activeKey){frameArt.position.copy(rig.art.position);frameArt.position.y-=groundOffset;}};
  // Hold the last PNG while idle loads. Revealing the old socket skeleton here
  // caused a one-frame change of drawing after attacks and on restart.
  rig.clearActionFrame=()=>{
    frameArt.position.copy(rig.artOrigin);frameArt.position.y-=groundOffset;
    if(!rig.showActionFrame('idle',0))rig.prepareActionFrames('idle',rig.direction).catch(console.error);
  };
  rig.prepareActionFrames('idle','down').catch(console.error);
  return rig;
}
