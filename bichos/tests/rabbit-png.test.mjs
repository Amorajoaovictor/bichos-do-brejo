import test from 'node:test';
import assert from 'node:assert/strict';
import {rabbitFrame,rabbitReliefFrame,barrageFlush,RABBIT_PNG_TIMING,RABBIT_RELIEF_HOLD,rabbitPreviewDuration,rabbitPreviewProgress} from '../dist/rabbit-png-frames.js';
import {ACTIONS} from '../dist/animation.js';

test('PNG kick holds its contact drawing at the existing damage event',()=>{
  assert.equal(rabbitFrame('rabbit',ACTIONS.rabbit.impact),10);
  assert.equal(rabbitFrame('rabbit',1),0);
  assert.equal(RABBIT_PNG_TIMING.rabbit,ACTIONS.rabbit.duration);
});
test('all ten contractions stay on closed-eye drawings without idle blinking',()=>{
  let pulses=0,previous=13;
  for(let frame=0;frame<2300;frame++){
    const p=frame/2300,index=rabbitFrame('barrage',p);
    if(p>=.18)assert.ok(index===13||index===14);
    if(index===14&&previous!==14)pulses++;
    previous=index;
  }
  assert.equal(pulses,10);
  assert.equal(rabbitFrame('barrage',1),24);
  assert.equal(barrageFlush(0),0);assert.equal(barrageFlush(1),0);
  assert.equal(RABBIT_PNG_TIMING.barrage,ACTIONS.barrage.duration);
});
test('PNG defeat holds its final drawing; relief suppresses the idle blink',()=>{
  assert.equal(rabbitFrame('death',1),23);assert.equal(rabbitFrame('death',9),23);
  for(let p=0;p<=1;p+=.01)assert.equal(rabbitFrame('idle',p,'relief'),26);
  assert.equal(rabbitFrame('walk',.1),4);assert.equal(rabbitFrame('walk',.5),6);assert.equal(rabbitFrame('walk',1),0);
});
test('the looping PNG preview holds relief for 1.8 seconds after all ten shots',()=>{
  const action=RABBIT_PNG_TIMING.barrage;
  assert.equal(rabbitPreviewDuration('barrage'),action+RABBIT_RELIEF_HOLD);
  for(const elapsed of [action,action+.1,action+1,action+RABBIT_RELIEF_HOLD-.001]){
    const progress=rabbitPreviewProgress('barrage',elapsed);
    assert.equal(progress,1);assert.equal(rabbitFrame('barrage',progress),24);assert.equal(barrageFlush(progress),0);
  }
  assert.equal(rabbitFrame('barrage',rabbitPreviewProgress('barrage',action+RABBIT_RELIEF_HOLD+.01)),12);
  assert.equal(rabbitPreviewProgress('death',5),1);
});
test('relief releases the strain, sighs and settles without reopening the eyes',()=>{
  assert.equal(rabbitReliefFrame(0),24);assert.equal(rabbitReliefFrame(.3),25);assert.equal(rabbitReliefFrame(.8),26);
  assert.equal(rabbitFrame('idle',.5,'relief',0),24);
  assert.equal(rabbitFrame('idle',.5,'relief',.3),25);
  assert.equal(rabbitFrame('idle',.5,'relief',1),26);
});
