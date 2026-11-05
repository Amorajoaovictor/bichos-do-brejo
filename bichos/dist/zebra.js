import * as THREE from 'three';
import { ZEBRA_STATS,ZEBRA_SPAWNS } from './encounters.js';
import { ZEBRA_VIEWS,ZEBRA_DURATIONS,zebraPose } from './zebra-png-frames.js';

const frames=new Map();
export async function createZebras(scene,camera,tiles,viewport){
  const loader=new THREE.TextureLoader();
  await Promise.all(ZEBRA_VIEWS.flatMap(view=>Array.from({length:9},async(_,i)=>{
    const texture=await loader.loadAsync(`/art/zebra/png-v1/quadros/${view}-${i}.png`);
    texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
    frames.set(`${view}/${i}`,texture);
  })));
  return ZEBRA_SPAWNS.map((spawn,index)=>{
    const id=`zebra-${index+1}`,cell=tiles.find(tile=>tile.userData.col===spawn.col&&tile.userData.row===spawn.row)?.userData;
    if(!cell||cell.blocked)throw new Error('A zebra precisa de uma casa livre.');
    const root=new THREE.Group();root.position.set(cell.x,.08,cell.z);root.quaternion.copy(camera.quaternion);scene.add(root);
    const art=new THREE.Group();art.position.y=.57;root.add(art);
    const material=new THREE.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.45,1.45),material);art.add(plane);
    const rage=new THREE.Group();rage.visible=false;art.add(rage);
    const hit=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.3),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));hit.position.y=.6;hit.userData.enemy=id;root.add(hit);
    const floor=new THREE.Mesh(new THREE.RingGeometry(.48,.53,4),new THREE.MeshBasicMaterial({color:'#b66d4d',transparent:true,opacity:.55,depthWrite:false}));
    floor.rotation.x=-Math.PI/2;floor.rotation.z=Math.PI/4;floor.position.set(cell.x,.029,cell.z);scene.add(floor);
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({color:'#3d4938',opacity:.18,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(.32,.2,1);shadow.position.set(cell.x,.025,cell.z);scene.add(shadow);
    const label=document.createElement('div');label.className='creature-label enemy-label';label.textContent=`Zebra`;document.getElementById('labels').append(label);
    const projected=new THREE.Vector3();
    const rig={id,kind:'zebra',pngRig:true,definition:{...ZEBRA_STATS,id,name:'Zebra',health:ZEBRA_STATS.maxHp},root,art,parts:{rage},hit,floor,shadow,label,cell:{...cell},cells:[cell],direction:'down',artOrigin:art.position.clone(),artScale:art.scale.clone(),phase:index*.23,air:0,recoil:null,death:null,bleedTick:null,moving:null,actionActive:false};
    rig.resetPose=()=>{art.position.copy(rig.artOrigin);art.rotation.z=0;art.scale.copy(rig.artScale);};
    rig.setDirection=view=>{rig.direction=view;rig.showActionFrame('idle',0);};
    rig.showActionFrame=(kind,progress)=>{
      const texture=frames.get(`${rig.direction}/${zebraPose(kind,progress)}`);
      if(material.map!==texture){material.map=texture;material.needsUpdate=true;}return true;
    };
    rig.clearActionFrame=()=>rig.showActionFrame('idle',0);
    rig.focus=focused=>{floor.material.color.set(focused?'#f1ca78':'#b66d4d');floor.material.opacity=focused?.9:.4;};
    rig.socketPosition=(name,target)=>{
      const side=rig.direction==='right'?1:rig.direction==='left'?-1:0;
      target.set(name==='head'?side*.3:0,name==='head'?.8:.43,0);
      root.updateMatrixWorld(true);return root.localToWorld(target);
    };
    rig.update=(time,dt)=>{
      rig.resetPose();
      if(rig.death){rig.death.elapsed+=dt;rig.showActionFrame('death',Math.min(1,rig.death.elapsed/ZEBRA_DURATIONS.death));}
      else if(rig.recoil||rig.bleedTick){
        const reaction=rig.recoil??rig.bleedTick;reaction.elapsed+=dt;
        rig.showActionFrame(rig.recoil?'hit':'bleed',Math.min(1,reaction.elapsed/reaction.duration));
        if(reaction.elapsed>=reaction.duration){rig.recoil=null;rig.bleedTick=null;}
      }else if(!rig.actionActive)rig.showActionFrame(rig.moving?'walk':'idle',rig.moving?(time%ZEBRA_DURATIONS.walk)/ZEBRA_DURATIONS.walk:((time+rig.phase)%ZEBRA_DURATIONS.idle)/ZEBRA_DURATIONS.idle);
      plane.renderOrder=1000000+Math.round((root.position.z*.88+root.position.x*.47)*100)*1000;
      floor.position.set(root.position.x,.029,root.position.z);shadow.position.set(root.position.x,.025,root.position.z);
      projected.copy(root.position).project(camera);label.hidden=!root.visible;
      label.style.left=`${(projected.x*.5+.5)*viewport.clientWidth}px`;label.style.top=`${(-projected.y*.5+.5)*viewport.clientHeight+9}px`;
    };
    rig.showActionFrame('idle',0);return rig;
  });
}

