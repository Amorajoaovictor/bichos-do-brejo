import { cellKey,findPath } from './grid.js';
import { LION_CUB_STATS } from './encounters.js';
import { PROP_STATS,propDistance,traceLog } from './environment.js';

const isRosnaldo=actor=>actor.kind==='rosnaldo'||actor.id==='rosnaldo';

export const HERO_STATS=[
  {initiative:10,damage:10,range:1,skill:'Coice',special:'Metralhadora de cocô',specialRange:4,maxMana:10,manaRegen:3,manaCost:8,pellets:10,pelletDamage:1,critChance:.25,move:3},
  {initiative:12,damage:7,range:3,skill:'Sucata',special:'Corte de sucata',specialRange:3,specialDamage:4,maxMana:10,manaRegen:3,manaCost:5,bleedDamage:3,bleedTurns:3,move:3},
  {initiative:6,damage:8,range:4,skill:'Arremessar objeto',special:'Garrafada',specialRange:3,specialDamage:12,bleedDamage:3,bleedTurns:3,maxMana:10,manaRegen:3,manaCost:6,move:3},
];

export class Combat {
  constructor({tiles,heroes,boss,enemies,props=[],random=Math.random}){
    this.random=random;
    this.tiles=tiles.map(t=>t.userData??t);
    this.propLayout=props.map(p=>({...p,cell:{...p.cell}}));
    this.heroes=heroes.map((hero,index)=>({movesPerTurn:1,attacksPerTurn:1,...HERO_STATS[index],...hero,index,team:'hero',startCell:{...hero.cell},mutations:hero.mutations??new Set()}));
    this.enemies=(enemies??[boss]).map(enemy=>({initiative:8,team:'enemy',damage:8,...enemy,startCell:enemy.cell?{...enemy.cell}:null,startCells:enemy.cells?.map(cell=>({...cell})),mutations:new Set()}));
    this.selectedEnemy=this.enemies[0];
    this.actors=[...this.heroes,...this.enemies];
    this.order=[...this.actors].sort((a,b)=>b.initiative-a.initiative);
    this.initialEnemies=[...this.enemies];this.initialOrder=[...this.order];
    this.reset();
  }
  reset(){
    this.props=this.propLayout.map(p=>({...PROP_STATS[p.kind],...p,cell:{...p.cell},used:false}));this.environmentAction=null;
    this.enemies=[...this.initialEnemies];this.actors=[...this.heroes,...this.enemies];this.order=[...this.initialOrder];this.summonSerial=0;
    for(const actor of this.actors){actor.hp=actor.maxHp;actor.bleeding=null;actor.turnsTaken=0;actor.lastSummonTurn=null;actor.mutations.clear();if(actor.startCell)actor.cell={...actor.startCell};if(actor.startCells)actor.cells=actor.startCells.map(cell=>({...cell}));}
    this.selectedEnemy=this.enemies[0];
    for(const hero of this.heroes)hero.mana=hero.maxMana;
    for(const hero of this.heroes)hero.carried=hero.id==='raccoon'?{kind:'can',name:'Lata amassada'}:null;
    this.cursor=0;this.round=1;this.status='playing';this.enemyActed=false;this.barrage=null;this.turnResult=null;this.turnResults=[];this.resetTurnResources();
  }
  resetTurnResources(){
    this.movesRemaining=this.current.team==='hero'?this.current.movesPerTurn:0;
    this.attacksRemaining=this.current.team==='hero'?this.current.attacksPerTurn:0;
    this.bonusRemaining=this.current.team==='hero'?1:0;
  }
  get current(){return this.order[this.cursor];}
  get boss(){return this.selectedEnemy;}
  cellsOf(actor){return actor.cells??[actor.cell];}
  selectTarget(id){const enemy=this.enemies.find(enemy=>enemy.id===id&&enemy.hp>0);if(!enemy||this.barrage)return false;this.selectedEnemy=enemy;return true;}
  get queue(){return Array.from({length:this.order.length},(_,i)=>this.order[(this.cursor+i)%this.order.length]).filter(a=>a.hp>0);}
  get playerTurn(){return this.status==='playing'&&this.current.team==='hero';}
  range(actor=this.current){return actor.range+(actor.mutations.has('eye')?1:0);}
  specialRange(actor=this.current){return actor.specialRange+(actor.mutations.has('eye')?1:0);}
  specialDamage(actor=this.current){return actor.specialDamage+(actor.mutations.has('horn')?3:0);}
  specialDescription(actor=this.current){
    if(actor.pellets)return `${actor.pellets} tiros × ${actor.pelletDamage} dano · ${Math.round(actor.critChance*100)}% crítico (2×) por tiro${actor.mutations.has('horn')?' · +3 no primeiro tiro':''}`;
    return `${this.specialDamage(actor)} dano${actor.bleedTurns?` + sangra ${actor.bleedDamage} por ${actor.bleedTurns} turnos`:''}`;
  }
  damage(actor=this.current){return actor.damage+(actor.mutations.has('horn')?3:0);}
  distance(actor,target=this.boss){return Math.min(...this.cellsOf(target).map(cell=>Math.abs(actor.cell.col-cell.col)+Math.abs(actor.cell.row-cell.row)));}
  occupied(except){
    const cells=new Set();
    for(const prop of this.props)if(!prop.used&&prop.kind==='log')cells.add(cellKey(prop.cell));
    for(const actor of this.actors)if(actor.hp>0&&actor.id!==except)for(const cell of this.cellsOf(actor))cells.add(cellKey(cell));
    return cells;
  }
  guard(){
    if(this.status!=='playing')return 'O combate terminou.';
    if(this.barrage)return 'Espere a rajada terminar.';
    if(this.environmentAction)return 'Espere a interação terminar.';
    if(!this.playerTurn)return `Espere o turno de ${this.current.name}.`;
    return null;
  }
  moveGuard(){return this.guard()||(this.movesRemaining<=0?'Sem movimentos neste turno.':null);}
  attackGuard(special=false){
    const reason=this.guard();if(reason)return reason;
    if(!special&&this.attacksRemaining<=0)return 'Sem ataques neste turno.';
    if(!special&&this.current.id==='raccoon'&&!this.current.carried)return 'Sem objeto na mão. Use Interagir para recolher uma pedra adjacente.';
    if(special&&this.current.mana<this.current.manaCost)return `Mana insuficiente: ${this.current.special} precisa de ${this.current.manaCost} de mana. Recupera +${this.current.manaRegen} no início do próximo turno deste bicho.`;
    return null;
  }
  targetCells(special=false){
    if(!this.playerTurn)return [];
    const range=special?this.specialRange():this.range(),origin=this.current.cell;
    return this.tiles.filter(cell=>{const distance=Math.abs(cell.col-origin.col)+Math.abs(cell.row-origin.row);return distance>0&&distance<=range;});
  }
  pathTo(goal){return findPath(this.tiles,this.current.cell,goal,this.occupied(this.current.id));}
  canMove(goal){
    const reason=this.moveGuard();if(reason)return {ok:false,reason};
    const path=this.pathTo(goal);
    if(!path)return {ok:false,reason:'Essa casa está ocupada ou não tem um caminho livre.'};
    if(path.length>this.current.move)return {ok:false,reason:`Você pode andar até ${this.current.move} casas por movimento.`};
    return {ok:true,path};
  }
  move(goal){
    const result=this.canMove(goal);if(!result.ok||!result.path.length)return result;
    this.movesRemaining--;this.current.cell={...goal};return result;
  }
  canAttack(special=false,target=this.boss){
    const reason=this.attackGuard(special);if(reason)return {ok:false,reason};
    const range=special?this.specialRange():this.range();
    if(!this.enemies.includes(target)||target.hp<=0)return {ok:false,reason:'Escolha um inimigo vivo.'};
    if(this.distance(this.current,target)>range)return {ok:false,reason:`Fora de alcance. ${special?this.current.special:this.current.skill}: até ${range} casa${range>1?'s':''} do alvo.`};
    return {ok:true};
  }
  attack(special=false,target=this.boss){
    if(special&&this.current.pellets){
      const result=this.beginBarrage(target);if(!result.ok)return result;
      while(this.barrage)result.hits.push(...this.barrageHit().hits);
      return result;
    }
    const valid=this.canAttack(special,target);if(!valid.ok)return valid;
    const actor=this.current,manaSpent=special?actor.manaCost:0;
    if(!special)this.attacksRemaining--;actor.mana-=manaSpent;
    const objectKind=!special&&actor.id==='raccoon'?actor.carried?.kind:null;
    if(objectKind)actor.carried=null;
    const damage=Math.min(target.hp,special?this.specialDamage():this.damage());target.hp-=damage;
    if(special&&actor.bleedTurns&&target.hp>0)target.bleeding={damage:actor.bleedDamage,turns:actor.bleedTurns,source:actor.id};
    this.checkOutcome();
    return {ok:true,skill:special?actor.special:actor.skill,objectKind,special,manaSpent,source:actor.id,hits:[{target:target.id,damage,hp:target.hp,bleeding:special&&!!actor.bleedTurns&&target.hp>0}]};
  }
  interactionGuard(){return this.guard()||(this.bonusRemaining<=0?'Sem interação bônus neste turno.':null);}
  canInteract(id,target){
    const reason=this.interactionGuard();if(reason)return {ok:false,reason};
    const prop=this.props.find(p=>p.id===id&&!p.used);
    if(!prop)return {ok:false,reason:'Este objeto já foi usado.'};
    if(propDistance(this.current.cell,prop.cell)>1)return {ok:false,reason:'Aproxime-se: o objeto precisa estar na sua casa ou numa casa adjacente.'};
    if(prop.kind==='log'){
      const plan=traceLog(this,prop,this.current);
      if(!plan.path.length)return {ok:false,reason:'O tronco não tem espaço para rolar. Empurre pelo lado oposto à trajetória desejada.'};
      return {ok:true,prop,...plan};
    }
    if(this.current.id==='raccoon')return this.current.carried?{ok:false,reason:'Graxinin já carrega um objeto. Arremesse-o antes de recolher outro.'}:{ok:true,prop,pickup:true};
    if(target&&(!this.enemies.includes(target)||target.hp<=0||this.distance(this.current,target)>prop.range))return {ok:false,reason:`Escolha um inimigo a até ${prop.range} casas do bicho.`};
    return {ok:true,prop};
  }
  beginInteraction(id,target){
    const plan=this.canInteract(id,target);if(!plan.ok)return plan;
    if(plan.prop.kind==='rock'&&!plan.pickup&&!target)return {ok:false,reason:'Escolha um inimigo para arremessar a pedra.'};
    this.bonusRemaining--;plan.prop.used=true;
    const action={...plan,source:this.current.id,kind:plan.pickup?'pickup':plan.prop.kind,target,hitsDone:new Set()};
    this.environmentAction=action;return {ok:true,action};
  }
  interactionHit(step=1){
    const action=this.environmentAction;if(!action)return {ok:false};
    const actor=this.actors.find(a=>a.id===action.source),hits=[];
    if(action.kind==='pickup')actor.carried={kind:'rock',name:'Pedra'};
    else{
      const targets=action.kind==='rock'?[action.target]:action.hits.filter(h=>h.step===step).map(h=>this.enemies.find(e=>e.id===h.target));
      for(const target of targets)if(target?.hp>0&&!action.hitsDone.has(target.id)){
        action.hitsDone.add(target.id);const damage=Math.min(target.hp,action.prop.damage);target.hp-=damage;hits.push({target:target.id,damage,hp:target.hp});
      }
    }
    this.checkOutcome();
    if(action.kind!=='log')this.environmentAction=null;
    return {ok:true,source:actor.id,skill:action.kind==='pickup'?'Recolher pedra':action.kind==='rock'?'Pedrada bônus':'Tronco rolante',hits};
  }
  finishInteraction(){this.environmentAction=null;}
  beginBarrage(target=this.boss){
    const valid=this.canAttack(true,target);if(!valid.ok)return valid;
    const actor=this.current;if(!actor.pellets)return {ok:false,reason:'Este bicho não tem rajada.'};
    actor.mana-=actor.manaCost;this.barrage={actor,target,remaining:actor.pellets};
    return {ok:true,skill:actor.special,special:true,manaSpent:actor.manaCost,source:actor.id,hits:[]};
  }
  barrageHit(){
    if(!this.barrage||this.status!=='playing')return {ok:false,reason:'Nenhuma rajada em andamento.'};
    const {actor,target}=this.barrage,critical=this.random()<actor.critChance;
    const pellet=actor.pellets-this.barrage.remaining+1;
    const damage=Math.min(target.hp,actor.pelletDamage*(critical?2:1)+(pellet===1&&actor.mutations.has('horn')?3:0));target.hp-=damage;
    this.barrage.remaining--;this.checkOutcome();
    if(this.barrage.remaining===0||target.hp<=0||this.status!=='playing')this.barrage=null;
    return {ok:true,skill:actor.special,special:true,source:actor.id,pellet,hits:[{target:target.id,damage,hp:target.hp,critical}]};
  }
  planEnemyMove(){
    const actor=this.current;
    if(this.status!=='playing'||actor.team!=='enemy'||isRosnaldo(actor)||!actor.move||this.enemyActed)return null;
    const alive=this.heroes.filter(hero=>hero.hp>0),range=actor.range??3;
    if(alive.some(hero=>this.distance(hero,actor)<=range))return null;
    const occupied=this.occupied(actor.id),options=[];
    for(const cell of this.tiles){
      if(cell.blocked||occupied.has(cellKey(cell)))continue;
      const distance=Math.min(...alive.map(hero=>Math.abs(cell.col-hero.cell.col)+Math.abs(cell.row-hero.cell.row)));
      if(distance>range)continue;
      const path=findPath(this.tiles,actor.cell,cell,occupied);
      if(path?.length)options.push({path,distance});
    }
    options.sort((a,b)=>a.path.length-b.path.length||b.distance-a.distance);
    return options.length?{source:actor.id,path:options[0].path.slice(0,actor.move)}:null;
  }
  enemyMove(){
    const plan=this.planEnemyMove();if(!plan)return null;
    this.current.cell={...plan.path.at(-1)};return plan;
  }
  squirrelPickup(target){
    const actor=this.current,occupied=this.occupied(actor.id);
    const adjacent=this.tiles.filter(cell=>this.distance({cell},target)===1);
    const options=adjacent.map(cell=>({cell,path:findPath(this.tiles,actor.cell,cell,occupied)}))
      .filter(({path})=>path).sort((a,b)=>a.path.length-b.path.length);
    return options[0]??{cell:adjacent.find(cell=>!cell.blocked&&!occupied.has(cellKey(cell)))??adjacent[0]??target.cell,path:null};
  }
  squirrelRetreat(){
    const actor=this.current,alive=this.heroes.filter(hero=>hero.hp>0);
    const distance=cell=>Math.min(...alive.map(hero=>this.distance({cell},hero)));
    const initial=distance(actor.cell);
    if(initial>=actor.range)return [];
    const occupied=this.occupied(actor.id);
    const options=this.tiles.map(cell=>({cell,distance:distance(cell)}))
      .filter(({distance})=>distance>initial&&distance<=actor.range)
      .map(({cell,distance})=>({distance,path:findPath(this.tiles,actor.cell,cell,occupied)}))
      .filter(({path})=>path);
    options.sort((a,b)=>b.distance-a.distance||a.path.length-b.path.length);
    return options[0]?.path??[];
  }
  planEnemyAttack(){
    const actor=this.current;
    if(this.status!=='playing'||actor.team!=='enemy'||actor.hp<=0||this.enemyActed)return null;
    const alive=this.heroes.filter(a=>a.hp>0);
    if(isRosnaldo(actor)&&!this.enemies.some(enemy=>enemy.kind==='lion-cub'&&enemy.hp>0)&&
      (actor.lastSummonTurn===null||actor.turnsTaken+1-actor.lastSummonTurn>=3)){
      const occupied=this.occupied();
      const spawns=this.tiles.filter(cell=>!cell.blocked&&!occupied.has(cellKey(cell))&&this.distance({cell},actor)===1)
        .slice(0,2).map(({col,row})=>({col,row}));
      if(spawns.length)return {skill:'Invocar leõezinhos',summon:true,spawns,targets:[],damage:0};
    }
    if(actor.kind==='squirrel'||actor.kind==='lion-cub'||actor.kind==='zebra'){
      const nearby=alive.filter(hero=>this.distance(hero,actor)<=actor.range).sort((a,b)=>this.distance(a,actor)-this.distance(b,actor)||a.hp-b.hp||a.index-b.index);
      if(!nearby.length)return null;
      return {skill:actor.skill,damage:actor.damage,targets:[nearby[0]]};
    }
    const adjacent=alive.filter(a=>this.distance(a,actor)<=1).sort((a,b)=>a.hp-b.hp||a.index-b.index);
    if(adjacent.length)return {skill:'Mordida',damage:8,targets:[adjacent[0]]};
    const nearby=alive.filter(a=>this.distance(a,actor)<=3);
    if(nearby.length)return {skill:'Rugido',damage:3,targets:nearby};
    return {skill:'Rugido distante',damage:4,targets:[...alive].sort((a,b)=>this.distance(a,actor)-this.distance(b,actor)||a.index-b.index).slice(0,1)};
  }
  enemyAttack(){
    const plan=this.planEnemyAttack();if(!plan)return {ok:false,reason:'Não é o turno do boss.'};
    this.enemyActed=true;this.current.turnsTaken++;
    if(plan.summon){
      const source=this.current;
      const summons=plan.spawns.map(cell=>{
        let id;do{id=`lion-cub-${++this.summonSerial}`;}while(this.actors.some(actor=>actor.id===id));
        const spawnCell={...this.tiles.find(tile=>cellKey(tile)===cellKey(cell))};
        const actor={...LION_CUB_STATS,id,team:'enemy',cell:spawnCell,startCell:{...spawnCell},hp:LION_CUB_STATS.maxHp,bleeding:null,turnsTaken:0,mutations:new Set(),summonedBy:source.id};
        this.enemies.push(actor);this.actors.push(actor);this.order.push(actor);return actor;
      });
      this.order.sort((a,b)=>b.initiative-a.initiative);this.cursor=this.order.indexOf(source);
      source.lastSummonTurn=source.turnsTaken;
      return {ok:true,skill:plan.skill,source:source.id,hits:[],summons};
    }
    const hits=plan.targets.map(actor=>{const damage=Math.min(actor.hp,Math.max(1,plan.damage-(actor.mutations.has('tail')?2:0)));actor.hp-=damage;return {target:actor.id,damage,hp:actor.hp};});
    this.checkOutcome();return {ok:true,skill:plan.skill,source:this.current.id,hits};
  }
  checkOutcome(){if(this.enemies.every(enemy=>enemy.hp<=0))this.status='victory';else if(this.heroes.every(a=>a.hp<=0))this.status='defeat';}
  advance(continuing=false){
    if(this.status!=='playing'||this.barrage||this.environmentAction)return false;
    if(!continuing)this.turnResults=[];
    do{this.cursor=(this.cursor+1)%this.order.length;if(this.cursor===0)this.round++;}while(this.current.hp<=0);
    if(this.current.team==='hero')this.current.mana=Math.min(this.current.maxMana,this.current.mana+this.current.manaRegen);
    this.resetTurnResources();this.enemyActed=false;this.turnResult=null;
    const bleeding=this.current.bleeding;
    if(bleeding){
      const damage=Math.min(this.current.hp,bleeding.damage);this.current.hp-=damage;bleeding.turns--;
      this.turnResult={ok:true,skill:'Sangramento',source:bleeding.source,hits:[{target:this.current.id,damage,hp:this.current.hp}]};
      this.turnResults.push(this.turnResult);
      if(bleeding.turns===0)this.current.bleeding=null;
      this.checkOutcome();
      if(this.current.hp===0&&this.status==='playing')return this.advance(true);
    }
    return true;
  }
}
