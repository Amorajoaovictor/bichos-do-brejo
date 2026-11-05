import * as THREE from './vendor/three.module.js';
import {RABBIT_PNG_ROOT,RABBIT_PNG_VIEWS,RABBIT_PNG_TIMING,RABBIT_PNG_POSES,RABBIT_RELIEF_HOLD,rabbitFrame,rabbitFrameURL,barrageFlush} from './rabbit-png-frames.js';
import {movementSample} from './animation.js';

const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const srgb=x=>255*(x<=.0031308?x*12.92:1.055*x**(1/2.4)-.055);
let framesReady;
function loadFrames(){
  return framesReady??=(async()=>{
    const loader=new THREE.TextureLoader(),frames=new Map();
    // The manifest describes the installed sheet. New relief poses can be
    // introduced in code before the art is exported; retain the installed
    // relief drawing until that version's manifest includes the extra poses.
    const response=await fetch(`${RABBIT_PNG_ROOT}manifest.json`);
    if(!response.ok)throw new Error('Não foi possível carregar a prancha de Farrapo.');
    const manifest=await response.json(),available=Math.min(RABBIT_PNG_POSES,manifest.posesPerView);
    if(!Number.isInteger(available)||available<24)throw new Error('Prancha incompleta de Farrapo.');
    await Promise.all(RABBIT_PNG_VIEWS.flatMap(view=>Array.from({length:available},async(_,i)=>{
      const texture=await loader.loadAsync(rabbitFrameURL(view,i));
      texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
      frames.set(`${view}/${i}`,texture);
    })));
    for(const view of RABBIT_PNG_VIEWS)for(let i=available;i<RABBIT_PNG_POSES;i++)frames.set(`${view}/${i}`,frames.get(`${view}/15`));
    return frames;
  })();
}

