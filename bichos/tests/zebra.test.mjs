import test from 'node:test';
import assert from 'node:assert/strict';
import {Combat} from '../dist/combat.js';
import {ZEBRA_STATS,ZEBRA_SPAWNS,SQUIRREL_STATS} from '../dist/encounters.js';
import {ZEBRA_SEQUENCES,ZEBRA_IMPACT,zebraPose} from '../dist/zebra-png-frames.js';
import {cellKey} from '../dist/grid.js';

function encounter(){
  const tiles=Array.from({length:63},(_,i)=>({col:i%9,row:Math.floor(i/9),blocked:i%9===3&&Math.floor(i/9)===1}));
  const c=new Combat({tiles,heroes:[{id:'rabbit',maxHp:18,cell:{col:5,row:4}},{id:'rat',maxHp:14,cell:{col:6,row:4}},{id:'raccoon',maxHp:24,cell:{col:6,row:5}}],enemies:[{...SQUIRREL_STATS,id:'squirrel-1',cell:{col:2,row:1}},{...SQUIRREL_STATS,id:'squirrel-2',cell:{col:2,row:3}},{...ZEBRA_STATS,id:'zebra-1',cell:{...ZEBRA_SPAWNS[0]}}]});
  while(c.current.kind!=='zebra')c.advance();return c;
}
test('zebra paths around blocked and occupied cells and cannot kick at range',()=>{
  const c=encounter(),z=c.current,start={...z.cell},occupied=c.occupied(z.id),plan=c.planEnemyMove();
  assert.equal(c.cellsOf(z).length,1);assert.equal(z.hp,18);assert.equal(c.planEnemyAttack(),null);
  assert.ok(plan.path.length>0&&plan.path.length<=3);
  let previous=start;for(const cell of plan.path){assert.equal(Math.abs(cell.col-previous.col)+Math.abs(cell.row-previous.row),1);assert.equal(cell.blocked,false);assert.equal(occupied.has(cellKey(cell)),false);previous=cell;}
  assert.deepEqual(z.cell,start);c.enemyMove();assert.deepEqual(z.cell,plan.path.at(-1));
  assert.equal(c.planEnemyAttack(),null);assert.equal(c.enemyAttack().ok,false);
});
test('adjacent zebra kicks once for five and never uses boss roar or summons',()=>{
  const c=encounter(),z=c.current;c.heroes[1].cell={col:z.cell.col+1,row:z.cell.row};
  assert.equal(c.planEnemyMove(),null);const plan=c.planEnemyAttack();assert.equal(plan.skill,'Coice');assert.equal(plan.targets.length,1);assert.equal(plan.targets[0].id,'rat');
  const hp=c.heroes.map(h=>h.hp),hit=c.enemyAttack();assert.equal(hit.hits[0].damage,5);assert.equal(c.heroes[1].hp,hp[1]-5);assert.equal(c.heroes[0].hp,hp[0]);assert.equal(c.enemyAttack().ok,false);assert.equal(c.enemies.length,3);
});
test('trapped zebra passes and reset restores position health and bleeding',()=>{
  const c=encounter(),z=c.current,start={...z.cell};for(const cell of c.tiles)if(Math.abs(cell.col-start.col)+Math.abs(cell.row-start.row)===1)cell.blocked=true;
  assert.equal(c.enemyMove(),null);assert.equal(c.planEnemyAttack(),null);assert.equal(c.advance(),true);
  z.hp=2;z.bleeding={damage:3,turns:1};z.cell={col:4,row:3};c.reset();assert.equal(z.hp,18);assert.equal(z.bleeding,null);assert.deepEqual(z.cell,start);
});
test('killing the zebra leaves the squirrel encounter active',()=>{
  const c=encounter(),z=c.current;z.hp=3;z.bleeding={damage:3,turns:1,source:'rat'};
  c.cursor=c.order.indexOf(z)-1;c.advance();assert.equal(z.hp,0);assert.equal(c.status,'playing');assert.equal(c.queue.includes(z),false);assert.equal(c.turnResults[0].hits[0].target,z.id);
});
test('kick damage coincides with extended rear hooves and defeat holds last drawing',()=>{
  assert.equal(zebraPose('zebraKick',ZEBRA_IMPACT),5);assert.equal(zebraPose('zebraKick',.2),4);
  assert.equal(zebraPose('death',1),8);assert.equal(zebraPose('death',4),8);
  for(const sequence of Object.values(ZEBRA_SEQUENCES))assert.ok(sequence.every(p=>p>=0&&p<9));
});
