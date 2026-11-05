import test from 'node:test';
import assert from 'node:assert/strict';
import {Combat} from '../dist/combat.js';
import {SQUIRREL_STATS,SQUIRREL_SPAWNS} from '../dist/encounters.js';
import {cellKey} from '../dist/grid.js';
function encounter(){
  const blocked=new Set(['2,2','5,1','1,4']);
  const tiles=Array.from({length:63},(_,i)=>({col:i%9,row:Math.floor(i/9),blocked:blocked.has(`${i%9},${Math.floor(i/9)}`)})).filter(c=>!((c.col===0||c.col===8)&&(c.row===0||c.row===6)));
  return new Combat({tiles,heroes:[{id:'rabbit',maxHp:18,cell:{col:5,row:4}},{id:'rat',maxHp:14,cell:{col:6,row:4}},{id:'raccoon',maxHp:24,cell:{col:6,row:5}}],enemies:SQUIRREL_SPAWNS.map((cell,i)=>({...SQUIRREL_STATS,id:`squirrel-${i+1}`,cell}))});
}
test('mobile squirrels occupy one cell each, path around obstacles and attack only within range',()=>{
  const c=encounter();c.advance();c.advance();assert.equal(c.current.id,'squirrel-1');assert.equal(c.planEnemyAttack(),null);
  const start={...c.current.cell},occupied=c.occupied(c.current.id),plan=c.planEnemyMove();assert.ok(plan.path.length>0&&plan.path.length<=3);
  let previous=start;for(const cell of plan.path){assert.equal(Math.abs(cell.col-previous.col)+Math.abs(cell.row-previous.row),1);assert.equal(cell.blocked,false);assert.equal(occupied.has(cellKey(cell)),false);previous=cell;}
  assert.deepEqual(c.current.cell,start);assert.equal(c.enemyAttack().ok,false);
  c.enemyMove();assert.equal(c.occupied().has(cellKey(start)),false);assert.equal(c.occupied().has(cellKey(c.current.cell)),true);
  assert.equal(c.planEnemyAttack().skill,'Nozada');assert.equal(c.enemyAttack().hits[0].damage,3);assert.equal(c.enemyAttack().ok,false);
  c.reset();assert.deepEqual(c.enemies[0].cell,start);assert.ok(c.enemies.every(e=>e.hp===12));
});
test('targeted damage and bleeding affect only the chosen squirrel; victory requires all enemies',()=>{
  const c=encounter(),[a,b,d]=c.enemies;c.current.cell={col:4,row:3};
  assert.equal(c.attack(true,b).ok,true);assert.equal(b.hp,8);assert.equal(a.hp,12);assert.equal(d.hp,12);assert.equal(b.bleeding.turns,3);
  b.hp=7;assert.equal(c.attack(false,b).ok,true);assert.equal(b.hp,0);assert.equal(c.status,'playing');assert.equal(c.queue.includes(b),false);assert.equal(c.selectTarget(b.id),false);
  a.hp=0;d.hp=0;c.checkOutcome();assert.equal(c.status,'victory');
});
test('a barrage remains pinned to its target and stops when that squirrel dies',()=>{
  const c=encounter();c.advance();c.current.cell={col:4,row:3};c.random=()=>.99;
  const [a,b]=c.enemies;b.hp=2;assert.equal(c.beginBarrage(b).ok,true);assert.equal(c.selectTarget(a.id),false);
  assert.equal(c.barrageHit().hits[0].target,b.id);assert.equal(c.barrageHit().hits[0].hp,0);assert.equal(c.barrage,null);assert.equal(a.hp,12);assert.equal(c.status,'playing');assert.equal(c.current.mana,2);
});
test('bleeding death skips one enemy without ending the remaining encounter',()=>{
  const c=encounter();c.enemies[0].hp=3;c.enemies[0].bleeding={damage:3,turns:3,source:'rat'};
  c.advance();c.advance();assert.equal(c.current.id,'squirrel-2');assert.equal(c.enemies[0].hp,0);assert.equal(c.status,'playing');assert.equal(c.turnResults[0].hits[0].target,'squirrel-1');assert.equal(c.turnResults[0].hits[0].hp,0);
});
test('a surrounded squirrel waits without entering blocked or occupied cells',()=>{
  const c=encounter();c.advance();c.advance();const origin=c.current.cell;
  for(const tile of c.tiles)if(Math.abs(tile.col-origin.col)+Math.abs(tile.row-origin.row)===1)tile.blocked=true;
  assert.equal(c.planEnemyMove(),null);assert.equal(c.planEnemyAttack(),null);assert.equal(c.advance(),true);assert.equal(c.current.id,'squirrel-2');
});
test('the acorn lands beside the target, and the squirrel can fetch it and flee to maximum range',()=>{
  const c=encounter();c.advance();c.advance();c.enemyMove();
  const [target]=c.planEnemyAttack().targets;
  const occupied=c.occupied(c.current.id);
  const pickup=c.squirrelPickup(target);
  assert.equal(c.distance({cell:pickup.cell},target),1);
  assert.ok(pickup.path.every(cell=>!cell.blocked&&!occupied.has(cellKey(cell))));
  assert.equal(c.enemyAttack().hits[0].damage,3);
  c.current.cell={...pickup.cell};
  const retreat=c.squirrelRetreat();
  assert.ok(retreat.length>0);
  assert.ok(retreat.every(cell=>!cell.blocked&&!occupied.has(cellKey(cell))));
  assert.equal(Math.min(...c.heroes.map(hero=>c.distance({cell:retreat.at(-1)},hero))),c.current.range);
  assert.equal(c.enemyAttack().ok,false);
});
test('unreachable pickups and blocked retreats do not move the squirrel through obstacles',()=>{
  const c=encounter();c.advance();c.advance();c.enemyMove();
  const [target]=c.planEnemyAttack().targets;
  for(const tile of c.tiles)if(c.distance({cell:tile},target)===1&&cellKey(tile)!==cellKey(c.current.cell))tile.blocked=true;
  assert.equal(c.squirrelPickup(target).path,null);
  c.current.cell={col:4,row:4};
  for(const tile of c.tiles)if(c.distance({cell:tile},c.current)===1)tile.blocked=true;
  assert.deepEqual(c.squirrelRetreat(),[]);
});
