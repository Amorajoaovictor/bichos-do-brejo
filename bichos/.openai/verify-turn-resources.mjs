import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const output=new URL('./turn-resources-review/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.evaluateOnNewDocument(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,options){return getContext.call(this,kind,kind.startsWith('webgl')?{...options,preserveDrawingBuffer:true}:options);};
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{
      window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=window.brejo?.renderer,render=renderer?.render;
      try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}
      finally{if(renderer)renderer.render=render;}
    };
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>window.brejo);
  const step=t=>page.evaluate(t=>window.step(t),t);
  const click=async selector=>{await page.click(selector);await step(.001);};
  const stats=()=>page.evaluate(()=>{
    const b=brejo.battle,c=b.combat;
    return {id:c.current.id,hp:c.boss.hp,mana:c.current.mana,moves:c.movesRemaining,attacks:c.attacksRemaining,busy:b.busy,mode:b.actionMode,attackDisabled:document.getElementById('attack').disabled,moveDisabled:document.getElementById('move').disabled,specialDisabled:document.getElementById('special-attack').disabled};
  });
  const highlights=()=>page.evaluate(()=>brejo.scene.children.filter(m=>m.isMesh&&m.geometry.type==='PlaneGeometry'&&Math.abs(m.position.y-.021)<.00001&&m.visible).map(m=>({x:m.position.x,z:m.position.z,color:m.material.color.getHexString()})));
  const point=async cell=>page.evaluate(cell=>{
    const b=brejo,c=cell.boss?b.boss.root.position.clone():b.rigs[1].root.position.clone();
    if(!cell.boss){const t=b.battle.combat.tiles.find(t=>t.col===cell.col&&t.row===cell.row);c.set(t.x,.025,t.z);}else c.y=.01;
    c.project(b.camera);const r=document.getElementById('viewport').getBoundingClientRect();return {x:r.left+(c.x*.5+.5)*r.width,y:r.top+(-c.y*.5+.5)*r.height};
  },cell);
  const fieldClick=async cell=>{const p=await point(cell);await page.mouse.click(p.x,p.y);await step(.001);};
  await step(.02);
  assert.equal((await stats()).id,'rat');assert.equal((await highlights()).length,0);
  assert.equal(await page.$('#mutation-panel'),null);await page.keyboard.press('m');assert.equal((await stats()).attacks,1);
  await click('#move');assert.equal((await stats()).mode,'move');assert.ok((await highlights()).length>0);
  const expected=await page.evaluate(()=>brejo.battle.combat.tiles.filter(t=>{const r=brejo.battle.combat.canMove(t);return r.ok&&r.path.length;}).map(t=>({x:t.x,z:t.z})).sort((a,b)=>a.x-b.x||a.z-b.z));
  assert.deepEqual((await highlights()).map(({x,z})=>({x,z})).sort((a,b)=>a.x-b.x||a.z-b.z),expected);
  await page.screenshot({path:new URL('movement.png',output).pathname.slice(1)});
  await page.keyboard.press('Escape');assert.equal((await highlights()).length,0);
  await click('#attack');assert.equal((await stats()).hp,120);assert.equal((await stats()).busy,false);
  assert.ok((await highlights()).every(m=>m.color==='e27c65'));
  await page.screenshot({path:new URL('attack.png',output).pathname.slice(1)});
  await fieldClick({boss:true});assert.equal((await stats()).busy,true);assert.equal((await stats()).hp,120);
  await step(.2);assert.equal((await stats()).hp,120);
  await click('#pause');const frozen=await stats();await step(2);assert.deepEqual(await stats(),frozen);await click('#pause');
  await step(1.5);let s=await stats();assert.equal(s.hp,113);assert.equal(s.attacks,0);assert.equal(s.moves,1);assert.equal(s.id,'rat');assert.equal(s.attackDisabled,true);
  await click('#move');await fieldClick({col:6,row:3});assert.equal((await stats()).busy,true);await step(2);
  s=await stats();assert.equal(s.moves,0);assert.equal(s.attacks,0);assert.equal(s.id,'rat');assert.equal(s.specialDisabled,false);
  for(let i=0;i<2;i++){
    await click('#special-attack');assert.equal((await stats()).mode,'special');assert.ok((await highlights()).every(m=>m.color==='64c6e4'));
    await fieldClick({boss:true});await step(1.5);
  }
  s=await stats();assert.equal(s.mana,0);assert.equal(s.hp,105);assert.equal(s.id,'rat');assert.equal(s.specialDisabled,true);
  await click('#end-turn');assert.equal((await stats()).id,'rabbit');assert.equal((await stats()).attacks,1);assert.equal((await stats()).moves,1);
  // A melee character must still be able to preview an out-of-range attack.
  assert.equal(await page.evaluate(()=>brejo.battle.combat.canAttack().ok),false);assert.equal((await stats()).attackDisabled,false);
  await click('#attack');assert.equal((await stats()).mode,'attack');await fieldClick({boss:true});assert.equal((await stats()).busy,false);assert.equal((await stats()).attacks,1);
  await page.keyboard.press('Escape');
  // Restart clears targeting, resources, mana, bleeding and any running action.
  await page.evaluate(()=>brejo.battle.restart());await step(.02);s=await stats();assert.equal(s.hp,120);assert.equal(s.mana,10);assert.equal(s.moves,1);assert.equal(s.attacks,1);assert.equal(s.mode,null);
  assert.equal(await page.evaluate(()=>brejo.battle.combat.boss.bleeding),null);
  // Class allowances must also reach the visible buttons and counters.
  await page.evaluate(()=>{const c=brejo.battle.combat;c.current.movesPerTurn=2;c.current.attacksPerTurn=2;c.resetTurnResources();brejo.battle.render();});
  assert.match(await page.$eval('#action-points',e=>e.textContent),/MOV 2\/2.*ATQ 2\/2/);
  await page.evaluate(()=>{const c=brejo.battle.combat;c.current.movesPerTurn=1;c.current.attacksPerTurn=1;brejo.battle.restart();});
  await page.evaluate(()=>document.getElementById('toast').classList.remove('visible'));
  for(const [width,height] of [[1440,1000],[900,800],[390,844]]){
    await page.setViewport({width,height,deviceScaleFactor:1});await step(.02);await click('#move');await step(.02);
    const bounds=await page.evaluate(()=>['move','attack','special-attack','end-turn'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
    for(const r of bounds){assert.ok(r.left>=0&&r.right<=width&&r.top>=0&&r.bottom<=height,JSON.stringify(r));}
    await page.screenshot({path:new URL(`layout-${width}.png`,output).pathname.slice(1)});await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ok:true,checks:['movement and range previews','target click confirmation','impact timing and pause','independent attack and movement','two skills after exhausting both resources','mana lock','manual end turn','out-of-range preview','restart','class allowances','desktop and mobile layouts'],screenshots:output.pathname}));
}finally{await browser.close();}
