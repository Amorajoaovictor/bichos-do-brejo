import test from 'node:test';
import assert from 'node:assert/strict';
import { Combat } from '../dist/combat.js';
import { LION_CUB_STATS,SQUIRREL_STATS } from '../dist/encounters.js';
import { cellKey,footprintCells } from '../dist/grid.js';

function encounter({blocked=['2,2','5,1','1,4'],anchor={col:3,row:2},extraEnemies=[]}={}){
  const obstacles=new Set(blocked);
  const tiles=Array.from({length:63},(_,i)=>({col:i%9,row:Math.floor(i/9),blocked:obstacles.has(`${i%9},${Math.floor(i/9)}`)}))
    .filter(cell=>!((cell.col===0||cell.col===8)&&(cell.row===0||cell.row===6)));
  return new Combat({tiles,heroes:[
    {id:'rabbit',name:'Farrapo',maxHp:80,cell:{col:5,row:4}},
    {id:'rat',name:'Fusível',maxHp:80,cell:{col:6,row:4}},
    {id:'raccoon',name:'Graxinin',maxHp:80,cell:{col:6,row:5}},
  ],enemies:[{id:'rosnaldo',name:'Rosnaldo',maxHp:120,cells:footprintCells(anchor,2,2)},...extraEnemies]});
}
function turnOf(c,actor){
  for(let i=0;i<=c.order.length;i++){
    if(c.current===actor)return;
    assert.equal(c.advance(),true);
  }
  assert.fail(`Turno não encontrado: ${actor.id}`);
}
function nextBossTurn(c){assert.equal(c.advance(),true);turnOf(c,c.enemies[0]);}
function summon(c){turnOf(c,c.enemies[0]);const result=c.enemyAttack();assert.equal(result.skill,'Invocar leõezinhos');return result.summons;}

test('first Rosnaldo turn plans without mutation and summons two actors instead of damaging heroes',()=>{
  const c=encounter(),boss=c.enemies[0];turnOf(c,boss);
  const order=[...c.order],actors=[...c.actors],hp=c.heroes.map(hero=>hero.hp),cursor=c.cursor,round=c.round;
  const plan=c.planEnemyAttack();
  assert.deepEqual(plan,{skill:'Invocar leõezinhos',summon:true,spawns:[{col:3,row:1},{col:4,row:1}],targets:[],damage:0});
  assert.deepEqual(c.planEnemyAttack(),plan);
  assert.deepEqual(c.actors,actors);assert.deepEqual(c.order,order);assert.equal(boss.turnsTaken,0);
  const result=c.enemyAttack();
  assert.equal(result.ok,true);assert.equal(result.source,boss.id);assert.deepEqual(result.hits,[]);
  assert.equal(result.summons.length,2);assert.deepEqual(c.heroes.map(hero=>hero.hp),hp);
  assert.equal(c.current,boss);assert.equal(c.cursor,cursor);assert.equal(c.round,round);
  assert.deepEqual(c.order,[...order.slice(0,3),...result.summons,order[3]]);assert.deepEqual(c.actors,[...actors,...result.summons]);
  assert.deepEqual(c.queue,[boss,...result.summons,c.heroes[2],c.heroes[1],c.heroes[0]]);
  assert.equal(boss.turnsTaken,1);assert.equal(boss.lastSummonTurn,1);
  for(const [i,cub] of result.summons.entries()){
    for(const [key,value] of Object.entries(LION_CUB_STATS))assert.equal(cub[key],value);
    assert.equal(cub.id,`lion-cub-${i+1}`);assert.equal(cub.team,'enemy');assert.equal(cub.hp,10);
    assert.equal(cub.summonedBy,boss.id);assert.equal(cub.turnsTaken,0);assert.equal(cub.bleeding,null);
    assert.ok(cub.mutations instanceof Set);assert.equal(cub.mutations.size,0);
    assert.ok(c.enemies.includes(cub));assert.deepEqual(c.cellsOf(cub),[c.tiles.find(tile=>cellKey(tile)===cellKey(plan.spawns[i]))]);
  }
  assert.notEqual(result.summons[0].mutations,result.summons[1].mutations);
  assert.equal(c.enemyAttack().ok,false);assert.equal(c.enemies.length,3);assert.equal(boss.turnsTaken,1);
  c.advance();assert.equal(c.current,result.summons[0]);c.advance();assert.equal(c.current,result.summons[1]);
  c.advance();assert.equal(c.current.id,'raccoon');c.advance();assert.equal(c.current.id,'rat');assert.equal(c.round,2);
});

