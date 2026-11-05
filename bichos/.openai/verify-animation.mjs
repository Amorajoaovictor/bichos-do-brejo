import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const output=new URL('./animation-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>{
    window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
    window.step=seconds=>{window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=window.brejo?.renderer,render=renderer?.render;
      try{for(let i=0;i<count;i++){if(renderer)renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame?.(window.__now);}}
      finally{if(renderer)renderer.render=render;}
    };
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  await page.evaluate(()=>{brejo.state.paused=false;window.step(.016);});
  async function click(selector){await page.evaluate(selector=>document.querySelector(selector).click(),selector);}
  const frames=[];
  async function capture(name,actor=1){
    const clip=await page.evaluate(actor=>{
      const {rigs,boss,camera}=brejo,rig=actor===3?boss:rigs[actor],pos=rig.root.position.clone().project(camera),v=document.getElementById('viewport').getBoundingClientRect();
      const x=v.x+(pos.x*.5+.5)*v.width,y=v.y+(-pos.y*.5+.5)*v.height;
      return {x:Math.max(0,x-150),y:Math.max(0,y-(actor===3?280:200)),width:300,height:300};
    },actor);
    await page.screenshot({path:new URL(name+'.png',output).pathname.slice(1),clip});frames.push({name,actor});
  }
  async function step(t){await page.evaluate(t=>window.step(t),t);}
  await page.screenshot({path:new URL('arena.png',output).pathname.slice(1)});
  await capture('rat-idle');await click('#attack');await step(.29);await capture('rat-windup');await step(.22);await capture('rat-release');await step(.22);await capture('rat-flight');
  assert.equal(await page.evaluate(()=>brejo.battle.combat.boss.hp),120);
  await step(.08);assert.equal(await page.evaluate(()=>brejo.battle.combat.boss.hp),113);await step(.5);
  assert.equal(await page.evaluate(()=>brejo.battle.busy),false);
  await page.evaluate(()=>brejo.battle.restart());
  const goal=await page.evaluate(()=>{const c=brejo.battle.combat;return c.tiles.find(t=>t.col===5&&t.row===3);});
  await page.evaluate(goal=>brejo.battle.move(goal),goal);await step(.11);await capture('rat-stride');await step(1.5);
  assert.equal(await page.evaluate(()=>brejo.battle.busy),false);
  await page.evaluate(()=>brejo.battle.restart());await click('#end-turn');
  await page.evaluate(()=>{const c=brejo.battle.combat;brejo.battle.move(c.tiles.find(t=>t.col===5&&t.row===3));});
  await step(.08);await capture('rabbit-crouch',0);await step(.17);await capture('rabbit-hop',0);await step(1.5);
  await capture('rabbit-idle',0);await click('#attack');await step(.27);await capture('rabbit-windup',0);await step(.23);await capture('rabbit-kick',0);await step(.7);
  // The coice ends the hero turn; the adjacent boss should bite.
  await step(.86);await capture('boss-bite-windup',3);await step(.26);await capture('boss-bite',3);await step(1.4);
  assert.equal(await page.evaluate(()=>brejo.battle.combat.current.id),'frog');
  // Bring the frog within range through the actual movement action.
  await page.evaluate(()=>{const c=brejo.battle.combat;brejo.battle.move(c.tiles.find(t=>t.col===5&&t.row===4));});
  await step(.11);await capture('frog-crouch',2);await step(.25);await capture('frog-hop',2);await step(1.6);
  await capture('frog-idle',2);await click('#attack');await step(.42);await capture('frog-inhale',2);await step(.25);await capture('frog-spit',2);await step(.24);await capture('frog-acid',2);await step(.8);
  // Roar is a different full-body action, with no adjacent targets.
  await page.evaluate(()=>brejo.battle.restart());await click('#end-turn');await click('#end-turn');await step(1.26);await capture('boss-roar-inhale',3);await step(.35);await capture('boss-roar',3);await step(1.2);
  // Pausing a strike must freeze joints and delay damage, including hit stop.
  await page.evaluate(()=>brejo.battle.restart());await click('#attack');await step(.25);await click('#pause');
  const before=await page.evaluate(()=>({time:brejo.state.time,hp:brejo.battle.combat.boss.hp,arm:brejo.rigs[1].parts.armR.rotation.z}));
  await step(2);const after=await page.evaluate(()=>({time:brejo.state.time,hp:brejo.battle.combat.boss.hp,arm:brejo.rigs[1].parts.armR.rotation.z}));assert.deepEqual(after,before);
  await click('#pause');await step(1.5);assert.equal(await page.evaluate(()=>brejo.battle.combat.boss.hp),113);
  await page.evaluate(()=>brejo.battle.restart());await step(.016);
  assert.equal(await page.evaluate(()=>brejo.rigs.every(r=>!r.recoil&&!r.death&&r.root.visible&&!r.parts.rage.visible)),true);
  for(const speed of [.5,1.5]){
    await page.select('#speed',String(speed));await click('#attack');await step(.68/speed);
    assert.equal(await page.evaluate(()=>brejo.battle.combat.boss.hp),120);
    await step(.15/speed);assert.equal(await page.evaluate(()=>brejo.battle.combat.boss.hp),113);
    await step(.8/speed);assert.equal(await page.evaluate(()=>brejo.battle.busy),false);
    await page.evaluate(()=>brejo.battle.restart());
  }
  await page.select('#speed','1');await page.evaluate(()=>brejo.battle.combat.boss.hp=7);await click('#attack');await step(2);
  assert.equal(await page.evaluate(()=>brejo.battle.combat.status),'victory');
  assert.equal(await page.evaluate(()=>brejo.boss.root.visible),false);
  await click('#restart');await step(.016);assert.equal(await page.evaluate(()=>brejo.boss.root.visible&&!brejo.boss.death),true);
  assert.deepEqual(errors,[]);
  await writeFile(new URL('index.html',output),`<!doctype html><meta charset="utf-8"><style>body{background:#30372d;color:#e4dcc9;font:15px system-ui}main{display:grid;grid-template-columns:repeat(5,300px);gap:12px}figure{margin:0}img{width:300px;height:300px}figcaption{padding:6px}</style><main>${frames.map(f=>`<figure><img src="${f.name}.png"><figcaption>${f.name}</figcaption></figure>`).join('')}</main>`);
  await page.setViewport({width:1572,height:Math.ceil(frames.length/5)*340+30,deviceScaleFactor:1});
  await page.goto(new URL('index.html',output).href);await page.screenshot({path:new URL('contact-sheet.png',output).pathname.slice(1),fullPage:true});
  console.log(JSON.stringify({passed:true,frames:frames.length,browserErrors:errors,checks:['all locomotion cycles','all hero attacks','bite and roar','damage at impact','pause/resume','speed .5 and 1.5','death and restart'],output:output.pathname}));
}finally{await browser.close();}

