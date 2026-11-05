import test from 'node:test';
import assert from 'node:assert/strict';
import { Combat } from '../dist/combat.js';
import { footprintCells,cellKey } from '../dist/grid.js';

function encounter(props=[]){
  const blocked=new Set(['2,2','5,1','1,4']);
  const tiles=Array.from({length:63},(_,i)=>({col:i%9,row:Math.floor(i/9),blocked:blocked.has(`${i%9},${Math.floor(i/9)}`)}));
  return new Combat({tiles,props,heroes:[{id:'rabbit',name:'Farrapo',maxHp:18,cell:{col:5,row:4}},{id:'rat',name:'Fusível',maxHp:14,cell:{col:6,row:4}},{id:'raccoon',name:'Graxinin',maxHp:24,cell:{col:6,row:5}}],boss:{id:'boss',name:'Rosnaldo',maxHp:120,cells:footprintCells({col:3,row:2},2,2)}});
}

test('mana belongs to each hero, regenerates only on their turn and respects its cap',()=>{
  const c=encounter();assert.ok(c.heroes.every(h=>h.mana===10));
  c.attack(true);assert.equal(c.current.mana,5);assert.equal(c.attacksRemaining,1);
  c.advance();assert.equal(c.heroes[1].mana,5);c.advance();c.advance();assert.equal(c.heroes[1].mana,5);
  c.advance();assert.equal(c.current.mana,8);
  for(let i=0;i<4;i++)c.advance();assert.equal(c.current.mana,10);
  c.current.mana=0;assert.equal(c.attack(true).ok,false);assert.equal(c.attacksRemaining,1);
  assert.equal(c.attack().ok,true);assert.equal(c.current.mana,0);
  c.reset();assert.ok(c.heroes.every(h=>h.mana===10));assert.equal(c.boss.bleeding,null);
});

test('rabbit fires ten independently critical pellets and spends only mana once',()=>{
  const c=encounter();c.advance();let rolls=0;c.random=()=>rolls++%2===0?0:.99;
  assert.equal(c.canAttack().ok,false);assert.equal(c.canAttack(true).ok,true);
  const result=c.attack(true);assert.equal(result.hits.length,10);assert.equal(rolls,10);
  assert.deepEqual(result.hits.map(h=>h.damage),[2,1,2,1,2,1,2,1,2,1]);
  assert.equal(c.boss.hp,105);assert.equal(c.current.mana,2);assert.equal(c.attacksRemaining,1);
  assert.equal(c.attack(true).ok,false);assert.equal(c.boss.hp,105);assert.equal(c.attacksRemaining,1);
});

test('animated barrage locks other actions, applies damage per impact and can be reset',()=>{
  const c=encounter();c.advance();c.random=()=>.99;
  assert.equal(c.beginBarrage().ok,true);assert.equal(c.boss.hp,120);assert.equal(c.attacksRemaining,1);assert.equal(c.current.mana,2);
  assert.equal(c.move({col:5,row:3}).ok,false);assert.equal(c.attack().ok,false);assert.equal(c.advance(),false);
  for(let i=0;i<10;i++){assert.equal(c.barrageHit().hits[0].hp,119-i);assert.equal(c.attacksRemaining,1);assert.equal(c.current.mana,2);}
  assert.equal(c.barrage,null);assert.equal(c.barrageHit().ok,false);assert.equal(c.boss.hp,110);
  c.reset();c.advance();c.beginBarrage();c.barrageHit();c.reset();assert.equal(c.barrage,null);assert.equal(c.boss.hp,120);assert.equal(c.heroes[0].mana,10);
});

test('pellet damage is clamped on lethal impact and the volley ends on victory',()=>{
  const c=encounter();c.advance();c.random=()=>0;c.boss.hp=3;
  const result=c.attack(true);assert.deepEqual(result.hits.map(h=>h.damage),[2,1]);
  assert.equal(c.status,'victory');assert.equal(c.barrage,null);assert.equal(c.boss.hp,0);assert.equal(c.advance(),false);
});

