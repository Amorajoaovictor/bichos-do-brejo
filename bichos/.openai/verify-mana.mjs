import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const output=new URL('./mana-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  if(process.argv.includes('--layout')){
    for(const width of [768,390]){
      await page.setViewport({width,height:800,deviceScaleFactor:1});await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
      await new Promise(r=>setTimeout(r,500));await page.screenshot({path:new URL(`live-${width}.png`,output).pathname.slice(1)});
      console.log(JSON.stringify(await page.evaluate(()=>({width:innerWidth,draws:brejo.renderer.info.render.calls,triangles:brejo.renderer.info.render.triangles,lost:brejo.renderer.getContext().isContextLost()}))));
    }
    await browser.close();process.exit(0);
  }
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
  await page.evaluateOnNewDocument(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,options){return getContext.call(this,kind,kind.startsWith('webgl')?{...options,preserveDrawingBuffer:true}:options);};
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=window.brejo?.renderer,render=renderer?.render;
      try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}
      finally{if(renderer)renderer.render=render;}
    };
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  const step=t=>page.evaluate(t=>window.step(t),t);
  const click=selector=>page.evaluate(s=>document.querySelector(s).click(),selector);
  const get=()=>page.evaluate(()=>{const c=brejo.battle.combat;return {hp:c.boss.hp,mana:c.current.mana,points:c.points,id:c.current.id,busy:brejo.battle.busy,status:c.status,bleed:c.boss.bleeding?.turns??0,bar:document.getElementById('mana-bar').getAttribute('aria-valuenow')};});
  const capture=async name=>{await page.evaluate(async()=>{await new Promise(r=>setTimeout(r,80));brejo.renderer.render(brejo.scene,brejo.camera);});return page.screenshot({path:new URL(name+'.png',output).pathname.slice(1)});};
  const expression=index=>page.evaluate(i=>brejo.rigs[i].expression,index);
  await page.evaluate(()=>brejo.state.paused=false);await step(.016);
  assert.equal((await get()).bar,'10');await capture('mana-hud');
  await page.keyboard.press('q');assert.equal(await expression(1),'anger');await step(.3);assert.equal((await get()).hp,120);await capture('rat-angry');
  await step(.65);assert.equal((await get()).hp,116);assert.equal((await get()).mana,5);assert.equal((await get()).bleed,3);
  await step(.5);assert.equal(await expression(1),'neutral');await capture('bleeding-applied');
  await click('#attack');await step(1.6);assert.equal((await get()).id,'rabbit');assert.equal((await get()).hp,109);
  await page.evaluate(()=>{let i=0;brejo.battle.combat.random=()=>i++%2===0?0:.99;});
  await click('#special-attack');assert.equal(await expression(0),'panic');assert.equal((await get()).mana,2);assert.equal((await get()).hp,109);
  await step(.7);assert.equal((await get()).hp,109);await capture('rabbit-projectiles');
  await step(.4);assert.ok((await get()).hp<109);await capture('rabbit-critical');
  await click('#pause');const paused=await get();await step(2);assert.deepEqual(await get(),paused);await click('#pause');
  await step(2);assert.equal(await expression(0),'relief');await capture('rabbit-relief');
  await click('#pause');await step(2);assert.equal(await expression(0),'relief');await click('#pause');
  await step(1);assert.equal((await get()).hp,94);assert.equal((await get()).points,1);assert.equal((await get()).busy,false);assert.equal((await get()).mana,2);
  assert.equal(await page.$eval('#special-attack',el=>el.disabled),true);
  await page.keyboard.press('q');await step(.1);assert.equal((await get()).hp,94);
  await click('#end-turn');assert.equal((await get()).hp,91);assert.equal((await get()).bleed,2);
  await step(3);assert.equal((await get()).id,'frog');
  await page.evaluate(()=>{const c=brejo.battle.combat;brejo.battle.move(c.tiles.find(t=>t.col===4&&t.row===4));});await step(2);
  await click('#special-attack');assert.equal(await expression(2),'relief');await step(.7);await capture('frog-urine');await step(1.3);
  assert.equal((await get()).id,'rat');assert.equal((await get()).mana,8);assert.equal((await get()).hp,79);
  await page.evaluate(()=>brejo.battle.restart());await click('#end-turn');await click('#special-attack');await step(.9);
  await page.evaluate(()=>brejo.battle.restart());await step(.016);assert.equal((await get()).hp,120);assert.equal((await get()).bleed,0);
  assert.equal(await page.evaluate(()=>brejo.rigs.every(r=>r.expression==='neutral'&&r.emotionLeft===0)),true);
  assert.equal(await page.evaluate(()=>brejo.battle.combat.heroes.every(h=>h.mana===10)&&!brejo.battle.combat.barrage),true);
  await page.evaluate(()=>brejo.battle.combat.boss.hp=6);await click('#special-attack');await step(1.5);await click('#end-turn');await click('#end-turn');await step(.7);
  assert.equal((await get()).status,'victory');assert.equal((await get()).hp,0);assert.equal(await page.$eval('#outcome',el=>el.hidden),false);
  await click('#restart');await step(.016);
  for(const [width,height] of [[768,700],[390,844],[320,640]]){
    await page.setViewport({width,height,deviceScaleFactor:1});await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);await step(.016);await capture(`hud-${width}`);
    const boxes=await page.evaluate(()=>['mana-bar','attack','special-attack','end-turn'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
    for(const box of boxes){assert.ok(box.x>=0&&box.y>=0&&box.right<=width&&box.bottom<=height,JSON.stringify(box));}
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks:['mana HUD','keyboard controls','bleed at turn start','10 sequential independent critical hits','panic then relief','relaxed frog','angry rat then neutral','pause including expressions','insufficient mana','regeneration','urine','restart mid-barrage','bleed victory','responsive HUD'],browserErrors:errors,output:output.pathname}));
}finally{await browser.close();}
