import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output=new URL('./environment-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(()=>{
    const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,options){return original.call(this,kind,kind.startsWith('webgl')?{...options,preserveDrawingBuffer:true}:options);};
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=window.brejo?.renderer,render=renderer?.render;try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}finally{if(renderer)renderer.render=render;}};
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  const step=t=>page.evaluate(t=>window.step(t),t);
  const snap=async name=>page.screenshot({path:fileURLToPath(new URL(name+'.png',output))});
  const stats=()=>page.evaluate(()=>{const c=brejo.battle.combat;return {hp:c.boss.hp,bonus:c.bonusRemaining,moves:c.movesRemaining,attacks:c.attacksRemaining,mana:c.current.mana,carried:c.current.carried?.kind,busy:brejo.battle.busy,mode:brejo.battle.actionMode,used:c.props.filter(p=>p.used).map(p=>p.id)};});
  const point=cell=>page.evaluate(cell=>{const v=cell.prop?brejo.environment.views.get(cell.prop).root.position.clone():brejo.rigs[0].root.position.clone();if(!cell.prop){const t=brejo.battle.combat.tiles.find(t=>t.col===cell.col&&t.row===cell.row);v.set(t.x,.025,t.z);}else v.y+=.24;v.project(brejo.camera);const r=document.getElementById('viewport').getBoundingClientRect();return {x:r.left+(v.x*.5+.5)*r.width,y:r.top+(-v.y*.5+.5)*r.height};},cell);
  const clickCell=async cell=>{const p=await point(cell);await page.mouse.click(p.x,p.y);await step(.01);};
  await step(.02);await snap('tabuleiro');
  await page.click('#interact');await clickCell({prop:'pedra-1'});assert.equal((await stats()).mode,'interact');assert.equal((await stats()).bonus,1);assert.equal((await stats()).used.length,0);await snap('pedra-alcance');
  await page.keyboard.press('Escape');assert.equal((await stats()).used.length,0);
  // Move to put the selected boss in range; use the real movement animation.
  await page.evaluate(()=>brejo.battle.move(brejo.battle.combat.tiles.find(t=>t.col===5&&t.row===3)));await step(2);
  await page.click('#interact');await clickCell({prop:'pedra-1'});await clickCell({col:4,row:3});assert.equal((await stats()).busy,true);assert.equal((await stats()).hp,120);assert.equal((await stats()).bonus,0);
  await step(.3);await snap('pedra-preparacao');await page.click('#pause');const frozen=await stats();await step(2);assert.deepEqual(await stats(),frozen);await page.click('#pause');await step(.3);await snap('pedra-em-voo');await step(.8);
  assert.equal((await stats()).hp,116);assert.equal((await stats()).attacks,1);assert.equal((await stats()).mana,10);assert.equal((await stats()).busy,false);
  // Restart during an interaction restores the exact original props and resources.
  await page.evaluate(()=>brejo.battle.restart());await step(.02);assert.equal((await stats()).used.length,0);
  // Stand below the lower log to send it through both rows of the 2 × 2 boss.
  await page.evaluate(()=>{const b=brejo,c=b.battle.combat;c.advance();b.state.selected=0;const t=c.tiles.find(t=>t.col===3&&t.row===6);c.current.cell={...t};b.rigs[0].cell={...t};b.rigs[0].root.position.set(t.x,.08,t.z);b.battle.render();});await step(.02);
  await page.click('#interact');await clickCell({prop:'tronco-2'});await snap('tronco-trajetoria');await clickCell({col:3,row:4});assert.equal((await stats()).busy,true);assert.equal((await stats()).hp,120);
  for(let i=0;i<14;i++){await step(.08);await snap(`tronco-${String(i).padStart(2,'0')}`);}await step(.5);await snap('tronco-14');assert.equal((await stats()).hp,112);assert.equal((await stats()).moves,1);assert.equal((await stats()).attacks,1);
  // Restart mid-roll also clears its logical lock and restores the rendered prop.
  await page.evaluate(()=>brejo.battle.restart());await step(.02);
  await page.evaluate(()=>{const c=brejo.battle.combat;while(c.current.id!=='raccoon')c.advance();brejo.state.selected=2;brejo.battle.render();});await step(.02);await snap('graxinin-lata');
  await page.click('#attack');await clickCell({col:4,row:3});await step(1.4);assert.equal((await stats()).carried,undefined);assert.equal((await stats()).attacks,0);assert.equal(await page.$eval('#attack',e=>e.disabled),true);
  await page.click('#interact');await clickCell({prop:'pedra-2'});assert.equal((await stats()).bonus,1);await page.click('#interact');await step(.5);assert.equal((await stats()).carried,undefined);await step(.5);assert.equal((await stats()).carried,'rock');assert.equal((await stats()).bonus,0);assert.equal((await stats()).attacks,0);await snap('graxinin-pedra');assert.equal(await page.evaluate(()=>brejo.environment.heldRock.visible),true);assert.equal(await page.evaluate(()=>brejo.rigs[2].parts.can.visible),false);
  await page.evaluate(()=>{const c=brejo.battle.combat;c.advance();while(c.current.id!=='raccoon')c.advance();brejo.state.selected=2;brejo.battle.render();});await step(.02);await page.click('#attack');await clickCell({col:4,row:3});await step(.65);await snap('graxinin-arremesso');await step(.9);assert.equal((await stats()).carried,undefined);assert.equal((await stats()).hp,104);
  await page.evaluate(()=>brejo.battle.restart());await step(.02);
  for(const [width,height] of [[1440,1000],[900,800],[390,844]]){
    await page.setViewport({width,height,deviceScaleFactor:1});await step(.02);const bounds=await page.evaluate(()=>['move','attack','special-attack','interact','end-turn'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));for(const r of bounds)assert.ok(r.left>=0&&r.right<=width&&r.top>=0&&r.bottom<=height,JSON.stringify(r));await snap(`layout-${width}`);
  }
  // Speed scales the same impact event, and restarting mid-roll clears its lock.
  for(const speed of [.5,1,1.5]){
    await page.evaluate(speed=>{brejo.battle.restart();brejo.state.speed=speed;const c=brejo.battle.combat,t=c.tiles.find(t=>t.col===5&&t.row===3);c.current.cell={...t};brejo.rigs[1].cell={...t};brejo.rigs[1].root.position.set(t.x,.08,t.z);brejo.battle.interact('pedra-1',c.boss);},speed);
    await step(.7/speed);assert.equal((await stats()).hp,120);await step(.2/speed);assert.equal((await stats()).hp,116);await step(.4/speed);
  }
  await page.evaluate(()=>{brejo.battle.restart();brejo.state.speed=1;const c=brejo.battle.combat;c.advance();const t=c.tiles.find(t=>t.col===3&&t.row===6);c.current.cell={...t};brejo.rigs[0].root.position.set(t.x,.08,t.z);brejo.battle.interact('tronco-2');});await step(.5);assert.equal((await stats()).busy,true);await page.evaluate(()=>brejo.battle.restart());await step(.02);assert.equal((await stats()).busy,false);assert.equal((await stats()).used.length,0);assert.equal(await page.evaluate(()=>brejo.battle.combat.environmentAction),null);assert.equal(await page.evaluate(()=>brejo.environment.views.get('tronco-2').root.visible),true);
  // Also load the default mixed encounter and finish it through both scenes.
  await page.setViewport({width:1440,height:1000});await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);await step(.02);assert.equal(await page.evaluate(()=>brejo.battle.combat.props.length),6);await snap('encontro-inicial');
  await page.evaluate(()=>{const c=brejo.battle.combat;c.enemies.forEach(e=>e.hp=0);c.checkOutcome();brejo.battle.render();});await page.click('#next-encounter');await step(.02);assert.equal(await page.evaluate(()=>brejo.battle.encounterIndex),1);assert.equal((await stats()).used.length,0);assert.equal(await page.evaluate(()=>brejo.battle.combat.heroes[2].carried.kind),'can');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  const report={ok:true,checks:['real clicks and cancellation','independent bonus','impact timing and pause','single hit on large footprint','Graxinin ammo and pickup','PNG stone throw and visible carried item','three speeds','mid-roll restart','restart and next encounter','three viewport sizes','no page errors or missing assets'],errors,missing};await writeFile(new URL('report.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
