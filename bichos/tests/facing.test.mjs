import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { Group,Vector3 } from '../dist/vendor/three.module.js';
import { creatures,articulatedParts,mutationPart,ragePart } from '../dist/characters.js';
import { bindRig,idlePose,actionPose,locomotionPose,socketPosition,resetPose } from '../dist/animation.js';
import { DIRECTIONS,directionFromDelta,installViews,setDirection,faceToward,forEachView } from '../dist/facing.js';
import { directionalParts } from '../dist/directional-art.js';
import { bossPngLayout } from '../dist/boss-png-layout.js';

function vector(def){const p=new Group();p.position.set(...def.pivot,0);p.userData={baseX:def.pivot[0],baseY:def.pivot[1]};return p;}
function rigFor(id){
  const root=new Group(),art=new Group(),parts={};root.add(art);art.scale.set(.0047,-.0047,.0047);
  const def=creatures.find(c=>c.id===id);
  const defs=def?[...articulatedParts(def),...['tail','horn','eye'].map(m=>mutationPart(def,m)),ragePart(def)]:directionalParts(id,'right');
  for(const p of defs){parts[p.name]=vector(p);art.add(parts[p.name]);if(p.name.startsWith('mut_')||p.name==='rage')parts[p.name].visible=false;}
  const rig={root,art,parts,reaction:0};bindRig(rig,id);installViews(rig,vector);return rig;
}
const poseState=rig=>[...rig.rest.keys()].map(p=>[...p.position,...p.scale,p.rotation.z]);

test('Farrapo braces its paws through each barrage contraction and recovers its original pose',()=>{
  const rig=rigFor('rabbit');
  for(const direction of DIRECTIONS){
    setDirection(rig,direction);idlePose(rig,2);const idle=poseState(rig);
    const points=direction==='right'||direction==='left'?{legL:[133.5,328],legR:[164.8,327],armL:[145.1,333],armR:[173,333]}:
      direction==='up'?{legL:[100,325],legR:[200,325],armL:[101,329],armR:[199,329]}:
      {legL:[98,327],legR:[211,327],armL:[102,333],armR:[195,333]};
    const contacts=Object.entries(points).map(([name,[x,y]])=>{
      const part=rig.parts[name],local=new Vector3(x-part.userData.baseX,y-part.userData.baseY,0);
      rig.root.updateMatrixWorld(true);return {part,local,before:part.localToWorld(local.clone())};
    });
    for(let i=1;i<230;i++){
      idlePose(rig,2);actionPose(rig,'barrage',i/230);rig.root.updateMatrixWorld(true);
      for(const {part,local,before} of contacts)assert.ok(part.localToWorld(local.clone()).distanceTo(before)<1e-9,`${direction}: ${i} keeps the support paw planted`);
      assert.ok(Math.abs(rig.parts.armR.rotation.z)<.1,'arms remain beside the body');
      assert.ok(Math.abs(rig.joints.skull.rotation.z)<.08,'the face remains upright');
    }
    idlePose(rig,2);actionPose(rig,'barrage',1);assert.deepEqual(poseState(rig),idle);
  }
});

test('board headings cover all axes, preserve still/tied headings and ignore camera tilt',()=>{
  assert.equal(directionFromDelta(3,1),'right');assert.equal(directionFromDelta(-3,1),'left');
  assert.equal(directionFromDelta(1,-3),'up');assert.equal(directionFromDelta(1,3),'down');
  assert.equal(directionFromDelta(0,0,'left'),'left');assert.equal(directionFromDelta(2,-2,'right'),'right');
  assert.equal(directionFromDelta(2,-2,'up'),'up');assert.equal(directionFromDelta(2,-2,'down'),'up');
});

test('every animal has an articulated profile and a real back without face features',()=>{
  for(const id of ['rabbit','rat','raccoon','rosnaldo']){
    const back=directionalParts(id,'up'),profile=directionalParts(id,'right');
    for(const name of ['eyeL','eyeR','muzzle','mut_eye','rage'])assert.equal(back.find(p=>p.name===name).svg,'',`${id}: ${name} cannot show through the back`);
    if(id!=='rosnaldo')assert.ok(back.find(p=>p.name==='body').svg,`${id}: the back keeps its drawing`);
    assert.equal(new Set(back.map(p=>p.name)).size,back.length);
    assert.equal(new Set(profile.map(p=>p.name)).size,profile.length);
    if(id==='rosnaldo'){
      assert.equal(profile.find(p=>p.name==='body').svg,'');
      assert.equal(back.find(p=>p.name==='body').svg,'');
      for(const view of DIRECTIONS)assert.ok(bossPngLayout.idle[view].size>0,`PNG idle ${view}`);
    }else{
      assert.notEqual(back.find(p=>p.name==='head').svg,profile.find(p=>p.name==='head').svg);
      for(const view of [back,profile])for(const name of ['legL','legR','armL','armR','head','body'])assert.ok(view.find(p=>p.name===name)?.svg,`${id}: ${name}`);
    }
  }
});

