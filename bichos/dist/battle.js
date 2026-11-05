import * as THREE from 'three';
import { Combat } from './combat.js';
import { cellKey } from './grid.js';
import { creatures,portraitSVG,ragePart } from './characters.js';
import { canSVG,bottleSVG } from './graxinin-art.js';
import { ACTIONS,actionPose,barrageEmotion,barrageFlush,idlePose,resetPose,startRecoil,startBleedTick,socketPosition } from './animation.js';
import { faceToward,forEachView } from './facing.js';
import { expressiveArtwork,installExpressions,setExpression,setFaceFlush,rabbitFlushColor } from './expressions.js';
import { ENCOUNTERS } from './encounters.js';
import { SQUIRREL_IDLE_TEMPO } from './squirrel-idle-frames.js';
import { createLionCub } from './lion-cub.js';
import { PROP_LAYOUT } from './environment.js';

export function setupBattle({scene,camera,viewport,rigs,boss,squirrels,zebras,lionCubs,tiles,selection,mutationSets,vectorPart,setRigOrder,state,showToast,environment}){
  const $=id=>document.getElementById(id);
  const squirrelOnly=new URLSearchParams(location.search).get('encontro')==='esquilos';
  const rosnaldo=boss,enemyGroups=[squirrelOnly?squirrels:[...squirrels.slice(0,2),...zebras],[rosnaldo]],enemyRigById=new Map([...squirrels,...zebras,rosnaldo].map(rig=>[rig.definition.id,rig]));
  const heroStarts=rigs.map(rig=>({...rig.cell}));
  let encounterIndex=new URLSearchParams(location.search).get('encontro')==='rosnaldo'?1:0;
  function createCombat(){return new Combat({tiles,props:PROP_LAYOUT,heroes:creatures.map((c,index)=>({id:c.id,name:c.name,maxHp:c.health,movesPerTurn:c.movesPerTurn??1,attacksPerTurn:c.attacksPerTurn??1,cell:heroStarts[index],mutations:mutationSets[index]})),enemies:enemyGroups[encounterIndex].map(rig=>({id:rig.definition.id,name:rig.definition.name,maxHp:rig.definition.health,...(rig.pngRig?rig.definition:{cells:rig.cells}),cell:rig.pngRig?rig.cell:undefined}))});}
  let combat=createCombat();environment.sync(combat.props);boss=enemyRigById.get(combat.boss.id);
  const allRigs=[...rigs,...squirrels,...zebras,rosnaldo];
  function showEncounter(){for(const rig of [...squirrels,...zebras,rosnaldo]){const visible=enemyGroups[encounterIndex].includes(rig);rig.root.visible=visible;rig.floor.visible=visible;rig.shadow.visible=visible;if(rig.label)rig.label.hidden=!visible;}}
  showEncounter();
  rigs.forEach(rig=>installExpressions(rig,vectorPart));
  function initialFacing(){rigs.forEach(rig=>faceToward(rig,boss.root.position));for(const enemy of enemyGroups[encounterIndex])faceToward(enemy,rigs[0].root.position);allRigs.forEach(rig=>idlePose(rig,state.time));}
  initialFacing();
  let strike=null,squirrelThrow=null,pendingMove=null,aiWait=.8,aiMoved=false,bossFocused=false,hitPause=0,actionMode=null,selectedProp=null,interaction=null;
  const effects=[],flashes=[],deaths=[];
  const effectLayer=document.createElement('div');effectLayer.className='combat-effects';viewport.append(effectLayer);
  const highlighters=tiles.map(tile=>{
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.17,1.17),new THREE.MeshBasicMaterial({color:'#8da573',transparent:true,opacity:.32,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(tile.userData.x,.021,tile.userData.z);mesh.visible=false;scene.add(mesh);return mesh;
  });
  const busy=()=>!!strike||!!squirrelThrow||!!pendingMove||!!interaction;
  const actorById=id=>combat.actors.find(a=>a.id===id);
  const rigOf=actor=>actor.team==='enemy'?enemyRigById.get(actor.id):rigs[actor.index];
  function ready(){if(state.paused){showToast('Retome o tempo para agir.');return false;}if(busy()){showToast('Espere a animação terminar.');return false;}return true;}
  function artwork(actor,angry=false){
    let def=actor.team==='enemy'?rigOf(actor).definition:creatures[actor.index];
    if(actor.id==='raccoon'&&actor.carried?.kind!=='can')def={...def,parts:def.parts.filter(p=>p.name!=='can')};
    if(actor.team==='hero'&&rigOf(actor).expression!=='neutral')return expressiveArtwork(def,rigOf(actor).expression,rigOf(actor).faceFlush);
    return actor.team==='hero'&&angry?{...def,parts:[...def.parts,ragePart(def)]}:def;
  }
  function render(){
    boss=rigOf(combat.boss);
    const encounter=ENCOUNTERS[encounterIndex];
    document.querySelector('.location-hud h2').textContent=encounterIndex===0&&squirrelOnly?'Clareira das nozes':encounter.title;
    document.querySelector('.location-hud div').innerHTML=`<i></i> ${encounter.label}`;
    document.querySelector('.boss-hud').setAttribute('aria-label','Vida do inimigo selecionado');
    $('boss-focus').setAttribute('aria-label',`Inspecionar ${combat.boss.name}, ${combat.cellsOf(combat.boss).length} casa(s)`);
    $('enemy-name').textContent=combat.boss.name;
    const actor=combat.heroes[state.selected],c=creatures[state.selected],set=actor.mutations;
    $('gender').textContent=c.gender;
    $('creature-type').textContent=`${c.type} · ${actor.hp>0?'NÍVEL 01':'FORA DE COMBATE'}`;$('creature-name').textContent=c.name;
    $('health').innerHTML=`${actor.hp}<small>/${actor.maxHp}</small>`;
    $('health-bar').setAttribute('aria-valuenow',actor.hp);$('health-bar').setAttribute('aria-valuemax',actor.maxHp);
    $('health-fill').style.width=`${actor.hp/actor.maxHp*100}%`;
    $('mana').innerHTML=`${actor.mana}<small>/${actor.maxMana}</small>`;
    $('mana-bar').setAttribute('aria-valuenow',actor.mana);$('mana-bar').setAttribute('aria-valuemax',actor.maxMana);
    $('mana-bar').setAttribute('aria-valuetext',`${actor.mana} de ${actor.maxMana}. Recupera ${actor.manaRegen} no início do próprio turno.`);
    $('mana-fill').style.width=`${actor.mana/actor.maxMana*100}%`;
    $('mana-regen').textContent=`+${actor.manaRegen} / TURNO`;
    $('portrait').innerHTML=rigOf(actor).portraitMarkup?.()??portraitSVG(artwork(actor,strike?.source.id===actor.id),set,true).replace('0 0 300 360','45 115 220 215');
    const enabled=combat.playerTurn&&!busy()&&!state.paused;
    const queue=combat.queue;
    queue.forEach((unit,index)=>{
      if(unit.kind==='squirrel')rigOf(unit).idleTempo=combat.status==='playing'?(SQUIRREL_IDLE_TEMPO[index]??1):1;
    });
    $('turn-order-label').textContent=`ORDEM DOS TURNOS · RODADA ${combat.round}`;
    $('roster').innerHTML=queue.map((unit,index)=>`<button class="roster-card ${index===0?'active':''} ${unit.team==='enemy'?'enemy':''} ${strike?.source.id===unit.id?'attacking':''}" data-unit="${unit.id}" aria-label="${index===0?'Turno atual':'Próximo '+index}: ${unit.name}, ${unit.hp} de ${unit.maxHp} HP" aria-pressed="${index===0}" title="${unit.name} · ${unit.hp}/${unit.maxHp} HP · Iniciativa ${unit.initiative}">${unit.team==='enemy'?`<img src="${unit.kind==='zebra'?'/art/zebra/png-v1/quadros/down-0.png':unit.kind==='lion-cub'?'/art/leaozinho/png-v1/quadros/down-0.png':unit.kind==='squirrel'?'/art/esquilo/png-v1/quadros/down-0.png':'/art/rosnaldo/repouso-v2/quadros/frente-01.png'}" alt="">`:(rigOf(unit).portraitMarkup?.()??portraitSVG(artwork(unit,strike?.source.id===unit.id),unit.mutations).replace('0 0 300 360','55 130 195 155'))}<span class="roster-number">${index===0?'▸':index+1}</span></button>`).join('');
    $('boss-health').textContent=`${combat.boss.hp} / ${combat.boss.maxHp}`;
    const bleeding=combat.boss.bleeding;
    $('boss-status').hidden=!bleeding||combat.boss.hp<=0;
    $('boss-status').textContent=bleeding?`SANGRANDO · −${bleeding.damage} HP × ${bleeding.turns} turno${bleeding.turns>1?'s':''}`:'';
    $('boss-status').title='Sofre dano no início do próprio turno. Reaplicar renova a duração, sem acumular.';
    document.querySelector('.boss-health-track i').style.width=`${combat.boss.hp/combat.boss.maxHp*100}%`;
    const current=combat.current;
    $('active-name').textContent=combat.status!=='playing'?'COMBATE ENCERRADO':`VEZ DE ${current.name.toUpperCase()}`;
    $('action-points').innerHTML=combat.status!=='playing'?'—':current.team==='hero'?`<span class="${combat.movesRemaining?'available':''}">MOV ${combat.movesRemaining}/${current.movesPerTurn}</span><span class="${combat.attacksRemaining?'available':''}">ATQ ${combat.attacksRemaining}/${current.attacksPerTurn}</span><span class="${combat.bonusRemaining?'available':''}">BÔN ${combat.bonusRemaining}/1</span>`:'INIMIGO';
    $('action-points').setAttribute('aria-label',combat.playerTurn?`${combat.movesRemaining} movimentos e ${combat.attacksRemaining} ataques e ${combat.bonusRemaining} interações bônus disponíveis`:'Sem ações de aliado');
    const moveReason=combat.moveGuard(),attackReason=combat.attackGuard(),specialReason=combat.attackGuard(true);
    $('move').disabled=!enabled||!!moveReason;
    $('move').innerHTML=`Mover <small>ATÉ ${current.team==='hero'?current.move:3} CASAS <kbd>V</kbd></small>`;
    $('move').title=moveReason||'Mostrar destinos disponíveis [V]';
    $('attack').disabled=!enabled||!!attackReason;
    $('attack').innerHTML=`Atacar <small>${current.team==='hero'?current.skill:'BÁSICO'} <kbd>A</kbd></small>`;
    $('attack').title=attackReason||`${combat.damage()} de dano · alcance ${combat.range()} · selecione e clique no alvo [A]`;
    $('special-attack').disabled=!enabled||!!specialReason;
    $('special-attack').innerHTML=`${current.team==='hero'?current.special:'Habilidade'} <small>${current.team==='hero'?current.manaCost:0} MANA · SEM LIMITE POR TURNO <kbd>Q</kbd></small>`;
    const specialDescription=current.team==='hero'?combat.specialDescription():'';
    $('special-attack').title=specialReason||`${specialDescription} · alcance ${combat.specialRange()} · selecione e clique no alvo [Q]`;
    $('carried-object').hidden=current.id!=='raccoon';
    $('carried-object').textContent=current.id==='raccoon'?`Na mão: ${current.carried?.name??'nada · recolha uma pedra'}`:'';
    $('interact').disabled=!enabled||!!combat.interactionGuard();
    const propPlan=selectedProp?combat.canInteract(selectedProp):null;
    $('interact').innerHTML=`${propPlan?.pickup?'Recolher pedra':propPlan?.prop?.kind==='log'?'Empurrar tronco':'Interagir'} <small>1 BÔNUS · SEM MANA <kbd>B</kbd></small>`;
    $('interact').title=combat.interactionGuard()||'Pedras adjacentes e troncos: selecione um objeto [B]';
    $('special-hint').textContent=current.team==='hero'?`${specialDescription} · alcance ${combat.specialRange()} · habilidades gastam só mana`: 'Aguarde o próximo bicho.';
    for(const [id,mode] of [['move','move'],['attack','attack'],['special-attack','special'],['interact','interact']])$(id).setAttribute('aria-pressed',String(actionMode===mode));
    $('end-turn').disabled=!enabled;
    $('combat-hint').textContent=combat.status!=='playing'?'O combate terminou.':current.team==='enemy'?`${current.name} está agindo…`:busy()?'Ação em andamento…':state.paused?'Tempo pausado. Retome para agir.':actionMode==='interact'?(selectedProp?(propPlan?.pickup?'Confirme em Recolher pedra / B. Depois use Atacar para arremessá-la.':propPlan?.prop?.kind==='log'?`Tronco: 8 de dano · ${propPlan.path.length} casa(s). Clique na trajetória dourada ou em Empurrar / B.`:'Pedra: 4 de dano · alcance 3. Clique num inimigo.'):current.id==='raccoon'?'Escolha uma pedra adjacente para recolher ou um tronco para empurrar.':'Escolha uma pedra ou um tronco adjacente. Esc cancela.'):actionMode==='move'?'Casas verdes: clique para mover. Esc cancela.':actionMode==='attack'?`Área vermelha: ${current.skill} · ${combat.damage()} de dano. Clique em um inimigo.`:actionMode==='special'?`Área azul: ${current.special} · ${current.manaCost} mana. Clique em um inimigo.`:'Escolha uma ação. Interagir / B usa o cenário como bônus.';
    rigs.forEach((rig,index)=>rig.label.classList.toggle('selected',combat.playerTurn&&current.index===index));
    selection.visible=combat.playerTurn;
    const targeting=enabled&&(actionMode==='attack'||actionMode==='special');
    for(const enemy of combat.enemies)rigOf(enemy).focus(enemy.hp>0&&((bossFocused&&enemy===combat.boss)||(current===enemy&&combat.status==='playing')||(targeting&&combat.canAttack(actionMode==='special',enemy).ok)));
    $('boss-focus').classList.toggle('focused',bossFocused);$('boss-focus').setAttribute('aria-pressed',String(bossFocused));
    const interactionPlan=enabled&&actionMode==='interact'&&selectedProp?combat.canInteract(selectedProp):null;
    const interactionCells=interactionPlan?.path??(interactionPlan?.ok&&!interactionPlan.pickup?combat.tiles.filter(c=>{const d=Math.abs(c.col-current.cell.col)+Math.abs(c.row-current.cell.row);return d>0&&d<=3;}):[]);
    environment.labels(combat.props,enabled&&actionMode==='interact',selectedProp,id=>combat.canInteract(id));
    const targets=new Set(actionMode==='interact'?interactionCells.map(cellKey):targeting?combat.targetCells(actionMode==='special').map(cellKey):[]),bossCells=new Set(combat.enemies.filter(enemy=>enemy.hp>0).flatMap(enemy=>combat.cellsOf(enemy).map(cellKey)));
    highlighters.forEach((mesh,index)=>{
      const cell=tiles[index].userData,result=enabled&&actionMode==='move'?combat.canMove(cell):null;
      mesh.visible=!!(result?.ok&&result.path.length>0)||targets.has(cellKey(cell));
      mesh.material.color.set(actionMode==='interact'?'#e5bb62':actionMode==='move'?'#a4cc72':actionMode==='special'?'#64c6e4':'#e27c65');
      mesh.material.opacity=targeting&&bossCells.has(cellKey(cell))?.65:.32;
    });
    const ended=combat.status!=='playing'&&!busy()&&deaths.length===0;$('outcome').hidden=!ended;
    $('next-encounter').hidden=!(ended&&combat.status==='victory'&&encounterIndex===0);
    if(ended){$('outcome-title').textContent=combat.status==='victory'?(encounterIndex===0?'Clareira livre.':'Brejo conquistado.'):'O brejo levou a melhor.';$('outcome-description').textContent=combat.status==='victory'?(encounterIndex===0?'A clareira ficou livre. Seu bando recupera vida e mana antes de enfrentar Rosnaldo.':`Rosnaldo caiu na rodada ${combat.round}. ${combat.heroes.filter(a=>a.hp>0).length} bicho(s) de pé.`):'Seu bando foi derrotado. Tente combinar movimento, ataques e habilidades.';}
  }
  function beginTurn(){
    if(combat.current.team==='hero')state.selected=combat.current.index;
    if(combat.boss.hp<=0){const alive=combat.enemies.find(enemy=>enemy.hp>0);if(alive)combat.selectTarget(alive.id);}
    bossFocused=false;actionMode=null;selectedProp=null;aiWait=.8;aiMoved=false;render();
  }
  function nextTurn(){if(combat.advance()){beginTurn();if(combat.turnResults.length)for(const result of combat.turnResults)processResult(result);else $('battle-log').textContent=`Vez de ${combat.current.name}.`;}else render();}
  function select(index){
    if(combat.playerTurn&&combat.current.index===index){state.selected=index;render();}
    else showToast(combat.status==='playing'?`Agora é a vez de ${combat.current.name}.`:'O combate terminou.');
  }
  function inspectBoss(id){if(typeof id==='string')combat.selectTarget(id);bossFocused=!bossFocused;render();}
  function finishAction(){render();if(combat.status==='playing'&&combat.current.team==='enemy')nextTurn();}
  function chooseAction(mode){
    if(!ready())return;
    if(mode==='interact'&&actionMode==='interact'&&selectedProp){const plan=combat.canInteract(selectedProp);if(plan.ok&&(plan.pickup||plan.prop.kind==='log')){interact(selectedProp);return;}}
    const reason=mode==='interact'?combat.interactionGuard():mode==='move'?combat.moveGuard():combat.attackGuard(mode==='special');
    if(reason){showToast(reason);return;}
    selectedProp=null;actionMode=actionMode===mode?null:mode;render();
  }
  function move(goal){
    if(!ready())return;
    const result=combat.move(goal);if(!result.ok){showToast(result.reason);return;}if(!result.path.length)return;
    actionMode=null;const rig=rigs[combat.current.index],path=result.path;
    startMove(rig,path);pendingMove=rig;
    render();
  }
  function startMove(rig,path){
    rig.moving={path,step:0,from:rig.root.position.clone(),to:new THREE.Vector3(path[0].x,.08,path[0].z),progress:0};
    faceToward(rig,rig.moving.to);
  }
  function selectProp(id){
    if(!ready())return;
    const plan=combat.canInteract(id);if(!plan.ok){showToast(plan.reason);return;}
    actionMode='interact';selectedProp=id;render();
  }
  function interact(id=selectedProp,target){
    if(!ready())return;
    const result=combat.beginInteraction(id,target);if(!result.ok){showToast(result.reason);return;}
    const action=result.action,rig=rigOf(combat.current),view=environment.views.get(id);
    faceToward(rig,environment.position(action.prop.cell));idlePose(rig,state.time);rig.actionActive=true;
    interaction={...action,rig,view,elapsed:0,lastStep:0,landed:false,from:environment.position(action.prop.cell),to:target?rigOf(target).root.position.clone().add(new THREE.Vector3(0,.8,0)):null,duration:action.kind==='log'?.3+action.path.length*.23+.25:action.kind==='pickup'?.85:1.12};
    actionMode=null;selectedProp=null;render();
    $('battle-log').textContent=`${combat.current.name} ${action.kind==='pickup'?'recolhe uma pedra':action.kind==='log'?'empurra o tronco':'prepara uma pedrada'} · −1 bônus.`;
  }
  function tickInteraction(dt){
    if(!interaction)return;
    const a=interaction;a.elapsed+=dt;const p=Math.min(1,a.elapsed/a.duration),view=a.view;
    if(a.kind==='log'){
      // The footprint is sampled cell by cell, so a 2 × 2 enemy is hit once.
      const travel=Math.max(0,Math.min(a.path.length,(a.elapsed-.3)/.23));
      const i=Math.floor(travel),from=i===0?a.prop.cell:a.path[i-1],to=a.path[Math.min(i,a.path.length-1)];
      view.root.position.lerpVectors(environment.position(from),environment.position(to),travel-i);view.mesh.rotation.z=Math.sin(travel*Math.PI*2)*.12;environment.order(view);
      while(a.lastStep<Math.floor(travel)){a.lastStep++;processResult(combat.interactionHit(a.lastStep));}
      view.mesh.material.opacity=travel===a.path.length?Math.max(0,1-(a.elapsed-.3-a.path.length*.23)/.25):1;
      a.rig.art.position.copy(a.rig.artOrigin);a.rig.art.position.y-=Math.sin(p*Math.PI)*.035;
    }else{
      const hand=socketPosition(a.rig,'armR',181,282,new THREE.Vector3());
      if(a.kind==='rock'&&a.rig.id!=='rabbit')actionPose(a.rig,a.rig.id,p);
      else{a.rig.art.position.copy(a.rig.artOrigin);a.rig.art.position.y-=Math.sin(p*Math.PI)*.08;}
      if(p<.42)view.root.position.lerpVectors(a.from,hand,Math.min(1,p/.35));
      else if(a.kind==='rock'){const f=Math.min(1,(p-.42)/.26);view.root.position.lerpVectors(hand,a.to,f);view.root.position.y+=Math.sin(f*Math.PI)*.6;view.mesh.rotation.z+=dt*10;view.mesh.renderOrder=2500000;}
      if(p>=(a.kind==='pickup'?.65:.68)&&!a.landed){a.landed=true;view.root.visible=false;processResult(combat.interactionHit());if(a.kind==='pickup')$('battle-log').textContent='Graxinin guardou a pedra. Use Arremessar objeto / A para escolher um inimigo.';}
    }
    if(p===1){view.root.visible=false;a.rig.actionActive=false;idlePose(a.rig,state.time);combat.finishInteraction();interaction=null;finishAction();}
  }
  function projectile(acid,variant=''){
    const svg=variant==='acorn'?'<path fill="#cd923e" d="M112 140Q100 195 150 201Q197 195 185 140Z"/><path fill="#785332" d="M106 145Q107 109 149 108Q192 112 193 145Z"/><path fill="none" stroke-width="7" d="M151 109l8-20"/>':variant==='bottle'?bottleSVG:variant==='can'?canSVG:variant==='poop'?'<path fill="#795334" d="M110 170Q95 153 117 139Q105 124 135 115Q139 99 156 91Q151 116 175 124Q198 130 185 147Q214 168 188 180Q142 196 110 170Z"/><path fill="none" stroke="#b18a51" stroke-width="6" d="M122 146q29 11 53-1m-41-20q18 7 29 0"/>':variant==='urine'?'<path fill="#d4ba4c" d="M94 155Q116 128 170 132Q210 139 217 154Q201 178 164 170Q121 180 94 155Z"/><path fill="none" stroke="#f4e1a1" stroke-width="7" d="M119 148q38-9 65 2"/><circle fill="#d4ba4c" cx="87" cy="166" r="9"/>':variant==='cut'?'<path fill="#bdc4b6" d="M91 177l39-65 13 20 14-29 9 27 35-12-11 39-64 43Z"/><path fill="none" stroke="#8b4943" stroke-width="8" d="M120 181l58-47"/>':acid?'<path fill="#9aa94e" d="M106 152Q110 109 145 110Q180 90 194 126Q221 158 189 180Q150 207 120 175Z"/><path fill="none" stroke="#d2d88b" stroke-width="6" d="M131 140q5-14 18-12"/><circle fill="#84913e" cx="102" cy="177" r="10"/>':'<path fill="#969281" d="M101 139l32-35 58 18 13 42-38 30-55-13Z"/><path fill="none" stroke="#4f5949" stroke-width="5" d="M133 111l13 35 47-14m-46 16l-21 31"/>';
    const group=new THREE.Group();group.quaternion.copy(camera.quaternion);
    if(variant==='stone'){const texture=environment.textures.get('rock');const art=new THREE.Mesh(new THREE.PlaneGeometry(.42,.42),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));art.renderOrder=2500000;group.add(art);scene.add(group);return {group,art,from:new THREE.Vector3(),to:new THREE.Vector3(),acid,launched:false};}
    const art=vectorPart({svg,pivot:[150,150]},2500000);art.position.set(0,0,0);art.scale.set(.0024,-.0024,.0024);group.add(art);scene.add(group);
    return {group,art,from:new THREE.Vector3(),to:new THREE.Vector3(),acid,launched:false};
  }
  function startSquirrelThrow(source,target){
    const rig=rigOf(source),targetRig=rigOf(target),pickup=combat.squirrelPickup(target);
    const shot=projectile(false,'acorn');shot.group.name='Noz da Nozada';shot.group.visible=false;shot.group.scale.setScalar(1.18);
    const ground=environment.position(pickup.cell);ground.y=.16;
    if(!pickup.path){
      const offset=rig.root.position.clone().sub(ground);offset.y=0;
      ground.addScaledVector(offset.normalize(),pickup.cell===target.cell?.52:.38);
    }
    faceToward(rig,targetRig.root.position);rig.actionActive=true;
    socketPosition(targetRig,'body',157,250,shot.to);
    const lean=rig.direction==='left'||rig.direction==='down'?1:-1;
    squirrelThrow={source,rig,shot,pickup,ground,lean,phase:'throw',elapsed:0};
    $('battle-log').textContent=`${source.name} se atrapalha com a noz…`;
    render();
  }
  function finishSquirrelThrow(a){
    dispose(a.shot.group);a.rig.actionActive=false;a.rig.resetPose();a.rig.clearActionFrame();
    squirrelThrow=null;finishAction();
  }
  function tickSquirrelThrow(dt){
    const a=squirrelThrow,{rig,shot}=a;
    a.elapsed+=dt;
    const progress=(start,end)=>THREE.MathUtils.clamp((a.elapsed-start)/(end-start),0,1);
    const stage=phase=>{a.phase=phase;a.elapsed=0;};
    if(a.phase==='throw'){
      const launch=.42,impact=.76,land=1.03,end=1.28;
      const slip=progress(.12,.55),regret=progress(.56,end);
      if(a.elapsed<.56){
        const stumble=Math.sin(slip*Math.PI),wobble=Math.sin(slip*Math.PI*2);
        rig.poseNozada(a.elapsed<launch?'hold':'flail',0,.22*stumble,.14*stumble,.29*a.lean*wobble);
      }else{
        const sink=Math.sin(regret*Math.PI);
        rig.poseNozada('regret',regret,-.24*sink,0,-.14*a.lean*sink);
      }
      if(a.elapsed<launch)return;
      if(!shot.launched){shot.launched=true;socketPosition(rig,'armR',181,282,shot.from);shot.group.visible=true;}
      if(a.elapsed<impact){
        const flight=progress(launch,impact);
        shot.group.position.lerpVectors(shot.from,shot.to,flight);shot.group.position.y+=.42*Math.sin(flight*Math.PI);
      }else{
        if(!a.hit){a.hit=true;processResult(combat.enemyAttack());}
        const rebound=progress(impact,land),bounce=progress(land,end);
        shot.group.position.lerpVectors(shot.to,a.ground,rebound);
        shot.group.position.y+=.29*Math.sin(rebound*Math.PI)+.14*Math.sin(bounce*Math.PI);
        if(!a.landed&&a.elapsed>=land){
          a.landed=true;roarParticle(a.ground,new THREE.Vector3(.15,.26,0),true);
          $('battle-log').textContent=`Ops… a noz escapou das patas de ${a.source.name}.`;
        }
      }
      shot.group.rotateZ(dt*15*(1-progress(land,end)));
      if(a.elapsed<end)return;
      if(!a.pickup.path||combat.status!=='playing'){finishSquirrelThrow(a);return;}
      $('battle-log').textContent=`${a.source.name} corre para buscar a noz.`;
      stage('fetch');if(a.pickup.path.length)startMove(rig,a.pickup.path);
    }else if(a.phase==='fetch'||a.phase==='flee'){
      if(rig.moving){
        const stride=rig.moving.progress;
        rig.poseNozada('walk',stride,.13*Math.sin(stride*2*Math.PI),.12*Math.sin(stride*Math.PI));
        return;
      }
      stage(a.phase==='fetch'?'pickup':'skid');
      if(a.phase==='skid')roarParticle(rig.root.position,new THREE.Vector3(-.2,.2,0),true);
    }else if(a.phase==='pickup'){
      const p=progress(0,.31);
      rig.poseNozada(p<.68?'reach':'hold',p,-.24*Math.sin(p*Math.PI));
      shot.group.visible=p<.68;
      if(p>.38&&shot.group.visible){
        const hand=socketPosition(rig,'armR',181,282,shot.to);
        shot.group.position.lerpVectors(a.ground,hand,progress(.31*.38,.31*.68));
      }
      if(p<1)return;
      const closest=combat.heroes.filter(hero=>hero.hp>0).sort((x,y)=>combat.distance(a.source,x)-combat.distance(a.source,y))[0];
      faceToward(rig,rigOf(closest).root.position);rig.poseNozada('hold',0,-.08);stage('look');
      $('battle-log').textContent=`${a.source.name} encara ${closest.name}.`;
    }else if(a.phase==='look'||a.phase==='alarm'){
      if(a.phase==='look'){
        rig.poseNozada('hold',0,-.08);
        if(a.elapsed<.33)return;
        $('battle-log').textContent=`${a.source.name} levou um susto!`;
        stage('alarm');
        const node=document.createElement('span');node.className='damage-pop squirrel-alarm';node.textContent='!';effectLayer.append(node);
        effects.push({node,position:rig.root.position.clone().add(new THREE.Vector3(0,1.32,0)),time:.56,total:.56});
      }
      const p=progress(0,.55),jump=Math.sin(Math.PI*progress(.06,.87));
      rig.poseNozada('alarm',p,.29*jump-.2*Math.sin(Math.PI*progress(.82,1)),.46*jump);
      if(p<1)return;
      const retreat=combat.squirrelRetreat();
      if(!retreat.length){finishSquirrelThrow(a);return;}
      stage('flee');startMove(rig,retreat);
      $('battle-log').textContent=`${a.source.name} dispara para longe!`;
      roarParticle(rig.root.position,new THREE.Vector3(.18,.28,0),true);
    }else{
      const p=progress(0,.26);
      rig.poseNozada('skid',p,-.24*Math.sin(Math.PI*p));
      if(p===1)finishSquirrelThrow(a);
    }
  }
  function startStrike(source,targets,impact,skill,special=false){
    const sourceRig=rigOf(source),targetRig=targets.length?rigOf(targets[0]):rigs.find((rig,index)=>combat.heroes[index].hp>0);
    const delta=targetRig.root.position.clone().sub(sourceRig.root.position).applyQuaternion(camera.quaternion.clone().invert());delta.z=0;delta.normalize();
    const kind=source.team==='enemy'?(source.kind==='zebra'?'zebraKick':source.kind==='lion-cub'?'cubBite':skill==='Mordida'?'bite':'roar'):special&&source.id==='raccoon'?'bottle':special&&source.id==='rabbit'?'barrage':source.id;
    faceToward(sourceRig,kind==='barrage'||kind==='zebraKick'?sourceRig.root.position.clone().multiplyScalar(2).sub(targetRig.root.position):targetRig.root.position);
    idlePose(sourceRig,state.time);
    strike={source,rig:sourceRig,targetRig,kind,special,elapsed:0,duration:ACTIONS[kind].duration,direction:delta,impact,hit:false,projectile:null,waves:false};
    sourceRig.actionActive=true;
    if(sourceRig.prepareActionFrames){
      const current=strike;current.ready=false;
      sourceRig.actionActive=true;
      sourceRig.prepareActionFrames(kind,sourceRig.direction).then(()=>{if(strike===current)current.ready=true;}).catch(error=>{console.error(error);if(strike===current)current.ready=true;});
    }
    if(source.team==='hero'){sourceRig.emotionLeft=0;setExpression(sourceRig,kind==='barrage'?'panic':kind==='urine'?'relief':source.id==='rat'?'anger':'neutral');}
    sourceRig.parts.rage.visible=source.team==='enemy'||sourceRig.expression==='neutral';
    if(kind==='barrage'){strike.shots=[];strike.launched=0;strike.landed=0;}
    else if(source.team==='hero'&&source.index!==0)strike.projectile=projectile(false,source.id==='raccoon'?(special?'bottle':source.carried?.kind==='rock'?'stone':'can'):special?'cut':'');
    if(special){
      const group=new THREE.Group();group.position.copy(sourceRig.root.position).y+=.7;group.quaternion.copy(camera.quaternion);
      const ring=new THREE.Mesh(new THREE.RingGeometry(.4,.46,40),new THREE.MeshBasicMaterial({color:'#91cddd',transparent:true,opacity:.8,depthWrite:false,depthTest:false,side:THREE.DoubleSide}));ring.renderOrder=2500100;group.add(ring);scene.add(group);effects.push({group,time:.65,total:.65,roar:true});
      if(strike.projectile)strike.projectile.art.scale.multiplyScalar(1.3);
    }
    render();
    if(skill==='Invocar leõezinhos')$('battle-log').textContent='Rosnaldo chama seus leõezinhos…';
  }
  function attack(special=false,target=combat.boss){
    if(!ready())return;const result=combat.canAttack(special,target);if(!result.ok){showToast(result.reason);return;}
    combat.selectTarget(target.id);
    actionMode=null;
    if(special&&combat.current.pellets){
      const source=combat.current,started=combat.beginBarrage(target);if(!started.ok){showToast(started.reason);return;}
      startStrike(source,[target],()=>{},undefined,true);
      $('battle-log').textContent=`${source.name} prepara ${source.special}. −${started.manaSpent} mana.`;return;
    }
    startStrike(combat.current,[target],()=>processResult(combat.attack(special,target)),undefined,special);
  }
  function flash(rig){
    const active=flashes.find(f=>f.rig===rig);if(active){active.time=.2;return;}
    const materials=new Set();rig.art.traverse(o=>{if(o.isMesh)materials.add(o.material);});
    const entries=[...materials].map(m=>({m,color:m.color.clone()}));entries.forEach(({m,color})=>m.color.copy(color).lerp(new THREE.Color('#ce6553'),.6));flashes.push({rig,entries,time:.2});
  }
  function dispose(group){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});scene.remove(group);}
  function hitEffect(rig,damage,acid,hit={}){
    flash(rig);
    const attacker=strike??squirrelThrow;
    const direction=attacker?Math.sign(rig.root.position.clone().sub(attacker.rig.root.position).applyQuaternion(camera.quaternion.clone().invert()).x)||1:1;
    if(hit.bleedTick)startBleedTick(rig,direction);else startRecoil(rig,direction,damage);
    const node=document.createElement('span');node.className=`damage-pop${strike?.special?' special-damage':''}${hit.critical?' critical-damage':''}${hit.bleedTick?' bleed-damage':''}`;node.textContent=`−${damage}${hit.critical?' CRÍTICO!':hit.bleedTick?' SANGRA':''}`;effectLayer.append(node);
    effects.push({node,position:rig.root.position.clone().add(new THREE.Vector3(hit.pellet?(hit.pellet%3-1)*.45:0,1.15+(hit.pellet?hit.pellet%2*.25:0),0)),time:.95,total:.95});
    const svg=acid?'<path fill="#a5b456" d="M146 70l12 40 45-24-19 43 49 13-50 13 24 46-49-23-10 48-13-49-43 23 20-43-44-16 47-12-24-37 39 15Z"/>':'<path fill="#ddd0ad" d="M71 176Q112 117 188 85Q155 130 103 190Z M112 211Q158 143 224 122Q192 167 146 220Z M161 234Q194 186 238 171L186 242Z"/>';
    const group=new THREE.Group();group.position.copy(rig.root.position).y+=.9;group.quaternion.copy(camera.quaternion);
    const art=vectorPart({svg,pivot:[150,150]},2500100);art.scale.set(.0035,-.0035,.0035);art.position.set(0,0,0);
    const tint=hit.bleedTick||hit.bleeding?'#a2433b':strike?.kind==='barrage'?'#805735':strike?.kind==='urine'?'#d4ba4c':null;
    if(tint)art.traverse(o=>{if(o.isMesh)o.material.color.set(tint);});
    group.add(art);scene.add(group);effects.push({group,time:.28,total:.28});
  }
  function processResult(result){
    if(!result.ok)return;
    for(const actor of result.summons??[]){
      const rig=createLionCub(scene,camera,tiles,viewport,actor);
      lionCubs.push(rig);allRigs.push(rig);enemyRigById.set(actor.id,rig);
      const target=combat.heroes.filter(hero=>hero.hp>0).sort((a,b)=>combat.distance(a,actor)-combat.distance(b,actor))[0];
      if(target)faceToward(rig,rigOf(target).root.position);
      for(const side of [-1,1])roarParticle(rig.root.position.clone(),new THREE.Vector3(side*.4,.1,.05),true);
    }
    hitPause=.055;
    for(const hit of result.hits){const actor=actorById(hit.target),rig=rigOf(actor);hitEffect(rig,hit.damage,result.skill==='Cuspe ácido'||result.skill==='Xixi ácido',{...hit,pellet:result.pellet,bleedTick:result.skill==='Sangramento'});if(hit.hp===0){rig.moving=null;rig.death={elapsed:0,direction:rig.recoil?.direction??rig.bleedTick?.direction??1,ready:!rig.prepareActionFrames};if(rig.prepareActionFrames){const death=rig.death;rig.prepareActionFrames('death',rig.direction).then(()=>{if(rig.death===death)death.ready=true;}).catch(error=>{console.error(error);death.ready=true;});}deaths.push({rig,time:rig.pngRig?1.1:rig.id==='raccoon'?1.25:.65});}}
    $('battle-log').textContent=`${actorById(result.source).name} · ${result.skill}${result.pellet?` (${result.pellet}/10)`:''}.${result.manaSpent?` −${result.manaSpent} mana.`:''} ${result.summons?.length?`${result.summons.length} leãozinho(s) entram no combate.`:result.hits.map(h=>`${actorById(h.target).name}: −${h.damage} HP${h.critical?' CRÍTICO!':''}${h.bleeding?' · sangramento aplicado':''}`).join(' · ')}`;
    render();
  }
  function roarParticle(position,velocity,dust=false){
    const svg=dust?'<path fill="#ded1ad" stroke-width="2.5" d="M123 162q-18 0-15-16 2-14 17-12-1-18 16-18 16-1 18 15 19-7 24 9 7 17-12 23Z"/>':'<path fill="#efe5c8" stroke-width="3" d="M126 151q19-14 39-8 15 6 8 15-10 10-47-7Z"/>';
    const group=new THREE.Group();group.position.copy(position);group.quaternion.copy(camera.quaternion);
    const art=vectorPart({svg,pivot:[150,150]},2500110);art.position.set(0,0,0);art.scale.set(dust?.003:.0019,dust?-.003:-.0019,.002);group.add(art);scene.add(group);
    effects.push({group,velocity,gravity:dust?-.1:-1.9,time:dust?.5:.42,total:dust?.5:.42});
  }
  function tick(dt,realDt=dt){
    tickInteraction(dt);environment.tick();
    const enemyMover=squirrelThrow?.rig??pendingMove;
    if(enemyMover&&!rigs.includes(enemyMover)&&enemyMover.moving){
      const rig=enemyMover,move=rig.moving,stepTime=squirrelThrow?.phase==='flee'?.15:squirrelThrow?.phase==='fetch'?.2:.24;
      move.progress=Math.min(1,move.progress+dt/stepTime);
      faceToward(rig,move.to);rig.root.position.lerpVectors(move.from,move.to,move.progress);
      if(move.progress===1){rig.cell={...move.path[move.step]};rig.cells=[rig.cell];if(squirrelThrow)squirrelThrow.source.cell={...rig.cell};move.step++;if(move.step===move.path.length)rig.moving=null;else{move.from.copy(rig.root.position);move.to.set(move.path[move.step].x,.08,move.path[move.step].z);move.progress=0;}}
    }
    for(const rig of rigs)if(rig.emotionLeft>0){rig.emotionLeft=Math.max(0,rig.emotionLeft-dt);if(rig.emotionLeft===0){setExpression(rig);if(rig.id==='rabbit'&&!rig.moving)faceToward(rig,boss.root.position);render();}}
    hitPause=Math.max(0,hitPause-realDt);
    for(let i=flashes.length-1;i>=0;i--){const f=flashes[i];f.time-=dt;if(f.time<=0){f.entries.forEach(({m,color})=>m.color.copy(color));flashes.splice(i,1);}}
    for(let i=effects.length-1;i>=0;i--){const fx=effects[i];fx.time-=dt;const progress=1-fx.time/fx.total;
      if(fx.node){const p=fx.position.clone().project(camera);fx.node.style.left=`${(p.x*.5+.5)*viewport.clientWidth}px`;fx.node.style.top=`${(-p.y*.5+.5)*viewport.clientHeight-progress*50}px`;fx.node.style.opacity=String(Math.min(1,fx.time*4));}
      if(fx.group){if(fx.velocity){fx.velocity.y+=fx.gravity*dt;fx.group.position.addScaledVector(fx.velocity,dt);}fx.group.scale.setScalar(fx.roar ? .2+progress*3 : .8+progress*.5);fx.group.traverse(o=>{if(o.isMesh)o.material.opacity=Math.max(0,1-progress)*(fx.roar ? .45 : 1);});}
      if(fx.time<=0){if(fx.node)fx.node.remove();if(fx.group)dispose(fx.group);effects.splice(i,1);}
    }
    for(let i=deaths.length-1;i>=0;i--){const death=deaths[i];death.time-=dt;if(death.time<=0){
      // Depois da queda, o boss continua visível na última pose até o reinício.
      if(death.rig.id==='rosnaldo'||death.rig.pngRig){deaths.splice(i,1);render();continue;}
      death.rig.root.visible=false;if(death.rig.shadow)death.rig.shadow.visible=false;if(death.rig.floor)death.rig.floor.visible=false;deaths.splice(i,1);}}
    if(squirrelThrow)tickSquirrelThrow(dt);
    else if(strike){
      const s=strike;s.elapsed+=s.ready===false?0:dt;const p=Math.min(1,s.elapsed/s.duration),action=ACTIONS[s.kind];
      if(s.kind==='barrage'){
        const emotion=barrageEmotion(p);
        if(s.rig.expression!==emotion){setExpression(s.rig,emotion);render();}
        setFaceFlush(s.rig,barrageFlush(p));
        for(const node of document.querySelectorAll('[data-rabbit-flush]'))node.setAttribute('fill',rabbitFlushColor(node.dataset.rabbitFlush,s.rig.faceFlush));
      }
      actionPose(s.rig,s.kind,p);
      const origin=s.rig.artOrigin;
      if(s.kind==='rabbit'||s.kind==='bite'||s.kind==='cubBite'){
        const windup=Math.sin(Math.min(1,p/.28)*Math.PI/2),reach=p<.28?-.07*windup:p<action.impact?THREE.MathUtils.lerp(-.07,.3,(p-.28)/(action.impact-.28)):.3*(1-(p-action.impact)/(1-action.impact));
        s.rig.art.position.addScaledVector(s.direction,reach);
      }
      s.rig.syncActionFrame?.();
      if(s.projectile){
        const shot=s.projectile,acid=shot.acid;
        const hand=()=>s.kind==='urine'?socketPosition(s.rig,'legR',180,315,new THREE.Vector3()):socketPosition(s.rig,acid?'muzzle':'armR',acid?151:181,acid?231:282,new THREE.Vector3());
        if(p<action.release){shot.group.position.copy(hand());shot.group.visible=!acid&&p>.08;}
        else{
          if(!shot.launched){shot.from.copy(hand());socketPosition(s.targetRig,'head',s.targetRig.id==='rosnaldo'?157:150,s.targetRig.id==='rosnaldo'?175:205,shot.to);shot.launched=true;}
          const flight=THREE.MathUtils.clamp((p-action.release)/(action.impact-action.release),0,1);
          shot.group.visible=p<action.impact;shot.group.position.lerpVectors(shot.from,shot.to,flight);shot.group.position.y+=Math.sin(flight*Math.PI)*(acid ? .18 : .5);
          if(!acid)shot.group.rotateZ(dt*12);
          else shot.art.scale.set(.0032,-.0019,.0024);
        }
      }
      if(s.kind==='barrage'){
        while(combat.barrage&&s.launched<s.source.pellets&&s.elapsed>=.42+s.launched*.13){
          const shot=projectile(false,'poop');shot.group.scale.setScalar(.65);
          socketPosition(s.rig,'tail',73,291,shot.from);socketPosition(s.targetRig,'body',157,250,shot.to);
          shot.start=.42+s.launched*.13;shot.landed=false;s.shots.push(shot);s.launched++;
        }
        for(const shot of s.shots){
          if(shot.landed)continue;
          const flight=THREE.MathUtils.clamp((s.elapsed-shot.start)/.34,0,1);
          shot.group.position.lerpVectors(shot.from,shot.to,flight);shot.group.position.y+=Math.sin(flight*Math.PI)*.25;shot.group.rotateZ(dt*9);
          if(flight===1){shot.landed=true;shot.group.visible=false;s.landed++;if(combat.barrage)processResult(combat.barrageHit());}
        }
      }
      if(s.kind==='roar'){
        if(p>=.3&&!s.dust){s.dust=true;for(const side of [-1,1]){const at=s.rig.root.position.clone();at.x+=side*.8;roarParticle(at,new THREE.Vector3(side*.35,.15,.05),true);}}
        const emitted=s.spittle||0;
        if(p>=.49+emitted*.045&&emitted<5){
          s.spittle=emitted+1;const at=socketPosition(s.rig,'mouth',175,200,new THREE.Vector3());
          const velocity=s.targetRig.root.position.clone().sub(s.rig.root.position);velocity.y=0;velocity.normalize().multiplyScalar(1.4+emitted*.12);velocity.y=.4+(emitted%3)*.3;roarParticle(at,velocity);
        }
      }
      if(s.kind==='roar'&&p>=action.release&&!s.waves){
        s.waves=true;const center=socketPosition(s.rig,'mouth',175,200,new THREE.Vector3());
        for(let i=0;i<3;i++){
          const group=new THREE.Group();group.position.copy(center);group.quaternion.copy(camera.quaternion);
          const ring=new THREE.Mesh(new THREE.RingGeometry(.94+i*.22,.97+i*.22,64),new THREE.MeshBasicMaterial({color:'#ded1ad',transparent:true,opacity:.45,depthWrite:false,depthTest:false,side:THREE.DoubleSide}));ring.renderOrder=2500100;group.add(ring);scene.add(group);effects.push({group,time:.55,total:.55,roar:true});
        }
      }
      if(s.kind!=='barrage'&&p>=action.impact&&!s.hit){s.hit=true;s.impact();}
      if(p>=1){s.rig.actionActive=false;s.rig.clearActionFrame?.();s.rig.parts.rage.visible=false;s.rig.art.position.copy(origin);s.rig.art.rotation.z=0;if(s.rig.parts.body)s.rig.parts.body.rotation.z=0;if(s.projectile)dispose(s.projectile.group);if(s.shots)for(const shot of s.shots)dispose(shot.group);if(s.source.team==='hero'){setExpression(s.rig,s.kind==='barrage'||s.kind==='urine'?'relief':'neutral');s.rig.emotionLeft=s.rig.expression==='relief'?(s.rig.reliefDuration??1.8):0;}strike=null;finishAction();}
    }else if(pendingMove&&!pendingMove.moving){const enemyMove=!rigs.includes(pendingMove);pendingMove=null;if(enemyMove){aiWait=.25;render();}else finishAction();}
    if(combat.status==='playing'&&combat.current.team==='enemy'&&!busy()&&!state.paused){
      aiWait-=dt;if(aiWait<=0){
        const movement=!aiMoved?combat.enemyMove():null;aiMoved=true;
        if(movement){
          const rig=rigOf(combat.current),path=movement.path;
          startMove(rig,path);pendingMove=rig;
          $('battle-log').textContent=`${combat.current.name} corre ${path.length} casa(s).`;render();
        }else{
          const plan=combat.planEnemyAttack(),source=combat.current;
          if(!plan)nextTurn();
          else if(source.kind==='squirrel')startSquirrelThrow(source,plan.targets[0]);
          else startStrike(source,plan.targets,()=>processResult(combat.enemyAttack()),plan.skill);
        }
      }
    }
    const scavenger=combat.heroes.find(h=>h.id==='raccoon'),scavengerRig=rigOf(scavenger);
    const throwingCan=strike?.source===scavenger&&strike.kind==='raccoon'&&strike.elapsed/strike.duration>.08;
    forEachView(scavengerRig,view=>{if(view.parts.can)view.parts.can.visible=scavenger.carried?.kind==='can'&&!throwingCan;});
    environment.heldRock.visible=scavenger.hp>0&&scavenger.carried?.kind==='rock'&&strike?.source!==scavenger&&interaction?.rig!==scavengerRig;
    if(environment.heldRock.visible){socketPosition(scavengerRig,'armR',181,282,environment.heldRock.position);environment.heldRock.renderOrder=1000000+Math.round((scavengerRig.root.position.z*.88+scavengerRig.root.position.x*.47)*100)*1000+600;}
    selection.visible=combat.playerTurn;if(combat.playerTurn){const rig=rigs[combat.current.index];selection.position.x=rig.root.position.x;selection.position.z=rig.root.position.z;}
  }
  function restart(){
    boss.clearActionFrame?.();
    boss.actionActive=false;
    rigs.forEach(rig=>{setExpression(rig);rig.emotionLeft=0;});
    if(strike?.shots)for(const shot of strike.shots)dispose(shot.group);
    if(strike?.projectile)dispose(strike.projectile.group);strike=null;pendingMove=null;hitPause=0;
    if(squirrelThrow)dispose(squirrelThrow.shot.group);squirrelThrow=null;
    for(const fx of effects){if(fx.node)fx.node.remove();if(fx.group)dispose(fx.group);}effects.length=0;
    flashes.forEach(f=>f.entries.forEach(({m,color})=>m.color.copy(color)));flashes.length=0;deaths.length=0;
    for(const rig of lionCubs){enemyRigById.delete(rig.id);allRigs.splice(allRigs.indexOf(rig),1);rig.dispose();}lionCubs.length=0;
    combat.reset();interaction=null;selectedProp=null;environment.sync(combat.props);
    allRigs.forEach(rig=>{rig.root.visible=true;rig.recoil=null;rig.death=null;rig.bleedTick=null;forEachView(rig,view=>{resetPose(view);view.parts.rage.visible=false;for(const id of ['horn','eye','tail'])if(view.parts['mut_'+id])view.parts['mut_'+id].visible=false;if(view.parts.tail)view.parts.tail.visible=true;});if(rig.floor)rig.floor.visible=true;if(rig.shadow){rig.shadow.visible=true;rig.shadow.material.opacity=.2;}});
    rigs.forEach((rig,index)=>{const actor=combat.heroes[index];rig.cell={...actor.cell};rig.root.position.set(actor.cell.x,.08,actor.cell.z);rig.moving=null;rig.reaction=0;setRigOrder(rig);for(const id of ['horn','eye','tail'])rig.parts['mut_'+id].visible=false;if(rig.parts.tail)rig.parts.tail.visible=true;});
    for(const enemy of combat.enemies){const rig=rigOf(enemy);rig.moving=null;if(rig.pngRig){rig.cell={...enemy.cell};rig.cells=[rig.cell];rig.root.position.set(enemy.cell.x,.08,enemy.cell.z);rig.clearActionFrame();}}
    allRigs.forEach(rig=>{rig.actionActive=false;});
    showEncounter();initialFacing();beginTurn();$('battle-log').textContent='Um novo combate começou.';
  }
  function nextEncounter(){
    if(combat.status!=='victory'||busy()||encounterIndex!==0)return false;
    encounterIndex=1;combat=createCombat();boss=rigOf(combat.boss);restart();return true;
  }
  $('next-encounter').addEventListener('click',nextEncounter);
  $('roster').addEventListener('click',event=>{const button=event.target.closest('[data-unit]');if(!button)return;const actor=actorById(button.dataset.unit);if(actor.team==='enemy')inspectBoss(actor.id);else select(actor.index);});
  $('boss-focus').addEventListener('click',inspectBoss);
  $('interact').addEventListener('click',()=>chooseAction('interact'));
  $('move').addEventListener('click',()=>chooseAction('move'));
  $('attack').addEventListener('click',()=>chooseAction('attack'));
  $('special-attack').addEventListener('click',()=>chooseAction('special'));
  $('end-turn').addEventListener('click',()=>{if(ready()&&combat.playerTurn)nextTurn();});
  $('restart').addEventListener('click',restart);
  document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||e.target.isContentEditable||e.repeat)return;const key=e.key.toLowerCase();if(['v','a','q','b'].includes(key)){e.preventDefault();chooseAction({v:'move',a:'attack',q:'special',b:'interact'}[key]);}if(key==='escape'){actionMode=null;selectedProp=null;render();}if(key==='e'){e.preventDefault();if(ready()&&combat.playerTurn)nextTurn();}});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function pick(event){const rect=viewport.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects([...tiles,...[...environment.views.values()].filter(v=>v.root.visible).map(v=>v.hit),...rigs.filter((r,i)=>combat.heroes[i].hp>0).map(r=>r.root.children.find(c=>c.userData.creature!==undefined)),...combat.enemies.filter(enemy=>enemy.hp>0).map(enemy=>rigOf(enemy).hit)],false);}
  const canvas=viewport.querySelector('canvas');
  canvas.addEventListener('pointermove',event=>{const hits=pick(event),actor=hits.find(h=>h.object.userData.boss||h.object.userData.enemy||h.object.userData.creature!==undefined),tile=hits.find(h=>h.object.userData.tile);canvas.style.cursor=actor?'pointer':tile&&actionMode?'crosshair':'default';if(tile&&!actor&&combat.playerTurn&&!busy()&&!state.paused&&actionMode==='move'){const result=combat.canMove(tile.object.userData);$('combat-hint').textContent=result.ok&&result.path.length?`Mover ${result.path.length} casa(s) · usa 1 movimento`:result.reason||'Escolha outra casa.';}});
  canvas.addEventListener('pointerleave',()=>render());
  canvas.addEventListener('click',event=>{
    const hits=pick(event),actor=hits.find(h=>h.object.userData.boss||h.object.userData.enemy||h.object.userData.creature!==undefined),tile=hits.find(h=>h.object.userData.tile);
    const propHit=hits.find(h=>h.object.userData.prop),clickedProp=propHit?.object.userData.prop??(!actor&&tile?combat.props.find(p=>!p.used&&cellKey(p.cell)===cellKey(tile.object.userData))?.id:null);
    if(actionMode==='interact'){
      if(!ready())return;
      const plan=selectedProp?combat.canInteract(selectedProp):null;
      const target=actor?.object.userData.enemy?actorById(actor.object.userData.enemy):actor?.object.userData.boss?combat.enemies.find(e=>e.id==='rosnaldo'):tile?combat.enemies.find(e=>e.hp>0&&combat.cellsOf(e).some(c=>cellKey(c)===cellKey(tile.object.userData))):null;
      if(plan?.ok&&plan.prop.kind==='rock'&&!plan.pickup&&target){interact(selectedProp,target);return;}
      if(plan?.ok&&plan.prop.kind==='log'&&tile&&plan.path.some(c=>cellKey(c)===cellKey(tile.object.userData))){interact();return;}
      if(clickedProp){if(clickedProp===selectedProp&&(plan?.pickup||plan?.prop.kind==='log'))interact();else selectProp(clickedProp);return;}
      showToast('Escolha um objeto adjacente e confirme o alvo ou a trajetória.');return;
    }
    if(clickedProp&&!actor&&!actionMode){selectProp(clickedProp);return;}
    const enemyTarget=actor?.object.userData.enemy?actorById(actor.object.userData.enemy):actor?.object.userData.boss?combat.enemies.find(enemy=>enemy.id==='rosnaldo'):(!actor||actionMode==='attack'||actionMode==='special')&&tile?combat.enemies.find(enemy=>enemy.hp>0&&combat.cellsOf(enemy).some(cell=>cellKey(cell)===cellKey(tile.object.userData))):null;
    if(enemyTarget){if(actionMode==='attack'||actionMode==='special')attack(actionMode==='special',enemyTarget);else if(actionMode==='move')showToast('Um inimigo ocupa essa casa.');else inspectBoss(enemyTarget.id);return;}
    if(actor){select(actor.object.userData.creature);return;}
    if(tile&&actionMode==='move')move(tile.object.userData);
    else if(tile)showToast(actionMode?'Clique em um inimigo para confirmar o alvo.':'Escolha uma ação nos botões abaixo.');
  });
  beginTurn();
  return {get combat(){return combat;},get encounterIndex(){return encounterIndex;},nextEncounter,render,tick,select,restart,attack,move,chooseAction,selectProp,interact,get actionMode(){return actionMode;},get busy(){return busy();},get hitPause(){return hitPause;}};
}