// Visible anatomy is entirely PNG. Empty groups retain passive battle hooks.
export async function installRabbitPng(rig){
  const {root,art}=rig,frames=await loadFrames();
  art.position.set(0,0,0);art.scale.set(1,1,1);
  const flush={value:0};
  const material=new THREE.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  material.onBeforeCompile=shader=>{
    shader.uniforms.rabbitFlush=flush;
    shader.fragmentShader='uniform float rabbitFlush;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float skin = smoothstep(0.08,0.25,diffuseColor.r) * (1.0-smoothstep(0.73,0.88,diffuseColor.g));
      float head = smoothstep(0.28,0.33,vMapUv.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.05,0.48,0.43), rabbitFlush*skin*head);`);
  };
  material.customProgramCacheKey=()=> 'farrapo-png-flush-v1';
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),material);plane.position.y=.74375;art.add(plane);
  const parts={sprite:plane};
  for(const name of ['body','head','muzzle','tail','armR','legR','rage','mut_horn','mut_eye','mut_tail']){parts[name]=new THREE.Group();art.add(parts[name]);}
  parts.rage.visible=false;
  Object.assign(rig,{pngRig:true,id:'rabbit',parts,direction:'down',facing:1,artOrigin:art.position.clone(),artScale:art.scale.clone(),air:0,recoil:null,death:null,bleedTick:null,actionActive:false,expression:'neutral',faceFlush:0,frameIndex:0,frameKind:'idle'});
  rig.resetPose=()=>{art.position.copy(rig.artOrigin);art.rotation.z=0;art.scale.copy(rig.artScale);rig.air=0;};
  rig.showPose=index=>{
    const texture=frames.get(`${rig.direction}/${index}`);
    if(!texture)throw new Error(`Quadro inválido: ${index}`);
    if(material.map!==texture){const first=!material.map;material.map=texture;if(first)material.needsUpdate=true;}
    rig.frameIndex=index;
  };
  rig.showActionFrame=(kind,p)=>{
    const reliefProgress=1-Math.max(0,rig.emotionLeft??0)/RABBIT_RELIEF_HOLD;
    rig.showPose(rabbitFrame(kind,p,rig.expression,reliefProgress));rig.frameKind=kind;
    if(kind==='barrage')rig.setFaceFlush(barrageFlush(p));
    return true;
  };
  rig.setDirection=view=>{
    if(!RABBIT_PNG_VIEWS.includes(view))throw new Error(`Direção inválida: ${view}`);
    rig.direction=view;material.map=frames.get(`${view}/${rig.frameIndex}`);
  };
  rig.reliefDuration=RABBIT_RELIEF_HOLD;
  rig.prepareActionFrames=()=>Promise.resolve();
  rig.clearActionFrame=()=>{rig.resetPose();rig.showActionFrame('idle',0);};
  rig.setFaceFlush=amount=>{rig.faceFlush=Math.max(0,Math.min(1,amount));flush.value=rig.faceFlush;};
  rig.onExpression=()=>{if(!rig.actionActive&&!rig.death&&!rig.recoil&&!rig.bleedTick)rig.showActionFrame('idle',0);};
  rig.idlePose=time=>{
    rig.resetPose();
    if(!rig.actionActive&&!rig.moving&&!rig.death&&!rig.recoil&&!rig.bleedTick)rig.showActionFrame('idle',((time+rig.phase)%RABBIT_PNG_TIMING.idle)/RABBIT_PNG_TIMING.idle);
  };
  rig.locomotionPose=p=>{rig.air=movementSample('rabbit',p).lift;rig.showActionFrame('walk',p);};
  rig.updateReaction=dt=>{
    if(rig.death){rig.death.elapsed+=rig.death.ready===false?0:dt;rig.showActionFrame('death',rig.death.elapsed/RABBIT_PNG_TIMING.death);return;}
    for(const key of ['recoil','bleedTick'])if(rig[key]){
      const action=rig[key];action.elapsed+=action.ready===false?0:dt;
      rig.showActionFrame(key==='recoil'?'hit':'bleed',action.elapsed/action.duration);
      if(action.elapsed>=action.duration)rig[key]=null;
    }
  };
  rig.socketPosition=(name,target)=>{
    const side=rig.direction==='right'?1:rig.direction==='left'?-1:0;
    if(name==='tail')target.set(side?-side*.31:rig.direction==='down'?-.32:0,.32,0);
    else if(name==='legR')target.set(side*.18,.16,0);
    else if(name==='armR')target.set(side*.22,.36,0);
    else target.set(side*.08,name==='body'?.43:.83,0);
    root.updateMatrixWorld(true);return art.localToWorld(target);
  };
  rig.portraitMarkup=()=>'<canvas class="rabbit-png-portrait" width="128" height="128" data-rabbit-portrait role="img" aria-label="Retrato de Farrapo"></canvas>';
  const source=document.createElement('canvas');source.width=source.height=512;
  const context=source.getContext('2d',{willReadFrequently:true});let portraitKey='';
  rig.syncPortraits=()=>{
    const nodes=[...document.querySelectorAll('[data-rabbit-portrait]')];if(!nodes.length)return;
    const amount=Math.round(rig.faceFlush*120)/120,index=rig.death?20:rig.frameIndex,key=`${index}/${amount}`;
    if(key!==portraitKey){
      context.clearRect(0,0,512,512);context.drawImage(frames.get(`down/${index}`).image,0,0);
      if(amount>0){
        const pixels=context.getImageData(0,0,512,512),d=pixels.data;
        for(let y=0;y<370;y++)for(let x=0;x<512;x++){
          const i=(y*512+x)*4;if(!d[i+3])continue;
          const r=linear(d[i]/255),g=linear(d[i+1]/255),b=linear(d[i+2]/255);
          const mask=amount*smooth(.08,.25,r)*(1-smooth(.73,.88,g))*smooth(.28,.33,1-y/512);
          d[i]=srgb(r*(1+.05*mask));d[i+1]=srgb(g*(1-.52*mask));d[i+2]=srgb(b*(1-.57*mask));
        }
        context.putImageData(pixels,0,0);
      }
      portraitKey=key;
    }
    for(const node of nodes)if(node.dataset.frame!==key){const ctx=node.getContext('2d');ctx.clearRect(0,0,128,128);ctx.drawImage(source,96,150,320,320,0,0,128,128);node.dataset.frame=key;}
  };
  rig.showActionFrame('idle',0);
}
