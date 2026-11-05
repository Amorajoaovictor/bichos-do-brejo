import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=new URL('./lion-cub-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[];
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>{errors.push(error.message);console.error('Página:',error.message);});
  page.on('response',response=>{if(response.status()>=400){const message=`${response.status()} ${response.url()}`;errors.push(message);console.error(message);}});
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(()=>{
    const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,opts){return get.call(this,kind,kind.startsWith('webgl')?{...opts,preserveDrawingBuffer:true}:opts);};
    window.requestAnimationFrame=callback=>{window.__frame=callback;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*100),renderer=window.brejo?.renderer,render=renderer?.render;try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}finally{if(renderer)renderer.render=render;}};
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>window.brejo,{timeout:45000,polling:100});
  console.log('Jogo carregado.');
  const step=async seconds=>{await page.evaluate(t=>window.step(t),seconds);};
  const settle=()=>page.waitForNetworkIdle({idleTime:100,timeout:20000});
  const snap=()=>page.evaluate(()=>({turn:brejo.battle.combat.current.id,status:brejo.battle.combat.status,busy:brejo.battle.busy,enemies:brejo.battle.combat.enemies.map(e=>({id:e.id,hp:e.hp,kind:e.kind,cell:e.cell})),hp:brejo.battle.combat.heroes.map(h=>h.hp),cubs:brejo.lionCubs.map(r=>({id:r.id,pos:r.root.position.toArray(),direction:r.direction,frame:r.frameIndex,kind:r.frameKind,spawn:r.spawn?.elapsed,death:r.death?.elapsed,active:r.actionActive,moving:!!r.moving,opacity:r.parts.sprite.material.opacity}))}));
  const shot=filename=>page.screenshot({path:fileURLToPath(new URL(filename,output))});
  async function summon(){
    await page.click('#end-turn');await page.click('#end-turn');await step(.82);await settle();
    assert.equal((await snap()).turn,'rosnaldo');assert.equal((await snap()).busy,true);
    await step(.8);assert.equal((await snap()).cubs.length,0);
    await shot('preparacao.png');await step(.22);
    const summoned=await snap();assert.equal(summoned.cubs.length,2);assert.equal(summoned.enemies.length,3);
    assert.deepEqual(summoned.hp,[18,14,24]);assert.ok(summoned.cubs.every(c=>c.spawn>=0&&c.spawn<.1));
    return summoned;
  }
  await step(.02);assert.equal((await snap()).turn,'rat');assert.equal((await snap()).cubs.length,0);
  const initialBoss=await page.evaluate(()=>brejo.boss.root.position.toArray());
  const summoned=await summon();checks.push('invocation replaces damage and creates two actors at roar impact');
  const occupied=await page.evaluate(()=>{const c=brejo.battle.combat;return c.enemies.filter(e=>e.kind==='lion-cub').map(e=>({distance:c.distance(e,c.enemies[0]),blocked:c.tiles.find(t=>t.col===e.cell.col&&t.row===e.cell.row).blocked,overlap:c.actors.filter(a=>a.hp>0&&c.cellsOf(a).some(t=>t.col===e.cell.col&&t.row===e.cell.row)).length}));});
  assert.ok(occupied.every(c=>c.distance===1&&!c.blocked&&c.overlap===1));
  assert.equal(await page.$$eval('[data-unit^="lion-cub-"]',nodes=>nodes.length),2);
  await page.click('#pause');const frozen=await snap();await step(1.5);assert.deepEqual(await snap(),frozen);await page.click('#pause');
  checks.push('spawn pauses and occupies two distinct free adjacent cells');
  await step(.6);await shot('invocacao.png');await step(.3);await settle();
  assert.equal((await snap()).turn,'lion-cub-1');
  const first=summoned.enemies.find(e=>e.id==='lion-cub-1');
  await step(.84);assert.equal((await snap()).cubs[0].moving,true);await step(.18);await shot('caminhada.png');
  const mid=await snap();await page.click('#pause');await step(2);assert.deepEqual((await snap()).cubs[0].pos,mid.cubs[0].pos);await page.click('#pause');
  assert.notDeepEqual(mid.cubs[0].pos,[first.cell.x,.08,first.cell.z]);
  checks.push('mobile cub path and sprite freeze while paused');
  // Wait until the first cub actually begins its melee animation.
  let reached=false;
  for(let i=0;i<600;i++){
    const s=await snap();if(s.turn==='lion-cub-1'&&s.cubs[0].active){reached=true;break;}
    if(!s.busy&&['rat','rabbit','raccoon'].includes(s.turn))await page.click('#end-turn');
    await step(.05);if(s.turn==='rosnaldo'&&s.busy)await settle();
  }
  assert.ok(reached,'First cub must enter melee range across its legal movement turns and start biting.');
  const before=await snap();await step(.4);assert.deepEqual((await snap()).hp,before.hp);
  await step(.09);const contact=await snap();assert.equal(before.hp.reduce((a,b)=>a+b,0)-contact.hp.reduce((a,b)=>a+b,0),3);
  assert.equal(contact.cubs[0].frame,5);await shot('mordida.png');checks.push('bite contact pose and three damage share the same impact');
  await step(.5);await settle();await step(2.7);await settle();await step(2.7);
  assert.deepEqual(await page.evaluate(()=>brejo.boss.root.position.toArray()),initialBoss);
  // Reset must remove instance meshes, labels, occupancy and actors.
  await page.evaluate(()=>brejo.battle.restart());await step(.02);
  assert.equal((await snap()).cubs.length,0);assert.equal((await snap()).enemies.length,1);assert.equal((await snap()).turn,'rat');
  assert.equal(await page.$$eval('.enemy-label',nodes=>nodes.filter(n=>n.textContent==='Leãozinho').length),0);
  checks.push('restart removes summoned actors and visuals and restores boss');
  await summon();await page.evaluate(()=>brejo.battle.restart());await step(.03);
  assert.equal((await snap()).cubs.length,0);assert.equal((await snap()).busy,false);
  checks.push('restart during invocation cancels pending creation');
  await summon();await step(1);await settle();await step(4);await settle();await step(4);await settle();
  // Arrange one legal in-range attack to test the actual on-screen cub target.
  await page.evaluate(()=>{
    const c=brejo.battle.combat,b=brejo.battle;
    if(b.busy)throw new Error('Wait for the current animation before arranging target test.');
    let turns=0;while(c.current.id!=='rat'&&turns++<c.order.length)c.advance();
    const cub=c.enemies.find(e=>e.kind==='lion-cub'),occupied=c.occupied('rat');
    const tile=c.tiles.find(t=>!t.blocked&&!occupied.has(`${t.col},${t.row}`)&&Math.abs(t.col-cub.cell.col)+Math.abs(t.row-cub.cell.row)<=3);
    if(!tile)throw new Error('No legal test position.');c.current.cell={...tile};brejo.rigs[1].cell={...tile};brejo.rigs[1].root.position.set(tile.x,.08,tile.z);
    c.attacksRemaining=1;c.current.mana=10;brejo.state.selected=1;b.render();
  });
  await step(.02);await page.click('#attack');
  const point=await page.evaluate(()=>{const p=brejo.lionCubs[0].root.position.clone();p.y=.45;p.project(brejo.camera);const r=document.getElementById('viewport').getBoundingClientRect();return {x:r.x+(p.x*.5+.5)*r.width,y:r.y+(-p.y*.5+.5)*r.height};});
  await page.mouse.click(point.x,point.y);assert.equal((await snap()).busy,true);await step(.4);assert.equal((await snap()).enemies[1].hp,10);await step(.85);
  assert.equal((await snap()).enemies[1].hp,3);assert.equal((await snap()).enemies[2].hp,10);
  checks.push('on-screen target click damages only chosen cub at projectile impact');
  await page.click('#special-attack');await page.mouse.click(point.x,point.y);await step(1.3);assert.equal((await snap()).enemies[1].hp,0);await step(1.1);
  const corpse=await snap();assert.ok(corpse.cubs[0].death>=1.05);assert.equal(corpse.cubs[0].frame,8);assert.equal(corpse.status,'playing');
  await shot('derrota-filhotinho.png');await step(.8);assert.equal((await snap()).cubs[0].frame,8);
  checks.push('final death pose persists and remaining enemies keep battle active');
  // Initiative fits the mobile screen with the new summons.
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});await step(.02);
  const bounds=await page.$eval('#roster',e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right};});
  assert.ok(bounds.left>=0&&bounds.right<=390,JSON.stringify(bounds));await shot('tela-390.png');checks.push('summon queue fits narrow screen');
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4173/art/leaozinho/png-v1/index.html',{waitUntil:'networkidle0'});
  assert.equal(await page.$$eval('[data-view]',nodes=>nodes.length),4);await page.click('#play');
  await shot('visualizador.png');checks.push('four-direction viewer loads with pause and frame inspection');
  assert.deepEqual(errors,[]);
  await writeFile(new URL('verificacao.json',output),JSON.stringify({passed:true,errors,checks},null,2));console.log(JSON.stringify({passed:true,checks},null,2));
}finally{await browser.close();}
