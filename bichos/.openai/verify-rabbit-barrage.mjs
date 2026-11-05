import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const output=new URL('./barrage-review/',import.meta.url);await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const hook=await page.evaluateOnNewDocument(()=>{
    window.requestAnimationFrame=callback=>{window.__frame=callback;return 1;};
    window.step=seconds=>{
      window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=window.brejo.renderer,render=renderer.render;
      try{for(let i=0;i<count;i++){renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame(window.__now);}}
      finally{renderer.render=render;}
    };
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  await page.evaluate(async()=>{window.facing=await import('/facing.js');window.animation=await import('/animation.js');window.expressions=await import('/expressions.js');});
  const scenarios=[];
  for(const direction of ['right','left','up','down'])for(const speed of [.5,1,1.5]){
    const result=await page.evaluate(({direction,speed})=>{
      const {battle,rigs,state}=brejo;battle.restart();state.paused=false;state.speed=speed;
      const c=battle.combat,actor=c.heroes[0],rig=rigs[0];c.cursor=c.order.indexOf(actor);c.points=2;state.selected=0;
      const [col,row]={right:[5,2],left:[2,3],up:[4,1],down:[4,4]}[direction],cell=c.tiles.find(t=>t.col===col&&t.row===row);
      actor.cell={...cell};rig.cell={...cell};rig.root.position.set(cell.x,.08,cell.z);
      const position=rig.root.position.clone(),hp=c.boss.hp;let hits=0;
      c.__originalBarrageHit??=c.barrageHit.bind(c);c.barrageHit=()=>{hits++;return c.__originalBarrageHit();};
      battle.attack(true);window.step(.6/speed);
      const started=rig.direction,emotion=rig.expression,beforeHits=hits;
      const snapshot=()=>JSON.stringify([state.time,...Object.values(rig.joints).map(p=>[...p.position,...p.scale,p.rotation.z])]);
      state.paused=true;const before=snapshot();window.step(.5);const frozen=snapshot()===before&&hits===beforeHits;
      state.paused=false;window.step(6/speed);
      const done={started,emotion,frozen,hits,mana:actor.mana,points:c.points,damage:hp-c.boss.hp,busy:battle.busy,finalExpression:rig.expression,rootDrift:position.distanceTo(rig.root.position)};
      battle.restart();done.restart=rig.expression==='neutral'&&!battle.busy&&actor.mana===10&&c.boss.hp===120;return done;
    },{direction,speed});
    assert.equal(result.started,direction);assert.equal(result.emotion,'panic');assert.equal(result.frozen,true);assert.equal(result.hits,10);
    assert.equal(result.mana,2);assert.equal(result.points,1);assert.ok(result.damage>=10&&result.damage<=20);assert.equal(result.busy,false);
    assert.equal(result.finalExpression,'neutral');assert.equal(result.rootDrift,0);assert.equal(result.restart,true);scenarios.push({direction,speed,...result});
  }
  const pictures=[];
  for(const direction of ['right','left','down','up']){
    const clip=await page.evaluate(direction=>{
      const {battle,rigs,boss,state,camera,renderer,scene}=brejo;battle.restart();state.paused=true;
      const rig=rigs[0];for(const r of [...rigs,boss]){r.root.visible=r===rig;r.shadow.visible=false;}boss.floor.visible=false;
      document.getElementById('labels').style.display='none';rig.root.position.set(0,.08,0);camera.zoom=2.2;camera.updateProjectionMatrix();
      facing.setDirection(rig,direction);expressions.setExpression(rig,'panic');animation.idlePose(rig,2);animation.actionPose(rig,'barrage',.45);renderer.render(scene,camera);
      const p=rig.root.position.clone().project(camera),v=document.getElementById('viewport').getBoundingClientRect();return {x:v.x+(p.x*.5+.5)*v.width-130,y:v.y+(-p.y*.5+.5)*v.height-280,width:260,height:310};
    },direction);
    const input=await page.screenshot({clip});await writeFile(new URL(`rajada-${direction}.png`,output),input);pictures.push(input);
  }
  await sharp({create:{width:520,height:620,channels:4,background:'#363b31'}}).composite(pictures.map((input,i)=>({input,left:i%2*260,top:Math.floor(i/2)*310}))).png().toFile(fileURLToPath(new URL('quatro-direcoes.png',output)));
  await page.removeScriptToEvaluateOnNewDocument(hook.identifier);
  await page.goto('http://127.0.0.1:4173/art/farrapo/vetor-aprovado-v1/index.html?acao=rajada',{waitUntil:'networkidle0'});
  await page.select('#action','rajada');
  assert.equal(await page.$eval('#frame',el=>el.max),'69');
  await page.$eval('#frame',el=>{el.value='69';el.dispatchEvent(new Event('input'));});
  for(const direction of ['right','left','down','up'])await page.waitForFunction(d=>{const img=document.getElementById(d);return img.complete&&img.naturalWidth>0&&img.src.endsWith(`rajada-${d}-70.png`);},{polling:100},direction);
  await page.click('#play');
  await page.waitForFunction(()=>!document.getElementById('right').src.endsWith('70.png'),{polling:100});
  await page.click('#play');
  assert.deepEqual(errors,[]);
  const report={passed:true,scenarios:scenarios.length,checks:['10 impacts and one mana/action spend','all four facings at three speeds','pause freezes the pose and hits','recovery to neutral','restart','four in-game visual samples','70-frame preview in all four directions'],results:scenarios,browserErrors:errors};
  await writeFile(new URL('report.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined}));
}finally{await browser.close();}