test('spawn copies complete tile coordinates without sharing the terrain object',()=>{
  const c=encounter();
  for(const tile of c.tiles){tile.x=(tile.col-4)*1.23;tile.z=(tile.row-3)*1.23;}
  const cubs=summon(c);
  for(const cub of cubs){
    const tile=c.tiles.find(tile=>cellKey(tile)===cellKey(cub.cell));
    assert.deepEqual(cub.cell,tile);assert.notEqual(cub.cell,tile);
    assert.deepEqual(cub.startCell,tile);assert.notEqual(cub.startCell,cub.cell);
    assert.ok(Number.isFinite(cub.cell.x));assert.ok(Number.isFinite(cub.cell.z));
  }
});

test('sorting after spawn preserves the source turn even when its index changes',()=>{
  const c=encounter(),boss=c.enemies[0];turnOf(c,boss);const cursor=c.cursor,round=c.round;
  boss.initiative=5;
  const cubs=c.enemyAttack().summons;
  assert.deepEqual(c.order,[c.heroes[1],c.heroes[0],...cubs,c.heroes[2],boss]);
  assert.notEqual(c.cursor,cursor);assert.equal(c.cursor,c.order.indexOf(boss));assert.equal(c.current,boss);
  assert.equal(c.round,round);assert.equal(c.enemyActed,true);assert.equal(c.enemyAttack().ok,false);
  c.advance();assert.equal(c.current,c.heroes[1]);assert.equal(c.round,round+1);
});

test('spawn cells respect the full footprint, live allies/enemies, blocked tiles and missing corners',()=>{
  const c=encounter({anchor:{col:1,row:0},blocked:['1,2'],extraEnemies:[{...SQUIRREL_STATS,id:'squirrel-1',cell:{col:3,row:0}}]});
  c.heroes[0].cell={col:2,row:2};
  const boss=c.enemies[0],occupied=c.occupied(),[a,b]=summon(c);
  assert.deepEqual([a.cell,b.cell].map(({col,row})=>({col,row})),[{col:0,row:1},{col:3,row:1}]);
  for(const cub of [a,b]){
    assert.equal(c.distance(cub,boss),1);assert.equal(occupied.has(cellKey(cub.cell)),false);
    assert.ok(c.tiles.some(tile=>cellKey(tile)===cellKey(cub.cell)&&!tile.blocked));
  }
  assert.notDeepEqual(a.cell,b.cell);assert.equal(c.occupied().size,occupied.size+2);
  turnOf(c,c.heroes[1]);assert.equal(c.canMove(a.cell).ok,false);
});

test('one free adjacent cell summons one cub; survivors prevent refilling even after cooldown',()=>{
  const c=encounter(),boss=c.enemies[0],free={col:3,row:1};
  for(const tile of c.tiles)if(c.distance({cell:tile},boss)===1)tile.blocked=cellKey(tile)!==cellKey(free);
  const [cub]=summon(c);assert.equal(c.enemies.length,2);assert.deepEqual(cub.cell,c.tiles.find(tile=>cellKey(tile)===cellKey(free)));
  for(let i=0;i<5;i++){
    nextBossTurn(c);assert.notEqual(c.planEnemyAttack().summon,true);assert.equal(c.enemyAttack().ok,true);
    assert.equal(c.enemies.filter(enemy=>enemy.kind==='lion-cub'&&enemy.hp>0).length,1);
  }
});

test('a fully blocked perimeter falls back to normal attack and does not spend the summon cooldown',()=>{
  const c=encounter(),boss=c.enemies[0];
  for(const tile of c.tiles)if(c.distance({cell:tile},boss)===1)tile.blocked=true;
  turnOf(c,boss);assert.notEqual(c.planEnemyAttack().summon,true);
  assert.equal(c.enemyAttack().skill,'Rugido');assert.equal(boss.lastSummonTurn,null);assert.equal(c.enemies.length,1);
  c.tiles.find(tile=>tile.col===3&&tile.row===1).blocked=false;
  nextBossTurn(c);assert.equal(c.enemyAttack().summons.length,1);assert.equal(boss.lastSummonTurn,2);
});

test('cooldown counts Rosnaldo turns since each successful summon, with no cub alive required',()=>{
  const c=encounter(),boss=c.enemies[0],first=summon(c);first.forEach(cub=>cub.hp=0);
  for(const completed of [2,3]){
    nextBossTurn(c);assert.notEqual(c.planEnemyAttack().summon,true);assert.equal(c.enemyAttack().ok,true);
    assert.equal(boss.turnsTaken,completed);assert.equal(boss.lastSummonTurn,1);
  }
  nextBossTurn(c);const second=c.enemyAttack().summons;
  assert.equal(second.length,2);assert.equal(boss.turnsTaken,4);assert.equal(boss.lastSummonTurn,4);
  assert.deepEqual(second.map(cub=>cub.cell),first.map(cub=>cub.cell));
  assert.equal(new Set(c.actors.map(actor=>actor.id)).size,c.actors.length);
  assert.equal(c.enemies.filter(enemy=>enemy.kind==='lion-cub'&&enemy.hp>0).length,2);
  second[0].hp=0;
  for(let i=0;i<3;i++){nextBossTurn(c);assert.notEqual(c.planEnemyAttack().summon,true);c.enemyAttack();}
  second[1].hp=0;nextBossTurn(c);
  const third=c.enemyAttack().summons;assert.equal(third.length,2);assert.equal(boss.lastSummonTurn,8);
  third.forEach(cub=>cub.hp=0);nextBossTurn(c);assert.notEqual(c.planEnemyAttack().summon,true);
});