test('switching view keeps feet, mutations and rage while activating exactly one skeleton',()=>{
  for(const id of ['rabbit','rat','raccoon','rosnaldo']){
    const rig=rigFor(id),position=rig.root.position.clone();
    rig.parts.rage.visible=true;if(rig.parts.mut_horn)rig.parts.mut_horn.visible=true;
    for(const direction of [...DIRECTIONS,...DIRECTIONS]){
      setDirection(rig,direction);idlePose(rig,2);
      assert.equal(Object.values(rig.views).filter(v=>v.art.visible).length,1);
      assert.equal(rig.direction,direction);assert.deepEqual(rig.root.position,position);
      assert.equal(rig.parts.rage.visible,true);if(rig.parts.mut_horn)assert.equal(rig.parts.mut_horn.visible,true);
      assert.equal(Math.sign(rig.joints.torso.scale.x),direction==='left'&&id!=='rosnaldo'?-1:1);
    }
    faceToward(rig,new Vector3(0,0,-3));assert.equal(rig.direction,'up');
  }
});

test('all four attack and movement poses settle, stay frozen and keep sockets finite',()=>{
  for(const id of ['rabbit','rat','raccoon','rosnaldo'])for(const direction of DIRECTIONS){
    const rig=rigFor(id);setDirection(rig,direction);idlePose(rig,2);const idle=poseState(rig);
    for(const kind of id==='rosnaldo'?['bite','roar']:[id]){
      for(let i=0;i<=100;i++){idlePose(rig,2);actionPose(rig,kind,i/100);}
      assert.deepEqual(poseState(rig),idle,`${id} ${direction} ${kind} settles`);
      idlePose(rig,2);actionPose(rig,kind,.49);const held=poseState(rig);
      for(let i=0;i<5;i++){idlePose(rig,2);actionPose(rig,kind,.49);assert.deepEqual(poseState(rig),held);}
      const socket=socketPosition(rig,id==='rat'?'armR':'muzzle',150,230,new Vector3());
      assert.ok([...socket].every(Number.isFinite));
      assert.notDeepEqual(held,idle);
    }
    if(id!=='rosnaldo'){idlePose(rig,2);locomotionPose(rig,.3);assert.notDeepEqual(poseState(rig),idle);}
    forEachView(rig,resetPose);idlePose(rig,2);assert.deepEqual(poseState(rig),idle);
  }
});

test('profile muzzle and hand sockets mirror with the complete attack, including torso thrust',()=>{
  for(const id of ['rabbit','rat','raccoon','rosnaldo']){
    const rig=rigFor(id),sockets=[];
    for(const direction of ['right','left']){setDirection(rig,direction);idlePose(rig,2);actionPose(rig,id==='rosnaldo'?'bite':id,.49);sockets.push(socketPosition(rig,id==='rat'?'armR':'muzzle',150,230,new Vector3()));}
    if(id==='rosnaldo'){
      // The independently drawn left profile has its own proportions and
      // anatomical marks. Its attack still has to reach to the left.
      assert.ok(sockets[0].x>150*.0047&&sockets[1].x<150*.0047,id);
      assert.notEqual(bossPngLayout.idle.left.prefix,bossPngLayout.idle.right.prefix);
    }else{
      assert.ok(Math.abs(sockets[0].x+sockets[1].x-300*.0047)<1e-8,id);
      assert.ok(Math.abs(sockets[0].y-sockets[1].y)<1e-8,id);
    }
  }
});

test('Rosnaldo has every approved PNG frame and a placement for all actions and directions',()=>{
  for(const [kind,views] of Object.entries(bossPngLayout))for(const direction of DIRECTIONS){
    const layout=views[direction];assert.ok(layout,`${kind} ${direction}`);
    assert.equal(layout.offsets.length,12);
    assert.ok(layout.size>0&&layout.k>0);
    for(let i=1;i<=12;i++){
      const file=new URL(`../art/rosnaldo/${layout.folder}/quadros/${layout.prefix}-${String(i).padStart(2,'0')}.png`,import.meta.url);
      assert.ok(existsSync(file),file.pathname);
      assert.ok(layout.offsets[i-1].every(Number.isFinite));
    }
  }
});

