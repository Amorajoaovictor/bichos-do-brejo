import * as THREE from 'three';
import { SQUIRREL_STATS,SQUIRREL_SPAWNS } from './encounters.js';
import { SQUIRREL_IDLE_DURATION,SQUIRREL_IDLE_POSES,SQUIRREL_IDLE_VIEWS,squirrelIdleFrame } from './squirrel-idle-frames.js';

const frames=new Map(),idleFrames=new Map();
const sequences={walk:[2,3,2,3],throw:[0,4,4,5,5,0],hit:[6,6,0],bleed:[6,0],death:[6,7,8,8]};
const nozadaFrames={reach:[0,5,5],hold:[4],flail:[5],regret:[5,0,1,1,1,0],alarm:[4,6,6,6,6,6,6,6,6,4],skid:[2,3,1,0]};
// Eye centers on the startled PNG, in far-to-near drawing order.
const eyeSockets={
  down:[[214,333,33,-64,-34],[311,333,33,64,-34]],
  right:[[410,296,32,115,-54],[330,333,42,117,-8]],
  left:[[109,296,32,-115,-54],[188,334,42,-117,-8]],
};
function drawProjectedEyes(ctx,view,extension){
  ctx.clearRect(0,0,768,512);ctx.save();ctx.translate(128,0);
  ctx.lineJoin='round';ctx.strokeStyle='#211712';ctx.lineWidth=8;
  for(const [x,y,r,dx,dy] of eyeSockets[view]){
    const tipX=x+dx*extension,tipY=y+dy*extension;
    const angle=Math.atan2(dy,dx),nx=-Math.sin(angle),ny=Math.cos(angle);
    const base=r*.92,bend=r*.45,tipRadius=r*(1+extension*.08);
    ctx.beginPath();ctx.moveTo(x+nx*base,y+ny*base);
    ctx.quadraticCurveTo((x+tipX)/2+nx*bend,(y+tipY)/2+ny*bend,tipX+nx*tipRadius*.8,tipY+ny*tipRadius*.8);
    ctx.lineTo(tipX-nx*tipRadius*.8,tipY-ny*tipRadius*.8);
    ctx.quadraticCurveTo((x+tipX)/2-nx*bend,(y+tipY)/2-ny*bend,x-nx*base,y-ny*base);
    ctx.arc(x,y,base,angle-Math.PI/2,angle+Math.PI/2,true);ctx.closePath();
    ctx.fillStyle='#ebc5a7';ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(tipX,tipY,tipRadius,tipRadius*.94,0,0,Math.PI*2);
    ctx.fillStyle='#fff0da';ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(tipX+Math.sign(dx)*r*.30,tipY-r*.09,r*.14,0,Math.PI*2);
    ctx.fillStyle='#211712';ctx.fill();
  }
  ctx.restore();
}
export async function createSquirrels(scene,camera,tiles,viewport,renderer){
  const loader=new THREE.TextureLoader();
  const frameSets=[['png-v1',9,frames],['idle-v2',SQUIRREL_IDLE_POSES,idleFrames]];
  await Promise.all(frameSets.flatMap(([folder,length,bank])=>SQUIRREL_IDLE_VIEWS.flatMap(view=>Array.from({length},async(_,i)=>{
    const texture=await loader.loadAsync(`/art/esquilo/${folder}/quadros/${view}-${i}.png`);
    texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
    if(bank===idleFrames)renderer?.initTexture(texture);
    bank.set(`${view}/${i}`,texture);
  }))));
  return SQUIRREL_SPAWNS.map((spawn,index)=>{
    const id=`squirrel-${index+1}`,cell=tiles.find(tile=>tile.userData.col===spawn.col&&tile.userData.row===spawn.row)?.userData;
    if(!cell||cell.blocked)throw new Error('O esquilo precisa de uma casa livre.');
    const root=new THREE.Group();root.position.set(cell.x,.08,cell.z);root.quaternion.copy(camera.quaternion);scene.add(root);
    const art=new THREE.Group();art.position.y=.57;root.add(art);
    const material=new THREE.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.45,1.45),material);art.add(plane);
    const eyeCanvas=document.createElement('canvas');eyeCanvas.width=768;eyeCanvas.height=512;
    const eyeContext=eyeCanvas.getContext('2d'),eyeTexture=new THREE.CanvasTexture(eyeCanvas);
    eyeTexture.colorSpace=THREE.SRGBColorSpace;eyeTexture.generateMipmaps=false;eyeTexture.minFilter=THREE.LinearFilter;
    const eyes=new THREE.Mesh(new THREE.PlaneGeometry(1.45*1.5,1.45),new THREE.MeshBasicMaterial({map:eyeTexture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
    eyes.name='Olhos projetados';eyes.visible=false;art.add(eyes);let lastEyes='';
    const rage=new THREE.Group();rage.visible=false;art.add(rage);
    const hit=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.3),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}));hit.position.y=.6;hit.userData.enemy=id;root.add(hit);
    const floor=new THREE.Mesh(new THREE.RingGeometry(.48,.53,4),new THREE.MeshBasicMaterial({color:'#b66d4d',transparent:true,opacity:.55,depthWrite:false}));
    floor.rotation.x=-Math.PI/2;floor.rotation.z=Math.PI/4;floor.position.set(cell.x,.029,cell.z);scene.add(floor);
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({color:'#3d4938',opacity:.18,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(.32,.2,1);shadow.position.set(cell.x,.025,cell.z);scene.add(shadow);
    const label=document.createElement('div');label.className='creature-label enemy-label';label.textContent=`Esquilo ${index+1}`;document.getElementById('labels').append(label);
    const projected=new THREE.Vector3();
    const rig={id,kind:'squirrel',pngRig:true,definition:{...SQUIRREL_STATS,id,name:`Esquilo Histérico ${index+1}`,health:SQUIRREL_STATS.maxHp},root,art,parts:{rage},hit,floor,shadow,label,cell:{...cell},cells:[cell],direction:'down',artOrigin:art.position.clone(),artScale:art.scale.clone(),idleTempo:1,air:0,recoil:null,death:null,bleedTick:null,moving:null,actionActive:false};
    let idleTime=index*233;
    rig.resetPose=()=>{art.position.copy(rig.artOrigin);art.rotation.z=0;art.scale.copy(rig.artScale);eyes.visible=false;};
    rig.setDirection=view=>{rig.direction=view;rig.showActionFrame('idle',0);};
    rig.showActionFrame=(kind,progress)=>{
      const sequence=sequences[kind]??nozadaFrames[kind];
      const p=Math.max(0,Math.min(1,progress));
      const index=sequence?sequence[Math.min(sequence.length-1,Math.floor(p*sequence.length))]:squirrelIdleFrame(p*SQUIRREL_IDLE_DURATION);
      const texture=(sequence?frames:idleFrames).get(`${rig.direction}/${index}`);
      if(material.map!==texture){material.map=texture;material.needsUpdate=true;}return true;
    };
    rig.poseNozada=(kind,p,squash=0,lift=0,tilt=0)=>{
      rig.resetPose();rig.showActionFrame(kind,p);
      // Anchor the whole PNG at its feet while the pose compresses or stretches.
      art.scale.set(1-squash*.65,1+squash,1);
      art.rotation.z=tilt;
      art.position.x-=Math.sin(tilt)*.555*(1+squash);
      art.position.y+=Math.cos(tilt)*.555*(1+squash)-.555+lift;
      if(kind==='alarm'&&eyeSockets[rig.direction]){
        const extend=THREE.MathUtils.smoothstep(p,.1,.29)*(1-THREE.MathUtils.smoothstep(p,.57,.84));
        const level=Math.round(extend*12),key=`${rig.direction}/${level}`;
        eyes.visible=level>0;
        if(eyes.visible&&key!==lastEyes){drawProjectedEyes(eyeContext,rig.direction,level/12);eyeTexture.needsUpdate=true;lastEyes=key;}
      }
    };
    rig.clearActionFrame=()=>rig.showActionFrame('idle',0);
    rig.focus=focused=>{floor.material.color.set(focused?'#f1ca78':'#b66d4d');floor.material.opacity=focused?.9:.4;};
    rig.socketPosition=(name,target)=>{
      const side=rig.direction==='right'?1:rig.direction==='left'?-1:0;
      // These points are in the camera-facing sprite's coordinates. The hand
      // stays on the drawn forepaw in all four independently drawn views.
      target.set(name==='armR'?side*.43:side*.14,name==='armR'?.43:name==='body'?.43:.69,0);
      root.updateMatrixWorld(true);return root.localToWorld(target);
    };
    rig.update=(time,dt)=>{
      rig.resetPose();
      if(rig.death){rig.death.elapsed+=dt;rig.showActionFrame('death',Math.min(1,rig.death.elapsed/1.05));}
      else if(rig.recoil||rig.bleedTick){
        const reaction=rig.recoil??rig.bleedTick;reaction.elapsed+=dt;
        rig.showActionFrame(rig.recoil?'hit':'bleed',Math.min(1,reaction.elapsed/reaction.duration));
        if(reaction.elapsed>=reaction.duration){rig.recoil=null;rig.bleedTick=null;}
      }else if(!rig.actionActive){
        if(rig.moving)rig.showActionFrame('walk',(time%.32)/.32);
        else{
          idleTime=(idleTime+dt*1000*rig.idleTempo)%SQUIRREL_IDLE_DURATION;
          rig.showActionFrame('idle',idleTime/SQUIRREL_IDLE_DURATION);
        }
      }
      plane.renderOrder=1000000+Math.round((root.position.z*.88+root.position.x*.47)*100)*1000;
      eyes.renderOrder=plane.renderOrder+20;
      floor.position.set(root.position.x,.029,root.position.z);shadow.position.set(root.position.x,.025,root.position.z);
      projected.copy(root.position).project(camera);label.hidden=!root.visible;
      label.style.left=`${(projected.x*.5+.5)*viewport.clientWidth}px`;label.style.top=`${(-projected.y*.5+.5)*viewport.clientHeight+9}px`;
    };
    rig.showActionFrame('idle',0);return rig;
  });
}
