import test from 'node:test';
import assert from 'node:assert/strict';
import { Group,Vector3 } from '../dist/vendor/three.module.js';
import { creatures,articulatedParts,mutationPart,ragePart } from '../dist/characters.js';
import { ACTIONS,bindRig,idlePose,actionPose,locomotionPose,movementSample,socketPosition,startRecoil,startBleedTick,reactionPose,resetPose } from '../dist/animation.js';
import { directionalParts } from '../dist/directional-art.js';

function makeRig(id){
  const def=creatures.find(c=>c.id===id),root=new Group(),art=new Group(),parts={};root.add(art);
  art.scale.set(.0047,-.0047,.0047);
  for(const p of [...articulatedParts(def),...['tail','horn','eye'].map(id=>mutationPart(def,id)),ragePart(def)]){
    const g=new Group();g.position.set(...p.pivot,0);g.userData={baseX:p.pivot[0],baseY:p.pivot[1]};art.add(g);parts[p.name]=g;
  }
  const rig={root,art,parts,phase:0,reaction:0};bindRig(rig,id);return rig;
}
function transforms(rig){return [...rig.rest.keys()].map(p=>[...p.position,...p.scale,p.rotation.z]);}

test('articulation preserves SVG pivots and carries facial features with the head',()=>{
  const rig=makeRig('rabbit'),eye=rig.parts.eyeL;
  rig.root.updateMatrixWorld(true);
  const before=eye.getWorldPosition(new Vector3());
  assert.ok(before.distanceTo(new Vector3(125*.0047,197*-.0047,0))<1e-9);
  rig.joints.skull.position.x+=20;rig.root.updateMatrixWorld(true);
  assert.ok(Math.abs(eye.getWorldPosition(new Vector3()).x-before.x-20*.0047)<1e-9);
  assert.equal(rig.parts.mut_horn.parent,rig.parts.head.parent);
  assert.notEqual(rig.parts.armL,rig.parts.armR);assert.notEqual(rig.parts.legL,rig.parts.legR);
});

test('every hero action returns all joints to idle without accumulating a pose',()=>{
  for(const id of ['rabbit','rat','raccoon']){
    const rig=makeRig(id);idlePose(rig,2);const baseline=transforms(rig);
    for(let cycle=0;cycle<10;cycle++)for(let i=0;i<=100;i++){idlePose(rig,2);actionPose(rig,id,i/100,-1);}
    assert.deepEqual(transforms(rig),baseline,id);
    idlePose(rig,2);actionPose(rig,id,.4,-1);const held=transforms(rig);
    for(let i=0;i<10;i++){idlePose(rig,2);actionPose(rig,id,.4,-1);}
    assert.deepEqual(transforms(rig),held,`${id} stays frozen on pause`);
  }
});

test('hopping animals plant, push off, travel in the air and land exactly on the destination',()=>{
  for(const id of ['rabbit']){
    assert.deepEqual(movementSample(id,0),{travel:0,lift:0});assert.equal(movementSample(id,.1).travel,0);
    assert.ok(movementSample(id,.5).lift>.2);assert.equal(movementSample(id,.9).travel,1);
    const end=movementSample(id,1);assert.equal(end.travel,1);assert.ok(Math.abs(end.lift)<1e-10);
    const rig=makeRig(id);idlePose(rig,2);locomotionPose(rig,.5);assert.ok(Math.abs(rig.parts.legL.rotation.z)>.1);
  }
});

test('rat strides alternate the two feet and the throwing socket follows a facing change',()=>{
  const rig=makeRig('rat');idlePose(rig,2);locomotionPose(rig,.25);
  assert.ok(rig.parts.legL.rotation.z*rig.parts.legR.rotation.z<0);
  idlePose(rig,2);actionPose(rig,'rat',.28);const right=socketPosition(rig,'armR',181,282,new Vector3());
  rig.facing=-1;idlePose(rig,2);actionPose(rig,'rat',.28,-1);const left=socketPosition(rig,'armR',181,282,new Vector3());
  assert.ok(Math.abs((right.x+left.x)/2-150*.0047)<1e-9);assert.ok(Math.abs(right.y-left.y)<1e-9);
});

test('the supporting rat paw stays on the ground while the body travels forward',()=>{
  const rig=makeRig('rat'),planted=[];
  for(const progress of [.12,.16,.2]){
    rig.root.position.x=progress*1.23;idlePose(rig,2);locomotionPose(rig,progress);
    planted.push(socketPosition(rig,'legL',100,326,new Vector3()).x);
  }
  assert.ok(Math.max(...planted)-Math.min(...planted)<.025,'support foot must counter the board movement');
});

test('damage recoil settles and restarting clears deformed joints',()=>{
  const rig=makeRig('raccoon');startRecoil(rig,-1,8);idlePose(rig,2);reactionPose(rig,.12);
  assert.notEqual(rig.joints.torso.rotation.z,0);
  for(let i=0;i<80;i++){idlePose(rig,2);reactionPose(rig,1/120);}
  assert.equal(rig.recoil,null);assert.equal(rig.joints.torso.rotation.z,0);
  actionPose(rig,'raccoon',.5);resetPose(rig);assert.equal(rig.parts.openMouth.visible,false);
  for(const [p,rest] of rig.rest){assert.deepEqual(p.position,rest.position);assert.deepEqual(p.scale,rest.scale);}
  for(const action of Object.values(ACTIONS)){assert.ok(action.release<=action.impact);assert.ok(action.impact<1);}
});

function bossRig(){
  const root=new Group(),art=new Group(),parts={};root.add(art);
  art.scale.set(.0082,-.0082,.0082);art.position.set(-150*.0082,330*.0082,0);
  for(const def of directionalParts('rosnaldo','right')){
    const p=new Group();p.position.set(...def.pivot,0);p.userData={baseX:def.pivot[0],baseY:def.pivot[1]};art.add(p);parts[def.name]=p;
  }
  const rig={root,art,parts,phase:0,reaction:0};bindRig(rig,'rosnaldo');return rig;
}

test('bleeding tick stays rooted and the defeat holds its final pose',()=>{
  const rig=bossRig();idlePose(rig,2);const baseline=transforms(rig);
  startBleedTick(rig,1);idlePose(rig,2);reactionPose(rig,.2);
  assert.notEqual(rig.joints.maneBack.rotation.z,0,'a juba sente o sangramento');
  for(let i=0;i<200;i++){idlePose(rig,2);reactionPose(rig,1/120);}
  assert.equal(rig.bleedTick,null);
  assert.deepEqual(transforms(rig),baseline,'o sangramento nao desloca o corpo');
  rig.death={elapsed:0,direction:1};
  for(let i=0;i<200;i++){idlePose(rig,2);reactionPose(rig,1/120);}
  const held=transforms(rig),artY=rig.art.position.y;
  assert.ok(artY<rig.artOrigin.y,'o corpo desceu ao chão');
  assert.notDeepEqual(held,baseline);
  for(let i=0;i<400;i++){idlePose(rig,2);reactionPose(rig,1/120);}
  assert.deepEqual(transforms(rig),held,'a última pose da derrota é sustentada');
  assert.equal(rig.art.position.y,artY);
  rig.death=null;idlePose(rig,2);
  assert.deepEqual(transforms(rig),baseline,'reiniciar volta ao repouso');
});

