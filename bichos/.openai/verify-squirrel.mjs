import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const output=new URL('./squirrel-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage(),errors=[];
  if(process.argv.includes('--local-files')){
    const mime={html:'text/html',js:'text/javascript',css:'text/css',png:'image/png',svg:'image/svg+xml',json:'application/json'};
    await page.setRequestInterception(true);
    page.on('request',async request=>{
      const {origin,pathname}=new URL(request.url());
      if(origin!=='http://127.0.0.1:4173'){await request.abort();return;}
      const file=pathname==='/'?'dist/index.html':pathname.startsWith('/art/')?pathname.slice(1):`dist${pathname}`;
      try{await request.respond({contentType:mime[file.split('.').at(-1)],body:await readFile(new URL(`../${file}`,import.meta.url))});}
      catch{await request.respond({status:404});}
    });
  }
  page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(()=>{
    const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,opts){return get.call(this,kind,kind.startsWith('webgl')?{...opts,preserveDrawingBuffer:true}:opts);};
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*100),renderer=window.brejo?.renderer,render=renderer?.render;try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}finally{if(renderer)renderer.render=render;}};
  });
  await page.goto('http://127.0.0.1:4173/?encontro=esquilos',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo,{timeout:90000});
  const step=t=>page.evaluate(t=>window.step(t),t);
  const snapshot=()=>page.evaluate(()=>({stage:brejo.battle.encounterIndex,turn:brejo.battle.combat.current.id,enemies:brejo.battle.combat.enemies.map(e=>({id:e.id,hp:e.hp,cell:{col:e.cell?.col,row:e.cell?.row}})),busy:brejo.battle.busy,status:brejo.battle.combat.status}));
  await step(.02);let s=await snapshot();assert.equal(s.stage,0);assert.equal(s.enemies.length,3);assert.equal(s.turn,'rat');assert.ok(s.enemies.every(e=>e.hp===12));
  assert.equal(await page.evaluate(()=>brejo.boss.root.visible),false);
  await page.screenshot({path:fileURLToPath(new URL('encontro.png',output))});
  // Observe a real enemy turn: movement changes rendered position only as time advances.
  await page.click('#end-turn');await page.click('#end-turn');await step(.85);
  assert.equal((await snapshot()).turn,'squirrel-1');assert.equal((await snapshot()).busy,true);
  const moving=await page.evaluate(()=>({pos:brejo.squirrels[0].root.position.toArray(),progress:brejo.squirrels[0].moving?.progress,cell:brejo.battle.combat.current.cell}));
  await page.click('#pause');await step(2);assert.deepEqual(await page.evaluate(()=>brejo.squirrels[0].root.position.toArray()),moving.pos);await page.click('#pause');
  await step(.25);await page.screenshot({path:fileURLToPath(new URL('corrida.png',output))});
  const log=()=>page.$eval('#battle-log',node=>node.textContent);
  for(let i=0;i<40&&!(await log()).includes('se atrapalha com a noz');i++)await step(.04);
  assert.match(await log(),/se atrapalha com a noz/);
  const throwPlan=await page.evaluate(()=>{
    const c=brejo.battle.combat,[target]=c.planEnemyAttack().targets,pickup=c.squirrelPickup(target);
    return {hp:target.hp,target:target.id,landing:[pickup.cell.x,.16,pickup.cell.z]};
  });
  const acorn=()=>page.evaluate(()=>{const shot=brejo.scene.getObjectByName('Noz da Nozada');return shot&&{pos:shot.position.toArray(),visible:shot.visible};});
  const hp=()=>page.evaluate(id=>brejo.battle.combat.heroes.find(h=>h.id===id).hp,throwPlan.target);
  await step(.61);assert.equal(await hp(),throwPlan.hp);assert.equal((await acorn()).visible,true);
  const airborne=await acorn();await page.click('#pause');await step(.4);assert.deepEqual(await acorn(),airborne);await page.click('#pause');
  await step(.23);assert.equal(await hp(),throwPlan.hp-3);assert.notDeepEqual((await acorn()).pos,throwPlan.landing);
  await page.screenshot({path:fileURLToPath(new URL('nozada.png',output))});
  await step(.56);assert.match(await log(),/buscar a noz/);
  assert.ok((await acorn()).pos.every((n,i)=>Math.abs(n-throwPlan.landing[i])<.01));
  for(let i=0;i<45&&!(await log()).includes('levou um susto');i++)await step(.04);
  assert.match(await log(),/levou um susto/);assert.equal((await acorn()).visible,false);
  const startled=await snapshot();assert.equal(startled.turn,'squirrel-1');assert.ok(startled.busy);
  for(let i=0;i<50&&(await snapshot()).turn==='squirrel-1';i++)await step(.04);
  assert.notEqual((await snapshot()).turn,'squirrel-1');assert.equal(await acorn(),undefined);
  assert.equal(await hp(),throwPlan.hp-3);
  assert.equal(await page.evaluate(()=>{const c=brejo.battle.combat,[squirrel]=c.enemies;return Math.min(...c.heroes.filter(h=>h.hp>0).map(h=>c.distance(squirrel,h)));}),3);
  // Capture the same live action for the shareable preview.
  if(process.argv.includes('--preview')){
    const {default:sharp}=await import('file:///C:/Users/user/node_modules/sharp/lib/index.js');
    const art=new URL('../art/esquilo/nozada-v2/',import.meta.url);await mkdir(art,{recursive:true});
    await page.evaluate(()=>brejo.battle.restart());await step(.02);
    await page.click('#end-turn');await page.click('#end-turn');
    for(let i=0;i<75&&!(await log()).includes('se atrapalha com a noz');i++)await step(.04);
    assert.match(await log(),/se atrapalha com a noz/);
    const clip={x:535,y:295,width:425,height:410,scale:1},accident=[],scare=[];
    const cdp=await page.createCDPSession();let frames=accident,sawProjectedEyes=false;
    for(let i=0;i<70;i++){
      const {data}=await cdp.send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:false});
      const frame=await sharp(Buffer.from(data,'base64')).ensureAlpha().raw().toBuffer();
      frames.push(frame);
      if(frames===accident&&(await log()).includes('encara')){scare.push(frame);frames=scare;}
      if(!sawProjectedEyes)sawProjectedEyes=await page.evaluate(()=>brejo.squirrels[0].art.getObjectByName('Olhos projetados').visible);
      if((await snapshot()).turn!=='squirrel-1')break;
      await step(.08);
    }
    assert.notEqual((await snapshot()).turn,'squirrel-1');
    assert.ok(accident.length>1&&scare.length>1);assert.ok(sawProjectedEyes,'The captured scare must show the projected eyes');
    for(const [file,clipFrames] of [['noz-escapou.gif',accident],['susto-e-fuga.gif',scare]]){
      const {width,height}=clip,delay=clipFrames.map((_,i)=>i===0?330:i===clipFrames.length-1?700:80);
      await sharp(Buffer.concat(clipFrames),{raw:{width,height:height*clipFrames.length,pageHeight:height,channels:4}}).gif({loop:0,delay}).toFile(fileURLToPath(new URL(file,art)));
    }
  }
  // Reset during an enemy action restores all spawn cells and resources.
  await page.evaluate(()=>brejo.battle.restart());await step(.02);assert.deepEqual((await snapshot()).enemies,s.enemies);assert.equal((await snapshot()).busy,false);
  // Lethal bleeding must still animate the skipped enemy while the others live.
  await page.evaluate(()=>{const enemy=brejo.battle.combat.enemies[0];enemy.hp=3;enemy.bleeding={damage:3,turns:3,source:'rat'};});
  await page.click('#end-turn');await page.click('#end-turn');await step(.02);
  assert.equal((await snapshot()).turn,'squirrel-2');assert.equal((await snapshot()).status,'playing');
  assert.ok(await page.evaluate(()=>brejo.squirrels[0].death));await step(1.2);
  assert.ok(await page.evaluate(()=>brejo.squirrels[0].death.elapsed>=1.05&&brejo.squirrels[0].root.visible));
  await page.evaluate(()=>brejo.battle.restart());await step(.02);
  // Hit a chosen enemy through the actual on-screen target, not the selected default.
  await page.evaluate(()=>{const c=brejo.battle.combat;c.current.cell={...c.tiles.find(t=>t.col===4&&t.row===3)};brejo.rigs[1].root.position.set(c.current.cell.x,.08,c.current.cell.z);brejo.battle.render();});
  await page.click('#attack');
  const point=await page.evaluate(()=>{const p=brejo.squirrels[1].root.position.clone();p.y=.5;p.project(brejo.camera);const r=document.getElementById('viewport').getBoundingClientRect();return {x:r.x+(p.x*.5+.5)*r.width,y:r.y+(-p.y*.5+.5)*r.height};});
  await page.mouse.click(point.x,point.y);assert.equal((await snapshot()).busy,true);await step(.25);assert.equal((await snapshot()).enemies[1].hp,12);await step(1.1);assert.equal((await snapshot()).enemies[1].hp,5);assert.equal((await snapshot()).enemies[0].hp,12);
  // Win the complete preliminary encounter with legal actions and enemy turns.
  await page.evaluate(()=>brejo.battle.restart());let actions=0;
  while((await snapshot()).status==='playing'&&actions++<140){
    if((await snapshot()).busy){await step(3);continue;}
    const decision=await page.evaluate(()=>{
      const b=brejo.battle,c=b.combat;if(!c.playerTurn)return 'wait';
      const target=c.enemies.find(e=>c.canAttack(false,e).ok);if(target){b.attack(false,target);return 'attack';}
      const special=c.enemies.find(e=>c.canAttack(true,e).ok);if(special){b.attack(true,special);return 'special';}
      const choices=c.tiles.map(cell=>({cell,r:c.canMove(cell)})).filter(x=>x.r.ok&&x.r.path.length).sort((a,b)=>Math.min(...c.enemies.filter(e=>e.hp>0).map(e=>c.distance({cell:a.cell},e)))-Math.min(...c.enemies.filter(e=>e.hp>0).map(e=>c.distance({cell:b.cell},e))));
      if(choices.length){b.move(choices[0].cell);return 'move';}document.getElementById('end-turn').click();return 'pass';
    });await step(decision==='wait'?3:2.6);
  }
  await step(2);s=await snapshot();assert.equal(s.status,'victory',JSON.stringify(s));assert.equal(await page.$eval('#next-encounter',e=>e.hidden),false);
  await page.screenshot({path:fileURLToPath(new URL('vitoria.png',output))});await page.click('#next-encounter');await step(.1);
  s=await snapshot();assert.equal(s.stage,1);assert.equal(s.enemies.length,1);assert.equal(s.enemies[0].hp,120);assert.equal(s.turn,'rat');
  assert.equal(await page.evaluate(()=>brejo.boss.root.visible),true);assert.ok(await page.evaluate(()=>brejo.squirrels.every(r=>!r.root.visible)));assert.ok(await page.evaluate(()=>brejo.battle.combat.heroes.every(h=>h.hp===h.maxHp&&h.mana===10)));
  await page.screenshot({path:fileURLToPath(new URL('rosnaldo.png',output))});
  // Responsive HUD: controls and queue stay inside the viewport.
  await page.goto('http://127.0.0.1:4173/?encontro=esquilos',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  for(const [width,height] of [[900,800],[390,844]]){await page.setViewport({width,height,deviceScaleFactor:1});await step(.02);const bounds=await page.evaluate(()=>['roster','move','attack','special-attack','end-turn'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));for(const r of bounds)assert.ok(r.left>=0&&r.right<=width&&r.top>=0&&r.bottom<=height,JSON.stringify(r));await page.screenshot({path:fileURLToPath(new URL(`tela-${width}.png`,output))});}
  assert.deepEqual(errors,[]);
  await writeFile(new URL('verificacao.json',output),JSON.stringify({passed:true,errors,actions,checks:['enemy movement and facing','paused movement and projectile','damage only at impact','acorn rebound, landing and pickup','scare and retreat to maximum range','restart during enemy turn','explicit target selection','complete squirrel victory','transition to Rosnaldo','responsive HUD']},null,2));console.log('Esquilos: fluxo completo verificado.');
}finally{await browser.close();}

