import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {readdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const output=new URL('../art/farrapo/perfil-v2/',import.meta.url),clipped=[];
const names=await readdir(new URL('quadros/',output));
for(const name of names){
  const {data,info}=await sharp(fileURLToPath(new URL(`quadros/${name}`,output))).raw().toBuffer({resolveWithObject:true});
  assert.equal(info.channels,4,name);
  let edge=false;
  for(let x=0;x<info.width;x++)edge||=data[x*4+3]>0||data[((info.height-1)*info.width+x)*4+3]>0;
  for(let y=0;y<info.height;y++)edge||=data[(y*info.width)*4+3]>0||data[(y*info.width+info.width-1)*4+3]>0;
  if(edge)clipped.push(name);
}
assert.deepEqual(clipped,[],'All ears, paws and tails must stay inside the PNG frame');
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1100,height:900,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/art/farrapo/perfil-v2/index.html',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>document.querySelector('#right')?.complete&&document.querySelector('#right').naturalWidth>0);
  await page.click('#play');
  const before=await page.$eval('#right',img=>img.src);
  await new Promise(resolve=>setTimeout(resolve,250));
  assert.equal(await page.$eval('#right',img=>img.src),before,'pause holds the same frame');
  for(const action of ['repouso','salto','coice','rajada']){
    await page.select('#action',action);
    await page.$eval('#frame',slider=>{slider.value='6';slider.dispatchEvent(new Event('input'));});
    for(const direction of ['right','left']){
      await page.waitForFunction((d,a)=>{const img=document.getElementById(d);return img.complete&&img.naturalWidth>0&&img.src.endsWith(`${a}-${d}-07.png`);},{},direction,action);
    }
  }
  for(const speed of ['.5','1','1.5'])assert.deepEqual(await page.select('#speed',speed),[speed]);
  await page.select('#action','repouso');await page.click('#play');
  await page.waitForFunction(old=>document.querySelector('#right').src!==old,{},await page.$eval('#right',img=>img.src));
  await page.screenshot({path:fileURLToPath(new URL('visualizador.png',output)),fullPage:true});
  await page.evaluateOnNewDocument(()=>{
    window.requestAnimationFrame=callback=>{window.__frame=callback;return 1;};
    window.step=seconds=>{
      window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=window.brejo.renderer,render=renderer.render;
      try{for(let i=0;i<count;i++){renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame(window.__now);}}
      finally{renderer.render=render;}
    };
  });
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  await page.evaluate(async()=>{window.facing=await import('/facing.js');window.animation=await import('/animation.js');window.expressions=await import('/expressions.js');});
  for(const direction of ['right','left'])for(const speed of [.5,1,1.5]){
    const result=await page.evaluate(({direction,speed})=>{
      const {battle,rigs,state}=brejo;battle.restart();state.paused=false;state.speed=speed;
      const c=battle.combat,actor=c.heroes[0],rig=rigs[0];c.cursor=c.order.indexOf(actor);c.points=2;state.selected=0;
      const [col,row]=direction==='right'?[2,3]:[5,2],cell=c.tiles.find(t=>t.col===col&&t.row===row);
      actor.cell={...cell};rig.cell={...cell};rig.root.position.set(cell.x,.08,cell.z);
      const hp=c.boss.hp;battle.attack();window.step(.1);const started=rig.direction;
      state.paused=true;const time=state.time;window.step(.4);const frozen=state.time===time;state.paused=false;window.step(3);
      return {started,frozen,damage:hp-c.boss.hp,busy:battle.busy};
    },{direction,speed});
    assert.equal(result.started,direction);assert.equal(result.frozen,true);assert.equal(result.damage,10);assert.equal(result.busy,false);
  }
  for(const direction of ['right','left']){
    const special=await page.evaluate(direction=>{
      const {battle,rigs,state}=brejo;battle.restart();state.paused=false;state.speed=1;
      const c=battle.combat,actor=c.heroes[0],rig=rigs[0];c.cursor=c.order.indexOf(actor);c.points=2;state.selected=0;
      const [col,row]=direction==='right'?[2,3]:[5,2],cell=c.tiles.find(t=>t.col===col&&t.row===row);actor.cell={...cell};rig.cell={...cell};rig.root.position.set(cell.x,.08,cell.z);
      const hp=c.boss.hp;battle.attack(true);window.step(.6);const emotion=rig.expression,started=rig.direction;window.step(3);
      return {started,emotion,mana:actor.mana,damage:hp-c.boss.hp,busy:battle.busy};
    },direction);
    assert.equal(special.started,direction==='right'?'left':'right');assert.equal(special.emotion,'panic');assert.equal(special.mana,2);assert.ok(special.damage>=10&&special.damage<=20);assert.equal(special.busy,false);
  }
  const inGame=[];
  for(const pose of ['repouso','coice','rajada'])for(const direction of ['right','left']){
    const clip=await page.evaluate(({direction,pose})=>{
      const {battle,rigs,boss,state,camera,renderer,scene}=brejo;battle.restart();state.paused=true;
      const rig=rigs[0];for(const r of [...rigs,boss]){r.root.visible=r===rig;r.shadow.visible=false;}boss.floor.visible=false;document.getElementById('labels').style.display='none';
      rig.root.position.set(0,.08,0);camera.zoom=2;camera.updateProjectionMatrix();facing.setDirection(rig,direction);animation.idlePose(rig,2);
      if(pose==='coice'){rig.parts.rage.visible=true;animation.actionPose(rig,'rabbit',.49);}
      if(pose==='rajada'){expressions.setExpression(rig,'panic');animation.actionPose(rig,'barrage',.49);}
      renderer.render(scene,camera);
      const p=rig.root.position.clone().project(camera),v=document.getElementById('viewport').getBoundingClientRect();return {x:v.x+(p.x*.5+.5)*v.width-120,y:v.y+(-p.y*.5+.5)*v.height-255,width:240,height:280};
    },{direction,pose});
    const buffer=await page.screenshot({clip});await writeFile(new URL(`jogo-${pose}-${direction}.png`,output),buffer);inGame.push(buffer);
  }
  await sharp({create:{width:480,height:840,channels:4,background:'#363b31'}}).composite(inGame.map((input,i)=>({input,left:i%2*240,top:Math.floor(i/2)*280}))).png().toFile(fileURLToPath(new URL('no-jogo.png',output)));
  assert.deepEqual(errors,[]);
  const result={passed:true,transparentFrames:names.length,clipped,checks:['preview pause, play and frame selection','all four preview actions','both anatomical sides','coice in game at all three speeds','game pause','barrage expression, mana and damage','six in-game screenshots'],browserErrors:errors};
  await writeFile(new URL('verificacao-previa.json',output),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