test('attack replans spawn occupancy rather than applying a stale preview',()=>{
  const c=encounter(),boss=c.enemies[0];turnOf(c,boss);
  const preview=c.planEnemyAttack(),occupiedLater=preview.spawns[0];c.heroes[0].cell={...occupiedLater};
  const result=c.enemyAttack();assert.equal(result.summons.length,2);
  assert.ok(result.summons.every(cub=>cellKey(cub.cell)!==cellKey(occupiedLater)));
});

test('cubs move up to three cells around terrain and bite only a living adjacent hero, once per turn',()=>{
  const c=encounter({blocked:['4,1']}),[cub]=summon(c);
  c.heroes[0].cell={col:5,row:1};turnOf(c,cub);
  assert.equal(c.planEnemyAttack(),null);assert.equal(c.enemyAttack().ok,false);
  const origin={...cub.cell},occupied=c.occupied(cub.id),plan=c.planEnemyMove();assert.equal(plan.path.length,3);
  assert.deepEqual(cub.cell,origin);
  let previous=origin;
  for(const cell of plan.path){
    assert.equal(Math.abs(previous.col-cell.col)+Math.abs(previous.row-cell.row),1);
    assert.equal(cell.blocked,false);assert.equal(occupied.has(cellKey(cell)),false);previous=cell;
  }
  c.enemyMove();assert.deepEqual(cub.cell,plan.path.at(-1));assert.equal(c.distance(c.heroes[0],cub),1);
  assert.deepEqual(c.planEnemyAttack(),{skill:'Mordidinha',damage:3,targets:[c.heroes[0]]});
  const hp=c.heroes.map(hero=>hero.hp),result=c.enemyAttack();
  assert.equal(result.source,cub.id);assert.equal(result.skill,'Mordidinha');
  assert.deepEqual(result.hits,[{target:'rabbit',damage:3,hp:hp[0]-3}]);
  assert.deepEqual(c.heroes.slice(1).map(hero=>hero.hp),hp.slice(1));
  assert.equal(c.enemyAttack().ok,false);assert.equal(c.planEnemyMove(),null);
});

test('surrounded cub passes without walking through allies, Rosnaldo or terrain or using a ranged roar',()=>{
  const c=encounter(),[cub]=summon(c);turnOf(c,cub);
  const origin={...cub.cell};
  for(const tile of c.tiles)if(Math.abs(tile.col-origin.col)+Math.abs(tile.row-origin.row)===1)tile.blocked=true;
  assert.equal(c.planEnemyMove(),null);assert.equal(c.planEnemyAttack(),null);assert.equal(c.enemyAttack().ok,false);
  assert.deepEqual(cub.cell,origin);assert.equal(c.advance(),true);
});

test('reset removes live and dead summons, restores initial actors/order/resources and allows first-turn summon again',()=>{
  const c=encounter(),initialOrder=[...c.order],initialActors=[...c.actors],initialEnemies=[...c.enemies];
  const [a,b]=summon(c);a.hp=0;b.cell={col:0,row:1};b.bleeding={damage:3,turns:2,source:'rat'};
  c.selectTarget(b.id);c.heroes[0].hp=1;c.heroes[0].mana=0;c.heroes[0].cell={col:8,row:3};c.heroes[0].mutations.add('eye');
  c.enemies[0].hp=0;c.checkOutcome();assert.equal(c.status,'playing');
  turnOf(c,b);c.reset();
  assert.deepEqual(c.enemies,initialEnemies);assert.deepEqual(c.actors,initialActors);assert.deepEqual(c.order,initialOrder);
  assert.deepEqual(c.queue,initialOrder);assert.equal(c.current,initialOrder[0]);assert.equal(c.round,1);
  assert.equal(c.boss,initialEnemies[0]);assert.equal(c.status,'playing');assert.equal(c.enemyActed,false);
  assert.equal(c.enemies[0].turnsTaken,0);assert.equal(c.enemies[0].lastSummonTurn,null);
  assert.ok(c.actors.every(actor=>actor.hp===actor.maxHp&&actor.bleeding===null&&actor.mutations.size===0));
  assert.ok(c.heroes.every(hero=>hero.mana===hero.maxMana));assert.deepEqual(c.heroes[0].cell,{col:5,row:4});
  assert.equal(c.actors.includes(a),false);assert.equal(c.actors.includes(b),false);assert.equal(c.selectTarget(b.id),false);
  const cubs=summon(c);assert.deepEqual(cubs.map(cub=>cub.id),['lion-cub-1','lion-cub-2']);assert.notEqual(cubs[0],a);
});

