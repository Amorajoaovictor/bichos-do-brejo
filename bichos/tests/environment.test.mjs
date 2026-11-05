import test from 'node:test';
import assert from 'node:assert/strict';
import { Combat } from '../dist/combat.js';
import { footprintCells,cellKey } from '../dist/grid.js';
import { PROP_LAYOUT } from '../dist/environment.js';

function encounter(props=[{id:'rock',kind:'rock',cell:{col:5,row:4}},{id:'log',kind:'log',cell:{col:3,row:4}}]){
  return new Combat({tiles:Array.from({length:63},(_,i)=>({col:i%9,row:Math.floor(i/9)})),props,heroes:[{id:'rabbit',name:'Farrapo',maxHp:18,cell:{col:4,row:4}},{id:'rat',name:'Fusível',maxHp:14,cell:{col:6,row:4}},{id:'raccoon',name:'Graxinin',maxHp:24,cell:{col:5,row:5}}],enemies:[{id:'boss',name:'Boss',maxHp:120,cells:footprintCells({col:1,row:3},2,2)}]});
}
test('bonus rock requires confirmation, adjacency and range; spends only bonus and hits at impact',()=>{
  const c=encounter(),hero=c.current;
  assert.equal(c.canInteract('rock').ok,true);assert.equal(c.props[0].used,false);assert.equal(c.bonusRemaining,1);
  assert.equal(c.beginInteraction('rock').ok,false);
  assert.equal(c.beginInteraction('rock',c.boss).ok,false);assert.equal(c.bonusRemaining,1);
  hero.cell={col:4,row:4};c.movesRemaining=0;c.attacksRemaining=0;hero.mana=0;
  assert.equal(c.beginInteraction('rock',c.boss).ok,true);assert.equal(c.boss.hp,120);assert.equal(c.bonusRemaining,0);
  assert.equal(c.advance(),false);assert.equal(c.canMove({col:4,row:5}).ok,false);
  assert.equal(c.interactionHit().hits[0].damage,4);assert.equal(c.boss.hp,116);
  assert.equal(c.movesRemaining,0);assert.equal(c.attacksRemaining,0);assert.equal(hero.mana,0);
  assert.equal(c.interactionHit().ok,false);assert.equal(c.beginInteraction('rock',c.boss).ok,false);
});
test('Graxinin consumes carried ammo, collects a stone as bonus, then throws it as a basic attack',()=>{
  const c=encounter();while(c.current.id!=='raccoon')c.advance();c.current.cell={col:5,row:4};
  assert.equal(c.current.carried.kind,'can');assert.equal(c.canInteract('rock').ok,false);
  assert.equal(c.attack().objectKind,'can');assert.equal(c.current.carried,null);assert.equal(c.bonusRemaining,1);
  assert.equal(c.beginInteraction('rock').ok,true);assert.equal(c.current.carried,null);
  c.interactionHit();assert.equal(c.current.carried.kind,'rock');assert.equal(c.attacksRemaining,0);assert.equal(c.bonusRemaining,0);
  while(c.current.id!=='rat')c.advance();while(c.current.id!=='raccoon')c.advance();
  assert.equal(c.bonusRemaining,1);assert.equal(c.attack().objectKind,'rock');assert.equal(c.boss.hp,104);assert.equal(c.current.carried,null);
  while(c.current.id!=='rat')c.advance();while(c.current.id!=='raccoon')c.advance();assert.equal(c.canAttack().ok,false);assert.equal(c.canAttack(true).ok,true); // no carried object is required for the special
  c.current.cell={col:4,row:4};assert.equal(c.canAttack(true).ok,true);assert.equal(c.canAttack().ok,false);
});
test('log blocks paths, rolls away from the adjacent hero and hits a 2 × 2 boss only once',()=>{
  const c=encounter();c.advance();
  assert.equal(c.occupied().has('3,4'),true);assert.equal(c.canMove({col:3,row:4}).ok,false);
  const plan=c.canInteract('log');assert.equal(plan.ok,true);assert.deepEqual(plan.path.map(cellKey),['2,4','1,4','0,4']);assert.deepEqual(plan.hits,[{target:'boss',step:1}]);
  c.beginInteraction('log');assert.equal(c.boss.hp,120);assert.equal(c.occupied().has('3,4'),false);
  assert.equal(c.interactionHit(1).hits[0].damage,8);assert.equal(c.interactionHit(1).hits.length,0);assert.equal(c.interactionHit(2).hits.length,0);assert.equal(c.boss.hp,112);
  c.finishInteraction();assert.equal(c.beginInteraction('log').ok,false);
});
test('rolling stops before terrain, live allies, other logs and missing cells; does not harm heroes',()=>{
  const c=encounter();c.advance();c.heroes[1].cell={col:1,row:4};
  assert.deepEqual(c.canInteract('log').path.map(cellKey),['2,4']);
  c.heroes[1].cell={col:2,row:4};assert.equal(c.canInteract('log').ok,false);assert.equal(c.bonusRemaining,1);
  c.heroes[1].hp=0;assert.equal(c.canInteract('log').ok,true);
  c.tiles.find(t=>cellKey(t)==='2,4').blocked=true;assert.equal(c.canInteract('log').ok,false);
  c.tiles.find(t=>cellKey(t)==='2,4').blocked=false;c.props.push({id:'other',kind:'log',cell:{col:2,row:4}});assert.equal(c.canInteract('log').ok,false);
  c.props.pop();c.tiles=c.tiles.filter(t=>cellKey(t)!=='2,4');assert.equal(c.canInteract('log').ok,false);
});
test('log damages multiple enemies on their contact steps, and the final hit wins',()=>{
  const c=encounter();c.advance();c.boss.hp=8;c.enemies.push({id:'small',team:'enemy',hp:8,maxHp:8,cell:{col:0,row:4}});c.actors.push(c.enemies[1]);
  c.beginInteraction('log');c.interactionHit(1);assert.equal(c.status,'playing');assert.equal(c.boss.hp,0);
  assert.equal(c.interactionHit(3).hits[0].target,'small');assert.equal(c.status,'victory');c.finishInteraction();assert.equal(c.canInteract('rock').ok,false);
});
test('restart restores consumed objects, carried can and bonus, cancels an active interaction',()=>{
  const c=encounter();c.current.cell={col:4,row:4};c.beginInteraction('rock',c.boss);c.reset();
  assert.equal(c.environmentAction,null);assert.ok(c.props.every(p=>!p.used));assert.equal(c.bonusRemaining,1);assert.equal(c.heroes[2].carried.kind,'can');assert.equal(c.boss.hp,120);
});
test('shipped prop positions avoid blocked terrain and encounter starting actors',()=>{
  const blocked=new Set(['2,2','5,1','1,4','5,4','6,4','6,5','2,1','2,3','3,0','3,2','4,2','3,3','4,3']);
  assert.equal(new Set(PROP_LAYOUT.map(p=>cellKey(p.cell))).size,PROP_LAYOUT.length);
  assert.ok(PROP_LAYOUT.every(p=>!blocked.has(cellKey(p.cell))));
});