test('specials reject invalid turns, mana and range without spending resources',()=>{
  const c=encounter();c.current.cell={col:8,row:6};assert.equal(c.attack(true).ok,false);assert.equal(c.current.mana,10);assert.equal(c.attacksRemaining,1);
  c.current.cell={col:6,row:4};c.current.mana=4;assert.equal(c.attack(true).ok,false);assert.equal(c.current.mana,4);
  c.advance();c.advance();assert.equal(c.attack(true).ok,false);assert.equal(c.boss.hp,120);
});

test('bleeding ticks only at the target turn, lasts three turns and refreshes without stacking',()=>{
  const c=encounter();c.attack(true);assert.equal(c.boss.hp,116);assert.equal(c.boss.bleeding.turns,3);
  c.attack(true);assert.equal(c.boss.hp,112);assert.equal(c.boss.bleeding.damage,3);assert.equal(c.boss.bleeding.turns,3);
  c.advance();assert.equal(c.boss.hp,112);c.advance();assert.equal(c.boss.hp,109);assert.equal(c.boss.bleeding.turns,2);assert.equal(c.turnResult.skill,'Sangramento');
  for(let i=0;i<8;i++)c.advance();assert.equal(c.boss.hp,103);assert.equal(c.boss.bleeding,null);
  for(let i=0;i<4;i++)c.advance();assert.equal(c.boss.hp,103);
});

test('bleeding can win the battle before the boss attacks, and reset clears all effects',()=>{
  const c=encounter();c.boss.hp=6;c.attack(true);c.advance();c.advance();
  assert.equal(c.boss.hp,0);assert.equal(c.status,'victory');assert.equal(c.enemyAttack().ok,false);
  c.reset();assert.equal(c.boss.bleeding,null);assert.equal(c.turnResult,null);assert.equal(c.status,'playing');
});

test('Graxinin bottle and mutation bonuses use special damage and range',()=>{
  const c=encounter();c.advance();c.advance();c.advance();
  c.current.cell={col:6,row:4};c.current.mutations.add('horn');c.current.mutations.add('eye');
  assert.equal(c.specialRange(),4);assert.equal(c.specialDamage(),15);
  assert.equal(c.attack(true).hits[0].damage,15);assert.equal(c.current.mana,4);
  assert.deepEqual(c.boss.bleeding,{damage:3,turns:3,source:'raccoon'});
  c.reset();c.advance();c.current.mutations.add('horn');c.random=()=>.99;
  assert.equal(c.attack(true).hits.reduce((n,h)=>n+h.damage,0),13);
});