test('killing Rosnaldo does not win while cubs live; the final cub can be killed with a targeted basic attack',()=>{
  const c=encounter(),boss=c.enemies[0],[a,b]=summon(c);
  turnOf(c,c.heroes[1]);c.current.cell={col:5,row:2};boss.hp=7;
  assert.equal(c.attack(false,boss).ok,true);assert.equal(boss.hp,0);assert.equal(c.status,'playing');assert.equal(c.queue.includes(boss),false);
  turnOf(c,c.heroes[0]);c.current.cell={col:a.cell.col,row:a.cell.row-1};
  assert.equal(c.attack(false,a).ok,true);assert.equal(a.hp,0);assert.equal(c.status,'playing');
  assert.equal(c.queue.includes(a),false);assert.equal(c.selectTarget(b.id),true);
  assert.equal(c.attack(true).ok,true);assert.equal(b.hp,0);assert.equal(c.status,'victory');assert.equal(c.advance(),false);
});

test('cubs can bleed to death, release occupancy and finish the encounter at start of turn',()=>{
  const c=encounter(),boss=c.enemies[0],[a,b]=summon(c);
  turnOf(c,c.heroes[1]);c.current.cell={col:3,row:0};assert.equal(c.attack(true,a).ok,true);
  assert.deepEqual(a.bleeding,{damage:3,turns:3,source:'rat'});assert.equal(a.hp,6);
  boss.hp=0;b.hp=0;a.hp=3;turnOf(c,c.heroes[0]);
  assert.equal(c.advance(),true);assert.equal(c.current,a);assert.equal(a.hp,0);assert.equal(c.status,'victory');
  assert.equal(c.occupied().has(cellKey(a.cell)),false);
  assert.deepEqual(c.turnResult.hits,[{target:a.id,damage:3,hp:0}]);
});

test('Rosnaldo bite and roar target from current footprint even when a distant cub is selected',()=>{
  const c=encounter(),boss=c.enemies[0],[cub]=summon(c);cub.cell={col:0,row:1};assert.equal(c.selectTarget(cub.id),true);
  c.heroes[0].cell={col:5,row:2};c.heroes[1].cell={col:6,row:4};c.heroes[2].cell={col:6,row:5};
  nextBossTurn(c);assert.equal(c.planEnemyMove(),null);
  assert.deepEqual(c.planEnemyAttack(),{skill:'Mordida',damage:8,targets:[c.heroes[0]]});
  assert.deepEqual(c.enemyAttack().hits,[{target:'rabbit',damage:8,hp:72}]);assert.equal(c.boss,cub);
  c.heroes[0].cell={col:5,row:4};nextBossTurn(c);
  assert.deepEqual(c.planEnemyAttack(),{skill:'Rugido',damage:3,targets:[c.heroes[0],c.heroes[1]]});
  assert.deepEqual(c.enemyAttack().hits.map(hit=>hit.target),['rabbit','rat']);
});

test('Rosnaldo distant roar chooses nearest to current footprint rather than selected enemy',()=>{
  const c=encounter(),[cub]=summon(c);cub.cell={col:0,row:1};c.selectTarget(cub.id);
  c.heroes[0].cell={col:0,row:5};c.heroes[1].cell={col:8,row:2};c.heroes[2].cell={col:8,row:6};nextBossTurn(c);
  assert.deepEqual(c.planEnemyAttack(),{skill:'Rugido distante',damage:4,targets:[c.heroes[1]]});
  assert.equal(c.enemyAttack().source,'rosnaldo');
});

test('summoning and enemy actions are disabled on hero turns, after outcome or for dead Rosnaldo',()=>{
  const c=encounter(),boss=c.enemies[0];assert.equal(c.planEnemyAttack(),null);assert.equal(c.enemyAttack().ok,false);
  turnOf(c,boss);boss.hp=0;assert.equal(c.planEnemyAttack(),null);assert.equal(c.enemyAttack().ok,false);
  boss.hp=120;c.heroes.forEach(hero=>hero.hp=0);c.checkOutcome();
  assert.equal(c.status,'defeat');assert.equal(c.enemyAttack().ok,false);assert.equal(c.enemies.length,1);
});
