import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=new URL('./graxinin-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1000});
  await page.evaluateOnNewDocument(()=>{
    window.requestAnimationFrame=callback=>{window.__frame=callback;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=brejo.renderer,render=renderer.render;try{for(let i=0;i<count;i++){renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame(window.__now);}}finally{renderer.render=render;}};
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  await page.evaluate(async()=>{window.facing=await import('/facing.js');window.animation=await import('/animation.js');});
  const native=await page.evaluate(()=>{
    const rig=brejo.rigs[2];let meshes=0,textures=0;
    for(const view of Object.values(rig.views))view.art.traverse(o=>{if(o.isMesh){meshes++;textures+=!!o.material.map;}});
    const c=brejo.battle.combat;brejo.state.selected=2;brejo.battle.render();
    return {id:rig.id,name:c.heroes[2].name,meshes,textures,roster:document.getElementById('roster').textContent};
  });
  assert.equal(native.id,'raccoon');assert.equal(native.name,'Graxinin');assert(native.meshes>50);assert.equal(native.textures,0);assert(!native.roster.includes('Bolota'));
  await page.evaluate(()=>{brejo.state.paused=false;step(.01);});
  await page.screenshot({path:fileURLToPath(new URL('no-jogo.png',output))});
  const results=[];
  for(const direction of ['right','left','down','up'])for(const special of [false,true])for(const speed of [.5,1,1.5]){
    const result=await page.evaluate(({direction,special,speed})=>{
      const {battle,rigs,state,boss}=brejo;battle.restart();state.paused=false;state.speed=speed;
      const c=battle.combat,actor=c.heroes[2],rig=rigs[2];c.cursor=c.order.indexOf(actor);c.resetTurnResources?.();if('points' in c)c.points=2;state.selected=2;
      const occupied=c.occupied(actor.id),target=boss.root.position;
      const cells=c.tiles.filter(cell=>!cell.blocked&&!occupied.has(`${cell.col},${cell.row}`)&&Math.min(...c.boss.cells.map(b=>Math.abs(b.col-cell.col)+Math.abs(b.row-cell.row)))<=3&&facing.directionFromDelta(target.x-cell.x,target.z-cell.z)===direction);
      const cell=cells[0];if(!cell)throw Error('Sem casa de teste para '+direction);
      actor.cell={...cell};rig.cell={...cell};rig.root.position.set(cell.x,.08,cell.z);battle.render();battle.attack(special);
      if(!battle.busy)throw Error('Ataque não começou');
      step(.35/speed);state.paused=true;const time=state.time,hp=c.boss.hp,mana=actor.mana;step(.2);const paused=state.time===time&&c.boss.hp===hp&&actor.mana===mana;state.paused=false;
      step(.5/speed);const before={hp:c.boss.hp,mana:actor.mana};step(.18/speed);const impact={hp:c.boss.hp,mana:actor.mana,bleeding:c.boss.bleeding?{...c.boss.bleeding}:null};step(.45/speed);
      return {direction,special,speed,paused,before,impact,finished:!battle.busy,poseDirection:rig.direction};
    },{direction,special,speed});
    assert(result.paused);assert.deepEqual(result.before,{hp:120,mana:10});assert.equal(result.impact.hp,special?108:112);assert.equal(result.impact.mana,special?4:10);assert.equal(result.impact.bleeding?.damage??0,special?3:0);assert(result.finished);assert.equal(result.poseDirection,direction);results.push(result);
  }
  const walking=await page.evaluate(()=>{
    const {battle,state,rigs}=brejo;battle.restart();const c=battle.combat,actor=c.heroes[2];c.cursor=c.order.indexOf(actor);c.resetTurnResources?.();state.selected=2;state.paused=false;state.speed=1;
    const destination=c.tiles.find(t=>c.canMove(t).ok&&c.pathTo(t).length>0);battle.move(destination);step(2.2);
    const arrived=rigs[2].root.position.distanceTo({x:destination.x,y:.08,z:destination.z})<.001;
    battle.restart();return {arrived,hp:actor.hp,mana:actor.mana,bleeding:c.boss.bleeding,name:actor.name};
  });
  assert(walking.arrived);assert.equal(walking.hp,24);assert.equal(walking.mana,10);assert.equal(walking.bleeding,null);
  await page.evaluate(()=>{const {battle,state,rigs}=brejo;battle.restart();const c=battle.combat;c.cursor=c.order.indexOf(c.heroes[2]);c.resetTurnResources?.();state.selected=2;facing.setDirection(rigs[2],'down');battle.render();state.paused=false;step(.01);});
  await page.screenshot({path:fileURLToPath(new URL('no-jogo.png',output))});
  assert.deepEqual(errors,[]);
  const report={passed:true,native,attackChecks:results.length,results,walking,errors};await writeFile(new URL('report.json',output),JSON.stringify(report,null,2));console.log({passed:true,native,attackChecks:results.length,walking,errors});
}finally{await browser.close();}