test('Graxinin basic can does not bleed; bottle applies and refreshes shared bleeding without stacking',()=>{
  const c=encounter();c.advance();c.advance();c.advance();c.current.cell={col:6,row:4};
  assert.equal(c.current.name,'Graxinin');assert.equal(c.current.skill,'Arremessar objeto');assert.equal(c.current.special,'Garrafada');
  c.attack();assert.equal(c.boss.hp,112);assert.equal(c.boss.bleeding,null);assert.equal(c.current.mana,10);
  c.attack(true);assert.equal(c.boss.hp,100);assert.equal(c.current.mana,4);assert.equal(c.attacksRemaining,0);
  assert.deepEqual(c.boss.bleeding,{damage:3,turns:3,source:'raccoon'});
  c.advance();c.advance();c.advance();assert.equal(c.current.team,'enemy');assert.equal(c.boss.hp,97);assert.equal(c.boss.bleeding.turns,2);
  c.advance();c.current.mana=10;c.attack(true);assert.equal(c.boss.bleeding.turns,3);assert.equal(c.boss.bleeding.damage,3);
  c.reset();assert.equal(c.boss.bleeding,null);assert.equal(c.heroes[2].mana,10);
});
test('initiative advances through both teams and wraps into a new round',()=>{
  const c=encounter();assert.deepEqual(c.queue.map(a=>a.id),['rat','rabbit','boss','raccoon']);
  c.advance();assert.equal(c.current.id,'rabbit');c.advance();assert.equal(c.current.id,'boss');assert.equal(c.playerTurn,false);c.advance();assert.equal(c.current.id,'raccoon');c.advance();assert.equal(c.current.id,'rat');assert.equal(c.round,2);assert.equal(c.attacksRemaining,1);
});
test('one attack cannot spend movement or be repeated by default',()=>{
  const c=encounter();assert.equal(c.attack().ok,true);assert.equal(c.boss.hp,113);assert.equal(c.attacksRemaining,0);assert.equal(c.movesRemaining,1);
  assert.equal(c.attack().ok,false);assert.equal(c.boss.hp,113);
  assert.equal(c.move({col:5,row:3}).ok,true);assert.equal(c.movesRemaining,0);assert.equal(c.attack().ok,false);
});
test('moving spends only movement, rejects long routes and avoids four boss cells',()=>{
  const c=encounter();assert.equal(c.move({col:8,row:0}).ok,false);assert.equal(c.attacksRemaining,1);
  for(const cell of c.boss.cells)assert.equal(c.move(cell).ok,false);
  const result=c.move({col:5,row:3});assert.equal(result.ok,true);assert.equal(c.attacksRemaining,1);assert.equal(c.movesRemaining,0);
  assert.equal(c.move({col:6,row:3}).ok,false);assert.equal(c.attack().ok,true);
  assert.equal(result.path.some(cell=>new Set(c.boss.cells.map(cellKey)).has(cellKey(cell))),false);
});
test('melee checks distance to every cell of the boss rather than its center',()=>{
  const c=encounter();c.advance();assert.equal(c.canAttack().ok,false);assert.equal(c.move({col:5,row:3}).ok,true);assert.equal(c.attack().ok,true);assert.equal(c.boss.hp,110);
});
test('combat has no mutation purchase action',()=>{
  const c=encounter();assert.equal(c.mutate,undefined);assert.ok(c.heroes.every(h=>h.mutations.size===0));
});
test('boss attacks automatically planned targets once, armor reduces actual damage',()=>{
  const c=encounter();c.heroes[0].cell={col:5,row:3};c.heroes[0].mutations.add('tail');c.advance();c.advance();
  assert.equal(c.planEnemyAttack().skill,'Mordida');const result=c.enemyAttack();assert.equal(result.hits[0].target,'rabbit');assert.equal(result.hits[0].damage,6);assert.equal(c.heroes[0].hp,12);assert.equal(c.enemyAttack().ok,false);assert.equal(c.heroes[0].hp,12);assert.equal(c.attack().ok,false);
});
test('roar can damage multiple targets and defeated units leave the queue',()=>{
  const c=encounter();c.heroes[0].hp=3;c.advance();c.advance();const result=c.enemyAttack();assert.equal(result.skill,'Rugido');assert.equal(result.hits.length,2);assert.equal(c.heroes[0].hp,0);assert.equal(c.queue.some(a=>a.id==='rabbit'),false);
  c.advance();c.advance();assert.equal(c.current.id,'rat');c.advance();assert.equal(c.current.id,'boss');
});
test('victory and defeat lock actions and restart resets health, cells and mutations',()=>{
  const c=encounter();c.boss.hp=7;c.attack();assert.equal(c.status,'victory');assert.equal(c.advance(),false);assert.equal(c.attack().ok,false);
  c.reset();assert.equal(c.status,'playing');assert.equal(c.boss.hp,120);assert.equal(c.current.id,'rat');c.current.mutations.add('horn');c.current.cell={col:0,row:0};c.heroes.forEach(h=>h.hp=1);c.advance();c.advance();
  c.heroes.forEach(h=>h.cell={col:6,row:3});c.enemyAttack();assert.equal(c.status,'defeat');assert.equal(c.advance(),false);c.reset();assert.equal(c.heroes[1].mutations.size,0);assert.deepEqual(c.heroes[1].cell,{col:6,row:4});assert.equal(c.heroes[1].hp,14);
});
test('a complete encounter can be won using movement, attacks, scavenged objects and skills',()=>{
  const c=encounter([{col:5,row:4},{col:5,row:2},{col:6,row:3},{col:4,row:4}].map((cell,i)=>({id:`stone-${i}`,kind:'rock',cell})));let turns=0;
  while(c.status==='playing'&&turns++<80){
    if(c.current.team==='enemy')c.enemyAttack();
    else while((c.movesRemaining>0||c.attacksRemaining>0)&&c.status==='playing'){
      if(c.current.id==='raccoon'&&!c.current.carried){const p=c.props.find(p=>c.canInteract(p.id).ok);if(p){c.beginInteraction(p.id);c.interactionHit();}}
      if(c.canAttack().ok)c.attack();
      else if(c.canAttack(true).ok)c.attack(true);
      else{
        const options=c.tiles.map(cell=>({cell,result:c.canMove(cell)})).filter(o=>o.result.ok&&o.result.path.length>0).sort((a,b)=>c.distance({cell:a.cell})-c.distance({cell:b.cell})||a.result.path.length-b.result.path.length);
        if(!options.length)break;c.move(options[0].cell);
      }
    }
    c.advance();
  }
  assert.equal(c.status,'victory');assert.ok(turns<30);
});


