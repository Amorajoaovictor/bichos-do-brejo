import puppeteer from 'file:///C:/Users/user/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import sharp from 'file:///C:/Users/user/node_modules/sharp/lib/index.js';
import {writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const output=new URL('../art/farrapo/rajada-v2/',import.meta.url),clipped=[];
const names=await readdir(new URL('quadros/',output));
for(const name of names){
  const {data,info}=await sharp(fileURLToPath(new URL(`quadros/${name}`,output))).raw().toBuffer({resolveWithObject:true});
  assert.equal(info.channels,4,name);
  let edge=false;
  for(let x=0;x<info.width;x++)edge||=data[x*4+3]>0||data[((info.height-1)*info.width+x)*4+3]>0;
  for(let y=0;y<info.height;y++)edge||=data[y*info.width*4+3]>0||data[(y*info.width+info.width-1)*4+3]>0;
  if(edge)clipped.push(name);
}
assert.equal(names.length,280);assert.deepEqual(clipped,[]);
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',userDataDir:fileURLToPath(new URL('./rabbit-face-browser/',import.meta.url)),headless:true,args:['--no-sandbox','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>{
    window.requestAnimationFrame=callback=>{window.__frame=callback;return 1;};
    window.step=seconds=>{
      window.__now??=performance.now();const count=Math.ceil(seconds*120),renderer=brejo.renderer,render=renderer.render;
      try{for(let i=0;i<count;i++){renderer.render=i===count-1?render:()=>{};window.__now+=seconds/count*1000;window.__frame(window.__now);}}
      finally{renderer.render=render;}
    };
  });
  await page.goto('http://127.0.0.1:4173/?encontro=rosnaldo',{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.brejo);
  await page.evaluate(async()=>{window.facing=await import('/facing.js');window.animation=await import('/animation.js');window.expressions=await import('/expressions.js');});
  const native=await page.evaluate(()=>{
    const rig=brejo.rigs[0];let meshes=0,textured=0;
    for(const view of Object.values(rig.views))view.art.traverse(o=>{if(o.isMesh){meshes++;if(o.material.map)textured++;}});
    const views=[];
    for(const direction of ['right','left','down','up']){
      facing.setDirection(rig,direction);expressions.setExpression(rig,'strain');expressions.setFaceFlush(rig,1);
      const view=rig.views[direction],head=view.expressions.find(e=>e.variants.strain.parent===rig.parts.head);
      const colors=[];(head?.variants.strain??rig.parts.head).traverse(o=>{if(o.isMesh)colors.push('#'+o.material.color.getHexString());});
      views.push({direction,colors,expressions:view.expressions.length,hiddenFarEye:direction==='right'?rig.parts.eyeR.userData.expression.hidden:direction==='left'?rig.parts.eyeL.userData.expression.hidden:null});
    }
    brejo.battle.restart();return {meshes,textured,views};
  });
  assert.ok(native.meshes>0);assert.equal(native.textured,0);
  for(const view of native.views){if(view.direction==='up')assert.equal(view.expressions,0);assert.ok(view.colors.includes('#d57568'));if(['left','right'].includes(view.direction))assert.equal(view.hiddenFarEye,true);}
  const scenarios=[];
  for(const direction of ['right','left','up','down'])for(const speed of [.5,1,1.5]){
    const result=await page.evaluate(({direction,speed})=>{
      const {battle,rigs,state}=brejo;battle.restart();state.paused=false;state.speed=speed;
      const c=battle.combat,actor=c.heroes[0],rig=rigs[0];c.cursor=c.order.indexOf(actor);c.resetTurnResources();state.selected=0;
      const [col,row]={right:[5,2],left:[2,3],up:[4,1],down:[4,4]}[direction],cell=c.tiles.find(t=>t.col===col&&t.row===row);
      actor.cell={...cell};rig.cell={...cell};rig.root.position.set(cell.x,.08,cell.z);
      const position=rig.root.position.clone(),hp=c.boss.hp;let hits=0;
      c.__originalBarrageHit??=c.barrageHit.bind(c);c.barrageHit=()=>{hits++;return c.__originalBarrageHit();};
      battle.attack(true);window.step(.23/speed);const anticipation=rig.expression,earlyFlush=rig.faceFlush;
      window.step(.24/speed);const cramp=rig.expression,started=rig.direction,beforeHits=hits,midFlush=rig.faceFlush;
      const snapshot=()=>JSON.stringify([state.time,rig.expression,rig.faceFlush,...Object.values(rig.joints).map(p=>[...p.position,...p.scale,p.rotation.z])]);
      state.paused=true;const before=snapshot();window.step(.5);const frozen=snapshot()===before&&hits===beforeHits;
      state.paused=false;const heldExpressions=[],eyeScales=[];
      for(let i=0;i<12;i++){
        window.step(.1/speed);heldExpressions.push(rig.expression);
        eyeScales.push(['eyeL','eyeR'].every(name=>rig.parts[name].scale.y===rig.rest.get(rig.parts[name]).scale.y));
      }
      const peakFlush=rig.faceFlush;
      // Contact pauses delay recovery relative to wall time; wait for the
      // actual first fading sample instead of assuming a fixed clock offset.
      for(let i=0;i<60&&rig.faceFlush>=peakFlush&&battle.busy;i++)window.step(.04/speed);
      const fadingFlush=rig.faceFlush;
      window.step(1.2/speed);const relief=rig.expression,finalFlush=rig.faceFlush;
      window.step(2/speed);
      const done={started,anticipation,cramp,earlyFlush,midFlush,peakFlush,fadingFlush,finalFlush,heldExpressions,eyeScales,relief,frozen,hits,mana:actor.mana,damage:hp-c.boss.hp,busy:battle.busy,finalExpression:rig.expression,rootDrift:position.distanceTo(rig.root.position)};
      battle.restart();done.restart=rig.expression==='neutral'&&!battle.busy&&actor.mana===10&&c.boss.hp===120;return done;
    },{direction,speed});
    assert.equal(result.started,direction);assert.equal(result.anticipation,'panic');assert.equal(result.cramp,'strain');assert.equal(result.relief,'relief');assert.equal(result.frozen,true);assert.equal(result.hits,10);
    assert.ok(result.heldExpressions.every(e=>e==='strain'),'hold the effort without reopening the eyes between shots');
    assert.ok(result.eyeScales.every(Boolean),'idle blinking must not squash the effort face');
    assert.ok(result.earlyFlush>0&&result.earlyFlush<result.midFlush&&result.midFlush<result.peakFlush,'the face gradually flushes');
    assert.ok(result.fadingFlush>0&&result.fadingFlush<result.peakFlush,'the flush gradually fades');assert.equal(result.finalFlush,0);
    assert.equal(result.mana,2);assert.ok(result.damage>=10&&result.damage<=20);assert.equal(result.busy,false);assert.equal(result.finalExpression,'neutral');assert.equal(result.rootDrift,0);assert.equal(result.restart,true);scenarios.push({direction,speed,...result});
  }
  const pictures=[];
  for(const direction of ['right','left','down','up']){
    const clip=await page.evaluate(direction=>{
      const {battle,rigs,boss,state,camera,renderer,scene}=brejo;battle.restart();state.paused=true;
      const rig=rigs[0];for(const r of [...rigs,boss]){r.root.visible=r===rig;r.shadow.visible=false;}boss.floor.visible=false;
      document.getElementById('labels').style.display='none';rig.root.position.set(0,.08,0);camera.zoom=2.2;camera.updateProjectionMatrix();
      facing.setDirection(rig,direction);expressions.setExpression(rig,'relief');expressions.setFaceFlush(rig,0);animation.idlePose(rig,2);animation.actionPose(rig,'barrage',1);renderer.render(scene,camera);
      const p=rig.root.position.clone().project(camera),v=document.getElementById('viewport').getBoundingClientRect();return {x:v.x+(p.x*.5+.5)*v.width-130,y:v.y+(-p.y*.5+.5)*v.height-280,width:260,height:310};
    },direction);
    const input=await page.screenshot({clip});await writeFile(new URL(`no-jogo-${direction}.png`,output),input);pictures.push(input);
  }
  await sharp({create:{width:520,height:620,channels:4,background:'#363b31'}}).composite(pictures.map((input,i)=>({input,left:i%2*260,top:Math.floor(i/2)*310}))).png().toFile(fileURLToPath(new URL('no-jogo.png',output)));
  const preview=await browser.newPage();await preview.goto('http://127.0.0.1:4173/art/farrapo/rajada-v2/',{waitUntil:'networkidle0'}).catch(()=>{});
  await preview.goto('http://127.0.0.1:4173/art/farrapo/rajada-v2/index.html',{waitUntil:'networkidle0'});preview.on('pageerror',e=>errors.push(e.message));
  await preview.$eval('#frame',el=>{el.value='14';el.dispatchEvent(new Event('input'));});
  assert.equal(await preview.$eval('#emotion',el=>el.value),'Aperto!');
  for(const direction of ['right','left','down','up'])await preview.waitForFunction(d=>{const img=document.getElementById(d);return img.complete&&img.naturalWidth>0&&img.src.endsWith(`rajada-${d}-15.png`);},{},direction);
  const frozen=await preview.$eval('#right',el=>el.src);await new Promise(r=>setTimeout(r,150));assert.equal(await preview.$eval('#right',el=>el.src),frozen);
  await preview.$eval('#frame',el=>{el.value='69';el.dispatchEvent(new Event('input'));});assert.equal(await preview.$eval('#emotion',el=>el.value),'Alívio');
  for(const speed of ['.5','1','1.5'])assert.deepEqual(await preview.select('#speed',speed),[speed]);
  await preview.click('#play');await preview.waitForFunction(()=>!document.getElementById('right').src.endsWith('70.png'));
  assert.deepEqual(errors,[]);
  const report={passed:true,transparentFrames:names.length,clipped,native,scenarios:scenarios.length,results:scenarios,browserErrors:errors};
  await writeFile(new URL('verificacao.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined,native:undefined}));
}finally{await browser.close();}