test('specials remain available after attack and movement, repeated until mana is exhausted',()=>{
  const c=encounter();assert.equal(c.attack().ok,true);assert.equal(c.move({col:5,row:3}).ok,true);
  assert.equal(c.attacksRemaining,0);assert.equal(c.movesRemaining,0);assert.equal(c.current.id,'rat');
  assert.equal(c.attack(true).ok,true);assert.equal(c.attack(true).ok,true);assert.equal(c.current.mana,0);assert.equal(c.boss.hp,105);
  assert.equal(c.attack(true).ok,false);assert.equal(c.attacksRemaining,0);assert.equal(c.movesRemaining,0);
  c.advance();assert.equal(c.attacksRemaining,1);assert.equal(c.movesRemaining,1);
});

test('per-character allowances support two attacks or two movements and reset each turn',()=>{
  const c=encounter();c.current.attacksPerTurn=2;c.current.movesPerTurn=2;c.resetTurnResources();
  assert.equal(c.attack().ok,true);assert.equal(c.attack().ok,true);assert.equal(c.attack().ok,false);
  assert.equal(c.move({col:5,row:3}).ok,true);assert.equal(c.move({col:6,row:3}).ok,true);assert.equal(c.move({col:6,row:2}).ok,false);
  assert.equal(c.attack(true).ok,true);assert.equal(c.attacksRemaining,0);assert.equal(c.movesRemaining,0);
  for(let i=0;i<4;i++)c.advance();assert.equal(c.attacksRemaining,2);assert.equal(c.movesRemaining,2);
  c.reset();assert.equal(c.attacksRemaining,2);assert.equal(c.movesRemaining,2);
});

test('barrage is usable with exhausted movement and attacks and still locks other actions',()=>{
  const c=encounter();c.advance();assert.equal(c.move({col:5,row:3}).ok,true);assert.equal(c.attack().ok,true);c.random=()=>.99;
  assert.equal(c.beginBarrage().ok,true);assert.equal(c.attacksRemaining,0);assert.equal(c.movesRemaining,0);assert.equal(c.advance(),false);
  while(c.barrage)assert.equal(c.barrageHit().ok,true);assert.equal(c.boss.hp,100);assert.equal(c.current.mana,2);
});

test('target preview covers each reachable boss cell and respects special range and mutations',()=>{
  const c=encounter();c.advance();
  assert.equal(c.targetCells().some(cell=>c.boss.cells.some(b=>cellKey(b)===cellKey(cell))),false);
  assert.equal(c.targetCells(true).some(cell=>c.boss.cells.some(b=>cellKey(b)===cellKey(cell))),true);
  c.current.mutations.add('eye');assert.equal(c.targetCells().some(cell=>cell.col===4&&cell.row===3),true);
  assert.equal(c.targetCells().some(cell=>cellKey(cell)===cellKey(c.current.cell)),false);
});

test('staying in place and invalid destinations never spend movement',()=>{
  const c=encounter();assert.deepEqual(c.move(c.current.cell),{ok:true,path:[]});assert.equal(c.movesRemaining,1);
  assert.equal(c.move(c.boss.cells[0]).ok,false);assert.equal(c.movesRemaining,1);
  assert.equal(c.move({col:-1,row:0}).ok,false);assert.equal(c.movesRemaining,1);
});
